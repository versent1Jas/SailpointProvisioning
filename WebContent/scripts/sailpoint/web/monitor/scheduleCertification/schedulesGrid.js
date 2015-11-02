Ext.ns('SailPoint', 
       'SailPoint.Monitor', 
       'SailPoint.Monitor.Grid',
       'SailPoint.Monitor.Grid.CertificationSchedules');

/**
 * View the currently selected certification schedule.
 */
SailPoint.Monitor.Grid.CertificationSchedules.editCertificationSchedule = function() {
    $('editForm:currentScheduleId').value = gDbId;
    $('editForm:editScheduleButton').click();
};

/**
 * Show a prompt to delete the currently selected certification schedule.
 */
SailPoint.Monitor.Grid.CertificationSchedules.deleteCertificationSchedulePrompt = function() {
    $('editForm:currentScheduleId').value = gDbId;
    var confTpl = new Ext.Template("#{msgs.conf_delete_win_title}");
    var areYouSureTpl = new Ext.Template("#{msgs.task_conf_delete_win_text}");
    Ext.MessageBox.confirm(confTpl.apply([gName]), areYouSureTpl.apply([gName]), SailPoint.Monitor.Grid.CertificationSchedules.deleteCertificationSchedule);
};

/**
 * Handle deleting the selected schedule.
 */
SailPoint.Monitor.Grid.CertificationSchedules.deleteCertificationSchedule = function(btn, text) {
    if(btn=='yes') {
      $('editForm:deleteScheduleButton').click();
    }
};

/**
 * The cellclick handler for the certification schedules grid.
 */
SailPoint.Monitor.Grid.CertificationSchedules.cellClickHandler = function(gridView, record, HTMLitem, index, e, eOpts) {
    gDbId = record.getId();
    gName = record.get('name');
    SailPoint.Monitor.Grid.CertificationSchedules.editCertificationSchedule();
};

/**
 * The contextmenu handler for the certification schedules grid.
 */
SailPoint.Monitor.Grid.CertificationSchedules.contextMenuHandler = function(gridView, record, HTMLitem, index, e, eOpts) {
    var contextMenu = new Ext.menu.Menu();
    gDbId = record.getId();
    gName = record.get('name');
    status = record.get('latestResult');
    gMenu = contextMenu;
    resultsId = record.get('latestResultId');
    certHasResults = (status!="");
    
    contextMenu.add(
      new Ext.menu.Item({text: '#{msgs.menu_head_edit}', handler: SailPoint.Monitor.Grid.CertificationSchedules.editCertificationSchedule, iconCls: 'editBtn'})
    );
    
    if(certHasResults) {
      contextMenu.add(
        new Ext.menu.Item({text: '#{msgs.menu_head_view_last_result}', handler: SailPoint.Monitor.Grid.CertificationSchedules.viewCertificationResults, iconCls: 'viewDetailsBtn'})
      );
    }
   
    contextMenu.add(
      new Ext.menu.Separator(),
      new Ext.menu.Item({text: '#{msgs.menu_delete}', handler: SailPoint.Monitor.Grid.CertificationSchedules.deleteCertificationSchedulePrompt, iconCls: 'deleteBtn'})
    );   
    
    e.stopEvent();
    contextMenu.showAt(e.xy);
};

/**
 * View the currently selected results.
 */
SailPoint.Monitor.Grid.CertificationSchedules.viewCertificationResults = function() {
    $('editForm:currentScheduleId').value = gDbId;

    if (certHasResults) {
      $('editForm:currentResultId').value = resultsId;
      $('editForm:viewResultsButton').click();
    } else {
      Ext.MessageBox.alert('#{msgs.no_task_results}','#{msgs.dialog_task_not_run}');
    }
};
