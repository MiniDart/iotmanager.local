<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 09.11.2016
 * Time: 21:39
 */
abstract class Model
{
    abstract public function get_data($param=null);
    abstract public function set_data($file=null);

}