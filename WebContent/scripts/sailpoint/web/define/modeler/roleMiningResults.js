/* (c) Copyright 2010 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.namespace('SailPoint', 'SailPoint.roles');

SailPoint.roles.getMiningResultsPanel = function(config) {
    var panelId = 'miningResultsPanel';
    var roleMiningResultsPanel = Ext.getCmp(panelId);
    var activeItem;
    if (config && config.activeItem) {
        activeItem = config.activeItem;
    } else {
        activeItem = 0;
    }
    
    if (!roleMiningResultsPanel) {
        roleMiningResultsPanel = new Ext.Panel({
           id: panelId,
           title: config.title,
           layout: 'card',
           activeItem: activeItem,
           items: [
               SailPoint.roles.getMiningResultsGrid(),
               SailPoint.roles.getItRoleMiningResultsPanel({
                   title: '#{msgs.title_automated_directed_mining}'
               })
           ]
        });

        roleMiningResultsPanel.on('activate', function(contentPanel) {
            if (!contentPanel.isLoaded) {
                roleMiningResultsPanel.getLayout().setActiveItem(0);
                contentPanel.isLoaded = true;
            }
        });
        
        roleMiningResultsPanel.on('deactivate', SailPoint.roles.closeDialogs);
    }
    
    return roleMiningResultsPanel;
};

SailPoint.roles.clickResult = function(gridView, record, HTMLitem, index, e, eOpts){
    var window;
    var id = record.getId();
    var name = record.get('name');
    var type = record.get('definition-type');
    var statusId = record.get('statusId');
  
    if (type === 'ITRoleMining' && statusId === 1) {
        Ext.getCmp('miningResultsPanel').getLayout().setActiveItem(1);
        Ext.getCmp('itRoleMiningResultsPanel').getStore().getProxy().extraParams['ITRoleMiningTaskResults'] = id;
        // name is just used to display the progress bar message in roleMiningExportCsv.js 
        Ext.getCmp('itRoleMiningResultsPanel').getStore().getProxy().extraParams['ITRoleMiningTaskResultsName'] = name;
        Ext.getCmp('itRoleMiningResultsPanel').getStore().load();
    } else if (statusId > 0) {
        window = SailPoint.Role.Mining.getTaskResultWindow();
        Ext.getCmp('resultViewerContent').miningResultId = id;
        window.showTaskResults(id);
    }
};

SailPoint.roles.closeDialogs = function() {
    var groupSummaryWindow = Ext.getCmp('itRoleMiningGroupSummary');
    var csvExportDialog = Ext.getCmp( 'roleMiningExportCsvDialog' );
    var roleCreationDialog = Ext.getCmp('itRoleMiningCreateRoleDialog');
    var roleMiningPopulationWindow = Ext.getCmp('roleMiningPopulationWindow');
    var businessRoleMiningResults = Ext.getCmp('taskResultViewerWindow');
    var filterInfoWindow = Ext.getCmp('itFilterInfo');
    
    if (groupSummaryWindow) {
        groupSummaryWindow.hide();
    }
    
    if (csvExportDialog) {
        csvExportDialog.hide();
    }
    
    if (roleCreationDialog) {
        roleCreationDialog.hide();
    }
    
    if (roleMiningPopulationWindow) {
        roleMiningPopulationWindow.hide();
    }
    
    if (businessRoleMiningResults) {
        businessRoleMiningResults.hide();
    }
    
    if (filterInfoWindow) {
        filterInfoWindow.hide();
    }
};

SailPoint.roles.deleteResult = function(menuItem, event) {
    var resultToDelete = menuItem.resultToDelete;
    Ext.MessageBox.confirm('#{msgs.title_automated_mining}', Ext.String.format('#{msgs.are_you_sure_delete}', resultToDelete), function(buttonId) {
        if (buttonId == 'yes') {
            $('itRoleMiningDeleteResultForm:itRoleMiningResultToDelete').value = resultToDelete;
            $('itRoleMiningDeleteResultForm:deleteITRoleMiningTaskResult').click();
        } 
    });
};

SailPoint.roles.terminate = function(menuItem, event) {
    var resultToTerminate = menuItem.resultToTerminate;
    Ext.MessageBox.confirm('#{msgs.title_automated_mining}', Ext.String.format('#{msgs.are_you_sure_terminate}', resultToTerminate), function(buttonId) {
        if (buttonId == 'yes') {
            Ext.Ajax.request({
                url: SailPoint.getRelativeUrl('/rest/roleMining/terminate'),
                method: 'POST',
                params: {resultName: resultToTerminate},
                callback: function(options, success, response) {
                    var result = Ext.JSON.decode(response.responseText);
                    var successful = result.isTerminated;
                    
                    if (successful) {
                        Ext.MessageBox.alert('#{msgs.menu_label_role_mining}', result.msg, function() {
                            Ext.getCmp('miningResultsGrid').getStore().load();
                        });
                    } else {
                        Ext.MessageBox.show({
                            title:'#{msgs.err_dialog_title}',
                            msg: result.msg,
                            buttons: Ext.MessageBox.OK,
                            icon: Ext.MessageBox.ERROR
                        });
                    }
                }
            });
        }
    });    
};

SailPoint.roles.viewFailure = function(menuItem, event) {
    var failureToView = menuItem.failureToView;
    Ext.Ajax.request({
        url: SailPoint.getRelativeUrl('/rest/roleMining/failureInfo'),
        method: 'POST',
        params: {resultName: failureToView},
        callback: function(options, success, response) {
            var businessRoleMiningResultViewer;
            var failureInfo = Ext.JSON.decode(response.responseText);
            if (failureInfo.type === 'ITRoleMining') {
                Ext.MessageBox.show({
                    title:'#{msgs.title_automated_mining}',
                    msg: failureInfo.errorMsg,
                    buttons: {ok: '#{msgs.view_it_role_mining_partial}', cancel: '#{msgs.button_cancel}'},
                    icon: Ext.MessageBox.ERROR,
                    fn: function(buttonId, text, opt) {
                        if (buttonId == 'ok') {
                            Ext.getCmp('miningResultsPanel').getLayout().setActiveItem(1);
                            Ext.getCmp('itRoleMiningResultsPanel').getStore().getProxy().extraParams['ITRoleMiningTaskResults'] = failureToView;
                            Ext.getCmp('itRoleMiningResultsPanel').getStore().load();
                        } 
                    }
                });
            } else {
                businessRoleMiningResultViewer = SailPoint.Role.Mining.getTaskResultWindow();
                Ext.getCmp('resultViewerContent').miningResultId = failureInfo.id;
                businessRoleMiningResultViewer.showTaskResults(options.params.resultName);
            }
        }
    });
};

SailPoint.roles.getMiningResultsGrid = function() {
    var resultsColumnConfig = Ext.JSON.decode($('miningResultsGridConfig').value);

    // Add definition-type back to columnConfig so we can access the data in the store below.
    // We don't want to do this on the server since that would generate another column on the results grid
    if(resultsColumnConfig && resultsColumnConfig.fields) {
        resultsColumnConfig.fields.push('definition-type');
    }

    var resultsStore = SailPoint.Store.createStore({
      storeId: 'resultsStore',
      url: CONTEXT_PATH + '/monitor/tasks/viewRoleMiningResultsDataSource.json',
      root: 'objects',
      totalProperty: 'count',
      fields: resultsColumnConfig.fields,
      remoteSort: true,
      extraParams: {types: 'RoleMining,ITRoleMining'},
      autoLoad: false,
      sorters:[{property: 'completed', direction: 'DESC' }],
      simpleSortMode : true
    });
    
    resultsStore.on('load', function() {
      Ext.MessageBox.hide();
    });

    var resultsGrid = new SailPoint.grid.PagingGrid({
      store: resultsStore,
      border: false,
      id: 'miningResultsGrid',
      cls: 'smallFontGrid selectableGrid',
      pageSize:25,
      columns:resultsColumnConfig.columns,
      listeners: { itemclick: SailPoint.roles.clickResult},
      viewConfig : {
          stripeRows:true
      },
      tbar: [
           {
             xtype : 'searchfield',
             id:'resultsSearchField',
             store:resultsStore,
             paramName:'name',
             emptyText:'#{msgs.label_filter_by_result_name}',
             width:250,
             storeLimit:20
           },
           
           ' ', '#{msgs.start_date} ', ' ',
           Ext.create('Ext.form.field.Date', {
             id: 'frmStartDate',
             name: 'frmStartDate'
           }),

           ' ', '#{msgs.end_date} ', ' ',
           Ext.create('Ext.form.field.Date', {
             id: 'frmEndDate',
             name: 'frmEndDate'
           }),

           ' ', '#{msgs.filter_field_result} ', ' ',
           {
             xtype : 'combobox',
             name: 'frmResult',
             id: 'frmResult',
             listConfig: {
                 width: 100
             },
             displayField: 'name',
             valueField: 'value',
             width:100,
             store: SailPoint.Store.createStore({
               model : 'SailPoint.model.NameValue',
               storeId:'resultTypeStore',
               autoLoad: true,
               url: CONTEXT_PATH + '/monitor/tasks/taskResultStatusDataSource.json',
               root: 'objects'
             })
           },

           '->',
           {
             xtype:'button',
             gridId: 'miningResultsGrid',
             text:'#{msgs.button_filter}',
             cls : 'primaryBtn',
             handler:function(){
               var resultsGrid = Ext.getCmp(this.gridId);
               resultsGrid.getStore().getProxy().extraParams['name'] = Ext.getCmp('resultsSearchField').getValue();
    
               if(Ext.getCmp('frmEndDate').getValue()) 
                 resultsGrid.getStore().getProxy().extraParams['endDate'] = Ext.getCmp('frmEndDate').getValue().getTime();
               if(Ext.getCmp('frmStartDate').getValue()) 
                 resultsGrid.getStore().getProxy().extraParams['startDate'] = Ext.getCmp('frmStartDate').getValue().getTime();
    
               resultsGrid.getStore().getProxy().extraParams['completionStatus'] = Ext.getCmp('frmResult').getValue();
               resultsGrid.getStore().load({params:{start:0, limit:20}});
             }
           },{
             xtype:'button',
             text: '#{msgs.button_reset}',
             gridId: 'miningResultsGrid',
             handler: function(){
               var resultsGrid = Ext.getCmp(this.gridId);
               Ext.getCmp('frmResult').reset();
               Ext.getCmp('frmEndDate').reset();
               Ext.getCmp('frmStartDate').reset();
               Ext.getCmp('resultsSearchField').reset();
               resultsGrid.getStore().getProxy().extraParams['name'] = '';
               resultsGrid.getStore().getProxy().extraParams['endDate'] = '';
               resultsGrid.getStore().getProxy().extraParams['startDate'] = '';
               resultsGrid.getStore().getProxy().extraParams['completionStatus'] = '';
    
               resultsGrid.getStore().load({params:{start:0, limit:20}});
             }
           }]
    });

    resultsGrid.on('render', function(contentPanel) {
        this.getStore().load();
    });
    
    resultsGrid.on('itemcontextmenu', function(gridView, record, HTMLitem, index, e, eOpts){
        var contextMenu = new Ext.menu.Menu();
        var resultToDeleteOrExport = record.get('name');
        var statusId = record.get('statusId');
        var type = record.get('definition-type');
        var deleteItem = new Ext.menu.Item({text: '#{msgs.delete}', handler: SailPoint.roles.deleteResult, iconCls: 'roleMiningDeleteIcon'});
        var terminateItem = new Ext.menu.Item({text: '#{msgs.menu_terminate}', handler: SailPoint.roles.terminate, iconCls: 'cancelBtn'});
        var viewFailureItem = new Ext.menu.Item({text: '#{msgs.view_details}', handler: SailPoint.roles.viewFailure, iconCls: 'viewDetailsBtn'});
        deleteItem.resultToDelete = resultToDeleteOrExport; 
        terminateItem.resultToTerminate = resultToDeleteOrExport;
        viewFailureItem.failureToView = resultToDeleteOrExport;

        if (statusId > 0) {
            contextMenu.add(new Ext.menu.Item({
                text: '#{msgs.it_role_mining_view_results}', 
                handler: function () {
                    SailPoint.roles.clickResult(gridView, record, HTMLitem, index, e, eOpts);
                }, 
                iconCls: 'editBtn'
            }));
        }

        // 1 indicates success -- the others indicate a failed or pending state that should provide a context menu
        if(statusId == 1) {
            if (type === 'ITRoleMining') {
                contextMenu.add(new Ext.menu.Item({
                    text: '#{msgs.export_to_csv}', 
                    handler: function() {
                        Ext.getCmp('itRoleMiningResultsPanel').getStore().getProxy().extraParams['ITRoleMiningTaskResults'] = resultToDeleteOrExport;
                        SailPoint.roles.viewExportCsvDialog(); 
                    },
                    iconCls: 'csvBtn'
                }));
            }    
        }
        
//            int statusId = -1;
//                           case Error:
//                                statusId = 0;
//                                break;
//                            case Warning:
//                                statusId = 2;
//                                break;
//                            case Success:
//                                statusId = 1;
//                                break;
        
        // Pending state
        if (statusId == -1) {
            contextMenu.add(terminateItem);
        }
        
        if (statusId == 0) {
            contextMenu.add(viewFailureItem);
        }
        
        if (statusId >= 0) {
            contextMenu.add(deleteItem);
        }
        
        e.stopEvent();
        contextMenu.showAt(e.xy);
    });

    return resultsGrid;
};

Ext.define('SailPoint.roles.HacktasticHighlighter', {
    extend : 'Ext.grid.View',
    gridId: null,
    
    constructor: function(config) {
        this.gridId = config.gridId;
        Ext.apply(this, config);
        this.callParent(arguments);
    },
    
    initComponent : function() {
        this.callParent(arguments);
    },
    
    /*
     * @param e {Ext.EventObject} Mouseover event object
     * @param t {GridView} This GridView
     */
    onRowOver : function(e, t){
        var row = this.findRowIndex(t);
        var highlightingColor = parseInt('E6E6E6', 16);
        var rowSelectionModel = Ext.getCmp(this.gridId).getSelectionModel();
        this.callParent(arguments);
        if (!rowSelectionModel.isSelected(row)) {
            this.highlightRow(row, highlightingColor);
        }
    }, 
    
    onRowOut: function(e, t) {
        var row = this.findRowIndex(t);
        var rowSelectionModel = Ext.getCmp(this.gridId).getSelectionModel();
        this.callParent(arguments);
        
        if (row !== false && !rowSelectionModel.isSelected(row) && !e.within(this.getRow(row), true)) {
            this.resetRowHighlighting(row);
        }
    },
    
    onRowSelect : function(row){
        var highlightingColor = parseInt('DDF2D6', 16);
        this.callParent(arguments);
        this.highlightRow(row, highlightingColor);
    },

    // private
    onRowDeselect : function(row){
        this.callParent(arguments);
        this.resetRowHighlighting(row);
    },
    
    highlightRow: function(row, highlightingColor) {
        var htmlRow = this.getRow(row);
        var columnModel = Ext.getCmp(this.gridId).getColumnModel();
        var cells;
        var numCells;
        var cell;
        var cellEl;
        var columnColor;
        var highlightedColor;
        var i;
        this.callParent(arguments);

        if(row !== false){            
            //this.addRowClass(row, "x-grid-row-over");
            // .x-grid-row-over {
            //   background:#E6E6E6 url(../scripts/ext-4.1.0/resources/themes/images/default/grid/row-over.gif) repeat-x scroll left top;
            //   border:1px solid #ccc;
            // }
            
            // Every cell is special in this grid, so let's highlight it individually
            cells = Ext.DomQuery.select('div[class*=x-grid-cell-inner]', htmlRow);
            numCells = cells.length;
            
            for (i = 0; i < numCells; ++i) {
                cell = cells[i];
                cellEl = Ext.get(cell);
                if (columnModel.config[i].color) {
                    columnColor = columnModel.config[i].color.substring(1);
                    highlightedColor = '#' + (highlightingColor - parseInt('FFFFFF', 16) + parseInt(columnColor, 16) ).toString(16);
                    cellEl.setStyle('backgroundColor', highlightedColor);
                }
            }
        }
        
    },
    
    resetRowHighlighting: function(row) {
        var htmlRow = this.getRow(row);
        var cells;
        var numCells;
        var cell;
        var cellEl;
        var columnModel = Ext.getCmp(this.gridId).getColumnModel();
        var columnColor;
        var i;

        this.callParent(arguments);
        if(row !== false) {
            // this.removeRowClass(row, "x-grid-row-over");
            
            // Every cell is special in this grid, so let's unhighlight it individually
            cells = Ext.DomQuery.select('div[class*=x-grid-cell-inner]', htmlRow);
            numCells = cells.length;
            for (i = 0; i < numCells; ++i) {
                cell = cells[i];
                cellEl = Ext.get(cell);
                if (columnModel.config[i].color) {
                    columnColor = columnModel.config[i].color;
                    cellEl.setStyle('backgroundColor', columnColor);
                }
            }
        }
    }
});

