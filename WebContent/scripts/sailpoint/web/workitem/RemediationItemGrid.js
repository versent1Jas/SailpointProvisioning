/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.workitem', 'SailPoint.workitem.RemediationItemGrid');
              
/**
 * Create remediation items grid. 
 *
 * @param targetElement ID of the dom element where grid should be rendered
 * @param gridStateId Grid's state id
 * @param selectCountElem Dom element where the count of selected items should be displayed
 * @param workItemId Work Item ID
 * @param entityType Type of entity, any but "AccountGroupPermission" is assumed to be an identity
 * @param itemCount Total number of remediation items attached to the workitem. This determines whether
 *  or not we dislay checkboxs on the left column of grid.
 * @param workItemEditable Is the work item editable by the current user?
 * @param ownerId ID of the owner of the workitem. This is only needed if owner is a workgroup and is
 *  used to populate the assignment suggest component.
 * @param isOwnedByWorkgroup true if workitem is owner by a workgroup. If false, assignment column
 * and suggest will not be visible
 */
SailPoint.workitem.RemediationItemGrid.render = function(targetElement, gridStateId, workItemId,
                                                     entityType, itemCount, workItemEditable, ownerId,
                                                     isOwnedByWorkgroup) {

    var gridWidth = Ext.get(targetElement).getWidth() - 14;
    var sortField = "Identity.name";
    var fields = ['id', 'name', 'firstname', 'lastname', 'application', 'account', 'completionDate', 'entitlements', 'assignee' ];
    if (entityType === 'AccountGroupPermission') {
        sortField = null;
        fields = ['id', 'entitlements', 'completionDate' ];
    }

    var dsUrl = SailPoint.getRelativeUrl('/workitem/remediationItemsDataSource.json?' +
             'workItemId=' + workItemId+ '&entityType=' + entityType);

    var workItemsStore = SailPoint.Store.createStore({
        fields: fields,
        autoLoad: false,
        url: dsUrl,
        root: 'workItems',
        simpleSortMode : true,
        sorters: [{property: sortField, direction: 'ASC'}],
        remoteSort: true
    });

    // Only show the "Mark Remediations Complete" button if there are multiple
    // remediations.  Otherwise, these are just marked complete when completing
    // the item.
    var showRemediationCompleteBtn = (itemCount > 1) && workItemEditable;

    // Only show the "Reassign" button if this is owned by a work group.
    var showReassignBtn = isOwnedByWorkgroup && workItemEditable;

    // Only show checkboxes if we're allowing marking complete or reassiging.
    var showCheckboxes = showRemediationCompleteBtn || showReassignBtn;

    var selModel = showCheckboxes ? new SailPoint.grid.CheckboxSelectionModel({})
                                  : new Ext.selection.RowModel({});

    var gridConf = {
        id: 'workItemsGrid',
        stateId: gridStateId,
        stateful: true,
        store: workItemsStore,
        cls: 'wrappingGrid',
        selModel: selModel,
        columns: SailPoint.workitem.RemediationItemGrid.getColumns(isOwnedByWorkgroup, entityType, gridWidth),
        viewConfig: {stripeRows: true},
        hidebbar: itemCount < 2,
        workItemEditable: workItemEditable,
        workItemId: workItemId
    };

    // This wrapping panel gives us a place to stick to bottom bar which
    // includes the action buttons
    var wrappingPanelConf = {
        width: gridWidth,
        renderTo: targetElement
    };
    
    // Create either a checkbox grid or normal paging grid.
    var workItemsGrid = null;
    if (showCheckboxes){

        workItemsGrid = new SailPoint.grid.PagingCheckboxGrid(gridConf);

        var markRemediationsCompleteBtn = ' ';
        if (showRemediationCompleteBtn) {
            markRemediationsCompleteBtn = {
                xtype: 'button',
                text:'#{msgs.button_mark_remeds_complete}',
                cls: 'secondaryBtn',
                handler: function(){
                    if (!workItemsGrid.hasSelection()) {
                        SailPoint.workitem.RemediationItemGrid.alertNoItemsSelected();
                    }
                    else {
                        SailPoint.workitem.RemediationItemGrid.bulkCompleteRemediations();
                    }
                }
            };
        }

        var reassignBtn = ' ';
        if (showReassignBtn) {
            reassignBtn = {
                xtype: 'button',
                text: '#{msgs.remed_item_grid_option_assign}',
                cls: 'secondaryBtn',
                handler: function(){
                    if (!workItemsGrid.hasSelection()){
                        SailPoint.workitem.RemediationItemGrid.alertNoItemsSelected();
                        return;
                    }
                    SailPoint.workitem.showAssignmentMenu(SailPoint.workitem.TYPE_REMED_ITEM,
                            'remediationItemAssigneeSuggest', workItemsGrid, workItemId,
                            workItemsGrid.getFormParams(), ownerId);
                }
            };
        }

        wrappingPanelConf.dockedItems = [{
            xtype: 'toolbar',
            dock: 'bottom',
            id: 'remediationItemsActionToolbar',
            items: [
                markRemediationsCompleteBtn,
                {xtype: 'tbtext', text: ' '},
                reassignBtn,
                '->', 
                {xtype: 'tbtext', text: ' ', id: 'selectMessageBoxId'} // the '{0} Items Selected' will go in this elem
            ]
        }];
    } else {
        workItemsGrid = new SailPoint.grid.PagingGrid(gridConf);
    }

    workItemsGrid.addListener('itemclick', SailPoint.workitem.RemediationItemGrid.clickRow);
    workItemsGrid.addListener('itemcontextmenu', SailPoint.workitem.RemediationItemGrid.showContextMenu);

    wrappingPanelConf.items = [workItemsGrid];
    var wrappingPanel = Ext.create('Ext.Panel', wrappingPanelConf);

    // setting the renderTo in the config ends up with a double render
    // if you have to convert to a checkbox grid ;)
    
    workItemsStore.loadPage(1);

    // Point the selection model at the last item in the toolbar.
    // The innerHtml of this element will be updated with the
    // '{0} Items Selected' text when checkboxes are clicked.
    var bottomToolbar = wrappingPanel.getBottomToolbar();
    var selectMessageBox = Ext.getCmp('selectMessageBoxId');
    if (bottomToolbar && selectMessageBox) {
        selModel.selectMessageBox = selectMessageBox.getEl();
        selModel.selectMessageBoxChanged = function() {
            //We want to only update layout of toolbar, so use isRoot option
            bottomToolbar.updateLayout({isRoot:true});
        };
    }

    return workItemsGrid;
};

