/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.certification.CertificationItemExpander', {
    extend : 'SailPoint.grid.RowExpander',
    alias : 'plugin.certitemexpander',
    
    expandos : {},
    rowExpandedCls : 'x-grid-row-expanded',

    init : function(grid){
        this.callParent(arguments);
        
        this.grid = grid;

        Page.on('toggleExpando', this.handleToggleExpando, this);
        Page.on('closeAllExpandos', this.handleCloseAllExpandos, this);

        grid.getView().enableRowBody = true;

        grid.on('render', function(){
            this.grid.getView().on('itemclick', this.onclick, this);
        }, this);
    },

    calculateType : function(className){
        if (className != null){
            if (className.indexOf('application') > -1){
                return "application";
            } else if (className.indexOf('account') > -1){
                return "account";
            } else if (className.indexOf('rule') > -1){
                return "rule";
            } else if (className.indexOf('role') > -1){
                return "role";
            } else if (className.indexOf('identity') > -1){
                return "identity";
            } else if (className.indexOf('link') > -1){
                return "link";
            } else if (className.indexOf('profile') > -1){
                return "profile";
            } else if (className.indexOf('delegationComments') > -1){
                return "delegationComments";
            } else if (className.indexOf('challengeCompletionComments') > -1){
                return "challengeCompletionComments";
            } else if (className.indexOf('challengeDecisionComments') > -1){
                return "challengeDecisionComments";
            } else if (className.indexOf('remediationComments') > -1){
                return "remediationComments";
            } else if (className.indexOf('history') > -1){
                return "history";
            }
        }
    },

    hasOtherActiveExpandos : function(id) {
        var cnt = 0, key;
        for(key in this.expandos) {
            if (key.indexOf(id) > -1) {
                    cnt++;
            }
        }
        return cnt > 0;
    },

    findExpando : function(record, type){
        var cmp = null, rid;
        if(record) {
            rid = SailPoint.Utils.getRecordId(record);
        }
        if (rid && this.expandos[rid + '-' + type]) {
            var cmpId = this.expandos[rid +'-'+type];
            cmp = Ext.getCmp(cmpId);
        }
        return cmp;
    },

    addExpando : function(record, type, panel){
        var expandoKey = SailPoint.Utils.getRecordId(record) + '-' +  type;
        // only add if its not already in there
        if (this.findExpando(record,type) == null) {
            this.expandos[expandoKey] = panel.getId();
        }
    },

    removeExpando : function(record, type){
        var expandoKey = SailPoint.Utils.getRecordId(record) + '-' +  type;
        this.removeExpandoByKey(expandoKey);
    },
    
    removeExpandoByKey : function (expandoKey) { 
        var expando;
        if (expandoKey && this.expandos[expandoKey]) {
            expando = Ext.getCmp( this.expandos[expandoKey] );
            if (expando) {
                if (!expando.hidden) {
                    expando.hide();
                }
                expando.destroy();
            }
            delete this.expandos[expandoKey];
        }
    },

    showContent : function(row, record, type){

        var panel = null;
        var targetEl = Ext.DomQuery.selectNode('div.x-grid-rowbody', row);
        
        // NOTE - Adding something here? make sure it's also in calculateType()
        switch(type) {
            case "account":
                panel = SailPoint.certification.AccountExpando.call(this, row, record, targetEl);
                break;
            case "application":
                panel = SailPoint.certification.AppExpando.call(this, row, record, targetEl);
                break;
            case "challengeCompletionComments":
                panel = SailPoint.certification.ChallengeCompletionCommentsExpando.call(this, row, record, targetEl);
                break;
            case "challengeDecisionComments":
                panel = SailPoint.certification.ChallengeDecisionCommentsExpando.call(this, row, record, targetEl);
                break;
            case "delegationComments":
                panel = SailPoint.certification.DelegationCommentsExpando.call(this, row, record, targetEl);
                break;
            case "history":
                // TODO: this block is getting called twice each time show history is selected. Need to figure out what's going on. :-/
                
                // some cert types have a special identity column, otherwise we can
                // use the parent-id for identity certs.
                var identity = record.data['IIQ_identity'] ? record.data['IIQ_identity'].name : record.data['parent-targetName'];
                //console.log(identity);
                panel = SailPoint.IdentityHistoryPanel.getPanel(SailPoint.Utils.getRecordId(record), identity, targetEl);
                panel.on('hide', function(){
                    this.expander.removeExpando(this.record, this.type);
                }, {expander:this, record:record, type:type});
                break;
            case "identity":
                panel = SailPoint.certification.IdentityExpando.call(this, row, record, targetEl);
                break;
            case "link":
                panel = SailPoint.certification.LinkExpando.call(this, row, record, targetEl);
                break;
            case "profile":
                panel = SailPoint.certification.ProfileExpando.call(this, row, record, targetEl);
                break;
            case "remediationComments":
                panel = SailPoint.certification.RemediationCommentsExpando.call(this, row, record, targetEl);
                break;
            case "role":
                panel = SailPoint.certification.RoleExpando.call(this, row, record, targetEl);
                panel.on('hide', function() {
                    // bug#8940 - make sure that the row has a parentNode before attempting to
                    // toggle. A missing parentNode means the grid has been paged and the row is
                    // no longer visible
                    if (row.parentNode)
                        this.toggleRow(row, record, null, type);
                }, this);
                break;
            case "rule":
                panel = SailPoint.certification.RuleExpando.call(this, row, record, targetEl);
                break;
        }

        if (panel == null) {
            return;
        }

        panel.on('closeClick', function() {
            this.toggleRow(row, record, null, type);
        }, this);
        
        panel.on('afterlayout', function(){
             addDescriptionTooltips();
             if(this.grid){
                 this.grid.fireEvent(this.resizeEventName);
              }
        }, this);
        
        this.addExpando(record, type, panel);

        return panel;
    },

    onclick : function(view, record, item, index, e, eOpts){
        if(Ext.fly(e.target).hasCls('disclosure')){
            e.stopEvent();
            this.toggleRow(item, record, index, this.calculateType(e.target.className), e.target);
        }
    },

    toggleRow : function(row, record, rowIdx, type, target){

        if(!row || Ext.isNumber(row)) {
            // Catch event fired from superclass handlers and ignore.
            return;
        }
        
        if(!rowIdx) {
            rowIdx = row.viewIndex;
        }
        
        row = Ext.get(row);
        var rid = SailPoint.Utils.getRecordId(record);
        var rowNode = this.grid.getView().getNode(rowIdx);
        var nextBd = row.down(this.rowBodyTrSelector);
        var currentState = row.hasCls(this.rowCollapsedCls) ? 'collapseRow' : 'expandRow';
        var isExpandoActive = this.findExpando(record, type) != null;
        
        if(isExpandoActive) {
            this.removeExpando(record, type);
            if (!this.hasOtherActiveExpandos(rid)) {
                row.addCls(this.rowCollapsedCls);
                nextBd.addCls(this.rowBodyHiddenCls);
                this.recordsExpanded[rid] = false;
                this.grid.getView().fireEvent('collapsebody', rowNode, record, nextBd.dom);
                this.collapseRow(rowIdx);
            }
            else {
                if(this.grid){
                     this.grid.fireEvent(this.resizeEventName);
                  }
            }
        } 
        else {
            if (currentState != 'expandRow' && record) {
                row.removeCls(this.rowCollapsedCls);
                var dcol = nextBd.prev('tr').down('.x-grid-cell-first');
                if(dcol) {
                    dcol.set({rowSpan:2, valign:'top'});
                }
                nextBd.removeCls(this.rowBodyHiddenCls);
                this.recordsExpanded[rid] = true;
                this.expandRow(rowIdx);
            }
            this.grid.getView().fireEvent('expandbody', rowNode, record, nextBd.dom);
            this.showContent(row.dom, record, type);
        }

        SailPoint.Utils.toggleDisclosureRow(target, row);
    },

    /**
     * Handles toggling expandos from outside of the grid.
     * This would generally be called with an event.
     */
    handleToggleExpando : function(row, record, rowIdx, type){
        if (rowIdx > -1) {
            this.toggleRow(row, record, rowIdx, type);
        }
    },
    
    /**
     * Handles closing all expandos from outside of the grid.
     * This would generally be called with an event.
     */
    handleCloseAllExpandos : function () {
        for (var key in this.expandos) {
            this.removeExpandoByKey(key);
        }
    }
});

