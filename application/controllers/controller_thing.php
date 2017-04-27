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
            case "POST":
                $this->post($param);
                break;
            case "DELETE":
                $this->delete($param);
        }
    }
    function get($param){
        $data=$this->model->get($param);
        if (stripos($param, "-value")){
            $this->view->generate("actionsdata_view.php","empty_view.php",$data);
        }
        else if(stripos($param,"-string")){
            $this->view->generate("second_device_view.php","empty_view.php",$data);
        }
        else {
            $this->view->generate("thing_view.php", "template_thing_view.php", $data);
        }
    }
    function put($thing_id){
        $resp=$this->model->put($thing_id);
        $this->view->generate("actionsdata_view.php","empty_view.php",$resp );
    }
    function post($thing_id){
        $status=$this->model->post($thing_id);
        $this->view->generate("actionsdata_view.php","empty_view.php",$status);
    }
    function delete($thing_id){
        $status=$this->model->delete($thing_id);
        $this->view->generate("actionsdata_view.php","empty_view.php",$status);
    }
}