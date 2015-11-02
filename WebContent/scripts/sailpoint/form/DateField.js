/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.form.DateField', {
	extend : 'Ext.form.field.Date',
	alias : 'widget.spdate',

    invalidText: "#{msgs.error_invalid_date_input}",
    
    constructor: function(config) {
        if (config.value && config.value !== '') {
            config.value = new Date(config.value);
        }
        config.format = SailPoint.DateFormat;
        this.callParent(arguments);
    },

    getSPFormValue: function() {
        var dtVal = '';
        
        if (this.value && this.value != this.emptyText){
            var dt = SailPoint.form.DateField.superclass.getValue.call(this);
            if (dt) {

                // If this is an endDate in a date range, advance the date to
                // the last millisec of the day
                if (this.endDate === true || this.endDate === 'true'){
                    dt.setHours(23);
                    dt.setMinutes(59);
                    dt.setSeconds(59);
                    dt.setMilliseconds(999);
                }

                dtVal = dt.getTime();
            }
        }

        return dtVal;
    }

});