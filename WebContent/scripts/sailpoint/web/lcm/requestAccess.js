Ext.ns('SailPoint.LCM.RequestAccess');

Ext.onReady(function(){

    if (unauthorizedParam) {

        // Well, we want to show a pop-up if this is an unauthorized request specifying an identity on the
        // query string.  However, an Ext.Msg.show will disappear as soon as the OK button is pressed
        // leaving the user a few seconds to mess around in the UI before the dashboard loads.
        // We don't really have control over the destruction of an Ext.Msg.show, so you can't really
        // prevent it from going away when you click OK, so we have this redirectHandler. You could also create an
        // Ext.Window that does what you want, but then you have to roll-your-own, which is verbose
        // and makes for inconsistent UI.
        //
        // The redirect handler will keep showing a new pop-up as soon as the previous one is closed
        // while the browser processes the redirect.
        var redirectHandler = function (redirected) {
            return function() {
                //redirect to dashboard with no params
                if (!redirected) {
                    redirected = true;
                    location.replace(SailPoint.getRelativeUrl("/dashboard.jsf"));
                }
                showUnauthorized(redirected);
            }
        }

        var showUnauthorized = function (redirected) {
            if (!redirected) {
                Ext.Msg.show({
                    title: '#{msgs.err_dialog_title}',
                    msg: '#{msgs.lcm_no_access_to_requested_identity}',
                    buttons: Ext.Msg.OK,
                    icon: Ext.Msg.ERROR,
                    modal: true,
                    fn: redirectHandler(redirected)
                });
            } else {
                Ext.Msg.wait('#{msgs.lcm_no_access_to_requested_identity}', '#{msgs.err_dialog_title}');
            }
        }

        showUnauthorized(false);

    } else {

        requestAccessFilterPanel = new SailPoint.LCM.RequestAccessSidebarPanel({
            id: 'requestAccessFilterPanel',
            attributeMap: attributeMap,
            region: 'west',
            title: '#{msgs.lcm_request_access_sidebar_panel_title}',
            width: 325,
            listId: 'requestAccessList',
            allowRoles: allowRoles,
            allowEntitlements: allowEntitlements,
            allowPopulationSearch: allowPopulationSearch,
            allowIdentitySearch: allowIdentitySearch,
            collapsible: true
        });

        requestAccessList = new SailPoint.LCM.RequestAccessList({
            id: 'requestAccessList',
            region: 'center',
            roleTypes: roleTypes,
            currentIdentity: SailPoint.LCM.RequestAccess.identityId,
            allowPermitted: allowPermitted,
            allowAssignable: allowAssignable,
            assignableTypes: assignableTypes,
            gridMetaData: gridMetaData,
            listStoreFields: listStoreFields,
            filterPanel: requestAccessFilterPanel,
            allowRoles: allowRoles,
            attributeMap: attributeMap,
            allowEntitlements: allowEntitlements,
            resultDetailsOptInEnabled: resultDetailsOptInEnabled,
            searchMaxResults: searchMaxResults,
            roleResultsProperties: rolesGridMetadata.columns,
            entitlementResultsProperties: entitlementsGridMetadata.columns,
            autoScroll: true,
            ruleData: ruleData
        });

        searchField = new Ext.form.TextField({
            id: 'searchField',
            emptyText: '#{msgs.label_search}',
            width: 480
        });

        searchField.render('request_access_search');

        populationWindow = new SailPoint.LCM.RequestAccessPopulationWindow({
            gridMetaData: popGridMetaData
        });

        // remove the border on the left side after layout if the filter
        // panel is valid and collapsed. i could not find a better way to
        // do this. please change if you know of a better way.
        var listeners = {};
        if (requestAccessFilterPanel) {
            listeners.afterlayout = {
                fn: function () {
                    if (requestAccessFilterPanel.getCollapsed()) {
                        requestAccessFilterPanel.getEl().setStyle('width', '0px');
                    }
                }
            };
        }
        // If filterflags does not contain any key that means RequestAccess direct link is not provided
        // initDirectLink functions set the direct link by loading the required store
        // with the provided filter item
        // also add cosmetic changes for better user interface
        var flagKeys = Object.keys(filterFlags);
        if ( flagKeys.length > 0) {
            SailPoint.LCM.RequestAccess.initDirectLink();
        }

        var viewport = SailPoint.getViewport({
            bodyContent: {
                xtype: 'panel',
                items: [requestAccessFilterPanel, requestAccessList],
                layout: 'border',
                height: 800,
                id: 'requestAccessPanel',
                listeners: listeners
            },
            title: "#{sp:escapeJavascript(msgs.title_workflows)}",
            preventResize: SailPoint.Platform.isMobile(),
            handleOrientationChange: SailPoint.Platform.isMobile()
        });

        SailPoint.LCM.RequestAccess.submitOnEnter = new SailPoint.SubmitOnEnter('search_btn');
        SailPoint.LCM.RequestAccess.submitOnEnter.registerTextField('searchField-inputEl');
    }

});

SailPoint.LCM.RequestAccess.toggleSearch = function(el) {
  var node = Ext.get(el);
  if (node.hasCls('active')) {
    return;
  }

  var currentSelected = $$('#requestAccessSearchToggle a.active');
  if (currentSelected.length > 0) {
    Ext.get(currentSelected[0]).removeCls('active');
  }

  node.addCls('active');
  
  var filterPanel = Ext.getCmp('requestAccessFilterPanel');
  if (filterPanel) {
    var showNarrowBtn = false;

    if (node.hasCls('keyword')) {
      filterPanel.collapse();

      showNarrowBtn = true;
    } else {
      var narrowPanels = ['roleFilterForm', 'entitlementFilterForm'];
      narrowPanels.each(function(id) {
        var panel = Ext.getCmp(id);
        if (panel) {
          panel.clearSearch();
          panel.collapse();
        }
      });

      filterPanel.expand();
    }

    var narrowResultsBtn = Ext.getCmp('filterSearchResultsBtn');
    if (narrowResultsBtn) {
      narrowResultsBtn.setVisible(showNarrowBtn);
    }
  }
};

SailPoint.LCM.RequestAccess.addRequest = function() {
  $('subtitle').show();
  $('editForm:postAddRequestBtn').click();
}

