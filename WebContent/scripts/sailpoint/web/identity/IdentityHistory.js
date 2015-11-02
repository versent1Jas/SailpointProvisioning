/* (c) Copyright 2010 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.Identity.History');

SailPoint.Identity.History.identityId;
SailPoint.Identity.History.grid;
SailPoint.Identity.History.type = "all";
SailPoint.Identity.History.decisions = [ "Comments", "Cleared", "Remediated", "Mitigated", "Approved" ];
SailPoint.Identity.History.separator;
SailPoint.Identity.History.iconToggle;
SailPoint.Identity.History.showStatusIcons = true;
SailPoint.Identity.History.showTypeIcons = true;

SailPoint.Identity.History.initializeGrid = function(gridStateStr, gridMetaData, gridPageSize, gridStateName, currentIdentity) {
    SailPoint.Identity.History.identityId = currentIdentity;

    var identityHistoryGridState = new SailPoint.GridState(JSON.parse(gridStateStr));

    // restore the state of the icon flags
    if (identityHistoryGridState._getValue('attributes')) {
        var statusIcons = identityHistoryGridState._getValue('attributes')['showStatusIcons'];
        if (statusIcons)
            SailPoint.Identity.History.showStatusIcons = (statusIcons === 'true');

        var typeIcons = identityHistoryGridState._getValue('attributes')['showTypeIcons'];
        if (typeIcons)
            SailPoint.Identity.History.showTypeIcons = (typeIcons === 'true');
    }

    // we need to pick up some data fields that aren't part of the display
    // columns
    gridMetaData.fields.push('statusIcon');
    gridMetaData.fields.push('typeIcon');

    var store = SailPoint.Store.createRestStore({
        autoLoad : false,
        url : SailPoint.getRelativeUrl('/rest/identities/' + SailPoint.Utils.encodeRestUriComponent(currentIdentity) + '/history'),
        fields : gridMetaData.fields,
        remoteSort : true
    });

    var gridWidth = $('identityCertHistoryContainer').clientWidth;
    
    var gridConfig = {
        id : 'identityCertHistoryGrid',
        store : store,
        cls : 'smallFontGrid selectableGrid',
        stateful : true,
        stateId : gridStateName,
        gridStateStr : gridStateStr,
        columns : gridMetaData.columns,
        width : gridWidth,
        pageSize : gridPageSize,
        usePageSizePlugin : true,
        viewConfig : {
            stripeRows : true,
            loadMask: false // the mask will be handled on the tab panel 
        },
        listeners : {
            itemclick : SailPoint.Identity.History.clickRow,
            itemcontextmenu : function(gridView, record, HTMLitem, index, e, eOpts) { e.stopEvent(); },
            load: SailPoint.Identity.History.correctGridDisplay
        }
    };

    SailPoint.Identity.History.grid = new SailPoint.grid.PagingGrid(gridConfig);
    SailPoint.Identity.History.grid.initialLoad(SailPoint.identity.setTabPanelHeight);

    var topToolbar = SailPoint.Identity.History.getTopToolbar();
    var filterForm = SailPoint.Identity.History.createFilterForm(gridWidth);

    var ct = new Ext.Panel({
        id : 'identityHistoryWrapperPanel',
        renderTo : 'identityCertHistoryContainer',
        width : gridWidth,
        style : 'margin: 0px 5px 5px 0px',
        items : [ filterForm, SailPoint.Identity.History.grid ],
        tbar : topToolbar
    });

    // this has to wait until after the grid has rendered
    SailPoint.Identity.History.initIconToggle();
};


SailPoint.Identity.History.correctGridDisplay = function() {
    // this gets around a weird interaction btwn JSF and JS, but only IE7
    if (Ext.isIE7) {
        Ext.fly('identityHistoryWrapperPanel').repaint();
        Ext.defer(function(){ SailPoint.identity.setTabPanelHeight(); }, 100);
    }
};


/**
 * Define the top toolbar for the grid, including the action that toggles the
 * filter form on and off
 */
