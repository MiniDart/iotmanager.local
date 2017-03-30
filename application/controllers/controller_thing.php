<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 10.11.2016
 * Time: 23:32
 */
class Controller_thing extends Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->model=new Model_thing();
    }

    function index($param=null)
    {
        // TODO: Implement action_index() method.
        $request_method=$_SERVER['REQUEST_METHOD'];
        switch ($request_method){
            case "GET":
                $this->get($param);
                break;
            case "PUT":
                $this->put($param);
                break;
        }
        /*
        if ($param==="getdata"){
            $this->action_getdata();
            return;
        }
        if ($param==="setaction"){
            $this->action_setaction();
            return;
        }
        if ($param==="upgradeline"){
            $this->upgrade_line();
            return;
        }
        if ($param==="getinitialline"){
            $this->get_initial_line();
            return;
        }
        else die("There is no param!");
        */
    }
    function get($param){
        $actions_json=isset($_GET['actions'])?$_GET['actions']:null;
        if ($actions_json!=null){
            $actions_value=$this->model->get_current_data($actions_json,$param);
            $this->view->generate("actionsdata_view.php","empty_view.php",$actions_value);
        }
        else {
            $data = $this->model->get($param);
            $this->view->generate("thing_view.php", "template_thing_view.php", $data);
        }
    }
    function put($thing_id){
        $actions_value=$this->put($thing_id);
        $this->view->generate("actionsdata_view.php","empty_view.php",$actions_value );
    }
    function action_getdata(){
        $data=$this->model->get_current_data();
        $this->view->generate("actionsdata_view.php","empty_view.php",$data );
    }
    function action_setaction(){
        $server_output=$this->model->set_action_data();
        $this->view->generate("actionsdata_view.php","empty_view.php",$server_output );
    }
    function upgrade_line(){
        $data=$this->model->upgrade_line();
        $this->view->generate("actionsdata_view.php","empty_view.php",$data);
    }
    function get_initial_line(){
        $data=$this->model->get_initial_line();
        $this->view->generate("actionsdata_view.php","empty_view.php",$data);
    }
}