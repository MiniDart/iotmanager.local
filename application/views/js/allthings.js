/**
 * Created by Sergey on 15.11.2016.
 */
$('.item').each(function (index, element) {
    var text=element.innerHTML;
    var l=text[0].toUpperCase();
    element.innerHTML=l+text.substring(1);
});
 
