/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.Role', 'SailPoint.Role.Version');

/**
 * @param id ID that will be given to the grid.  The grid's store will be given an ID composed of 
 * this one and concatenated with 'DataStore'
 * @param pageSize Page size for the grid
 * @param renderTo renderTo property that is passed on to the grid in creation.  See Ext.data.GridPanel.renderTo
 */
SailPoint.Role.Version.getGrid = function(config) {
    var gridId = config.id;
    var versionGrid = Ext.getCmp(gridId);
    
    if (!versionGrid) {
        var store = SailPoint.Store.createStore({
            storeId: config.id + 'DataStore',
            url: SailPoint.getRelativeUrl('/define/roles/version/roleVersions.json'),
            root: 'versions',
            totalProperty: 'numVersions',
            fields : ['id', 'version', 'created', 'creator'],
            remoteSort: true,
            pageSize: config.pageSize ? config.pageSize : 15
        });
        
        versionGrid = {
            xtype : 'gridpanel',
            id: gridId,
            title: config.title,
            style: 'padding: 0px',
            border: false,
            bodyBorder: false,
            bodyStyle: SailPoint.Role.RoleView.SectionPanelBodyStyle,
            collapsible: true,
            collapsed: true,
            store: store,
            columns: [
                {header: 'Version', dataIndex: 'version', sortable: true, width: 70},
                {header: 'Creator', dataIndex: 'creator', sortable: true, flex: 1},
                {header: 'Created', dataIndex: 'created', sortable: true, flex: 1}
            ],
            viewConfig: {autoFill: false, emptyText: '#{msgs.role_viewer_roles_unavailable}'},
//              Need to show the role when a row is clicked
            listeners: { 
                itemclick: SailPoint.Role.Version.handleClick, 
                expand: function(grid, opts) {
                    // Get rid of the unsightly gap between the last row and the paging bar below it
                    grid.getView().refresh();
                }
             },
            // TODO: , itemcontextmenu: contextMenu },
            bbar: new Ext.toolbar.Paging({
                store: store,
                displayInfo: true
            })
        };
        
        if(config.prefix) {
            versionGrid.prefix = config.prefix;
        }
    }
    
    return versionGrid;
}


SailPoint.Role.Version.handleClick = function(gridView, record, HTMLitem, index, e, eOpts){
    Ext.MessageBox.wait('#{msgs.loading_data}');
    Ext.Ajax.request({
        url: SailPoint.getRelativeUrl('/define/roles/version/versionDataSource.json'),
        success: SailPoint.Role.Version.showArchive, 
        failure: SailPoint.Role.Version.showArchiveErrorMsg,
        params: {archiveId: record.getId()}
    });
}

SailPoint.Role.Version.showArchive = function(response, options) {
    var archiveData = JSON.parse(response.responseText);
    var archivePopup = SailPoint.Role.Version.getArchivePopup({
        id: 'archivedRoleWindow',
        archiveId: options.params.archiveId
    });
    SailPoint.Role.RoleView.populate({
        prefix: 'archive',
        results: archiveData,
        showVersionGrid: false,
        isArchive: true,
        archiveId: options.params.archiveId
    });
    
    archivePopup.show();
    Ext.MessageBox.hide();
}

SailPoint.Role.Version.getArchivePopup = function(config) {
    var archiveWindow = Ext.getCmp(config.id);
    
    if (!archiveWindow) {
        var contentPanel = SailPoint.Role.RoleView.getRoleViewContentPanel({
            prefix: 'archive',
            isMainView: false,
            roleReferenceParamBuilder: function() { return {archiveId: archiveWindow.archiveId }; }
        });
        
        archiveWindow = new Ext.Window({
            id: config.id,
            width: 768,
            height: 600,
            title: '#{msgs.title_archived_role}',
            layout: 'fit',
            closeAction: 'hide',
            closable: false,
            items: [ contentPanel ],
            bbar: [{
                id: 'editArchivedRoleBtn',
                text: '#{msgs.button_rollback_role}',
                cls : 'primaryBtn',
                handler: function() {
                    var archiveId = Ext.getCmp(config.id).archiveId;
                    
                    // There has to be a nicer way to do this, but time is short --Bernie
                    if ($('viewerForm:roleToEdit')) {
                        // We're in the role viewer
                        $('viewerForm:roleToEdit').value = '';
                        $('viewerForm:archiveToEdit').value = archiveId;
                        $('viewerForm:editArchive').click();
                    } else {
                        // Assume that we're in the role editor
                        SailPoint.modeler.RoleEditor.prepareForRollback(archiveId);
                        $('rollbackForm:applyRollback').click();
                    }
                }
            },{
                id: 'closeArchiveBtn',
                text: '#{msgs.button_close}',
                handler: function() {
                    archiveWindow.hide();
                }
            }]
        }); 
    }
    
    archiveWindow.archiveId = config.archiveId; 
    
    return archiveWindow;
}