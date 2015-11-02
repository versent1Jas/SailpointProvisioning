/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.LCM');

Ext.define('SailPoint.LCM.RequestAccessRoleWizard', {
    extend: 'Ext.window.Window',

    modal: true,
    width: 768,
    height: 500,
    layout: 'card',
    permittedRolesPanel: null,
    assignmentSelectionPanel: null,
    accountSelectionsPanel: null,
    requestAccessList: null,
    accountRequest: null,
    prevStep: 0,

    currentRequests: null,

    constructor: function(config) {
        var me = this,
            activeItem;

        // if an assignmentId was passed in go ahead and set it, this can
        // happen if a permitted role is directly requested and there is only
        // one assignment permitting the role
        if (!Ext.isEmpty(config.assignmentId)) {
            config.accountRequest.attributeRequests[0].assignmentId = config.assignmentId;
        }

        me.currentRequests = [config.accountRequest];

        me.permittedRolesPanel = Ext.create('SailPoint.LCM.RequestAccessPermittedRolesStep', {
            accountRequest: config.accountRequest,
            gridMetaData: config.gridMetaData
        });

        me.assignmentSelectionPanel = Ext.create('SailPoint.LCM.RequestAccessRoleAssignmentSelectionStep', {
            identityId: SailPoint.LCM.RequestAccess.identityId,
            accountRequest: config.accountRequest
        });

        me.accountSelectionsPanel = Ext.create('SailPoint.LCM.RequestAccessRoleAccountSelectionsStep', {
            accountRequest: config.accountRequest,
            accountSelections: config.accountSelections,
            allowAssignmentNote: config.allowAssignmentNote
        });

        activeItem = me.getActiveItemFromStatus(config.status);

        Ext.apply(config, {
            closable: false,
            activeItem: activeItem,
            items: [
                this.permittedRolesPanel,
                this.assignmentSelectionPanel,
                this.accountSelectionsPanel
            ],
            buttons: [{
                id: 'backBtn',
                text: "#{msgs.button_back}",
                cls: 'secondaryBtn',
                hidden: true,
                listeners: {
                    click: {
                        scope: me,
                        fn: me.back
                    }
                }
            }, '->', {
                id: 'continueBtn',
                text:"#{msgs.button_continue}",
                listeners: {
                    click: {
                        scope: me,
                        fn: me.next
                    }
                }
            }, {
                id: 'cancelBtn',
                text:"#{msgs.button_cancel}",
                cls : 'secondaryBtn',
                handler: function() {
                    me.close();
                }
            }]
        });

        this.callParent(arguments);
    },

    getActiveItemFromStatus: function(status) {
        var statusArray = [
            SailPoint.LCM.RequestAccess.RequestedObjectStatus.PROMPT_PERMITTED_ROLES,
            SailPoint.LCM.RequestAccess.RequestedObjectStatus.PROMPT_ROLE_ASSIGNMENT_SELECTION,
            SailPoint.LCM.RequestAccess.RequestedObjectStatus.PROMPT_ACCOUNT_SELECTION_ROLE
        ];

        return statusArray.indexOf(status);
    },

    getPermittedRolesStep: function() {
        return this.permittedRolesPanel;
    },

    getAssignmentSelectionStep: function() {
        return this.assignmentSelectionPanel;
    },

    getAccountSelectionsStep: function() {
        return this.accountSelectionsPanel;
    },

    getActiveIndex: function() {
        return this.items.indexOf(this.getLayout().getActiveItem());
    },

    back: function() {
        // dont show back button for first or second item
        var prevIndex = Math.max(1, this.prevStep);
        if (prevIndex === 1) {
            this.queryById('backBtn').hide();
        }

        this.getLayout().setActiveItem(this.items.get(this.prevStep));
    },

    next: function() {
        var activeIndex = this.getActiveIndex();

        // save off current step if we are not on the last step
        if (!this.isLastStep()) {
            this.prevStep = activeIndex;
        }

        if (activeIndex === 0) {
            this.permittedRolesFinished();
        } else if (activeIndex === 1) {
            this.assignmentSelectionFinished();
        } else {
            this.accountSelectionsFinished();
        }
    },

    isLastStep: function() {
        var LAST_STEP_INDEX = 2;

        return this.getActiveIndex() === LAST_STEP_INDEX;
    },

    permittedRolesFinished: function() {
        var me = this;

        function assimilateSelections(selections) {
            var requests = [me.accountRequest];
            selections.each(function(record) {
                var request = SailPoint.LCM.RequestAccess.createAccountRequestFromRecord(
                    SailPoint.LCM.RequestAccess.ATTRIBUTE_OP_ADD,
                    record,
                    SailPoint.LCM.RequestAccess.OBJECT_TYPE
                );

                request.attributeRequests[0].args.permittedBy = me.accountRequest.arguments.name;

                // permitted requests should always be for detectedRoles attribute
                request.attributeRequests[0].name = SailPoint.LCM.RequestAccess.DETECTED;

                requests.push(request);
            });

            me.checkForAccountSelections(requests);
        };

        var grid = this.getPermittedRolesStep().getGrid();
        var selections = [];
        var exclusions;
        var selectCriteria = grid.getSelectionCriteria();
        if (selectCriteria.selectAll) {
            // get every record from the store except for exclusions
            exclusions = selectCriteria.exclusions || [];

            // ugh, we have to create another store for select all since we build
            // account requests in javascript.  we can't just tell the
            // server to include everything since the browser is keeping
            // score right now.  Also we can't just do an Ext.ajax.request
            // since we need to provide the rows as an Ext.Model array
            var selectAllStore = SailPoint.Store.createRestStore({
                fields: grid.gridMetaData.fields,
                autoLoad: false,
                url: grid.getStore().getProxy().url,
                sorters: [{ property : 'displayableName', direction : 'ASC' }],
                remoteSort: true,
                extraParams: {
                    excludedIds: exclusions.join(","),
                    selectAll: selectCriteria.selectAll,
                    limit: 1000   // A thousand permitted roles should be enough for anybody.
                }
            });

            selectAllStore.load({
                scope: this,
                callback: function(records, operation, success) {
                    if (!success) {
                        SailPoint.FATAL_ERR_ALERT();
                    } else {
                        assimilateSelections(records);
                    }
                }
            });

        } else {
            selections = grid.getSelectionModel().getSelection();
            assimilateSelections(selections);
        }
    },

    assignmentSelectionFinished: function() {
        var selection = this.assignmentSelectionPanel.getSelectedRoleAssignment(),
            acctRequest = this.accountRequest,
            assignmentId;

        if (selection === null) {
            this.assignmentSelectionPanel.showError(true);
        } else {
            assignmentId = selection.getId();

            acctRequest.attributeRequests[0].assignmentId = assignmentId;

            this.checkForAccountSelections([acctRequest]);
        }
    },

    accountSelectionsFinished: function() {
        var formPanel = this.getAccountSelectionsStep().getSelectionsPanel(),
            assignmentNote, accountInfos, accountInfo, accountSelections, request,
            identityPanels, identityPanel, target, selection, decision, i, j, k;

        if (formPanel.getForm().isValid()) {
            accountInfos = [];
            assignmentNote = this.getAccountSelectionsStep().getNote();
            accountSelections = this.getAccountSelectionsStep().getAccountSelections();
            identityPanels = this.getAccountSelectionsStep().getIdentitySelectionsPanels();

            for (i = 0; i < accountSelections.length; ++i) {
                identityPanel = identityPanels[i];

                for (j = 0; j < accountSelections[i].targets.length; ++j) {
                    target = accountSelections[i].targets[j];

                    for (k = 0; k < target.selections.length; ++k) {
                        selection = target.selections[k];

                        decision = identityPanel.findSelection(
                            selection.applicationName,
                            selection.roleName
                        );

                        accountInfo = new SailPoint.LCM.RequestAccess.AccountInfo();
                        accountInfo.identityId = identityPanel.getIdentityId();
                        accountInfo.nativeIdentity = decision.nativeIdentity;
                        accountInfo.instance = decision.instance;
                        accountInfo.roleName = decision.roleName;
                        accountInfo.applicationName = decision.applicationName;

                        accountInfos.push(accountInfo);
                    }
                }
            }

            if (!Ext.isEmpty(assignmentNote)) {
                for (i = 0; i < this.currentRequests.length; ++i) {
                    request = this.currentRequests[i];

                    // don't add assignment note to permitted by request
                    if (Ext.isEmpty(request.attributeRequests[0].args.permittedBy)) {
                        request.attributeRequests[0].args.assignmentNote = assignmentNote;
                    }
                }
            }
            
            var hasExistingAssignment = this.requestAccessList.hasExistingAssignment(this.currentRequests, accountInfos, this);
            if (!hasExistingAssignment) {
              this.requestAccessList.addRequests(this.currentRequests, accountInfos);
              this.close();
            }

        }
    },

    checkForAccountSelections: function(requests) {
        var me = this;

        me.currentRequests = requests;
        me.enableButtons(false);

        Ext.Ajax.request({
            method: 'POST',
            url: SailPoint.getRelativeUrl('/rest/requestAccess/additionalQuestions'),
            params: {
                request: Ext.JSON.encode(requests),
                identityId: SailPoint.LCM.RequestAccess.identityId,
                skipPermitted: true,
                skipAssignments: true
            },
            success: function(response) {
                var data = Ext.JSON.decode(response.responseText);

                if (me.isPromptAccountSelection(data.status)) {
                    me.getAccountSelectionsStep().setAccountSelections(data.requesteeSelections);
                    me.queryById('backBtn').show();
                    me.getLayout().setActiveItem(me.getAccountSelectionsStep());
                } else {
                    me.requestAccessList.addRequests(requests);
                    me.close();
                }
            },
            callback: function() {
                me.enableButtons(true);
            }
        });
    },

    enableButtons: function(enable) {
        var buttons = ['backBtn', 'continueBtn', 'cancelBtn'],
            button, i;

        for (i = 0; i < buttons.length; ++i) {
            button = this.queryById(buttons[i]);
            if (button) {
                button.setDisabled(!enable);
            }
        }
    },

    isPromptAccountSelection: function(status) {
        return status === SailPoint.LCM.RequestAccess.RequestedObjectStatus.PROMPT_ACCOUNT_SELECTION_ROLE;
    }
});