SailPoint.roles.getItRoleMiningResultsPanel = function(config) {
    var gridId = 'itRoleMiningResultsPanel';
    var miningResultsPanel = Ext.getCmp(gridId);
    var store;
    
    if (!miningResultsPanel) {
        // TODO extjs4: this needs a model or fields!!
        store = SailPoint.Store.createStore({
            fields : [],
            url : CONTEXT_PATH + '/define/roles/roleMining/viewITRoleMiningResultDataSource.json',
            remoteSort : true,
            totalProperty : 'numEntitlementSets',
            root : 'entitlementSets',
            pageSize : 25,
            sorters : [{property : 'identifier', direction: 'ASC' }]
        });
        
        store.on('load', function(store, records, options) {
            var headerRow = Ext.DomQuery.selectNode('tr[class*=x-grid-hd-row]', 'itRoleMiningResultsPanel');
            var headerCells;
            var headerContentDivs;
            var columnColor;
            var columnModel = Ext.getCmp('itRoleMiningResultsPanel').headerCt;
            var view = Ext.getCmp('itRoleMiningResultsPanel').getView();
            var row;
            var cells;
            var headerWidth;
            var rowDiv;
            var i;
            var j;

            if (headerRow) {
                // Leave this out for now.  If we ever get sideways text to look nice we might have to apply this.
                // headerRow.style['height'] = '200px';
                headerCells = Ext.DomQuery.select('td', headerRow);
                headerContentDivs = Ext.DomQuery.select('div[class*=x-grid-hd-inner]', headerRow);
            }
            
            // Here's an example of what gets rendered in the column headings.  If we have to tinker
            // with them further we need to keep this in mind
            // <div style="height: 200px; text-align: center; white-space:
            // normal;" unselectable="on" class="x-grid-hd-inner
            // x-grid-hd-exactMatches">
            // <a href="#" class="x-grid-hd-btn" id="ext-gen1088"
            // style="height: 207px;"></a>
            // Identities with only these Entitlements
            // <img
            // src="/identityiq/scripts/ext-4.1.0/resources/themes/images/default/s.gif"
            // class="x-grid-sort-icon">
            // </div>
            
            
            if (headerCells) {
                for (i = 0; i < headerCells.length; ++i) {
                    headerCells[i].style['padding'] = '0px';
//                    headerCells[i].style['border'] = '1px solid #000000';
//                    headerCells[i].style['height'] = '35px';
// headerContentDivs[i].style['height'] = '35px';
// headerContentDivs[i].style['textAlign'] = 'center';
// headerContentDivs[i].style['verticalAlign'] = 'center';
                    if (i == 1 || i == 2) {
                        headerContentDivs[i].style['white-space'] = 'normal';
                        headerContentDivs[i].style['whiteSpace'] = 'normal';
                    } else if (i > 2) {
//                        columnColor = columnModel.config[i].color;
//                        headerCells[i].style['backgroundColor'] = columnColor;
//                        if (columnColor == '#FFFFFF') {
//                            headerCells[i].style['color'] = '#000000';
//                        }
                        // These settings enable sideways text -- leave them out
                        // for now because it looks
                        // really ugly
// headerContentDivs[i].style['writing-mode'] = 'tb-rl';
// headerContentDivs[i].style['MozTransform'] = 'rotate(270deg)';
// headerContentDivs[i].style['MozTransformOrigin'] = 'bottom center';
// // headerContentDivs[i].style['white-space'] = 'nowrap';
// // headerContentDivs[i].style['whiteSpace'] = 'nowrap';
// headerContentDivs[i].style['display'] = 'block';
// headerContentDivs[i].style['bottom'] = '0px';
// headerContentDivs[i].style['overflow'] = 'visible';
                    }
                }
            }
            
            // This seems unnecessary at first glance but the horizontal scrollbar won't appear without it
            view.refresh();
            
            // Hack the grid to give solid internal borders
            view.getNodes().each(SailPoint.roles.MiningResultViewer.styleRow);
        });
        
        store.on('metachange', function(changedStore, newMetaData) {
            var i;
            var sorters;
            var columnModel = miningResultsPanel.headerCt;
            var columnConfig = newMetaData.columnConfig;
            var gridPanel = Ext.getCmp(gridId);
            var columnWidth;
            var renderType;
            
            // Make the widths even on the column config
            var numColumns = newMetaData.fields.length;
            var gridWidth = gridPanel.getWidth();

            // While we're at it let's set the renderers on the columnConfig 
            // if we have to, since we couldn't do so on the server
            for (i = 0; i < numColumns; ++i) {                
                renderType = columnConfig[i].renderType; 
                if (renderType && renderType == 'entitlement') {
                    newMetaData.fields[i].renderer = SailPoint.roles.renderEntitlement;
                } else {
                    newMetaData.fields[i].renderer = SailPoint.roles.applyGrayBorder;
                    newMetaData.fields[i].locked = true; 
                }
                
                newMetaData.fields[i].header = columnConfig[i].header; 
                newMetaData.fields[i].dataIndex = columnConfig[i].dataIndex;
                newMetaData.fields[i].color = columnConfig[i].color;
            }
            
            columnModel.setConfig(columnConfig);
            
            sorters = [{property: 'name', direction: 'ASC'}];

            if(newMetaData.sorters) {
                sorters = Ext.JSON.decode(newMetaData.sorters);
            }
            else if(newMetaData.sortColumn) {
                sorters = [{property: newMetaData.sortColumn, direction: newMetaData.sortDirection}];
            }
            
            changedStore.sorters.addAll(sorters);
            
            gridPanel.totalIdentities = newMetaData.totalIdentities;
            
            Ext.getCmp('itRoleMiningResultsPanel').updateIdentityCount(newMetaData.totalIdentities);
        });

        
        miningResultsPanel = new SailPoint.roles.MiningResultViewer({
            id: gridId,
            store: store,
            cls: 'smallFontGrid selectableGrid',
            dynamic: true,
            // TODO: enableLocking: true,
            //view: new SailPoint.roles.HacktasticHighlighter({gridId: gridId, forceFit: false, emptyText: '#{msgs.it_role_mining_no_matches}'}),
            usePageSizePlugin:true,
            additionalPlugins: [new SailPoint.VariableColumnWidthPlugin({
                gridId: gridId,
                title: '#{msgs.title_role_mining_results}',
                runningMsg: '#{msgs.role_mining_resizing_columns}'
            })],
            enableHdMenu: false,
            border: true,
            listeners: { itemcontextmenu: SailPoint.roles.RoleMiningMenu },
            columns: [{
                header: 'Identifier', sortable: true, dataIndex: 'identifier'
            },{
                header: 'Identities that Match Exactly', sortable: true, dataIndex: 'exactMatches'
            },{
                header: 'Identities that Match', sortable: true, dataIndex: 'allMatches'
            }],
            tbar: [{
                text: '#{msgs.view_mining_results_list}',
                handler: function() {
                    SailPoint.roles.closeDialogs();
                    Ext.getCmp('miningResultsGrid').getStore().load();
                    Ext.getCmp('miningResultsPanel').getLayout().setActiveItem(0);
                }
            },{
                id: 'viewItRoleMiningFilterBtn',
                text: '#{msgs.view_it_role_mining_filter}',
                handler: SailPoint.roles.displayITFilterInfo
            },{
                id: 'itRoleMiningViewExportToCsv',
                text: '#{msgs.export_to_csv}',
                handler: SailPoint.roles.viewExportCsvDialog
            },
            '->',
            '#{msgs.it_role_mining_total_population}: '],
            selModel: Ext.create('Ext.selection.RowModel', { mode: 'SINGLE' }),
            autoScroll: true
        });
    }
    
    miningResultsPanel.on('resize', function(grid) {
        var roleMiningPopulationWindow = Ext.getCmp('roleMiningPopulationWindow');
        var groupSummaryWindow = Ext.getCmp('itRoleMiningGroupSummary');
        if (roleMiningPopulationWindow) {
            roleMiningPopulationWindow.setSize({width: grid.getWidth(), height: grid.getHeight()});
        }
        if (groupSummaryWindow) {
            groupSummaryWindow.alignTo(Ext.getCmp('itRoleMiningResultsPanel').getEl(), 't-t');
        }
    });

    return miningResultsPanel;
};


