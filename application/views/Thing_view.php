<header>
    <h1><?php echo $data['thing']['thing_name']?></h1>
</header>
<section>
    <div class="container">
        <?php
        /*
        foreach ($data as $key=>$value){
            if ($key==='thing') continue;
            echo "<div class='item' id='$value[id]' data-format='$value[format]' >
                <h2>$value[action_name]</h2>
                <p>Текущее значение:</p>
                <div class='output'></div>";
            if ($value['is_changeable']==1){
                if ($value['format']=='list'&&$value['list_content']!=null){
                    $list_values=explode(":",$value['list_content'] );
                    echo "<p>Выберите режим работы:</p>";
                    echo "<select name='input_$value[id]'>";
                    foreach ($list_values as $l_v){
                     echo "<option>$l_v</option>";
                    }
                    echo "</select></br>";
                }
                else {
                    echo "<p>Введите новое значение параметра:</p>";
                    echo "<input type='text' name='input_$value[id]'></br>";
                }
                echo "<input type='submit' name='submit_$value[id]' value='Установить'>";
            }
            echo "</div>";

        }
        */
        ?>
    </div>
</section>
<footer>
    
</footer>
<?php 
$dataJson=json_encode($data);
echo "<p id='data_in_json'>$dataJson</p>"?>