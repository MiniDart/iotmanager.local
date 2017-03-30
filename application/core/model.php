<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 09.11.2016
 * Time: 21:39
 */
abstract class Model
{
    abstract public function get($param=null);
    abstract public function put($param=null);
    abstract public function post($param=null);
    abstract public function delete($param=null);

}