Ext.define('SailPoint.LCM.RequestAccessPermittedRolesStep', {
    extend : 'Ext.panel.Panel',

    detailsPanel: null,
    permittedRolesGrid: null,

    accountRequest: null,

    constructor: function(config) {
        var me = this;

        this.detailsPanel = Ext.create('Ext.panel.Panel', {
            height: 200,
            bodyStyle: 'padding: 10px;',
            region: 'north',
            data: config.accountRequest,
            autoScroll: true,
            tpl: new Ext.XTemplate(
                '<tpl for=".">',
                  '<p class="permittedRoleDetailsInstructions">#{msgs.lcm_request_access_permit_instructions}</p>',
                  '<div class="permittedRoleDetails">',
                    '<table class="details">',
                      '<tr><td><label>#{msgs.name}:</label></td><td class="pl">{[Ext.String.htmlEncode(values.arguments.displayableName)]}</td></tr>',
                      '<tr><td><label>#{msgs.owner}:</label></td><td class="pl">{arguments.owner}</td></tr>',
                      '<tr><td><label>#{msgs.description}:</label></td><td class="pl">{arguments.description}</td></tr>',
                    '</table>',
                  '</div>',
                '</tpl>'
            )
        });

        this.permittedRolesGrid = Ext.create('SailPoint.grid.PagingCheckboxGrid', {
            id: 'permittedRolesGrid',
            cls: 'smallFontGrid wrappingGrid',
            region: 'center',
            disableMouseTracking: true,
            pageSize: 5,
            gridMetaData: config.gridMetaData,
            viewConfig: {
                scrollOffset: 0,
                stripeRows: true
            },
            store: SailPoint.Store.createRestStore({
                storeId: 'permittedRolesStore',
                fields: config.gridMetaData.fields,
                autoLoad: false,
                url: SailPoint.getRelativeUrl('/rest/roles/grid/' + config.accountRequest.arguments.id + '/permits'),
                sorters: [{
                    property: 'displayableName',
                    direction: 'ASC'
                }],
                remoteSort: true,
                listeners: {
                    load: function(store, records) {
                        var i,
                            toSelect = [];

                        for (i = 0; i < records.length; i++) {
                            if (records[i].get('IIQ_Selected')) {
                                toSelect.push(records[i]);
                            }
                        }

                        me.getGrid().getSelectionModel().select(toSelect, true);
                    }
                }
            })
        });

        Ext.apply(config, {
            id: 'permittedRolesStep',
            title: Ext.String.format(
                "#{msgs.lcm_request_access_further_info}",
                Ext.String.htmlEncode(config.accountRequest.arguments.displayableName)
            ),
            layout: 'border',
            items: [
                this.detailsPanel,
                this.permittedRolesGrid
            ],
            listeners: {
                activate: {
                    single: true,
                    fn: function() {
                        me.permittedRolesGrid.getStore().load();
                    }
                }
            }
        });

        this.callParent(arguments);
    },

    getGrid: function() {
        return this.permittedRolesGrid;
    }
});

