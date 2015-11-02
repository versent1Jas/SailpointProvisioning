/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */
/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.IdentityItemsGrid', "SailPoint.certification");


Ext.define('SailPoint.certification.WorksheetGrid', {
	extend : 'SailPoint.certification.BaseCertificationGrid',

    constructor : function(config) {
    	this.callParent(arguments);
    },

    initComponent : function() {
        try{
            this.addListener('itemcontextmenu', this.showContextMenu);
        } 
        catch(err){
            SailPoint.FATAL_ERR_JAVASCRIPT(err, "Error initializing worksheet grid component.");
        }

        this.callParent(arguments);

        this.on({
            columnhide: function (headerContainer, column) {
                column.tdCls = "noWrap";
                this.getView().refresh();
            },
            columnshow: function (headerContainer, column) {
                column.tdCls = "";
                this.getView().refresh();
            },
            scope: this
        });
    },

    mask : function() {
        var gridBody = this.getEl();
        if (gridBody)
            gridBody.mask(Ext.LoadMask.prototype.msg, 'x-mask-loading');
    },

    unmask : function() {
        var gridBody = this.getEl();
        if (gridBody)
            gridBody.unmask();
    },

    viewEntity : function(item, e){
        this.grid.fireEvent('entitySelected', this.record);
    },

    showContextMenu : function(gridView, record, HTMLitem, index, e, eOpts){
        var contextMenu = new Ext.menu.Menu();
        var grid = gridView.findParentByType('grid');
        contextMenu.add(
            new Ext.menu.Item({text: '#{msgs.view_details}', handler: this.viewEntity, scope:{grid:grid, record:record}, iconCls: 'viewDetailsBtn'}),
            new Ext.menu.Item({text: '#{msgs.menu_view_history}', handler:  SailPoint.certification.WorksheetGrid.showHistory, iconCls: 'viewHistoryBtn', scope:record})
        );

        // Allow challenge, delegation review if not signed and required.
    //    if (!this.buttonsDisabled) {
            var challenged = record.get("IIQ_challenged");
            var reviewRequired = record.get("IIQ_reviewRequired");

            contextMenu.add(new Ext.menu.Separator());

            if (true === challenged){
                var item = new Ext.menu.Item({text: '#{msgs.menu_handle_chalenge}', handler: SailPoint.certification.WorksheetGrid.handleChallenge, iconCls: 'handleChallengeBtn', scope:record});
                contextMenu.add(item);
            }
            if (true === reviewRequired)
                contextMenu.add(
                    new Ext.menu.Item({text: '#{msgs.menu_review_delegation}', handler: SailPoint.certification.WorksheetGrid.handleDelegationReview , iconCls: 'searchBtn', scope:record})
                );

            var addCommentItem = new Ext.menu.Item({text: '#{msgs.menu_add_comment}', handler: SailPoint.certification.WorksheetGrid.addComment, iconCls: 'addCommentBtn', scope:record});
            addCommentItem.setDisabled(!this.editable);
            
            contextMenu.add(addCommentItem);
     //   }
        
        e.stopEvent();
        contextMenu.showAt(e.xy);
    }

});


/**********************************************
 Actions
 *********************************************/



SailPoint.certification.WorksheetGrid.handleChallenge = function() {
    SailPoint.Decider.getInstance().challenge(this.getId());
};

SailPoint.certification.WorksheetGrid.showHistory = function() {
    SailPoint.IdentityHistoryPanel.toggleDialog(this.getId(), this.get('parent-identity'));
};


SailPoint.certification.WorksheetGrid.addComment = function(item, e) {
    var certItemId = this.getId();
    SailPoint.Manage.Certification.addEntitlementComment(certItemId, Ext.emptyFn());
};


SailPoint.certification.WorksheetGrid.handleDelegationReview = function(item, e) {
    SailPoint.Decider.getInstance().delegationReview(this.getId());
};



/**********************************************
 Renderers
 *********************************************/
