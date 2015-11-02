'use strict';

/**
 * The AccessRequestItemsService handles listing access request items.
 */
/* jshint maxparams: 8 */
angular.module('sailpoint.accessrequest').
    factory('accessRequestItemsService',
        ['AccessRequestItem', 'CurrentAccessItem', 'AccessRequestAdditionalQuestions', 'RoleEntitlementResultDTO',
            'SP_CONTEXT_PATH', 'spHttpService', '$http', '$q',
    function (AccessRequestItem, CurrentAccessItem, AccessRequestAdditionalQuestions, RoleEntitlementResultDTO,
              SP_CONTEXT_PATH, spHttpService, $http, $q) {

        var accessRequestItemsService = {};

        /**
         * Return a promise that will resolve to a ListResult of
         * AccessRequestItems.
         *
         * @param {String} searchTerm    A possible-null string to search with.
         * @param {Object} filterValues  A possible-null object containing filter name/value pairs.
         * @param {int} startIdx         The zero-based start index.
         * @param {int} limit            The max number of results to return.
         * @param {String} requesteeId   ID of identity being targeted.  If more
         *    than one identity is being targeted, then do not specify this
         *    parameter at all.
         *
         * @return A promise that will resolve to a ListResult of access request
         *   items that contains an "objects" array of AccessRequestItem objects
         *   and a "count".
         */
        accessRequestItemsService.getAccessRequestItems = function (searchTerm, filterValues,
                                                                    startIdx, limit, requesteeId) {

            return accessRequestItemsService.getAccessItems(
                SP_CONTEXT_PATH + '/ui/rest/requestAccess/accessItems', AccessRequestItem,
                searchTerm, filterValues, startIdx, limit, requesteeId);
        };

        /**
         * Return a promise that will resolve to a ListResult of
         * CurrentAccessItems.
         *
         * @param {String} searchTerm    A possible-null string to search with.
         * @param {Object} filterValues  A possible-null object containing filter name/value pairs.
         * @param {int} startIdx         The zero-based start index.
         * @param {int} limit            The max number of results to return.
         * @param {String} requesteeId   ID of identity being targeted.  Must be non-null or exception is thrown.
         *
         * @return A promise that will resolve to a ListResult of current access
         *   items that contains an "objects" array of CurrentAccessItem objects
         *   and a "count".
         */
        accessRequestItemsService.getCurrentAccessItems = function (searchTerm, filterValues,
                                                                    startIdx, limit, requesteeId) {

            if (!requesteeId) {
                throw 'requesteeId is required!';
            }
            return accessRequestItemsService.getAccessItems(
                SP_CONTEXT_PATH + '/ui/rest/requestAccess/currentAccessItems', CurrentAccessItem,
                searchTerm, filterValues, startIdx, limit, requesteeId);
        };

        /**
         * Fetches any additional questions an access request might have.
         *
         * @param {AccessRequestItem} accessRequestItem The item to find additional questions for
         * @param {Array} identityIds The id's of the identities we are requesting for
         * @param {AccessRequestItem} permittedBy The item that permits the accessRequestItem
         * @param {String} assignmentId id of the role the request is assigned to
         * @param {Array<RequestedAccessItem>} otherAddedRoles Selections made for other request items
         * @returns {Promise} A promise that resolves to an AccessRequestAdditionalQuestions object
         */
        accessRequestItemsService.getAdditionalQuestions = function(accessRequestItem, identityIds,
                                                                    permittedBy, assignmentId, otherAddedRoles) {
            var url, data, otherRoleTransferObjects;
            if (!accessRequestItem) {
                throw 'accessRequestItem is required';
            }
            if (!identityIds) {
                throw 'identityIds are required';
            }

            if(otherAddedRoles) {
                otherRoleTransferObjects = [];
                otherAddedRoles.forEach(function(requestedAccessItem) {
                    var acctSelections = accessRequestItemsService.transformRequestedAccessItem(requestedAccessItem);
                    otherRoleTransferObjects.push({
                        id: requestedAccessItem.item.getId(),
                        permittedById: requestedAccessItem.permittedById,
                        accountSelections: acctSelections
                    });
                });
            }
            
            url = SP_CONTEXT_PATH + '/ui/rest/requestAccess/accessItems/' +
                accessRequestItem.id + '/additionalQuestions';
            data = {
                identityIds: identityIds,
                permittedById: permittedBy ? permittedBy.id : undefined,
                assignmentId: assignmentId,
                otherAddedRoles: otherRoleTransferObjects
            };
            
            if (!accessRequestItem) {
                throw 'access request item is required!';
            }
            
            return $http.post(url, data).then(function (response) {
                if(response.data) {
                    return new AccessRequestAdditionalQuestions(response.data);
                }
                return $q.reject('response contained no data');
            });
        };

        /**
         * Translate applications into a list of application ids
         * @param {Array} applications An array of applications or array of application ids.
         */
        function getApplicationIds(applications) {
            var applicationIds = [];

            /* If application has an id use that otherwise add application */
            angular.forEach(applications, function (application) {
                if(application.id) {
                    applicationIds.push(application.id);
                } else {
                    applicationIds.push(application);
                }

            });
            return applicationIds;
        }

        function getAttributeNames(attributes) {
            var attributeNames = [];

            angular.forEach(attributes, function (attribute) {
                if(attribute.attribute) {
                    attributeNames.push(attribute.attribute);
                }
            });
            return attributeNames;
        }

        /**
         * PRIVATE METHOD - DO NOT CALL DIRECTLY
         * Inner method that does the work of calling user access resource and converting results.
         * 
         * This method should be private but we put it on the service so we can unit test it directly. 
         */
        accessRequestItemsService.getAccessItems = function (url, returnType, searchTerm, filterValues,
                                       startIdx, limit, requesteeId) {
            var params = {
                start: startIdx,
                limit: limit,
                searchType: 'Keyword',
                query: searchTerm,
                identityId: requesteeId
            }, paramFilters, copyOfFilterValues;

            // If filters are supplied, convert them and add them to the params.
            if (filterValues) {
                //copy values so the original object is not altered
                copyOfFilterValues = angular.copy(filterValues);
                //Special handling: expect ID for ownerId instead of usual name
                if (copyOfFilterValues.ownerId && angular.isObject(filterValues.ownerId)) {
                    copyOfFilterValues.ownerId = copyOfFilterValues.ownerId.id;
                }
                if (angular.isArray(copyOfFilterValues.applicationIds)) {
                    copyOfFilterValues.applicationIds = getApplicationIds(copyOfFilterValues.applicationIds);
                }
                if (angular.isArray(copyOfFilterValues.attributes)) {
                    copyOfFilterValues.attributes = getAttributeNames(copyOfFilterValues.attributes);
                }
                paramFilters = spHttpService.convertQueryParams(copyOfFilterValues);
                angular.extend(params, paramFilters);
            }

            return $http.get(url, {
                params: params
            }).success(function (data) {
                    var newObjects = [];
                    // Convert the raw JSON in the objects array into access items.
                    if (data.objects) {
                        angular.forEach(data.objects, function (value, idx) {
                            newObjects.push(new returnType(value));
                        });
                        data.objects = newObjects;
                    }
                });
        };

        /**
         * Calls backend to validate uniqueness of account selections.  Returned promise is resolved
         * if not conflicts and rejected if there is conflict, an addedRole is not specified, or the
         * account selections span multiple identities
         *
         * @param {RequestedAccessItem} requestedAccessItem Requested Item account selection
         * @returns {HttpPromise|Promise} Resolves if no conflicts. Rejects with 409 if conflict, 500 if
         * an addedRole is not specified or the account selections span multiple identities
         */
        accessRequestItemsService.checkUniqueAssignment = function(requestedAccessItem) {

            var data = buildUniqueRequestData(requestedAccessItem),
                url, deferred;

            // These will be empty if we don't need to check for uniqueness.
            if (data.accountSelections.length > 0) {
                url = SP_CONTEXT_PATH + '/ui/rest/requestAccess/accessItems/' +
                    requestedAccessItem.item.id + '/checkUniqueAssignment';
                return $http.post(url, data);
            }

            // Nothing to check, so return a promise that resolves.
            deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
        };

        /**
         * Transform RequestedAccessItem into an array of AccessRequestAccountInfo compatible objects
         *
         * @param {RequestedAccessItem} requestedAccessItem Item to build request from
         * @param {boolean} skipCreates If true do not create transfer objects for create new accounts
         * @returns {Array} Transfer object compatible with AccessRequestAccountInfo
         */
        accessRequestItemsService.transformRequestedAccessItem = function(requestedAccessItem, skipCreates) {
            var transferObjects = [],
                isValid = true;
            /* We create a transfer object for each of the requestedAccessItem's accountSelections' provisioningTargets.
             * If any of the provisioning targets are for new accounts and skipCreates is true return an empty array. */
            if (angular.isArray(requestedAccessItem.accountSelections)) {
                requestedAccessItem.accountSelections.every(function (accountSelection) {
                    if (angular.isArray(accountSelection.provisioningTargets)) {
                        isValid = accountSelection.provisioningTargets.every(function (target) {
                            var accountInfo;
                            if (skipCreates && target.isCreateAccount()) {
                                return false;
                            } else {
                                accountInfo = target.getSelectedAccount();
                                if (accountInfo) {
                                    transferObjects.push({
                                        identityId: accountSelection.identityId,
                                        roleName: target.roleName,
                                        applicationName: target.applicationName,
                                        nativeIdentity: accountInfo.nativeIdentity,
                                        instance: accountInfo.instance
                                    });
                                } else if (target.isCreateAccount()) {
                                    transferObjects.push({
                                        identityId: accountSelection.identityId,
                                        roleName: target.roleName,
                                        applicationName: target.applicationName,
                                        nativeIdentity: 'new'
                                    });
                                }
                            }
                            return true;
                        });
                    }
                    return isValid;
                });
            }
            if(!isValid) {
                return [];
            }
            return transferObjects;
        };

        /**
         * Build request data for checkUniqueAssignment
         *
         * @param {RequestedAccessItem} requestedAccessItem Item to build request from
         * @returns {Object} Request data for checkUniqueAssignment
         */
        function buildUniqueRequestData(requestedAccessItem) {
            return {
                permittedById: requestedAccessItem.permittedById,
                accountSelections: accessRequestItemsService.transformRequestedAccessItem(requestedAccessItem, true),
                assignmentId: requestedAccessItem.assignmentId
            };
        }

        /**
         * Fetch simple entitlement details for given role id.
         *
         * @param accessItemId
         * @returns {HttpPromise} A promise that resolves with a RoleEntitlementResultDTO
         * @throws {string} if param is missing
         */
        accessRequestItemsService.getRoleEntitlements = function(accessItemId) {
            if (!accessItemId) {
                throw 'AccessItem ID required.';
            }
            return $http.get(SP_CONTEXT_PATH +
                    '/ui/rest/requestAccess/accessItems/' + accessItemId + '/simpleEntitlements')
                .then(function(response) {
                    return new RoleEntitlementResultDTO(response.data);
                });
        };

        return accessRequestItemsService;
    }]);
