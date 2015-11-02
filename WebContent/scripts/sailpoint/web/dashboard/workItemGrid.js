/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.Dashboard.Grid.WorkItem', {});

SailPoint.Dashboard.Grid.Type = ""; // Global type for redirecting pages.

/**
 * Top level function to create the inbox grid
 */
SailPoint.Dashboard.Grid.WorkItem.createinbox = function(gridName, fields, columns, id, priorityStore, typeStore, workgroups, currentIdentity) {

    SailPoint.Dashboard.Grid.Type = "inbox";
    Ext.QuickTips.init();

    var grid = SailPoint.Dashboard.Grid.WorkItem.createGrid({
            gridName : gridName,
            fields : fields,
            columns : columns,
            id : id,
            url : '/workitem/workItemsInboxDataSource.json',
            filterItems : SailPoint.Dashboard.Grid.WorkItem.getFilterItems(gridName, priorityStore, typeStore, id, false, false),
            isManaged : false,
            isArchive : false,
            filterAction : SailPoint.Dashboard.Grid.WorkItem.getFilterAction(id),
            workgroups : workgroups
    });
};

/**
 * Top level function to create the outbox grid
 */
SailPoint.Dashboard.Grid.WorkItem.createoutbox = function(gridName, fields, columns, id, priorityStore, typeStore) {

    SailPoint.Dashboard.Grid.Type = "outbox";
    Ext.QuickTips.init();

    var grid = SailPoint.Dashboard.Grid.WorkItem.createGrid({
            gridName : gridName,
            fields : fields,
            columns : columns,
            id : id,
            url : '/workitem/workItemsOutboxDataSource.json',
            filterItems : SailPoint.Dashboard.Grid.WorkItem.getFilterItems(gridName, priorityStore, typeStore, id, false, false),
            isManaged : false,
            isArchive : false,
            filterAction : SailPoint.Dashboard.Grid.WorkItem.getFilterAction(id)
    });

};

/**
 * Top level function to create the manage and archive workitems grids inside a tab panel.
 */
SailPoint.Dashboard.Grid.WorkItem.createmanage = function(gridName, fields,
        columns, id, priorityStore, typeStore, workgroups, currentIdentity,
        archiveFields, archiveColumns, activeTab, sInfo, completerStore) {

    SailPoint.Dashboard.Grid.Type = "manage";
    Ext.QuickTips.init();

    var grid = SailPoint.Dashboard.Grid.WorkItem.createGrid({
            gridName : gridName,
            fields : fields,
            columns : columns,
            id : id,
            url : '/workitem/workItemsManageDataSource.json',
            sInfo : sInfo,
            filterItems : SailPoint.Dashboard.Grid.WorkItem.getFilterItems(gridName, priorityStore, typeStore, id, true, false),
            isManaged : true,
            isArchive : false,
            filterAction : SailPoint.Dashboard.Grid.WorkItem.getFilterAction(id),
            workgroups : workgroups
    });

    // we need to manually specify archive ids because of the tab panel
    var archiveGrid = SailPoint.Dashboard.Grid.WorkItem.createGrid({
            gridName : 'archive',
            fields : archiveFields,
            columns : archiveColumns,
            id : 'workItemsArchiveGridState',
            url : '/rest/workitemarchive/workitems',
            sInfo : sInfo,
            filterItems : SailPoint.Dashboard.Grid.WorkItem.getFilterItems('archive', priorityStore, typeStore, id, true, true, completerStore),
            isManaged : true,
            isArchive : true,
            filterAction : SailPoint.Dashboard.Grid.WorkItem.getFilterAction('workItemsArchiveGridState'),
            workgroups : workgroups
    });
    
    var tabPanel = Ext.create('SailPoint.TabPanel', {
        activeTab : activeTab,
        renderTo : gridName + '-grid',
        width : Ext.getDom(gridName + '-grid').clientWidth - 5, //hack: -5 to offset any scrollbar width changes
        hideMode : 'offsets',
        plain : true,
        firstActivated : false,
        defaults : {layout : 'auto'},
        items : [
            {
                xtype : 'panel',
                id : 'adminTab',
                title : '#{msgs.tab_work_item_admin}',
                items : [ grid ]
            }, {
                xtype : 'panel',
                id : 'archiveTab',
                title : '#{msgs.tab_work_item_archive}',
                preventHeader : true,
                items : [ archiveGrid ]
            }
        ],
        listeners : {
            /** 
             * If the tab panel is loading for the first time, ignore the first tab change refresh
             * as we will already be loading that panel's grid with an auto-load.  Bug 5700. PH
             */
            tabchange : {
                fn : function(tabPanel, panel) {
                    if (!tabPanel.firstActivated) {
                        tabPanel.firstActivated = true;
                    } else {
                        if (panel.reload) {
                            panel.reload();
                        }
                    }
                }
            }
        }
    });

};

