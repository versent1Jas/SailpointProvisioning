/* (c) Copyright 2010 SailPoint Technologies, Inc., All Rights Reserved. */
Ext.ns('SailPoint', 'SailPoint.Role', 'SailPoint.Role.Mining');

SailPoint.Role.Mining.getRoleMiningPanel = function(config) {
    var roleMiningPanel = Ext.getCmp('roleMiningPanel');
    var activeItem;
    if (config && config.activeItem) {
        activeItem = config.activeItem;
    } else {
        activeItem = 0;
    }
    
    if (!roleMiningPanel) {
        roleMiningPanel = new Ext.Panel({
           id: 'roleMiningPanel',
           title: '#{msgs.title_role_mining}',
           layout: 'card',
           border: false,
           activeItem: activeItem,
           items: [
               SailPoint.roles.getMiningTemplatesPanel({
                 id: 'roleMiningTemplatesPanel',
                 title: '#{msgs.title_role_mining_templates}'
               }),                   
               SailPoint.roles.getItRoleMiningPanel({
                   id: 'itRoleMiningPanel',
                   title: '#{msgs.title_automated_directed_mining}'
               }),
               SailPoint.roles.getBusinessRoleMiningPanel({
                   id: 'bfrMiningPanel',
                   title: '#{msgs.title_bfr_mining}'
               })
           ]
        });

        roleMiningPanel.on('activate', function() {
            roleMiningPanel.getLayout().setActiveItem(0);
        }, this, { single: true });
        
        roleMiningPanel.on('deactivate', function() {
            var taskResultViewer = Ext.getCmp('taskResultViewerWindow');
            if (taskResultViewer) {
                taskResultViewer.hide();
            }
        });

    }

    return roleMiningPanel;
};