SailPoint.certification.AppExpando = function(row, record, targetEl){
    var appName = record.get('exceptionApplication');
    if (!appName)
        appName = record.get('exceptionEntitlements-application');

    var certItemId = SailPoint.Utils.getRecordId(record);
    var url = SailPoint.getRelativeUrl("/rest/certification/item/" + certItemId +"/appSummary/" + SailPoint.Utils.encodeRestUriComponent(appName));
    var panelTitleTpl = new Ext.Template("#{msgs.title_application_details}");
    var panelBodyTpl = new Ext.XTemplate(
            "<div class='detailTable'>",
            "<div><label>#{msgs.text_app_description}:</label> <span>{description}</span></div>",
            "<div><label>#{msgs.text_app_type}:</label> <span>{type}</span></div>",
            "<div><label>#{msgs.text_app_owner}:</label> <span>{ownerDisplayName}</span></div>",
            "<div><label>#{msgs.text_app_remediators}:</label> <span>",
            '<tpl for="remediators">',
            '{[xindex != 1 ? ", " : ""]}',
            "{displayName}",
            "</tpl>",
            "</span></div>",
            "</div>"
    );

    var disclosureRow = row;
    var panel = Ext.create('Ext.panel.Panel', {
        id:'app-exp-' + certItemId,
        renderTo: targetEl,
        closeable:true, 
        html:'', 
        header:true,
        title:panelTitleTpl.apply([appName]),
        tools:[{
            type: 'close',
            handler: function(event, toolEl, owner, tool){
                owner.ownerCt.fireEvent('closeClick');
                SailPoint.Utils.toggleDisclosureRow(disclosureRow, disclosureRow);
            }
        }],
        bodyStyle:'padding:5px',
        loader: {
            url: url,
            loadMask : true,
            autoLoad : true,
//            ajaxOptions : {
//              discardUrl: true,
//              nocache: true,
//              timeout: 60
//            },
            renderer : function(loader, response, active) {
                if(response && response.responseText){
                    var text = Ext.decode(response.responseText);
                    if(text && text.object){
                        loader.getTarget().update(panelBodyTpl.apply(text.object));
                        return true;
                    }
                }
                return false;
            }
        }
    });
    panel.addEvents('closeClick');

    return panel;
};

