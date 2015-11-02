'use strict';

angular.module('sailpoint.accessrequest').

/**
 * The RoleAssignmentSelectionStepHandler is a WizardDialogCtrl StepHandler that is
 * responsible for handling role assignment selection. It will return an assignment id in the 
 * promise on successful save.
 */
factory('RoleAssignmentSelectionStepHandler',
    ['$q', function($q) {

        /**
         * Constructor
         * @param {AccessRequestItem} accessRequestItem  The item being requested.
         * @param {Array<AssignedRole>} ambiguousAssignedRoles List of AssignedRole to choose from
         * 
         * @throws If accessRequestItem or ambiguousAssignedRoles is null
         */
        function RoleAssignmentSelectionStepHandler(accessRequestItem, ambiguousAssignedRoles) {

            // Validate the input.
            if (!accessRequestItem) {
                throw 'accessRequestItem is required';
            }
            if (!ambiguousAssignedRoles) {
                throw 'ambiguousAssignedRoles is required';
            }

            /**
             * @property {AccessRequestItem} accessRequestItem   The item that has been
             *    selected which requires role assignment selection
             */
            this.accessRequestItem = accessRequestItem;

            /**
             * @property {Array<AssignedRole>} ambiguousAssignedRoles  An array
             *    of assigned roles that are available for selection
             */
            this.ambiguousAssignedRoles = ambiguousAssignedRoles;

            /**
             * @property {AssignedRole} selectedRole The role that was selected
             */
            this.selectedRole = undefined;
        }

        // Implement the StepHandler interface.
        SailPoint.extend(RoleAssignmentSelectionStepHandler, SailPoint.widget.StepHandler);

        // Call StepHandler constructor
        RoleAssignmentSelectionStepHandler._super.call();
        

        ////////////////////////////////////////////////////////////////////////////
        //
        // Role Assignment Selection Implementation
        //
        ////////////////////////////////////////////////////////////////////////////
        
        RoleAssignmentSelectionStepHandler.prototype.selectRole = function(selectedRole) {
            this.selectedRole = selectedRole;
        };

        RoleAssignmentSelectionStepHandler.prototype.deselectRole = function() {
            this.selectedRole = undefined;
        };

        RoleAssignmentSelectionStepHandler.prototype.isRoleSelected = function(assignedRole) {
            return (this.selectedRole && this.selectedRole.assignmentId === assignedRole.assignmentId);
        };

        ////////////////////////////////////////////////////////////////////////////
        //
        // StepHandler Implementation
        //
        ////////////////////////////////////////////////////////////////////////////

        /**
         * Return the title of the dialog for the step.
         * @return {String} Title of dialog for the step
         */
        RoleAssignmentSelectionStepHandler.prototype.getTitle = function() {
            return 'ui_role_assignment_select_title';
        };

        /**
         * Return a unique ID for the step.  This can be used by the template to
         * conditionally render content based on the step, and is also used to key
         * the results in the step results object.
         * @return {String} Unique ID
         */
        RoleAssignmentSelectionStepHandler.prototype.getStepId = function() {
            return 'roleAssignmentSelect_' + this.accessRequestItem.id;
        };

        /**
         * Return whether the save button is disabled.
         * @return {Boolean} True if save button is disabled, otherwise false
         */
        RoleAssignmentSelectionStepHandler.prototype.isSaveDisabled = function() {
            return !this.selectedRole;
        };

        /**
         * Return a message key or label string for the save button.
         *
         * @param {boolean} isLastStep  Whether this is the last step currently in
         *    the wizard.
         *
         * @return {String} Label for the save button
         */
        RoleAssignmentSelectionStepHandler.prototype.getSaveButtonLabel = function(isLastStep) {
            return 'ui_button_continue';
        };

        /**
         * Save the current step
         * @return {Promise<AssignedRole>} A promise that is resolved with the result
         * upon successful save, and rejected if save failed (eg - validation errors).
         */
        RoleAssignmentSelectionStepHandler.prototype.save = function() {
            var deferred = $q.defer();
            if (this.selectedRole) {
                deferred.resolve(this.selectedRole.assignmentId);
            } else {
                deferred.reject();
            }
            return deferred.promise;
        };

        return RoleAssignmentSelectionStepHandler;
    }]);