/** 
 * Helper function to return the appropriate search expando action
 */
SailPoint.Dashboard.Grid.WorkItem.getFilterAction = function(gridId) {
    return {
        xtype : 'button',
        text : '#{msgs.advanced_search}',
        scale : 'medium',
        handler : function() {
            var grid = Ext.getCmp(gridId);
            if(grid) {
                grid.fireEvent('toggleExpando', null);
                grid.isAdvSearchExpanded = !grid.isAdvSearchExpanded;
                grid.fireEvent('afterToggleExpando', grid.isAdvSearchExpanded);
            }
        }
    };
};

/** 
 * Generic helper function to create the workitem grids
 */
SailPoint.Dashboard.Grid.WorkItem.createGrid = function(metaCfg) {

    // Map the config object data to local variables
    var gridName = metaCfg.gridName,
        fields = metaCfg.fields,
        columns = metaCfg.columns,
        id = metaCfg.id,
        url = metaCfg.url,
        sInfo = metaCfg.sInfo,
        filterItems = metaCfg.filterItems,
        isManaged = metaCfg.isManaged,
        isArchive = metaCfg.isArchive,
        filterAction = metaCfg.filterAction,
        workgroups = metaCfg.workgroups, 
        oldExt = Ext.getCmp(id);
    
    // first attempt to destroy the component - see bug #18658
    if (oldExt) {
        if (oldExt.getStore()) {
            oldExt.getStore().destroyStore();
        }
        oldExt.destroy();
    }
    
    if (!fields) {
        fields = ['id'];
    }
    if(!isArchive) {
        fields.push("isAccessReview");
        fields.push("itemType");
        fields.push("isEditable");
    }
    
    if (sInfo == null) {
        sInfo = [{property: 'name', direction: 'ASC'}];
    }
    
    var store;
    
    if(isArchive) {
        store = SailPoint.Store.createRestStore({
            storeId : id + "_store",
            url : SailPoint.getRelativeUrl(url),
            fields : fields,
            sorters : sInfo,
            simpleSortMode : true,
            remoteSort : true,
            autoLoad : true
        });
    }
    else {
        store = SailPoint.Store.createStore({
            storeId : id + "_store",
            url : SailPoint.getRelativeUrl(url),
            root : 'results',
            fields : fields,
            sorters : sInfo,
            simpleSortMode : true,
            remoteSort : true,
            method : 'POST',
            autoLoad : true
        });
    }
    
    var sfCfg = {
        xtype : 'searchfield',
        id : gridName + 'SearchField',
        store : store,
        paramName : 'name',
        emptyText : '#{msgs.label_filter_by_item_name_or_id}'
    };
    
    if(isArchive) {
        sfCfg.id = 'archiveSearchField';
    }
    
    if(isManaged) {
        sfCfg.width = 250;
    }
    else {
        sfCfg.flex = 4;
    }
    
    var tbar = [ sfCfg, ' ', filterAction, '->'];
    
    // if the user has workgroups, we want to display a combo in the grid tbar
    // which allows the user to filter their inbox by workgroup
    if (workgroups && workgroups.length > 0) {
        
        var comboStoreData = [ {
            key : '',
            value : '#{msgs.dash_inbox_show_all_items}'
        }, {
            key : SailPoint.CURR_USER_NAME,
            value : '#{msgs.dash_inbox_show_personal_inbox}'
        } ];
        
        workgroups.each(function(grp) {
            comboStoreData.push({key : grp, value : grp});
        });

        var comboStore = SailPoint.Store.createStore({
            model : 'SailPoint.model.KeyValue',
            proxyType: 'memory',
            autoLoad: true,
            data : comboStoreData
        });

        tbar.push({
            xtype : 'combobox',
            store : comboStore,
            value : '',
            displayField : 'value',
            valueField : 'key',
            listeners : {
                select : {
                    fn : function(combo, records, opts) {
                        var val = records[0].data.key;
                        var grid = this.findParentByType('paginggrid');
                        if(grid) {
                            grid.getStore().getProxy().extraParams['ownerName'] = val;
                            grid.getStore().load({params : {start : 0}});
                        }
                    }
                }
            }
        });
    }
    tbar.push( ' ' );
    
    var cfg = {
        id : id,
        gridName : gridName,
        cls : 'smallFontGrid selectableGrid wrappingGrid',
        stateId : id,
        stateful : true,
        store : store,
        columns : columns,
        autoScroll : true,
        viewConfig : {
            autoFill: true,
            stripeRows: true,
            scrollOffset: 0
        },
        tbar : tbar
    };
    
    if(isArchive) {
        cfg.listeners = { 
            itemclick : SailPoint.Dashboard.Grid.WorkItem.archiveGridClicked,
            columnresize: SailPoint.Dashboard.Grid.WorkItem.columnResize
        };
        cfg.stateId = "workItemsArchiveGridState"; // have to manually specify because of tab panel
    }
    else {
        cfg.listeners = { 
            itemclick : SailPoint.Dashboard.Grid.WorkItem.gridClicked, 
            itemcontextmenu : SailPoint.Dashboard.Grid.WorkItem.contextMenu,
            columnresize: SailPoint.Dashboard.Grid.WorkItem.columnResize
        };
    }
    
    if(!isManaged) {
        cfg.renderTo = gridName + '-grid';
    }
    
    if(filterItems) {
        cfg.plugins = [{
            ptype : 'gridexpandoplugin',
            gridId : id,
            initExpandoPanel : function(grid) {
                return Ext.create('SailPoint.panel.Search', {
                    id : isArchive ? 'archiveFilterForm' : gridName + 'FilterForm',
                    labelAlign : 'top',
                    columns : filterItems,
                    doSearch : function() {
                        SailPoint.Dashboard.Grid.WorkItem.advancedSearch(gridName, id, isManaged, isArchive);
                    },
                    doReset : function() {
                        this.resetRecursive(this);
                        SailPoint.Dashboard.Grid.WorkItem.advancedSearchReset(gridName, id, isManaged, isArchive);
                    }
                });
            }
        }];
    }

    // create the grid
    return Ext.create('SailPoint.grid.PagingGrid', cfg);

};