SailPoint.certification.WorksheetGrid.renderCommentStatus = function(value, p, r) {
    var hasComment = r.get('IIQ_hasComment');
    if (hasComment == true) {
        return Ext.String.format('<span class=\'commentBox font10\' >{0}</span>', value);
    }
    else return value;
};

SailPoint.certification.WorksheetGrid.renderChanges = function(value, p, r) {
    return Ext.String.format('<span class="newEntitlementTxt">{0}</span>', value);
};

SailPoint.certification.WorksheetGrid.renderButtons = function(value, metadata, record, rowIdx, colIdx, store) {

    var returnString = "";

    try{
        var id = record.getId();

        // get the grid ID from the store. This has been set during
        // BaseCertificationGrid.initComponent. Since the renderer
        // doesn't know anything about it's parent grid, we have
        // to perform this hack. Perhaps we should be using a
        // plugin instead of a renderer?
        var grid = Ext.getCmp(store.parentGridId);

        var buttonGroup = null;
        var buttonsGrpId = SailPoint.DecisionButtonGroup.CMP_ID_PREFIX + rowIdx;
        buttonGroup = Ext.getCmp(buttonsGrpId);
        if (!buttonGroup){
            buttonGroup = new SailPoint.DecisionButtonGroup({
                id:buttonsGrpId,
                record:record,
                buttonsDisabled:grid.buttonsDisabled,
                gridId:grid.getId(),
                rowIdx:rowIdx
            });
            grid.addButtonGroup(buttonGroup, rowIdx);
        }

        buttonGroup.init(record);

        returnString = buttonGroup.generateHtml(false, SailPoint.Decider.getInstance().certificationConfig);
    }
    catch(err){
        // don't display an error for every row
        if (!SailPoint.CERT_BUTTON_ERR){
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error rendering decision column.");
            SailPoint.CERT_BUTTON_ERR = true;
        }
    }

    return returnString;
};

SailPoint.certification.WorksheetGrid.renderApplication = function(value, p, r) {
    var description = r.get('IIQ_applicationDescription');
    if (description) {
        return SailPoint.component.NameWithTooltip.getTooltipHtml(value, description);
    }
    return value;
}

/**
 * This is used for Columns that we want to include in the data source but not render
 * the text. Specifically long descriptions that we use as tooltips but fetch as a column.
 * We cannot use fieldOnly attribute because these need to be included in CSV exports.
 */
SailPoint.certification.WorksheetGrid.emptyRenderer = function(value, p, r) {
    return '';
}

/**
 *  This is the renderer called by the identity items grid when generating
 *  the description column.
 */
SailPoint.certification.WorksheetGrid.renderDescription = function(value, p, r) {
    var typeClass = 'certificationItemDescription' + r.get('type');
    var roleIcon = r.get('roleIcon');
    var roleDescription = r.get('roleDescription');
    var style = '';
    if (roleIcon != '') {
        typeClass = roleIcon;
        style = "padding-left:16px;";
    }

    // If the row also has complex description in json format, use that instead of the plain
    // text description.

    var txt = '';
    if (r.get('violationId')) {
        txt = SailPoint.certification.WorksheetGrid.getPolicyViolationDescription(value, r);
    } else if (roleDescription) {
        txt = SailPoint.certification.WorksheetGrid.getRoleDescription(value, r, roleDescription);
    } else {
        txt = r.get('IIQ_descriptionJson') ? SailPoint.certification.WorksheetGrid.getDescriptionText(r.get('IIQ_descriptionJson'), true, r.id) : value;
    }

    return Ext.String.format('<div class="font10 {1}" style="{2}">{0}</div>', txt, typeClass, style);
};

SailPoint.certification.WorksheetGrid.getRoleDescription = function(value, row, description) {
    return SailPoint.component.NameWithTooltip.getTooltipHtml(value, description);
};

