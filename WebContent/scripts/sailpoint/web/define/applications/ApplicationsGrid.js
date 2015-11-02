/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Define', 
       'SailPoint.Define.Grid',
       'SailPoint.Define.Grid.Application');
       
var grid;
var canEdit;

SailPoint.Define.Grid.Application.createGrid = function(gridMeta, gridStateStr, pageSize, stateId, editable) {
  var appGridState = new SailPoint.GridState({name: 'app', gridStateObj: JSON.parse(gridStateStr)});  
  canEdit = editable;

  Ext.QuickTips.init();

  // data store
    appsStore = SailPoint.Store.createStore({
        fields : gridMeta.fields,
        autoLoad : false,
        url : CONTEXT_PATH + '/define/applications/applicationsDataSource.json',
        root : 'applications',
        pageSize : pageSize,
        remoteSort : true,
        method : 'POST'
    });
  
  // applications grid
  grid = new SailPoint.grid.PagingGrid({
    id: 'appsGrid',
    cls: 'selectableGrid',
    stateId: stateId,
    stateful: true,
    gridStateStr: gridStateStr,
    store: appsStore,
    gridMetaData: gridMeta,
    layout:'fit',
    listeners: { 
      itemclick: SailPoint.Define.Grid.Application.clickRow, 
      itemcontextmenu: SailPoint.Define.Grid.Application.showContextMenu
    },
    viewConfig: {
      stripeRows: true,
      scrollOffset: 1
    },
    usePageSizePlugin: true,
    tbar: [
      {
        xtype : 'searchfield',
        store : appsStore,
        paramName:'searchText',
        storeLimit : pageSize,
        emptyText:'#{msgs.label_filter_by_application_name}',
        width:250
    },
    ' ',
    {
      xtype : 'button',
      text: '#{msgs.button_new_app}',
      id: 'newApplicationBtn',
      scale: 'medium',
      cls : 'primaryBtn',
      handler: function() {
        $("editForm:newApplicationHiddenBtn").click();
      }
    }]
  });
  
  grid.initialLoad();
  
  return grid;
};

SailPoint.Define.Grid.Application.showContextMenu = function(gridView, record, HTMLitem, index, e, eOpts) {
    id = record.getId();
    name = record.get('name');

    var viewEditText = (canEdit) ? '#{msgs.menu_edit}' : '#{msgs.menu_view}';
    var viewEditIcon = (canEdit) ? "editBtn" : "viewDetailsBtn";
    
    var contextMenu = new Ext.menu.Menu();
    contextMenu.add(new Ext.menu.Item({text: viewEditText, 
                                       handler: SailPoint.Define.Grid.Application.editHandler, 
                                       iconCls: viewEditIcon}));
    if (canEdit) {
        contextMenu.add(new Ext.menu.Item({text: '#{msgs.menu_delete}', 
                                           handler: SailPoint.Define.Grid.Application.deletePrompt, 
                                           iconCls: 'deleteBtn'}));
    }               
    e.stopEvent();
    contextMenu.showAt(e.xy);
};  

SailPoint.Define.Grid.Application.clickRow = function(gridView, record, HTMLitem, index, e, eOpts) {
    // TODO extjs4: Fix the grid state
    //gridView.gridState.encodeGridState('editForm:');
    SailPoint.Define.Grid.Application.editApplication(record.getId());
};

SailPoint.Define.Grid.Application.editHandler = function() {
  SailPoint.Define.Grid.Application.editApplication(id);
};  
  
SailPoint.Define.Grid.Application.editApplication = function(editId) {
  // there's no functional difference between this and clickRow
  $('editForm:currentDefinitionId').value = editId;
  $('editForm:editButton').click();
};
  
  
SailPoint.Define.Grid.Application.deletePrompt = function() {
  $('editForm:currentDefinitionId').value = id;
  Ext.MessageBox.confirm('Confirm delete of "' + name + '"?', 
    'Are you sure you want to delete "' + name + '"?', SailPoint.Define.Grid.Application.deleteApplication);
};


SailPoint.Define.Grid.Application.deleteApplication = function(button, text) {
  if (button == 'yes') {
      $('editForm:currentDefinitionId').value = id;
      $('editForm:deleteButton').click();
  }
};
