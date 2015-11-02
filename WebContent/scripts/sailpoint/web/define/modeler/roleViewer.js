/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.Role', 'SailPoint.Role.Viewer');

SailPoint.Role.Viewer.ViewerModes = {
    TOP_DOWN: 'topDown',
    BOTTOM_UP: 'bottomUp',
    GRID: 'grid'
};

SailPoint.Role.Viewer.MAX_ROLES = 25;

SailPoint.Role.Viewer.getRoleViewerPanel = function(config) {
    var treePanel = SailPoint.Role.Viewer.getNavPanelWrapper({id: config.navPanelId, title: config.navPanelTitle});
    var informationPanel = SailPoint.Role.Viewer.getRoleViewerInformationPanel({
        id: config.viewPanelId, 
        title: config.viewPanelTitle
    });
    // Save these off because the viewport will whack them -- We reapply the errors in the activate listener
    var errors = $('spErrorMsgsDiv').innerHTML;
    
    var roleViewerPanel = {
        xtype : 'sptabcontentpanel',
        id: config.id,
        title: config.title,
        headerAsText: false,
        header: false,
        layout: 'border',
        items: [treePanel, informationPanel],
        messages: errors,
        listeners: {
            activate: {
                fn: function(viewerPanel){
                    if (!viewerPanel.isLoaded) {
                        Ext.getCmp(config.viewPanelId).getLoader().load();
                        viewerPanel.isLoaded = true;
                    }
                },
                single: true,
                scope: this
            }
        }
    };
    
    return roleViewerPanel;
};

SailPoint.Role.Viewer.getNavPanelWrapper = function(config) {
    var navPanelWrapper = {
        xtype : 'panel',
        id: config.id,
        title: config.title,
        header: true,
        border: false,
        headerAsText: true,
        autoScroll: true,
        collapsible: true,
        width: 400,
        minWidth: 380,
        region: 'west',
        layout: 'fit',
        split: true,
        animate: true,
        items: [SailPoint.Role.Viewer.getNavPanel({id:'roleNavPanel'})],
        tbar: [{
            id: 'topDownTreeNav', // TODO: Fix the ID so it is not fully hard-coded
            text: '#{msgs.role_navigation_view_top_down}',
            enableToggle: true,
            toggleGroup: 'viewModes',
            pressed: false,
            hidden: SailPoint.Role.Viewer.TREE_VIEW_DISABLED,
            toggleHandler: function(button, isPressed) {
                var viewerStateController = Ext.getCmp('roleViewerStateController');
                var navigationPanel = Ext.getCmp('roleNavPanel');
                var treePanel = Ext.getCmp('roleTreePanel');
                if (isPressed) {
                    Ext.MessageBox.wait('#{msgs.loading_data}');
                
                    navigationPanel.getLayout().setActiveItem(0);
                
                    SailPoint.Role.Viewer.updateState();
                    if (viewerStateController) {
                        viewerStateController.fireEvent('statechange');
                    }
                
                    treePanel.getRootNode().removeAll();
                    treePanel.getStore().load({
                        node: treePanel.getRootNode(),
                        callback: SailPoint.Role.Viewer.selectAppropriateNode
                    });
                
                    navigationPanel.lastPressed = button;
                }
            }
        },
        {
            id: 'bottomUpTreeNav', // TODO: Fix the ID so it is not fully hard-coded
            text: '#{msgs.role_navigation_view_bottom_up}',
            enableToggle: true,
            toggleGroup: 'viewModes',
            pressed: false,
            hidden: SailPoint.Role.Viewer.TREE_VIEW_DISABLED,
            toggleHandler: function(button, isPressed) {
                var viewerStateController = Ext.getCmp('roleViewerStateController');
                var navigationPanel = Ext.getCmp('roleNavPanel');
                var treePanel = Ext.getCmp('roleTreePanel');
                if (isPressed) {
                    Ext.MessageBox.wait('#{msgs.loading_data}');
                    
                    navigationPanel.getLayout().setActiveItem(0);
                    
                    // Fire an update to change the viewer mode
                    SailPoint.Role.Viewer.updateState();
                    if (viewerStateController) {
                        viewerStateController.fireEvent('statechange');
                    }
                    
                    treePanel.getRootNode().removeAll();
                    treePanel.getStore().load({
                        node: treePanel.getRootNode(),
                        callback: SailPoint.Role.Viewer.selectAppropriateNode
                    });
                    
                    navigationPanel.lastPressed = button;
                }
            }
        },
        {
            id: 'gridNav', // TODO: Fix the ID so it is not fully hard-coded
            text: '#{msgs.role_navigation_view_grid}',
            enableToggle: true,
            toggleGroup: 'viewModes',
            pressed: false, 
            toggleHandler: function(button, isPressed){
                var viewerStateController = Ext.getCmp('roleViewerStateController');
                var navigationPanel = Ext.getCmp('roleNavPanel');
                var viewerState = viewerStateController.getState();
                if (isPressed) {
                    Ext.MessageBox.wait('#{msgs.loading_data}');
                    navigationPanel.getLayout().setActiveItem('gridPanel');
                    SailPoint.Role.Viewer.updateState();
                    if (viewerStateController)
                        viewerStateController.fireEvent('statechange');
                    Ext.getCmp('gridPanel').updateRow({id: viewerState.selectedRoleId}, 0);
                }
                navigationPanel.lastPressed = button;
            }
        },
        '->',
        {
            id: 'gridRefreshBtn',
            text: '#{msgs.button_refresh}',
            enableToggle: false,
            handler: function(refreshBtn, clickEventObj) {
                var navigationPanel = Ext.getCmp('roleNavPanel');
                var pressedBtn = navigationPanel.lastPressed;
                
                if (!pressedBtn) {
                    pressedBtn = Ext.getCmp('topDownTreeNav');
                }
                
                pressedBtn.toggle(false);
                pressedBtn.toggle(true);
            }
        }],
        bbar: [{
            id: 'newRoleBtn',
            text: '#{msgs.button_add}',
            handler: function() {
                $('viewerForm:roleToEdit').value = '';
                $('viewerForm:editRole').click();
            }
        }, {
            id: 'deleteRoleBtn',
            text: '#{msgs.button_delete}',
            handler: SailPoint.Role.Viewer.deleteRole
        }]
    };
    
    return navPanelWrapper;
}

