/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.form.BooleanCheckbox', {
	extend : 'Ext.form.Checkbox',
	alias : 'widget.boolcheckbox',

	inputValue : true,
	
	uncheckedValue : false,
	
    constructor : function(config) {
        if (config.value === 'true' || config.value === true)
            config.checked = true;

        config.value = true;

        this.callParent(arguments);
    },

    getValue : function(){
        var val = this.callParent(arguments);
        if (val !== true)
            return false;

        return val;
    }
});