/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.systemSetup', 'SailPoint.systemSetup.lcm');

SailPoint.systemSetup.lcm.SELECTOR_TYPES = {
    role: 'role',
    application: 'application',
    managedAttribute: 'managedAttribute'
};

SailPoint.systemSetup.lcm.getActionsPanel = function(config) {
    var lifecycleActionsPanel;
    
    if (!config) {
        config = {};
    }
    
    if (!config.id) {
        config.id = 'lifecycleActionsPanel';
    }
    
    
    
    lifecycleActionsPanel = new SailPoint.systemSetup.lcm.LifecycleActionsPanel(config);
    
    lifecycleActionsPanel.on('resize', lifecycleActionsPanel.setPaddedHeight);

    
    return lifecycleActionsPanel;
};

Ext.define('SailPoint.systemSetup.lcm.ActionsPanelControls', {
    extend : 'Ext.Component',
    actionPanel: null,
    attributeFilterBuilder: null,
    
    constructor: function(config) {
        this.actionPanel = config.actionPanel;
        this.type = config.type;
        this.rowsToHide = {};
        
        this.callParent(arguments);
    }, 
    
    load: function() {
        if (this.type !== 'selfService') {
            this.attributeFilterBuilder = new SailPoint.systemSetup.lcm.AttributeFilterBuilder({
                renderTo: this.type + 'AttributeSelectorPanel',
                filterBinding: 'lcmConfigForm:' + this.type + 'AttributeControlFilter',
                errorPanel: this.type + 'AttributeSelectorErrors'
            });
            this.applyAttributeControl();
            if (this.type === 'manager') {
                this.applySubordinateControl();
            }
            this.applyCustomControl();
            this.applyAllowAll();
            this.applyPopulationDisplayControl();
        }
        
        this.roleRuleSelector = 
            SailPoint.SuggestFactory.createSuggest('rule', this.type + 'RoleSelectorRuleDiv', null, '#{msgs.select_rule}', { 
                id: this.type + 'RoleRuleSelectorSuggest',
                extraParams: { ruleType: 'RequestObjectSelector' },
                binding: this.type + 'RoleSelectorRule',
                formBinding: 'lcmConfigForm',
                renderTo: this.type + 'RoleSelectorRuleDiv'
            });
        this.setInitialValue(this.roleRuleSelector, $('lcmConfigForm:' + this.type + 'RoleSelectorRule'), $('lcmConfigForm:' + this.type + 'RoleSelectorRuleName'));

        this.applicationRuleSelector = 
            SailPoint.SuggestFactory.createSuggest('rule', this.type + 'ApplicationRoleSelectorRuleDiv', null, '#{msgs.select_rule}', {
                id: this.type + 'ApplicationRuleSelectorSuggest',
                extraParams: { ruleType: 'RequestObjectSelector' },
                binding: this.type + 'ApplicationSelectorRule',
                formBinding: 'lcmConfigForm',
                renderTo: this.type + 'ApplicationSelectorRuleDiv'
            });
        this.setInitialValue(this.applicationRuleSelector, $('lcmConfigForm:' + this.type + 'ApplicationSelectorRule'), $('lcmConfigForm:' + this.type + 'ApplicationSelectorRuleName'));

        this.managedAttributeRuleSelector = 
            SailPoint.SuggestFactory.createSuggest('rule', this.type + 'ManagedAttributeRoleSelectorRuleDiv', null, '#{msgs.select_rule}', {
                id: this.type + 'ManagedAttributeRuleSelectorSuggest',
                extraParams: { ruleType: 'RequestObjectSelector' },
                binding: this.type + 'ManagedAttributeSelectorRule',
                formBinding: 'lcmConfigForm',
                renderTo: this.type + 'ManagedAttributeSelectorRuleDiv'
            });
        this.setInitialValue(this.managedAttributeRuleSelector, $('lcmConfigForm:' + this.type + 'ManagedAttributeSelectorRule'), $('lcmConfigForm:' + this.type + 'ManagedAttributeSelectorRuleName'));
        
        this.applyRuleSelectorControls();
    },
    
    setInitialValue : function(ruleSuggest, idElement, nameElement) {
        var id = idElement.value;
        if (id && id.length > 0) {
            var name = nameElement.value;
            ruleSuggest.setValue(id);
            ruleSuggest.setRawValue(name);            
        }
    },
    
    applyAllowAll: function() {
        // Hide or show all the requst control options depending on whether we're going to allow or disallow
        // anyone to make requests for anyone else
        var actionsPanel = Ext.getCmp('lifecycleActionsPanel');
        var popDefType = getSelectedRadioInput('lcmConfigForm:' + this.type + 'PopulationDefinitionType');
        var isAllowAll = (popDefType === 'allowAnythingFromAnyone');
        var optionsTable = $(this.type + 'RequestControlOptionsTbl');
        optionsTable.style['display'] = isAllowAll ? 'none' : '';
        actionsPanel.setPaddedHeight(actionsPanel);
    },
    
    applyAttributeControl: function() {
        var enableAttributeControl = $('lcmConfigForm:' + this.type + 'EnableAttributeControl').checked;

        if (enableAttributeControl) {
            $(this.type + 'AttributeSelectorRow').style['display'] = '';
            this.rowsToHide[this.type + 'AttributeSelectorRow'] = false;
        } else {
            $(this.type + 'AttributeSelectorRow').style['display'] = 'none';            
            this.rowsToHide[this.type + 'AttributeSelectorRow'] = true;
        }   
    },
    
    applySubordinateControl: function() {
        var enableSubordinateControl = $('lcmConfigForm:' + this.type + 'EnableSubordinateControl').checked;
        var subordinateChoice = getSelectedRadioInput('lcmConfigForm:' + this.type + 'SubordinateChoice');
        
        if (enableSubordinateControl) {
            $(this.type + 'SubordinateChoicesRow').style['display'] = '';
            this.rowsToHide[this.type + 'SubordinateChoicesRow'] = false;
            if (subordinateChoice === 'directOrIndirect') {
                $(this.type + 'SubordinateHierarchyLevelRow').style['display'] = '';
                this.rowsToHide[this.type + 'SubordinateHierarchyLevelRow'] = false;
            } else {
                $(this.type + 'SubordinateHierarchyLevelRow').style['display'] = 'none';
                this.rowsToHide[this.type + 'SubordinateHierarchyLevelRow'] = true;                
            }
        } else {
            $(this.type + 'SubordinateChoicesRow').style['display'] = 'none';
            this.rowsToHide[this.type + 'SubordinateChoicesRow'] = true;
            $(this.type + 'SubordinateHierarchyLevelRow').style['display'] = 'none';
            this.rowsToHide[this.type + 'SubordinateHierarchyLevelRow'] = true;
        }
    },
    
    applyCustomControl: function() {
        var enableCustomControl = $('lcmConfigForm:' + this.type + 'EnableCustomControl').checked;

        if (enableCustomControl) {
            $(this.type + 'CustomFilterRow').style['display'] = '';
            this.rowsToHide[this.type + 'CustomFilterRow'] = false;
        } else {
            $(this.type + 'CustomFilterRow').style['display'] = 'none';
            this.rowsToHide[this.type + 'CustomFilterRow'] = true;            
        }
    },
    
    applyPopulationDisplayControl: function() {
        var actionsPanel = Ext.getCmp('lifecycleActionsPanel');
        var enablePopulationDisplayControl = this.isPopulationDisplayEnabled();
        if (this.type !== 'selfService') {
            $(this.type + 'RequestControlsTable').style['display'] = enablePopulationDisplayControl ? '' : 'none';
        }
        actionsPanel.setPaddedHeight(actionsPanel);
    },
    
    applyRuleSelectorControls: function() {
        var isRequestAccessEnabled = $('lcmConfigForm:' + this.type + 'RequestAccess').checked;
        var isRoleRequestEnabled = $('lcmConfigForm:' + this.type + 'RequestRoles').checked;
        var isEntitlementRequestEnabled = 
            $('lcmConfigForm:' + this.type + 'RequestEntitlements').checked; 
            
        var rowsToShowOrHide;
        var i;
        
        if (isRequestAccessEnabled && (isRoleRequestEnabled || isEntitlementRequestEnabled)) {
            $(this.type + 'ObjectControlsTable').style['display'] = '';
        } else {
            $(this.type + 'ObjectControlsTable').style['display'] = 'none';
        }
        
        rowsToShowOrHide = Ext.DomQuery.select('tr[class*=' + this.type + 'RoleControlsTable]', $(this.type + 'ObjectControlsTable'));
        if (isRoleRequestEnabled) {
            for (i = 0; i < rowsToShowOrHide.length; ++i) {
                rowsToShowOrHide[i].style['display'] = '';
            }
        } else {
            for (i = 0; i < rowsToShowOrHide.length; ++i) {
                rowsToShowOrHide[i].style['display'] = 'none';
            }
        }
        
        rowsToShowOrHide = Ext.DomQuery.select('tr[class*=' + this.type + 'EntitlementControlsTable]', $(this.type + 'ObjectControlsTable'));
        if (isEntitlementRequestEnabled) {
            for (i = 0; i < rowsToShowOrHide.length; ++i) {
                rowsToShowOrHide[i].style['display'] = '';
            }
        } else {
            for (i = 0; i < rowsToShowOrHide.length; ++i) {
                rowsToShowOrHide[i].style['display'] = 'none';
            }
        }
    },
    
    /**
     * This is called when the "Request Entitlements" checkbox is toggled.
     */
    requestEntitlementsToggled: function(checkbox) {
        var isEnabled = checkbox.checked;
        this.actionToggled('RequestEntitlements', checkbox);
        if (isEnabled) {
            this.applyDefaultToSelector(SailPoint.systemSetup.lcm.SELECTOR_TYPES.application);
            this.applyDefaultToSelector(SailPoint.systemSetup.lcm.SELECTOR_TYPES.managedAttribute);
        }
        
        this.requestAccessOptionToggled();
    },
    
    
    /**
     * This is called when the "Request Roles" checkbox is toggled.
     */
    requestRolesToggled: function() {
        var requestRolesCheckbox = $('lcmConfigForm:' + this.type + 'RequestRoles');
        
        var isEnabled = requestRolesCheckbox.checked;
        this.actionToggled('RequestRoles', requestRolesCheckbox);
        if (isEnabled) {
            this.applyDefaultToSelector(SailPoint.systemSetup.lcm.SELECTOR_TYPES.role);
        }
        
        this.requestAccessOptionToggled();
    },
    
    
    /**
     * One of the request access options was toggled, show/hide the warning
     * appropriately.
     */
    requestAccessOptionToggled: function() {

        var warn = false;
        
        // If "Request Access" is not enabled, don't show the warning.
        var requestAccessCheckbox = $('lcmConfigForm:' + this.type + 'RequestAccess');
        if (requestAccessCheckbox.checked) {
            var requestRolesCheckbox = $('lcmConfigForm:' + this.type + 'RequestRoles');
            var requestEntitlementsCheckbox = $('lcmConfigForm:' + this.type + 'RequestEntitlements');
    
            // Show a warning if neither option is enabled.
            warn = !requestRolesCheckbox.checked && !requestEntitlementsCheckbox.checked;
        }

        $(this.type + 'RequestAccessWarning').style['display'] = (warn) ? '' : 'none';
        this.applyRuleSelectorControls();
    },
    
    /**
     * This is called when the "Request Access" checkbox is toggled.
     */
    requestAccessToggled: function(checkbox) {
        var isEnabled = checkbox.checked;
        this.actionToggled('RequestAccess', checkbox);
        if (isEnabled) {
            this.applyDefaultToSelector(SailPoint.systemSetup.lcm.SELECTOR_TYPES.access);
            // Auto-check the "request roles" checkbox when this
            // is enabled.  This should be the default behavior.
            var requestRolesCheckbox = $('lcmConfigForm:' + this.type + 'RequestRoles');
            requestRolesCheckbox.checked = true;
        }
        
        // Pretend like this option was toggled since we may have just changed
        // the value.  Even if it wasn't changed, we still want to call this so
        // the the warning will get shown/hidden based on whether Request Access
        // is enabled or not.
        this.requestRolesToggled();
    },

    /**
     * This is called when the "Manage Accounts" checkbox is toggled.
     */
    manageAccountsToggled: function(checkbox) {
        this.actionToggled('ManageAccounts', checkbox);

        // Auto-check the "allow managing existing accounts" checkbox when this
        // is enabled.  This should be the default behavior.
        if (checkbox.checked) {
            var existingAcctCheckbox = $('lcmConfigForm:' + this.type + 'AllowManageExistingAccounts');
            existingAcctCheckbox.checked = true;
        }

        // Pretend like this option was toggled since we may have just changed
        // the value.  Even if it wasn't changed, we still want to call this so
        // the the warning will get shown/hidden based on whether Manage Accounts
        // is enabled or not.
        this.manageExistingAccountsToggled();
    },
    
    /**
     * The action with the given name was toggled.
     */
    actionToggled: function(action, checkbox) {

        // Show the population controls if this is enabled. 
        this.applyPopulationDisplayControl();
        
        // Show the rule controls if this is enabled.
        this.applyRuleSelectorControls();

        // Show/hide the sub-options for the action if this is enabled/dissabled.
        var suboptions = $(this.type + action + 'Suboptions');
        if (suboptions) {
            suboptions.style['display'] = checkbox.checked ? '' : 'none';

            // Set the padded height to avoid odd white rectangles at the bottom
            // of the page after the section is shown/hidden.
            var actionsPanel = Ext.getCmp('lifecycleActionsPanel');
            actionsPanel.setPaddedHeight(actionsPanel);
        }
    },
    
    /**
     * This is called when the "allow managing existing accounts" checkbox is
     * toggled, and will show/hide a warning appropriately.
     */
    manageExistingAccountsToggled: function() {
        this.manageAccountsOptionToggled();
    },
    
    /**
     * This is called when the "allow managing existing accounts" checkbox is
     * toggled, and will show/hide a warning appropriately.
     */
    allowAccountOnlyRequestsToggled: function(checkbox) {
        var isEnabled = checkbox.checked;
        this.manageAccountsOptionToggled();
        
        // Enable/disable the "additional account request" control appropriately.
        var addtAccts = this.getManageAccountsAddtAccountCheckbox();
        if (!checkbox.checked) {
            addtAccts.originalChecked = addtAccts.checked;
            addtAccts.checked = false;
            addtAccts.disabled = true;
            this.setManageAccountsAdditionalAccountRequestProxy();
        } else {
            if (addtAccts.originalChecked) {
                addtAccts.checked = addtAccts.originalChecked;
            }
            addtAccts.disabled = false;
            this.setManageAccountsAdditionalAccountRequestProxy();
        }
        if (addtAccts.checked) {
          addtAccts.removeAttribute('checked');
        }
        if (isEnabled) {
            this.applyDefaultToSelector(SailPoint.systemSetup.lcm.SELECTOR_TYPES.application);
        }
    },
    
    /**
     * One of the manage accounts options was toggled, show/hide the warning
     * appropriately.
     */
    manageAccountsOptionToggled: function() {

        var warn = false;
        
        // If "Manage Accounts" is not enabled, don't show the warning.
        var manageAcctsCheckbox = $('lcmConfigForm:' + this.type + 'ManageAccounts');
        if (manageAcctsCheckbox.checked) {
            var existingAcctCheckbox = $('lcmConfigForm:' + this.type + 'AllowManageExistingAccounts');
            var newAcctCheckbox = this.getAccountOnlyCheckbox();
    
            // Show a warning if neither option is enabled.
            warn = !existingAcctCheckbox.checked && !newAcctCheckbox.checked;
        }

        $(this.type + 'ManageAccountsWarning').style['display'] = (warn) ? '' : 'none';
        this.applyRuleSelectorControls();
    },
    
    setManageAccountsAdditionalAccountRequestProxy: function() {
      var proxy = $('lcmConfigForm:' + this.type + 'ManageAccountsAllowAdditionalAccountRequestsProxy');

      var val = this.getManageAccountsAddtAccountCheckbox();
      
      proxy.value = val.checked;
    },

    getAccountOnlyCheckbox: function() {
        return $('lcmConfigForm:' + this.type + 'AllowAccountOnlyRequests');
    },

    getRequestRolesAddtAccountCheckbox: function() {
        return $('lcmConfigForm:' + this.type + 'RequestRolesAllowAdditionalAccountRequests');
    },

    getRequestEntitlementsAddtAccountCheckbox: function() {
        return $('lcmConfigForm:' + this.type + 'RequestEntitlementsAllowAdditionalAccountRequests');
    },

    getManageAccountsAddtAccountCheckbox: function() {
        return $('lcmConfigForm:' + this.type + 'ManageAccountsAllowAdditionalAccountRequests');
    },
    
    getCustomCriteria: function() {
        var enableCustomControl;
        var customCriteria;
        if (this.type === 'selfService') {
            enableCustomControl = false;
        } else {
            enableCustomControl = $('lcmConfigForm:' + this.type + 'EnableCustomControl').checked;            
        }
        if (enableCustomControl) {
            customCriteria = $('lcmConfigForm:' + this.type + 'CustomFilterInput').value;
        } else {
            customCriteria = ''; 
        }

        return customCriteria;
    },
    
    getCustomCriteriaComponentId: function() {
        return this.type + 'CustomFilterError';
    }, 

    save: function() {
        if (this.attributeFilterBuilder) {
            this.attributeFilterBuilder.save();
        }
    },
    
    validate: function(errors, warnings) {
        var enabledOptions = this.getEnabledOptions();
        var popDefType = getSelectedRadioInput('lcmConfigForm:' + this.type + 'PopulationDefinitionType');
        var isAllowAll = (popDefType === 'allowAnythingFromAnyone');
        var i;
        
        // If the population controls are enabled then at least one needs to be configured
        if (enabledOptions.numEnabledOptions === 0 && this.isPopulationDisplayEnabled()) {
            errors.push('#{msgs.err_lcm_config_population_control_options_unspecified}');
        }
        
        if (this.isPopulationDisplayEnabled() && !isAllowAll) {
            if ($('lcmConfigForm:' + this.type + 'EnableAttributeControl').checked) {
                var builderErrors = this.attributeFilterBuilder.validate();
                for (i = 0; i < builderErrors.length; i++) {
                    errors.push(builderErrors[i]);
                }
            }
    
            if (this.type === 'manager' && $('lcmConfigForm:' + this.type + 'EnableSubordinateControl').checked) {
                if (isNaN($('lcmConfigForm:' + this.type + 'SubordinateMaxHierarchy').value)) {
                    errors.push('#{msgs.err_lcm_config_max_hierachy_value_nan}');
                }
            }
            
            if ($('lcmConfigForm:' + this.type + 'EnableCustomControl').checked
                && (!$('lcmConfigForm:' + this.type + 'CustomFilterInput').value
                    || $('lcmConfigForm:' + this.type + 'CustomFilterInput').value.length === 0)) {
                errors.push('#{msgs.err_lcm_config_custom_filter_requires_input}');
            }
        }
        
        // Error if additional accounts are enabled but none have been selected.
        if ((this.getRequestEntitlementsAddtAccountCheckbox().checked ||
             this.getManageAccountsAddtAccountCheckbox().checked) &&
            !Ext.getCmp(SailPoint.systemSetup.lcm.ADDITIONAL_ACCOUNT_APPS_COMPONENT).hasValue() &&
            !this.actionPanel.hasAddtAcctError) {
            warnings.push('#{msgs.err_lcm_config_no_addt_acct_apps}');
            this.actionPanel.hasAddtAcctError = true;
        }

        // Error if account only is enabled but no apps have been selected.
        if (this.getAccountOnlyCheckbox().checked &&
            !Ext.getCmp(SailPoint.systemSetup.lcm.ACCOUNT_ONLY_APPS_COMPONENT).hasValue() &&
            !this.actionPanel.hasAcctOnlyError) {
            warnings.push('#{msgs.err_lcm_config_no_acct_only_apps}');
            this.actionPanel.hasAcctOnlyError = true;
        }
    },

    getEnabledOptions: function() {
        var enabledOptions = {};
        var numEnabledOptions = 0;
        var popDefType = getSelectedRadioInput('lcmConfigForm:' + this.type + 'PopulationDefinitionType');
        var isAllowAll = (popDefType === 'allowAnythingFromAnyone');

        if (this.type !== 'selfService') {
            if (isAllowAll) {
                enabledOptions['allowAll'] = true;
                numEnabledOptions++;
            }
            
            if ($('lcmConfigForm:' + this.type + 'EnableAttributeControl').checked) {
                enabledOptions['enableAttributeControl'] = true;
                numEnabledOptions++;
            }
            
            
            if (this.type === 'manager' && $('lcmConfigForm:' + this.type + 'EnableSubordinateControl').checked) {
                enabledOptions['enableSubordinateControl'] = true;
                numEnabledOptions++;
            }
            
            if ($('lcmConfigForm:' + this.type + 'EnableAttributeControl').checked) {
                enabledOptions['enableAttributeControl'] = true;
                numEnabledOptions++;
            }
            
            if ($('lcmConfigForm:' + this.type + 'EnableCustomControl').checked) {
                enabledOptions['enableCustomControl'] = true;
                numEnabledOptions++;
            }
        }
        
        enabledOptions['numEnabledOptions'] = numEnabledOptions;
        
        return enabledOptions;
    },
    
    isPopulationDisplayEnabled: function() {
        var enablePopulationDisplayControl = false;
        
        var actions = Ext.DomQuery.select('.quickLinkCheckbox', $(this.type + 'ActionsTable'));
        var i;
        
        if (this.type !== 'selfService') {
            for (i = 0; i < actions.length; ++i) {
                enablePopulationDisplayControl |= actions[i].checked;
            }
        }
        
        return enablePopulationDisplayControl;
    },
    
    updateRuleSelector: function() {
        this.roleRuleSelector.getStore().load();
        this.applicationRuleSelector.getStore().load();
        this.managedAttributeRuleSelector.getStore().load();
    },
    
    /**
     * Forces the selector to pick the default 'Requestor's Controlled Scopes' rule if no rule
     * has been selected.  This should only be called when a request capability for a population
     * is newly enabled.  Note that this is only being done at that time because we dont' want to mess
     * with configurations that were established in previous versions of Identity IQ
     */
    applyDefaultToSelector: function(type) {
        var ruleSelector;
        var defaultRuleName;
        var ruleId;
        var match;
        var defaultRule;
        
        if (type === SailPoint.systemSetup.lcm.SELECTOR_TYPES.role) {
            ruleSelector = this.roleRuleSelector;
            defaultRuleName = 'Objects in Requestor\'s Authorized Scopes';
        } else if (type === SailPoint.systemSetup.lcm.SELECTOR_TYPES.application) {
            ruleSelector = this.applicationRuleSelector;
            defaultRuleName = 'Objects in Requestor\'s Authorized Scopes';
        } else if (type === SailPoint.systemSetup.lcm.SELECTOR_TYPES.managedAttribute) {
            ruleSelector = this.managedAttributeRuleSelector;
            defaultRuleName = 'All Objects';
        }
        
        if (ruleSelector) {
            ruleId = ruleSelector.getValue();
            if (!ruleId || ruleId.length === 0) {
                match = ruleSelector.getStore().find('displayName', defaultRuleName);
                if (match > -1) {
                    defaultRule = ruleSelector.getStore().getAt(match);
                    ruleSelector.setValue(defaultRule.id);
                    ruleSelector.binding.value = defaultRule.id;
                }
            }
        }
    }
});

