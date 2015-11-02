/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', "SailPoint.certification");


////////////////////////////////////////////////////////////////////////////////
//
// RadioProxy will route commands correctly to the VirtualRadio (if defined) or
// the ImageRadio directly if there is no virtual radio.
//
////////////////////////////////////////////////////////////////////////////////

// todo jfb copied this from certification.js. need to find a good home

var RadioProxy = {

    setRadioValue: function(radio, value) {
        if (('undefined' != typeof vRadio) && (null != vRadio)) {
            vRadio.radioValueSet(radio, value);
        }
        else {
            ImageRadio.setRadioValue(radio, value);
        }
    }
}


Ext.define('SailPoint.certification.BaseCertificationGrid', {
    extend : 'SailPoint.grid.PagingCheckboxGrid',
    alias : 'widget.basecertgrid',

    certificationId : null,
    editable : true,
    stateId : null,
    pageSize : 25,
    buttonsDisabled : false,
    allowToolTips : false,

    buttonGroups:[],

    constructor : function(config) {

        /** If the cert is editable, use a checkbox model instead of a row selection model **/
        var sm = new Ext.selection.RowModel();
        if (config.editable) {
            sm = new SailPoint.grid.CheckboxSelectionModel({selectMessageBox: $('selectedCount')});
        }

        // Add a special style to the decision column. This will indicate that
        // clicking on the cell should not generate a row selection event.
        if (config.gridMetaData){
            config.gridMetaData.columns.each(function(column){
                if (column.dataIndex == 'decision'){
                    column.tdCls = "ignore-cell-click";
                }
            });
        }

        var clsValue = 'smallFontGrid selectableGrid middle-align-grid wrappingGridCellsOW';
        Ext.applyIf(config, {
            selModel : sm,
            usePageSizePlugin : true,
            cls : clsValue,
            stateful : true,
            loadMask : true,
            hideCheckboxes : !config.editable,
            viewConfig : {
                scrollOffset : 1,
                stripeRows : true
            }
        });

        this.callParent(arguments);
    },

    initComponent : function() {
    	var me = this;
    	
        this.addEvents(
            'entitySelected'
        );

        if (this.hasView) {
            var view = this.getView();
            view.getRowClass = function(record, index) {
                var isNew = record.data && record.data.IIQ_exceptionEntitlements && record.data.IIQ_exceptionEntitlements.isNew;

                if (isNew) {
                    return "newEntitlementRow";
                }

                return "";
            };
        }

        this.viewConfig.emptyText = "#{msgs.cert_grid_no_items_found}";

        this.callParent(arguments);

        try{
            this.addListener('itemclick', function(gridView, record, HTMLitem, rowIndex, e, eOpts) {
                if (this.isCheckboxClick(e)) {
                    return;
                }

                // check for a special cell style to determine if the event should propagate
                if (Ext.fly(e.target) && Ext.fly(e.target).findParent('.ignore-cell-click')){
                    return;
                }

                if (this.gridState)
                    this.gridState.encodeGridState('editForm:');
                
                try {
                  this.fireEvent('entitySelected', record);
                } catch(e) {}
            });
        } 
        catch(err){
            SailPoint.FATAL_ERR_JAVASCRIPT(err, "Error initializing worksheet grid component.");
        }
        
        this.getView().on('refresh', this.gridUpdated, this);

        // Stash the grid id so we can access it when rendering
        // the decision columns. Ext doesn't provide the ability
        // to reference the grid in a renderer
        this.getStore().parentGridId = this.id;
    },

    gridUpdated : function() {
        try{

            SailPoint.Decider.getInstance().loadSecondPass();

            if (SailPoint.VirtualRadioButton.getInstance())
                SailPoint.VirtualRadioButton.getInstance().updateRadios();

            this.updateButtonGroups();

            SailPoint.component.NameWithTooltip.registerTooltips();

            if (this.allowToolTips)
                SailPoint.certification.BaseCertificationGrid.addCertificationIconTooltips();

            /** Add tooltips for entitlements **/
            addDescriptionTooltips();

            Ext.resumeLayouts(true);
        }
        catch(err) {
        	SailPoint.EXCEPTION_ALERT("Error updating BaseCertificationGrid: " + err);
        }
    },

    addButtonGroup : function(grp, row){
        this.buttonGroups[row] = grp;
    },

    updateButtonGroups : function(){
        if (this.buttonGroups){
            this.buttonGroups.each(function(group){
                group.updateRowState();
            });
        }
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
    }
});


