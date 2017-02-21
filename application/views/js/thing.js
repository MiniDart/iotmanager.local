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
    let l = word[0].toUpperCase();
    return l + word.substring(1);
}
function rankSort(a, b) {
    return (a.rank - b.rank);
}
class Item {
    constructor(data, owner) {
        this.owner = owner;
        if ("color" in data) this.color = data.color;
        else this.color = null;
        this.id = +data.id;
        this.format = owner.format;
        switch (this.format) {
            case "list":
                if (!data.name) throw new Error("There is no name in range. Action:" + owner.name);
                this.name = data.name;
                this.from = null;
                this.to = null;
                break;
            case "number":
                let from = null;
                let to = null;
                if ("from" in data) {
                    from = +data.from;
                }
                if ("to" in data) {
                    to = +data.to;
                }
                if (!(from || to)) throw new Error("There is no from and to in range. Action:" + owner.name);
                this.from = from;
                this.to = to;
                this.name = null;
                break;
            case "date":
                let fromDate = null;
                let toDate = null;
                if ("from" in data) {
                    let params = data.from.split(",");
                    fromDate = new Date(params[0], params[1], (params[2] == undefined ? null : params[2]), (params[3] == undefined ? null : params[3]), (params[4] == undefined ? null : params[4]), (params[5] == undefined ? null : params[5]), (params[6] == undefined ? null : params[6]));

                }
                if ("to" in data) {
                    let params = data.from.split(",");
                    toDate = new Date(params[0], params[1], (params[2] == undefined ? null : params[2]), (params[3] == undefined ? null : params[3]), (params[4] == undefined ? null : params[4]), (params[5] == undefined ? null : params[5]), (params[6] == undefined ? null : params[6]));
                }
                if (!(fromDate || toDate)) throw new Error("There is no from and to in range. Action:" + owner.name);
                this.from = fromDate;
                this.to = toDate;
                this.name = null;
                break;
        }


    }

    isInRange(val) {
        if (this.format == "number") {
            val = +val;
            if (!from) {
                if (val > to) return false;
                else return true;
            }
            if (!to) {
                if (val < from) return false;
                else return true;
            }
            if (val < from || val > to) return false;
            return true;
        }
    }
}

class MainItem extends Item {
    constructor(data, owner) {
        super(data, owner);
    }
}

class SupportItem extends Item {
    constructor(data, owner) {
        super(data, owner);
        if ("isDeactivator" in data) this.isDeactivator = data.isDeactivator == "true";
        else this.isDeactivator = false;
        if ("description" in data) this.description = data.description;
        else this.description = null;
    }
}

class Action {
    constructor(data, device) {
        this.device = device;
        this.name = makeBigFirstLetter(data.name);
        this.format = data.format;
        this.isChangeable = data.isChangeable == "true";
        this.submitName = null;
        if ("submitName" in data) this.submitName = makeBigFirstLetter(data.submitName);
        this.isNeedStatistics = data.isNeedStatistics == "true";
        this.id = +data.id;
        device.actions.set(this.id, this);
        this.description = null;
        if ("description" in data) this.description = makeBigFirstLetter(data.description);
        this.domElement = new Map();
    }

    draw() {
        let actionDom = $("<div><h3>" + this.name + "</h3></div>");
        if (this.description != null) actionDom.append("<div class='description'>" + this.description + "</div>");
        actionDom.append("<p>Текущее значение:</p><div class='value'></div>");
        if (this.isChangeable) {
            let from = null;
            let to = null;
            if (this.range != null && this.format != "list") {
                let range = [];
                for (let item of this.range.values()) {
                    range.push(item);
                }
                from = range[0].from;
                to = range[0].to;
            }
            switch (this.format) {
                case "number":
                    actionDom.append("<p>Введите новое значение" + (from || to ? " в диапозоне" : "") + (from ? " от " + from : "") + (to ? " до" + to : "") + ":</p>");
                    actionDom.append("<input class='newValue' type='text'>");
                    break;
                case "list":
                    actionDom.append("<p>Выберите новое значение:</p>");
                    let selectDom = $("<select class='newValue'></select>");
                    selectDom.append($("<option value='-1'>none</option>"));
                    for (let [key,value] of this.range) {
                        selectDom.append($("<option value='" + key + "'>" + value.name + "</option>"));
                    }
                    actionDom.append(selectDom);
                    break;
                case "date":
                    break;
            }
        }
        return actionDom;
    }

    getValue(selector) {
        if (this.format == "list") {
            let id = +this.domElement.get(this.device.activeGroup.id).find(selector).val();
            let name;
            if (this.range.has(id)) name = this.range.get(id).name;
            else if (id == -1) name = "none";
            return name;
        }
        if (this.format == "number") {
            let item;
            for (let value of this.range.values()) {
                item = value;
                break;
            }
            let val = +this.domElement.get(this.device.activeGroup.id).find(selector).val();
            if (!item.isInRange(val)) {
                alert("Error: Write a correct value!");
                throw new Error("Incorrect value");
            }
            return val;
        }
    }

}

class SupportAction extends Action {
    constructor(data, owner, device) {
        super(data, device);
        this.owner=owner;
        this.isDisactivator = data.isDisactivator == "true";
        this.isIndividual = data.isIndividual == "true";
        this.range = null;
        if ("range" in data) {
            let r = new Map();
            for (let i = 0; i < data.range.length; i++) {
                r.set(+data.range[i].id, new SupportItem(data.range[i], this));
            }
            this.range = r;
        }
        this.active = null;
        if ("active" in data) this.active = data.active;
    }

