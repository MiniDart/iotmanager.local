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
    constructor(data, owner, device) {
        this.device = device;
        this.owner = owner;
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
        this.domElement = null;
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
            let id = +this.domElement.find(selector).val();
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
            let val = +this.domElement.find(selector).val();
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
        super(data, owner, device);
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

    draw() {
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
        this.domElement = supportActionDom;
        return supportActionDom;
    }

    setValue(val) {
        if (!this.domElement) return;
        this.domElement.find(".value.support").text(val);
    }
}

class MainAction extends Action {
    constructor(data, owner, device) {
        super(data, owner, device);
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
    }

    draw() {
        let mainActionDom = super.draw();
        mainActionDom.attr({
            "class": "mainAction",
            "id": "mainAction_" + this.id
        });
        let editActionContainerDom=$("<div class='editContainerAction'></div>");
        editActionContainerDom.append($("<div class='editAction copyAction' id='copyAction_"+this.id+"'>Копировать</div>").on("click",(e)=>{
            let dialogManager=this.device.getDialogManager();
            dialogManager.setHeader("Выберите группу для копирования:");
            dialogManager.fillContent((content)=>{
                for (let group of this.device.actionGroups.values()){
                    if (group.id===this.owner.id||group.id===-1) continue;
                    content.append($("<div class='groupForInsert block' id='groupForInsert_"+group.id+"'>"+group.name+"</div>").on("click",(e)=>{
                        this.device.getDialogManager().hideDialog();
                        this.domElement.remove();
                        this.owner.actions.delete(this.id);
                        for (let action of this.owner.actions.values()){
                            if (!action.supportActions) continue;
                            let supportActions=[];
                            for (let supportAction of action.supportActions.values()){
                                if (supportAction.domElement.attr("display")!="none") supportActions.push(supportAction);
                            }
                            drawManager[drawManager.activeTheme.algorithm+"SupportAlgorithm"](supportActions,action.domElement.width());
                        }
                        this.owner=group;
                        group.actions.set(this.id,this);
                        if (group.domElement) group.domElement.remove();
                        group.domElement=null;
                        this.device.changeManager.typeOfChanging="inProcess";
                        this.device.showNewGroup(group.id);
                    }));
                }
            });
            dialogManager.showDialog("block");
        }));
        editActionContainerDom.append($("<div class='editAction insertIntoAction' id='insertInto_"+this.id+"'>Переместить в</div>").on("click",(e)=>{
            let dialogManager=this.device.getDialogManager();
            dialogManager.setHeader("Выберите группу для перемещения:");
            dialogManager.fillContent((content)=>{
                for (let group of this.device.actionGroups.values()){
                    if (group.id===this.owner.id||group.id===-1) continue;
                    content.append($("<div class='groupForInsert block' id='groupForInsert_"+group.id+"'>"+group.name+"</div>").on("click",(e)=>{
                        this.device.getDialogManager().hideDialog();
                        this.domElement.remove();
                        this.owner.actions.delete(this.id);
                        for (let action of this.owner.actions.values()){
                            if (!action.supportActions) continue;
                            let supportActions=[];
                            for (let supportAction of action.supportActions.values()){
                                if (supportAction.domElement.attr("display")!="none") supportActions.push(supportAction);
                            }
                            drawManager[drawManager.activeTheme.algorithm+"SupportAlgorithm"](supportActions,action.domElement.width());
                        }
                        this.owner=group;
                        group.actions.set(this.id,this);
                        if (group.domElement) group.domElement.remove();
                        group.domElement=null;
                        this.device.changeManager.typeOfChanging="inProcess";
                        this.device.showNewGroup(group.id);
                    }));
                }
            });
            dialogManager.showDialog("block");
        }));
        editActionContainerDom.append($("<div class='editAction cutAction' id='cutAction_"+this.id+"'>Вырезать</div>").on("click",(e)=>{
            this.domElement.remove();
            this.owner.actions.delete(this.id);
            for (let action of this.owner.actions.values()){
                if (!action.supportActions) continue;
                let supportActions=[];
                for (let supportAction of action.supportActions.values()){
                    if (supportAction.domElement.attr("display")!="none") supportActions.push(supportAction);
                }
                drawManager[drawManager.activeTheme.algorithm+"SupportAlgorithm"](supportActions,action.domElement.width());
            }
            this.device.changeManager.actionToInsert=this;
            this.device.changeManager.typeOfChanging="insertAction";
            this.owner.showEditButtons();
            this.owner=null;
        }));
        mainActionDom.prepend(editActionContainerDom);
        mainActionDom.find(".value").addClass("main");
        mainActionDom.find(".newValue").addClass("main");
        if (this.supportActions) {
            let supportContainerDom = $("<div class='support'></div>");
            for (let supportAction of this.supportActions.values()) {
                supportContainerDom.append(supportAction.draw());
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
                    supportAction.domElement.hide();
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
        this.domElement = mainActionDom;
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
                this.actions.set(+data.actions[i].id, new MainAction(data.actions[i], this, device));
            }
        }
        if (data.actionGroups) {
            for (let i = 0; i < data.actionGroups.length; i++) {
                let g=new ActionGroup(data.actionGroups[i], this, device);
                this.actionGroups.set(g.id,g);
            }
        }
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
        editContainerDom.append($("<div class='edit active save' id='save_"+this.id+"'>Сохранить</div>").on("click",function (e) {
            self.device.isChangingNow=false;
            self.device.changeManager.clear();
            self.device.showNewGroup(self.id);
            let device={};
            device.id=self.device.id;
            device.name=self.device.name;
            device.thingGroup=self.device.thingGroup;
            device.updateTime=self.device.updateTime/1000+"";
            device.actionGroups=[];
            fillActionGroups(self.device.actionGroups.get(-1).actionGroups.values(),device.actionGroups);
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
                            let actionOut={};
                            actionOut.id=actionIn.id;
                            actionOut.name=actionIn.name;
                            actionOut.isChangeable=actionIn.isChangeable+"";
                            actionOut.format=actionIn.format;
                            if (actionIn.description) actionOut.description=actionIn.description;
                            actionOut.isNeedStatistics=actionIn.isNeedStatistics+"";
                            if (actionIn.submitName) actionOut.submitName=actionIn.submitName;
                            if (actionIn.range){
                                actionOut.range=[];
                                for (let itemIn of actionIn.range.values()){
                                    let itemOut={};
                                    itemOut.id=itemIn.id;
                                    if (itemIn.color) itemOut.color=itemIn.color;
                                    if (itemIn.name) itemOut.name=itemIn.name;
                                    if (itemIn.from!=null) itemOut.from=itemIn.from+"";
                                    if (itemIn.to!=null) itemOut.to=itemIn.to+"";
                                    actionOut.range.push(itemOut);
                                }
                            }
                            if (actionIn.supportActions){
                                actionOut.support=[];
                                for (let supportActionIn of actionIn.supportActions.values()){
                                    let supportActionOut={};
                                    supportActionOut.id=supportActionIn.id;
                                    supportActionOut.name=supportActionIn.name;
                                    supportActionOut.isChangeable=supportActionIn.isChangeable+"";
                                    supportActionOut.format=supportActionIn.format;
                                    if (supportActionIn.isDeactivator) supportActionOut.isDeactivator=supportActionIn.isDeactivator+"";
                                    supportActionOut.isIndividual=supportActionIn.isIndividual+"";
                                    supportActionOut.isNeedStatistics=supportActionIn.isNeedStatistics+"";
                                    if (supportActionIn.description) supportActionOut.description=supportActionIn.description;
                                    if (supportActionIn.submitName) supportActionOut.submitName=supportActionIn.submitName;
                                    if (supportActionIn.active) supportActionOut.active=supportActionIn.active;
                                    if (supportActionIn.range){
                                        supportActionOut.range=[];
                                        for (let itemIn of supportActionIn.range.values()){
                                            let itemOut={};
                                            itemOut.id=itemIn.id;
                                            if (itemIn.color) itemOut.color=itemIn.color;
                                            if (itemIn.name) itemOut.name=itemIn.name;
                                            if (itemIn.from!=null) itemOut.from=itemIn.from+"";
                                            if (itemIn.to!=null) itemOut.to=itemIn.to+"";
                                            supportActionOut.range.push(itemOut);
                                        }
                                    }
                                    actionOut.support.push(supportActionOut);
                                }
                            }
                            actionGroupOut.actions.push(actionOut);
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
            drawManager.device.activeGroup=drawManager.device.actionGroups.get(self.id);
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
            a.owner=this;
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
                actionContainer.append(action.draw());
            }
            mainContentDom.append(actionContainer);
        }
        actionGroupDom.append(mainContentDom);
        this.domElement = actionGroupDom;
        return actionGroupDom;

    }
    showEditButtons(){
        if (this.device.isChangingNow) {
            this.domElement.find(".editContainer .edit").hide();
            this.domElement.find(".editContainerAction").hide();
            switch (this.device.changeManager.typeOfChanging){
                case "inProcess":
                    this.domElement.find(".editContainer .active").show();
                    this.domElement.find(".editContainerAction").show();
                    break;
                case "insert":
                    this.domElement.find(".editContainer .insert").show();
                    this.domElement.find(".editContainerAction").hide();
                    break;
                case "insertAction":
                    this.domElement.find(".editContainer .insertAction").show();
                    this.domElement.find(".editContainerAction").hide();
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
                this.dialog.find(".content").empty();
                self.domElement.find(".dialogContainer").hide();
            }
        };
    }

}


class Theme {
    constructor() {
        this.name = "Simple";
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
        $("h1.device_name").text(this.device.name);
        this[this.activeTheme.algorithm + "Algorithm"]();
    }

