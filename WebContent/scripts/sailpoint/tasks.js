/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

SailPoint.Log.enabled = false; 
// has to be an in-scope variable for setTimeout to work
var tname = "unknown";
var timeout;
var totalTime;
var message;
var gType;
var gSubType;
var lastPollTime;
var gDbId;

/** Used by the save and execute button on the 'edit definition' page.  Once the
 validation passes, the task is saved and kicked-off. This is used by reports and monitor tasks */
function validatedRun(objectId, objectName, progressMode, executeInForegroundOption) {
  var validated = $('editForm:taskValidated').value;
  if(validated == 'true') {
    if (executeInForegroundOption) {
      $('editForm:currentDefinitionId').value = objectId;
      $('editForm:runNowButton').click();
      runTask(objectId, objectName, progressMode);
    } else {
      runObjectInBackground(objectId, objectName)
    } 
  }
}

/** if there is a validation error while saving a task schedule, this method
will catch it and render it to the schedule panel **/
function renderScheduleError() {
  var errorMsg = $('editForm:taskScheduleError').value;
  if(errorMsg) {
    var errorDiv = $(document.getElementById('errorMessages'));
    Validator.addError(errorMsg);
    
    Validator.displayErrors(errorDiv);
  }
}

function scheduleTask() {
    $('editForm:currentDefinitionId').value = gDbId;
    var url = SailPoint.getRelativeUrl("/monitor/tasks/schedulePanel.jsf?" + "taskDefId=" + gDbId);
    
    SailPoint.confirm({url: url, options: {method: 'post'}},
        {
            windowParameters: {
                className: 'sailpoint',
                title: "#{msgs.task_new_schedule}",
                width: 750,
                height: 420
            },
            focusField:'editForm:name',
            okLabel: "#{msgs.button_schedule}",
            cancelLabel: '#{msgs.button_cancel}',
            ok:function(win) {
                var errorDiv = $(document.getElementById('errorMessages'));
                errorDiv.style.display='';
                var validationSucceeded = true;
                // Validate the schedule name
                var name = $('editForm:name').value;
                var description = $('editForm:description').value;
                var date = 'editForm:inputDate';
                validationSucceeded = Validator.validateNonBlankString(name, "#{msgs.err_sched_name_required}");
                if (validationSucceeded)
                    validationSucceeded = Validator.validateNotAllSpaces(name, "#{msgs.err_sched_cannot_contains_spaces}");
                /* Turned off in bug 3621 
                if (validationSucceeded) {
                    var exceptions = ['[', ']', ':'];
                    validationSucceeded =
                        Validator.validateAlphanumericOrSpaceWithExceptions(name, exceptions, "#{msgs.err_sched_name_cannot_contain_punctuation}");
                }*/
                if (validationSucceeded)
                  validationSucceeded = Validator.validateLength(name, 80, "#{msgs.err_name_length}");
                if (validationSucceeded)
                  validationSucceeded = Validator.validateLength(description, 120, "#{msgs.err_descripton_length}");
                if (validationSucceeded)
                  validationSucceeded = Validator.validateInputDate(date, "#{msgs.err_date_past}", true);
                if (validationSucceeded) {
                  $('editForm:saveSchedule').click();
                }  else {
                  errorDiv = $(document.getElementById('errorMessages'));
                  Validator.displayErrors(errorDiv);
                }
                return false;
            },
            cancel: function(win) { win.hide(); }
        }
    );
}

function editScheduledTask(scheduleId) {
    var escapedGDbId = makeEscapedQueryParam(gDbId);

    var url = SailPoint.getRelativeUrl("/monitor/tasks/schedulePanel.jsf?" + "editForm:id=" + escapedGDbId);
    
    SailPoint.confirm({url: url, options: {method: 'post'}},
        {
            windowParameters: {
                className: 'sailpoint',
                title: "#{msgs.task_schedule_edit}",
                width: 750,
                height: 420
            },
            focusField:'editForm:name',
            okLabel: "#{msgs.button_schedule}",
            cancelLabel: '#{msgs.button_cancel}',
            ok:function(win) {
                var errorDiv = $(document.getElementById('errorMessages'));
                errorDiv.style.display='';
                var validationSucceeded = true;
                // Validate the schedule name
                var name = $('editForm:name').value;
                var description = $('editForm:description').value;
                var date = 'editForm:inputDate';
                validationSucceeded = Validator.validateNonBlankString(name, "#{msgs.err_sched_name_required}");
                if (validationSucceeded)
                    validationSucceeded = Validator.validateNotAllSpaces(name, "#{msgs.err_sched_cannot_contains_spaces}");
                /* Turned off in bug 3621 
                if (validationSucceeded) {
                    var exceptions = ['[', ']', ':'];
                    validationSucceeded =
                        Validator.validateAlphanumericOrSpaceWithExceptions(name, exceptions, "#{msgs.err_sched_name_cannot_contain_punctuation}");
                }*/
                if (validationSucceeded)
                  validationSucceeded = Validator.validateLength(name, 80, "#{msgs.err_name_length}");
                if (validationSucceeded)
                  validationSucceeded = Validator.validateLength(description, 120, "#{msgs.err_descripton_length}");
                if (validationSucceeded)
                  validationSucceeded = Validator.validateInputDate(date, "#{msgs.err_date_past}", true);
                if (validationSucceeded) {
                  $('editForm:saveSchedule').click();
                }  else {
                  errorDiv = $(document.getElementById('errorMessages'));
                  Validator.displayErrors(errorDiv);
                }
                return false;
            },
            cancel: function(win) { win.hide(); }
        }
    );
}