    draw(id) {
        let supportActionDom = super.draw();
        supportActionDom.attr({
            "class": "supportAction",
            "id": "supportAction_" + this.id
        });
        supportActionDom.find(".value").addClass("support");
        if (this.isChangeable && this.isIndividual) {
            let submit = $("<div class='submit'><input type='submit' value='" + (this.submitName ? this.submitName : "Отправить") + "'></div>");
            let self = this;
            submit.find("input").on("click", function (event) {
                let device = {"id": self.device.id, "actions": []};
                let supportAction = {"id": self.id};
                try {
                    supportAction.value = self.getValue(".newValue.support");
                }
                catch (e) {
                    return;
                }
                if (supportAction.value == "none") {
                    alert("Error: Choose a correct value");
                    return;
                }
                device.actions.push(supportAction);
                $.post("setaction", {'newData': JSON.stringify(device)}, self.device.insertValuesInActions(), 'json');
            });
            supportActionDom.append(submit);
        }
        supportActionDom.find(".newValue").addClass("support");
        this.domElement.set(id,supportActionDom);
        return supportActionDom;
    }

    setValue(val) {
        if (!this.domElement) return;
        this.domElement.find(".value.support").text(val);
    }
}

class MainAction extends Action {
    constructor(data, owner, device) {
        super(data, device);
        this.owners=new Map();
        this.owners.set(owner.id,owner);
        this.range = null;
        if ("range" in data) {
            let r = new Map();
            for (let i = 0; i < data.range.length; i++) {
                r.set(+data.range[i].id, new MainItem(data.range[i], this));
            }
            this.range = r;
        }
        this.supportActions = null;
        if ("support" in data) {
            let actions = new Map();
            for (let i = 0; i < data.support.length; i++) {
                actions.set(+data.support[i].id, new SupportAction(data.support[i], this, device));
            }
            this.supportActions = actions;
        }
        this.isDescribed=false;
    }

    draw(id) {
        let mainActionDom = super.draw();
        mainActionDom.attr({
            "class": "mainAction",
            "id": "mainAction_" + this.id
        });
        mainActionDom.find(".value").addClass("main");
        mainActionDom.find(".newValue").addClass("main");
        if (this.supportActions) {
            let supportContainerDom = $("<div class='support'></div>");
            for (let supportAction of this.supportActions.values()) {
                supportContainerDom.append(supportAction.draw(id));
            }
            mainActionDom.append(supportContainerDom);
        }
        if (this.isChangeable) {
            let submit = $("<div class='submit'><input type='submit' value='" + (this.submitName ? this.submitName : "Отправить") + "'></div>");
            let self = this;
            submit.find("input").on("click", function (event) {
                let device = {"id": self.device.id, "actions": []};
                let action = {"id": self.id};
                try {
                    action.value = self.getValue(".newValue.main");
                }
                catch (e) {
                    return;
                }
                if (action.value == "none") {
                    alert("Error: Choose correct value");
                    return;
                }
                device.actions.push(action);
                if (self.supportActions != null) {
                    for (let supportActionSelf of self.supportActions.values()) {
                        let value;
                        if (!supportActionSelf.isChangeable || supportActionSelf.domElement.css("display") == "none" || (value = supportActionSelf.getValue(".newValue.support")) == "none") continue;
                        let supportAction = {};
                        supportAction.id = supportActionSelf.id;
                        supportAction.value = value;
                        device.actions.push(supportAction);
                    }
                }
                $.post("setaction", {'newData': JSON.stringify(device)}, self.device.insertValuesInActions(), 'json');
            });
            mainActionDom.append(submit);

        }
        if (this.format == "list" && this.supportActions != null) {
            let self = this;
            mainActionDom.find(".newValue.main").change(function (event) {
                let val = $(this).val();
                let textVal = null;
                if (self.range.has(+val)) {
                    textVal = self.range.get(+val).name;
                }
                let supportActions = [];
                for (let supportAction of self.supportActions.values()) {
                    supportAction.domElement.get(self.device.activeGroup.id).hide();
                    if (!supportAction.active) {
                        supportActions.push(supportAction);
                    }
                    else if (textVal != null) {
                        let activeItems = supportAction.active.split(":");
                        if (activeItems.indexOf(textVal) != -1) supportActions.push(supportAction);
                    }
                }
                let algorithm = drawManager.activeTheme.algorithm;
                drawManager[algorithm + "SupportAlgorithm"](supportActions, mainActionDom.width());
            });
        }
        this.domElement.set(id,mainActionDom);
        return mainActionDom;
    }

    setValue(val) {
        if (!this.domElement) return;
        this.domElement.find(".value.main").text(val);
    }

}

