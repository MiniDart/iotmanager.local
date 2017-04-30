<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 09.11.2016
 * Time: 13:36
 */
class Route
{
    static function start()
    {
        $controller_name = 'allthings';
        $action = 'index';
        $param=null;

        $routes = explode('/', $_SERVER['REQUEST_URI']);
        
        if ( !empty($routes[1]) )
        {
            if ($routes[1]=="creatething"){
                $controller_name=$routes[1];
            }
            elseif ($routes[1]=="theme"){
                $param=$routes[1];
            }
            else {
                $controller_name = "thing";
                $param = $routes[1];
            }
        }
        $model_name = 'Model_'.$controller_name;
        $controller_name = 'Controller_'.$controller_name;

        $model_file = strtolower($model_name).'.php';
        $model_path = "application/models/".$model_file;
        if(file_exists($model_path))
        {
            include "application/models/".$model_file;
        }
        
        $controller_file = strtolower($controller_name).'.php';
        $controller_path = "application/controllers/".$controller_file;
        if(file_exists($controller_path))
        {
            include "application/controllers/".$controller_file;
        }
        else
        {
            Route::ErrorPage404();
        }
        $controller = new $controller_name;

        if(method_exists($controller, $action))
        {
            $controller->$action($param);
        }
        else{
            Route::ErrorPage404();
        }
    }

    static function ErrorPage404()
    {
        echo "Error 404: ".$_SERVER['REQUEST_URI'];
//        $host = 'http://'.$_SERVER['HTTP_HOST'].'/';
//        header('HTTP/1.1 404 Not Found');
//        header("Status: 404 Not Found");
//        header('Location:'.$host.'404');
    }

}