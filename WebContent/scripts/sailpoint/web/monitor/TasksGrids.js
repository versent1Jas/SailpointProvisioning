Ext.ns('SailPoint',
       'SailPoint.Monitor',
       'SailPoint.Monitor.Grid',
       'SailPoint.Monitor.Grid.Tasks');

SailPoint.Monitor.Grid.Tasks.createPanel = function(activeTab, stateIds, fields, cols1, resultsCols, schedulesCols, sInfo, scheduleComboData, resultsComboData) {

    activeTab = (activeTab != "0") ? activeTab : "taskObjectsGrid";
    if (SailPoint.userHasTaskWriteAccess === false) {
    	activeTab = 'resultsGrid';
    }
    
    var resultsGrid = SailPoint.Monitor.Grid.Tasks.createResultsGrid(stateIds[2], fields[2], resultsCols, resultsComboData, activeTab);
    
    // only show results grid if access is lacking
    var items = [resultsGrid];
    if (SailPoint.userHasTaskWriteAccess === true) {
        var objectsGrid = SailPoint.Monitor.Grid.Tasks.createObjectsGrid(stateIds[0], fields[0], cols1, sInfo, activeTab);
        var schedulesGrid = SailPoint.Monitor.Grid.Tasks.createSchedulesGrid(stateIds[1], fields[1], schedulesCols, scheduleComboData, activeTab);
        
        items.unshift(schedulesGrid);
        items.unshift(objectsGrid);
    }

    return {
        xtype : 'sptabpanel',
        activeTab : activeTab,
        plain : true,
        deferredRender : true,
        firstActivated : true, // revert for ext 4 - DD
        layoutOnTabChange : true,
        defaults : {
            layout : 'fit',
            autoScroll : true
        },
        items : items,
        listeners : {
            /**
             * If the tab panel is loading for the first time, ignore the first tab
             * change refresh as we will already be loading that panel's grid with an
             * auto-load. Bug 5700. PH
             */
            tabchange : {
                fn : function(tabPanel, panel) {
                	var activeTabInput = Ext.get('activeTab');
                	if (activeTabInput) {
                		activeTabInput.dom.value = panel.id;
                	}
                	
                    if (!tabPanel.firstActivated) {
                        tabPanel.firstActivated = true;
                    }
                    else {
                        panel.store.load();
                    }
                }
            }
        }
    };
};


SailPoint.Monitor.Grid.Tasks.createObjectsGrid = function(stateId, objectFields, cols1, sInfo, activeTab) {

    var objectsStore = SailPoint.Store.createStore({
        storeId : 'objectsStore',
        url : CONTEXT_PATH + '/monitor/tasks/viewTasksDataSource.json',
        root : 'objects',
        fields : objectFields,
        remoteGroup : true,
        groupField : 'type',
        autoLoad : (activeTab == 0 || activeTab == 'taskObjectsGrid'),
        sorters : sInfo,
        simpleSortMode : true,
        method : 'POST'
    });

    return {
        xtype : 'paginggrid',
        pageSize: 100,
        store : objectsStore,
        id : 'taskObjectsGrid',
        cls : 'smallFontGrid selectableGrid',
        stateId : stateId,
        stateful : true,
        columns : cols1,
        listeners : {
            itemclick : clickDefinition,
            itemcontextmenu : SailPoint.Monitor.Grid.Tasks.contextMenu
        },
        features : [
            {
                ftype : 'spdefaultgrouping',
                singularObjectName: '#{msgs.task}',
                pluralObjectName: '#{msgs.tasks}'
            }
        ],
        viewConfig : {
            stripeRows : true
        },
        title : '#{msgs.tasks}',
        tbar : [
            {
                xtype : 'searchfield',
                id:'tasksSearchField',
                store : objectsStore,
                paramName : 'name',
                storeLimit : 500,
                emptyText : '#{msgs.label_filter_by_task_name}',
                width : 250
            }
        ]
    };
};


