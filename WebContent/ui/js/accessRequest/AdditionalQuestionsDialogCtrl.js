(function() {
    'use strict';

    /**
     * Construct an AdditionalQuestionsDialogCtrl (which extends WizardDialogCtrl).
     *
     * @param {AccessRequestItem} accessRequestItem  The item being requested.
     * @param {Array<IdentityAccountSelections>}  accountSelections  The account
     *     selections to be handled by this dialog.
     * @param {Array<AssignedRole>} ambiguousAssignedRoles The assigned roles that 
     *     need to be selected from for this role
     * @param {String} permittedById  The ID of the role that permits this item.
     * @param {String} assignmentId  The assignment ID 
     * @param {Object} $modalInstance  The modal instance.
     */
    /* jshint maxparams: 11 */
    function AdditionalQuestionsDialogCtrl(accessRequestItem, accountSelections, ambiguousAssignedRoles, permittedById,
                                           assignmentId, $modalInstance, AccountSelectionStepHandler,
                                           RoleAssignmentSelectionStepHandler, accessRequestDataService,
                                           accessRequestItemsService, $q) {

        ////////////////////////////////////////////////////////////////////////////
        //
        // PROPERTIES
        //
        ////////////////////////////////////////////////////////////////////////////

        /**
         * @property {AccessRequestItem} accessRequestItem   The item that has been
         *    selected.
         */
        this.accessRequestItem = accessRequestItem;

        /**
         * @property {String} permittedById Id of role permitting accessRequestItem
         */
        this.permittedById = permittedById;

        /**
         * @property {String} assignmentId Assignment Id
         */
        this.assignmentId = assignmentId;

        /**
         * @property {Array<IdentityAccountSelection>} accountSelections  An array
         *    of account selections that are to be handled by the dialog.
         */
        this.accountSelections = (accountSelections) ? accountSelections.map(function(value) {
            return value.clone();
        }) : undefined;

        /**
         * @property {Array<AssignedRole>} ambiguousAssignedRoles  An array
         *    of AssignedRoles for selecting role assignment
         */
        this.ambiguousAssignedRoles = angular.copy(ambiguousAssignedRoles);

        ////////////////////////////////////////////////////////////////////////////
        //
        // WIZARD DIALOG CTRL METHODS
        //
        ////////////////////////////////////////////////////////////////////////////

        /**
         * @return {Array<StepHandler>} The StepHandlers for the dialog.
         */
        this.createStepHandlers = function() {
            var handlers = [],
                handler;

            // If there are ambiguous assigned roles, create a handler for that
            if (this.ambiguousAssignedRoles) {
                handler = new RoleAssignmentSelectionStepHandler(this.accessRequestItem, this.ambiguousAssignedRoles);
                handlers.push(handler);
            }

            this.createAccountSelectionHandlers(handlers);

            return handlers;
        };

        /**
         * Create StepHandlers for IdentityAccountSelections set for the dialog
         * and add them to the passed array.
         * @param {Array<StepHandler>} handlers Array of StepHandler objects to 
         *     add account selection steps to.
         */
        this.createAccountSelectionHandlers = function(handlers) {
            var me = this,
                handler;

            // If there are account selections, create a handler per target.
            if (this.accountSelections) {
                this.accountSelections.forEach(function(acctSel) {
                    acctSel.getProvisioningTargets().forEach(function(target) {
                        handler = new AccountSelectionStepHandler(me.accessRequestItem, target, me.accountSelections,
                            me.permittedById, me.assignmentId);
                        handlers.push(handler);
                    });
                });
            }
        };

        /**
         * @return {Promise<Array<StepHandler>>} A promise that resolve to the updated StepHandlers.  
         *    This is required since we need to wait until role assignment selections are made until
         *    we determine if account selection is required.  If role assignment
         *    selection hasn't been made yet or is not required, resolve to null to
         *    just keep the original steps.
         */
        this.refreshStepHandlers = function() {
            var me = this,
                currentStep = this.getCurrentStep(),
                newSteps, promise, deferred;
            if (currentStep instanceof RoleAssignmentSelectionStepHandler) {
                this.assignmentId = this.stepResults[currentStep.getStepId()];

                promise = accessRequestItemsService.getAdditionalQuestions(this.accessRequestItem,
                        accessRequestDataService.getIdentityIds(), this.permittedById,
                        this.assignmentId, accessRequestDataService.getOtherRequestedRoles(permittedById))
                    .then(function(addtQuestions) {
                        // If returning account selections, or they were previously defined on controller
                        // (i.e. going back and forth between role and account selections), then refresh steps
                        if ((addtQuestions.accountSelections && addtQuestions.accountSelections.length) ||
                            (me.accountSelections)) {
                            me.accountSelections = addtQuestions.accountSelections;
                            // Make a new copy each time in case we have gone back and forth
                            newSteps = [me.getCurrentStep()];
                            me.createAccountSelectionHandlers(newSteps);
                        }
                        return newSteps;
                    });
            } else {
                deferred = $q.defer();
                deferred.resolve();
                promise = deferred.promise;
            }

            return promise;
        };

        /**
         * Implemented to collapse all of the separate step results from the multiple
         * account selection steps back into a single accountSelection result that
         * contains an array of the IdentityAccountSelections with the selected values.
         *
         * @return {Object} A nicer step result.
         */
        this.formatStepResults = function() {
            return {
                accountSelections: this.accountSelections,
                assignmentId: this.assignmentId
            };
        };

        /**
         * Check if we are doing role assignment selection. Useful for UI to display correct
         * page.
         * @returns {boolean} True if role assignment selection, otherwise false
         */
        this.isRoleAssignmentSelection = function() {
            return this.getCurrentStep() instanceof RoleAssignmentSelectionStepHandler;
        };

        /**
         * Check if we are doing account selection. Useful for UI to display correct
         * page.
         * @returns {boolean} True if role assignment selection, otherwise false
         */
        this.isAccountSelection = function() {
            return !this.isRoleAssignmentSelection();
        };

        // Call our parent, like a good subclass should.  Do this after the methods
        // have been defined since the parent constructor calls createStepHandlers().
        AdditionalQuestionsDialogCtrl._super.call(this, $modalInstance);
    }


    // Make this extend WizardDialogCtrl.
    SailPoint.extend(AdditionalQuestionsDialogCtrl, SailPoint.widget.WizardDialogCtrl);


    ////////////////////////////////////////////////////////////////////////////
    //
    // ANGULARJS REGISTRATION
    //
    ////////////////////////////////////////////////////////////////////////////

    angular.module('sailpoint.accessrequest').
        controller('AdditionalQuestionsDialogCtrl',
            ['accessRequestItem', 'accountSelections', 'ambiguousAssignedRoles', 'permittedById',
                'assignmentId', '$modalInstance', 'AccountSelectionStepHandler',
                'RoleAssignmentSelectionStepHandler', 'accessRequestDataService',
                'accessRequestItemsService', '$q',
                AdditionalQuestionsDialogCtrl]);
})();
