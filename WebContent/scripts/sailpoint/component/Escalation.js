/**
* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved.
*
* THIS FILE IS AUTO-GENERATED FROM JAVA FILE: $iiqFolder/tools/j2js/java-code/src/sailpoint/notification/Escalation.java
* PLEASE DON'T MODIFY THIS FILE HERE.
*/

Ext.namespace ("sailpoint.notification");


Ext.define('sailpoint.notification.EscalationConfig', {
    extend : 'sailpoint.notification.ConfigBase'

    , statics : {
        copySpecificProperties : function (from, to) {
            to.maxReminders = from.maxReminders;
            to.escalationRuleId = from.escalationRuleId;
        }

    }
    , maxReminders : 0
    , escalationRuleId : null
    , clone : function () {
        var copy =  Ext.create('sailpoint.notification.EscalationConfig');
        sailpoint.notification.ConfigBase.copyBaseProperties (this, copy);
        sailpoint.notification.EscalationConfig.copySpecificProperties (this, copy);
        return copy;
    }
});


Ext.define('sailpoint.notification.Escalation', {
    extend : 'sailpoint.notification.NotificationBase'
    , constructor : function () {
        this.callParent(arguments);
    }

    , maxRemindersRadio : null
    , afterRadio : null
    , beforeRadio : null
    , maxRemindersText : null
    , maxRemindersErrorLabel : null
    , escalationAfterText : null
    , daysAfterErrorLabel : null
    , escalationBeforeText : null
    , daysBeforeErrorLabel : null
    , escalationRuleSelect : null
    , escalationRuleErrorLabel : null
    , input : null
    , createConfigFromCurrentSelectedOptions : function () {
        var config =  Ext.create('sailpoint.notification.EscalationConfig');
        config.sequence = this.input.sequence;
        config.previousConfig = this.input.previousConfig;
        config.nextConfig = this.input.nextConfig;
        config.type = "Escalation";
        if (this.maxRemindersRadio.checked) {
            config.maxReminders = SailPoint.Utils.getIntValueFromElement (this.maxRemindersText, 0);
        } else if (this.afterRadio.checked) {
            config.before = false;
            config.startHowManyDays = SailPoint.Utils.getIntValueFromElement (this.escalationAfterText, 0);
        } else {
            config.before = true;
            config.startHowManyDays = SailPoint.Utils.getIntValueFromElement (this.escalationBeforeText, 0);
        }
        config.escalationRuleId = SailPoint.Utils.getValueFromSelect (this.escalationRuleSelect, null);
        this.copyBaseValuesFromInput (config);
        return config;
    }
    , setInput : function (parent, addMode, val) {
        this.parent = parent;
        this.addMode = addMode;
        this.input = val;
        this.loadValuesFromInput ();
    }
    , validate : function () {
        var valid = sailpoint.notification.Escalation.superclass.validate.call (this);
        if (valid == false) {
            return false;
        }
        this.maxRemindersErrorLabel.hide ();
        this.daysAfterErrorLabel.hide ();
        this.daysBeforeErrorLabel.hide ();
        this.escalationRuleErrorLabel.hide ();
        if (this.maxRemindersRadio.checked) {
            if (!SailPoint.Utils.validateNumberGreaterThanZero (this.maxRemindersText, this.maxRemindersErrorLabel)) {
                valid = false;
            }
        } else if (this.afterRadio.checked) {
            if (!SailPoint.Utils.validateNumberGreaterThanZero (this.escalationAfterText, this.daysAfterErrorLabel)) {
                valid = false;
            }
        } else {
            if (!SailPoint.Utils.validateNumberGreaterThanZero (this.escalationBeforeText, this.daysBeforeErrorLabel)) {
                valid = false;
            }
        }
        if (this.escalationRuleSelect.selectedIndex < 1) {
            valid = false;
            this.escalationRuleErrorLabel.show ();
            this.escalationRuleErrorLabel.innerHTML = "#{msgs.escalation_select_rule}";
        }
        return valid;
    }
    , initDom : function () {
        sailpoint.notification.Escalation.superclass.initDom.call (this);
        this.maxRemindersRadio = $("maxRemindersRadio");
        this.afterRadio = $("afterRadio");
        this.beforeRadio = $("beforeRadio");
        this.maxRemindersRadio.onclick = this.onRadioClick.bind(this);
        this.afterRadio.onclick = this.onRadioClick.bind(this);
        this.beforeRadio.onclick = this.onRadioClick.bind(this);
        this.maxRemindersText = $("maxRemindersText");
        this.maxRemindersErrorLabel = $("maxRemindersErrorLabel");
        this.escalationAfterText = $("escalationAfterText");
        this.daysAfterErrorLabel = $("daysAfterErrorLabel");
        this.escalationBeforeText = $("escalationBeforeText");
        this.daysBeforeErrorLabel = $("daysBeforeErrorLabel");
        this.escalationRuleSelect = $("escalationRuleSelect");
        this.escalationRuleErrorLabel = $("escalationRuleErrorLabel");
    }
    , loadValuesFromInput : function () {
        sailpoint.notification.Escalation.superclass.loadValuesFromInput.call (this);
        this.enableDisableMaxReminders ();
        if (this.input.maxReminders > 0) {
            this.maxRemindersRadio.checked = true;
            this.maxRemindersText.value = "" + this.input.maxReminders;
            this.escalationAfterText.value = "";
            this.escalationBeforeText.value = "";
        } else if (this.input.before) {
            this.beforeRadio.checked = true;
            this.escalationBeforeText.value = "" + this.input.startHowManyDays;
            this.maxRemindersText.value = "";
            this.escalationAfterText.value = "";
        } else {
            this.afterRadio.checked = true;
            this.escalationAfterText.value = "" + this.input.startHowManyDays;
            this.maxRemindersText.value = "";
            this.escalationBeforeText.value = "";
        }
        SailPoint.Utils.setValueInSelect (this.escalationRuleSelect, this.input.escalationRuleId);
    }
    , disable : function () {
        sailpoint.notification.Escalation.superclass.disable.call (this);
        this.maxRemindersRadio.disable ();
        this.beforeRadio.disable ();
        this.afterRadio.disable ();
        this.maxRemindersText.disable ();
        this.escalationRuleSelect.disable ();
        this.escalationAfterText.disable ();
        this.escalationBeforeText.disable ();
    }
    , enable : function () {
        sailpoint.notification.Escalation.superclass.enable.call (this);
        this.maxRemindersRadio.enable ();
        this.beforeRadio.enable ();
        this.afterRadio.enable ();
        this.maxRemindersText.enable ();
        this.escalationRuleSelect.enable ();
        this.escalationAfterText.enable ();
        this.escalationBeforeText.enable ();
    }
    , enableDisableMaxReminders : function () {
        var enableMax = false;
        if (this.input.previousConfig != null && this.input.previousConfig.type == "Reminder") {
            var previousConfig = this.input.previousConfig;
            if (previousConfig.once == false) {
                enableMax = true;
            }
        }
        if (enableMax) {
            this.maxRemindersRadio.enable ();
            this.maxRemindersText.enable ();
        } else {
            this.maxRemindersRadio.disable ();
            this.maxRemindersText.disable ();
        }
    }
    , onRadioClick : function () {
        if (this.maxRemindersRadio.checked) {
            this.escalationAfterText.value = "";
            this.escalationBeforeText.value = "";
        } else if (this.afterRadio.checked) {
            this.maxRemindersText.value = "";
            this.escalationBeforeText.value = "";
        } else {
            this.maxRemindersText.value = "";
            this.escalationAfterText.value = "";
        }
    }
});
