/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

// This template accepts a JSON 'role' object of the form:
// {
//     roleName: 'Role Name',
//     roleDisplayName: 'Role Display Name',
//     roleOwner: 'Role Owner', 
//     roleType: 'Type', 
//     roleDescription: 'description', 
//     roleActivityMonitoringEnabled: true || false, 
//     roleDisabled: true || false, 
//     ... (the rest of the role is not used in this template)
//  }
var roleDataTemplate = new Ext.XTemplate(
      '<div id="roleDataSection" class="spContentBody" style="background-color: #fff">',
        '<div class="spTabledContent"  style="margin: 6px">',
          '<table class="paddedTbl width100">',
            '<tbody>',
              '<tpl if="roleDeleted != \'\'">',
                '<tr>',
                  '<td colspan="2" class="requiredText">{roleDeleted}</td>',
                '</tr>',
              '<tpl else>',
                '<tr>',
                  '<td colspan="2" class="requiredText">{pendingChangeInfo}</td>',
                '</tr>',
              '</tpl>',
              '<tr><td class="titleColumn">{nameI18n}</td><td><span>{roleName:htmlEncode}</span></td>',
                '<tpl if="activationWarning != \'\'">',
                  '<td rowspan="3" valign="top"><div style="float:right;margin:5px 10px" class="activationNotice {activationWarningClass}">{activationWarning} {activationWarningDate}</div></td>',
                '</tpl>',
              '</tr>',
              '<tr><td class="titleColumn">{displayNameI18n}</td><td><span>{roleDisplayName:htmlEncode}</span></td></tr>',
              '<tr><td class="titleColumn">{ownerI18n}</td><td><span>{roleOwner:htmlEncode}</span></td></tr>',
              '<tr><td class="titleColumn">{scopeI18n}</td><td><span>{roleScope}</span></td></tr>',
              '<tr><td class="titleColumn">{typeI18n}</td><td colspan="2"><span>{roleType}</span></td></tr>',
              '<tr><td class="titleColumn">{descriptionI18n}</td><td colspan="2"><span>{roleDescription}</span></td></tr>',
              '<tpl if="roleActivityMonitoringIsEnabled">',
                '<tr><td class="titleColumn" colspan="3">{roleActivityMonitoringEnabled}</td></tr>',
              '</tpl>',
              '<tr><td class="titleColumn" colspan="3">{roleDisabled}</td></tr>',
            '</tbody>',
          '</table>',
        '</div>',
      '</div>');

var roleCategoryTemplate = new Ext.XTemplate(
    '<div>',
      '<table class="paddedTbl width100">',
        '<tpl for="attributes">',
          '<tr>',
            '<td style="border: 1px solid #CCC"><span class="titleColumn">','{displayName}','<tpl if="missing">','*','</tpl>','</span></td>',
            '<td style="border: 1px solid #CCC"><span>','<tpl if="value != null">','{value}','</tpl>','</span></td>',
          '</tr>',
        '</tpl>',
      '</table>',
    '</div>'
);

var roleEventsTemplate = new Ext.XTemplate(
    '<div>',
      '<table class="spTable width100">',
        '<tr>',
          '<th>#{msgs.work_item_type_event}</th>',
          '<th>#{msgs.date}</th>',
          '<th>#{msgs.creator}</th>',
        '</tr>',
        '<tpl for="events">',
          '<tr>',
            '<td width="25%">',
              '<span class="titleColumn">{name}</span>',
            '</td>',
            '<td >',
              '<span>{date}</span>',
            '</td>',
            '<td >',
              '<span>{creator}</span>',
            '</td>',
          '</tr>',
        '</tpl>',
      '</table>',
    '</div>'
)
;

var roleRightsTemplate = new Ext.XTemplate(
    '<div>',
      '<tpl if="capabilities != null">',
        '<table class="spTable width100">',
          '<tr>',
            '<th>#{msgs.capabilities}</th>',
          '</tr>',
          '<tpl for="capabilities">',
            '<tr>',
              '<td>',
                '<span class="titleColumn">{name}</span>',
              '</td>',
            '</tr>',
          '</tpl>',
        '</table>',
      '</tpl>',
    '</div>',
    '<div>',
      '<tpl if="scopes != null">',
        '<table class="spTable">',
          '<tr>',
            '<th>#{msgs.authorized_scopes}</th>',
          '</tr>',
          '<tpl for="scopes">',
            '<tr>',
              '<td>',
                '<span class="titleColumn">{name}</span>',
              '</td>',
            '</tr>',
          '</tpl>',
        '</table>',
      '</tpl>',
    '</div>'
);


Ext.ns('SailPoint', 'SailPoint.Role', 'SailPoint.Role.RoleView');

SailPoint.Role.RoleView.MAX_ROLES = 15;
SailPoint.Role.RoleView.MAX_ENTITLEMENTS = 10;

Ext.define('RoleSummary', {
    extend: 'Ext.data.Model',
    fields: [
        { name: 'name', type: 'string' },
        { name: 'roleType', type: 'string' },
        { name: 'description', type: 'string' }
    ]
});

Ext.define('SimpleEntitlement', {
    extend: 'Ext.data.Model',
    fields: [
        { name: 'applicationName', type: 'string' },
        { name: 'roleName', type: 'string' },
        { name: 'property', type: 'string' },
        { name: 'value', type: 'string' },
        { name: 'displayValue', type: 'string' }
    ]
});

SailPoint.Role.RoleView.SectionPanelBodyStyle = {
    background: "#dddddd",
    'overflow-y': 'hidden',
    'overflow-x': 'hidden'
};

SailPoint.Role.RoleView.getRoleReader = function() {
    return {
        type: 'json',
        root: 'roles',
        totalProperty: 'numRoleResults',
        idProperty: 'property'
    };
};

SailPoint.Role.RoleView.getEntitlementReader = function() {
    return {
        type: 'json',
        root: 'entitlements',
        totalProperty: 'numEntitlements',
        idProperty: 'id'
    };
};


