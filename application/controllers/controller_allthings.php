<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 10.11.2016
 * Time: 23:26
 */
class Controller_allthings extends Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->model=new Model_allthings();
    }

    function index($param=null)
    {
        // TODO: Implement action_index() method.
        $request_method=$_SERVER['REQUEST_METHOD'];
        switch ($request_method){
            case "GET":
                $this->get();
                break;
            case "POST":
                $this->post();
                break;
            case "PUT":
                $this->put($param);
        }
    }
    function get(){
        $data=$this->model->get();
        $this->view->generate('allthings_view.php', 'template_allthings_view.php',$data);
    }
    function post(){
        $result=$this->model->post();
        $this->view->generate("simple_output_view.php","template_empty_view.php",$result);
    }
    function put($param){
        $data=$this->model->put($param);
        $this->view->generate("simple_output_view.php","template_empty_view.php",$data);
    }
}