<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 12.11.2016
 * Time: 15:13
 */
class Model_allthings extends Model
{
    private $thing_id;

    public function get($param=null)
    {
        // TODO: Implement get() method.
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            echo "Не удалось подключиться к MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error;
        }
        if (!$mysqli->set_charset("utf8")) {
            printf("Error loading character set utf8: %s\n", $mysqli->error);
            exit();
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

    public function put($param = null)
    {
        if ($param=="theme"){
            $id=+substr(file_get_contents('php://input'),3);
            $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
            if ($mysqli->connect_errno) {
                die("Не удалось подключиться к MySQL");
            }
            if (!$mysqli->set_charset("utf8")) {
                printf("Error loading character set utf8: %s\n", $mysqli->error);
                exit();
            }
            $query = "UPDATE themes SET is_main=0 WHERE is_main=1";
            if (!$res = $mysqli->query($query)) {
                echo $mysqli->error;
                $mysqli->close();
                return null;
            }
            $query = "UPDATE themes SET is_main=1 WHERE id=$id";
            if (!$res = $mysqli->query($query)) {
                echo $mysqli->error;
                $mysqli->close();
                return null;
            }
            $mysqli->close();
            return "Updated";
        }
    }

    public function post($param = null)
    {
        // TODO: Implement post() method.
        $param=$_POST['new_thing'];
        if ($param==null) die("There is no file!");
        // TODO: Implement set_data() method.
        $creation_line=$param;
        $file=json_decode($creation_line,true);
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Can't connect database!!!");
        }
        if (!$mysqli->set_charset("utf8")) {
            printf("Error loading character set utf8: %s\n", $mysqli->error);
            exit();
        }
        $is_virtual=isset($file["isVirtual"])?$file["isVirtual"]:false;
        if ($is_virtual){
            $query="INSERT INTO things(thing_name,thing_group,is_virtual) VALUES ('$file[name]','$file[thingGroup]','$is_virtual')";
            $res=$mysqli->query($query);
            if (!$res) echo $mysqli->error;
            $this->thing_id=$mysqli->insert_id;
            $file['id']=$this->thing_id;
            $creation_line=json_encode($file,JSON_UNESCAPED_UNICODE);
            $res=$mysqli->query("UPDATE things SET creation_line='$creation_line' WHERE id=$this->thing_id");
            if (!$res) echo $mysqli->error;
            $mysqli->close();
            return "Success-".$this->thing_id;
        }
        $uri=$mysqli->real_escape_string($file['uri']);
        $query="SELECT id FROM things WHERE uri='$uri'";
        if ($res=$mysqli->query($query)){
            $data=$res->fetch_all();
            $res->close();
        }
        else {
            echo $mysqli->error;
            echo "Can't get results from database in model_newthings";
            $mysqli->close();
            return null;
        }
        if (count($data)!=0){
            $mysqli->close();
            return "Exist! id=".$data[0][0];
        }
        $is_have_client=isset($file['isHaveClient'])?$file['isHaveClient']:false;
        $res=$mysqli->query("INSERT INTO things(uri,thing_name,thing_group,update_time,is_virtual,is_have_client) VALUES
        ('$uri','$file[name]','$file[thingGroup]',$file[updateTime],'$is_virtual','$is_have_client')");
        if (!$res) echo $mysqli->error;
        $this->thing_id=$mysqli->insert_id;
        unset($file['uri']);
        unset($file['updateTime']);
        if (isset($file['isHaveClient'])) unset($file['isHaveClient']);
        $file['id']=$this->thing_id;
        $this->insertActionsIntoTable($file['actionGroups'], $mysqli);
        $creation_line=json_encode($file,JSON_UNESCAPED_UNICODE);
        $res=$mysqli->query("UPDATE things SET creation_line='$creation_line' WHERE id=$this->thing_id");
        if (!$res) echo $mysqli->error;
        $mysqli->close();
        return "Success! id=".$this->thing_id;
    }

    public function delete($param = null)
    {
        // TODO: Implement delete() method.
    }
    private function insertActionsIntoTable(&$action_groups, &$mysqli)
    {
        $action_groups_count = count($action_groups);
        for ($i = 0; $i < $action_groups_count; $i++) {
            $group =& $action_groups[$i];
            if (isset($group['actions'])) {
                $actions =& $group['actions'];
                $actions_count = count($actions);
                for ($l = 0; $l < $actions_count; $l++) {
                    $action =& $actions[$l];
                    $is_supported = isset($action['support'][0]);
                    $action_description = isset($action['description']) ? $action['description'] : null;
                    $submit_name = null;
                    if (isset($action['submitName'])) $submit_name = $action['submitName'];
                    $action_uri=$mysqli->real_escape_string($action['uri']);
                    $query = "INSERT INTO actions_description(uri,thing_id,action_name,format,is_changeable,description,
                    submit_name,is_supported) VALUES ('$action_uri',$this->thing_id,'$action[name]','$action[format]',
                    '$action[isChangeable]','$action_description','$submit_name','$is_supported')";
                    if (!$mysqli->query($query)) {
                        echo $mysqli->error;
                        $mysqli->close();
                        return null;
                    }
                    unset($action['uri']);
                    $action['id']=$mysqli->insert_id;
                    $action_id = $action['id'];
                    $time=time();
                    $query = "INSERT INTO current_data(id,date_value) VALUES ($action[id],$time)";
                    if (!$mysqli->query($query)) {
                        echo $mysqli->error;
                        $mysqli->close();
                        return null;
                    }
                    $action_range =& $action['range'];
                    $action_range_count = count($action_range);
                    for ($m = 0; $m < $action_range_count; $m++) {
                        $item =& $action_range[$m];
                        $range_from = isset($item['from']) ? $item['from'] : null;
                        $range_to = isset($item['to']) ? $item['to'] : null;
                        $item_name = null;
                        if (isset($item['name'])) $item_name = $item['name'];
                        $query = "INSERT INTO action_range(action_id,item_name,range_from,range_to) VALUES 
                        ($action_id,'$item_name','$range_from','$range_to')";
                        if (!$mysqli->query($query)) {
                            echo $mysqli->error;
                            $mysqli->close();
                            return null;
                        }
                        $action_range_id = $mysqli->insert_id;
                        $item['id'] = $action_range_id;
                    }
                    if ($is_supported) {
                        $support_actions =& $action['support'];
                        $support_actions_count = count($support_actions);
                        for ($n = 0; $n < $support_actions_count; $n++) {
                            $support_action =& $support_actions[$n];
                            $is_individual = $support_action['isIndividual'] == "true" ? true : false;
                            $support_submit_name = null;
                            $support_action_description = isset($support_action['description']) ? $support_action['description'] : null;
                            if (isset($support_action['submitName'])) $support_submit_name = $support_action['submitName'];
                            $support_active = isset($support_action['active']) ? $support_action['active'] : null;
                            $support_action_uri=$mysqli->real_escape_string($support_action['uri']);
                            $query = "INSERT INTO actions_description(uri,action_owner_id,action_name,is_changeable,format,
                            description,submit_name,thing_id,is_individual,active) VALUES ('$support_action_uri',
                            $action_id,'$support_action[name]','$support_action[isChangeable]','$support_action[format]',
                            '$support_action_description','$support_submit_name',$this->thing_id,'$is_individual',
                            '$support_active')";
                            if (!$mysqli->query($query)) {
                                echo $mysqli->error . ", ";
                                $mysqli->close();
                                return null;
                            }
                            unset($support_action['uri']);
                            $support_action['id']=$mysqli->insert_id;
                            $support_action_id = $support_action['id'];
                            $time=time();
                            $query = "INSERT INTO current_data(id,date_value) VALUES ($support_action[id],$time)";
                            if (!$mysqli->query($query)) {
                                echo $mysqli->error;
                                $mysqli->close();
                                return null;
                            }
                            $support_action_range =& $support_action['range'];
                            $support_action_range_count = count($support_action_range);
                            for ($k = 0; $k < $support_action_range_count; $k++) {
                                $support_item =& $support_action_range[$k];
                                $range_from = isset($support_item['from']) ? $support_item['from'] : null;
                                $range_to = isset($support_item['to']) ? $support_item['to'] : null;
                                $support_item_name = null;
                                if (isset($support_item['name'])) $support_item_name = $support_item['name'];
                                $query = "INSERT INTO action_range(action_id,item_name,range_from,range_to) VALUES ('$support_action_id','$support_item_name','$range_from','$range_to')";
                                $mysqli->query($query);
                                $support_action_range_id = $mysqli->insert_id;
                                $support_item['id'] = $support_action_range_id;
                            }

                        }
                    }
                }
            }
            if (isset($group['actionGroups'])) $this->insertActionsIntoTable($group['actionGroups'], $mysqli);
        }
    }
}