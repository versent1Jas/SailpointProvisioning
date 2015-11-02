/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.form.ComboBox', {
    extend : 'Ext.form.ComboBox',
    alias : 'widget.spcombo',

    /**
     * @cfg {Boolean} True if this component should support type-ahead.
     */
    typeAhead : true,

    /**
     * @cfg {Boolean} True if this component should function as
     * a suggest component.
     */
    suggest : true,

    /**
     * @cfg {String} Name of the field in the datastore that should be used as the
     * value of the selected item. This field value will be used when getValue() is called.
     * Defaults to 'id'
     */
    valueField : "id",

    /**
     * @cfg {String} Name of the field in the datastore that should be used to display
     * the selected item.. Defaults to 'displayName'
     */
    displayField : 'displayName',

    /**
     * @cfg {Array} Additional fields that should be used to configure the store
     * for this combo - usually used to provide more information when specifying
     * the template (tpl).  This can either be an array of strings or field
     * definition objects.  Defaults to null, in which case the valueField,
     * displayField, and iconField are used as fields.
     */
    extraFields : null,

    /**
     * @cfg {Array} Array of values used to populate the combobox.
     */
    allowedValues : null,

    /**
     * @cfg {String} Url for the json datasource for the combobox.
     */
    datasourceUrl : null,

    /**
     * @cfg {String}Message to display when the search finds zero results.
     */
    noResultsText: '#{msgs.no_results_found}',

    /**
     * @cfg {String} filter A generic filterString that should be passed to
     * the backing datasource. This String should be compileable by
     * SailPoint.object.Filter
     */
    filter : null,

    /**
     * @cfg {String} httpMethod Http method to use for this component's store,
     * this combo uses a remote store. Defaults to GET.
     */

    /**
     * @cfg {Object} baseParams Default parameters to assign to the store.
     */
    baseParams : null,

     /**
     * @cfg (String) Template expression for the combo box items. Normally
      * you can use the tpl parameter. Adding this so that it matches MultiSelect.js
     */
    comboTemplate: null,
    
    /**
     * @cfg {boolean} True to ignore default width behavior of 300 pixels.  Useful when 
     * you want to specify an anchor : '80% 80%' (width height) allowing the container
     * to determine the width for you.
     */
    ignoreWidth : false,

    constructor: function(config) {

        if (config.comboTemplate && config.comboTemplate != ''){

            if (!config.listConfig){
                config.listConfig = {};
            }

            var template  = config.comboTemplate;
            config.listConfig.getInnerTpl = function(){
                return template;
            }
        }
        
        Ext.applyIf(config.listConfig, {
            maxHeight: 350
        });

        if (config.valueField)
            this.valueField = config.valueField;
        if (config.displayField)
            this.displayField = config.displayField;
        if (config.ignoreWidth) 
            this.ignoreWidth = config.ignoreWidth;
        this.iconField = (config.iconField) ? config.iconField : 'icon';
        this.extraFields = config.extraFields;

        this.initialValue = config.value;

        this.baseParams = config.baseParams;

        if (config.suggest){
            Ext.applyIf(config, {
                minChars: 1,
                pageSize: config.pageSize ? config.pageSize : 5,
                queryDelay: 250,
                httpMethod: 'POST'
            });
            if (this.ignoreWidth === false) {
                Ext.applyIf(config, {
                    width: 300
                });
            }
            
        } else {
            if (!config.httpMethod)
                config.httpMethod = 'GET';
            if (config.editable !== true)
                config.editable = false;
        }

        this.initStore(config);

        this.callParent(arguments);
    },

    initComponent : function(){
        this.callParent(arguments);

        if (!this.listWidth)
            this.listWidth = this.width;

        if (this.suggest || this.allowedValues)
            this.setInitialValue();

    },

    initStore : function(config){

        var storeFields = [{name:this.valueField}, {name:this.displayField}, {name:this.iconField}];
        storeFields = storeFields.concat(this.calculateExtraFields());
        if (config.allowedValues){

            for(var i=0;i<config.allowedValues.length;i++){
                var val = config.allowedValues[i];
                if (val instanceof Array && val.length == 2){
                    if (val[1] === ' ')
                        config.allowedValues[i][1] === '&nbsp;'
                }
            }

            this.queryMode = 'local';
            this.store = config.allowedValues;
            this.pageSize = 0;
            config.pageSize = 0;
        } 
        else if(config.datasourceUrl) {

            this.store = SailPoint.Store.createRestStore({
              url: SailPoint.getRelativeUrl(config.datasourceUrl),
              fields: storeFields,
              initialData: config.value,
              totalProperty: config.totalProperty ? config.totalProperty : 'count',
              root: config.root ? config.root : 'objects',
              method: config.httpMethod ? config.httpMethod : 'GET',
              pageSize: config.pageSize ? config.pageSize : 5,
              extraParams : this.baseParams ? this.baseParams : {}
            });

            if (config.filter){
                this.store.getProxy().extraParams['filter'] = config.filter;
            }
            
            if (config.identitySuggestFilter){
                this.store.getProxy().extraParams['suggestId'] = config.identitySuggestFilter;
            }
            

            if (!config.suggest && !config.lazyInit)
                this.store.load({callback:this.setInitialValue, scope:this});

            this.queryMode = 'remote';
        }
    },

    /**
     * Calculate a non-null array of field definition objects based on the
     * extraFields config.
     */
    calculateExtraFields : function() {
        
        var extra = [];

        if (this.extraFields) {
            for (var i=0; i<this.extraFields.length; i++) {
                var current = this.extraFields[i];
                if (typeof current === 'string') {
                    extra.push({name: current});
                }
                else {
                    extra.push(current);
                }
            }
        }
        
        return extra;
    },
    
    /**
    * Adds a "no results" msg to the combo box's results list,
    * which displays when the query returns empty.
    */
    initList: function()
    {
        this.callParent(arguments);

        this.view.emptyText = this.noResultsText;
    },

    /**
     * Display a useful message if there's no match found.  This
     * override of the ComboBox function simply prevents the list
     * from being collapsed so that the underlying data view's
     * "emptyText" property can display.
     */
    onEmptyResults: function()
    {
        return true;
    },



    setInitialValue : function(){
        if (this.initialValue){
            if (this.initialValue[this.valueField] ){
                this.setValue(this.initialValue[this.valueField]);
            }
            else {
                this.setValue(this.initialValue);
            }
        }
    }

});

Ext.define('SailPoint.form.BooleanComboBox', {
    extend: 'Ext.form.ComboBox',
    xtype: 'spBooleanCombo',
    displayField: 'name',
    valueField: 'value',
    editable: false,
    store : Ext.create('Ext.data.Store', {
        fields : ['name', 'value'],
        data : [
           {name: '&nbsp;', value: null},
           {name: '#{msgs.txt_true}', value: 'true'},
           {name: '#{msgs.txt_false}', value: 'false'}
                ]
    }),
    setValue : function(value){
        this.callParent([value == "null" ? null : value]);
    },
    listeners: {
        //Hack to allow Empty String as record name
        select: function(combo, record, opts) {
            if(record[0].data.value == null) {
                this.clearValue();
            }
        }
    }
    
    
});
