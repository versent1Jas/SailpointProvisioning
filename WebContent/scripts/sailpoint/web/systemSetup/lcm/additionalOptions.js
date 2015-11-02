/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.systemSetup.lcm');

SailPoint.systemSetup.lcm.ADDITIONAL_ACCOUNT_APPS_COMPONENT = 'additionalAccountApps';
SailPoint.systemSetup.lcm.ACCOUNT_ONLY_APPS_COMPONENT = 'accountOnlyApps';
SailPoint.systemSetup.lcm.DISABLE_AUTO_REFRESH_ACCOUNT_STATUS_APPS_COMPONENT = 'disableAutoRefreshAccountStatusApps';

SailPoint.systemSetup.lcm.getAdditionalOptionsPanel = function(config, addtAcctApps, acctOnlyApps, disableAutoRefAcctApps) {
    var additionalOptionsPanel;
    
    if (!config) {
        config = {};
    }
    
    if (!config.id) {
        config.id = 'additionalOptionsPanel';
    }
    
    config.contentEl = 'additionalOptionsContents';
    
    additionalOptionsPanel = new Ext.Panel(config);

    additionalOptionsPanel.on('resize', function(panel) {
        var panelHeight = panel.getHeight();
        var panelDiv = Ext.get('additionalOptions');
        var contentHeight = panelDiv.getHeight();
        var optionsHeight;
        
        if (panelHeight > contentHeight) {
            optionsHeight = panelHeight;
        } else { 
            optionsHeight = 'auto';
        }

        panelDiv.setHeight(optionsHeight);
    });

    SailPoint.systemSetup.lcm.initAdditionalAccountAppMultiSuggest(addtAcctApps);
    SailPoint.systemSetup.lcm.initAccountOnlyAppMultiSuggest(acctOnlyApps);
    SailPoint.systemSetup.lcm.initDisableAutoRefreshAcctStatusAppMultiSuggest(disableAutoRefAcctApps);
    
    return additionalOptionsPanel;
};

SailPoint.systemSetup.lcm.initAdditionalAccountAppMultiSuggest = function(addtAcctApps) {
    SailPoint.systemSetup.lcm.initAccountAppMultiSuggest(SailPoint.systemSetup.lcm.ADDITIONAL_ACCOUNT_APPS_COMPONENT, $('lcmConfigForm:additionalAccountAppsCheckbox'), addtAcctApps);
};

SailPoint.systemSetup.lcm.initAccountOnlyAppMultiSuggest = function(acctOnlyApps) {
    SailPoint.systemSetup.lcm.initAccountAppMultiSuggest(SailPoint.systemSetup.lcm.ACCOUNT_ONLY_APPS_COMPONENT, $('lcmConfigForm:accountOnlyAppsCheckbox'), acctOnlyApps);
};

SailPoint.systemSetup.lcm.initDisableAutoRefreshAcctStatusAppMultiSuggest = function(disableAutoRefAcctApps) {
    SailPoint.systemSetup.lcm.initAccountAppMultiSuggest(SailPoint.systemSetup.lcm.DISABLE_AUTO_REFRESH_ACCOUNT_STATUS_APPS_COMPONENT, $('lcmConfigForm:disableAutoRefreshAccountStatusCheckbox'), disableAutoRefAcctApps);
};

SailPoint.systemSetup.lcm.initAccountAppMultiSuggest = function(compId, checkbox, apps) {
    var suggest = new SailPoint.MultiSuggest({
        id: compId,
        autoRender: compId + 'Div',
        suggestType: 'application',
        jsonData: apps,
        inputFieldName: compId + 'Input',
        contextPath: CONTEXT_PATH
    });

    suggest.toggleSelectAll(checkbox.checked, '#{msgs.all_applications}', true);
};

SailPoint.systemSetup.lcm.toggleAdditionalAccountApplicationsSelectAll = function(selected) {
    Ext.getCmp('additionalAccountApps').toggleSelectAll(selected, '#{msgs.all_applications}', true);
};

SailPoint.systemSetup.lcm.toggleAccountOnlyApplicationsSelectAll = function(selected) {
    Ext.getCmp('accountOnlyApps').toggleSelectAll(selected, '#{msgs.all_applications}', true);
};

SailPoint.systemSetup.lcm.toggleAutoRefreshAccStatusOnlyApplicationsSelectAll = function(selected) {
    Ext.getCmp('disableAutoRefreshAccountStatusApps').toggleSelectAll(selected, '#{msgs.sys_config_lifecycle_disable_auto_refresh_status}', true);
};

SailPoint.systemSetup.lcm.toggleEnableFullText = function(el) {
    var i, elem,
        interval = $('lcmConfigForm:lcmFullTextInterval'),
        mode = $('lcmConfigForm:lcmFullTextExecutionMode'),
        path = $('lcmConfigForm:lcmFullTextIndexPath'),
        elems = [path, mode];

    for (i = 0; i < elems.length; i++) {
        elem = elems[i];
        if (elem) {
            elem.disabled = !el.checked;

            SailPoint.toggleClass('.fulltext', 'disabled', elem.disabled);
        }
    }

    // need special handling for interval
    if (interval && mode) {
        if (el.checked) {
            interval.disabled = !mode.checked;
        } else {
            interval.disabled = true;
        }

        SailPoint.toggleClass('.fulltext-interval', 'disabled', interval.disabled);
    }
};

SailPoint.systemSetup.lcm.toggleExecutionMode = function(el) {
    var interval = $('lcmConfigForm:lcmFullTextInterval');
    if (interval) {
        interval.disabled = !el.checked;

        SailPoint.toggleClass('.fulltext-interval', 'disabled', interval.disabled);
    }
};

Ext.onReady(function() {
    SailPoint.systemSetup.lcm.toggleEnableFullText($('lcmConfigForm:lcmEnableFulltext'));
    SailPoint.systemSetup.lcm.toggleExecutionMode($('lcmConfigForm:lcmFullTextExecutionMode'));
});
