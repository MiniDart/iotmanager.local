/**
 * Created by Sergey on 08.11.2016.
 */
$(".add").on("click",function () {
    var p=$(".input");
    var newP=p.clone(true);
    newP.find("input").val("");
    newP.appendTo(".container");
    p.find(".add").remove();
    p.removeClass("input");
});
var thing={};
$("#create").on("click",function () {
    $(".characteristics").each(function (index,element) {
        if (element.name=="id"){
            thing.id=this.value;
        }
        else if (element.name=="name"){
            thing.name=this.value;
        }
        else if (element.name=="thingGroup"){
            thing.thingGroup=this.value;
        }
        else {
            thing["action_" + index] = this.value;
        }
    });
    var file=JSON.stringify(thing);
    $.post("/newthing",{new_thing:file},onAjaxSuccess);
});
function onAjaxSuccess(data) {
    console.log(data);
}