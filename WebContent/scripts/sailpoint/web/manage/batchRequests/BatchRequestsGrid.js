/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.Manage.Grid.BatchRequests');
       
var grid;

SailPoint.Manage.Grid.BatchRequests.createGrid = function(gridMetaData, gridStateStr, pageSize, stateId) {
  Ext.QuickTips.init();

  // data store
  requestsStore = SailPoint.Store.createStore({
      autoLoad: false,
      url: CONTEXT_PATH + '/manage/batchRequest/batchRequestsDataSource.json',
      root: 'objects',
      totalProperty: 'count',
      fields: gridMetaData.fields,
      pageSize:pageSize,
      remoteSort: true
  });
  
  // batchrequests grid
  grid = new SailPoint.grid.PagingGrid({
    id: 'batchRequestsGrid',
    cls: 'selectableGrid',
    stateId: stateId,
    stateful: true,
    gridStateStr: gridStateStr,
    selType: 'cellmodel',
    store: requestsStore,
    gridMetaData: gridMetaData,
    layout:'fit',
    loadMask: true,
    listeners: { 
      itemclick: SailPoint.Manage.Grid.BatchRequests.clickRow, 
      itemcontextmenu: SailPoint.Manage.Grid.BatchRequests.showContextMenu
    },
    viewConfig: {
      stripeRows: true,
      scrollOffset: 1
    },
    usePageSizePlugin: true,
    tbar: [
    {
        xtype : 'searchfield',
        store : requestsStore,
        paramName:'searchText',
        storeLimit:pageSize,
        emptyText:'#{msgs.batch_request_grid_filter_by_file}',
        width:250
    }, ' ',
    {
      xtype : 'button',
      text: '#{msgs.batch_request_grid_button_new}',
      scale : 'medium',
      cls : 'primaryBtn',
      id: 'newBatchRequestBtn',
      handler: function() {
        $("editForm:newBatchRequestHiddenBtn").click();
      }
    }]
  });
  
  grid.initialLoad();
  
  return grid;
};

SailPoint.Manage.Grid.BatchRequests.showContextMenu = function(gridView, record, HTMLitem, index, e, eOpts){
    id = record.getId();
    var contextMenu = new Ext.menu.Menu();
    contextMenu.add(new Ext.menu.Item({text: '#{msgs.menu_terminate}', 
                                       handler: SailPoint.Manage.Grid.BatchRequests.terminatePrompt, 
                                       iconCls: 'deleteBtn'}));

    contextMenu.add(new Ext.menu.Item({text: '#{msgs.menu_delete}', 
                                       handler: SailPoint.Manage.Grid.BatchRequests.deletePrompt, 
                                       iconCls: 'deleteBtn'}));
    e.stopEvent();
    contextMenu.showAt(e.xy);
};  

SailPoint.Manage.Grid.BatchRequests.clickRow = function(gridView, record, HTMLitem, index, e, eOpts){
    var col = gridView.getSelectionModel().getCurrentPosition().column;
    var fldName = gridView.getHeaderAtIndex(col).dataIndex;
    // enable the last column to show error message
    var msg = record.get('message');
    if (fldName == 'status' && msg) {
        Ext.MessageBox.alert('Message', msg);
    }
    else {
      grid.gridState.encodeGridState('editForm:');
      SailPoint.Manage.Grid.BatchRequests.viewBatchRequestDetails(record.getId());
    }
};

SailPoint.Manage.Grid.BatchRequests.showItemMessage = function(gridView, record, HTMLitem, index, e, eOpts){
  var col = gridView.getSelectionModel().getCurrentPosition().column;
  if (col == 1 || col == 2) {
    var msg = record.get('message');
    if (msg) {
      Ext.MessageBox.alert('Message', msg);
    }
  }
};

SailPoint.Manage.Grid.BatchRequests.viewBatchRequestDetails = function(editId) {
  // there's no functional difference btwn this and clickRow
  $('editForm:batchRequestId').value = editId;
  $('editForm:viewDetailsButton').click();
};

SailPoint.Manage.Grid.BatchRequests.terminatePrompt = function() {
  $('editForm:batchRequestId').value = id;
  Ext.MessageBox.confirm('#{msgs.batch_request_grid_terminate_prompt_title}', 
    '#{msgs.batch_request_grid_terminate_prompt_text}', SailPoint.Manage.Grid.BatchRequests.terminateBatchRequest);
};

SailPoint.Manage.Grid.BatchRequests.deletePrompt = function() {
  $('editForm:batchRequestId').value = id;
  Ext.MessageBox.confirm('#{msgs.batch_request_grid_delete_prompt_title}', 
    '#{msgs.batch_request_grid_delete_prompt_text}', SailPoint.Manage.Grid.BatchRequests.deleteBatchRequest);
};


SailPoint.Manage.Grid.BatchRequests.terminateBatchRequest = function(button, text) {
  if (button == 'yes') {
      $('editForm:batchRequestId').value = id;
      $('editForm:terminateButton').click();
  }
};

SailPoint.Manage.Grid.BatchRequests.deleteBatchRequest = function(button, text) {
  if (button == 'yes') {
      $('editForm:batchRequestId').value = id;
      $('editForm:deleteButton').click();
  }
};


SailPoint.Manage.Grid.BatchRequests.createItemsGrid = function(gridMetaData) {
  // data store
  var itemsStore = SailPoint.Store.createStore({
      autoLoad: false,
      url: CONTEXT_PATH + '/manage/batchRequest/batchItemsDataSource.json',
      root: 'objects',
      totalProperty: 'count',
      fields: gridMetaData.fields,
      remoteSort: true,
      simpleSortMode : true
  });
  
  // batchrequests grid
  var itemsgrid = new SailPoint.grid.PagingGrid({
    id: 'batchRequestsGrid',
    stateful: true,
    store: itemsStore,
    gridMetaData: gridMetaData,
    selType: 'cellmodel',
    layout:'fit',
    listeners: { 
      itemclick: SailPoint.Manage.Grid.BatchRequests.showItemMessage
    },
    loadMask: true,
    viewConfig: {
      stripeRows: true,
      scrollOffset: 1
    }
  });
  
  var panelWidth = Ext.get('requestItemsGrid').getSize().width;

  var wrapperPanel = new Ext.Panel({
      layout:'fit',
      width: panelWidth - 15,
      items:[itemsgrid]
    });

  wrapperPanel.render('requestItemsGrid'); 

  itemsgrid.initialLoad();

  return itemsgrid;
}
