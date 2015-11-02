/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.form.PanelField', {
    extend : 'Ext.form.FieldContainer',
    alias : 'widget.panelfield',
    mixins : {
        // Since this component acts like a field, include support for it.
        fieldSupport : 'Ext.form.field.Field'
    },
    
    initComponent : function(){

        Ext.apply(this, {
            border:false,
            bodyBorder:false
        });

        this.callParent(arguments);
    },

    // overridden by config
    setValue : function(val){
        this.callParent(arguments);
    },

    // overridden by config
    getValue : function(){
        return "";
    }
});