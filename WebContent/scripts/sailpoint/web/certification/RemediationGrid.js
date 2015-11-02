/* (c) Copyright 2010 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Certification', 
       'SailPoint.Certification.RemediationGrid');
SailPoint.Certification.RemediationGrid.vCheckbox = null;
SailPoint.Certification.RemediationGrid.revocationWin;
SailPoint.Certification.RemediationGrid.completionState;
SailPoint.Certification.RemediationGrid.workItem;

SailPoint.Certification.RemediationGrid.viewWorkItemOrCert = function() {

  if(SailPoint.Certification.RemediationGrid.completionState=='Finished') {
    Ext.MessageBox.show({
       title: '#{msgs.work_item_complete}',
       msg: '#{msgs.work_item_complete_description}',
       icon: Ext.MessageBox.ERROR,
       buttons: Ext.MessageBox.OK
    });
    return false;
  }
  SailPoint.certification.viewWorkItem(SailPoint.Certification.RemediationGrid.workItem);
};

SailPoint.Certification.RemediationGrid.gridClicked = function(gridView, record, item, e, eOpts) {
  SailPoint.Certification.RemediationGrid.completionState = record.get('action-completionState');
  gDbId = record.get('action-workItem');

  if(gDbId && gDbId != '') {
    SailPoint.certification.viewWorkItem(gDbId);
  }
};

SailPoint.Certification.RemediationGrid.forwardFromMenu = function() {
  SailPoint.Certification.RemediationGrid.revocationWin.hide();
  SailPoint.Certification.RemediationGrid.forwardWorkItem(SailPoint.Certification.RemediationGrid.workItem, null, SailPoint.Certification.RemediationGrid.forwardPage);
}

SailPoint.Certification.RemediationGrid.renderRemediationStatus = function(value, p, r) {
  SailPoint.Certification.RemediationGrid.completionState = r.get('action-completionState');
  if(SailPoint.Certification.RemediationGrid.completionState=='Finished') {
    return Ext.String.format('{0}<br/><div class=\'successBox\' style=\'color:seagreen;margin-top:3px\' >{1}</div>',value,'#{msgs.label_task_completed}');
  }
  else return value;
};

SailPoint.Certification.RemediationGrid.contextMenu = function(gridView, record, HTMLitem, index, e, eOpts) {
    var contextMenu = new Ext.menu.Menu();
    gDbId = record.getId();
    SailPoint.Certification.RemediationGrid.workItem = record.get('workItem');

    if (!SailPoint.Certification.RemediationGrid.workItem || SailPoint.Certification.RemediationGrid.workItem == "") {
        e.stopEvent();
        return;
    }

    gMenu = contextMenu;
    SailPoint.Certification.RemediationGrid.completionState = record.get('action-completionState');

    contextMenu.add(new Ext.menu.Item({
        text : '#{msgs.menu_view_work_item}',
        handler : SailPoint.Certification.RemediationGrid.viewWorkItemOrCert,
        iconCls : 'editBtn'
    }));

    e.stopEvent();
    contextMenu.showAt(e.xy);
};

SailPoint.Certification.RemediationGrid.showRemediationGrid = function(certificationId, fields, columns, title) {

    var store = SailPoint.Store.createRestStore({
        autoLoad : false,
        pageSize : 20,
        url : SailPoint.getRelativeUrl('/rest/certification/' + certificationId + '/revocations'),
        fields : fields,
        remoteSort : true
    });

    var grid = new SailPoint.grid.PagingGrid({
        store : store,
        cls : 'smallFontGrid selectableGrid',
        pageSize: 20,
        columns : columns,
        viewConfig : {
            autoFill : false,
            stripeRows : true,
            emptyText : '#{msgs.no_results_found}',
            scrollOffset : 1
        }
    });

    SailPoint.Certification.RemediationGrid.revocationWin = new Ext.Window({
        title : title,
        closeAction : 'hide',
        width : 768,
        height : 400,
        layout : 'fit',
        autoScroll : true,
        plain : true,
        items : [ grid ]
    });

    grid.addListener('itemclick', SailPoint.Certification.RemediationGrid.gridClicked);
    grid.addListener('itemcontextmenu', SailPoint.Certification.RemediationGrid.contextMenu);
    SailPoint.Certification.RemediationGrid.revocationWin.show();
    
    store.load({
        params : {
            start : 0,
            limit : 20
        }
    });
};
