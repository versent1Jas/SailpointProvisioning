/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.BaseGrid');

SailPoint.BaseGrid.initGrid = function(ajaxUrl, gridId, pageSize, isAjax) {
    var grid;
    if (gridId && gridId.length === 0)
        gridId = undefined;
    else
        grid = Ext.getCmp(gridId);
    
    if (!grid) {
        var sInfo = [{property: 'name', direction: 'ASC' }];

        if(gridState && gridState._getValue('sortColumn')){
            sInfo = [{property: gridState._getValue('sortColumn'), direction: gridState._getValue('sortOrder') }];
        }

        if (!pageSize || pageSize.length === 0) {
            pageSize = '25';
        }
        pageSize = eval(pageSize);
        
        var store = SailPoint.Store.createStore({
            model : 'SailPoint.model.Empty',
            url: ajaxUrl,
            remoteSort: true,
            pageSize : pageSize,
            sorters: sInfo
        });

        store.on('metachange', function(changedStore, newMetaData) {
            var gridPanel = Ext.getCmp(gridId);
            var columnModel = gridPanel.getColumnModel();
            var columnConfig = newMetaData.columnConfig;
            
            // Make the widths even on the column config
            var numColumns = newMetaData.fields.length;
            var gridWidth = Ext.get('example-grid').getWidth(true) - 10;
            gridPanel.setWidth(gridWidth);
            // Figure out if we already have widths set.  If so remove them 
            // from our pool of available space
            var i;
            for (i = 0; i < columnConfig.length; ++i) {
                if (columnConfig[i].width)
                    gridWidth -= columnConfig[i].width;
            }
            
            // Divide the remainder among the widthless columns
            var columnWidth = gridWidth / numColumns;
            for (i = 0; i < columnConfig.length; ++i) {
                if (!columnConfig[i].width)
                    columnConfig[i].width = columnWidth;
            }
            
            var sorters = [{property: 'name', direction: 'ASC'}];

            if(newMetaData.sorters) {
                sorters = Ext.JSON.decode(newMetaData.sorters);
            }
            else if(newMetaData.sortColumn) {
                sorters = [{property: newMetaData.sortColumn, direction: newMetaData.sortDirection}];
            }
            
            columnModel.setConfig(columnConfig);
            
            changedStore.sorters.addAll(sorters);
        });
  
        var gridWidth = '';
  
        if (!gridWidth || gridWidth.length === 0) 
            gridWidth = Ext.get('example-grid').getWidth(true);
        else
            gridWidth = eval(gridWidth);
        
        // create the grid
        grid = new SailPoint.grid.PagingGrid({
            id: gridId,
            store: store,
            cls: 'smallFontGrid selectableGrid',
            viewConfig: {
              stripeRows:true
            },
            usePageSizePlugin: true,
            // Doesn't matter what our column model is because we will reconfig it upon fetching the metadata
            columns: [{header: 'name', sortable: true}],
            // Let the sub-classes register a click handler
            // listeners: { cellclick: handleClick, itemcontextmenu: contextMenu },
            renderTo:'example-grid',
            width: gridWidth,
            height: pageSize * 21 + 45,
            bbar: new SailPoint.ExtendedPagingToolbar({
                paramBuilder: function() {
                    var grid;
                    var sortInfo;
                    
                    if (gridId)
                        grid = Ext.getCmp(gridId);
                    
                    if (grid) {
                        var lastOptions = grid.getStore().lastOptions;
                        if (lastOptions && lastOptions.params)
                            sortInfo = lastOptions.params
                    }
                    
                    if(!sortInfo && gridState && gridState._getValue('sortColumn')) {
                        sortInfo = [{property: gridState._getValue('sortColumn'), dir: gridState._getValue('sortOrder') }]
                    } else if (!sortInfo) {
                        sortInfo = [];
                    }
                    return sortInfo;
                },
                store : store,
                displayInfo: true,
                plugins: [new SailPoint.PageSizePlugin({
                    gridId: gridId,
                    comboCfg: {id: gridId + 'pagingCombo', width: 50, listConfig:{minWidth: 50}}
                })]
            })
        });

        grid.isAjax = isAjax;
        
    } else {
        store = grid.getStore();
    }
}