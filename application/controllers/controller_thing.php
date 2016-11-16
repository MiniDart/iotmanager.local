<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 10.11.2016
 * Time: 23:32
 */
class Controller_thing extends Controller
{

    function action_index()
    {
        // TODO: Implement action_index() method.
        $data=$_POST["thing_id"];
        $this->view->generate("thing_view.php","template_thing_view.php",$data );
    }
}