/**
 * This is the dialog we generate when a user chooses to
 * allow an exception.
 */
Ext.define('SailPoint.certification.DelegationRevocationDialog', {
	extend : 'SailPoint.certification.BaseDecisionDialog',
	
	constructor : function(config) {
		Ext.apply(this, {
			buttons : [
				{
				    text:"#{msgs.button_continue}",
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

        Ext.applyIf(this, {
            width:400,
            height:225
        });

        this.cls = "x-window-dlg";

        this.html = '<div class="ext-mb-icon  ext-mb-question"></div>' +
                '<div id="delegationRevocationMsg">#{msgs.cert_dialog_loading}</div>';

        this.callParent(arguments);
    },

    display: function (decision, certificationItem, certificationConfig){
    	this.callParent(arguments);
    },


    /**
     * Resets the dialog to it's default state
     */
    reset : function(){
        if (Ext.fly("delegationRevocationMsg")){
            Ext.fly("delegationRevocationMsg").dom.innerHTML = "#{msgs.cert_dialog_loading}";
        }
    },

     /**
     * Resets the dialog to it's default state
     */
    init : function(){

        var msgTpl = null;

        var theDecision = this.decision.oldDecision ? this.decision.oldDecision : this.decision;

        var messageIncludesDelegatee = false;
        if (this.decision.status == SailPoint.Decision.STATUS_UNDO_DELEGATION){
            // entity delegation revoke from the cert detail view using the undo button
            msgTpl = "#{msgs.revoke_entity_delegation_confirmation}";
            messageIncludesDelegatee = true;
        } else if (this.decision.isBulk()){
            if (this.decision.isEntityDecision()){
                // this means we're coming from the certification identity view and
                // are revoking an unknown number of delegations
                msgTpl = "#{msgs.bulk_revoke_entity_delegation_confirmation}";
            } else {
                // we're making a bulk decision from the detail or worksheet
                // view which will revoke some number of line-item delegations
            	msgTpl = "#{msgs.bulk_revoke_delegation_confirmation}";
            }
        } else {
            // Changing the decision on a single line item delegation
            msgTpl = "#{msgs.revoke_delegation_confirmation}";
            messageIncludesDelegatee = true;
        }

        // Check if the message displays a name, if so add it
        if (messageIncludesDelegatee){
            var url = "/rest/identities/" + SailPoint.Utils.encodeRestUriComponent(theDecision.recipient) + "/summary";
            Ext.Ajax.request({

                scope:{msgTpl:msgTpl, dialog:this},

                url: SailPoint.getRelativeUrl(url),

                success: function(response){

                    var respObj = Ext.decode(response.responseText);
                    var name = respObj && respObj.displayName;
                    if (respObj && (!name || name == ""))
                        name = respObj.name;

                    if (!name || name == ""){
                        name = "#{msgs.revoke_delegation_unknown_assignee}";
                    }

                    var messageHtml = Ext.String.format(this.msgTpl, name);
                    Ext.fly("delegationRevocationMsg").dom.innerHTML = messageHtml;

                    // this fires the initComplete event
                    SailPoint.certification.DelegationRevocationDialog.superclass.init.call(this.dialog);
                },

                failure: function(response){
                	Ext.getBody().unmask();
                    SailPoint.Decider.getInstance().gridIds.each(function(gridId){
                        var grid = Ext.getCmp(gridId);
                        grid.unmask();
                    });
                    SailPoint.FATAL_ERR_ALERT.call(this);
                }
            });
        } else {
            Ext.fly("delegationRevocationMsg").dom.innerHTML = msgTpl;
            this.callParent(arguments);
        }
    },

    /**
     * Validate the form. This is called before the dialog is submitted
     */
    validateForm : function(){
        return true;
    },

    /**
     * This is called by the Decider to get the decision record,
     * updated with any changes made by the user's input. In this
     * case we just want to pass the decision along unchanged.
     */
    getDecision : function(){
        this.decision.dialogState.push("DelegationRevocationDialog");
        var theDecision = this.decision.oldDecision ? this.decision.oldDecision : this.decision;
        if (theDecision.isEntityDecision()){
            this.decision.revokeEntityDelegation = true;
            // If we're clearing the decision (as opposed to revoking an entity delegation)
            // we should also clear any line item delegations.
            if (theDecision.isUndo())
                this.decision.revokeDelegation = true;
        } else {
            this.decision.revokeDelegation = true;
        }
        return this.decision;
    }
});


/**
  * Used by the Decider to either create a new instance or re-use an
  * existing one.
 */
SailPoint.certification.DelegationRevocationDialog.getInstance = function(){
    return SailPoint.certification.BaseDecisionDialog.baseGetInstance(
            SailPoint.certification.DelegationRevocationDialog,
                        {id:'delegationRevocationDialog'});
};