SailPoint.Role.Viewer.deleteRole = function() {
    var viewerStateController = Ext.getCmp('roleViewerStateController');
    var viewerState = viewerStateController.getState();
    Ext.MessageBox.confirm(
        '#{msgs.title_confirm_delete_role}', 
        '#{msgs.role_viewer_confirm_delete_role}', 
        function(button) {
            if (button == 'yes' && viewerState.selectedRoleId !== null && viewerState.selectedRoleId != '') {
                $('viewerForm:roleToEdit').value = viewerState.selectedRoleId;
                
                // Clear the filter if the value will becom invalid as a result of this deletion
                var roleTreeFilter = Ext.getCmp('roleTreeFilter');
                if (roleTreeFilter.view && roleTreeFilter.view.getSelectedRecords()[0].getId() == $('viewerForm:roleToEdit').value)
                    roleTreeFilter.setValue('');

                $('viewerForm:deleteRole').click();
            }
        }
    );    
}

SailPoint.Role.Viewer.deleteRoleFromMenu = function(item, eventObj) {
    var nodeObjIds = item.node.getId().split(':');
    var currentNodeObjId = nodeObjIds[nodeObjIds.length - 1];
    Ext.MessageBox.confirm(
        '#{msgs.title_confirm_delete_role}', 
        '#{msgs.role_viewer_confirm_delete_role}', 
        function(button) {
            if (button == 'yes' && currentNodeObjId) {
                $('viewerForm:roleToEdit').value = currentNodeObjId;
                
                // Clear the filter if the value will becom invalid as a result of this deletion
                var roleTreeFilter = Ext.getCmp('roleTreeFilter');
                if (roleTreeFilter.view && roleTreeFilter.view.getSelectedRecords()[0].getId() == $('viewerForm:roleToEdit').value)
                    roleTreeFilter.setValue('');

                $('viewerForm:deleteRole').click();
            }
        }
    );    
}

SailPoint.Role.Viewer.getNavPanel = function(config) {
    var resetButton = {
        xtype : 'button',
        autoEl: 'span',
        handler: function() {
            var roleGridDataStore = Ext.StoreMgr.lookup('roleGridDataStore');
            var stateController = Ext.getCmp('roleViewerStateController');
            var viewerState = stateController.getState();
            var tree = Ext.getCmp('roleTreePanel');
            var roleTreeFilter;
            
            // Reset the tree
            if (viewerState.filteredNode) {
                viewerState.filteredNode = '';
                viewerState.selectedRoleId = '';
                viewerState.selectedTopDownNodeId = '';
                viewerState.selectedBottomUpNodeId = '';
                stateController.fireEvent('statechange');
                if (tree) {
                    var root = tree.getRootNode();
                    tree.getStore().load({
                        node: root
                    });
                }
            }

            roleTreeFilter = Ext.getCmp('roleTreeFilter');
            roleTreeFilter.setValue('');
            
            // Reset the grid view
            roleGridDataStore.load({
                params: {start: 0, limit: SailPoint.Role.Viewer.MAX_ROLES, roleNodeId: '', filteredNodeId: ''}
            });
            
            SailPoint.Role.RoleView.clearRoleView({prefix: ''});
            Ext.getCmp('deleteRoleBtn').disable();
        },
        cls : 'secondaryBtn',
        text: '#{msgs.button_reset}'
    };
    
    var navPanelItems = [
        SailPoint.Role.Viewer.getGridPanel({
            id: 'gridPanel',
            store: SailPoint.Role.Viewer.getRoleGridDataStore()
        })            
    ];
    
    if (!SailPoint.Role.Viewer.TREE_VIEW_DISABLED) {
        navPanelItems.unshift(SailPoint.Role.Viewer.getTreePanel());
    }
    
    var navPanel = {
        xtype : 'panel',
        id: config.id,
        layout: 'card',
        width: 400,
        minWidth: 375,
        // Changed this because it makes the filter render in a screwy manner.  Instead we
        // will apply this logic onrender
        // activeItem: viewerState.currentView == SailPoint.Role.Viewer.ViewerModes.GRID ? 1 : 0,
        activeItem: 0,
        defaults: {
            border: false
        },
        items: navPanelItems,
        tbar: [{xtype: 'sproletreefilter', id: 'roleTreeFilter', url: 'modeler/roleQueryJSON.json'}, ' ', resetButton]
    };
    
    return navPanel;
}