class ActionGroup {
    constructor(data, owner, device) {
        this.device = device;
        this.owner = owner;
        this.name = null;
        if ("name" in data) this.name = makeBigFirstLetter(data.name);
        this.id = this.device.getGroupId();
        this.device.actionGroups.set(this.id, this);
        this.actions = new Map();
        this.actionGroups = new Map();
        if (data.actions) {
            for (let i = 0; i < data.actions.length; i++) {
                let mainAction;
                if (data.actions[i].copy&&data.actions[i].copy=="true") {
                    mainAction=this.device.actions.has(+data.actions[i].id)?this.device.actions.get(+data.actions[i].id):null;
                    if (mainAction) mainAction.owners.set(this.id,this);
                }
                else mainAction=new MainAction(data.actions[i], this, device);
                this.actions.set(+data.actions[i].id, mainAction);
            }
        }
        if (data.actionGroups) {
            for (let i = 0; i < data.actionGroups.length; i++) {
                let g=new ActionGroup(data.actionGroups[i], this, device);
                this.actionGroups.set(g.id,g);
            }
        }
        this.wasGroupSortable=false;
        this.domElement = null;
    }
    draw() {
        let self = this;
        let actionGroupDom = $("<div class='actionGroup clearFix' id='actionGroup_" + this.id + "'></div>");
        if (this.owner.actionGroups.size>1) {
            let currentLevelGroupDom = $("<div class='currentLevelGroup'></div>");
            for (let actionGroup of this.owner.actionGroups.values()) {
                currentLevelGroupDom.append("<div class='groupOnTheLevel shortcutGroup' id='groupOnTheLevel_"+actionGroup.id+ "' data-id='" + actionGroup.id + "'>" + actionGroup.name + "</div>");
            }
            actionGroupDom.append(currentLevelGroupDom);
        }
        let mainContentDom=$("<div class='mainContent'></div>");
        let pathContainerDom = $("<div class='pathContainer'></div>");
        let path = [];
        path.push($("<a href='#' class='path shortcutGroup' id='path_" + this.id + "' data-id='" + this.id + "'>" + this.name + "</a>"));
        let owner = this.owner;
        while (owner.id != -1) {
            path.unshift($("<a href='#' class='path shortcutGroup' id='path_" + owner.id + "' data-id='" + owner.id + "'>" + owner.name + "-> </a>"));
            owner = owner.owner;
        }
        for (let i = 0; i < path.length; i++) {
            pathContainerDom.append(path[i]);
        }
        mainContentDom.append(pathContainerDom);
        let editContainerDom=$("<div class='editContainer'></div>");
        editContainerDom.append($("<div class='edit change' id='change_"+this.id+"'>Изменить</div>").on("click",function (e) {
            self.device.isChangingNow=true;
            self.device.changeManager.typeOfChanging="inProcess";
            let algorithm = drawManager.activeTheme.algorithm;
            drawManager[algorithm + "GroupAlgorithm"]();
        }));
        editContainerDom.append($("<div class='edit cut active' id='cut" + this.id + "'>Вырезать</div>").on("click", function (e) {
            if (self.owner.actionGroups.size == 1 && self.owner.id == -1) {
                alert("Error: You can't cut this group.");
                return;
            }
            self.device.changeManager.typeOfChanging="insert";
            self.device.changeManager.groupToInsert=self;
            if (self.owner.domElement) self.owner.domElement.remove();
            self.owner.domElement = null;
            for (let actionGroup of self.owner.actionGroups.values()){
                if (actionGroup.domElement) actionGroup.domElement.remove();
                actionGroup.domElement=null;
            }
            self.owner.actionGroups.delete(self.id);
            if (self.owner.actionGroups.size > 0) {
                self.device.showNewGroup(self.owner.actionGroups.values().next().value.id);
            }
            else self.device.showNewGroup(self.owner.id);
            self.owner=null;
        }));
        editContainerDom.append($("<div class='edit active insertInto' id='groupInsertInto_"+this.id+"'>Переместить в</div>").on("click",function (e) {
           let dialogManager=self.device.getDialogManager();
            dialogManager.setHeader("Выберите куда хотите вставить группу");
            dialogManager.fillContent((content)=>{
                for (let actionGroup of self.device.actionGroups.values()){
                    if (actionGroup.id==self.id) continue;
                    content.append($("<div class='groupForInsert block' id='groupForInsert_"+actionGroup.id+"'>"+actionGroup.name+"</div>").on("click",function (e) {
                        let groupForInsert=self.device.actionGroups.get(actionGroup.id);
                        self.owner.actionGroups.delete(self.id);
                        if (self.owner.domElement) self.owner.domElement.remove();
                        self.owner.domElement=null;
                        for (let group of self.owner.actionGroups.values()){
                            if (group.domElement) group.domElement.remove();
                            group.domElement=null;
                        }
                        self.owner=groupForInsert;
                        if (groupForInsert.domElement) groupForInsert.domElement.remove();
                        groupForInsert.domElement=null;
                        groupForInsert.actionGroups.set(self.id,self);
                        for (let group of groupForInsert.actionGroups.values()){
                            if (group.domElement) group.domElement.remove();
                            group.domElement=null;
                        }
                        self.device.getDialogManager().hideDialog();
                        self.device.changeManager.typeOfChanging="inProcess";
                        self.device.showNewGroup(self.id);
                    }));
                }
            });
            dialogManager.showDialog("block");

        }));
        editContainerDom.append($("<div class='edit active createGroup' id='createGroup_"+this.id+"'>Создать группу</div>").on("click",(e)=>{
            let dialogManager=self.device.getDialogManager();
            dialogManager.setHeader("Задайте имя и расположение группы");
            dialogManager.fillContent((content)=>{
                content.append($("<p>Введите имя группы:</p><form name='main'>" +
                    "<input type='text' class='newGroupName'>" +
                    "<p>Выберите местоположение группы:</p>" +
                    "<p><label><input type='radio' name='place' value='onTheLevel' checked>На одном уровне с группой</label></p>" +
                    "<p><label><input type='radio' name='place' value='inGroup'>В текущую группу</label></p></form>" +
                    "<h2>Выбранные элементы будут скопированы в новую группу, иначе будет создана пустая группа:</h2>"));
                let actionContainer=$("<div class='newGroupActionContainer'></div>");
                for (let action of this.device.actions.values()){
                    if (!action.owners) continue;
                    actionContainer.append($("<div class='newGroupAction' id='newGroupAction_"+action.id+"'><div class='outerName'>"+action.name+
                       "</div><div class='outerCheckbox'><label class='checkbox'><input type='checkbox' name='isCopy' data-id='"+action.id+"'></label></div></div>"));

                }
                content.append(actionContainer);
                content.append($("<input type='submit' value='Создать группу'>").on("click",(e)=>{
                    let groupName=content.find(".newGroupName").val();
                    if (groupName.length==0){
                        alert("Введите имя группы!");
                        return;
                    }
                    let owner=content.find("form[name=main] input[name=place]:checked").val()=="onTheLevel"?this.owner:this;
                    let newGroup=new ActionGroup({name:groupName},owner,this.device);
                    owner.actionGroups.set(newGroup.id,newGroup);
                    content.find("input[name=isCopy]:checked").each((index,domElem)=>{
                        let action=this.device.actions.get(+domElem.dataset.id);
                        action.owners.set(newGroup.id,newGroup);
                        newGroup.actions.set(action.id,action);
                    });
                    if (owner.domElement) owner.domElement.remove();
                    owner.domElement=null;
                    for (let actionGroup of owner.actionGroups.values()){
                        if (actionGroup.domElement) actionGroup.domElement.remove();
                        actionGroup.domElement=null;
                    }
                    this.device.changeManager.typeOfChanging="inProcess";
                    this.device.showNewGroup(newGroup.id);
                    dialogManager.hideDialog();
                }));
            });
            dialogManager.showDialog("form");
        }));
        editContainerDom.append($("<div class='edit active delete' id='delete_"+this.id+"'>Удалить</div>").on("click",(e)=>{
            let dialogManager=this.device.getDialogManager();
            if (this.actionGroups.size>0){
                dialogManager.setHeader("Ошибка!");
                dialogManager.fillContent("Сначала Вам необходимо удалить или переместить все вложенные группы!");
                dialogManager.showDialog("error");
                return;
            }
            let unique=[];
            for (let action of this.actions.values()){
                if (action.owners.size==1)unique.push(action)
            }
            if (unique.length>0){
                dialogManager.setHeader("Вам необходимо скопировать или переместить следующие элементы:");
                let elements="";
                for (let action of unique){
                    elements+=action.name+", ";
                }
                elements=elements.substring(0,elements.length-2);
                dialogManager.fillContent(elements);
                dialogManager.showDialog("error");
                return;
            }
            if (this.owner.actionGroups.size == 1 && this.owner.id == -1) {
                alert("Error: You can't cut this group.");
                return;
            }
            if (!confirm("Группа будет удалена, Вы уверены?")) return;
            this.device.changeManager.typeOfChanging="inProcess";
            for (let actionGroup of this.owner.actionGroups.values()){
                if (actionGroup.domElement) actionGroup.domElement.remove();
                actionGroup.domElement=null;
            }
            this.owner.actionGroups.delete(this.id);
            if (this.owner.domElement) this.owner.domElement.remove();
            this.owner.domElement=null;
            for (let action of this.actions.values()){
                action.owners.delete(this.id);
            }
            if (this.owner.actionGroups.size > 0) {
                this.device.showNewGroup(this.owner.actionGroups.values().next().value.id);
            }
            else this.device.showNewGroup(this.owner.id);
            this.device.actionGroups.delete(this.id);
        }));
        editContainerDom.append($("<div class='edit active save' id='save_"+this.id+"'>Сохранить</div>").on("click",function (e) {
            self.device.isChangingNow=false;
            self.device.changeManager.clear();
            for (let group of self.device.actionGroups.values()){
                if (group.domElement) group.domElement.remove();
                group.domElement=null;
            }
            self.device.showNewGroup(self.id);
            let device={};
            device.id=self.device.id;
            device.name=self.device.name;
            device.thingGroup=self.device.thingGroup;
            device.updateTime=self.device.updateTime/1000+"";
            device.actionGroups=[];
            fillActionGroups(self.device.actionGroups.get(-1).actionGroups.values(),device.actionGroups);
            for (let action of self.device.actions.values()){
                if (action.isDescribed) action.isDescribed=false;
            }
            dataJson=JSON.stringify(device);
            let dev={"id":self.device.id,'line': dataJson};
            $.post("upgradeline", {"newLine":JSON.stringify(dev)}, function (res) {
            });
            /*
            check(JSON.parse($("#data_in_json").get(0).dataset.device),device,"root");
            function check(obj1,obj2,name) {
                for (let val in obj1){
                    if (typeof (obj1[val])!="object"){
                        //console.log(val+"="+obj1[val]);
                        if ((""+obj1[val]).toUpperCase()!=(""+obj2[val]).toUpperCase()){
                            console.log("obj1:"+val+"="+obj1[val]+"; obj2:"+obj2[val]+" name="+name);
                            return;
                        }
                    }
                    else {
                        if (obj1.name) name=obj1.name;
                        check(obj1[val],obj2[val],name);
                    }
                }
            }
            */
            function fillActionGroups(actionGroupsIn,actionGroupsOut) {
                for (let actionGroupIn of actionGroupsIn){
                    let actionGroupOut={id:actionGroupIn.id,name:actionGroupIn.name};
                    if (actionGroupIn.actions.size>0){
                        actionGroupOut.actions=[];
                        for (let actionIn of actionGroupIn.actions.values()){
                            if (actionIn.isDescribed){
                                actionGroupOut.actions.push({id:actionIn.id,copy:"true"});
                            }
                            else {
                                let actionOut = {};
                                actionOut.id = actionIn.id;
                                actionOut.name = actionIn.name;
                                actionOut.isChangeable = actionIn.isChangeable + "";
                                actionOut.format = actionIn.format;
                                if (actionIn.description) actionOut.description = actionIn.description;
                                actionOut.isNeedStatistics = actionIn.isNeedStatistics + "";
                                if (actionIn.submitName) actionOut.submitName = actionIn.submitName;
                                if (actionIn.range) {
                                    actionOut.range = [];
                                    for (let itemIn of actionIn.range.values()) {
                                        let itemOut = {};
                                        itemOut.id = itemIn.id;
                                        if (itemIn.color) itemOut.color = itemIn.color;
                                        if (itemIn.name) itemOut.name = itemIn.name;
                                        if (itemIn.from != null) itemOut.from = itemIn.from + "";
                                        if (itemIn.to != null) itemOut.to = itemIn.to + "";
                                        actionOut.range.push(itemOut);
                                    }
                                }
                                if (actionIn.supportActions) {
                                    actionOut.support = [];
                                    for (let supportActionIn of actionIn.supportActions.values()) {
                                        let supportActionOut = {};
                                        supportActionOut.id = supportActionIn.id;
                                        supportActionOut.name = supportActionIn.name;
                                        supportActionOut.isChangeable = supportActionIn.isChangeable + "";
                                        supportActionOut.format = supportActionIn.format;
                                        if (supportActionIn.isDeactivator) supportActionOut.isDeactivator = supportActionIn.isDeactivator + "";
                                        supportActionOut.isIndividual = supportActionIn.isIndividual + "";
                                        supportActionOut.isNeedStatistics = supportActionIn.isNeedStatistics + "";
                                        if (supportActionIn.description) supportActionOut.description = supportActionIn.description;
                                        if (supportActionIn.submitName) supportActionOut.submitName = supportActionIn.submitName;
                                        if (supportActionIn.active) supportActionOut.active = supportActionIn.active;
                                        if (supportActionIn.range) {
                                            supportActionOut.range = [];
                                            for (let itemIn of supportActionIn.range.values()) {
                                                let itemOut = {};
                                                itemOut.id = itemIn.id;
                                                if (itemIn.color) itemOut.color = itemIn.color;
                                                if (itemIn.name) itemOut.name = itemIn.name;
                                                if (itemIn.from != null) itemOut.from = itemIn.from + "";
                                                if (itemIn.to != null) itemOut.to = itemIn.to + "";
                                                supportActionOut.range.push(itemOut);
                                            }
                                        }
                                        actionOut.support.push(supportActionOut);
                                    }
                                }
                                actionGroupOut.actions.push(actionOut);
                                actionIn.isDescribed=true;
                            }
                        }
                    }
                    if (actionGroupIn.actionGroups.size>0){
                        actionGroupOut.actionGroups=[];
                        fillActionGroups(actionGroupIn.actionGroups.values(),actionGroupOut.actionGroups);
                    }
                    actionGroupsOut.push(actionGroupOut);
                }
            }

        }));
        editContainerDom.append($("<div class='edit active cancel' id='cancel"+this.id+"'>Отменить</div>").on("click",function (e) {
            self.device.domElement.remove();
            drawManager = new DrawManager(new Device(JSON.parse(dataJson)));
            let activeGroup=drawManager.device.actionGroups.get(self.id)?drawManager.device.actionGroups.get(self.id):drawManager.device.actionGroups.get(0);
            drawManager.device.activeGroup=activeGroup;
            drawManager.draw();

        }));
        editContainerDom.append($("<div class='edit active reset' id='reset_"+this.id+"'>Заводские настройки</div>").on("click",function (e) {
            $.post("getinitialline",{"id":self.device.id},function (res) {
                dataJson=res;
                self.device.domElement.remove();
                drawManager = new DrawManager(new Device(JSON.parse(dataJson)));
                drawManager.draw();
            });
        }));
        editContainerDom.append($("<div class='edit insert insertInGroup' id='insertInGroup_"+this.id+"'>Вставить в гуппу</div>").on("click",function (e) {
            let group=self.device.changeManager.groupToInsert;
            self.device.changeManager.groupToInsert=null;
            self.domElement.remove();
            self.domElement=null;
            self.actionGroups.set(group.id,group);
            group.owner=self;
            for (let actionGroup of self.actionGroups.values()){
                if (actionGroup.domElement) actionGroup.domElement.remove();
                actionGroup.domElement=null;
            }
            self.device.changeManager.typeOfChanging="inProcess";
            self.device.showNewGroup(self.id);
        }));
        editContainerDom.append($("<div class='edit insert insertOnTheLevel' id='insertOnTheLevel_"+this.id+"'>Вставить на один уровень с группой</div>").on("click",function (e) {
            let group=self.device.changeManager.groupToInsert;
            self.device.changeManager.groupToInsert=null;
            group.owner=self.owner;
            if (self.owner.domElement) self.owner.domElement.remove();
            self.owner.domElement=null;
            self.owner.actionGroups.set(group.id,group);
            for (let actionGroup of self.owner.actionGroups.values()){
                if (actionGroup.domElement) actionGroup.domElement.remove();
                actionGroup.domElement=null;
            }
            self.device.changeManager.typeOfChanging="inProcess";
            self.device.showNewGroup(group.id);
        }));
        editContainerDom.append($("<div class='edit insertAction' id='insertAction_"+this.id+"'>Вставить</div>").on("click",(e)=>{
            let a=this.device.changeManager.actionToInsert;
            a.owners.set(this.id,this);
            this.actions.set(a.id,a);
            this.domElement.remove();
            this.domElement=null;
            this.device.changeManager.typeOfChanging="inProcess";
            this.device.showNewGroup(this.id);
        }));
        mainContentDom.append(editContainerDom);
        if (this.name == null) {
            if (this.id != 0) mainContentDom.append("<h2>Unknown name</h2>");
        }
        else mainContentDom.append("<h2>" + this.name + "</h2>");
        if (this.actionGroups.size > 0) {
            let actionGroupContainer = $("<div class='actionGroupContainer'></div>");
            for (let actionGroup of this.actionGroups.values()) {
                actionGroupContainer.append("<div id='groupInGroup_" + actionGroup.id + "' class='groupInGroup shortcutGroup' data-id='" + actionGroup.id + "'>" + actionGroup.name + "</div>");
            }
            mainContentDom.append(actionGroupContainer);
        }
        if (this.actions.size > 0) {
            let actionContainer = $("<div class='actionContainer'></div>");
            for (let action of this.actions.values()) {
                actionContainer.append(action.draw(this.id));
            }
            mainContentDom.append(actionContainer);
        }
        actionGroupDom.append(mainContentDom);
        this.domElement = actionGroupDom;
        return actionGroupDom;

    }
    showEditButtons(){
        if (this.device.isChangingNow) {
            if (this.actions.size>0){
                let actionContainer = this.domElement.find(".actionContainer");
                actionContainer.empty();
                actionContainer.addClass("sortAction");
                let actionAvatarContainerDom=$("<div class='actionAvatarContainer'></div>");
                for (let action of this.actions.values()) {
                    action.domElement.get(this.id).hide();
                    let actionAvatarDom = $("<div class='actionAvatar' id='aV_" + action.id + "'><p>" + action.name + "</p></div>");
                    let editActionContainerDom = $("<div class='editContainerAction'></div>");
                    if (action.owners.size>1) editActionContainerDom.append($("<div class='editAction deleteAction' id='deleteAction_"+action.id+"'>Удалить</div>").on("click",(e)=>{
                        if (!confirm("Вы действительно хотите удалить группу?")) return;
                        this.actions.delete(action.id);
                        action.owners.delete(this.id);
                        if (action.domElement.has(this.id)) {
                            action.domElement.get(this.id).remove();
                            action.domElement.delete(this.id);
                        }
                        this.domElement.find("#aV_"+action.id).remove();
                    }));
                    editActionContainerDom.append($("<div class='editAction copyAction' id='copyAction_" + action.id + "'>Копировать</div>").on("click", (e)=> {
                        let dialogManager = this.device.getDialogManager();
                        dialogManager.setHeader("Выберите группу для копирования:");
                        dialogManager.fillContent((content)=> {
                            for (let group of this.device.actionGroups.values()) {
                                if (action.owners.has(group.id) || group.id === -1) continue;
                                content.append($("<div class='groupForInsert block' id='groupForInsert_" + group.id + "'>" + group.name + "</div>").on("click", (e)=> {
                                    this.device.getDialogManager().hideDialog();
                                    action.owners.set(group.id, group);
                                    group.actions.set(action.id, action);
                                    if (group.domElement) group.domElement.remove();
                                    group.domElement = null;
                                    this.device.changeManager.typeOfChanging = "inProcess";
                                    this.device.showNewGroup(group.id);
                                }));
                            }
                        });
                        dialogManager.showDialog("block");
                    }));
                    editActionContainerDom.append($("<div class='editAction insertIntoAction' id='insertInto_" + action.id + "'>Переместить в</div>").on("click", (e)=> {
                        let dialogManager = this.device.getDialogManager();
                        dialogManager.setHeader("Выберите группу для перемещения:");
                        dialogManager.fillContent((content)=> {
                            for (let group of this.device.actionGroups.values()) {
                                if (action.owners.has(group.id) || group.id === -1) continue;
                                content.append($("<div class='groupForInsert block' id='groupForInsert_" + group.id + "'>" + group.name + "</div>").on("click", (e)=> {
                                    this.device.getDialogManager().hideDialog();
                                    let aG = this.device.activeGroup;
                                    action.domElement.get(aG.id).remove();
                                    action.domElement.delete(aG.id);
                                    this.domElement.find("#aV_"+action.id).remove();
                                    aG.actions.delete(action.id);
                                    action.owners.delete(aG.id);
                                    action.owners.set(group.id, group);
                                    group.actions.set(action.id, action);
                                    if (group.domElement) group.domElement.remove();
                                    group.domElement = null;
                                    this.device.changeManager.typeOfChanging = "inProcess";
                                    this.device.showNewGroup(group.id);
                                }));
                            }
                        });
                        dialogManager.showDialog("block");
                    }));
                    editActionContainerDom.append($("<div class='editAction cutAction' id='cutAction_" + action.id + "'>Вырезать</div>").on("click", (e)=> {
                        let aG = this.device.activeGroup;
                        if (action.domElement.has(aG.id)) {
                            action.domElement.get(aG.id).remove();
                            action.domElement.delete(aG.id);
                        }
                        aG.actions.delete(action.id);
                        this.domElement.find("#aV_"+action.id).remove();
                        this.device.changeManager.actionToInsert = action;
                        this.device.changeManager.typeOfChanging = "insertAction";
                        aG.showEditButtons();
                        action.owners.delete(aG.id);
                    }));
                    actionAvatarDom.prepend(editActionContainerDom);
                    actionAvatarContainerDom.append(actionAvatarDom);
                }
                actionContainer.append(actionAvatarContainerDom);
                let sortableElem=this.domElement.find(".actionAvatarContainer");
                sortableElem.sortable({ tolerance:"pointer",distance:15,update:(e,ui)=>{
                    this.actions=new Map();
                    for (let stringId of sortableElem.sortable("toArray")){
                        let id=+stringId.substring(3);
                        this.actions.set(id,this.device.actions.get(id));
                    }
                }});
            }
            if (this.owner.actionGroups.size>0&&!this.wasGroupSortable){
                this.wasGroupSortable=true;
                let sortableElem=this.domElement.find(".currentLevelGroup");
                sortableElem.sortable({tolerance:"pointer",distance:15,update:(e,ui)=>{
                    this.owner.actionGroups=new Map();
                    for (let strId of sortableElem.sortable("toArray")){
                        let id=+strId.substring(16);
                        this.owner.actionGroups.set(id,this.device.actionGroups.get(id));
                        if (id==this.id) continue;
                        if (this.owner.actionGroups.get(id).domElement) this.owner.actionGroups.get(id).domElement.remove();
                        this.owner.actionGroups.get(id).domElement=null;
                    }
                    this.device.showNewGroup(this.id);
                }});
            }
            this.domElement.find(".editContainer .edit").hide();
            this.domElement.find(".editContainerAction").hide();
            switch (this.device.changeManager.typeOfChanging){
                case "inProcess":
                    this.domElement.find(".editContainer .active").show();
                    this.domElement.find(".editContainerAction").show();
                    break;
                case "insert":
                    this.domElement.find(".editContainer .insert").show();
                    break;
                case "insertAction":
                    this.domElement.find(".editContainer .insertAction").show();
                    break;

            }
        }
        else {
            this.domElement.find(".editContainer .edit").hide();
            this.domElement.find(".editContainer .change").show();
            this.domElement.find(".editContainerAction").hide();
        }
    }
}
class Device {
    constructor(data) {
        this.id = +data.id;
        this.groupId=-2;
        this.name = makeBigFirstLetter(data.name);
        this.thingGroup = data.thingGroup;
        this.updateTime = +data.updateTime * 1000;
        this.actions = new Map();
        this.actionGroups = new Map();
        new ActionGroup({"name":"Корневая группа","actionGroups": data.actionGroups}, null, this);
        this.activeGroup=this.actionGroups.get(0);
        for (let group of this.actionGroups.values()){
            for (let entry of group.actions){
                if (!entry[1]){
                    let mainAction=this.actions.get(entry[0]);
                    mainAction.owners.set(group.id,group);
                    group.actions.set(entry[0],mainAction);
                }
            }
        }
        this.isChangingNow=false;
        this.changeManager={typeOfChanging:null,groupToInsert:null,actionToInsert:null,
        clear:function () {
            this.typeOfChanging=null;
            this.groupToInsert=null;
            this.actionToInsert=null;
        }
        };
        this.dialogManager=null;
        this.domElement = null;
    }
getGroupId(){
    return ++this.groupId;
}
    draw() {
        let deviceDom = $("<div class='device' id='device_" + this.id + "'><div class='groupContainer'></div></div>");
        let dialogContainerDom=$("<div class='dialogContainer'><div class='dialog'><h1></h1><div class='content'></div></div></div>");
        let closeDom=$("<div class='close'>X</div>");
        closeDom.on("click",(e)=>{
            this.dialogManager.hideDialog();
        });
        dialogContainerDom.find(".dialog").append(closeDom);
        deviceDom.append(dialogContainerDom);
        let self = this;
        deviceDom.on("click", ".shortcutGroup", function (e) {
            let shortcutGroup = $(this);
            e.preventDefault();
            self.showNewGroup(+shortcutGroup.attr("data-id"));
        });
        this.domElement = deviceDom;
        return deviceDom;
    }

