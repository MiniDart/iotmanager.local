<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 12.11.2016
 * Time: 15:15
 */
class Model_thing extends Model
{

    public function get($param)
    {
        if ($param == null) die("There is no param!");
        // TODO: Implement get_data() method.
        $actions_json = isset($_GET['actions']) ? $_GET['actions'] : null;
        if ($actions_json != null && stripos($param, "-value")) {
            return $this->get_current_data($actions_json);
        } else {
            return $this->get_action(stripos($param, "-string") ? substr($param, 0, stripos($param, "-string")) : $param);
        }

    }

    private function get_action($param)
    {
        $id = $param;
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        if (!$mysqli->set_charset("utf8")) {
            printf("Error loading character set utf8: %s\n", $mysqli->error);
            exit();
        }
        $query = "SELECT creation_line,new_creation_line FROM things WHERE id=$id";
        if ($res = $mysqli->query($query)) {
            $data = $res->fetch_all(MYSQLI_ASSOC)[0];
            $res->close();
        } else {
            echo $mysqli->error;
            return null;
        }
        $query = "SELECT id,thing_name,is_virtual FROM things ORDER BY id DESC";
        if ($res = $mysqli->query($query)) {
            $things = json_encode($res->fetch_all(MYSQLI_ASSOC));
            $res->close();
        } else {
            echo $mysqli->error;
            return null;
        }
        $data = $data['new_creation_line'] == null ? $data['creation_line'] : $data['new_creation_line'];
        $query = "SELECT id,theme_name,is_main FROM themes";
        if ($res = $mysqli->query($query)) {
            $themes = json_encode($res->fetch_all(MYSQLI_ASSOC));
            $res->close();
        } else {
            echo $mysqli->error;
            return null;
        }
        $query = "SELECT id,file_name,algorithm,width_to_deduct FROM themes WHERE is_main=1";
        if ($res = $mysqli->query($query)) {
            $theme_res=$res->fetch_all(MYSQLI_ASSOC)[0];
            $res->close();
        } else {
            echo $mysqli->error;
            return null;
        }
        $mysqli->close();
        $resp['device'] = '{"creation_line":' . $data . ',"devices":' . $things . ',"themes":'.$themes.',"current_theme":'.json_encode($theme_res).'}';
        $resp['file_name']=$theme_res['file_name'];
        return $resp;
    }

