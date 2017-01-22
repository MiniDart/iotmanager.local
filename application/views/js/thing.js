/**
 * Created by Sergey on 16.11.2016.
 */

"use strict";
//делаем заглавные буквы
/*$('h1,h2').each(function (index, element) {
    var text=element.innerHTML;
    var l=text[0].toUpperCase();
    element.innerHTML=l+text.substring(1);
});*/
//получаем action_id
/*var actionList=[];
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
 */

//Описание сущностей----------------------------------------------------------------------------------
function makeBigFirstLetter(word) {
    let l=word[0].toUpperCase();
    return l+word.substring(1);
}
class Item{
    constructor(data,owner){
        this.owner=owner;
        if ("color" in data) this.color=data.color;
        else this.color=null;
        this.id=data.id;
        this.format=owner.format;
            switch (this.format) {
                case "list":
                    if (!data.name) throw new Error("There is no name in range. Action:"+owner.name);
                    this.name = data.name;
                    this.from=null;
                    this.to=null;
                    break;
                case "number":
                    let from=null;
                    let to=null;
                    if ("from" in data){
                        from=+data.from;
                    }
                    if ("to" in data){
                        to=+data.to;
                    }
                    if (!(from||to)) throw new Error("There is no from and to in range. Action:"+owner.name);
                    if (!from) from="infinity";
                    if (!to) to="infinity";
                    this.from=from;
                    this.to=to;
                    this.name=null;
                    break;
                case "date":
                    let fromDate=undefined;
                    let toDate=undefined;
                    if ("from" in data){
                        let params=data.from.split(",");
                        fromDate=new Date(params[0],params[1],(params[2]==undefined?null:params[2]),(params[3]==undefined?null:params[3]),(params[4]==undefined?null:params[4]),(params[5]==undefined?null:params[5]),(params[6]==undefined?null:params[6]));

                    }
                    if ("to" in data){
                        let params=data.from.split(",");
                        toDate=new Date(params[0],params[1],(params[2]==undefined?null:params[2]),(params[3]==undefined?null:params[3]),(params[4]==undefined?null:params[4]),(params[5]==undefined?null:params[5]),(params[6]==undefined?null:params[6]));
                    }
                    if (!(fromDate||toDate)) throw new Error("There is no from and to in range. Action:"+owner.name);
                    if (!fromDate) fromDate="infinity";
                    if (!toDate) toDate="infinity";
                    this.from=fromDate;
                    this.to=toDate;
                    this.name=null;
                    break;
            }


    }
    isInRange(val){
        return false;
    }
}

class MainItem extends Item{
    constructor(data,owner){
        super(data,owner);
    }
}

class SupportItem extends Item{
    constructor(data,owner){
        super(data,owner);
        if ("isDeactivator" in data) this.isDeactivator=data.isDeactivator=="true";
        else this.isDeactivator=false;
        if ("description" in data) this.description=data.description;
        else this.description=null;
    }
}

class Action{
    constructor(data,owner) {
        this.owner = owner;
        this.name = makeBigFirstLetter(data.name);
        this.format = data.format;
        this.isChangeable = data.isChangeable == "true";
        this.submitName=null;
        if ("submitName" in data) this.submitName = makeBigFirstLetter(data.submitName);
        this.isNeedStatistics = data.isNeedStatistics == "true";
        this.rank = data.rank;
        this.id = data.id;
        this.description = null;
        if ("description" in data) this.description = makeBigFirstLetter(data.description);
        this.domElement=null;
    }
    draw(){
        let actionDom=$("<div><h3>"+this.name+"</h3></div>");
        if (this.description!=null) actionDom.append("<div class='description'>"+this.description+"</div>");
        actionDom.append("<p>Текущее значение:</p><div class='value'></div>");
        if (this.isChangeable){
            let from=null;
            let to=null;
            if (this.range!=null&&this.format!="list") {
                let range=[];
                for (let item of this.range.values()){
                    range.push(item);
                }
                from=range[0].from;
                to=range[0].to;
            }
            switch (this.format){
                case "number":
                    actionDom.append("<p>Введите новое значение"+(from||to?" в диапозоне":"")+(from?" от "+from:"")+(to?" до"+to:"")+":</p>");
                    actionDom.append("<input class='newValue' type='text'>");
                    break;
                case "list":
                    actionDom.append("<p>Выберите новое значение:</p>");
                    let selectDom=$("<select class='newValue'></select>");
                    selectDom.append($("<option value='-1'>none</option>"));
                    for (let [key,value] of this.range){
                        selectDom.append($("<option value='"+key+"'>"+value.name+"</option>"));
                    }
                    actionDom.append(selectDom);
                    break;
                case "date":
                    break;
            }
        }
        return actionDom;
    }

}