SailPoint.certification.AccountExpando = function(row, record, targetEl){

    var rid = SailPoint.Utils.getRecordId(record);
    var url = '/identity/linkDetails.jsf?nonEntitlements=false&certItem=' + rid;
    if (Page.showEntitlementDescriptions != undefined){
        url += '&showDesc=' + Page.showEntitlementDescriptions
    }

    var acctName = record.get('exceptionEntitlements-displayName');
    if (!acctName || acctName == '')
        acctName = record.get('exceptionEntitlements-nativeIdentity');
    if (!acctName && record.get("IIQ_exceptionEntitlements")){
        acctName = record.get("IIQ_exceptionEntitlements").accountDisplayName ?
                record.get("IIQ_exceptionEntitlements").accountDisplayName :
                record.get("IIQ_exceptionEntitlements").nativeIdentity;
    }

    var panelTitleTpl = new Ext.Template("#{msgs.identity_acct_expando_title_acct}");

    var disclosureRow = row;
    var panel = new Ext.Panel({
        id: 'acct-exp-' + rid,
        renderTo: targetEl,
        style: 'width:100%',
        closeable: true,
        html: '',
        header: true,
        title: panelTitleTpl.apply([acctName]),
        tools: [{
            type: 'close',
            handler: function(event, toolEl, owner, tool){
                owner.ownerCt.fireEvent('closeClick');
                SailPoint.Utils.toggleDisclosureRow(disclosureRow, disclosureRow);
            }
        }],
        bodyStyle: 'padding:5px',
        loader: {
            url : SailPoint.getRelativeUrl(url),
            autoLoad : true
        }
    });
    panel.addEvents('closeClick');

    return panel;
};


/**
 * This expand is used in two different places with different initial data.
 */
