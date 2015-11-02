/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.Role', 'SailPoint.Role.Tabs');

SailPoint.Role.MAX_ROLE_TYPES = 10;

SailPoint.Role.Tabs.getRoleTabPanel = function(config) {
    var userRights = Ext.JSON.decode($('userRights').innerHTML);
    var tabPanels = [];
    var activePanel = $('tabState:activeTab').value;
    if (!activePanel || activePanel.length == 0) {
        activePanel = 'roleViewerPanel';
    }
    
    // Create a blank config if we don't already have one
    if (!config) {
        config = {};
    }
    
    tabPanels.push(SailPoint.Role.Viewer.getRoleViewerPanel({
        id: 'roleViewerPanel',
        title: '#{msgs.title_role_viewer}',
        border: false,
        navPanelId: 'roleNavPanelWrapper',
        navPanelTitle: '#{msgs.panel_title_role_navigation}',
        viewPanelId: 'roleViewPanel',
        viewPanelTitle: '#{msgs.panel_title_role_information}'
    }));
    
    tabPanels.push(SailPoint.Role.Search.getRoleSearchPanel({
        id: 'roleSearchPanel',
        title: '#{msgs.role_search}'
    }));
     

    tabPanels.push(SailPoint.Role.EntitlementsAnalysis.getEntitlementsAnalysisPanel({
        id: 'entitlementMiningPanel',
        title: '#{msgs.title_new_role_directed_mining}'
    }));
     
     // Role mining rights are all-or-none for now but will likely change in the future
    if (userRights.FullAccessRoleMining || userRights.SystemAdministrator) {
        tabPanels.push(SailPoint.Role.Mining.getRoleMiningPanel({
            activeItem: 'miningTemplatesPanel'
        }));
    
        tabPanels.push(SailPoint.roles.getMiningResultsPanel({
            id: 'miningResultsPanel',
            title: '#{msgs.title_role_mining_results}'
        }));
    } 
    
    Ext.applyIf(config, {
        id: 'roleTabPanel',
        border: false,
        plain: true,
        layoutOnTabChange: true,
        deferredRender: true,
        autoScroll: false,
        items: tabPanels,
        activeTab: activePanel
    });
    
    var roleTabPanel = SailPoint.getMessagedTabPanel(config);
    
    roleTabPanel.items.get(1).on('tabchange', function(tabPanel, activePanel) {
        var activePanelId = activePanel.getId();
        $('tabState:tabPanelId').value = 'roleTabPanel';
        $('tabState:activeTab').value = activePanelId;
        // This form has been polluted with a bunch of grid config crap, 
        // so let's do a lighter-weight rest update
        // $('tabState:updateTabState').click(); 
        Ext.Ajax.request({
            url: SailPoint.getRelativeUrl('/rest/tabState/session/update'),
            method: 'POST',
            params: {tabPanelId: 'roleTabPanel', activeTab: activePanelId},
            callback: function() { 
                // This next line recreates a regression that seems to have been fixed by this.
                // Without it we see duplicate messages in the modeler.
                $('spErrorMsgsDiv').innerHTML = '';
                Ext.getCmp('spViewport').doLayout();
            }
        });
    });
    
    return roleTabPanel;
}

SailPoint.Role.Tabs.initTabPanel = function() {
    var tabPanel = SailPoint.Role.Tabs.getRoleTabPanel({id: 'roleTabPanel', region: 'center'});
    
    var viewport = SailPoint.getViewport({
        bodyContent: tabPanel,
        title: '#{msgs.title_role_tabs}',
        minWidth: 1000
    }); 
    
    Ext.MessageBox.wait('#{msgs.loading_data}');
};

SailPoint.Role.Tabs.createNew = function(item) {
    var value = item.value;
    var miningPanel;
    var canEditRole = $('roleViewerRight').innerHTML == 'ManageRole';
    
    if (value == 'role') {
        if (canEditRole) {
            $('viewerForm:roleToEdit').value = '';
            $('viewerForm:editRole').click();
        } else {
            Ext.MessageBox.show({
                icon: Ext.MessageBox.INFO,
                buttons: Ext.MessageBox.OK,
                closable: false,
                msg: '#{msgs.role_viewer_insufficient_rights_for_role_edit}'
            });
        }
    } else if (value == 'entitlementAnalysis') {
        Ext.getCmp('roleTabPanel').setActiveTab('entitlementMiningPanel');
        if (Ext.getCmp('entitlementMiningPanel').getLayout().activeItem.getId() == 'entitlementProfileResultsPanel') {
            $('directedMiningResultsForm:searchComplete').value = 'false';
            $('errorDiv').style.display = 'none';
            $('directedMiningResultsForm:searchAgain').click();
        }
        if (Ext.getCmp('entitlementProfileResultsPanel').isLoaded) {
            Ext.getCmp('miningAppNameMultiSuggestCmp').clear();
            SailPoint.Role.EntitlementsAnalysis.resetSearchTypeSelection('directedMiningSearchForm');
            SailPoint.Role.EntitlementsAnalysis.resetAttributeInputs('directedMiningSearchForm');
            SailPoint.Role.EntitlementsAnalysis.resetIpopInput('directedMiningSearchForm');
        }
    } else if (value == 'itRoleMining' ) {
        Ext.getCmp('roleTabPanel').setActiveTab('roleMiningPanel');
        Ext.getCmp('roleMiningPanel').getLayout().setActiveItem('itRoleMiningPanel');
        miningPanel = Ext.getCmp('itRoleMiningPanel');
        miningPanel.templateId = '';
        miningPanel.loadContent(false, function() {
            this.clearMiningParams();
        });
    } else if (value == 'businessRoleMining' ) {
        Ext.getCmp('roleTabPanel').setActiveTab('roleMiningPanel');
        Ext.getCmp('roleMiningPanel').getLayout().setActiveItem('bfrMiningPanel');
        miningPanel = Ext.getCmp('bfrMiningPanel');
        miningPanel.templateId = '';
        miningPanel.loadContent();
    } else {
        alert('Chose: ' + value);
    }
    
    if ($('createNew'))
      $('createNew').selectedIndex = 0;
};

Ext.onReady(function () {
    var gridStateStore = new SailPoint.GridStateStore({
        id: 'gridStateStore',
        url: SailPoint.getRelativeUrl('/analyze/gridStateDataSource.json'),
        params: { 'state' : true }
    });
    
    gridStateStore.load({callback: SailPoint.Role.Tabs.initTabPanel});
});
