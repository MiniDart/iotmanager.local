<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 20.11.2016
 * Time: 14:36
 */
class Controller_upgradeparams extends Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->model=new Model_upgradeparams();
    }

    function action_index($param = null)
    {
        // TODO: Implement action_index() method.
        echo "Controller upgradeparams/n";
        $data=json_decode($_POST["thing_param"],true);
        echo $_POST["thing_param"];
        $this->model->set_data($data);
        $this->view->generate("actionsdata_view.php","empty_view.php","Success!!!" );
    }
}