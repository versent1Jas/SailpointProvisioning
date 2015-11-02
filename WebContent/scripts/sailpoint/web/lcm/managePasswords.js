/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.LCM.ManagePasswords');

////////////////////////////////////////////////////////////////////////////////
//
// CONSTANTS
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.LCM.ManagePasswords.PASSWORD_TYPE_CURRENT = 'current';
SailPoint.LCM.ManagePasswords.PASSWORD_TYPE_NEW = 'new';
SailPoint.LCM.ManagePasswords.PASSWORD_TYPE_CONFIRM = 'confirm';


////////////////////////////////////////////////////////////////////////////////
//
// FIELDS
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.LCM.ManagePasswords.identityId = null;
SailPoint.LCM.ManagePasswords.currentRequests = null;
SailPoint.LCM.ManagePasswords.accountsGrid = null;
SailPoint.LCM.ManagePasswords.rowExpander = null;
SailPoint.LCM.ManagePasswords.passwordMap = null;
SailPoint.LCM.ManagePasswords.selfService = null;


////////////////////////////////////////////////////////////////////////////////
//
// GRID
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.LCM.ManagePasswords.initializePage = function(gridMetaData, currentIdentity, currentRequests, selfService, generate) {

    SailPoint.LCM.ManagePasswords.selfService = selfService;

    // initialize empty password map
    // we use this to save the password values between
    // row expand and collapses. we need to set lazyRender to true
    // for IE and this causes the values to be lost when the
    // row expander expands/collapses. 
    SailPoint.LCM.ManagePasswords.passwordMap = {};

    SailPoint.LCM.ManagePasswords.identityId = currentIdentity;
    SailPoint.LCM.ManagePasswords.currentRequests = currentRequests;

    var store = SailPoint.Store.createRestStore({
        fields: gridMetaData.fields,
        autoLoad: false,
        url: SailPoint.getRelativeUrl('/rest/identities/' + SailPoint.Utils.encodeRestUriComponent(currentIdentity) + '/links/managePasswordsGrid'),
        remoteSort: true,
        listeners : {
            load : SailPoint.LCM.ManagePasswords.renderCurrentRequests
        }
    });

    SailPoint.LCM.ManagePasswords.accountsGrid = new SailPoint.grid.PagingCheckboxGrid({
        store: store,
        id: 'managePasswordsGrid',
        renderTo : 'managePasswordsContainer',
        columns: gridMetaData.columns,
        width: $('managePasswordsContainer').clientWidth,
        selType : 'checkmultiselmodel',
        selModel: {
            selectMessageBox: Ext.getDom('selectedCount'),
            checkOnly: true,
            selectionMode: 'SIMPLE',
            listeners : {
                selectionchange : SailPoint.LCM.ManagePasswords.syncExpanderToSelectionModel
            }
        },
        pageSize: 10,
        usePageSizePlugin: true,
        plugins: [{
            ptype: 'sprowexpander',
            pluginId: 'managePasswordsRowExpander',
            expandOnClick: false,
            expandOnDblClick: false,
            expandOnEnter: false,
            rowBodyTpl: '<div style="padding-bottom:10px;padding-top: 15px;padding-left: 25px">' +
            '  <table class="spDataTable" style="width: 5%; table-layout: auto;">' +
            '    <tr class="currentPasswordField"><td class="titleColumn" style="vertical-align:middle;">' + '#{msgs.lcm_manage_passwords_current_password}' + ':</td><td><input id="oldPassword" onkeyup="" onkeydown="SailPoint.LCM.ManagePasswords.cancelBubbleIfEnteringPassword(event)" onfocus="this.select();" class="managePasswordsGridInput" name="{id}_' + SailPoint.LCM.ManagePasswords.PASSWORD_TYPE_CURRENT + '" type="password" /></td></tr>' +
            '    <tr class="manualPasswordField"><td class="titleColumn" style="vertical-align:middle;">' + '#{msgs.lcm_manage_passwords_new_password}' + ':</td><td><input id="newPassword" onkeyup="" onkeydown="SailPoint.LCM.ManagePasswords.cancelBubbleIfEnteringPassword(event)" onfocus="this.select();" class="managePasswordsGridInput" name="{id}_' + SailPoint.LCM.ManagePasswords.PASSWORD_TYPE_NEW + '" type="password" /></td></tr>' +
            '    <tr class="manualPasswordField"><td class="titleColumn" style="vertical-align:middle;">' + '#{msgs.lcm_manage_passwords_confirm_password}' + ':</td><td><input id="confirmNewPassword" onkeyup="" onkeydown="SailPoint.LCM.ManagePasswords.cancelBubbleIfEnteringPassword(event)" onfocus="this.select();" class="managePasswordsGridInput" name="{id}_' + SailPoint.LCM.ManagePasswords.PASSWORD_TYPE_CONFIRM + '" type="password" /></td></tr>' +
            '  </table>' +
            '</div>'
        }],
        viewConfig : {stripeRows: true},
        hideIfEmptyColumns: 'instance'
    });

    
    SailPoint.LCM.ManagePasswords.rowExpander = SailPoint.LCM.ManagePasswords.accountsGrid.getPlugin('managePasswordsRowExpander');
    
    SailPoint.LCM.AccountsGridSupport.addGridListeners(SailPoint.LCM.ManagePasswords.accountsGrid);

    var grid = SailPoint.LCM.ManagePasswords.accountsGrid;
    grid.initialLoad();
    // unregister this listener so that we can use the
    // arrow keys (special keys) within the input fields
    grid.getEl().un(Ext.isIE || (Ext.isWebKit && !Ext.isSafari2) ? "keydown" : "keypress", grid.getSelectionModel().handleKeyDown, grid.getSelectionModel());

    // Now, select the appropriate set/generate radio.
    SailPoint.LCM.ManagePasswords.selectGenerateRadio(generate);
};

