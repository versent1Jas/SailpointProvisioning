Ext.ns('SailPoint');
Ext.ns('SailPoint.IdentityDetailPanel');

/**
 * Toggles the display of an identity detail expando. Used
 * on the certification detail page.
 *
 * @param identityId
 */
SailPoint.IdentityDetailPanel.toggleIdentityDetailPanel = function(identityId) {

    var panelId = 'identityDetails-' + identityId;

    var containerElement = Ext.get(panelId + '-container');

    var panel = Ext.getCmp(panelId);

    // if the panel is visible and the user has toggled the expando link, close it.
    if (panel && panel.isVisible()) {
        containerElement.enableDisplayMode();
        containerElement.hide();
        panel.hide();
        return;
    }

    containerElement.show();

    // If we haven't found the panel by ID, create it. Otherwise show the hidden panel
    if (!panel) {

        // Create the tab panel
        var tabs = new Ext.TabPanel({
            activeTab: 0,
            autoScroll:false,
            frame:true,
            items:[
                new Ext.Panel({html:'', title:'#{msgs.identity_detail_panel_tab_identity_attributes}'}),
                new Ext.Panel({html:'', title:'#{msgs.identity_detail_panel_tab_app_accounts}'})
            ]
        });

        panel = new Ext.Panel({
            id: panelId,
            title:'#{msgs.identity_detail_panel_title}',
            tools:[{
                id:'close',
                handler:function(event, toolEl, thePanel){
                    var tabContainer = Ext.get(thePanel.id + '-container');
                    containerElement.enableDisplayMode();
                    tabContainer.hide();
                    thePanel.hide();
                }
            }],
            items:[tabs]
        });

        // resize the container div as the user flips between tabs
        tabs.on('tabchange', function(tabPanel){
            var tabContainer = Ext.get(tabPanel.ownerCt.id + '-container');
            tabContainer.setHeight(tabPanel.ownerCt.getSize().height);
        }, this);


        // Add load methods to the tabs. The callback for the load resizes the
        // container DIV which wraps the tabpanel so it fits the loaded content.
        tabs.items.get(0).on('render', function(thePanel){
            thePanel.load({
                url:SailPoint.getRelativeUrl('/identity/identityDetails.jsf?id=' + identityId),
                callback:function(){
                    var wrapperPanel = this.ownerCt.ownerCt;
                    var tabContainer = Ext.get(wrapperPanel.id + '-container');
                    tabContainer.setHeight(wrapperPanel.getSize().height);

                    // IE6 sizes the width of the panel shorter than the container. This has
                    // something to do with the fact that it's trying to render while the browser
                    // is adjusting the containing table. This is a hack handle this width issue.
                    if (Ext.isIE){
                        wrapperPanel.setWidth(tabContainer.getWidth());
                    }

                },
                scope:thePanel
            });
        }, this);

        tabs.items.get(1).on('render', function(thePanel){
            thePanel.load({
                url:SailPoint.getRelativeUrl('/identity/identityLinksPanel.jsf?id=' + identityId),
                callback:function(){
                    var wrapperPanel = this.ownerCt.ownerCt;
                    var tabContainer = Ext.get(wrapperPanel.id + '-container');
                    tabContainer.setHeight(wrapperPanel.getSize().height);
                },
                scope:thePanel
            });
        }, this);

        // for IE6 or FF# you have to explicitly size the panel or it will be set at 10000px
        // Note that we override this width for IE6 in panel.items.get(0) render event handler
        if (Ext.isIE || Ext.isGecko3) {
            var width = containerElement.getWidth();
            panel.setWidth(width);
        }

        panel.render(containerElement);

        // this renders the first tab. It should render itself but this works...
        tabs.items.get(0).getLayout().layout();

        // we need to destroy the panel when the tab changes since the page is
        // being updated by a4j.
        Page.on('cleanupIdentityDetailPanels', function(){
            // todo it would be nuch better to remove the handler after it's fired since the
            // panel has been destroyed. Otherwise we keep hanging new event handlers onto the
            // Page obj. Shouldnt be a problem unless they open lots of panels though.
            if (panel){
                panel.destroy();
                panel = null;
            }
        }, this);

    } else {
        panel.show();
    }

};

/**
 * Expands or hides the link details expando on the Application Accounts tab of
 * the IdentityDetailPanel.
 *
 * @param linkId
 * @param identityId
 */
SailPoint.IdentityDetailPanel.toggleIdentityLinkDetail = function(linkId, identityId){
    var panelId = 'identityDetails-' + identityId;
    var panel = Ext.getCmp(panelId);

    var linkDetail = Ext.get('linkDetails_' + linkId);
    if (linkDetail.isVisible()) {
        linkDetail.enableDisplayMode();
        linkDetail.hide();
    } else {
        linkDetail.show();
    }

    var panelContainer = Ext.get(panel.id + '-container');
    panelContainer.setHeight(panel.getSize().height);

};

/**
 *
 * @param identityId
 */
/*SailPoint.resizeIdentityDetailPanel  = function(identityId){

    var panelId = 'identityDetails-' + identityId;
    var panel = Ext.getCmp(panelId);
    var panelContainer = Ext.get(panelId + '-container');
    panelContainer.setHeight(panel.getSize().height);
};*/