Ext.define('SailPoint.LCM.RequestAccessRoleAssignmentSelectionStep', {
    extend: 'Ext.panel.Panel',

    identityId: null,
    accountRequest: null,
    assignmentsGrid: null,
    errorPanel: null,

    constructor: function(config) {
        var me = this,
            detailsPanel, storeUrl;

        detailsPanel = Ext.create('Ext.panel.Panel', {
            height: 60,
            bodyStyle: 'padding: 10px;',
            region: 'north',
            html: '<p class="permittedRoleDetailsInstructions">#{msgs.lcm_request_access_role_assignment_select_info}</p>'
        });

        me.errorPanel = Ext.create('Ext.panel.Panel', {
            height: 70,
            bodyStyle: 'padding: 5px',
            region: 'north',
            html: '<p class="error">#{msgs.lcm_request_access_role_assignment_select_invalid}</p>',
            hidden: true
        });

        storeUrl = Ext.String.format(
            SailPoint.getRelativeUrl('/rest/requestAccess/assignments/{0}/permits/{1}'),
            config.identityId,
            config.accountRequest.arguments.id
        );

        me.assignmentsGrid = Ext.create('Ext.grid.Panel', {
            id: 'roleAssignmentsGrid',
            cls: 'smallFontGrid wrappingGrid',
            region: 'center',
            viewConfig: {
                scrollOffset: 0,
                stripeRows: true
            },
            selModel: Ext.create('SailPoint.grid.UniqueCheckboxSelectionModel', {
                listeners: {
                    select: function(selModel, record, index, eOpts) {
                        me.showError(false);
                    }
                }
            }),
            store: Ext.create('Ext.data.Store', {
                storeId: 'roleAssignmentStore',
                autoLoad: false,
                fields: ['id', 'name', 'assignmentNote', 'assigner', 'created'],
                proxy: {
                    url: storeUrl,
                    type: 'ajax',
                    reader: {
                        type: 'json',
                        idProperty: 'id',
                        root: 'objects',
                        totalProperty: 'count'
                    }
                }
            }),
            columns: [{
                header: "#{msgs.lcm_request_access_role_assignment_select_col_name}",
                dataIndex: 'name',
                sortable: false,
                flex: 2
            }, {
                header: "#{msgs.lcm_request_access_role_assignment_select_col_assigner}",
                dataIndex: 'assigner',
                sortable: false,
                flex: 1
            }, {
                header: "#{msgs.lcm_request_access_role_assignment_select_col_note}",
                dataIndex: 'assignmentNote',
                sortable: false,
                flex: 3
            }, {
                header: "#{msgs.lcm_request_access_role_assignment_select_col_date}",
                dataIndex: 'created',
                sortable: false,
                flex: 1
            }]
        });

        Ext.apply(config, {
            id: 'assignmentSelectionStep',
            title: Ext.String.format(
                "#{msgs.lcm_request_access_role_assignment_select_title}",
                config.accountRequest.arguments.displayableName
            ),
            layout: 'border',
            items: [detailsPanel, me.errorPanel, me.assignmentsGrid],
            listeners: {
                activate: {
                    single: true,
                    fn: function() {
                        me.assignmentsGrid.getStore().load();
                    }
                }
            }
        });

        me.callParent(arguments);
    },

    getSelectedRoleAssignment: function() {
        return this.assignmentsGrid.getSelectionModel().getUniqueSelection();
    },

    showError: function(show) {
        if (show === true) {
            this.errorPanel.show();
        } else {
            this.errorPanel.hide();
        }
    }
});