Ext.define('SailPoint.Role.ITRoleMiningPanel', {
	extend : 'Ext.panel.Panel',
    initComponent: function() {
        var itRoleMiningPanel = this;
        Ext.apply(this, {
            border: false,
            header: false,
            autoScroll: true,
            tbar: [{
                text: '#{msgs.view_mining_templates}',
                scale : 'medium',
                handler: function() {
                    itRoleMiningPanel.clearMiningParams();
                    Ext.getCmp('roleMiningPanel').getLayout().setActiveItem(0);
                }
            }],
            bbar: [{
                id: 'saveITRoleMiningTemplateBtn',
                text: '#{msgs.button_save}',
                cls : 'primaryBtn',
                layout: {
                    pack: 'center'
                },
                handler: function() {
                    var validated = itRoleMiningPanel.validate();
                    if( validated ) {
                        SailPoint.roles.saveTemplatePrompt({
                            type: 'it',
                            panel: Ext.getCmp('itRoleMiningPanel'),
                            templateName: $('scheduleItRoleMiningForm:itRoleMiningTemplateName').value,
                            originalTemplateName: $('scheduleItRoleMiningForm:itRoleMiningOriginalTemplateName').value,
                            saveFromExistingHandler: function() {
                                if(Ext.getCmp('itWindowTemplateSaveNew').checked) {
                                    $('scheduleItRoleMiningForm:itRoleMiningTemplateId').value = '';
                                    $('scheduleItRoleMiningForm:itRoleMiningTemplateName').value = Ext.getCmp('itWindowTemplateName').getValue();
                                }
                                Ext.getCmp('itMiningTemplateSaveWindow').hide();
                                $('scheduleItRoleMiningForm:saveAsNew').click();
                            },
                            saveFromScratchHandler: function(btn, text) {
                                $('scheduleItRoleMiningForm:itRoleMiningTemplateId').value = '';
                                $('scheduleItRoleMiningForm:itRoleMiningTemplateName').value = text;
                                $('scheduleItRoleMiningForm:saveAsNew').click();                                
                            }
                        });
                    } else {
                        Ext.MessageBox.alert('#{msgs.err_validation}', '#{msgs.err_automated_mining_launch_invalid}');
                    }
                }
            },{
                id: 'launchITRoleMiningBtn',
                text: '#{msgs.button_save_and_exec}',
                cls : 'primaryBtn',
                handler: function() {
                    var validated = itRoleMiningPanel.validate();
                    if( validated ) {
                        SailPoint.roles.saveTemplatePrompt({
                            type: 'itSaveAndExec',
                            panel: Ext.getCmp('itRoleMiningPanel'),
                            templateName: $('scheduleItRoleMiningForm:itRoleMiningTemplateName').value,
                            originalTemplateName: $('scheduleItRoleMiningForm:itRoleMiningOriginalTemplateName').value,
                            saveFromExistingHandler: function() {
                                if(Ext.getCmp('itSaveAndExecWindowTemplateSaveNew').checked) {
                                    $('scheduleItRoleMiningForm:itRoleMiningTemplateId').value = '';
                                    $('scheduleItRoleMiningForm:itRoleMiningTemplateName').value = Ext.getCmp('itSaveAndExecWindowTemplateName').getValue();
                                }
                                Ext.getCmp('itSaveAndExecMiningTemplateSaveWindow').hide();
                                $('scheduleItRoleMiningForm:saveAndExecuteButton').click();
                            },
                            saveFromScratchHandler: function(btn, text) {
                                $('scheduleItRoleMiningForm:itRoleMiningTemplateId').value = '';
                                $('scheduleItRoleMiningForm:itRoleMiningTemplateName').value = text;
                                $('scheduleItRoleMiningForm:saveAndExecuteButton').click();                                
                            }
                        });
                    } else {
                        Ext.MessageBox.alert('#{msgs.err_validation}', '#{msgs.err_automated_mining_launch_invalid}');
                    }
                }
            },{
                id: 'viewITRoleMiningTaskResultsBtn',
                text: '#{msgs.button_view_last_mining_result}',
                handler: function() {
                    itRoleMiningPanel.viewLastTaskResult();
                }
            },{
                id:'clearITRoleMiningTemplateBtn',
                text: '#{msgs.button_cancel}',
                cls : 'secondaryBtn',
                handler: function() {
                    itRoleMiningPanel.templateId = '';
                    itRoleMiningPanel.clearMiningParams();
                    Ext.getCmp('roleMiningPanel').getLayout().setActiveItem(0);
                }
            }],
            loader: {}
        });
        this.callParent(arguments);
    },
    
    getEntitlementsLoadMask: function() {
        var entitlementsDiv = Ext.get('itRoleMiningEntitlementsToInclude');
        if (!this.entitlementsLoadMask && entitlementsDiv) {
            this.entitlementsLoadMask = new Ext.LoadMask(entitlementsDiv, {
                msg: '#{msgs.role_mining_refreshing_entitlements}'
            });
        }
        
        return this.entitlementsLoadMask;
    },

    getMainPanelLoadMask: function() {
        var miningPanelBody = this.body;
        if (!this.mainPanelLoadMask && miningPanelBody) {
            this.mainPanelLoadMask = new Ext.LoadMask(miningPanelBody, {
                msg: '#{msgs.it_role_mining_launching}'
            });
        }
        return this.mainPanelLoadMask;
    },
    
    validate: function() {
        var response = true
        
        /* Validate name */
        var templateNameField = $('scheduleItRoleMiningForm:itRoleMiningTemplateName');
        var templateNameErrorField = $('itRoleMiningTemplateNameError');
        templateNameErrorField.style['display'] = 'none';
        if (templateNameField.value == undefined || templateNameField.value === '') {
            templateNameErrorField.style['display'] = '';
            response = false;
        }
        
        /* Validate owner */
        var templateOwnerField = $( 'scheduleItRoleMiningForm:itRoleMiningOwner' );
        var templateOwnerErrorField = $( 'itRoleMiningTemplateNoOwnerError' ); 
        templateOwnerErrorField.style['display'] = 'none';
        if( templateOwnerField.value == undefined || templateOwnerField.value == false ) {
            templateOwnerErrorField.style['display'] = '';
            response = false;
        }
        /* Validate applications */
        var applicationsToMineField = $( 'scheduleItRoleMiningForm:itRoleMiningAppNameSuggest' );
        var applicationsToMineErrorField = $( 'itRoleMiningTemplateNoApplicationsError' );
        applicationsToMineErrorField.style['display'] = 'none';
        if( applicationsToMineField.value == undefined || applicationsToMineField.value == false ) {
            applicationsToMineErrorField.style['display'] = '';
            response = false;
        }
        return response;
    },

    showSearchFilterOptions: function(optionToShow) {
        if (optionToShow == 'searchByIpop') {
            $('identityAttributesRow').style['display'] = 'none';
            $('ipopSelectorRow').style['display'] = '';            
        } else {
            $('identityAttributesRow').style['display'] = '';
            $('ipopSelectorRow').style['display'] = 'none';
        }
    },
    
    initMiningAppSuggest: function() {
        var itRoleMiningPanel = this;
        var miningAppNameMultiSuggest = Ext.getCmp('itRoleMiningAppNameMultiSuggestCmp');
    
        if (miningAppNameMultiSuggest) {
            miningAppNameMultiSuggest.selectedStore.loadData(Ext.decode($('itRoleMiningAppNameMultiSuggestData').innerHTML));
        } else {
            miningAppNameMultiSuggest = new SailPoint.MultiSuggest({
                id: 'itRoleMiningAppNameMultiSuggestCmp',
                renderTo: 'itRoleMiningAppNameMultiSuggest',
                suggestType: 'application',
                jsonData: Ext.decode($('itRoleMiningAppNameMultiSuggestData').innerHTML),
                inputFieldName: 'scheduleItRoleMiningForm:itRoleMiningAppNameSuggest'
            });
            
            miningAppNameMultiSuggest.selectedStore.on('add', itRoleMiningPanel.addApplication, this);
            miningAppNameMultiSuggest.selectedStore.on('clear', itRoleMiningPanel.clearEntitlements, this);
            miningAppNameMultiSuggest.selectedStore.on('remove', itRoleMiningPanel.clearEntitlements, this);
        }
    },
    
    initMiningOwnerSuggest: function() {
        var miningOwnerSuggest = Ext.getCmp( 'itRoleMiningOwnerSuggestCmp' );
        if (!miningOwnerSuggest) {
            miningOwnerSuggest = new SailPoint.IdentitySuggest({
                id: 'itRoleMiningOwnerSuggestCmp',
                renderTo: 'itRoleMiningOwnerSuggest', 
                binding: $('scheduleItRoleMiningForm:itRoleMiningOwner'),
                allowBlank: false,
                emptyText: '#{msgs.select_owner}',
                baseParams: {context: 'Owner'}
            });
        }
        miningOwnerSuggest.clearValue();
        miningOwnerSuggest.setRawValue($( 'scheduleItRoleMiningForm:itRoleMiningOwnerName' ).value);
    },
    
    initExcludedEntitlementsSuggest: function() {
        var includedAppData = Ext.getCmp('itRoleMiningAppNameMultiSuggestCmp').getData();
        var appIds = [];
        var i;
        var excludedEntitlementsSuggest = Ext.getCmp('itRoleMiningExcludedEntitlementsSuggestCmp');

        if (excludedEntitlementsSuggest) {
            excludedEntitlementsSuggest.setValue($( 'itRoleMiningExcludedEntitlementsSuggest' ).value);
        } else {            
            for (i = 0; i < includedAppData.totalCount; ++i) {
                appIds.push(includedAppData.objects[i].id);
            }
            
            excludedEntitlementsSuggest = SailPoint.SuggestFactory.createSuggest(
                'excludedEntitlement',
                'itRoleMiningExcludedEntitlementsSuggest',
                null,
                '#{msgs.select_entitlement}', 
                {
                    id: 'itRoleMiningExcludedEntitlementsSuggestCmp',
                    allowBlank: true,
                    renderTo: 'itRoleMiningExcludedEntitlementsSuggest',
                    value: '',
                    baseParams: {includedApps: appIds.join(",")},
                    tpl: new Ext.XTemplate(
                        '<tpl for=".">',
                            '<div class="baseSearch x-boundlist-item">',
                                '<div class="sectionHeader">{applicationName}</div>',
                                '<div class="indentedColumn">{displayName}</div>',
                            '</div>',
                        '</tpl>'
                    ), 
                    fields: ['id', 'displayName', 'purview', 'applicationName'],
                    width: 350
                }
            );
            
            excludedEntitlementsSuggest.on('select', Ext.getCmp('itRoleMiningPanel').excludeEntitlement, this);

        }
    },
    
    initMiningIpopSelector: function() {
        var ipopNameInput = Ext.DomQuery.selectNode('option[selected=selected]', $('scheduleItRoleMiningForm:ipopName'));
        var ipopVal;
        
        if (ipopNameInput) {
            ipopVal = Ext.get(ipopNameInput).dom.value;
        }

        if (ipopVal && ipopVal != '') {
            this.updateIpopDescription(ipopVal);
        }
    },
    
    addApplication: function(store, appsThatWereAdded, indexWhereTheyWereAdded) {
        var includedAppData = Ext.getCmp('itRoleMiningAppNameMultiSuggestCmp').getData();
        var appIds = [];
        var i;
        
        for (i = 0; i < includedAppData.totalCount; ++i) {
            appIds.push(includedAppData.objects[i].id);
        }
        
        Ext.getCmp('itRoleMiningExcludedEntitlementsSuggestCmp').baseParams.includedApps = appIds.join(",");
        Ext.getCmp('itRoleMiningExcludedEntitlementsSuggestCmp').getStore().getProxy().extraParams.includedApps = appIds.join(",");
        Ext.getCmp('itRoleMiningExcludedEntitlementsSuggestCmp').getStore().load({
            params: {start: 0, limit: 10},
            callback: Ext.getCmp('itRoleMiningPanel').updatePopulation
        });
    },
    
    clearEntitlements: function(applicationStore, options) {
        var excludedEntitlementsObj;
        var excludedEntitlements;
        var entitlementsToContinueToExclude = [];
        var includedAppData = Ext.getCmp('itRoleMiningAppNameMultiSuggestCmp').getData();
        var appIds = [];
        var i;
        var removedApplicationRecord;
        
        if (applicationStore.removed && applicationStore.removed.length > 0) {
            // objects are added to the end of the removed list. Pull from the end
            removedApplicationRecord = applicationStore.removed[applicationStore.removed.length-1];
        }
            
        if (!removedApplicationRecord) {
            // This is a full clear
            excludedEntitlementsObj = {entitlements: []};
            Ext.getCmp('itRoleMiningExcludedEntitlementsSuggestCmp').baseParams.includedApps = '';
            Ext.getCmp('itRoleMiningExcludedEntitlementsSuggestCmp').getStore().getProxy().extraParams.includedApps = '';
        } else {
            // Fix the excluded entitlements suggest so it no longer includes entitlements for the app that was removed
            for (i = 0; i < includedAppData.totalCount; ++i) {
                appIds.push(includedAppData.objects[i].id);
            }
            Ext.getCmp('itRoleMiningExcludedEntitlementsSuggestCmp').baseParams.includedApps = appIds.join(",");
            Ext.getCmp('itRoleMiningExcludedEntitlementsSuggestCmp').getStore().getProxy().extraParams.includedApps = appIds.join(",");

            // Recreate the excluded entitlements list, including only those entitlements that still have apps associated with them
            if (!$('scheduleItRoleMiningForm:itRoleMiningExcludedEntitlements').value || $('scheduleItRoleMiningForm:itRoleMiningExcludedEntitlements').value.length == 0) {
                excludedEntitlementsObj = {entitlements: []};
            } else {
                excludedEntitlementsObj = Ext.JSON.decode($('scheduleItRoleMiningForm:itRoleMiningExcludedEntitlements').value);
            }
            
            excludedEntitlements = excludedEntitlementsObj.entitlements;
            
            for (i = 0; i < excludedEntitlements.length; ++i) {
                //ApplicationRecord has appName as the displayName. Have to use this because entitlements only have AppName, not Id
                if (removedApplicationRecord.get("displayName") != excludedEntitlements[i].application) {
                    entitlementsToContinueToExclude.push(excludedEntitlements[i]);
                }
            }
            
            excludedEntitlementsObj.entitlements = entitlementsToContinueToExclude;
        }
        
        $('scheduleItRoleMiningForm:itRoleMiningExcludedEntitlements').value = Ext.JSON.encode(excludedEntitlementsObj);
        this.updateEntitlementsTable();
        this.updatePopulation();
    },
    
    clearMiningParams: function() {
        var defaults = Ext.JSON.decode($('itRoleMiningDefaults').innerHTML);
        $('scheduleItRoleMiningForm:itRoleMiningTemplateId').value = '';
        $('scheduleItRoleMiningForm:itRoleMiningTemplateName').value = '';
        if ($('scheduleItRoleMiningForm:itRoleMiningOwner').value != defaults.ownerId) {
            $('scheduleItRoleMiningForm:itRoleMiningOwner').value = defaults.ownerId;
            Ext.getCmp('itRoleMiningOwnerSuggestCmp').setRawValue(defaults.ownerName);
        }
        Ext.getCmp('itRoleMiningAppNameMultiSuggestCmp').clear();
        this.resetAttributeSelector();
        this.resetAttributesTable();
        $('scheduleItRoleMiningForm:minIdentities').value = defaults.minIdentities;
        $('scheduleItRoleMiningForm:minEntitlements').value = defaults.minEntitlements;
        $('scheduleItRoleMiningForm:maxCandidates').value = defaults.maxCandidateRoles;
        this.updatePopulation();
        /* Reset Error fields */
        var templateOwnerErrorField = $( 'itRoleMiningTemplateNoOwnerError' );
        if( templateOwnerErrorField )
            templateOwnerErrorField.style['display'] = 'none';
        var applicationsToMineErrorField = $( 'itRoleMiningTemplateNoApplicationsError' );
        if( applicationsToMineErrorField )
            applicationsToMineErrorField.style['display'] = 'none';
        
        var itRoleMiningSearchInfo = $('itRoleMiningSearchInfo');
        if (itRoleMiningSearchInfo) {
            itRoleMiningSearchInfo.style['display'] = 'none';
        }
        
        $( 'scheduleItRoleMiningForm:resetForm' ).click();
    },
    
    resetAttributeSelector: function() {
        var inputs = Ext.DomQuery.select('input[type=radio]', $('scheduleItRoleMiningForm:attributeOrIpopSelector'));
        inputs[0].checked = true;
        inputs[1].checked = false;
        Ext.getCmp('itRoleMiningPanel').showSearchFilterOptions("searchByAttributes");
    },
    
    resetAttributesTable: function() {
        var inputs = Ext.DomQuery.select('input[type=text]', $('itRoleMiningSearchAttributesTable'));
        var options = Ext.DomQuery.select('option', $('itRoleMiningSearchAttributesTable'));
        var i;
        
        for (i = 0; i < inputs.length; ++i) {
            inputs[i].value = '';
        }
        for (i = 0; i < options.length; ++i) {
            if (options[i].value == '') {
                options[i].selected = true;
            } else {
                options[i].selected = false;
            }
        }
    },
    
    updatePopulationOnKeypress: function() {
        var delay = SailPoint.Suggest.queryDelay;
        
        if (!delay) {
            delay = 250;
        }
        
        if (!this.delayedTask) {
            this.delayedTask = new Ext.util.DelayedTask();
        }
        
        this.delayedTask.delay(delay, this.updatePopulation, this);
    },
    
    updatePopulation: function() {
        $('scheduleItRoleMiningForm:updateCount').click();
    },
    
    loadContent: function(forceRerender, callback) {
        var contentPanel = this;
        var afterLoadFn;
        var loadArgs = arguments;
        var miningAppNameMultiSuggest;
        var miningOwnerSuggest;
        var excludedEntitlementsSuggest;
        
        if (callback) {
            afterLoadFn = function() {
                contentPanel.initMiningAppSuggest();
                contentPanel.initExcludedEntitlementsSuggest();
                contentPanel.initMiningOwnerSuggest();
                contentPanel.initMiningIpopSelector();
                // contentPanel.updateEntitlementsTable(); -- The callback should handle this
                contentPanel.showSearchFilterOptions( $( 'scheduleItRoleMiningForm:populationFilterType' ).value );
                if( $( 'scheduleItRoleMiningForm:itRoleMiningTemplateId' ).value == '' ) {
                    Ext.getCmp( 'viewITRoleMiningTaskResultsBtn' ).hide();
                } else {
                    Ext.getCmp( 'viewITRoleMiningTaskResultsBtn' ).show();
                }
                callback.apply(this, loadArgs);
            };
        } else {
            afterLoadFn = function() {
                contentPanel.initMiningAppSuggest();
                contentPanel.initExcludedEntitlementsSuggest();                
                contentPanel.initMiningOwnerSuggest();
                contentPanel.initMiningIpopSelector();
                contentPanel.updateEntitlementsTable();
                contentPanel.showSearchFilterOptions( $( 'scheduleItRoleMiningForm:populationFilterType' ).value );
                if( $( 'scheduleItRoleMiningForm:itRoleMiningTemplateId' ).value == '' ) {
                    Ext.getCmp( 'viewITRoleMiningTaskResultsBtn' ).hide();
                } else {
                    Ext.getCmp( 'viewITRoleMiningTaskResultsBtn' ).show();
                }
            };
        }
        
        if (!forceRerender && contentPanel.isLoaded) {
            contentPanel.initMiningAppSuggest();
            contentPanel.initMiningOwnerSuggest();
            contentPanel.initMiningIpopSelector();
            contentPanel.updateEntitlementsTable();
            contentPanel.showSearchFilterOptions( $( 'scheduleItRoleMiningForm:populationFilterType' ).value );
            if (callback) {
                callback.apply(this, arguments);
            }
            if( $( 'scheduleItRoleMiningForm:itRoleMiningTemplateId' ).value == '' ) {
                Ext.getCmp( 'viewITRoleMiningTaskResultsBtn' ).hide();
            } else {
                Ext.getCmp( 'viewITRoleMiningTaskResultsBtn' ).show();
            }
        } else {
            miningAppNameMultiSuggest = Ext.getCmp('itRoleMiningAppNameMultiSuggestCmp');
            miningOwnerSuggest = Ext.getCmp( 'itRoleMiningOwnerSuggestCmp' );
            excludedEntitlementsSuggest = Ext.getCmp('itRoleMiningExcludedEntitlementsSuggestCmp');
            if (forceRerender) {
                if (miningAppNameMultiSuggest) {
                    miningAppNameMultiSuggest.destroy();
                }
                if (miningOwnerSuggest) {
                    miningOwnerSuggest.destroy();
                }
                
                if (excludedEntitlementsSuggest) {
                    excludedEntitlementsSuggest.destroy();
                }
            }
            
            contentPanel.getLoader().load({
                url: SailPoint.getRelativeUrl('/define/roles/roleMining/scheduleITRoleMining.jsf'),
                callback: afterLoadFn,
                scope: contentPanel,
                params: {forceReset: true, templateId: contentPanel.templateId},
                text: '#{msgs.loading_data}',
                scripts: false,
                ajaxOptions : {
                    disableCaching: false
                }
            });

            contentPanel.body.applyStyles({
                'overflow-x': 'hidden',
                'overflow-y': 'auto'
            });
        
            contentPanel.isLoaded = true;
        }
    },
    
    /*
     * Exclude an entitlement from an object in this format:
     * {
     *     entitlements: [{
     *         applicationId: 'xxxxxx',
     *         application: 'App1',
     *         entitlementAttributes: [{
     *             id: 'xxxxxx',
     *             displayName: 'Entitlement1'
     *         },{
     *             id: 'xxxxxx',
     *             displayName: 'Entitlement2'
     *         },...] 
     *     },{
     *         applicationId: 'xxxxxx',
     *         application: 'App2',
     *         entitlementAttributes: [...]
     *     }, ...]
     * }
     */
    excludeEntitlement: function(suggest, removedEntitlementRecords, removedEntitlementIndex ) {
        var excludedEntitlementsObj;
        var foundApplication = null;
        var applicationWhoseEntitlementIsExcluded;
        var i;
        var removedEntitlementRecord = removedEntitlementRecords && removedEntitlementRecords.length > 0 ? removedEntitlementRecords[0] : undefined;
        
        if (!$('scheduleItRoleMiningForm:itRoleMiningExcludedEntitlements').value || $('scheduleItRoleMiningForm:itRoleMiningExcludedEntitlements').value.length == 0) {
            excludedEntitlementsObj = {entitlements: []};
        } else {
            excludedEntitlementsObj = Ext.JSON.decode($('scheduleItRoleMiningForm:itRoleMiningExcludedEntitlements').value);
        }
        
        if (removedEntitlementRecord) {
            applicationWhoseEntitlementIsExcluded = removedEntitlementRecord.get('applicationName');
            for (i = 0; i < excludedEntitlementsObj.entitlements.length; ++i) {
                if (excludedEntitlementsObj.entitlements[i].applicationId == applicationWhoseEntitlementIsExcluded) {
                    foundApplication = excludedEntitlementsObj.entitlements[i];
                }
            }
           
            if (foundApplication !== null) {
                foundApplication.entitlementAttributes.push({ id: removedEntitlementRecord.getId(), displayName: removedEntitlementRecord.get('displayName')});
            } else {
                excludedEntitlementsObj.entitlements.push({
                    applicationId: applicationWhoseEntitlementIsExcluded,
                    application: removedEntitlementRecord.get('applicationName'),
                    entitlementAttributes: [{ id: removedEntitlementRecord.getId(), displayName: removedEntitlementRecord.get('displayName')}]
                });
            }            
        }
       
        $('scheduleItRoleMiningForm:itRoleMiningExcludedEntitlements').value = Ext.JSON.encode(excludedEntitlementsObj);
        this.updateEntitlementsTable();
        suggest.setValue('');
    },
    
    updateSelectedEntitlements: function() {
        var selectedEntitlements = [];
        var excludedEntitlementsObj;
        var i;
        var j;
        
        if (!$('scheduleItRoleMiningForm:itRoleMiningExcludedEntitlements').value || $('scheduleItRoleMiningForm:itRoleMiningExcludedEntitlements').value.length == 0) {
            excludedEntitlementsObj = {entitlements: []};
        } else {
            excludedEntitlementsObj = Ext.JSON.decode($('scheduleItRoleMiningForm:itRoleMiningExcludedEntitlements').value);
        }

        for (i = 0; i < excludedEntitlementsObj.entitlements.length; ++i) {
            currentSelections = excludedEntitlementsObj.entitlements[i].entitlementAttributes;
            for (j = 0; j < currentSelections.length; ++j) {
                selectedEntitlements.push(currentSelections[j].id);
            }
        }
        
        Ext.getCmp('itRoleMiningExcludedEntitlementsSuggestCmp').getStore().getProxy().extraParams.exclusionIds = selectedEntitlements.join(",");
        Ext.getCmp('itRoleMiningExcludedEntitlementsSuggestCmp').getStore().load({
            params: {start: 0, limit: 10}, 
            callback: function() {
                var delayedTask;
                Ext.getCmp('itRoleMiningExcludedEntitlementsSuggestCmp').collapse();
                Ext.get(Ext.getCmp('itRoleMiningExcludedEntitlementsSuggestCmp').getEl()).blur();
            }
        });
    },
    
    includeEntitlement: function(entitlementToInclude) {
        var excludedEntitlementsObj;
        var oldExcludedEntitlements;
        var excludedEntitlements;
        var foundApplication = null;
        var appsToKeep = [];
        var i;
        var j;
    
        if (!$('scheduleItRoleMiningForm:itRoleMiningExcludedEntitlements').value || $('scheduleItRoleMiningForm:itRoleMiningExcludedEntitlements').value.length == 0) {
            excludedEntitlementsObj = {entitlements: []};
        } else {
            excludedEntitlementsObj = Ext.JSON.decode($('scheduleItRoleMiningForm:itRoleMiningExcludedEntitlements').value);
        }

        var oldExcludedEntitlements = excludedEntitlementsObj.entitlements;
        if (!oldExcludedEntitlements) {
            excludedEntitlements = [];
        } else {
            excludedEntitlements = [];
            for (i = 0; i < oldExcludedEntitlements.length; ++i) {
                if (oldExcludedEntitlements[i].applicationId == entitlementToInclude.application) {
                    for (j = 0; j < oldExcludedEntitlements[i].entitlementAttributes.length; ++j) {
                        if (oldExcludedEntitlements[i].entitlementAttributes[j].displayName && entitlementToInclude.name) {
                            if (oldExcludedEntitlements[i].entitlementAttributes[j].displayName != entitlementToInclude.name) {
                                // If there is no match continue to exclude the entitlement
                                excludedEntitlements.push(oldExcludedEntitlements[i].entitlementAttributes[j]);
                            }
                        } else {
                            // These don't match so we should continue to exclude this entitlement
                            excludedEntitlements.push(oldExcludedEntitlements[i].entitlementAttributes[j]);
                        }
                    }
                    if (excludedEntitlements.length > 0) {
                        oldExcludedEntitlements[i].entitlementAttributes = excludedEntitlements;
                        appsToKeep.push(oldExcludedEntitlements[i]);
                    } // else we have no further information to show for this app so let's not keep showing it
                } else {
                    // No change for this app
                    appsToKeep.push(oldExcludedEntitlements[i]);
                }
            }
            
            excludedEntitlementsObj.entitlements = appsToKeep;
        }
        
        $('scheduleItRoleMiningForm:itRoleMiningExcludedEntitlements').value = Ext.JSON.encode(excludedEntitlementsObj);
        this.updateEntitlementsTable();
    },
    
    updateEntitlementsTable: function() {
        var entitlementsToInclude = Ext.JSON.decode($('scheduleItRoleMiningForm:itRoleMiningExcludedEntitlements').value);
        SailPoint.Role.Mining.sortIncludedEntitlements(entitlementsToInclude.entitlements);
        SailPoint.Role.Mining.EntitlementsTemplate.overwrite('itRoleMiningEntitlementsToInclude', entitlementsToInclude);
        buildTooltips($('itRoleMiningEntitlementsToInclude'));
        this.getEntitlementsLoadMask().hide();
        this.updateSelectedEntitlements();
    },
    
    updateIpopDescription: function(ipop) {
        var ipopsInfo = JSON.parse($('itRoleMiningIpopsInfo').innerHTML);
        var currentIpopInfo = ipopsInfo[ipop];
        var descriptionDiv = Ext.get('itRoleMiningIpopDescription');
        var sizeDiv = Ext.get('itRoleMiningIpopSize');
        var appsDiv = Ext.get('itRoleMiningIpopApps');
        var description;
        var size;
        var apps;

        Ext.define('RecordType', {
            extend: 'Ext.data.Model',
            fields: [{name:'id', type:'string'},{name:'name', type:'string'},{name:'displayField', type:'string'}]
        });

        if (currentIpopInfo) {
            description = currentIpopInfo.description;
            size = currentIpopInfo.numIpopMembers;
            apps = SailPoint.Role.EntitlementsAnalysis.APPS_TEMPLATE.apply(currentIpopInfo);
            
            var multiSuggest = Ext.getCmp('miningAppNameMultiSuggestCmp');
            if (multiSuggest && currentIpopInfo.applications && currentIpopInfo.applicationIds) {
                multiSuggest.selectedStore.removeAll();
                for (var i=0, len=currentIpopInfo.applications.length; i<len; ++i) {
                    var appId = currentIpopInfo.applicationIds[i];
                    var appName = currentIpopInfo.applications[i];
                    var record = Ext.create('RecordType', {'id': appId, 'name':appName, 'displayField': appName});
                    multiSuggest.selectedStore.addSorted(record);
                }
                multiSuggest.updateInputField();
            }
            
        } else {
            description = '';
            size = '';
            apps = '';
        }
        
        if (description === null) {
            description = '';
        }
        descriptionDiv.update(description);
        sizeDiv.update(size);
        appsDiv.update(apps);
        this.updatePopulation();
    },
    
    addApplicationsForIpop: function(ipop) {
        var miningAppNameMultiSuggest = Ext.getCmp('itRoleMiningAppNameMultiSuggestCmp');
        var ipopsInfo = JSON.parse($('itRoleMiningIpopsInfo').innerHTML);
        var currentIpopInfo = ipopsInfo[ipop];
        var appIds = currentIpopInfo.applicationIds;
        var apps = currentIpopInfo.applications;
        var numApps = apps.length;
        var appObjs = [];
        // Convert the data into a form the store can read
        var appData = {
            totalCount: numApps 
        };
        var i;
        
        for (i = 0; i < numApps; ++i) {
            appObjs.push({
                id: appIds[i],
                displayField: apps[i]
            });
        }
        
        appData.objects = appObjs;
        
        if (miningAppNameMultiSuggest) {
            // append the added applications
            miningAppNameMultiSuggest.selectedStore.loadData(appData, true);
        }
    },
    
    showSaveError: function( saveMessage ) {
        if( saveMessage ) {
            Ext.MessageBox.show( {
                title:'#{msgs.err_dialog_title}',
                msg: saveMessage,
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.ERROR
            } );
        }
    },
    
    viewLastTaskResult: function() {
        var name = $( 'scheduleItRoleMiningForm:itRoleMiningTemplateName' ).value;
        var templateId = $('scheduleItRoleMiningForm:itRoleMiningTemplateId').value;
        
        Ext.Ajax.request({
            url: SailPoint.getRelativeUrl('/rest/roleMining/getViewableTask'),
            method: 'POST',
            params: {templateName: name, type: 'ITRoleMining', templateId: templateId},
            callback: function(options, success, response) {
                var responseObj = Ext.JSON.decode(response.responseText);
                if (responseObj.isViewable) {
                    Ext.getCmp('itRoleMiningResultsPanel').getStore().getProxy().extraParams['ITRoleMiningMostRecentTemplate'] = templateId;
                    Ext.getCmp('roleTabPanel').setActiveTab('miningResultsPanel');
                    Ext.getCmp('miningResultsPanel').getLayout().setActiveItem(1);
                    Ext.getCmp('roleTabPanel').doLayout();
                    Ext.getCmp('itRoleMiningResultsPanel').getStore().load({callback: function() {
                        Ext.getCmp('itRoleMiningResultsPanel').getStore().getProxy().extraParams['ITRoleMiningMostRecentTemplate'] = '';
                    }});
                } else {
                    Ext.MessageBox.show({
                        icon: Ext.MessageBox.WARNING,
                        title: '#{msgs.dialog_title_it_role_mining_no_results}', 
                        msg: responseObj.errorMsg,
                        buttons: Ext.MessageBox.OK
                    });
                }
            }
        });
    },
    
    displayLaunchingTaskMessage: function() {
        this.getMainPanelLoadMask().show();
    },
    
    displayResultsMessage : function() {
        var launchResults = Ext.JSON.decode($('itMiningLaunchResults').innerHTML);
        this.getMainPanelLoadMask().hide();
        if (launchResults.success) {
            if (Ext.getCmp('miningResultsGrid') && Ext.getCmp('miningResultsGrid').getStore()) {
                Ext.getCmp('miningResultsGrid').getStore().load({
                    callback: function() {
                        Ext.MessageBox.show({
                            title:'#{msgs.title_automated_mining}',
                            msg: launchResults.launchResultMsg,
                            buttons: Ext.MessageBox.OK,
                            icon: Ext.MessageBox.INFO,
                            fn: function() { Ext.getCmp('roleMiningPanel').getLayout().setActiveItem( 0 ); }
                        });
                    }
                });
            } else {
                Ext.MessageBox.show({
                    title:'#{msgs.title_automated_mining}',
                    msg: launchResults.launchResultMsg,
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.MessageBox.INFO,
                    fn: function() { Ext.getCmp('roleMiningPanel').getLayout().setActiveItem( 0 ); }
                });
            }
        } else {
            Ext.MessageBox.show({
                title:'#{msgs.err_dialog_title}',
                msg: launchResults.launchResultMsg,
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.ERROR
            });
        }
    }
});
