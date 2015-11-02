/**
* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved.
*
* THIS FILE IS AUTO-GENERATED FROM JAVA FILE: $iiqFolder/tools/j2js/java-code/src/sailpoint/notification/Notifications.java
* PLEASE DON'T MODIFY THIS FILE HERE.
*/

Ext.namespace ("sailpoint.notification");


Ext.define('sailpoint.notification.RecipientInfo', {

    statics : {
        createFromObject : function (theObject) {
            var info =  Ext.create('sailpoint.notification.RecipientInfo');
            info.id = theObject.id;
            info.displayField = theObject.displayField;
            info.icon = theObject.icon;
            return info;
        }

    }
    , id : null
    , displayField : null
    , icon : null
    , clone : function () {
        var copy =  Ext.create('sailpoint.notification.RecipientInfo');
        copy.id = this.id;
        copy.displayField = this.displayField;
        copy.icon = this.icon;
        return copy;
    }
});


Ext.define('sailpoint.notification.ConfigBase', {

    statics : {
        copyBaseProperties : function (from, to) {
            to.before = from.before;
            to.enabled = from.enabled;
            to.startHowManyDays = from.startHowManyDays;
            to.type = from.type;
            to.fromDb = from.fromDb;
            to.additionalEmailRecipientsPresent = from.additionalEmailRecipientsPresent;
            if (from.additionalRecipients != null) {
                to.additionalRecipients =  new Array ();
                for (var i = 0; i < from.additionalRecipients.length; ++i) {
                    to.additionalRecipients.push(sailpoint.notification.RecipientInfo.createFromObject (from.additionalRecipients[i]));
                }
            }
            to.emailTemplateId = from.emailTemplateId;
            to.recipientsRuleId = from.recipientsRuleId;
        }

        , createFromObject : function (theObject) {
            if (theObject.type == "Reminder") {
                var config =  Ext.create('sailpoint.notification.ReminderConfig');
                sailpoint.notification.ConfigBase.copyBaseProperties (theObject, config);
                sailpoint.notification.ReminderConfig.copySpecificProperties (theObject, config);
                return config;
            } else {
                var config =  Ext.create('sailpoint.notification.EscalationConfig');
                sailpoint.notification.ConfigBase.copyBaseProperties (theObject, config);
                sailpoint.notification.EscalationConfig.copySpecificProperties (theObject, config);
                return config;
            }
        }

    }
    , type : null
    , enabled : false
    , sequence : 0
    , startDay : null
    , previousConfig : null
    , nextConfig : null
    , before : false
    , startHowManyDays : 0
    , fromDb : false
    , emailTemplateId : null
    , additionalEmailRecipientsPresent : false
    , additionalRecipients : null
    , recipientsRuleId : null
    , clone : function () {
        return null;
    }
});