SailPoint.certification.RuleExpando = function(row, record, targetEl){

    var url, ruleName, disclosureRow = row, rid = SailPoint.Utils.getRecordId(record);

    var violationRenderer;
    if (record.get('violation-constraint')) {
        ruleName = record.get('violation-constraint');
        violationRenderer = record.get('violation-renderer');
        if (violationRenderer) {
            violationRenderer = violationRenderer.replace('xhtml', 'jsf');
            url = '/identity/' + violationRenderer + '?certItemId=' + rid;
        } else {
            url = '/identity/policyGenericDetails.jsf?certItemId=' + rid;
        }
    } else {
        ruleName = record.get('ruleName');
        url = '/identity/policyGenericDetails.jsf?workitemId=' + record.get('workitemId') +
              '&ruleName=' + ruleName;
    }
    
    var panelTitleTpl = new Ext.Template("#{msgs.info_rules_details}");
    var panel = new Ext.Panel({
        id:'acct-exp-' + rid,
        renderTo: targetEl,
        style:'width:100%', 
        bodyCls: 'spPaddedTable',
        closeable:true, 
        html:'',
        header:true,
        title:panelTitleTpl.apply([ruleName]),
        tools:[{
            type: 'close',
            handler: function(event, toolEl, owner, tool){
                owner.ownerCt.fireEvent('closeClick');
                SailPoint.Utils.toggleDisclosureRow(disclosureRow, disclosureRow);
            }
        }],
        bodyStyle:'padding:5px',
        loader: {
            url : SailPoint.getRelativeUrl(url),
            autoLoad : true,
            //policyGenericDetails.jsf assumes we are in a table, so surround the results with <table> tags 
            renderer: function(loader, response, active) {
                if (response.responseText && loader && loader.getTarget()) {
                    loader.getTarget().update('\<table\>'+response.responseText+'\</table\>');
                    return true;
                }
                return false;
            }
        }
    });
    panel.addEvents('closeClick');

    return panel;
};

SailPoint.certification.RoleExpando = function(row, record, targetEl){

    var roleId = null;
    var identityId = null;
    var isAssignedRole = false;
    var roleAssignmentId = null;

    var roleDetails = record.get('IIQ_roleDetails');
    if (roleDetails){
        roleId =  roleDetails.roleId;
        identityId = roleDetails.identityId;
        isAssignedRole = roleDetails.assignedRole;
        roleAssignmentId = roleDetails.assignmentId;
    } else {
        roleId =  record.get('targetId'); // this is used in role comp certs
    }
    var roleType = isAssignedRole ? 'assignedRoles' : 'detectedRoles';
    return SailPoint.RoleDetailPanel.toggle(roleId, identityId, isAssignedRole, targetEl, SailPoint.Utils.getRecordId(record), null, roleAssignmentId, roleType);
};

SailPoint.certification.IdentityExpando = function(row, record, targetEl){

    var identityId = record.get("IIQ_identity").id,
        rid = SailPoint.Utils.getRecordId(record),
        panelId = "identityDetails-" + rid,
        disclosureRow = row;

    // Create the tab panel
    var tabs = Ext.create('Ext.tab.Panel', {
        autoScroll:false,
        id: panelId,
        renderTo: targetEl,
        title:'#{msgs.identity_detail_panel_title}',
        tools:[{
            type: 'close',
            handler: function(event, toolEl, owner, tool){
                owner.ownerCt.fireEvent('closeClick');
                SailPoint.Utils.toggleDisclosureRow(disclosureRow, disclosureRow);
            }
        }],
        items:[
            {html:'', title:'#{msgs.identity_detail_panel_tab_identity_attributes}'},
            {html:'', title:'#{msgs.identity_detail_panel_tab_app_accounts}'}
        ]
    });
    tabs.addEvents('closeClick');

    // Add load methods to the tabs. The callback for the load resizes the
    // container DIV which wraps the tabpanel so it fits the loaded content.
    var itemId = rid;
    var workItemId = record.get('IIQ_decisionChoices') ? record.get('IIQ_decisionChoices').workItemId : null;
    
    tabs.items.get(0).on('activate', function(thePanel) {
        var url = '/manage/certification/identityDetails.jsf?itemId=' + itemId;
        if (workItemId) {
            url += "&workItemId=" + workItemId;
        }
        if(!thePanel.loader) {
            thePanel.loader = {
                url: SailPoint.getRelativeUrl(url),
                scope: thePanel
            };
            thePanel.getLoader().load();
        }
    }, this);

    tabs.items.get(1).on('activate', function(thePanel) {
        if(!thePanel.loader) {
            thePanel.loader = {
                url: SailPoint.getRelativeUrl('/manage/certification/identityLinksPanel.jsf?itemId=' + itemId),
                scope: thePanel
            };
            thePanel.getLoader().load();
        }
    }, this);

    // Cheesy hack to get the first tab to call it's activate event.  WHY is this needed??  AAARRRGGGHHH...
    tabs.setActiveTab(1);
    tabs.setActiveTab(0);
    
    return tabs;
};

