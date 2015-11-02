/**
 * This is the dialog we generate when a user chooses to
 * allow an exception.
 */
Ext.define('SailPoint.certification.DelegationDialog', {
    extend : 'SailPoint.certification.BaseDecisionDialog',

    form:null,

    //bug# 18585 
    //override close to destroy dialog, we might need to load different identity selector 
    //when dialog is canceled previously 
    close : function(){ 
        if (this.el){ 
            this.destroy(); 
        } 
    },

    constructor : function(config) {
        Ext.apply(this, {
            buttons : [
                       {
				    text:"#{msgs.cert_decision_delegate}",
				    parent:this,
				    handler: function() {
				        this.parent.save();
				    }
				},
				{
	                text:"#{msgs.button_cancel}",
                    cls : 'secondaryBtn',
	                parent:this,
	                handler: function() {
	                    this.parent.cancel();
	                }
	            }
			]
		});
		this.callParent(arguments);
	},

    initComponent:function() {

        this.setTitle("#{msgs.delegate_certification}");

        this.setHeight(375);

        this.form = new Ext.form.Panel({
            style:'padding:15px;background-color:#fff' ,
            border:false,
            bodyBorder:false,
            items:[
                {
                	xtype : 'assigneeselector',
                    quickAssignOptions : [],
                    fieldLabel:'#{msgs.recipient}',
                    afterLabelTextTpl: "<span style='color:red'>*</span>",
                    id:'delegationAssignee',
                    allowBlank:false,
                    hideQuickAssign:true,
                    baseParams: {context: 'delegationAssignee'}
                },
                new Ext.form.TextField({
                    id:'delegationDescription',
                    fieldLabel:'#{msgs.label_description}',
                    allowBlank:false,
                    width: 473}),
                new Ext.form.TextArea({
                    id:'delegationComments',
                    fieldLabel:'#{msgs.label_comments}',
                    name: 'delegationComments',
                    width:473,
                    height:190
                })
            ]
        });

        this.items = [
            this.form
        ];

        this.callParent(arguments);
    },

    // -----------------------------------------------------------------
    //
    //  DIALOG LIFECYCLE
    //
    // -----------------------------------------------------------------

    /**
     * Resets the dialog to it's default state
     */
    reset : function(){

        var assignee = Ext.getCmp('delegationAssignee');
        if (assignee){
            assignee.assigneeSuggest.setValue('');
            assignee.assigneeSuggest.clearInvalid();
        }

        var desc = Ext.getCmp('delegationDescription');
        if (desc){
            desc.setValue('');
            desc.clearInvalid();
        }

        var comments = Ext.getCmp('delegationComments');
        if (comments){
            comments.setValue('');
            comments.clearInvalid();
        }
        var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;
        
        if (this.isReadOnly){
            buttons.getAt(0).hide();
        } else {
            buttons.getAt(0).show();
        }
    },

    /**
     * Inits the dialog with the current decision.
     */
    init : function(){

        // Dont allow users to edit a saved delegation,
        // they need to revoke it before changing it
        if (this.decision.isSaved()){
            this.isReadOnly = true;
        }

        var id = this.decision.entityId ? this.decision.entityId : this.decision.selectionCriteria.selections[0];
        var url = "/rest/certification/"+this.decision.certificationId;
        if (this.decision.status == "Reassign"){
            url += "/bulkdecision/Delegated";
        } else if (this.decision.isEntityDecision()){
            url += "/bulkdecision/" + id + "/Delegated";
        } else {
            url = "/rest/certification/item/"+this.certificationItem.getId() + "/Delegated";
        }

        url += "?workItemId=" + this.decision.workItemId;
        
        var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;

        // If we're dealing with a reassignment, we use a very
        // generic default description. Otherwise the
        // description uses the entity's name
        if (this.decision.status == "Reassign" || this.decision.status == "AccountReassign"){
            if (this.decision.status == "AccountReassign") {
                var desc = "#{msgs.dialog_title_reassign_account}";
                this.setTitle(desc);
            } else {
                var typeDescription = this.certificationConfig.mode == 'entityList' ? "#{msgs.identities_one_or_more}" :
                                    "#{msgs.items_one_or_more}";
                this.setTitle(Ext.String.format("#{msgs.dialog_title_reassign_named_item}", typeDescription));
            }

            buttons.getAt(0).setText("#{msgs.cert_decision_bulk_reassign}");
        } else {
            this.setTitle("#{msgs.delegate_certification}");
            buttons.getAt(0).setText("#{msgs.cert_decision_delegate}");
        }

        var ownerName = this.decision.recipient;
        var ownerDisplayName = this.decision.recipientDisplayName;
        var assignmentCmp = Ext.getCmp('delegationAssignee');
        var rawValue = ownerDisplayName ? ownerDisplayName : ownerName;
        
        //bug# 18585 
        //change context depends on decision.status so customer can easily customize identity suggest selector 
        if (this.decision.status === "Reassign" || this.decision.status === "AccountReassign") 
        {
            assignmentCmp.assigneeSuggest.store.proxy.extraParams.context = "reassignAssignee"; 
        }
        
        assignmentCmp.assigneeSuggest.setValue(ownerName ? ownerName : "");
        assignmentCmp.assigneeSuggest.setRawValue(rawValue ? rawValue : "");
        assignmentCmp.assigneeSuggest.setDisabled(this.isReadOnly);
        assignmentCmp.assigneeSuggest.clearInvalid();

        Ext.getCmp('delegationComments').setValue(this.decision.comments);

        Ext.getCmp('delegationDescription').setDisabled(this.isReadOnly);
        Ext.getCmp('delegationComments').setDisabled(this.isReadOnly);

        // if we're not doing an account reassign, we need to look
        // up the details of the action.
        if (this.decision.status != "AccountReassign"){
            Ext.Ajax.request({
                scope:this,
                url: SailPoint.getRelativeUrl(url),
                success: function(response){

                    var respObj = Ext.decode(response.responseText).object;

                    var existingDelegation = (respObj.delegation
                            && respObj.delegation.entityDelegation == this.decision.isEntityDecision()) ?
                            respObj.delegation : null;

                    var comments = existingDelegation ? existingDelegation.comments : "";

                    // get the description. If there's an existing delegation get it's description,
                    // other wise use the default description
                    var description = existingDelegation ? existingDelegation.description : respObj.description;

                    // If we don't have the display name for the owner, check to see
                    // if we can pull it from the response
                    if (!this.decision.recipientDisplayName && respObj.owner && respObj.owner.name == this.decision.recipient){
                        var assignmentCmp = Ext.getCmp('delegationAssignee');
                        assignmentCmp.assigneeSuggest.setRawValue(respObj.owner.displayName);
                    }

                    if (description && description != '')
                        Ext.getCmp('delegationDescription').setValue(description);

                    if (comments && comments != '')
                        Ext.getCmp('delegationComments').setValue(comments);

                    this.fireEvent('initComplete');
                },
                /**
                * Throws up a sys err msg. Note that this is not called when
                * success==false in the response, but if the call returns a 404 or 500.
                */
                failure: function(response){
                    this.hideMask();
                    SailPoint.Decider.getInstance().gridIds.each(function(gridId){
                        var grid = Ext.getCmp(gridId);
                        grid.unmask();
                    });
                    this.cancel();
                    SailPoint.FATAL_ERR_ALERT.call(this);
                }
            });
        } else {
            Ext.getCmp('delegationDescription').setValue("#{msgs.account_reassign_desc}");
            this.fireEvent('initComplete');
        }
    },

    /**
     * Validate the form. This is called before the dialog is submitted
     */
    validateForm : function(){

        var assignmentCmp = Ext.getCmp('delegationAssignee');
        var descriptionCmp = Ext.getCmp('delegationDescription');
        return assignmentCmp.validate() && descriptionCmp.validate();
    },

    /**
     * This is called by the Decider to get the decision record,
     * updated with any changes made by the user's input.
     */
    getDecision : function(){

        var desc = Ext.getCmp('delegationDescription').getValue();
        var comments = Ext.getCmp('delegationComments').getValue();

        var assignmentCmp = Ext.getCmp('delegationAssignee');

        this.decision.recipient = assignmentCmp.assigneeSuggest.getValue();
        this.decision.recipientDisplayName = assignmentCmp.assigneeSuggest.getRawValue();
        this.decision.comments = comments;
        this.decision.description = desc;
        this.decision.dialogState.push("DelegationDialog");

        return this.decision;
    }
});

/**
  * Used by the Decider to either create a new instance or re-use an
  * existing one.
 */
SailPoint.certification.DelegationDialog.getInstance = function(){
    var dialog = SailPoint.certification.BaseDecisionDialog.baseGetInstance(
            SailPoint.certification.DelegationDialog,
                        {id:'delegationDialog'});
    return dialog;
};