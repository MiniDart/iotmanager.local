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
        // TODO: Implement put() method.
    }

    public function post($param = null)
    {
        // TODO: Implement post() method.
        if ($param==null) die("There is no file!");
        // TODO: Implement set_data() method.
        $creation_line=$param;
        $file=json_decode($creation_line,true);
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Can't connect database!!!");
        }
        $uri=$mysqli->real_escape_string($file['uri']);
        $query="SELECT COUNT(*) FROM things WHERE uri='$uri'";
        if ($res=$mysqli->query($query)){
            $data=$res->fetch_all();
            $res->close();
        }
        else {
            echo $mysqli->error;
            echo "Can't get results from database in model_newthings";
            return null;
        }
        if ($data[0][0]!=="0"){
            echo "Thing already exist!";
            $mysqli->close();
            return null;
        }
        $is_virtual=isset($file["isVirtual"])?$file["isVirtual"]:false;
        $res=$mysqli->query("INSERT INTO things(uri,thing_name,thing_group,update_time,is_virtual) VALUES ('$uri','$file[name]','$file[thingGroup]',$file[updateTime],'$is_virtual')");
        if (!$res) echo $mysqli->error;
        $this->thing_id=$mysqli->insert_id;
        unset($file['uri']);
        $file['id']=$this->thing_id;
        $this->insertActionsIntoTable($file['actionGroups'], $mysqli);
        $creation_line=json_encode($file);
        $res=$mysqli->query("UPDATE things SET creation_line='$creation_line' WHERE id=$this->thing_id");
        if (!$res) echo $mysqli->error;
        $mysqli->close();
        return "Success";
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
                    //$is_changeable = $action['isChangeable'] == "true" ? true : false;
                    //$is_need_statistics = $action['isNeedStatistics'] == "true" ? true : false;
                    $action_description = isset($action['description']) ? $action['description'] : null;
                    $submit_name = null;
                    if (isset($action['submitName'])) $submit_name = $action['submitName'];
                    $action_uri=$mysqli->real_escape_string($action['uri']);
                    $query = "INSERT INTO actions_description(uri,thing_id,action_name,format,is_changeable,description,submit_name,is_supported,is_need_statistics) VALUES ('$action_uri',$this->thing_id,'$action[name]','$action[format]','$action[isChangeable]','$action_description','$submit_name','$is_supported','$action[isNeedStatistics]')";
                    if (!$mysqli->query($query)) {
                        echo $mysqli->error;
                        return null;
                    }
                    unset($action['uri']);
                    $action['id']=$mysqli->insert_id;
                    $action_id = $action['id'];
                    $action_range =& $action['range'];
                    $action_range_count = count($action_range);
                    for ($m = 0; $m < $action_range_count; $m++) {
                        $item =& $action_range[$m];
                        $range_from = isset($item['from']) ? $item['from'] : null;
                        $range_to = isset($item['to']) ? $item['to'] : null;
                        $color = isset($item['color']) ? $item['color'] : null;
                        $item_name = null;
                        if (isset($item['name'])) $item_name = $item['name'];
                        $query = "INSERT INTO action_range(action_id,item_name,range_from,range_to,color) VALUES ($action_id,'$item_name','$range_from','$range_to','$color')";
                        if (!$mysqli->query($query)) {
                            echo $mysqli->error;
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
                            $is_changeable = $support_action['isChangeable'] == "true" ? true : false;
                            $is_need_statistics = $support_action['isNeedStatistics'] == "true" ? true : false;
                            if (isset($support_action['isDeactivator'])) $is_disactivator = $support_action['isDeactivator'];
                            else $is_disactivator = false;
                            $is_individual = $support_action['isIndividual'] == "true" ? true : false;
                            $support_submit_name = null;
                            $support_action_description = isset($support_action['description']) ? $support_action['description'] : null;
                            if (isset($support_action['submitName'])) $support_submit_name = $support_action['submitName'];
                            $support_active = isset($support_action['active']) ? $support_action['active'] : null;
                            $support_action_uri=$mysqli->real_escape_string($support_action['uri']);
                            $query = "INSERT INTO actions_description(uri,action_owner_id,action_name,is_changeable,format,description,submit_name,is_need_statistics,thing_id,is_individual,is_deactivator,active) VALUES ('$support_action_uri',$action_id,'$support_action[name]','$support_action[isChangeable]','$support_action[format]','$support_action_description','$support_submit_name','$support_action[isNeedStatistics]',$this->thing_id,'$is_individual','$is_disactivator','$support_active')";
                            if (!$mysqli->query($query)) {
                                echo $mysqli->error . ", ";
                                return null;
                            }
                            unset($support_action['uri']);
                            $support_action['id']=$mysqli->insert_id;
                            $support_action_id = $support_action['id'];
                            $support_action_range =& $support_action['range'];
                            $support_action_range_count = count($support_action_range);
                            for ($k = 0; $k < $support_action_range_count; $k++) {
                                $support_item =& $support_action_range[$k];
                                $color = isset($support_item['color']) ? $support_item['color'] : null;
                                $disactivate = isset($support_item['isDeactivator']) ? $support_item['isDeactivator'] : null;
                                $explanation = isset($support_item['explanation']) ? $support_item['explanation'] : null;
                                $range_from = isset($support_item['from']) ? $support_item['from'] : null;
                                $range_to = isset($support_item['to']) ? $support_item['to'] : null;
                                $support_item_name = null;
                                if (isset($support_item['name'])) $support_item_name = $support_item['name'];
                                $query = "INSERT INTO action_range(action_id,item_name,range_from,range_to,is_deactivator,color,explanation) VALUES ('$support_action_id','$support_item_name','$range_from','$range_to','$disactivate','$color','$explanation')";
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