Ext.define('SailPoint.Role.Viewer.RoleTreeFilter', {
    extend : 'SailPoint.RoleFilter',
    alias : 'widget.sproletreefilter',
    onSelect : function(record, index) {
        if (record) {
            var stateController = Ext.getCmp('roleViewerStateController');
            var viewerState = stateController.getState();
            var tree = Ext.getCmp('roleTreePanel');
            viewerState.filteredNode = record.getId();
            viewerState.selectedRoleId = record.getId();
            viewerState.selectedTopDownNodeId = record.getId();
            viewerState.selectedBottomUpNodeId = record.getId();
            stateController.fireEvent('statechange');
            Ext.MessageBox.wait('#{msgs.loading_data}');
            
            if (viewerState.currentView == SailPoint.Role.Viewer.ViewerModes.GRID) {
                var fakeNode = {id: viewerState.selectedRoleId};
                Ext.getCmp('gridPanel').updateRow(fakeNode, 0);
                SailPoint.Role.Viewer.populateRoleView(fakeNode.id);
            } else {
                var root = tree.getRootNode();
                tree.getStore().load({
                    node: root,
                    callback: SailPoint.Role.Viewer.selectAppropriateNode
                });
            }
        }
    }
});


SailPoint.Role.Viewer.getTreePanel = function (config) {
    
    var store = Ext.create('SailPoint.PagingTreeStore', {
        storeId : 'roleTreeStore',
        url : 'modeler/roleNodeJSON.json',
        defaultRootId: 'source',
        model: 'Role',
        autoLoad: false,
        // you have to specify the root with expanded set to false 
        // otherwise the store is auto loaded
        root: {
            id: 'source',
            text: 'Root',
            expanded: false
        }
    });
    
    store.on('beforeload', function(store, operation, eOpts) {
        SailPoint.Role.Viewer.injectRoleTreeStoreLoadParams(operation.params);
    });
    
    store.on('load', function(store, node, records, success, eOpts) {
        var root = store.getRootNode();
        if (!root.isExpanded()) {
            root.expand();
        }

        if (Ext.MessageBox.isVisible()) {
            Ext.MessageBox.hide();
        }
    });
    
    var treePanel = {
        xtype : 'treepanel',
        id: 'roleTreePanel',
        width: 400,
        store: store,
        autoScroll: true,
        rootVisible: false,
        listeners : {
            select : {
                fn : function(rowModel, record, index, eOpts) {
                    if (record.isPageNode()) {
                        this.getStore().fetchPage(record);
                    } else {
                        SailPoint.Role.Viewer.updateState(record);
                        SailPoint.Role.Viewer.populateRoleView(record.getId());
                        Ext.getCmp('roleViewerStateController').fireEvent('statechange');
                    }
                }
            },
            itemcontextmenu : {
                fn : function(view, record, item, index, e, eOpts) {
                    if (!record.isPageNode()) {
                        SailPoint.Role.Viewer.displayMenu(record, e.getXY());
                        e.stopEvent();
                    }
                }
            }
        }
    };
    
    return treePanel;
}

SailPoint.Role.Viewer.injectRoleTreeStoreLoadParams = function(params) {
    var stateController = Ext.getCmp('roleViewerStateController');
    if (!stateController) {
        return;
    }

    var extraParams = {};
    var state = stateController.getState();
    
    // What perspective is being used?  topDown, bottomUp, or grid?
    if (state.currentView) {
        extraParams.mode = encodeURIComponent(state.currentView);
    }
    
    if (state.selectedRoleId) {
        extraParams.selectedRoleId = encodeURIComponent(state.selectedRoleId);
    }
    
    if (state.selectedTopDownNodeId) {
        extraParams.selectedTopDownNodeId = encodeURIComponent(state.selectedTopDownNodeId);
    }
    
    if (state.selectedBottomUpNodeId) {
        extraParams.selectedBottomUpNodeId = encodeURIComponent(state.selectedBottomUpNodeId);
    }
    
    if (state.filteredNode) {
        extraParams.filterOnNode = encodeURIComponent(state.filteredNode);
    }

    Ext.applyIf(params, extraParams);
}

Ext.define('SailPoint.Role.Viewer.NodeMenu', {
    extend : 'Ext.menu.Menu',
    node: null,
    items: [{
        id: 'addRoleOption',
        text: '#{msgs.button_add}',
        handler: function(item, eventObj) {
            var nodeObjIds = item.node.getId().split(':');
            var currentNodeObjId = nodeObjIds[nodeObjIds.length - 1];
            $('viewerForm:roleToEdit').value = '';
            $('viewerForm:roleToAddTo').value = currentNodeObjId;
            // Hack to prevent a stupid script error caused by JSF
            $('viewerForm:addToRole').onclick = function(){};
            $('viewerForm:addToRole').click();
        }
    }, {
        id: 'cloneRoleOption',
        text: '#{msgs.clone_role}',
        handler: function(item, eventObj) {
            var nodeObjIds = item.node.getId().split(':');
            var currentNodeObjId = nodeObjIds[nodeObjIds.length - 1];
            $('viewerForm:roleToEdit').value = '';
            $('viewerForm:roleToClone').value = currentNodeObjId;
            // Hack to prevent a stupid script error caused by JSF
            $('viewerForm:cloneRole').onclick = function(){};
            $('viewerForm:cloneRole').click();
        }
    }, {
        id: 'deleteRoleMenuOption',
        text: '#{msgs.button_delete}',
        handler: SailPoint.Role.Viewer.deleteRoleFromMenu
    }],
    setNode: function(currentNode) {
        this.node = currentNode;
        this.items.get(0).node = currentNode;
        this.items.get(1).node = currentNode;
        this.items.get(1).setDisabled(!currentNode.get('editable'));
        this.items.get(2).node = currentNode;
        this.items.get(2).setDisabled(!currentNode.get('editable'));
    }
});

