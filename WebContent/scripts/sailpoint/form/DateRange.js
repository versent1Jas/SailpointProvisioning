/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.form.DateRange', {
    extend : 'Ext.form.FieldContainer',
    alias : 'widget.daterange',

    mixins : {
        // Since this component acts like a field, include support for it.
        fieldSupport : 'Ext.form.field.Field'
    },
    
    startDate : null,
    
    endDate : null,

    isFormField: true,
    
    constructor: function(config) {
        // fix config so that the start date options get passed through to the 
        // date widget and not the container to maintain backward compatibility 
        // with existing code
        var startConfig = {};

        var val = config.value;
        delete config.value;

        Ext.apply(startConfig, config);
        
        startConfig.id = null;
        startConfig.itemId = null;
        startConfig.name = null;
        startConfig.fieldLabel = null;
        // fix defect 14806 objects may pass fieldWidth to specify a width
        // (in pixels) to improve display configurations
        if (config.fieldWidth) {
            startConfig.width = config.fieldWidth;
        }
        startConfig.xtype = null;
        startConfig.emptyText="#{msgs.date_range_start}";
        startConfig.submitEmptyText=false;
        if (val && val.start)
            startConfig.value = val.start;
        
        this.startDate = new SailPoint.form.DateField(startConfig);

        var endConfig = {submitEmptyText:false, emptyText:'#{msgs.date_range_end}'};
        // fix defect 14806, see comment above
        if (config.fieldWidth) {
            endConfig.width = config.fieldWidth;
        }
        if (val && val.end)
            endConfig.value = val.end;
        this.endDate = new SailPoint.form.DateField(endConfig);

        if(!config.layout) {
            config.layout = 'column';
        }
        
        config.items = [
            this.startDate,
            {
                xtype: 'container',
                html: '<span>&nbsp;&mdash;&nbsp;</span>',
                border: false,
                style: 'padding: 0px 7px;'
            },
            this.endDate
        ];

        this.callParent(arguments);
    },

    reset : function(){
        this.startDate.reset();
        this.endDate.reset();
    },

    /**
     * Gets object with a start and end date values.
     * @returns {Object} Object with a start and end property
     */
    getValue : function(){
        var start = null;
        if (this.startDate.value){
            start = this.startDate.getValue(arguments);
        }

        var end = this.endDate.getValue();

        if (!start && !end)
            return null;
        else
            return {'start':start, 'end':end};
    },

    setValue : function(dateRange){
        if(!dateRange){
            return;
        }
        
        if (dateRange.start) {
            Ext.form.DateField.superclass.setValue.call(this.startDate, this.startDate.formatDate(this.startDate.parseDate(dateRange.start)));
        } else {
            Ext.form.DateField.superclass.setValue.call(this.startDate, this.startDate.formatDate(this.startDate.parseDate(dateRange)));
        }

        if (dateRange.end) {
            this.endDate.setValue(dateRange.end);
        }
    },

    /**
     * Since we prefer to deal with Time values since they are localized,
     * this method returns the value, but converts the start and end dates to
     * long Time values.
     */
    getSPFormValue: function(){
        var start = null;
        if (this.startDate.value) {
            start = this.startDate.getSPFormValue();
        }

        var end = this.endDate.getSPFormValue();

        if (!start && !end)
            return null;
        else
            return {'start':start, 'end':end};
    },

    isValid: function(){
        return this.startDate.isValid() && this.endDate.isValid();
    }
});
