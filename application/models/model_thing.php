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
            $data=$res->fetch_all(MYSQLI_ASSOC);
            $res->close();
        }
        else die("Can't get results from database");
        $query="SELECT * FROM things WHERE id=$id";
        if ($res=$mysqli->query($query)){
            $data['things']=$res->fetch_all(MYSQLI_ASSOC)[0];
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
        $actions=json_decode($_POST["actions"]);
        $strActions=implode("','",$actions );
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Не удалось подключиться к MySQL");
        }
        $query="SELECT * FROM actions_data WHERE action_id in ('$strActions')";
        if ($res=$mysqli->query($query)){
            $data=$res->fetch_all(MYSQLI_ASSOC);
            $res->close();
        }
        else die("Can't get results from database");
        $mysqli->close();
        $dataJson=json_encode($data);
        return $dataJson;
    }
}