function progressBarExecute() {

  if ( stop ) {
    $('editForm:resetLaunchButton').click();
    setTimeout('Ext.MessageBox.hide()','500');
    return;
  }

  timeout--;
  totalTime++;
  //5 sec AJAX polling interval is implemented
  if (timeout > 0 ) {
    $('editForm:statusButton').click();
    var percentComplete = $('editForm:taskPercentComplete').value;
    if(percentComplete > percent)
      percent = percentComplete;
    Ext.MessageBox.updateProgress(percent/100, percent+'% '+ "#{msgs.completed}");
    
    var taskProgressTimeoutId = setTimeout('progressBarExecute()', '5000');
    
    /** If the task status is done, let's go to next page */
    if ( ( $('editForm:taskstatus') != null ) &&
         ( $('editForm:taskstatus').value == "done" ) ) {
      Ext.MessageBox.updateProgress(1, '100% '+ "#{msgs.completed}");
      //try clearing out again rerendering with execution of progressBarExecute
      //over a slow network. Intermittent issue
      clearTimeout(taskProgressTimeoutId);
      $('editForm:gotoViewResultButton').click();
    }
    
    /* If there was a task error, prompt user */
    if ( ( $('editForm:taskstatus') != null ) &&
         ( $('editForm:taskstatus').value == "error" ) ) { 
      Ext.MessageBox.hide();        
      var error = $('editForm:launchError').value;
      var errorText = Ext.String.format("#{msgs.execution_error}", error);   
      
      Ext.MessageBox.show({
         msg: errorText,
         width:400,
         buttons: Ext.MessageBox.OK,
         fn: backgroundTask,
         closable:true
      });
      
      Ext.MessageBox.setIcon(Ext.MessageBox.ERROR);
    }
    
    /* Task Timed Out */
  } else {
    done = true;
    Ext.MessageBox.updateText(Ext.String.format("#{msgs.execution_timeout}", Ext.String.htmlEncode(tname)));
  }
}

function infoExecute() {
  
  if ( stop ) {
    $('editForm:resetLaunchButton').click();
    setTimeout('Ext.MessageBox.hide()','500');
    return;
  }

  timeout--;
  totalTime++;

  //5 sec AJAX polling interval is implemented
  //shows the counter getting added at 1 sec on screen
  if (timeout > 0 ) {
      if (totalTime === 1 || totalTime === (lastPollTime+5)) {
      $('editForm:statusButton').click();
      lastPollTime = totalTime;
      }
    
    Ext.MessageBox.updateText(message + "<br/><br/>" + Ext.String.format("#{msgs.execution_time}", totalTime));
    
    var taskInfoTimeoutId = setTimeout('infoExecute()', '1000');
    
    /** If the task status is done, let's go to next page */
    if ( ( $('editForm:taskstatus') != null ) &&
         ( $('editForm:taskstatus').value == "done" ) ) {
      Ext.MessageBox.updateText(message + "<br/><br/>" + "#{msgs.execution_complete}"); 
      //try clearing out again rerendering with execution of infoExecute
      //over a slow network. Intermittent issue
      clearTimeout(taskInfoTimeoutId);
       $('editForm:gotoViewResultButton').click();
    }
    
    /* If there was a task error, prompt user */
    if ( ( $('editForm:taskstatus') != null ) &&
         ( $('editForm:taskstatus').value == "error" ) ) {
         var error = $('editForm:launchError').value;
         var errorText = Ext.String.format("#{msgs.execution_error}", error);      
         Ext.MessageBox.updateText(errorText);
         Ext.MessageBox.setIcon(Ext.MessageBox.ERROR);
    }
    
    /* Task Timed Out */
  } else {
    done = true;
    Ext.MessageBox.updateText(Ext.String.format("#{msgs.execution_timeout}", Ext.String.htmlEncode(tname)));
  }
}

