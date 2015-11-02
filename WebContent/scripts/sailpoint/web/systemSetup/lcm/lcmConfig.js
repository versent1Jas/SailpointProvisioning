/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */


Ext.define('SailPoint.systemSetup.lcm.TabPanel', {
	extend : 'Ext.tab.Panel',

    /**
     * This array holds any AJAX-based validators that need to run before the panel is saved.
     * Each validator in the array is an object in this form:
     *     {method: <Function>, args: <Object>}
     * The method is expected to make an AJAX-based request for server-side validation.
     * Upon completion the request should update the tabPanel's errors and warnings if necessary and call
     * tabPanel.finalizeSave() to either run the next pending validator complete the process of saving.
     */
    pendingValidators: [],

    /**
     * The total number of pendingValidators that have been added.
     */
    totalValidators: 0,

    /**
     * This is true when there are warnings but the user chooses to save anyway.
     */
    forceSave: false,
    
    errors: [],
    warnings: [],


    initComponent: function() {
        var buttonPanel = this;
        
        this.bbar = new Ext.ux.StatusBar({
            id: 'editorStatusBar',
            statusAlign: 'right',
            cls: 'lcmEditorStatusBar',
            items:[{ 
                cls: 'primaryBtn',
                text: '#{msgs.button_save}',
                handler: function(button, e) {
                    buttonPanel.save(); 
                } 
            },{
                text: '#{msgs.button_cancel}',
                cls: 'secondaryBtn',
                handler: function(button, e) {
                    buttonPanel.cancel();
                }
            }]
        });
        
        SailPoint.systemSetup.lcm.TabPanel.superclass.initComponent.apply(this, arguments);
    },
    
    /**
     * Add a validator to run server-side when attempting to save.
     * 
     * @param validatorCfg {object}  A config object with the following
     *     properties - {method: <Function>, args: <Object>}.
     */
    addPendingValidator: function(validatorCfg) {
        this.pendingValidators.push(validatorCfg);
        this.totalValidators++;
    },
    
    /**
     * Return whether this TabPanel has any errors or warnings.
     */
    hasErrorsOrWarnings: function() {
        return ((this.errors.length > 0) || (this.warnings.length > 0));
    },

    /**
     * Return true if this TabPanel has warnings but no errors
     */
    hasOnlyWarnings: function() {
        return ((this.errors.length === 0) && (this.warnings.length > 0));
    },

    /**
     * Validate all LCM configuration, saving any errors and warnings to this
     * TabPanel.
     * 
     * @return {boolean} True if there are no errors or warnings.
     */
    validate: function() {
        var tabPanel = this;
        this.errors = [];
        this.warnings = [];

        // Call save for every tab if needed
        this.items.each(function(item, index, length) {
            if (item.validate) {
                item.validate(tabPanel.errors, tabPanel.warnings);
            }
        });
        
        return !this.hasErrorsOrWarnings();
    }, 
    
    /**
     * Ideally this function would save everything, but, alas we have to validate the rules server-side so we have
     * to wait for that to complete before we can finish saving.  For that reason this method only initiates the saving
     * process.  The process won't complete until the #finalizeSave method is called
     */
    save: function() {
        var tabPanel = this;
        var isValid = tabPanel.validate();
        if (isValid) {
            tabPanel.finalizeSave();
        } else {
            tabPanel.showErrorMessage();
        }
    },

    /**
     * Run the next pending validator (if any are left), or save/show errors
     * if no pending validators are left. 
     */
    finalizeSave: function() {
        
        // Only finish saving if there are no more pending validators.
        if (!this.runNextPendingValidator()) {

            // Hide the error messages if these are still being displayed.
            if (Ext.MessageBox.isVisible()) {
                Ext.MessageBox.hide();
            }

            // Save if there are no errors/warnings OR there are only warnings
            // and this is a forcedSave.
            var noProblems = !this.hasErrorsOrWarnings();
            var forceWarnings = this.forceSave && this.hasOnlyWarnings();
            if (noProblems || forceWarnings) {
                this.saveInternal();
            } else {
                this.showErrorMessage();

                // Reset the panel for the next validation attempt
                this.totalValidators = 0;
                this.errors = [];
                this.warnings = [];
            }
        }
    },

    /**
     * Run the next pending validator if any are left.
     * 
     * @return {boolean} True if a validator was run, false otherwise.
     */
    runNextPendingValidator: function() {
        var currentValidator;
        var remainingValidators;
        var progress;
        var progressText;
        var percentComplete;

        if (this.pendingValidators.length > 0) {
            remainingValidators = this.pendingValidators.length;
            currentValidator = this.pendingValidators.shift();
            Ext.MessageBox.progress('#{msgs.lcm_config_title_validating_templates}', '#{msgs.lcm_config_validating_templates}');
            progress = this.totalValidators - remainingValidators;
            percentComplete = progress / this.totalValidators;
            progressText = progress + '/' + this.totalValidators;
            Ext.MessageBox.updateProgress(percentComplete, progressText);
            currentValidator.method.apply(this, currentValidator.args);
            return true;
        }
        return false;
    },

    /**
     * Save the content of each panel and click the save button.
     */
    saveInternal: function() {
        // Let each tab save its data.
        this.items.each(function(item, index, length) {
            if (item.save) {
                item.save();
            }
        });

        // Click the save button to send to the server.
        $('lcmConfigForm:saveButton').click();                
    },

    /**
     * Display the error/warning dialog.
     */
    showErrorMessage: function() {
        var tabPanel = this;
        var onlyWarnings = this.hasOnlyWarnings();
        var errors = '',
            warnings = '';
        if (this.errors.length > 0) {
            errors = '<li>' + this.errors.join('</li><li>') + '</li>';
        }
        if (this.warnings.length > 0) {
            warnings = '<li>' + this.warnings.join('</li><li>') + '</li>';
        }
        var errorMsg = (onlyWarnings) ? '#{msgs.lcm_config_save_warning}'
                                      : '#{msgs.lcm_config_save_failed}';

        var msg = 
            '<div>' + errorMsg + '</div>' +
            '<div style="margin-left:30px">' +
            '  <ul style="list-style: disc outside none">' +
                 errors +
                 warnings +
            '  </ul>' +
            '</div>';

        // Show either an error popup or a warning popup that allows saving
        // even though there are errors.
        Ext.MessageBox.show({
            title: (onlyWarnings) ? '#{msgs.warning_dialog_title}' : '#{msgs.err_dialog_title}',
            msg: msg,
            buttons: (onlyWarnings) ? Ext.MessageBox.OKCANCEL : Ext.MessageBox.OK,
            icon: (onlyWarnings) ? Ext.MessageBox.WARNING : Ext.MessageBox.ERROR,
            fn: function(buttonId, text, opt) {
                // If there were only warnings and they selected to save anyway,
                // go ahead and save.
                if (onlyWarnings && ('ok' === buttonId)) {
                    tabPanel.forceSave = true;
                    tabPanel.finalizeSave();                
                }
                else {
                    tabPanel.forceSave = false;
                }
            }
        });
    },
    
    cancel: function() {
        $('lcmConfigForm:cancelButton').click();
    }
});