/** 
 * Function to call when performing a search/filter from the search panel
 */
SailPoint.Dashboard.Grid.WorkItem.advancedSearch = function(gridName, gridId, isManaged, isArchive) {

    var grid = Ext.getCmp(gridId);
    
    var proxy = grid.getStore().getProxy();
    
    //These are used for all work item advanced search (Dashboard inbox/outbox and Manage->WorkItems
    
    proxy.extraParams['name'] = Ext.getCmp(gridName + 'SearchField').getValue();
    proxy.extraParams['level'] = Ext.getCmp(gridName + 'frmPriority').getValue();
    
    if(Ext.getCmp(gridName + 'frmCreationStartDate').getValue())  
        proxy.extraParams['creationStartDate'] = Ext.getCmp(gridName + 'frmCreationStartDate').getValue().getTime();
    else
        proxy.extraParams['creationStartDate'] = '';
    
    if(Ext.getCmp(gridName + 'frmCreationEndDate').getValue())   
        proxy.extraParams['creationEndDate'] = Ext.getCmp(gridName + 'frmCreationEndDate').getValue().getTime();
    else
        proxy.extraParams['creationEndDate'] = '';

    //Archive search does not allow searching on expiration start/end
    if(!isArchive) {
        if(Ext.getCmp(gridName + 'frmExpirationStartDate').getValue())
            proxy.extraParams['expirationStartDate'] = Ext.getCmp(gridName + 'frmExpirationStartDate').getValue().getTime();
        else
            proxy.extraParams['expirationStartDate'] = '';
        
        if(Ext.getCmp(gridName + 'frmExpirationEndDate').getValue())  
            proxy.extraParams['expirationEndDate'] = Ext.getCmp(gridName + 'frmExpirationEndDate').getValue().getTime();
        else
            proxy.extraParams['expirationEndDate'] = '';
    }
    
    //IsManaged means we are trying to search on Manage->WorkItems Page
    if(isManaged) {
        if(isArchive){
            //Modified Search only allowed on Archive Work Items
            if(Ext.getCmp(gridName+'frmModifiedStartDate').getValue())
                proxy.extraParams['modifiedStartDate'] = Ext.getCmp(gridName+'frmModifiedStartDate').getValue().getTime();
            else
                proxy.extraParams['modifiedStartDate'] = '';
          
            if(Ext.getCmp(gridName+'frmModifiedEndDate').getValue())
                proxy.extraParams['modifiedEndDate'] = Ext.getCmp(gridName+'frmModifiedEndDate').getValue().getTime();
            else
                proxy.extraParams['modifiedEndDate'] = '';

            // Search for signed items
            if(Ext.getCmp(gridName+'frmSigned').getValue())
                proxy.extraParams['signed'] = Ext.getCmp(gridName+'frmSigned').getValue();
            else
                proxy.extraParams['signed'] = '';

            // Search items by completedBy field
            if(Ext.getCmp(gridName+'frmCompleter').getValue())
                proxy.extraParams['completer'] = Ext.getCmp(gridName+'frmCompleter').getValue();
            else
                proxy.extraParams['completer'] = '';

        }
        else {
            //Next Event after, Reminders, and Escalation search only allowed on Work Item Administration Search
            if(Ext.getCmp(gridName + 'frmWakeUpStartDate').getValue())
                proxy.extraParams['wakeUpStartDate'] = Ext.getCmp(gridName + 'frmWakeUpStartDate').getValue().getTime();
            else
                proxy.extraParams['wakeUpStartDate'] = '';

          
            if(Ext.getCmp(gridName + 'frmWakeUpEndDate').getValue())
                proxy.extraParams['wakeUpEndDate'] = Ext.getCmp(gridName + 'frmWakeUpEndDate').getValue().getTime();
            else
                proxy.extraParams['wakeUpEndDate'] = '';

        
            proxy.extraParams['reminders'] = Ext.getCmp(gridName + 'frmReminders').getValue();
            proxy.extraParams['remCondition'] = Ext.getCmp(gridName + 'remCondition').getValue();
            proxy.extraParams['escalationCount'] = Ext.getCmp(gridName + 'frmEscCount').getValue();
            proxy.extraParams['escCountCondition'] = Ext.getCmp(gridName + 'escCountCondition').getValue();
        }

        if(Ext.getCmp(gridName + 'frmType').getValue())
            proxy.extraParams['type'] = (Ext.getCmp(gridName + 'frmType').getValue()).join();
        else
            proxy.extraParams['type'] = '';
        
        proxy.extraParams['ownerId'] = Ext.getCmp(gridName + 'frmOwnerSuggest').getValue();
        proxy.extraParams['requestorId'] = Ext.getCmp(gridName + 'frmRequestorSuggest').getValue();
        proxy.extraParams['assigneeId'] = Ext.getCmp(gridName + 'frmAssigneeSuggest').getValue();
        proxy.extraParams['name'] = Ext.getCmp(gridName + 'frmIDName').getValue();
        proxy.extraParams['identityRequestId'] = Ext.getCmp(gridName + 'frmReqId').getValue();
        
    }
    else {
        //Used to get Type for Dashboard advanced search because it is not a multiSelect
        if(Ext.getCmp(gridName + 'frmType').getValue())
            proxy.extraParams['type'] = Ext.getCmp(gridName + 'frmType').getValue();
        else
            proxy.extraParams['type'] = '';
    }
 
    grid.getStore().load({params:{start:0,limit:25}});
      
};

