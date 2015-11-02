/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */
Ext.ns('SailPoint', 'SailPoint.workitem', 'SailPoint.workitem.ApprovalItemGrid');

/**
 * Initialize approval item bulk decision grid
 * @param fields Grid field list
 * @param disableDecisionColumn True if the decision column should be disabled
 * @param editable True if the grid is editable
 */
SailPoint.workitem.ApprovalItemGrid.initBulkDecision = function(fields, columns, disableDecisionColumn, editable, isArchive, stateId) {

    var storeUrl = '/workitem/approvalItemsDataSource.json';
    var extraParams = {};

    if (isArchive) {
        storeUrl = '/workitem/archiveApprovalItemsDataSource.json';
        extraParams.id = SailPoint.WorkItemState.id;
    }

    var approvalItemStore = SailPoint.Store.createStore({
        fields : fields,
        url : SailPoint.getRelativeUrl(storeUrl),
        storeId : 'approvalItemsStore',
        remoteSort : true,
        autoSync: true,
        root: 'members',
        extraParams: extraParams
    });

    // bug fix# 13939 - delay the layout refresh for IE 
    var delayTime = (Ext.isIE) ? 10 : 0;
    approvalItemStore.on( 'load', function() {
        this.repairStoreDisplay();
    },
    this,
    { 
    	delay : delayTime
    });

    var sm = ( disableDecisionColumn ? null : new SailPoint.grid.CheckboxSelectionModel( {selectMessageBox: Ext.getDom('selectedCount')} ) );

    var toolbar = null;
    if (!disableDecisionColumn ) {
        toolbar = [ {
            xtype:'combo',
            emptyText: '#{msgs.empty_text_filter_by_decision}',
            editable:false,
            listeners: {
                'select': function( combo, records, ops ) {
                      var xtraParms = {},
                          count = Object.keys( SailPoint.DecisionTracker ).length,
                          filterParam,
                          proxy,
                          newDecisionTracker = {};

                          if( count != 0 ) {
                              Ext.MessageBox.show( {
                                      title: "#{msgs.unsaved_changes}",
                                      msg: "#{msgs.cert_unsaved_decisions}",
                                      buttons: Ext.Msg.OKCANCEL,
                                      fn: function( button ) {
                                          if( button === 'cancel' ) {
                                              combo.setValue( null );
                                          } else {
                                              SailPoint.DecisionTracker = {};
                                              filterParam = combo.getValue();
                                              xtraParms['decision'] = filterParam;
                                              proxy = approvalItemStore.getProxy();
                                              Ext.apply(proxy.extraParams, xtraParms );
                                              approvalItemStore.loadPage(1);
                                          }
                                      }
                              });
                          } else {
                              filterParam = combo.getValue();
                              xtraParms['decision'] = filterParam;
                              proxy = approvalItemStore.getProxy();
                              Ext.apply(proxy.extraParams, xtraParms );
                              approvalItemStore.loadPage(1);
                          }

                      }
                },
                id: 'approvalItem-decision',
                fieldLabel: "#{msgs.label_search}",
                name: 'decision',
                store:[
                    ['all', '#{msgs.approval_decision_filter_all}'],
                    ['open', '#{msgs.approval_decision_filter_open}'],
                    ['approved', '#{msgs.approval_decision_filter_approved}'],
                    ['rejected', '#{msgs.approval_decision_filter_rejected}'],
                    ['decided', '#{msgs.approval_decision_filter_completed}']
                ],
                width:250,
                listConfig:{width:250}
            }
        ];
    }

    var membersGrid = Ext.create('SailPoint.grid.PagingCheckboxGrid', {
        renderTo: 'approvalItems-grid',
        id: 'approvalcheckboxgrid',
        store: approvalItemStore,
        columns: columns,
        stateId: stateId,
        stateful: true,
        viewConfig : {
            stripeRows: true,
            overflowX: 'hidden'
        },
        selModel: sm,
        pageSize : 5,
        bbar: {
            xtype : 'pagingtoolbar',
            store: approvalItemStore,
            displayInfo: true
        },
        cls : 'middle-align-grid',
        tbar : toolbar,
        initComponent : function() {
            SailPoint.grid.PagingCheckboxGrid.superclass.initComponent.apply(this, arguments);
        },
        disableDecisionColumn: disableDecisionColumn
    });
    
    approvalItemStore.load();
    
    /* Bulk Decision Combobox */
    var bulkActionStore = [];
    bulkActionStore.push( [ 'approve', '#{msgs.button_approve}' ] );
    bulkActionStore.push( [ 'reject', '#{msgs.button_reject}' ] );
    if(editable && !disableDecisionColumn) {
        var bulkDecisionSelect = new Ext.form.ComboBox({
            id:'bulkDecisionSelect',
            renderTo:'bulkDecisionContainer',
            width : 170,
            store:bulkActionStore,
            editable:false,
            emptyText:"#{msgs.cert_decision_bulk_select_decision}",
            resetCombo : function(){
                this.reset();
                this.setRawValue(this.emptyText);
            }
        });

        bulkDecisionSelect.on('select', function(combo, record, index){
            var selectedIds = membersGrid.selModel.getSelectedIds(),
                excludedIds = membersGrid.selModel.getExcludedIds(),
                numberOfExcludedIds = excludedIds.length,
                numberOfSelectedIds = selectedIds.length,
                decision,
                selectedId,
                i = 0;
            if( selectedIds == 0 ) {
                Ext.MessageBox.alert("#{msgs.cert_bulk_action_title_none_selected}", "#{msgs.lcm_bulk_action_none_selected}");
                combo.setValue( null );
                return;
            }
            decision = 'Rejected';
            if( bulkDecisionSelect.value === 'approve' ) {
                decision = 'Finished';
            }

            for( i = 0; i != numberOfSelectedIds; i++ ) {
                selectedId = selectedIds[ i ];
                if( !Ext.Array.contains( excludedIds, selectedId ) ) {
                  if( $( 'decision_' + selectedId ) ) {
                      if( decision === 'Finished' ) {
                          $('editForm:secretApproveButton_' + selectedId).click();
                      } else {
                          $('reject-gen' + selectedId).click();
                      }
                  }
                  SailPoint.DecisionTracker[ selectedId ] = decision;
                }
            }

            SailPoint.BulkDecision.overridden = [];
            for( i = 0; i != numberOfExcludedIds; i++ ) {
                SailPoint.BulkDecision.overridden.push( excludedIds[ i ] );
                if( !SailPoint.DecisionTracker[ excludedIds[ i ] ] ) {
                    SailPoint.DecisionTracker[ excludedIds[ i ] ] = "";
                }
            }

            if( membersGrid.selModel.isAllSelected() ) {
                SailPoint.BulkDecision.decision = decision;
            }
            combo.setValue( null );
        });
    }
    
    approvalItemStore.addListener('load', 
    		function() { SailPoint.workitem.ApprovalItemGrid.repairStoreDisplay(); },
    		this,
    		{
    			single: true,
    			delay: 400
    		});
};

