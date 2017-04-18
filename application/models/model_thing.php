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
        $actions_json=isset($_GET['actions'])?$_GET['actions']:null;
        if ($actions_json!=null&&stripos($param, "-value")){
            return $this->get_current_data($actions_json,$param);
        }
        else {
            return $this->get_action($param);
        }

    }
    private function get_action($param){
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
        $query="SELECT id,thing_name,is_virtual FROM things";
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
    private function get_current_data($actions_json,$thing_id){
        $thing_id=substr($thing_id,0,stripos($thing_id,"-value?"));
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
        $id_uri=array();
        foreach ($uri_database as $line){
            $uri_actions[]=$line['uri'];
            $uri_id[$line['uri']]=$line['id'];
            $id_uri[$line['id']]=$line['uri'];
        }
        $mysqli->close();
        return array("uri"=>$uri,"uri_actions"=>$uri_actions,"uri_id"=>$uri_id,"id_uri"=>$id_uri);
    }
    
    public function upgrade_line($id,$new_line){
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        $query="UPDATE things SET new_creation_line='$new_line' WHERE id=$id";
        if ($mysqli->query($query)) $ans="Updated";
        else $ans="Something wrong";
        $mysqli->close();
        return $ans;
    }
    public function get_initial_line($id){
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        $query="UPDATE things SET new_creation_line=null WHERE id=$id";
        if (!$mysqli->query($query)) echo "Something wrong in model_thing->get_initial_line";
        $mysqli->close();
        return $this->get_action($id);
    }
    
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
        $actions_id=array();
        for ($l=0;$l<$actions_count;$l++){
            $actions_id[]=$actions[$l]['id'];
            if (isset($actions[$l]['value'])){
                $query="SELECT format FROM actions_description WHERE id=".$actions[$l]['id'];
                if ($res = $mysqli->query($query)) {
                    $format = $res->fetch_all(MYSQLI_ASSOC)[0]['format'];
                    $res->close();
                } else {
                    echo "Can't get results from database in Model_thing->put(). Error=".$mysqli->error;
                    $mysqli->close();
                    return false;
                }
                if ($format=="list"){
                    $query="SELECT item_name FROM action_range WHERE action_id=".$actions[$l]['id'];
                    if ($res = $mysqli->query($query)) {
                        $items = $res->fetch_all(MYSQLI_ASSOC);
                        $res->close();
                    } else {
                        echo "Can't get results from database in Model_thing->put() Error=".$mysqli->error;
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
                        echo "Can't get results from database in Model_thing->put() Error=".$mysqli->error;
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
        }
        $replaced_with_uri=$this->replace_id_with_uri($actions_id, $param);
        $actions_with_uri=array();
        foreach ($actions as $action){
            $actions_with_uri[]=array("uri"=>$replaced_with_uri['id_uri'][$action['id']],"value"=>$action['value']);
        }
        $mysqli->close();
        $curl=curl_init();
        curl_setopt($curl, CURLOPT_URL,"http://".$replaced_with_uri['uri']);
        curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "PUT");
        curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query(array("actions"=>json_encode($actions_with_uri))));
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        $server_output=curl_exec ($curl);
        $server_output=$server_output=="Success"?$server_output:"Error";
        return $server_output;
    }

    public function post($param = null)
    {
        // TODO: Implement post() method.
        $new_line=$_POST['newLine'];
        if ($new_line=="reset"){
            return $this->get_initial_line($param);
        }
        else{
            return $this->upgrade_line($param, $new_line);
        }
    }

    public function delete($param = null)
    {
        // TODO: Implement delete() method.
    }

}