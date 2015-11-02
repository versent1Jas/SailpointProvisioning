/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.Manage.Grid.Certifications');
       
var gridState;
var grid;

SailPoint.Manage.Grid.Certifications.createGrid = function(gridMetaData, gridStateStr, pageSize, stateId, statusStore, typeStore, gridWidth) {

    gridState = new SailPoint.GridState(JSON.parse(gridStateStr));  
    
    Ext.QuickTips.init();
    
    var sInfo = [{property: 'description', direction: 'ASC' }];
    
    if(gridState && gridState._getValue('sortColumn')) {
        sInfo = [{property: gridState._getValue('sortColumn'), direction: gridState._getValue('sortOrder') }]
    }
    
    var start = 0;
    if(gridState && gridState._getValue('firstRow') > 1) {
        start = gridState._getValue('firstRow');
    }
    
    var store = SailPoint.Store.createStore({
        fields : gridMetaData.fields,
        autoLoad : true,
        url : SailPoint.getRelativeUrl('/manage/certification/certificationsDataSource.json'),
        root : 'objects',
        totalProperty: 'count',
        simpleSortMode : true,
        pageSize : pageSize,
        sorters : sInfo,
        remoteSort : true,
        listeners : {
            load : {
                fn : function(st, r, s, o) {
                    gridState.updateFirstRow(st, r, s, o);
                }
            }
        }
    });
  
    return {
        xtype : 'paginggrid',
        id: 'certificationsGrid',
        cls: 'smallFontGrid selectableGrid',
        stateId: stateId,
        stateful: true,
        store: store,
        gridMetaData: gridMetaData,
        viewConfig: {
          stripeRows:true,
          scrollOffset: 1
        },
        usePageSizePlugin: true,
        listeners : {
            itemclick : SailPoint.Manage.Grid.Certifications.selectionHandler,
            itemcontextmenu : SailPoint.Manage.Grid.Certifications.contextMenu
        }
    };
};


SailPoint.Manage.Grid.Certifications.viewCertification = function(certId) {
    Ext.fly('editForm:currentObjectId').dom.value = certId;
    Ext.fly('editForm:editButton').dom.click();
};

SailPoint.Manage.Grid.Certifications.forwardFromMenu = function(certId, limitReassignments) {
    forwardCertificationWorkItem(certId, "viewCertifications", limitReassignments);
};

SailPoint.Manage.Grid.Certifications.renderPercent = function(value, p, r) {
    return Ext.String.format('#{msgs.percent_complete_with_count}', r.get('itemPercentComplete'), r.get('completedItems'), r.get('totalItems'));
};

SailPoint.Manage.Grid.Certifications.selectionHandler = function(view, record, item, index, e, eOpts) {
    SailPoint.Manage.Grid.Certifications.viewCertification(record.getId());
};

SailPoint.Manage.Grid.Certifications.contextMenu = function(view, record, item, index, e, eOpts) {
    var contextMenu = new Ext.menu.Menu();
  
    contextMenu.add(
        {xtype: 'menuitem', text: '#{msgs.cert_menu_action_edit}', handler:  Ext.bind(SailPoint.Manage.Grid.Certifications.viewCertification, null, [record.getId()]), iconCls: 'editBtn'},
        {xtype: 'menuitem', text: '#{msgs.cert_menu_action_forward}', handler:  Ext.bind(SailPoint.Manage.Grid.Certifications.forwardFromMenu, null, [record.getId(), record.get("limitReassignments")]), iconCls: 'forwardBtn', disabled:record.data.signed}
    );
    
    e.stopEvent();
    contextMenu.showAt(e.xy);
};