SailPoint.Monitor.Grid.Tasks.createSchedulesGrid = function(stateId, scheduleFields,schedulesCols, scheduleComboStore, activeTab) {

  var schedulesStore = SailPoint.Store.createStore({
    storeId: 'schedulesStore',
    url: CONTEXT_PATH + '/monitor/tasks/viewScheduledDataSource.json',
    root: 'objects',
    totalProperty: 'count',
    fields: scheduleFields,
    remoteSort: true,
    autoLoad: (activeTab == 'schedulesGrid'),
    sorters:[{property: 'nextExecution'}],
    simpleSortMode : true,
    method : 'POST'
  });

  return {
      xtype : 'paginggrid',
      store: schedulesStore,
      id: 'schedulesGrid',
      cls: 'smallFontGrid selectableGrid',
      title:'#{msgs.grid_title_scheduled_tasks}',
      stateId: stateId,
      stateful: true,
      columns:schedulesCols,
      layout:'fit',
      listeners: { itemclick: clickSchedule, itemcontextmenu: SailPoint.Monitor.Grid.Tasks.scheduledContextMenu },
      viewConfig: {
          stripeRows:true,
          scrollOffset: 1
      },
      tbar: [
       {
         xtype : 'searchfield',
         id:'schedulesSearchField',
         store:schedulesStore,
         paramName:'name',
         emptyText:'#{msgs.label_filter_by_schedule_name}',
         flex:1,
         storeLimit:20
         },
         
         ' ', '#{msgs.filter_field_result} ',
         {
           xtype : 'combobox',
           name: 'frmSchedResult',
           id: 'frmSchedResult',
           queryMode : 'local',
           displayField : 'value',
           valueField : 'key',
           store : scheduleComboStore
         },

         '->',
         
         {
           xtype:'button',
           text:'#{msgs.button_filter}',
           id: 'scheduleFilterButton',
           scale : 'medium',
           cls : 'primaryBtn',
           handler:function(){
             var schedulesGrid = Ext.getCmp('schedulesGrid');
             schedulesGrid.getStore().getProxy().extraParams['name'] = Ext.getCmp('schedulesSearchField').getValue();
             schedulesGrid.getStore().getProxy().extraParams['result'] = Ext.getCmp('frmSchedResult').getValue();
             schedulesGrid.getStore().load({params:{start:0,limit:20}});
           }
         },
         {
           xtype: 'button',
           text: '#{msgs.button_reset}',
           id: 'scheduleResetButton',
           scale : 'medium',
           handler: function(){
             var schedulesGrid = Ext.getCmp('schedulesGrid');
             Ext.getCmp('frmSchedResult').reset();
             Ext.getCmp('schedulesSearchField').reset();
             schedulesGrid.getStore().getProxy().extraParams['name'] = '';
             schedulesGrid.getStore().getProxy().extraParams['result'] = '';
             schedulesGrid.getStore().load({params:{start:0, limit:20}});
           }
         }
       ]
  };
}

