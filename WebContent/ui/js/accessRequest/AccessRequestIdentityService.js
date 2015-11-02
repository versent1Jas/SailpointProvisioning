'use strict';

/**
 * The AccessRequestIdentityService handles listing identities for which access
 * can be requested.
 */
angular.module('sailpoint.accessrequest').
    factory('accessRequestIdentityService',
    ['AccessRequestIdentity', 'SP_CONTEXT_PATH', 'spHttpService', '$http',
    function(AccessRequestIdentity, SP_CONTEXT_PATH, spHttpService, $http) {

        /**
         * Convenience function for setting up the post parameters for hitting the RequestPopulationResource
         * @param {String} name   A possibly-null name to identity name to filter by.
         * @param {Object} filters  An optional object mapping a property name to a
         *                          value to filter by.
         * @param {int} startIdx  The zero-based start index.
         * @param {int} limit     The max number of results to return.
         * @returns {{start: *, limit: *, name: *}}
         */
        function initParameters(name, filters, startIdx, limit) {
            var params = {
                name: name
            };

            if (startIdx) {
                params.start = startIdx;
            }
            if (limit) {
                params.limit = limit;
            }

            // If filters are supplied, convert them and add them to the params.
            if (filters) {
                filters = spHttpService.convertQueryParams(filters);
                angular.extend(params, filters);
            }

            return params;
        }

        /**
         * Converts the raw JSON into AccessRequestIdentity objects
         * @param data The response from the REST call
         * @returns {Object} modified response object containing AccessRequestIdentities
         */
        function createAccessRequestIdentities(data) {
            if (data && data.objects) {
                var newObjects = [];
                angular.forEach(data.objects, function(value) {
                    newObjects.push(new AccessRequestIdentity(value));
                });
                data.objects = newObjects;
            }
            return data;
        }

        var accessRequestIdentityService = {},
            BASE_URL = SP_CONTEXT_PATH + '/ui/rest/requestAccess/';

        /**
         * Return a promise that will resolve to a ListResult of identities.
         *
         * @param {String} name   A possibly-null name to identity name to filter by.
         * @param {Object} filters  An optional object mapping a property name to a
         *                          value to filter by.
         * @param {int} startIdx  The zero-based start index.
         * @param {int} limit     The max number of results to return.
         *
         * @return {HttpPromise} A promise that will resolve to a ListResult of identities that
         *   contains an "objects" array of AccessRequestIdentity objects and a
         *   "count".
         */
        accessRequestIdentityService.getIdentities = function(name, filters, startIdx, limit) {
            return $http.get(BASE_URL + 'identities', {
                params: initParameters(name, filters, startIdx, limit),
                transformResponse: $http.defaults.transformResponse.concat([createAccessRequestIdentities])
            });
        };

        /**
         * Return a promise that will resolve to a ListResult of identity ids/displaynames (Object)
         *
         * @param {String} name   A possibly-null name to identity name to filter by.
         * @param {Object} filters  An optional object mapping a property name to a
         *                          value to filter by.
         *
         * @return {HttpPromise} A promise that will resolve to a ListResult of identity ids/names that
         *   contains an "objects" array of Objects and a "count".
         */
        accessRequestIdentityService.getAllIdentities = function(name, filters) {
            return $http.get(BASE_URL + 'identityIdNames', {
                params: initParameters(name, filters),
                transformResponse: $http.defaults.transformResponse.concat([createAccessRequestIdentities])
            });
        };

        /**
         * @description
         * Returns the identity details of the specified identity
         * @param {String} identityId The id of the identity
         * @returns {HttpPromise} Promise that will resolve an object hash with identity details
         */
        accessRequestIdentityService.getIdentityDetails = function(identityId) {
            return $http.get(BASE_URL + 'identities/' + identityId);
        };

        /**
         * @description
         * Returns the paged list of all the selected identities (full identity)
         *
         * @param {Array} List of selected identity ids
         * @returns {HttpPromise} Promise that will resolve to an array of selected identity objects
         */
        accessRequestIdentityService.getSelectedIdentities = function(identitiesList, startIdx, limit) {
            var data = {
                    id: SailPoint.util.getIdList(identitiesList)
                },
                params = {
                    start: startIdx,
                    limit: limit
                };

            return $http.post(BASE_URL + 'selectedIdentities', data, {
                params: params,
                transformResponse: $http.defaults.transformResponse.concat([createAccessRequestIdentities])
            });
        };

        return accessRequestIdentityService;
    }]);