/**
 * Add tooltips to the certification decision icons.
 */
SailPoint.certification.BaseCertificationGrid.addCertificationIconTooltips = function() {

    // Initialize the QuickTips.  Set them up for a decent delay before showing
    // since tooltips that come up too quickly could be annoying.
    Ext.QuickTips.init();
    Ext.apply(Ext.QuickTips.getQuickTip(),
              {
                  showDelay: 1000,
                  trackMouse: true
              });

    // Grab all image radios and initialize the tooltip text based on the
    // class on the div.
    var radios = Ext.DomQuery.select('div.imageRadio');
    if (null != radios) {
        for (var i=0; i<radios.length; i++) {
            var current = Ext.Element.get(radios[i]);
            var tip = null;

            if (current.hasCls('ApprovedRadio')) {
                tip = "#{msgs.cert_approve_icon_tooltip}";
            }
            else if (current.hasCls('RemediatedRadio')) {
                tip = "#{msgs.cert_revoke_icon_tooltip}";
            }
            else if (current.hasCls('RevokeAccountRadio')) {
                tip = "#{msgs.cert_revoke_account_icon_tooltip}";
            }
            else if (current.hasCls('MitigatedRadio')) {
                tip = "#{msgs.cert_mitigate_icon_tooltip}";
            }
            else if (current.hasCls('DelegatedRadio')) {
                tip = "#{msgs.cert_delegate_icon_tooltip}";
            } 
            else if (current.hasCls('ApproveAccountRadio')) {
                tip = "#{msgs.cert_approve_account_icon_tooltip}";
            }    
            else if (current.hasCls('AccountReassignRadio')) {
                tip = "#{msgs.cert_account_reassign_icon_tooltip}";
            }
            
            else {
                alert('BaseCertificationGrid.addCertificationIconTooltips() - Unknown icon type: ' + current.dom.className);
            }

            if (null != tip) {
                Ext.QuickTips.register({
                   target: current,
                   text: tip
                });
            }
        }
    }
};