SailPoint.certification.WorksheetGrid.getPolicyViolationDescription = function(value, r) {
    var txt = value + '<span class="ignore-cell-click"><a title="#{msgs.click_violation_details}" onclick="SailPoint.certification.WorksheetGrid.showPolicyViolationDetails(\''
            + r.get("violationId") + '\', \'' + value + '\')"><img style="margin-left:2px" src="'
            + SailPoint.CONTEXT_PATH + '/images/icons/info.png" height="14px" width="14px"/></a></span>';
    return txt;
};

SailPoint.certification.WorksheetGrid.showPolicyViolationDetails = function(violationId, violation) {
    var details = Ext.create('Ext.window.Window', {
        closable : true,
        modal : true,
        loader: {
        	url:SailPoint.getRelativeUrl('/identity/policyDetailsWindowInclude.jsf?violationId=' + violationId),
            ajaxOptions: {
            	disableCaching:true
            },
            scripts:true,
            autoLoad: true
        },
        width : 600,
        height: 650,
        title : violation,
        bodyStyle : 'background-color: white; padding: 5px; overflow: auto'
    });

    details.show();
}



/**
 * Converts exception entitlement description json into html.
 * @param {string} value json text.
 * @param {boolean} showHtml True to display html elements - links, imgs, etc.
 */