SailPoint.certification.LinkExpando = function(row, record, targetEl){

    var disclosureRow = row, rid = SailPoint.Utils.getRecordId(record);
    var url = '/identity/linkDetails.jsf?certItem=' + rid;
    if (Page.showEntitlementDescriptions != undefined){
        url += '&showDesc=' + Page.showEntitlementDescriptions
    }

    var title = Ext.String.format("#{msgs.identity_acct_expando_title_acct}",
            record.get('exceptionEntitlements-displayName'));

    var panel = new Ext.Panel({
        id: 'linkDetails-' + rid,
        renderTo: targetEl,
        title: title,
        tools:[{
            type: 'close',
            handler: function(event, toolEl, owner, tool){
                owner.ownerCt.fireEvent('closeClick');
                SailPoint.Utils.toggleDisclosureRow(disclosureRow, disclosureRow);
            }
        }],
        loader: {
            url : SailPoint.getRelativeUrl(url),
            autoLoad : true
        }
    });
    panel.addEvents('closeClick');

    return panel;
};

SailPoint.certification.ProfileExpando = function(row, record, targetEl){

    var title = Ext.String.format("#{msgs.text_profile_details}",
               record.get('profile-objectName'));

    var constraints = record.get('profile-constraints');
    var permissions = record.get('profile-permissions');
    if (!permissions)
        permissions = [];

    var contentTemplate = new Ext.XTemplate(
            "<div class='detailsPanelContent'>",
                '<tpl if="!this.isEmpty(constraints)">',
                    "<div>",
                            "<div class='sectionHeader'>#{msgs.cert_profile_filters}</div>",
                            '<tpl for="constraints">',
                                "<div class='font10'>{.}</div>",
                            '</tpl>',
                    "</div>",
                '</tpl>',
                '<tpl if="!this.isEmpty(permissions)">',
                '<div>',
                    '<div class="sectionHeader">#{msgs.cert_profile_permissions}</div>',
                    '<tpl for="permissions">',

                        '<span class="entitlementTxt">',
                        '<tpl if="!this.isEmpty(rightsList)">',
                            '<tpl for="rightsList">',
                                '<tpl if="xindex != 1">',
                                ', ',
                                '</tpl>',
                                '<span>{.}</span>',
                            '</tpl>',
                            '</span>',
                        '</tpl>',
                        ' on <span class="entitlementTxt">{target}</span>',
                        '<tpl if="!this.isEmpty(annotation)">',
                            '<span class="entitlementTxt">({annotation})</span><br/>',
                        '</tpl>',
                   '</tpl>',
                '</div>',
                '</tpl>',
            "</div>",{
            isEmpty:function(obj){
                return !obj || obj == '' ||  (obj.length && obj.length ==0);
            }
    });


    var content = contentTemplate.apply({constraints:constraints, permissions:permissions});

    var disclosureRow = row;
    var panel = new Ext.Panel({
        id:'profile-details-' + SailPoint.Utils.getRecordId(record),
        renderTo: targetEl,
        style:'width:100%',
        closeable:true,
        html:'',
        header:true,
        title:title,
        tools:[{
            type: 'close',
            handler: function(event, toolEl, owner, tool){
                owner.ownerCt.fireEvent('closeClick');
                SailPoint.Utils.toggleDisclosureRow(disclosureRow, disclosureRow);
            }
        }],
        bodyStyle:'padding:5px',
        html : content
    });
    panel.addEvents('closeClick');
 
    return panel;
};

