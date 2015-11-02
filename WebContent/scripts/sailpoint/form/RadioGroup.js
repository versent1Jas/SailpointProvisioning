/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.form.RadioGroup', {
	extend : 'Ext.form.RadioGroup',
	alias : 'widget.spradio',

    constructor: function(config) {

        if (config.allowedValues){
            config.items = [];
            for(var i=0;i<config.allowedValues.length;i++){
                var val = config.allowedValues[i];
                config.items.push({
                    boxLabel: val[1], name: config.itemId, inputValue: val[0], checked: (val[0] === config.value)
                });
            }
        }

        Ext.apply(config, {
        	cls: 'spradio',
        	layout: 'column'
        });

        this.callParent(arguments);
    },

    initComponent : function(){
        this.callParent(arguments);
    },

    /**
     * Return a single value instead of an object since we know that this 
     * component requires selecting a single value.
     */
    getSPFormValue: function() {
        var value = this.getValue();
        
        // RadioGroup returns an object that maps radio name to their values
        // for selected values.  Since all of our radios have the same name
        // we force a single selection, so we can assume there is just one
        // value in here.
        if (value && Ext.isObject(value)) {
            value = value[this.itemId];
        }
        
        return value;
    },
    
    /**
     * Convenience method used to set the value of this component. 
     */
    setSPFormValue: function(value) {
        var newVal = {};

        if(!Ext.isEmpty(value) && !Ext.isEmpty(this.items)) {
            // in order to setValue on a RadioGroup you must use the underlying name
            // of the radio item, create an object, set the value on the object
            // and call the Ext setValue
            newVal[this.itemId] = value;
            
            this.setValue(newVal);
        }
    }
});