SailPoint.LCM.ManagePasswords.submitOnEnter = function() {
    var submitOnEnter = new SailPoint.SubmitOnEnter('submitBtn');
    var textFields = Ext.DomQuery.select('input[type=password]');
    textFields.each(function (textField) {
      submitOnEnter.registerTextField(textField);
    });
};

SailPoint.LCM.ManagePasswords.buildTooltips = function() {
    var images = Ext.DomQuery.select('img[id*=imgHlp]'),
        tip, i;

    // Re-initialize and setup with tablet support.
    Ext.QuickTips.destroy();
    Ext.QuickTips.init(false, {
        className: 'SailPoint.QuickTip',
        showDelay: 500,
        targetGridCell: SailPoint.Platform.isMobile(),
        showOnTouch: SailPoint.Platform.isMobile()
    });

    for (i = 0; i<images.length; i++) {
        tip = images[i].alt;
        Ext.QuickTips.register({
            target: images[i],
            text: tip,
            title: '#{msgs.lcm_manage_passwords_password_constraints}',
            width: 400
        });
    }
};

SailPoint.LCM.ManagePasswords.renderCurrentRequests = function() {
    var currentRequests = SailPoint.LCM.ManagePasswords.currentRequests;
    var store = SailPoint.LCM.ManagePasswords.accountsGrid.getStore();
    var sm = SailPoint.LCM.ManagePasswords.accountsGrid.getSelectionModel();

    // register enter key submit
    SailPoint.LCM.ManagePasswords.submitOnEnter();

    // build tooltips here after grid loads
    SailPoint.LCM.ManagePasswords.buildTooltips();

    // if there is nothing to show let the user know.
    // since the user might have come here looking
    // to reset their IIQ password show the link for that.
    if (store.getTotalCount() == 0) {
        // nothing to show - hide the options
        var selectMethodContainer = $('passwordSelectMethodContainer');
        if (selectMethodContainer) {
          selectMethodContainer.hide();
        }
        Ext.getCmp('managePasswordsGrid').hide();
        var mesgDiv = $('noPasswordsContainer');
        var innerMsg = '#{msgs.lcm_manage_passwords_err_no_accounts}';
        mesgDiv.innerHTML = innerMsg;
        $('submitBtn').hide();
        return;
    }

    var isGenerate = SailPoint.LCM.ManagePasswords.isGenerate();
    var isSync = SailPoint.LCM.ManagePasswords.isSynchronize();
    if (currentRequests.length > 0) {
        for (var i=0;i<currentRequests.length; ++i) {
            var theReq = currentRequests[i];
            var record = store.getById(theReq.trackingId);
            var idx = store.indexOf(record);
            if (idx >= 0) {
                sm.select(record, true, true);

                if (!isGenerate && !isSync || SailPoint.LCM.ManagePasswords.selfService) {
                    SailPoint.LCM.ManagePasswords.rowExpander.expandRow(idx);

                    // set fields
                    var requests = theReq.attributeRequests;
                    var currentPwd, newPwd;
                    if (requests) {
                        for (var j=0; j<requests.length;++j) {
                            var attr = requests[j];
                            if (attr.name == 'password') {
                                newPwd = attr.valueXmlAttribute;
                            }
                            if (SailPoint.LCM.ManagePasswords.selfService && record.get('supports_current_password')) {
                                if (attr.args) {
                                    currentPwd = attr.args['currentPassword'];
                                }
                            }
                        }
                        var currentF = Ext.query('input[name=' + record.getId() + "_current" + ']')[0];
                        if (SailPoint.LCM.ManagePasswords.selfService && record.get('supports_current_password')) {
                            if (currentF)
                              currentF.value = currentPwd;
                        }
                        else {
                          if (currentF) {
                              Ext.get(currentF.parentNode.parentNode).setVisibilityMode(Ext.Element.DISPLAY);
                              Ext.get(currentF.parentNode.parentNode).hide();
                          }
                        }
                        // alert("current pwd: " + currentPwd);

                        var confirmF= Ext.query('input[name=' + record.getId() + "_confirm" + ']')[0];
                        confirmF.value = newPwd;
                        // alert("new pwd : " + newPwd);

                        var newF= Ext.query('input[name=' + record.getId() + "_new" + ']')[0];
                        newF.value = newPwd;
                    }
                }
            }
        }
    }
    var accIds = $('editForm:accountIds').value;
    var acctArray = stringToArray(accIds, true);
    for (var j=0;j<acctArray.length;++j) {
        record = store.getById(acctArray[j]);
        idx = store.indexOf(record);
        if (idx >= 0) {
            sm.select(record);
            SailPoint.LCM.ManagePasswords.rowExpander.expandRow(idx);
        }
    }

    if (isSync || isGenerate) {
      SailPoint.LCM.ManagePasswords.optionsChanged();
    }

    // update current password filed since it gets redrawn with page changes
    SailPoint.LCM.ManagePasswords.syncExpanderToSelectionModel();
};

