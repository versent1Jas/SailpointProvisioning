/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Manage', 
       'SailPoint.Manage.Grid',
       'SailPoint.Manage.Grid.AppRiskScores');

SailPoint.Manage.Grid.AppRiskScores.createGrid = function(fields, columns, gridStateStr, stateId, canEdit) {

  var appRiskScoreStore = SailPoint.Store.createStore({
      fields : fields,
      autoLoad: true,
      url: CONTEXT_PATH + '/manage/riskScores/appRiskScoresDataSource.json',
      root: 'appRiskScores',
      simpleSortMode : true,
      pageSize: 20,
      sorters: [{property: 'application', direction: 'ASC'}],
      remoteSort: true
  });
  
  SailPoint.Utils.setColumnFlex({columns:columns});
  SailPoint.Utils.setDecisionColClass({columns:columns});
  
  var config = {
      xtype : 'paginggrid',
      id: 'appRiskScoreGrid',
      cls: 'smallFontGrid selectableGrid',
      stateId: stateId,
      stateful: true,
      store: appRiskScoreStore,
      layout: 'fit',
      columns: columns,
      viewConfig: {
          stripeRows: true
      },
      bbar: {
          xtype : 'pagingtoolbar',
          store: appRiskScoreStore,
          displayInfo: true
      },
      tbar: [
        {
          xtype : 'searchfield',
          store : appRiskScoreStore,
          paramName: 'name',
          storeLimit: 20,
          emptyText: '#{msgs.label_filter_by_application_name}',
          width: 250
        }
      ]
  };
  
  if(canEdit) {
      config.listeners = { 
          itemclick: function(gridView, record) {
              $('editForm:currentObjectId').value = record.getId();
              $('editForm:editButton').click();
          }
      };
  }
  
  return config;
}

SailPoint.Manage.Grid.AppRiskScores.renderScore = function(value, p, record) {
  str = '<div class=\'riskIndicator ri_{0}\'>{1}</div>';
  return Ext.String.format(str, value.color, value.score);
}