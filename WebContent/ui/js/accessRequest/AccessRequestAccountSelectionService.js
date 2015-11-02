'use strict';

angular.module('sailpoint.accessrequest').
    factory('accessRequestAccountSelectionService',
        ['accessRequestDataService', 'accessRequestItemsService', 'IdentityAccountSelection',
         'spModal', 'SP_CONTEXT_PATH', '$q',
         function(accessRequestDataService, accessRequestItemsService, IdentityAccountSelection,
                  spModal, SP_CONTEXT_PATH, $q) {

        var accessRequestAccountSelectionService = {};

        /**
         * Launches the additional questions dialog with only account selections. Useful when editing selections 
         * after they have been initially made. Returns a promise that resolves if
         * all is good or fails if canceled.
         *
         * @param {RequestedAccessItem} requestedItem Item being requested
         * @returns {Promise} That resolves if account selections are made.  Rejects if dialog is canceled
         *
         * @throws If requestedItem is not defined
         */
        accessRequestAccountSelectionService.editAccountSelections = function(requestedItem) {
            var accessRequestItem, permittedById, assignmentId;
            if (!requestedItem) {
                throw 'requestedItem is required';
            }

            accessRequestItem = requestedItem.item;
            permittedById = requestedItem.permittedById;
            assignmentId = requestedItem.assignmentId;

            return getAccountSelectionsForEdit(requestedItem).then(function(selections) {
                return accessRequestAccountSelectionService.openDialog(accessRequestItem, selections,
                                                                       undefined, permittedById, assignmentId);
            });
        };

        /**
         * Return a Promise that is resolved with the account selections to be edited for the
         * given item.  This may load the selections from the REST endpoint if users have been
         * added to the request since the item was requested.
         *
         * @param {RequestedAccessItem} requestedItem  The item to get the selections for.
         *
         * @return {Promise<Array<IdentityAccountSelection>>} A promise that will be resolved
         *    with the account selections for the given item.
         */
        function getAccountSelectionsForEdit(requestedItem) {
            var deferred;

            // If there are potentially any new identities that have been added since the account
            // selections were loaded, load the account selections again.
            if (anyNewIdentities(requestedItem)) {
                return accessRequestItemsService.getAdditionalQuestions(
                    requestedItem.item,
                    accessRequestDataService.getIdentityIds(),
                    requestedItem.permittedById,
                    requestedItem.assignmentId,
                    accessRequestDataService.getOtherRequestedRoles(requestedItem.permittedById)
                ).then(function(additionalQuestions) {
                    // Peel the IdentityAccountSelections out of the questions and merge them.
                    return IdentityAccountSelection.mergeAccountSelections(requestedItem.accountSelections,
                                                                           additionalQuestions.accountSelections);
                });
            }

            // No new identities have been added, so just return the selections that have
            // already been loaded.
            deferred = $q.defer();
            deferred.resolve(requestedItem.accountSelections);
            return deferred.promise;
        }

        /**
         * Return if there are any requested identities that are not represented in the account
         * selections for the given requested item.
         *
         * @param {RequestedAccessItem} requestedItem  The item to check.
         *
         * @return {boolean} True if there are any identities may need account selection.
         */
        function anyNewIdentities(requestedItem) {
            var anyNew = true,
                allFound = false,
                acctSelIdentityIds = {};

            if (requestedItem.accountSelections) {
                // Create an object with the identities we found in the account selections.
                // Used for fast lookups.
                requestedItem.accountSelections.forEach(function(acctSel) {
                    acctSelIdentityIds[acctSel.getIdentityId()] = true;
                });

                // Look to see if all identities that have been requested also have account selections.
                allFound = accessRequestDataService.getIdentities().reduce(function(prev, identity) {
                    return prev && !!acctSelIdentityIds[identity.getId()];
                }, true);

                // If any don't have account selections, then there may be new identities.
                anyNew = !allFound;
            }

            return anyNew;
        }

        /**
         * Launches the additional questions dialog to handle role assignment and account selection.
         * Returns a promise that resolves with a result object containing accountSelections and assignmentId
         * if all is good, or rejects if canceled.
         *
         * @param {AccessRequestItem} accessRequestItem Item we are requesting
         * @param {Array<IdentityAccountSelection>} accountSelections Account selections that need to be made,
         *              or undefined.
         * @param {Array<AssignedRole>} ambiguousAssignedRoles Assigned roles to select from, or undefined.
         * @param {String} permittedById ID of role permitting this role, or undefined if not applicable.
         * @param {String} assignmentId Assignment ID for role assignment if applicable
         * @returns {Promise} Promise with result object containing optionally "assignmentId" and/or "accountSelections"
         * 
         * @throws If accessRequestItem is not defined, or neither accountSelections or ambiguousAssignedRoles are
         *          assigned.
         */
        accessRequestAccountSelectionService.openDialog = function(accessRequestItem, accountSelections,
                                                                   ambiguousAssignedRoles, permittedById,
                                                                   assignmentId) {
            
            if (!accessRequestItem) {
                throw 'accessRequestItem must be defined';
            }
            
            if (!accountSelections && !ambiguousAssignedRoles) {
                throw 'Either accountSelections and/or ambiguousAssignedRoles must be defined';
            }
            
            return spModal.open({
                id: 'accountSelectionDialog',
                title: 'ui_acct_select_title',
                templateUrl: SP_CONTEXT_PATH + '/ui/js/accessRequest/template/additional-questions-dialog.html',
                backdrop: 'static',
                autoFocus: true,
                controller: 'AdditionalQuestionsDialogCtrl as ctrl',
                resolve: {
                    accessRequestItem: function() {
                        return accessRequestItem;
                    },
                    accountSelections: function() {
                        return accountSelections;
                    },
                    ambiguousAssignedRoles: function() {
                        return ambiguousAssignedRoles;
                    },
                    permittedById: function() {
                        return permittedById;
                    },
                    assignmentId: function() {
                        return assignmentId;
                    }
                }
            }).result;
        };

        /**
         * Counts the number of account selections across all IdentityAccountSelection objects on
         * requestedItem, optionally only including items that are have selections.
         *
         * @param {RequestedAccessItem} requestedItem Item to count account selections on
         * @param {boolean} onlyComplete  If true, only completed selections are counted.
         *
         * @return {Number} count of account selections
         */
        function getAccountSelectionCount(requestedItem, onlyComplete) {
            var count = 0;

            if(angular.isArray(requestedItem.accountSelections)) {
                requestedItem.accountSelections.forEach(function(accountSelection) {
                    if(angular.isArray(accountSelection.provisioningTargets)) {
                        accountSelection.provisioningTargets.forEach(function(target) {
                            if (!onlyComplete || target.hasSelection()) {
                                count++;
                            }
                        });
                    }
                });
            }
            return count;
        }

        /**
         * Counts the number of account selections across all IdentityAccountSelection objects on
         * requestedItem.
         *
         * @param {RequestedAccessItem} requestedItem Item to count account selections on
         *
         * @return {Number} count of account selections
         */
        accessRequestAccountSelectionService.getTotalAccountSelectionCount = function(requestedItem) {
            return getAccountSelectionCount(requestedItem, false);
        };

        /**
         * Return the number of completed account selections across all IdentityAccountSelection
         * objects on requestedItem.
         *
         * @param {RequestedAccessItem} requestedItem Item to count account selections on
         *
         * @return {Number} The number of completed account selections.
         */
        accessRequestAccountSelectionService.getCompletedAccountSelectionCount = function(requestedItem) {
            return getAccountSelectionCount(requestedItem, true);
        };


        return accessRequestAccountSelectionService;
    }]);