/** 
 * Helper function to reload the grid once the search panel fields are reset
 */
SailPoint.Dashboard.Grid.WorkItem.advancedSearchReset = function(gridName, gridId, isManaged, isArchive){
    var grid = Ext.getCmp(gridId);
    grid.getStore().getProxy().extraParams = {};
    grid.getStore().load({params:{start:0, limit:25}});
};

/** 
 * Helper function to return the appropriate fields in the search panel based on grid type
 */
SailPoint.Dashboard.Grid.WorkItem.getFilterItems = function(gridName, priorityStore, typeStore, gridId, isManaged, isArchive, completerStore) {

    if (Ext.isDefined(isManaged) && isManaged) {

        // ID's are stored differently in archives
        var suggestKeyType = 'id';
        if (isArchive) {
            suggestKeyType = 'name';
        }

        // Initialize the owner suggest
        var ownerSuggest = {
            xtype : 'identitySuggest',
            id : gridName + 'frmOwnerSuggest',
            binding : Ext.getDom('editForm:frmOwner'),
            allowBlank : false,
            width : 265,
            baseParams: {context: 'Owner'},
            fieldLabel : '#{msgs.label_owner}',
            valueField : suggestKeyType
        };

        // Initialize the requestor suggest
        var requestorSuggest = {
            xtype : 'identitySuggest',
            id : gridName + 'frmRequestorSuggest',
            binding : Ext.getDom('editForm:frmRequestor'),
            allowBlank : false,
            width : 265,
            baseParams : {context: 'Owner'},
            fieldLabel : '#{msgs.label_requester}',
            valueField : suggestKeyType
        };

        // Initialize the assignee suggest
        var assigneeSuggest = {
            xtype : 'identitySuggest',
            id : gridName + 'frmAssigneeSuggest',
            binding : Ext.getDom('editForm:frmAssignee'),
            allowBlank : false,
            width : 265,
            baseParams: {context: 'Owner'},
            fieldLabel : '#{msgs.label_assignee}',
            valueField : suggestKeyType
        };

        if (isArchive) {
            ownerSuggest.forceSelection = false;
            requestorSuggest.forceSelection = false;
            assigneeSuggest.forceSelection = false;
        }

        var conditionStore = Ext.create('Ext.data.Store', {
            autoLoad : true,
            model : 'SailPoint.model.KeyValue',
            data : [ { key : 'eq', value : '#{msgs.filter_eq}' }, 
                     { key : 'lt', value : '#{msgs.filter_lt}' }, 
                     { key : 'gt', value : '#{msgs.filter_gt}' } ]
        });
        
        var enterKeyHandler = function() {
            SailPoint.Dashboard.Grid.WorkItem.advancedSearch(gridName, gridId, isManaged, isArchive);
        };

        var leftAttributes = [ {
            xtype : 'container',
            layout : 'column',
            border : false,
            defaults: { // defaults are applied to items, not this container
                bodyBorder : false,
                border : false,
                bodyStyle : 'background-color:#EEEEEE'
            },
            bodyStyle : 'background-color:#EEEEEE',
            items : [ {
                xtype : 'form',
                fieldDefaults : {
                    labelAlign: 'top'
                },
                columnWidth : .5,
                items : [ {
                    xtype : 'datefield',
                    id : gridName + 'frmExpirationStartDate',
                    name : 'frmExpirationStartDate',
                    anchor : '90%',
                    fieldLabel : '#{msgs.expiration_start_date}'
                } ]
            }, {
                xtype : 'form',
                fieldDefaults : {
                    labelAlign: 'top'
                },
                columnWidth : .5,
                items : [ {
                    xtype : 'datefield',
                    id : gridName + 'frmExpirationEndDate',
                    name : 'frmExpirationEndDate',
                    fieldLabel : '#{msgs.expiration_end_date}'
                } ]
            } ]
        }, {
            xtype : 'container',
            layout : 'column',
            border : false,
            defaults: { // defaults are applied to items, not this container
                bodyBorder : false,
                border : false,
                bodyStyle : 'background-color:#EEEEEE'
            },
            bodyStyle : 'background-color:#EEEEEE',
            items : [ {
                xtype : 'form',
                fieldDefaults : {
                    labelAlign: 'top'
                },
                columnWidth : .5,
                items : [ {
                    xtype : 'datefield',
                    id : gridName + 'frmCreationStartDate',
                    name : 'frmCreationStartDate',
                    anchor : '90%',
                    fieldLabel : '#{msgs.creation_start_date}'
                } ]
            }, {
                xtype : 'form',
                fieldDefaults : {
                    labelAlign: 'top'
                },
                columnWidth : .5,
                items : [ {
                    xtype : 'datefield',
                    id : gridName + 'frmCreationEndDate',
                    name : 'frmCreationEndDate',
                    fieldLabel : '#{msgs.creation_end_date}'
                } ]
            } ]
        }, {
            xtype : 'container',
            layout : 'column',
            border : false,
            defaults: { // defaults are applied to items, not this container
                bodyBorder : false,
                border : false,
                bodyStyle : 'background-color:#EEEEEE'
            },
            bodyStyle : 'background-color:#EEEEEE',
            items : [ {
                xtype : 'form',
                fieldDefaults : {
                    labelAlign: 'top'
                },
                columnWidth : .5,
                items : [ {
                    xtype : 'datefield',
                    id : gridName + 'frmWakeUpStartDate',
                    name : 'frmWakeUpStartDate',
                    anchor : '90%',
                    fieldLabel : '#{msgs.wake_up_start_date}'
                } ]
            }, {
                layout : 'anchor',
                fieldDefaults : {
                    labelAlign: 'top'
                },
                columnWidth : .5,
                items : [ {
                    xtype : 'datefield',
                    id : gridName + 'frmWakeUpEndDate',
                    name : 'frmWakeUpEndDate',
                    fieldLabel : '#{msgs.wake_up_end_date}'
                } ]
            } ]
        }, {
            xtype : 'container',
            layout : 'column',
            border : false,
            defaults: { // defaults are applied to items, not this container
                bodyBorder : false,
                border : false,
                bodyStyle : 'background-color:#EEEEEE'
            },
            bodyStyle : 'background-color:#EEEEEE',
            items : [ {
                xtype : 'form',
                fieldDefaults : {
                    labelAlign: 'top'
                },
                columnWidth : .5,
                items : [ {
                    xtype : 'combobox',
                    name : 'remCondition',
                    id : gridName + 'remCondition',
                    anchor : '90%',
                    queryMode : 'local',
                    displayField : 'value',
                    valueField : 'key',
                    value : '#{msgs.filter_eq}',
                    fieldLabel : '#{msgs.reminders}',
                    store : conditionStore
                } ]
            }, {
                xtype : 'form',
                fieldDefaults : {
                    labelAlign: 'top'
                },
                columnWidth : .5,
                items : [ {
                    xtype : 'numberfield',
                    name : 'frmReminders',
                    id : gridName + 'frmReminders',
                    width : 60,
                    minValue : 0,
                    allowDecimals : false,
                    fieldLabel : '#{msgs.label_number_symbol}',
                    hideTrigger : true,
                    labelSeparator : ''
                }
                ],
                keys : [{key : [ Ext.EventObject.ENTER ], handler : enterKeyHandler }]
            } ]
        }, {
            xtype : 'container',
            layout : 'column',
            border : false,
            defaults: { // defaults are applied to items, not this container
                bodyBorder : false,
                border : false,
                bodyStyle : 'background-color:#EEEEEE'
            },
            bodyStyle : 'background-color:#EEEEEE',
            items : [ {
                xtype : 'form',
                fieldDefaults : {
                    labelAlign: 'top'
                },
                columnWidth : .5,
                items : [ {
                    xtype : 'combobox',
                    name : 'escCountCondition',
                    id : gridName + 'escCountCondition',
                    anchor : '90%',
                    queryMode : 'local',
                    displayField : 'value',
                    valueField : 'key',
                    value : '#{msgs.filter_eq}',
                    fieldLabel : '#{msgs.label_escalation_count}',
                    store : conditionStore
                } ]
            }, {
                xtype : 'form',
                fieldDefaults : {
                    labelAlign: 'top'
                },
                columnWidth : .5,
                items : [ {
                    xtype : 'numberfield',
                    name : 'frmEscCount',
                    id : gridName + 'frmEscCount',
                    width : 60,
                    minValue : 0,
                    allowDecimals : false,
                    fieldLabel : '#{msgs.label_number_symbol}',
                    hideTrigger : true,
                    labelSeparator : ''
                } ],
                keys : [{key : [ Ext.EventObject.ENTER ], handler : enterKeyHandler }]
            } ]
        } ];

        var lWidth = 200;
        
        var midAttributes = [
            {
                xtype : 'container',
                style: {
                    marginLeft: '15%'
                },
                items : [ {
                    xtype : 'combo',
                    name : 'frmPriority',
                    id : gridName + 'frmPriority',
                    width : 200,
                    listConfig : {
                        width : lWidth
                    },
                    editable : false,
                    queryMode : 'local',
                    displayField : 'value',
                    valueField : 'key',
                    store : priorityStore,
                    fieldLabel : '#{msgs.priority}'
                }, 
                {
                    xtype : 'multiselect',
                    name : 'frmType',
                    id : gridName + 'frmType',
                    fieldLabel : '#{msgs.type}',
                    width : 200,
                    listConfig : {
                        width : lWidth
                    },
                    selectionsGridWidth : lWidth,
                    displayField : 'value',
                    valueField : 'key',
                    queryMode : 'local',
                    store : typeStore,
                    defaults : {
                        style : "background-color:#EEEEEE"
                    },
                    editable : true
                } ]
            }
        ];

        var rightAttributes = [
                ownerSuggest,
                requestorSuggest,
                assigneeSuggest,
                {
                    xtype : 'numberfield',
                    name : 'frmIDName',
                    id : gridName + 'frmIDName',
                    width : 130,
                    minValue : 0,
                    allowDecimals : false,
                    labelSeparator : ':',
                    fieldLabel : '#{msgs.label_work_item_id}',
                    enableKeyEvents : true,
                    hideTrigger : true,
                    listeners : {
                        keyup : function(f, e) {
                            if (e.keyCode == e.ENTER) {
                                e.stopEvent(); // prevent the event from bubbling up to the browser
                                SailPoint.Dashboard.Grid.WorkItem.advancedSearch(gridName, gridId, isManaged, isArchive);
                            }
                        }
                    }
                },
                {
                    xtype : 'numberfield',
                    name : 'frmReqId',
                    id : gridName + 'frmReqId',
                    width : 130,
                    minValue : 0,
                    allowDecimals : false,
                    labelSeparator : ':',
                    fieldLabel : '#{msgs.label_access_request_id}',
                    enableKeyEvents : true,
                    hideTrigger : true,
                    listeners : {
                        keyup : function(f, e) {
                            if (e.keyCode == e.ENTER) {
                                e.stopEvent(); // prevent the event from bubbling up to the browser
                                SailPoint.Dashboard.Grid.WorkItem.advancedSearch(gridName, gridId, isManaged, isArchive);
                            }
                        }
                    }
                } ];

        if (Ext.isDefined(isArchive) && isArchive) {
            // Remove uneccesary items and add archive ones.
            var tmpArray = [];
            tmpArray.push(leftAttributes[1]);
            tmpArray.push({
                xtype : 'container',
                layout : 'column',
                border : false,
                defaults: { // defaults are applied to items, not this container
                    bodyBorder : false,
                    border : false,
                    bodyStyle : 'background-color:#EEEEEE'
                },
                bodyStyle : 'background-color:#EEEEEE',
                items : [ {
                    xtype : 'form',
                    fieldDefaults : {
                        labelAlign: 'top'
                    },
                    columnWidth : .5,
                    items : [ {
                        xtype : 'datefield',
                        id : gridName + 'frmModifiedStartDate',
                        name : 'frmModifiedStartDate',
                        anchor : '90%',
                        fieldLabel : '#{msgs.modified_start_date}'
                    } ]
                }, {
                    xtype : 'form',
                    fieldDefaults : {
                        labelAlign: 'top'
                    },
                    columnWidth : .5,
                    items : [ {
                        xtype : 'datefield',
                        id : gridName + 'frmModifiedEndDate',
                        name : 'frmModifiedEndDate',
                        fieldLabel : '#{msgs.modified_end_date}'
                    } ]
                }, {
                    xtype : 'form',
                    columnWidth : 0.5,
                    items : [
                              {
                                xtype : 'combo',
                                name : 'frmCompleter',
                                anchor : '90%',
                                id : gridName + 'frmCompleter',
                                editable : true,
                                queryMode : 'local',
                                displayField : 'value',
                                valueField : 'key',
                                store : completerStore,
                                fieldLabel : '#{msgs.completer}'
                              }
                            ]
                }, { 
                    xtype : 'form',
                    columnWidth : 0.5,
                    items : [
                              {
                                xtype: 'spBooleanCombo',
                                id : gridName + 'frmSigned',
                                name : 'frmSigned',
                                fieldLabel: '#{msgs.electronically_signed}'
                              }
                            ]
                } ]
            });

            leftAttributes = tmpArray;
            
            //midAttributes[0].items[1].id = 'archivefrmType';
        }

        // Manage WorkItems search items
        return [leftAttributes, midAttributes, rightAttributes];
    }
    
    // Inbox and Outbox search items
    return [[ {
            xtype : 'datefield',
            fieldLabel : '#{msgs.expiration_start_date}',
            id : gridName + 'frmExpirationStartDate',
            name : 'frmExpirationStartDate'
        }, 
        {
            xtype : 'datefield',
            fieldLabel : '#{msgs.creation_start_date}',
            name : 'frmCreationStartDate',
            id : gridName + 'frmCreationStartDate'
        }, 
        {
            xtype : 'combobox',
            fieldLabel : '#{msgs.priority}',
            name : 'frmPriority',
            id : gridName + 'frmPriority',
            listConfig : {
                width : 150
            },
            width : 150,
            queryMode : 'local',
            displayField : 'value',
            valueField : 'key',
            store : priorityStore
        } ],
        [ {
            xtype : 'datefield',
            fieldLabel : '#{msgs.expiration_end_date}',
            id : gridName + 'frmExpirationEndDate',
            name : 'frmExpirationEndDate'
        },
        {
            xtype : 'datefield',
            fieldLabel : '#{msgs.creation_end_date}',
            name : 'frmCreationEndDate',
            id : gridName + 'frmCreationEndDate'
        },
        {
            xtype : 'combobox',
            fieldLabel : '#{msgs.type}',
            name : 'frmType',
            id : gridName + 'frmType',
            width : 150,
            listConfig : {
                width : 150
            },
            queryMode : 'local',
            displayField : 'value',
            valueField : 'key',
            store : typeStore
        } ]
    ];
};

