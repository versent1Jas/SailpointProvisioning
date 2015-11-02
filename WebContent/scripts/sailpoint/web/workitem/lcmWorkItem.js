/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.web.workitem');

/**
 * Called when a decision has been changed on one
 * of the decision Image radios.
 */
SailPoint.web.workitem.handleItemStateChange = function(id, value) {
    var container = $('decision_'+id);
    if ( container != null ) {
        var radio = ImageRadio.getRadio(container);
        if ((null != radio) && ('radio' == radio.type)) {
            ImageRadio.setRadioValue(radio, value);
        }
    }
}

/**
 * Works just like handleItemStateChange, but allows you to undo a
 * decision by clicking on an item a second time.
 */
SailPoint.web.workitem.toggleItemState = function(id, value) {
    var container = $('decision_'+id);
    if ( container != null ) {
        var radio = ImageRadio.getRadio(container);
        if ((null != radio) && ('radio' == radio.type)) {
            var currentValue = ImageRadio.getRadioValue(radio);
            if (currentValue == value){
                ImageRadio.setRadioValue(radio, '');
            } else {
                ImageRadio.setRadioValue(radio, value);
            }
        }
    }
}

/**
 * Go through all of decision divs get out the radio and
 * make sure it has a value.
 */
function checkAllItemsSelected() {
	var i, id, keys, count, 
	    usingBulkDecisions = Ext.getCmp('approvalcheckboxgrid');
	//usingBulkDecisions really doesn't mean we are usingBulkDecisions. The BulkDecision Grid is loaded regardless
	//of whether we allow for bulk decisions or not. If the disableDecisionColumn attribute is set to true, we are not
	//expecting any decisions to be made. No since and checking the decisions.
    if( usingBulkDecisions && !usingBulkDecisions.disableDecisionColumn) {
		keys = Object.keys( SailPoint.RemoteDecisions );
		count = keys.length;
		for( i = 0; i < count; i++ ) {
			id = keys[ i ] 
			if( !( SailPoint.workitem.ApprovalItemGrid.getCorrectDecision( id, SailPoint.RemoteDecisions[ id ] ) ) ) {
				return false;
			}
		}
		return true;
	}
    var decisionFields = Ext.DomQuery.select('div[id^=decision_]');
    if ( decisionFields != null ) {
        for(i = 0; i < decisionFields.length; i++) {
            var field = decisionFields[i];
            if ( field != null ) {
                var radio = ImageRadio.getRadio(field);
                if  ( radio != null ) {
                    var radioVal = ImageRadio.getRadioValue(radio);
                    if ( ( radioVal == "" ) || ( radioVal == null ) ) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

/**
 * Show the div telling the customer to complete all items
 * before clicking complete.
 */
function showFinishAllMessage() {
    $('finishAllItemsDiv').style.display = '';
}

/**
 * Click a button to force the action.
 */
function completeItem() {
    Ext.MessageBox.wait('#{msgs.loading_data}');
    $('editForm:completeBtn').click();
}

/**
 * Make sure all radios have a value before allowing them
 * complete.
 */
function checkBeforeComplete() {
    if (checkAllItemsSelected() === true) {
        promptSignatureOrComplete();
        return true;
    } else {
        showFinishAllMessage();
        return false;
    }
}

/**
 * Check to see whether or not we need to prompt user for
 * e-signature. If not, then complete as normal.
 */
function promptSignatureOrComplete() {
    if (isSignatureMeaningDefined()) {
        SailPoint.ESigPopup.show(
            SailPoint.web.workitem.NATIVE_AUTH_ID,
            SailPoint.web.workitem.ORIGINAL_AUTH_ID,
            SailPoint.web.workitem.SIGNATURE_MEANING,
            function(name, pass) {
                if(name !== SailPoint.web.workitem.NATIVE_AUTH_ID && name !== SailPoint.web.workitem.ORIGINAL_AUTH_ID) {
                    Ext.fly('editForm:signatureAuthId').dom.value = name;
                }
                Ext.fly('editForm:signaturePass').dom.value = pass;
                completeItem();
            },
            function() {
                //Defect 21339: we need to reset these buttons on cancel
                setButtonsDisabled(false);
            },
            null,
            SailPoint.ESigPopup.WorkItemType,
            $('editForm:id').value
        );
    } else {
        completeItem();
    }
}

/**
 * Determines if an e-signature meaning has been defined.
 */
function isSignatureMeaningDefined() {
    return SailPoint.web.workitem.SIGNATURE_MEANING && "" !== SailPoint.web.workitem.SIGNATURE_MEANING;
}

/**
 * Open the dialog to add a completion comment to an approval item.
 *
 * @param  approvalItemId The ID of the field where the values should be stored
 * @param  btnName  The ID of the button to click to save the comment.
 */
SailPoint.web.workitem.addApprovalItemComment = function(approvalItemId, btnName) {
    SailPoint.showAddCommentDlg(function(btn, text){
        if (btn == 'ok'){
            var hiddenVal = $('editForm:approvalComment'),
                hiddenId = $('editForm:approvalId');
            if(hiddenVal) {
                hiddenVal.value=text;
                hiddenId.value=approvalItemId;
                $(btnName).click();
            }
        }
    });
}

/**
 * Used to render the calendar for sunrise/sunset dates for each of the
 * approval items.
 *
 * Since these are creating in a loop, we must pass in a ID,
 * the hiddenElement that holds the value and the div
 * where the calendar gadget should live.
 */
SailPoint.web.workitem.renderApprovalItemCalendar = function(workitemId, approvalItemId, startDate, endDate) {

    var activationDateWindow =  createActivationWin(true, approvalItemId);
    
    activationDateWindow.setType('edit');
    activationDateWindow.show();
    if(startDate != "undefined") {
        var sd  = new Date(Ext.isNumber(startDate) ? startDate : parseInt(startDate));
        activationDateWindow.form.sunriseDate.setValue(sd);
        activationDateWindow.form.sunriseHour = sd.getHours();
        activationDateWindow.form.sunriseMin = sd.getMinutes();
    } else {
        activationDateWindow.form.sunriseDate.reset();
    }
    if(endDate != "undefined") {
        var ed = new Date(Ext.isNumber(endDate) ? endDate : parseInt(endDate));
        activationDateWindow.form.sunsetDate.setValue(ed);
        activationDateWindow.form.sunsetHour = ed.getHours();
        activationDateWindow.form.sunsetMin = ed.getMinutes();
    } else {
        activationDateWindow.form.sunsetDate.reset();
    }
    
    
}

function createActivationWin(showAssignDates, approvalItemId) {
    
    return Ext.create('SailPoint.RoleAssignmentWindow',{
      title: "#{msgs.approvalitem_activation_dates}",
      width: 350,
      showAssignDates: showAssignDates,
      closeAction : 'destroy',
      saveAction : saveActivationDates,
      noSuggest: true,
      roleId: approvalItemId
    });  
  }

function saveActivationDates() {
    var me = this;
    
    var sunrise = me.form.sunriseDate;
    var sunset = me.form.sunsetDate;
    var sunriseVal = $('editForm:approvalSunrise');
    if(sunriseVal) {
        if(sunrise.getValue()) {
            var sunval = sunrise.getValue();
            sunval.setHours(me.form.sunriseHour);
            sunval.setMinutes(me.form.sunriseMin);
            sunriseVal.value=sunval.getTime();
        }
        else {
            sunriseVal.value="";
        }
    }
    var sunsetVal = $('editForm:approvalSunset');
    if(sunsetVal) {
        if(sunset.getValue()) {
            var setval = sunset.getValue();
            setval.setHours(me.form.sunsetHour);
            setval.setMinutes(me.form.sunsetMin);
            sunsetVal.value=setval.getTime();
        } else {
            sunsetVal.value="";
        }
        
    }
    var hiddenId = $('editForm:approvalId');
    
        hiddenId.value=me.roleId;
        
        $('editForm:updateActivationDates').click();
    
    
}

function setButtonsDisabled(newDisabledVal){

    var completeButton = $('editForm:completeStub');
    var saveButton = $('editForm:saveStub');

    if(completeButton){
        completeButton.disabled = newDisabledVal;
    }
    if(saveButton){
        saveButton.disabled = newDisabledVal;
    }
}
//Determine if form is complete, disable buttons if appropriate, and click the correct hidden button
function checkDisableClick(btn, submit){

    setButtonsDisabled(true);

    //if submit is defined as true we know to check form for completion
    if(!!submit){
        if(!checkBeforeComplete()){
            setButtonsDisabled(false);
        }
    } else {
        $(btn).click();
    }
    
}