SailPoint.workitem.ApprovalItemGrid.repairStoreDisplay = function() {
    // bug fix# 13939 
    if (Ext.isIE) {
    	Ext.getCmp('approvalcheckboxgrid').updateLayout();
	}
} 


/* -------------------------------------


    GRID RENDERER FUNCTIONS

 --------------------------------------- */

SailPoint.workitem.ApprovalItemGrid.renderBatchFileName = function( value ) {
    if (!value) {
        return "";
    }
    
    var values = Ext.JSON.decode(value);
    
    if (values.length === 0 || values[0].displayValue === null) {
        return "";
    }
    
    return Ext.String.htmlEncode(values[0].displayValue);
}

SailPoint.workitem.ApprovalItemGrid.renderBatchItemsLink = function( value, metadata, record, rowIdx, colIdx, store ) {
  var values = Ext.JSON.decode(value);

  var batchFileName = Ext.String.htmlEncode(values[0].displayValue);
  
  var batchRequestId  = record.get('valueTargetId');

  var html = '<a href="javascript: SailPoint.BatchDetailPopup.show(\'' + batchRequestId + '\');">' + batchFileName + '</a>'; 

  return html;
}

SailPoint.workitem.ApprovalItemGrid.renderValueLink = function( value, metadata, record, rowIdx, colIdx, store ) {
  var html = "",
      i = 0,
      description,
      name,
      roleName,
      values = Ext.JSON.decode( record.get('values')),
      isArchive = SailPoint.WorkItemState.isArchive;
  
  var identityRequestId = record.raw['identityRequestId'];

  for( i = 0; i != values.length; i++ ) {
    	value = values[ i ].displayValue; // role displayname
    	roleName = values[ i ].roleName; // role name
      description = values[ i ].description;
      name = values[ i ].name;      // assignedRoles or detectedRoles

      if(value.indexOf("useBy = ") > -1) { //Don't show internal attributes
          continue;
      }

      if( record.data.isRole && !isArchive ) {
      	  var assignmentId = record.raw['assignmentId'];
          html += '<a href="javascript: SailPoint.RoleDetailPanel.window(\''+  assignmentId + '\', \''+  record.data.valueIds + '\', \''+  record.data.valueTargetId + '\', false, \'approvalItem\', \'' + name + '\',\'' + identityRequestId + '\',\'' + roleName + '\');">';
      }
      html += Ext.String.htmlEncode(value);
      if( description && description.length > 0) {
          var url = SailPoint.getRelativeUrl("/images/icons/dashboard_help_12.png");
          html += '<img src="'+url+'" class="descriptionHelp" data-qtip="' + description + '"/>';
      }
      if( record.data.isRole && !isArchive ) {
          html += '</a>';
      }
      html += '<br />';
  }
  return html;
};

