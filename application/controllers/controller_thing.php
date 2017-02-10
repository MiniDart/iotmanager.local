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

    function action_index($param=null)
    {
        // TODO: Implement action_index() method.
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
        if ($param!=null) {
            $data=$this->model->get_data($param);
            $this->view->generate("thing_view.php","template_thing_view.php",$data);
        }
        else die("There is no param!");
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