//MEH 16749, disable bubbling of space bar up to grid selection when entering password info
SailPoint.LCM.ManagePasswords.cancelBubbleIfEnteringPassword = function(fe) {
  if(fe.keyCode == 32) {
    fe.cancelBubble=true;
  } else {
    fe.cancelBubble=false;
  }
};

SailPoint.LCM.ManagePasswords.syncExpanderToSelectionModel = function(me, row) {
    // Do nothing if the expander is disabled.
    if (SailPoint.LCM.ManagePasswords.rowExpander.disabled) {
        return;
    }

    if(typeof row == 'number'){
        var getViewRow = function(gridView, rowIndex) {
            var el = gridView.getEl();

            var gridRows = el.query('tr.x-grid-row');
            return gridRows[rowIndex];
        };
        row = getViewRow(this.grid.view, row);
    }
    
    // Expand/collapse each row based on whether it is selected.
    SailPoint.LCM.ManagePasswords.accountsGrid.getStore().each(function(record) {
        var idx = SailPoint.LCM.ManagePasswords.accountsGrid.getStore().indexOf(record);
        var rId = record.getId();

        var currentField = rId + "_current";
        var newField= rId + "_new";
        var confirmField= rId + "_confirm";

        // need to know whether we were previously expanded or not
        var rowCollapsed = SailPoint.LCM.ManagePasswords.rowExpander.isCollapsed(idx);

        if (SailPoint.LCM.ManagePasswords.accountsGrid.selModel.isSelected(record)) {
            if (rowCollapsed) {
                // Do not attempt to expand row if selfservice and does not support current password
                if(SailPoint.LCM.ManagePasswords.isSynchronize() &&
                    SailPoint.LCM.ManagePasswords.selfService &&
                    !record.get('supports_current_password')) {
                    return;
                }
                SailPoint.LCM.ManagePasswords.rowExpander.expandRow(idx);
                // Set focus 
                var newF = Ext.query('input[name=' + newField + ']')[0];
                var confirmF = Ext.query('input[name=' + confirmField + ']')[0];
                var currentF = Ext.query('input[name=' + currentField+ ']')[0];
                if (SailPoint.LCM.ManagePasswords.selfService && record.get('supports_current_password')) {
                    if (SailPoint.LCM.ManagePasswords.passwordMap[currentField]) {
                      currentF.value = SailPoint.LCM.ManagePasswords.passwordMap[currentField];
                    }
                    currentF.focus();
                }
                else {
                    if (currentF) {
                        Ext.get(currentF.parentNode.parentNode).setVisibilityMode(Ext.Element.DISPLAY);
                        Ext.get(currentF.parentNode.parentNode).hide();
                    }
                    newF.focus();
                }
                // restore values
                if (SailPoint.LCM.ManagePasswords.passwordMap[newField]) {
                    newF.value = SailPoint.LCM.ManagePasswords.passwordMap[newField];
                }
                if (SailPoint.LCM.ManagePasswords.passwordMap[confirmField]) {
                    confirmF.value = SailPoint.LCM.ManagePasswords.passwordMap[confirmField];
                }
            }
            SailPoint.LCM.ManagePasswords.updateManualPasswordFields(SailPoint.LCM.ManagePasswords.isGenerate(), SailPoint.LCM.ManagePasswords.isSynchronize());
        }
        else if (!rowCollapsed) { // not selected and expanded , need to collapse an expanded row
            if (SailPoint.LCM.ManagePasswords.selfService && record.get('supports_current_password')) {
                currentF = Ext.query('input[name=' + currentField+ ']')[0];
                SailPoint.LCM.ManagePasswords.passwordMap[currentField] = currentF.value;
            }
            newF = Ext.query('input[name=' + newField + ']')[0];
            confirmF = Ext.query('input[name=' + confirmField + ']')[0];
            if (newF != null) {
                SailPoint.LCM.ManagePasswords.passwordMap[newField] = newF.value;
            }
            if (confirmF != null) {
                SailPoint.LCM.ManagePasswords.passwordMap[confirmField] = confirmF.value;
            }
            SailPoint.LCM.ManagePasswords.rowExpander.collapseRow(idx);
        }
    });

};