SailPoint.Identity.History.getTopToolbar = function() {
	
    var toggleAction = new Ext.Action({
        text : '#{msgs.button_search}',
        scale: 'medium',
        handler : function() {
            Ext.getCmp('identityHistoryFilterForm').toggleCollapse();
        }
    });

    var pdfExport = new Ext.Button({
        iconCls : 'pdfIcon',
        handler : function() {
            SailPoint.Identity.History.prepareExport();
            SailPoint.Identity.History.exportAsPDF();
        }
    });

    var csvExport = new Ext.Button({
        iconCls : 'csvIcon',
        handler : function() {
            SailPoint.Identity.History.prepareExport();
            $('editForm:exportHistoryAsCSV').click();
        }
    });

    var topToolbar = new Ext.Toolbar({
        items : [ toggleAction, "->", pdfExport, csvExport ]
    });

    return topToolbar;
};

/**
 * Create a field for the search form that has a label on top of field.
 */
SailPoint.Identity.History.createSearchField = function(label, field, hidden) {
    
    return {
        xtype : 'container',
        defaults : {
            border : false
        },
        id : field.id + "Container",
        style : 'padding: 3px 3px 7px 3px',
        items : [ {
            xtype : 'container',
            defaults : {
                border : false
            },
            layout : {type:'table', columns : 1},
            items : [ {
                xtype : 'label',
                text : label,
                style : 'padding: 3px 0px'
            }, field ]
        } ],
        hidden : hidden ? true : false
    };
};

/**
 * Toggles the visibility of different filter fields based on which radio button
 * is selected.
 * 
 * NOTE: This method gets called when a radio is DE-selected as well, but we
 * only want to take action on the button that was selected.
 */
SailPoint.Identity.History.handleTypeChange = function(radio, isSelected) {
    var entitlementFields = [ 'id', 'identityHistoryApplication', 'identityHistoryAccount', 'identityHistoryAttribute', 'identityHistoryValue' ];
    var roleFields = [ 'id', 'identityHistoryRole' ];
    var policyFields = [ 'id', 'identityHistoryPolicy', 'identityHistoryConstraint' ];

    if (isSelected) {
        // this is a helper variable in lieu of being able to use a RadioGroup
        SailPoint.Identity.History.type = radio.getSubmitValue();

        switch (SailPoint.Identity.History.type) {
        case 'Exception':
            SailPoint.Identity.History.toggleFields(entitlementFields, true);
            SailPoint.Identity.History.toggleFields(roleFields, false);
            SailPoint.Identity.History.toggleFields(policyFields, false);
            break;
        case 'Bundle':
            SailPoint.Identity.History.toggleFields(entitlementFields, false);
            SailPoint.Identity.History.toggleFields(roleFields, true);
            SailPoint.Identity.History.toggleFields(policyFields, false);
            break;
        case 'PolicyViolation':
            SailPoint.Identity.History.toggleFields(entitlementFields, false);
            SailPoint.Identity.History.toggleFields(roleFields, false);
            SailPoint.Identity.History.toggleFields(policyFields, true);
            break;
        default:
            // hide all type-specific fields
            SailPoint.Identity.History.toggleFields(entitlementFields, false);
            SailPoint.Identity.History.toggleFields(roleFields, false);
            SailPoint.Identity.History.toggleFields(policyFields, false);
        }
        this.updateLayout();
    }
};

/**
 * Helper function to track selected decisions since we can't use the
 * CheckboxGroup that would ordinarily do this for us.
 */
SailPoint.Identity.History.handleDecisionChange = function(checkbox, isChecked) {
    var val = checkbox.getSubmitValue();
    if (isChecked) {
        // add the checked value to the list of selected decisions
        SailPoint.Identity.History.decisions.push(val);
    }
    else {
        // remove the unchecked decision from the list
        for (i = 0; i < SailPoint.Identity.History.decisions.length; i++) {
            if (SailPoint.Identity.History.decisions[i] == val)
                SailPoint.Identity.History.decisions.splice(i, 1);
        }
    }
};

/**
 * Toggles the visibility of the date field associated with the given checkbox,
 * and clears any value in the dateField when the checkbox gets unchecked.
 */
SailPoint.Identity.History.handleDateField = function() {
    var dateField = Ext.getCmp(this.getId() + "Field");
    dateField.setVisible(this.checked);

    if (!this.checked)
        dateField.reset();
    
    this.ownerCt.doLayout();
};

