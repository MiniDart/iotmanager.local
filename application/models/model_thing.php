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
        $query="SELECT * FROM actions_description WHERE thing_id=$id";
        if ($res=$mysqli->query($query)){
            $data['actions']=$res->fetch_all(MYSQLI_ASSOC);
            $res->close();
        }
        else die("Can't get results from database");
        $query="SELECT * FROM things WHERE id=$id";
        if ($res=$mysqli->query($query)){
            $data['thing']=$res->fetch_all(MYSQLI_ASSOC)[0];
            $res->close();
        }
        else die("Can't get results from database");
        $query="SELECT * FROM support_actions WHERE thing_id=$id";
        if ($res=$mysqli->query($query)){
            $data['support_actions']=$res->fetch_all(MYSQLI_ASSOC);
            $res->close();
        }
        $mysqli->close();
        return $data;

    }

    public function set_data($file=null)
    {
        // TODO: Implement set_data() method.
    }
    public function get_current_data(){
        $actions=json_decode($_POST["actions"]);
        $strActions=implode(",",$actions );
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            echo "Can't connect to database in Model_thing->get_current_data()";
            return false;
        }
        $query="SELECT * FROM actions_data WHERE action_id in ($strActions) AND action_date=(SELECT MAX(action_date) FROM actions_data
                WHERE action_id in ($strActions))";
        if ($res=$mysqli->query($query)){
            $data=$res->fetch_all(MYSQLI_ASSOC);
            $res->close();
        }
        else {
            echo "Can't get results from database in Model_thing->get_current_data()";
            $mysqli->close();
            return false;
        }
        $mysqli->close();
        $dataJson=json_encode($data);
        return $dataJson;
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