SailPoint.Role.RoleView.populate = function(viewConfig) {
    var results = viewConfig.results;
    var prefix = viewConfig.prefix;
    var viewDiv = Ext.get(prefix + 'roleViewDiv');
    var roleDataDiv = Ext.get(prefix + 'roleData');
    var roleMetricsSection = Ext.getCmp(prefix + 'roleMetricsSectionPanel');
    var roleMetricsDiv = Ext.get(prefix + 'roleMetrics');
    var directEntitlementsDiv = Ext.get(prefix + 'roleDirectEntitlements');
    var includedEntitlementsDiv = Ext.get(prefix + 'roleIncludedEntitlements');
    var assignmentRuleDiv = Ext.get(prefix + 'roleAssignmentRule');
    var extendedAttributesSectionPanel = Ext.getCmp(prefix + 'extendedAttributesSectionPanel');
    var directEntitlementsSectionCard = Ext.getCmp(prefix + 'directEntitlementsSectionCardPanel');
    var directEntitlementsInvalidWarning = prefix + 'directEntitlementsInvalidWarning';
    var directEntitlementsSimpleInvalidWarning = prefix + 'directEntitlementsSimpleInvalidWarning';
    var includedEntitlementsSectionCard = Ext.getCmp(prefix + 'includedEntitlementsSectionCardPanel');
    var includedEntitlementsInvalidWarning = prefix + 'includedEntitlementsInvalidWarning';
    var includedEntitlementsSimpleInvalidWarning = prefix + 'includedtEntitlementsSimpleInvalidWarning';
    var assignmentRuleSection = Ext.getCmp(prefix + 'assignmentRuleSectionPanel');
    var inheritedRolesGridDataStore = Ext.StoreMgr.lookup(prefix + 'inheritedRolesGridDataStore');
    var permittedRolesGridDataStore = Ext.StoreMgr.lookup(prefix + 'permittedRolesGridDataStore');
    var requiredRolesGridDataStore = Ext.StoreMgr.lookup(prefix + 'requiredRolesGridDataStore');
    var simpleEntitlementsGridDataStore = Ext.StoreMgr.lookup(prefix + 'simpleEntitlementsGridDataStore');
    var simpleIncludedEntitlementsGridDataStore = Ext.StoreMgr.lookup(prefix + 'simpleIncludedEntitlementsGridDataStore');
    var permittedRolesPanel = Ext.getCmp(prefix + 'permittedRolesGridPanel');
    var permittedRolesSectionPanel = Ext.getCmp(prefix + 'permittedRolesSectionPanel');
    var inheritedRolesPanel = Ext.getCmp(prefix + 'inheritedRolesGridPanel');
    var inheritedRolesSectionPanel = Ext.getCmp(prefix + 'inheritedRolesSectionPanel');
    var requiredRolesPanel = Ext.getCmp(prefix + 'requiredRolesGridPanel');
    var requiredRolesSectionPanel = Ext.getCmp(prefix + 'requiredRolesSectionPanel');
    var dataSection = Ext.getCmp(prefix + 'dataSectionPanel');
    var roleEventsSection = Ext.getCmp(prefix + 'roleEventsSectionPanel');
    var roleEventsDiv = Ext.get(prefix + 'roleEvents');
    var assignmentInvalidWarningDiv = prefix + 'assignmentInvalidWarning';
    var inheritedRolesInvalidWarningDiv = prefix + 'inheritedRolesInvalidWarning';
    var inheritedRolesInvalidWarningValuesDiv = prefix + 'inheritedRolesInvalidValuesWarning';
    var requiredRolesInvalidWarningDiv = prefix + 'requiredRolesInvalidWarning';
    var requiredRolesInvalidWarningValuesDiv = prefix + 'requiredRolesInvalidValuesWarning';
    var permittedRolesInvalidWarningDiv = prefix + 'permittedRolesInvalidWarning';
    var permittedRolesInvalidWarningValuesDiv = prefix + 'permittedRolesInvalidValuesWarning';
    var roleRightsSection = Ext.getCmp(prefix + 'sailpointRightsSectionPanel');
    var rightsDiv = Ext.get(prefix + 'sailpointRights');

    // Grab the appropriate type definition and feed it into the results
    var typeDefStore = Ext.StoreMgr.lookup('roleTypeDefinitionStore');
    var typeDefinition = typeDefStore.getTypeDefinition(results.typeName);
    
    // These are blank warningOptions objects that will be used later on to 
    // show/hide 'invalid field' warnings
    var warningOptions = { contentDiv: '', fieldTitle: '' };
    var invalidValuesWarningOptions = { contentDiv: '', fieldTitle: '' };
    

    viewDiv.setVisibilityMode(Element.DISPLAY);
    roleDataDiv.setVisibilityMode(Element.DISPLAY);
    directEntitlementsDiv.setVisibilityMode(Element.DISPLAY);
  
    if (results.roleName) {
        // Fix the dates
        for (var i = 0; i < results.roleExtendableAttributesWithNoCategory.length; ++i) {
            var attr = results.roleExtendableAttributesWithNoCategory[i]; 
            if (attr.type == 'date' && attr.value !== null) {
                attr.value = SailPoint.Date.DateTimeRenderer(attr.value);
            }
        }
        
        for (var categoryName in results.roleExtendableAttributesByCategory) {
            for (var i = 0; i < results.roleExtendableAttributesByCategory[categoryName].length; ++i) {
                var attr = results.roleExtendableAttributesByCategory[categoryName][i]; 
                if (attr.type == 'date' && attr.value !== null) {
                    attr.value = SailPoint.Date.DateTimeRenderer(attr.value);
                }
            }
        }
        
        if(results.activationWarningDate) {
          results.activationWarningDate = SailPoint.Date.DateRenderer(results.activationWarningDate);
        }

        roleDataTemplate.overwrite(roleDataDiv, results);
        dataSection.show();
        
        if (extendedAttributesSectionPanel.items != null) {
            var toRemove = new Array(extendedAttributesSectionPanel.items.length);
            for (var i=0; i<extendedAttributesSectionPanel.items.length; ++i) {
                toRemove[i] = extendedAttributesSectionPanel.items.get(i);
            }
            
            for (var i=0; i<toRemove.length; ++i) {
                extendedAttributesSectionPanel.remove(toRemove[i]);
            }
        }

        var roleAttributeBodyStyle = {
            background: '#ffffff', 
            'overflow-y': 'auto',
            'overflow-x': 'hidden'
        }; 

        // This time Firefox is special
        if (Ext.isGecko) {
            roleAttributeBodyStyle['border-top'] = '1px solid #D0D0D0'; 
            roleAttributeBodyStyle['border-left'] = '1px solid #D0D0D0'; 
        }
        
        if(results.events){
          for (var i = 0; i < results.events.length; ++i) {
              var event = results.events[i]; 
              event.date = SailPoint.Date.DateRenderer(event.date);
          }
          roleEventsTemplate.overwrite(roleEventsDiv, results);
          roleEventsSection.show();
        } else {
          roleEventsSection.hide();
        }

        var numExtendedAttributes = 0;
        
        var extAttrNoCat = Ext.create('Ext.panel.Panel', {
            html: roleCategoryTemplate.apply({attributes: results.roleExtendableAttributesWithNoCategory}),
            layout:'anchor',
            anchor:'98%',
            style: 'padding: 10px;',
            bodyStyle: roleAttributeBodyStyle,
            border:false,
            autoScroll:true
        });

        extendedAttributesSectionPanel.add(extAttrNoCat);
        
        numExtendedAttributes += results.roleExtendableAttributesWithNoCategory.length;
        
        for (var categoryName in results.roleExtendableAttributesByCategory) {
            var child = Ext.create('Ext.panel.Panel', {
                html: roleCategoryTemplate.apply({attributes: results.roleExtendableAttributesByCategory[categoryName]}),
                layout:'anchor',
                anchor:'98%',
                border:false,
                title: categoryName,
                collapsible:true,
                collapsed:false,
                autoScroll:true,
                style: 'padding: 10px;',
                bodyStyle: roleAttributeBodyStyle
            });
            
            extendedAttributesSectionPanel.add(child);
            numExtendedAttributes++;
        }

        if (results.missingAttributePresent === true) {
          var missingAttributeInfoPanel = Ext.create('Ext.panel.Panel', {
              html: '*#{msgs.attr_does_not_apply}.',
              border:false
          });
  
          extendedAttributesSectionPanel.add(missingAttributeInfoPanel);
        }
        
        if (numExtendedAttributes > 0) {
            extendedAttributesSectionPanel.show();
            extendedAttributesSectionPanel.doLayout();
        } else {
            extendedAttributesSectionPanel.hide();
        }
        
        var roleMetrics = results.roleMetrics;
        var roleMetricsTemplate;
        // We shouldn't display metrics for archived roles so the editor doesn't include the metrics code
        if (SailPoint.Role.Metrics && !viewConfig.isArchive) {
            roleMetricsTemplate = SailPoint.Role.Metrics.Template;
            roleMetricsTemplate.overwrite(roleMetricsDiv, roleMetrics);
            roleMetricsSection.show();
        } else {
            roleMetricsSection.hide();
        }
        
        var roleDirectEntitlements = results.roleDirectEntitlements;
        var roleIncludedEntitlements = results.roleIncludedEntitlements;
        var roleEntitlementsTemplate = SailPoint.modeler.RoleEntitlementsTemplate;
        var roleAssignmentRulesTemplate = SailPoint.modeler.RoleAssignmentRuleTemplate;        
        var i18nWrapper = SailPoint.modeler.I18nEntitlementsWrapper;
        
        i18nWrapper.entitlements = roleDirectEntitlements;
        roleEntitlementsTemplate.overwrite(directEntitlementsDiv, i18nWrapper);

        i18nWrapper.entitlements = roleIncludedEntitlements;
        roleEntitlementsTemplate.overwrite(includedEntitlementsDiv, i18nWrapper);
                
        var roleAssignmentRule = results.roleSelector;
        warningOptions.contentDiv = assignmentInvalidWarningDiv;
        warningOptions.fieldTitle = '#{msgs.role_section_assignment_selector}';

        if (roleAssignmentRule) {
            if (!typeDefinition || typeDefinition.noAssignmentSelector) {
                SailPoint.Role.RoleView.displayInvalidFieldValuesWarning(warningOptions);
            } else {
                SailPoint.Role.RoleView.hideInvalidFieldWarning(warningOptions);
            }
        
            roleAssignmentRulesTemplate.overwrite(assignmentRuleDiv, roleAssignmentRule);
            assignmentRuleSection.show();
            assignmentRuleDiv.show();
        } else {
            SailPoint.Role.RoleView.hideInvalidFieldWarning(warningOptions);
            assignmentRuleDiv.hide();
            assignmentRuleSection.hide();
        }
        
        var storeParams = {
            start: 0, 
            limit: SailPoint.Role.RoleView.MAX_ROLES, 
            roleId: results.roleId
        }

        if (viewConfig.isArchive) {
            storeParams.archiveId = viewConfig.archiveId;
        }
        
        SailPoint.Role.RoleView.displayRoleReference({
            roleId: results.roleId,
            isShown: results.roleHasInheritance,
            isInvalid: !typeDefinition || typeDefinition.noSupers,
            warningDiv: inheritedRolesInvalidWarningDiv,
            warningFieldTitle: '#{msgs.role_membership}',
            warningValuesDiv: inheritedRolesInvalidWarningValuesDiv,
            warningValues: results.invalidInheritance,
            sectionPanel: inheritedRolesSectionPanel,
            gridPanel: inheritedRolesPanel,
            store: inheritedRolesGridDataStore,
            storeParams: storeParams
        });
        
        SailPoint.Role.RoleView.displayRoleReference({
            roleId: results.roleId,
            isShown: results.roleHasPermits,
            isInvalid: !typeDefinition || typeDefinition.noPermits,
            warningDiv: permittedRolesInvalidWarningDiv,
            warningFieldTitle: '#{msgs.role_section_permitted_roles}',
            warningValuesDiv: permittedRolesInvalidWarningValuesDiv,
            warningValues: results.invalidPermits,
            sectionPanel: permittedRolesSectionPanel,
            gridPanel: permittedRolesPanel,
            store: permittedRolesGridDataStore,
            storeParams: storeParams
        });

        SailPoint.Role.RoleView.displayRoleReference({
            roleId: results.roleId,
            isShown: results.roleHasRequirements,
            isInvalid: !typeDefinition || typeDefinition.noRequirements,
            warningDiv: requiredRolesInvalidWarningDiv,
            warningFieldTitle: '#{msgs.role_section_required_roles}',
            warningValuesDiv: requiredRolesInvalidWarningValuesDiv,
            warningValues: results.invalidRequirements,
            sectionPanel: requiredRolesSectionPanel,
            gridPanel: requiredRolesPanel,
            store: requiredRolesGridDataStore,
            storeParams: storeParams
        });
        
        viewDiv.show();
        roleDataDiv.show();
      
        warningOptions.contentDiv = directEntitlementsInvalidWarning;
        warningOptions.fieldTitle = '#{msgs.role_section_entitlements}';
      
        var hasEntitlements = roleDirectEntitlements.length > 0;
        if (hasEntitlements) {
            if (!typeDefinition || typeDefinition.noProfiles) {
                SailPoint.Role.RoleView.displayInvalidFieldValuesWarning(warningOptions);
            } else {
                SailPoint.Role.RoleView.hideInvalidFieldWarning(warningOptions);
            }
            if (results.hasSimpleEntitlements) {
                var entitlementStoreParams = {
                    start: 0,
                    limit: SailPoint.Role.RoleView.MAX_ENTITLEMENTS,
                    roleId: results.roleId
                }
                simpleEntitlementsGridDataStore.load(entitlementStoreParams);
                directEntitlementsSectionCard.layout.setActiveItem(0);
            }
            else {
                directEntitlementsSectionCard.layout.setActiveItem(1);
            }
            directEntitlementsSectionCard.show();
        } else {
            SailPoint.Role.RoleView.hideInvalidFieldWarning(warningOptions);
            directEntitlementsSectionCard.hide();
        }

        hasEntitlements = false;
        var hasPermissions = false;
      
        warningOptions.contentDiv = includedEntitlementsInvalidWarning;
        warningOptions.fieldTitle = '#{msgs.role_section_inherited_entitlements}';

        for (var i = 0; i < roleIncludedEntitlements.length; ++i) {
            hasEntitlements |= (roleIncludedEntitlements[i].rules.length > 0);
            hasPermissions |= (roleIncludedEntitlements[i].permissions.length > 0);
        }

        if (hasEntitlements) {
            if (!typeDefinition || typeDefinition.noProfiles) {
               // SailPoint.Role.RoleView.displayInvalidFieldValuesWarning(warningOptions);
            } else {
                SailPoint.Role.RoleView.hideInvalidFieldWarning(warningOptions);
            }
            if (results.hasSimpleIncludedEntitlements) {
                var includedEntitlementStoreParams = {
                    start: 0,
                    limit: SailPoint.Role.RoleView.MAX_ENTITLEMENTS,
                    roleId: results.roleId
                }
                simpleIncludedEntitlementsGridDataStore.load(includedEntitlementStoreParams);
                includedEntitlementsSectionCard.layout.setActiveItem(0);
            }
            else {
                includedEntitlementsSectionCard.layout.setActiveItem(1);
            }
            includedEntitlementsSectionCard.show();
        } else {
            SailPoint.Role.RoleView.hideInvalidFieldWarning(warningOptions);
            includedEntitlementsSectionCard.hide();
        }

        
        var versionSectionPanel = Ext.getCmp(prefix + 'versionSectionPanel');
        var versionGrid = Ext.getCmp(prefix + 'versionGrid');
        var versionGridDataStore = Ext.StoreMgr.lookup(prefix + 'versionGridDataStore');        
        var hasArchives = results.hasArchivedRoles;
        
        if (hasArchives && viewConfig.showVersionGrid) {
            versionGridDataStore.getProxy().setExtraParam('roleId', results.roleId);
            versionGridDataStore.loadPage(1, {
                callback: function(record, options, success) {
                    versionSectionPanel.show();
                    versionGrid.show();
                }
            });
        } else {
            versionSectionPanel.hide();
            versionGrid.hide();
        }

        if ( typeDefinition && !typeDefinition.noIIQ )  {
            if ( results.capabilities != null || results.scopes != null ) {
                roleRightsTemplate.overwrite(rightsDiv, results);
                roleRightsSection.show();
            } else {
                roleRightsSection.hide();
            }
        } else {
            roleRightsSection.hide();
        }
        
        Ext.getCmp(prefix + 'roleViewContentPanel').show();
    } else {
        SailPoint.Role.RoleView.clearRoleView({prefix: prefix});
    }
};

