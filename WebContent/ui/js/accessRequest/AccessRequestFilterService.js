'use strict';

/**
 * The AccessRequestFilterService retrieves identity or acccess item filters from 
 * the server.
 */
angular.module('sailpoint.accessrequest').
    factory('accessRequestFilterService',
            ['Filter', '$http', 'SP_CONTEXT_PATH',
             function(Filter, $http, SP_CONTEXT_PATH) {

        ////////////////////////////////////////////////////////////////////
        //
        // Private helper function
        //
        ////////////////////////////////////////////////////////////////////

        /**
         * Takes an array of Objects and converts them into Filters.
         *
         * @return Array<Filter> of objects passed in
         */
        function convertToFilters(array){
            var newObjects = {};
            newObjects = [];
            angular.forEach(array, function(value) {
                newObjects.push(new Filter(value));
            });
            return newObjects;
        }

        ////////////////////////////////////////////////////////////////////////
        //
        // SERVICE DEFINITION
        //
        ////////////////////////////////////////////////////////////////////////

        var accessRequestFilterService = {

            ////////////////////////////////////////////////////////////////////
            //
            // IDENTITY FILTER RETRIEVAL
            //
            ////////////////////////////////////////////////////////////////////

            /**
             * Returns all filters for identities.
             *
             * @return {HttpPromise} A promise that resolves to an array of Filter objects
             */
            getIdentityFilters: function() {
                return $http.get(SP_CONTEXT_PATH + '/ui/rest/requestAccess/identities/filters')
                .then(function(response){
                    // Convert the raw JSON in the objects array into filters.
                    if (response.data.length > 0) {
                        return convertToFilters(response.data);
                    }
                    return response;
                });
            },


            ////////////////////////////////////////////////////////////////////
            //
            // ACCESS ITEM FILTER RETRIEVAL
            //
            ////////////////////////////////////////////////////////////////////

            /**
             * Returns all filters for access items.
             *
             * @param {String} requesteeId ID of Identity being requested for. Can be null.
             * @return {HttpPromise} A promise that resolves to an array of Filter objects
             */
            getAccessItemFilters: function(requesteeId) {
                return accessRequestFilterService.
                    getAccessFilters(SP_CONTEXT_PATH + '/ui/rest/requestAccess/accessItems/filters',
                        requesteeId);
            },

            /**
             * Returns all filters for current access items.
             *
             * @param {String} requesteeId ID of Identity being requested for. Can be null.
             * @return {HttpPromise} A promise that resolves to an array of Filter objects
             */
            getCurrentAccessFilters: function(requesteeId) {
                return accessRequestFilterService.
                    getAccessFilters(SP_CONTEXT_PATH + '/ui/rest/requestAccess/currentAccessItems/filters',
                        requesteeId);
            },

            /**
             * PRIVATE METHOD - DO NOT CALL DIRECTLY
             * 
             * Inner method that does the work of calling user access resource for filters and converting results.
             * This method should be private but we put it on the service so we can unit test it directly.
             */
            getAccessFilters: function(url, requesteeId) {
                return $http.get(url, {
                    params: {
                        identityId: requesteeId
                    }
                })
                .then(function(response){
                    // Convert the raw JSON in the objects array into filters.
                    if (response.data.length > 0) {
                        return convertToFilters(response.data);
                    }
                    return response;
                });
            },



            ////////////////////////////////////////////////////////////////////
            //
            // ACCESS FILTER VALUE RETRIEVAL
            //
            ////////////////////////////////////////////////////////////////////

            /**
             * Returns values for supported filters so we can set them on the ui from deep links.
             *
             * @param {{Object}} params This should be pulled directly from the $location.search().  It's
             *     a list of the request parameters on the URL.
             * @return {HttpPromise} A promise that resolves to an array of mappings from property to value
             */
            getAccessFilterValues: function(params, identityId) {
                if(identityId) {
                    params.identityId = identityId;
                }
                return $http({
                    url: SP_CONTEXT_PATH + '/ui/rest/requestAccess/accessItems/filterValues',
                    method: 'GET',
                    params: params
                });
            }
        };

        return accessRequestFilterService;
    }]);