SailPoint.Dashboard.Grid.WorkItem.archiveGridClicked = function(gridView, record, HTMLitem, index, e, eOpts) {
    $('dashboardForm:selectedIdWI').value = record.data.name;
    $('dashboardForm:viewWorkItemArchiveButton').click();
};

SailPoint.Dashboard.Grid.WorkItem.columnResize = function(header, column, width, eOpts) {
    /* bug #21704 resizing column widths doesn't work real well when flex is
     * used in columns. So, since flex is there basically to set an initial
     * layout, once the user resizes a column we remove the flex settings
     * and put an actual width on the column. 
     */
    if (column.firstTime != "false") {
        column.firstTime = "false";    // ignore the resize event fired from initial grid load
        return;                       
    }
    if (this.flexOff == "true" || this.inResize == "true")
        return;
    var header = this.getView().headerCt; 
    var currentWidth;
    var numColumns = header.getColumnCount();
    var i;
    var col;
    for (i=0; i<numColumns; i++) { 
        col = header.items.get(i);
        if (col.flex) {
            delete col.flex;  
            if (! col.hidden) {
                currentWidth=col.getWidth(); 
                this.inResize = "true";      // setWidth() will fire a resize event we can ignore
                col.setWidth(currentWidth);  
                this.inResize = "false";
            } 
        }
    }
    this.flexOff = "true";
};

