<header>
    <h1>Доступные устройства</h1>
</header>
<section>
    <div class="container">
        <?php
        foreach ($data as $row){
            echo "<a href='thing/index/$row[id]'><div class='item' data-id='$row[id]'>$row[thing_name]</div></a>";
        }
        ?>
    </div>
</section>
<footer>
</footer>