SailPoint.certification.BaseCertificationGrid.renderButtons = function(value, metadata, record, rowIdx, colIdx, store) {
    var html = "";
    try{
        var id = record.getId();

        // get the grid ID from the store. This has been set during
        // BaseCertificationGrid.initComponent. Since the renderer
        // doesn't know anything about it's parent grid, we have
        // to perform this hack. Perhaps we should be using a
        // plugin instead of a renderer?
        var grid = Ext.getCmp(store.parentGridId);

        var buttonGroup = null;
        var buttonsGrpId = grid.getId() + "_" + SailPoint.DecisionButtonGroup.CMP_ID_PREFIX + rowIdx;
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

        grid.addButtonGroup(buttonGroup, rowIdx);

        html = buttonGroup.generateHtml(true, SailPoint.Decider.getInstance().certificationConfig, value.currentState);

        var decider = SailPoint.Decider.getInstance();

        // Check for the decision history column. If found we need
        // to render a bunch of extra stuff
        var history = record.get('IIQ_decisionHistory');
        if (history){

            if (history.hasComments){
                html += "<a style='vertical-align: top;cursor:pointer' class='disclosure history comments'></a>";
            }

            var challengeOwner = (history.challengeOwner && history.challengeOwner.displayName)? history.challengeOwner.displayName : null;
            if (!challengeOwner && history.challengeOwner)
                challengeOwner = history.challengeOwner.name;

            if (history.showDelegationReview){
                html += '<div id="delegationReview_'+record.getId()+'" class="decisionHistoryNote delegationReview">';
                var func = "SailPoint.Decider.getInstance().delegationReview('"+record.getId()+"')";
                html += '<a id="reviewLink_'+record.getId()+'" onclick="'+func+'" >#{msgs.link_click}</a>&nbsp;' + '#{msgs.text_review_del_decision}';
                if (history.delegationId){
                    html += '&nbsp;[<a class="disclosure delegationComments" title="#{msgs.cert_item_link_title_view_comments}">#{msgs.cert_item_link_view_comments}</a>]';
                }
                html += "</div>";
            }

            if (history.showDelegationComments){
               var ownerName = history.delegationOwner;
               html += '<div style="clear:both"><a class="disclosure delegationComments" title="#{msgs.cert_item_link_title_view_comments}">#{msgs.link_click}</a> #{msgs.text_view_comments} <span>'+ownerName+'</span></div>';
            }

            if (history.showChallengeExpiration){
                html += '<div class="decisionHistoryNote challengeExpired" title="#{msgs.cert_item_img_title_item_challenge_decision_expired}">';
                html += Ext.String.format("#{msgs.text_challenge_expired}", challengeOwner);
                if (history.challengeCompletionComments){
                    html += '&nbsp;[<a class="disclosure challengeCompletionComments" title="#{msgs.cert_item_link_title_view_comments}">#{msgs.cert_item_link_view_comments}</a>]';
                }
                html += "</div>";

            }

            if (history.showChallenge){
                html += '<div class="decisionHistoryNote challenge" title="#{msgs.cert_item_link_title_decision_challenged}">';

                if (history.allowChallengeDecision){
                    var clickHandler = 'SailPoint.Decider.getInstance().challenge("'+record.getId()+'")';
                    html += "<a onclick='"+clickHandler+"'>#{msgs.link_click}</a>  " + Ext.String.format("#{msgs.text_accept_reject_challenge}", challengeOwner);
                } else {
                    html += Ext.String.format("#{msgs.text_dec_challenged_by}", challengeOwner);
                }

                if (history.challengeCompletionComments){
                    html += '&nbsp;[<a class="disclosure challengeCompletionComments" title="#{msgs.cert_item_link_title_view_comments}">#{msgs.cert_item_link_view_comments}</a>]';
                }

                if (history.challengeDecisionComments){
                    var msg = history.challengeDecision == 'Rejected' ? "#{msgs.cert_item_link_view_reject_comments}" : "#{msgs.cert_item_link_view_accept_comments}";
                    html += '&nbsp;[<a class="disclosure challengeDecisionComments" title="#{msgs.cert_item_link_title_view_comments}">'+msg+'</a>]';
                }

                html += "</div>";

            }

            if (history.showReturnedDelegation){
                html += '<div class="decisionHistoryNote returnedDelegation" title="#{msgs.cert_item_img_title_item_rejected}">';
                html += '#{msgs.text_del_rejected_item}';
                if (history.delegationId){
                    html += '&nbsp;[<a class="disclosure delegationComments" title="#{msgs.cert_item_link_title_view_comments}">#{msgs.cert_item_link_view_comments}</a>]';
                }
                html += "</div>";
            }

            if (history.showRemediationComments && history.remediationComments){
                html += '<div class="subscript" style="clear:both">';
                html += '<a class="disclosure remediationComments" title="#{msgs.cert_item_link_title_view_comments}">#{msgs.link_click}</a> #{msgs.text_view_remed_comments}';
                if (history.actionOwner){
                    var name = history.actionOwner.displayName ? history.actionOwner.displayName : history.actionOwner.name;
                    html += '&nbsp;<span>'+name+'</span>';
                }
                html += '</div>';
            }

            if (history.unremovedRemediation){
                html += '<div class="unremovedRemediation decisionHistoryNote">#{msgs.text_remed_not_removed}</div>';
            }

            if (history.unprovisionedAddRequest){
                html += '<div class="unprovisionedAddRequest decisionHistoryNote">#{msgs.text_added_not_provisioned}</div>';
            }

            if (history.currentMitigation){
                html += '<div class="currentMitigation decisionHistoryNote">#{msgs.text_current_mitigation} '+history.currentMitigation+'</div>';
            }

            if (history.expiredMitigation){
                html += '<div class="expiredMitigation decisionHistoryNote">#{msgs.text_expired_mitigation} '+history.expiredMitigation+'</div>';
            }
        }

        var relatedViolations = null;
        if (record.get('IIQ_roleDetails')){
            var roleDetails = record.get('IIQ_roleDetails');
            relatedViolations = roleDetails.relatedViolations;
        } else if (record.get("IIQ_exceptionEntitlements")){
            var entitlementDetails = record.get('IIQ_exceptionEntitlements');
            relatedViolations = entitlementDetails.relatedViolations;
        }

        if (relatedViolations && relatedViolations.length > 0){
            html += '<div class="decisionHistoryNote relatedViolations">';
            if (relatedViolations.length == 1){
                html += Ext.String.format('#{cert_grid_single_related_violation}', relatedViolations[0]);
            } else {
                html += Ext.String.format('#{cert_grid_multiple_related_violation}', relatedViolations[0],
                        relatedViolations.length - 1);
            }
            html += "</div>";
        }

    }
    catch(err){
        // don't display an error for every row
        if (!SailPoint.CERT_BUTTON_ERR){
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error rendering decision column.");
            SailPoint.CERT_BUTTON_ERR = true;
        }
    }

    return html;
};