/**
 * Utility method to flip the visibility of a set of form fields
 */
SailPoint.Identity.History.toggleFields = function(fields, isVisible) {
    var i, field;
    for (i = 0; i < fields.length; i++) {
        field = Ext.getCmp(fields[i] + "Container");
        if(field) {
            field.setVisible(isVisible);
        }
    }
};

/**
 * Gets the grid data ready for export
 */
SailPoint.Identity.History.prepareExport = function() {
    // spoof a function that for some reason is missing on this page
    clearFormHiddenParams = function() {};

    // load the current grid sort info if it exists
    if (SailPoint.Identity.History.grid.store.sorters && SailPoint.Identity.History.grid.store.sorters.length > 0) {
        Ext.getCmp('identityHistorySortProperty').setValue(SailPoint.Identity.History.grid.store.sorters.getAt(0).property);
    }

    if (SailPoint.Identity.History.grid.store.sorters && SailPoint.Identity.History.grid.store.sorters.length > 0) {
        Ext.getCmp('identityHistorySortDirection').setValue(SailPoint.Identity.History.grid.store.sorters.getAt(0).direction);
    }

    $('editForm:filterParamsJSON').value = Ext.JSON.encode(SailPoint.Identity.History.getFilterParams());
};

/**
 * Launches the user-friendly modal that shows the export progress.
 */
SailPoint.Identity.History.exportAsPDF = function() {
    $('editForm:exportHistoryAsPDF').click();

    var exportMonitor = new SailPoint.ExportMonitor('editForm');
    exportMonitor.showDialog('PDF');
};

/**
 * Create the form containing the filter elements
 */