SailPoint.Dashboard.Grid.WorkItem.gridClicked = function(gridView, record, HTMLitem, index, e, eOpts) {

    var col = gridView.getHeaderCt().getHeaderAtIndex(gridView.clickedColumn).dataIndex;
    var workgroup = record.get('workgroupName');
    var workItemId = record.get("id");
    var isEditable = record.get("isEditable");
    var priority = record.get("level");

    if (col === 'assignee-name' && workgroup && workgroup !== '') {
        SailPoint.workitem.showAssignmentMenu(SailPoint.workitem.TYPE_WITEM, 'workItemAssigneeSuggest', gridView.panel, workItemId, {}, workgroup, record.get('assignee-name'));
        return;
    }
    else if (col == 'level' && isEditable) {
        SailPoint.workitem.showPriorityEditor(gridView, workItemId, priority, HTMLitem);
        return;
    }

    gDbId = record.getId();
    gIsCertification = record.get('isAccessReview');
    viewWorkItemListItem(gDbId, gIsCertification);
};

SailPoint.Dashboard.Grid.WorkItem.forwardFromMenu = function(menuItem, eventObj) {
    var nextPage = "viewDashboard";
    if (SailPoint.Dashboard.Grid.Type == "manage") {
        nextPage = "manageWorkItems";
    }
    if (gIsCertification) {
        if (limitReassignments) {
            Ext.MessageBox.show ({
                title:'#{msgs.err_dialog_title}',
                msg: '#{msgs.err_reassignment_limit_exceeded}',
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.ERROR
            });
            return;
        }
        forwardWorkItem(gDbId, gCertificationId, nextPage);
    }
    else {
        forwardWorkItem(gDbId, null, nextPage, false, menuItem.priority);
    }
};

