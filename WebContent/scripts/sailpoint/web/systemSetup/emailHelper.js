/**
* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved.
*
* THIS FILE IS AUTO-GENERATED FROM JAVA FILE: $iiqFolder/tools/j2js/java-code/src/sailpoint/web/systemSetup/EmailHelper.java
* PLEASE DON'T MODIFY THIS FILE HERE.
*/

Ext.namespace ("sailpoint.web.systemSetup");


Ext.define('sailpoint.web.systemSetup.NotifierType', {

    statics : {
        Smtp: 0
        , RedirectToEmail: 1
        , RedirectToFile: 2
    }
});


Ext.define('sailpoint.web.systemSetup.EncryptionType', {

    statics : {
        NONE: 0
        , SSL: 1
        , TLS: 2
    }
});


Ext.define('sailpoint.web.systemSetup.EmailHelper', {
    constructor : function () {
        this.notifierTypeElement = $("editForm:emailNotifierType");
        this.redirectingEmailAddressRowElement = $("redirectingEmailAddressRow");
        this.redirectingFilenameRowElement = $("redirectingFilenameRow");
        this.smtpEncryptionTypeElement = $("editForm:smtpEncryptionType");
        this.smtpHostRowElement = $("smtpHostRow");
        this.smtpPortRowElement = $("smtpPortRow");
        this.smtpFromAddressRowElement = $("smtpFromAddressRow");
        this.smtpEncryptionTypeRowElement = $("smtpEncryptionTypeRow");
        this.smtpUsernameRow = $("smtpUsernameRow");
        this.smtpPasswordRow = $("smtpPasswordRow");
        this.smtpConfirmPasswordRow = $("smtpConfirmPasswordRow");
        this._debug = false;
    }

    , notifierTypeElement : null
    , redirectingEmailAddressRowElement : null
    , redirectingFilenameRowElement : null
    , smtpEncryptionTypeElement : null
    , smtpHostRowElement : null
    , smtpPortRowElement : null
    , smtpFromAddressRowElement : null
    , smtpEncryptionTypeRowElement : null
    , smtpUsernameRow : null
    , smtpPasswordRow : null
    , smtpConfirmPasswordRow : null
    , _debug : false
    , initialize : function () {
        this.debug ("initialize()");
        this.onNotifierTypeChange ();
    }
    , findNotifierType : function () {
        this.debug("findNotifierType()");
        return this.notifierTypeElement.selectedIndex;
    }
    , findSmtpEncryptionType : function () {
        this.debug("findSmtpEncryptionType()");
        return this.smtpEncryptionTypeElement.selectedIndex;
    }
    , debug : function (msg) {
        if (this._debug == true) {
        console.warn(msg);
        }
    }
    , onNotifierTypeChange : function () {
        this.debug ("onNotifierTypeChange()");
        var notifierType = this.findNotifierType ();
        this.debug ("notifierType: " + notifierType);
        if (notifierType == sailpoint.web.systemSetup.NotifierType.Smtp) {
            this.redirectingEmailAddressRowElement.hide ();
            this.redirectingFilenameRowElement.hide ();
            this.smtpHostRowElement.show ();
            this.smtpPortRowElement.show ();
            this.smtpUsernameRow.show ();
            this.smtpPasswordRow.show ();
            this.smtpConfirmPasswordRow.show ();
            this.smtpEncryptionTypeRowElement.show ();
        } else if (notifierType == sailpoint.web.systemSetup.NotifierType.RedirectToEmail) {
            this.redirectingEmailAddressRowElement.show ();
            this.redirectingFilenameRowElement.hide ();
            this.smtpHostRowElement.show ();
            this.smtpPortRowElement.show ();
            this.smtpUsernameRow.show ();
            this.smtpPasswordRow.show ();
            this.smtpConfirmPasswordRow.show ();
            this.smtpEncryptionTypeRowElement.show ();
        } else {
            this.redirectingFilenameRowElement.show ();
            this.redirectingEmailAddressRowElement.hide ();
            this.smtpHostRowElement.hide ();
            this.smtpPortRowElement.hide ();
            this.smtpEncryptionTypeRowElement.hide ();
            this.smtpUsernameRow.hide ();
            this.smtpPasswordRow.hide ();
            this.smtpConfirmPasswordRow.hide ();
        }
        if (this.getTabPanel () != null) {
            this.getTabPanel ().updateLayout ();
        }
    }
    , updateLayoutOnEmailNotifyChange : function () {
        this.debug ("updateLayoutOnEmailNotifyChange()");
        if (this.getTabPanel () != null) {
            this.getTabPanel ().updateLayout ();
        }
    }
    , getTabPanel : function () {
        return Ext.getCmp("identitySettingsTabPan");
    }
});
var emailHelper;
Ext.onReady(function() {
emailHelper = Ext.create('sailpoint.web.systemSetup.EmailHelper');
emailHelper.initialize();
});