SailPoint.Monitor.Grid.Tasks.createResultsGrid = function(stateId, resultsFields, resultsCols, resultsComboStore, activeTab) {

  var resultsStore = SailPoint.Store.createStore({
    storeId: 'resultsStore',
    url: CONTEXT_PATH + '/monitor/tasks/viewResultsDataSource.json',
    root: 'objects',
    fields: resultsFields,
    totalProperty: 'count',
    remoteSort: true,
    autoLoad: (activeTab == 'resultsGrid'),
    sorters:[{property: 'completed', direction: 'DESC' }],
    simpleSortMode : true,
    method : 'POST'
  });

  return {
      xtype : 'paginggrid',
      store: resultsStore,
      id: 'resultsGrid',
      cls: 'smallFontGrid selectableGrid',
      title:'#{msgs.task_result_title}',
      stateId: stateId,
      stateful: true,
      layout:'fit',
      columns:resultsCols,
      listeners: { 
          itemclick: clickResult,
          itemcontextmenu: SailPoint.Monitor.Grid.Tasks.resultsContextMenu
      },
      viewConfig: {
          stripeRows:true
      },
      tbar: [
       {
         xtype : 'searchfield',
         id: 'resultsSearchField',
         store: resultsStore,
         paramName:'name',
         emptyText:'#{msgs.label_filter_by_result_name}',
         flex: 1,
         storeLimit:20
       },
       
       ' ', '#{msgs.start_date} ',
       {
         xtype : 'datefield',
         id: 'frmStartDate',
         name: 'frmStartDate',
         width : 110
       },

       ' ', '#{msgs.end_date} ',
       {
         xtype : 'datefield',
         id: 'frmEndDate',
         name: 'frmEndDate',
         width : 110
       },

       ' ', '#{msgs.filter_field_result} ',
       {
         xtype : 'combobox',
         name: 'frmResult',
         id: 'frmResult',
         listConfig : {width:125},
         width : 125,
         queryMode : 'local',
         displayField : 'value',
         valueField : 'key',
         store : resultsComboStore
       },

       '->',
       
       {
         xtype:'button',
         text:'#{msgs.button_filter}',
         id: 'resultFilterButton',
         scale : 'medium',
         cls : 'primaryBtn',
         handler:function(){
           var resultsGrid = Ext.getCmp('resultsGrid');
           resultsGrid.getStore().getProxy().extraParams['name'] = Ext.getCmp('resultsSearchField').getValue();

           if(Ext.getCmp('frmEndDate').getValue())
             resultsGrid.getStore().getProxy().extraParams['endDate'] = Ext.getCmp('frmEndDate').getValue().getTime();
           if(Ext.getCmp('frmStartDate').getValue())
             resultsGrid.getStore().getProxy().extraParams['startDate'] = Ext.getCmp('frmStartDate').getValue().getTime();

           resultsGrid.getStore().getProxy().extraParams['completionStatus'] = Ext.getCmp('frmResult').getValue();

           resultsGrid.getStore().load({params:{start:0, limit:20}});
         }
       },
       {
         xtype:'button',
         text: '#{msgs.button_reset}',
         id: 'resultResetButton',
         scale : 'medium',
         handler: function(){
           var resultsGrid = Ext.getCmp('resultsGrid');
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
       }
    ]
  };
};



// Need to get the statusId from r(record)
// and use that to determine the render status
function renderStatus(value, p, r) {
    var statusId = r.get('statusId');

    if (statusId === '' || statusId == -1) {
        return '';
    }
    else if (statusId === 1) {
        return '<span class="successBox font10">#{msgs.success}</span>';
    }
    else if (statusId === 2) {
        return '<span class="warnBox font10">#{msgs.warning}</span>';
    }
    else if (statusId === 3) {
        return '<span class="warnBox font10">#{msgs.cancelled}</span>';
    }
    else if (statusId === 0) {
        return '<span class="failBox font10">#{msgs.fail}</span>';
    }

    return Ext.String.format('{0}', value || '');
}

SailPoint.Monitor.Grid.Tasks.resultsContextMenu = function(gridView, record, HTMLitem, index, e, eOpts) {
  var contextMenu = new Ext.menu.Menu();
  gDbId = record.getId();
  gName = record.get('name');
  gMenu = contextMenu;
  var statusId = record.get('statusId');

  contextMenu.add(
    new Ext.menu.Item({text: '#{msgs.menu_view}', handler: viewGridObject, iconCls: 'viewDetailsBtn'})
  );

  if (SailPoint.userHasTaskWriteAccess) {
	  if (statusId=='-1' || statusId == -1) {
	    contextMenu.add(new Ext.menu.Item({text: '#{msgs.menu_terminate}', handler: terminateResultPrompt, iconCls: 'terminateBtn'}));
	  } else {
	      contextMenu.add(
	              new Ext.menu.Separator(),
	              new Ext.menu.Item({text: '#{msgs.menu_delete}', handler: deleteResultPrompt, iconCls: 'deleteBtn'})
	      );
	  }
  }

  e.stopEvent();
  contextMenu.showAt(e.xy);
};

SailPoint.Monitor.Grid.Tasks.scheduledContextMenu = function(gridView, record, HTMLitem, index, e, eOpts) {
  var contextMenu = new Ext.menu.Menu();
  gDbId = record.getId();
  gName = record.get('name');
  status = record.get('latestResult');
  resultsId = record.get('latestResultId');
  schedHasResults = (status!="");
  gMenu = contextMenu;

  contextMenu.add(
    new Ext.menu.Item({text: '#{msgs.menu_edit}', handler: editSchedule, iconCls: 'editBtn'})
  );

  if(schedHasResults) {
    contextMenu.add(
      new Ext.menu.Item({text: '#{msgs.menu_head_view_last_result}', handler: viewScheduleResults, iconCls: 'viewDetailsBtn'})
    );
  }

  contextMenu.add(
    new Ext.menu.Separator(),
    new Ext.menu.Item({text: '#{msgs.menu_delete}', handler: deleteSchedulePrompt, iconCls: 'deleteBtn'})
  );

  e.stopEvent();
  contextMenu.showAt(e.xy);
};

SailPoint.Monitor.Grid.Tasks.contextMenu = function(gridView, record, HTMLitem, index, e, eOpts) {
  var contextMenu = new Ext.menu.Menu();
  gType = 'task';
  gDbId = record.getId();
  gName = record.get('name');
  gProgressMode = record.get('progressMode');
  gMenu = contextMenu;

  contextMenu.add(
    new Ext.menu.Item({text: '#{msgs.menu_edit}', handler: editDefinition, iconCls: 'editBtn'}),
    new Ext.menu.Item({text: '#{msgs.menu_schedule}', handler: scheduleGridObject, iconCls: 'scheduleBtn'}),
    new Ext.menu.Separator());
    
  if (executeInForegroundOption === true) {
    contextMenu.add(new Ext.menu.Item({text: '#{msgs.menu_exec}', handler: runGridObject, iconCls: 'executeBtn'}));
  }
    
  contextMenu.add(  
    new Ext.menu.Item({text: '#{msgs.menu_exec_in_background}', handler: runGridObjectInBackground, iconCls: 'executeNowBtn'}),
    new Ext.menu.Separator(),
    new Ext.menu.Item({text: '#{msgs.menu_delete}', handler: deleteDefinitionPrompt, iconCls: 'deleteBtn'})
  );

  e.stopEvent();
  contextMenu.showAt(e.xy);
};


SailPoint.Monitor.Grid.Tasks.createPartitionedResultsGrid = function(renderToId, taskResultId, isCollapsed) {
  var store = SailPoint.Store.createRestStore({
      fields: ['name','host','status'],
      url: SailPoint.getRelativeUrl('/rest/taskResults/' + taskResultId + '/partitionedResults'),
      method : 'GET',
      autoLoad: false,
      remoteSort: false
  });
  
  //columns     
  var columns = [{
      header: '#{msgs.name}',
      dataIndex: 'name',
      sortable: false, 
      hideable: false
  },{
      header: '#{msgs.host}',
      dataIndex: 'host',
      sortable: false, 
      hideable: false
  },{
      header: '#{msgs.status}',
      dataIndex: 'status',
      sortable: false, 
      hideable: false
  }];


  var partitionsGrid = Ext.create('SailPoint.grid.RowExpandoGrid', {
        store: store,
        id: 'partitionedResultsGrid',
        layout:'fit',
        expandoType: SailPoint.grid.RowExpandoGrid.HTML,
        expandoHtmlBuilder: SailPoint.Monitor.Grid.Tasks.buildPartitionResultExpandoHtml,
        columns:columns,
        pageSize: 15
  });

    var ct = Ext.create('Ext.panel.Panel', {
        items : [ partitionsGrid ],
        title:'#{msgs.task_result_partitioned_title}',
        renderTo: renderToId,
        collapsible: true,
        collapsed: isCollapsed,
        layout:'fit',
        margin: '10, 0, 0, 0',
        autoScroll : true
    });

    store.load({params : { start:0, limit:15 } });

    return ct;
    
}

//expand the partitioned task result with 'stats' from the raw data 
SailPoint.Monitor.Grid.Tasks.buildPartitionResultExpandoHtml = function(record) {
    var stats = record.raw['stats'],
        html = '',
        key;
    if (stats != null) {
        stats = JSON.parse(stats);
        if (stats.length !== 0) {
            html = '<div style="padding-bottom:8px;padding-top: 8px;padding-left: 25px">' +
                '  <table class="spDataTable" style="width: 60%; table-layout: auto;">';
  
            for (key in stats) {
                html += '<tr><td width="50%" style="font-weight:bold">' + key + '</td><td>' + stats[key] + '</td></tr>';
            }
            html += '</table></div>';
        }
    }
    return html;
}
