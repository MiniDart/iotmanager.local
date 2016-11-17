<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 12.11.2016
 * Time: 15:03
 */
class Model_newthing extends Model
{
    public function get_data($param=null)
    {
        // TODO: Implement get_data() method.
    }

    public function set_data($file=null)
    {
        if ($file==null) die("There is no file!");
        // TODO: Implement set_data() method.
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            echo "Не удалось подключиться к MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error;
        }
        $mysqli->query("INSERT INTO things VALUES ('$file[id]','$file[name]','$file[thingGroup]')");
        foreach ($file as $key=>$value){
            if (strripos($key, "action_")===0){
                $action=explode(", ",$value);
                if (count($action)==5) {
                    $mysqli->query("INSERT INTO actions_description (thing_id,action_name,format,is_changeable,importance,list_content) 
                                VALUES ('$file[id]','$action[0]','$action[1]','$action[2]','$action[3]','$action[4]')");
                }
                else {
                    $mysqli->query("INSERT INTO actions_description (thing_id,action_name,format,is_changeable,importance) 
                                VALUES ('$file[id]','$action[0]','$action[1]','$action[2]','$action[3]')");
                }
               
            }
        }
        //заплатка
        $mysqli->query("INSERT INTO actions_data (action_id,action_date,action_value) VALUES (1,curtime(),'Hello world!')");
        //
        $mysqli->close();

    }

}