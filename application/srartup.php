<?php
require_once 'core/model.php';
require_once 'core/view.php';
require_once 'core/controller.php';
require_once 'core/route.php';
error_reporting (E_ALL);
// Константы:
define ('DIRSEP', DIRECTORY_SEPARATOR);
define('DB_NAME', 'iot');
/** MySQL database username */
define('DB_USER', 'miniDart');
/** MySQL database password */
define('DB_PASSWORD', '441511');
/** MySQL hostname */
define('DB_HOST', 'localhost:3306');
define('CSS_PATH', 'application/views/css/');
define('JS_PATH','application/views/js/' );
$site_path = realpath(dirname(__FILE__) . DIRSEP . '..' . DIRSEP) . DIRSEP;
define ('SITE_PATH', $site_path);
Route::start();
/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 09.11.2016
 * Time: 13:05
 */
