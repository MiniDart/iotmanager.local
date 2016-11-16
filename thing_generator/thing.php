<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="thing_generator/main.css">
    <title>Thing_page</title>
    <script defer src="jquery-3.1.1.js"></script>
    <script defer src="thing_generator/main.js"></script>
</head>
<body>
<h1>Генератор вещей</h1>
<div class="container">
    <table>
        <tr>
<td>Введите уникальный ID:</td><td><input class="characteristics" name="id" type="text"></td>
            </tr>
        <tr>
<td>Введите имя:</td><td><input class="characteristics" name="name" type="text"></td>
            </tr>
        <tr>
    <td>Введите группу:</td><td><input class="characteristics" name="thingGroup" type="text"></td>
        </tr>
        </table>
<p>Введите одно действие вещи в формате: имя, формат, возможность_изменения(0||1), важность_характеристики(число), список режимов(если они есть, в формате-режим1:режим2:режим3...):</p>
<p class="input"><input class="characteristics" type="text"> <button class="add">Добавить</button></p>
</div>
<button id="create">Создать вещь</button>
</body>
</html>