SailPoint.Dashboard.Grid.WorkItem.viewWorkItemOrCert = function() {
    viewWorkItemListItem(gDbId, gIsCertification);
};

SailPoint.Dashboard.Grid.WorkItem.contextMenu = function(gridView, record, HTMLitem, index, e, eOpts){
	SailPoint.Dashboard.Grid.WorkItem.showContextMenu(record, this.disableForwarding, e);
};

SailPoint.Dashboard.Grid.WorkItem.showContextMenu = function(record, disableForwarding, e) {
    var contextMenu = new Ext.menu.Menu();
    gDbId = record.getId();
    var workItemType = record.get("type");
    gCertificationId = record.get('certificationId');
    gIsCertification = record.get('isAccessReview');
    limitReassignments = record.get('limitReassignments');
    gMenu = contextMenu;

    contextMenu.add(new Ext.menu.Item({
        text : '#{msgs.menu_edit}',
        handler : SailPoint.Dashboard.Grid.WorkItem.viewWorkItemOrCert,
        iconCls : 'editBtn'
    }));
    
    if (!disableForwarding) {
      if ((null == workItemType || 'Delegation' != workItemType) || (!record.get("isDelegationForwardDisabled"))) {
          var forwardItem = new Ext.menu.Item({
	          text : '#{msgs.menu_forward}',
	          handler : SailPoint.Dashboard.Grid.WorkItem.forwardFromMenu,
	          iconCls : 'forwardBtn'
	      });
	      // Attach the priority to the menu item so that it can be set in the dialog that the menu item pops up
          var priority = record.get("level");
          forwardItem.priority = priority;
          contextMenu.add(forwardItem);
      }
    }
    
    e.stopEvent();
    contextMenu.showAt(e.xy);
}

/**
 * A column renderer that strips leading zeroes off the work item ID.
 */
SailPoint.Dashboard.Grid.WorkItem.renderID = function(value) {
    var newVal = "";
    if (value && value !== null) {
        var foundNonZero = false;
        for ( var i = 0; i < value.length; i++) {
            var c = value.charAt(i);
            if ("0" !== c) {
                foundNonZero = true;
            }

            if (foundNonZero) {
                newVal += c;
            }
        }
    }

    return newVal;
};

SailPoint.workitem.renderPriorityColumn = function(colValue, colMetadata, record, rowIndex) {
    if (record.get('isEditable')) {
        colMetadata.tdCls = 'editableColumnCombo';
    }
    return colValue;
};