Ext.define('SailPoint.LCM.RequestAccessRoleAccountSelectionsStep', {
    extend : 'Ext.panel.Panel',

    detailsPanel: null,
    selectionsPanel: null,
    noteTextArea: null,
    identitySelectionsPanels: null,
    accountRequest: null,
    accountSelections: null,

    constructor: function(config) {
        var items;

        this.detailsPanel = Ext.create('Ext.panel.Panel', {
            border: false,
            bodyStyle: 'padding: 10px;',
            region: 'north',
            data: config.accountRequest,
            autoScroll: true,
            tpl: new Ext.XTemplate(
                '<tpl for=".">',
                  '<p class="permittedRoleDetailsInstructions">#{msgs.lcm_request_access_role_account_selections_instructions}</p>',
                '</tpl>'
            )
        });

        this.selectionsPanel = Ext.create('Ext.form.Panel', {
            items: [],
            region: 'center',
            overflowY: 'auto',
            border: false,
            defaults: {
                padding: '0'
            }
        });

        this.setAccountSelections(config.accountSelections);

        items = [this.detailsPanel, this.selectionsPanel];

        if (config.allowAssignmentNote === true) {
            this.noteTextArea = Ext.create('Ext.form.field.TextArea', {
                fieldLabel: '#{msgs.label_assignment_note}',
                width: 500
            });

            items.push({
                xtype: 'panel',
                componentCls: 'role-acct-selection-panel',
                region: 'south',
                border: false,
                height: 104,
                bodyStyle: 'padding-bottom: 30px; padding: 10px',
                items: [this.noteTextArea]
            });
        }

        Ext.apply(config, {
            layout: 'border',
            border: false,
            items: items
        });

        this.callParent(arguments);
    },

    getSelectionsPanel: function() {
        return this.selectionsPanel;
    },

    getNote: function() {
        return this.noteTextArea === null ? '' : this.noteTextArea.getValue();
    },

    createAccountSelections: function() {
        var items = [],
            me = this,
            targetItems, accountSelectionPanel, identitySelectionsPanel;

        me.selectionsPanel.removeAll();
        me.identitySelectionsPanels = [];

        if (me.accountSelections) {
            me.accountSelections.each(function(data) {
                data.targets.each(function(target) {
                    identitySelectionsPanel = Ext.create('SailPoint.LCM.RequestAccessIdentityRoleSelectionsPanel', {
                        target: target,
                        identityName: data.identityName,
                        identityId: data.identityId
                    });

                    me.identitySelectionsPanels.push(identitySelectionsPanel);

                    items.push(identitySelectionsPanel);
                });
            });
        }

        me.selectionsPanel.add(items);
    },

    getAccountSelections: function() {
        return this.accountSelections;
    },

    setAccountSelections: function(accountSelections) {
        this.accountSelections = accountSelections;
        this.createAccountSelections();
    },

    getIdentitySelectionsPanels: function() {
        return this.identitySelectionsPanels;
    }
});