SailPoint.LCM.ManagePasswords.expandAndRestore = function() {

    // Do nothing if the expander is disabled.
    if (SailPoint.LCM.ManagePasswords.rowExpander.disabled) {
        return;
    }

    // Expand/collapse each row based on whether it is selected.
    SailPoint.LCM.ManagePasswords.accountsGrid.getStore().each(function(record) {
        var idx = SailPoint.LCM.ManagePasswords.accountsGrid.getStore().indexOf(record);
        var rId = record.getId();

        var currentField = rId + "_current";
        var newField= rId + "_new";
        var confirmField= rId + "_confirm";

        if (SailPoint.LCM.ManagePasswords.accountsGrid.selModel.isSelected(record)) {
            SailPoint.LCM.ManagePasswords.rowExpander.expandRow(idx);
            // Set focus 
            var newF = Ext.query('input[name=' + newField + ']')[0];
            var confirmF = Ext.query('input[name=' + confirmField + ']')[0];
            var currentF = Ext.query('input[name=' + currentField+ ']')[0];
            if (SailPoint.LCM.ManagePasswords.selfService && record.get('supports_current_password')) {
                currentF.focus();
                currentF.value = SailPoint.LCM.ManagePasswords.passwordMap[currentField];
            }
            else {
                if (currentF) {
                  Ext.get(currentF.parentNode.parentNode).setVisibilityMode(Ext.Element.DISPLAY);
                  Ext.get(currentF.parentNode.parentNode).hide();
                }
                newF.focus();
            }
            // restore values
            if (SailPoint.LCM.ManagePasswords.passwordMap[newField]) {
                newF.value = SailPoint.LCM.ManagePasswords.passwordMap[newField];
            }
            if (SailPoint.LCM.ManagePasswords.passwordMap[confirmField]) {
                confirmF.value = SailPoint.LCM.ManagePasswords.passwordMap[confirmField];
            }

            SailPoint.LCM.ManagePasswords.updateManualPasswordFields(SailPoint.LCM.ManagePasswords.isGenerate(), SailPoint.LCM.ManagePasswords.isSynchronize());
        }
    });
};


////////////////////////////////////////////////////////////////////////////////
//
// FUNCTIONS
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.LCM.ManagePasswords.isGenerate = function() {
    var selected = getSelectedRadioInput('generateRadio');
    return (selected === 'true');
};