SailPoint.Identity.History.createFilterForm = function(gridWidth, pageSize) {
    // I'd love to use a FormPanel here, but ExtJS throws another
    // internal null pointer when I try it - for some reason, it's
    // failing to assign a <form> as the innerHTML of an element.
    var filterForm = Ext.create('SailPoint.panel.NoHeaderPanel', {
        id : 'identityHistoryFilterForm',
        name : 'identityHistoryFilterForm',
        frame : false,
        collapsed : true,
        
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'bottom',
            layout : {pack : 'end'},
            ui: 'footer',
            cls : 'searchPanelToolbar', // defined in sp-components.css
            style : 'background-color:#EEEEEE;',
            items: [
                {
                    text: '#{msgs.button_filter}',
                    handler : SailPoint.Identity.History.filter
                },
                {
                    text: '#{msgs.button_reset}',
                    cls : 'secondaryBtn',
                    handler : SailPoint.Identity.History.reset
                }
            ]
        }],
        defaults: { // defaults are applied to items, not this container
            bodyBorder : false,
            border : false,
            cls : 'searchPanelField' // defined in sp-components.css 
        },
        bodyStyle : 'padding:10px; background-color:#EEEEEE;',
        border: false,
        cls : 'x-panel-no-border',
        items : [ {
            xtype : 'container',
            defaults : {
                border : false
            },
            layout : 'column',
            items : [ {
                xtype : 'container',
                defaults : {
                    border : false
                },
                columnWidth : .25,
                items : [ SailPoint.Identity.History.createSearchField('#{msgs.identity_history_decision}', {
                    // same label render problem as the radio buttons, hence no
                    // CheckboxGroup
                    xtype : 'container',
                    defaults : {
                        border : false
                    },
                    id : 'identityHistoryDecision',
                    defaultType : 'checkbox',
                    items : [ {
                        boxLabel : '#{msgs.identity_history_decision_approved}',
                        id : 'identityHistoryDecision0',
                        name : 'decisions',
                        inputValue : 'Approved',
                        uncheckedValue : 'Approved',
                        checked : true,
                        handler : SailPoint.Identity.History.handleDecisionChange
                    }, {
                        boxLabel : '#{msgs.identity_history_decision_mitigated}',
                        id : 'identityHistoryDecision1',
                        name : 'decisions',
                        inputValue : 'Mitigated',
                        uncheckedValue : 'Mitigated',
                        checked : true,
                        handler : SailPoint.Identity.History.handleDecisionChange
                    }, {
                        boxLabel : '#{msgs.identity_history_decision_remediated}',
                        id : 'identityHistoryDecision2',
                        name : 'decisions',
                        inputValue : 'Remediated',
                        uncheckedValue : 'Remediated',
                        checked : true,
                        handler : SailPoint.Identity.History.handleDecisionChange
                    }, {
                        boxLabel : '#{msgs.identity_history_decision_cleared}',
                        id : 'identityHistoryDecision3',
                        name : 'decisions',
                        inputValue : 'Cleared',
                        uncheckedValue : 'Cleared',
                        checked : true,
                        handler : SailPoint.Identity.History.handleDecisionChange
                    }, {
                        boxLabel : '#{msgs.identity_history_decision_comments}',
                        id : 'identityHistoryDecision4',
                        name : 'decisions',
                        inputValue : 'Comments',
                        uncheckedValue : 'Comments',
                        checked : true,
                        handler : SailPoint.Identity.History.handleDecisionChange
                    } ]
                }) ]
            }, {
                xtype : 'container',
                defaults : {
                    border : false
                },
                columnWidth : .25,
                items : [ SailPoint.Identity.History.createSearchField('#{msgs.identity_history_type}', {
                    // using a RadioGroup here won't display in a column properly - 
                    // the labels don't display next to the radio buttons. Go figure...
                    xtype : 'container',
                    defaults : {
                        border : false
                    },
                    id : 'identityHistoryType',
                    defaultType : 'radio',
                    items : [ {
                        boxLabel : '#{msgs.identity_history_type_all}',
                        id : 'identityHistoryType0',
                        name : 'type',
                        inputValue : 'all',
                        handler : SailPoint.Identity.History.handleTypeChange,
                        checked : true
                    }, {
                        boxLabel : '#{msgs.identity_history_type_entitlement}',
                        id : 'identityHistoryType1',
                        name : 'type',
                        inputValue : 'Exception',
                        handler : SailPoint.Identity.History.handleTypeChange
                    }, {
                        boxLabel : '#{msgs.identity_history_type_role}',
                        id : 'identityHistoryType2',
                        name : 'type',
                        inputValue : 'Bundle',
                        handler : SailPoint.Identity.History.handleTypeChange
                    }, {
                        boxLabel : '#{msgs.identity_history_type_policy_violation}',
                        id : 'identityHistoryType3',
                        name : 'type',
                        inputValue : 'PolicyViolation',
                        handler : SailPoint.Identity.History.handleTypeChange
                    } ]
                }) ]
            }, {
                xtype : 'container',
                defaults : {
                    border : false
                },
                columnWidth : .25,
                items : [ SailPoint.Identity.History.createSearchField('#{msgs.identity_history_actor}', {
                    xtype : 'identitySuggest',
                    id : 'identityHistoryActor',
                    name : 'actor',
                    valueField : 'displayableName',
                    displayField : 'displayableName',
                    width : 200,
                    listConfig : {width:300}
                }),

                SailPoint.Identity.History.createSearchField('#{msgs.identity_history_application}', {
                    xtype : 'baseSuggest',
                    id : 'identityHistoryApplication',
                    name : 'application',
                    baseParams : {
                        'suggestType' : 'application'
                    },
                    forceSelection : false,
                    valueField : 'displayName',
                    width : 200,
                    listConfig : {width:300}
                }, true),

                SailPoint.Identity.History.createSearchField('#{msgs.identity_history_account}', {
                    xtype : 'textfield',
                    id : 'identityHistoryAccount',
                    name : 'account',
                    width : 200
                }, true),

                SailPoint.Identity.History.createSearchField('#{msgs.identity_history_policy}', {
                    xtype : 'baseSuggest',
                    id : 'identityHistoryPolicy',
                    name : 'policy',
                    baseParams : {
                        'suggestType' : 'policy'
                    },
                    forceSelection : false,
                    valueField : 'displayName',
                    width : 200,
                    listConfig : {width:300}
                }, true),

                SailPoint.Identity.History.createSearchField('#{msgs.identity_history_constraint}', {
                    xtype : 'textfield',
                    id : 'identityHistoryConstraint',
                    name : 'constraint',
                    width : 200
                }, true),

                SailPoint.Identity.History.createSearchField('#{msgs.identity_history_role}', {
                    xtype : 'baseSuggest',
                    id : 'identityHistoryRole',
                    name : 'role',
                    baseParams : {
                        'suggestType' : 'role'
                    },
                    forceSelection : false,
                    valueField : 'displayName',
                    width : 200,
                    listConfig : {width:300}
                }, true) ]
            }, {
                xtype : 'container',
                defaults : {
                    border : false
                },
                columnWidth : .25,
                items : [ SailPoint.Identity.History.createSearchField('#{msgs.identity_history_attribute}', {
                    xtype : 'textfield',
                    id : 'identityHistoryAttribute',
                    name : 'attribute',
                    width : 200
                }, true),

                SailPoint.Identity.History.createSearchField('#{msgs.identity_history_value}', {
                    xtype : 'textfield',
                    id : 'identityHistoryValue',
                    name : 'value',
                    width : 200
                }, true) ]
            } ]
        }, {
            xtype : 'container',
            html : '#{msgs.id_filter_by_date}',
            style : {
                'padding' : '3px',
                'background-color' : '#dddddd',
                'border-top' : '1px solid black'
            }
        }, {
            xtype : 'container',
            items : {
                xtype : 'container',
                layout : 'column',
                items : [ {
                    xtype : 'container',
                    defaults : {
                        border : false
                    },
                    columnWidth : .5,
                    items : [ {
                        xtype : 'panel',
                        layout : {
                            type : 'table',
                            columns : 3
                        },
                        defaults : {
                            bodyStyle : 'padding: 5px',
                            border : false
                        },
                        items : [ {
                            html : '#{msgs.identity_history_start_date}'
                        }, {
                            xtype : 'checkbox',
                            id : 'identityHistoryStartDate',
                            handler : SailPoint.Identity.History.handleDateField
                        }, {
                            xtype : 'datefield',
                            id : 'identityHistoryStartDateField',
                            name : 'startDate',
                            hidden : true,
                            style : 'margin-left: 10px'
                        } ]
                    } ]
                }, {
                    xtype : 'container',
                    defaults : {
                        border : false
                    },
                    columnWidth : .5,
                    items : [ {
                        xtype : 'panel',
                        layout : {
                            type : 'table',
                            columns : 3
                        },
                        defaults : {
                            bodyStyle : 'padding: 5px',
                            border : false
                        },
                        items : [ {
                            html : '#{msgs.identity_history_end_date}'
                        }, {
                            xtype : 'checkbox',
                            id : 'identityHistoryEndDate',
                            handler : SailPoint.Identity.History.handleDateField
                        }, {
                            xtype : 'datefield',
                            id : 'identityHistoryEndDateField',
                            name : 'endDate',
                            hidden : true,
                            style : 'margin-left: 10px'
                        } ]
                    } ]
                },
                // hidden fields that provide the grid sort info to the
                // exporters, pre-set with default values
                SailPoint.Identity.History.createSearchField('', {
                    xtype : 'textfield',
                    id : 'identityHistorySortProperty',
                    name : 'sortField',
                    value : 'certificationType'
                }, true),
                SailPoint.Identity.History.createSearchField('', {
                    xtype : 'textfield',
                    id : 'identityHistorySortDirection',
                    name : 'sortDirection',
                    value : 'ASC'
                }, true) ]
            }
        } ]
    });
    
    filterForm.on({
        expand : function(){SailPoint.identity.setTabPanelHeight();},
        collapse : function(){SailPoint.identity.setTabPanelHeight();}
    });

    return filterForm;
};