    updateOnTime() {
        let self = this;
        $.post("getdata", {device_id: self.id}, this.insertValuesInActions(), 'json');
        let timerId = setTimeout(function update() {
            $.post("getdata", {device_id: self.id}, self.insertValuesInActions(), 'json');
            timerId = setTimeout(update, self.updateTime);
        }, self.updateTime);
    }

    insertValuesInActions() {
        let self = this;
        return function (data) {
            if (data.thing_id == self.id) {
                let actions = data.actions;
                for (let i = 0; i < actions.length; i++) {
                    self.actions.get(+actions[i].id).setValue(actions[i].value);
                }
            }
        }
    }

    showNewGroup(id) {
        if (this.activeGroup.domElement) this.activeGroup.domElement.detach();
        this.activeGroup = this.actionGroups.get(+id);
        let algorithm = drawManager.activeTheme.algorithm;
        drawManager[algorithm + "GroupAlgorithm"]();
        //$.post("getdata", {device_id: this.id}, this.insertValuesInActions(), 'json');-------------------here
    }
    getDialogManager(){
        if (this.dialogManager!=null) return this.dialogManager;
        let self=this;
        if (self.domElement==null){
            alert("Error!");
            return;
        }
        return this.dialogManager={
            dialog:self.domElement.find(".dialogContainer .dialog"),
            dialogContainer:self.domElement.find(".dialogContainer"),
            setHeader:function (text="") {
                this.dialog.find("h1").text(text);
            },
            fillContent:function (content) {
                let contentDom=this.dialog.find(".content");
                if (typeof content=="object"){
                    for (let item of content){
                        contentDom.append(item);
                    }
                }
                else if (typeof content=="function"){
                    content(contentDom);
                }
                else contentDom.text(content);
            },
            showDialog:function (type) {
                drawManager[drawManager.activeTheme.algorithm+"ShowDialog"](type);
            },
            hideDialog:function () {
                this.setHeader();
                this.dialog.removeAttr("class");
                this.dialog.addClass("dialog");
                this.dialogContainer.removeAttr("class");
                this.dialogContainer.addClass("dialogContainer");
                let content=this.dialog.find(".content");
                content.removeAttr("class");
                content.addClass("content");
                content.empty();
                self.domElement.find(".dialogContainer").hide();
            }
        };
    }

}


