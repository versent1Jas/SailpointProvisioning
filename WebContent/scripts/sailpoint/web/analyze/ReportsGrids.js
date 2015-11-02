Ext.ns('SailPoint', 
       'SailPoint.Analyze', 
       'SailPoint.Analyze.Grid',
       'SailPoint.Analyze.Grid.Reports');

SailPoint.Analyze.Grid.Reports.createPanel = function(activeTab, stateIds, fields, cm1, cm2, resultsCM, schedulesCM, sInfo, scheduleComboStore, resultsComboStore) {
  
  var objectsGrid = SailPoint.Analyze.Grid.Reports.createObjectsGrid(stateIds[0], fields[0], cm1, sInfo, activeTab);
  var myObjectsGrid = SailPoint.Analyze.Grid.Reports.createMyObjectsGrid(stateIds[1], fields[0], cm2, sInfo, activeTab);
  var schedulesGrid = SailPoint.Analyze.Grid.Reports.createSchedulesGrid(stateIds[3], fields[1], schedulesCM, scheduleComboStore, activeTab);
  var resultsGrid = SailPoint.Analyze.Grid.Reports.createResultsGrid(stateIds[2], fields[2], resultsCM, resultsComboStore, activeTab);  
  
  var tabPanel = {
    xtype : 'sptabpanel',
    activeTab: activeTab,
    plain:true,
    deferredRender:true,
    firstActivated:true, // revert Peter's fix here, seems to be fine in ext 4 - DD
    layoutOnTabChange:true,
    defaults:{layout: 'fit', autoScroll: true},
    items: [myObjectsGrid, objectsGrid, schedulesGrid, resultsGrid],
    listeners : {
        /** If the tab panel is loading for the first time, ignore the first tab change refresh
         * as we will already be loading that panel's grid with an auto-load.  Bug 5700. PH
         */
        tabchange : {
            fn : function(tabPanel, panel) {
                if(!tabPanel.firstActivated) {
                    tabPanel.firstActivated = true;
                } else {
                    panel.store.load();
                }
            }
        }
    }
  };

  return tabPanel;
};

SailPoint.Analyze.Grid.Reports.createMyObjectsGrid = function(stateId, objectsFields, cm1, sInfo, activeTab) {
//  var myObjectsStore = new Ext.data.GroupingStore({
//    storeId: 'myObjectsStore',
//    url: CONTEXT_PATH + '/analyze/reports/viewMyReportsDataSource.json',
//    reader: new Ext.data.JsonReader({
//        root: 'reports',
//        totalProperty: 'totalCount',
//        id: 'id',
//        fields: objectsFields
//    }),
//    groupField:'subtype',
//    remoteSort: true,
//    autoLoad: (activeTab==0 || activeTab=='myReportObjectsGrid'),
//    sorters : sInfo
//  });
    
    var myObjectsStore = SailPoint.Store.createStore({
        storeId: 'myObjectsStore',
        url: CONTEXT_PATH + '/analyze/reports/viewMyReportsDataSource.json',
        root: 'objects',
        fields: objectsFields,
        remoteGroup: true,
        groupField:'subtype',
        autoLoad: (activeTab==0 || activeTab=='myReportObjectsGrid'),
        sorters:sInfo,
        simpleSortMode : true,
        method : 'POST'
      });  

  var myObjectsGrid = {
      xtype : 'gridpanel',
      store: myObjectsStore,
      id: 'myReportObjectsGrid',
      cls: 'smallFontGrid selectableGrid',
      stateId: stateId,
      stateful: true,
      columns:cm1,
      listeners: {
          itemclick: clickDefinition, itemcontextmenu: SailPoint.Analyze.Grid.Reports.myContextMenu
      },
      viewConfig : {
          stripeRows:true
      },
      features: [
          {
              ftype : 'spdefaultgrouping',
              singularObjectName: '#{msgs.report}',
              pluralObjectName: '#{msgs.reports}'
          }
      ],
      title:'#{msgs.grid_my_reports}',
      tbar: [
        {
          xtype : 'searchfield',
          store : myObjectsStore,
          paramName:'name',
          storeLimit:500,
          emptyText:'#{msgs.label_filter_by_report_name}',
          width:250
        }
      ]
  };

  return myObjectsGrid;
};