/**
 * Filter the grid contents based on the provided filter terms
 */

SailPoint.Identity.History.getFilterParams = function() {
    var filterParams = {};
    filterParams.decisions = SailPoint.Identity.History.decisions.valueOf();
    filterParams.type = SailPoint.Identity.History.type;
    filterParams.actor = Ext.getCmp('identityHistoryActor').getValue();

    if (Ext.getCmp('identityHistoryStartDateField').getValue())
        filterParams.startDate = Ext.getCmp('identityHistoryStartDateField').getValue().getTime();
    else
        filterParams.startDate = '';

    if (Ext.getCmp('identityHistoryEndDateField').getValue())
        filterParams.endDate = Ext.getCmp('identityHistoryEndDateField').getValue().getTime();
    else
        filterParams.endDate = '';

    // cherry-pick the data fields needed by the given type.
    // We don't need to clear the base params not used by the given type
    // because similar logic on the server side will only pull the data needed.
    switch (SailPoint.Identity.History.type) {
        case 'Exception':
            filterParams.application = Ext.getCmp('identityHistoryApplication').getRawValue();
            filterParams.account = Ext.getCmp('identityHistoryAccount').getRawValue();
            filterParams.attribute = Ext.getCmp('identityHistoryAttribute').getValue();
            filterParams.value = Ext.getCmp('identityHistoryValue').getValue();
            break;

        case 'PolicyViolation':
            filterParams.policy = Ext.getCmp('identityHistoryPolicy').getRawValue();
            filterParams.constraint = Ext.getCmp('identityHistoryConstraint').getValue();
            break;

        case 'Bundle':
            filterParams.role = Ext.getCmp('identityHistoryRole').getRawValue();
            break;

        default:
        // no default behavior required
    }
    
    return filterParams;
}