SailPoint.LCM.ManagePasswords.isSynchronize = function() {
    return $('editForm:syncCheckbox').checked;
};

SailPoint.LCM.ManagePasswords.selectGenerateRadio = function(generate) {
    // Select the appropriate radio based.
    var radioInputs = $(document.getElementsByName('generateRadio'));
    for (i=0; i<radioInputs.length; i++) {
        var inputElement = radioInputs.item(i);
        if (generate.toString() == inputElement.value) {
            inputElement.checked = true;
        }
    }
    
    // Now notify the UI.
    SailPoint.LCM.ManagePasswords.generatePasswordsSelected();
};

SailPoint.LCM.ManagePasswords.generatePasswordsSelected = function() {
    // Copy the value into the hidden JSF input.
    $('editForm:generate').value = getSelectedRadioInput('generateRadio');
    
    // Tweak the UI to sync up with the new options.
    SailPoint.LCM.ManagePasswords.optionsChanged();
};

SailPoint.LCM.ManagePasswords.synchronizeClicked = function() {
    SailPoint.LCM.ManagePasswords.optionsChanged();
};


SailPoint.LCM.ManagePasswords.updateManualPasswordFields = function(isGenerate, isSynchronize) {
    var rows = Ext.query('tr[class=manualPasswordField]');
    for (var i = 0; i < rows.length; ++i) {
        var row = rows[i];
        if (isGenerate || isSynchronize) {
            Ext.DomHelper.applyStyles(row, {display: 'none'});
        } else {
            Ext.DomHelper.applyStyles(row, {display: ''});
        }
    }
};

SailPoint.LCM.ManagePasswords.resetSyncOptions = function() {
    $('editForm:syncCheckbox').checked = false;
    $('editForm:syncPassword').value = '';
    $('editForm:syncConfirm').value = '';
};

SailPoint.LCM.ManagePasswords.optionsChanged = function() {
    var isGenerate = SailPoint.LCM.ManagePasswords.isGenerate();
    var isSync = SailPoint.LCM.ManagePasswords.isSynchronize();

    // Show/hide the sync passwords checkbox based on whether we're generating.
    $('synchronizePasswords')[(isGenerate) ? 'hide' : 'show']();

    // Only show the sync fields if sync'ing.
    $('syncFields')[(isSync) ? 'show' : 'hide']();

    // if generating then reset sync options
    if (isGenerate) {
        SailPoint.LCM.ManagePasswords.resetSyncOptions();
    }

    // Only show the generate fields if generating and not selfService.
    if(!SailPoint.LCM.ManagePasswords.selfService) {
      $('generateFields')[(isGenerate) ? 'show' : 'hide']();
    }

    if (!isGenerate && !isSync) {
        // Enable the row expander and sync state to checkbox model.
        SailPoint.LCM.ManagePasswords.rowExpander.enable();//disabled = false;
        SailPoint.LCM.ManagePasswords.expandAndRestore();
    }
    else {
        // Disable the RowExpander and collapse all rows that are expanded.
        if (SailPoint.LCM.ManagePasswords.selfService) {
            // don't disable it since we need to show the current password field
            SailPoint.LCM.ManagePasswords.rowExpander.enable();//disabled = false;
        }
        else {
            SailPoint.LCM.ManagePasswords.rowExpander.disable();//disabled = true;
        }

        var elts = SailPoint.LCM.ManagePasswords.accountsGrid.getView().getSelectionModel().getSelection();
        elts.each(function(record) {
            // check to see if the selected record is still part of the store.
            // when paging between accounts sometimes the select model
            // will refer to a record that is no longer part of the store and error out.
            var idx = SailPoint.LCM.ManagePasswords.accountsGrid.getStore().indexOf(record);
            if (idx < 0) {
               return;
            }
            var rId = record.getId();
            var newField= rId + "_new";
            var confirmField= rId + "_confirm";
            if (SailPoint.LCM.ManagePasswords.selfService && record.get('supports_current_password')) {
                var currentField = rId + "_current";
                var currentF = Ext.query('input[name=' + currentField+ ']')[0];
                SailPoint.LCM.ManagePasswords.passwordMap[currentField] = currentF.value;
            }
            var newF = Ext.query('input[name=' + newField + ']')[0];
            var confirmF = Ext.query('input[name=' + confirmField + ']')[0];
            if (newF != null) {
                SailPoint.LCM.ManagePasswords.passwordMap[newField] = newF.value;
            }
            if (confirmF != null) {
                SailPoint.LCM.ManagePasswords.passwordMap[confirmField] = confirmF.value;
            }

            if (SailPoint.LCM.ManagePasswords.selfService && record.get('supports_current_password')) {
                // don't collapse. hide the new and confirm password fields
                SailPoint.LCM.ManagePasswords.updateManualPasswordFields(SailPoint.LCM.ManagePasswords.isGenerate(), SailPoint.LCM.ManagePasswords.isSynchronize());
            }
            else {
                SailPoint.LCM.ManagePasswords.rowExpander.collapseRow(record);
            }
        });
    }
};


