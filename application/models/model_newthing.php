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
        $mysqli->query("INSERT INTO things VALUES ('$file[id]','$file[name]','$file[thingGroup]',$file[updateTime])");
        $action_groups=$file['actionGroups'];
        foreach ($action_groups as $group){
            $group_name=isset($group['name'])?$group['name']:null;
            $query="INSERT INTO action_groups(group_name,thing_id) VALUES ('$group_name','$file[id]')";
            $mysqli->query($query);
            $group_id=$mysqli->insert_id;
            $actions=$group['actions'];
            foreach ($actions as $action){
                $is_supported=isset($action['support'][0]);
                $is_changeable=$action['isChangeable']=="true"?true:false;
                $is_need_statistics=$action['isNeedStatistics']=="true"?true:false;
                $query="INSERT INTO actions_description(thing_id,action_name,format,is_changeable,action_group_id,description,submit_name,is_supported,is_need_statistics) VALUES ('$file[id]','$action[name]','$action[format]','$is_changeable','$group_id','$action[description]','$action[submitName]','$is_supported','$is_need_statistics')";
                $mysqli->query($query);
                $action_id=$mysqli->insert_id;
                foreach ($action['range'] as $item){
                    $active_actions=isset($item['active_actions'])?$item['active_actions']:null;
                    $color=isset($item['color'])?$item['color']:null;
                    $query="INSERT INTO action_range(action_id,item,active_actions,color) VALUES ('$action_id','$item[item]','$active_actions','$color')";
                    $mysqli->query($query);
                }
               if ($is_supported) {
                   foreach ($action['support'] as $support_action) {
                       $is_changeable = $support_action['isChangeable'] == "true" ? true : false;
                       $is_need_statistics = $support_action['isNeedStatistics'] == "true" ? true : false;
                       if (isset($support_action['isDisactivator'])) $is_disactivator=$support_action['isDisactivator']=="true"?true:false;
                       else $is_disactivator=false;
                       $is_individual=$support_action['isIndividual']=="true"?true:false;
                       $query = "INSERT INTO support_actions(action_owner_id,action_name,is_changeable,format,description,submit_name,is_need_statistics,thing_id,is_individual,is_disactivator) VALUES ('$action_id','$support_action[name]','$is_changeable','$support_action[format]','$support_action[description]','$support_action[submitName]','$is_need_statistics','$file[id]','$is_individual','$is_disactivator')";
                       $mysqli->query($query);
                       $support_action_id = $mysqli->insert_id;
                       foreach ($support_action['range'] as $item) {
                           $color = isset($item['color']) ? $item['color'] : null;
                           $disactivate = isset($item['disactivate']) ? $item['disactivate'] : null;
                           $explanation = isset($item['explanation']) ? $item['explanation'] : null;
                           $query = "INSERT INTO support_action_range(action_id,item,disactivate,color,explanation) VALUES ('$support_action_id','$item[item]','$disactivate','$color','$explanation')";
                           $mysqli->query($query);
                       }

                   }
               }
            }
    }
        $mysqli->close();

    }

}