SailPoint.certification.DelegationCommentsExpando = function(row, record, targetEl){

    var rid = SailPoint.Utils.getRecordId(record);
    var workItemId = record.get('IIQ_decisionChoices') ? record.get('IIQ_decisionChoices').workItemId : null;
    var url = SailPoint.getRelativeUrl("/rest/certification/item/" + rid);
    if (workItemId)
        url += "?workItemId=" + workItemId;

    var panelBodyTpl = new Ext.XTemplate(
            "<div>{[this.getDelegation(values)]}</div>",
            {
                getDelegation: function(value){
                    var comments = value.delegation ? value.delegation.completionComments :
                            value.entityDelegation ? value.entityDelegation.completionComments : "";
                    if (!comments)
                        comments = "";
                    comments = Ext.util.Format.htmlEncode(comments);
                    return comments;
                }
            }
        );
    
    var disclosureRow = row;
    var panel = new Ext.Panel({
        id:'delegation-comments-' + rid,
        renderTo: targetEl,
        style:'width:100%',
        closeable:true,
        html:'',
        header:true,
        title:"#{msgs.label_comments}",
        tools:[{
            type: 'close',
            handler: function(event, toolEl, owner, tool){
                owner.ownerCt.fireEvent('closeClick');
                SailPoint.Utils.toggleDisclosureRow(disclosureRow, disclosureRow);
            }
        }],
        bodyStyle:'padding:5px',
        loader: {
            url: url,
            loadMask : true,
            autoLoad : true,
//            ajaxOptions : {
//                discardUrl: true,
//                nocache: true,
//                timeout: 60
//            },
            renderer : function(loader, response, active) {
                if(response && response.responseText){
                    var text = Ext.decode(response.responseText);
                    if(text && text.object){
                        loader.getTarget().update(panelBodyTpl.apply(text.object));
                        return true;
                    }
                }
                return false;
            }
        }
    });

    panel.addEvents('closeClick');
    
    return panel;
};

/**
 * The comments made when the entitlement holder completes a challenge.
 */
SailPoint.certification.ChallengeCompletionCommentsExpando = function(row, record, targetEl){

    var comments = record.get("IIQ_decisionHistory").challengeCompletionComments;

    var disclosureRow = row;
    var panel = new Ext.Panel({
        id:'challange-completion-comments-' + SailPoint.Utils.getRecordId(record),
        renderTo: targetEl,
        style:'width:100%',
        closeable:true,
        html:'',
        header:true,
        title:"#{msgs.label_comments}",
        tools:[{
            type: 'close',
            handler: function(event, toolEl, owner, tool){
                owner.ownerCt.fireEvent('closeClick');
                SailPoint.Utils.toggleDisclosureRow(disclosureRow, disclosureRow);
            }
        }],
        bodyStyle:'padding:5px',
        html: Ext.String.htmlEncode(comments)
    });
    panel.addEvents('closeClick');

    return panel;
};


/**
 * The comments made when the entitlement holder completes a challenge.
 */
SailPoint.certification.RemediationCommentsExpando = function(row, record, targetEl){

    var comments = record.get("IIQ_decisionHistory").remediationComments;

    var disclosureRow = row;
    var panel = new Ext.Panel({
        id:'remediation-comments-' + SailPoint.Utils.getRecordId(record),
        renderTo: targetEl,
        style:'width:100%',
        closeable:true,
        html:'',
        header:true,
        title:"#{msgs.label_comments}",
        tools:[{
            type: 'close',
            handler: function(event, toolEl, owner, tool){
                owner.ownerCt.fireEvent('closeClick');
                SailPoint.Utils.toggleDisclosureRow(disclosureRow, disclosureRow);
            }
        }],
        bodyStyle:'padding:5px',
        html: Ext.String.htmlEncode(comments)
    });
    panel.addEvents('closeClick');
    
    return panel;
};


/**
 * Displays the challenge decision comments. The challenge decision comments are the comments
 * made when the original decider either Rejects or Accepts the entitlement holder's challenge response.
 */
SailPoint.certification.ChallengeDecisionCommentsExpando = function(row, record, targetEl){

    var comments = record.get("IIQ_decisionHistory").challengeDecisionComments;

    var disclosureRow = row;
    var panel = new Ext.Panel({
        id:'challange-decision-comments-' + SailPoint.Utils.getRecordId(record),
        renderTo: targetEl,
        style:'width:100%',
        closeable:true,
        html:'',
        header:true,
        title:"#{msgs.label_comments}",
        tools:[{
            type: 'close',
            handler: function(event, toolEl, owner, tool){
                owner.ownerCt.fireEvent('closeClick');
                SailPoint.Utils.toggleDisclosureRow(disclosureRow, disclosureRow);
            }
        }],
        bodyStyle:'padding:5px',
        html: Ext.String.htmlEncode(comments)
    });
    panel.addEvents('closeClick');

    return panel;
};