Ext.define('Role', {
    extend: 'Ext.data.Model',
    
    fields: [
        { name: 'id', type: 'string' },
        { name: 'text', type: 'string' },
        { name: 'editable', type: 'boolean'}
    ],
    
    isPageNode: function() {
        return this.isPageUpNode() || this.isPageDownNode();
    },
    
    isPageUpNode: function() {
        return this.raw.pageNode === 'up';
    },
    
    isPageDownNode: function() {
        return this.raw.pageNode === 'down';
    },
    
    getRoleId: function() {
        var nodeId = this.getId();
        var ids;
        
        if (nodeId) {
            ids = this.getId().split(':');
            return ids[ids.length - 1];
        } else {
            return null;
        }    
    }
});


SailPoint.Role.Viewer.displayMenu = function(record, point) {
    if (record.get('editable') && $('roleViewerRight').innerHTML == 'ManageRole') {
        var menu = Ext.menu.MenuMgr.get('roleCreationMenu');
        if (!menu) {
            menu = new SailPoint.Role.Viewer.NodeMenu({id: 'roleCreationMenu'});
        }
        
        menu.setNode(record);
        menu.showAt(point);
    }
};

Ext.define('SailPoint.Role.GridPanel', {
    extend : 'Ext.grid.Panel',
    alias : 'widget.sprolegridpanel',
    selectGridRow: function(selModel, record, rowIndex, eOpts) {
        var viewerStateController = Ext.getCmp('roleViewerStateController');
        viewerStateController.getState();
        
        // Only populate if we aren't showing anything yet
        if ((record.getId() !== null && record.getId() != '') || !Ext.getCmp('roleViewContentPanel').isVisible()) {
            Ext.MessageBox.wait('#{msgs.loading_data}');
            Ext.getCmp('gridPanel').getView().focusRow(rowIndex);
            SailPoint.Role.Viewer.populateRoleView(record.getId());
            SailPoint.Role.Viewer.updateState();
            viewerStateController.fireEvent('statechange');
        }
    },
    
    getRoleParams: function() {
        var viewerState = Ext.getCmp('roleViewerStateController').getState();
        var selectedRoleId = viewerState.selectedRoleId;
        var filteredNodeId = viewerState.filteredNode;
        return { roleNodeId: selectedRoleId, filteredNodeId: viewerState.filteredNode };
    },

    updateRow: function(node) {
        if (node && node.id) {
            var roleGridDataStore = Ext.StoreMgr.lookup('roleGridDataStore');
            
            var sortState = { field: 'name', direction: 'ASC' };
            if (roleGridDataStore.sorters.length > 0) {
                sortState = roleGridDataStore.sorters.first();
            }
            
            var nodeObjIds = node.id.split(':');
            var roleId = nodeObjIds[nodeObjIds.length - 1];
            var viewerState = Ext.getCmp('roleViewerStateController').getState();

            Ext.Ajax.request({
                url: 'modeler/gridRowJSON.json',
                success: this.gotoRow,
                failure: SailPoint.Role.Viewer.populateFailed,
                params: { 
                    roleNodeId: roleId,
                    filteredNodeId: viewerState.filteredNode,
                    sort: sortState.property,
                    dir: sortState.direction,
                    limit: SailPoint.Role.Viewer.MAX_ROLES
                },
                scope: Ext.getCmp('roleViewPanel')
            });
        } else {
            // No request needs to be made, so we just mock up a fake response
            var fakeResponse = {responseText: JSON.stringify({start: 0, limit: SailPoint.Role.Viewer.MAX_ROLES, roleNodeId: ''})};
            this.gotoRow(fakeResponse);
        }
    },

    gotoRow: function(response, options) {
        var results = JSON.parse(response.responseText);

        var roleGridDataStore = Ext.StoreMgr.lookup('roleGridDataStore');
        var viewerState = Ext.getCmp('roleViewerStateController').getState();
        var loadParams = {start: results.start, limit: SailPoint.Role.Viewer.MAX_ROLES, roleNodeId: results.roleNodeId, filteredNodeId: viewerState.filteredNode};
        roleGridDataStore.load({
            params: loadParams, 
            callback: SailPoint.Role.Viewer.findRecordInStore
        });
    }

    
});

SailPoint.Role.Viewer.getRoleGridDataStore = function() {
    var roleGridDataStore = Ext.StoreMgr.lookup('roleGridDataStore');
    
    if (!roleGridDataStore) {
        roleGridDataStore = SailPoint.Store.createNamedStore('SailPoint.data.ExtendedStore', {
            storeId: 'roleGridDataStore',
            fields : ['id', 'description', 'name', 'roleType', 'displayableName'],
            url: 'modeler/roleQueryJSON.json',
            gridInfoUrl: 'modeler/gridRowJSON.json',
            root: 'roles',
            totalProperty: 'numRoleResults',
            remoteSort: true,
            pageSize : SailPoint.Role.Viewer.MAX_ROLES,
            sorters: [{
                property: 'name',
                direction: 'ASC'
            }],
            simpleSortMode : true,
            afterSort: SailPoint.Role.Viewer.findRecordInStore
        });
    }
    
    return roleGridDataStore;
}

