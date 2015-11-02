/**
 * This is the dialog we generate when a user chooses to
 * allow an exception.
 */
Ext.define('SailPoint.RemediationDialog', {
	extend : 'SailPoint.certification.BaseDecisionDialog',

    form:null,
	
	constructor : function(config) {
		Ext.apply(this, {
			buttons : [
				{
	                text:"#{msgs.cert_decision_remediate}",
	                parent:this,
	                handler: function() {
	                    this.parent.save();
	                }
	            },
	            {
	                text:"#{msgs.cert_delegation_review_button_accept}",
	                parent:this,
	                handler: function() {
	                    this.parent.acceptDelegationReview();
	                }
	            },
	            {
	                text:"#{msgs.cert_delegation_review_button_reject}",
	                parent:this,
	                handler: function() {
	                    this.parent.rejectDelegationReview();
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

        this.setHeight(480);

        this.remediationEditor = new SailPoint.certification.RemediationEditor({
            id:'remediationEditorPanel',
            minHeight:100
        });

        this.form = new Ext.form.Panel({
            style:'padding:15px;background-color:#fff',
            border:false,
            bodyBorder:false,
            autoScroll:true,
            items:[
                {
                    xtype : 'container',
                    id : 'remediationDelegationReviewDetails',
                    hidden:true,
                    border:false,
                    bodyBorder:false,
                    html:"<div id='remediationDelegationReviewMsg' class='informationPanel' style='margin:20px'></div>"
                },
                {
                    xtype : 'assigneeselector',
                    quickAssignOptions: [['', '']],
                    flex : 1,
                    fieldLabel: '#{msgs.recipient}',
                    afterLabelTextTpl: "<span style='color:red'>*</span>",
                    id: 'remediationAssignee',
                    allowBlank: false,
                    msgTarget: 'under',
                    baseParams: {context: 'Owner'}
                },
                {
                    xtype : 'textfield',
                    id: 'remediationDescription',
                    allowBlank: false,
                    msgTarget: 'under',
                    fieldLabel: '#{msgs.label_description}',
                    width: 510
                },
                {
                    xtype : 'textarea',
                    id: 'remediationComments',
                    fieldLabel: '#{msgs.label_comments}',
                    name: 'remediationComments',
                    width: 510,
                    height: 190
                },
                {
                    xtype : 'container',
                    id : 'provisioningMessage',
                    hidden:true,
                    border:false,
                    bodyBorder:false,
                    html:"<div id='provisioningMessageContent' class='informationPanel'></div>"
                },
                {
                    xtype : 'container',
                    id : 'bulkRemediationNote',
                    hidden:true,
                    border:false,
                    bodyBorder:false,
                    html:"<div id='bulkRemediationNoteContent' style='margin-left:105px;width:470px'>*#{msgs.info_bulk_remediation_recipient}</div>"
                },
                this.remediationEditor
            ]
        });

        this.items = [
            this.form
        ];

        this.callParent(arguments);
    },

    /**
     * Resets the dialog with the current decision. This is called
     * each time the dialog is displayed.
     *
     * @private
     */
    reset : function(){

        var buttonText = '#{msgs.button_revoke}';
        var titleText = null;

        this.currentPage = 0;

        this.remediationEditor.reset();

        if (this.decision.status == 'RevokeAccount') {
            buttonText = '#{msgs.button_revoke_account}';
            titleText = '#{msgs.dialog_title_revoke_account}';
        }  else {
            titleText = "#{msgs.button_revoke}";
            var desc = this.certificationItem ? this.certificationItem.getDescription() : null;
            if (desc && desc != ""){
                titleText = Ext.String.format("#{msgs.cert_decision_title_remediate}", desc);
            }
        }

        var assignmentCmp = Ext.getCmp('remediationAssignee');
        assignmentCmp.assigneeSuggest.reset();
        assignmentCmp.assigneeSuggest.clearInvalid();
        assignmentCmp.assigneeSuggest.setDisabled(this.isReadOnly);
        assignmentCmp.setFieldLabel("#{msgs.recipient}");
        assignmentCmp.setDisabled(this.isReadOnly);

        this.setTitle(titleText);

        Ext.getCmp('remediationDelegationReviewDetails').hide();
        Ext.getCmp('bulkRemediationNote').hide();

        var descriptionCmp = Ext.getCmp('remediationDescription');
        this.showField(descriptionCmp);

        var dItems = this.getDockedItems('toolbar[dock="bottom"]')[0].items;
        
        dItems.getAt(0).setText(buttonText);

        // show the delegation review buttons if necessary
        if (this.decision.requiresDelegationReview){
        	dItems.getAt(0).hide();
        	dItems.getAt(1).show();
        	dItems.getAt(2).show();
        } else {
            if (this.isReadOnly){
            	dItems.getAt(0).hide();
            } else {
            	dItems.getAt(0).show();
            }
            dItems.getAt(1).hide();
            dItems.getAt(2).hide();
        }

        // restore default size
        this.setHeight(480);
        this.setWidth(750);
    },

    init : function(){

        this.baseInit();

        var certId = this.decision.certificationId;
        var url = null;

        if(!this.decision.isBulk()){
            url = Ext.String.format("/rest/certification/item/{0}/{1}", this.certificationItem.getId(), this.decision.status);
        } else {
            url = Ext.String.format("/rest/certification/{0}/bulkdecision/{1}", certId, this.decision.status);
        }

        url += "?workItemId=" + this.decision.workItemId;

        // if the item is a bulk decision, hide description, display the bulk revocation
        // instructions and modify the label on the recipient field to include a *
        if (this.decision.isBulk()){
            Ext.getCmp('bulkRemediationNote').show();
            var assignmentCmp = Ext.getCmp('remediationAssignee');
            if (assignmentCmp)
                assignmentCmp.setFieldLabel("#{msgs.recipient_starred}:");
            var descriptionCmp = Ext.getCmp('remediationDescription');
            this.hideField(descriptionCmp);
        }

        Ext.Ajax.request({
            scope:this,
            url: SailPoint.getRelativeUrl(url),
            success: function(response){

                var respObj = Ext.decode(response.responseText).object;

                // Populate the quick assignment combo box
                var assignmentCmp = Ext.getCmp('remediationAssignee');
                var assignmentOpts = respObj.assignmentOptions;
                if (assignmentCmp && assignmentOpts && assignmentOpts.length > 0){
                    var records = [];
                    assignmentOpts.each(function(item){
                        var arr = [item.identity, item.description];
                        records.push(arr);
                    });
                    assignmentCmp.quickAssign.getStore().loadData(records, false);
                }

                var comments = this.decision.comments ? this.decision.comments : respObj.comments;
                var description = this.decision.description ? this.decision.description : respObj.description;
                var ownerName = this.decision.recipient;
                var ownerDisplayName = this.decision.recipientDisplayName;

                if (!this.decision.recipient && respObj.owner){
                    ownerName = respObj.owner.name;
                    ownerDisplayName = respObj.owner.displayName;
                }

                // If we don't have the display name for the owner, check to see
                // if we can pull it from the response
                if (!ownerDisplayName && respObj.owner && respObj.owner.name == this.decision.recipient){
                    ownerDisplayName = respObj.owner.displayName;
                }

                if (respObj.remediationDetails && respObj.remediationDetails.length > 0){
                  this.decision.showRemediationDetails = true;
                  this.remediationEditor.show();
                  this.remediationEditor.showRevocationDetailsPanel(respObj.remediationDetails,
                          respObj.useManagedAttributesForRemediation, this.certificationConfig, this.isReadOnly);
                } else {
                    this.remediationEditor.hide();
                }

                // If there is a default revoker make dialog readonly
                // This is intentionally placed after the showRevocationDetailsPanel call
                // Even if there is a default revoker we want  to show remediation details
                if (this.certificationConfig.defaultRevoker) {
                  this.isReadOnly = true;
                  ownerName = this.certificationConfig.defaultRevoker;
                  ownerDisplayName = this.certificationConfig.defaultRevoker;
                }

                var commentsInput = Ext.getCmp('remediationComments');
                commentsInput.setValue(comments ? comments : "");
                commentsInput.setDisabled(this.isReadOnly);

                var descriptionInput = Ext.getCmp('remediationDescription');
                descriptionInput.setValue(description ? description : "");
                descriptionInput.setDisabled(this.isReadOnly);

                var rawValue = ownerDisplayName ? ownerDisplayName : ownerName;
                assignmentCmp.assigneeSuggest.setValue(ownerName ? ownerName : "");
                assignmentCmp.assigneeSuggest.setRawValue(rawValue ? rawValue : "");
                //SailPoint.Suggest.IconSupport.setIconCls(assignmentCmp.assigneeSuggest, 'userIcon');
                assignmentCmp.assigneeSuggest.setDisabled(this.isReadOnly);
                assignmentCmp.assigneeSuggest.clearInvalid();
                assignmentCmp.setDisabled(this.isReadOnly);

                if (this.decision.requiresDelegationReview){

                    var delegationOwner = respObj.delegation.owner;
                    var msg = "#{msgs.cert_decision_accept_delegate_remediation}";
                    var formatted = Ext.String.format(msg, delegationOwner.displayName ? delegationOwner.displayName :
                            delegationOwner.name);
                    Ext.fly('remediationDelegationReviewMsg').dom.innerHTML = formatted;
                    Ext.getCmp('remediationDelegationReviewDetails').show();
                }

                if (respObj.remediationAction == "SendProvisionRequest"){
                    var provisioners = "";
                    if (respObj.provisioners && respObj.provisioners.length > 1){
                        provisioners = respObj.provisioners.join(", ");
                    } else {
                        provisioners = respObj.provisioners[0];
                    }

                    var provMsg = Ext.String.format("#{msgs.automatic_remediation_confirmation}", provisioners);
                    Ext.fly('provisioningMessageContent').dom.innerHTML = provMsg;

                    this.showField(Ext.getCmp('provisioningMessage'));
                    this.hideField(Ext.getCmp('remediationAssignee'));
                    this.hideField(Ext.getCmp('remediationDescription'));
                    this.hideField(Ext.getCmp('remediationComments'));

                    this.setHeight(320);

                } else {
                    this.hideField(Ext.getCmp('provisioningMessage'));
                    this.showField(Ext.getCmp('remediationAssignee'));
                    this.showField(Ext.getCmp('remediationDescription'));
                    this.showField(Ext.getCmp('remediationComments'));

                    this.setHeight(480);
                }

                this.hideMask();
                SailPoint.RemediationDialog.superclass.init.call(this);
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
    },

    /**
     * Validate the form. This is called before the dialog is submitted
     */
    validateForm : function(){

        var valid = true;

        var descriptionInput = Ext.getCmp('remediationDescription');
        if (descriptionInput.isVisible())
            valid = Ext.getCmp('remediationDescription').isValid();

        if (valid){
            var assignmentCmp = Ext.getCmp('remediationAssignee');
            if (!assignmentCmp.hidden){
                valid = assignmentCmp.validate();
            }
        }
        
        if (valid && this.remediationEditor) {
            valid = this.remediationEditor.validateNewValues();
        }

        return valid;
    },

    /**
     * This is called by the Decider to get the decision record,
     * updated with any changes made by the user's input.
     */
    getDecision : function(){

        var desc = Ext.getCmp('remediationDescription').getValue();
        var comments = Ext.getCmp('remediationComments').getValue();
        var assignmentCmp = Ext.getCmp('remediationAssignee');

        this.decision.recipient = assignmentCmp.assigneeSuggest.getValue();
        this.decision.recipientDisplayName = assignmentCmp.assigneeSuggest.getRawValue();
        this.decision.comments = comments;
        this.decision.description = desc;
        this.decision.dialogState.push("RemediationDialog");
        if (this.remediationEditor.hasEditableEntitlements()){
            this.decision.remediationDetails = this.remediationEditor.getValues();
        }
        return this.decision;
    }
});


/**
  * Used by the Decider to either create a new instance or re-use an
  * existing one.
 */
SailPoint.RemediationDialog.getInstance = function(){
    var dialog = SailPoint.certification.BaseDecisionDialog.baseGetInstance(
            SailPoint.RemediationDialog,{id:'remediationDialog'});
    return dialog;
};