Ext.define('SailPoint.roles.MiningResultViewer', {
    extend : 'SailPoint.grid.PagingGrid',
    updateIdentityCount: function(count) {
        var tbar = this.getTopToolbar();
        var countTxtEl = Ext.get(tbar.items.get(4).getEl());
        if(countTxtEl && countTxtEl.update) {
          countTxtEl.update('#{msgs.it_role_mining_total_population}: ' + count);
        }
    },
    statics: {
        styleRow: function(row) {
            Ext.DomHelper.applyStyles(row, 'border: 1px solid #000; border-bottom: none; border-right:none');
            
            // Strip padding from the cells so the body's columns line up with the headers
            // Also strip out the top and bottom borders because the row divs already provide borders
            Ext.DomQuery.select('td', row).each(function(cell) {
                Ext.DomHelper.applyStyles(cell, 'padding: 0px; border: 1px solid #000; border-top: none; border-left: none;');
            });
        }        
    }
});

SailPoint.roles.RoleMiningMenu = function(gridView, record, HTMLitem, index, e, eOpts) {
    var contextMenu = new Ext.menu.Menu();
    var grid = gridView.ownerCt;
    var entitlementInfo = record.raw.entitlementInfo;
    var totalIdentities = grid.totalIdentities;
    
    var groupSummaryHandler = function(item, eventObj) {
        var i;
        var groupSummaryWindow;
        var loadMask;
        var entitlements = entitlementInfo.entitlements;
        var readOnlyEntitlements = [];
        var readOnlyInfo = {
            title: null, 
            entitlements: readOnlyEntitlements
        };
        
        for (i = 0; i < entitlements.length; ++i) {
            readOnlyEntitlements.push(Ext.applyIf({readOnly: true}, entitlements[i]));
        }

        groupSummaryWindow = Ext.getCmp('itRoleMiningGroupSummary');
        
        if (!groupSummaryWindow) {
            groupSummaryWindow = new Ext.Window({
               id: 'itRoleMiningGroupSummary',
               title: Ext.String.format('#{msgs.it_role_mining_entitlements_group}', record.get('identifier')),
               html: '<div id="itRoleMiningGroupSummaryEntitlements"/>',
               closeAction: 'hide'
            });
            
            groupSummaryWindow.updateInnerSize = function() {
                var i;
                var innerWidth = this.getWidth();
                var innerHeight = this.getHeight();
                var gswBody = Ext.get('itRoleMiningGroupSummaryEntitlements');
                var entitlementBody;
                var entitlementTable;
                gswBody.setSize({width: innerWidth, height: innerHeight});
                entitlementBody = gswBody.down('div');
                entitlementBody.setSize({width: innerWidth, height: innerHeight});
                entitlementTable = entitlementBody.down('table');
                // Get rid of unnecessary scrollbars
                if (Ext.isIE) {
                    entitlementTable.setHeight(innerHeight - 1);
                } else {
                    entitlementTable.setHeight(innerHeight);
                }
            };
            
            groupSummaryWindow.sizeToEntitlements = function() {
                var entitlementTable = Ext.DomQuery.selectNode('table[class*=entitlementsBodyTable]', $('itRoleMiningGroupSummaryEntitlements'));
                var entitlementTableWrapper = Ext.get(Ext.DomQuery.selectNode('div[class*=entitlementsBodyTableWrapper]', $('itRoleMiningGroupSummaryEntitlements')));
                // Pad out the table so it doesn't look ugly if there are too few rows
                tableRows = entitlementTable.rows;
                for (i = tableRows.length; i < 5; ++i) {
                    entitlementTable.insertRow(i);
                    entitlementTable.rows[i].insertCell(0);
                    entitlementTable.rows[i].cells[0].innerHTML = '&nbsp;';
                    entitlementTable.rows[i].cells[0].style['height'] = '30px';
                }
                
                // Apparently IE follows its own rules when applying styles.  
                // Force the height and width to the values they should have been.
                if (Ext.isIE) {
                    entitlementTableWrapper.setWidth(350);
                    entitlementTableWrapper.setHeight(153);
                }

                this.setSize({
                    width: entitlementTableWrapper.getWidth(), 
                    height: entitlementTableWrapper.getHeight()
                });
            };
            
            // Size the inner content to the panel when it's resized
            groupSummaryWindow.on('bodyresize', function(gsw, width, height){
                gsw.updateInnerSize();
            });
        } else {
            groupSummaryWindow.setTitle(Ext.String.format('#{msgs.it_role_mining_entitlements_group}', record.get('identifier')));
        }
        
        groupSummaryWindow.show();
        groupSummaryWindow.alignTo(Ext.getCmp('itRoleMiningResultsPanel').getEl(), 't-t');
        
        loadMask = groupSummaryWindow.loadMask;
        
        if (!loadMask) {
            groupSummaryWindow.loadMask = new Ext.LoadMask('itRoleMiningGroupSummaryEntitlements', {
                msg: '#{msgs.loading_data}'
            });
            
            loadMask = groupSummaryWindow.loadMask;
        }
        
        loadMask.show();
        SailPoint.Role.Mining.RoleCreationEntitlementsTemplate.overwrite(Ext.get('itRoleMiningGroupSummaryEntitlements'), readOnlyInfo);
        groupSummaryWindow.sizeToEntitlements();
        groupSummaryWindow.alignTo(Ext.getCmp('itRoleMiningResultsPanel').getEl(), 't-t');
        loadMask.hide();
    };
    
    var createRoleHandler = function() {
        SailPoint.roles.displayRoleCreationDialog(entitlementInfo);
    };
    
    var viewPopulationHandler = function() {
        SailPoint.roles.viewGroupPopulation(record, totalIdentities);
    };

    contextMenu.add(
        new Ext.menu.Item({text: '#{msgs.it_role_mining_view_group_summary}', handler: groupSummaryHandler, iconCls:'infoBtn'}),
        new Ext.menu.Item({text: '#{msgs.create_role}', handler: createRoleHandler, iconCls: 'editBtn'}),
        new Ext.menu.Item({text: '#{msgs.role_mining_view_population}', handler: viewPopulationHandler, iconCls: 'viewDetailsBtn'})
        // new Ext.menu.Separator()
        // new Ext.menu.Item({text: '#{msgs.menu_exec}', handler: function() {
        // SailPoint.roles.ExecuteMiningTemplate(MINING_TASK_ID,
        // MINING_TASK_TYPE, MINING_TASK_NAME); }, iconCls: 'executeBtn'}),
        // new Ext.menu.Separator(),
        // new Ext.menu.Item({text: '#{msgs.menu_delete}', handler:
        // SailPoint.roles.DeleteMiningTemplatePrompt, iconCls: 'deleteBtn'})
    );          
      
    e.stopEvent();
    contextMenu.showAt(e.xy);
}; 