SailPoint.Role.RoleView.displayRoleReference = function(displayOptions) {
    var roleId = displayOptions.roleId;
    var storeParams = displayOptions.storeParams;
    var isShown = displayOptions.isShown;
    var isInvalid = displayOptions.isInvalid;
    var warningDiv = displayOptions.warningDiv;
    var warningValuesDiv = displayOptions.warningValuesDiv;
    var sectionPanel = displayOptions.sectionPanel;
    var gridPanel = displayOptions.gridPanel;
    var store = displayOptions.store;
    
    var warningOptions = {
        contentDiv: warningDiv,
        fieldTitle: displayOptions.warningFieldTitle
    };
    
    var invalidValuesWarningOptions = {
        contentDiv: warningValuesDiv,
        values: displayOptions.warningValues
    };
    
    if (isShown) {
        if (isInvalid) {
            SailPoint.Role.RoleView.displayInvalidFieldValuesWarning(warningOptions);
            Ext.get(warningDiv).show();
            Ext.getCmp(warningDiv + 'Container').show();
        } else {
            SailPoint.Role.RoleView.hideInvalidFieldWarning(warningOptions);
            Ext.get(warningDiv).hide();
            Ext.getCmp(warningDiv + 'Container').hide();
        }
        
        if (invalidValuesWarningOptions.values.length > 0) {
            SailPoint.Role.RoleView.displayInvalidFieldValuesWarning(invalidValuesWarningOptions);
            Ext.get(warningValuesDiv).show();
            Ext.getCmp(warningValuesDiv + 'Container').show();
        } else {
            SailPoint.Role.RoleView.hideInvalidFieldWarning(invalidValuesWarningOptions);
            Ext.get(warningValuesDiv).hide();
            Ext.getCmp(warningValuesDiv + 'Container').hide();
        }

        gridPanel.show();
        sectionPanel.show();
        
        store.load({ params: storeParams });
    } else {
        SailPoint.Role.RoleView.hideInvalidFieldWarning(warningOptions);
        Ext.get(warningDiv).hide();
        Ext.getCmp(warningDiv + 'Container').hide();
        gridPanel.hide();
        sectionPanel.hide();
        SailPoint.Role.RoleView.hideInvalidFieldWarning(invalidValuesWarningOptions);
        Ext.get(warningValuesDiv).hide();
        Ext.getCmp(warningValuesDiv + 'Container').hide();
    }
};

