/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Copies the field values from the dialog back to the main form then submits
 * the main page.
 *
 * @param actionButtonId Id of the hidden button to submit
 */
function copyDialogFormFields(actionButtonId) {

    if ($('violationDialogForm:violationIds').value == '[]')
        $('violationDialogForm:violationIds').value = $('violationListForm:violationIds').value;

    if ($('violationDialogForm:comments')){
        $('violationListForm:comments').value = $('violationDialogForm:comments').value;
    }

    if ($('violationDialogForm:expiration.year')){
        $('violationListForm:expiration.year').value = $('violationDialogForm:expiration.year').value;
        $('violationListForm:expiration.month').value = $('violationDialogForm:expiration.month').value;
        $('violationListForm:expiration.day').value = $('violationDialogForm:expiration.day').value;
    }

    if ($('violationDialogForm:expireNextCertification')){
        $('violationListForm:expireNextCertification').value = $('violationDialogForm:expireNextCertification').value;
    }

    if (Ext.getCmp('ownerName')){
        $('violationListForm:ownerName').value = Ext.getCmp('ownerName').getValue();
    } else if (Ext.getCmp('policyViolationActionOwnerName')){
        //This is an ID
        $('violationListForm:ownerId').value = Ext.getCmp('policyViolationActionOwnerName').assigneeSuggest.getValue();
    }

    if ($('violationDialogForm:description')){
        $('violationListForm:description').value = $('violationDialogForm:description').value;
    }

    $(actionButtonId).click();

    return true;
}

/**
 * Validate that the data input in the dialog form are valid. If not add an error msg
 * to the dialog.
 *
 * @param actionToValidate The name of the action selected. Indicates which field to validate
 */
function validateActionDialog(actionToValidate){

  if (actionToValidate == 'Allow') {
     if (!Validator.validateInputDate('violationDialogForm:expiration', '#{msgs.err_expiration_past}', true)){
         Validator.displayErrors($('certificationActionError'));
         return false;
     }
  } else if (actionToValidate == 'Delegate') {
    var ownerCmp = Ext.getCmp('policyViolationActionOwnerName');
    if (!ownerCmp.validate()){
         return false;
    }
  }

  return true;
}


function openActionDialog(action, actionLabel, actionButtonId) {

    var violationsGrid = Ext.getCmp('violationsGrid');

    // if only one violation was selected pass it to the dialog so the dialog can be customized
    // for the given violation
    var violationString = "";
    if (violationsGrid.getSelectedIds() && violationsGrid.getSelectedIds().length == 1){
        violationString = "&violationIds=" +  violationsGrid.getSelectedIds()[0];
    }

    var actionUrl = CONTEXT_PATH + "/manage/policyViolations/policyViolationActionDialog.jsf?action=" + action +
            violationString;

    SailPoint.confirm({url: actionUrl, options: {method: 'post'}},
      {windowParameters: {className: 'sailpoint',
          title: actionLabel
          },
          okLabel: actionLabel,
          cancelLabel: '#{msgs.button_cancel}',
          ok:function(win) {

              // validate the inputs
                var isValid = validateActionDialog(action);
                if (!isValid){
                  return false;
              }

              // copy the fields from the dialog back to this page and submit
              copyDialogFormFields(actionButtonId);

              // reset the action select box
              cleanUpAfterDialog();

              return true;
          },
          cancel:function(win) {
              resetSelectedAction();
              win.hide();
              return false;
          }
      }
    );
}

/**
 * Decides what should be taken when a user selects an action type.
 *
 * @param decisionDropdown
 */
function submitAction(decision) {

    var violationsGrid = Ext.getCmp('violationsGrid');

    // Verify that at least one violation checkbox has been checked
    if ((!violationsGrid.isAllSelected()) && (violationsGrid.getSelectedIds().length == 0)) {
        warning('#{msgs.err_no_violations}');
        resetSelectedAction();
        return;
    }

    // set the list of selected violations on the bean
    $('violationListForm:violationIds').value = arrayToString(violationsGrid.selModel.getSelectedIds(), true);
    if (violationsGrid.isAllSelected()) {
        $('violationListForm:allSelected').value = violationsGrid.isAllSelected();
        $('violationListForm:violationIds').value = arrayToString(violationsGrid.selModel.getExcludedIds(), true);
    }

    if (decision.value == 'Certify') {
         $('violationListForm:certifyButton').click();
    } else if (decision.value == 'Allow') {
        openActionDialog(decision.value, decision.text, 'violationListForm:mitigateJSButton');
    } else if (decision.value == 'Remediate') {
        if (violationsGrid.getSelectedIds().length > 1){
            warning('#{msgs.err_limit_one_remediation}');
        }else{
            // guaranteed to be only one
            var selectedId = violationsGrid.getSelectedIds()[0];
            var policyName = violationsGrid.getStore().getById(selectedId).get('policyName');
            if (policyName != 'SOD Policy') {
                warning('#{msgs.err_remediated_activity}');
                return false;
            }
            $('violationListForm:selectedPolicyViolationButton').click();
        }
    } else if (selectedOption.value == 'Delegate') {
        openActionDialog(decision.value, decision.text, 'violationListForm:delegateJSButton');
    } else {
        return;
    }

}

/**
 * Generates a alert dialog letting with a short warning
  */
function warning(msg) {
    Ext.Msg.alert("#{msgs.err_dialog_title}" , msg);
    resetSelectedAction();
}

/**
 * Resets the checkboxes and the action select box after the user submits the dialog form.
 */
function cleanUpAfterDialog() {
    var violationsGrid = Ext.getCmp('violationsGrid');
    resetSelectedAction();
    violationsGrid.deselectAll();
}

function resetSelectedAction() {
    $('selectedAction').selectedIndex = 0;
}