SailPoint.Identity.History.filter = function() {
    var store = SailPoint.Identity.History.grid.getStore();
    Ext.apply(store.getProxy().extraParams, SailPoint.Identity.History.getFilterParams());
    store.load({
        start : 0,
        limit : 25
    });
}

/**
 * Reset the filter form
 */
SailPoint.Identity.History.reset = function() {
    var i;
    var fields = [ 'identityHistoryActor', 'identityHistoryApplication', 'identityHistoryAccount', 'identityHistoryAttribute', 'identityHistoryValue',
            'identityHistoryRole', 'identityHistoryPolicy', 'identityHistoryConstraint', 'identityHistoryStartDate', 'identityHistoryEndDate',
            'identityHistoryStartDate', 'identityHistoryEndDate' ];

    for ( i = 0; i < fields.length; i++) {
        Ext.getCmp(fields[i]).reset();
    }

    // this is what you have to resort to when you can't use Radio-
    // and CheckboxGroups because the stupid things won't properly
    // render the labels next to the buttons
    for ( i = 0; i < 4; i++) {
        Ext.getCmp('identityHistoryType' + i).reset();
    }

    for ( i = 0; i < 5; i++) {
        Ext.getCmp('identityHistoryDecision' + i).reset();
    }

    // reset the base params so we get a full grid load
    SailPoint.Identity.History.grid.getStore().getProxy().extraParams = {};
    SailPoint.Identity.History.grid.getStore().load({
        start : 0,
        limit : 25
    });
}

/**
 * Sets up the grid's header menu to display the "Show icons" option for the
 * decision and type columns
 */
SailPoint.Identity.History.initIconToggle = function() {
	// TODO extjs4: figure out how to add SailPoint.Identity.History.iconToggle to the header
    
   // var hmenu = this.grid.getView().hmenu;

    //SailPoint.Identity.History.separator = hmenu.addSeparator();
    //SailPoint.Identity.History.separator.hide();

//    SailPoint.Identity.History.iconToggle = Ext.create('Ext.menu.CheckItem', {
//        text : '#{msgs.identity_history_grid_show_icons}',
//        listeners : {
//            checkchange : {
//                fn : SailPoint.Identity.History.onIconPrefChange
//            }
//        }
//    });

//    var header = this.grid.getDockedItems('headercontainer[dock="top"]')[0];
//    header.add([{ xtype: 'menuseparator' }, SailPoint.Identity.History.iconToggle]);
    
    //hmenu.addItem(SailPoint.Identity.History.iconToggle);
    //SailPoint.Identity.History.iconToggle.hide();

    //header.on('beforeshow', SailPoint.Identity.History.onMenu, header);
}

/**
 * Determines whether or not to display the "Show Icons" menu item based on
 * which column is active
 */
