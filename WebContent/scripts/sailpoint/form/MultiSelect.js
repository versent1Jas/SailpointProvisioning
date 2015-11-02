/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.form.MultiSelectRecord', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'id', type: 'string'},
        {name: 'displayName', type: 'string'},
        {name: 'name', type:'string'}
    ]
});

/**
 * @class SailPoint.form.MultiSelect
 * @extends Ext.form.ComboBox
 */
Ext.define('SailPoint.form.MultiSelect', {
    extend : 'Ext.form.FieldContainer',
    alias : 'widget.multiselect',
    requires : "SailPoint.grid.SortableGrid",
    
    mixins : {
        // Since this component acts like a field, include support for it.
        fieldSupport : 'Ext.form.field.Field'
    },

    //multiSelect : true,
    
    /**
     * @cfg {boolean} True if the selections should be sortable. If true, buttons will be displayed
     * along side the grid of selected items. Defaults to false.
     */
    sortable : false,

    /**
     * @cfg {boolean} True if the selection in the combo box should be
     * automatically added to the selected values lsit.
     */
    forceSelection : true,

    /**
     * @cfg {Integer} Width of the selections grid. This will default to the width of
     * the select if no value is supplied.
     */
    selectionsGridWidth : null,
    
    /**
     * @cfg {boolean} True to ignore default width behavior of 300 pixels.  Useful when 
     * you want to specify an anchor : '80% 80%' (width height) allowing the container
     * to determine the width for you.
     */
    ignoreWidth : false,

    /**
     * @cfg {Integer} Height of the selections grid.
     */
    selectionsGridHeight:128,

    /**
     * @private reference to the selections grid
     */
    selectionsGrid : null,

    /**
     * @private reference to the selections grid store
     */
    selectionsStore : null,
    
    /**
     * @private reference to the combo box
     */
    comboBox : null,
    
    /**
     * @cfg (boolean) Indicates that this is an empty store and that the user will be entering
     * free flow values that are not chosen from a store.
     */
    emptyStore : false,

    /**
     * This is required by FormPanel
     */
    isFormField : true,

    layout:'anchor',
    
    /**
     * @cfg (String) anchor configuration to apply to child elements in the format '80% 80%' width height. 
     */
    anchorConfig: null,

    /**
     * @cfg (String) Template expression for the combo box items
     */
    comboTemplate: null,
    
    forceQuery: false,

    /**
     * @cfg (Array) List of extra model fields that should be included
     * in the combo configuration.
     */
    extraFields : null,

    constructor: function(config) {

        // Set defaults for the display and value fields
        Ext.applyIf(config, {
            displayField: 'displayName',
            valueField: 'id'
        });
        if (config.ignoreWidth) {
            this.ignoreWidth = config.ignoreWidth;
        }

        // If we're using allowed values the data will come in as
        // a array of arrays. This will cause us to have default field names
        if (config.allowedValues && config.allowedValues.length > 0){
            config.valueField = 'field1';
            config.displayField = 'field2';
        }

        var fields = [config.valueField, config.displayField];
        if(config.iconField) {
            fields.push(config.iconField);
            delete config.iconField;
        }

        var gridConf = {
            xtype: 'sortablegrid',
            showSortButtons : config.sortable,
            disabled : config.disabled,
            maskOnDisable: false,
            showRemoveButton: !config.disabled,
            store : SailPoint.Store.createStore({
                //if no id on the config, try for itemId, as it may be using itemId to get around IE caching problems. See Bug18745
                storeId : "store-multiselect-" + (config.gridId ? config.gridId : 'store-' + (config.id ? config.id : config.itemId)),
                fields: fields,
                data : []
            }),
            columns : [{
                name : config.displayField,
                dataIndex : config.displayField,
                flex : 1
            }],
            height : config.selectionsGridHeight ? config.selectionsGridHeight : 128,
            autoScroll : true,
            hideHeaders : true,
            bodyStyle : 'border:1px solid #B5B8C8', // add a border that stands out on a grey background
            viewConfig : {
                scrollOffset : 1
            }
        };

        if (config.allowValueClick) {
            gridConf.allowValueClick = true;
            gridConf.listeners = {
                recordClicked: SailPoint.viewManagedAttribute
            }
        }

        if (this.ignoreWidth === false) {
            Ext.apply(gridConf, {
                width: config.selectionsGridWidth ? config.selectionsGridWidth : 300
            });
        }
        
        if(Ext.isDefined(config.gridId)) {
            gridConf.id = config.gridId;
        }

        var tplExpression = config.comboTemplate || '{'+config.displayField+'}';
        var msgTarget = (config.id || Ext.id()) + "_errors";

        var comboConf = {
            xtype: 'spcombo',
            margin: 0,
            height: 30,
            msgTarget: msgTarget,
            editable: config.editable,
            pageSize: config.pageSize ? config.pageSize : 5,
            datasourceUrl: config.datasourceUrl,
            valueField: config.valueField,
            listConfig: {
                getInnerTpl: function(){
                    return tplExpression;
                }
            },
            extraFields: config.extraFields,
            baseParams: config.baseParams
        };

        if(Ext.isDefined(config.identitySuggestFilter)) {
            comboConf.identitySuggestFilter = config.identitySuggestFilter;
            delete config.identitySuggestFilter;
        }

        if(Ext.isDefined(config.filter)) {
            comboConf.filter = config.filter;
            delete config.filter;
        }
        
        if (this.ignoreWidth === false) {
            Ext.apply(comboConf, {
                width: gridConf.width
            });
            if(config.comboWidth || config.width) {
                comboConf.width = config.comboWidth ? config.comboWidth : config.width;
                delete config.comboWidth;
            }
        } else {
            Ext.apply(comboConf, {
                ignoreWidth: true
            });
        }
        
        if(Ext.isDefined(config.matchFieldWidth)) {
            comboConf.matchFieldWidth = config.matchFieldWidth;
            delete config.matchFieldWidth;
        }

        if (config.store) {
            comboConf.store = config.store;
            delete config.store;
        }

        if (config.allowedValues && config.allowedValues.length > 0){
            comboConf.allowedValues = config.allowedValues;
            delete config.allowedValues;
        }
        
        if(config.emptyText) {
            comboConf.emptyText = config.emptyText;
            delete config.emptyText;
        }
        
        if(Ext.isDefined(config.allowBlank)) {
            comboConf.allowBlank = config.allowBlank;
            delete config.allowBlank;
        }

        if (config.emptyStore){
            comboConf.forceSelection = false;
            delete config.forceSelection;
        } 
        else if(Ext.isDefined(config.forceSelection)) {
            comboConf.forceSelection = config.forceSelection;
            delete config.forceSelection;
        }
        
        if(Ext.isDefined(config.suggest)) {
            comboConf.suggest = config.suggest;
            delete config.suggest;
        }
        
        if (Ext.isDefined(config.comboConf)) {
            Ext.apply(comboConf, config.comboConf);
            delete config.comboConf;
        }
        
        if (Ext.isDefined(config.anchorConfig)) {
            Ext.apply(comboConf, {anchor: config.anchorConfig});
            Ext.apply(gridConf, {anchor: config.anchorConfig});
            delete config.anchorConfig;
        }
        
        Ext.applyIf(config, {
            layout: 'anchor',
            items: [comboConf, gridConf, {xtype:'container',html:'<div style="display:none" id="'+msgTarget+'" class="x-form-invalid-under"></div>'}]
        });

        this.callParent(arguments);
    },

    createRecord : function(id, displayName, name) {
        return SailPoint.form.MultiSelectRecord.create({
            'id': id,
            'displayName': displayName,
            'name': name
        });
    },

    initComponent : function(){
        this.callParent(arguments);

        this.addEvents(
            /**
             * @event add
             * Fires when an item is added to this multi suggest
             * @param {Ext.data.Record} record  The record that was added.
             * @param {Ext.EventObject} event   The event that caused the add.
             */
            'add',
            'select',
            'beforeAdd',
            /**
             * @event remove
             * Fires when an item is removed from this multi suggest
             * Store this, Ext.data.Record record, Number index
             * @param {Ext.data.Store} store  The store that was updated.
             * @param {Ext.data.Record} record  The record which was removed
             */
            'remove'
        );

        this.comboBox = this.items.get(0);
        this.comboBox.editable = true;

        if (!this.emptyStore) {
            this.comboBox.on('select', this.addRecord, this);
        }
        else {
            this.comboBox.enableKeyEvents = true;
            this.comboBox.on('keypress', this.handleEnterKey, this);
        }

        this.selectionsGrid = this.items.get(1);
        this.selectionsStore = this.selectionsGrid.getStore();
       
        if(this.selectionsGrid) {
            this.selectionsGrid.on('recordRemoved', this.removeRecord, this);
        }

        if (this.value){
            this.setValue(this.value);
        }
    },
    
    /**
     * @param comboElement ID of the element where you want to render the combobox
     * @param selectionsGridElement ID of the element where you want to render the selections grid.
     */
    renderSeparately : function(comboElement, selectionsGridElement) {
        this.comboBox.render(comboElement);
        this.selectionsGrid.render(selectionsGridElement);
    },
    
    // When we call getStore on a multiselect, assume we want the combo box store.
    getStore : function() {
        return this.comboBox.getStore();
    },

    /**
     * Convert value to Model objects so that we can insert them into
     * the section store grid. We're expecting one of the following formats:
     *
     * 1. A single object: {id:'foo', displayName:'bar'}
     * 2. An array of arrays = [['foo', 'bar'],['baz','bat']]
     * 3. An array of model objects = [{id:'foo', displayName:'bar'}, {id:'baz', displayName:'bat'}]
     * 3. A single record ID value.
     */
    convertInitialValueToRecord : function(value){
        var result = [];
        if (value){
            if (Object.prototype.toString.apply(value) === '[object Array]'){
                for(var i=0;i<value.length;i++){
                    var o = value[i];
                    if (Object.prototype.toString.apply(o) === '[object Array]'){
                        result.push(this.createRecord(o[0], o[1], o[2]));
                    } else if (typeof o == 'object' || typeof o == 'string'){
                        // Attempt to find a record with the matching value
                        var record = null;
                        var recordIdx = this.comboBox.store.find('field1', o);
                        if (recordIdx > -1)
                            record = this.comboBox.store.getAt(recordIdx);
                        if (record){
                            result.push(record);
                        } else {
                            // if we can't find a matching record, just stick the value in the result
                            result.push(o);
                        }
                    }
                    else {
                      result.push(o);
                    }
                }
            } else if (typeof value == 'object'){
                result.push(value);
            } else if (typeof value == 'string'){
                return this.convertInitialValueToRecord(value.split(","));
            }
            
        }

        return result;
    },

     /**
     * @private Called when a record is selected in the comboBox.
     */
    addRecord : function(combo, recordArr, eventOpts){
        var record;
        if(recordArr[0]){
            record = recordArr[0];
        }
        var id = record.data[this.valueField];
        if (this.selectionsStore.find(this.valueField, id) === -1){
            var recordCopy = record.copy(); // copy the rec so we can modify it in events..
            this.fireEvent('beforeAdd', combo, recordCopy);
            this.selectionsStore.add(recordCopy);
            this.fireEvent('add', recordCopy);
            this.fireEvent('select', this);
            this.selectionsGrid.getView().refresh();
        }

        // check for a value before clearing, this prevents
        // the component from blowing up when records are added
        // before the component is rendered.
        if (combo){
            combo.clearValue();
        }
    },
    
    removeRecord : function(multiSelect) {
      this.fireEvent('remove', this);  
    },
    
    getComboBox : function() {
        return this.comboBox;
    },

    getSelectionsStore : function(){
        return this.selectionsStore;
    },
    
    getSelectionGrid : function() {
        return this.selectionsGrid;
    },

    /**
     * Returns the array of values for this component. This avoids returning 
     * an array of empty values.
     */
    getValue : function(){
        var values = [];
        if (this.selectionsStore ){
            this.selectionsStore.each(function(item){
                var realValue = item.get(this.valField);
                if (!Ext.isEmpty(realValue)) {
                    this.values.push(realValue);
                }
            }, {values:values, valField:this.valueField});
        }

        return values;
    },
    
    setValue : function(valueObj) {
        var value = this.convertInitialValueToRecord(valueObj);
        
        for(var i = 0; i < value.length; i++) {
            var record = value[i];
            if (record) {
                this.selectionsStore.add(record);
                this.fireEvent('add', record);
                this.selectionsGrid.getView().refresh();
            }
        }
    },

    clear : function(){
        this.selectionsStore.removeAll();
    },
    
    clearInvalid : function() {
        this.getComboBox().clearInvalid();
    },
    
    reset : function() {
        this.clear();
        
        this.getComboBox().reset();
    },

    enable : function(){
        this.callParent(arguments);
        this.selectionsGrid.enable();
    },

    disable : function(){
        this.callParent(arguments);
        this.selectionsGrid.disable();
    },
    
    validate: function() {
        return this.getComboBox().validate();
    },

    markInvalid: function(msg){
        return this.getComboBox().markInvalid(msg);
    },

    handleEnterKey: function(field, event, eventOpts) {
        if (event.getKey() === Ext.EventObject.ENTER){
            var val = field.getValue();
            if (val && val.length > 0){
                var modelName = this.selectionsStore.model.modelName,
                    record, recordData = {};

                recordData[this.valueField] = val;
                recordData[this.displayField] = val;

                record = Ext.create(modelName, recordData);
                this.addRecord(field, [record]);

                field.getPicker().hide();
            }
            event.stopEvent();
        }
    }

});