////////////////////////////////////////////////////////////////////////////////
//
//SUBMIT
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.LCM.ManagePasswords.copyAccountSelections = function() {
    var selModel = SailPoint.LCM.ManagePasswords.accountsGrid.selModel;

    if(!selModel.isAllSelected() && selModel.getSelectedIds().length < 1) {
        Ext.MessageBox.alert('#{msgs.lcm_manage_passwords_err_select_account_title}',
                             '#{msgs.lcm_manage_passwords_err_select_account_body}');
        return false;
    }
    else {
        var selections = (selModel.isAllSelected()) ? selModel.getExcludedIds()
                                                    : selModel.getSelectedIds();

        $('editForm:accountIds').value = arrayToString(selections, false);
        $('editForm:selectAllAccounts').value = selModel.isAllSelected();
        return true;
    }
};

SailPoint.LCM.ManagePasswords.populateSyncHelpBubble = function(field) {
    var selModel = SailPoint.LCM.ManagePasswords.accountsGrid.selModel,
        selections = [],
        url,
        identity;

    if(SailPoint.LCM.ManagePasswords.syncToolTip) {
        SailPoint.LCM.ManagePasswords.syncToolTip.destroy();
    }

    if(selModel.isAllSelected()) {
        selections = selModel.getExcludedIds();
        identity = SailPoint.LCM.ManagePasswords.identityId;
        url = SailPoint.CONTEXT_PATH + '/rest/passwordPolicy/mergeAllConstraints';
    } else if(selModel.getSelectedIds().length > 0) {
        selections = selModel.getSelectedIds();
        url = SailPoint.CONTEXT_PATH + '/rest/passwordPolicy/mergeConstraints';
    } else {
        return;
    }

    Ext.Ajax.request({
        url: url,
        params: {
            identity: identity,
            accountIds: Ext.encode(selections)
        },
        success: function(response) {
            var respObj = Ext.decode(response.responseText),
                constraints = respObj.object ? respObj.object : [],
                tipBody = '',
                i = 0;

            for( i = 0; i < constraints.length; i++ ) {
                tipBody += '<p>' + constraints[i] + '</p>';
            }

            SailPoint.LCM.ManagePasswords.syncToolTip = new Ext.tip.ToolTip( {
                target: field,
                title: '#{msgs.lcm_manage_passwords_password_constraints}',
                html: tipBody,
                anchor: 'left',
                floating: true,
                autoShow: true,
                autoHide: true
            });
        }
    });
};