SailPoint.Role.Viewer.getGridPanel = function (config) {
    
    var gridPanel = {
        xtype : 'sprolegridpanel',
        id: config.id,
        store: config.store,
        columns: [{
            header: '#{msgs.name}', flex: 2, sortable: true, dataIndex:'displayableName', renderer: Ext.util.Format.htmlEncode
        }, {
            header: '#{msgs.type}', flex: 1, sortable: true, dataIndex: 'roleType'
        }],
        viewConfig: {autoFill: false, emptyText: '#{msgs.role_viewer_roles_unavailable}'},
        selModel: {
            xtype : 'rowmodel',
            mode : 'single',
            listeners : {
                select : {
                    fn : function(selModel, record, rowIndex, eOpts) {
                        Ext.getCmp(config.id).selectGridRow(selModel, record, rowIndex, eOpts);
                    }
                }
            }
        },
        width: 400,
        bbar: new SailPoint.ExtendedPagingToolbar({
            store: config.store,
            displayInfo: false,
            paramBuilder: SailPoint.Role.GridPanel.getRoleParams
        })
    };

    return gridPanel;
}

SailPoint.Role.Viewer.selectAppropriateNode = function (loader, loadedNode, response) {
    var treePanel = Ext.getCmp('roleTreePanel');
    var root = treePanel.getRootNode();
    var state = Ext.getCmp('roleViewerStateController').getState();
    var currentView = state.currentView;
    var selectedNodeId;
    
    treePanel.getSelectionModel().clearSelections();
    
    if (currentView == SailPoint.Role.Viewer.ViewerModes.TOP_DOWN) {
        selectedNodeId = state.selectedTopDownNodeId;
    } else if (currentView == SailPoint.Role.Viewer.ViewerModes.BOTTOM_UP) {
        selectedNodeId = state.selectedBottomUpNodeId;
    }
    
    // hack to work with the new ext 4 node selectPath method... build up ids by 
    // concatenating all previous ids
    if (selectedNodeId) {
        var ids = selectedNodeId.split(':');
        var pathIds = [];
        
        for (var i = 0; i < ids.length; ++i) {
            var subIds = [];
            for (var j = 0; j <= i; ++j) {
                subIds.push(ids[j]);
            }
            
            pathIds.push(subIds.join(':'));
        }
        
        // build the path to select
        var pathSeparator = '/';
        var path = Ext.util.Format.format('{0}{1}{0}{2}', pathSeparator, root.getId(), pathIds.join(pathSeparator));
        
        treePanel.selectPath(path, root.idProperty, pathSeparator, function(success, lastNode) {
            // if we cannot select the path immediately, then walk the nodes looking for it... this 
            // should only happen when we have selected a node to filter on from the combobox
            if (!success) {
                var walkFunc = function(node, idToFind) {
                    if (node.getRoleId() === idToFind) {
                        return node;
                    }
                    
                    var needle = null;
                    for (var i = 0; i < node.childNodes.length; ++i) {
                        var needle = walkFunc(node.childNodes[i], idToFind);
                        if (needle) {
                            break;
                        }
                    }
                    
                    return needle;
                };
                
                var nodeToSelect = walkFunc(root, selectedNodeId);
                if (nodeToSelect) {
                    treePanel.getSelectionModel().select(nodeToSelect);
                    SailPoint.Role.Viewer.updateState();
                }
            }
        });
    }
    
    if (!(selectedNodeId && selectedNodeId.length > 0) || Ext.getCmp('dataSectionPanel').isVisible()) {
        Ext.MessageBox.hide();
    }
}

SailPoint.Role.Viewer.huntForTheSelectedNode = function(node, selectedNodeId) {
    var keepHunting = true;
    var children;
    var treePanel = Ext.getCmp('roleTreePanel');
    
    if (node.getId().indexOf(selectedNodeId) !== -1) {
        var selModel = treePanel.getSelectionModel();
    
        selModel.deselectAll();
        selModel.select(node);
    
        SailPoint.Role.Viewer.populateRoleView(node.getId());
        SailPoint.Role.Viewer.updateState();
        
        keepHunting = false;
    } else {
        if (node.isExpanded()) {
            children = node.childNodes;
            for (var i = 0; i < children.length && keepHunting; ++i) {
                keepHunting = SailPoint.Role.Viewer.huntForTheSelectedNode(children[i], selectedNodeId);
            }
        }
    }
    
    return keepHunting;
}

SailPoint.Role.Viewer.getRoleViewerInformationPanel = function (config) {
    return {
        xtype : 'panel',
        id: config.id,
        title: config.title,
        contentEl: 'roleViewerInformationDiv',
        header: true,
        headerAsText: true,
        region: 'center',
        autoScroll: true,
        layout: 'fit',
        loader: {
            url: SailPoint.getRelativeUrl('/define/roles/modeler/roleViewer.jsf'),
            renderer: function(loader, response, active) {
                Ext.get('roleViewerInformationDiv').setHTML(response.responseText);
            },
            callback: SailPoint.Role.Viewer.initRoleViewerState,
            discardUrl: false,
            nocache: false,
            text: '#{msgs.loading_data}',
            timeout: 30,
            scripts: false // Note: Scripts should be called from the finishLoading callback
        }
    };
};

/**
 * This function kicks off a length series of events that culminates in an initialized role viewer.
 * For the benefit of future developers, here's what will happen:
 * <ol>
 *   <li>
 *     The SailPoint.state.StateProvider and SailPoint.Role.Viewer.RoleViewerStateController objects
 *     are created and rendered.
 *   </li>
 *   <li>
 *     Once the state has initialized, the role typedef store is created and initialized.
 *   </li>
 *   <li>
 *     After the typedef store is initialized the viewer can finally be initialized.
 *   </li>
 * </ol>
 */
SailPoint.Role.Viewer.initRoleViewerState = function() {
    Ext.state.Manager.setProvider(new SailPoint.state.StateProvider({
        stateIds: ['roleViewerState'],
        states: [Ext.String.trim(Ext.fly('hiddenStateDiv').getHTML())],
        stateProviderUrl: SailPoint.getRelativeUrl('/extjsSessionState.json')
    }));
    
    var stateController = new SailPoint.Role.Viewer.RoleViewerStateController({ id: 'roleViewerStateController' });
    SailPoint.Role.Viewer.initTypeDefStore.apply(Ext.getCmp('roleViewerPanel'));
};

