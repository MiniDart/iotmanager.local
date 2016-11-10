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
    $(".characteristics").each(function (index) {
        if (index==0){
            thing.id=this.value;
        }
        else if (index==1){
            thing.name=this.value;
        }
        else if (index==2){
            thing.group=this.value;
        }
        else {
            thing["n" + index] = this.value;
        }
    });
    var file=JSON.stringify(thing);
    alert(file);
});