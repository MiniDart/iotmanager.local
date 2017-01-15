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
        $creation_line=$file;
        $file=json_decode($creation_line,true);
        $creation_line=json_decode($creation_line,true);
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
        $action_groups=$file['actionGroups'];
        $action_groups_count=count($action_groups);
        for ($i=0;$i<$action_groups_count;$i++){
            $group=$action_groups[$i];
            $group_name=isset($group['name'])?$group['name']:null;
            $query="INSERT INTO action_groups(group_name,thing_id,rank) VALUES ('$group_name','$file[id]','$i')";
            $mysqli->query($query);
            $group_id=$mysqli->insert_id;
            $creation_line['actionGroups'][$i]['id']=$group_id;
            $creation_line['actionGroups'][$i]['rank']=$i;
            $actions=$group['actions'];
            $actions_count=count($actions);
            for ($l=0;$l<$actions_count;$l++){
                $action=$actions[$l];
                $is_supported=isset($action['support'][0]);
                $is_changeable=$action['isChangeable']=="true"?true:false;
                $is_need_statistics=$action['isNeedStatistics']=="true"?true:false;
                $submit_name=null;
                if (isset($action['submitName'])) $submit_name=$action['submitName'];
                $query="INSERT INTO actions_description(thing_id,action_name,format,is_changeable,action_group_id,description,submit_name,is_supported,is_need_statistics,rank) VALUES ('$file[id]','$action[name]','$action[format]','$is_changeable','$group_id','$action[description]','$submit_name','$is_supported','$is_need_statistics','$l')";
                $mysqli->query($query);
                $action_id=$mysqli->insert_id;
                $creation_line['actionGroups'][$i]['actions'][$l]['id']=$action_id;
                $creation_line['actionGroups'][$i]['actions'][$l]['rank']=$l;
                $action_range=$action['range'];
                $action_range_count=count($action_range);
                for ($m=0;$m<$action_range_count;$m++){
                    $item=$action_range[$m];
                    $range_from=isset($item['from'])?$item['from']:null;
                    $range_to=isset($item['to'])?$item['to']:null;
                    $active_actions=isset($item['active_actions'])?$item['active_actions']:null;
                    $color=isset($item['color'])?$item['color']:null;
                    $item_name=null;
                    if (isset($item['name'])) $item_name=$item['name'];
                    $query="INSERT INTO action_range(action_id,item_name,range_from,range_to,active_actions,color) VALUES ('$action_id','$item_name','$range_from','$range_to','$active_actions','$color')";
                    $mysqli->query($query);
                    $action_range_id=$mysqli->insert_id;
                    $creation_line['actionGroups'][$i]['actions'][$l]['range'][$m]['id']=$action_range_id;
                }
               if ($is_supported) {
                   $support_actions=$action['support'];
                   $support_actions_count=count($support_actions);
                   for ($n=0;$n<$support_actions_count;$n++) {
                       $support_action=$support_actions[$n];
                       $is_changeable = $support_action['isChangeable'] == "true" ? true : false;
                       $is_need_statistics = $support_action['isNeedStatistics'] == "true" ? true : false;
                       if (isset($support_action['isDisactivator'])) $is_disactivator=$support_action['isDisactivator']=="true"?true:false;
                       else $is_disactivator=false;
                       $is_individual=$support_action['isIndividual']=="true"?true:false;
                       $support_submit_name=null;
                       if (isset($support_action['submitName'])) $support_submit_name=$support_action['submitName'];
                       $query = "INSERT INTO support_actions(action_owner_id,action_name,is_changeable,format,description,submit_name,is_need_statistics,thing_id,is_individual,is_disactivator) VALUES ('$action_id','$support_action[name]','$is_changeable','$support_action[format]','$support_action[description]','$support_submit_name','$is_need_statistics','$file[id]','$is_individual','$is_disactivator')";
                       $mysqli->query($query);
                       $support_action_id = $mysqli->insert_id;
                       $creation_line['actionGroups'][$i]['actions'][$l]['support'][$n]['id']=$support_action_id;
                       $support_action_range=$support_action['range'];
                       $support_action_range_count=count($support_action_range);
                       for ($k=0;$k<$support_action_range_count;$k++) {
                           $support_item=$support_action_range[$k];
                           $color = isset($support_item['color']) ? $support_item['color'] : null;
                           $disactivate = isset($support_item['disactivate']) ? $support_item['disactivate'] : null;
                           $explanation = isset($support_item['explanation']) ? $support_item['explanation'] : null;
                           $range_from=isset($support_item['from'])?$support_item['from']:null;
                           $range_to=isset($support_item['to'])?$support_item['to']:null;
                           $support_item_name=null;
                           if (isset($support_item['name'])) $support_item_name=$support_item['name'];
                           $query = "INSERT INTO support_action_range(action_id,item_name,range_from,range_to,disactivate,color,explanation) VALUES ('$support_action_id','$support_item_name','$range_from','$range_to','$disactivate','$color','$explanation')";
                           $mysqli->query($query);
                           $support_action_range_id=$mysqli->insert_id;
                           $creation_line['actionGroups'][$i]['actions'][$l]['support'][$n]['range'][$k]['id']=$support_action_range_id;
                       }

                   }
               }
            }
        }
        $creation_line=json_encode($creation_line);
        $mysqli->query("INSERT INTO things VALUES ('$file[id]','$file[name]','$file[thingGroup]','$file[updateTime]','$creation_line')");
        $mysqli->close();

    }

}