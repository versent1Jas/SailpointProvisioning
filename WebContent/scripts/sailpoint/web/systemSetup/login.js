/* (c) Copyright 2010 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.SystemSetup');

/**
 * A static class with helper functions for the Login Configuration page.
 */
SailPoint.SystemSetup.Login = {

    isPageDirty: false,
    
    initializePage: function(activeTab, isLcmEnabled) {

        var submitter = new SailPoint.SubmitOnEnter('configForm:validateButton');

        // Register all of the questions ... these don't have IDs so just search.
        var questions = Ext.DomQuery.select('.authQuestion', 'configForm:questionsPanel');
        for (var i=0; i<questions.length; i++) {
            submitter.registerTextField(questions[i]);
        }

        // Register the other LCM config text fields if necessary
        if (isLcmEnabled) {
            submitter.registerTextField('configForm:numQuestionsForAuthn');
            submitter.registerTextField('configForm:numAnswersRequired');
            submitter.registerTextField('configForm:maxAuthQuestionFailures');
            submitter.registerTextField('configForm:authQuestionLockoutDurationMinutes');
        }
        
        var tabContainer = Ext.get('loginTabs');
        if (tabContainer == null) 
            return;
      
        //Set height directly on this panel because tab panel cuts off bottom for some reason: PH 02/10/2012, MT 08/14/13
        var tabItems = [{title: '#{msgs.login_conf_tab_login}', contentEl: 'loginPanelContent', id: 'loginPanel', height: this.getLoginPanelHeight()}];
        if (isLcmEnabled) {
            tabItems.push({title: '#{msgs.login_conf_tab_pass_reset}', id: 'passResetPanel', contentEl: 'passResetPanelContent'});
        }

        tabItems.push({title: '#{msgs.sso_config}', id: 'ssoConfigPanel', contentEl: 'ssoConfigPanelContent'});
        
        var tabPanel = new Ext.TabPanel({
            id: 'loginTabPanel',
            renderTo:'loginTabs',
            border:false,
            plain: true,
            activeTab: parseInt(activeTab),
            width: $('loginTabs').clientWidth,
            items: tabItems
        });
    },
    
    makePageDirty: function() {
        SailPoint.SystemSetup.Login.isPageDirty = true;
    },

    showTabPane: function(id, index) {
        displayAppropriatePane(id, 'button'+index);
        $('configForm:activeTab').value = index;
    },
    
    /*
     * Handles copying Ext component fields to the backing hidden fields. 
     */
    persist: function() {
        var identityAttExt = Ext.getCmp(SailPoint.SystemSetup.Login.phoneAttributeId), 
            phoneAttHidden = $('configForm:phoneAttributeHidden');
        
        if (phoneAttHidden && identityAttExt) {
            phoneAttHidden.value = identityAttExt.getValue();
        }
    },
    
    handleValidate: function() {
        var msgs = Ext.decode($('configForm:msgs').value);
        var warnings = msgs.warnings;
        var errors = msgs.errors;

        var pageErrors = Ext.DomQuery.select('li', 'errorPanel');
        var hasPageErrors = ((null != pageErrors) && (pageErrors.length > 0));
        
        // Present popup if there are warnings but no errors.
        if ((warnings.length > 0) && (errors.length === 0) && !hasPageErrors) {
            var msg = '#{msgs.login_conf_warning_msg}<br/><br/><ul>';
            for (var i=0; i<warnings.length; i++) {
                msg += '<li>' + warnings[i] + '</li>';
            }
            msg += "</ul>";

            Ext.MessageBox.show({
                title: '#{msgs.login_conf_warning_title}',
                msg: msg,
                buttons: Ext.MessageBox.OKCANCEL,
                icon: Ext.MessageBox.WARNING,
                fn: function(btnId) {
                        if ('ok' === btnId) {
                            $('configForm:stealthSaveButton').click();
                        }
                    }
            });
        }
        else if ((errors.length === 0) && !hasPageErrors) {
            // If there are no errors or warnings, save.
            $('configForm:stealthSaveButton').click();
        }
    },
    
    /* For some reason this panel isn't getting it's height updated automatically, so 
    calculate the height directly */
    updateLoginPanel: function() {
        var loginPanel = Ext.getCmp('loginPanel');
        if (loginPanel) {
            loginPanel.setHeight(this.getLoginPanelHeight());
            loginPanel.doLayout();
        }
    },
    
    /* Get the expected height of the login panel */
    getLoginPanelHeight: function() {
        var lockoutCheckbox = $('configForm:enablelockout');
        return (lockoutCheckbox && lockoutCheckbox.checked) ? 506 : 422;
    },

    
    ////////////////////////////////////////////////////////////////////////////
    //
    // AUTH QUESTIONS
    //
    ////////////////////////////////////////////////////////////////////////////
    
    addQuestion: function(questionId) {
        SailPoint.SystemSetup.Login.doQuestionAction(questionId, 'addQuestionBtn');
    },

    removeQuestion: function(questionId) {
        SailPoint.SystemSetup.Login.doQuestionAction(questionId, 'removeQuestionBtn');
    },

    doQuestionAction: function(questionId, btnName) {
        $('configForm:selectedQuestionId').value = questionId;
        $('configForm:' + btnName).click();
        SailPoint.SystemSetup.Login.makePageDirty();
    },

    enableOrDisableLockoutDuration: function() {
        var maxFailsVal = $('configForm:maxAuthQuestionFailures').value;
        var maxFails = parseInt(maxFailsVal);
        var disable = (!isNaN(maxFails) && (maxFails < 1));
        $('configForm:authQuestionLockoutDurationMinutes').disabled = disable;
    },
    
    updatePassResetPanel: function() {
        var passResetPanel = Ext.getCmp('passResetPanel');
        if (passResetPanel) {
            passResetPanel.doLayout();
        }
    },
    
    ////////////////////////////////////////////////////////////////////////////
    //
    // SMS RESET
    //
    ////////////////////////////////////////////////////////////////////////////
    phoneAttributeId: 'phoneAttributeCmp', 
    phoneAttHiddenId: 'configForm:phoneAttributeHidden',
    
    initializeSMSReset: function() {
        var identityAttExt = Ext.getCmp(SailPoint.SystemSetup.Login.phoneAttributeId), 
            phoneAttHidden = $('configForm:phoneAttributeHidden');
        
        if (!identityAttExt) {
            identityAttExt = Ext.create('SailPoint.IdentityAttributeSuggest', {
                id: SailPoint.SystemSetup.Login.phoneAttributeId,
                renderTo: 'phoneAttributeDiv',
                width: 131,
                emptyText: '#{msgs.select_identity_attr}',
                labelSeparator: '',
                filterSystem: true
            });
        }
        
        // now init the fields with the values
        if (phoneAttHidden) {
            identityAttExt.loadValueByName(phoneAttHidden.value);
        }
        
    },

    resizeTextArea : function(expand) {
        var ta = Ext.get("configForm:idpPublicKey");
        if(ta) {
            if(expand) {
                ta.addCls('expandedTextArea');
            } else {
                ta.removeCls('expandedTextArea');
            }
            this.updateLoginPanel();
        }
    },

    handleRuleBasedToggle : function(checked) {
        if(!checked) {
            var sr = Ext.getDom('configForm:ssoRule'),
                svr = Ext.getDom('configForm:ssoValidationRule');

            if(sr) {
                SailPoint.Utils.setValueInSelect(sr, "");
            }
            if(svr) {
                SailPoint.Utils.setValueInSelect(svr, "");
            }
            SailPoint.SystemSetup.Login.makePageDirty();
        }
    }
    
};
