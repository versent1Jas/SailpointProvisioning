/**
 * This is the dialog we generate when a user chooses to
 * allow an exception.
 */
Ext.define('SailPoint.certification.BulkCertificationConfirmationDialog', {
    extend: 'SailPoint.certification.BaseDecisionDialog',

    constructor: function(config) {
        Ext.apply(this, {
            buttons: [
                {
                    text: "#{msgs.button_continue}",
                    id: 'bulkContinueBtn',
                    parent: this,
                    handler: function() {
                        this.parent.save();
                    }
                },
                {
                    text: "#{msgs.button_cancel}",
                    id: 'bulkCancelBtn',
                    cls: 'secondaryBtn',
                    parent: this,
                    handler: function() {
                        this.parent.cancel();
                    }
                }
            ]
        });
        this.callParent(arguments);
    },

    initComponent: function() {

        this.title = "#{msgs.title_confirm_bulk_certification}";

        Ext.applyIf(this, {
            width: 400,
            height: 175
        });

        this.cls = "x-window-dlg";
        this.html = '<div class="ext-mb-icon  ext-mb-question"></div>#{msgs.inst_confirm_bulk_entity_action}';

        this.callParent(arguments);
    },

    display: function(decision, certificationItem, certificationConfig) {
        this.callParent(arguments);
    },

    /**
     * This is called by the Decider to get the decision record,
     * updated with any changes made by the user's input. In this
     * case we just want to pass the decision along unchanged.
     */
    getDecision: function() {
        this.decision.dialogState.push("BulkCertificationConfirmationDialog");
        return this.decision;
    }
});

/**
 * Used by the Decider to either create a new instance or re-use an
 * existing one.
 */
SailPoint.certification.BulkCertificationConfirmationDialog.getInstance = function() {
    return SailPoint.certification.BaseDecisionDialog.baseGetInstance(
        SailPoint.certification.BulkCertificationConfirmationDialog,
        {id: 'bulkCertificationConfirmationDialog'});
};