SailPoint.certification.BaseCertificationGrid.renderRoleDetails = function(value, metadata, record, rowIdx, colIdx, store) {
    try{

        var roleName = value;
        var roleDetails = record.get('IIQ_roleDetails');

        var html = "<div style='padding-left:17px' class='"+roleDetails.roleIcon+"'>";
        // class disclosure role is what makes the expando work see CertificationItemExpander.js
        if (roleDetails.roleId)
            html += "<a class='disclosure role'>"+roleName + "</a>";
        else
            html += roleName;
        if (roleDetails.newEntitlement)
            html += "<span class='newEntitlementTxt'>#{msgs.cert_entity_detected_role_new}</span>";
        html += "</div>";
        if (roleDetails.missingRequiredRoles === true)
            html += "<div class='warnBox' style='margin-left:0px;margin-top:5px'>#{msgs.cert_entity_missing_req_roles}</div>";

    } catch(err){
        // dont popup a zillion alerts, just one
        if (!SailPoint.RoleDetailsErrorLaunched){
            SailPoint.RoleDetailsErrorLaunched = true;
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error rendering roles details column.");
        }
        return roleName; // default to role name on errror
    }
    return html;
};

SailPoint.certification.BaseCertificationGrid.renderRole = function(value, metadata, record, rowIdx, colIdx, store) {
    var html = "";
    try{
        html += "<a class='disclosure role'>"+ value +"</a>";
    } catch(err){
        // dont popup a zillion alerts, just one
        if (!SailPoint.RenderRoleErrorLaunched){
            SailPoint.RenderRoleErrorLaunched = true;
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error rendering role column.");
        }
        html = "ERROR";
    }
    return html;
};



SailPoint.certification.BaseCertificationGrid.renderAccount = function(value, metadata, record, rowIdx, colIdx, store) {
    var html = "";
    try{

        var accountUniqueId = value.application + "-" + value.nativeId + (value.instance ? value.instance : "");


        var lastAccountId = null;
        if (rowIdx > 0){
            var lastRecord = store.getAt(rowIdx - 1);
            var ents = lastRecord.get("IIQ_exceptionEntitlements");
            lastAccountId = ents.application + "-" + ents.nativeId + (ents.instance ? ents.instance : "");
        }

        var nextAccount = accountUniqueId != lastAccountId;
        if (nextAccount){
            var entitlementSnap = value;

            var account = entitlementSnap.nativeId;

            if (entitlementSnap.accountDisplayName)
                account = entitlementSnap.accountDisplayName;

            var iconsHtml = '<div style="float:right; margin-left: 10px;">';
            
            for(var i=0;i<entitlementSnap.accountIcons.length;i++){
                var icon = entitlementSnap.accountIcons[i];
                iconsHtml += "<img title='"+SailPoint.sanitizeHtml(icon.title)+"' src='"+ SailPoint.getRelativeUrl(icon.icon) +"' class='certificationAccountIcon'/>";
            }

            iconsHtml += "</div>";

            if (entitlementSnap.IIQ === true){
                html = account;
            } else {
                html += '<div style="width: 98%;">' + iconsHtml + '<a class="disclosure account">' + account + '</a></div>';
            }
        }

        // if we're on the last item for an account we want to add the dashed border
        // which indicates separation between accounts
        if (nextAccount && rowIdx != 0){
            var grid = Ext.getCmp(store.parentGridId);
            // the rows aren't created yet, so set up a callback which
            // will fire when the rows have been created. javascript is crazy...
            grid.getView().on('refresh', function(gridView){
                gridView.addRowCls(this.row, 'lastAdditionalEntitlement');
            }, {row:rowIdx-1}, {single:true});
        }

        SailPoint.certification.BaseCertificationGrid.lastAccount = accountUniqueId;

    } catch(err){
        if (!SailPoint.AccountErrorLaunched){
            SailPoint.AccountErrorLaunched = true;
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error rendering account column.");
        }
        return "ERROR";
    }
    return html;
};