function backgroundTask(btn) {
  $('editForm:resetLaunchButton').click();
  $(getCancelButtonName()).click();
  Ext.MessageBox.hide();
  stop = true;
}

function checkBackgroundTaskError() {
  timeout--;
  if (timeout > 0 ) {
    $('editForm:statusButton').click();
    /* If there was a task error, prompt user */
    if ( $('editForm:launchError').value !=null && $('editForm:launchError').value != '' ) {
         var error = $('editForm:launchError').value;
         var errorText = Ext.String.format("#{msgs.execution_error}", error);      
         Ext.MessageBox.updateText(errorText);
         Ext.MessageBox.setIcon(Ext.MessageBox.ERROR);
    } else {
      setTimeout('checkBackgroundTaskError()', '1000');
    }
  }
}

function runTask(taskDefId, taskName, progressMode) {
  tname = taskName;
  stop = false;
  percent = 0;
  $('editForm:taskstatus').value = '';
  $('editForm:taskPercentComplete').value = percent;
  // todo porbly better to use a Ext.Template here and in the title

  var safeTaskName = Ext.String.htmlEncode(taskName);

  if(gType && gType=='report')
    message = Ext.String.format("#{msgs.wait_for_execute}", safeTaskName);
  else 
    message = Ext.String.format("#{msgs.wait_for_task_execute}", safeTaskName);
  timeout=240;
  
  if(progressMode == 'Percentage') {
    Ext.MessageBox.show({
         title: "#{msgs.executing}"+": "+safeTaskName,
         msg: message,
         progressText: "#{msgs.executing}",
         width:400,
         buttons: Ext.MessageBox.OK,
         fn: backgroundTask,
         progress:true,
         closable:false,
         animEl: 'mb6'
    });
    
    setTimeout('progressBarExecute()', '1000');
  } else {
    totalTime=0;
    lastPollTime = totalTime;
    Ext.MessageBox.show({
         title: "#{msgs.executing}"+": "+safeTaskName,
         msg: message + "<br/><br/>" + Ext.String.format("#{msgs.execution_time}", totalTime),
         width:400,
         buttons: Ext.MessageBox.OK,
         fn: backgroundTask,
         closable:false
    });
    setTimeout('infoExecute()', '1000');
  }  
}
function refreshResultsPanel( component ) { 
  Ext.getCmp('resultsGrid').getStore().load({params:{start:0, limit:20}});
} 
function refreshSchedulesPanel( component ) { 
  Ext.getCmp('schedulesGrid').getStore().load({params:{start:0, limit:20}});
}    
function refreshGrid( component ) {
  if(component && component.getStore()) {
    var pageSize = 25;
  	if(component.getId()=="objectsStore" || component.getId()=="myObjectsStore") {
      pageSize = 500;
  	} else if (component.getStore().pageSize) {
      pageSize = component.getStore().pageSize;
  	}
  	
    component.getStore().load({params:{start:0, limit:pageSize}});
  }
}          

function newReport(value) {
  $('editForm:newDefId').value =value;
  $('editForm:createReportButton').click();
}


function deleteDefinitionPrompt() {
  $('editForm:currentDefinitionId').value = gDbId;
  var confTpl = new Ext.Template("#{msgs.conf_delete_win_title}");
  var areYouSureTpl = new Ext.Template("#{msgs.task_conf_delete_win_text}");
  var safeName = Ext.String.htmlEncode(gName);
  
  Ext.MessageBox.confirm(confTpl.apply([safeName]), areYouSureTpl.apply([safeName]), deleteDefinition);
}

function deleteResultPrompt() {
  $('editForm:currentResultId').value = gDbId;
  var confTpl = new Ext.Template("#{msgs.conf_delete_win_title}");
  var areYouSureTpl = new Ext.Template("#{msgs.conf_delete_win_text}");
  var safeName = Ext.String.htmlEncode(gName);
  
  Ext.MessageBox.confirm(confTpl.apply([safeName]), areYouSureTpl.apply([safeName]), deleteResult);
}

function deleteSchedulePrompt() {
  $('editForm:currentScheduleId').value = gDbId;
  var confTpl = new Ext.Template("#{msgs.conf_delete_win_title}");
  var areYouSureTpl = new Ext.Template("#{msgs.conf_delete_win_text}");
  var safeName = Ext.String.htmlEncode(gName);
  
  Ext.MessageBox.confirm(confTpl.apply([safeName]), areYouSureTpl.apply([safeName]), deleteSchedule);
}

