<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 12.11.2016
 * Time: 14:40
 */
class Controller_newthing extends Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->model=new Model_newthing();
    }

    function action_index($param=null)
    {
        // TODO: Implement action_index() method.
        $new_thing=$_POST['new_thing'];
        $data=json_decode($new_thing,true);
        $this->model->set_data($data);
        $this->view->generate("test_view.php","empty_view.php",$data);
    }

}