class SupportAction extends Action{
    constructor(data,owner) {
        super(data, owner);
        this.isDisactivator = data.isDisactivator == "true";
        this.isIndividual = data.isIndividual == "true";
        this.range = null;
        if ("range" in data) {
            let r = new Map();
            for (let i = 0; i < data.range.length; i++) {
                r.set(data.range[i].id,new SupportItem(data.range[i], this));
            }
            this.range = r;
        }
        this.active = null;
        if ("active" in data) this.active = data.active;
    }

    draw(){
        let supportActionDom=super.draw();
        supportActionDom.attr({
            "class":"supportAction",
            "id":"supportAction_"+this.id
        });
        supportActionDom.find(".value").addClass("support");
        if (this.isChangeable&&this.isIndividual){
            supportActionDom.append("<div class='submit'><input type='submit' value='"+(this.submitName?this.submitName:"Отправить")+"'></div>")
        }
        supportActionDom.find(".newValue").addClass("support");
        this.domElement=supportActionDom;
        return supportActionDom;
    }
}

class MainAction extends Action{
    constructor(data,owner){
        super(data,owner);
        this.range=null;
        if ("range" in data){
            let r=new Map();
            for (let i=0;i<data.range.length;i++){
                r.set(data.range[i].id,new MainItem(data.range[i],this));
            }
            this.range=r;
        }
        this.supportActions=null;
        if ("support" in data){
            let actions=new Map();
            for (let i=0;i<data.support.length;i++){
                actions.set(data.support[i].id,new SupportAction(data.support[i],this));
            }
            this.supportActions=actions;
        }
    }
    draw(){
        let mainActionDom=super.draw();
        mainActionDom.attr({
            "class":"mainAction",
            "id":"mainAction_"+this.id
        });
        mainActionDom.find(".value").addClass("main");
        mainActionDom.find(".newValue").addClass("main");
        mainActionDom.append("<div class='support'></div>");
        if (this.isChangeable){
            mainActionDom.append("<div class='submit'><input type='submit' value='"+(this.submitName?this.submitName:"Отправить")+"'></div>")
        }
        if (this.format=="list") {
            let self=this;
            mainActionDom.find(".newValue").change(function (event) {
                let val = $(this).val();
                let textVal=null;
                if (self.range.has(+val)){
                    textVal=self.range.get(+val).name;
                }
                let supportActions=[];
                for (let supportAction of self.supportActions.values()){
                    supportAction.domElement.hide();
                    if (!supportAction.active){
                        supportActions.push(supportAction);
                    }
                    else if (textVal!=null){
                        let activeItems=supportAction.active.split(":");
                        if (activeItems.indexOf(textVal)!=-1) supportActions.push(supportAction);
                    }
                }
                let algorithm=drawManager.activeTheme.algorithm;
                drawManager[algorithm+"SupportAlgorithm"](supportActions,mainActionDom,mainActionDom.width());
            });
        }
        this.domElement=mainActionDom;
        return mainActionDom;
    }
}

class ActionGroup{
    constructor(data,owner){
        this.owner=owner;
        this.name=null;
        if ("name" in data) this.name=makeBigFirstLetter(data.name);
        this.id=data.id;
        this.rank=data.rank;
        let actions=[];
        this.actions=new Map();
        for (let i=0;i<data.actions.length;i++){
            this.actions.set(data.actions[i].id,new MainAction(data.actions[i],this));
        }
        this.domElement=null;
    }
    draw(){
        let actionGroupDom=$("<div class='actionGroup' id='actionGroup_"+this.id+"'></div>");
        if (this.name!=null){
            actionGroupDom.append("<h2>"+this.name+"</h2>");
        }
        actionGroupDom.append("<div class='actionContainer'></div>");
        this.domElement=actionGroupDom;
        return actionGroupDom;

    }
}

class Device{
    constructor(data){
        this.id=data.id;
        this.name=makeBigFirstLetter(data.name);
        this.group=data.thingGroup;
        this.updateTime=data.updateTime;
        this.actionGroups=new Map();
        for (let i=0;i<data.actionGroups.length;i++){
            this.actionGroups.set(data.actionGroups[i].id,new ActionGroup(data.actionGroups[i],this));
        }
        this.domElement=null;
    }
    draw(){
        let deviceDom=$("<div class='device' id='device_"+this.id+"'></div>");
        this.domElement=deviceDom;
        return deviceDom;
    }
    updateOnTime(){
        this.updateActionsValue();
    }
    updateActionsValue(){
        let self=this;
        $.post("getdata",{device_id:self.id},onAjaxSuccess,'json');
        function onAjaxSuccess(data) {
            if (data.thing_id==self.id){
                let dataActionGroups=data.actionGroups;
                for (let i=0;i<dataActionGroups.length;i++){
                    let actionGroup=self.actionGroups.get(+dataActionGroups[i].id);
                    let dataActions=dataActionGroups[i].actions;
                    for (let l=0;l<dataActions.length;l++){
                        let action=actionGroup.actions.get(+dataActions[l].id);
                        action.domElement.find(".value").filter(".main").text(dataActions[l].value);
                        if ("supportActions" in dataActions[l]){
                            let dataSupportActions=dataActions[l].supportActions;
                            for (let n=0;n<dataSupportActions.length;n++){
                                let supportAction=action.supportActions.get(+dataSupportActions[n].id);
                                supportAction.domElement.find(".value").text(dataSupportActions[n].value);
                            }
                        }
                    }
                }
            }

        }
    }
}




