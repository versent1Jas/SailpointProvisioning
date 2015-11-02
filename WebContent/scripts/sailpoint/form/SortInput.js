/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */


Ext.define('SailPoint.form.SortInput', {
	extend : 'Ext.form.FieldContainer',
	alias : 'widget.sortinput',

    mixins : {
    	// Since this component acts like a field, include support for it.
    	fieldSupport : 'Ext.form.field.Field'
    },

    isFormField: true,

    constructor : function(config){

        var fieldInitVal = config.value ? config.value.field : null;
        var ascendingInitVal = config.value ? config.value.ascending : true;

        config.items = [
            {
                xtype:'combobox',
                flex:1,
                value:fieldInitVal,
                store:config.columns
            },
            {
                xtype:'checkbox',
                flex:1,
                checked:ascendingInitVal,
                margin: "0 0 0 10px",
                boxLabel : "#{msgs.rept_arg_sort_asc}"
            }
        ];
        config.layout = 'hbox';
        config.msgTarget = 'under';

        this.callParent(arguments);
    },

    getValue : function(){
        return {
            field:this.items.get(0).getValue(),
            ascending: this.items.get(1).getValue()
        };
    },

    setValue : function(val){
        if (val){
            this.items.get(0).setValue(val['field']);
            this.items.get(1).setValue(value['ascending']);
        } else {
            this.items.get(0).setValue(null);
            this.items.get(1).setValue(true);
        }
    }


});