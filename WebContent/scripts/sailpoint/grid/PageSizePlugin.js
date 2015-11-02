/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * @class SailPoint.PageSizePlugin
 * @extends Ext.PagingToolbar
 * A combobox control that glues itself to a PagingToolbar's pageSize configuration property.
 * @constructor
 * Create a new PageSize plugin.
 * @param {Object} config Configuration options
 * @author Andrei Neculau - andrei.neculau@gmail.com / http://andreineculau.wordpress.com
 * @version 0.6
 */
Ext.define('SailPoint.PageSizePlugin', {
    extend : 'Ext.util.Observable',
    constructor : function(config) {
        Ext.apply(this, config);
    },
    /**
     * @cfg {String} beforeText
     * Text to display before the comboBox
     */
    beforeText: '#{msgs.pagesize_show}',
    
    /**
     * @cfg {String} afterText
     * Text to display after the comboBox
     */
    afterText: '#{msgs.pagesize_items}',
    
    /**
     * @cfg {Mixed} addBefore
     * Toolbar item(s) to add before the PageSizer
     */
    addBefore: {xtype: 'tbseparator'},

    /**
     * @cfg {Mixed} addAfter
     * Toolbar item(s) to be added after the PageSizer
     */
    addAfter: null,
    
    /**
     * @cfg {Bool} dynamic
     * True for dynamic variations, false for static ones
     */
    dynamic: false,
    
    /**
     * @cfg {Array} variations
     * Variations used for determining pageSize options
     */
    variations: [5, 10, 20, 25, 50, 100],
    
    /**
     * @cfg {Object} comboCfg
     * Combo config object that overrides the defaults
     */
    comboCfg: undefined,
    
    /**
     * @cfg (String) gridId 
     * Component ID of the grid panel that contains this instance of the page size plugin
     */
    gridId: undefined,
    
    init : function(pagingToolbar) {
        this.pagingToolbar = pagingToolbar;
        this.pagingToolbar.pageSizeCombo = this;
        this.pagingToolbar.setPageSize = Ext.bind(this.setPageSize, this);
        this.pagingToolbar.getPageSize = function(){
            return this.pageSize;
        };
        this.pagingToolbar.on('afterrender', this.onRender, this);
    },
    
    //private
    addSize : function(value){
        if (value > 0){
            this.sizes.push({'pageSize' : value});
        }
    },
    
    //private
    updateStore: function(){
        var middleValue, i, v, len;
        if (this.dynamic) {
            middleValue = this.pagingToolbar.pageSize;
            middleValue = (middleValue > 0) ? middleValue : 1;
            this.sizes = [];
            v = this.variations;
            for (i = 0, len = v.length; i < len; i++) {
                this.addSize(middleValue - v[v.length - 1 - i]);
            }
            this.addToStore(middleValue);
            for (i = 0, len = v.length; i < len; i++) {
                this.addSize(middleValue + v[i]);
            }
        } else {
            if (!this.staticSizes){
                this.sizes = [];
                v = this.variations;
                middleValue = 0;
                for (i = 0, len = v.length; i < len; i++) {
                    this.addSize(middleValue + v[i]);
                }
                this.staticSizes = this.sizes.slice(0);
            } else {
                this.sizes = this.staticSizes.slice(0);
            }
        }
        this.combo.store.loadData(this.sizes);
        this.combo.collapse();
        this.combo.setValue(this.pagingToolbar.pageSize);
    },

    setPageSize:function(value){
        this.combo.collapse();
        value = parseInt(value) || parseInt(this.combo.getValue());
        value = (value>0) ? value : 1;

        if (value === this.pagingToolbar.pageSize){
            return;
        }

        this.pagingToolbar.pageSize = value;
        this.pagingToolbar.store.pageSize = value;
        this.pagingToolbar.store.getProxy().extraParams.limit = value;
        this.pagingToolbar.store.loadPage(1);
        this.pagingToolbar.updateInfo();
        
        var stateId;
        
        if (Ext.getCmp(this.gridId)) {
            Ext.getCmp(this.gridId).pageSize = value;
            stateId = Ext.getCmp(this.gridId).stateId;
        }
        
        if(stateId) {
            new Ajax.Request(SailPoint.getRelativeUrl('/state.json'), {
              method:'post',
              parameters: {name: stateId, pageSize: this.pagingToolbar.pageSize},
              onSuccess: function(transport){},
              onFailure: function(){}
            });
        }
        this.updateStore();
    },
    
    //private
    onRender: function(){
        this.combo = Ext.ComponentMgr.create(Ext.applyIf(this.comboCfg||{}, {
            store : SailPoint.Store.createStore({
                fields:['pageSize'],
                data:[]
            }),
            displayField:'pageSize',
            valueField:'pageSize',
            queryMode:'local',
            triggerAction:'all',
            width:70,
            xtype:'combo'
        }));
        
        this.pagingToolbar.pageSize = this.pagingToolbar.store.pageSize;
        this.combo.on('select', this.setPageSize, this);
        this.combo.editable = false;
        this.updateStore();

        if (this.addAfter){
            this.pagingToolbar.add(this.addAfter);
        }

        if (this.afterText){
            this.pagingToolbar.insert(8, {xtype: 'tbtext', text: this.afterText});
        }

        var comboItem = this.pagingToolbar.insert(8, this.combo);

        if (this.beforeText){
            this.pagingToolbar.insert(8, {xtype: 'tbtext', text: this.beforeText});
        }

        if (this.addBefore){
            this.pagingToolbar.insert(8, this.addBefore);
        }
    }
});
