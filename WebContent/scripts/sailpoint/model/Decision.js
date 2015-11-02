Ext.define('SailPoint.Decision', {

    constructor: function(config){
        Ext.apply(this, config);
        this.dialogState = [];
    },

    clone: function() {
        var newDecision = new SailPoint.Decision({
            id: this.id,
            certificationId: this.certificationId,
            workItemId: this.workItemId,
            gridIds: SailPoint.clone(this.gridIds),
            revokedRoles: SailPoint.clone(this.revokedRoles),
            readOnly: this.readOnly,
            assignedRole: this.assignedRole,
            status: this.status,
            itemType: this.itemType,
            entityId: this.entityId,
            entityDecision: this.entityDecision,
            decisionScope: this.decisionScope,
            selectionCriteria: this.selectionCriteria ? this.selectionCriteria.clone() : null,
            recipient: this.recipient,
            recipientDisplayName: this.recipientDisplayName,
            remediationDetails: SailPoint.clone(this.remediationDetails),
            description: this.description,
            comments: this.comments,
            mitigationExpirationDate: this.mitigationExpirationDate,
            mitigationExpiresNextCert: this.mitigationExpiresNextCert,
            provisionMissingRoles: this.provisionMissingRoles,
            revokeDelegation: this.revokeDelegation,
            revokeEntityDelegation: this.revokeEntityDelegation,
            revertAccountOp: this.revertAccountOp,
            saved: this.saved,
            entitlementViolationTree: this.entitlementViolationTree,
            missingRequiredRoles: this.missingRequiredRoles,
            custom: SailPoint.clone(this.custom),
            custom1: this.custom1,
            custom2: this.custom2,
            dialogState: [],
            challengeAction: this.challengeAction,
            challengeComments: this.challengeComments,
            dependantDecisions: this.dependantDecisions,
            sourceItemId: this.sourceItemId,
            dependantDecisionUndone: this.dependantDecisionUndone,
            bundleAssignmentId: this.bundleAssignmentId,
            selectedViolationEntitlements: SailPoint.clone(this.selectedViolationEntitlements)
        });

        return newDecision;
    },

    /**
    * ID used to simplify managements of lists of decisions. The ID may point to the
    * certification item ID, or it may be a generated ID.
    */
    id : null,

    certificationId : null,

    /**
     * ID of the work item IF this decision is part of a workitem
     */
    workItemId:null,

    /**
     * List of IDs pointing back to the EXT grids this decision came from. This allows
     * us to know which grid to update when a decision is saved.
     */
    gridIds: null,

    /**
     * True if the underlying item is an assigned role.
     */
    assignedRole : false,

    /**
     * True if this item is and assigned role that is missing required roles.
     * For these items, approvals should trigger a dialog which allows the user
     * to provision the missing roles.
     */
    missingRequiredRoles : false,

    /**
     * True if this decision is read-only.
     */
    readOnly : false,

    /**
    * Name of the action being performed. This value should match the name of the Action or
    * be a string indicating an challenge or delegation action.
    */
    status:null,

    /**
    * Type of record this decision was made on
    */
    itemType: null,

    /**
     * true if this is a entity decision
     */
    entityDecision : false,

    /**
     * When combined with entityDecision=true, should the selectionCriteria
     * target the items or the entity.
     */
    decisionScope: null,

    /**
     * Criteria used to select the items the decision has been made on.
     */
    selectionCriteria : null,

    /**
     * Identity selected to handle the decision, usually the remediator.
     */
    recipient : null,

    /**
     * Displa name of the identity selected to handle the decision, usually the remediator.
     */
    recipientDisplayName :  null,

    /**
     * Provisioning plan to be created for this action. NOTE -
     * this is null unless the user has modified the plan.
     */
    remediationDetails : null,

    /**
     * The SOD violation entitlement tree, stored here in case
     * the user edits a decision.
     */
    entitlementViolationTree : null,

    /**
     * Entitlements selected to be revoked for an Entitlement SOD Remediation
     */
    selectedViolationEntitlements : null,

    /**
     * Decision description
     */
    description : null,

    /**
    * Decision comments.
    */
    comments:null,

    /**
    * Custom attributes added to the decision by customer-specific
    * certification UI customizations.
    */
    custom : null,

    custom1 : null,

    custom2 : null,

    overwriteCustomFields : false,

    /**
     * Date this mitigation is to expire
     */
    mitigationExpirationDate : null,

    /**
     * True if the mitigation expires on next certification.
     * This creates a mitigiation that functions like an approval
     */
    mitigationExpiresNextCert : false,

    /**
     * True if the approver also wants any missing required roles provisioned.
     * This is only valid for assigned roles.
     */
    provisionMissingRoles:false,

    /**
     * List of names of permitted or required roles to be revoked along
     * with the remediation decision OR the roles selected to be removed in
     * an SOD violation.
     */
    revokedRoles : null,


    dependantDecisions : false,

    sourceItemId : null,

    // Set to true when the user has chosen to undo a decision
    // that was originally created on another item. This flag is set by
    // the DependantDecisionDialog.
    dependantDecisionUndone: false,

    /**
     * True if this decision includes the revocation of the an existing
     * delegation. This property is set when the user approves the delegation
     * revocation in the delegation revocation dialog.
     */
    revokeDelegation: false,

    /**
     * True if this decision includes the revocation of the an existing
     * entity delegation. This property is set when the user approves the delegation
     * revocation in the delegation revocation dialog.
     */
    revokeEntityDelegation: false,

    /**
     * True if a delegation will be revoked by this action.
     */
    requiresDelegationRevoke :false,

    /**
     * Valid account key if this decision will cause an account operation to be undone.
     */
    revertAccountOp : null,

    /**
     * True if this decision has been persisted to the server.
     */
    saved : false,

    /**
     * The existing decision on this item that we are overwriting
     */
    oldDecision : null,
    /**
     * Stores the history of the dialogs the user
     * has been through. Since we may need to cycle through several
     * dialogs to complete a decision, this helps us keep track of
     * what we've done.
     */
    dialogState : null,

    /**
     * ID of the entity delegation on this decision.
     */
    parentDelegationId : null,
    
    /**
     * The result of a challenge.
     */
    challengeAction: null,
    
    /**
     * The comments entered with the challenge decision.
     */
    challengeComments: null,

    /**
     * The bundle assignment id if this happens to be an assigned role decision
     */
     bundleAssignmentId: null,

    /**
     * Resets the dialogState. This is necessary if the
     * decision needs to be run through the decider
     * a second time, such as when editing an existing
     * decision.
     */
    reset : function(){
        this.dialogState = [];
    },

    isPolicyViolation : function(){
        return this.itemType == "PolicyViolation";
    },

    isDialogComplete : function(dialog){
        return this.dialogState.indexOf(dialog) > -1;
    },

    /**
     * Determines if the given status matches the status on this
     * decision. This works as you would expect, with the exception
     * that a Reassign is considered == to Delegated.
     */
    isStatusEquivalent : function(otherStatus){
        return this.status == otherStatus ||
                (this.status == SailPoint.Decision.STATUS_REASSIGN && otherStatus == SailPoint.Decision.STATUS_DELEGATED)
                || (this.status == SailPoint.Decision.STATUS_DELEGATED && otherStatus == SailPoint.Decision.STATUS_REASSIGN);
    },

    /**
     * Returns true if the user is changing a revoke account operation. If
     * so, we need to pop up a confirmation message. THis method also checks to see
     * if that dialog has already been shown.
     */
    isRequiresAccountOpConfirmation : function(){
        return this.oldDecision && this.oldDecision.isAccountOperation() &&
                !this.isDialogComplete("AccountOpConfirmationDialog");

    },

    hasDependantDecisions : function(){
        return this.dependantDecisions;
    },

    isUndo : function(){
        return this.status == SailPoint.Decision.STATUS_UNDO;
    },

    isDelegationUndo : function(){
        return this.status == SailPoint.Decision.STATUS_UNDO_DELEGATION;
    },

    isSaved : function(){
        return this.saved === true;
    },

    isChangingSavedDecision : function(){
        return this.oldDecision && this.oldDecision.isSaved();
    },

    isCanceled : function(){
        return this.status == SailPoint.Decision.STATUS_CANCEL;
    },

    isDelegationReviewDecision : function(){
        return this.status == SailPoint.Decision.STATUS_DELEGATION_REVIEW_REJECT ||
                        this.status == SailPoint.Decision.STATUS_DELEGATION_REVIEW_ACCEPT;
    },

    /**
     * True if the decision is a bulk delegation.
     */
    isBulkDelegation : function(){
        return this.isBulk() && this.status == SailPoint.Decision.STATUS_DELEGATED;
    },

    /**
     * True if the decision is a bulk delegation.
     */
    isBulkDelegationRevoke : function(){
        return this.isBulk() && 
          (this.status == SailPoint.Decision.STATUS_UNDO_DELEGATION);
    },

    isDelegationOrReassign : function(){
        return this.status == SailPoint.Decision.STATUS_DELEGATED || this.status == SailPoint.Decision.STATUS_REASSIGN;
    },

    isRequiresDelegationRevoke : function(){

        // this is a bit confusing.. In most cases when an item has an existing delegation, we need to warn when
        // the user makes a decision that they will be revoking an existing delegation. The exception is for
        // reassignments of line item delegations, which are not affected by the reassignement, so they need no
        // revocation dialog. Reassigning an entire identity will revoke the delegation, so in those cases we need
        // to show the delegation revoke dialog.
        return this.requiresDelegationRevoke || (!this.isReassign() && this.oldDecision &&
                this.oldDecision.status == SailPoint.Decision.STATUS_DELEGATED
                && this.oldDecision.isSaved());
    },
    
    isEntityDecision:function(){
        return this.entityDecision;
    },

    isBulk : function(){
        return this.isEntityDecision() || (this.selectionCriteria && this.selectionCriteria.isBulk());
    },

    isDependantItem : function(certItem){
        if (this.revokedRoles){
            return  this.revokedRoles.indexOf(certItem.getRoleName()) > -1;
        }

        if (this.selectedViolationEntitlements){
            var associatedItems = this.checkSelectedEntitlements(this.selectedViolationEntitlements);
            return   associatedItems.indexOf(certItem.getId()) > -1;
        }

        return false;
    },

    includes : function(certItem){

        var isIncluded = this.selectionCriteria && this.selectionCriteria.includesItem(certItem);

        var isSameEntity = this.entityId && certItem.getEntityId() === this.entityId;
        if (this.entityDecision && this.entityId && !isSameEntity) {
            isIncluded = false;
        }
        if (!isIncluded && isSameEntity){
            if (!isIncluded && this.isAccountOperation() && certItem.getAccountKey() 
                  && this.selectionCriteria.includesItem(certItem)) {
                isIncluded = true;
            }

            if (!isIncluded &&this.revokedRoles && certItem){
                isIncluded = this.revokedRoles.indexOf(certItem.getRoleName()) > -1;
            }

            // get violation entitlements selected for removal. If we're undoing an existing violation, check
            // the previous decision for entitlements.
            var selectedEntitlements = this.isUndo() && this.oldDecision ? this.oldDecision.selectedViolationEntitlements :
                    this.selectedViolationEntitlements;
            if (!isIncluded &&selectedEntitlements){
                var associatedItems = this.checkSelectedEntitlements(selectedEntitlements);
                isIncluded =  associatedItems.indexOf(certItem.getId()) > -1;
            }
        }

        return isIncluded && certItem.isDecisionAllowed(this);
    },

    unmatchedEntityDecision: function(decision) {
        return (Ext.isDefined(this.entityId) === Ext.isDefined(decision.entityId)) && (this.entityId !== decision.entityId);
    },

    checkSelectedEntitlements: function(entitlements) {
        var i, j, entitlement, statusItem, ids = [];
        if (entitlements && entitlements.length > 0) {
            for (i = 0; i < entitlements.length; i++) {
                entitlement = entitlements[i];
                if (entitlement.status && entitlement.status.length > 0) {
                    for (j = 0; j < entitlement.status.length; j++) {
                        statusItem = entitlement.status[j];
                        if (statusItem.associatedItemId) {
                            ids.push(statusItem.associatedItemId);
                        }
                    }
                }
            }
        }

        return ids;
    },

    /**
     * Check to see if the given item is dependant on this decision. This occurs
     * in cases like SOD violations where a decision on the violation causes decisions
     * on the roles or entitlements in the violation.
     *
     * We check to see if the current decision includes the item's ID and
     * we also check to make sure that the user hasn't already changed
     * the action on the item.
     *
     * @param certItem The item to check to see if it is dependant.
     * @param activeDecision The active decision on the item, or null.
     */
    isDependantDecision : function(certItem, activeDecision){

        var dependantDecisionUndone = activeDecision && activeDecision.dependantDecisionUndone;

        return certItem.getSourceItemId() && this.id == certItem.getSourceItemId()
                && !dependantDecisionUndone;
    },

    /**
     * In some cases a decision on one item may require undo another
     * bulk decision, such as an entity delegation. This method returns
     * true if this decision requires the decision on the given item to
     * be undone.
     */
    causesUndo : function(certItem, activeDecision){

        // If we're revoking a delegation, check to see if the ID of the parent
        // delegation matches. If so this item is included in the decision.
        if (this.isRequiresDelegationRevoke() && certItem.hasEntityDelegation() &&
                this.parentDelegationId == certItem.getParentDelegationId()){
            return true;
        }

        // If the operation will revert an account operation, compare the account on the
        // cert item to see if we have a match. An example of this would be is a user approved
        // an item that was previously a RevokeAccount decision.
        if (this.revertAccountOp && this.revertAccountOp == certItem.getAccountKey()){
            return true;
        }

        if (this.isDependantDecision(certItem, activeDecision)){
            return true;
        }

        return false;
    },




    remove : function(certItem){
        if (this.includes(certItem)){
            this.selectionCriteria.remove(certItem);
            return true;
        }

        return false;
    },

    getAffectedCount : function(){
        var cnt = 0;
        if (this.selectionCriteria  || this.isBulkDelegation()){
            if (this.isBulkDelegation() || this.selectionCriteria.selectAll){
                this.gridIds.each(function(gridId){
                    cnt += Ext.getCmp(gridId).getStore().getTotalCount();
                });
                if (this.selectionCriteria)
                    cnt  -= this.selectionCriteria.exclusions ? this.selectionCriteria.exclusions.length : 0;
            } else if (this.selectionCriteria.selections) {
                return this.selectionCriteria.selections.length;
            }
        }
        return cnt;
    },

    isReassign : function(){
        return this.status==SailPoint.Decision.STATUS_REASSIGN;
    },

    isAccountReassign : function(){
        return this.status==SailPoint.Decision.STATUS_REASSIGN_ACCT;
    },

    isAccountOperation : function(){
        var isAccountOp = this.status==SailPoint.Decision.STATUS_REVOKE_ACCT ||
                this.status==SailPoint.Decision.STATUS_REASSIGN_ACCT ||
                this.status==SailPoint.Decision.STATUS_APPROVE_ACCT;

        // If we're undoing an account operation, we'll need to undo this operation
        // on the other account items is applied to
        if (this.isUndo() && this.oldDecision && this.oldDecision.isAccountOperation()){
            isAccountOp = true;
        }

        return isAccountOp;
    },

    isRevokeAccount : function(){
        return this.status==SailPoint.Decision.STATUS_REVOKE_ACCT;
    },

    isApproved : function(){
        return this.status==SailPoint.Decision.STATUS_APPROVED;
    },

    isMitigated : function(){
        return this.status==SailPoint.Decision.STATUS_MITIGATED;
    },

    isRevoke : function(){
        return this.status==SailPoint.Decision.STATUS_REVOKE;
    },

    isEntityClassification : function(){
        return this.status==SailPoint.Decision.STATUS_ENTITY_CLASSIFICATION;
    },

    getAccountKeys : function(){
        return this.selectionCriteria && this.selectionCriteria.accountKeys;
    },

    addCustom : function(name, value){
        if (!this.custom){
            this.custom = {};
        }

        this.custom[name] = value;
    }
});

