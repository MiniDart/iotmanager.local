<header>
    <h1>Доступные устройства</h1>
</header>
<section>
    <div class="container">
        <?php
        foreach ($data as $row){
            echo "<div class='item' data-id='$row[id]'>$row[thing_name]</div>";
        }
        ?>
    </div>
</section>
<footer>
    <form method="post" action="/thing">
        <input type="text" name="thing_id">
        <input type="submit">
    </form>
</footer>