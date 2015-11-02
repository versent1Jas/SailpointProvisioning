/* (c) Copyright 2011 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.Role', 'SailPoint.Role.Metrics');

SailPoint.Role.Metrics.Template = new Ext.XTemplate(
    '<tpl if="this.metricsExist(modified)">',
        '<div style="font-style:italic">#{lastRefresh} {modified}</div>',
        '<tpl if="!showMembers &amp;&amp; !showDetected">',
            '<div  class="formInfo">#{msgs.no_metrics_available}</div>',
        '</tpl>',
        '<tpl if="showMembers || showDetected">',
            '<table class="paddedTbl width100"><tbody>',
                '<tpl if="showMembers">',
                    '<tr><td class="modelerMetricsTableContent" onclick="SailPoint.Role.Metrics.displayIdentitiesDrilldown(\'{roleId}\', \'members\');">#{role_score_members}</td><td>{members}</td></tr>',
                    '<tr><td class="modelerMetricsTableContent" onclick="SailPoint.Role.Metrics.displayIdentitiesDrilldown(\'{roleId}\', \'membersWithAdditionalEntitlements\');">#{role_score_members_extra_entitlements}</td><td>{membersWithAddtionalEntitlements}</td></tr>',
                    '<tr><td class="modelerMetricsTableContent" onclick="SailPoint.Role.Metrics.displayIdentitiesDrilldown(\'{roleId}\', \'membersWithMissingRequired\');">#{role_score_members_missing_required}</td><td>{membersWithMissingRequired}</td></tr>',
                '</tpl>',
                '<tpl if="showDetected">',
                    '<tr><td class="modelerMetricsTableContent" onclick="SailPoint.Role.Metrics.displayIdentitiesDrilldown(\'{roleId}\', \'detected\');">#{role_score_detected}</td><td>{detected}</td></tr>',
                    '<tr><td class="modelerMetricsTableContent" onclick="SailPoint.Role.Metrics.displayIdentitiesDrilldown(\'{roleId}\', \'detectedExceptions\');">#{role_score_detected_exceptions}</td><td>{detectedExceptions}</td></tr>',
                '</tpl>',
                '<tpl if="showMembers">',
                    '<tr><td class="modelerMetricsTableContent" onclick="SailPoint.Role.Metrics.displayEntitlementsDrilldown(\'{roleId}\', \'provisionedEntitlements\');">#{role_score_provisioned_entitlements}</td><td>{provisionedEntitlements}</td></tr>',
                    '<tr><td class="modelerMetricsTableContent" onclick="SailPoint.Role.Metrics.displayEntitlementsDrilldown(\'{roleId}\', \'permittedEntitlements\');">#{role_score_permitted_entitlements}</td><td>{permittedEntitlements}</td></tr>',
                '</tpl>',
            '</tbody></table>',
        '</tpl>',
    '</tpl>',
    '<tpl if="!this.metricsExist(modified)">',
        '<div class="formInfo">#{role_score_not_generated}</div>',
    '</tpl>', {
        metricsExist: function(lastModified) {
            return (lastModified != null);
        }
    }
);

SailPoint.Role.Metrics.MetricDisplayNames = {
    'members': '#{role_score_members}',
    'membersWithAdditionalEntitlements': '#{role_score_members_extra_entitlements}',
    'membersWithMissingRequired': '#{role_score_members_missing_required}',
    'detected': '#{role_score_detected}',
    'detectedExceptions': '#{role_score_detected_exceptions}',
    'provisionedEntitlements': '#{role_score_provisioned_entitlements}',
    'permittedEntitlements': '#{role_score_permitted_entitlements}'
};

SailPoint.Role.Metrics.displayIdentitiesDrilldown = function(roleId, metric) {
    var identitiesDrilldown = Ext.getCmp('roleMetricsIdentities');
    var gridMetaData = Ext.JSON.decode($('roleMetricsUIConfig').innerHTML);
    var entitlementsDrilldown = Ext.getCmp('roleMetricsEntitlements');
    var drilldownStore;
    
    if (entitlementsDrilldown) {
        entitlementsDrilldown.hide();
    }

    if (!identitiesDrilldown) {
        identitiesDrilldown = new SailPoint.grid.PagingCheckboxGrid({
            id: 'roleMetricsIdentities',
            title: SailPoint.Role.Metrics.MetricDisplayNames[metric],
            store: SailPoint.Store.createRestStore({
                autoLoad: false,
                url: SailPoint.getRelativeUrl('/rest/roleViewer/identitiesGrid'),
                root: 'objects',
                totalProperty: 'count',
                method: 'POST',
                fields: gridMetaData.fields,
                sorters : [{property :  'name', direction: 'ASC'  }],
                remoteSort: true
            }),
            columns: gridMetaData.columns,
            selModel: new SailPoint.grid.CheckboxSelectionModel(),
            viewConfig: {autoFill: false, emptyText: '#{msgs.identity_risk_none_found}', scrollOffset: 1},
            tbar: [{
                text: '#{msgs.button_schedule_cert}',
                handler: function() {
                    var isExcludeSelected = identitiesDrilldown.isAllSelected();
                    var isValid = true;
                    $('metricsDrilldownCertificationForm:excludeSelected').value = isExcludeSelected;
                    if (isExcludeSelected) {
                        $('metricsDrilldownCertificationForm:selectedIds').value = identitiesDrilldown.getExcludedIds().join();
                    } else {
                        $('metricsDrilldownCertificationForm:selectedIds').value = identitiesDrilldown.getSelectedIds().join();
                        if ($('metricsDrilldownCertificationForm:selectedIds').value.length === 0) {
                            Ext.MessageBox.show({
                                title: '#{msgs.err_dialog_title}', 
                                msg: '#{msgs.err_no_item_selected}',
                                modal: true,
                                icon: Ext.MessageBox.ERROR,
                                closable: false,
                                buttons: Ext.MessageBox.OK
                            });
                            isValid = false;
                        }
                    }
                    
                    if (isValid) {
                        $('metricsDrilldownCertificationForm:roleId').value = drilldownStore.getProxy().extraParams.roleId;
                        $('metricsDrilldownCertificationForm:metric').value = drilldownStore.getProxy().extraParams.metric;
                        $('metricsDrilldownCertificationForm:scheduleCertificationBtn').click();
                    }
                }
            }],
            pageSize: 25
        });
    } else {
        identitiesDrilldown.setTitle(SailPoint.Role.Metrics.MetricDisplayNames[metric]);
    }
    
    drilldownStore = identitiesDrilldown.getStore();
    if (drilldownStore.getProxy().extraParams) {
        drilldownStore.getProxy().extraParams = {};
    }
    drilldownStore.getProxy().extraParams.roleId = roleId;
    drilldownStore.getProxy().extraParams.metric = metric; 
    
    drilldownStore.load({
        params: { start: 0, limit: 25 },
        callback: function() {
            var drilldownWindow = Ext.getCmp('identitiesDrilldownWindow');
            if (!drilldownWindow) {
                drilldownWindow = new Ext.Window({
                    id: 'identitiesDrilldownWindow',
                    layout: 'fit',
                    items: [Ext.getCmp('roleMetricsIdentities')],
                    width: 768,
                    height: 600
                });
            }
            drilldownWindow.show();
            //drilldownWindow.alignTo('roleViewContentPanel', 't-t');
            drilldownWindow.center();
        }
    });
};

SailPoint.Role.Metrics.displayEntitlementsDrilldown = function(roleId, metric) {
    var entitlementsDrilldown = Ext.getCmp('roleMetricsEntitlements');
    var identitiesDrilldown = Ext.getCmp('roleMetricsIdentities');
    if (identitiesDrilldown) {
        identitiesDrilldown.hide();
    }

    if (!entitlementsDrilldown) {
        entitlementsDrilldown = new Ext.Window({
            id: 'roleMetricsEntitlements',
            title: SailPoint.Role.Metrics.MetricDisplayNames[metric],
            html: '<div class="spGrayBackground"><div id="entitlementsDisplayContent" class="spContent"><div id="roleMetricsEntitlementsDisplay"/></div></div>',
            width: 768,
            height: 600,
            layout: 'fit',
            closable: false,
            buttons: [{
                text: '#{msgs.button_close}',
                cls : 'secondaryBtn',
                handler: function(button, eventObj) {
                    Ext.getCmp('roleMetricsEntitlements').hide();
                }
            }]
        });
        entitlementsDrilldown.show();
    } else {
        entitlementsDrilldown.setTitle(SailPoint.Role.Metrics.MetricDisplayNames[metric]);
        entitlementsDrilldown.show();
    }
    
    Ext.get(entitlementsDrilldown.body).mask('#{msgs.loading_data}');

    Ext.Ajax.request({
        url: SailPoint.getRelativeUrl('/rest/roleViewer/entitlements'),
        params: {roleId: roleId, metric: metric},
        callback: function(options, success, response) {
            var entitlementsObj = Ext.JSON.decode(response.responseText);
            SailPoint.Role.RoleDetailEntitlementsTemplate.overwrite(Ext.get('roleMetricsEntitlementsDisplay'), entitlementsObj);
            addDescriptionTooltipsFn($('roleMetricsEntitlementsDisplay'));
            Ext.get(entitlementsDrilldown.body).unmask();
        }
    });
};