SailPoint.Decision.STATUS_UNDO ="Undo";
SailPoint.Decision.STATUS_REVOKE ="Remediated";
SailPoint.Decision.STATUS_REVOKE_ACCT ="RevokeAccount";
SailPoint.Decision.STATUS_APPROVE_ACCT ="ApproveAccount";
SailPoint.Decision.STATUS_REASSIGN_ACCT ="AccountReassign";
SailPoint.Decision.STATUS_APPROVED ='Approved';
SailPoint.Decision.STATUS_DELEGATED ='Delegated';
SailPoint.Decision.STATUS_UNDO_DELEGATION = "UndoDelegation";
SailPoint.Decision.STATUS_REASSIGN = "Reassign";
SailPoint.Decision.STATUS_MITIGATED = "Mitigated";
SailPoint.Decision.STATUS_DELEGATION_REVIEW_REJECT = "RejectDelegationReview";
SailPoint.Decision.STATUS_DELEGATION_REVIEW_ACCEPT = "AcceptDelegationReview";
SailPoint.Decision.STATUS_CLEARED = "Cleared";
// Cancel indicates that the user chose to cancel the decision
// from a decision dialog.
SailPoint.Decision.STATUS_CANCEL ="Cancel";
SailPoint.Decision.STATUS_ENTITY_CLASSIFICATION = "saveEntityCustomFields";

SailPoint.Decision.SCOPE_ITEM = "CertificationItem";
SailPoint.Decision.SCOPE_ENTITY = "CertificationEntity";
