/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.form.Secret', {
	extend : 'Ext.form.TextField',
	alias : 'widget.secret',

    constructor: function(config) {
        config.inputType='password';
        this.callParent(arguments);
    },

    initComponent : function(){
        SailPoint.form.Secret.superclass.initComponent.apply(this, arguments);
    }

});