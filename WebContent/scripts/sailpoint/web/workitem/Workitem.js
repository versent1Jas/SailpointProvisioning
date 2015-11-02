/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Shared workitem functions.
 */

Ext.ns('SailPoint', 'SailPoint.workitem', 'SailPoint.workitem.ApprovalItemGrid');

/**
 * Type of work item being assigned when calling SailPoint.workitem.showAssignmentMenu.
 */
SailPoint.workitem.TYPE_WITEM = "workitem";
SailPoint.workitem.TYPE_REMED_ITEM = "remedItem"

/**
 * URLs used when assigning different types of work items. Types
 * are defined by the SailPoint.workitem.TYPE_* constants.
 */
SailPoint.workitem.URL_ASSIGN_WITEM = SailPoint.getRelativeUrl('/workitem/assignWorkItem.json');
SailPoint.workitem.URL_ASSIGN_REMED_ITEM = SailPoint.getRelativeUrl('/workitem/assignRemediationItems.json')

SailPoint.workitem.ASSIGN_URLS = {};
SailPoint.workitem.ASSIGN_URLS[SailPoint.workitem.TYPE_WITEM] = SailPoint.workitem.URL_ASSIGN_WITEM;
SailPoint.workitem.ASSIGN_URLS[SailPoint.workitem.TYPE_REMED_ITEM] = SailPoint.workitem.URL_ASSIGN_REMED_ITEM;

SailPoint.workitem.showAssignmentMenu = function(type, suggestId, grid, workItemId,
                                                 selectedItems, owner, currentAssignee){

     var suggest =  new SailPoint.IdentitySuggest({
        id: suggestId,
        emptyText: '#{msgs.dash_inbox_select_assignee}',
        baseParams: {context: 'WorkgroupMembers', workgroup:owner}
     });

     suggest.setValue(currentAssignee);

     var win = new Ext.Window({
         layout: 'fit',
         width: 350,
         height: 95,
         title:'#{msgs.remed_item_grid_label_select_assignee}',
         plain: true,
         items: [suggest],
         modal: true,
         prevAssignee: currentAssignee,
         buttons: [
             {
                 text:'#{msgs.dash_inbox_button_set_assignee}',
                 handler: function(){
                    // Before submitting the update, check to ensure that an assignee
                    // has been chosen. If no assignee was chosen, and the item has an
                    // existing assignee, then nothing has changed so we can exit.
                    if ('' === win.assigneeId && win.prevAssignee !== '')
                        win.destroy();
                    else if ('' === win.assigneeId)
                        Ext.MessageBox.alert('','#{msgs.dash_inbox_err_no_assignee}');
                    else
                        win.postRequest();
                 }
             },{
                 text:'#{msgs.dash_inbox_button_remove_assignee}',
                 handler: function(){
                    win.assigneeId='';
                    win.postRequest();
                 }
             },{
                text: '#{msgs.dash_inbox_button_close_assignee_dialog}',
                cls : 'secondaryBtn',
                handler: function(){
                 win.destroy();
                }
             }
         ],
         workItemId:workItemId,
         selectedItems:selectedItems,
         assigneeId: "",
         postRequest : function(){

             var params = this.selectedItems;
             if (!params)
                params = {};
             params.workItemId = this.workItemId;
             params.assigneeId = this.assigneeId;

             Ext.Ajax.request({
                 scope:this,
                 url: SailPoint.workitem.ASSIGN_URLS[type],
                 success: function(response){

                     var respObj = Ext.decode(response.responseText);
                     if (!respObj.success && respObj.errorMsg === ''){
                         SailPoint.FATAL_ERR_ALERT();
                     } else if (!respObj.success && respObj.errorMsg != 'system'){
                         SailPoint.EXCEPTION_ALERT(respObj.errorMsg);
                     }
                     this.fireEvent('updateComplete');
                     this.destroy();
                 },
                 failure: function(response){
                     SailPoint.FATAL_ERR_ALERT.call(this);
                 },
                 params: params
             });
         }

     });

     win.addEvents('updateComplete');

     win.on('updateComplete', function(){
        // if this is a checkbox grid, deselect all items
        if (this.deselectAll) {
            this.deselectAll();
        }
        this.getStore().load();
     }, grid);

     suggest.on('select', function(combo, newVal, oldVal){
        this.assigneeId = newVal[0].getId();
     }, win);

     win.show();
};

