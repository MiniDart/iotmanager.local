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
    if (!word) return null;
    let l = word[0].toUpperCase();
    return l + word.substring(1);
}
function rankSort(a, b) {
    return (a.rank - b.rank);
}
function fillActionGroups(actionGroupsIn,actionGroupsOut,deviceFrom) {
    for (let actionGroupIn of actionGroupsIn){
        let actionGroupOut={
            id:actionGroupIn.id,
            name:actionGroupIn.name,
            allLines:actionGroupIn.allLines
        };
        if (actionGroupIn.actions.size>0){
            actionGroupOut.actions=[];
            for (let actionIn of actionGroupIn.actions.values()){
                if (actionIn.isDescribed){
                    actionGroupOut.actions.push({id:actionIn.id,copy:"true"});
                }
                else {
                    let actionOut = {};
                    actionOut.id = actionIn.id;
                    actionOut.name = deviceFrom?deviceFrom.name+" - "+actionIn.name:actionIn.name;
                    actionOut.isChangeable = actionIn.isChangeable;
                    actionOut.format = actionIn.format;
                    if (actionIn.description) actionOut.description = actionIn.description;
                    if (actionIn.submitName) actionOut.submitName = actionIn.submitName;
                    if (actionIn.range) {
                        actionOut.range = [];
                        for (let itemIn of actionIn.range.values()) {
                            let itemOut = {};
                            itemOut.id = itemIn.id;
                            if (itemIn.name) itemOut.name = itemIn.name;
                            if (itemIn.from) itemOut.from = itemIn.from + "";
                            if (itemIn.to) itemOut.to = itemIn.to + "";
                            actionOut.range.push(itemOut);
                        }
                    }
                    if (actionIn.supportActions) {
                        actionOut.support = [];
                        for (let supportActionIn of actionIn.supportActions.values()) {
                            let supportActionOut = {};
                            supportActionOut.id = supportActionIn.id;
                            supportActionOut.name = supportActionIn.name;
                            supportActionOut.isChangeable = supportActionIn.isChangeable;
                            supportActionOut.format = supportActionIn.format;
                            supportActionOut.isIndividual = supportActionIn.isIndividual;
                            if (supportActionIn.description) supportActionOut.description = supportActionIn.description;
                            if (supportActionIn.submitName) supportActionOut.submitName = supportActionIn.submitName;
                            if (supportActionIn.active) supportActionOut.active = supportActionIn.active;
                            if (supportActionIn.range) {
                                supportActionOut.range = [];
                                for (let itemIn of supportActionIn.range.values()) {
                                    let itemOut = {};
                                    itemOut.id = itemIn.id;
                                    if (itemIn.name) itemOut.name = itemIn.name;
                                    if (itemIn.from) itemOut.from = itemIn.from + "";
                                    if (itemIn.to) itemOut.to = itemIn.to + "";
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
            fillActionGroups(actionGroupIn.actionGroups.values(),actionGroupOut.actionGroups,deviceFrom);
        }
        actionGroupsOut.push(actionGroupOut);
    }
}
class Item {
    constructor(data, owner) {
        this.owner = owner;
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
            if (!this.from) {
                return (val < this.to);
            }
            if (!this.to) {
                return (val > this.from);
            }
            return (val > this.from && val < this.to);
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
    }
}

class Action {
    constructor(data, device) {
        this.device = device;
        this.name = makeBigFirstLetter(data.name);
        this.format = data.format;
        this.isChangeable = data.isChangeable;
        this.submitName = null;
        if ("submitName" in data) this.submitName = makeBigFirstLetter(data.submitName);
        this.id = +data.id;
        device.actions.set(this.id, this);
        this.description = null;
        if ("description" in data) this.description = makeBigFirstLetter(data.description);
        this.domElement = new Map();
    }

    draw() {
        let actionDom = $("<div><h3>" + this.name + "</h3></div>");
        if (this.description != null) actionDom.append("<div class='description'>" + this.description + "</div>");
        actionDom.append("<div class='valueContainer'><p>Текущее значение:</p><div class='value'></div></div>");
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
                    actionDom.append("<p>Введите новое значение" + (from || to ? " в диапозоне" : "") + (from ? " от " + from : "") + (to ? " до " + to : "") + ":</p>");
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
                console.log("no");
                alert("Error: Write a correct value!");
                return;
            }
            console.log("yes");
            return val;
        }
    }

}

class SupportAction extends Action {
    constructor(data, owner, device) {
        super(data, device);
        this.owner=owner;
        this.isIndividual = data.isIndividual;
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
                let actions = [];
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
                actions.push(supportAction);
                $.ajax({
                    url: self.device.id+"-command",
                    type: 'PUT',
                    success: (data)=>{},
                    data: {'newData': JSON.stringify(actions)},
                    contentType: 'json'
                });
            });
            supportActionDom.append(submit);
        }
        supportActionDom.find(".newValue").addClass("support");
        this.domElement.set(id,supportActionDom);
        return supportActionDom;
    }

    setValue(val,groupId) {
        if (!this.domElement.has(groupId)) return;
        this.domElement.get(groupId).find(".value.support").text(val);
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
                let actions = [];
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
                actions.push(action);
                if (self.supportActions != null) {
                    for (let supportActionSelf of self.supportActions.values()) {
                        let value;
                        if (!supportActionSelf.isChangeable || supportActionSelf.domElement.get(self.device.activeGroup.id).css("display") == "none" || (value = supportActionSelf.getValue(".newValue.support")) == "none") continue;
                        let supportAction = {};
                        supportAction.id = supportActionSelf.id;
                        supportAction.value = value;
                        actions.push(supportAction);
                    }
                }
                $.ajax({
                    url: self.device.id+"-command",
                    type: 'PUT',
                    success: (data)=>{},
                    data: {'newData': JSON.stringify(actions)},
                    contentType: 'json'
                });
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
                let algorithm = drawManager.algorithm;
                drawManager[algorithm + "SupportAlgorithm"](supportActions);
            });
        }
        this.domElement.set(id,mainActionDom);
        return mainActionDom;
    }

    setValue(val,groupId) {
        if (!this.domElement.has(groupId)) return;
        this.domElement.get(groupId).find(".value.main").text(val);
    }
    setName(name){
        this.name=makeBigFirstLetter(name);
    }

}
class ActionGroup {
    constructor(data, owner, device) {
        this.device = device;
        this.owner = owner;
        this.id = this.device.getGroupId();
        this.name = "Группа "+this.id;
        if ("name" in data) this.name = makeBigFirstLetter(data.name);
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
                else  if (this.device.actions.has(+data.actions[i].id)){
                    mainAction=this.device.actions.get(+data.actions[i].id);
                    mainAction.owners.set(this.id,this);
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
        this.jsonForUpdateActions=null;
        this.timerId=null;
        this.domElement = null;
        this.allLines=data.allLines?data.allLines:2;

    }
    draw() {
        let self = this;
        let actionGroupDom = $("<div class='actionGroup' id='actionGroup_" + this.id + "'></div>");
        if (!this.device.isChangingNow&&this.owner.actionGroups.size>1) {
            let currentLevelGroupDom = $("<div class='currentLevelGroup'></div>");
            for (let actionGroup of this.owner.actionGroups.values()) {
                currentLevelGroupDom.append("<div class='groupOnTheLevel shortcutGroup' id='groupOnTheLevel_"+actionGroup.id+ "' data-id='" + actionGroup.id + "'>" + actionGroup.name + "</div>");
            }
            actionGroupDom.append(currentLevelGroupDom);
        }
        if (this.device.isChangingNow){
            let sortableElem=$("<div class='currentLevelGroup'></div>");
            for (let actionGroup of this.owner.actionGroups.values()) {
                sortableElem.append("<div class='groupOnTheLevel shortcutGroup' id='groupOnTheLevel_"+actionGroup.id+ "' data-id='" + actionGroup.id + "' data-dev-id='"+self.device.id+"'>" + actionGroup.name + "</div>");
            }
            sortableElem.sortable({tolerance:"pointer",distance:15,update:(e,ui)=>{
                if (drawManager.secondDevice&&drawManager.wasDroppedAction){
                    drawManager.wasDroppedAction=false;
                    return;
                }
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
            actionGroupDom.append(sortableElem);
        }
        let mainContentDom=$("<div class='mainContent'></div>");
        let pathContainerDom = $("<div class='pathContainer'></div>");
        let path = [];
        path.push($("<a href='#' class='path shortcutGroup' id='path_" + this.id + "' data-id='" + this.id + "'>" + this.name + "</a>"));
        let owner = this.owner;
        while (owner.id >=0) {
            path.unshift($("<a href='#' class='path shortcutGroup' id='path_" + owner.id + "' data-id='" + owner.id + "'>" + owner.name + "-> </a>"));
            owner = owner.owner;
        }
        for (let i = 0; i < path.length; i++) {
            pathContainerDom.append(path[i]);
        }
        mainContentDom.append(pathContainerDom);
        let editContainerDom=$("<div class='editContainer'></div>");
        editContainerDom.append($("<div class='edit change' id='change_"+this.id+"'>Изменить структуру</div>").on("click",function (e) {
            self.device.isChangingNow=true;
            self.device.changeManager.typeOfChanging="inProcess";
            self.device.showNewGroup(self.id);
        }));
        editContainerDom.append($("<div class='edit changeAppearance'>Изменить внешний вид</div>").on("click",(e)=>{
            self.device.isChangingAppearance=true;
            self.device.showNewGroup(self.id);
        }));
        let columnAmountDom=$("<div class='edit appearance chooseColumnAmount outerOfNumber'>Количество столбцов</div>");
        let numberContainerDom=$("<div class='numberContainer'></div>");
        let possibleAmount=Math.floor((drawManager.deviceDomWidth-(self.owner.actionGroups.size>1?drawManager.widthToDeduct:0))/300);
        for (let i=0;i<possibleAmount;i++){
            numberContainerDom.append("<div class='number"+(self.allLines==(i+1)?" equal":"")+"'>"+(i+1)+"</div>");
        }
        columnAmountDom.append(numberContainerDom);
        columnAmountDom.on("click",".number",function (e){
            let num=$(this).text();
            self.setAllLines(num);
            self.device.showNewGroup(null);
        });
        editContainerDom.append(columnAmountDom);
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
           let dialogManager=drawManager.getDialogManager();
            dialogManager.setHeader("Выберите куда хотите вставить группу");
            dialogManager.fillContent((content)=>{
                let childNodes={};
                if (self.actionGroups.size>0) findChildNodes(self.actionGroups.values());
                function findChildNodes(actionGroups) {
                    for (let actionGroup of actionGroups){
                        childNodes[actionGroup.id]=true;
                        if (actionGroup.actionGroups.size>0) findChildNodes(actionGroup.actionGroups.values());
                    }
                }
                for (let actionGroup of self.device.actionGroups.values()){
                    if (actionGroup.id==self.id) continue;
                    if (actionGroup.id in childNodes) continue;
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
                        drawManager.getDialogManager().hideDialog();
                        self.device.changeManager.typeOfChanging="inProcess";
                        self.device.showNewGroup(self.id);
                    }));
                }
            });
            dialogManager.showDialog("block");

        }));
        editContainerDom.append($("<div class='edit active createGroup' id='createGroup_"+this.id+"'>Создать группу</div>").on("click",(e)=>{
            let dialogManager=drawManager.getDialogManager();
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
        editContainerDom.append($("<div class='edit active renameGroup' id='renameGroup_"+this.id+"'>Переименовать группу</div>").on("click",(e)=>{
            let dialogManager=drawManager.getDialogManager();
            dialogManager.setHeader("Введите новое имя группы:");
            dialogManager.fillContent((content)=>{
                content.append("<p><input type='text' class='input'></p>");
                content.append($("<button>Переименовать</button>").on("click",(e)=>{
                    let newName=content.find(".input").val();
                    self.setName(newName);
                    dialogManager.hideDialog();
                    self.device.showNewGroup(self.id);
                }));
            });
            dialogManager.showDialog("form");
        }));
        editContainerDom.append($("<div class='edit active delete' id='delete_"+this.id+"'>Удалить</div>").on("click",(e)=>{
            let dialogManager=drawManager.getDialogManager();
            if (this.actionGroups.size>0&&!self.device.isVirtual){
                dialogManager.setHeader("Ошибка!");
                dialogManager.fillContent("Сначала Вам необходимо удалить или переместить все вложенные группы!");
                dialogManager.showDialog("error");
                return;
            }
            let unique=[];
            if (!self.device.isVirtual) {
                for (let action of this.actions.values()) {
                    if (action.owners.size == 1)unique.push(action)
                }
            }
            if (unique.length>0){
                    dialogManager.setHeader("Вам необходимо скопировать или переместить следующие элементы:");
                    let elements = "";
                    for (let action of unique) {
                        elements += action.name + ", ";
                    }
                    elements = elements.substring(0, elements.length - 2);
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
            let json_dev=self.getDeviceInJson();
            let dialogManager=drawManager.getDialogManager();
            if (drawManager.secondDevice){
                if (drawManager.secondDevice.id==self.device.id){
                    if (self.device.id==-1){
                        $.post("/",{"new_thing":json_dev},function (res) {
                            if (res.indexOf("Success-")==0){
                                askAboutFurther(res.substr(8));
                            }
                            else {
                                dialogManager.setHeader("Ошибка!");
                                dialogManager.fillContent("Устройство не создано.");
                                dialogManager.showDialog("error");
                            }
                        });
                    }
                    else {
                        $.post(self.device.id, {"newLine":json_dev}, function (res) {
                            if (res=="Updated") {
                                askAboutFurther(self.device.id);
                            }
                            else {
                                dialogManager.setHeader("Ошибка!");
                                dialogManager.fillContent("Устройство не обновлено.");
                                dialogManager.showDialog("error");
                            }
                        });
                    }
                }
                else {
                    dialogManager.setHeader("Изменения устройства "+drawManager.secondDevice.name+" не сохранены, выберите дальнейшие действия:");
                    dialogManager.fillContent((content)=>{
                        content.append($("<button>Продолжить редактирование</button>").on("click",(e)=>{
                            dialogManager.hideDialog();
                        }));
                        content.append($("<button>Сохранить изменения "+self.device.name+" и выйти из режима редактирования, несохранённые изменения " +
                            "устройства "+drawManager.secondDevice.name+" будут утеряны</button>").on("click",(e)=>{
                           deleteSecondDevice(dialogManager);
                           upgradeDevice();
                        }));
                    });
                    dialogManager.showDialog("form");
                }
            }
            else upgradeDevice();
            function askAboutFurther(id) {
                dialogManager.setHeader("Изменения устройства "+drawManager.device.name+" не сохранены, выберите дальнейшие действия:");
                dialogManager.fillContent((content)=>{
                    content.append($("<button>Продолжить редактирование устройства"+drawManager.device.name+"</button>").on("click",(e)=>{
                        deleteSecondDevice(dialogManager);
                    }));
                    content.append($("<button>Открыть новое устройство, несохранённые изменения " +
                        "устройства "+drawManager.device.name+" будут утеряны</button>").on("click",(e)=>{
                        document.location.href = "http://iotmanager.local/"+id;
                    }));
                });
                dialogManager.showDialog("form");
            }
            function upgradeDevice() {
                let name=self.device.wasNameChanged?self.device.name:"";
                self.device.wasNameChanged=false;
                $.post(self.device.id, {"newLine":json_dev,"newName":name}, function (res) {
                    if (res=="Updated") {
                        self.device.isChangingNow = false;
                        self.device.isChangingAppearance=false;
                        self.device.changeManager.clear();
                        for (let group of self.device.actionGroups.values()) {
                            if (group.domElement) group.domElement.remove();
                            group.domElement = null;
                        }
                        self.device.showNewGroup(self.id);
                        dataJson = '{"devices":' + JSON.stringify(drawManager.devices) + ',"current_theme":'+JSON.stringify(drawManager.currentTheme)+',' +
                            '"themes":'+JSON.stringify(drawManager.themes)+',';
                        dataJson += '"creation_line":' + json_dev + '}';
                    }
                    else {
                        dialogManager.setHeader("Ошибка!");
                        dialogManager.fillContent("Устройство не обновлено.");
                        dialogManager.showDialog("error");
                    }
                });
            }
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

        }));
        editContainerDom.append($("<div class='edit active cancel' id='cancel"+this.id+"'>Отменить</div>").on("click",function (e) {
            if (drawManager.secondDevice&&drawManager.secondDevice.id==self.device.id){
                deleteSecondDevice();
            }
            else {
                drawManager.bodyDom.empty();
                startDevice();
                let activeGroup = drawManager.device.actionGroups.get(self.id) ? drawManager.device.actionGroups.get(self.id) : drawManager.device.actionGroups.get(0);
                drawManager.device.showNewGroup(activeGroup.id);
            }

        }));
        editContainerDom.append($("<div class='edit active reset' id='reset_"+this.id+"'>Заводские настройки</div>").on("click",function (e) {
            $.post(self.device.id,{"newLine":"reset"},function (res) {
                if (drawManager.secondDevice&&self.device.id==drawManager.secondDevice.id){
                    deleteSecondDevice();
                }
                else {
                    dataJson = res;
                    drawManager.bodyDom.empty();
                    startDevice();
                }
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
                let groupInGroup=$("<div id='groupInGroup_" + actionGroup.id + "' class='groupInGroup shortcutGroup' data-id='" + actionGroup.id + "' data-dev-id='"+self.device.id+"'>" + actionGroup.name + "</div>");
                actionGroupContainer.append(groupInGroup);
                if (this.device.isChangingNow&&drawManager.secondDevice){
                    groupInGroup.draggable({ revert:true });
                }
            }
            mainContentDom.append(actionGroupContainer);
        }
        if (this.actions.size > 0) {
            let actionContainer = $("<div class='actionContainer'></div>");
            if (this.device.isChangingNow){
                actionContainer.addClass("sortAction");
                let actionAvatarContainerDom=$("<div class='actionAvatarContainer'></div>");
                for (let action of this.actions.values()) {
                    let idString=this.device.isSecond?"aS_":"aV_";
                    let actionAvatarDom = $("<div class='actionAvatar' id='"+idString + action.id + "' data-dev-id='"+self.device.id+"'><p>" + action.name + "</p></div>");
                    let editActionContainerDom = $("<div class='editContainerAction'></div>");
                    if (action.owners.size>1||self.device.isVirtual) editActionContainerDom.append($("<div class='editAction deleteAction' id='deleteAction_"+action.id+"'>Удалить</div>").on("click",(e)=>{
                        if (action.owners.size==1){
                            if (!confirm("Это последнее действие в этом устройстве, вы действительно хотите её удалить?")) return;
                            this.actions.delete(action.id);
                            this.device.actions.delete(action.id);
                            this.domElement.find("#"+idString+action.id).remove();
                            return;
                        }
                        this.actions.delete(action.id);
                        action.owners.delete(this.id);
                        if (action.domElement.has(this.id)) {
                            action.domElement.get(this.id).remove();
                            action.domElement.delete(this.id);
                        }
                        this.domElement.find("#"+idString+action.id).remove();
                    }));
                    editActionContainerDom.append($("<div class='editAction copyAction' id='copyAction_" + action.id + "'>Копировать</div>").on("click", (e)=> {
                        let dialogManager = drawManager.getDialogManager();
                        dialogManager.setHeader("Выберите группу для копирования:");
                        dialogManager.fillContent((content)=> {
                            for (let group of this.device.actionGroups.values()) {
                                if (action.owners.has(group.id) || group.id === -1) continue;
                                content.append($("<div class='groupForInsert block' id='groupForInsert_" + group.id + "'>" + group.name + "</div>").on("click", (e)=> {
                                    drawManager.getDialogManager().hideDialog();
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
                        let dialogManager = drawManager.getDialogManager();
                        dialogManager.setHeader("Выберите группу для перемещения:");
                        dialogManager.fillContent((content)=> {
                            for (let group of this.device.actionGroups.values()) {
                                if (action.owners.has(group.id) || group.id === -1) continue;
                                content.append($("<div class='groupForInsert block' id='groupForInsert_" + group.id + "'>" + group.name + "</div>").on("click", (e)=> {
                                    drawManager.getDialogManager().hideDialog();
                                    let aG = this.device.activeGroup;
                                    action.domElement.get(aG.id).remove();
                                    action.domElement.delete(aG.id);
                                    this.domElement.find("#"+idString+action.id).remove();
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
                        this.domElement.find("#"+idString+action.id).remove();
                        this.device.changeManager.actionToInsert = action;
                        this.device.changeManager.typeOfChanging = "insertAction";
                        aG.showEditButtons();
                        action.owners.delete(aG.id);
                    }));
                    editActionContainerDom.append($("<div class='editAction renameAction' id='renameAction_"+action.id+"'>Переименовать</div>").on("click",(e)=>{
                        let dialogManager=drawManager.getDialogManager();
                        dialogManager.setHeader("Введите новое имя действия:");
                        dialogManager.fillContent((content)=>{
                            content.append("<p><input type='text' class='input'></p>");
                            content.append($("<button>Переименовать</button>").on("click",(e)=>{
                                let newName=content.find(".input").val();
                                action.setName(newName);
                                dialogManager.hideDialog();
                                self.device.showNewGroup(self.id);
                            }));
                        });
                        dialogManager.showDialog("form");
                    }));
                    actionAvatarDom.prepend(editActionContainerDom);
                    actionAvatarContainerDom.append(actionAvatarDom);
                }
                actionContainer.append(actionAvatarContainerDom);
                let sortableElem=actionAvatarContainerDom;
                sortableElem.sortable({ tolerance:"pointer",distance:15,update:(e,ui)=>{
                    if (drawManager.secondDevice&&drawManager.wasDroppedAction){
                        drawManager.wasDroppedAction=false;
                        return;
                    }
                    this.actions=new Map();
                    for (let stringId of sortableElem.sortable("toArray")) {
                            let id = +stringId.substring(3);
                            this.actions.set(id, this.device.actions.get(id));
                    }
                }});
            }
            else {
                for (let action of this.actions.values()) {
                    actionContainer.append(action.draw(this.id));
                }
            }
            mainContentDom.append(actionContainer);
        }
        actionGroupDom.append(mainContentDom);
        this.domElement = actionGroupDom;
        function deleteSecondDevice(dialogManager) {
            if (dialogManager) dialogManager.hideDialog();
            drawManager.secondDevice.domElement.remove();
            drawManager.secondDevice=null;
            $("section.container").removeClass("ifSecondDevice");
            drawManager[drawManager.algorithm + "Algorithm"]();
        }
        return actionGroupDom;

    }
    showEditButtons(){
        let self=this;
        let deviceShortcutContainerDom = $(".deviceShortcutContainer");
        if (this.device.isChangingAppearance){
            this.domElement.find(".editContainer .edit").hide();
            this.domElement.find(".editContainer .appearance").show();
            this.domElement.find(".editContainer .save").show();
            this.domElement.find(".editContainer .cancel").show();
            $("header .deviceAppearance").show();
        }
        else if (this.device.isChangingNow) {
            this.domElement.find(".editContainer .edit").hide();
            this.domElement.find(".editContainerAction").hide();
            deviceShortcutContainerDom.find(".createDevice").hide();
            if (!self.device.isSecond) {
                $("header .deviceStructure").show();
                deviceShortcutContainerDom.find(".createDevice").show();
                if (!self.device.isVirtual){
                    deviceShortcutContainerDom.find(".real").hide();
                }
            }
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
            if (!self.device.isSecond) {
                $("header .editDeviceContainer").hide();
                this.domElement.find(".editContainer .changeAppearance").show();
                deviceShortcutContainerDom.find(".createDevice").hide();
                if (!self.device.isVirtual){
                    deviceShortcutContainerDom.find(".real").show();
                }
            }
            this.domElement.find(".editContainer .change").show();
            this.domElement.find(".editContainerAction").hide();
        }
    }
    startUpdate(){
        if (this.timerId) return;
        let self = this;
        $.get(this.device.id+"-value", {actions:this.jsonForUpdateActions}, this.insertValuesInActions(),'json');
        this.timerId = setTimeout(function update() {
            $.get(self.device.id+"-value", {actions:self.jsonForUpdateActions}, self.insertValuesInActions(),'json');
            self.timerId = setTimeout(update, 2000);
        }, 2000);
    }
    stopUpdate(){
        if (!this.timerId) return;
        clearTimeout(this.timerId);
        this.timerId=null;
    }
    insertValuesInActions() {
        let self = this;
        return function (data) {
                let actions = data;
                for (let i = 0; i < actions.length; i++) {
                    self.device.actions.get(+actions[i].id).setValue(actions[i].value,self.id);
                }
        }
    }
    saveActionsInJson(){
        let allActions=[];
        for (let action of this.actions.values()){
            allActions.push(action.id);
            if (action.supportActions){
                for (let supportAction of action.supportActions.values()){
                    allActions.push(supportAction.id);
                }
            }
        }
        this.jsonForUpdateActions=JSON.stringify(allActions);
    }
    setName(name){
        this.name=makeBigFirstLetter(name);
    }
    setAllLines(num){
        this.allLines=+num;
    }
    getDeviceInJson(){
        let self=this;
        let device={};
        device.id=self.device.id;
        device.name=self.device.name;
        device.isVirtual=self.device.isVirtual;
        device.thingGroup=self.device.thingGroup;
        device.width=self.device.width;
        device.actionGroups=[];
        fillActionGroups(self.device.actionGroups.get(-1).actionGroups.values(),device.actionGroups);
        for (let action of self.device.actions.values()){
            if (action.isDescribed) action.isDescribed=false;
        }
        return JSON.stringify(device);
    }
}
class Device {
    constructor(data) {
        this.id = +data.id;
        this.groupId=-2;
        this.name = makeBigFirstLetter(data.name);
        this.thingGroup = data.thingGroup;
        this.actions = new Map();
        this.actionGroups = new Map();
        new ActionGroup({"name":"Корневая группа","actionGroups": data.actionGroups}, null, this);
        this.activeGroup=this.actionGroups.get(0)?this.actionGroups.get(0):null;
        for (let group of this.actionGroups.values()){//находим copy-null-actions и присваиваем оригинал, а также формируем json-строку для получения текущего состояния action-ов
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
        this.domElement = null;
        this.isSecond=false;
        this.isVirtual=data.isVirtual?data.isVirtual:false;
        this.isChangingAppearance=false;
        this.wasNameChanged=false;
        this.width=data.width?data.width:1;
    }
getGroupId(){
    if (this.isSecond){
        return drawManager.device.getGroupId();
    }
    else return ++this.groupId;
}
    draw() {
        let deviceDom = $("<div class='device' id='device_" + this.id + "'><div class='groupContainer'></div></div>");
        if (this.isSecond) deviceDom.prepend("<h2 class='secondDeviceName'>"+this.name+"</h2>");
        let self = this;
        deviceDom.on("click", ".shortcutGroup", function (e) {
            let shortcutGroupDom = $(this);
            e.preventDefault();
            let groupId=+shortcutGroupDom.attr("data-id");
            if (!self.actionGroups.has(groupId)) return;
            self.showNewGroup(groupId);
        });
        this.domElement = deviceDom;
        return deviceDom;
    }

    showNewGroup(id) {
        this.activeGroup.stopUpdate();
        if (this.isSecond){
            if (this.activeGroup&&this.activeGroup.domElement) this.activeGroup.domElement.remove();
            this.activeGroup = this.actionGroups.get(+id);
            drawManager.device.showNewGroup(null);
            return;
        }
        if (this.isChangingNow) {
            if (this.activeGroup.domElement) this.activeGroup.domElement.remove();
            if (drawManager.secondDevice&&drawManager.secondDevice.activeGroup&&drawManager.secondDevice.activeGroup.domElement) drawManager.secondDevice.activeGroup.domElement.remove();
        }
        if (this.isChangingAppearance&&this.activeGroup&&this.activeGroup.domElement){
            this.activeGroup.domElement.remove();
            this.activeGroup.domElement=null;
        }
        if (id!=null) {
            if (this.activeGroup&&this.activeGroup.domElement) this.activeGroup.domElement.detach();
            this.activeGroup = this.actionGroups.get(+id);
            if (this.isChangingAppearance&&this.activeGroup&&this.activeGroup.domElement){
                this.activeGroup.domElement.remove();
                this.activeGroup.domElement=null;
            }
        }
        drawManager[drawManager.algorithm + "GroupAlgorithm"]();
        if (!this.isChangingNow) this.activeGroup.startUpdate();
    }
    setName(name){
        this.name=makeBigFirstLetter(name);
        $("header h1").text(this.name);
        this.wasNameChanged=true;
    }
    setWidth(w){
        this.width=+w;
        drawManager.deviceDomWidth=this.width*document.documentElement.clientWidth;
    }

}

class DrawManager {
    constructor(data) {
        this.device = new Device(data.creation_line);
        this.currentTheme=data.current_theme;
        this.themes = data.themes;
        this.devices=data.devices;
        this.algorithm=this.currentTheme.algorithm;
        this.widthToDeduct=+this.currentTheme.width_to_deduct;
        this.secondDevice=null;
        this.deviceDomWidth = null;
        this.bodyDom=null;
        this.dialogManager=null;
        this.wasDroppedAction=false;
    }

    draw() {
        let self=this;
        this.bodyDom=$("body");
        let dialogContainerDom=$("<div class='dialogContainer'><div class='dialog'><h1></h1><div class='content'></div></div></div>");
        let closeDom=$("<div class='close'>X</div>");
        closeDom.on("click",(e)=>{
            this.dialogManager.hideDialog();
        });
        dialogContainerDom.find(".dialog").append(closeDom);
        dialogContainerDom.hide();
        this.bodyDom.append(dialogContainerDom);
        this.bodyDom.append($("<header></header>"));
        this.bodyDom.append($("<section class='container'></section>"));
        this.bodyDom.append($("<footer></footer>"));
        let deviceShortcutContainerDom=$("<div class='deviceShortcutContainer'></div>");
        for (let device of this.devices){
            if (device.id==this.device.id) continue;
            let cls=device.is_virtual==0?"deviceShortcut real":"deviceShortcut";
            deviceShortcutContainerDom.append($("<a class='"+cls+"' id='deviceShortcut_"+device.id+"' " +
                "href='http://iotmanager.local/"+device.id+"'>"+makeBigFirstLetter(device.thing_name)+"</a>")
                .on("click",(e)=>{
                    if (!this.device.isChangingNow) return;
                    e.preventDefault();
                    let data_json=$.get(device.id+"-string",(res)=>{
                        let data=JSON.parse(res);
                        let newDevice=new Device(data.creation_line);
                        newDevice.isSecond=true;
                        newDevice.isChangingNow=true;
                        newDevice.changeManager.typeOfChanging = "inProcess";
                        drawManager.secondDevice=newDevice;
                        $("section.container").empty();
                        drawManager[drawManager.algorithm + "Algorithm"]();
                    })
                }));
        }
        deviceShortcutContainerDom.append($("<a class='createDevice deviceShortcut' href='#'>+</a>").on("click", function (e) {
            let dialogManager = drawManager.getDialogManager();
            dialogManager.setHeader("Введите название устройства");
            dialogManager.fillContent((content)=> {
                content.append($("<p><input type='text' class='newDeviceName'></p>"));
                content.append($("<input type='button' value='Создать устройство'>").on("click", (e)=> {
                    let name = content.find(".newDeviceName").val();
                    if (name.length == 0) {
                        alert("Введите имя!");
                        return;
                    }
                    let deviceDescription = {
                        id: -1,
                        name: name,
                        thingGroup: "virtual"

                    };
                    let device = new Device(deviceDescription);
                    device.isSecond = true;
                    device.isChangingNow = true;
                    device.isVirtual=true;
                    device.changeManager.typeOfChanging = "inProcess";
                    drawManager.secondDevice = device;
                    dialogManager.hideDialog();
                    $("section.container").empty();
                    drawManager[drawManager.algorithm + "Algorithm"]();
                }));
            });
            dialogManager.showDialog("form");

        }));
        if (this.devices.length==1) deviceShortcutContainerDom.css({
            "padding":0
        });
        let header=this.bodyDom.find("header");
        let editContainer=$("<div class='editDeviceContainer deviceStructure'></div>").hide();
        editContainer.append($("<div class='edit renameDevice'>Переименовать устройство</div>").on("click", (e)=>{
            let dialogManager=drawManager.getDialogManager();
            dialogManager.setHeader("Введите новое имя устройства:");
            dialogManager.fillContent((content)=>{
                content.append("<p><input type='text' class='input'></p>");
                content.append($("<button>Переименовать</button>").on("click",(e)=>{
                    let newName=content.find(".input").val();
                    this.device.setName(newName);
                    dialogManager.hideDialog();
                }));
            });
            dialogManager.showDialog("form");
            }));
        editContainer.append($("<div class='edit deleteDevice'>Удалить устройство</div>")
            .on("click",(e)=>{
                if (!confirm("Вы действительно хотите удалить устройство?")) return;
                $.ajax({
                    url: this.device.id,
                    type: 'DELETE',
                    success: (res)=>{
                       if (res=="Deleted") document.location.href = "http://iotmanager.local/";
                        else {
                           let dialogManager=drawManager.getDialogManager();
                           dialogManager.setHeader("Ошибка!");
                           dialogManager.fillContent("Ошибка удаления устройства.");
                           dialogManager.showDialog("error");
                       }
                    }
                });
            }));
        header.append(editContainer);
        let editAppearanceContainer=$("<div class='editDeviceContainer deviceAppearance'></div>");
        let widthChoiceDom=$("<div class='edit appearance widthChoice outerOfNumber'>Выберите ширину зоны отображения устройства</div>");
        let widthContainer=$("<div class='numberContainer'></div>");
        for (let p of [100,75,50]){
            widthContainer.append("<div class='number"+(p/100==this.device.width?" equal":"")+"' data-width='"+p/100+"'>"+p+"%</div>");
        }
        widthChoiceDom.append(widthContainer);
        widthChoiceDom.on("click",".number",function (e) {
            widthContainer.find(".equal").removeClass("equal");
            let width=$(this).addClass("equal").attr("data-width");
            self.device.setWidth(width);
            self.device.showNewGroup(null);
        });
        editAppearanceContainer.append(widthChoiceDom);
        let themeContainer=$("<div class='numberContainer'></div>");
        for (let t of this.themes){
            themeContainer.append("<div class='number"+(t.is_main==1?" equal":"")+"' data-id='"+t.id+"'>"+t.theme_name+"</div>");
        }
        themeContainer.on("click",".number",function (e) {
            let themeId=$(this).attr("data-id");
            if (themeId==drawManager.currentTheme.id) return;
            $.ajax({
                url: "theme",
                type: 'PUT',
                success: (data)=>{
                    if (data=="Updated"){
                        location.reload();
                    }
                },
                data: {'id': themeId},
            });
        });
        editAppearanceContainer.append($("<div class='edit appearance changeTheme outerOfNumber'>Изменить тему</div>").append(themeContainer));
        header.append(editAppearanceContainer);
        header.append("<h1>"+this.device.name+"</h1>").append(deviceShortcutContainerDom);
        this[this.algorithm + "Algorithm"]();
    }

    simpleAlgorithm() {
        let self=this;
        this.deviceDomWidth = this.secondDevice?Math.floor(document.documentElement.clientWidth/2)-4:document.documentElement.clientWidth*this.device.width;
        if (this.device.domElement) this.device.domElement.remove();
        let deviceDom = this.device.draw();
        let section = $("section.container");
        let minHeight=section.height();
        deviceDom.css({
            "min-height": minHeight + "px"
        });
        section.append(deviceDom);
        if (this.secondDevice){
            if (this.secondDevice.domElement) this.secondDevice.domElement.remove();
            section.addClass("ifSecondDevice");
            let secondDeviceDom=this.secondDevice.draw();
            if (this.device.isVirtual) deviceDom.droppable({
                drop:dropHandle(self.device,self.secondDevice)
            });
            if (this.secondDevice.isVirtual) secondDeviceDom.droppable({
                drop:dropHandle(self.secondDevice,self.device)
            });
            secondDeviceDom.css({
                "min-height": minHeight + "px",
            });
            section.append(secondDeviceDom);
        }
        this.device.showNewGroup(null);
        function dropHandle(deviceTo, deviceFrom) {
            return function (e,ui) {
                if ($(this).attr("id").substr(7)==ui.draggable.attr("data-dev-id")) return;
                drawManager.wasDroppedAction=true;
                let idString=ui.draggable.attr("id");
                if (idString.indexOf("aV_")==0||idString.indexOf("aS_")==0){
                    let id=+idString.substr(3);
                    if (deviceTo.actionGroups.size==1){
                        deviceTo.domElement.find("p.temp").remove();
                        let newGroup=new ActionGroup({},deviceTo.actionGroups.get(-1),deviceTo);
                        deviceTo.actionGroups.get(-1).actionGroups.set(newGroup.id,newGroup);
                        deviceTo.activeGroup=newGroup;
                    }
                    let group=deviceTo.activeGroup;
                    if (group.actions.has(id)) return;
                    if (deviceTo.actions.has(id)){
                        let a=deviceTo.actions.get(id);
                        a.owners.set(group.id,group);
                        group.actions.set(a.id,a);
                        self.device.showNewGroup(null);
                        return;
                    }
                    let action=deviceFrom.actions.get(id);
                    let prop={name:true,format:true,isChangeable:true,submitName:true,isNeedStatistics:true,id:true,description:true};
                    for (let key in action){
                        if (key in prop){
                            if (key=="name") prop[key]=deviceFrom.isVirtual?action[key]:deviceFrom.name+" - "+action[key];
                            else prop[key]=action[key];
                        }
                    }
                    let copyAction=new MainAction(prop,group,deviceTo);
                    copyAction.range=action.range;
                    copyAction.supportActions=action.supportActions;
                    deviceTo.actions.set(copyAction.id,copyAction);
                    group.actions.set(copyAction.id,copyAction);
                    self.device.showNewGroup(null);
                }
                else {
                    if (idString.indexOf("groupInGroup_")==0) drawManager.wasDroppedAction=false;
                    let groupId=+ui.draggable.attr("data-id");
                    let groupsIn=[];
                    groupsIn.push(deviceFrom.actionGroups.get(groupId));
                    let groupsOut=[];
                    if (deviceFrom.isVirtual) fillActionGroups(groupsIn,groupsOut);
                    else fillActionGroups(groupsIn,groupsOut,deviceFrom);
                    for (let action of deviceFrom.actions.values()){
                        if (action.isDescribed) action.isDescribed=false;
                    }
                    if (deviceTo.actionGroups.size==1){
                        deviceTo.domElement.find("p.temp").remove();
                        let newGroup=new ActionGroup(groupsOut[0],deviceTo.actionGroups.get(-1),deviceTo);
                        deviceTo.actionGroups.get(-1).actionGroups.set(newGroup.id,newGroup);
                        deviceTo.activeGroup=newGroup;
                        for (let group of deviceTo.actionGroups.values()){//находим copy-null-actions и присваиваем оригинал, а также формируем json-строку для получения текущего состояния action-ов
                            for (let entry of group.actions){
                                if (!entry[1]){
                                    let mainAction=this.actions.get(entry[0]);
                                    mainAction.owners.set(group.id,group);
                                    group.actions.set(entry[0],mainAction);
                                }
                            }
                        }
                        self.device.showNewGroup(null);
                    }
                    else {
                        let group=deviceTo.activeGroup;
                        let dialogManager=drawManager.getDialogManager();
                        dialogManager.setHeader("Выберите место вставки новой группы:");
                        dialogManager.fillContent((content)=>{
                            content.append($("<form><p><label><input type='radio' name='place' value='in'>Внутрь группы</label></p>" +
                                "<p><label><input type='radio' name='place' value='near'>На одном уровне с группой</label></p></form>")
                                .append($("<input type='submit' value='Вставить'>").on("click",(e)=>{
                                    let ans=content.find("input:checked").val();
                                    let newGroup;
                                    if (ans=="in") {
                                        newGroup=new ActionGroup(groupsOut[0], group, deviceTo);
                                        group.actionGroups.set(newGroup.id,newGroup);
                                    }
                                    else if (ans=="near"){
                                        newGroup=new ActionGroup(groupsOut[0], group.owner, deviceTo);
                                        group.owner.actionGroups.set(newGroup.id,newGroup);
                                    }
                                    for (let group of deviceTo.actionGroups.values()){//находим copy-null-actions и присваиваем оригинал, а также формируем json-строку для получения текущего состояния action-ов
                                        for (let entry of group.actions){
                                            if (!entry[1]){
                                                let mainAction=this.actions.get(entry[0]);
                                                mainAction.owners.set(group.id,group);
                                                group.actions.set(entry[0],mainAction);
                                            }
                                        }
                                    }
                                    dialogManager.hideDialog();
                                    deviceTo.showNewGroup(newGroup.id);
                                })));
                        });
                        dialogManager.showDialog("form");
                    }
                }
            }
        }
    }

    simpleGroupAlgorithm() {
        let self=this;
        let containerWidth = self.deviceDomWidth;
        if (this.device.isChangingNow) {
            this.device.domElement.find(".groupContainer").append(show(this.device.activeGroup));
            if (this.secondDevice&&this.secondDevice.activeGroup) {
                this.secondDevice.domElement.find(".groupContainer").append(show(this.secondDevice.activeGroup));
                this.device.domElement.find(".mainContent").css({
                    "min-height":$("section.container").height()+"px"
                });
            }
            else if (this.secondDevice&&this.secondDevice.domElement.find("div.temp").length==0) {
                this.secondDevice.domElement.find(".groupContainer").append($("<p class='temp'>Перемемтите сюда группу или действие</p>").css({
                    "width": containerWidth + "px",
                    "text-align":"center"
                }));
            }
        }
        else {
            let activeGroup=this.device.activeGroup;
            if (activeGroup.domElement) {
                activeGroup.showEditButtons();
                this.device.domElement.find(".groupContainer").append(activeGroup.domElement);
            }
            else {
                let actionGroupDom = activeGroup.draw();
                let currentLevelGroupDom = actionGroupDom.find(".currentLevelGroup");
                $(".device").css({
                    "width":containerWidth
                });
                if (currentLevelGroupDom.length > 0) {
                    containerWidth -= this.widthToDeduct;
                }
                let mainContentDom = actionGroupDom.find(".mainContent");
                mainContentDom.css({
                    "min-height": $("section.container").height() + "px"
                });
                if (activeGroup.actions.size > 0) {
                    let actionWidth = Math.floor(containerWidth / activeGroup.allLines) - activeGroup.allLines * 15;
                    if (actionWidth<300) actionWidth=300;
                    for (let action of activeGroup.actions.values()) {
                        action.domElement.get(activeGroup.id).css({
                            "flex-basis": actionWidth + "px"
                        })
                    }
                    let supportActionDom = mainContentDom.find(".supportAction");
                    supportActionDom.hide();
                }
                actionGroupDom.find("#groupOnTheLevel_" + activeGroup.id).css({
                    "background": "black"
                });
                activeGroup.showEditButtons();
                activeGroup.saveActionsInJson();
                this.device.domElement.find(".groupContainer").append(activeGroup.domElement);
            }
            for (let action of this.device.activeGroup.actions.values()) {
                if (!action.supportActions) continue;
                let activeSupportActions = [];
                for (let supportAction of action.supportActions.values()) {
                    if (supportAction.active == null) activeSupportActions.push(supportAction);
                }
                self[self.algorithm + "SupportAlgorithm"](activeSupportActions);
            }
        }
        function show(activeGroup) {
            let actionGroupDom = activeGroup.draw();
            let mainContentDom=actionGroupDom.find(".mainContent");
            let height=activeGroup.device.isSecond?$("section.container").height()-40:$("section.container").height();
            if (!drawManager.secondDevice){
                containerWidth=containerWidth*activeGroup.width;
                $(".device").css({
                    "width":containerWidth
                });
            }
            mainContentDom.css({
                "min-height": height + "px"
            });
            actionGroupDom.find("#groupOnTheLevel_"+activeGroup.id).css({
                "background": "black"
            });
            activeGroup.showEditButtons();
            activeGroup.saveActionsInJson();
            return actionGroupDom;
        }

    }

    simpleSupportAlgorithm(supportActions) {
        for (let m = 0; m < supportActions.length; m++) {
            let supportActionDom = supportActions[m].domElement.get(this.device.activeGroup.id);
            supportActionDom.show();
        }
    }
    simpleShowDialog(type){
        let dialogContainerDom=this.bodyDom.find(".dialogContainer");
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
    getDialogManager(){
        if (this.dialogManager!=null) {
            return this.dialogManager;
        }
        let self=this;
        return this.dialogManager={
            dialog:self.bodyDom.find(".dialogContainer .dialog"),
            dialogContainer:self.bodyDom.find(".dialogContainer"),
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
                drawManager[drawManager.algorithm+"ShowDialog"](type);
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
                this.dialogContainer.hide();
            }
        };
    }


}
var dataJson;
var drawManager;
function startDevice() {
    drawManager = new DrawManager(JSON.parse(dataJson));
    drawManager.draw();
}

//Начало работы программы---------------------------------------------------------------
dataJson =$(".data_in_json").get(0).dataset.device;
startDevice();