SailPoint.roles.displayRoleCreationDialog = function (entitlementInfo) {
    var creationDialog = Ext.getCmp('itRoleMiningCreateRoleDialog');
    if (creationDialog) {
        $('createFromItRoleMiningForm:createRoleFromITMiningName').value = '';
        $('createFromItRoleMiningForm:createRoleFromITRoleMiningDescription').value = '';
        Ext.getCmp('itRoleMiningCreateRoleScopeCmp').reset();
        Ext.getCmp('createRoleFromITMiningOwnerSuggestCmp').reset();
        Ext.getCmp('createRoleFromITMiningContainerRoleSuggestCmp').reset();
        Ext.getCmp('directEntitlementsSelector').update(entitlementInfo);
        Ext.getCmp('createRoleFromITRoleMiningInheritedRolesMultiSuggest').clear();
        Ext.getCmp('inheritedEntitlementsView').update ({ entitlements: [] });
        creationDialog.show();
    } else {
        creationDialog = new SailPoint.roles.RoleCreationDialog({
            id: 'itRoleMiningCreateRoleDialog',
            border: true,
            header: false,
            autoScroll: true,
            closeAction: 'hide',
            buttonAlign: 'center',
            title: '#{msgs.create_role}',
            width: 768
        });
        // Show it once to force a render
        creationDialog.show();
        creationDialog.loadContent(entitlementInfo);
    }
    
};

