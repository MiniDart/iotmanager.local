<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 12.11.2016
 * Time: 15:13
 */
class Model_allthings extends Model
{

    public function get_data($param=null)
    {
        // TODO: Implement get_data() method.
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            echo "Не удалось подключиться к MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error;
        }
        $query="SELECT id,thing_name FROM things";
        if ($res=$mysqli->query($query)){
            $data=$res->fetch_all(MYSQLI_ASSOC);
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
}