/* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.EntitlementsEditor', {
    statics: {
        getEntitlementsEditor: function() {
            var tabPanels = [];
            var isGroupOptionsEnabled = ($('groupOptionsEnabled').innerHTML.toLowerCase() == "true");
            var isNewGroup = Ext.decode($('isNewGroup').innerHTML);
            var propertyTab;
            var groupOptionsTab;
            var membersTab;
            var currentTab = $('editForm:currentTab').value;
            var activeTab = 0;
            
            propertyTab = SailPoint.EntitlementsEditor.getPropertiesTab();
            tabPanels.push(propertyTab);
            
            if (isGroupOptionsEnabled) {
                groupOptionsTab = SailPoint.EntitlementsEditor.getGroupOptionsTab();
                tabPanels.push(groupOptionsTab);
                if (currentTab == 'Group') {
                    activeTab = 1;
                }
            }
            
            membersTab = SailPoint.EntitlementsEditor.getMembersTab();
            if (membersTab) {
                membersTab.on('activate', function (membersGrid, options) {
                    membersGrid.getStore().load();
                }, this, {
                    single: true
                });

                membersTab.on('activate', function (membersGrid, options) {
                    $('editForm:currentTab').value = 'Members';
                });

                tabPanels.push(membersTab);
                if (currentTab == 'Members') {
                    if (isGroupOptionsEnabled) {
                        activeTab = 2;
                    } else {
                        activeTab = 1;
                    }
                }
            }

            return Ext.create('Ext.tab.Panel', {
                id: 'entitlementsEditor',
                items: tabPanels,
                plain: true,
                activeTab: activeTab,
                dockedItems: [{
                    xtype: 'statusbar',
                    statusAlign: 'right',
                    dock: 'bottom',
                    items: [{ 
                        text: '#{msgs.button_save}',
                        cls : 'primaryBtn',
                        handler: function() { $('editForm:entitlementEditSave').click(); },
                        disabled: !$('applicationNameInput') || 
                            !$('applicationNameInput').value || 
                            $('applicationNameInput').value.length === 0 || 
                            (Ext.getCmp('typeComboCmp') && Ext.getCmp('typeComboCmp').isDisabled()) ||
                            $('editForm:entitlementEditSave').disabled
                    }, {
                        text: '#{msgs.button_cancel}',
                        handler: function() { $('editForm:entitlementEditCancel').click(); }
                    }]
                }]
            });
        },
        
        getPropertiesTab: function() {
            var initData;
            var iVal;
            var groupOwnerSuggest;
            var attributeSuggest;
            var ownerJSON;
            var ownerInit;
            var scopeSuggest;
            var scope;
            var typeCombo;
            var isScopeControlEnabled = ($('scopeControlEnabled').innerHTML.toLowerCase() == "true");
            var isGroupOptionsEnabled = ($('groupOptionsEnabled').innerHTML.toLowerCase() == "true");
            var application = $('applicationNameInput').value;
            var currentTypeVal = $('typeInput').value;
            var supportedTypesObj = Ext.decode($('supportedTypes').innerHTML, true);
            var supportedTypes;
            var supportedType;
            var i;
            var isCurrentTypeSelectionSupported = false;
            var managedAttributeMsg = '#{msgs.managed_attribute_no_supported_type}';
            
            if (!supportedTypesObj || !supportedTypesObj.supportedTypes) {
                supportedTypes = null;
            } else {
                supportedTypes = supportedTypesObj.supportedTypes;
            }
            
            if ($('typeCombo')) {
                if (supportedTypes.length == 1) {
                    $('typeCombo').innerHTML = '<span>' + supportedTypes[0][1] + '</span>';
                    $('typeInput').value = supportedTypes[0][0];
                } else {
                    typeCombo = new Ext.form.field.ComboBox({
                        id: 'typeComboCmp',
                        renderTo: 'typeCombo',
                        queryMode: 'local',
                        store: new Ext.data.ArrayStore({
                            id: 0,
                            fields: [
                                'typeValue',
                                'typeDisplayName'
                            ],
                            data: supportedTypes
                        }),
                        valueField: 'typeValue',
                        displayField: 'typeDisplayName',
                        triggerAction: 'all',
                        tpl: Ext.create('Ext.XTemplate',
                            '<ul><tpl for=".">',
                              '<li role="option" class="' + Ext.baseCSSPrefix + 'boundlist-item">',
                                '<tpl for="."><div class="baseSearch"><div class="sectionHeader">{typeDisplayName}</div></div></tpl>',
                              '</li>',
                            '</tpl></ul>'
                        ),
                        value: $('typeInput').value,
                        disabled: supportedTypes === null || supportedTypes.length === 0,
                        width: 300,
                        listeners: {
                            select: function(combo, selections, opts) {
                                var type = selections[0].data['typeValue'];
                                $('typeInput').value = type;
                                $('overriddenTypeWarning').style['display'] = 'none';
                                $('editForm:refreshAttributesBtn').click();
                            }
                        }
                    });
                }
            }
            
            // suggest component for group owner
            groupOwnerSuggest = new SailPoint.IdentitySuggest({
                id: 'accountGroupAppOwner',
                renderTo: 'groupOwnerSuggest', 
                binding: 'groupOwner',
                displayField: 'displayableName',
                baseParams: {context: 'Owner'},
                width: 300
            });
            
            ownerJSON = $('jsonSafeOwnerInfo').innerHTML;
            if (ownerJSON.length > 0) {
                iVal = Ext.decode(ownerJSON);                       
            }
            
            if(iVal && iVal.displayableName) {
                groupOwnerSuggest.setRawValue(iVal.displayableName); 
                SailPoint.Suggest.IconSupport.setIconDiv(groupOwnerSuggest, 'userIcon'); 
            }
            
            ownerInit = $('jsonSafeOwnerInit').innerHTML;
            if (ownerInit.length > 0) {
                initData = Ext.decode(ownerInit);
                groupOwnerSuggest.getStore().loadData(initData.identities);
                if (iVal) {
                    groupOwnerSuggest.setValue(iVal.id);       
                }
            }
            
            if (isScopeControlEnabled) {
                scopeSuggest = new SailPoint.ScopeSuggest({
                    renderTo: 'assignedScopeSuggest',
                    binding: 'assignedScope',
                    displayField: 'displayName',
                    width: 300,
                    listConfig : {width : 300}
                });
                scope = $('jsonSafeScope').innerHTML;
                if (scope.length > 0) {
                    initData = Ext.decode($('jsonSafeScopeInit').innerHTML);
                    scopeSuggest.getStore().loadData(initData.scopes);
                    scopeSuggest.setValue(scope);                      
                }
            }
            
            if ($('applicationName')) {
                var applicationSuggest = new SailPoint.BaseSuggest({
                    id: 'applicationSuggest',
                    renderTo: 'applicationName',
                    binding: 'applicationNameInput',
                    baseParams: {suggestType: 'application'},
                    displayField: 'displayName',
                    value: $('applicationNameInput').value,
                    width: 300
                });
          
                applicationSuggest.on('select', function(appSuggest, records, index) {
                    // reset type when application is changed
                    $('typeInput').value = '';

                    $('editForm:refreshAttributesBtn').click();
                });
      
                var appRecords = Ext.decode($('applicationInit').innerHTML);
                if (application.length > 0) {
                    applicationSuggest.getStore().loadData(appRecords.objects);
                    application = appRecords.objects[0].id;
                    applicationSuggest.setValue(application);
                    SailPoint.AccountGroup.updateReferenceAttributeSuggest(application);
                    attributeSuggest = Ext.getCmp('referenceAttributeSuggest');
                    if (attributeSuggest) {
                        attributeSuggest.setValue($('referenceAttributeInput').value);
                    }
                }
            }
            
            return {
                id: 'propertiesPanelCmp',
                title: '#{msgs.label_standard_properties}',
                xtype: 'panel',
                contentEl: 'propertyPanel',
                layout: 'fit',
                bodyCls: 'spBackground',
                bodyStyle: 'overflow:auto',
                listeners: {
                    afterlayout: {
                        fn: SailPoint.EntitlementsEditor.fixPropertiesPanelContents
                    }, activate: {
                        fn: function() { $('editForm:currentTab').value = 'Standard'; }
                    }
                }
            };
        },
        
        getGroupOptionsTab: function() {
            var groupAttributesTab = undefined;
            var isGroupTabEnabled = ($('showGroupTab').innerHTML.toLowerCase() == "true");
            var isSupportsHierarchy = ($('isSupportsHierarchy').innerHTML.toLowerCase() == "true");
            var application = $('applicationNameInput').value;
            var attribute = $('referenceAttributeInput').value;
            var permissionsGrid;
            var permissionsGridMetadata;
            var value;

            if (isGroupTabEnabled) {
                if ($('groupNativeIdentityReadOnly')) {
                    value = $('editForm:groupNativeIdentityReadOnly').innerHTML;
                } else {
                    value = $('editForm:groupNativeIdentity').value;
                }
                
                if (isSupportsHierarchy) {
                    SailPoint.AccountGroup.renderInheritedGroups(application, attribute, value);                    
                }
                
                groupAttributesTab = {
                    id: 'groupOptionsPanelCmp',
                    title: '#{msgs.object_properties}',
                    xtype: 'panel',
                    contentEl: 'groupOptionsPanel',
                    layout: 'fit',
                    bodyCls: 'spBackground',
                    bodyStyle: 'overflow:auto',
                    listeners: {
                        afterlayout: {
                            fn: SailPoint.EntitlementsEditor.fixGroupPanelContents
                        }, activate: { 
                            fn: function() { $('editForm:currentTab').value = 'Group'; }
                        }
                    }
                };
                
                if ($('permissions-display')) {
                    permissionsGridMetadata = Ext.decode($('permissionColumn').innerHTML);
                    permissionsGrid = getPermissionsGrid(permissionsGridMetadata, {id: $('editForm:id').value}, 20, '');
                    renderAccountGroupGrid(permissionsGrid, 'permissions-display', 600);
                }
                
                if ($('inheritingGroupsGridDiv')) {
                    SailPoint.EntitlementsEditor.renderInheritingGroupsGrid();
                }
            }
            return groupAttributesTab;
        },
        
        getMembersTab: function() {
            var showMembersTab = $('showMembersTab').innerHTML.toLowerCase() === 'true',
                grid = null;

            if (showMembersTab) {
                grid = getMembersGrid({id: $('editForm:id').value}, 20, '#{msgs.members}');
            }

            return grid;
        },
        
        /*
         * This is a hack to work around the unfortunate fact that the tab panel is yanking all 
         * the inputs out of the editForm because it's being rendered to the top of the viewport,
         * which is out of the editForm.  We used to have a hack that would wrap the form around
         * the viewport, but it seems to have regressed as part of the ExtJS 4 upgrade.
         * This hack copies visible inputs into hidden inputs on the editForm and yanks the hidden
         * FormPanel inputs back into the editForm.  Note that the latter bit of functionality
         * requires that this method be called *after* the collectFormData event fires.
         */
        copyFormParams: function() {
            var i;
            var formElements = [];
            var formElement;
            var formContainer;
            var showRequestableOption = ($('showRequestableOption').innerHTML.toLowerCase() == "true");
            
            // The next four lines maintain a stable facade while we shift crap from the viewport back into the form
            var entitlementsEditor = Ext.getCmp('entitlementsEditor');
            var entitlementsEditorHeight = entitlementsEditor.getHeight();
            entitlementsEditor.getActiveTab().mask(Ext.LoadMask.prototype.msg,'x-mask-loading');
            Ext.fly('propertyPanel').setHeight(entitlementsEditorHeight);
            Ext.fly('groupOptionsPanel').setHeight(entitlementsEditorHeight);
            
            if ($('editForm:unboundGroupNativeIdentity'))
                $('editForm:groupNativeIdentity').value=$('editForm:unboundGroupNativeIdentity').value;
            
            if ($('editForm:unboundGroupName'))
                $('editForm:groupName').value = $('editForm:unboundGroupName').value;
            
            if ($('editForm:unboundPermissionTarget')) {
                $('referenceAttributeInput').value = $('editForm:unboundPermissionTarget').value;
            }
            
            if (Ext.getCmp('inheritedAccountGroups'))
                $('editForm:inheritedAccountGroupIds').value = Ext.getCmp('inheritedAccountGroups').selectedStore.collect('id');
            
            if (Ext.getCmp('managedAttributeDescriptionHTMLCmp'))
                $('editForm:managedAttributeDescription').value = Ext.getCmp('managedAttributeDescriptionHTMLCmp').getCleanValue();
            
            if (Ext.getCmp('applicationSuggest'))
                $('applicationNameInput').value = Ext.getCmp('applicationSuggest').getValue();
            
            if (showRequestableOption) {
                $('editForm:requestableOption').checked = $('editForm:unboundRequestableOption').checked;                
            } else {
                $('editForm:requestableOption').checked = false;
            }

            // Move the form containers into the edit form
            formElements = formElements.concat(Ext.dom.Query.select('[class*=form-data]'));
            formElements = formElements.concat(Ext.dom.Query.select('[class*=form-errors]'));
            formElements = formElements.concat(Ext.dom.Query.select('[class*=form-validation]'));
            formElements = formElements.concat(Ext.dom.Query.select('[class*=form-action]'));
            formElements = formElements.concat(Ext.dom.Query.select('[class*=form-actionParameter]'));
            formElements = formElements.concat(Ext.dom.Query.select('[class*=form-submit]'));
            
            for (i = 0; i < formElements.length; ++i) {
                formElement = Ext.get(formElements[i]);
                formContainer = formElement.up('div');
                if (!formContainer.isMoved) {
                    formContainer.insertBefore('editForm:entitlementEditSave');                    
                    formContainer.isMoved = true;
                }
            }
        },
        
        /**
         * Fix the group panel content size.  One wouldn't expect such a big production, but ExtJS is 
         * just in over its head on this one.  Contending with a description widget and two
         * different forms spread across two tabs is beyond its layout capabilities.  To further complicate
         * matters, different browsers fire the various events that we plug into in different orders so 
         * we're basically forced to make these calculations on three separate occasions in order to guarantee
         * that the panel looks correct on *all* browsers.
         */
        fixGroupPanelContents: function(panel) {
            var groupPanel = Ext.getCmp('groupOptionsPanelCmp');
            var inheritedGroupsDiv = Ext.get('inheritedAccountGroups');
            var inheritedGroupsGrid = Ext.getCmp('inheritedGroupsGrid');
            var inheritingGroupsGridDiv = Ext.get('inheritingGroupsGridDiv');
            var permissionsDiv = Ext.get('permissions-display');
            var elementToHack;
            var i;
            
            SailPoint.EntitlementsEditor.fixFormLayouts();
            if (inheritedGroupsDiv) {
                // Fix the editable version of the grid
                Ext.getCmp('inheritedAccountGroups').doLayout();                
            } else if (inheritedGroupsGrid) {
                // Fix the read-only version of the grid
                inheritedGroupsGrid.doLayout();
            }
            
            if (inheritingGroupsGridDiv) {
                Ext.getCmp('inheritingGroupsGrid').doLayout();
            }
            
            if (permissionsDiv) {
                Ext.getCmp('permissionsGrid').doLayout();
            }

            if (groupPanel && groupPanel.getEl()) {
                var panelContents = groupPanel.getEl().down('div[class*=spContent]');
                var groupTables = panelContents.query('table[class*=paddedTbl]');
                var requiredMsg = panelContents.down('span[class*=font10]');
                var typeWarning = Ext.get('overriddenTypeWarning');
                var totalPanelHeight = (requiredMsg ? requiredMsg.getHeight() : 0) + (typeWarning ? typeWarning.getHeight() : 0) + 10;
                
                for (i = 0; i < groupTables.length; ++i) {
                    totalPanelHeight += Ext.get(groupTables[i]).getHeight();
                }
                
                if (inheritedGroupsDiv) {
                    totalPanelHeight += inheritedGroupsDiv.getHeight() + 40;
                }
                
                if (inheritingGroupsGridDiv) {
                    totalPanelHeight += inheritingGroupsGridDiv.getHeight() + 40;
                }

                if (permissionsDiv) {
                    totalPanelHeight += permissionsDiv.getHeight() + 80;
                }
                
                panelContents.initialHeight = totalPanelHeight;
                SailPoint.TabPanel.sizeContentsToPanel(groupPanel);
                
                // IE7 doesn't fully respond to the sizeContentsToPanel function.
                // We have to prod it a little bit.
                if (Ext.isIE7) {
                    var optionsTable = Ext.get('groupOptionsTable');
                    var formRendererDiv = optionsTable.down('div[class*=form-renderer]');
                    if (formRendererDiv) {
                        elementToHack = formRendererDiv.down('div');
                        if (elementToHack) {
                            elementToHack.repaint();                                                                    
                        }
                    }
                    elementToHack = inheritedGroupsDiv;
                    if (elementToHack) {
                        elementToHack.repaint();                                        
                    }
                    elementToHack = inheritingGroupsGridDiv;
                    if (elementToHack) {
                        elementToHack.repaint();                                        
                    }
                    elementToHack = permissionsDiv;
                    if (elementToHack) {
                        elementToHack.repaint();                                        
                    }
                }
                
                // Set a min width on the body
                if (panelContents.getWidth() < 700) {
                    panelContents.setWidth(700);
                }
            }
        },
        
        /**
         * Fix the properties panel content size.  One wouldn't expect such a big production, but ExtJS is 
         * just in over its head on this one.  Contending with a description widget and two
         * different forms spread across two tabs is beyond its layout capabilities.  To further complicate
         * matters, different browsers fire the various events that fire off this logic in different orders so 
         * these calculations have to happen on three separate occasions in order to guarantee
         * that the panel looks correct on *all* browsers.
         */
        fixPropertiesPanelContents: function(panel) {
            var propertiesPanel = Ext.getCmp('propertiesPanelCmp');
            SailPoint.EntitlementsEditor.fixFormLayouts();
            if (propertiesPanel && propertiesPanel.getEl()) {
                var panelContents = propertiesPanel.getEl().down('div[class*=spContent]');

                if (!propertiesPanel.descriptionsInitialized) {
                    SailPoint.AccountGroup.initDescriptions();
                    propertiesPanel.descriptionsInitialized = true;
                }
                
                var propertiesPanelTables = panelContents.query('table[class*=paddedTbl]');
                var i;
                var totalPanelHeight = 0;
                for (i = 0; i < propertiesPanelTables.length; ++i) {
                    totalPanelHeight += Ext.get(propertiesPanelTables[i]).getHeight();
                }
                
                panelContents.initialHeight = totalPanelHeight;

                SailPoint.TabPanel.sizeContentsToPanel(propertiesPanel);
                
                // IE7 doesn't fully respond to the sizeContentsToPanel function.
                // We have to prod it a little bit.
                if (Ext.isIE7) {
                    var elementToHack = Ext.get('groupOwnerSuggest');
                    if (elementToHack) {
                        elementToHack.repaint();                                        
                    }
                    
                    elementToHack = Ext.get('assignedScopeSuggest');
                    if (elementToHack) {
                        elementToHack.repaint();                                        
                    }

                    var attributesTable = Ext.get('extendedAttributesTable');
                    var formRendererDiv = attributesTable.down('div[class*=form-renderer]');
                    if (formRendererDiv) {
                        elementToHack = formRendererDiv.down('div');
                        if (elementToHack) {
                            elementToHack.repaint();                                                                    
                        }
                    }
                }

                // Set a min width on the body
                if (panelContents.getWidth() < 700) {
                    panelContents.setWidth(700);
                }
            }
        },
        
        fixFormLayouts: function() {
            var numActiveForms = SailPoint.activeForms ? SailPoint.activeForms.length : 0;
            var i;
            
            // Layout the unmanaged components now that the panel is properly sized
            for (i = 0; i < numActiveForms; ++i) {
                Ext.getCmp(SailPoint.activeForms[i]).doLayout();
            }
        },
        
        isValidForms: function() {
            // validate multiple forms allowing for any to be undefined
            var formsValidated = true;
            var formPanel;
            var formToValidate;
            for (var i=0; i < arguments.length; i++) {
                formPanel = Ext.getCmp(arguments[i]);
                if (formPanel) {
                    formToValidate = formPanel.getForm();
                    if (formToValidate) {
                        formsValidated = formsValidated && formToValidate.isValid();
                    }
                }
            }
            return formsValidated;
        },
        
        renderInheritingGroupsGrid: function() {
            var gridId = 'inheritingGroupsGrid';
            var baseHeight = new Number($('numInheriting').value) * 50 + 28;
            var pageSize = 10;
            
            // data store
            var store = SailPoint.Store.createStore({
                model : 'SailPoint.model.Empty',
                storeId: gridId +'Store',
                extraParams : { id: $('editForm:id').value },
                url: CONTEXT_PATH + '/define/groups/inheritingNameOnlyAccountGroupsDataSource.json',
                remoteSort: true,
                simpleSortMode: true,
                pageSize: pageSize,
                autoLoad: true,
                listeners: {
                    exception: function(proxy, store, response, e) {
                        alert('error loading ' + gridId + ' grid:' + e);
                    },
                    metachange: reloadMetaData
                }
            });
            
            new SailPoint.grid.PagingGrid({
                id: gridId,
                cls: 'wrappingGridCells',
                collapsible: false,
                collapsed: false,
                titleCollapse: true,
                width: 600,
                height: baseHeight > 128 ? baseHeight : 128,
                store: store,
                renderTo: 'inheritingGroupsGridDiv',
                columns: [{header: 'name', sortable: true}, {header: 'owner', sortable: true}],
                viewConfig : {
                    stripeRows: true
                },
                loadMask: true,
                pageSize: pageSize
            });
        }
    }
});