Ext.define('SailPoint.LCM.RequestAccessIdentityRoleSelectionsPanel', {
    extend: 'Ext.panel.Panel',

    identityId: null,

    target: null,

    accountSelectionsPanels: null,

    constructor: function(config) {
        var me = this,
            items = [],
            accountSelectionsPanel;

        me.accountSelectionsPanels = [];

        items.push({
            xtype: 'panel',
            border: false,
            html: '<p class="role-acct-select-hdr">' + Ext.util.Format.htmlEncode(config.target.roleName) + '</p>'
        });

        config.target.selections.each(function(selection) {
            accountSelectionsPanel = Ext.create('SailPoint.LCM.RequestAccessRoleAccountSelectionPanel', {
                identityId: config.identityId,
                applicationName: selection.applicationName,
                roleName: selection.roleName,
                hasInstances: selection.hasInstances,
                allowCreate: selection.allowCreate
            });

            me.accountSelectionsPanels.push(accountSelectionsPanel);

            items.push(accountSelectionsPanel);
        });

        Ext.apply(config, {
            componentCls: 'role-acct-selection-panel',
            title: Ext.String.format('#{msgs.lcm_request_entitlements_select_native_identity_format}', config.identityName),
            border: false,
            items: items
        });

        me.callParent(arguments);
    },

    getIdentityId: function() {
        return this.identityId;
    },

    findSelection: function(applicationName, roleName) {
        var panel, nativeIdentity, i;

        for (i = 0; i < this.accountSelectionsPanels.length; ++i) {
            panel = this.accountSelectionsPanels[i];

            if (panel.getApplicationName() === applicationName &&
                panel.getTargetRoleName() === roleName) {

                return {
                    nativeIdentity: panel.getNativeIdentity(),
                    instance: panel.getInstance(),
                    roleName: panel.getTargetRoleName(),
                    applicationName: panel.getApplicationName()
                };
            }
        }
    }

});

