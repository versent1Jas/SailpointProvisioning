'use strict';
/**
* applicationSuggestService fetches applications for display in application multi suggest component
*/
angular.module('sailpoint.form').
    factory('applicationSuggestService', ['$http', function($http) {
        return {
            getApplications: function(query, limit) {
                if (query) {
                    query = query.trim();
                }

                return $http.get(SailPoint.CONTEXT_PATH + '/ui/rest/suggest/applications', {
                    params: {
                        query: query,
                        limit: limit
                    }
                }).then(function(response) {
                    // Return the objects out of the response.
                    return response.data.objects;
                });
            }
        };
    }]);