/**
 * This method attempts to determine the current state of a given
 * item in the grid. It will attempt to find a local decision, either
 * in the decisionTracker or in a bulk decision record. If found the local
 * decision will be returned. If not, we will return the remote item record.
 */
SailPoint.workitem.ApprovalItemGrid.getCorrectDecision = function( id, remote ) {

    // Check to see if a client side bulk decision includes the given item.
    if( SailPoint.BulkDecision.decision ) {
        if( !SailPoint.BulkDecision.overridden || !Ext.Array.contains( SailPoint.BulkDecision.overridden, id ) ) {
            return SailPoint.BulkDecision.decision;
        }
    }

    // Check for a decision on the given item stored on the client
    var local = SailPoint.DecisionTracker[ id ];
    if( local ) {
        return local;
    }

    // if no decisions are stored on the client site, return the remote record.
    return remote;
};

SailPoint.workitem.ApprovalItemGrid.clickDecision = function(id){
    $(id).click();
};


SailPoint.DecisionTracker = {};
SailPoint.BulkDecision = {};
SailPoint.RemoteDecisions = {};

SailPoint.workitem.ApprovalItemGrid.renderDecisionColumn = function( value, metadata, record, rowIdx, colIdx, store ) {
    var html = '';
    if(SailPoint.WorkItemState.violationReview){
        html = SailPoint.workitem.ApprovalItemGrid.renderViolationDecisionColumn(value, metadata, record, rowIdx, colIdx, store);
    } else {
        html = SailPoint.workitem.ApprovalItemGrid.renderWorkItemDecisionColumn(value, metadata, record, rowIdx, colIdx, store);
    }
    return html;
};

SailPoint.workitem.ApprovalItemGrid.renderViolationDecisionColumn = function( value, metadata, record, rowIdx, colIdx, store ) {
    var correctDecision = SailPoint.workitem.ApprovalItemGrid.getCorrectDecision( record.data.id, record.data.decision );
    var approveButtonId = 'editForm:secretDeleteButton_' + record.data.id;
    var selected = correctDecision === 'Rejected' ? 'selected' : '';
    var html = '';
    html += '<div id="decision_' + record.data.id +'">';
    html +=   '<table border="0" cellpadding="0" cellspacing="0" style="width: 46;">';
    html +=     '<tbody>';
    html +=       '<tr>';
    html +=         '<td style="padding: 0px; border: 0px; " width="23px">';
    html +=           '<div class="imageRadio lcmDeleteRadio ' + selected +
                         '" id="delete-gen' + record.data.id +
                         '" onclick="SailPoint.workitem.ApprovalItemGrid.deleteButtonClick(\'' + record.data.id + '\');">';
    html +=             '<input type="radio" name="editForm:violation_decision_' + record.data.id +
                             '" id="editForm:violation_decision_' + record.data.id +
                             '" value="Rejected"/>';
    html +=             '<input type="hidden" name="editForm:secretDeleteButton_' + record.data.id +
                             '" id="editForm:secretDeleteButton_' + record.data.id + '"/>';
    html +=           '</div>';
    html +=         '</td>'
    html +=       '</tr>';
    html +=     '</tbody>';
    html +=   '</table>';
    html += '</div>';

    SailPoint.DecisionTracker[record.data.id] = (correctDecision === "Rejected") ? correctDecision : 'Finished';
    return html;
};

