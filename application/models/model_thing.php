<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 12.11.2016
 * Time: 15:15
 */
class Model_thing extends Model
{

    public function get($param=null)
    {
        if ($param==null) die("There is no param!");
        // TODO: Implement get_data() method.
        $id=$param;
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        $query="SELECT creation_line,new_creation_line FROM things WHERE id=$id";
        if ($res=$mysqli->query($query)){
            $data=$res->fetch_all(MYSQLI_ASSOC)[0];
            $res->close();
        }
        else {
            echo $mysqli->error;
            return null;
        }
        $query="SELECT id,thing_name FROM things";
        if ($res=$mysqli->query($query)){
            $things=json_encode($res->fetch_all(MYSQLI_ASSOC));
            $res->close();
        }
        else {
            echo $mysqli->error;
            return null;
        }
        $mysqli->close();
        $data=$data['new_creation_line']==null?$data['creation_line']:$data['new_creation_line'];
        $resp='{"creation_line":'.$data.',"devices":'.$things.'}';
        return $resp;

    }
    public function get_current_data($actions_json,$thing_id){
        $thing_id=substr($thing_id,0,stripos($thing_id,"?"));
        $replaced_with_uri=$this->replace_id_with_uri(json_decode($actions_json,true), $thing_id);
        $curl=curl_init();
        curl_setopt($curl, CURLOPT_URL,"http://".$replaced_with_uri['uri']."/?actions=".json_encode($replaced_with_uri['uri_actions']));
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        $server_output = curl_exec ($curl);
        $actions_with_uri=json_decode($server_output,true);
        $actions_with_id=array();
        foreach ($actions_with_uri as $val){
            $actions_with_id[]=array("id"=>$replaced_with_uri['uri_id'][$val['uri']],"value"=>$val['value']);
        }
        return json_encode($actions_with_id);
    }
    private function replace_id_with_uri($actions_id,$thing_id){
        $actions_str="";
        foreach ($actions_id as $id){
            $actions_str.="'$id', ";
        }
        $actions_str=substr($actions_str,0,-2);
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        $query="SELECT uri FROM things WHERE id=$thing_id";
        if ($res=$mysqli->query($query)){
            $uri=$res->fetch_all(MYSQLI_ASSOC)[0]['uri'];
            $res->close();
        }
        else {
            echo $mysqli->error;
            return null;
        }
        $query="SELECT uri,id FROM actions_description WHERE id IN ($actions_str)";
        if ($res=$mysqli->query($query)){
            $uri_database=$res->fetch_all(MYSQLI_ASSOC);
            $res->close();
        }
        else {
            echo $mysqli->error;
            return null;
        }
        $uri_actions=array();
        $uri_id=array();
        foreach ($uri_database as $line){
            $uri_actions[]=$line['uri'];
            $uri_id[$line['uri']]=$line['id'];
        }
        $mysqli->close();
        return array("uri"=>$uri,"uri_actions"=>$uri_actions,"uri_id"=>$uri_id);
    }
    public function set_action_data(){
        $device=json_decode($_POST['newData'],true);
        $resp="Error";
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
            $actions=&$device['actions'];
            $actions_count=count($actions);
            for ($l=0;$l<$actions_count;$l++){
                if (isset($actions[$l]['value'])){
                    $query="SELECT format FROM actions_description WHERE id=".$actions[$l]['id'];
                    if ($res = $mysqli->query($query)) {
                        $format = $res->fetch_all(MYSQLI_ASSOC)[0]['format'];
                        $res->close();
                    } else {
                        echo "Can't get results from database in Model_thing->set_action_data(). Error=".$mysqli->error;
                        $mysqli->close();
                        return false;
                    }
                    if ($format=="list"){
                        $query="SELECT item_name FROM action_range WHERE action_id=".$actions[$l]['id'];
                        if ($res = $mysqli->query($query)) {
                            $items = $res->fetch_all(MYSQLI_ASSOC);
                            $res->close();
                        } else {
                            echo "Can't get results from database in Model_thing->set_action_data() Error=".$mysqli->error;
                            $mysqli->close();
                            return false;
                        }
                        $is_in_list=false;
                        $count_items=count($items);
                        for ($n=0;$n<$count_items;$n++){
                            if ($items[$n]['item_name']==$actions[$l]['value']){
                                $is_in_list=true;
                                break;
                            }
                        }
                        if (!$is_in_list) return $resp;
                    }
                    elseif ($format=="number"){
                        $query="SELECT range_from,range_to FROM action_range WHERE action_id=".$actions[$l]['id'];
                        if ($res = $mysqli->query($query)) {
                            $item = $res->fetch_all(MYSQLI_ASSOC);
                            $res->close();
                        } else {
                            echo "Can't get results from database in Model_thing->set_action_data() Error=".$mysqli->error;
                            $mysqli->close();
                            return false;
                        }
                        $from=$item[0]['from']==null?false:(+$item[0]['from']);
                        $to=$item[0]['to']==null?false:(+$item[0]['to']);
                        if (!$from) {
                            if (+$actions[$l]['value']>$to) return $resp;
                        }
                        elseif (!$to){
                            if (+$actions[$l]['value']<$from) return $resp;
                        }
                        else{
                            if ((+$actions[$l]['value']<$from)||(+$actions[$l]['value']>$to)) return $resp;
                        }
                    }
                }
                /*
                if (isset($actions[$l]['supportActions'])){
                    $support_actions=&$actions[$l]['supportActions'];
                    $support_actions_count=count($support_actions);
                    for($m=0;$m<$support_actions_count;$m++){
                        $query="SELECT format FROM support_actions WHERE id=".$support_actions[$m]['id'];
                        if ($res = $mysqli->query($query)) {
                            $format = $res->fetch_all(MYSQLI_ASSOC)[0]['format'];
                            $res->close();
                        } else {
                            echo "Can't get results from database in Model_thing->set_action_data() Error=".$mysqli->error;
                            $mysqli->close();
                            return false;
                        }
                        if ($format=="list"){
                            $query="SELECT item_name FROM support_action_range WHERE action_id=".$support_actions[$m]['id'];
                            if ($res = $mysqli->query($query)) {
                                $items = $res->fetch_all(MYSQLI_ASSOC);
                                $res->close();
                            } else {
                                echo "Can't get results from database in Model_thing->set_action_data() Error=".$mysqli->error;
                                $mysqli->close();
                                return false;
                            }
                            $is_in_list=false;
                            $count_items=count($items);
                            for ($n=0;$n<$count_items;$n++){
                                if ($items[$n]['item_name']==$support_actions[$m]['value']){
                                    $is_in_list=true;
                                    break;
                                }
                            }
                            if (!$is_in_list) return $resp;
                        }
                        elseif ($format=="number"){
                            $query="SELECT range_from,range_to FROM support_action_range WHERE action_id=$support_actions[$m][id]";
                            if ($res = $mysqli->query($query)) {
                                $item = $res->fetch_all(MYSQLI_ASSOC);
                                $res->close();
                            } else {
                                echo "Can't get results from database in Model_thing->set_action_data() Error=".$mysqli->error;
                                $mysqli->close();
                                return false;
                            }
                            $from=$item[0]['from']==null?false:(+$item[0]['from']);
                            $to=$item[0]['to']==null?false:(+$item[0]['to']);
                            if (!$from) {
                                if (+$support_actions[$m]['value']>$to) return $resp;
                            }
                            elseif (!$to){
                                if (+$support_actions[$m]['value']<$from) return $resp;
                            }
                            else{
                                if ((+$support_actions[$m]['value']<$from)&&(+$support_actions[$m]['value']>$to)) return $resp;
                            }
                        }
                        unset($support_actions[$m]['id']);
                    }
                }*/
            }
        $mysqli->close();
        $curl=curl_init();
        curl_setopt($curl, CURLOPT_URL,"http://localhost:3000/upgradeaction");
        curl_setopt($curl, CURLOPT_POST, 1);
        curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query(array('upgradeDevice' => json_encode($device))));
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        return curl_exec ($curl);
        
    }
    public function upgrade_line(){
        $new_line=$_POST['newLine'];
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        $dev=json_decode($new_line,true);
        $query="UPDATE things SET new_creation_line='$dev[line]' WHERE id=$dev[id]";
        if ($mysqli->query($query)) $ans="Updated";
        else $ans="Something wrong";
        $mysqli->close();
        return $ans;
    }
    public function get_initial_line(){
        $id=$_POST['id'];
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        $query="UPDATE things SET new_creation_line=null WHERE id=$id";
        if (!$mysqli->query($query)) echo "Something wrong in model_thing->get_initial_line";
        $mysqli->close();
        return $this->get_data($id);
    }
    /*
    private function prepare_for_browser($server_output){
        $current_action_data=json_decode($server_output,true);
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        $count_action_group=count($current_action_data['actionGroups']);
        for ($x=0;$x<$count_action_group;$x++) {
            $group_name=$current_action_data['actionGroups'][$x]['name'];
            $query="SELECT id FROM action_groups WHERE thing_id='$current_action_data[thing_id]' AND group_name='$group_name'";
            if ($res = $mysqli->query($query)) {
                $assoc_res = $res->fetch_all(MYSQLI_ASSOC);
                $group_id = $assoc_res[0]['id'];
                $res->close();
            } else {
                echo "Can't get results from database in Model_thing->get_current_data()";
                $mysqli->close();
                return false;
            }
            $current_action_data['actionGroups'][$x]['id']=$group_id;
            $count_current_action_data = count($current_action_data['actionGroups'][$x]['actions']);
            for ($i = 0; $i < $count_current_action_data; $i++) {
                $name = $current_action_data['actionGroups'][$x]['actions'][$i]['name'];
                $query = "SELECT id,action_group_id FROM actions_description WHERE action_name='$name' AND action_group_id=$group_id";
                if ($res = $mysqli->query($query)) {
                    $assoc_res = $res->fetch_all(MYSQLI_ASSOC);
                    $action_id = $assoc_res[0]['id'];
                    $res->close();
                } else {
                    echo "Can't get results from database in Model_thing->get_current_data()";
                    $mysqli->close();
                    return false;
                }
                $current_action_data['actionGroups'][$x]['actions'][$i]['id'] = $action_id;
                if (isset($current_action_data['actionGroups'][$x]['actions'][$i]['supportActions'])) {
                    $count_support_action_data = count($current_action_data['actionGroups'][$x]['actions'][$i]['supportActions']);
                    for ($l = 0; $l < $count_support_action_data; $l++) {
                        $support_action_name = $current_action_data['actionGroups'][$x]['actions'][$i]['supportActions'][$l]['name'];
                        $query = "SELECT id FROM support_actions WHERE action_name='$support_action_name' AND action_owner_id=$action_id";
                        if ($res = $mysqli->query($query)) {
                            $support_action_id = $res->fetch_all(MYSQLI_ASSOC)[0]['id'];
                            $res->close();
                        } else {
                            echo "Can't get results from database in Model_thing->get_current_data(). Error=" . $mysqli->error;
                            $mysqli->close();
                            return false;
                        }
                        $current_action_data['actionGroups'][$x]['actions'][$i]['supportActions'][$l]['id'] = $support_action_id;
                    }
                }
            }
        }
        $mysqli->close();
        $current_action_data=json_encode($current_action_data);
        return $current_action_data;
    }
    */
    public function put($param = null)
    {
        // TODO: Implement put() method.
        $resp="Error";
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        $data=$data = file_get_contents('php://input');
        $actions_json=urldecode(substr($data,8 ));
        $actions=json_decode($actions_json,true);
        $actions_count=count($actions);
        for ($l=0;$l<$actions_count;$l++){
            if (isset($actions[$l]['value'])){
                $query="SELECT format FROM actions_description WHERE id=".$actions[$l]['id'];
                if ($res = $mysqli->query($query)) {
                    $format = $res->fetch_all(MYSQLI_ASSOC)[0]['format'];
                    $res->close();
                } else {
                    echo "Can't get results from database in Model_thing->set_action_data(). Error=".$mysqli->error;
                    $mysqli->close();
                    return false;
                }
                if ($format=="list"){
                    $query="SELECT item_name FROM action_range WHERE action_id=".$actions[$l]['id'];
                    if ($res = $mysqli->query($query)) {
                        $items = $res->fetch_all(MYSQLI_ASSOC);
                        $res->close();
                    } else {
                        echo "Can't get results from database in Model_thing->set_action_data() Error=".$mysqli->error;
                        $mysqli->close();
                        return false;
                    }
                    $is_in_list=false;
                    $count_items=count($items);
                    for ($n=0;$n<$count_items;$n++){
                        if ($items[$n]['item_name']==$actions[$l]['value']){
                            $is_in_list=true;
                            break;
                        }
                    }
                    if (!$is_in_list) return $resp;
                }
                elseif ($format=="number"){
                    $query="SELECT range_from,range_to FROM action_range WHERE action_id=".$actions[$l]['id'];
                    if ($res = $mysqli->query($query)) {
                        $item = $res->fetch_all(MYSQLI_ASSOC);
                        $res->close();
                    } else {
                        echo "Can't get results from database in Model_thing->set_action_data() Error=".$mysqli->error;
                        $mysqli->close();
                        return false;
                    }
                    $from=$item[0]['from']==null?false:(+$item[0]['from']);
                    $to=$item[0]['to']==null?false:(+$item[0]['to']);
                    if (!$from) {
                        if (+$actions[$l]['value']>$to) return $resp;
                    }
                    elseif (!$to){
                        if (+$actions[$l]['value']<$from) return $resp;
                    }
                    else{
                        if ((+$actions[$l]['value']<$from)||(+$actions[$l]['value']>$to)) return $resp;
                    }
                }
            }
            /*
            if (isset($actions[$l]['supportActions'])){
                $support_actions=&$actions[$l]['supportActions'];
                $support_actions_count=count($support_actions);
                for($m=0;$m<$support_actions_count;$m++){
                    $query="SELECT format FROM support_actions WHERE id=".$support_actions[$m]['id'];
                    if ($res = $mysqli->query($query)) {
                        $format = $res->fetch_all(MYSQLI_ASSOC)[0]['format'];
                        $res->close();
                    } else {
                        echo "Can't get results from database in Model_thing->set_action_data() Error=".$mysqli->error;
                        $mysqli->close();
                        return false;
                    }
                    if ($format=="list"){
                        $query="SELECT item_name FROM support_action_range WHERE action_id=".$support_actions[$m]['id'];
                        if ($res = $mysqli->query($query)) {
                            $items = $res->fetch_all(MYSQLI_ASSOC);
                            $res->close();
                        } else {
                            echo "Can't get results from database in Model_thing->set_action_data() Error=".$mysqli->error;
                            $mysqli->close();
                            return false;
                        }
                        $is_in_list=false;
                        $count_items=count($items);
                        for ($n=0;$n<$count_items;$n++){
                            if ($items[$n]['item_name']==$support_actions[$m]['value']){
                                $is_in_list=true;
                                break;
                            }
                        }
                        if (!$is_in_list) return $resp;
                    }
                    elseif ($format=="number"){
                        $query="SELECT range_from,range_to FROM support_action_range WHERE action_id=$support_actions[$m][id]";
                        if ($res = $mysqli->query($query)) {
                            $item = $res->fetch_all(MYSQLI_ASSOC);
                            $res->close();
                        } else {
                            echo "Can't get results from database in Model_thing->set_action_data() Error=".$mysqli->error;
                            $mysqli->close();
                            return false;
                        }
                        $from=$item[0]['from']==null?false:(+$item[0]['from']);
                        $to=$item[0]['to']==null?false:(+$item[0]['to']);
                        if (!$from) {
                            if (+$support_actions[$m]['value']>$to) return $resp;
                        }
                        elseif (!$to){
                            if (+$support_actions[$m]['value']<$from) return $resp;
                        }
                        else{
                            if ((+$support_actions[$m]['value']<$from)&&(+$support_actions[$m]['value']>$to)) return $resp;
                        }
                    }
                    unset($support_actions[$m]['id']);
                }
            }*/
        }
        $replaced_with_uri=$this->replace_id_with_uri($actions, $param);
        $mysqli->close();
        $curl=curl_init();
        curl_setopt($curl, CURLOPT_URL,"http://".$replaced_with_uri['uri']);
        curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "PUT");
        curl_setopt($curl, CURLOPT_HEADER, false);
        curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query(array('actions' => $replaced_with_uri['actions_uri'])));
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        $server_output=curl_exec ($curl);
        $actions_with_uri=json_decode($server_output,true);
        $actions_with_id=array();
        foreach ($actions_with_uri as $val){
            $actions_with_id[]=array("id"=>$replaced_with_uri['uri_id'][$val['uri']],"value"=>$val['value']);
        }
        return json_encode($actions_with_id);
    }

    public function post($param = null)
    {
        // TODO: Implement post() method.
    }

    public function delete($param = null)
    {
        // TODO: Implement delete() method.
    }

}