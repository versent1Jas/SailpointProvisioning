/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

angular.module('sailpoint.reset')
    .factory('changePasswordService', ['$http', 'SP_CONTEXT_PATH', function($http, SP_CONTEXT_PATH) {

        // URL of change password resource
        var URL = SP_CONTEXT_PATH + '/ui/rest/userReset/changePassword';
        var loginURL = SP_CONTEXT_PATH + '/ui/rest/userReset/login';

        return {
            /**
             * @param token - SMS token
             * @param password - new password
             */
            withSMS: function(token, password) {

                // Create the payload
                var data = {
                    password: password,
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
             * @param password - new password
             */
            withQuestions: function(answerArray, password) {

                // Create the payload
                var data = {
                    password: password,
                    auth: {
                        type: 'Questions',
                        authQuestions: answerArray
                    }
                };

                // Return a promise
                return $http.post(URL, data);
            },
            
            loginUser: function(password) {
                var data = { password: password };
                return $http.post(loginURL, data);
            }
        };
    }]);