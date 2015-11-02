/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.Analyze', 'SailPoint.Analyze.Tabs');


Ext.onReady(function () {
    Ext.MessageBox.wait('#{msgs.loading_data}');
    SailPoint.Analyze.initialize();
});


SailPoint.Analyze.initialize = function() {
    // initStateProviders() calls initGridStates(), which in turn calls 
    // initTabPanel(). The downside of loading data via asynchronous calls...
    SailPoint.Analyze.initStateProviders();
}

SailPoint.Analyze.initStateProviders = function() {
    Ext.Ajax.request({
        url: SailPoint.getRelativeUrl('/analyze/gridStateDataSource.json'),
        params: { 'providers' : true },
        method: 'GET',
        success : function(response) {
            var results = Ext.JSON.decode(response.responseText);
            if (results == null) {
                alert('Unable to load state providers.');
                return;
            }
            
            var providers = results.providers;
            var stateIds = new Array(providers.length);
            var states = new Array(providers.length);
            for (var i = 0; i < providers.length; i++) {
                var pInfo = providers[i];
                if ((pInfo.type == null) || (pInfo.name == null))
                    continue;
                
                SailPoint.Analyze.gridStateIds.add(pInfo.type, pInfo.name);
                stateIds[i] = pInfo.name;
                states[i] = pInfo.state;
            }

            var sp = new SailPoint.state.StateProvider({
              stateIds: stateIds,
              states:   states
            });
            Ext.state.Manager.setProvider(sp);
        },
        failure : function() {
            alert('Loading state providers failed.');
        },
        callback: SailPoint.Analyze.initGridState,
        scope : this
    });
}


SailPoint.Analyze.initGridState = function() {
    var gridStateStore = new SailPoint.GridStateStore({
        id: 'gridStateStore',
        url: SailPoint.getRelativeUrl('/analyze/gridStateDataSource.json'),
        extraParams: { 'state' : true }
    });
    
    gridStateStore.load({callback: SailPoint.Analyze.initTabPanel});
}


SailPoint.Analyze.initTabPanel = function() {
    var tabPanelState = JSON.parse($('whereAreWe').innerHTML);
    SailPoint.Analyze.loadTransientGridState(tabPanelState);
    
    var tabPanel = SailPoint.Analyze.Tabs.getAnalyzeTabPanel({region: 'center'});
    if (tabPanelState.cardPanel == 'identitySearchResultsGridWrapper') {
        var gridPanel = Ext.getCmp('identitySearchResultsGrid');
        Ext.MessageBox.wait('#{msgs.loading_data}');
        gridPanel.load({
            callback: SailPoint.Identity.Search.displaySearchResults
        });
    } else if (tabPanelState.cardPanel == 'advancedIdentitySearchResultsGridWrapper') {
        var gridPanel = Ext.getCmp('advancedIdentitySearchResultsGrid');
        Ext.MessageBox.wait('#{msgs.loading_data}');
        gridPanel.load({
            callback: SailPoint.Identity.Search.displayAdvancedSearchResults
        });
    } else if (tabPanelState.cardPanel == 'certificationSearchResultsGrid') {
        var gridPanel = Ext.getCmp('certificationSearchResultsGrid');
        Ext.MessageBox.wait('#{msgs.loading_data}');
        gridPanel.load({
            callback: SailPoint.Certification.Search.displaySearchResults
        });
    } else if (tabPanelState.cardPanel == 'identityRequestSearchResultsGrid') {
        var gridPanel = Ext.getCmp('identityRequestSearchResultsGrid');
        Ext.MessageBox.wait('#{msgs.loading_data}');
        gridPanel.load({
            callback: SailPoint.IdentityRequest.Search.displaySearchResults
        });
    } else if (tabPanelState.cardPanel == 'accountGroupSearchResultsGrid') {
        var gridPanel = Ext.getCmp('accountGroupSearchResultsGrid');
        Ext.MessageBox.wait('#{msgs.loading_data}');
        gridPanel.load({
            callback: SailPoint.AccountGroup.Search.displaySearchResults
        });
    }
    
    var viewport = SailPoint.getViewport({
        bodyContent: tabPanel,
        title: '#{msgs.menu_label_analyze_search}',
        minWidth: 600
    });
}

/**
 * Load any transient grid state from earlier action on the slicer/dicer
 * and swap it in for the persisted grid state.  This is only a concern 
 * on some tabs, not all, hence the incomplete list below.
 */
SailPoint.Analyze.loadTransientGridState = function(tabPanelState) {
    // load any transient state
    var transientStateObj = null;
    var el = Ext.get('transientGridState');
    if (!el || (el.dom.innerHTML == ''))
        return;
    else
        transientStateObj = new SailPoint.GridState(Ext.JSON.decode(el.dom.innerHTML));
    
    var gridStateId = null;
    switch (tabPanelState.tabPanel) {
        case 'identitySearchPanel':
            if (tabPanelState.cardPanel == 'identitySearchResultsGridWrapper')
                gridStateId = SailPoint.Analyze.gridStateIds.get('Identity');
            else if (tabPanelState.cardPanel == 'advancedIdentitySearchResultsGridWrapper')
                gridStateId = SailPoint.Analyze.gridStateIds.get('AdvancedIdentity');
            else 
                gridStateId = null;
            
            break;
        case 'certificationSearchPanel':
            gridStateId = SailPoint.Analyze.gridStateIds.get('Certification');
            break;
        case 'roleSearchPanel':
            gridStateId = SailPoint.Analyze.gridStateIds.get('Role');
            break;
        case 'activitySearchPanel':
            gridStateId = SailPoint.Analyze.gridStateIds.get('Activity');
            break;
        case 'identityRequestSearchPanel':
            gridStateId = SailPoint.Analyze.gridStateIds.get('IdentityRequest');
            break;
        default: 
            gridStateId = null;
    }
    
    var gridStateStore = Ext.StoreMgr.get('gridStateStore');
    var stateStoreObj = gridStateStore.findRecord('name', gridStateId);
    if (stateStoreObj != null) {
        var persistentStateObj = stateStoreObj.get('state');
        if (persistentStateObj.name == transientStateObj.name) {
            // Ext.data.Model.set() is broken, so...
            stateStoreObj.data['state'] = transientStateObj;
        }
    }
}


