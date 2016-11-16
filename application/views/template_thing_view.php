<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <link rel="stylesheet" href=<?php echo CSS_PATH."thing.css"?>>
    <script defer src="jquery-3.1.1.js"></script>
    <script defer src=<?php echo JS_PATH."thing.js"?>></script>
    <title>Thing</title>
</head>
<body>
<?php include 'application/views/'.$content_view; ?>
</body>
</html>