Ext.define('SailPoint.LCM.RequestAccessRoleAccountSelectionPanel', {
    extend: 'Ext.panel.Panel',

    nativeIdentityCombo: null,

    instanceCombo: null,

    roleName: null,

    applicationName: null,

    constructor: function(config) {
        var contextField,
            items,
            me = this;

        contextField = me.createContextFieldConfig(
            config.applicationName,
            config.roleName
        );

        items = [contextField];

        if (config.hasInstances === true) {
            me.instanceCombo = me.createInstanceCombo(
                config.applicationName
            );

            items.push(me.instanceCombo);
        }

        me.nativeIdentityCombo = me.createNativeIdentityCombo(
            config.identityId,
            config.applicationName,
            me.instanceCombo,
            config.allowCreate
        );

        items.push(me.nativeIdentityCombo);

        Ext.apply(config, {
            bodyStyle: 'padding: 10px',
            border: false,
            items: items
        });

        me.callParent(arguments);
    },

    getApplicationName: function() {
        return this.applicationName;
    },

    getTargetRoleName: function() {
        return this.roleName;
    },

    getIdentityId: function() {
        return this.identityId;
    },

    getNativeIdentity: function() {
        var nativeIdentity = this.nativeIdentityCombo.getValue();

        if(nativeIdentity=='#{msgs.lcm_request_entitlements_create_account_option_desc}') {
            nativeIdentity = 'new';
        }

        return nativeIdentity;
    },

    getInstance: function() {
        if (this.instanceCombo) {
            return this.instanceCombo.getValue();
        }

        return null;
    },

    createInstanceCombo: function(applicationName) {
        var store, combo;

        store = SailPoint.Store.createRestStore({
            url: SailPoint.getRelativeUrl('/rest/applications/{0}/instances'),
            fields: ['instance'],
            remoteSort: true,
            method: 'GET'
        });

        store.applyPathParams([applicationName]);

        combo = Ext.create('Ext.form.ComboBox', {
            width:400,
            allowBlank: false,
            forceSelection: true,
            border: false,
            editable: false,
            store: store,
            valueField: 'instance',
            displayField: 'instance',
            emptyText: '#{msgs.lcm_request_entitlements_select_instance}',
            fieldLabel: '#{msgs.label_instance}'
        });

        return combo;
    },

    createNativeIdentityCombo: function(identityId, applicationName, instanceCombo, allowCreate) {
        return Ext.create('SailPoint.component.NativeIdentityCombo', {
            createRequested: allowCreate,
            forceSelection: true,
            fieldLabel: '#{msgs.label_account}',
            allowBlank: false,
            border: false,
            editable: false,
            width: 400,
            instanceCombo: instanceCombo,
            storeFactory: new SailPoint.component.NativeIdentityStoreFactory(
                identityId,
                applicationName
            )
        });
    },

    createContextFieldConfig: function(applicationName, roleName) {
        var contextLabel = '#{msgs.label_for}',
            contextValue = applicationName;

        if (!Ext.isEmpty(roleName)) {
            contextValue = Ext.String.format('#{msgs.account_selection_account_on}', roleName, contextValue);
        }

        return {
            xtype: 'displayfield',
            fieldLabel: contextLabel,
            value: contextValue
        };
    }

});