Ext.define('sailpoint.notification.NotificationBase', {
    constructor : function () {
        this.initDom ();
    }

    , parent : null
    , addMode : false
    , input : null
    , emailTemplateSelect : null
    , additionalFieldset : null
    , additionalRecipientsCheckbox : null
    , additionalContainer : null
    , additionalRecipientsMultiSuggest : null
    , recipientsRuleSelect : null
    , additionalRecipientsErrorLabel : null
    , actionButton : null
    , cancelButton : null
    , messages : null
    , getMessages : function () {
        if (this.messages == null) {
            this.messages = notificationMessages;
        }
        return this.messages;
    }
    , initDom : function () {
        this.emailTemplateSelect = $("emailTemplateSelect");
        this.additionalFieldset = $("additionalFieldset");
        this.additionalContainer = $("additionalContainer");
        this.additionalRecipientsCheckbox = $("additionalRecipientsCheckbox");
        this.additionalRecipientsCheckbox.onclick = this.showHideAdditionalRecipients.bind(this);
        this.recipientsRuleSelect = $("recipientsRuleSelect");
        this.additionalRecipientsMultiSuggest =  Ext.create('SailPoint.MultiSuggest',  {
            "id" : "additionalRecipients"
            , "autoRender" : "recipientsMultiSuggest"
            , "suggestType" : "identity"
            , "inputFieldName" : "recipients"
            , "baseParams" :  {
                "type" : "identity"
                , "context" : "Owner"
            }
            , "contextPath" : CONTEXT_PATH
        });
        this.additionalRecipientsErrorLabel = $("additionalRecipientsErrorLabel");
        this.actionButton = $("actionButton");
        this.cancelButton = $("cancelButton");
    }
    , copyBaseValuesFromInput : function (config) {
        config.sequence = this.input.sequence;
        config.previousConfig = this.input.previousConfig;
        config.nextConfig = this.input.nextConfig;
        config.fromDb = this.input.fromDb;
        config.emailTemplateId = SailPoint.Utils.getValueFromSelect (this.emailTemplateSelect, null);
        config.additionalEmailRecipientsPresent = this.additionalRecipientsCheckbox.checked;
        if (config.additionalEmailRecipientsPresent) {
            config.additionalRecipients = this.getAdditionalRecipientsFromMultiSuggest ();
            config.recipientsRuleId = SailPoint.Utils.getValueFromSelect (this.recipientsRuleSelect, null);
        } else {
            config.additionalRecipients =  new Array ();
            config.recipientsRuleId = null;
        }
    }
    , loadValuesFromInput : function () {
        SailPoint.Utils.setValueInSelect (this.emailTemplateSelect, this.input.emailTemplateId);
        if (this.input.additionalEmailRecipientsPresent) {
            this.additionalFieldset.className = "additional-fieldset-checked";
            this.additionalRecipientsCheckbox.checked = true;
            this.additionalContainer.show ();
            this.loadAdditionalRecipients (this.input);
            this.additionalRecipientsMultiSuggest.show ();
            SailPoint.Utils.setValueInSelect (this.recipientsRuleSelect, this.input.recipientsRuleId);
            this.parent.popup.setHeight (475);
        } else {
            this.additionalFieldset.className = "additional-fieldset";
            this.additionalRecipientsCheckbox.checked = false;
            this.additionalContainer.hide ();
            this.parent.popup.setHeight (300);
        }
        if (this.addMode) {
            this.actionButton.value = "#{msgs.notification_add}";
        } else {
            this.actionButton.value = "#{msgs.notification_save}";
        }
    }
    , disable : function () {
        this.emailTemplateSelect.disable ();
        this.additionalRecipientsCheckbox.disable ();
        this.additionalRecipientsMultiSuggest.disable ();
        this.recipientsRuleSelect.disable ();
        this.actionButton.disable ();
        this.cancelButton.disable ();
    }
    , enable : function () {
        this.emailTemplateSelect.enable ();
        this.additionalRecipientsCheckbox.enable ();
        this.additionalRecipientsMultiSuggest.enable ();
        this.recipientsRuleSelect.enable ();
        this.actionButton.enable ();
        this.cancelButton.enable ();
    }
    , loadAdditionalRecipients : function (input) {
        for (var i1=0; i1<input.additionalRecipients.length; ++i1) {
            recipient = input.additionalRecipients[i1];
            this.addRecipient (recipient);
        }
    }
    , addRecipient : function (recipient) {
        var recordValues =  {
            "id" : recipient.id
            , "displayField" : recipient.displayField
            , "icon" : recipient.icon
        };
        var record = Ext.create("sailpoint.notification.RecipientInfoModel", recordValues);
        this.additionalRecipientsMultiSuggest.selectedStore.add (record);
    }
    , validate : function () {
        var valid = true;
        this.additionalRecipientsErrorLabel.hide ();
        if (this.additionalRecipientsCheckbox.checked && this.additionalRecipientsMultiSuggest.selectedStore.getCount () < 1 && this.recipientsRuleSelect.selectedIndex < 1) {
            valid = false;
            this.additionalRecipientsErrorLabel.show ();
            this.additionalRecipientsErrorLabel.innerHTML = "* Please select a recipient or recipient rule";
        }
        return valid;
    }
    , setInput : function (parent, addMode, val) {
    }
    , getActionButton : function () {
        return this.actionButton;
    }
    , getCancelButton : function () {
        return this.cancelButton;
    }
    , createConfigFromCurrentSelectedOptions : function () {
        return null;
    }
    , getAdditionalRecipientsFromMultiSuggest : function () {
        var list =  new Array ();
        var count = this.additionalRecipientsMultiSuggest.selectedStore.getCount ();
        for (var i = 0; i < count; ++i) {
            var info =  Ext.create('sailpoint.notification.RecipientInfo');
            info.id = this.additionalRecipientsMultiSuggest.selectedStore.getAt (i).get ("id");
            info.displayField = this.additionalRecipientsMultiSuggest.selectedStore.getAt (i).get ("displayField");
            info.icon = this.additionalRecipientsMultiSuggest.selectedStore.getAt (i).get ("icon");
            list.push(info);
        }
        return list;
    }
    , showHideAdditionalRecipients : function () {
        if (this.additionalRecipientsCheckbox.checked) {
            this.additionalFieldset.className = "additional-fieldset-checked";
            this.additionalContainer.show ();
            this.additionalRecipientsMultiSuggest.show ();
            this.parent.popup.setHeight (475);
        } else {
            this.additionalFieldset.className = "additional-fieldset";
            this.additionalContainer.hide ();
            this.parent.popup.setHeight (300);
        }
    }
});