    simpleAlgorithm() {
        let deviceDom = this.device.draw();
        let section = $("section.container");
        this.deviceDomWidth = document.documentElement.clientWidth - 200;
        deviceDom.css({
            "width": this.deviceDomWidth + "px",
            "min-height": section.height() + "px",
            "margin-left": "auto",
            "margin-right": "auto",
            "border-left": "1px solid white",
            "border-right": "1px solid white",
            "color": "white",
            "font-size": "20px"
        });
        section.append(deviceDom);
        deviceDom.find(".dialogContainer").css({
            "display":"flex",
            "position":"fixed",
            "width":"100vw",
            "height":"100vh",
            "background":"rgba(58, 58, 58, 0.46)",
            "top":"0",
            "left":"0"
        }).hide();
        deviceDom.find(".dialog").css({
            "position":"relative",
            "overflow":"auto",
            "width":"50%",
            "min-height":"40%",
            "max-height":"80%",
            "margin-left":"auto",
            "margin-right":"auto",
            "margin-top":"auto",
            "margin-bottom":"auto",
            "padding":"15px"
        });
        deviceDom.find(".dialog .close").css({
           "position":"absolute",
            "top":"0",
            "right":"0",
            "background":"red",
            "cursor":"pointer"
        });
        this[this.activeTheme.algorithm + "GroupAlgorithm"]();

    }