SailPoint.Identity.History.onMenu = function(hmenu) {
	// TODO extjs4: fix all this.
    switch (SailPoint.Identity.History.grid.getView().hdCtxIndex) {
    case 0:
        SailPoint.Identity.History.iconToggle.setChecked(SailPoint.Identity.History.showStatusIcons, true);

        //SailPoint.Identity.History.separator.show();
        SailPoint.Identity.History.iconToggle.show();

        break;
    case 1:
        SailPoint.Identity.History.iconToggle.setChecked(SailPoint.Identity.History.showTypeIcons, true);

        //SailPoint.Identity.History.separator.show();
        SailPoint.Identity.History.iconToggle.show();

        break;
    default:
        //SailPoint.Identity.History.separator.hide();
        SailPoint.Identity.History.iconToggle.hide();
    }
}

/**
 * Toggles the active column between icons or text, based on the checked state.
 */
SailPoint.Identity.History.onIconPrefChange = function(item, checked) {
    var params;
    switch (SailPoint.Identity.History.grid.getView().hdCtxIndex) {
    case 0:
        params = {
            name : SailPoint.Identity.History.grid.stateId,
            attribute : 'showStatusIcons:' + checked
        };
        SailPoint.Identity.History.showStatusIcons = checked;
        SailPoint.Identity.History.filter();

        break;
    case 1:
        params = {
            name : SailPoint.Identity.History.grid.stateId,
            attribute : 'showTypeIcons:' + checked
        };
        SailPoint.Identity.History.showTypeIcons = checked;
        SailPoint.Identity.History.filter();

        break;
    default:
        // do nothing - should never get here
    }

    // save the state of the check change
    new Ajax.Request(CONTEXT_PATH + '/state.json', {
        method : 'post',
        parameters : params,
        onSuccess : function(transport) {
        },
        onFailure : function() {
        }
    });
}

/**
 * Displays either the status icon or the string name of the status, depending
 * on the current value of the showStatusIcons variable.
 */
SailPoint.Identity.History.renderStatus = function(value, p, r) {
    if (!SailPoint.Identity.History.showStatusIcons)
        return value;

    var src;
    switch (r.get('statusIcon').toLowerCase()) {
    case 'approved':
        src = SailPoint.getRelativeUrl('/images/icons/approve.gif');
        break;
    case 'cleared':
        src = SailPoint.getRelativeUrl('/images/icons/undo.png');
        break;
    case 'comments':
        src = SailPoint.getRelativeUrl('/images/icons/comments.png');
        break;
    case 'delegated':
        src = SailPoint.getRelativeUrl('/images/icons/delegate.gif');
        break;
    case 'mitigated':
        src = SailPoint.getRelativeUrl('/images/icons/mitigate.gif');
        break;
    case 'remediated':
        src = SailPoint.getRelativeUrl('/images/icons/revoke.gif');
        break;
    case 'revokeaccount':
        src = SailPoint.getRelativeUrl('/images/icons/revokeAccount.gif');
        break;
    default:
        src = null;
    }

    if (src == null)
        return value;
    else
        return Ext.String.format('<img src="{0}" alt="{1}"/>', src, value);
}

/**
 * Displays either the type icon or the string name of the type, depending on
 * the current value of the showTypeIcons variable.
 */
SailPoint.Identity.History.renderType = function(value, p, r) {
    if (!SailPoint.Identity.History.showTypeIcons)
        return value;

    var styleClass;
    switch (r.get('typeIcon').toLowerCase()) {
    case 'business':
        styleClass = "historyItemBusinessRole";
        break;
    case 'exception':
        styleClass = "historyItemException";
        break;
    case 'account':
        styleClass = "historyItemAccount";
        break;
    case 'it':
        styleClass = "historyItemITRole";
        break;
    case 'organizational':
        styleClass = "historyItemOrgRole";
        break;
    case 'policyviolation':
        styleClass = "historyItemPolicyViolation";
        break;
    case 'dataowner':
        styleClass = "historyEntitlement";
        break;
    case 'accountgroupmembership':
        styleClass = "historyGroup";
        break;
    case '':
        //If role was deleted, we wont have a style class but we dont want to show
        //text either. 
        styleClass = "";
        break;
    default:
        styleClass = null;
    }

    if (styleClass == null)
        return value;
    else
        return Ext.String.format('<div class="{0}" alt="{1}"/>', styleClass, value);
}