Ext.define('sailpoint.notification.NotificationsConfig', {

    configs : null
    , startDate : 0
    , endDate : 0
    , defaultReminderConfigForNew : null
    , defaultEscalationConfigForNew : null
});


Ext.define('sailpoint.notification.GridModel', {
    extend : 'Ext.data.Model'

    , idProperty : "id"
    , fields : ["id", "sequence", "name", "daysText", "repeatText", "config"]
});


Ext.define('sailpoint.notification.RecipientInfoModel', {
    extend : 'Ext.data.Model'

    , idProperty : "id"
    , fields : ["id", "displayField", "icon"]
});


Ext.define('sailpoint.notification.Notifications', {
    constructor : function (config) {
        this.renderDivElement = config["renderDivElement"];
        this.hiddenDataElement = config["hiddenDataElement"];
        this.hiddenStartDateElement = config["hiddenStartDateElement"];
        this.hiddenEndDateElement = config["hiddenEndDateElement"];
        this.runNowElement = config["runNowElement"];
        this.pastStagedPhase = config["pastStagedPhase"];
        this.initDom ();
        this.initializeNotificationsConfig ();
        this.initializeIConfigs ();
    }

    , pastStagedPhase : false
    , renderDivElement : null
    , hiddenDataElement : null
    , hiddenStartDateElement : null
    , hiddenEndDateElement : null
    , runNowElement : null
    , notificationsConfig : null
    , sequence : 0
    , configsHash :  new Hash ()
    , currentNotification : null
    , grid : null
    , popup : null
    , initializeNotificationsConfig : function () {
        var jsonString = this.hiddenDataElement.value;
        if (jsonString == null || jsonString.trim ().length == 0) {
            this.notificationsConfig =  Ext.create('sailpoint.notification.NotificationsConfig');
            this.notificationsConfig.configs =  new Array ();
        } else {
            this.notificationsConfig = Ext.decode(this.hiddenDataElement.value);
            if (this.notificationsConfig != null && this.notificationsConfig.configs != null) {
                var newConfigs =  new Array ();
                for (var i1=0; i1<this.notificationsConfig.configs.length; ++i1) {
                    config = this.notificationsConfig.configs[i1];
                    newConfigs.push(sailpoint.notification.ConfigBase.createFromObject (config));
                }
                this.notificationsConfig.configs = newConfigs;
            }
        }
        this.initializeStartAndEndDatesFromHiddenElements ();
    }
    , initializeIConfigs : function () {
        this.createHash ();
    }
    , updateStartAndEndDates : function () {
        this.initializeStartAndEndDatesFromHiddenElements ();
        this.recalculateStartDates ();
        this.createOrderedConfigs ();
    }
    , recalculateStartDates : function () {
        for (var i = 0; i < this.notificationsConfig.configs.length; ++i) {
            var config = this.notificationsConfig.configs[i];
            config.startDay = this.calculateStartDay (config);
        }
    }
    , initializeStartAndEndDatesFromHiddenElements : function () {
        if (this.runNowElement && $(this.runNowElement.id).checked) {
            this.notificationsConfig.startDate = sailpoint.util.Day.today ().getTime ();
        } else {
            this.notificationsConfig.startDate = parseFloat($(this.hiddenStartDateElement.id).value);
        }
        this.notificationsConfig.endDate = parseFloat($(this.hiddenEndDateElement.id).value);
    }
    , updateValue : function () {
        this.hiddenDataElement.value = Ext.encode(this.cloneNotificationsConfig ());
    }
    , cloneNotificationsConfig : function () {
        var copy =  Ext.create('sailpoint.notification.NotificationsConfig');
        if (this.notificationsConfig.configs != null) {
            copy.configs =  new Array ();
            for (var i = 0; i < this.notificationsConfig.configs.length; ++i) {
                copy.configs.push(this.notificationsConfig.configs[i].clone ());
            }
        }
        return copy;
    }
    , initDom : function () {
        var store = Ext.create("Ext.data.Store",  {
            "model" : "sailpoint.notification.GridModel"
            , "proxy" :  {
                "type" : "memory"
                , "reader" :  {
                    "type" : "json"
                    , "root" : "configs"
                }
            }
        });
        this.grid = Ext.create("Ext.grid.Panel",  {
            "store" : store
            , "columns" : [ {
                "header" : "#{msgs.notification_date}"
                , "dataIndex" : "daysText"
                , "width" : 120
                , "sortable" : false
                , "hideable" : false
            },  {
                "header" : "#{msgs.notification_action}"
                , "dataIndex" : "name"
                , "width" : 180
                , "sortable" : false
                , "hideable" : false
            },  {
                "header" : "#{msgs.notification_repeat}"
                , "dataIndex" : "repeatText"
                , "width" : 80
                , "sortable" : false
                , "hideable" : false
                , "flex" : 1
            }]
            , "listeners" :  {
                "itemcontextmenu" : this.onContextMenu.bind(this)
            }
            , "height" : 175
            , "width" : 400
            , "autoRender" : this.renderDivElement
            , "tbar" : [ {
                "text" : "#{msgs.notification_add_reminder}"
                , "handler" : this.onAddReminderClick.bind(this)
            },  {
                "text" : "#{msgs.notification_add_escalation}"
                , "handler" : this.onAddEscalationClick.bind(this)
            }]
        });
    }
    , onAddReminderClick : function () {
        this.popup = Ext.create("Ext.window.Window",  {
            "title" : "#{msgs.notification_add_reminder}"
            , "overflowX" : "hidden"
            , "overflowY" : "auto"
            , "loader" :  {
                "url" : CONTEXT_PATH + "/include/reminder.jsf"
                , "scripts" : true
                , "callback" : this.onAddReminderLoad.bind(this)
                , "autoLoad" : true
            }
            , "width" : 600
            , "height" : 475
            , "modal" : true
        });
        this.popup.show ();
        this.popup.center ();
    }
    , onAddEscalationClick : function () {
        this.popup = Ext.create("Ext.window.Window",  {
            "title" : "#{msgs.notification_add_escalation}"
            , "overflowX" : "hidden"
            , "overflowY" : "auto"
            , "loader" :  {
                "url" : CONTEXT_PATH + "/include/escalation.jsf"
                , "scripts" : true
                , "callback" : this.onAddEscalationLoad.bind(this)
                , "autoLoad" : true
            }
            , "width" : 600
            , "height" : 475
            , "modal" : true
        });
        this.popup.show ();
        this.popup.center ();
    }
    , getNextSequence : function () {
        return ++this.sequence;
    }
    , loadRemindersForExistingCertification : function () {
        Ext.Ajax.request( {
            "url" : CONTEXT_PATH + "/rest/notifications/?certId=blah"
            , "success" : this.onAjaxLoad.bind(this)
        });
    }
    , onAjaxLoad : function (response) {
        var restResult = Ext.decode(response.responseText);
        this.notificationsConfig = restResult.result;
        this.createHash ();
        this.createOrderedConfigs ();
    }
    , createHash : function () {
        this.configsHash =  new Hash ();
        for (var i = 0; i < this.notificationsConfig.configs.length; ++i) {
            var config = this.notificationsConfig.configs[i];
            if (i == 0) {
                config.previousConfig = null;
            } else {
                config.previousConfig = this.notificationsConfig.configs[i - 1];
            }
            if (i == this.notificationsConfig.configs.length - 1) {
                config.nextConfig = null;
            } else {
                config.nextConfig = this.notificationsConfig.configs[i + 1];
            }
            config.startDay = this.calculateStartDay (config);
            config.sequence = this.getNextSequence ();
            this.configsHash["" + config.sequence] = config;
        }
    }
    , calculateStartDay : function (config) {
        if (config.type == "Reminder") {
            return this.getStartDayForReminder (config);
        } else {
            return this.getStartDayForEscalation (config);
        }
    }
    , createOrderedConfigs : function () {
        var ordered =  new Array ();
        for (var i = 0; i < this.configsHash.values ().length; ++i) {
            var config = this.configsHash.values ()[i];
            ordered.push(config);
        }
        ordered.sort (this.sortConfigs.bind(this));
        for (var i = 0; i < ordered.length; ++i) {
            var config = ordered[i];
            if (i == 0) {
                config.previousConfig = null;
            } else {
                config.previousConfig = ordered[i - 1];
            }
            if (i == ordered.length - 1) {
                config.nextConfig = null;
            } else {
                config.nextConfig = ordered[i + 1];
            }
        }
        this.notificationsConfig.configs = ordered;
        var records =  new Array ();
        for (var i = 0; i < ordered.length; ++i) {
            var config = ordered[i];
            var nextConfig = null;
            if (i < ordered.length - 1) {
                nextConfig = ordered[i + 1];
            }
            records.push(this.createRecord (config, nextConfig));
        }
        this.grid.store.loadData (records, false);
    }
    , createRecord : function (config, nextConfig) {
        if (config.type == "Reminder") {
            return this.createReminderRecord (config, nextConfig);
        } else {
            return this.createEscalationRecord (config, nextConfig);
        }
    }
    , createReminderRecord : function (config, nextConfig) {
        var daysText;
        if (config.once) {
            daysText = config.startDay.getDisplay ();
        } else {
            daysText = config.startDay.getDisplay () + " - ";
            if (nextConfig != null) {
                daysText = daysText + nextConfig.startDay.newDayBySubtractingDays (1).getDisplay ();
            } else {
                daysText = daysText +  Ext.create('sailpoint.util.Day', this.notificationsConfig.endDate).getDisplay ();
            }
        }
        var obj =  {
            "id" : this.getConfigId (config.sequence)
            , "name" : "#{msgs.notification_remind}"
            , "sequence" : config.sequence
            , "config" : config
            , "daysText" : daysText
            , "repeatText" : (config.once ? "#{msgs.notification_once}" : "#{msgs.notification_every} " + config.onceEveryHowManyDays + " #{msgs.notification_days}")
        };
        return obj;
    }
    , createEscalationRecord : function (config, nextConfig) {
        var daysText = config.startDay.getDisplay ();
        var name = "#{msgs.notification_remind}";
        if (config.maxReminders > 0) {
            name = Ext.String.format("#{msgs.notification_escalate_after}", config.maxReminders);
        } else {
            name = "#{msgs.notification_escalate}";
        }
        var obj =  {
            "id" : this.getConfigId (config.sequence)
            , "name" : name
            , "sequence" : config.sequence
            , "config" : config
            , "daysText" : daysText
        };
        return obj;
    }
    , sortConfigs : function (left, right) {
        return left.startDay.getTime () - right.startDay.getTime ();
    }
    , getStartDayForReminder : function (config) {
        if (config.before) {
            var endDate =  Ext.create('sailpoint.util.Day', this.notificationsConfig.endDate);
            return endDate.newDayBySubtractingDays (config.startHowManyDays);
        } else {
            var startDate =  Ext.create('sailpoint.util.Day', this.notificationsConfig.startDate);
            return startDate.newDayByAddingDays (config.startHowManyDays);
        }
    }
    , getStartDayForEscalation : function (config) {
        if (config.maxReminders > 0) {
            if (config.previousConfig == null) {
                return null;
            }
            if (config.previousConfig.type == "Escalation") {
                return null;
            }
            var previousReminderConfig = config.previousConfig;
            if (previousReminderConfig.once) {
                return null;
            }
            if (previousReminderConfig.onceEveryHowManyDays == 0) {
                return null;
            }
            return previousReminderConfig.startDay.newDayByAddingDays (config.maxReminders * previousReminderConfig.onceEveryHowManyDays);
        } else if (config.before) {
            var endDate =  Ext.create('sailpoint.util.Day', this.notificationsConfig.endDate);
            return endDate.newDayBySubtractingDays (config.startHowManyDays);
        } else {
            var startDate =  Ext.create('sailpoint.util.Day', this.notificationsConfig.startDate);
            return startDate.newDayByAddingDays (config.startHowManyDays);
        }
    }
    , onEditConfigClick : function (sequence) {
        var theConfig = this.configsHash["" + sequence];
        var title = null;
        var url = null;
        var callback = null;
        if (theConfig.type == "Reminder") {
            title = "Edit Reminder";
            url = CONTEXT_PATH + "/include/reminder.jsf";
            callback = this.onEditReminderLoad.bind(this, sequence);
        } else {
            title = "Edit Escalation";
            url = CONTEXT_PATH + "/include/escalation.jsf";
            callback = this.onEditEscalationLoad.bind(this, sequence);
        }
        this.popup = Ext.create("Ext.window.Window",  {
            "title" : title
            , "loader" :  {
                "url" : url
                , "scripts" : true
                , "callback" : callback
                , "autoLoad" : true
            }
            , "width" : 600
            , "height" : 475
            , "modal" : true
        });
        this.popup.show ();
        this.popup.center ();
    }
    , onEditReminderLoad : function (sequence) {
        var reminderConfig = this.configsHash["" + sequence];
        this.currentNotification =  Ext.create('sailpoint.notification.Reminder');
        if (!this.isEditAllowed (reminderConfig)) {
            this.currentNotification.disable ();
        }
        this.currentNotification.setInput (this, false, reminderConfig);
        this.hookupPopupSaveButtonEvent ();
        this.hookupPopupCancelButtonEvent ();
    }
    , onEditEscalationLoad : function (sequence) {
        var escalationConfig = this.configsHash["" + sequence];
        this.currentNotification =  Ext.create('sailpoint.notification.Escalation');
        if (!this.isEditAllowed (escalationConfig)) {
            this.currentNotification.disable ();
        }
        this.currentNotification.setInput (this, false, escalationConfig);
        this.hookupPopupSaveButtonEvent ();
        this.hookupPopupCancelButtonEvent ();
    }
    , onDeleteConfigClick : function (sequence) {
        var config = this.configsHash["" + sequence];
        if (config.type == "Reminder") {
            if (config.nextConfig != null && config.nextConfig.type == "Escalation") {
                var escalationConfig = config.nextConfig;
                if (escalationConfig.maxReminders > 0) {
                    Ext.MessageBox.alert("#{msgs.notification_unable_to_delete_reminder_title}", Ext.String.format("#{msgs.notification_unable_to_delete_reminder_message}", escalationConfig.maxReminders));
                    return ;
                }
            }
        }
        Ext.MessageBox.confirm("#{msgs.notification_confirm_delete_title}", "#{msgs.notification_confirm_delete_message}?", this.onConfirmDeleteClick.bind(this, sequence));
    }
    , onConfirmDeleteClick : function (sequence, val) {
        if (val == "yes") {
            this.configsHash.remove ("" + sequence);
            this.createOrderedConfigs ();
        }
    }
    , getConfigId : function (sequence) {
        return "config" + sequence;
    }
    , onAddReminderLoad : function () {
        this.currentNotification =  Ext.create('sailpoint.notification.Reminder');
        var config = this.notificationsConfig.defaultReminderConfigForNew;
        config.sequence = this.getNextSequence ();
        if (this.notificationsConfig.configs.length == 0) {
            config.previousConfig = null;
        } else {
            config.previousConfig = this.notificationsConfig.configs[this.notificationsConfig.configs.length - 1];
        }
        config.nextConfig = null;
        this.currentNotification.setInput (this, true, config);
        this.hookupPopupCancelButtonEvent ();
        this.hookupPopupAddButtonEvent ();
        this.buildTooltips ();
    }
    , buildTooltips : function () {
        if (typeof(buildTooltips) != "undefined") {
        buildTooltips();
        }
    }
    , onAddEscalationLoad : function () {
        this.currentNotification =  Ext.create('sailpoint.notification.Escalation');
        var config = this.notificationsConfig.defaultEscalationConfigForNew;
        config.sequence = this.getNextSequence ();
        if (this.notificationsConfig.configs.length == 0) {
            config.previousConfig = null;
        } else {
            config.previousConfig = this.notificationsConfig.configs[this.notificationsConfig.configs.length - 1];
        }
        config.nextConfig = null;
        config.maxReminders = 0;
        config.startHowManyDays = 7;
        config.before = true;
        this.currentNotification.setInput (this, true, config);
        this.hookupPopupCancelButtonEvent ();
        this.hookupPopupAddButtonEvent ();
        this.buildTooltips ();
    }
    , hookupPopupCancelButtonEvent : function () {
        this.currentNotification.getCancelButton ().onclick = this.onPopupCancelButtonClick.bind(this);
    }
    , hookupPopupAddButtonEvent : function () {
        this.currentNotification.getActionButton ().onclick = this.onPopupAddButtonClick.bind(this);
    }
    , hookupPopupSaveButtonEvent : function () {
        this.currentNotification.getActionButton ().onclick = this.onPopupSaveButtonClick.bind(this);
    }
    , onPopupCancelButtonClick : function () {
        this.popup.close ();
    }
    , onPopupAddButtonClick : function () {
        this.popupSubmit (true);
    }
    , onPopupSaveButtonClick : function () {
        this.popupSubmit (false);
    }
    , popupSubmit : function (add) {
        this.currentNotification.getMessages ().close ();
        if (!this.currentNotification.validate ()) {
            return ;
        }
        var config = this.currentNotification.createConfigFromCurrentSelectedOptions ();
        var startDate = this.calculateStartDay (config);
        if (this.doesAnotherStartOnSameDay (config, startDate)) {
            this.currentNotification.getMessages ().showValidation ("#{msgs.notification_conflicting_start_date_title}: " + Ext.String.format("#{msgs.notification_conflicting_start_date_message_same_day}", startDate.getDisplay ()));
            return ;
        }
        var daysBeforeStart = sailpoint.util.Day.calculateDaysInBetween (startDate,  Ext.create('sailpoint.util.Day', this.notificationsConfig.startDate));
        if (daysBeforeStart > 0) {
            this.currentNotification.getMessages ().showValidation ("#{msgs.notification_conflicting_start_date_title}: " + Ext.String.format("#{msgs.notification_conflicting_start_date_message_cannot_start_x_days_before}", daysBeforeStart));
            return ;
        }
        var daysAfterEnd = sailpoint.util.Day.calculateDaysInBetween ( Ext.create('sailpoint.util.Day', this.notificationsConfig.endDate), startDate);
        if (daysAfterEnd > 0) {
            this.currentNotification.getMessages ().showValidation ("#{msgs.notification_conflicting_start_date_title}: " + Ext.String.format("#{msgs.notification_conflicting_start_date_message_cannot_start_x_days_after}", daysAfterEnd));
            return ;
        }
        if (!this.validateAddOrSaveSpecific (add, config)) {
            return ;
        }
        config.enabled = true;
        config.startDay = startDate;
        this.configsHash["" + config.sequence] = config;
        this.createOrderedConfigs ();
        this.popup.close ();
    }
    , validateAddOrSaveSpecific : function (add, config) {
        if (add) {
            return this.validateAddSpecific (config);
        } else {
            return this.validateSaveSpecific (config);
        }
    }
    , validateAddSpecific : function (config) {
        return this.validateIsBetweenExistingReminderAndEscalation (config);
    }
    , validateSaveSpecific : function (config) {
        var startDay = this.calculateStartDay (config);
        if (config.previousConfig != null) {
            if (startDay.isEqualTo (config.previousConfig.startDay) || startDay.isBefore (config.previousConfig.startDay)) {
                this.currentNotification.getMessages ().showValidation ("#{msgs.notification_conflicting_start_date_title}: " + Ext.String.format("#{msgs.notification_conflicting_start_date_message_cannot_start_before}", config.previousConfig.startDay.getDisplay ()));
                return false;
            }
        }
        if (config.nextConfig != null) {
            if (startDay.isEqualTo (config.nextConfig.startDay) || startDay.isAfter (config.nextConfig.startDay)) {
                this.currentNotification.getMessages ().showValidation ("#{msgs.notification_conflicting_start_date_title}: " + Ext.String.format("#{msgs.notification_conflicting_start_date_message_cannot_start_after}", config.nextConfig.startDay.getDisplay ()));
                return false;
            }
            if (config.nextConfig.type == "Escalation") {
                var nextEscalation = config.nextConfig;
                if (nextEscalation.maxReminders > 0) {
                    var current = config;
                    var nextEscalationStartDay = startDay.newDayByAddingDays (nextEscalation.maxReminders * current.onceEveryHowManyDays);
                    if (nextEscalation.nextConfig != null) {
                        if (nextEscalationStartDay.isEqualTo (nextEscalation.nextConfig.startDay) || nextEscalationStartDay.isAfter (nextEscalation.nextConfig.startDay)) {
                            this.currentNotification.getMessages ().showValidation ("#{msgs.notification_conflicting_start_date_title}: " + "#{msgs.notification_conflicting_start_date_message_dependent_escalation}");
                            return false;
                        }
                    }
                    nextEscalation.startDay = nextEscalationStartDay;
                }
            }
        }
        return true;
    }
    , validateIsBetweenExistingReminderAndEscalation : function (config) {
        var startDay = this.calculateStartDay (config);
        var offending = this.findOffendingEscalationConfig (startDay);
        if (offending != null && offending.sequence != config.sequence) {
            this.currentNotification.getMessages ().showValidation ("#{msgs.notification_conflicting_start_date_title}: " + Ext.String.format("#{msgs.notification_conflicting_start_date_message_escalation}", startDay.getDisplay (), offending.startDay.getDisplay (), offending.maxReminders, offending.previousConfig.startDay.getDisplay ()));
            return false;
        }
        return true;
    }
    , findOffendingEscalationConfig : function (day) {
        for (var i = 0; i < this.notificationsConfig.configs.length; ++i) {
            var config = this.notificationsConfig.configs[i];
            if (config.type == "Escalation") {
                var escalationConfig = config;
                if (escalationConfig.maxReminders > 0) {
                    if (day.isInBetweenIncluding (escalationConfig.previousConfig.startDay, escalationConfig.startDay)) {
                        return escalationConfig;
                    }
                }
            }
        }
        return null;
    }
    , doesAnotherStartOnSameDay : function (theConfig, theConfigStartDay) {
        for (var i1=0; i1<this.notificationsConfig.configs.length; ++i1) {
            config = this.notificationsConfig.configs[i1];
            if (config.sequence != theConfig.sequence && config.startDay.isEqualTo (theConfigStartDay)) {
                return true;
            }
        }
        return false;
    }
    , onContextMenu : function (gridView, record, htmlElement, index, e, eventOptions) {
        var contextMenu =  Ext.create('Ext.menu.Menu');
        var config = record.get ("config");
        var editText = null;
        if (this.isEditAllowed (config)) {
            editText = "#{msgs.menu_edit}";
        } else {
            editText = "#{msgs.menu_view}";
        }
        var editItem =  Ext.create('Ext.menu.Item',  {
            "text" : editText
            , "iconCls" : "editBtn"
            , "handler" : this.onEditConfigClick.bind(this, parseInt(record.get ("sequence")))
        });
        contextMenu.add (editItem);
        if (this.isDeleteAllowed (config)) {
            var deleteItem =  Ext.create('Ext.menu.Item',  {
                "text" : "#{msgs.menu_delete}"
                , "iconCls" : "deleteBtn"
                , "handler" : this.onDeleteConfigClick.bind(this, parseInt(record.get ("sequence")))
            });
            contextMenu.add (deleteItem);
        }
        e.stopEvent ();
        contextMenu.showAt (e.xy);
    }
    , isEditAllowed : function (config) {
        if (!this.pastStagedPhase) {
            return true;
        }
        if (!config.fromDb) {
            return true;
        }
        if (this.hasMovedOnToNext (config)) {
            return false;
        }
        var allowed;
        var today = sailpoint.util.Day.today ();
        if (config.startDay.isBefore (today) || config.startDay.isEqualTo (today)) {
            allowed = false;
        } else {
            return allowed = true;
        }
        return allowed;
    }
    , isDeleteAllowed : function (config) {
        if (!this.pastStagedPhase) {
            return true;
        }
        if (!config.fromDb) {
            return true;
        }
        if (this.hasMovedOnToNext (config)) {
            return false;
        }
        var allowed;
        var today = sailpoint.util.Day.today ();
        if (config.startDay.isBefore (today) || config.startDay.isEqualTo (today)) {
            if (config.type == "Reminder") {
                var reminderConfig = config;
                if (reminderConfig.once) {
                    allowed = false;
                } else {
                    allowed = true;
                }
            } else {
                allowed = false;
            }
        } else {
            return allowed = true;
        }
        return allowed;
    }
    , hasMovedOnToNext : function (config) {
        if (config.nextConfig == null) {
            return false;
        }
        var today = sailpoint.util.Day.today ();
        return (config.nextConfig.startDay.isBefore (today) || config.nextConfig.startDay.isEqualTo (today));
    }
});
