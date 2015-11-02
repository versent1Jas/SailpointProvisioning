/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.LCM.ManageDeletedObjects');


//Global cache for the selected application Id
Ext.define('SailPoint.LCM.ManageDeletedObjects.AppConstants', {
    singleton : true,
    selectedAppId: ''
});

SailPoint.LCM.ManageDeletedObjects.DisplayDeletedObjects = {

    /* This method is to show the suggestion combo-box for configured AD application.
     * By default, 1st application will be automatically selected
     * @param accountGridColConf is column config for account grid
     * @param groupGridColConf is column config for group grid
     */
    suggestADApplication : function (accountGridColConf, groupGridColConf) {
        var appSuggest = new SailPoint.BaseSuggest({
            storeId: 'appSuggestStore',
            width: 200,
            extraParams: {
                suggestType: 'application',
                showAuthoritative: 'true',
                showComposite: 'false',
                type: 'Active Directory - Direct'
            },
            renderTo: 'appSuggest',
            emptyText: "#{msgs.deleted_objects_grid_select_ad_application_default_label}",
            loadingText: "#{msgs.appsuggest_finding_apps}",
            listeners : {
                afterrender : function (appSuggest) {
                    appSuggest.store.load();
                }
            }
        });

        appSuggest.store.on('load', function () {
            var record,
                records = [];
            if (Ext.isDefined(appSuggest.store.getAt(0))) {
                record = appSuggest.store.getAt(0);
            }
            if (record) {
                appSuggest.setValue(record.get('displayName'));
                records.push(record);
                appSuggest.select(record);
                appSuggest.fireEvent("select", appSuggest, records);
            }
        });

        appSuggest.on('select', function (suggestField, record, index) {
            var AppConstant = SailPoint.LCM.ManageDeletedObjects.AppConstants;
            SailPoint.LCM.ManageDeletedObjects.selectedAppId = record[0].internalId;
            AppConstant.selectedAppId = SailPoint.LCM.ManageDeletedObjects.selectedAppId;
            SailPoint.LCM.ManageDeletedObjects.DisplayDeletedObjects.initializeDeletedObjectsGrids(accountGridColConf, groupGridColConf, SailPoint.LCM.ManageDeletedObjects.selectedAppId);
        });
    },

    /* This method is to create the store for the deleted account grid
     * @param accountGridColConf is column config for account grid
     */
    createAccountStore: function (accountGridColConf) {
        var accountStore = SailPoint.Store.createStore({
            storeId: 'accountGridStore',
            fields: accountGridColConf.fields,
            url: CONTEXT_PATH + '/lcm/deletedObjectsSearch.json',
            root: 'objects',
            remoteSort: false,
            defaultSort: 'name',
            sorters: [{property: "name", direction: "ASC"}],
            simpleSortMode: true,
            totalProperty : 'count',
            extraParams: {
                'objectType': 'account',
                'applicationId': SailPoint.LCM.ManageDeletedObjects.AppConstants.selectedAppId
            }
        });
        return accountStore;
    },

    /* This method is to create the store for the deleted group grid
     * @param groupGridColConf is column config for group grid
     */
    createGroupStore: function (groupGridColConf) {
        var groupStore = SailPoint.Store.createStore({
            storeId: 'groupGridStore',
            fields: groupGridColConf.fields,
            url: CONTEXT_PATH + '/lcm/deletedObjectsSearch.json',
            root : 'objects',
            remoteSort: false,
            defaultSort: 'name',
            sorters: [{property: "name", direction: "ASC"}],
            simpleSortMode : true,
            totalProperty : 'count',
            extraParams: {
                'objectType': 'group',
                'applicationId': SailPoint.LCM.ManageDeletedObjects.selectedAppId
            }
        });
        return groupStore;
    },

    /* This method is to create the grid for the deleted accounts
     * @param accountGridColConf is column config for account grid
     * @param accountStore is store for the accounts
     */
    createAccountGrid: function (accountGridColConf, accountStore) {
        var accountGrid = Ext.create('SailPoint.grid.RecycleBinAccountsGrid', {
            id: 'recycleBinAccountsGrid',
            title: '#{msgs.deleted_objects_grid_account_tab_label}',
            gridMetaData: accountGridColConf,
            height: 300,
            viewConfig: {
                autoFill: true
            },
            store: accountStore,
            selModel: new SailPoint.grid.CheckboxSelectionModel(),
            stateId: 'recycleBinAccountsGrid'
        });
        return accountGrid;
    },

    /* This method is to create the grid for the deleted groups
     * @param groupGridColConf is column config for group grid
     * @param groupStore is store for the groups
     */
    createGroupGrid: function (groupGridColConf, groupStore) {
        var groupGrid = Ext.create('SailPoint.grid.RecycleBinGroupsGrid', {
            id: 'recycleBinGroupsGrid',
            title: '#{msgs.deleted_objects_grid_group_tab_label}',
            gridMetaData: groupGridColConf,
            height: 300,
            viewConfig: {
                autoFill: true
            },
            store: groupStore,
            selModel: new SailPoint.grid.CheckboxSelectionModel(),
            stateId: 'recycleBinGroupsGrid'
        });
        return groupGrid;
    },

    /* This method is to initialize the tab panel and grids for the deleted account and groups
     * @param accountGridColConf is column config for account grid
     * @param groupGridColConf is column config for group grid
     * @param appId id of the selected AD application
     */
    initializeDeletedObjectsGrids: function (accountGridColConf, groupGridColConf, appId) {
        if (Ext.getCmp('mainPanel')) {
            Ext.getCmp('mainPanel').destroy();
        }
        //variable declarations
        var accountstore = this.createAccountStore(accountGridColConf),
            groupStore = this.createGroupStore(groupGridColConf),
            accountGrid,
            groupGrid,
            panelWidth,
            mainPanel;

        Ext.define('SailPoint.grid.RecycleBinAccountsGrid', {
            extend: 'SailPoint.grid.PagingCheckboxGrid',

            initComponent : function () {
                this.store = accountstore;
                this.callParent(arguments);
            },

            getMergeParams: function () {
                var key,
                    params = {
                        selected : this.selModel.getSelectedIds().join(),
                        selectAll : this.selModel.isAllSelected(),
                        excluded : this.selModel.getExcludedIds().join(),
                        numOfSelectedIds : this.selModel.getSelectedIds().length,
                        numOfExcludedIds : this.selModel.getExcludedIds().length,
                        sell : this.selModel.getSelectedIds(),
                        seAll : this.selModel.isAllSelected()
                    };

                for (key in this.store.getProxy().extraParams) {
                    params[key] = this.store.getProxy().extraParams[key];
                }
                return params;
            }
        });

        Ext.define('SailPoint.grid.RecycleBinGroupsGrid', {
            extend: 'SailPoint.grid.PagingCheckboxGrid',

            initComponent: function () {
                // create a local var that can be referenced in closures
                this.store = groupStore;
                this.callParent(arguments);
            },

            getMergeParams: function () {
                var key,
                    params = {
                        selected : this.selModel.getSelectedIds().join(),
                        selectAll : this.selModel.isAllSelected(),
                        excluded : this.selModel.getExcludedIds().join(),
                        numOfSelectedIds : this.selModel.getSelectedIds().length,
                        numOfExcludedIds : this.selModel.getExcludedIds().length,
                        sell : this.selModel.getSelectedIds(),
                        seAll : this.selModel.isAllSelected()
                    };

                for (key in this.store.getProxy().extraParams) {
                    params[key] = this.store.getProxy().extraParams[key];
                }
                return params;
            }
        });

        accountGrid = this.createAccountGrid(accountGridColConf, accountstore);
        groupGrid = this.createGroupGrid(groupGridColConf, groupStore);

        accountGrid.load({params: {applicationId: appId}});
        groupGrid.load({params: {applicationId: appId}});

        panelWidth = Ext.get('mainPanel').getSize().width;

        accountGrid.width = panelWidth;
        groupGrid.width = panelWidth;

        mainPanel = new Ext.TabPanel({
            id: 'mainPanel',
            activeTab: 0,
            renderTo: 'mainPanel',
            x: '-20',
            items: [accountGrid, groupGrid]
        });

    },

    /* Prompt to confirm the restore of deleted objects from grid and page
     * @param restoreAllBtn restore all button present on the page for restore multiple objects
     * @param record record of the grid
     * @param gridBtnId Id of the restore button present on the grid
     */
    displayRestorePrompt: function (restoreAllBtn, record, gridBtnId) {
        var msg = '#{msgs.deleted_objects_grid_restore_confirm}';
        Ext.MessageBox.confirm('',
                msg,
                function (button, text) {
                if (button === 'yes') {
                    if (restoreAllBtn) {
                        SailPoint.LCM.ManageDeletedObjects.DisplayDeletedObjects.restoreSelectedObjects(restoreAllBtn);
                    } else {
                        SailPoint.LCM.ManageDeletedObjects.DisplayDeletedObjects.restoreButtonHandler(record, gridBtnId);
                    }
                }
            });
    },


    /* Renders the restore button for each record and called from column config
     * @param val 
     * @param metadata of the grid
     * @param record record of the grid
     */
    restoreButtonRenderer: function (val, metadata, record) {
        // generate unique id for an element
        var uniqueId = record.getId();
        Ext.defer(function () {
            Ext.widget('button', {
                id: uniqueId,
                renderTo: uniqueId,
                text: '#{msgs.deleted_objects_grid_button_label_restore}',
                scale: 'small',
                enableToggle: true,
                handler: function () {
                    SailPoint.LCM.ManageDeletedObjects.DisplayDeletedObjects.displayRestorePrompt(null, record, uniqueId);
                }
            });
        }, 50);
        return Ext.String.format('<div id="{0}"></div>', uniqueId);
    },


    /* Handler for restore button present on the grid
     * @param record of Account/Group
     * @param buttonId of the restore button on the grid 
     * appropriate call to restore depending on the account/group
     */
    restoreButtonHandler: function (record, buttonId) {
        var restoreButton,
            selectUserId = [],
            selectedGrpId = [];

        if (Ext.isDefined(buttonId)) {
            restoreButton = Ext.getCmp(buttonId);
            if (restoreButton) {
                restoreButton.setDisabled(true);
                restoreButton.setText('#{msgs.deleted_objects_grid_button_label_restoring}');
            }
        }
        if (Ext.isDefined(record.getId())) {
            if (record.data.objectType === 'group') {
                selectedGrpId.push(record.getId());
            } else {
                selectUserId.push(record.getId());
            }
        }
        this.callRestore(selectUserId, selectedGrpId);
    },

    /* This function will populate the selected ids of the accounts and groups
     * and prompt the confirmation message.
     * @param restoreAllBtn restore all button present on the page for restore multiple objects
     * @param selectUserId Ids of the selected accounts
     * @param selectedGrpId Ids of the selected groups
     */
    restoreSelectedObjectsHandler: function (restoreAllBtn, selectUserId, selectedGrpId) {
        var accountGrid,
            groupGrid,
            parms,
            gp_parms;

        if (selectUserId === null && selectedGrpId === null) {
            if (Ext.isDefined('recycleBinAccountsGrid')) {
                accountGrid = Ext.getCmp('recycleBinAccountsGrid');
            }
            if (Ext.isDefined('recycleBinGroupsGrid')) {
                groupGrid = Ext.getCmp('recycleBinGroupsGrid');
            }
            if (accountGrid || groupGrid) {
                parms = accountGrid.getMergeParams();
                gp_parms = groupGrid.getMergeParams();

                //Prevent submission if no deleted objects are selected.
                if (parms.numOfSelectedIds === 0 && gp_parms.numOfSelectedIds === 0) {
                    Ext.MessageBox.alert('#{msgs.deleted_objects_grid_err_select_entity_title}', '#{msgs.deleted_objects_grid_restore_missing_object}');
                    return;
                }
                //disable the confirmation message before restore
                SailPoint.LCM.ManageDeletedObjects.DisplayDeletedObjects.displayRestorePrompt(restoreAllBtn, null, null);
            } else {
                return;
            }
        }
    },

    /* This function will update the button state during multiple restore and then 
     * call the restore 
     * @param selectUserId Ids of the selected accounts
     * @param selectedGrpId Ids of the selected groups
     */
    restoreSelectedObjects: function (restoreAllBtn) {
        var accountGrid,
            groupGrid,
            isAllUsersSelected = false,
            isAllGroupsSelected = false,
            excludedUserIds = [],
            excludedGroupIds = [];
        if (Ext.isDefined('recycleBinAccountsGrid')) {
            accountGrid = Ext.getCmp('recycleBinAccountsGrid');
        }
        if (Ext.isDefined('recycleBinGroupsGrid')) {
            groupGrid = Ext.getCmp('recycleBinGroupsGrid');
        }
        restoreAllBtn.disabled = true;
        if (accountGrid) {
            isAllUsersSelected = accountGrid.selModel.isAllSelected();
            if(isAllUsersSelected) {
             excludedUserIds = accountGrid.selModel.getExcludedIds();
            }
            else if(!isAllUsersSelected) {
             selectUserId = accountGrid.selModel.getSelectedIds();
            }
        }
        if (groupGrid) {
            isAllGroupsSelected= groupGrid.selModel.isAllSelected();
            if(isAllGroupsSelected) {  
             excludedGroupIds = groupGrid.selModel.getSelectedIds();
            }
            else if(!isAllGroupsSelected) {
            selectedGrpId = groupGrid.selModel.getSelectedIds();
            }
        }
        
        if(isAllUsersSelected || isAllGroupsSelected) {
            if(isAllUsersSelected) {
               accountGrid.store.load({
                 params: {start: 0, limit: accountGrid.store.getTotalCount() },
                   callback: function(records, operation, success) {
                     if(records.length > 0) {
                       selectUserId = accountGrid.selModel.getSelectedIds();
                       if(excludedUserIds.length >0) {
                          selectUserId=Ext.Array.difference(selectUserId,excludedUserIds);
                        }
                       Ext.getCmp('recycleBinAccountsGrid').setDisabled(true);
                       SailPoint.LCM.ManageDeletedObjects.DisplayDeletedObjects.callRestore(selectUserId, []);
                     }
                   },
                  scope: this
               });
            }
            if(isAllGroupsSelected) {
               groupGrid.store.load({
                 params: {start: 0, limit: groupGrid.store.getTotalCount() },
                   callback: function(records, operation, success) {
                     if(records.length > 0) { 
                       selectedGrpId = groupGrid.selModel.getSelectedIds();
                       if(excludedGroupIds.length >0) {
                          selectedGrpId=Ext.Array.difference(selectedGrpId,excludedGroupIds);
                        }
                      Ext.getCmp('recycleBinGroupsGrid').setDisabled(true);
                      SailPoint.LCM.ManageDeletedObjects.DisplayDeletedObjects.callRestore([], selectedGrpId);
                     }
                   },
                   scope: this
                 });
             }
        }
        else {
          //Also disable the individual Restore button for each record on the grid's column
          this.updateButtonState(selectUserId, selectedGrpId, true);
          if (selectUserId || selectedGrpId) {
             this.callRestore(selectUserId, selectedGrpId);
          }
        }
    },
    
    /* This function will call the restore action of the backing bean by clicking the 
     * the button present on the JSF page
     * @param selectUserId Ids of the selected accounts
     * @param selectedGrpId Ids of the selected groups
     */
    callRestore: function (selectUserId, selectedGrpId) {
        $('editForm:accountSelectedIds').value = arrayToString(selectUserId, false);
        $('editForm:groupSelectedIds').value = arrayToString(selectedGrpId, false);
        $('editForm:selectedApplicationId').value = SailPoint.LCM.ManageDeletedObjects.selectedAppId;
        $("editForm:restoreCmdBtn").click();
    },

    /* This function will update the state of the restore buttons(enable/disable)
     * when restore operation completes. Also it refreshes the grids to update the records.
     * @param selectUserId Ids of the selected accounts
     * @param selectedGrpId Ids of the selected groups
     */
    endRestore: function (selectUserId, selectedGrpId) {
        //Enable the individual Restore button for each record
        selectUserId = stringToArray(selectUserId, true);
        selectedGrpId = stringToArray(selectedGrpId, true);
        this.updateButtonState(selectUserId, selectedGrpId, false);

        //enable the button on page
        if (Ext.get('restoreButton')) {
            Ext.get('restoreButton').dom.disabled = false;
        }

        //Refresh the grids
        Ext.getCmp('recycleBinAccountsGrid').setDisabled(false);
        Ext.getCmp('recycleBinGroupsGrid').setDisabled(false);
        Ext.getCmp('recycleBinAccountsGrid').getStore().load();
        Ext.getCmp('recycleBinGroupsGrid').getStore().load();
    },

    /* This function will update the state of the restore buttons(enable/disable)
     * @param selectUserId Ids of the selected accounts
     * @param selectedGrpId Ids of the selected groups
     * @param disabledState disabled state of the restore button
     */
    updateButtonState: function (selectUserId, selectedGrpId, disabledState) {
        var i,
            buttonId,
            restoreButton;

        for (i = 0; i < selectUserId.length; i++) {
            buttonId = selectUserId[i];
            if (Ext.isDefined(buttonId)) {
                restoreButton = Ext.getCmp(buttonId);
                if (restoreButton) {
                    restoreButton.setDisabled(disabledState);
                    if (disabledState) {
                        restoreButton.setText('#{msgs.deleted_objects_grid_button_label_restoring}');
                    }
                }
            }
        }

        for (i = 0; i < selectedGrpId.length; i++) {
            buttonId = selectedGrpId[i];
            if (Ext.isDefined(buttonId)) {
                restoreButton = Ext.getCmp(buttonId);
                if (restoreButton) {
                    restoreButton.setDisabled(disabledState);
                    if (disabledState) {
                        restoreButton.setText('#{msgs.deleted_objects_grid_button_label_restoring}');
                    }
                }
            }
        }
    }

};
