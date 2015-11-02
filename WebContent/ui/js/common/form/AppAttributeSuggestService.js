'use strict';
/**
* appAttributeSuggestService fetches applications for display in application multi suggest component
*/
angular.module('sailpoint.form').
    factory('appAttributeSuggestService', ['$http', function($http) {
        return {
            getAttributes: function(query, limit, applications) {
                var applicationIds;
                if (query) {
                    query = query.trim();
                }

                if(applications) {
                    applicationIds = [];
                    angular.forEach(applications, function(application) {
                        applicationIds.push(application.id);
                    });
                }

                return $http.get(SailPoint.CONTEXT_PATH + '/ui/rest/suggest/applications/attributes', {
                    params: {
                        query: query,
                        limit: limit,
                        applications: applicationIds
                    }
                }).then(function(response) {
                    // Return the objects out of the response.
                    return response.data.objects;
                });
            }
        };
    }]);