SailPoint.certification.WorksheetGrid.getDescriptionText = function(value, showHtml, id) {
    try {
        var tpl = new Ext.XTemplate(
                '<tpl for="entitlements">',
                '<tpl exec="this.copyDescMode(parent, values, entName)"></tpl>',
                '<tpl exec="this.formatValues(values, entName)"></tpl>',
                '{entitlementString}',
                '<tpl if="xindex < xcount">',
                '; ',
                '</tpl>',
                '</tpl>',
        {
            copyDescMode: function(parent, values, entitlement) {
                values.showHtml = parent.showHtml;
                values.descriptionFirst = parent.descriptionFirst;
                entitlement.showHtml = parent.showHtml;
                entitlement.descriptionFirst = parent.descriptionFirst;
            }
        },
        {
            formatValues : function(vals, entitlement) {
                var valsTemplate = new Ext.XTemplate(
                        '<tpl for="entValues">',
                        '<tpl if="parent.showHtml && parent.descriptionFirst && description">',
                        '<div style="display:inline">',
                        '<span class="font10 entitlementDescriptions" id="description_' + id + '">',
                        '<span style="display:none">{description}</span>',
                        '<tpl if="popup">',
                        '<span class="ignore-cell-click">',
                        '<a onclick="viewAccountGroup(\'{[Ext.String.escape(values.popup.appName)]}\', \'{[Ext.String.escape(values.popup.attrName)]}\', \'{[Ext.String.escape(values.popup.value)]}\');">',                        '</tpl>',
                        '{description}',
                        '<tpl if="popup">',
                        '</a>',
                        '</span>',
                        '</tpl>',
                        '<img style="margin-left:2px" src="' + SailPoint.CONTEXT_PATH + '/images/icons/info.png" height="14px" width="14px"/>',
                        '</span>',
                        '<span class="font10 entitlementValues" id="name_' + id + '" style="display:none">',
                        '<span style="display:none">{value}</span>',
                        '<tpl if="popup">',
                        '<span class="ignore-cell-click">',
                        '<a onclick="viewAccountGroup(\'{[Ext.String.escape(values.popup.appName)]}\', \'{[Ext.String.escape(values.popup.attrName)]}\', \'{[Ext.String.escape(values.popup.value)]}\');">',                        '</tpl>',
                        '{value}',
                        '<tpl if="popup">',
                        '</a>',
                        '</span>',
                        '</tpl>',
                        '<img style="margin: 0 2px 0 2px" src="' + SailPoint.CONTEXT_PATH + '/images/icons/info.png" height="14px" width="14px"/>',
                        '</span>',
                        '</div>',
                        '</tpl>',
                        '<tpl if="parent.showHtml && !parent.descriptionFirst && description">',
                        '<div style="display:inline">',
                        '<span class="font10 entitlementValues" id="name_' + id + '">',
                        '<span style="display:none">{value}</span>',
                        '<tpl if="popup">',
                        '<span class="ignore-cell-click">',
                        '<a onclick="viewAccountGroup(\'{[Ext.String.escape(values.popup.appName)]}\', \'{[Ext.String.escape(values.popup.attrName)]}\', \'{[Ext.String.escape(values.popup.value)]}\');">',                        '</tpl>',
                        '{value}',
                        '<tpl if="popup">',
                        '</a>',
                        '</span>',
                        '</tpl>',
                        '<img style="margin-left:2px" src="' + SailPoint.CONTEXT_PATH + '/images/icons/info.png" height="14px" width="14px"/>',
                        '</span>',
                        '<span class="font10 entitlementDescriptions" id="description_' + id + '" style="display:none">',
                        '<span style="display:none">{description}</span>',
                        '<tpl if="popup">',
                        '<span class="ignore-cell-click">',
                        '<a onclick="viewAccountGroup(\'{[Ext.String.escape(values.popup.appName)]}\', \'{[Ext.String.escape(values.popup.attrName)]}\', \'{[Ext.String.escape(values.popup.value)]}\');">',
                        '</tpl>',
                        '{description}',
                        '<tpl if="popup">',
                        '</a>',
                        '</span>',
                        '</tpl>',
                        '<img style="margin: 0 2px 0 2px" src="' + SailPoint.CONTEXT_PATH + '/images/icons/info.png" height="14px" width="14px"/>',
                        '</span>',
                        '</div>',
                        '</tpl>',
                        '<tpl if="parent.showHtml && !parent.descriptionFirst && !description">',
                        '<div class="ignore-cell-click" style="display:inline">',
                        '<tpl if="popup">',
                        '<a onclick="viewAccountGroup(\'{[Ext.String.escape(values.popup.appName)]}\', \'{[Ext.String.escape(values.popup.attrName)]}\', \'{[Ext.String.escape(values.popup.value)]}\');">',
                        '</tpl>',
                        '{value}',
                        '<tpl if="popup">',
                        '</a>',
                        '</tpl>',
                        '</div>',
                        '</tpl>',
                        '<tpl if="parent.showHtml && parent.descriptionFirst && !description">',
                        '<div class="ignore-cell-click" style="display:inline">',
                        '<tpl if="popup">',
                        '<a onclick="viewAccountGroup(\'{[Ext.String.escape(values.popup.appName)]}\', \'{[Ext.String.escape(values.popup.attrName)]}\', \'{[Ext.String.escape(values.popup.value)]}\');">',
                        '</tpl>',
                        '{value}',
                        '<tpl if="popup">',
                        '</a>',
                        '</tpl>',
                        '</div>',
                        '</tpl>',
                        '<tpl if="!parent.showHtml && parent.descriptionFirst && description">{description}</tpl>',
                        '<tpl if="!parent.showHtml && !parent.descriptionFirst && description">{value}</tpl>',
                        '<tpl if="xindex < xcount">, </tpl>',
                        '</tpl>'
                        );
                var valuesList = valsTemplate.apply(vals);

                var valueTemplate = null;
                var valCount = vals.entValues ? vals.entValues.length : 0;
                if (vals.type == 'permissions' && valCount < 2) {
                    valueTemplate = '#{msgs.cert_item_tbl_col_description_perm}';
                } else if (vals.type == 'permissions') {
                    valueTemplate = '#{msgs.cert_item_tbl_col_description_perms}';
                } else if (vals.type == 'attributes' && valCount < 2) {
                    valueTemplate = '#{msgs.cert_item_tbl_col_description_attr}';
                } else {
                    valueTemplate = '#{msgs.cert_item_tbl_col_description_attrs}';
                }

                // replace all spaces with &nbsp; since IE6 and IE7 may ignore spaces
                valueTemplate = valueTemplate.replace(/\s/g, '&nbsp;');

                if (entitlement.description) {
                    var entTemplate = new Ext.XTemplate(
                            '<tpl if="showHtml && descriptionFirst && description">',
                            '<div style="display:inline"><span class="font10 entitlementDescriptions" id="description_' + id + '"><span>{description}</span><img style="margin-left:2px" src="' + SailPoint.CONTEXT_PATH + '/images/icons/info.png" height="14px" width="14px"/></span>',
                            '<span class="font10 entitlementValues" style="display:none" id="name_' + id + '"><span>{name}</span><img style="margin: 0 2px 0 2px" src="' + SailPoint.CONTEXT_PATH + '/images/icons/info.png" height="14px" width="14px"/></span></div>',
                            '</tpl>',
                            '<tpl if="showHtml && !descriptionFirst && description">',
                            '<div style="display:inline"><span class="font10 entitlementValues" id="name_' + id + '"><span>{name}</span><img style="margin-left:2px" src="' + SailPoint.CONTEXT_PATH + '/images/icons/info.png" height="14px" width="14px"/></span>',
                            '<span class="font10 entitlementDescriptions" style="display:none" id="description_' + id + '"><span>{description}</span><img style="margin: 0 2px 0 2px" src="' + SailPoint.CONTEXT_PATH + '/images/icons/info.png" height="14px" width="14px"/></span></div>',
                            '</tpl>',
                            '<tpl if="!showHtml && descriptionFirst && description">{description}</tpl>',
                            '<tpl if="!showHtml && !descriptionFirst && description">{name}</tpl>'
                            );
                    var entDescription = entTemplate.apply(entitlement);
                    vals.entitlementString = Ext.String.format(valueTemplate, valuesList, entDescription);
                } else {
                    vals.entitlementString = Ext.String.format(valueTemplate, valuesList, entitlement.name);
                }

            }
        }
                );

        var desc = Ext.decode(value);
        if (desc.description)
            return desc.description;

        if (desc.entitlements) {
            desc.showHtml = showHtml;
            return tpl.apply(desc);
        }
    } catch(err) {
        SailPoint.EXCEPTION_ALERT(err.message);
    }

    return '';
};


