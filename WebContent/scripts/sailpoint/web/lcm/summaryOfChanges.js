/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
    'SailPoint.LCM.SummaryChanges',
'SailPoint.LCM.Request');

/** Constants **/
SailPoint.LCM.SummaryChanges.identityId = null;
SailPoint.LCM.SummaryChanges.commentId = null;

SailPoint.LCM.SummaryChanges.initializeSelectedGrid = function(gridMetaData) {

  Ext.define('SailPoint.model.SumOfChange', {
    extend : 'Ext.data.Model',
    fields : gridMetaData.fields
  });

  var store = SailPoint.Store.createStore({ 
    model : 'SailPoint.model.SumOfChange',
    url: SailPoint.getRelativeUrl('/lcm/chooseIdentitiesDataSource.json'),
    root : 'objects',
    totalProperty: 'count',
    simpleSortMode : true,
    remoteSort: true,
    sorters: [{property: 'name', direction: 'ASC' }],
    pageSize : 5
  });

  gridMetaData.columns.splice(0,0,{"name":"remover", "flex":0.1, "property":"id", "header":"","dataIndex":"id", renderer: SailPoint.LCM.SummaryChanges.renderIdentityRemover});

  var grid = new SailPoint.grid.PagingGrid({
    store: store,
    id:'chosenIdentityGrid',
    cls: 'wrappingGrid',
    gridMetaData: gridMetaData,
    viewConfig: {
      scrollOffset: 0,
      stripeRows:true
    },
    usePageSizePlugin: true,
    columnResizers: {
      column: 'id',
      resizer: SailPoint.LCM.SummaryChanges.getDecisionsColumnWidth
    },
    pageSize : 5,
    renderTo : 'summaryIdentitiesContainer'
  });

  grid.initialLoad();
};

SailPoint.LCM.SummaryChanges.initializeActivationDates = function() {
  if($('cartActivationDate')) {
    this.now = new Date();
    /** Zero out the hour,min,sec, fields **/
    this.now.setHours(0);
    this.now.setMinutes(0);
    this.now.setSeconds(0);
    this.now.setMilliseconds(0);
    
    var sunriseDate = 0;
    if($("editForm:activationDate").value) {
      sunriseDate = new Date(parseInt($("editForm:activationDate").value));
    }
    
    var sunsetDate = 0;
    if($("editForm:deactivationDate").value) {
      sunsetDate = new Date(parseInt($("editForm:deactivationDate").value));
    }

    var sunriseDateField = new Ext.form.DateField({
      name:'sunrise', 
      id:'sunriseExt',
      labelStyle:'text-align:right;width:140px',
      vtype: 'daterange',
      labelSeparator: ' ',
      minValue: this.now,
      value: sunriseDate,
      renderTo:'cartActivationDate',
      endDateField: 'sunsetExt',
      listeners:  {
        change: SailPoint.LCM.SummaryChanges.updateActivationDates
      }
    });

    var sunsetDateField = new Ext.form.DateField({
      name:'sunset', 
      id:'sunsetExt', 
      labelStyle:'text-align:right;width:140px',
      vtype: 'daterange',
      labelSeparator: ' ',
      minValue: this.now,
      value: sunsetDate,
      renderTo: 'cartDeActivationDate',
      startDateField: 'sunriseExt',
      listeners:  {
        change: SailPoint.LCM.SummaryChanges.updateActivationDates
      }
    }); 
  }
};

SailPoint.LCM.SummaryChanges.getDecisionsColumnWidth = function() {
  return 33;
};

SailPoint.LCM.SummaryChanges.initializeGrid = function(gridMetaData, gridData, isBulk) {

  var store = SailPoint.Store.createStore({       
    fields : gridMetaData.fields,
    autoLoad : true,
    root: 'requests',
    totalProperty: 'count',
    pageSize: 10,
    url : SailPoint.getRelativeUrl('/lcm/cartFullDataSource.json'),
    sorters : [{
      property : 'name',
      direction : 'ASC'
    }],
    remoteSort : true
  });

  store.on('load', function(store) {
    SailPoint.component.NameWithTooltip.registerTooltips();
  });

  var grid = new SailPoint.grid.PagingGrid({
    viewConfig: {
      scrollOffset: 0,
      templates: {
        cell: new Ext.Template(
            '<td class="x-grid-col x-grid-cell x-grid-td-{id} x-selectable {css}" style="{style}" tabIndex="0" {cellAttr}>',
            '<div class="x-grid-cell-inner x-grid-col-{id}" {attr}>{value}</div>',
            '</td>'
        )
      },
      stripeRows:true
    },
    usePageSizePlugin: true,
    store: store,
    pageSize: 10,
    id:'summaryChangesGrid',
    gridMetaData: gridMetaData,
    cls: 'wrappingGrid',
    hideIfEmptyColumns: ['activation', 'deactivation', 'instance', 'identity', 'nativeIdentity'],
    columnResizers: {
      column: 'id',
      resizer: SailPoint.LCM.SummaryChanges.getDecisionsColumnWidth
    }
  });

  grid.render('summaryChangesContainer');

};