SailPoint.workitem.showPriorityEditor = function(grid, workItemId, level, cell) {
    var priorityEditorDialog = Ext.getCmp('workItemPriorityEditorDialog');
    var dialogCt = $('priorityEditorDialogCt');
    var body = Ext.fly('appTable');
    if (!dialogCt) {
        Ext.DomHelper.insertAfter(body, '<div id="priorityEditorDialogCt"></div>');
    }
    if (!priorityEditorDialog) {
        priorityEditorDialog = new Ext.Window({
            id: 'workItemPriorityEditorDialog',
            layout:'fit',
            width: 200,
            height:95,
            title:'#{msgs.workitem_update_priority}',
            plain: true,
            renderTo: 'priorityEditorDialogCt',
            modal:true,
            buttons: [{
                text:'#{msgs.button_save}',
                handler: function(button, eventObj) {
                    $('priorityEditForm:updatePriorityBtn').click();
                }
            },{
                text:'#{msgs.button_cancel}',
                cls : 'secondaryBtn',
                handler: function() {
                    priorityEditorDialog.hide();
                }
            }],
            grid: grid,
            workItemId:workItemId,
            loader: {
            	url: SailPoint.getRelativeUrl('/manage/workItems/editPriority.jsf'),
                params: {
                	'id': workItemId,
                	'editForm:prioritySelection': level
                },
                text: "#{msgs.loading}",
                callback: function(loader, success, response, options) {
                	priorityEditorDialog.show();
                }
            }
        });
        priorityEditorDialog.addEvents('updateComplete');

        priorityEditorDialog.on('updateComplete', function(){
           // Refresh the data
           this.grid.getStore().load();
        }, priorityEditorDialog);
        
        priorityEditorDialog.getLoader().load();
    } else {
        $('id').value = workItemId;
        $('priorityEditForm:prioritySelection').value = level;
        priorityEditorDialog.grid = grid;
        priorityEditorDialog.show();
    }
    
    priorityEditorDialog.alignTo(cell, 't-t');

};

SailPoint.workitem.ApprovalItemGrid.renderCompletionCommentsAddButton = function( workitem_id, approvalitem_id, save_comment_message, add_comment_message ) {
	var html = '';
	html += '<td>';
	html += '<img id="approvalItemCommentBtn_' + workitem_id + '" src="' + SailPoint.getRelativeUrl('/images/icons/add.png') + '" class="dashContentExpandBtn" onclick="SailPoint.web.workitem.addApprovalItemComment(\'' + approvalitem_id + '\', \'editForm:addApprovalItemComment\')" />';
	html += '</td>';
	return html;
};
	
SailPoint.workitem.ApprovalItemGrid.renderCompletionCommentsCells = function( completionComments, item_id ) {
	var html = '',
		i = 0;
    for( i = 0; i < completionComments.length; i++ ) {
        if(completionComments[i].comment != 'None' && completionComments[i].date != null) {
            html += '<div style="width:300px;white-space: pre-line !important; word-wrap: break-word !important;" class="wordwrap">';
            html += '<span style="font-weight: bold;">From '+completionComments[ i ].author + ' on ' + new Date(completionComments[i].date)+"</span><br />";
            html += Ext.String.htmlEncode(completionComments[ i ].comment);
            html += '</div>';
        }
    }
    return html;
};

SailPoint.workitem.ApprovalItemGrid.persistDecisions = function( workitemId, decisions, bulkDecision ) {
    var tmpDecisions = [];
    for( approvalItemId in decisions ) {
    	var tmp = {};
    	tmp[ 'approvalItemId' ] = approvalItemId;
    	tmp[ 'decision' ] = decisions[ approvalItemId ];
    	tmpDecisions.push( tmp );
    }
    var decisions = Ext.JSON.encode(tmpDecisions)
    $('editForm:decisions').value = decisions;
    $('editForm:bulkDecision').value = bulkDecision;

//    Ext.Ajax.request({
//        url: SailPoint.getRelativeUrl(url),
//        params: {decisions: Ext.JSON.encode(tmpDecisions)},
//        method:'POST',
//        success: function(response){
//        	return true;
//        },
//        failure: function(response){
//            SailPoint.FATAL_ERR_ALERT.call(this);
//        }
//    });
};

SailPoint.workitem.ApprovalItemGrid.renderActivationDatesEditButton = function(workitem_id, approvalitem_id, startDate, endDate) {
    var html = '';
    html += '<td>';
    html += '<img id="approvalItemActivationEditBtn_' + workitem_id + '" src="' + SailPoint.getRelativeUrl('/images/icons/calendar_edit.png') + '" onclick="SailPoint.web.workitem.renderApprovalItemCalendar(\'' + workitem_id + '\',\'' + approvalitem_id + '\', \'' + startDate + '\',\'' + endDate + '\')" />';  
    html += '</td>';
    return html;
}

