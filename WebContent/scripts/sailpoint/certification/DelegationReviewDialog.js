/**
 * This is the dialog we generate when a user chooses to
 * allow an exception.
 */
Ext.define('SailPoint.certification.DelegationReviewDialog', {
	extend : 'SailPoint.certification.BaseDecisionDialog',

    form:null,
	
	constructor : function(config) {
		var me = this;
		
		Ext.apply(this, {
			buttons : [
				{
	                text:"#{msgs.cert_delegation_review_button_accept}",
	                handler: function() {
	                    me.acceptDelegationReview();
	                }
	            },
	            {
	                text:"#{msgs.cert_delegation_review_button_reject}",
	                handler: function() {
	                    me.rejectDelegationReview();
	                }
	            },
	            {
	                text:"#{msgs.cert_delegation_review_button_cancel}",
                    cls : 'secondaryBtn',
	                handler: function() {
	                    me.cancel();
	                }
	            }
			]
		});
		
		this.callParent(arguments);
	},

    initComponent:function() {

        this.bodyStyle = "background-color:#FFF";
        this.setTitle("#{msgs.cert_delegation_review_title}");

        this.items = [
        	new Ext.Panel({html:"<div id='delegationReviewMsg' class='informationPanel' style='margin:10px'></div>", border:false,bodyBorder:false, bodyPadding: 5}),
            new Ext.Panel({html:"<div id='delegationReviewDetails'  style='margin:10px'></div>", border:false,bodyBorder:false, bodyPadding: 5})
        ];

        this.callParent(arguments);
    },

    // -----------------------------------------------------------------
    //
    //  Actions
    //
    // -----------------------------------------------------------------

    // -----------------------------------------------------------------
    //
    //  DIALOG LIFECYCLE
    //
    // -----------------------------------------------------------------

    /**
     * Resets the dialog to it's default state
     */
    reset : function() {

        this.setWidth(600);

        var delegationReviewMsgEl = Ext.get('delegationReviewMsg');
        if (delegationReviewMsgEl) {
        	delegationReviewMsgEl.setHTML('');
        	//delegationReviewMsgEl.setHeight(0);
        }
        
        var delegationReviewDetailsEl = Ext.get('delegationReviewDetails');
        if (delegationReviewDetailsEl) {
        	delegationReviewDetailsEl.setHTML('');
        	//delegationReviewDetailsEl.setHeight(0);
        }
        
        /*if (Ext.fly('delegationReviewMsg')) {
            Ext.fly('delegationReviewMsg').dom.innerHTML = '';
        }

        if (Ext.fly('delegationReviewDetails')) {
            Ext.fly('delegationReviewDetails').dom.innerHTML = '';
        }*/
    },


    init : function(){

        var id = this.decision.selectionCriteria.selections[0];
        var url = Ext.String.format("/rest/certification/item/{0}", id);

        Ext.Ajax.request({
            scope:this,
            url: SailPoint.getRelativeUrl(url),
            success: function(response){

                var respObj = Ext.decode(response.responseText).object;

                var delegation = respObj.entityDelegation ? respObj.entityDelegation : respObj.delegation;
                var delegationOwnerName = this.formatIdentityName(delegation.owner);

                var msg = "#{msgs.cert_decision_accept_delegate_simple_decision}";
                var formatted = Ext.String.format(msg, delegationOwnerName);

                Ext.fly('delegationReviewMsg').setHTML(formatted);

                var detailsHtml = "";

                if (respObj.additionalRoles && respObj.additionalRoles.length > 0){
                    var roleStr = "";
                    respObj.additionalRoles.each(function(item){
                        roleStr += "<li>"+item+"</li>";
                    });
                    detailsHtml += "<div class='delgationReviewDetail'><label>#{msgs.cert_decision_delegation_review_missing_roles}</label><ul>"+ roleStr+"</ul></div>";
                }

                if (respObj.comments && respObj.comments != ''){
                    detailsHtml += "<div class='delgationReviewDetail'><label>#{msgs.cert_decision_delegation_review_comments}</label><span>"+respObj.comments+"</span></div>";
                }

                if (detailsHtml != ''){
                    Ext.fly('delegationReviewDetails').setHTML(detailsHtml);
                }

              //  this.setHeight(this.items.get(0).getHeight() + this.items.get(1).getHeight() + 75);

                SailPoint.certification.DelegationReviewDialog.superclass.init.call(this);
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

    validateForm : function(){
        return true;
    },


    getDecision : function(){
        this.decision.dialogState.push("DelegationReviewDialog");

        return this.decision;
    }
});

/**
  * Used by the Decider to either create a new instance or re-use an
  * existing one.
 */
SailPoint.certification.DelegationReviewDialog.getInstance = function(){
    var dialog = SailPoint.certification.BaseDecisionDialog.baseGetInstance(
            SailPoint.certification.DelegationReviewDialog,
                        {id:'delegationReviewDialog'});
    return dialog;
};