SailPoint.workitem.RemediationItemGrid.renderEntitlements = function(value) {
  return Ext.util.Format.htmlDecode(value);
};

/**
 * Creates column model based on whether or not the remediation items are editable,
 * and what type of entity is being remediated.
 * @param showCheckboxes True if grid checkboxes should be displayed
 * @param isOwnedByWorkgroup true if workitem is owner by a workgroup. If false, the assignee
 *  column will not display.
 * @param entityType "Identity" or "AccountGroupPermission"
 * @param gridWidth Width of the grid
 */
SailPoint.workitem.RemediationItemGrid.getColumns = function(isOwnedByWorkgroup, entityType, gridWidth) {
    var cols;
    if ("AccountGroupPermission" === entityType) {
        cols = [
            {
                header: '#{msgs.entitlements}',
                dataIndex: 'entitlements',
                flex : 2,
                sortable: false, //cannot sort since it part of provisioning plan
                hideable: true
            },
            {
                header: '#{msgs.completed}',
                dataIndex: 'completionDate',
                flex : 1,
                sortable: true,
                hideable: true
            }
        ];
    } else {
        cols = [
            {
                header: '#{msgs.name}',
                dataIndex: 'name',
                sortable: true,
                hideable: true
            },
            {
                header: '#{msgs.first_name}',
                dataIndex: 'firstname',
                sortable: true,
                hideable: true
            },
            {
                header: '#{msgs.last_name}',
                dataIndex: 'lastname',
                sortable: true,
                hideable: true
            },
            {
                header: '#{msgs.application}',
                dataIndex: 'application',
                sortable: false, //cannot sort since it part of provisioning plan
                hideable: true
            },
            {
                header: '#{msgs.label_account}',
                dataIndex: 'account',
                sortable: false, //cannot sort since it part of provisioning plan
                hideable: true
            },
            {
                header: '#{msgs.completed}',
                dataIndex: 'completionDate',
                sortable: true,
                hideable: true
            },
            {
                header: '#{msgs.entitlements}',
                dataIndex: 'entitlements',
                sortable: false, //cannot sort since it part of provisioning plan
                hideable: true,
                renderer: SailPoint.workitem.RemediationItemGrid.renderEntitlements
             },{
                header: '#{msgs.remed_item_grid_hdr_assignee}',
                dataIndex: 'assignee',
                sortable: true,
                hideable: true,
                hidden: !isOwnedByWorkgroup
             }
        ];
    }

    return cols;
};

