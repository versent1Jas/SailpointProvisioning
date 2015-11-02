/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

angular.module('sailpoint.reset')
    .factory('unlockAccountService', ['$http', 'SP_CONTEXT_PATH', function($http, SP_CONTEXT_PATH) {

        // URL of unlock account resource
        var URL = SP_CONTEXT_PATH + '/ui/rest/userReset/unlockAccount';

        return {
            /**
             * @param token - SMS token
             */
            withSMS: function(token) {

                // Create the payload
                var data = {
                    auth: {
                        type: 'SMS',
                        token: token
                    }
                };

                // Return a promise
                return $http.post(URL, data);
            },

            /**
             * @param answerArray - Expecting array of {id:<questionId>, answer:<answer>}
             */
            withQuestions: function(answerArray) {

                // Create the payload
                var data = {
                    auth: {
                        type: 'Questions',
                        authQuestions: answerArray
                    }
                };

                // Return a promise
                return $http.post(URL, data);
            }
        };
    }]);