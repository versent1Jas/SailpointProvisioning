/**
 * This is the dialog we generate when a user chooses to
 * allow an exception.
 */
Ext.define('SailPoint.certification.BulkSelectionCountConfirmationDialog', {
	extend : 'SailPoint.certification.BaseDecisionDialog', 

    selectionCount : 0,
	
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

        this.title = "#{msgs.title_confirm_bulk_selection_count}";

        Ext.applyIf(this, {
            width:400,
            height:175
        });

        this.cls = "x-window-dlg";
        
        //This will set the html based on selection count.
        this.html = Ext.String.format('<div class="ext-mb-icon  ext-mb-question"></div><div id="bulkSelectionCountMsg">{0}</div>', this.getMessage());

        this.callParent(arguments);
    },

    display: function (decision, certificationItem, certificationConfig){
        SailPoint.certification.BulkSelectionCountConfirmationDialog.superclass.display.call(this, decision,
                certificationItem, certificationConfig);
    },

    /**
     * This is called by the Decider to get the decision record,
     * updated with any changes made by the user's input. In this
     * case we just want to pass the decision along unchanged.
     */
    getDecision : function(){
        this.decision.dialogState.push("BulkSelectionCountConfirmationDialog");
        return this.decision;
    },
    
    reset : function() {
        if (Ext.fly("bulkSelectionCountMsg")){
            Ext.fly("bulkSelectionCountMsg").dom.innerHTML = this.getMessage();
        }
    },
    
    getMessage : function() {
        return Ext.String.format('#{msgs.inst_confirm_bulk_selection_count}', this.selectionCount);
    },
    
    setSelectionCount : function(newCount) {
        this.selectionCount = newCount;
    }
});

/**
  * Used by the Decider to either create a new instance or re-use an
  * existing one.
 */
SailPoint.certification.BulkSelectionCountConfirmationDialog.getInstance = function(selectionCount){
    var dialog = SailPoint.certification.BaseDecisionDialog.baseGetInstance(
            SailPoint.certification.BulkSelectionCountConfirmationDialog,
                        {id:'bulkSelectionCountConfirmationDialog', selectionCount: selectionCount});
    dialog.setSelectionCount(selectionCount);
    return dialog;
};