<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 12.11.2016
 * Time: 15:15
 */
class Model_thing extends Model
{

    public function get_data($param=null)
    {
        if ($param==null) die("There is no param!");
        // TODO: Implement get_data() method.
        $id=$param;
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        $query="SELECT creation_line FROM things WHERE id=$id";
        if ($res=$mysqli->query($query)){
            $data=$res->fetch_all(MYSQLI_ASSOC)[0]['creation_line'];
            $res->close();
        }
        else die("Can't get results from database");
        $mysqli->close();
        return $data;

    }

    public function set_data($file=null)
    {
        // TODO: Implement set_data() method.
    }
    public function get_current_data(){
        $device_id=$_POST["device_id"];
        $curl=curl_init();
        curl_setopt($curl, CURLOPT_URL,"http://localhost:3000/getactiondata");
        curl_setopt($curl, CURLOPT_POST, 1);
        curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query(array('device_id' => $device_id)));
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        $server_output = curl_exec ($curl);
        $currentActionsData=json_decode($server_output);
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        foreach ($currentActionsData['actions'] as $action){
            
        }
        $query="";
        $mysqli->close();
        return $server_output;
    }
    public function get_upgrade_device_data(){
        $param=json_decode($_POST['newData'],true);
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            echo "Can't connect to database in Model_thing->get_upgrade_device_data()";
            return false;
        }
        $query="SELECT thing_id,action_name FROM actions_description WHERE id=$param[action_id]";
        if ($res=$mysqli->query($query)){
            $data=$res->fetch_all(MYSQLI_ASSOC);
            $res->close();
        }
        else {
            echo "Can't get results from database in Model_thing->get_upgrade_device_data()";
            $mysqli->close();
            return false;
        }
        $mysqli->close();
        return json_encode(array("device_id"=>$data[0]['thing_id'],"name"=>$data[0]['action_name'],"value"=>$param['value']));
    }
}