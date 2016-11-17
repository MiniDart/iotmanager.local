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

    function action_index($param=null)
    {
        // TODO: Implement action_index() method.
        $data=$this->model->get_data();
        $this->view->generate('allthings_view.php', 'template_allthings_view.php',$data);
    }
}