/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * @class SailPoint.VariableColumnWidthPlugin
 * @extends Ext.util.Observable
 * A control that allows users to expand and contract column widths on a grid
 * @constructor Create a new VariableColumnWidthPlugin
 * @param {Object} config Configuration options
 *        {String} gridId - Id of grid that is using this plugin
 * @author Bernie Margolis
 */
Ext.define('SailPoint.VariableColumnWidthPlugin', {
    extend : 'Ext.util.Observable',
    constructor: function(config) {
         this.gridId = config.gridId;
         this.title = config.title;
         this.runningMsg = config.runningMsg;
         
         this.callParent(arguments);
    },
    
    init: function(pagingToolbar){
        this.pagingToolbar = pagingToolbar;
        this.pagingToolbar.on('render', this.onRender, this);
    },
    
    //private
    incrementWidth: function(button, event) {
        var grid = Ext.getCmp(button.gridId);
        var header = grid.headerCt;
        var numColumns = header.getColumnCount();
        var currentWidth;
        if (numColumns > 3) {
            currentWidth = header.items.get(3).width;
            SailPoint.VariableColumnWidthPlugin.prototype.updateWidth(grid, currentWidth + 36);
        }
    },
    
    // private
    decrementWidth: function(button, event) {
        var grid = Ext.getCmp(button.gridId);
        var header = grid.headerCt;
        var numColumns = header.getColumnCount();
        var currentWidth;
        var newWidth;
        if (numColumns > 3) {
            currentWidth = header.items.get(3).width;
            newWidth = currentWidth - 36;
            if (newWidth < 36) {
                newWidth = 36;
            }
            
            SailPoint.VariableColumnWidthPlugin.prototype.updateWidth(grid, newWidth);
        }
    },
    
    // private
    updateWidth: function(grid, width) {
        var i;
        var header = grid.headerCt;
        var numColumns;
        var column;
        var columnState;
        var view;
        var totalProgress;
        var increment;
        var currentProgress = 1;
        
        numColumns = header.getColumnCount();
        totalProgress = numColumns - 3;
        increment = (totalProgress - (totalProgress % 4))/ 4;
        
        if (numColumns > 3) {
            for (i = 3; i < numColumns; ++i) {
                column = header.items.get(i);
                columnState = column.getColumnState();
                columnState.width = width;
                if (i % increment == 0) {
                    Ext.MessageBox.updateProgress(0.25 * currentProgress++, '#{msgs.role_mining_resizing_columns}');
                }
                column.applyColumnState(columnState);
            }
            grid.getStore().getProxy().extraParams['dataWidth'] = width;
        }
        
        view = grid.getView();
        view.on('refresh', function(view) { 
            view.getNodes().each(SailPoint.roles.MiningResultViewer.styleRow);
        }, view, { single: true });
        grid.reconfigure();
        Ext.MessageBox.close();
    },
        
    //private
    onRender: function(){
        this.pagingToolbar.add('-');
        this.pagingToolbar.add('#{msgs.grid_label_column_width}');
        this.pagingToolbar.add({
            iconCls: 'deleteBtn', 
            handler: this.decrementWidth, 
            gridId: this.gridId,
            xtype: 'splongrunningtaskbtn',
            title: this.title,
            runningMsg: this.runningMsg
        });
        this.pagingToolbar.add({
            iconCls: 'addBtn', 
            handler: this.incrementWidth, 
            gridId: this.gridId,
            xtype: 'splongrunningtaskbtn',
            title: this.title,
            runningMsg: this.runningMsg
        });
        this.pagingToolbar.add(' ');
    }
});