SailPoint.Role.Viewer.initTypeDefStore = function() {
    var typeDefStore = new SailPoint.modeler.RoleTypeDefinitionStore({id: 'roleTypeDefinitionStore'});
    typeDefStore.load({callback: SailPoint.Role.Viewer.initViewer}); 
};

SailPoint.Role.Viewer.initViewer = function () {
    // Note that the state and type definition stores have to be loaded before we can go -- 
    // that's why this function is called in the handler for the state's 'onrender' event
    var viewerStateController = Ext.getCmp('roleViewerStateController');
    var viewerState = viewerStateController.getState();
    if (viewerState && SailPoint.Role.Viewer.TREE_VIEW_DISABLED) {
        viewerState.currentView = SailPoint.Role.Viewer.ViewerModes.GRID;
    }
    SailPoint.Role.Viewer.initViewerPanel();
    SailPoint.Role.Viewer.initNavPanel();
    
    // Fix the stupid onclick because JSF generates erroneous code
    $('viewerForm:editRole').onclick = function () {
        var curForm = document.forms['viewerForm'];
    }
}

SailPoint.Role.Viewer.updateState = function (node) {
    var state = Ext.getCmp('roleViewerStateController').getState();
    var treePanel = Ext.getCmp('roleTreePanel');
    var selectedNode;
    var roleIds;
    var roleForBottomUpNode;
    var roleForTopDownNode;
    var currentViewerMode;
    var gridPanel;

    if (node) {
        selectedNode = node;
    } else if (treePanel) {
        var selection = treePanel.getSelectionModel().getSelection();
        if (selection.length > 0) {
            selectedNode = selection[0];
        }
    }
    
    if (state.currentView == SailPoint.Role.Viewer.ViewerModes.GRID) {
        gridPanel = Ext.getCmp('gridPanel');
        var selection = gridPanel.getSelectionModel().getSelection();
        var selectedRole = selection.length > 0 ? selection[0] : null;
        if (selectedRole) {
            state.selectedRoleId = selectedRole.getId();

            if (!state.selectedBottomUpNodeId || state.selectedBottomUpNodeId.indexOf(state.selectedRoleId) === -1)
                state.selectedBottomUpNodeId = state.selectedRoleId;
    
            if (!state.selectedTopDownNodeId || state.selectedTopDownNodeId.indexOf(state.selectedRoleId) === -1)
                state.selectedTopDownNodeId = state.selectedRoleId;
            
            // Hack to fix the lastOptions on the grid when something new is selected
            //gridPanel.getStore().lastOptions.params.roleNodeId = selectedRole.getId();
        }
    } else if (selectedNode) {
        if (state.currentView == SailPoint.Role.Viewer.ViewerModes.TOP_DOWN) {
            state.selectedTopDownNodeId = selectedNode.getId();
            state.selectedRoleId = selectedNode.getRoleId();
            
            // If the ID is no longer consistent with the other view's 
            // selected node, then that node is now obsolete, so just set
            // it to the selected role and let it fix itself
            if (state.selectedBottomUpNodeId) {
                roleIds = state.selectedBottomUpNodeId.split(':');
                roleForBottomUpNode = roleIds[roleIds.length - 1];
                
                if (roleForBottomUpNode != state.selectedRoleId) {
                    state.selectedBottomUpNodeId = state.selectedRoleId;
                }
            } else {
                state.selectedBottomUpNodeId = state.selectedRoleId;
            }
        } else if (state.currentView == SailPoint.Role.Viewer.ViewerModes.BOTTOM_UP) {
            state.selectedBottomUpNodeId = selectedNode.getId();
            state.selectedRoleId = selectedNode.getRoleId();

            // If the ID is no longer consistent with the other view's 
            // selected node, then that node is now obsolete, so just set
            // it to the selected role and hope
            if (state.selectedTopDownNodeId) {
                roleIds = state.selectedTopDownNodeId.split(':');
                roleForTopDownNode = roleIds[roleIds.length - 1];
                
                if (roleForTopDownNode != state.selectedRoleId) {
                    state.selectedTopDownNodeId = state.selectedRoleId;
                }
            } else {
                state.selectedTopDownNodeId = state.selectedRoleId;
            }
        }
    }
    
    // Wait until the end to update the view so that we can accurately update the selection info 
    state.currentView = Ext.getCmp('topDownTreeNav').pressed ? SailPoint.Role.Viewer.ViewerModes.TOP_DOWN :
                        Ext.getCmp('bottomUpTreeNav').pressed ? SailPoint.Role.Viewer.ViewerModes.BOTTOM_UP :
                        Ext.getCmp('gridNav').pressed ? SailPoint.Role.Viewer.ViewerModes.GRID :
                        SailPoint.Role.Viewer.ViewerModes.TOP_DOWN;
}

SailPoint.Role.Viewer.populateRoleView = function (nodeId) {
    var nodeObjIds = nodeId.split(':');
    var currentNodeObjId = nodeObjIds[nodeObjIds.length - 1];
    var viewerState = Ext.getCmp('roleViewerStateController').getState();
    viewerState.selectedRoleId = currentNodeObjId;

    Ext.Ajax.request({
        url: 'modeler/roleJSON.json',
        success: SailPoint.Role.Viewer.performPopulate,
        failure: SailPoint.Role.Viewer.populateFailed,
        params: {roleNodeId: nodeId},
        scope: Ext.getCmp('roleViewPanel')
    });
  
    return true;
}