    simpleGroupAlgorithm() {
        if (this.device.activeGroup.domElement) {
            this.device.activeGroup.showEditButtons();
            this.device.domElement.find(".groupContainer").append(this.device.activeGroup.domElement);
            return;
        }
        let activeGroup = this.device.activeGroup;
        let actionGroupDom = activeGroup.draw();
        let containerWidth = this.deviceDomWidth;
        let currentLevelGroupDom=actionGroupDom.find(".currentLevelGroup");
        if (currentLevelGroupDom.length>0){
            containerWidth=this.deviceDomWidth-200;
            currentLevelGroupDom.css({
                "float":"left",
                "width":"200px"
            });
        }
        let mainContentDom=actionGroupDom.find(".mainContent");

        mainContentDom.css({
            "float":"left",
            "width": containerWidth + "px",
            "border-left": "1px solid white",
            "min-height": $("section.container").height() + "px",
            "box-sizing": "border-box"
        });
        mainContentDom.find(".editContainer").css({
            "display":"inline-flex",
            "width":"50%",
            "flex-direction":"row-reverse",
            "flex-wrap":"wrap"
        });
        mainContentDom.find(".edit").css({
            "padding-left":"10px",
            "padding-right":"10px",
            "background": "red",
            "border": "1px solid white",
            "cursor": "pointer"
        });
        mainContentDom.find(".editContainerAction").css({
            "text-align":"right"
        });
        mainContentDom.find(".editContainerAction .editAction").css({
            "display":"inline-block",
            "padding-left":"10px",
            "padding-right":"10px",
            "background": "red",
            "border": "1px solid white",
            "cursor": "pointer"
        });
        mainContentDom.find(".pathContainer").css({
            "display":"inline-block",
            "width":"50%"
        });
        mainContentDom.find("h2").css({
            "padding-bottom": "10px"
        });
        if (activeGroup.actionGroups.size > 0) {
            let actionGroupContainerDom = mainContentDom.find(".actionGroupContainer");
            actionGroupContainerDom.css({
                "display": "flex",
                "flex-wrap": "wrap"
            });
            actionGroupContainerDom.find(".groupInGroup").css({
                "flex-basis": "150px",
                "flex-grow": "1",
                "background": "red",
                "text-align": "center",
                "font-size": "30px",
                "cursor": "pointer",
                "border": "1px solid white"
            });
        }
        if (activeGroup.actions.size > 0) {
            let actionContainerDom = mainContentDom.find(".actionContainer");
            actionContainerDom.css({
                "display": "flex",
                "flexWrap": "wrap",
                "justifyContent": "space-around",
                "border": "1px solid black"
            });
            let actionWidth = Math.floor(containerWidth / this.activeTheme.allLines) - this.activeTheme.allLines * 12;
            let actionDom = actionContainerDom.find(".mainAction");
            actionDom.css({
                "flex-basis": actionWidth + "px",
                "flex-grow": "1",
                "border": "1px solid white",
                "padding": "5px"
            });
            actionDom.find("div.value").css({
                "height": "30px",
                "background": "grey",
                "text-align": "center"
            });
            let supportContainerDom = actionContainerDom.find(".support");
            supportContainerDom.css({
                "display": "flex",
                "flexWrap": "wrap",
                "justifyContent": "space-around",
                "padding": "5px"
            });
            let supportActionDom = supportContainerDom.find(".supportAction");
            supportActionDom.hide();
            supportActionDom.css({
                "border": "1px solid grey",
                "padding": "5px"
            });
            supportActionDom.find(".value").css({
                "height": "30px",
                "background": "grey",
                "text-align": "center"
            });
        }
        actionGroupDom.find(".groupOnTheLevel").css({
            "font-size": "30px",
            "cursor": "pointer",
            "text-align": "center",
            "border-bottom": "1px solid white",
            "background": "#850000"
        });
        actionGroupDom.find("#groupOnTheLevel_"+activeGroup.id).css({
            "background": "black"
        });
        this.device.activeGroup.showEditButtons();
        this.device.domElement.find(".groupContainer").append(actionGroupDom);
        for (let action of activeGroup.actions.values()) {
            if (!action.supportActions) continue;
            let activeSupportActions = [];
            for (let supportAction of action.supportActions.values()) {
                if (supportAction.active == null) activeSupportActions.push(supportAction);
            }
            this[this.activeTheme.algorithm + "SupportAlgorithm"](activeSupportActions, action.domElement.width());
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
            let supportActionDom = supportActions[m].domElement;
            supportActionDom.css({
                "box-sizing": "border-box",
                "width": supportActionWidth + "px",
            });
            supportActionDom.show();
        }
    }
    simpleShowDialog(type){
        let dialogContainerDom=this.device.domElement.find(".dialogContainer");
        if (type=="block"){
            dialogContainerDom.find(".dialog").css({
                "background":"grey"
            });
            dialogContainerDom.find(".content").css({
                "padding-top":"20px",
                "display":"flex",
                "flex-wrap":"wrap"
            });
            dialogContainerDom.find(".block").css({
                "text-align":"center",
                "background":"red",
                "cursor":"pointer",
                "border":"1px solid white",
                "padding":"5px 10px",
                "flex-grow":"1"
            });
        }
        dialogContainerDom.show();
    }

}


//Начало работы программы---------------------------------------------------------------
var dataJson =$("#data_in_json").get(0).dataset.device;
var drawManager = new DrawManager(new Device(JSON.parse(dataJson)));
drawManager.draw();
//drawManager.start();