SailPoint.certification.BaseCertificationGrid.renderApplication = function(value, metadata, record, rowIdx, colIdx, store) {
    var html = "";
    try{

        var entitlementSnap = record.get("IIQ_exceptionEntitlements");

        var accountUniqueId = entitlementSnap.application + "-" + entitlementSnap.nativeId +
                (entitlementSnap.instance ? entitlementSnap.instance : "");

        var lastAccountId = null;
        if (rowIdx > 0){
            var lastRecord = store.getAt(rowIdx - 1);
            var ents = lastRecord.get("IIQ_exceptionEntitlements");
            lastAccountId = ents.application + "-" + ents.nativeId + (ents.instance ? ents.instance : "");
        }

        // don't display the application unless we're starting a new account in the grid.
        var nextAccount = accountUniqueId != lastAccountId;
        if (nextAccount){
            if (entitlementSnap.IIQ === true){
                html = value;
            } else {
                html = "<a class='disclosure application'>" + value + "</a>";
            }
        }

        SailPoint.certification.BaseCertificationGrid.lastApplicationAccount = accountUniqueId;

    } catch(err){
        if (!SailPoint.AppErrorLaunched){
            SailPoint.AppErrorLaunched = true;
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error rendering application column.");
        }
        html = "ERROR";
    }
    return html;
};

SailPoint.certification.BaseCertificationGrid.renderAccountAttribute = function(value, metadata, record, rowIdx, colIdx, store) {
    var html = "";
    try{

        var entitlement = null;
        if (value.attributes && value.attributes.length > 0)
            entitlement = value.attributes[0];
        if (entitlement == null && value.permissions && value.permissions.length > 0)
            entitlement = value.permissions[0];

        if (entitlement){
            html = SailPoint.certification.BaseCertificationGrid.createEntitlementHtml(entitlement.name, entitlement.description, null, false)
        }

    } catch(err){
        if (!SailPoint.AccountAttrErrorLaunched){
            SailPoint.AccountAttrErrorLaunched = true;
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error rendering attribute column.");
        }
        return "ERROR";
    }
    return html;
};

/**
 * Renderer - renders the Entitlements column in the additional entitlements grid when granularity != Application
 */
SailPoint.certification.BaseCertificationGrid.renderEntitlement= function(value, metadata, record, rowIdx, colIdx, store) {
    var html = "";
    
    try {
        var entitlements = (value.permissions && value.permissions.length > 0) ? value.permissions : value.attributes;
        for(var i=0;i<entitlements.length;i++){
            var entitlement = entitlements[i];
            html += SailPoint.certification.BaseCertificationGrid.createEntitlementValuesString(entitlement,
                    value.application, value.isNew);
        }
    } catch(err){
        if (!SailPoint.EntitlementErrorLaunched){
            SailPoint.EntitlementErrorLaunched = true;
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error rendering entitlements column.");
        }
        return "ERROR";
    }
    return html;
};


/**
 * Renderer - renders the Entitlements column in the additional entitlements grid when granularity = Application
 */
SailPoint.certification.BaseCertificationGrid.renderAppGranularityEntitlement = function(value, metadata, record, rowIdx, colIdx, store) {
    var html = "";
    try{

        if (value.permissions && value.permissions.length > 0){
            for(var p=0;p<value.permissions.length;p++){
                var permission = value.permissions[p];
                html += "<div class='title'>on ";
                html += SailPoint.certification.BaseCertificationGrid.createEntitlementHtml(permission.name, permission.description, null, value.isNew);
                html += "</div>";
                html += "<div style='margin-left:15px'>";
                html += SailPoint.certification.BaseCertificationGrid.createEntitlementValuesString(permission, value.application, value.isNew);
                html += "</div>";
            }
        }

        if (value.attributes && value.attributes.length > 0){
            for(var a=0;a<value.attributes.length;a++){
                var attribute = value.attributes[a];
                html += "<div class='title'>Extra Value(s) on ";
                html += SailPoint.certification.BaseCertificationGrid.createEntitlementHtml(attribute.name, attribute.description, null, value.isNew);
                html += "</div>";
                html += "<div style='margin-left:15px'>";
                html += SailPoint.certification.BaseCertificationGrid.createEntitlementValuesString(attribute, value.application, value.isNew);
                html += "</div>";
            }
        }

    } catch(err){
        if (!SailPoint.AppGranularityEntitlementErrorLaunched){
            SailPoint.AppGranularityEntitlementErrorLaunched = true;
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error rendering application granulatiry entitlements column.");
        }
        return "ERROR";
    }
    return html;
};


