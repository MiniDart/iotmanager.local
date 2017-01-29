<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 12.11.2016
 * Time: 15:03
 */
class Model_newthing extends Model
{
    private $thing_id;
    public function get_data($param=null)
    {
        // TODO: Implement get_data() method.
    }

    public function set_data($file=null)
    {
        if ($file==null) die("There is no file!");
        // TODO: Implement set_data() method.
        $creation_line=$file;
        $file=json_decode($creation_line,true);
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if ($mysqli->connect_errno) {
            die("Can't connect database!!!");
        }
        $query="SELECT COUNT(id) FROM things WHERE id=$file[id]";
        if ($res=$mysqli->query($query)){
            $data=$res->fetch_all();
            $res->close();
        }
        else {
            echo "Can't get results from database in model_newthings";
            return null;
        }
        if ($data[0][0]!=="0"){
            echo "Thing already exist!";
            $mysqli->close();
            return null;
        }
        $this->thing_id=+$file['id'];
        $this->insertActionsIntoTable($file['actionGroups'], $mysqli);
        $creation_line=json_encode($file);
        $mysqli->query("INSERT INTO things VALUES ($file[id],'$file[name]','$file[thingGroup]','$file[updateTime]','$creation_line')");
        $mysqli->close();

    }

    private function insertActionsIntoTable(&$action_groups, &$mysqli, $group_owner_id = 0)
    {
        $action_groups_count = count($action_groups);
        for ($i = 0; $i < $action_groups_count; $i++) {
            $group =& $action_groups[$i];
            $group_name = isset($group['name']) ? $group['name'] : null;
            $query = "INSERT INTO action_groups(group_name,thing_id,group_owner_id,rank) VALUES ('$group_name',$this->thing_id,$group_owner_id,'$i')";
            $mysqli->query($query);
            $group_id = $mysqli->insert_id;
            $group['id'] = $group_id;
            $group['rank'] = $i;
            if (isset($group['actions'])) {
                $actions =& $group['actions'];
                $actions_count = count($actions);
                for ($l = 0; $l < $actions_count; $l++) {
                    $action =& $actions[$l];
                    $is_supported = isset($action['support'][0]);
                    $is_changeable = $action['isChangeable'] == "true" ? true : false;
                    $is_need_statistics = $action['isNeedStatistics'] == "true" ? true : false;
                    $action_description = isset($action['description']) ? $action['description'] : null;
                    $submit_name = null;
                    if (isset($action['submitName'])) $submit_name = $action['submitName'];
                    $query = "INSERT INTO actions_description(id,thing_id,action_name,format,is_changeable,action_group_id,description,submit_name,is_supported,is_need_statistics,rank) VALUES ($action[id],$this->thing_id,'$action[name]','$action[format]','$is_changeable','$group_id','$action_description','$submit_name','$is_supported','$is_need_statistics','$l')";
                    $mysqli->query($query);
                    $action_id = $action['id'];
                    $action['rank'] = $l;
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
                        if (!$mysqli->query($query)) echo $mysqli->error;
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
                            if (isset($support_action['isDeactivator'])) $is_disactivator = $support_action['isDeactivator'] == "true" ? true : false;
                            else $is_disactivator = false;
                            $is_individual = $support_action['isIndividual'] == "true" ? true : false;
                            $support_submit_name = null;
                            $support_action_description = isset($support_action['description']) ? $support_action['description'] : null;
                            if (isset($support_action['submitName'])) $support_submit_name = $support_action['submitName'];
                            $support_active = isset($support_action['active']) ? $support_action['active'] : null;
                            $query = "INSERT INTO actions_description(id,action_owner_id,action_name,is_changeable,format,description,submit_name,is_need_statistics,thing_id,is_individual,is_deactivator,active) VALUES ($support_action[id],$action_id,'$support_action[name]','$is_changeable','$support_action[format]','$support_action_description','$support_submit_name','$is_need_statistics',$this->thing_id,'$is_individual','$is_disactivator','$support_active')";
                            if (!$mysqli->query($query)) echo $mysqli->error . ", ";
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
            if (isset($group['actionGroups'])) $this->insertActionsIntoTable($group['actionGroups'], $mysqli, $group_id);
        }
    }

}