/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.AccountGroup.Search', {
    statics : {
        getAccountGroupSearchPanel : function(config) {
            var activeItem = 'accountGroupSearchContents';
            if (config.activeCard) {
                activeItem = config.activeCard;
            }

            var searchContents = Ext.create('SailPoint.TabContentPanel', {
                id: 'accountGroupSearchContents',
                layout: 'fit',
                contentEl: 'accountGroupSearchContentsDiv',
                border: false,
                autoScroll: true,
                bbar: [{
                    id: 'preAccountGroupSearchBtn',
                    text: '#{msgs.button_run_search}',
                    cls : 'primaryBtn',
                    handler: function() {
                        SailPoint.Analyze.validateSearch('accountGroupSearchForm', 'accountGroup');
                    }
                }, {
                    id: 'accountGroupClearBtn',
                    text: '#{msgs.button_clear_search}',
                    handler: function() {
                        $('accountGroupSearchForm:resetBtn').click()
                    }
                }],
                loader: {
                    url: SailPoint.getRelativeUrl('/analyze/accountGroup/accountGroupSearchContents.jsf'),
                    params: { searchType: 'AccountGroup' },
                    discardUrl: false,
                    callback: SailPoint.AccountGroup.Search.finishInit,
                    nocache: false,
                    text: '#{msgs.loading_data}',
                    timeout: 30,
                    scripts: true
                }
            });

            var resultsContents = SailPoint.Search.getResultsGrid({
                id: 'accountGroupSearchResultsGrid',
                type: 'AccountGroup',
                stateful: true,
                stateId: SailPoint.Analyze.gridStateIds.get('AccountGroup'),
                url: SailPoint.getRelativeUrl('/analyze/accountGroup/accountGroupDataSource.json'),
                handleClick: SailPoint.AccountGroup.Search.handleClick,
                contextMenu: SailPoint.AccountGroup.Search.contextMenu,
                pageSize: SailPoint.Analyze.defaultResultsPageSize,
                optionsPlugin: SailPoint.Search.getOptionsPlugin({
                    searchType: 'AccountGroup',
                    cardPanelId: 'accountGroupSearchPanel',
                    searchPanelId: 'accountGroupSearchContents',
                    applySearchPanelStyles: function() {
                        Ext.getCmp('accountGroupSearchContents').doLayout();
                        Ext.getCmp('accountGroupDisplayFieldsPanel').doLayout();
                    },
                    options: [
                        ['saveOrUpdate', '#{msgs.save_search}'],
                        ['saveAsIdentity', '#{msgs.save_search_as_identity_search}'],
                        ['saveAsReport', '#{msgs.save_search_as_report}']
                    ]
                }),
                // for the new managed attributes the default sorter should be on
                // the displayableName property not name
                sorters: [{
                    property: 'displayableName',
                    direction: 'ASC'
                }]
            });

            resultsContents.on('afterlayout', function(contentPanel, layout) {
                SailPoint.AccountGroup.Search.styleResultsGrid();
            });

            var searchPanel = Ext.create('Ext.panel.Panel', {
                id: config.id,
                title: config.title,
                headerAsText: false,
                header: false,
                layout: 'card',
                activeItem: activeItem,
                items: [searchContents, resultsContents]
            });

            searchPanel.on('activate', function(viewerPanel) {
                if (!searchPanel.isLoaded) {
                    searchContents.getLoader().load();

                    SailPoint.AccountGroup.Search.initResultsGrid();
                    searchPanel.isLoaded = true;
                }
            },{
                single: true,
                scope: this
            });

            return searchPanel;
        },

        displaySearchResults : function() {

            var searchPanel = Ext.getCmp('accountGroupSearchPanel');
            searchPanel.getLayout().setActiveItem('accountGroupSearchResultsGridWrapper');
            searchPanel.doLayout(false, true);

            var gridPanel = Ext.getCmp('accountGroupSearchResultsGrid');
            gridPanel.getView().refresh(true);

            Ext.MessageBox.hide();
        },

        displaySearchContents : function() {
            var searchPanel = Ext.getCmp('accountGroupSearchPanel');
            searchPanel.getLayout().setActiveItem('accountGroupSearchContents');
            searchPanel.doLayout(false, true);
        },

        initResultsGrid : function() {
            SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/accountGroup/accountGroupDataSource.json'), 'accountGroupSearchResultsGrid', 13, true);
        },

        styleResultsGrid : function() {
            var gridPanel = Ext.getCmp('accountGroupSearchResultsGrid');
            if (gridPanel) {
                var referenceDiv = Ext.get('example-grid');
                if (referenceDiv) {
                    var gridWidth = referenceDiv.getWidth(true) - 20;
                    gridPanel.setWidth(gridWidth);
                    gridPanel.getPositionEl().applyStyles({
                        'margin-left': '10px',
                        'margin-right': '10px',
                        'margin-bottom': '10px'
                    });
                }
            }
        },

        finishInit : function() {
            SailPoint.Analyze.AccountGroup.initializeAttributes(false);
            SailPoint.Analyze.SearchDisplayFields.initDisplayFields('accountGroup');
            SailPoint.AccountGroup.Search.styleSearchPanels();
            SailPoint.Analyze.registerSubmits({
                className: 'searchInputText',
                container: $('accountGroupSearchCriteria'),
                eventHandler: SailPoint.Analyze.submitEventHandler,
                options: {
                    formName: 'accountGroupSearchForm',
                    searchType: 'AccountGroup'
                }
            });
            Ext.MessageBox.hide();
        },

        styleSearchPanels : function() {
            buildTooltips($('accountGroupSearchCriteria'));
            Ext.getCmp('accountGroupSearchContents').doLayout();
        },

        styleResultsPanels : function() { },

        clearSearchFields : function() {
            var formName = 'accountGroupSearchForm';

            SailPoint.Analyze.clearExtendedAttributeFields('accountGroupAttributes');

            // Attribute on Account Group Search page
            var nameInput = $(formName + ':accountGroupName');
            if (nameInput) {
                nameInput.value = '';
            }

            // Attribute on Entitlement Catalog page
            var attributeSuggest = Ext.getCmp('acctGroupAttributeSuggestCmp');
            if (attributeSuggest) {
                attributeSuggest.clearValue();
                $('acctGroupAttribute').value = '';
            }

            var ownerSuggest = Ext.getCmp('accountGroupOwnerSuggest');
            ownerSuggest.clearValue();
            $('accountGroupApplication').value = '';
            $('accountGroupOwner').value = '';

            var appSuggest = Ext.getCmp('accountGroupApplicationSuggestCmp');
            appSuggest.clearValue();
            $('accountGroupApplication').value = '';

            var nativeIdentitySuggest = Ext.getCmp('nativeIdentitySuggestCmp');
            if (nativeIdentitySuggest) {
                nativeIdentitySuggest.clearValue();
                $('nativeIdentity').value = '';
            }

            var typeFilterCombo = Ext.getCmp('typeFilterCombo');
            if(typeFilterCombo) {
                typeFilterCombo.clearValue();
                $('accountGroupTypeFilter').value = '';
            }

            $(formName + ':accountGroupTarget').value = '';
            $(formName + ':accountGroupRights').value = '';
            $(formName + ':accountGroupAnnotation').value = '';
            SailPoint.Analyze.resetFieldsToDisplay('accountGroup');
        },

        contextMenu : function(gridView, record, HTMLitem, index, e, eOpts){
            var contextMenu = new Ext.menu.Menu();
            var accountGroupId = record.getId();

            var editItem = new Ext.menu.Item({text: '#{msgs.menu_edit}', handler: SailPoint.AccountGroup.Search.editAccountGroup, iconCls: 'editBtn'});
            editItem.accountGroupId = accountGroupId;

            var summaryItem = new Ext.menu.Item({text: '#{msgs.menu_view_summary}', handler: SailPoint.AccountGroup.Search.viewAccountGroupWindow, iconCls: 'viewDetailsBtn'});
            summaryItem.accountGroupId = accountGroupId;

            var viewIdentitiesItem = new Ext.menu.Item({text: '#{msgs.menu_view_identities}', handler: SailPoint.AccountGroup.Search.viewIdentities, iconCls: 'viewIdentitiesBtn'});
            viewIdentitiesItem.accountGroupId = accountGroupId;

            contextMenu.add(
                editItem,
                summaryItem,
                viewIdentitiesItem
            );

            e.stopEvent();
            contextMenu.showAt(e.xy);
        },

        handleClick : function(gridView, record, HTMLitem, index, e, eOpts){
            var colName = gridView.getHeaderCt().getHeaderAtIndex(gridView.clickedColumn).dataIndex;
            if(colName) {
                $('accountGroupResultForm:searchType').value = 'AccountGroup';
                $('accountGroupResultForm:currentObjectId').value = record.getId();
                $('accountGroupResultForm:editButton').click();
            }
        },

        editAccountGroup : function(item, e) {
            $('accountGroupResultForm:searchType').value = 'AccountGroup';
            $('accountGroupResultForm:currentObjectId').value = item.accountGroupId;
            $('accountGroupResultForm:editButton').click();
        },

        viewAccountGroupWindow : function(item, e) {
            // Call viewAccountGroup from misc.js
            viewAccountGroup('', '', '', item.accountGroupId);
        },

        viewIdentities : function(item, e) {
            SailPoint.AccountGroup.Search.showAccountGroupIdentityGrid(item.accountGroupId);
        },

        showAccountGroupIdentityGrid : function(accountGroupId) {
            var identityWin = Ext.getCmp('accountGroupIdentitiesPopup');
            var accountGroupsGrid = Ext.getCmp('accountGroupsIdentityGrid');
            var identityStore;

            if (!identityWin) {
                // data store
                identityStore = SailPoint.Store.createStore({
                    model : 'SailPoint.model.Empty',
                    autoLoad: false,
                    url: SailPoint.getRelativeUrl('/define/groups/accountGroupMembersDataSource.json'),
                    root : 'members',
                    pageSize: 20,
                    remoteSort: true
                });

                identityStore.on('metachange', function(changedStore, newMetaData) {
                    var gridPanel = Ext.getCmp('accountGroupsIdentityGrid');
                    var columnConfig = newMetaData.columnConfig;

                    // Make the widths even on the column config
                    var numColumns = newMetaData.fields.length;
                    var gridWidth = gridPanel.getWidth();

                    // Figure out if we already have widths set.  If so remove them 
                    // from our pool of available space
                    var i;
                    for (i = 0; i < columnConfig.length; ++i) {
                        if (columnConfig[i].width)
                            gridWidth -= columnConfig[i].width;
                    }

                    // Divide the remainder among the widthless columns
                    var columnWidth = gridWidth / numColumns;
                    for (i = 0; i < columnConfig.length; ++i) {
                        if (!columnConfig[i].width && columnWidth != 0) {
                            columnConfig[i].width = columnWidth;
                        }
                    }

                    var sorters = [{property: 'name', direction: 'ASC'}];
                    if(newMetaData.sorters) {
                        sorters = Ext.JSON.decode(newMetaData.sorters);
                    }
                    else if(newMetaData.sortColumn) {
                        sorters = [{property: newMetaData.sortColumn, direction: newMetaData.sortDirection}];
                    }
                    changedStore.sorters.addAll(sorters);

                    gridPanel.reconfigure(changedStore, columnConfig);
                });

                // create the grid
                accountGroupsGrid = new SailPoint.grid.PagingGrid({
                    id: 'accountGroupsIdentityGrid',
                    store: identityStore,
                    columns: [{header: 'name', sortable: true}],
                    viewConfig: {
                        scrollOffset: 1,
                        stripeRows:true
                    }
                });

                identityWin = new Ext.Window({
                    id: 'accountGroupIdentitiesPopup',
                    title: '#{msgs.members}',
                    closeAction : 'hide',
                    width:768,
                    height:400,
                    autoScroll:true,
                    plain:true,
                    layout:'fit',
                    items: [accountGroupsGrid]
                });
                accountGroupsGrid.addListener('itemclick', Ext.emptyFn);
                accountGroupsGrid.addListener('itemcontextmenu', Ext.emptyFn);
            } else {
                identityStore = accountGroupsGrid.getStore();
            }

            identityWin.show();
            Ext.apply(identityStore.getProxy().extraParams, {
                id: accountGroupId,
                currentWidth:accountGroupsGrid.getWidth()
            });
            identityStore.loadPage(1);
        }
    }//end statics
});