SailPoint.workitem.ApprovalItemGrid.deleteButtonClick = function(id) {
    
    // For some reason the image radio does not always start with a value 
    var container = $('decision_' + id); 
    if (container != null) { 
        var radio = ImageRadio.getRadio(container); 
        if (null != radio) { 
            if ('radio' == radio.type) { 
                ImageRadio.setRadioValue(radio, SailPoint.DecisionTracker[id]); 
            } 
        } 
    } 
    
    SailPoint.DecisionTracker[id] = ImageRadio.getRadio($('delete-gen' + id)).value;
    SailPoint.web.workitem.toggleItemState(id, SailPoint.DecisionTracker[id]);
    
    if (null == ImageRadio.getRadioValue($('delete-gen' + id))) {
        SailPoint.DecisionTracker[id] = 'Finished';
    }
    
    if (SailPoint.BulkDecision.overridden) {
        SailPoint.BulkDecision.overridden.push(id);
    }
};

SailPoint.workitem.ApprovalItemGrid.renderWorkItemDecisionColumn = function( value, metadata, record, rowIdx, colIdx, store ) {
  var correctDecision = SailPoint.workitem.ApprovalItemGrid.getCorrectDecision( record.data.id, record.data.decision ),
      approvalSelected = correctDecision === 'Finished',
      rejectSelected = correctDecision === 'Rejected',
      decisionDisabled = SailPoint.WorkItemState.editable === false,
      rejectedClass = '',
      approvalClass = '',
      html = "";
  if( decisionDisabled ) {
      if( approvalSelected ) {
          approvalClass = ' disabledSelected';
      } else {
          approvalClass = ' disabled';
      }
      if( rejectSelected ) {
          rejectedClass = ' disabledSelected';
      } else {
          rejectedClass = ' disabled';
      }
  } else {
      if( approvalSelected ) {
          approvalClass = ' selected';
      }
      if( rejectSelected ) {
          rejectedClass = ' selected';
      }
  }

  var approveButtonId = 'editForm:secretApproveButton_' + record.data.id;
  var removeButtonId = 'editForm:secretApproveButton_' + record.data.id;

  html += '<div id="decision_' + record.data.id +'">';
  html +=   '<table border="0" cellpadding="0" cellspacing="0" style="width: 46;">';
  html +=     '<tbody>';
  html +=       '<tr>';
  html +=         '<td style="padding: 0px; border: 0px; " width="23px">';
  html +=           '<div class="imageRadio approveRadio' + approvalClass + '" id="approve-gen' + record.data.id + '" onclick="SailPoint.workitem.ApprovalItemGrid.clickDecision(\'' + approveButtonId + '\')">';
  html +=             '<input type="radio" name="editForm:decision_' + record.data.id + '" id="editForm:decision_' + record.data.id + '" value="Finished"/>';
  html +=             '<input type="hidden" name="editForm:secretApproveButton_' + record.data.id + '" id="editForm:secretApproveButton_' + record.data.id + '" onclick="if(!'+decisionDisabled+') { if (ImageRadio.radioClickCanceled) { ImageRadio.radioClickCanceled = false; return false; } SailPoint.DecisionTracker[ \'' + record.data.id+ '\' ] = ImageRadio.getRadio($(\'approve-gen' + record.data.id + '\')).value; SailPoint.web.workitem.handleItemStateChange(\'' + record.data.id + '\', SailPoint.DecisionTracker[ \'' + record.data.id+ '\' ]); if( SailPoint.BulkDecision.overridden ) { SailPoint.BulkDecision.overridden.push( \'' + record.data.id + '\' );}}"/>';
  html +=           '</div>';
  html +=         '</td>';
  html +=         '<td style="padding: 0px; border: 0px; " width="23px">';
  html +=           '<div class="imageRadio revokeRadio' + rejectedClass + '" id="reject-gen' + record.data.id + '" onclick="SailPoint.workitem.ApprovalItemGrid.clickDecision(\'editForm:secretRejectButton_' + record.data.id + '\')">';
  html +=             '<input type="radio" name="editForm:decision_' + record.data.id + '" id="editForm:decision_' + record.data.id + '" value="Rejected"/>';
  html +=             '<input type="hidden" name="editForm:secretRejectButton_' + record.data.id + '" id="editForm:secretRejectButton_' + record.data.id + '" onclick="if(!'+decisionDisabled+') { if (ImageRadio.radioClickCanceled) { ImageRadio.radioClickCanceled = false; return false; } SailPoint.DecisionTracker[ \'' + record.data.id+ '\' ] = ImageRadio.getRadio($(\'reject-gen' + record.data.id + '\')).value; SailPoint.web.workitem.handleItemStateChange(\'' + record.data.id + '\', SailPoint.DecisionTracker[ \'' + record.data.id+ '\' ]); if( SailPoint.BulkDecision.overridden ) { SailPoint.BulkDecision.overridden.push( \'' + record.data.id + '\' );}}"/>';
  html +=           '</div>';
  html +=         '</td>';
  html +=       '</tr>';
  html +=     '</tbody>';
  html +=   '</table>';
  html += '</div>';
  return html;
};

