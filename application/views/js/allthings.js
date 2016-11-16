/**
 * Created by Sergey on 15.11.2016.
 */
$('.item').each(function (index, element) {
    var text=element.innerHTML;
    var l=text[0].toUpperCase();
    element.innerHTML=l+text.substring(1);
});
$('.item').on('click',function (e) {
    console.log("item click");
    console.log("id="+this.getAttribute("data-id"));
    $("[name='thing_id']").val(this.getAttribute("data-id"));
    $("form").submit(function () {
        console.log("submit")
    }).submit();

});
 