SailPoint.Role.RoleView.hideInvalidFieldWarning = function (options) {
    var warningDivEl = Ext.get($(options.contentDiv));
    Ext.DomHelper.applyStyles(warningDivEl, {display: 'none'});
};

SailPoint.Role.RoleView.invalidFieldValuesWarningTemplate = new Ext.XTemplate(
    '<div>{message}</div>',
    '<tpl for="values">',
      '<div style="margin-left:10px">{.}</div>',
    '</tpl>'
);

SailPoint.Role.RoleView.displayInvalidFieldValuesWarning = function (options) {
    var warningMsg = '#{msgs.role_invalid_field_values_warning}';
    var populatedWarningMsg = SailPoint.Role.RoleView.invalidFieldValuesWarningTemplate.apply({ 
        message: warningMsg, 
        values: options.values 
    });
    var warningDivEl = Ext.get($(options.contentDiv));
    Ext.DomHelper.applyStyles(warningDivEl, {display: ''});
    Ext.DomHelper.overwrite(warningDivEl, populatedWarningMsg);
};

SailPoint.Role.RoleView.getRoleViewContentPanel = function(config) {
    var prefix = config.prefix;
    var isMainView = config.isMainView;
    var roleReferenceParamBuilder = config.roleReferenceParamBuilder;
    
    var dataSectionConfig = {
    	xtype: 'panel',
        id: prefix + 'dataSectionPanel',
        bodyBorder: true,
        contentEl: prefix + 'dataSection',
        hidden: true,
        autoScroll: false,
        layout: 'fit',
        style: 'padding: 10px;',
        title: '#{msgs.attributes}',
        collapsible: true
    };
    
    var roleMetricsSectionConfig = {
        id: prefix + 'roleMetricsSectionPanel',
        contentEl: prefix + 'roleMetricsSection',
        hidden: true,
        autoScroll: false,
        layout: 'fit',
        collapsible: true,
        title: '#{msgs.role_metrics}',
        style: 'padding: 10px;',
        bodyBorder: true,
        bodyStyle: {
            'background': '#ffffff', 
            'overflow-y': 'auto',
            'overflow-x': 'hidden'
        },
        bbar: [
            Ext.create('Ext.button.Button', {
                text: '#{msgs.button_refresh}',
                tooltip: '#{msgs.button_refresh}',
                handler: function() {
                    var metricsSection = Ext.getCmp(prefix + 'roleMetricsSectionPanel');
                    var pollingTask = metricsSection.pollingTask;
                    if (!pollingTask) {
                        pollingTask = new Ext.util.DelayedTask(metricsSection.pollForMetrics, metricsSection);
                        metricsSection.pollingTask = pollingTask;
                    }
                    metricsSection.getEl().mask('#{msgs.refreshing_data}', 'x-mask-loading');
                    pollingTask.delay(1);
                }
            })
        ],
        pollForMetrics: function() {
            var viewerState = Ext.getCmp('roleViewerStateController').getState();
            var selectedRoleId = viewerState.selectedRoleId;
            
            Ext.Ajax.request({
                url: SailPoint.getRelativeUrl('/rest/roleViewer/refreshMetrics'),
                method: 'POST',
                params: {roleId: selectedRoleId},
                callback: function(options, success, response) {
                    var roleMetricsDiv = Ext.get(prefix + 'roleMetrics');
                    var roleMetricsTemplate = SailPoint.Role.Metrics.Template;
                    var metricsSection = Ext.getCmp(prefix + 'roleMetricsSectionPanel');
                    var responseObj = Ext.JSON.decode(response.responseText);
                    if (responseObj.isPending) {
                        metricsSection.pollingTask.delay(3000);
                    } else {
                        metricsSection.getEl().unmask();
                        roleMetricsTemplate.overwrite(roleMetricsDiv, responseObj.roleMetrics);
                        metricsSection.doLayout();
                    }
                }
            });
        }
    };
    
    var extendedAttributesSectionConfig = {
        id: prefix + 'extendedAttributesSectionPanel',
        contentEl: prefix + 'extendedAttributesSection',
        hidden: true,
        layout: 'fit',
        collapsible:true,
        bodyBorder: true,
        title:'#{msgs.oconfig_section_extended_attributes}',
        style: 'padding: 10px;',
        bodyStyle: {
            'background': '#ffffff', 
            'overflow-y': 'auto',
            'overflow-x': 'hidden'
        }
    };

    var directEntitlementsSectionConfig = {
        id: prefix + 'directEntitlementsSectionPanel',
        contentEl: prefix + 'directEntitlementsSection',
        hidden: true,
        autoScroll: false,
        title:'#{msgs.role_entitlement_profile}',
        layout: 'fit',
        collapsible:true,
        style: 'padding: 10px;',
        bodyBorder: true,
        bodyStyle: {
            'background': '#ffffff', 
            'overflow-y': 'auto',
            'overflow-x': 'hidden'
        }
    };


    var directEntitlementsSectionSimpleConfig = SailPoint.Role.RoleView.createSimpleEntitlementPanel({
        prefix: prefix,
        title: '#{msgs.role_simple_direct_entitlements}',
        hidden: true,
        type: 'simpleEntitlements',
        url: SailPoint.getRelativeUrl('/define/roles/modeler/readOnlySimpleEntitlementsJSON.json'),
        paramBuilder: roleReferenceParamBuilder,
        columns: [
            { dataIndex: 'applicationName', header: '#{msgs.role_simple_entitlement_application_name_header}', flex: 1, sortable: true },
            { dataIndex: 'property', header: '#{msgs.role_simple_entitlement_property_header}', flex: 1, sortable: true },
            { dataIndex: 'displayValue', header: '#{msgs.role_simple_entitlement_value_header}', flex: 3, sortable: true }
        ],
        disableSelect: true
    });


    var directEntitlementsSectionCardConfig = {
        id: prefix + 'directEntitlementsSectionCardPanel',
        layout:'card',
        activeItem:0,
        region:'center',
        items: [
            directEntitlementsSectionSimpleConfig,
            directEntitlementsSectionConfig
        ]
    };

    
    var includedEntitlementsSectionConfig = {
        id: prefix + 'includedEntitlementsSectionPanel',
        title: '#{msgs.role_section_inherited_entitlements}',
        hidden: true,
        collapsible: true,
        header: true,
        collapsed: true,
        contentEl: prefix + 'includedEntitlementsSection',
        autoScroll: false,
        title:'#{msgs.role_inherited_entitlement_profile}',
        layout: 'fit',
        collapsible:true,
        style: 'padding: 10px;',
        bodyBorder: true,
        bodyStyle: {
            'background': '#ffffff', 
            'overflow-y': 'auto',
            'overflow-x': 'hidden'
        }
    };
        
    var includedEntitlementsSectionSimpleConfig = SailPoint.Role.RoleView.createSimpleEntitlementPanel({
        prefix: prefix,
        title: '#{msgs.role_section_inherited_entitlements}',
        hidden: true,
        type: 'simpleIncludedEntitlements',
        url: SailPoint.getRelativeUrl('/define/roles/modeler/readOnlySimpleIncludedEntitlementsJSON.json'),
        paramBuilder: roleReferenceParamBuilder,
        columns: [
            { dataIndex: 'applicationName', header: '#{msgs.role_simple_entitlement_application_name_header}', flex: 1, sortable: true },
            { dataIndex: 'roleName', header: '#{msgs.role_simple_entitlement_role_header}', flex: 1, sortable: true },
            { dataIndex: 'property', header: '#{msgs.role_simple_entitlement_property_header}', flex: 1, sortable: true },
            { dataIndex: 'displayValue', header: '#{msgs.role_simple_entitlement_value_header}', flex: 3, sortable: true }
        ],
        disableSelect: true
    });


    var includedEntitlementsSectionCardConfig = {
        id: prefix + 'includedEntitlementsSectionCardPanel',
        layout:'card',
        activeItem:0,
        region:'center',
        items: [
            includedEntitlementsSectionSimpleConfig,
            includedEntitlementsSectionConfig
        ]
    };
    
    var eventSectionConfig = {
        id: prefix + 'roleEventsSectionPanel',
        autoScroll : false,
        contentEl: prefix + 'roleEvents',
        hidden: true,
        style: 'padding:10px',
        title:'#{msgs.role_section_role_events}',
        bodyBorder: true,
        layout: 'fit'
    };

    var rightsSectionConfig = {
        id: prefix + 'sailpointRightsSectionPanel',
        autoScroll : false,
        contentEl: prefix + 'sailpointRights',
        hidden: true,
        style: 'padding:10px',
        title: '#{msgs.role_section_sprights}',
        collapsible: true,
        titleCollapse: true,
        bodyBorder: true,
        layout: 'fit'
    };
    
    var assignmentRuleSectionConfig = {
        id: prefix + 'assignmentRuleSectionPanel',
        title: '#{msgs.role_label_assignment_selector}',
        hidden: true,
        style: 'padding: 10px;',
        collapsible: true,
        titleCollapse: true,
        contentEl: prefix + 'assignmentRuleSection',
        autoScroll: false,
        bodyBorder: true,
        layout: 'fit'
    };

    var versionGridPanelConfig = SailPoint.Role.RoleView.createVersionSection({
        prefix: prefix
    });
    
    var inheritedRolesPanelConfig = SailPoint.Role.RoleView.createRoleReferencePanel({
        prefix: prefix,
        title: '#{msgs.role_membership}',
        hidden: true,
        type: 'inheritedRoles',
        url: SailPoint.getRelativeUrl('/define/roles/modeler/inheritedRolesQueryJSON.json'),
        paramBuilder: roleReferenceParamBuilder,
        disableSelect: !isMainView
    });

    var permittedRolesPanelConfig = SailPoint.Role.RoleView.createRoleReferencePanel({
        prefix: prefix,
        title: '#{msgs.role_section_permitted_roles}',
        hidden: true,
        type: 'permittedRoles',
        url: SailPoint.getRelativeUrl('/define/roles/modeler/permittedRolesQueryJSON.json'),
        paramBuilder: roleReferenceParamBuilder,
        disableSelect: !isMainView
    });
    
    var requiredRolesPanelConfig = SailPoint.Role.RoleView.createRoleReferencePanel({
        prefix: prefix,
        title: '#{msgs.role_section_required_roles}',
        hidden: true,
        type: 'requiredRoles',
        url: SailPoint.getRelativeUrl('/define/roles/modeler/requiredRolesQueryJSON.json'),
        paramBuilder: roleReferenceParamBuilder,
        disableSelect: !isMainView
    });

    var contentPanelConfig = {
        id: prefix + 'roleViewContentPanel',
        contentEl: prefix + 'roleViewDiv',
        autoScroll: true,
        items: [
            dataSectionConfig,
            extendedAttributesSectionConfig,
            eventSectionConfig,
            roleMetricsSectionConfig,
            versionGridPanelConfig, 
            assignmentRuleSectionConfig,
            requiredRolesPanelConfig,
            permittedRolesPanelConfig,
            inheritedRolesPanelConfig,
            directEntitlementsSectionCardConfig,
            includedEntitlementsSectionCardConfig,
            rightsSectionConfig
        ]
    };
    
    if (isMainView) {
        contentPanelConfig.bbar = [
            new Ext.Button({
                id: 'roleEditOptions',
                text: '#{msgs.button_edit_role}',
                handler: function() {
                    var viewerState = Ext.getCmp('roleViewerStateController').getState();
                    $('viewerForm:roleToEdit').value = viewerState.selectedRoleId || viewerState.filteredNode;
                    $('viewerForm:editRole').click();
                }
            })
        ];
    }

    var roleViewContentPanel = Ext.create('Ext.panel.Panel', contentPanelConfig);
    
    return roleViewContentPanel;
};