SailPoint.workitem.ApprovalItemGrid.renderCompletionComments = function( value, metadata, record, rowIdx, colIdx, store ) {
  var html = "",
      workitem_id =  SailPoint.WorkItemState.id,
      editable = !SailPoint.WorkItemState.isArchive && SailPoint.WorkItemState.id && SailPoint.WorkItemState.violationReview !== true,
      completionComments = record.data.completionComments,
      save_comment_message = "#{msgs.approvalitem_save_comment}",
      add_comment_message = "#{msgs.approvalitem_add_completion_comment}",
      i = 0;

  try{
	  metadata.style="word-wrap: break-word";
      html += '<table cellspacing="0">';
      html += '<tr>';
      // Add Comment Cell
      if( editable ) {
          html += SailPoint.workitem.ApprovalItemGrid.renderCompletionCommentsAddButton( workitem_id, record.data.id, save_comment_message, add_comment_message );
      }
      // Comments Cell
      html += '<td>';
      html += SailPoint.workitem.ApprovalItemGrid.renderCompletionCommentsCells( completionComments, record.data.id );
      html += '</td>';
      html += '</tr>';
      html += '</table>';
  } catch(err){
      if (!SailPoint.AccountErrorLaunched){
          SailPoint.AccountErrorLaunched = true;
          SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error rendering account column.");
      }
      return "ERROR";
  }
  return html;
};

SailPoint.workitem.ApprovalItemGrid.renderApplicationColumn = function( value, metadata, record, rowIdx, colIds, store ) {
  var application = record.data.application,
      instance = record.data.instance,
      html = '';

      html += '<div>' + application + '</div>'
      if( instance ) {
          html += '<div>(' + instance + ')</div>';
      }
      return html;
};

SailPoint.workitem.ApprovalItemGrid.renderActivationDatesColumn = function(value, metadata, record, rowIdx, colIdx, store) {

  var html = "",
      activationDates = record.data.activationDates,
      end,
      start,
      workitem_id = SailPoint.WorkItemState.id;

  try {
      html += '<div class="activationNotice nowrap">';
      html += '<table cellspacing="0">';
      html += '<tr>';
      if(SailPoint.WorkItemState.editable === true) {
          html += SailPoint.workitem.ApprovalItemGrid.renderActivationDatesEditButton(workitem_id, record.data.id, activationDates.startdate, activationDates.enddate);
      }
      html += '<td>';
      if(activationDates.startdate_pretty) {
          html += '<span class="label green">#{msgs.active_on}: </span>';
          html += activationDates.startdate_pretty;
      }
      if(activationDates.enddate_pretty) {
          if(activationDates.startdate_pretty) {
              html += '<br />';
          }
          html += '<span class="label red">#{msgs.inactive_on}: </span>';
          html += activationDates.enddate_pretty;
      }
      html += '</td>';
      html += '</tr>';
      html += '</table>';
      html += '</div>';
  } catch(err){
      if (!SailPoint.AccountErrorLaunched){
          SailPoint.AccountErrorLaunched = true;
          SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error rendering activationDates column.");
      }
      return "ERROR";
  }
  return html;


};