class Theme {
    constructor() {
        this.name = "normal";
        this.allLines = 2;
        this.algorithm = "simple";
        this.rules = null;
    }
}

class DrawManager {
    constructor(device) {
        this.device = device;
        this.themes = [];
        this.themes.push(new Theme());
        this.activeTheme = this.themes[0];
        this.deviceDomWidth = null;
        this.dialogManager=null;
    }

    start() {
        this.device.updateOnTime();
    }

    draw() {
        $("body").addClass(drawManager.activeTheme.name+"-theme");
        $("h1.device_name").text(this.device.name);
        this[this.activeTheme.algorithm + "Algorithm"]();
    }

    simpleAlgorithm() {
        let deviceDom = this.device.draw();
        let section = $("section.container");
        this.deviceDomWidth = document.documentElement.clientWidth - 200;
        deviceDom.css({
            "width": this.deviceDomWidth + "px",
            "min-height": section.height() + "px"
        });
        section.append(deviceDom);
        deviceDom.find(".dialogContainer").hide();
        this[this.activeTheme.algorithm + "GroupAlgorithm"]();

    }

    simpleGroupAlgorithm() {
        if (this.device.activeGroup.domElement) {
            this.device.activeGroup.showEditButtons();
            this.device.domElement.find(".groupContainer").append(this.device.activeGroup.domElement);
            return;
        }
        let activeGroup = this.device.activeGroup;
        activeGroup.isChanging=false;
        let actionGroupDom = activeGroup.draw();
        let containerWidth = this.deviceDomWidth;
        let currentLevelGroupDom=actionGroupDom.find(".currentLevelGroup");
        if (currentLevelGroupDom.length>0){
            containerWidth=this.deviceDomWidth-200;
        }
        let mainContentDom=actionGroupDom.find(".mainContent");
        mainContentDom.css({
            "width": containerWidth + "px",
            "min-height": $("section.container").height() + "px"
        });
        if (activeGroup.actions.size > 0) {
            let actionWidth = Math.floor(containerWidth / this.activeTheme.allLines) - this.activeTheme.allLines * 12;
            for (let action of activeGroup.actions.values()){
                action.domElement.get(activeGroup.id).css({
                    "flex-basis":actionWidth+"px"
                })
            }
            let supportActionDom = mainContentDom.find(".supportAction");
            supportActionDom.hide();
        }
        actionGroupDom.find("#groupOnTheLevel_"+activeGroup.id).css({
            "background": "black"
        });
        activeGroup.wasShownAvatars=false;
        activeGroup.wasGroupSortable=false;
        activeGroup.showEditButtons();
        this.device.domElement.find(".groupContainer").append(actionGroupDom);
        for (let action of activeGroup.actions.values()) {
            if (!action.supportActions) continue;
            let activeSupportActions = [];
            for (let supportAction of action.supportActions.values()) {
                if (supportAction.active == null) activeSupportActions.push(supportAction);
            }
            this[this.activeTheme.algorithm + "SupportAlgorithm"](activeSupportActions, action.domElement.get(activeGroup.id).width());
        }
    }

