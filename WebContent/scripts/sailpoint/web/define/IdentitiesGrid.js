/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Define', 
       'SailPoint.Define.Grid',
       'SailPoint.Define.Grid.Identity');

SailPoint.Define.Grid.Identity.clickIdentity = function(view, record, item, index, e, eOpts) {
    view.panel.gridState.encodeGridState('editForm:');
    $('editForm:currentDefinitionId').value = record.getId();
    $('editForm:editButton').click();
};

SailPoint.Define.Grid.Identity.renderScore = function(value, p, record) {
    var str = '<div class=\'riskIndicator ri_{0}\'>{1}</div>';
    var color = record.data['scorecard-color'];
    return Ext.String.format(str, color, value);
};

SailPoint.Define.Grid.Identity.createGrid = function(gridMetaData, gridStateStr, pageSize, stateId) {

    Ext.QuickTips.init();

    var storeId = 'identityGridStore';

    var gridConf = {
        xtype : 'paginggrid',
        url : SailPoint.getRelativeUrl('/define/identity/identitiesDataSource.json'),
        gridMetaData : gridMetaData,
        storeId : storeId,
        cls : 'smallFontGrid selectableGrid',
        stateId : stateId,
        stateful : true,
        gridStateStr : gridStateStr,
        layout : 'fit',
        listeners : {
            itemclick : SailPoint.Define.Grid.Identity.clickIdentity
        },
        viewConfig : {
            scrollOffset : 1,
            stripeRows : true
        },
        tbar : [ {
            xtype : 'searchfield',
            storeId : storeId,
            paramName : 'name',
            storeLimit : pageSize,
            emptyText : '#{msgs.label_filter_by_identity_name}',
            width : 250
        } ],
        usePageSizePlugin : true,
        runInitialLoad : true
    };

    return gridConf;
};