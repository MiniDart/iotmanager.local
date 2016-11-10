<?php
require_once 'core/model.php';
require_once 'core/view.php';
require_once 'core/controller.php';
require_once 'core/route.php';
error_reporting (E_ALL);
// Константы:

define ('DIRSEP', DIRECTORY_SEPARATOR);
// Узнаём путь до файлов сайта
$site_path = realpath(dirname(__FILE__) . DIRSEP . '..' . DIRSEP) . DIRSEP;
define ('site_path', $site_path);
Route::start();
/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 09.11.2016
 * Time: 13:05
 */
