<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 09.11.2016
 * Time: 21:40
 */
class View
{
    public function generate($content_view, $template_view, $data = null)
    {
        /*
        if(is_array($data)) {
            // преобразуем элементы массива в переменные
            extract($data);
        }
        */

        include 'application/views/'.$template_view;
    }
}