SailPoint.Analyze.Grid.Reports.createObjectsGrid = function(stateId, objectsFields, cm2, sInfo, activeTab) {
  
//  var objectsStore = new Ext.data.GroupingStore({
//    storeId: 'objectsStore',
//    url: CONTEXT_PATH + '/analyze/reports/viewReportsDataSource.json',
//    reader: new Ext.data.JsonReader({
//        root: 'reports',
//        totalProperty: 'totalCount',
//        id: 'id',
//        fields: objectsFields
//    }),
//    groupField:'subtype',
//    remoteSort: true,
//    autoLoad: (activeTab == 'reportObjectsGrid'),
//    sorters : sInfo
//  });
  
    var objectsStore = SailPoint.Store.createStore({
        storeId: 'objectsStore',
        url: CONTEXT_PATH + '/analyze/reports/viewReportsDataSource.json',
        root: 'objects',
        fields: objectsFields,
        remoteGroup: true,
        groupField:'subtype',          
        autoLoad: (activeTab == 'reportObjectsGrid'),
        sorters:sInfo,
        simpleSortMode : true,
        method : 'POST',
        pageSize: -1
    });
    
  var objectsGrid = {
      xtype : 'gridpanel',
      store:objectsStore,
      id: 'reportObjectsGrid',
      cls: 'smallFontGrid selectableGrid',
      stateId: stateId,
      stateful: true,
      columns:cm2,
      listeners: {
          itemclick: clickDefinitionSaveAs, itemcontextmenu: SailPoint.Analyze.Grid.Reports.contextMenu
      },
      viewConfig : {
          stripeRows:true
      },
      features: [
          {
              ftype : 'spdefaultgrouping',
              singularObjectName: '#{msgs.report}',
              pluralObjectName: '#{msgs.reports}'
          }
      ],
      title:'#{msgs.reports}',
      tbar: [
        {
          xtype : 'searchfield',
          store : objectsStore,
          paramName:'name',
          storeLimit:500,
          emptyText:'#{msgs.label_filter_by_report_name}',
          width:250
        }
      ]
  };

  return objectsGrid;
};

