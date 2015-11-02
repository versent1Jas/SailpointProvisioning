/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

/**
 * @author: michael.hide
 * Created: 9/24/14 2:17 PM
 */

angular.module('sailpoint.accessrequest').
    factory('accessRequestReviewService',
            [ 'SP_CONTEXT_PATH', '$http', '$q', 'accessRequestItemsService',
    function(SP_CONTEXT_PATH, $http, $q, accessRequestItemsService) {

        var accessRequestReviewService = {},
            BASE_URL = SP_CONTEXT_PATH + '/ui/rest/requestAccess';

        /**
         * Submits a POST request to add/remove items from selected users.
         *
         * @param identities {Array} Array of identities to make requests for
         * @param itemsToAdd {Array<RequestedAccessItem>} Array of RequestedAccessItem(s) to add to identities
         * @param itemsToRemove {Array<CurrentAccessItem>} Array of CurrentAccessItem(s) to remove from identities
         * @param priority {String} The priority to set on the request (if it isn't null)
         * @returns {HttpPromise}
         */
        accessRequestReviewService.submitAccessRequestItems =
            function(identities, itemsToAdd, itemsToRemove, priority) {
            var rolesToAdd = [],
                rolesToRemove = [],
                entitlementsToAdd = [],
                entitlementsToRemove = [],
                isRole = function(item) {
                    return item.getAccessType() === SailPoint.accessRequest.AccessRequestItem.ACCESS_TYPE_ROLE;
                },
                isEntitlement = function(item) {
                    return item.getAccessType() === SailPoint.accessRequest.AccessRequestItem.ACCESS_TYPE_ENTITLEMENT;
                };

            // Separate the items according to accessType and add their ids
            angular.forEach(itemsToAdd, function(requestedItem) {
                var accessItem = requestedItem.item,
                    // Transform the accountSelections into the server side equivalent
                    transformedSelections = accessRequestItemsService.transformRequestedAccessItem(requestedItem);
                //only send if there are selections
                if (transformedSelections.length < 1) {
                    //null out so it's not sent with the request
                    transformedSelections = null;
                }
                if (isRole(accessItem)) {
                    rolesToAdd.push({
                        id: accessItem.getId(),
                        permittedById: requestedItem.permittedById,
                        comment: requestedItem.getComment(),
                        assignmentNote: requestedItem.getAssignmentNote(),
                        sunrise: requestedItem.getSunriseDate() ? requestedItem.getSunriseDate().getTime() : null,
                        sunset: requestedItem.getSunsetDate() ? requestedItem.getSunsetDate().getTime() : null,
                        accountSelections: transformedSelections,
                        assignmentId: requestedItem.getAssignmentId()
                    });
                }
                else if (isEntitlement(accessItem)) {
                    entitlementsToAdd.push({
                        id: accessItem.getId(),
                        comment: requestedItem.getComment(),
                        sunrise: requestedItem.getSunriseDate() ? requestedItem.getSunriseDate().getTime() : null,
                        sunset: requestedItem.getSunsetDate() ? requestedItem.getSunsetDate().getTime() : null,
                        accountSelections: transformedSelections
                    });
                }
            });

            // Removed items are instances of CurrentAccessItem
            angular.forEach(itemsToRemove, function(item) {
                var entitlementToRemove;
                if (isRole(item)) {
                    rolesToRemove.push({
                        roleId: item.getId(),
                        assignmentId: item.getAssignmentId(),
                        comment: item.getComment(),
                        roleLocation: item.getRoleLocation()
                    });
                }
                else if(isEntitlement(item)) {
                    entitlementToRemove = {
                        id: item.getId(),
                        instance: item.getInstance(),
                        comment: item.getComment(),
                        nativeIdentity: item.getNativeIdentity()
                    };
                    // If we don't have an id (due to no ManagedAttribute),
                    // we need to add additional fields to be able to identify the exception
                    if (!item.getId()) {
                        angular.extend(entitlementToRemove, {
                            application: item.getApplication(),
                            attribute: item.getAttribute(),
                            value: item.getValue()
                        });
                    }
                    entitlementsToRemove.push(entitlementToRemove);
                }
            });

            /**
             * These key names need to match up with sailpoint.web.accessrequest.AccessRequest constants:
             * AccessRequest.IDENTITIES
             * AccessRequest.ADDED_ROLES
             * AccessRequest.REMOVED_ROLE_ASSIGNMENTS
             * AccessRequest.ADDED_ENTITLEMENTS
             * AccessRequest.REMOVED_ENTITLEMENTS
             *
             * @type {{identities: Array, addedRoles: Array, removedRoleAssignments: Array,
             *         addedEntitlements: Array, removedEntitlements: Array}}
             */
            var data = {
                identities: SailPoint.util.getIdList(identities),
                addedRoles: rolesToAdd,
                removedRoles: rolesToRemove,
                addedEntitlements: entitlementsToAdd,
                removedEntitlements: entitlementsToRemove,
                priority: priority
            };

            return $http.post(BASE_URL, data, {
                handledErrors: [ 400 ]
            }).then(null, function(response) {
                return $q.reject(response);
            });
        };

        return accessRequestReviewService;
    }]);