class Theme{
    constructor(){
        this.name="Simple";
        this.allLines=2;
        this.algorithm="simple";
        this.rules=null;
    }
}

class DrawManager{
    constructor(device){
        this.device=device;
        this.themes=[];
        this.themes.push(new Theme());
        this.activeTheme=this.themes[0];
    }
    start(){
        this.device.updateOnTime();
    }
    draw(){
        $("h1.device_name").text(this.device.name);
        this[this.activeTheme.algorithm+"Algorithm"]();
    }
    simpleAlgorithm(){
        let deviceDom=this.device.draw();
        let containerWidth=document.documentElement.clientWidth-200;
        deviceDom.css({
            "width":containerWidth+"px",
            "height":"100%",
            "margin-left":"auto",
            "margin-right":"auto",
            "border-left":"1px solid white",
            "border-right":"1px solid white",
            "color":"white",
            "font-size":"20px"
        });
        let actionGroups=[];
        for (let group of this.device.actionGroups.values()){
            actionGroups.push(group);
        }
        actionGroups.sort(this.rankSort);
        for (let i=0;i<actionGroups.length;i++){
            let actionGroupDom=actionGroups[i].draw();
            actionGroupDom.find("h2").css("marginBottom","30px");
            let actionContainerDom=actionGroupDom.find("div.actionContainer");
            actionContainerDom.css({
                "display":"flex",
                "flexWrap":"wrap",
                "justifyContent":"space-around",
                "width":"100%"
            });
            if (actionGroups.length!=1){
                actionGroupDom.css("border","1px solid black");
            }
            let actions=[];
            for (let action of actionGroups[i].actions.values()){
                actions.push(action);
            }
            actions.sort(this.rankSort);
            let actionWidth=Math.floor(containerWidth/this.activeTheme.allLines)-this.activeTheme.allLines*12;
            for (let l=0;l<actions.length;l++){
                let actionDom=actions[l].draw();
                actionDom.css({
                    "flex-basis":actionWidth+"px",
                    "flex-grow":"1",
                    "border":"1px solid white",
                    "padding":"5px"
                });
                actionDom.find("div.value").css({
                    "height":"30px",
                    "background":"grey",
                    "text-align":"center"
                });
                let supportActions=actions[l].supportActions;
                if (supportActions!=null) {
                    let supportContainerDom=actionDom.find("div.support");
                    supportContainerDom.css({
                        "display":"flex",
                        "flexWrap":"wrap",
                        "justifyContent":"space-around",
                        "padding":"5px"
                    });
                   let activeSupportActions=[];
                    for (let supportAction of supportActions.values()){
                        let supportActionDom=supportAction.draw();
                        supportActionDom.hide();
                        supportActionDom.css({
                            "border": "1px solid grey",
                            "padding":"5px"
                        });
                        supportActionDom.find("div.value").css({
                            "height": "30px",
                            "background": "grey",
                            "text-align":"center"
                        });
                        supportContainerDom.append(supportActionDom);
                        if (supportAction.active==null) activeSupportActions.push(supportAction);
                    }
                    this.simpleSupportAlgorithm(activeSupportActions,actionDom,actionWidth);
                }
                actionContainerDom.append(actionDom);
            }
            deviceDom.append(actionGroupDom);
        }
        let section=$("section.container");
        section.append(deviceDom);

    }
    simpleSupportAlgorithm(supportActions,actionDom,actionWidth){
        let supportContainerDom=actionDom.find("div.support");
        let supportActionWidth=Math.floor(actionWidth/supportActions.length);
        if (supportActionWidth<250) {
            let w = Math.floor(actionWidth / 250);
            supportActionWidth = Math.floor(actionWidth / w)-w*12;
        }
        else supportActionWidth-=supportActions.length*12;
        for (let m = 0; m < supportActions.length; m++) {
            let supportActionDom = supportActions[m].domElement;
            supportActionDom.css({
                "width": supportActionWidth + "px",
            });
            supportActionDom.show();
        }
    }
    rankSort(a,b){
        return (a.rank-b.rank);
    }
}


//Начало работы программы---------------------------------------------------------------
let dataFromJson=JSON.parse($("#data_in_json").get(0).dataset.device);
let drawManager=new DrawManager(new Device(dataFromJson));
drawManager.draw();
drawManager.start();