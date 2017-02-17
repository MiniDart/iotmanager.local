<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <link rel="stylesheet" href=<?php echo DOMAIN_NAME.CSS_PATH."thing.css"?>>
    <link rel="stylesheet" href=<?php echo DOMAIN_NAME.CSS_PATH."normal_simple.css"?>>
    <link rel="stylesheet" href=<?php echo DOMAIN_NAME."jquery-ui-1.12.1.custom/jquery-ui.min.css"?>>
    <link rel="stylesheet" href=<?php echo DOMAIN_NAME."jquery-ui-1.12.1.custom/jquery-ui.structure.min.css"?>>
    <script defer src=<?php echo DOMAIN_NAME."jquery-3.1.1.js"?>></script>
    <script defer src=<?php echo DOMAIN_NAME.JS_PATH."thing.js"?>></script>
    <script defer src=<?php echo DOMAIN_NAME."jquery-ui-1.12.1.custom/jquery-ui.min.js"?>></script>
    <title>Thing</title>
</head>
<body>
<?php include 'application/views/'.$content_view; ?>
</body>
</html>