/**
 * Looks up the history item for the given row and passes the resulting data to
 * the method responsible for displaying it.
 */
SailPoint.Identity.History.clickRow = function(gridView, record, HTMLitem, index, e, eOpts){
    Ext.Ajax.request({
        // MUST use get method for rest resources
        method : 'GET',
        url : SailPoint.getRelativeUrl('/rest/identities/' + SailPoint.Utils.encodeRestUriComponent(SailPoint.Identity.History.identityId) + '/history/item'),
        params : {
            id : record.getId()
        },
        success : function(response) {
            results = Ext.decode(response.responseText);
            SailPoint.Identity.History.viewItem(results);
        },
        failure : function() {
            alert('Getting history item failed: ' + record.getId());
        },
        scope : this
    });
}

/**
 * Display the given item's contents in a window.
 */
SailPoint.Identity.History.viewItem = function(item) {
    // build the items array while we have programmatic control
    var data = [ {
        baseCls : 'titleColumnFixedWidth',
        html : '#{msgs.identity_history_grid_hdr_status}'
    }, {
        html : item.status
    }, {
        baseCls : 'titleColumnFixedWidth',
        html : '#{msgs.identity_history_grid_hdr_cert_type}'
    }, {
        html : item.certificationType
    }, {
        baseCls : 'titleColumnFixedWidth',
        html : '#{msgs.identity_history_grid_hdr_description}'
    }, {
        html : item.description
    }, {
        baseCls : 'titleColumnFixedWidth',
        html : '#{msgs.identity_history_grid_hdr_actor}'
    }, {
        html : item.actor
    }, {
        baseCls : 'titleColumnFixedWidth',
        html : '#{msgs.identity_history_grid_hdr_entry_date}'
    }, {
        html : item.entryDate
    } ];

    // we can't run a switch block on the cert type b/c the value has been
    // localized
    if (item.application) {
        data.push({
            baseCls : 'titleColumnFixedWidth',
            html : '#{msgs.identity_history_application}'
        });
        data.push({
            html : item.application
        });

        if (item.instance) {
            data.push({
                baseCls : 'titleColumnFixedWidth',
                html : '#{msgs.identity_history_instance}'
            });
            data.push({
                html : item.instance
            });
        }

        data.push({
            baseCls : 'titleColumnFixedWidth',
            html : '#{msgs.identity_history_account}'
        });
        data.push({
            html : item.account
        });
        if (item.attribute != null || item.value != null) {
            data.push({
                baseCls : 'titleColumnFixedWidth',
                html : '#{msgs.identity_history_attribute}'
            });
            data.push({
                html : item.attribute
            });
            data.push({
                baseCls : 'titleColumnFixedWidth',
                html : '#{msgs.identity_history_value}'
            });
            data.push({
                html : item.value
            });
        }
    }

    if (item.policy) {
        data.push({
            baseCls : 'titleColumnFixedWidth',
            html : '#{msgs.identity_history_policy}'
        });
        data.push({
            html : item.policy
        });
        data.push({
            baseCls : 'titleColumnFixedWidth',
            html : '#{msgs.identity_history_constraint}'
        });
        data.push({
            html : item.constraintName
        });
    }

    if (item.role) {
        data.push({
            baseCls : 'titleColumnFixedWidth',
            html : '#{msgs.identity_history_role}'
        });
        data.push({
            html : item.role
        });
    }

    data.push({
        baseCls : 'titleColumnFixedWidth',
        html : '#{msgs.identity_history_grid_hdr_comments}'
    });
    data.push({
        html : Ext.util.Format.htmlEncode(item.comments)
    });

    var viewWindow = new Ext.Window({
        closable : false,
        modal : true,
        shim : true,
        bodyStyle : 'background-color: white',
        layout : {
            type : 'table',
            columns : 2
        },
        items : data,
        defaults : {
            border : false,
            bodyStyle : {
                'padding' : '10px'
            }
        },
        bbar : [ new Ext.Button({
            id : 'cancel',
            text : '#{msgs.button_close}',
            cls : 'secondaryBtn',
            handler : function() {
                viewWindow.close();
            }
        }) ]
    });

    viewWindow.show();
}
