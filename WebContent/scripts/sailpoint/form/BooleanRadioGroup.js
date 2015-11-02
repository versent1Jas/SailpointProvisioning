/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.form.BooleanRadioGroup', {
	extend : 'Ext.form.RadioGroup',
	alias : 'widget.boolradio',

    constructor : function(config) {

        var isValueNotSet = config.value == undefined || config.value == null || config.value === '';

        config.items = [
            { boxLabel: "#{msgs.bool_radio_opt_empty}", name:config.itemId, inputValue: '',checked: isValueNotSet},
            { boxLabel: "#{msgs.bool_radio_opt_true}", name:config.itemId, inputValue: 'true',
                checked: (true === config.value || 'true' === config.value)},
            { boxLabel: "#{msgs.bool_radio_opt_false}", name:config.itemId, inputValue: 'false',
                checked: (false === config.value || 'false' === config.value) }
        ];
        config.height=50;
        this.callParent(arguments);
    },

    getValue : function(){
        var parentValue = this.callParent(arguments);

        var value = '';
        if (parentValue)
            value = parentValue[this.itemId];

        return value;
    }
});