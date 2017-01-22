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