SailPoint.Analyze.Tabs.getAnalyzeTabPanel = function(config) {
    var tabPanelState = JSON.parse($('whereAreWe').innerHTML);
    var activeTab = tabPanelState.tabPanel;
    
    if (!config)
        config = {};
    
    var tabPanels = SailPoint.Analyze.Tabs.getTabPanels();
    var analyzeTabPanel = SailPoint.getMessagedTabPanel({
        id: 'analyzeTabPanel',
        title: '#{msgs.menu_label_analyze_search}',
        border: true,
        plain: true,
        region: config.region,
        layoutOnTabChange: true,
        preventHeader : true,
        deferredRender: true,
        enableTabScroll: true,
        autoScroll: true,
        items: tabPanels,
        activeTab: activeTab
    });
    
    analyzeTabPanel.items.get(1).on('tabchange', function(tabPanel, activePanel) {
        if (activePanel) {
            $('stateForm:currentSearchPanel').value = activePanel.getId();
        }

        $('stateForm:updatePanelStateBtn').click();
    });

    return analyzeTabPanel;
}


SailPoint.Analyze.Tabs.getTabPanels = function() {
    var config;
    var tabPanels = [];
    var accessiblePanels = JSON.parse($('accessiblePanels').innerHTML);
    var tabPanelState = JSON.parse($('whereAreWe').innerHTML);

    if (accessiblePanels.identitySearch) {
        config = SailPoint.Analyze.getSearchPanelConfig('identitySearchPanel', '#{msgs.identity_search_title}', tabPanelState);
        tabPanels.push(SailPoint.Identity.Search.getIdentitySearchPanel(config));
    }
    
    if (accessiblePanels.certificationSearch) {
        config = SailPoint.Analyze.getSearchPanelConfig('certificationSearchPanel', '#{msgs.cert_search}', tabPanelState);
        tabPanels.push(SailPoint.Certification.Search.getCertificationSearchPanel(config));
    }
    
    if (accessiblePanels.roleSearch) {
        config = SailPoint.Analyze.getSearchPanelConfig('roleSearchPanel', '#{msgs.role_search}', tabPanelState);
        tabPanels.push(SailPoint.Role.Search.getRoleSearchPanel(config));
    }
    
    if (accessiblePanels.accountGroupSearch) {
        config = SailPoint.Analyze.getSearchPanelConfig('accountGroupSearchPanel', '#{msgs.account_group_search}', tabPanelState);
        tabPanels.push(SailPoint.AccountGroup.Search.getAccountGroupSearchPanel(config));
    }
    
    if (accessiblePanels.activitySearch) {
        config = SailPoint.Analyze.getSearchPanelConfig('activitySearchPanel', '#{msgs.activity_search_title}', tabPanelState);
        tabPanels.push(SailPoint.Activity.Search.getActivitySearchPanel(config));
    }
    
    if (accessiblePanels.auditSearch) {
        config = SailPoint.Analyze.getSearchPanelConfig('auditSearchPanel', '#{msgs.audit_search}', tabPanelState);
        tabPanels.push(SailPoint.Audit.Search.getAuditSearchPanel(config));
    }
    
    if (accessiblePanels.processInstrumentationSearch) {
        config = SailPoint.Analyze.getSearchPanelConfig('processInstrumentationSearchPanel', '#{msgs.process_instrumentation_search}', tabPanelState);
        tabPanels.push(SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationSearchPanel(config));
    }
    
    if (accessiblePanels.identityRequestSearch) {
        config = SailPoint.Analyze.getSearchPanelConfig('identityRequestSearchPanel', '#{msgs.identity_request_search_title}', tabPanelState);
        tabPanels.push(SailPoint.IdentityRequest.Search.getIdentityRequestSearchPanel(config));
    }
    
    if (accessiblePanels.syslogSearch) {
        config = SailPoint.Analyze.getSearchPanelConfig('syslogSearchPanel', '#{msgs.syslog_search_title}', tabPanelState);
        tabPanels.push(SailPoint.Syslog.Search.getSyslogSearchPanel(config));
    }

    if (accessiblePanels.linkSearch) {
        config = SailPoint.Analyze.getSearchPanelConfig('linkSearchPanel', '#{msgs.link_search_title}', tabPanelState);
        tabPanels.push(SailPoint.Link.Search.getLinkSearchPanel(config));
    }

    return tabPanels;
}


SailPoint.Analyze.captureGridState = function(searchType, formName) {
    var gridStateId = SailPoint.Analyze.gridStateIds.get(searchType); 
    if (gridStateId == null)
        return;
    
    var gridState = SailPoint.GridState.getGridState(gridStateId);
    if (gridState) 
        gridState.encodeGridState(formName);
}

/**
 * @private This method sets an active card on the config if one is needed
 */
SailPoint.Analyze.getSearchPanelConfig = function(tabId, tabTitle, tabPanelState) {
    var activeTab = tabPanelState.tabPanel;
    var activeCard = tabPanelState.cardPanel;
    var config = {
        id: tabId,
        title: tabTitle
    }
    
    if (activeTab == tabId) {
        config.activeCard = tabPanelState.cardPanel;
    }
    
    return config;
}
