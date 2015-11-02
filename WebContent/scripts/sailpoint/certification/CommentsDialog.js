/**
 * This is the dialog we generate when comments for a particular
 * action are required.
 */
Ext.define('SailPoint.certification.CommentsDialog', {
	extend : 'SailPoint.certification.BaseDecisionDialog',

    form:null,
	
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
                    id:'commentCancelBtn',
                    cls : 'secondaryBtn',
	                parent:this,
                    handler: function() {
                        /* This is also an iOS safari thing.  Everything was
                         * going well but then when the dialog was closed
                         * sometimes the focus stayed on the comments field
                         * leaving the keyboard displayed.  Setting the
                         * focus to a non-input field to workaround -jw */
                        Ext.getCmp('commentCancelBtn').focus();
                        this.parent.cancel();
	                }
	            }
            ],
            defaultFocus: 'requiredComments',
            width: 450
        });
		this.callParent(arguments);
	},
	
    initComponent:function() {

        this.setHeight(200);

        this.setTitle("#{msgs.cert_title_comments_dialog}");

        this.form = new Ext.form.Panel({
            style:'padding:15px;background-color:#fff',
            border:false,
            bodyBorder:false,
            layout: 'fit',
            items:[
                {
                    xtype: 'container',
                    id : 'commentsDelegationReviewDetails',
                    border: false, bodyBorder:false, hidden:true,
                    html: "<div class='informationPanel' style='margin:20px'>#{msgs.cert_decision_accept_delegate_comments_decision}</div>"
                }, {
                    xtype: 'textarea',
                    id:'requiredComments',
                    fieldLabel:'#{msgs.label_comments}',
                    name: 'requiredComments',
                    allowBlank:false,
                    height:190,
                    padding: 5,
                    listeners: {
                        validitychange: function(field, isValid) {
                            if(SailPoint.Platform.isMobile()) {
                                if(!isValid) {
                                    Ext.getCmp('requiredComments').focus();
                                }
                            }
                        }
                    }
                }
            ]
        });

        this.items = [
        	this.form
        ];

        this.callParent(arguments);
    },

    /**
     * Resets the dialog with the current decision.
     */
    reset : function(){

        var comments = Ext.getCmp('requiredComments');
        /* Safari on iOS is a pain and this is the best solution I could come up with
         * for maintaining focus on the requiredComments field when this dialog is
         * displayed.  Toggle allow blank, validate, and then reset allowBlank.
         * When the field loses focus a validitychange event is fired.  In the listener
         * for that event we reset focus back to the comments field -jw */
        if(SailPoint.Platform.isMobile()) {
            comments.allowBlank = true;
            comments.validate();
            comments.allowBlank = false;
        }
        comments.setValue(this.decision.comments ? this.decision.comments : "");
        comments.setDisabled(this.isReadOnly);
        
        var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;

		// show the delegation review buttons if necessary
        if (this.decision.requiresDelegationReview){
            buttons.getAt(0).hide();
            buttons.getAt(1).show();
            buttons.getAt(2).show();
        } else {
            if (this.isReadOnly){
                buttons.getAt(0).hide();
            } else {
                buttons.getAt(0).show();
            }
            buttons.getAt(1).hide();
            buttons.getAt(2).hide();
        }
    },

    init : function(){

        this.baseInit();

        // show the delegation review buttons if necessary
        if (this.decision.requiresDelegationReview){
            this.showField(Ext.getCmp('commentsDelegationReviewDetails'));
        } else {
            this.hideField(Ext.getCmp('commentsDelegationReviewDetails'));
        }

        // If the decision has been saved, we must go to the server
        // to get the details
        if (this.decision.isSaved()){

            var id = this.decision.selectionCriteria.selections[0];
            var certId = this.decision.certificationId;
            var url = Ext.String.format("/rest/certification/item/{0}/{1}?workItemId={2}",  id,
                    this.decision.status, this.decision.workItemId);

            Ext.Ajax.request({
                scope:this,
                url: SailPoint.getRelativeUrl(url),
                success: function(response){

                    var respObj = Ext.decode(response.responseText);

                    var commentsInput = Ext.getCmp('requiredComments');
                    var comments = respObj.object.comments;
                    commentsInput.setValue(comments ? comments : "");
                    commentsInput.clearInvalid();
                    commentsInput.setDisabled(this.isReadOnly);

                    SailPoint.certification.CommentsDialog.superclass.init.call(this);
                },
                /**
                * Throws up a sys err msg. Note that this is not called when
                * success==false in the response, but if the call returns a 404 or 500.
                */
                failure: function(response){
                	SailPoint.certification.CommentsDialog.superclass.init.call(this);
                    SailPoint.FATAL_ERR_ALERT.call(this);
                }
            });
        }else {
            var comments = Ext.getCmp('requiredComments');
            comments.clearInvalid();
            this.callParent(arguments);
        }
    },

    /**
     * Validate the form. This is called before the dialog is submitted
     */
    validateForm : function(){
        var comments = Ext.getCmp('requiredComments'),
            valid = comments.validate();
        if(!valid) {
            comments.focus();
        }
        return valid;
    },

    /**
     * This is called to get the updated decision record,
     * updated with any changes made by the user's input.
     */
    getDecision : function(){

        var comments = Ext.getCmp('requiredComments').getValue();
        this.decision.comments = comments;
        this.decision.dialogState.push("CommentsDialog");

        return this.decision;
    }
});

/**
  * Used by the Decider to either create a new instance or re-use an
  * existing one.
 */
SailPoint.certification.CommentsDialog.getInstance = function(){
    var dialog = SailPoint.certification.BaseDecisionDialog.baseGetInstance(
            SailPoint.certification.CommentsDialog,
                        {id:'requiredCommentsDialog'});
    return dialog;
};