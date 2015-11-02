Ext.define('SailPoint.CertificationItemMenu', {
	extend : 'Ext.menu.Menu',

    certConf : null,

    // the current item ID. Since we have once shared
    // instance of this class, this will change each
    // time the menu is opened.
    currentItemId : null,

    // the current decision group ID. Since we have once shared
    // instance of this class, this will change each
    // time the menu is opened.
    decisionGroupId : null,

    /**
     * This property is set to true once the component has
     * been initialized.
     */
    initialized: false,

    // we hold references to these items
    // since they will be turned on or off
    // depending on the item we're looking at
    editDecisionItem : null,
    viewDecisionItem : null,
    undoDecisionItem : null,
    viewWorkItemItem : null,
    viewActionWorkItemItem : null,

    init : function(certConfig){

        this.certConf = certConfig;

        if (!this.initialized){

            this.viewDecisionItem = new Ext.menu.Item({
                id:'certItemMenu-details',
                text: '#{msgs.menu_details}',
                handler: this.viewDecision,
                scope: this,
                iconCls: 'viewDetailsBtn'
            });
            this.add(this.viewDecisionItem);


            this.editDecisionItem = new Ext.menu.Item({
                id:'certItemMenu-edit',
                text: '#{msgs.menu_edit}',
                handler: this.editDecision,
                scope: this,
                iconCls: 'editBtn'
            });
            this.add(this.editDecisionItem);


            this.undoDecisionItem = new Ext.menu.Item({
                id:'certItemMenu-undo',
                text: '#{msgs.menu_undo_decision}',
                handler: this.undoDecision,
                scope: this,
                iconCls: 'undoBtn'
            });
            this.add(this.undoDecisionItem);

            this.viewWorkItemItem = new Ext.menu.Item({
                id:'certItemMenu-workitem',
                text: '#{msgs.menu_view_work_item}',
                handler: this.viewWorkItem,
                scope: this,
                iconCls: 'viewDetailsBtn'
            });
            this.add(this.viewWorkItemItem);

            this.viewActionWorkItemItem = new Ext.menu.Item({
                id:'certItemMenu-action-workitem',
                text: '#{msgs.menu_view_work_item}',
                handler: this.viewActionWorkItem,
                scope: this,
                iconCls: 'viewDetailsBtn'
            });
            this.add(this.viewWorkItemItem);


            if (this.certConf.type != 'AccountGroupPermissions' && this.certConf.type != 'BusinessRoleComposition'){
                this.add(new Ext.menu.Item({
                    id:'certItemMenu-history',
                    text: '#{msgs.menu_view_history}',
                    handler: this.viewHistory,
                    scope: this,
                    iconCls: 'viewHistoryBtn'
                }));

                this.add(new Ext.menu.Item({
                    id:'certItemMenu-comment',
                    text: '#{msgs.menu_add_comment}',
                    handler: this.postHistoryComment,
                    scope: this,
                    iconCls: 'addCommentBtn'
                }));
            }

            this.initialized = true;
        }
    },

    undoDecision : function(){
        SailPoint.Decider.getInstance().decide(this.currentItemId, SailPoint.Decision.STATUS_UNDO);
    },

    viewDecision : function(){
        SailPoint.Decider.getInstance().view(this.currentItemId, Ext.getCmp(this.decisionGroupId));
    },

    postHistoryComment : function(){
        SailPoint.IdentityHistoryPanel.showHistoryCommentDialog(this.currentItemId);
    },

    viewHistory : function(){
    	var dci = Ext.getCmp(this.decisionGroupId);
    	var row = Ext.getCmp(dci.gridId).getView().getNode(dci.rowIdx);
        Page.fireEvent('toggleExpando', Ext.get(row).dom, dci.record, dci.rowIdx, 'history');
    },

    changeCertificationDecision : function(){
        SailPoint.Decider.getInstance().edit(this.currentItemId, Ext.getCmp(this.decisionGroupId), false);
    },

    editDecision : function(){
        SailPoint.Decider.getInstance().edit(this.currentItemId, Ext.getCmp(this.decisionGroupId), true);
    },

    viewActionWorkItem : function(){
        var decider = SailPoint.Decider.getInstance();
        var certItem = decider.getCertificationItem(this.currentItemId);
        SailPoint.certification.viewWorkItem(certItem.getActionWorkItemId());
    },

    viewWorkItem : function(){
        var decider = SailPoint.Decider.getInstance();
        var certItem = decider.getCertificationItem(this.currentItemId);
        SailPoint.certification.viewWorkItem(certItem.getActionWorkItemId());
    }

});

SailPoint.CertificationItemMenu.getInstance = function(){
    if (!SailPoint.CertificationItemMenu._instance){
        SailPoint.CertificationItemMenu._instance = new SailPoint.CertificationItemMenu({});
        // SailPoint.certificationConfig should have been defined on the page
        SailPoint.CertificationItemMenu._instance.init(SailPoint.certificationConfig);
    }
    return SailPoint.CertificationItemMenu._instance;
};

SailPoint.CertificationItemMenu.display = function(e){
    var pos = e.getXY();
    pos[0] = pos[0] - 10;
    pos[1] = pos[1] - 10;
    SailPoint.CertificationItemMenu.getInstance().showAt(pos);
};

SailPoint.CertificationItemMenu.handleClick = function(element, itemId, groupId){

    if (Ext.fly(element).hasCls('menuDisabled') == true)
        return;

    var decider = SailPoint.Decider.getInstance();

    var menu = SailPoint.CertificationItemMenu.getInstance();
    menu.currentItemId = itemId;
    menu.decisionGroupId = groupId;

    var certItem = decider.getCertificationItem(itemId);

    // get the current decision
    var currentDecision = decider.getCurrentDecision(itemId);
    if (currentDecision)
        currentDecision.readOnly =  !certItem.isEditable();

    var isDelegation = certItem.hasDelegation() || (currentDecision && currentDecision.isDelegationOrReassign());
    var isMitigated  = currentDecision && currentDecision.isMitigated();

    // dont allow editing of delegations since this complicates the UI for little user value bug#8403
    var isEditable = certItem.isEditable() && !isDelegation;    
    if (SailPoint.certificationConfig.editable === false) {
    	isEditable = false;
    }

    // hide the undo item depending on whether or not a decision exists
    menu.undoDecisionItem.setVisible(isEditable && currentDecision);

    // If the decision is editable, determine if it has any interesting
    // details that could be viewed. This can be determined by checking if
    // the decision requires a dialog to complete
    var requiresDialog = currentDecision && decider.getDecisionDialog(currentDecision);

    menu.editDecisionItem.setVisible(isEditable && (isMitigated || requiresDialog));
    menu.viewDecisionItem.setVisible(!isEditable && requiresDialog);

    menu.viewWorkItemItem.setVisible(certItem.getActionWorkItemId());
    
    var addCommentItem = Ext.getCmp('certItemMenu-comment');
    if (addCommentItem) {
    	addCommentItem.setDisabled(!isEditable);
    }

    var pos = Ext.get(element).getXY();
    pos[0] = pos[0] + 5;
    pos[1] = pos[1] + 5;
    menu.showAt(pos);

};