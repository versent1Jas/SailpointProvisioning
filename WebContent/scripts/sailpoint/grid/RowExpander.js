/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Extends the ExtJS RowExpander to provide the following changes:
 * 
 * - Single clicking on an item will expand the row
 * - The plugin component is automatically laid out when toggled
 * - Gets rid of the +/- expander column
 */
Ext.define('SailPoint.grid.RowExpander', {
    extend : 'Ext.ux.RowExpander',
    
    alias : 'plugin.sprowexpander',
    
    expandOnClick : true,
    resizeEventName : 'expandoResize',
    grid : null,
    
    init: function(grid) {
        this.grid = grid;
        Ext.ux.RowExpander.superclass.init.apply(this, arguments);
        grid.on('render', this.bindView, this, {single: true});
        
    },
    
    bindView: function() {
        this.callParent(arguments);
        
        if (this.view) {
            this.view.on('collapsebody', this.doCmpLayout, this);
            this.view.on('expandbody', this.doCmpLayout, this);
            
            if (this.expandOnClick) {
                this.view.on('itemclick', this.onItemClick, this);
            }
        }
    },
    
    onItemClick: function(view, record, item, index, e, eOpts) {
        var target = Ext.get(e.target);
        if (target && (target.hasCls('x-grid-cell-inner') ||
            target.up('div').hasCls('x-grid-cell-inner') ||
            (target.down('div') && target.down('div').hasCls('x-grid-cell-inner'))) ) {
            this.toggleRow(index, target);
        }
    },
    
    doCmpLayout: function() {
        if (this.getCmp()) {
            this.getCmp().doLayout();
        }
        if(this.grid) {
            this.grid.fireEvent(this.resizeEventName);
        }
    },
    
    isCollapsed: function(rowIndex) {
        var rowNode = this.view.getNode(rowIndex);
        var row;
        if(rowNode){
            row = Ext.get(rowNode);
        }
        if(row){
            return row.hasCls(this.rowCollapsedCls);
        }
        return false;
    },
    
    expandRow: function(rowIndex) {
        if (this.isCollapsed(rowIndex)) {
            this.toggleRow(rowIndex);
        }
    },
    
    collapseRow: function(rowIndex) {
        if (!this.isCollapsed(rowIndex)) {
            this.toggleRow(rowIndex);
        }
    }
});
