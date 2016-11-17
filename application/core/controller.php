<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 09.11.2016
 * Time: 21:40
 */
abstract class Controller
{
    public $model;
    public $view;

    function __construct()
    {
        $this->view = new View();
    }

    abstract function action_index($param=null);

}