/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This class is the base certification decision dialog. Components
 * which generate a DecisionDialog expect a 'finish' event to fire
 * which should return a SailPoint.Decision object.
 */
Ext.define('SailPoint.certification.ChallengeDialog', {
	extend : 'SailPoint.certification.BaseDecisionDialog',
	
	constructor : function(config) {
		Ext.apply(this, {
			buttons : [
				{
	                text:"#{msgs.challenge_decision_dialog_button_save}",
	                parent:this,
	                handler: function() {
	                    this.parent.save();
	                }
	            },
	            {
	                text:"#{msgs.challenge_decision_dialog_button_cancel}",
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
	
    initComponent : function() {

       this.setTitle("#{msgs.challenge_decision_dialog_title}");

       Ext.apply(this, {
            width:750,
            height:480
       });

       this.form = new Ext.form.Panel({
            style:'padding:15px;background-color:#fff' ,
            labelWidth:150,
            border:false,
            bodyBorder:false,
            items:[
                new Ext.Panel({
                    id : 'challengeInstructionsCmp',
                    border:false, 
                    bodyBorder:false,
                    bodyCls: 'informationPanel',
                    html:''
                }),
                new SailPoint.form.PanelField ({
                    id : 'challengerComments',
                    fieldLabel: '#{msgs.challenge_decision_dialog_challenger_comments}',
                    cls:  'challengerComments',
                    fieldBodyCls: 'challengerCommentsField',
                    html:''
                }),
                new Ext.form.ComboBox({
                    fieldLabel:'#{msgs.label_challenge_decision}',
                    id:'challengeDecision',
                    store:[["Accept", "#{msgs.challenge_decision_dialog_option_accept}"],
                        ["Reject","#{msgs.challenge_decision_dialog_option_reject}"]]
                }),

                new Ext.form.TextArea({
                    id:'challengeComments',
                    fieldLabel:'#{msgs.challenge_decision_dialog_label_comments}',
                    name: 'challengeComments',
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

    //---------------------------------------------------------------
    //
    // BaseDecisionDialog method implementations
    //
    //---------------------------------------------------------------

    validateForm : function(){
        return true;
    },


    reset : function(){
        Ext.getCmp('challengeDecision').setValue('Accept');
        Ext.getCmp('challengeComments').setValue('');
	},


    init : function(){

        if (!this.certificationItem.getChallengeOwner()){
            this.loadChallengeInfo();
        } else {
            this.updateComments(this.certificationItem.getChallengeCompletionComments());
            this.updateInstructions(this.certificationItem.getChallengeOwnerDisplayName());
            SailPoint.certification.ChallengeDialog.superclass.init.apply(this);
        }

	},

    loadChallengeInfo : function(){

        var url = Ext.String.format("/rest/certification/item/{0}/challengeDetails", this.certificationItem.getId());

        Ext.Ajax.request({
            scope:this,
            url: SailPoint.getRelativeUrl(url),
            success: function(response){

                var respObj = Ext.decode(response.responseText).object;

                var owner = "";
                if (respObj.owner){
                    owner = respObj.owner.displayName;
                    if (!owner)
                        owner = respObj.owner.name;
                }

                this.updateComments(respObj.completionComments);
                this.updateInstructions(owner);
                SailPoint.certification.ChallengeDialog.superclass.init.call(this);
            },
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
    
    updateInstructions : function(owner) {
        var instructionsPanel = Ext.getCmp('challengeInstructionsCmp'),
            instructions = Ext.String.format("#{msgs.decision_was_challenged_by}", owner);
                
        if (instructionsPanel) {
            instructionsPanel.update(instructions);
        }
        
    },
    
    updateComments : function(comments) {
        var commentsField = Ext.getCmp('challengerComments'),
            comments = comments ? Ext.String.htmlEncode(comments) : "";
        if (commentsField) {
            commentsField.update(comments);
        }
    },


    getDecision : function(){

        var action = Ext.getCmp('challengeDecision').getValue();
        var comments = Ext.getCmp('challengeComments').getValue();

        this.decision.challengeComments = comments;
        this.decision.challengeAction = action;

        this.decision.showChallengeDialog = false;
        this.decision.dialogState.push("ChallengeDialog");

        return this.decision;
    }
});

/**
  * Used by the Decider to either create a new instance or re-use an
  * existing one.
 */
SailPoint.certification.ChallengeDialog.getInstance = function(){
    return SailPoint.certification.BaseDecisionDialog.baseGetInstance(
            SailPoint.certification.ChallengeDialog,
                        {id:'challengeDialog'});
};