Ext.define('SailPoint.roles.RoleCreationDialog', {
    extend : 'Ext.Window',
    initComponent: function(config) {
        this.loader = {};
        var roleCreationDialog = this;
        Ext.apply(this, {
            bbar: [{
                id: 'createRoleFromITRoleMiningBtn',
                text: '#{msgs.button_save}',
                cls : 'primaryBtn',
                handler: function() {
                    var creationDialog = Ext.getCmp('itRoleMiningCreateRoleDialog');
                    if (creationDialog.validate()) {
                        creationDialog.getSavingRoleMask().show();
                        var roleDescriptionCmp = Ext.getCmp('itRoleMiningCreateRoleDescriptionHTMLCmp');
                        if(roleDescriptionCmp) {
                            $('createFromItRoleMiningForm:createRoleFromITRoleMiningDescription').value = roleDescriptionCmp.getCleanValue();
                        }
                        $('createFromItRoleMiningForm:createRoleFromITRoleMining').click();
                    }
                }
            },{
                id:'cancelCreateRoleFromITRoleMiningBtn',
                text: '#{msgs.button_cancel}',
                handler: function() {
                    roleCreationDialog.hide();
                }
            }]
        });
        
        this.callParent(arguments);
    },
    
    show: function() {
        var gridHeight = Ext.getCmp('itRoleMiningResultsPanel').getHeight(); 
        SailPoint.roles.RoleCreationDialog.superclass.show.apply(this, arguments);
        this.alignTo(Ext.getCmp('itRoleMiningResultsPanel').getEl(), 't-t');
        // Make sure this window fits on the screen
        if (this.getHeight() > gridHeight) {
            this.setHeight(gridHeight);
        }
    },
    
    loadContent: function(entitlementInfo) {
        var contentPanel = this;
        if (!contentPanel.isLoaded) {
            contentPanel.getLoader().load({
                url: SailPoint.getRelativeUrl('/define/roles/roleMining/createRoleFromITRoleMining.jsf'),
                callback: function() {
                    var gridHeight;
                    contentPanel.initScopeSuggest();
                    contentPanel.initOwnerSuggest();
                    contentPanel.initContainerRoleSuggest();
                    contentPanel.directEntitlementsSelector = new SailPoint.Role.Mining.EntitlementsSelector({
                        id: 'directEntitlementsSelector',
                        binding: 'createFromItRoleMiningForm:createRoleFromITRoleMIningDirectEntitlementsJson',
                        selectorDisplay: 'createRoleFromITRoleMiningDirectEntitlements'
                    });
                    contentPanel.directEntitlementsSelector.update(entitlementInfo);
                    contentPanel.initInheritedRoleSuggest();
                    contentPanel.inheritedEntitlementsSelector = new SailPoint.Role.Mining.EntitlementsSelector({
                        id: 'inheritedEntitlementsView',
                        selectorDisplay: 'createRoleFromITRoleMiningEntitlementsFromInheritedRoles'
                    });
                    contentPanel.inheritedEntitlementsSelector.update({entitlements: []});
                    contentPanel.resetDescriptions();
                    
                    contentPanel.alignTo(Ext.getCmp('itRoleMiningResultsPanel').getEl(), 't-t');
                    gridHeight = Ext.getCmp('itRoleMiningResultsPanel').getHeight();
                    // Make sure this window fits on the screen
                    if (contentPanel.getHeight() > gridHeight) {
                        contentPanel.setHeight(gridHeight);
                    }
                },
                scope: contentPanel,
                params: {forceReset: true},
                text: '#{msgs.loading_data}',
                scripts: false,
                ajaxOptions : {
                    disableCaching: false
                }
            });

            this.body.applyStyles({
                'background': '#dddddd',
                'overflow-x': 'hidden',
                'overflow-y': 'auto'
            });
            
            contentPanel.isLoaded = true;
        }
    },
    
    initScopeSuggest: function() {
        var scopeSuggest = Ext.getCmp('itRoleMiningCreateRoleScopeCmp');
        if (!scopeSuggest) {
            scopeSuggest = new SailPoint.ScopeSuggest({
                id: 'itRoleMiningCreateRoleScopeCmp',
                renderTo: 'createRoleFromITMiningScopeSuggest', 
                binding: 'createRoleFromITMiningScope', 
                value: $('createRoleFromITMiningScope').value,
                width: 200,
                listConfig : {width : 300}
            });
        }
    },
    
    initOwnerSuggest: function() {
        var ownerSuggest = Ext.getCmp('createRoleFromITMiningOwnerSuggestCmp');
        if (!ownerSuggest) {
            ownerSuggest = new SailPoint.IdentitySuggest({
                id: 'createRoleFromITMiningOwnerSuggestCmp',
                renderTo: 'createRoleFromITMiningOwnerSuggest',
                binding: $('createFromItRoleMiningForm:createRoleFromITMiningOwner'),
                allowBlank: false,
                rawValue: $('createRoleFromITMiningDefaultOwner').innerHTML,
                baseParams: {context: 'Owner'}
            });
        }
    },
    
    initContainerRoleSuggest: function() {
        var containerRoleSuggest = Ext.getCmp('createRoleFromITMiningContainerRoleSuggestCmp');
        if (!containerRoleSuggest) {
            new SailPoint.BaseSuggest({
                id: 'createRoleFromITMiningContainerRoleSuggestCmp',
                renderTo: 'createRoleFromITMiningContainerRoleSuggest',
                binding: $('createFromItRoleMiningForm:createRoleFromITMiningContainerRole'),
                allowBlank: true,
                baseParams: {suggestType: 'containerRole'}
            });
        }
    },
    
    getDirectEntitlementsLoadMask: function() {
        var entitlementsDiv = Ext.get('createRoleFromITRoleMiningShowDirectEntitlements');
        if (!this.directEntitlementsLoadMask && entitlementsDiv) {
            this.directEntitlementsLoadMask = new Ext.LoadMask(entitlementsDiv, {
                msg: '#{msgs.role_mining_refreshing_entitlements}'
            });
        }
        
        return this.directEntitlementsLoadMask;
    }, 
    
    getSavingRoleMask: function() {
        var maskedArea = this.body ? this.body.dom : undefined;
        if (!this.savingRoleMask && maskedArea) {
            this.savingRoleMask = new Ext.LoadMask(maskedArea, {
                msg: '#{msgs.it_role_mining_creating_role}'
            });
        }
        
        return this.savingRoleMask;
    }, 
    
    initInheritedRoleSuggest: function() {
        var inheritedRolesMultiSuggest = Ext.getCmp('createRoleFromITRoleMiningInheritedRolesMultiSuggest');
        if (!inheritedRolesMultiSuggest) {
            inheritedRolesMultiSuggest = new SailPoint.MultiSuggest({
                id: 'createRoleFromITRoleMiningInheritedRolesMultiSuggest',
                renderTo: 'createRoleFromITRoleMiningInheritedRolesSuggest',
                suggestType: 'role',
                jsonData: {totalCount: 0, objects: []},
                inputFieldName: 'createFromItRoleMiningForm:createRoleFromITRoleMiningInheritedRolesInput'
            });
            
            inheritedRolesMultiSuggest.selectedStore.on('add', function() {$('createFromItRoleMiningForm:updateEntitlementsForInheritedRoles').click();}, this);
            inheritedRolesMultiSuggest.selectedStore.on('clear', function() {$('createFromItRoleMiningForm:updateEntitlementsForInheritedRoles').click();}, this);
            inheritedRolesMultiSuggest.selectedStore.on('remove', function() {$('createFromItRoleMiningForm:updateEntitlementsForInheritedRoles').click();}, this);
        }
    },
    
    resetDescriptions: function() {
        var allowRoleLocalization = $("allowRoleLocalization").innerHTML;
        var descriptionCmp = Ext.getCmp('itRoleMiningCreateRoleDescriptionHTMLCmp');
        
        if(!descriptionCmp && allowRoleLocalization == "true") {
            var descriptionEditor = new SailPoint.MultiLanguageHtmlEditor({
                renderTo: 'createRoleFromITRoleMiningDescriptionEditor',
                width:500,
                height:200,
                languageJSON : '',
                id:'itRoleMiningCreateRoleDescriptionHTMLCmp',
                value: '',
                defaultLocale: $("createRoleFromITRoleMiningDescrDefaultLocale").innerHTML
            });
        } else if (!descriptionCmp) {
            var descriptionEditor = new SailPoint.HtmlEditor({
                renderTo: 'createRoleFromITRoleMiningDescriptionEditor',
                width:500,
                height:200,
                id:'itRoleMiningCreateRoleDescriptionHTMLCmp',
                value: ''
            });
        } else {
            $('createFromItRoleMiningForm:createRoleFromITRoleMiningDescription').value = '';
            descriptionCmp.setValue('');
        }
    },
    
    displayCreateResults: function() {
        var results;
        this.getSavingRoleMask().hide();
        this.hide();
        results = Ext.JSON.decode($('ITRoleMiningRoleCreationResults').innerHTML);
        if (results.success) {
            Ext.MessageBox.show({
                title:'#{msgs.title_automated_mining}',
                msg: results.message,
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.INFO
            });
        } else {
            Ext.MessageBox.show({
                title:'#{msgs.err_dialog_title}',
                msg: results.message,
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.ERROR,
                fn: function() {
                    Ext.getCmp('itRoleMiningCreateRoleDialog').show();
                }
            });
        }
    },
    
    validate: function() {
        var name = $('createFromItRoleMiningForm:createRoleFromITMiningName').value;
        var includedEntitlements = Ext.getCmp('directEntitlementsSelector').entitlementsObj;
        var isValid = true;
        
        if (!name || name.trim().length == 0) {
            $('itRoleMiningCreateRoleNameError').style['display'] = '';
            Ext.MessageBox.show({
                title:'#{msgs.err_dialog_title}',
                msg: '#{msgs.it_role_mining_create_invalid_no_name}',
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.ERROR
            });
            isValid = false;
        }
        
        if (includedEntitlements.entitlements.length == 0) {
            isValid = false;
            Ext.MessageBox.show({
                title:'#{msgs.err_dialog_title}',
                msg: '#{msgs.it_role_mining_create_invalid_no_entitlements}',
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.ERROR
            });
        }
        
        return isValid;
    }
});


