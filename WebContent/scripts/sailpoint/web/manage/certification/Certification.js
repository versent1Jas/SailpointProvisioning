/* (c) Copyright 2010 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.Manage.Certification');

/**
 * Encode the grid state into the form for the grid currently being displayed on
 * the certification page.
 */
SailPoint.Manage.Certification.encodeGridState = function() {
    var grid = SailPoint.Manage.Certification.getGrid();
    if (grid && grid.gridState) {
        grid.gridState.encodeGridState('editForm:');
    }
};

/**
 * Return the grid component currently being displayed on the certification
 * page.
 */
SailPoint.Manage.Certification.getGrid = function() {

    // Identity worksheet view.
    var grid = null;
    
    if (typeof SailPoint.IdentityItemsGrid !== 'undefined') {
        grid = Ext.getCmp(SailPoint.IdentityItemsGrid.GridID);
    }

    if (!grid) {
        // Identity and role membership entity list
        grid = Ext.getCmp('certEntityListGridState');
    }
    if (!grid) {
        grid = Ext.getCmp('certBusinessRoleMembershipListGridState');
    }
    if (!grid) {
        grid = Ext.getCmp('certBusinessRoleCompositionListGridState');
    }
    if (!grid) {
        grid = Ext.getCmp('certAccountGroupListGridState');
    }

    return grid;
};

/**
 * Show the window to rescind the certification with the given ID and merge back
 * into its parent.
 */
SailPoint.Manage.Certification.showRescindChildCertificationWindow = function(certId) {
    
    var windowUrl =
        CONTEXT_PATH + '/manage/certification/rescindChildCertificationWindow.jsf';

    SailPoint.confirm(
        {url: windowUrl, options: {method: 'post'}},
        { windowParameters: {className: 'sailpoint',
                             title: '#{msgs.cert_rescind_child_cert_title}',
                             width: 650},
          okLabel: '#{msgs.cert_rescind_child_cert_btn}',
          cancelLabel: "#{msgs.button_cancel}",
          ok:function(win) {
              $('editForm:certId').value = certId;
              $('editForm:rescindBtn').click();
              return false;
          },
          cancel: function(win) { return false; }
        }
    );
};

/**
 * Callback that checks for any error messages returned from rescinding certs.  If any are found, don't
 * close the info window so we can see the messages.
 */
SailPoint.Manage.Certification.afterRescindCheck = function() {
    var errorDiv = Ext.get('rescindErrors'),
        formError;

    if(errorDiv) {
        // search for an <li> element with an error class.  i.e. formError, formInfo, formWarn
        formError = errorDiv.select("li[class^=form]");
        if(!formError || !formError.elements.length) {
            // All clear, close window and update grids.
            SailPoint.Dialog.hide();
            SailPoint.Manage.Certification.afterRescindChildCertification();
        }
        else {
            // Hide progress spinner and resize window so we can see the messages.
            Ext.get('rescindingProgressDiv').hide();
            var okBtn = Ext.getCmp('spConfirmPanelOkButton');
            if (okBtn) {
                okBtn.setDisabled(true);
            }
            SailPoint.Dialog.updateLayout();
            SailPoint.Dialog.center();
        }
    }
};

/**
 * Callback used after the rescind operation is complete to reset the
 * certification UI.
 */
SailPoint.Manage.Certification.afterRescindChildCertification = function() {

    var grid = Ext.getCmp(SailPoint.WorksheetGridId);
    if (grid) {
        grid.deselectAll();
        refreshGrid(grid);
    }

    var entityGrid = Ext.getCmp(SailPoint.EntityGridId);
    if (entityGrid) {
        entityGrid.deselectAll();
        refreshGrid(entityGrid);
    }

    if ($('editForm:rerenderSummaryBtn'))
        $('editForm:rerenderSummaryBtn').click();
};


SailPoint.Manage.Certification.savedErrors = null;

/**
 * An a4j refresh can cause the JSF error messages to go away.  This function
 * can be called from an a4j commandButtons onclick to save the errors before a
 * refresh.  The oncomplete can call restoreErrors() to make these stick around.
 */
SailPoint.Manage.Certification.saveErrors = function() {
    SailPoint.Manage.Certification.savedErrors = $('errorPanel').innerHTML;
};

/**
 * See saveErrors() for how this is used.
 */
SailPoint.Manage.Certification.restoreErrors = function() {
    if (SailPoint.Manage.Certification.savedErrors) {
        $('errorPanel').innerHTML = SailPoint.Manage.Certification.savedErrors;
    }
};

/**
 * When a bulk action is called and a pop-up is provided (namely, the reassign bulk action)
 * in a cert, certificationFilters.xhtml resetBtn.click is called and then
 * certification.xhtml rerenderSummaryBtn.click is called.  This can cause problems with user error
 * logging, causing some user messages not to show.  The reason for this is that rerenderSummaryBtn
 * uses SailPoint.Manage.Certification.saveErrors, which evaluates $('errorPanel').innerHTML, but if
 * restBtn (running asynchronously) has not completed yet, the errorPanel won't have rendered.
 * 
 * This method ensures that we are running resetBtn completely before rerenderSummaryBtn.
 */
SailPoint.Manage.Certification.resetBtnOnComplete = function() {
    if (SailPoint.Manage.Certification.tempResetBtnOnComplete)
        SailPoint.Manage.Certification.tempResetBtnOnComplete();
};

/**
 * Show the spinner in the given div.  We used to show the spinner over
 * one of the bulk certify buttons, but those can be disabled. So this
 * is intended to be used on whichever button is being pressed, since if
 * you can press the button, then it is visible.  It also makes more
 * sense from a user point of view.  Always show the spinner over the
 * button you pressed.
 */
SailPoint.Manage.Certification.showSpinner = function(div) {
    CertificationLoadingSpinner.display(div);
}


SailPoint.Manage.Certification.addEntitlementComment = function(certItemId, successFunc) {
    SailPoint.showAddCommentDlg(function(btn, text) {
        if (btn == 'ok'){
            var url = SailPoint.getRelativeUrl('/rest/certItem/'+certItemId+'/entitlementComment');
            Ext.Ajax.request({
                url: url,
                success: successFunc,
                failure: function(){
                    SailPoint.EXCEPTION_ALERT('Comment request failed');
                },
                params: {'comments':text}
            });
        }
    });
}
