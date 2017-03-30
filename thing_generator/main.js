/**
 * Created by Sergey on 08.11.2016.
 */
$("#create").on("click",function () {
    console.log("here:"+$('textarea').val());
    $.post("/",{new_thing:$('textarea').val()},onAjaxSuccess);
});
function onAjaxSuccess(data) {
    console.log(data);
}