SailPoint.Role.RoleView.clearRoleView = function(config) {
    var prefix;
    if (!config || !config.prefix) {
        prefix = '';
    } else {
        prefix = config.prefix;
    }
    var dataSection = Ext.getCmp(prefix + 'dataSectionPanel');
    var extendedAttributesSectionPanel = Ext.getCmp(prefix + 'extendedAttributesSectionPanel');
    var directEntitlementsSectionCard = Ext.getCmp(prefix + 'directEntitlementsSectionCardPanel');
    var includedEntitlementsSectionCard = Ext.getCmp(prefix + 'includedEntitlementsSectionCardPanel');
    var navigationPanel = Ext.getCmp(prefix + 'roleNavPanel');
    var eventsSection = Ext.getCmp(prefix + 'roleEventsSectionPanel');
    var metricsSection = Ext.getCmp(prefix + 'roleMetricsSectionPanel');
    var assignmentRuleSection = Ext.getCmp(prefix + 'assignmentRuleSectionPanel');
    var assignmentRuleDiv = Ext.get(prefix + 'roleAssignmentRule');
    var inheritedRolesPanel = Ext.getCmp(prefix + 'inheritedRolesGridPanel');
    var inheritedRolesSectionPanel = Ext.getCmp(prefix + 'inheritedRolesSectionPanel');
    var permittedRolesPanel = Ext.getCmp(prefix + 'permittedRolesGridPanel');
    var permittedRolesSectionPanel = Ext.getCmp(prefix + 'permittedRolesSectionPanel');
    var requiredRolesPanel = Ext.getCmp(prefix + 'requiredRolesGridPanel');
    var requiredRolesSectionPanel = Ext.getCmp(prefix + 'requiredRolesSectionPanel');
    var versionSectionPanel = Ext.getCmp(prefix + 'versionSectionPanel');
    var versionPanel = Ext.getCmp(prefix + 'versionGrid');
    var rightsPanel = Ext.getCmp(prefix + 'sailpointRightsSectionPanel');

    dataSection.hide();
    versionSectionPanel.hide();
    versionPanel.hide();
    extendedAttributesSectionPanel.hide();
    directEntitlementsSectionCard.hide();
    includedEntitlementsSectionCard.hide();
    inheritedRolesPanel.hide();
    inheritedRolesSectionPanel.hide();
    permittedRolesPanel.hide();
    permittedRolesSectionPanel.hide();
    requiredRolesPanel.hide();
    requiredRolesSectionPanel.hide();
    assignmentRuleSection.hide();
    eventsSection.hide();
    metricsSection.hide();
    assignmentRuleDiv.hide();
    navigationPanel.resetRoleEdit();
    rightsPanel.hide();
}