SailPoint.systemSetup.lcm.getTabPanel = function(config, addtAcctApps, acctOnlyApps, disableAutoRefAcctApps) {
    
    // Create a blank config if we don't already have one
    if (!config) {
        config = {};
    }
    
    Ext.applyIf(config, {
        id: 'lcmConfigTabPanel',
        border: false,
        plain: true,
        layoutOnTabChange: true,
        deferredRender: true,
        autoScroll: false,
        items: [
            SailPoint.systemSetup.lcm.getActionsPanel({
                id: 'lifecycleActionsPanel', 
                title: '#{lcm_config_lifecycle_actions}',
                autoScroll: true
            }),
            SailPoint.systemSetup.lcm.getBusinessProcessesPanel({
                id: 'businessProcessesPanel', 
                title: '#{lcm_config_business_processes}',
                layout: 'fit',
                autoScroll: true
            }),
            SailPoint.systemSetup.lcm.getAdditionalOptionsPanel({
                id: 'additionalOptionsPanel', 
                title: '#{lcm_config_additional_options}',
                layout: 'fit',
                autoScroll: true
            }, addtAcctApps, acctOnlyApps, disableAutoRefAcctApps)
        ],
        activeTab: 'lifecycleActionsPanel'
    });

    return Ext.create('SailPoint.systemSetup.lcm.TabPanel', config);
};

SailPoint.systemSetup.lcm.initTabPanel = function(addtAcctApps, acctOnlyApps, disableAutoRefAcctApps) {
    var tabPanel = SailPoint.systemSetup.lcm.getTabPanel({region: 'center'}, addtAcctApps, acctOnlyApps, disableAutoRefAcctApps);
    tabPanel.on('tabchange', function(tabPanel, newCard, oldCard, eOpts) {
        if (newCard.id === 'additionalOptionsPanel') {
            Ext.getCmp(SailPoint.systemSetup.lcm.ADDITIONAL_ACCOUNT_APPS_COMPONENT).show();
            Ext.getCmp(SailPoint.systemSetup.lcm.ACCOUNT_ONLY_APPS_COMPONENT).show();
            Ext.getCmp(SailPoint.systemSetup.lcm.DISABLE_AUTO_REFRESH_ACCOUNT_STATUS_APPS_COMPONENT).show();
        }
    });
    
    var viewport = SailPoint.getViewport({
        bodyContent: tabPanel,
        title: '#{msgs.menu_label_lifecycle_manager_config}',
        minWidth: 600,
        wrappingForm: 'lcmConfigForm'
    }); 

    Ext.getCmp('lifecycleActionsPanel').load();    
};