SailPoint.roles.renderEntitlement = function(value, metadata, record, rowIndex, colIndex, store) {
    var columnModel = Ext.getCmp('itRoleMiningResultsPanel').headerCt;
    var column = columnModel.getGridColumns()[colIndex];
    var tooltipTxt = column.initialConfig['tooltip'];
    // Apply the column's tooltip to this cell and add checkmarks for any
    // entitlements that are in this set
    
    if (value == 'true' || value == "TRUE") {
        metadata.style = 'background: url(' + SailPoint.getRelativeUrl('/images/icons/accept.png') + ') no-repeat scroll center center'
    } else {
        metadata.style = 'background: no-repeat scroll center center';
    }
    
    if (tooltipTxt) {
        metadata.tdAttr = 'title=' + tooltipTxt;        
    }
    
    // Apply the black border
    metadata.tdCls = 'roleMiningTableCell';
    
    return '';
};

SailPoint.roles.applyGrayBorder = function(value, metadata, record, rowIndex, colIndex, store) {
    metadata.tdCls = 'roleMiningTableCell';
    return value;
};

// Need to get the statusId from r(record)
// and use that to determine the render status.
// If value is null then default to 'Pending...'
function renderStatus (value, p, r) {
  var statusId = r.get('statusId');
  if(statusId == 1)
    return '<span class=\'successBox font10\' >#{msgs.success}</span>';
  else if(statusId == 2)
    return Ext.String.format('<span class=\'warnBox font10\' >#{msgs.warning}</span>',value);
  else if(statusId == 0)
    return Ext.String.format('<span class=\'failBox font10\' >#{msgs.fail}</span>',value); 
  else
    return Ext.String.format('{0}', value === null ? '#{msgs.task_result_pending}' : value);
}