SailPoint.LCM.SummaryChanges.comment = function(id) {
  SailPoint.LCM.SummaryChanges.commentId = id;

  var commentsField = $('comment_text_'+id);
  var text = '';
  if(commentsField) {
    // Don't escape any characters
    text = Ext.String.htmlDecode(commentsField.innerHTML);
  }

  SailPoint.showAddCommentDlg(SailPoint.LCM.SummaryChanges.updateComment, text);
};

SailPoint.LCM.SummaryChanges.updateActivationDates = function(component, newValue, oldValue) {
  $("editForm:activationDate").value = '';
  $("editForm:deactivationDate").value = '';
  $("editForm:requestId").value = '';
  
  var startDateObj = Ext.getCmp('sunriseExt');
  var endDateObj = Ext.getCmp('sunsetExt');

  if(startDateObj && startDateObj.isValid() && startDateObj.getValue()) {
    $("editForm:activationDate").value = startDateObj.getValue().getTime();
  }

  if(endDateObj && endDateObj.isValid() && endDateObj.getValue()) {
    $("editForm:deactivationDate").value = endDateObj.getValue().getTime();
  }
  
  $("editForm:updateRequestBtn").click();
};

SailPoint.LCM.SummaryChanges.updateComment = function(btn, text) {
  if(btn=='ok') {
    var store = Ext.getCmp('summaryChangesGrid').getStore();
    var record = store.getById(SailPoint.LCM.SummaryChanges.commentId);
    record.set('comments', text);
    record.commit();

    $('editForm:requestComment').value = text;
    $('editForm:requestId').value = SailPoint.LCM.SummaryChanges.commentId;
    $('editForm:updateCommentBtn').click();
  }
};

SailPoint.LCM.SummaryChanges.assignmentNote = function(id) {
  SailPoint.LCM.SummaryChanges.assignmentNoteId = id;

  var assignmentNoteField = $('assignmentNote_text_'+id);
  var text = '';
  if(assignmentNoteField) {
    // Don't escape any characters
    text = Ext.String.htmlDecode(assignmentNoteField.innerHTML);
  }

  SailPoint.showAddAssignmentNoteDlg(SailPoint.LCM.SummaryChanges.updateAssignmentNote, text);
};

SailPoint.LCM.SummaryChanges.updateAssignmentNote = function(btn, text) {
  if(btn=='ok') {
    var store = Ext.getCmp('summaryChangesGrid').getStore();
    var record = store.getById(SailPoint.LCM.SummaryChanges.assignmentNoteId);
    record.set('assignmentNote', text);
    record.commit();

    $('editForm:assignmentNote').value = text;
    $('editForm:requestId').value = SailPoint.LCM.SummaryChanges.assignmentNoteId;
    $('editForm:updateAssignmentNoteBtn').click();
  }
};

SailPoint.LCM.SummaryChanges.removeIdentity = function(id) {
  var store = Ext.getCmp('chosenIdentityGrid').getStore();
  var record = store.getById(id);
  store.remove(record);
  $('editForm:identityId').value = record.getId();
  $('editForm:removeBtn').click();
};

SailPoint.LCM.SummaryChanges.editDetails = function(id) {
  var store = Ext.getCmp('summaryChangesGrid').getStore();
  var record = store.getById(id);

  var editDetailsWindow = new SailPoint.LCM.RequestAccessEditDetailsWindow({
    record: record,
    modal: true,
    closable: true
  });

  editDetailsWindow.show();
};

SailPoint.LCM.SummaryChanges.finishUpdateRequests = function(id) {
  $("editForm:requestsJSON").value = '[]';
  Ext.getCmp("summaryChangesGrid").store.loadPage(1);
};