SailPoint.certification.BaseCertificationGrid.renderIdentity = function(value, metadata, record, rowIdx, colIdx, store) {
    var html = "";
    try{
        if(value) {
          var identityId = value.id;
          var name = value.displayName ? value.displayName : value.name;

          html = "<a class='disclosure identity'>"+name+"</a>";
        } 

    } catch(err){
        if (!SailPoint.AccountErrorLaunched){
            SailPoint.AccountErrorLaunched = true;
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error rendering identity column.");
        }
        return "ERROR";
    }
    return html;
};

SailPoint.certification.BaseCertificationGrid.renderGenericAccount = function(value, metadata, record, rowIdx, colIdx, store) {
    var html = "";
    try{

        html = value ? value : record.get('exceptionEntitlements-nativeIdentity');
        html = "<a class='disclosure link'>"+value+"</a>";

    } catch(err){
        if (!SailPoint.AccountErrorLaunched){
            SailPoint.AccountErrorLaunched = true;
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error rendering generic account column.");
        }
        return "ERROR";
    }
    return html;
};


SailPoint.certification.BaseCertificationGrid.renderProfile = function(value, metadata, record, rowIdx, colIdx, store) {
    var html = "";
    try{
        html = value;
        html = "<a class='disclosure profile'>"+value+"</a>";
    } catch(err){
        if (!SailPoint.AccountErrorLaunched){
            SailPoint.AccountErrorLaunched = true;
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error rendering profile column.");
        }
        return "ERROR";
    }
    return html;
};



/**
 * This method is renderer helper which renders all the attribute or permisssion
 * values into a single comma-delimited list
 * @param entitlement The attribute or permission to render
 * @param application The application the entitlement is on
 */
SailPoint.certification.BaseCertificationGrid.createEntitlementValuesString = function(entitlement, application, isNew) {
    var html = "";
    for(var v=0;v<entitlement.values.length;v++){
        var entitlementValue = entitlement.values[v];
        var groupInfo = entitlement.group ? {app:application, attr:entitlement.name ,
            value:entitlementValue.value} : null;
        if (v>0)
            html += ", ";
        html += SailPoint.certification.BaseCertificationGrid.createEntitlementHtml(entitlementValue.displayValue,
                entitlementValue.description, groupInfo, isNew);

    }
    return html;
};


/**
 * This method is a renderer helper which takes an entitlement and
 * creates the html block containing the value, description, description
 * icon and potentially an account group link
 * @param value attribute name or permission target
 * @param description Entitlement description
 * @param groupInfo
 */
SailPoint.certification.BaseCertificationGrid.createEntitlementHtml = function(name, description, groupInfo, isNew) {

    // generate a uid so we can associate the description icon
    // to the description text. This is used to generate tooltips
    var generatedId = Ext.id();

    var descIcon = description ? SailPoint.getRelativeUrl("/images/icons/info.png") : null;
    var showDescriptions = Ext.isDefined(Page.showEntitlementDescriptions) ? Page.showEntitlementDescriptions :
        SailPoint.certificationConfig.showEntitlementDescriptions;
    
    var valsDisplayStyle = showDescriptions ? 'display:none' : '';
    html = "<span id='name_"+generatedId+"' class='entitlementValues' style='"+valsDisplayStyle+"'>";
    html += SailPoint.certification.BaseCertificationGrid.createEntitlementSpan(name, groupInfo);
    if (descIcon)
        html += "&nbsp;<img src='"+descIcon+"'/>";
    
    if (isNew) {
    	html += " <span class='newEntitlementTxt'>#{msgs.bracket_new}</span>";
    }
    
    html += "</span>";

    var descDisplayStyle = !showDescriptions ? 'display:none' : '';
    html += "<span id='description_"+generatedId+"' class='entitlementDescriptions' style='"+descDisplayStyle+"'>";
    html += SailPoint.certification.BaseCertificationGrid.createEntitlementSpan(description ? description : name, groupInfo);

    if (descIcon)
        html += "&nbsp;<img src='"+descIcon+"'/>";
    
    if (isNew) {
    	html += " <span class='newEntitlementTxt'>#{msgs.bracket_new}</span>";
    }
    
    html += "</span>";

    return html;
}

