/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.Manage.Grid.PolicyViolation', {});
SailPoint.Manage.Grid.PolicyViolation.createGrid = function(fields, columns, gridStateStr, pageSize, stateId, statusStore, typeStore, gridWidth) {

  Ext.QuickTips.init();

  // data store
  violationsStore = SailPoint.Store.createStore({
      storeId : 'violationsStore',
      autoLoad : false,
      fields : fields,
      root : 'objects',
      totalProperty: 'count',
      url : CONTEXT_PATH + '/manage/policyViolations/policyViolationsDataSource.json',
      pageSize : pageSize,
      remoteSort: true
  });

  var gridConf = {
      xtype : 'pagingcheckboxgrid',
      id: 'violationsGrid',
      store: violationsStore,
      cls: 'smallFontGrid selectableGrid',
      region:'center',
      stateId: stateId,
      stateful: true,
      selType : 'checkmultiselmodel',
      selModel: {selectMessageBox: Ext.getDom('selectedCount'), selectionMode : 'SIMPLE'},
      columns: columns,
      //gridStateStr: gridStateStr,
      layout:'fit',
      defaults:{autoScroll: true},
      viewConfig: {
          stripeRows: true,
          scrollOffset: 1
      },
      usePageSizePlugin: true,
      runInitialLoad : false,
      listeners : {
          itemclick : SailPoint.Manage.Grid.PolicyViolation.clickRow
      }
  };
  
  return {
    xtype : 'panel',
    items: [gridConf],
    layout:'border',
    region:'center',
    tbar: [
      {
        xtype: 'searchfield',
        id:'violationSearchField',
        'store':violationsStore,
        paramName:'username',
        emptyText:'#{msgs.label_filter_by_username}',
        storeLimit:pageSize,
        width: 200
      },
      ' ',
      {
        xtype: 'combobox',
        name: 'violationType',
        id: 'violationType',
        emptyText: '#{msgs.label_policy_type}',
        store:typeStore,
        width: SailPoint.Platform.isMobile() ? 150 : 200
      },
      ' ',
      {
        xtype: 'combobox',
        name: 'violationStatus',
        id: 'violationStatus',
        emptyText: '#{msgs.label_status}',
        store:statusStore,
        width: SailPoint.Platform.isMobile() ? 150 : 200
      },
      '->',
      {
        xtype:'button',
        id: 'violationSearchButton',
        text:'#{msgs.button_search}',
        scale : 'medium',
        cls : 'primaryBtn',
        listeners : {
          click :function(){
              var grid = this.findParentByType('panel').items.get(0);
              grid.getStore().getProxy().extraParams['username'] = Ext.getCmp('violationSearchField').getValue();
              grid.getStore().getProxy().extraParams['policyType'] = Ext.getCmp('violationType').getValue();
              grid.getStore().getProxy().extraParams['violationStatus'] = Ext.getCmp('violationStatus').getValue();
              grid.getStore().load({params:{start:0,limit:pageSize}});
          }
        }
      },
      {
        xtype:'button',
        text: '#{msgs.button_reset}',
        scale : 'medium',
        handler: function(){
          Ext.getCmp('violationType').clearValue();
          Ext.getCmp('violationSearchField').clearValue();
          Ext.getCmp('violationStatus').clearValue();
          
          var grid = this.findParentByType('panel').items.get(0);
          grid.getStore().getProxy().extraParams['username'] = '';
          grid.getStore().getProxy().extraParams['policyType'] = '';
          grid.getStore().getProxy().extraParams['violationStatus'] = '';
          grid.getStore().load({params:{start:0, limit:pageSize}});
        }
      }
    ]
  };
};

SailPoint.Manage.Grid.PolicyViolation.clickRow = function(gridView, record, HTMLitem, index, e, eOpts) {
    // don't process the event through if it's just a checkbox click
    if (gridView.clickedColumn == 0)  
        return;

    if (record.getId() != null && record.getId().length > 1) {
        $('violationListForm:violationIds').value = '[' + record.getId() + ']';
        //TODO extjs4 fix this!!
        //grid.gridState.encodeGridState('violationListForm:')
        $('violationListForm:selectedPolicyViolationButton').click();
    }
};

SailPoint.Manage.Grid.PolicyViolation.renderPolicy = function(value, p, record) {
    str = '<span id="policy{0}">{1}</span>';
    return Ext.String.format(str, record.getId(), value);
};