SailPoint.Role.RoleView.hideInvalidFieldWarning = function (options) {
    var warningDivEl = Ext.get($(options.contentDiv));
    Ext.DomHelper.applyStyles(warningDivEl, {display: 'none'});
}

SailPoint.Role.RoleView.invalidFieldValuesWarningTemplate = new Ext.XTemplate(
    '<div>{message}</div>',
    '<tpl for="values">',
      '<div style="margin-left:10px">{.}</div>',
    '</tpl>'
);

SailPoint.Role.RoleView.displayInvalidFieldValuesWarning = function (options) {
    var warningMsg = '#{msgs.role_invalid_field_values_warning}';
    var populatedWarningMsg = SailPoint.Role.RoleView.invalidFieldValuesWarningTemplate.apply({ 
        message: warningMsg, 
        values: options.values 
    });
    var warningDivEl = Ext.get($(options.contentDiv));
    Ext.DomHelper.applyStyles(warningDivEl, {display: ''});
    Ext.DomHelper.overwrite(warningDivEl, populatedWarningMsg);
}


SailPoint.Role.RoleView.createRoleReferencePanel = function(config) {
    var roleReferenceGridDataStore = Ext.create('Ext.data.Store', {
        id: config.prefix + config.type + 'GridDataStore',
        model: 'RoleSummary',
        proxy: {
            type: 'ajax',
            url: config.url,
            reader: SailPoint.Role.RoleView.getRoleReader()
        },
        remoteSort: true,
        pageSize: SailPoint.Role.RoleView.MAX_ROLES
    });
    
    // inject roleId into the request params...
    roleReferenceGridDataStore.on('beforeload', function(store, operation, eOpts) {
    	var params;
    	if (SailPoint.Role.Viewer) {
    	    // This only works in the role viewer
    	    params = SailPoint.Role.Viewer.getCurrentRoleId(); 
    	} else {
    	    // This works in the role editor
    	    params = { roleId: $('rollbackForm:roleToEdit').value };
    	}
    	
    	operation.params = operation.params || {};
    	Ext.applyIf(operation.params, params);
    });
    
    var roleReferenceGridPanelConfig = {
    	xtype: 'gridpanel',
    	prefix: config.prefix,
        title: config.title,
        id: config.prefix + config.type + 'GridPanel',
        collapsible: true,
        collapsed: true,
        hidden: true,
        store: roleReferenceGridDataStore,
        cls : 'smallFontGrid wrappingGridCells',
        columns: [
            { dataIndex: 'name', header: '#{msgs.name}', flex: 2, sortable: true },
            { dataIndex: 'roleType', header: '#{msgs.type}', flex: 1, sortable: true },
            { dataIndex: 'description', header: '#{msgs.description}', flex: 5, sortable: false }
        ],
        viewConfig: {
        	emptyText: '#{msgs.role_viewer_roles_unavailable}'
        },
        bbar: [
            Ext.create('SailPoint.ExtendedPagingToolbar', {
                store: roleReferenceGridDataStore,
                displayInfo: false,
                paramBuilder: config.paramBuilder
            })
        ]
    };
    
    if (!config.disableSelect) {
    	roleReferenceGridPanelConfig.listeners = {
    	    select: {
    	    	fn: SailPoint.Role.forceSelection
    	    }
    	}
    }
    
    var warningEl = config.prefix + config.type + 'InvalidWarning'; 
    var invalidValsEl = config.prefix + config.type + 'InvalidValuesWarning';
    
    var roleReferenceSectionConfig = {
    	xtype: 'panel',
        id: config.prefix + config.type + 'SectionPanel',
        style: 'padding: 10px',
        border: false,
        bodyBorder: false,
        hidden: true,
        bodyStyle: SailPoint.Role.RoleView.SectionPanelBodyStyle,
        items: [{
        		xtype: 'container',
        		id: warningEl + 'Container',
        		contentEl: warningEl
        	}, {
        		xtype: 'container',
        		id: invalidValsEl + 'Container',
        		contentEl: invalidValsEl
        	},
        	roleReferenceGridPanelConfig
        ]
    };
    
    return roleReferenceSectionConfig;
};