    simpleSupportAlgorithm(supportActions, actionWidth) {
        let supportActionWidth = Math.floor(actionWidth / supportActions.length);
        if (supportActionWidth < 250) {
            let w = Math.floor(actionWidth / 250);
            supportActionWidth = Math.floor(actionWidth / w) - w * 12;
        }
        else supportActionWidth -= supportActions.length * 12;
        for (let m = 0; m < supportActions.length; m++) {
            let supportActionDom = supportActions[m].domElement.get(this.device.activeGroup.id);
            supportActionDom.css({
                "width": supportActionWidth + "px",
            });
            supportActionDom.show();
        }
    }
    simpleShowDialog(type){
        let dialogContainerDom=this.device.domElement.find(".dialogContainer");
        switch (type){
            case "block":
                dialogContainerDom.find(".content").addClass("block-content");
                break;
            case "form":
                dialogContainerDom.find(".content").addClass("form-content");
                break;
            case "string":
                dialogContainerDom.find(".content").addClass("string-content");
                break;
            case "error":
                dialogContainerDom.addClass("error");
                break;
        }
        dialogContainerDom.show();
    }

}


//Начало работы программы---------------------------------------------------------------
var dataJson =$("#data_in_json").get(0).dataset.device;
var drawManager = new DrawManager(new Device(JSON.parse(dataJson)));
drawManager.draw();
//drawManager.start();