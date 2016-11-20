<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 20.11.2016
 * Time: 14:37
 */
class Model_upgradeparams extends Model
{

    public function get_data($param = null)
    {
        // TODO: Implement get_data() method.
    }

    public function set_data($file = null)
    {
        // TODO: Implement set_data() method.
        if ($file==null) {
            echo "There is no file!";
            return;
        }
        // TODO: Implement set_data() method.
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Can't connect database!!!");
        }
        foreach ($file as $key=>$value){
            if ($key==="thing_id") continue;
            $query="SELECT id FROM actions_description WHERE thing_id='$file[thing_id]' AND action_name='$key'";
            if ($res=$mysqli->query($query)){
                $data=$res->fetch_all();
                $res->close();
            }
            else {
                echo "Can't get results from database in upgradeparams";
                return;
            }
            $action_id=(int)$data[0][0];
            $mysqli->query("INSERT INTO actions_data(action_id, action_value, action_date) VALUES ('$action_id','$value', NOW())");
        }
        $mysqli->close();
    }
}