    private function get_current_data($actions_json)
    {
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        if (!$mysqli->set_charset("utf8")) {
            printf("Error loading character set utf8: %s\n", $mysqli->error);
            exit();
        }
        $devices_with_actions = $this->replace_id_with_uri(json_decode($actions_json, true));
        $actions_with_id = array();
        foreach ($devices_with_actions as $device_id=>$device) {
            $actions_str = "";
            foreach ($device['actions'] as $id=>$uri) {
                $actions_str .= "'$id', ";
            }
            $actions_str = substr($actions_str, 0, -2);
            if ($device['is_have_client']){
                $query = "SELECT MAX(date_value) FROM current_data WHERE id IN (SELECT id FROM actions_description WHERE thing_id=$device_id)";
                if ($res = $mysqli->query($query)) {
                    $max_date_val=$res->fetch_all()[0][0];
                    $res->close();
                } else {
                    echo $mysqli->error;
                    $mysqli->close();
                    return null;
                }
                if ($max_date_val<time()-$device['update_time']) {
                    foreach ($device['actions'] as $id=>$uri){
                        $actions_with_id[]=array("id"=>$id,"value"=>"устройство не доступно");
                    }
                }
                else {
                    $query = "SELECT id,action_value FROM current_data WHERE id IN ($actions_str)";
                    if ($res = $mysqli->query($query)) {
                        $actions_data = $res->fetch_all(MYSQLI_ASSOC);
                        $res->close();
                    } else {
                        echo $mysqli->error;
                        $mysqli->close();
                        return null;
                    }
                    foreach ($actions_data as $line) {
                        $actions_with_id[] = array("id" => $line['id'], "value" => $line['action_value']);
                    }
                }
            }
            else {
                $query = "SELECT MIN(date_value) FROM current_data WHERE id IN ($actions_str)";
                if ($res = $mysqli->query($query)) {
                    $date_value=$res->fetch_all()[0][0];
                    $res->close();
                } else {
                    echo $mysqli->error;
                    $mysqli->close();
                    return null;
                }
                if ((time()-$device['update_time'])<$date_value){
                    $query = "SELECT id,action_value FROM current_data WHERE id IN ($actions_str)";
                    if ($res = $mysqli->query($query)) {
                        $actions_data=$res->fetch_all(MYSQLI_ASSOC);
                        $res->close();
                    } else {
                        echo $mysqli->error;
                        $mysqli->close();
                        return null;
                    }
                    foreach ($actions_data as $line){
                        $actions_with_id[]=array("id" => $line['id'], "value" => $line['action_value']);
                    }
                }
                else {
                    $uri_actions = array_values($device['actions']);
                    $curl = curl_init();
                    curl_setopt($curl, CURLOPT_URL, "http://" . $device['uri'] . "/?actions=" . json_encode($uri_actions));
                    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
                    $server_output = curl_exec($curl);
                    $time=time();
                    if (curl_errno($curl)!=0||curl_getinfo($curl)['http_code']==404){
                        $query = "UPDATE current_data SET date_value=$time,action_value='устройство не доступно' WHERE id IN ($actions_str)";
                        if (!$mysqli->query($query)) {
                            echo $mysqli->error;
                            $mysqli->close();
                            return null;
                        }
                        foreach ($device['actions'] as $id=>$uri) {
                            $actions_with_id[]=array("id"=>$id,"value"=>"устройство не доступно");
                        }
                    }
                    else {
                        $actions_with_uri = json_decode($server_output, true);
                        foreach ($actions_with_uri as $val) {
                            $action_id = null;
                            foreach ($device['actions'] as $id => $uri) {
                                if ($uri == $val["uri"]) {
                                    $action_id = $id;
                                    break;
                                }
                            }
                            $query = "UPDATE current_data SET date_value=$time,action_value='$val[value]' WHERE id=$action_id";
                            if (!$mysqli->query($query)) {
                                echo $mysqli->error;
                                $mysqli->close();
                                return null;
                            }
                            $actions_with_id[] = array("id" => $action_id, "value" => $val['value']);
                        }
                    }
                }
            }
        }
        $mysqli->close();
        return json_encode($actions_with_id);
    }

    private function replace_id_with_uri($actions_id)
    {
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        if (!$mysqli->set_charset("utf8")) {
            printf("Error loading character set utf8: %s\n", $mysqli->error);
            exit();
        }
        $actions_str = "";
        foreach ($actions_id as $id) {
            $actions_str .= "'$id', ";
        }
        $actions_str = substr($actions_str, 0, -2);
        $query = "SELECT uri,id,thing_id FROM actions_description WHERE id IN ($actions_str)";
        if ($res = $mysqli->query($query)) {
            $uri_database = $res->fetch_all(MYSQLI_ASSOC);
            $res->close();
        } else {
            echo $mysqli->error;
            return null;
        }
        $devices_with_actions = array();
        foreach ($uri_database as $line) {
            if (isset($devices_with_actions[$line['thing_id']])) {
                $devices_with_actions[$line['thing_id']]['actions'][$line['id']]=$line['uri'];
            } else {
                $query = "SELECT uri,is_have_client,update_time FROM things WHERE id=$line[thing_id]";
                if ($res = $mysqli->query($query)) {
                    $device_desc = $res->fetch_all(MYSQLI_ASSOC)[0];
                    $res->close();
                } else {
                    echo $mysqli->error;
                    return null;
                }
                $devices_with_actions[$line['thing_id']] = array("uri" => $device_desc['uri'], "is_have_client"=>
                    $device_desc['is_have_client'],"update_time"=>$device_desc['update_time'],"actions" =>
                    array($line['id']=> $line['uri']));
            }
        }
        return $devices_with_actions;
    }