/**
 * Renderer helper which takes entitlement text, either the name or description, and
 * creates either a simple span, or a link which pops up the group dialog if groupInfo
 * is not null
 * @param text Text of the span
 * @param groupInfo If non-null and populated with the group details, this will
 * cause the text to be wrapped in a link which pops up the account group details dialog
 */
SailPoint.certification.BaseCertificationGrid.createEntitlementSpan = function(text, groupInfo){

    if (groupInfo){
        var onclick = "viewAccountGroup('"+Ext.String.escape(groupInfo.app)+"','"+Ext.String.escape(groupInfo.attr)+"','"
                +Ext.String.escape(groupInfo.value)+"')";
        return '<span class="unboldFakeLink" onclick="'+onclick+'">'+text+'</span>';
    }

    return "<span>"+ text +"</span>";
}


/**
 * Render the continuous state column in the certification grid.
 * This is used by both worksheet and identity view.
 */
SailPoint.certification.BaseCertificationGrid.renderCertContinuousStateColumn = function(value, metaData, record) {
    var state = record.get('IIQ_continuousStateName');
    var stripped = state.replace(/\s/g, "");
    return Ext.String.format('<div class="continuousState{1}">' +
            '<span class="font10 continuousState{1}Text">{0}</span></div>', value, stripped);
}

SailPoint.certification.BaseCertificationGrid.renderCertContinuousDateColumn = function(value, metaData, record) {
    var stateObj = record.get('IIQ_continuous');
    if (stateObj){
    var startName = stateObj.state;
    var date = SailPoint.Date.getDateStringFromMillis(stateObj.overdueDate, SailPoint.DateFormat);
    var stripped = startName.replace(/\s/g, "");
    return Ext.String.format('<div><span class="font10 continuousState{1}Text">{0}</span></div>', date, stripped);
    } else {
        return "";
}
}

SailPoint.ruleExpander = function(value, metaData, record) {
    if (value && value != ""){
        return "<a class='disclosure rule'>"+value+"</a>";
    }
    return "";
};

SailPoint.applicationExpander = function(value, metaData, record) {
    if (value && value != ""){
        return "<a class='disclosure application'>"+value+"</a>";
    }
    return "";
};



SailPoint.certification.BaseCertificationGrid.renderChanges = function(value, p, r) {
  return Ext.String.format('<span class="newEntitlementTxt">{0}</span>',value);
}

SailPoint.certification.BaseCertificationGrid.renderDescription = function (value, p, r) {
  if (value)
    return Ext.String.format('<div class="certificationItemDescription{1}">{0}</div>', value,r.get('type'));
  return "";
};

SailPoint.certification.BaseCertificationGrid.renderStatus = function(value, p, r) {
  if(value=='Complete') {
    return Ext.String.format('<span class=\'successBox font10\' >{0}</span>',value);
  }
  else if(r.get('actionRequired')=='true') {
    /** Add star if this item requires attention **/
    return Ext.String.format('<img src="'+CONTEXT_PATH + '/images/icons/icon_Star.png">{0}', value);
  }
  return Ext.String.format('{0}', value);
};

/**
 * Redirects user to the delegation work item for the selected
 * item. This is called from the CertificationItemMenu.
 * @param id Certification Item ID
 */
SailPoint.certification.viewWorkItem = function(id)
{
  try {
    $('editForm:selectedWorkItemId').value = id;
    $('editForm:viewWorkItemButton').click();
  } catch(e) {}
};

SailPoint.certification.BaseCertificationGrid.isFirstEntitlementInGroup = function(rowIdx, store){

    if (rowIdx==0)
        return true;

    var record = store.getAt(rowIdx);
    var entitlements = record.get("IIQ_exceptionEntitlements");
    var accountUniqueId = entitlements.application + "-" + entitlements.nativeId + (entitlements.instance ? entitlements.instance : "");

    var lastAccountId = null;
    var lastRecord = store.getAt(rowIdx - 1);
    var ents = lastRecord.get("IIQ_exceptionEntitlements");
    lastAccountId = ents.application + "-" + ents.nativeId + (ents.instance ? ents.instance : "");

    return accountUniqueId != lastAccountId;
};
