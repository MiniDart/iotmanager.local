/**
 * Created by Sergey on 16.11.2016.
 */
//делаем заглавные буквы
$('h1,h2').each(function (index, element) {
    var text=element.innerHTML;
    var l=text[0].toUpperCase();
    element.innerHTML=l+text.substring(1);
});

//получаем id элементов
var actionList=[];
$(".item").each(function (index, element) {
    actionList.push(element.getAttribute("id"));
});
var strJson=JSON.stringify(actionList);


//post запрос на текущие данные
$.post("getdata",{actions:strJson},onAjaxSuccess,'json');
function onAjaxSuccess(data) {
    for (var i=0;i<data.length;i++){
        $("#"+data[i]['action_id']+" .output").text(data[i]['action_value'])
    }

}


alert($("#data_in_json").text());