SailPoint.LCM.SummaryChanges.removeRequest = function(recordId) {
  $('editForm:requestId').value = recordId;
  $('editForm:removeRequestBtn').click();
};

SailPoint.LCM.SummaryChanges.cancelPrompt = function() {
  var grid = Ext.getCmp('summaryChangesGrid');
  var count = grid.getStore().getCount();
  if(count===0) {
    $('editForm:cancelBtn').click();
  } else { 
      //bug21824 moved the confirm box to the xhtml file to make localized with a refresh of the page
      localizedConfirm(); 
  }
};

SailPoint.LCM.SummaryChanges.Submit = function() {
  //Check to see if there are requests
  var grid = Ext.getCmp('summaryChangesGrid');
  var count = grid.getStore().getCount();

  if($('cartActivationDate')) {
    if(!Ext.getCmp('sunriseExt').isValid() || !Ext.getCmp('sunsetExt').isValid()) {
      Ext.Msg.show({
        title:"#{msgs.lcm_summary_invalid_activation_title}",
        msg: "#{msgs.lcm_summary_invalid_activation_descr}",
        buttons: Ext.Msg.OK,
        icon: Ext.MessageBox.ERROR
      });

      return false;
    } else {
      var startDateObj = Ext.getCmp('sunriseExt').getValue();
      var endDateObj = Ext.getCmp('sunsetExt').getValue();

      // in specifying dates for specific requests, there may be some bleedover from one form to
      // the other.  Therefore we explicitly set the *activationDates to null when none were provided
      // in the relevant cart field.
      if(startDateObj) {
        $("editForm:activationDate").value = startDateObj.getTime();
      } else {
        $("editForm:activationDate").value = "";
      }

      if(endDateObj) {
        $("editForm:deactivationDate").value = endDateObj.getTime();
      } else {
        $("editForm:deactivationDate").value = "";
      }
    }
  }

  if(count===0) {
    Ext.Msg.show({
      title:"#{msgs.lcm_summary_empty_cart_title}",
      msg: "#{msgs.lcm_summary_empty_cart_descr}",
      buttons: Ext.Msg.OK,
      icon: Ext.MessageBox.ERROR
    });
  } else {

    $("submitBtn").disabled = true;
    $("cancelInputBtn").disabled = true;
    $("editForm:requestBackBtn").disabled = true;
    $("editForm:submitCmdBtn").click();
  }
};

SailPoint.LCM.SummaryChanges.UpdateProgress = function(firstTime, isSingle) {

  if(!isSingle) {
    $('editForm:updateProgress').click();  
    var percent = parseInt($('totalItems').innerHTML, 10);
    if(!firstTime) {
      Ext.MessageBox.updateProgress(percent/100, percent+'% '+ "#{msgs.completed}");
    } else {
      var message = "#{msgs.lcm_summary_progress_message}";
      SailPoint.LCM.SummaryChanges.progressWindow = Ext.MessageBox.show({
        title: "#{msgs.executing}",
        msg: message,
        progressText: "#{msgs.lcm_summary_progress_title}",
        width:400,
        buttons: Ext.MessageBox.OK,
        fn: SailPoint.LCM.SummaryChanges.BackgroundWorkflows,
        progress:true,
        closable:false
      });
    }

    setTimeout(SailPoint.LCM.SummaryChanges.UpdateProgress, '1000');

  }
};

SailPoint.LCM.SummaryChanges.BackgroundWorkflows = function() {
  $("editForm:dashboardBtn").click(); 
};


/**
 * This function wraps Ext.MessageBox.show to show the Add Comment dialog
 * @param callback The callback called when the dialog is dismissed
 * @param [initialText] The initial value populating the text field
 * @returns {*|Ext.Component|Ext.Component|Ext.Component|Ext.Component|Ext.Component} The instance of MessagBox
 */
SailPoint.showAddAssignmentNoteDlg = function(callback, initialText) {
    var dialog = Ext.MessageBox.show({
        title: '#{msgs.dialog_add_assignmentNote}',
        width: 450,
        fn: callback,
        buttonText: {
            ok: '#{msgs.button_title_add_note}',
            cancel: '#{msgs.button_cancel}'
        },
        multiline:175,
        value: initialText,
        closable: false,
        buttons: Ext.MessageBox.OKCANCEL,
        defaultTextHeight: 200
    });
    dialog.down('textarea').focus();
    return dialog;
}


