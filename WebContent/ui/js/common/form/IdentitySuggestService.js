'use strict';

angular.module('sailpoint.form').

/**
 * The identitySuggestService is responsible for handing all things related to
 * identity suggest communication.
 */
factory('identitySuggestService', ['$http', function($http) {
    return {
        /**
         * Return a promise that resolves to an array with the requested
         * identities.  Each entry contains:
         *   - id
         *   - name
         *   - displayName
         *   - firstname
         *   - lastname
         *   - email
         *   - isWorkgroup
         *
         * @param {String} context    The context for the identity selector config.
         * @param {String} suggestId  The suggest ID for the identity selector config.
         * @param {Number} limit      The max number of identities to return.
         * @param {String} query      A possibly null query string.
         * @param {Object} extraParams An object containing any extra parameters that are needed for identity search
         *
         * @return {Promise} A promise that resolves to the requested identities.
         */
        getIdentities: function(context, suggestId, limit, query, extraParams) {
            if (!context || !suggestId) {
                throw 'Context and suggestId are required.';
            }

            // Trim the query.  This may be a single space if the dropdown
            // arrow gets clicked.
            if (query) {
                query = query.trim();
            }

            return $http.get(SailPoint.CONTEXT_PATH + '/ui/rest/suggest/identities', {
                params: {
                    query: query,
                    context: context,
                    suggestId: suggestId,
                    limit: limit,
                    extraParams: extraParams
                }
            }).then(function(response) {
                // Return the objects out of the response.
                return response.data.objects;
            });
        }
    };
}]);