SailPoint.Role.RoleView.createSimpleEntitlementPanel = function(config) {

    var simpleEntitlementsGridDataStore = Ext.create('Ext.data.Store', {
        id: config.prefix + config.type + 'GridDataStore',
        model: 'SimpleEntitlement',
        proxy: {
            type: 'ajax',
            url: config.url,
            reader: SailPoint.Role.RoleView.getEntitlementReader()
        },
        remoteSort: true,
        pageSize: 10,
        autoLoad: true
    });


    // inject roleId into the request params...
    simpleEntitlementsGridDataStore.on('beforeload', function(store, operation, eOpts) {
        var params;
        params = SailPoint.Role.Viewer.getCurrentRoleId();
        operation.params = operation.params || {};
        Ext.applyIf(operation.params, params);
    });


    var simpleEntitlementsGridPanelConfig = {
        xtype: 'gridpanel',
        prefix: config.prefix,
        title: config.title,
        id: config.prefix + config.type + 'GridPanel',
        collapsible: true,
        collapsed: false,
        hidden: false,
        store: simpleEntitlementsGridDataStore,
        cls : 'smallFontGrid wrappingGridCells',
        columns: config.columns,
        viewConfig: {
            emptyText: '#{msgs.role_viewer_roles_unavailable}'
        },
        bbar: [
            Ext.create('SailPoint.ExtendedPagingToolbar', {
                store: simpleEntitlementsGridDataStore,
                displayInfo: false,
                paramBuilder: config.paramBuilder
            })
        ]
    };


    var simpleEntitlementSectionConfig = {
        xtype: 'panel',
        id: config.prefix + config.type + 'SectionPanel',
        style: 'padding: 10px',
        border: false,
        bodyBorder: false,
        hidden: true,
        bodyStyle: SailPoint.Role.RoleView.SectionPanelBodyStyle,
        items: [
            simpleEntitlementsGridPanelConfig
        ]
    };

    return simpleEntitlementSectionConfig;
};