SailPoint.Analyze.Grid.Reports.createSchedulesGrid = function(stateId, scheduleFields, schedulesCM, scheduleComboStore, activeTab) {
  
    var schedulesStore = SailPoint.Store.createStore({
        storeId: 'schedulesStore',
        url: CONTEXT_PATH + '/analyze/reports/viewScheduledDataSource.json',
        root: 'objects',
        totalProperty: 'count',
        fields: scheduleFields,
        remoteSort: true,
        autoLoad: (activeTab=='schedulesGrid'),
        sorters:[{property: 'nextExecution' }],
        simpleSortMode : true,
        method : 'POST'
    });

  var schedulesGrid = {
      xtype : 'paginggrid',
      store: schedulesStore,
      title:'#{msgs.grid_scheduled_reports}',
      id: 'schedulesGrid',
      cls: 'smallFontGrid selectableGrid',
      stateId: stateId,
      stateful: true,
      layout:'fit',
      columns:schedulesCM,
      listeners: {
          itemclick: clickSchedule, itemcontextmenu: SailPoint.Analyze.Grid.Reports.scheduledContextMenu
      },
      viewConfig: {
          stripeRows:true,
          scrollOffset: 1
      },
      tbar: [
        {
          xtype : 'searchfield',
          id:'schedulesSearchField',
          store : schedulesStore,
          paramName:'name',
          emptyText:'#{msgs.label_filter_by_schedule_name}',
          width:250,
          storeLimit:20
        },
          ' ', '#{msgs.filter_field_result} ',
          {
            xtype : 'combobox',
            name: 'frmSchedResult',
            id: 'frmSchedResult',
            queryMode: 'local',
            displayField : 'value',
            valueField : 'key',
            store : scheduleComboStore
          },
          ' ',
          {
            xtype:'button',
            text:'#{msgs.button_filter}',
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

 return schedulesGrid;
};

SailPoint.Analyze.Grid.Reports.createResultsGrid = function(stateId, resultsFields, resultsCM, resultsComboStore, activeTab) {
  
  var resultsStore = SailPoint.Store.createStore({
    storeId: 'resultsStore',
    fields: resultsFields,
    url: CONTEXT_PATH + '/analyze/reports/viewResultsDataSource.json',
    root: 'objects',
    totalProperty: 'count',
    remoteSort: true,
    autoLoad: (activeTab=='resultsGrid'),
    sorters:[{property: 'completed', direction: 'DESC' }],
    method : 'POST'
  });
  
  var resultsGrid = {
      xtype : 'paginggrid',
      store: resultsStore,
      id: 'resultsGrid',
      cls: 'smallFontGrid selectableGrid',
      stateId: stateId,
      title:'#{msgs.grid_report_results}',
      stateful: true,
      columns:resultsCM,
      layout:'fit',
      listeners: {
          itemclick: clickResult, itemcontextmenu: SailPoint.Analyze.Grid.Reports.resultsContextMenu
      },
      viewConfig: {
          stripeRows:true,
          scrollOffset: 1
      },
      tbar: [
        {
          xtype : 'searchfield',
          id:'resultsSearchField',
          'store':resultsStore,
          paramName:'name',
          emptyText:'#{msgs.label_filter_by_result_name}',
          width:250,
          storeLimit:20
        },

        ' ', '#{msgs.start_date} ',
        {
          xtype : 'datefield',
          id: 'frmStartDate',
          name: 'frmStartDate'
        },

        ' ', '#{msgs.end_date} ',
        {
          xtype : 'datefield',
          id: 'frmEndDate',
          name: 'frmEndDate'
        },

        ' ', '#{msgs.filter_field_result} ',
        {
          xtype : 'combobox',
          name : 'frmResult',
          id : 'frmResult',
          listConfig : {width:100},
          width : 100,
          queryMode : 'local',
          displayField : 'value',
          valueField : 'key',
          store : resultsComboStore
        },

        ' ',
        {
          xtype:'button',
          text:'#{msgs.button_filter}',
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
        },{
          xtype:'button',
          text: '#{msgs.button_reset}',
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
  return resultsGrid;
};



renderStatus = function(value, p, r) {
    var statusId = r.get('statusId');
    
    if (statusId === '')
    	return '';
    else if(statusId == 1)
        return '<span class=\'successBox font10\' >#{msgs.success}</span>';
    else if(statusId == 2)
        return Ext.String.format('<span class=\'warnBox font10\' >#{msgs.warning}</span>',value);
    else if(statusId == 0)
        return Ext.String.format('<span class=\'failBox font10\' >#{msgs.fail}</span>',value);
    else if(value == null)
        return '';
    else
        return Ext.String.format('{0}', value);
};

SailPoint.Analyze.Grid.Reports.resultsContextMenu = function(gridView, record, HTMLitem, index, e, eOpts){
  var contextMenu = new Ext.menu.Menu();
  gDbId = record.getId();
  gName = record.get('name');
  status = record.get('status');
  owner = record.get('owner-displayName');
  
  gMenu = contextMenu;
  
  contextMenu.add(
    new Ext.menu.Item({text: 'View', handler: viewGridObject, iconCls: 'viewDetailsBtn'})
  );
  
  if(status=='#{msgs.label_task_pending}') {
    contextMenu.add(new Ext.menu.Item({text: '#{msgs.menu_terminate}', handler: terminateResultPrompt, iconCls: 'terminateBtn'}));
  } else {
      if((SailPoint.SYSTEM_ADMIN == 'true') || (SailPoint.CURR_DISPLAYABLE_USER_NAME == owner)){
          contextMenu.add(
                  new Ext.menu.Separator(),
                  new Ext.menu.Item({text: '#{msgs.delete}', handler: deleteResultPrompt, iconCls: 'deleteBtn'})
          );
      }
  }
  e.stopEvent();
  contextMenu.showAt(e.xy);
};

SailPoint.Analyze.Grid.Reports.scheduledContextMenu = function(gridView, record, HTMLitem, index, e, eOpts){
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

SailPoint.Analyze.Grid.Reports.contextMenu = function(gridView, record, HTMLitem, index, e, eOpts){
  var contextMenu = new Ext.menu.Menu();
  gDbId = record.getId();
  gType = 'report';
  gSubType = record.get('subtype');
  gName = record.get('name');
  type = record.get('type');
  gProgressMode = record.get('progressMode');
  gMenu = contextMenu;

  contextMenu.add(
    new Ext.menu.Item({text: '#{msgs.menu_save_as_new}', handler: saveAsNewDefinition, iconCls: 'saveAsNewBtn'}),
    new Ext.menu.Item({text: '#{msgs.menu_schedule}', handler: scheduleGridObject, iconCls: 'scheduleBtn'}),
    new Ext.menu.Separator(),
    new Ext.menu.Item({text: '#{msgs.menu_exec}', handler: runGridObject, iconCls: 'executeBtn'}));
    
    if (executeInForegroundOption === true) {
      new Ext.menu.Item({text: '#{msgs.menu_exec_in_background}', handler: runGridObjectInBackground, iconCls: 'executeNowBtn'});
    }

  if(SailPoint.SYSTEM_ADMIN == 'true'){
    contextMenu.add(
      new Ext.menu.Separator(),
      new Ext.menu.Item({text: '#{msgs.menu_delete}', handler: deleteDefinitionPrompt, iconCls: 'deleteBtn'})
    );
  }
    
  e.stopEvent();
  contextMenu.showAt(e.xy);
};

SailPoint.Analyze.Grid.Reports.myContextMenu = function(gridView, record, HTMLitem, index, e, eOpts){
  var contextMenu = new Ext.menu.Menu();
  gType = 'report';
  gDbId = record.getId();
  gSubType = record.get('subtype');
  gName = record.get('name');
  gProgressMode = record.get('progressMode');
  type = record.get('type');
  gMenu = contextMenu;

  contextMenu.add(        
    new Ext.menu.Item({text: '#{msgs.menu_save_as_new}', handler: saveAsNewDefinition, iconCls: 'saveAsNewBtn'}),
    new Ext.menu.Item({text: '#{msgs.menu_edit}', handler: editDefinition, iconCls: 'editBtn'}),
    new Ext.menu.Item({text: '#{msgs.menu_schedule}', handler: scheduleGridObject, iconCls: 'scheduleBtn'}),
    new Ext.menu.Separator(),
    new Ext.menu.Item({text: '#{msgs.menu_exec}', handler: runGridObject, iconCls: 'executeBtn'}));

    if (executeInForegroundOption === true) {    
      new Ext.menu.Item({text: '#{msgs.menu_exec_in_background}', handler: runGridObjectInBackground, iconCls: 'executeNowBtn'});
    }
    

  contextMenu.add(
    new Ext.menu.Item({text: '#{msgs.menu_delete}', handler: deleteDefinitionPrompt, iconCls: 'deleteBtn'})
  );          
   
  e.stopEvent();
  contextMenu.showAt(e.xy);
};
