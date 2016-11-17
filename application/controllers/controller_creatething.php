<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 14.11.2016
 * Time: 13:56
 */
class Controller_creatething extends Controller
{

    function action_index($param=null)
    {
        // TODO: Implement action_index() method.
        include 'thing_generator/thing.php';
    }
}