SailPoint.Role.Viewer.findRecordInStore = function (recordArray, lastOptions, success) {
    var matchingIndex;
    var matchingRecord;
    var roleGridDataStore = Ext.StoreMgr.lookup('roleGridDataStore');
    var roleToFind;
    
    if (lastOptions && lastOptions.params && lastOptions.params.roleNodeId) {
        var nodeObjIds = lastOptions.params.roleNodeId.split(':');
        roleToFind = nodeObjIds[nodeObjIds.length - 1];
    }
    
    var currentStart = lastOptions.params.start;
    var totalCount = roleGridDataStore.getTotalCount();
    var treePanel = Ext.getCmp('roleTreePanel');
    var selectedNode;
    var gridPanel = Ext.getCmp('gridPanel');
    var gridRowSelection = gridPanel.getSelectionModel();

    if (success) {
        if (roleToFind)
            matchingRecord = roleGridDataStore.getById(roleToFind);
        
        if (matchingRecord) {
            gridRowSelection.select(matchingRecord);
            if (Ext.getCmp('dataSectionPanel').isVisible())
                Ext.MessageBox.hide();
        } else {
            // Otherwise nothing was selected and our work is done
            Ext.MessageBox.hide();
        }
    }
}

SailPoint.Role.Viewer.initNavPanel = function() {
    var navPanel = Ext.getCmp('roleNavPanel');

    navPanel.canEditRole = $('roleViewerRight').innerHTML == 'ManageRole';

    if (navPanel.canEditRole) {
        Ext.getCmp('newRoleBtn').enable();
        Ext.getCmp('roleEditOptions').enable();
        Ext.getCmp('deleteRoleBtn').disable();
    } else {
        Ext.getCmp('newRoleBtn').disable();
        Ext.getCmp('roleEditOptions').disable();
        Ext.getCmp('deleteRoleBtn').disable();
    }

    // Add some functionality to the panel that was unavailable prior to page load
    navPanel.resetRoleEdit = function() {
        Ext.getCmp('roleEditOptions').disable();
        Ext.getCmp('deleteRoleBtn').disable();
        
        if (this.canEditRole) {
            Ext.getCmp('newRoleBtn').enable();
        } else {
            Ext.getCmp('newRoleBtn').disable();
        }
    }
    
    navPanel.enableRoleEdit = function() {
        if (this.canEditRole) {
            Ext.getCmp('newRoleBtn').enable();
            Ext.getCmp('roleEditOptions').enable();
            Ext.getCmp('deleteRoleBtn').enable();
        } else {
            Ext.getCmp('newRoleBtn').disable();
            Ext.getCmp('roleEditOptions').disable();
            Ext.getCmp('deleteRoleBtn').disable();
        }
    }
    
    var stateController = Ext.getCmp('roleViewerStateController');
    var viewerState = null;
    
    if (stateController)
        viewerState = stateController.getState();

    if (!viewerState) {
        return;
    } else if (viewerState.currentView == SailPoint.Role.Viewer.ViewerModes.BOTTOM_UP) {
        Ext.getCmp('bottomUpTreeNav').toggle(true);
    } else if (viewerState.currentView == SailPoint.Role.Viewer.ViewerModes.GRID) {
        Ext.getCmp('gridNav').toggle(true);
    } else if (!viewerState.currentView || viewerState.currentView == SailPoint.Role.Viewer.ViewerModes.TOP_DOWN) {
        Ext.getCmp('topDownTreeNav').toggle(true);
    } else {
        // added this default case because IE sometimes likes to add spaces to the end of viewerState.currentView`
        Ext.getCmp('topDownTreeNav').toggle(true);
    }
    
    if (viewerState && viewerState.filteredNode) {
        Ext.Ajax.request({
            url: 'modeler/roleJSON.json',
            success: SailPoint.Role.Viewer.initTreeFilter,
            failure: SailPoint.Role.Viewer.populateFailed,
            params: {roleNodeId: viewerState.filteredNode},
            scope: Ext.getCmp('roleViewPanel')
        });
    }
}

SailPoint.Role.Viewer.initViewerPanel = function() {
    var roleViewContentPanel = SailPoint.Role.RoleView.getRoleViewContentPanel({
        prefix: '',
        isMainView: true,
        roleReferenceParamBuilder: SailPoint.Role.Viewer.getCurrentRoleId
    });
    
    Ext.getCmp('roleViewPanel').add(roleViewContentPanel);
    roleViewContentPanel.hide();
}

SailPoint.Role.Viewer.initTreeFilter = function(response, options) {
    try {
        var roleTreeFilter = Ext.getCmp('roleTreeFilter');    
        var results = JSON.parse(response.responseText);
        roleTreeFilter.setValue(results['roleName']);
    } catch(e) {
        alert('Exception: ' + e);
        this.callParent(arguments);
    }
}

