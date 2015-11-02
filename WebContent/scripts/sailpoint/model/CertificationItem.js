/**
 * This class is a wrapper around a certification grid record object.
 * This prevents client classes from having to know too much about
 * the structure of a record and instead rely on this API.
 */
Ext.define('SailPoint.CertificationItem', {

    // List of status allowed for this item. ie Delegated, Approved, etc.
    allowedStatuses:[],
    gridId : null,

    constructor: function(record, gridId){
        this.record = record;
        this.gridId = gridId;
        var decisionOptions = record.get('IIQ_decisionChoices');
        if (decisionOptions.decisions){
            var statuses = [];
            decisionOptions.decisions.each(function(decisionObj){
                statuses.push(decisionObj.status);
            });
            this.allowedStatuses = statuses;
        }
    },

    getId : function(){
        return this.record.getId();
    },

    getEntityId : function(){
        return this.record.get("parent-id");
    },

    getGridId : function(){
        return this.gridId;
    },

    getAccountKey : function(){
        var key = this.record.get('IIQ_accountKey');
        if (!key)
            key = this.record.get('accountKey');
        return key;
    },

    getRoleName : function(){
        return this.record.get('bundle');
    },

    isEditable : function(){
        return this.record.get('IIQ_decisionChoices').canChangeDecision;
    },

    getOwner : function(){
        return this.record.get('IIQ_decisionChoices').owner;
    },

    matchesKey : function(key){
        return this.getId() == key || this.getAccountKey() == key;
    },

    getItemType : function(){
        return this.record.get('type');
    },

    getDescription : function(){
        var desc = this.record.get('IIQ_description');
        if (!desc)
            desc = this.record.get('bundle');
        if (!desc)
            desc = this.record.get("violation-constraint");
        if (!desc)
            desc = this.record.get("exceptionEntitlements-application");
        return desc;
    },

    getWorkItemId : function(){
        return this.record.get('IIQ_decisionChoices').workItemId;
    },

    /**
     * Get the ID of the work item associated with the CertificationAction on this item.
     * This will be a remediation work item.
     */
    getActionWorkItemId : function(){
        return this.record.get('IIQ_decisionHistory') && this.record.get('IIQ_decisionHistory').actionWorkItem;
    },

    getParentDelegationId : function(){
        return this.record.get('IIQ_decisionChoices').parentDelegationId;
    },

    isPolicyViolation : function(){
        return this.record.get('type') == 'PolicyViolation';
    },

    isAssignedRole : function(){
        var roleDetails =  this.record.get("IIQ_roleDetails");
        var subType = this.record.get("subType"); // worksheet view
        return (subType == "AssignedRole" || (roleDetails && roleDetails.assignedRole));
    },

    isMissingRequiredRoles : function(){
        var roleDetails =  this.record.get("IIQ_roleDetails");
        var missingRequiredRoles = this.record.get("missingRequiredRoles"); // worksheet view
        return (missingRequiredRoles === true || (roleDetails && roleDetails.missingRequiredRoles));
    },

    getCurrentStatus : function(){
        return this.record.get('IIQ_decisionChoices').currentState
    },

    isDelegated : function(){
        return this.getCurrentStatus() == SailPoint.Decision.STATUS_DELEGATED;
    },

    isLineItemDelegated : function(){
        return this.isDelegated() && !this.hasEntityDelegation();
    },

    getRoleId : function(){
        return this.record.get('IIQ_roleDetails') ? this.record.get("IIQ_roleDetails").roleId :
                this.record.get('roleId');
    },

    getIdentityId : function(){
        return this.record.get('IIQ_roleDetails') ? this.record.get("IIQ_roleDetails").identityId :
                this.record.get('identityId');
    },

    hasEntityDelegation : function(){
        return this.record.get('IIQ_decisionChoices').entityDelegation;
    },

    hasDelegation : function(){
        return this.getCurrentStatus() == SailPoint.Decision.STATUS_DELEGATED || this.hasEntityDelegation();
    },

    getDecisions: function(){
        var decisionOptions = this.record.get('IIQ_decisionChoices');
        return decisionOptions.decisions;
    },

    isActionRequired: function(){
        var decisionOptions = this.record.get('IIQ_decisionChoices');
        return decisionOptions.actionRequired==true
    },

    isAllowAcknowledgement : function(){
        var actions = this.record.get('IIQ_decisionChoices');
        var allow = false;
        // the list of actions may be stored on the decisions property if we're in the detail view
        var actionList = actions.decisions ? actions.decisions : actions;
        if (actionList){
            actionList.each(function(item){
                if (item.value=='mitigateRadio' && item.allowAcknowledge && item.allowAcknowledge=='true'){
                    allow = true;
                }
            });
        }
        return allow;
    },

    getChallengeOwner : function(){
        var owner = null;

        if (this.record.get('IIQ_decisionHistory')){
            owner = this.record.get('IIQ_decisionHistory').challengeOwner;
        }

        return owner;
    },

    getChallengeOwnerDisplayName : function(){
        var owner = this.getChallengeOwner();
        var ownerName = "";
        if (owner){
          ownerName = owner.displayName ? owner.displayName : (owner.name ? owner.name : "");
        }

        return ownerName
    },

    getChallengeCompletionComments : function(){
        var comments = null;

        if (this.record.get('IIQ_decisionHistory')){
            comments = this.record.get('IIQ_decisionHistory').challengeCompletionComments;
        }

        return comments;
    },

    /**
     * Returns true if the given decision is allowed on this item. For example, an approval
     * is never allowed on a PolicyViolation.
     * @param decision SailPoint.Decision object
     */
    isDecisionAllowed : function(decision){
        if (decision == null || decision.status == null || decision.isCanceled() || decision.isUndo()
                || decision.isReassign() || decision.isAccountReassign() || decision.isDelegationReviewDecision()){
            return true;
        }

        // bulk delegations don't require that we have line item delegation enabled.
        // So don't bother checking the decisions in the column value.
        if (decision.isEntityDecision() && decision.status == SailPoint.Decision.STATUS_DELEGATED){
            return true;
        }

        return this.isStatusAllowed(decision.status);
    },

    /**
     * Get the identity who made the decision currently under review
     */
    getDelegationReviewOwner : function(){
        var decisionOptions = this.record.get('IIQ_decisionChoices');
        return decisionOptions.delegationReviewOwner;
    },

    /**
     * Returns true if the given decision is allowed on this item. For example, an approval
     * is never allowed on a PolicyViolation.
     * @param decision SailPoint.Decision object
     */
    isStatusAllowed : function(status){

        if (status == SailPoint.Decision.STATUS_UNDO || status == SailPoint.Decision.STATUS_UNDO_DELEGATION)
            return true;

        var found = false;
        this.allowedStatuses.each(function(val){
            if (val == status)
                found = true;
        });

        return found;
    },

    isEditable : function(){
        return this.record.get('IIQ_decisionChoices').canChangeDecision;
    },

    hasDependantDecisions : function(){
        return this.record.get('IIQ_decisionChoices').dependantDecisions;
    },

    getSourceItemId : function(){
        return this.record.get('IIQ_decisionChoices').sourceItemId
    }
});