SailPoint.Role.RoleView.createVersionSection = function(config) {
    var versionSectionPanelConfig = {
        id: config.prefix + 'versionSectionPanel',
        border: false,
        bodyBorder: false,
        style: 'padding: 10px',
        contentEl: config.prefix + 'versionSection',
        hidden: true,
        autoScroll: false,
        layout: 'fit',
        bodyStyle: SailPoint.Role.RoleView.SectionPanelBodyStyle,
        items: [SailPoint.Role.Version.getGrid({
            id: config.prefix + 'versionGrid',
            title: '#{msgs.title_archived_roles}',
            prefix: config.prefix
        })]
    };
    
    return versionSectionPanelConfig;
};

/*
 * { 
 *     applications: [{ 
 *         application: 'appName',
 *         attributes: [{
 *             name: 'attrName',
 *             showEntitlementDescription: true | false,
 *             values: [{
 *                 valueId: 'id',
 *                 isGroup: true | false,
 *                 displayName: 'name',
 *                 showInfoIcon: true | false,
 *                 description: 'description'
 *                 application: 'appName', <-- Workaround for XTemplate limitation
 *                 value: 'value'
 *             }, {...
 *             }]
 *         }, {...
 *         }]
 *     }, {...
 *     }]
 * }
 */
SailPoint.Role.RoleDetailEntitlementsTemplate = new Ext.XTemplate(
    '<tpl if="this.isEmpty(applications)">',
      '<div class="formInfo">#{msgs.no_entitlements_meet_criteria}</div>',
    '</tpl>',
    '<tpl for="applications">',
      '<span style="font-weight:bold">#{msgs.identity_app_entitlements} {application}</span>',
      '<table class="dashWidth100" style="margin: 0px 0px 3px 0px;"><tbody>',
        '<tpl for="attributes">',
          '<tr><td style="padding:3px; padding-right:5px; text-align:left;" class="title">',
            '#{msgs.label_value_or_values} #{msgs.on} <span class="entitlementTxt">{name}</span>',
          '</td></tr>',
          '<tr><td style="padding:2px; text-align:left; class="wide">',
            '<div class="entitlementTxt" style="padding-left:20px;">',
              '<tpl if="showEntitlementDescription">',
                '<div class="entitlementValues">',
              '</tpl>',
              '<tpl if="!showEntitlementDescription">',
                '<div class="entitlementValues style="display:none">',
              '</tpl>',
              '<tpl for="values">',
                '<span id="name_{valueId}">',
                  '<tpl if="isGroup">',
//                    '<span> debug: application is {application} and attribute is {parent.name} and value is {value}</span>',
                    '<span class="unboldFakeLink" onclick="viewAccountGroup(\'{application}\', \'{parent.name}\', \'{value}\');">',
                  '</tpl>',
                  '<tpl if="!isGroup">',
                    '<span>',
                  '</tpl>',
                    '{displayName}',
                  '</span>',
                  '<tpl if="xindex &lt; xcount">,&nbsp;</tpl>',
                  '<span class="wordbreak">&#8203;</span><span class="wordbreakIE6"><wbr/></span>',
                  '<tpl if={showInfoIcon}',
                    '<img src="', SailPoint.getRelativeUrl('/images/icons/info.png'), '">',
                  '</tpl>',
                '</span>',
              '</tpl>',
            '</div>',
            '<div class="entitlementDescriptions" style="display:none">',
              '<tpl for="values">',
                '<span id="description_{valueId}" class="entitlementTxt">{description}</span>',
              '</tpl>',
            '</div>',
          '</td></tr>',
        '</tpl>',
      '</tbody></table>',
    '</tpl>', {
    isEmpty: function(applications) {
        return (applications.length === 0);
    }
});