    public function upgrade_line($id, $new_line,$name)
    {
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        if (!$mysqli->set_charset("utf8")) {
            printf("Error loading character set utf8: %s\n", $mysqli->error);
            exit();
        }
        $query = "UPDATE things SET new_creation_line='$new_line' WHERE id=$id";
        if (!$mysqli->query($query)) {
            $mysqli->close();
            return  null;
        }
        if (strlen($name)!=0) {
            $query = "UPDATE things SET thing_name='$name' WHERE id=$id";
            if (!$mysqli->query($query)) {
                $mysqli->close();
                return null;
            }
        }
        $mysqli->close();
        return "Updated";
    }

    public function get_initial_line($id)
    {
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        if (!$mysqli->set_charset("utf8")) {
            printf("Error loading character set utf8: %s\n", $mysqli->error);
            exit();
        }
        $query = "SELECT creation_line FROM things WHERE id=$id";
        if ($res = $mysqli->query($query)) {
            $creation_line = $res->fetch_all(MYSQLI_ASSOC)[0]['creation_line'];
            $res->close();
        } else {
            echo $mysqli->error;
            return null;
        }
        $device=json_decode($creation_line,true);
        $query = "UPDATE things SET thing_name='$device[name]' WHERE id=$id";
        if (!$mysqli->query($query)) echo "Something wrong in model_thing->get_initial_line Error:".$mysqli->error;;
        $query = "UPDATE things SET new_creation_line=null WHERE id=$id";
        if (!$mysqli->query($query)) echo "Something wrong in model_thing->get_initial_line 2";
        $mysqli->close();
        return $this->get_action($id);
    }

