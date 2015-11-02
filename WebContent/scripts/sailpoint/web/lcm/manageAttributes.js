/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.LCM.ManageAttributes');

SailPoint.LCM.ManageAttributes.submit = function(button) {
    if(Ext.getDom("attributesFormId")) {
        form = Ext.getCmp(Ext.getDom("attributesFormId").value);
        form.submit('next', null);
    }
};