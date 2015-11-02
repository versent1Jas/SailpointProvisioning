Ext.define('sailpoint.component.ApplicationSchemaSelector', {
    extend: 'Ext.Component',
    // configure these parameters when creating the component
    applicationsSuggest: null,
    schemaSuggestId: null,
    hiddenSchemasId: null,
    // defaults to 'selectGroupsCheckboxId'
    selectGroupsCheckboxId: null,
    // will be initialized in initSchemaSuggest()
    schemaSuggest: null,
    applicationSchemaSuggestType: 'applicationSchema',
    groupSchemaTableId: 'groupSchemaTableId',
    selectedSchemasId: 'selectedSchemasId',
    moveStarted: false,

    constructor : function(config) {
        // copy some configs to the instance so init methods can use the configs
        this.applicationsSuggest = config.applicationsSuggest;
        this.schemaSuggestId = config.schemaSuggestId;
        this.hiddenSchemasId = config.hiddenSchemasId;
        this.selectGroupsCheckboxId = (config.selectGroupsCheckboxId) ? config.selectGroupsCheckboxId : 'selectGroupsCheckboxId'; 
        this.disabled = (config.disabled) ? config.disabled : false;
        this.width = (config.width) ? config.width : 350;
        
        this.id = config.schemaSuggestId + '-AppSchemaSelector';
        
        this.initAppSuggest();
        this.initSchemaSuggest();
        this.updateSchemasTable();
        if (this.getSelectedSchemasObj().length == 0) {
            $(this.selectGroupsCheckboxId).checked = '';
        } else {
            $(this.selectGroupsCheckboxId).checked = 'checked';
            Ext.get(this.groupSchemaTableId).show();
        }
        
        this.callParent(arguments);
    },
    
    initComponent: function() {
        
        this.callParent(arguments);
    },

    initAppSuggest: function() {
        var me = this;

        this.applicationsSuggest.on('moveStart', me.onMoveStarted, this);
        this.applicationsSuggest.on('moveEnd', me.onMoveEnded, this);

        this.applicationsSuggest.selectedStore.on('add', me.addApplication, this);
        this.applicationsSuggest.selectedStore.on('clear', me.clearSchema, this);
        this.applicationsSuggest.selectedStore.on('remove', me.clearSchema, this);
    },

    onMoveStarted: function() {
        this.moveStarted = true;
    },

    onMoveEnded: function() {
        this.moveStarted = false;
    },

    toggleSelectGroups : function() {
        var groupSchemaRow = Ext.get(this.groupSchemaTableId);
        if (groupSchemaRow.isVisible()) {
            this.clearAllSchemas();
            groupSchemaRow.setVisibilityMode(Ext.Element.DISPLAY);
            groupSchemaRow.hide();
        } else {
            groupSchemaRow.show();
        }
    },

    addApplication: function() {
        var includedAppData = this.applicationsSuggest.getData();

        var appIds = [];
        for (var i = 0; i < includedAppData.totalCount; ++i) {
            appIds.push(includedAppData.objects[i].id);
        }

        this.schemaSuggest.baseParams.includedApps = appIds.join(",");
        this.schemaSuggest.getStore().getProxy().extraParams.includedApps = appIds.join(",");
        this.schemaSuggest.getStore().load({
            params: {start: 0, limit: 10}
        });
    },

    /**
     * Remove all items from the application schema drop down.
     * This will not clear the includedApps.
     */
    clearAllSchemas: function() {
        $(this.hiddenSchemasId).value = Ext.JSON.encode([]);
        this.updateSchemasTable();
    },

    /**
     * Clear the schemas for the currently removed application.
     */
    clearSchema: function() {
        var i;
        if (this.moveStarted == true) {
            // clear calls can be called when reording apps, don't entertain them
            return;
        }

        var removedId = this.findRemovedId();
        if (removedId == null) {
            return;
        }

        // Fix the suggest so it no longer includes items for the app that was removed
        var includedAppData = this.applicationsSuggest.getData();
        var appIds = [];
        for (i = 0; i < includedAppData.totalCount; ++i) {
            appIds.push(includedAppData.objects[i].id);
        }
        this.schemaSuggest.baseParams.includedApps = appIds.join(",");
        this.schemaSuggest.getStore().getProxy().extraParams.includedApps = appIds.join(",");

        // Recreate the schemas list, including only those schemas that still have apps associated with them
        var selectedSchemasObj = this.getSelectedSchemasObj();

        var schemasToContinueToInclude = [];
        for (i = 0; i < selectedSchemasObj.length; ++i) {
            if (removedId != selectedSchemasObj[i].id) {
                schemasToContinueToInclude.push(selectedSchemasObj[i]);
            }
        }

        selectedSchemasObj = schemasToContinueToInclude;

        $(this.hiddenSchemasId).value = Ext.JSON.encode(selectedSchemasObj);
        this.updateSchemasTable();
    },

    findRemovedId: function() {
        var removedId = null;
        var store = this.applicationsSuggest.selectedStore;
        if (store.removed && store.removed.length > 0) {
            // objects are added to the end of the removed list. Pull from the end
            var removedRecord = store.removed[store.removed.length-1];
            removedId = removedRecord.get("id");
        }
        return removedId;
    },

    initSchemaSuggest: function() {
        var includedAppData = this.applicationsSuggest.getData(), appIds = [], i;
        
        for (i = 0; i < includedAppData.totalCount; ++i) {
            appIds.push(includedAppData.objects[i].id);
        }

        this.schemaSuggest = SailPoint.SuggestFactory.createSuggest(
            this.applicationSchemaSuggestType,
            this.schemaSuggestId,
            null,
            '#{msgs.task_in_account_group_aggregation_add_group}',
            {
                allowBlank: true,
                renderTo: this.schemaSuggestId,
                value: '',
                baseParams: {includedApps: appIds.join(","), filterAccountSchema: true},
                tpl: new Ext.XTemplate(
                    '<tpl for=".">',
                    '<div class="baseSearch x-boundlist-item">',
                    '<div class="sectionHeader">{appName}</div>',
                    '<div class="indentedColumn">{schemaName}</div>',
                    '</div>',
                    '</tpl>'
                ),
                fields: ['appId', 'appName', 'schemaId', 'schemaName'],
                disabled: this.disabled,
                width: this.width
            }
        );

        this.schemaSuggest.on('select', this.selectSchema, this);
    },

    /**
     * get json object from hidden field value
     */
    getSelectedSchemasObj: function () {
        var selectedSchemasObj;
        if (!$(this.hiddenSchemasId).value || $(this.hiddenSchemasId).value.length == 0) {
            selectedSchemasObj = [];
        } else {
            selectedSchemasObj = Ext.JSON.decode($(this.hiddenSchemasId).value);
        }
        return selectedSchemasObj;
    },

    /*
     * Format for selected schemas:
     *     [{
     *         id: 'xxxxxx',
     *         name: 'App1',
     *         schemas: [{id: 'xxx', name: 'xxx'}, ....]
     *     },{
     *         id: 'xxxxxx',
     *         name: 'App2',
     *         schemas: [{id: 'xxx', name: 'xxx'}, ....]
     *     }, ...]
     */
    selectSchema: function(suggest, records) {
        var selectedSchemasObj = this.getSelectedSchemasObj();
        var record = records && records.length > 0 ? records[0] : undefined;

        if (record) {
            var applicationId = record.get('appId');
            var foundObject = null;
            for (var i = 0; i < selectedSchemasObj.length; ++i) {
                if (selectedSchemasObj[i].id == applicationId) {
                    foundObject = selectedSchemasObj[i];
                }
            }

            if (foundObject !== null) {
                foundObject.schemas.push({ id: record.get('schemaId'), name: record.get('schemaName')});
            } else {
                selectedSchemasObj.push({
                    id: applicationId,
                    name: record.get('appName'),
                    schemas: [{ id: record.get('schemaId'), name: record.get('schemaName') }]
                });
            }
        }

        $(this.hiddenSchemasId).value = Ext.JSON.encode(selectedSchemasObj);

        this.updateSchemasTable();

        suggest.setValue('');
    },

    updateSchemasTable: function() {
        var schemas = Ext.JSON.decode($(this.hiddenSchemasId).value);
        this.sortSchemas(schemas);
        this.createSelectedSchemasTemplate().overwrite(this.selectedSchemasId, {selectedSchemas: schemas});

        this.updateSelectedSchemas();
    },

    updateSelectedSchemas: function() {
        var selectedSchemasObj = this.getSelectedSchemasObj();

        var selectedSchemaIds = [];
        for (var i = 0; i < selectedSchemasObj.length; ++i) {
            var schemas = selectedSchemasObj[i].schemas;
            for (var j = 0; j < schemas.length; ++j) {
                selectedSchemaIds.push(schemas[j].id);
            }
        }

        this.schemaSuggest.getStore().getProxy().extraParams.exclusionIds = selectedSchemaIds.join(",");
        var me = this;
        this.schemaSuggest.getStore().load({
            params: {start: 0, limit: 10},
            callback: function() {
                me.schemaSuggest.collapse();
                Ext.get(me.schemaSuggest.getEl()).blur();
            }
        });
    },

    /* Sort an array of schemas that has the form
     *     [{
     *         id: 'xxxxxx',
     *         name: 'App1',
     *         schemas: [{id: 'xxx', name: 'xxx'}, ....]
     *     },{
     *         id: 'xxxxxx',
     *         name: 'App2',
     *         schemas: [{id: 'xxx', name: 'xxx'}, ....]
     *     }, ...]
     *
     * The top level array is sorted by application and the schemas array is sorted by displayName
     */

    sortSchemas: function(selectedSchemas) {
        if (selectedSchemas) {
            selectedSchemas.sort(function(obj1, obj2) {
                return obj1.name.localeCompare(obj2.name);
            });

            for (var i = 0; i < selectedSchemas.length; ++i) {
                var schemas = selectedSchemas[i].schemas;
                if (schemas && schemas.length > 1) {
                    schemas.sort(function(obj1, obj2) {
                        return obj1.name.localeCompare(obj2.name);
                    });
                }
            }
        }
    },

    removeSchema: function(applicationId, schemaId) {
        var oldSelectedSchemas = this.getSelectedSchemasObj();
        var schemasToKeep = [];
        for (var i = 0; i < oldSelectedSchemas.length; ++i) {
            var appSchemasToKeep = [];
            if (oldSelectedSchemas[i].id == applicationId) {
                for (var j = 0; j < oldSelectedSchemas[i].schemas.length; ++j) {
                    if (oldSelectedSchemas[i].schemas[j].id != schemaId) {
                        appSchemasToKeep.push(oldSelectedSchemas[i].schemas[j]);
                    }
                }
                if (appSchemasToKeep.length > 0) {
                    oldSelectedSchemas[i].schemas = appSchemasToKeep;
                    schemasToKeep.push(oldSelectedSchemas[i]);
                } // else we have no further information to show for this app so let's not keep showing it
            } else {
                // No change for this app
                schemasToKeep.push(oldSelectedSchemas[i]);
            }
        }

        $(this.hiddenSchemasId).value = Ext.JSON.encode(schemasToKeep);
        this.updateSchemasTable();
    },

    /**
     * This template consumes selected schemas in this format:
     * <code>
     *     {selectedSchemas : [{
     *         id: 'xxxxxx',
     *         name: 'App1',
     *         schemas: [{id: 'xxx', name: 'xxx'}, ....]
     *     },{
     *         id: 'xxxxxx',
     *         name: 'App2',
     *         schemas: [{id: 'xxx', name: 'xxx'}, ....]
     *     }, ...]}
     * </code>
     */
    createSelectedSchemasTemplate: function() {
        return new Ext.XTemplate(
            '<table class="spTable" style="width: ' + this.width + 'px;"><thead>',
            '<tr><th colspan="2">#{msgs.task_in_account_group_aggregation_groups}</th></tr>',
            '</thead></table>',
            '<div style="height:151px; width: ' + this.width + 'px; border: solid #CCCCCC 1px; overflow: auto">',
            '<table class="spTable" style="border: none"><tbody>',
            '<tpl if="selectedSchemas.length == 0">',
            '<tr><td colspan="2" style="padding:0px">',
            '<div style="height:116px; padding:0px; vertical-align: center"/>',
            '<ul style="margin-top:32px"><li style="font-weight:700;color:#666;">#{msgs.task_in_account_group_aggregation_empty_groups}</li></ul>',
            '</div>',
            '</td></tr>',
            '</tpl>',
            '<tr><td><ul style="display:inline">',
            '<tpl for="selectedSchemas">',
            '<li style="display:inline; list-style:none; margin-left:0px"><div class="sectionHeader">#{msgs.application}: {name}</div></li>',
            '<tpl for="schemas">',
            '<li style="display:inline">',
            '<tpl if="this.disabled == false">',
            '<a href="javascript:void(0);" style="text-decoration: none;" onclick="Ext.getCmp(\'' + this.id + '\').removeSchema(',
            '\'{parent.id}\',',
            '\'{id}\'',
            ');"><div>',
            '<span style="width:16px; padding:3px">',
                '<img src="' + SailPoint.getRelativeUrl('/images/icons/remove_grey_12.png') + '" ',
                'onmouseover="this.src=\'' + SailPoint.getRelativeUrl('/images/icons/remove_12.png') + '\';" ',
                'onmouseout="this.src=\'' + SailPoint.getRelativeUrl('/images/icons/remove_grey_12.png') + '\';" ',
            'width="12" height="12"/>',
            '</span>',
            '<span style="padding:3px">{name}</span>',
            '</div></a>',
            '<tpl else>',
            '<div style="padding:3px">{name}</div>',
            '</tpl>',
            '<//li>',
            '</tpl>',
            '</tpl>',
            '</ul></td></tr>',
            '</tbody></table>',
            '</div>',
            {
                disabled: this.disabled
            }
        );
    }
});