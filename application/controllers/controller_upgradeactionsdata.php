<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 20.11.2016
 * Time: 14:36
 */
class Controller_upgradeactionsdata extends Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->model=new Model_upgradeactionsdata();
    }

    function action_index($param = null)
    {
        // TODO: Implement action_index() method.
        $data=json_decode($_POST["thing_param"],true);
        $res=$this->model->set_data($data);
        $answer="Success!!!";
        if (!$res) $answer="Something wrong in Controller_upgradeactionsdata";
        $this->view->generate("actionsdata_view.php","empty_view.php",$answer );
    }
}