function deleteDefinition(btn, text) {
  if(btn=='yes') {
    $('editForm:deleteDefinitionButton').click();
  }
}

function deleteResult(btn, text) {
  if(btn=='yes') {
    $('editForm:deleteResultButton').click();
  }
}

function deleteSchedule(btn, text) {
  if(btn=='yes') {
    $('editForm:deleteScheduleButton').click();
  }
}

function viewGridObject() {
  $('editForm:currentResultId').value = gDbId;
  $('editForm:viewButton').click();
}

function terminateResultPrompt() {
  $('editForm:currentResultId').value = gDbId;
  var confTpl = new Ext.Template("#{msgs.task_conf_termination_win_title}");
  var areYouSureTpl = new Ext.Template("#{msgs.task_conf_termination_win_text}");
  var safeName = Ext.String.htmlEncode(gName);
  
  Ext.MessageBox.confirm(confTpl.apply([safeName]), areYouSureTpl.apply([safeName]), terminateResult);
}

function terminateResult(btn, text) {
  if(btn=='yes') {
    $('editForm:terminateButton').click();
  }
}
            
function editDefinition() {
  $('editForm:currentDefinitionId').value = gDbId;
  $('editForm:editButton').click();
}

function saveAsNewDefinition() {
  /** Handle reports created from slicer/dicer **/
  if(gSubType=="Search") {
    /** If the user has hit save, the prompt hides the input field, need to show it**/
    //No longer needed with current version of ExtJS.
    //Ext.MessageBox.getDialog().body.child('input').dom.style.display = '';
    Ext.MessageBox.prompt(
        '#{msgs.msgbox_title_report_save_as_new}', 
        '#{msgs.msgbox_text_report_save_as_new}', 
        function(btn, text) { 
          copyTemplate(btn, text);
        }
    );
  } else {
    newReport(gDbId);
  }
}

function copyTemplate(btn, text) {
  if(btn=="ok") {
    $('editForm:currentDefinitionId').value = gDbId;
    $("editForm:taskName").value = text;
    $("editForm:copyDefinitionButton").click();
  }
}

function editSchedule() {
  $('editForm:currentScheduleId').value = gDbId;
  editScheduledTask();
}

function viewScheduleResults() {
  gDbId = resultsId;
  viewGridObject();
}

function runGridObjectInBackground() {
  var titleTpl = new Ext.Template('#{msgs.msgbox_title_exec_in_background}');
  var textTpl = new Ext.Template("#{msgs.msgbox_text_in_background}");
  Ext.MessageBox.alert(titleTpl.apply([]), textTpl.apply([gName]));

  $('editForm:currentDefinitionId').value = gDbId;
  $('editForm:backgroundRunButton').click();
  timeout=5;
  $('editForm:launchError').value = '';
  checkBackgroundTaskError();
}

function runObjectInBackground(theId, theName) {
  var titleTpl = new Ext.Template('#{msgs.msgbox_title_exec_in_background}');
  var textTpl = new Ext.Template("#{msgs.msgbox_text_in_background}");

  $('editForm:currentDefinitionId').value = theId;
  $('editForm:backgroundRunButton').click();

  Ext.MessageBox.show({
         title: titleTpl.apply([]),
         msg: textTpl.apply([theName]),
         width:400,
         buttons: Ext.MessageBox.OK,
         fn: backgroundTask,
         closable:false
  });
}

function runGridObject() {
  $('editForm:currentDefinitionId').value = gDbId;
  $('editForm:runNowButton').click();
  runTask(gDbId, gName, gProgressMode, gType); 
}

function scheduleGridObject() {
  $('editForm:currentDefinitionId').value = gDbId;
  scheduleTask();
}

function clickDefinition (gridView, record, HTMLitem, index, e, eOpts) {
  gDbId = record.getId();
  editDefinition();
}

function clickDefinitionSaveAs (gridView, record, HTMLitem, index, e, eOpts) {
  newReport(record.getId());
}

function clickResult (gridView, record, HTMLitem, index, e, eOpts) {
  gDbId = record.getId();
  viewGridObject();
}

function clickSchedule (gridView, record, HTMLitem, index, e, eOpts) {
  gDbId = record.getId();
  gName = record.get('name');
  status = record.get('status');
  editSchedule();
}

function newTask(sel) {
  $('editForm:newDefId').value = sel.value;
  $('editForm:createTaskButton').click();
}