SailPoint.LCM.ManagePasswords.validate = function() {
    
    var validationSucceeded = true;
    var errors = [];
    // Not sync'ing or generating - package up the account requests.
    if (!SailPoint.LCM.ManagePasswords.isGenerate() &&
        !SailPoint.LCM.ManagePasswords.isSynchronize()) {
        
        // TODO: Check for no changes or not matching password/confirm.
        // Go through all selected rows

        SailPoint.LCM.ManagePasswords.accountsGrid.getStore().each(function(record) {
            var idx = SailPoint.LCM.ManagePasswords.accountsGrid.getStore().indexOf(record);
            if (SailPoint.LCM.ManagePasswords.accountsGrid.selModel.isSelected(record)) {
                // for each selected record 
                // 1. check that current password is not empty
                var appName = record.get('application-name');
                var current = (record.getId()) + "_current";
                var neww = (record.getId()) + "_new";
                var confurm  = (record.getId()) + "_confirm";
                var currentF = Ext.query('input[name=' + current + ']')[0];
                var newF = Ext.query('input[name=' + neww + ']')[0];
                var confirmF = Ext.query('input[name=' + confurm+ ']')[0];

                var rowEl = currentF.parentNode.parentNode;

                if (rowEl.style.display != 'none' && (currentF.value == null || currentF.value.length == 0)) {
                    errors[errors.length] = "#{msgs.lcm_manage_passwords_err_current_password_empty} " + appName;
                }

                if (newF.value == null || newF.value.length == 0) {
                    errors[errors.length] = "#{msgs.lcm_manage_passwords_err_new_password_empty} " + appName;
                }

                if (confirmF.value == null || confirmF.value.length == 0) {
                    errors[errors.length] = "#{msgs.lcm_manage_passwords_err_confirm_password_empty} " + appName;
                }

                if (confirmF.value != newF.value) {
                    errors[errors.length] = "#{msgs.lcm_manage_passwords_err_passwords_dont_match} " + appName;
                }

            }
        });
        if (errors.length == 0) {
            // If all good, package account requests to be submitted.
            var requests = SailPoint.LCM.ManagePasswords.getGridRequests();
            $('editForm:requestsJSON').value = Ext.JSON.encode(requests);
        }

    }
    else if (!SailPoint.LCM.ManagePasswords.isGenerate() && SailPoint.LCM.ManagePasswords.isSynchronize()) {
        var syncPass = $('editForm:syncPassword').value;
        var syncConfirm = $('editForm:syncConfirm').value;

        if (syncPass == null || syncPass.length == 0) {
          errors[errors.length] = Ext.String.format('#{msgs.lcm_manage_passwords_account_err_format}', '#{msgs.lcm_manage_passwords_err_new_password_empty}');
        }

        if (syncConfirm == null || syncConfirm.length == 0) {
          errors[errors.length] = Ext.String.format('#{msgs.lcm_manage_passwords_account_err_format}', '#{msgs.lcm_manage_passwords_err_confirm_password_empty}');
        }

        if (syncPass != syncConfirm) {
          errors[errors.length] = Ext.String.format('#{msgs.lcm_manage_passwords_account_err_format}', '#{msgs.lcm_manage_passwords_err_passwords_dont_match}');
        }

        // when self service make sure current password is provided
        if (SailPoint.LCM.ManagePasswords.selfService) {
            // Set current passwords
            var cpwdsArr = new Hash();

            SailPoint.LCM.ManagePasswords.accountsGrid.getStore().each(function(record) {
                var idx = SailPoint.LCM.ManagePasswords.accountsGrid.getStore().indexOf(record);
                if (record.get('supports_current_password') && SailPoint.LCM.ManagePasswords.accountsGrid.selModel.isSelected(record)) {
                    // for each selected record 
                    // 1. check that current password is not empty
                    var appName = record.get('application-name');
                    var current = (record.getId()) + "_current";
                    var currentF = Ext.query('input[name=' + current + ']')[0];

                    var rowEl = currentF.parentNode.parentNode;

                    if (rowEl.style.display != 'none' && (currentF.value == null || currentF.value.length == 0)) {
                        errors[errors.length] = "#{msgs.lcm_manage_passwords_err_current_password_empty} " + appName;
                    }
                    else {
                        cpwdsArr[record.getId()] = currentF.value;
                    }
                }
            });

            $('editForm:currentPwds').value = hashToMapString(cpwdsArr); 
        }

    }

    var selModel = SailPoint.LCM.ManagePasswords.accountsGrid.selModel;

    if(!selModel.isAllSelected() && selModel.getSelectedIds().length < 1) {
      errors[errors.length] = "#{msgs.lcm_manage_passwords_err_select_account_body}";
    }

    if (errors.length == 0) {
        // If all good, package account requests to be submitted.
        SailPoint.LCM.ManagePasswords.copyAccountSelections();
        var errorDiv = $(document.getElementById('errorMessages'));
        errorDiv.innerHTML = '';
        $('editForm:validateAjBtn').click();
        return true;
    }
    else {
        var errorTable = "<ul>";
        for (var i=0;i < errors.length; ++i) {
            // show errors
            errorTable += '<li class="formError">' + errors[i] + "</li>";
        }
        errorTable += "</ul>";

        var errorDiv = $(document.getElementById('errorMessages'));
        errorDiv.innerHTML = errorTable;
        if (errorDiv.style.display == 'none') {
            var serverErrs = $(document.getElementById('editForm:serverErrors'));
            serverErrs.hide();
            errorDiv.show();
        }
        return false;
    }
};

