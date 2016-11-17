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
        if ($param!=null) $data=$this->model->get_data($param);
        else die("There is no param!");
        $this->view->generate("thing_view.php","template_thing_view.php",$data);
    }
}