/**
 * Right-click event handler function.
 * @param grid
 * @param rowIndex
 * @param e
 */
SailPoint.workitem.RemediationItemGrid.showContextMenu = function(gridView, record, HTMLitem, index, e, eOpts) {
    var id = record.getId();
    var name = record.get('name');
    var completed = record.get('completionDate') != "N/A";
    var grid = gridView.panel;

    var contextMenu = new Ext.menu.Menu();
    contextMenu.add(new Ext.menu.Item({
            text: '#{msgs.menu_view}',
            handler: SailPoint.workitem.RemediationItemGrid.viewHandler,
            iconCls: 'viewDetailsBtn',
            scope:{itemId:id, workItemEditable:grid.workItemEditable}
        })
    );

    if (grid.workItemEditable && !completed) {
        contextMenu.add(new Ext.menu.Item({
                text: '#{msgs.menu_complete}',
                handler: SailPoint.workitem.RemediationItemGrid.completeRemediationItem,
                iconCls: 'editBtn',
                scope:{itemId:id}
            })
        );
    }

    e.stopEvent();
    contextMenu.showAt(e.xy);
};

SailPoint.workitem.RemediationItemGrid.clickRow = function(gridView, record, HTMLitem, index, e, eOpts) {
    var colName = gridView.getHeaderCt().getHeaderAtIndex(gridView.clickedColumn).dataIndex;
    if (colName) {
        var completed = record.get("completionDate") != "N/A";
        SailPoint.workitem.RemediationItemGrid.viewItem(record.getId(), gridView.panel.workItemEditable, completed);
    } else {
        // if a checkbox was clicked
        e.stopEvent();
    }
};


SailPoint.workitem.RemediationItemGrid.viewItem = function(editId, itemEditable, isComplete) {
    // this is picked up a4jViewRemediationItemBtn.
    // todo refactor this so we skip the jsf step and post a json request.
    // and so we don't have to use a global
    SELECTED_ID = editId;
    IS_COMPLETE = isComplete;
    $('editForm:a4jViewRemediationItemBtn').click();
};

SailPoint.workitem.RemediationItemGrid.viewHandler = function() {
    SailPoint.workitem.RemediationItemGrid.viewItem(this.itemId, this.workItemEditable);
};

SailPoint.workitem.RemediationItemGrid.completeRemediationItem = function() {
    addRemediationItemComment(this.itemId, 'editForm:completeRemediationItemBtn',
            '#{msgs.button_complete}', '#{msgs.dialog_title_complete_remed}');
};

SailPoint.workitem.RemediationItemGrid.bulkCompleteRemediations = function() {
    // Click the a4j button to save the work item page in the
    // navigation history before popping up the comments window.
    $('editForm:a4jBulkRemediateItemsBtn').click();
};

/**
 * Simple popup alert if the user clicks one of the action buttons w/out picking an item
 */
SailPoint.workitem.RemediationItemGrid.alertNoItemsSelected = function(){
    Ext.MessageBox.alert('#{msgs.err_dialog_title}', '#{msgs.err_at_least_one_remed_required}');
};
