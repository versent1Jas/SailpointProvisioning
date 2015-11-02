'use strict';

angular.module('sailpoint.accessrequest').

/**
 * The AccountSelectionStepHandler is a WizardDialogCtrl StepHandler that is
 * responsible for handling account selection, validation, and submitting.  Note
 * that this handler actually directly updates the ProvisioningTarget that is
 * passed into the constructor.  This means that the result returned in the save()
 * method isn't really necessary since we are updating the ProvisioningTarget that
 * the controller give us.
 */
factory('AccountSelectionStepHandler',
        ['RequestedAccessItem', 'accessRequestItemsService', '$q',
         function(RequestedAccessItem, accessRequestItemsService, $q) {


    /**
     * Constructor.
     * 
     * @param {AccessRequestItem} accessRequestItem  The item being requested.
     * @param {ProvisioningTarget} provisioningTarget  The target being selected.
     * @param {Array<IdentityAccountSelection>} accountSelections  All IdentityAccountSelections.
     * @param {String} permittedById  The ID of the permitting role.
     * @param {String} assignmentId  The ID of the role assignment.
     *
     * @throws If accessRequestItem, provisioningTarget, or accountSelections is null.
     */
    function AccountSelectionStepHandler(accessRequestItem, provisioningTarget, accountSelections,
                                         permittedById, assignmentId) {

        // Validate the input.
        if (!accessRequestItem) {
            throw 'accessRequestItem is required';
        }
        if (!provisioningTarget) {
            throw 'provisioningTarget is required';
        }
        if (!accountSelections) {
            throw 'accountSelections is required';
        }

        /**
         * @property {AccessRequestItem} accessRequestItem   The item that has been
         *    selected which requires account selection.
         */
        this.accessRequestItem = accessRequestItem;

        /**
         * @property {ProvisioningTarget} provisioningTarget  The provisioning target
         *    being selected.
         */
        this.provisioningTarget = provisioningTarget;

        /**
         * @property {IdentityAccountSelection} accountSelection  The identity account
         *    selection currently being selected.
         */
        this.accountSelection = findAccountSelectionWithTarget(accountSelections, provisioningTarget);

        /**
         * @property {Array<IdentityAccountSelection>} accountSelections  All account selections.
         */
        this.accountSelections = accountSelections;

        /**
         * @property {Number} The zero-based index of which identity the provisioning
         *    target is on.
         */
        this.identityIdx = this.accountSelections.indexOf(this.accountSelection);

        /**
         * @property {Number} The zero-based index of which application the provisioning
         *    target is on.
         */
        this.appIdx = this.accountSelection.getProvisioningTargets().indexOf(provisioningTarget);

        /**
         * @property {String} permittedById Id of role permitting accessRequestItem
         */
        this.permittedById = permittedById;

        /**
         * @property {String} assignmentId  The assignment ID of the role assignment.
         */
        this.assignmentId = assignmentId;

        /**
         * @property {Boolean} A flag that indicates whether the current identity has
         *    non-unique accounts selected for the item being requested.  This is
         *    calculated and set when moving to the next selection or applying if
         *    any non-unique assignments are found.
         */
        this.nonUniqueAssignmentError = false;
    }

    /**
     * Find the IdentityAccountSelection in the given array that contains the
     * given ProvisioningTarget.
     *
     * @param {Array<IdentityAccountSelection>} accountSelections  The account
     *     selections array to search in.
     * @param {ProvisioningTarget} provisioningTarget  The target to search for.
     *
     * @return {IdentityAccountSelection} The account selection with the given
     *     provisioning target.
     *
     * @throws If we can't find a unique account selection that matches.
     */
    function findAccountSelectionWithTarget(accountSelections, provisioningTarget) {
        var found = accountSelections.filter(function(acctSel) {
            return (acctSel.getProvisioningTargets().indexOf(provisioningTarget) > -1);
        });

        if (1 !== found.length) {
            throw 'Did not find account selection for provisioning target.';
        }

        return found[0];
    }

    // Implement the StepHandler interface.
    SailPoint.extend(AccountSelectionStepHandler, SailPoint.widget.StepHandler);


    ////////////////////////////////////////////////////////////////////////////
    //
    // GETTERS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * @return {Number} The total number of identities being processed.
     */
    AccountSelectionStepHandler.prototype.getTotalIdentities = function() {
        return this.accountSelections.length;
    };


    ////////////////////////////////////////////////////////////////////////////
    //
    // ACCOUNT SELECTION METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Clear the selection for the current target.
     */
    AccountSelectionStepHandler.prototype.clearSelection = function() {
        this.provisioningTarget.clear();
    };

    /**
     * Select the given account for the current target.
     *
     * @param {AccountInfo} account  The account to select.
     */
    AccountSelectionStepHandler.prototype.selectAccount = function(account) {
        this.provisioningTarget.selectAccount(account);
    };

    /**
     * Return whether the given account is selected.
     *
     * @param {AccountInfo} account  The account to check.
     *
     * @return {Boolean} True if the given account is selected.
     */
    AccountSelectionStepHandler.prototype.isAccountSelected = function(account) {
        var selected = this.provisioningTarget.getSelectedAccount();
        return (selected && selected.equals(account));
    };

    /**
     * Select to create a new account.
     */
    AccountSelectionStepHandler.prototype.selectCreateAccount = function() {
        this.provisioningTarget.setCreateAccount(true);
    };

    /**
     * @return {Boolean} Whether the create new account option is selected.
     */
    AccountSelectionStepHandler.prototype.isCreateAccountSelected = function() {
        return this.provisioningTarget.isCreateAccount();
    };


    ////////////////////////////////////////////////////////////////////////////
    //
    // HELPER METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * @return {Boolean} Whether there are more targets on the current identity.
     */
    AccountSelectionStepHandler.prototype.hasMoreTargetsOnCurrentIdentity = function() {
        return (this.appIdx < this.accountSelection.getProvisioningTargets().length-1);
    };

    /**
     * If the current target is the last target for the given identity, validate
     * that the selections are a unique assignment.  Return a promise that is
     * resolved if the accounts are unique (or do not need to be checked), and
     * rejects and sets an error flag if they are not unique.
     *
     * @return {Promise} A promise that will resolve if a unique assignment was
     *    not checked (due to not being a role or not being on the last target
     *    for an identity) or if the assignment is unique, and rejects otherwise.
     */
    AccountSelectionStepHandler.prototype.validateUniqueAssignment = function() {
        var me = this,
            promise, deferred, requestedItem;

        // Only do this on the last target for an identity if item is a role.
        if (!this.hasMoreTargetsOnCurrentIdentity() && this.accessRequestItem.isRole()) {
            // Create a requested item with the account selections for the current identity.
            requestedItem = new RequestedAccessItem(this.accessRequestItem);
            requestedItem.accountSelections = [ this.accountSelection ];
            requestedItem.permittedById = this.permittedById;
            requestedItem.assignmentId = this.assignmentId;

            // Check if this is a unique assignment.
            promise = accessRequestItemsService.checkUniqueAssignment(requestedItem);

            // Set (or reset) the error flag appropriately.
            promise.then(function() {
                    me.nonUniqueAssignmentError = false;
                },
                function(result) {
                    me.nonUniqueAssignmentError = true;
                });
        }
        else {
            // We don't need to check, so clear the error flag and return a promise
            // that resolves.
            this.nonUniqueAssignmentError = false;

            deferred = $q.defer();
            promise = deferred.promise;
            deferred.resolve();
        }

        return promise;
    };


    ////////////////////////////////////////////////////////////////////////////
    //
    // STEP HANDLER INTERFACE
    //
    ////////////////////////////////////////////////////////////////////////////

    AccountSelectionStepHandler.prototype.getTitle = function() {
        return 'ui_acct_select_title';
    };

    AccountSelectionStepHandler.prototype.getStepId = function() {
        return 'accountSelection_' + this.identityIdx + '-' + this.appIdx;
    };

    AccountSelectionStepHandler.prototype.isSaveDisabled = function() {
        // Require a selection before we enable the next/save button.
        return !this.provisioningTarget.hasSelection();
    };

    AccountSelectionStepHandler.prototype.getSaveButtonLabel = function(isLastStep) {
        // If on the last step, just return "Apply".
        if (isLastStep) {
            return 'ui_acct_select_apply';
        }

        // Otherwise, not on the last step, so return "Next X".
        return (this.hasMoreTargetsOnCurrentIdentity()) ?
            'ui_acct_select_next_app_button' :
            'ui_acct_select_next_identity_button';
    };

    /**
     * @return {Promise<ProvisioningTarget>} A promise that resolves with the
     *    updated ProvisioningTarget, or rejects if validation fails.  Note that
     *    this handler actually updates the ProvisioningTarget that was passed
     *    into the constructor, so the caller doesn't really need this.
     */
    AccountSelectionStepHandler.prototype.save = function() {
        var me = this;

        // Return the validation promise that will resolve with the result.
        return this.validateUniqueAssignment().then(function(result) {
            return me.provisioningTarget;
        });
    };


    return AccountSelectionStepHandler;
}]);
