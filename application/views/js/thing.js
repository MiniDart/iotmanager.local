/**
 * Created by Sergey on 16.11.2016.
 */
//делаем заглавные буквы
/*$('h1,h2').each(function (index, element) {
    var text=element.innerHTML;
    var l=text[0].toUpperCase();
    element.innerHTML=l+text.substring(1);
});*/
var dataInJson=$("#data_in_json").html();
var device=JSON.parse(dataInJson);
//получаем action_id
var actionList=[];
$(".item").each(function (index, element) {
    actionList.push(element.getAttribute("id"));
});
var strJson=JSON.stringify(actionList);
console.log("strJson: "+strJson);


//post запрос на текущие данные
$.post("getdata",{actions:strJson},onAjaxSuccess,'json');
var timerId = setInterval(function() {
    $.post("getdata",{actions:strJson},onAjaxSuccess,'json');
}, 10000);
function onAjaxSuccess(data) {
    for (var i=0;i<data.length;i++){
        $("#"+data[i]['action_id']+" .output").text(data[i]['action_value'])
    }
}

//Управление устройством
$("input[type='submit']").on('click',function (e) {
    var action_id=this.getAttribute('name').substr(7);
    var input=$("[name='input_"+action_id+"']");
    var value=input.val();
    input.val("");//look here, it's temporary!!!!!!!!!!!!!!!
    var arr={};
    arr['action_id']=action_id;
    arr['value']=value;
    $.post("setaction",{newData:JSON.stringify(arr)},function (data) {
        console.log(data);
        $.post("getdata",{actions:strJson},onAjaxSuccess,'json');

    })
});