    public function put($param)
    {
        // TODO: Implement put() method.
        if (stripos($param,"-command")) return $this->sendCommand();
        else return $this->putActionValues($param);
       
    }
    private function putActionValues($id){
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        if (!$mysqli->set_charset("utf8")) {
            printf("Error loading character set utf8: %s\n", $mysqli->error);
            exit();
        }
        $data = json_decode(file_get_contents('php://input'),true);
        $time=time();
        foreach ($data as $action){
            $query = "UPDATE current_data SET date_value=$time,action_value='$action[value]' WHERE id IN (SELECT id FROM
            actions_description WHERE thing_id=$id AND uri='$action[uri]')";
            if (!$res = $mysqli->query($query)) {
                echo $mysqli->error;
                return null;
            }
        }
        return "Success";
    }
    private function sendCommand(){
        $resp = "Error";
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        if (!$mysqli->set_charset("utf8")) {
            printf("Error loading character set utf8: %s\n", $mysqli->error);
            exit();
        }
        $data = file_get_contents('php://input');
        $actions_json = urldecode(substr($data, 8));
        $actions = json_decode($actions_json, true);
        $actions_count = count($actions);
        $actions_id = array();
        for ($l = 0; $l < $actions_count; $l++) {
            $actions_id[] = $actions[$l]['id'];
            if (isset($actions[$l]['value'])) {
                $query = "SELECT format FROM actions_description WHERE id=" . $actions[$l]['id'];
                if ($res = $mysqli->query($query)) {
                    $format = $res->fetch_all(MYSQLI_ASSOC)[0]['format'];
                    $res->close();
                } else {
                    echo "Can't get results from database in Model_thing->put(). Error=" . $mysqli->error;
                    $mysqli->close();
                    return null;
                }
                if ($format == "list") {
                    $query = "SELECT item_name FROM action_range WHERE action_id=" . $actions[$l]['id'];
                    if ($res = $mysqli->query($query)) {
                        $items = $res->fetch_all(MYSQLI_ASSOC);
                        $res->close();
                    } else {
                        echo "Can't get results from database in Model_thing->put() Error=" . $mysqli->error;
                        $mysqli->close();
                        return null;
                    }
                    $is_in_list = false;
                    $count_items = count($items);
                    for ($n = 0; $n < $count_items; $n++) {
                        if ($items[$n]['item_name'] == $actions[$l]['value']) {
                            $is_in_list = true;
                            break;
                        }
                    }
                    if (!$is_in_list) return $resp;
                } elseif ($format == "number") {
                    $query = "SELECT range_from,range_to FROM action_range WHERE action_id=" . $actions[$l]['id'];
                    if ($res = $mysqli->query($query)) {
                        $item = $res->fetch_all(MYSQLI_ASSOC);
                        $res->close();
                    } else {
                        echo "Can't get results from database in Model_thing->put() Error=" . $mysqli->error;
                        $mysqli->close();
                        return null;
                    }
                    $from = $item[0]['range_from'] == null ? false : (+$item[0]['range_from']);
                    $to = $item[0]['range_to'] == null ? false : (+$item[0]['range_to']);
                    if (!$from) {
                        if (+$actions[$l]['value'] > $to) return $resp;
                    } elseif (!$to) {
                        if (+$actions[$l]['value'] < $from) return $resp;
                    } else {
                        if ((+$actions[$l]['value'] < $from) || (+$actions[$l]['value'] > $to)) return $resp;
                    }
                }
            }
        }
        $devices_with_actions = $this->replace_id_with_uri($actions_id);
        $server_output="Error";
        foreach ($devices_with_actions as $device){
            $actions_with_uri = array();
            foreach ($actions as $action) {
                if (array_key_exists($action['id'], $device['actions'])) {
                    $actions_with_uri[] = array("uri" => $device['actions'][$action['id']], "value" => $action['value']);
                }
            }
            $mysqli->close();
            $curl = curl_init();
            curl_setopt($curl, CURLOPT_URL, "http://" . $device['uri']);
            curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "PUT");
            curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query(array("actions" => json_encode($actions_with_uri))));
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            $server_output = curl_exec($curl);
            $server_output = $server_output == "Success" ? $server_output : null;
        }

        return $server_output;
}

    public function post($param)
    {
        // TODO: Implement post() method.
        $new_line = $_POST['newLine'];
        $name=isset($_POST['newName'])?$_POST['newName']:"";
        if ($new_line == "reset") {
            return $this->get_initial_line($param);
        } else {
            return $this->upgrade_line($param, $new_line,$name);
        }
    }

    public function delete($param)
    {
        // TODO: Implement delete() method.
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        if (!$mysqli->set_charset("utf8")) {
            printf("Error loading character set utf8: %s\n", $mysqli->error);
            exit();
        }
        $query = "SELECT is_virtual FROM things WHERE id=$param";
        if ($res = $mysqli->query($query)) {
            $data = $res->fetch_all(MYSQLI_ASSOC)[0]["is_virtual"];
            $res->close();
        } else {
            echo $mysqli->error;
            return null;
        }
        if (!$data) {
            $query = "SELECT id FROM actions_description WHERE thing_id=$param";
            if ($res = $mysqli->query($query)) {
                $data = $res->fetch_all(MYSQLI_ASSOC);
                $res->close();
            } else {
                echo $mysqli->error;
                return null;
            }
            foreach ($data as $str) {
                $query = "DELETE FROM action_range WHERE action_id=$str[id]";
                if (!$res = $mysqli->query($query)) {
                    echo $mysqli->error;
                    return null;
                }
            }
            $query = "DELETE FROM actions_description WHERE thing_id=$param";
            if (!$res = $mysqli->query($query)) {
                echo $mysqli->error;
                return null;
            }
        }
        $query = "DELETE FROM things WHERE id=$param";
        if (!$res = $mysqli->query($query)) {
            echo $mysqli->error;
            return null;
        }
        return "Deleted";
    }

}