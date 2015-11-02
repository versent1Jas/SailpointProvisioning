'use strict';

/**
 * The ApprovalService handles reading and managing approvals using the approval
 * REST services.
 */
angular.module('sailpoint.approval').
    factory('approvalService',
            ['$http', '$resource', 'spHttpService', 'RoleEntitlementResultDTO',
    function($http, $resource, spHttpService, RoleEntitlementResultDTO) {

        var approvalService = {};

        ////////////////////////////////////////////////////////////////////////
        //
        // Constants
        //
        ////////////////////////////////////////////////////////////////////////

        // Constants for the approval item decisions.
        approvalService.DECISION_APPROVED = 'Approved';
        approvalService.DECISION_REJECTED = 'Rejected';
        approvalService.DECISION_UNDO = null;

        ////////////////////////////////////////////////////////////////////////
        //
        // Fields
        //
        ////////////////////////////////////////////////////////////////////////
    
        // Cache the column configs after they are loaded
        approvalService.columnConfigs = {};
                 
        ////////////////////////////////////////////////////////////////////////
        //
        // Approval List Functions
        //
        ////////////////////////////////////////////////////////////////////////

        /**
         * Return a promise that will resolve to a ListResult of approvals.
         *
         * @param {Array} requestTypes   An array of the request types to return.
         * @param {int} startIdx         The zero-based start index.
         * @param {int} limit            The max number of results to return.
         * @param {SailPoint.util.SortOrder} sort  The sort order.
         *
         * @return A promise that will resolve to a ListResult of approvals that
         *   contains an "objects" array and a "count".
         */
        approvalService.getApprovals = function(requestTypes, startIdx, limit, sort) {

            return $http.get(SailPoint.CONTEXT_PATH + '/ui/rest/approvals/', {
                params: {
                    requestTypes: requestTypes,
                    start: startIdx,
                    limit: limit,
                    sort: (sort) ? sort.toJson() : null
                }
            });
        };

        /**
         * Will return the number of open approvals for the specified owner or the current logged in user
         * if owner is not specified
         * @param {Array} types Array of approval types
         * @param {string} [owner] The id of the owner of the approvals
         * @returns {Promise} Promise that will resolve to the number of open approvals for owner
         */
        approvalService.getApprovalCount = function (types, owner) {
            var httpConfig = {
                params: {
                    ownerId: owner,
                    requestTypes: types
                }
            };
            return $http.get(SailPoint.CONTEXT_PATH + '/ui/rest/approvals/count', httpConfig);
        };

        /**
         * Set the columnConfigs on the service
         * @param {Object} columnConfigs Object holding columnConfigs keyed by name
         */
        approvalService.setColumnConfigs = function(columnConfigs) {
            this.columnConfigs = columnConfigs;
        };

        /**
         * Get the cached columnConfigs 
         * @return {Object} Object holding columnConfigs keyed by name
         */
        approvalService.getColumnConfigs = function() {
            return this.columnConfigs;
        };

        ////////////////////////////////////////////////////////////////////////
        //
        // Approval Functions
        //
        ////////////////////////////////////////////////////////////////////////

        var approvalUrl =
            SailPoint.CONTEXT_PATH + '/ui/rest/approvals/:approvalId/:action',

            // We expect all of these params to be supplied by the caller.
            approvalParams = {
                approvalId: '@approvalId',
                action: '@action'
            },

            // The caller should handle 404's and 401's (for signing).
            errors = [ 404 ],
            esigErrors = [ 401, 404 ],

            // Define an Approval $resource that has methods deal with the item.
            Approval =
                $resource(approvalUrl, approvalParams, {
                    complete: { method: 'POST', params: { action: 'complete' }, handledErrors: errors },
                    sign: { method: 'POST', params: { action: 'complete' }, handledErrors: esigErrors },
                    checkSignature: { method: 'POST', params: { action: 'checkSignature' }, handledErrors: errors },
                    approveAll: { method: 'POST', params: { action: 'approveAll' }, handledErrors: errors },
                    rejectAll: { method: 'POST', params: { action: 'rejectAll' }, handledErrors: errors },
                    getForwardingHistory: {
                        method: 'GET',
                        isArray: true,
                        params: { action: 'ownerHistory' },
                        handledErrors: errors
                    },
                    forward: { method: 'POST', params: { action: 'forward' }, handledErrors: errors },
                    setPriority: { method: 'PATCH', handledErrors: errors },
                    getComments: {
                        method: 'GET',
                        params: { action: 'comments'},
                        handledErrors: errors,
                        isArray: true
                    },
                    addComment: {
                        method: 'POST',
                        params: { action: 'comments'},
                        handledErrors: errors
                    },
                    assign: {
                        method: 'POST',
                        params: { action: 'assign' },
                        handledErrors: errors
                    }
                });

        /**
         * Return an object with the HTTP parameters required by the Approval
         * resource.  Throw if the approvalId is null.
         */
        var getApprovalParams = function(approvalId) {
            if (!approvalId) {
                throw 'approvalId is required.';
            }
            return {
                approvalId: approvalId
            };
        };

        /**
         * Create an Approval $resource for the approval with the given ID.
         * Throw if the ID is not specified.
         */
        var createApproval = function(approvalId) {
            // Create an instance of the resource.
            return new Approval(getApprovalParams(approvalId));
        };

        /**
         * Complete the approval with the given ID, and return a promise.
         *
         * @param {String} approvalId  The ID of the work item to complete.
         *
         * @return {Promise} A $resource promise that will resolve if the call
         *    succeeds or reject if the call fails.
         */
        approvalService.complete = function(approvalId) {
            var approval = createApproval(approvalId);
            return approval.$complete();
        };

        /**
         * Return an object that has the given password and username (if
         * specified).
         */
        var getCredentials = function(password, username) {
            if (!password) {
                throw 'Password is required.';
            }

            var credentials = {
                signaturePassword: password
            };

            // Only send the username if it is specified.
            if (username) {
                credentials.signatureAccountId = username;
            }

            return credentials;
        };

        /**
         * Complete the approval with the given ID, and return a promise.
         *
         * @param {String} approvalId  The ID of the work item to complete.
         * @param {String} password    The password to authenticate.
         * @param {String} [username]  The name of the user to authenticate.
         *    This is not required if the user logged in without SSO.
         *
         * @return {Promise} A $resource promise that will resolve if the call
         *    succeeds or reject if the call fails.
         */
        approvalService.sign = function(approvalId, password, username) {
            var credentials = getCredentials(password, username),
                approval;

            // This uses the same complete URL, but passes credentials in the
            // request body.  We're calling a class method here, which returns
            // an instance of the approval rather than a promise.
            approval = Approval.sign(getApprovalParams(approvalId), credentials);

            // Get the promise off of the approval instance.
            return approval.$promise;
        };

        /**
         * Check if the given credentials are valid to sign this approval.
         *
         * @param {String} approvalId  The ID of the work item to check.
         * @param {String} password    The password to authenticate.
         * @param {String} [username]  The name of the user to authenticate.
         *    This is not required if the user logged in without SSO.
         *
         * @return {Promise} A $resource promise that will resolve with an
         *    object that contains success (boolean) and message (string).
         */
        approvalService.checkSignature = function(approvalId, password, username) {
            var credentials = getCredentials(password, username),
                approval;

            // This uses the same complete URL, but passes credentials in the
            // request body.  We're calling a class method here, which returns
            // an instance of the approval rather than a promise.
            approval = Approval.checkSignature(getApprovalParams(approvalId), credentials);

            // Get the promise off of the approval instance.
            return approval.$promise;
        };

        /**
         * Approve all items for the approval with the given ID and return a
         * promise.
         *
         * @param {String} approvalId  The ID of the work item to approve all.
         *
         * @return {Promise} A $resource promise that will resolve if the call
         *    succeeds or reject if the call fails.
         */
        approvalService.approveAll = function(approvalId) {
            var approval = createApproval(approvalId);
            return approval.$approveAll();
        };

        /**
         * Reject all items for the approval with the given ID and return a
         * promise.
         *
         * @param {String} approvalId  The ID of the work item to reject all.
         *
         * @return {Promise} A $resource promise that will resolve if the call
         *    succeeds or reject if the call fails.
         */
        approvalService.rejectAll = function(approvalId) {
            var approval = createApproval(approvalId);
            return approval.$rejectAll();
        };

        /**
         * @description
         * Will return the identity details of the requestee for the specified work item
         * @param {String} workItemId The id of the work item to get the requestee details of
         * @returns {Promise} Promise that will resolve an object hash with identity details
         */
        approvalService.getIdentityDetails = function(workItemId) {
            return $http.get(SailPoint.CONTEXT_PATH + '/ui/rest/approvals/' +
                workItemId + '/identityDetails');
        };

        /**
         * @description
         * Will return the violation details specified violation
         * @param {String} workItemId The id of the work item with the violation
         * @param {String} policyName The name of the policy violated
         * @param {String} ruleName The name of the rule violated
         * @returns {Promise} Promise that will resolve an object hash with the violation details
         */
        approvalService.getViolationDetails = function(workItemId, policyName, ruleName) {
            return $http.get(SailPoint.CONTEXT_PATH + '/ui/rest/approvals/' + workItemId + '/violations/' +
                spHttpService.encodeComponent(policyName) + '/' + spHttpService.encodeComponent(ruleName));
        };

        /**
         * Return an array that will be populated with the forwarding history
         * for the requested approval after the promise is resolved.  Each array
         * element contains the following:
         *
         *   previousOwner: The display name of the previous owner.
         *   newOwner: The display name of the new owner.
         *   date: A long with the date that the approval was forwarded.
         *   comment: A forwarding comment.
         *
         * @param {String} approvalId  The ID of the work item.
         *
         * @return {Array} An array of objects containing the forwarding history
         *    for the given work item.  This is resolved asynchronously and has
         *    a $promise and $resolved property.
         */
        approvalService.getForwardingHistory = function(approvalId) {
            return Approval.getForwardingHistory(getApprovalParams(approvalId));
        };

        /**
         * Forward the approval to another user
         *
         * @param {String} approvalId  The ID of the approval.
         * @param {String} target      The id of the identity to forward the approval to.
         * @param {String} comment     The optional comment associated with this forward.
         *
         * @return {Promise} A promise that will be resolved or rejected after the server response.
         */
        approvalService.forwardApproval = function(approvalId, target, comment) {
            var params = getApprovalParams(approvalId),
                body = { targetIdentity: target },
                approval;

            if (!target) {
                throw 'Target is required.';
            }

            //comment is optional so don't include in body unless it exists
            if (comment) {
                body.comment = comment;
            }

            // Use the "class" action so we can pass a body.
            approval = Approval.forward(params, body);

            // Class actions return an object with a promise on them.
            return approval.$promise;
        };

        /**
         * Set the priority of the given approval to the requested priority.  An
         * exception is thrown if approvalId or priority are null.
         *
         * @param {String} approvalId  The ID of the approval.
         * @param {String} priority    The new priority - High, Normal, or Low.
         *
         * @return {Promise} A promise that will be resolved or rejected.
         */
        approvalService.setPriority = function(approvalId, priority) {
            var params = getApprovalParams(approvalId),
                body = { priority: priority },
                approval;

            if (!priority) {
                throw 'Priority is required.';
            }

            // Use the "class" action so we can pass a body.
            approval = Approval.setPriority(params, body);

            // Class actions return an object with a promise on them.
            return approval.$promise;
        };

        /**
         * Return an array populated with comments for this approval. Each 
         * array element should contain:
         *   comment: comment text
         *   author: name of comment author
         *   date: long with date of the comment
         * @param {String} approvalId The ID of the approval
         * @returns {Array} An array of objects containing the comments
         *    for the approval.  This is resolved asynchronously and has
         *    a $promise and $resolved property.
         */
        approvalService.getComments = function(approvalId) {
            return Approval.getComments(getApprovalParams(approvalId));
        };

        /**
         * Add a comment to the approval.  An exception is thrown if approvalId 
         * or comment are null.
         *
         * @param {String} approvalId  The ID of the approval.
         * @param {String} comment    The new comment text
         *
         * @return {Promise} A promise that will be resolved or rejected.
         */
        approvalService.addComment = function(approvalId, comment) {
            var params = getApprovalParams(approvalId),
                body = { comment: comment },
                approval;
            
            if (!comment) {
                throw 'Comment is required';
            }

            // Use the "class" action so we can pass a body.
            approval = Approval.addComment(params, body);

            // Class actions return an object with a promise on them.
            return approval.$promise;
        };

        /**
         * Assign approval to a workgroup member. An exception is thrown if 
         * approvalId or assigneeId is null.
         * 
         * @param {String} approvalId The ID of the approval.
         * @param {String} assigneeId The ID of the Identity to assign work item
         * @returns {Promise} A promise that will be resolved or rejected
         */
        approvalService.assign = function(approvalId, assigneeId) {
            var params = getApprovalParams(approvalId),
                body = { targetIdentity: assigneeId },
                approval;
            
            // Use the "class" action so we can pass a body.
            approval = Approval.assign(params, body);

            // Class actions return an object with a promise on them.
            return approval.$promise;
        };


        ////////////////////////////////////////////////////////////////////////
        //
        // Approval Item Functions
        //
        ////////////////////////////////////////////////////////////////////////

        var approvalItemUrl =
            SailPoint.CONTEXT_PATH + '/ui/rest/approvals/:approvalId/items/:approvalItemId/:action',

            // We expect all of these params to be supplied by the caller.
            approvalItemParams = {
                approvalId: '@approvalId',
                approvalItemId: '@approvalItemId',
                action: '@action'
            },

            // The caller should handle 404's.
            itemErrors = [ 404 ],

            // Define an ApprovalItem $resource that has methods deal with the item.
            ApprovalItem =
                $resource(approvalItemUrl, approvalItemParams, {
                    approve: {
                        method: 'POST',
                        params: { action: 'approve' },
                        handledErrors: itemErrors
                    },
                    reject: {
                        method: 'POST',
                        params: { action: 'reject' },
                        handledErrors: itemErrors
                    },
                    undo: {
                        method: 'POST',
                        params: { action: 'undo' },
                        handledErrors: itemErrors
                    },
                    getDetails: {
                        method: 'GET',
                        params: { action: 'details' },
                        handledErrors: itemErrors
                    },
                    getTargetAccounts: {
                        method: 'GET',
                        isArray: true,
                        params: { action: 'targetAccounts' },
                        handledErrors: itemErrors
                    },
                    getComments: {
                        method: 'GET',
                        params: { action: 'comments'},
                        handledErrors: itemErrors,
                        isArray: true
                    },
                    addComment: {
                        method: 'POST',
                        params: { action: 'comments'},
                        handledErrors: itemErrors
                    },
                    setSunriseSunset: {
                        method: 'PATCH',
                        handledErrors: itemErrors
                    },
                    getRoleEntitlements: {
                        method: 'GET',
                        params: { action: 'simpleEntitlements' },
                        handledErrors: itemErrors
                    }
                });

        /**
         * Return an object that has the approval ID and item ID in it, and
         * throw if either is missing.
         */
        var getApprovalItemParams = function(approvalId, itemId) {
            if (!approvalId) {
                throw 'approvalId is required.';
            }
            if (!itemId) {
                throw 'itemId is required.';
            }

            return {
                approvalId: approvalId,
                approvalItemId: itemId
            };
        };

        /**
         * Create an ApprovalItem $resource for the item with the given IDs.
         * Throw if either ID is not specified.
         */
        var createApprovalItem = function(approvalId, itemId) {
            // Create an instance of the resource.
            return new ApprovalItem(getApprovalItemParams(approvalId, itemId));
        };

        /**
         * Approve the item with the given ID and return a promise.
         *
         * @param {String} approvalId   The ID of the approval work item.
         * @param {String} itemId       The ID of the approval item.
         *
         * @return {Promise} A Promise that resolves with success/failure.
         */
        approvalService.approveItem = function(approvalId, itemId) {
            var item = createApprovalItem(approvalId, itemId);
            return item.$approve();
        };

        /**
         * Reject the item with the given ID and return a promise.
         *
         * @param {String} approvalId   The ID of the approval work item.
         * @param {String} itemId       The ID of the approval item.
         *
         * @return {Promise} A Promise that resolves with success/failure.
         */
        approvalService.rejectItem = function(approvalId, itemId) {
            var item = createApprovalItem(approvalId, itemId);
            return item.$reject();
        };

        /**
         * Undo the item with the given ID and return a promise.
         *
         * @param {String} approvalId   The ID of the approval work item.
         * @param {String} itemId       The ID of the approval item.
         *
         * @return {Promise} A Promise that resolves with success/failure.
         */
        approvalService.undoItem = function(approvalId, itemId) {
            var item = createApprovalItem(approvalId, itemId);
            return item.$undo();
        };

        /**
         * An array that will be resolved with the target accounts for the item
         * with the given ID.  The array contains objects that each contain:
         *
         *   role: The name of the role
         *   application: The name of the application.
         *   account: The name of the account on the target application.
         *
         * @param {String} approvalId   The ID of the approval work item.
         * @param {String} itemId       The ID of the approval item.
         *
         * @return {Promise} A Promise that resolves with the target accounts.
         */
        approvalService.getItemTargetAccounts = function(approvalId, itemId) {
            return ApprovalItem.getTargetAccounts(getApprovalItemParams(approvalId, itemId));
        };

        /**
         * Return an array populated with comments for the approval item.
         * Each array element should contain:
         *   comment: comment text
         *   author: name of comment author
         *   date: long with date of the comment
         * @param {String} approvalId The ID of the approval
         * @param {String} itemId The ID of the approval item
         * @returns {Array} An array of objects containing the comments
         *    for the approval item.  This is resolved asynchronously and has
         *    a $promise and $resolved property.
         */
        approvalService.getItemComments = function(approvalId, itemId) {
            return ApprovalItem.getComments(getApprovalItemParams(approvalId, itemId));
        };
    
        /**
         * Add a comment to the approval item .  An exception is thrown if 
         * approvalId, itemId or comment are null.
         *
         * @param {String} approvalId  The ID of the approval.
         * @param {String} itemId The ID of the approval item
         * @param {String} comment    The new comment text
         *
         * @return {Promise} A promise that will be resolved or rejected.
         */
        approvalService.addItemComment = function(approvalId, itemId, comment) {
            var params = getApprovalItemParams(approvalId, itemId),
                body = { comment: comment },
                commentReturn;
    
            if (!comment) {
                throw 'Comment is required';
            }
    
            // Use the "class" action so we can pass a body.
            commentReturn = ApprovalItem.addComment(params, body);
    
            // Class actions return an object with a promise on them.
            return commentReturn.$promise;
        };

         /**
          * Returns an array that contains a message for each validation failure.
          *  validates
          *    - that if defined sunrise is today or later
          *    - that if defined sunset is today or later
          *    - that if both defined that sunrise is before or the same date as sunset
          *
          * @param {Object} dates Object hash with sunrise and sunset
          * @returns {Array} An array of validation error messages
          */
        function getSunriseValidationErrors(dates) {
            var today = new Date().setHours(0, 0, 0, 0),
                errors = [];
            if (dates.sunrise) {
                if (dates.sunrise < today) {
                    errors.push('Sunrise must be today or later');
                }
                if (dates.sunset) {
                    if (dates.sunset < dates.sunrise) {
                        errors.push('Sunrise must be before sunset');
                    }
                }
            }
            if (dates.sunset) {
                if (dates.sunset < today) {
                    errors.push('Sunset must be today or later');
                }
            }
            return errors;
        }

        /**
         * Update the approval item's sunrise and sunset dates
         * @param {String} approvalId The id of the approval
         * @param {String} itemId The id of the approval item
         * @param dates An object hash that contains sunrise and sunset as longs
         * @returns {Promise} A promise that resolves on successful save otherwise rejects
         * @throws {Array} An array of validation messages
         */
        approvalService.setSunriseSunset = function(approvalId, itemId, dates) {
            var params = getApprovalItemParams(approvalId, itemId),
                approvalItem,
                errors = getSunriseValidationErrors(dates);
            if(errors.length) {
                throw errors;
            }
            approvalItem = ApprovalItem.setSunriseSunset(params, {
                /* undefined values get removed deeper in ngResource null does not */
                sunrise: dates.sunrise || null,
                sunset: dates.sunset || null
            });
            return approvalItem.$promise;
        };

        /**
         * Gets all the simple entitlements associated with the role on an approval.
         *
         * @param {String} approvalId The id of the approval
         * @param {String} itemId The id of the approval item
         * @returns {Promise} A promise that resolves with a RoleEntitlementResultDTO
         * @throws {string} when param is missing
         */
        approvalService.getRoleEntitlements = function(approvalId, itemId) {
            if (!approvalId) {
                throw 'Approval ID required.';
            }
            if (!itemId) {
                throw 'AccessItem ID required.';
            }
            return ApprovalItem.getRoleEntitlements(getApprovalItemParams(approvalId, itemId))
                .$promise.then(function(response) {
                    return new RoleEntitlementResultDTO(response);
                });
        };

        return approvalService;
    }]);