SailPoint.Role.Viewer.performPopulate = function(response, options) {
    try {
        var results = JSON.parse(response.responseText);
        var mainViewConfig = {
            prefix: '',
            results: results,
            showVersionGrid: true
        };

        SailPoint.Role.RoleView.populate(mainViewConfig);

        // Do stuff specific to the main view separately
        if (results.roleName) {
            Ext.getCmp('roleNavPanel').enableRoleEdit();
        }

        // if this role is editable by the user, update the
        // 'Edit Role' and 'Delete' buttons
        Ext.getCmp('roleEditOptions').setDisabled(!results.editable);
        Ext.getCmp('deleteRoleBtn').setDisabled(!results.editable);

    } catch(e) {
        SailPoint.FATAL_ERR_JAVASCRIPT('Exception in Role.Viewer.performPopulate', e);
        Ext.MessageBox.hide();
    }
    
    // Fix the height because sometimes it gets messed up 
    Ext.getCmp('roleViewPanel').setHeight(Ext.getCmp('roleViewerPanel').body.getHeight(true));
    Ext.getCmp('roleViewContentPanel').setHeight(Ext.getCmp('roleViewPanel').body.getHeight(true));
    Ext.MessageBox.hide();
}

SailPoint.Role.Viewer.populateFailed = function(response, options) {
    Ext.MessageBox.hide();
}

SailPoint.Role.Viewer.getCurrentRoleId = function() {
    var viewerState = Ext.getCmp('roleViewerStateController').getState();
    var selectedRoleId = viewerState.selectedRoleId;
    return { roleId: selectedRoleId };
}

SailPoint.Role.forceSelection = function(selModel, record, rowIndex, eOpts) {
    if (record) {
        selModel.clearSelections();
        var roleTreeFilter = Ext.getCmp('roleTreeFilter');
        roleTreeFilter.setValue('');
        var stateController = Ext.getCmp('roleViewerStateController');
        var viewerState = stateController.getState();
        var tree = Ext.getCmp('roleTreePanel');
        var root = tree.getRootNode();
        viewerState.filteredNode = '';
        viewerState.selectedRoleId = record.getId();
        viewerState.selectedTopDownNodeId = record.getId();
        viewerState.selectedBottomUpNodeId = record.getId();
        roleToNodeMap = $H([]);
        stateController.fireEvent('statechange');
        Ext.MessageBox.wait('#{msgs.loading_data}');
        
        if (viewerState.currentView == SailPoint.Role.Viewer.ViewerModes.GRID) {
            var fakeNode = {id: viewerState.selectedRoleId};
            SailPoint.Role.Viewer.updateGridRow(fakeNode, 0);
            SailPoint.Role.Viewer.populateRoleView(fakeNode.id);
        } else {
            tree.getStore().load({
                node: root,
                callback: SailPoint.Role.Viewer.selectAppropriateNode
            });
        }
    }
}

SailPoint.Role.Viewer.showDeletionResults = function() {
    var deleteSucceeded = Ext.DomQuery.select('li[class=formError]', $('viewerMsgs')).length === 0;
    
    if (deleteSucceeded) {
        var stateController = Ext.getCmp('roleViewerStateController');
        var viewerState = stateController.getState();
        var viewerPanel = Ext.getCmp('roleViewerPanel');
        
        viewerState.selectedRoleId = '';
        viewerState.selectedBottomUpNodeId = '';
        viewerState.selectedTopDownNodeId = '';
        stateController.fireEvent('statechange');
        Ext.getCmp('roleTreePanel').getStore().load({callback: Ext.emptyFn}); 
        Ext.StoreMgr.lookup('roleGridDataStore').load({callback: Ext.emptyFn}); 
        SailPoint.Role.RoleView.clearRoleView({prefix: ''});
        // Attach the message to this tab panel and then clear it from the view.
        // This ensures that the message is displayed in the appropriate tab
        SailPoint.TabPanel.applyMessage(viewerPanel, $('spErrorMsgsDiv'));
    }
    
    Ext.MessageBox.show({
        title: '#{msgs.title_role_deletion}', 
        msg: $('viewerMsgs').innerHTML,
        closable: false,
        buttons: Ext.MessageBox.OK,
        width: Ext.get('roleViewDiv').getWidth()
    });
}

SailPoint.Role.Viewer.updateGridRow = function(node) {
    if (node && node.id) {
        var roleGridDataStore = Ext.StoreMgr.lookup('roleGridDataStore');
        var sortState = roleGridDataStore.sorters.first();
        var nodeObjIds = node.id.split(':');
        var roleId = nodeObjIds[nodeObjIds.length - 1];
        var viewerState = Ext.getCmp('roleViewerStateController').getState();

        Ext.Ajax.request({
            url: 'modeler/gridRowJSON.json',
            method: 'GET',
            success: SailPoint.Role.Viewer.gotoGridRow,
            failure: SailPoint.Role.Viewer.populateFailed,
            params: { 
                roleNodeId: roleId,
                filteredNodeId: viewerState.filteredNode,
                sort: sortState ? sortState.property : 'name',
                dir: sortState ? sortState.direction : 'ASC',
                limit: SailPoint.Role.Viewer.MAX_ROLES
            },
            scope: Ext.getCmp('roleViewWindow')
        });
    } else {
        // No request needs to be made, so we just mock up a fake response
        var fakeResponse = {responseText: '{start: 0, limit: ' + SailPoint.Role.MAX_ROLES + ', roleNodeId: \'\'}'};
        SailPoint.Role.Viewer.gotoGridRow(fakeResponse);
    }
}

SailPoint.Role.Viewer.gotoGridRow = function(response, options) {
    var results = JSON.parse(response.responseText);

    var roleGridDataStore = Ext.StoreMgr.lookup('roleGridDataStore');
    var viewerState = Ext.getCmp('roleViewerStateController').getState();
    var loadParams = {start: results.start, limit: SailPoint.Role.MAX_ROLES, roleNodeId: results.roleNodeId, filteredNodeId: viewerState.filteredNode};
    roleGridDataStore.load({
        params: loadParams, 
        callback: SailPoint.Role.Viewer.findRecordInStore
    });
};
