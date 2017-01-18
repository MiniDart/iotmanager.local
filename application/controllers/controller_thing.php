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
        $data=$this->model->get_upgrade_device_data();
        $curl=curl_init();
        curl_setopt($curl, CURLOPT_URL,"http://localhost:3000/upgradeaction");
        curl_setopt($curl, CURLOPT_POST, 1);
        curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query(array('upgradeDevice' => $data)));
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        $server_output = curl_exec ($curl);
        $this->view->generate("actionsdata_view.php","empty_view.php",$server_output );
    }
}