/**********************************************
 Helpers
 *********************************************/

/**
 * Return whether the identity items grid has any unsaved changes.
 */
SailPoint.IdentityItemsGrid.hasUnsavedChanges = function() {
    var elt = Ext.get('certificationItemChangedDiv');
    return (elt && elt.isVisible());
};

/**
 * When clicking into the detail view we want to prompt to save changes if there
 * are any unsaved changes.  If so, popup a dialog ... if not just return false.
 */
SailPoint.IdentityItemsGrid.handleUnsavedChangesBeforeDetails = function() {
    if (SailPoint.IdentityItemsGrid.hasUnsavedChanges()) {
        Ext.MessageBox.show({
            title: '#{msgs.save_cert_items_dialog_title}',
            msg: '#{msgs.save_cert_items_dialog_text}',
            buttons: Ext.MessageBox.YESNOCANCEL,
            fn: function(btn) {
                if (btn === 'yes') {
                    SailPoint.IdentityItemsGrid.gotoDetailsAfterSave = true;
                    SailPoint.IdentityItemsGrid.saveItemDecisions();
                }
                else if (btn === 'no') {
                    // Force going to the details page without saving.
                    certifyUserAccess(null, null, true);
                }
                else if (btn === 'cancel') {
                    // nothing ... this just closes the window.
                }
            },
            icon: Ext.MessageBox.QUESTION
        });

        return true;
    }
    return false;
};


/**
 * Changes the way entitlements are displayed on the grid, either
 * switching to display entitlement description or entitlement value
 * by displaying or hiding entitlement spans. Adds param to the store
 * so this decision is carried over as the grid is updated.
 */
function switchEntitlementDescMode(showDescriptions) {
    var store = Ext.StoreMgr.lookup('worksheetStore');
    store.getProxy().extraParams['showEntDesc'] = showDescriptions;
    switchEntitlementDescriptionStyle(showDescriptions);
}
