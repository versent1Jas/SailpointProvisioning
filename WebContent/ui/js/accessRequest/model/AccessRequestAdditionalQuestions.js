'use strict';

/**
 * AccessRequestAdditionalQuestions is a model that contains any additional questions that
 * need to be asked (eg - account selection, assignment selection, etc...)
 */
angular.module('sailpoint.accessrequest').
    factory('AccessRequestAdditionalQuestions', ['AccessRequestItem', 'IdentityAccountSelection', 'AssignedRole',
    function(AccessRequestItem, IdentityAccountSelection, AssignedRole) {
        /**
         * Constructor.
         *
         * @param {Object} data  The raw data for the additional questions.
         *
         * @throws If data is null or not an object.
         */
        function AccessRequestAdditionalQuestions(data) {
            if (!angular.isObject(data)) {
                throw 'Data required in constructor.';
            }

            if (angular.isArray(data.permittedRoles)) {
                this.permittedRoles = data.permittedRoles.map(function(selection) {
                    return new AccessRequestItem(selection);
                });
            }
            

            if (angular.isArray(data.accountSelections)) {
                this.accountSelections = data.accountSelections.map(function(selection) {
                    return new IdentityAccountSelection(selection);
                });
            }
            this.status = data.status;

            if (angular.isArray(data.ambiguousAssignedRoles)) {
                this.ambiguousAssignedRoles = data.ambiguousAssignedRoles.map(function(assignedRole) {
                    return new AssignedRole(assignedRole);
                });
            }

            if(angular.isArray(data.invalidRequestees)) {
                this.invalidRequestees = data.invalidRequestees;
            } else if(data.invalidRequestees) {
                throw 'Expected invalidRequestees to be an array if defined';
            }
        }

        /**
         * Constant for the requestable object status.
         */
        AccessRequestAdditionalQuestions.STATUS_CURRENTLY_ASSIGNED = 'CURRENTLY_ASSIGNED';
        AccessRequestAdditionalQuestions.STATUS_PENDING_REQUEST = 'PENDING_REQUEST';
        AccessRequestAdditionalQuestions.STATUS_PROMPT_ROLE_ASSIGNMENT_SELECTION = 'PROMPT_ROLE_ASSIGNMENT_SELECTION';
        AccessRequestAdditionalQuestions.STATUS_INVALID_REQUESTEES  = 'INVALID_REQUESTEES';
        AccessRequestAdditionalQuestions.STATUS_BULK_ASSIGNED_OR_PENDING = 'BULK_ASSIGNED_OR_PENDING';

        /**
         * @property {Array<AccessRequestItem>} permittedRoles  The permitted
         *    roles that are available for selection.
         */
        AccessRequestAdditionalQuestions.prototype.permittedRoles = undefined;

        /**
         * @property {Array<IdentityAccountSelection>} accountSelections  The account selections
         *    required for this role.
         */
        AccessRequestAdditionalQuestions.prototype.accountSelections = undefined;

        /**
         * @property {String} The status of the request (can be null | CURRENTLY_ASSIGNED | PENDING)
         */
        AccessRequestAdditionalQuestions.prototype.status = undefined;

        /**
         * @property {Array<AssignedRole>} The list of ambiguous assigned roles that are available
         *                                 for selection.
         */
        AccessRequestAdditionalQuestions.prototype.ambiguousAssignedRoles = undefined;

        /**
         * @property {Array<String>} The list invalid identities for the request
         */
        AccessRequestAdditionalQuestions.prototype.invalidRequestees = undefined;

        return AccessRequestAdditionalQuestions;
    }]);