SailPoint.roles.displayITFilterInfo = function() {
    var filterInfoWindow = Ext.getCmp('itFilterInfo');
    
    if (!filterInfoWindow) {
        filterInfoWindow = new Ext.Window({
            id: 'itFilterInfo',
            shrinkWrap: true,
            html: '<div id="itMiningFilterPopulationInfo"></div> <div id="itMiningFilterEntitlementsInfo"></div>'
        });
        
        filterInfoWindow.updateInnerSize = function() {
            var innerWidth = this.getWidth();
            var innerHeight = this.getHeight();
            var populationPortion = Ext.get('itMiningFilterPopulationInfo');
            var entitlementsPortion = Ext.get('itMiningFilterEntitlementsInfo');
            var entitlementsHeight;
            var entitlementBody;
            var entitlementTable;
            entitlementsTitleTable = entitlementsPortion.down('table[class*=entitlementsTitleTable]');
            if (entitlementsTitleTable) {
                entitlementsTitleTable.setWidth(innerWidth);
                entitlementsHeight = innerHeight - populationPortion.getHeight() - entitlementsTitleTable.getHeight();
                entitlementsPortion.setSize({width: innerWidth, height: entitlementsHeight});
                entitlementBody = entitlementsPortion.down('div');
                if (entitlementBody) {
                    entitlementBody.setSize({width: innerWidth, height: entitlementsHeight});
                    entitlementTable = entitlementBody.down('table');
                    entitlementTable.setHeight(entitlementsHeight);
                }
            }
        };
                        
        // Size the inner content to the panel when it's resized
        filterInfoWindow.on('bodyresize', function(fiw, width, height){
            fiw.updateInnerSize();
        });

        entitlementsDisplay = new SailPoint.Role.Mining.EntitlementsSelector({
            id: 'itFilterInfoEntitlements',
            selectorDisplay: 'itMiningFilterEntitlementsInfo'
        });
    }
    
    filterInfoWindow.show();
    Ext.get(filterInfoWindow.body).mask('#{msgs.loading_data}');
    

    Ext.Ajax.request({
        url: SailPoint.getRelativeUrl('/rest/roleMining/it/filterInfo'),
        method: 'POST',
        params: {resultName: Ext.getCmp('itRoleMiningResultsPanel').getStore().getProxy().extraParams['ITRoleMiningTaskResults']},
        callback: function(options, success, response) {
            var filterInfoWindow = Ext.getCmp('itFilterInfo'); 
            var stringifiedJSONObj = Ext.JSON.decode(response.responseText);
            var responseObj = Ext.JSON.decode(stringifiedJSONObj.stringifiedJSON);
            var isAvailable = responseObj.isAvailable;
            var identityFilterInfo;
            var entitlementsInfo;
            
            if (isAvailable) {
                identityFilterInfo = responseObj.identityFilterInfo;
                SailPoint.Role.Mining.IdentityFilter.overwrite('itMiningFilterPopulationInfo', identityFilterInfo);
                entitlementsInfo = responseObj.entitlementsInfo;
                Ext.getCmp('itFilterInfoEntitlements').update(entitlementsInfo, '#{msgs.role_mining_excluded_entitlements}');
                Ext.getCmp('itFilterInfo').updateLayout();
                filterInfoWindow.alignTo(Ext.getCmp('itRoleMiningResultsPanel').getEl(), 't-t');
                Ext.get(filterInfoWindow.body).unmask();
            } else {
                Ext.get(filterInfoWindow.body).unmask();
                filterInfoWindow.hide();
                Ext.MessageBox.show({
                    title:'#{msgs.err_dialog_title}',
                    msg: '#{msgs.err_it_role_mining_filter_unavailable}',
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.MessageBox.ERROR
                });
            }
        }
        
    });

    
};