SailPoint.LCM.ManagePasswords.getGridInputs = function() {
    return Ext.DomQuery.select(".managePasswordsGridInput");
};

SailPoint.LCM.ManagePasswords.getGridRequests = function() {

    // make sure we only get the values for selected accounts
    var selModel = SailPoint.LCM.ManagePasswords.accountsGrid.selModel;
    var ids = selModel.getSelectedIds();
    var isAllSelected = selModel.isAllSelected();

    // Create a mapping from link ID to an object that contains the password
    // values for any grid row that has values.
    var changedPasswordsById = {};
    var inputs = SailPoint.LCM.ManagePasswords.getGridInputs();
    for (var i=0; i<inputs.length; i++) {
        var input = inputs[i];
        var val = input.value;
        if ((null != val) && (val.length > 0)) {
            var parts = input.name.split('_');
            var id = parts[0];
            var type = parts[1];

            if ((ids.indexOf(id) > -1) || isAllSelected) {
                var pwd = changedPasswordsById[id];
                if (null == pwd) {
                    pwd = {};
                    changedPasswordsById[id] = pwd;
                }
                pwd[type] = val;
            }
        }
    }

    var requests = [];
    $H(changedPasswordsById).each(function(pair) {
        var record = SailPoint.LCM.ManagePasswords.accountsGrid.getStore().getById( pair.key );
        var request = SailPoint.LCM.ManagePasswords.createAccountRequestFromRecord(pair.key, record, pair.value);
        
        requests.push(request);
    });

    return requests;
};

SailPoint.LCM.ManagePasswords.createAccountRequestFromRecord = function(id, record, pwd) {

    var request = new SailPoint.AccountRequest();
    request.application = record.get('application-name');
    request.instance = record.get('instance');
    request.nativeIdentity = record.get('nativeIdentity');
    request.operation = 'Modify';
    request.trackingId = id;
    request.targetIntegration = SailPoint.LCM.ManagePasswords.identityId;

    var attrReq = new SailPoint.AttributeRequest();
    attrReq.operation = 'Set';
    attrReq.name = 'password';
    attrReq.args['currentPassword']= pwd[SailPoint.LCM.ManagePasswords.PASSWORD_TYPE_CURRENT];
    attrReq.valueXmlAttribute = pwd[SailPoint.LCM.ManagePasswords.PASSWORD_TYPE_NEW];
    request.addAttribute(attrReq);
    
    return request;
};

////////////////////////////////////////////////////////////////////////////////
//
// Utility Function
//
////////////////////////////////////////////////////////////////////////////////
function tabNext(myField, evt) {
    var keycode;
    if (window.event) {
        keycode = window.event.keyCode;
    } else if (evt) { 
        keycode = evt.which;
    } else {
        return true;
    }

    if (keycode == 9) { // if is the tab key
        var fieldName = myField.name;
        var idx; 

        if ((idx = fieldName.indexOf("_current")) > 0) {
            fieldName = fieldName.substr(0,idx) + "_new"; 
        }
        else if ((idx = fieldName.indexOf("_new")) > 0) {
            fieldName = fieldName.substr(0,idx) + "_confirm"; 
        }
        else if ((idx = fieldName.indexOf("_confirm")) > 0) {
            fieldName = fieldName.substr(0,idx) + "_current"; 
            // check if we have a current field first
            var currentF = Ext.query('[name=' + fieldName + ']')[0];
            var rowEl = currentF.parentNode.parentNode;
            if (rowEl.style.display == 'none') {
                fieldName = fieldName.substr(0,idx) + "_new"; 
            }
        }

        var nextSib = Ext.query('[name=' + fieldName + ']')[0];
        nextSib.focus();
    }
}

////////////////////////////////////////////////////////////////////////////////
//
// Renderer
//
////////////////////////////////////////////////////////////////////////////////
SailPoint.LCM.ManagePasswords.linkPasswordPolicyRenderer = function(value, p, r) {
  var requirements = r.get('password_requirements');
  var rst = '';
  for (var i=0;i < requirements.length; ++i) {
    rst += '<p>' + requirements[i];
  }
  var src = SailPoint.getRelativeUrl('/images/icons/dashboard_help_16.png');
  return Ext.String.format('{0} <img class="passwordHlp" id="imgHlp_{1}" style="padding-left:10px" width="16" height="16" src="{2}" alt="{3}" title=""/>', value, value, src, rst);
};
