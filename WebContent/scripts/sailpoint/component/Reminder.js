/**
* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved.
*
* THIS FILE IS AUTO-GENERATED FROM JAVA FILE: $iiqFolder/tools/j2js/java-code/src/sailpoint/notification/Reminder.java
* PLEASE DON'T MODIFY THIS FILE HERE.
*/

Ext.namespace ("sailpoint.notification");


Ext.define('sailpoint.notification.ReminderConfig', {
    extend : 'sailpoint.notification.ConfigBase'

    , statics : {
        copySpecificProperties : function (from, to) {
            to.once = from.once;
            to.onceEveryHowManyDays = from.onceEveryHowManyDays;
        }

    }
    , once : false
    , onceEveryHowManyDays : 0
    , clone : function () {
        var copy =  Ext.create('sailpoint.notification.ReminderConfig');
        sailpoint.notification.ConfigBase.copyBaseProperties (this, copy);
        sailpoint.notification.ReminderConfig.copySpecificProperties (this, copy);
        return copy;
    }
});


Ext.define('sailpoint.notification.Reminder', {
    extend : 'sailpoint.notification.NotificationBase'
    , constructor : function () {
        this.callParent(arguments);
    }

    , startHowManyDaysText : null
    , startHowManyDaysErrorLabel : null
    , beforeRadio : null
    , afterRadio : null
    , frequencyOnceRadio : null
    , frequencyOnceEveryRadio : null
    , frequencyErrorLabel : null
    , onceEveryText : null
    , input : null
    , setInput : function (parent, addMode, val) {
        this.parent = parent;
        this.addMode = addMode;
        this.input = val;
        this.loadValuesFromInput ();
    }
    , validate : function () {
        var valid = sailpoint.notification.Reminder.superclass.validate.call (this);
        if (valid == false) {
            return false;
        }
        this.startHowManyDaysErrorLabel.hide ();
        this.frequencyErrorLabel.hide ();
        valid = SailPoint.Utils.validateNumberGreaterThanZero (this.startHowManyDaysText, this.startHowManyDaysErrorLabel);
        if (this.frequencyOnceEveryRadio.checked) {
            valid = (SailPoint.Utils.validateNumberGreaterThanZero (this.onceEveryText, this.frequencyErrorLabel) && valid);
        }
        return valid;
    }
    , createConfigFromCurrentSelectedOptions : function () {
        var config =  Ext.create('sailpoint.notification.ReminderConfig');
        config.type = "Reminder";
        config.sequence = this.input.sequence;
        config.previousConfig = this.input.previousConfig;
        config.nextConfig = this.input.nextConfig;
        config.startHowManyDays = SailPoint.Utils.getIntValueFromElement (this.startHowManyDaysText, 0);
        config.before = this.beforeRadio.checked;
        config.once = this.frequencyOnceRadio.checked;
        config.onceEveryHowManyDays = SailPoint.Utils.getIntValueFromElement (this.onceEveryText, 0);
        this.copyBaseValuesFromInput (config);
        return config;
    }
    , initDom : function () {
        sailpoint.notification.Reminder.superclass.initDom.call (this);
        this.startHowManyDaysText = $("reminderStartHowManyDaysText");
        this.startHowManyDaysErrorLabel = $("reminderStartHowManyDaysErrorLabel");
        this.beforeRadio = $("reminderBeforeRadio");
        this.afterRadio = $("reminderAfterRadio");
        this.onceEveryText = $("reminderOnceEveryText");
        this.frequencyOnceRadio = $("reminderFrequencyOnceRadio");
        this.frequencyOnceEveryRadio = $("reminderFrequencyOnceEveryRadio");
        this.frequencyOnceRadio.onclick = this.onFrequencyRadioClick.bind(this);
        this.frequencyErrorLabel = $("reminderFrequencyErrorLabel");
    }
    , loadValuesFromInput : function () {
        sailpoint.notification.Reminder.superclass.loadValuesFromInput.call (this);
        this.startHowManyDaysText.value = "" + this.input.startHowManyDays;
        this.beforeRadio.checked = this.input.before;
        this.afterRadio.checked = !this.input.before;
        this.frequencyOnceRadio.checked = this.input.once;
        this.frequencyOnceEveryRadio.checked = !this.input.once;
        if (this.input.once) {
            this.onceEveryText.value = "";
        } else {
            this.onceEveryText.value = "" + this.input.onceEveryHowManyDays;
        }
    }
    , disable : function () {
        sailpoint.notification.Reminder.superclass.disable.call (this);
        this.startHowManyDaysText.disable ();
        this.beforeRadio.disable ();
        this.afterRadio.disable ();
        this.frequencyOnceRadio.disable ();
        this.frequencyOnceEveryRadio.disable ();
        this.onceEveryText.disable ();
    }
    , enable : function () {
        sailpoint.notification.Reminder.superclass.enable.call (this);
        this.startHowManyDaysText.enable ();
        this.beforeRadio.enable ();
        this.afterRadio.enable ();
        this.frequencyOnceRadio.enable ();
        this.frequencyOnceEveryRadio.enable ();
        this.onceEveryText.enable ();
    }
    , onFrequencyRadioClick : function () {
        if (this.frequencyOnceRadio.checked) {
            this.onceEveryText.value = "";
            this.frequencyErrorLabel.hide ();
        } else {
        }
    }
});
