/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.form.DateTimeField', {
	extend : 'SailPoint.form.DateField',
	alias : 'widget.spdatetime',

    /**
     * Nested TimeField input object.
     */
    timeInput : null,

    initComponent : function() {

        SailPoint.form.DateTimeField.superclass.initComponent.apply(this);

        this.timeInput = new Ext.form.TimeField({
            id: this.id + '-time',
            width:120,
            disabled:this.disabled,
            increment:1
        });

        // Override the select listener, which is called by the
        // calendar popup. We want to set the date only when the user
        // picks from the calendar
        this.menuListeners.select = function(m, d){
            if (this.setDateValue)
                this.setDateValue(d);
            else
                this.setValue(d);
            this.fireEvent('select', this, d);
        };
    },

    render: function(element) {

        SailPoint.form.DateTimeField.superclass.render.apply(this, arguments);

        this.timeInput.render(this.wrap);

        // Change the wrapper for the date field and time field to inline
        // so they will line up side by side.
        this.wrap.applyStyles({
            display:'inline'
        });
        this.timeInput.wrap.applyStyles({
            display:'inline'
        });
    },

    getValue : function(){
        var value = this.callParent(arguments);

        // If the time is set, update the date value from the date input with the minutes and seconds
        // from the time input
        if (this.timeInput.getRawValue() !== ''){
            var timeFieldValue = this.timeInput.parseDate(this.timeInput.getRawValue());
            value.setHours(timeFieldValue.getHours());
            value.setMinutes(timeFieldValue.getMinutes());
            value.setSeconds(0);
            value.setMilliseconds(0);
        }

        return value;
    },

    setDateValue : function(date){
        SailPoint.form.DateTimeField.superclass.setValue.call(this, this.formatDate(this.parseDate(date)));
    },

    setTimeValue : function(date){
        if (date && Ext.isDate(date)){
            Ext.form.TimeField.superclass.setValue.call(this.timeInput, this.timeInput.formatDate(date));
        }
    },

    setValue : function(date){
        this.setDateValue(date);
        this.setTimeValue(date);
    },

    getSPFormValue: function(){

        var value = this.getValue();

        if (value){
            return value.getTime();
        }

        return "";
    }
    
});