/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.form.MultiTextRecord', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'id', type: 'string'},
        {name: 'displayName', type: 'string'}
    ]
});

Ext.define('SailPoint.form.MultiTextTrigger', {
    extend: 'Ext.form.field.Trigger',
    alias: 'widget.multitexttrigger',
    triggerCls: 'multitext-trigger',
    onTriggerClick: function() {
        this.fireEvent('trigger', this, this.getValue());
    }
});

/**
 * @class SailPoint.form.MultiSelect
 * @extends Ext.form.ComboBox
 */
Ext.define('SailPoint.form.MultiText', {
    extend : 'Ext.form.FieldContainer',
    alias : 'widget.multitext',

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
     * @cfg {Integer} Width of the selections grid. This will default to the width of
     * the select if no value is supplied.
     */
    selectionsGridWidth : null,

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
    textBox : null,

    /**
     * This is required by FormPanel
     */
    isFormField : true,

    layout:'anchor',

    constructor: function(config) {

        var gridConf = {
            xtype: 'sortablegrid',
            showSortButtons : config.sortable,
            disabled : config.disabled,
            showRemoveButton: !config.disabled,
            maskOnDisable: false,
            store : SailPoint.Store.createStore({
                //if no id on the config, try for itemId, as it may be using itemId to get around IE caching problems. See Bug18745
                storeId : "store-multitext-" + (config.gridId ? config.gridId : 'store-' + (config.id ? config.id : config.itemId)),
                fields: ['id', 'displayName'],
                data : []
            }),
            columns : [{
                name : 'displayName',
                dataIndex : 'displayName',
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

        if(config.selectionsGridWidth) {
            gridConf.width = config.selectionsGridWidth;
        }

        if(Ext.isDefined(config.gridId)) {
            gridConf.id = config.gridId;
        }

        var tplExpression = config.comboTemplate || '{'+config.displayField+'}';

        var componentId = config.id ? config.id : Ext.id();
        var msgTarget = componentId + "_errors";

        var triggerConf = {
            xtype: 'multitexttrigger',
            anchor:'100%',
            margin:0,
            msgTarget: msgTarget,
            listeners:{
                'trigger' : {
                    fn: this.addValue,
                    scope: this
                }
            }
        };

        Ext.applyIf(config, {
            layout: 'anchor',
            items: [triggerConf, gridConf, {xtype:'container',html:'<div style="display:none" id="' + msgTarget + '" class="x-form-invalid-under"></div>'}]
        });

        this.callParent(arguments);
    },

    createRecord : function(id, displayName) {
        return SailPoint.form.MultiSelectRecord.create({
            'id': id,
            'displayName': displayName
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

        this.inputBox = this.items.get(0);

        this.inputBox.enableKeyEvents = true;
        this.inputBox.on('keypress', function(field, event, eventOpts){
            if (event.getKey() == Ext.EventObject.ENTER){
                this.addValue(field, field.getValue());
            }
        }, this);


       this.selectionsGrid = this.items.get(1);
       this.selectionsStore = this.selectionsGrid.getStore();

       if (this.value){
          this.setValue(this.convertInitialValueToRecord(this.value));
       }
    },

    // When we call getStore on a multiselect, assume we want the combo box store.
    getStore : function() {
        return this.items.get(0).getStore();
    },

    /**
     * Convert value to Model objects so that we can insert them into
     * the section store grid. We're expecting on of the following formats:
     *
     * 1. A single object: {id:'foo', displayName:'bar'}
     * 2. An array of arrays = [['foo', 'bar'],['baz','bat']]
     * 3. An array of model objects = [{id:'foo', displayName:'bar'}, {id:'baz', displayName:'bat'}]
     */
    convertInitialValueToRecord : function(value){
        var result = [];
        if (value){
            if (Object.prototype.toString.apply(value) === '[object Array]'){
                for(var i=0;i<value.length;i++){
                    var o = value[i];
                    if (Object.prototype.toString.apply(o) === '[object Array]'){
                        result.push(this.createRecord(o[0], o[1]));
                    } else if (typeof o == 'string' || typeof o == 'number' || typeof o == 'boolean'){
                        result.push(this.createRecord(o, o));
                    } else if (typeof o == 'object'){
                        result.push(o);
                    }
                }
            } else if (typeof value == 'string'){
                result.push(this.createRecord(value, value));
            } else if (typeof value == 'object'){
                result.push(value);
            }
        }

        return result;
    },

    /**
     * @private Adds selected value to the list of selections. The value will be trimmed before
     * being added to the selection list.
     */
    addValue : function(field, val){

        if (val)
            val = Ext.util.Format.trim(val);

        if (val && val.length > 0){
            var modelName = this.selectionsStore.model.modelName;
            var record = Ext.create(modelName, {id:val, displayName:val});
            this.addRecord(field, [record]);
        }
    },

     /**
     * @private Called when a record is selected in the comboBox.
     */
    addRecord : function(input, recordArr, eventOpts){
         var record;
         if(recordArr[0]){
            record = recordArr[0];
        }
        var id = record.data['id'];
        if (this.selectionsStore.find('id', id) == -1){
            var recordCopy = record.copy(); // copy the rec so we can modify it in events..
            this.fireEvent('beforeAdd', input, recordCopy);
            this.selectionsStore.add(recordCopy);
            this.fireEvent('add', recordCopy);
            this.selectionsGrid.getView().refresh();
        }

        // check for a value before clearing, this prevents
        // the component from blowing up when records are added
        // before the component is rendered.
        if (input){
            input.setValue('');
        }
    },

    getInputBox : function() {
        return this.items.get(0);
    },

    getSelectionsStore : function(){
        return this.selectionsStore;
    },

    /**
     * Returns the array of values for this component.
     */
    getValue : function(){
        var values = [];
        if (this.selectionsStore ){
            this.selectionsStore.each(
                function(item){
                    this.values.push(item.get("id"));
                }, {values:values}
            );
        }

        return values;
    },

    setValue : function(value) {
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
        this.getInputBox().clearInvalid();
    },

    reset : function() {
        this.clear();

        this.getInputBox().reset();
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
        return this.getInputBox().validate();
    },
    markInvalid: function(msg){
        return this.getInputBox().markInvalid(msg);
    }

});