/**
 *
 * ANALYZE STUFF
 *
 * **/

Ext.define('SailPoint.Analyze.AccountGroup', {
    statics : {
        initializeAttributes : function(isGrid) {
            var attributeSuggest = Ext.getCmp('acctGroupAttributeSuggestCmp');
            var attributeVal;
            var typeFilterCombo = Ext.getCmp('typeFilterCombo');
            var typeFilterVal = $('accountGroupTypeFilter') ? $('accountGroupTypeFilter').value : '';
            var ownerVal = $('accountGroupOwnerVal').innerHTML;
            var appVal =  $('accountGroupAppVal').innerHTML;
            var ownerSuggest = Ext.getCmp('accountGroupOwnerSuggest');
            var ownerRecords = $('accountGroupOwnerSuggestInit') ? Ext.decode($('accountGroupOwnerSuggestInit').innerHTML) : { objects: [] };
            var applicationSuggest = Ext.getCmp('accountGroupApplicationSuggestCmp');
            var appRecords = $('accountGroupAppSuggestInit') ? Ext.decode($('accountGroupAppSuggestInit').innerHTML) : { objects: [] };
            var nativeIdentitySuggest = Ext.getCmp('nativeIdentitySuggestCmp');
            var nativeIdentityVal = $('nativeIdentityVal').innerHTML;
            var valueType, formName, searchBtn;

            if(isGrid) {
                valueType = 'id';
                formName = 'editForm';
                searchBtn = 'editForm:saveQueryBtn';

                if (attributeSuggest) {
                    attributeSuggest.destroy();
                }

                attributeVal = $('acctGroupAttributeVal').innerHTML;

                attributeSuggest = new SailPoint.DistinctRestSuggest({
                    id: 'acctGroupAttributeSuggestCmp',
                    renderTo: 'acctGroupAttributeSuggest',
                    binding: 'acctGroupAttribute',
                    value: attributeVal,
                    valueField: 'displayName',
                    width: 200,
                    freeText: true,
                    disabled: !appVal || appVal.length === 0,
                    className: 'ManagedAttribute',
                    column: 'attribute',
                    listConfig : {width : 300},
                    listeners: {
                        select: function(combo, records, opts) {
                            var newAttribute = records[0].get('id');
                            var valueCmp = Ext.getCmp('nativeIdentitySuggestCmp');
                            var valueProxy = valueCmp.getStore().getProxy();
                            var application = valueProxy.extraParams.application;
                            SailPoint.Analyze.AccountGroup.updateValueSuggest(application, newAttribute);
                        },
                        blur: function(comp, eventObj, opts) {
                            var newAttribute = Ext.getCmp('acctGroupAttributeSuggestCmp').getValue();
                            var valueCmp = Ext.getCmp('nativeIdentitySuggestCmp');
                            var valueProxy = valueCmp.getStore().getProxy();
                            var application = valueProxy.extraParams.application;
                            SailPoint.Analyze.AccountGroup.updateValueSuggest(application, newAttribute);
                        }
                    }
                });

            } else {
                valueType = 'name';
                formName = 'accountGroupSearchForm';
                searchBtn = 'preAccountGroupSearchBtn';
            }

            if (typeFilterCombo) {
                typeFilterCombo.destroy();
            }

            typeFilterCombo = Ext.create('Ext.form.field.ComboBox', {
                id: 'typeFilterCombo',
                editable: 'false',
                value: typeFilterVal,
                store: SailPoint.Store.createStore ({
                    fields: ['label', 'value'],
                    url: SailPoint.getRelativeUrl('/analyze/accountGroup/accountGroupTypesDataSource.json'),
                    root: 'rows',
                    extraParams: {filterAccountSchema:'true', distinctObjectTypes:'true', application:appVal,
                        includeMA: isGrid},
                    storeId:'accountGroupType'
                }),
                displayField: 'label',
                valueField: 'value',
                renderTo: 'accountGroupTypeComboBox',
                isGrid: isGrid,
                forceSelection: true,
                listConfig: {
                    tpl: '<ul><tpl for=".">' +
                        '<li role="option" class="' + Ext.baseCSSPrefix + 'boundlist-item"><div class="baseSearch"><div class="sectionHeader">{label:htmlEncode}</div></div></li>' +
                        '</tpl></ul>'
                },
                listeners: {
                    change: function(combo, val, oldVal, opts) {
                        var newVal = combo.getValue();
                        $('accountGroupTypeFilter').value = newVal;
                        if(this.isGrid) {
                            var divsToShowOrHide = Ext.dom.Query.select('div[class*=groupPermissionsSearchFields]');
                            //Need to show if NOT Permission/Entitlement
                            var show = (newVal != 'entitlements' && newVal != 'permissions');
                            var i;

                            for (i = 0; i < divsToShowOrHide.length; i++) {
                                divsToShowOrHide[i].style['visibility'] = show ? 'visible' : 'hidden';
                            }

                            if (show) {
                                // Restore inputs if necessary
                                if ($('editForm:accountGroupTarget').value == '' && combo.target) {
                                    $('editForm:accountGroupTarget').value = combo.target;
                                    combo.target = undefined;
                                }

                                if ($('editForm:accountGroupRights').value == '' && combo.rights) {
                                    $('editForm:accountGroupRights').value = combo.rights;
                                    combo.rights = undefined;
                                }

                                if ($('editForm:accountGroupAnnotation').value == '' && combo.annotation) {
                                    $('editForm:accountGroupAnnotation').value = combo.annotation;
                                    combo.annotation = undefined;
                                }
                            } else {
                                // Clear the inputs but save them in case we need them back later
                                combo.target = $('editForm:accountGroupTarget').value;
                                $('editForm:accountGroupTarget').value = '';
                                combo.rights = $('editForm:accountGroupRights').value;
                                $('editForm:accountGroupRights').value = '';
                                combo.annotation = $('editForm:accountGroupAnnotation').value;
                                $('editForm:accountGroupAnnotation').value = '';
                            }
                        }
                    }
                }
            });

            if (ownerSuggest) {
                ownerSuggest.destroy();
            }

            ownerSuggest = new SailPoint.IdentitySuggest({
                id: 'accountGroupOwnerSuggest',
                renderTo: 'accountGroupOwnerSuggestDiv',
                binding: 'accountGroupOwner',
                nameLookup: ownerVal,
                valueField: valueType,
                width: 200,
                listConfig : {width : 300},
                baseParams: {context: 'Owner'}
            });

            // Set the value on the app suggest because the base suggest doesn't do that for us
            if (ownerRecords.objects.length > 0) {
                ownerSuggest.getStore().loadData(ownerRecords.objects);
                ownerSuggest.setValue(ownerVal);
            }

            if (applicationSuggest) {
                applicationSuggest.destroy();
            }

            applicationSuggest = new SailPoint.BaseSuggest({
                id: 'accountGroupApplicationSuggestCmp',
                pageSize: 10,
                baseParams: {'suggestType': 'application'},
                renderTo: 'accountGroupApplicationSuggest',
                binding: 'accountGroupApplication',
                baseParams: {'suggestType': 'application'},
                initialData: appVal,
                width: 200,
                listConfig : {width : 300},
                listeners: {
                    select: function(combo, records, opts) {
                        var application = records[0].get('id');
                        SailPoint.Analyze.AccountGroup.updateAttributeSuggest(application);
                        SailPoint.Analyze.AccountGroup.updateValueSuggest(application);
                        SailPoint.Analyze.AccountGroup.updateTypeSuggest(application);
                    },
                    blur: function(comp, eventObj, opts) {
                        var newApplicationNameOrId = Ext.getCmp('accountGroupApplicationSuggestCmp').getValue();
                        var store;
                        var newApplicationRecord;
                        var newApplicationId = null;

                        if (newApplicationNameOrId && newApplicationNameOrId.length > 0) {
                            store = Ext.getCmp('accountGroupApplicationSuggestCmp').getStore();
                            newApplicationRecord = store.findRecord('displayName', newApplicationNameOrId, 0, false, false, true);
                            if (!newApplicationRecord) {
                                newApplicationRecord = store.findRecord('id', newApplicationNameOrId, 0, false, false, true);
                            }

                            if (newApplicationRecord) {
                                newApplicationId = newApplicationRecord.get('id');
                            }
                        }

                        SailPoint.Analyze.AccountGroup.updateAttributeSuggest(newApplicationId);
                        SailPoint.Analyze.AccountGroup.updateValueSuggest(newApplicationId);
                        SailPoint.Analyze.AccountGroup.updateTypeSuggest(newApplicationId);
                    }
                }
            });

            // Set the value on the app suggest because the base suggest doesn't do that for us
            if (appRecords.objects.length > 0) {
                applicationSuggest.getStore().loadData(appRecords.objects);
                applicationSuggest.setValue(appVal);
            }

            if (nativeIdentitySuggest) {
                nativeIdentitySuggest.destroy();
            }
            nativeIdentitySuggest = new SailPoint.DistinctRestSuggest({
                id: 'nativeIdentitySuggestCmp',
                renderTo: 'nativeIdentitySuggest',
                binding: 'nativeIdentity',
                value: nativeIdentityVal,
                valueField: 'displayName',
                width: 200,
                freeText: true,
                disabled: isGrid ? (!attributeVal || attributeVal.length == 0) : false,
                className: 'ManagedAttribute',
                column: 'displayableName',
                listConfig : {width : 300}
            });

            /** Set up suggest fields for all of the extended attributes that have string values **/
            var extendedFields = Ext.DomQuery.select('div[class=managedAttribute]');
            extendedFields.each(function (field) {
                var id = field.id,
                    simpleId = field.id.substring(0, field.id.length - 3),
                    key = simpleId.substring(16),
                    className = 'Identity';

                if(key.indexOf("_") > 0) {
                    className = key.substring(0, key.indexOf("_"));
                }

                var suggest = Ext.getCmp(simpleId + 'SuggestCmp'),
                    suggestVal = field.innerHTML,
                    type = $(simpleId + 'Type').innerHTML;

                if (suggest) {
                    suggest.destroy();
                }

                var f = Ext.get(field),
                    prevSib = f.prev("input"),
                    nextSib = f.next("div[id*=" + simpleId + "]");

                suggest = new SailPoint.DistinctRestSuggest({
                    id: simpleId + 'SuggestCmp',
                    renderTo: simpleId + "Suggest",
                    binding: prevSib.id,
                    value: suggestVal,
                    valueField: 'displayName',
                    width: 200,
                    freeText: true,
                    className: className,
                    column: nextSib.dom.innerHTML,
                    listConfig: {width : 300}
                });

                suggest.on('blur', Ext.bind(SailPoint.Analyze.Identity.updateDiv, suggest, [field]));
            });

            SailPoint.Analyze.initializeSubmit(formName, searchBtn);
        },

        finishRerender : function() {
            SailPoint.Analyze.AccountGroup.initializeAttributes(false);
        },

        updateAttributeSuggest: function(application) {
            var attributeCmp = Ext.getCmp('acctGroupAttributeSuggestCmp');
            var attributeProxy;
            var filterString;
            if (attributeCmp) {
                attributeProxy = attributeCmp.getStore().getProxy();
                if (application && application.length > 0) {
                    filterString = 'application.id == "' + application + '"';
                    attributeProxy.setExtraParam('filterString', filterString);
                    attributeCmp.clearValue();
                    attributeCmp.getStore().loadPage(1, {
                        scope: attributeCmp,
                        callback: function() {
                            this.setDisabled(false);
                        }
                    });

                } else {
                    // If no application is selected we can't select an attribute
                    // so clear and disable the suggest
                    attributeCmp.clearValue();
                    attributeCmp.setDisabled(true);
                }
            }
        },

        updateValueSuggest: function(applicationValue, attributeValue) {
            var valueCmp = Ext.getCmp('nativeIdentitySuggestCmp');
            var valueProxy = valueCmp.getStore().getProxy();
            var isAttributeSuggestAvailable = Ext.getCmp('acctGroupAttributeSuggestCmp');
            var filterString;

            if (applicationValue && applicationValue.length > 0) {
                valueProxy.setExtraParam('application', applicationValue);
                if (!attributeValue && !isAttributeSuggestAvailable) {
                    filterString = 'application.id == "' + applicationValue + '"';
                    valueProxy.setExtraParam('filterString', filterString);
                    valueCmp.clearValue();
                    valueCmp.getStore().loadPage(1, {
                        scope: valueCmp,
                        callback: function() {
                            this.setDisabled(false);
                        }
                    });
                }
            } else if (!isAttributeSuggestAvailable) {
                valueProxy.setExtraParam('application', undefined);
                valueProxy.setExtraParam('filterString', undefined);
                valueCmp.getStore().loadPage(1);
            }

            if (attributeValue && attributeValue.length > 0) {
                filterString = 'application.id == "' + applicationValue + '" && attribute == "' + attributeValue + '"';
                valueProxy.setExtraParam('filterString', filterString);
                valueCmp.clearValue();
                valueCmp.getStore().loadPage(1, {
                    scope: valueCmp,
                    callback: function() {
                        this.setDisabled(false);
                    }
                });
            } else if (isAttributeSuggestAvailable) {
                // If we are depending on the attribute suggest and 
                // no attribute is selected we can't select a value so 
                // clear and disable the suggest
                valueCmp.clearValue();
                valueCmp.setDisabled(true);
            }
        },

        updateTypeSuggest: function(application) {
            var typeCmp = Ext.getCmp('typeFilterCombo');
            var typeProxy;
            if (typeCmp) {
                typeProxy = typeCmp.getStore().getProxy();
                typeProxy.setExtraParam('application', application);
                typeCmp.clearValue();
                typeCmp.getStore().load();
            }
        }
    }
    //end statics
});