Ext.define('SailPoint.systemSetup.lcm.LifecycleActionsPanel', {
    extend : 'Ext.panel.Panel',

    sections: [],

    hasAddtAcctError: false,
    hasAcctOnlyError: false,
    
    constructor: function(config) {
        config.contentEl = 'actionsPanelContents';
        this.generalPopulationActions = new SailPoint.systemSetup.lcm.ActionsPanelControls({id: 'generalPopulationControls', type: 'generalPopulation', actionPanel: this});
        this.managerActions = new SailPoint.systemSetup.lcm.ActionsPanelControls({id: 'managerControls', type: 'manager', actionPanel: this});
        this.helpDeskActions = new SailPoint.systemSetup.lcm.ActionsPanelControls({id: 'helpDeskControls', type: 'helpDesk', actionPanel: this});
        this.selfServiceActions = new SailPoint.systemSetup.lcm.ActionsPanelControls({id: 'selfServiceControls', type: 'selfService', actionPanel: this});

        this.sections.push(this.generalPopulationActions,
                           this.managerActions,
                           this.helpDeskActions,
                           this.selfServiceActions);

        this.callParent(arguments);
    },
    
    load: function() {
        var i;
        for (i=0; i<this.sections.length; i++) {
            this.sections[i].load();
        }
        this.setPaddedHeight(this);
    },
    
    save: function() {
        var i;
        for (i=0; i<this.sections.length; i++) {
            this.sections[i].save();
        }
    },
    
    validate: function(errors, warnings) {
        var anyAddtAcct = false;
        var anyAcctOnly = false;
        var customCriteria;
        var componentId;
        var i;

        this.hasAddtAcctError = false;
        this.hasAcctOnlyError = false;

        // Validate each section and collect some information.
        for (i=0; i<this.sections.length; i++) {
            // Validate the section.
            var sectionErrors = this.sections[i].validate(errors, warnings);

            // Remember whether there are any additional account or account-only
            // sections.
            if (this.sections[i].getRequestEntitlementsAddtAccountCheckbox().checked ||
                this.sections[i].getRequestRolesAddtAccountCheckbox().checked ||
                this.sections[i].getManageAccountsAddtAccountCheckbox().checked) {
                anyAddtAcct = true;
            }
            if (this.sections[i].getAccountOnlyCheckbox().checked) {
                anyAcctOnly = true;
            }
            
            // Add a pending validator to be run for the custom criteria if all
            // other validation is successful.
            customCriteria = this.sections[i].getCustomCriteria();
            componentId = this.sections[i].getCustomCriteriaComponentId();
            if (customCriteria && customCriteria.length > 0) {
                Ext.getCmp('lcmConfigTabPanel').addPendingValidator({
                    method: this.validateIdentityFilter, 
                    args: [componentId, customCriteria]});
            }
        }
        
        // Add a warning if any additional account or account-only apps have
        // been selected but these aren't enabled for any lifecycle action.
        if (Ext.getCmp(SailPoint.systemSetup.lcm.ADDITIONAL_ACCOUNT_APPS_COMPONENT).hasValue() && !anyAddtAcct) {
            warnings.push('#{msgs.err_lcm_config_no_addt_acct_populations}');
        }
        if (Ext.getCmp(SailPoint.systemSetup.lcm.ACCOUNT_ONLY_APPS_COMPONENT).hasValue() && !anyAcctOnly) {
            warnings.push('#{msgs.err_lcm_config_no_acct_only_populations}');
        }
    },
    
    updateRuleSelectors: function() {
        this.generalPopulationActions.updateRuleSelector();
        this.managerActions.updateRuleSelector();
        this.helpDeskActions.updateRuleSelector();
        this.selfServiceActions.updateRuleSelector();
    },
    
    setPaddedHeight: function(panel) {
        var panelDiv = Ext.get('lifecycleActionsWrapper');
        var panelHeight = panel.getHeight();
        var componentHeight = 0;
        var paddedHeight;
        
        componentHeight += Ext.get('requiredMessage').getHeight();
        componentHeight += Ext.get('selfServiceActions').getHeight();
        componentHeight += Ext.get('manager').getHeight();
        componentHeight += Ext.get('helpDesk').getHeight();
        componentHeight += Ext.get('generalPopulation').getHeight();
        
        if (componentHeight > panelHeight - 30) {
            paddedHeight = componentHeight + 28;
        } else { 
            paddedHeight = panelHeight;
        }

        panelDiv.setHeight(paddedHeight);
    },
    
    validateIdentityFilter: function(componentId, filterTemplateString) {
        Ext.Ajax.request({
            url: SailPoint.getRelativeUrl('/rest/velocity/validateIdentityFilter'),
            success: function(response, options) {
                var results = JSON.parse(response.responseText);
                var resultsValid = (results.isValid.toString().toLowerCase() === 'true');
                var errorCmp = Ext.get(componentId);
                var errorMsg;
                
                if (resultsValid) { 
                    errorCmp.hide();
                } else {
                    // Note that the scope is in the lcmConfigTabPanel
                    errorMsg = results.errorObj.msg;
                    errorCmp.update(errorMsg);
                    errorCmp.show();
                    this.errors.push(errorMsg);
                }
                
                // See SailPoint.systemSetup.lcm.TabPanel.finalizeSave in lcmConfig.js
                this.finalizeSave();
            },
            failure: function(response, options) {
                var errorCmp = Ext.get(componentId); 
                var errorMsg = '#{msgs.lcm_validation_timed_out}';
                errorCmp.update(errorMsg);
                errorCmp.show();
                // Note that the scope is in the lcmConfigTabPanel
                // See SailPoint.systemSetup.lcm.TabPanel.finalizeSave in lcmConfig.js
                this.finalizeSave();
            },
            params: {
                componentId: componentId,
                template: filterTemplateString
            },
            scope: Ext.getCmp('lcmConfigTabPanel')
        });

    }
});

