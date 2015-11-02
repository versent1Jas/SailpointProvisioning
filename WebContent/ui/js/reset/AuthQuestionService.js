/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

angular.module('sailpoint.reset')
    .factory('authQuestionService', ['$http', 'SP_CONTEXT_PATH', function($http, SP_CONTEXT_PATH) {
        return {
            
            /**
             * Fetch authQuestions
             */
            getAuthQuestions : function() {
                
                //return a promise
                return $http.post(SP_CONTEXT_PATH + '/ui/rest/userReset/authQuestions');
            }
        };
    }]);