/**
 * Used by Execute button in reports that supports Cancel
 */
function runSync(objectId, objectName, progressMode) {
  var validated = $('editForm:taskValidated').value;
  if ( validated == 'true' ) {
    $('editForm:currentDefinitionId').value = objectId;
    $('editForm:runSyncButton').click();
    runTaskSync(objectId,objectName, progressMode);
  }
}

/**
 * Used by Execute button in reports that supports Cancel
 */
function cancelAsync(btn) {
  $('editForm:terminateSyncButton').click();
  percent = 0;
  stop = true;
  return false;
}

/**
 * Used by Execute button in reports that supports Cancel
 */
function runSyncDialog() {
  if (!stop) {
    $('editForm:syncStatusButton').click();
    setTimeout('runSyncDialog()', '1000');
    if ( $('editForm:syncstatus').value == "done") {
        stop = true;
        Ext.MessageBox.updateProgress(1, '100% '+ "#{msgs.completed}");
        $('editForm:gotoViewTaskResultButton').click();
        Ext.MessageBox.hide();
        window.location.replace("renderResults.jsf?tabId=" + $('editForm:tabId').value);
    } else 
    if ( $('editForm:launchError').value !=null && 
         $('editForm:launchError').value != '' ) {
         var error = $('editForm:launchError').value;
         var errorText = Ext.String.format("#{msgs.sync_execution_error}", error);      
         Ext.MessageBox.updateText(errorText);
         Ext.MessageBox.setIcon(Ext.MessageBox.ERROR);
         $('editForm:terminateSyncButton').click();
         $('editForm:resetLaunchButton').click();
         stop = true;
    } else {
      // update progress
      var percentComplete = $('editForm:syncPercentComplete').value;
      if(percentComplete > percent) {
        percent = percentComplete;
      }
      Ext.MessageBox.updateProgress(percent/100, percent+'% '+ "#{msgs.completed}");
    }
  } 
}

/**
 * Derived from runSyncDialog used by Execute button in reports that supports Cancel
 */
function infoExecuteSyncDialog() {
   if (!stop) {
       totalTime++;
    $('editForm:syncStatusButton').click();
    setTimeout('infoExecuteSyncDialog()', '1000');
    if ( $('editForm:syncstatus').value == "done") {
        stop = true;
         Ext.MessageBox.updateText(message + "<br/><br/>" + "#{msgs.execution_complete}"); 
        $('editForm:gotoViewTaskResultButton').click();
        Ext.MessageBox.hide();
    } else 
    if ( $('editForm:launchError').value !=null && 
         $('editForm:launchError').value != '' ) {
         var error = $('editForm:launchError').value;
         var errorText = Ext.String.format("#{msgs.sync_execution_error}", error);      
         Ext.MessageBox.updateText(errorText);
         Ext.MessageBox.setIcon(Ext.MessageBox.ERROR);
         $('editForm:terminateSyncButton').click();
         $('editForm:resetLaunchButton').click();
         stop = true;
    } else {
      // update progress
      Ext.MessageBox.updateText(message + "<br/><br/>" + Ext.String.format("#{msgs.execution_time}", totalTime));    
    }
  } //for stop if
}

/**
 * Used by Execute button in reports that supports Cancel
 */
function runTaskSync(taskDefId, taskName, progressMode) {
  stop = false;  
  $('editForm:syncstatus').value = '';
  $('editForm:launchError').value = '';
  percent = 0;
  
  var safeTaskName = Ext.String.htmlEncode(taskName);
  
  // todo probly better to use a Ext.Template here and in the title
  message = Ext.String.format("#{msgs.wait_for_runsync}", safeTaskName);
  if (progressMode == 'Percentage') {
    Ext.MessageBox.show({
       title: "#{msgs.executing}"+": "+safeTaskName,
       msg: message,
       progressText: "#{msgs.executing}",
       width:300,
       buttons: Ext.MessageBox.CANCEL,
       fn: cancelAsync,
       progress:true,
       closable:false,
       animEl: 'mb6'
    });
    setTimeout('runSyncDialog()', '1000');
  } else {
    totalTime=0;
    Ext.MessageBox.show({
         title: "#{msgs.executing}"+": "+safeTaskName,
         msg: message + "<br/><br/>" + Ext.String.format("#{msgs.execution_time}", totalTime),
         width:300,
         buttons: Ext.MessageBox.CANCEL,
         fn: cancelAsync,
         closable:false,
         animEl: 'mb6'
    });
    setTimeout('infoExecuteSyncDialog()', '1000');    
  }
}
