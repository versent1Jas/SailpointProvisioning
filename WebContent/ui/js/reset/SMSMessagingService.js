/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

/**
 * Project: identityiq
 * Author: michael.hide
 * Created: 2/19/14 4:04 PM
 */
angular.module('sailpoint.reset')
    .factory('SMSMessagingService', [ '$http', 'resetDataService', 'SP_CONTEXT_PATH', 'spTranslateFilter',
        function($http, resetDataService, SP_CONTEXT_PATH, spTranslateFilter) {
            return {
                sendSMS: function() {
                    // Kick off sendSMS() service via a REST endpoint,
                    // which will handle looking up the user info and sending the message.
                    return $http.post(SP_CONTEXT_PATH + '/ui/rest/userReset/sendSMS').
                        success(function(resp, status, headers, config) {
                            resetDataService.smsStatus.show = true;
                            resetDataService.smsStatus.hasError = false;
                            var d = new Date();
                            resetDataService.smsStatus.text =
                                spTranslateFilter('ui_reset_sms_sent', d.toLocaleTimeString());
                        }).
                        error(function(resp, status, headers, config) {
                            resetDataService.smsStatus.show = true;
                            resetDataService.smsStatus.hasError = true;
                            if (resp && resp.message) {
                                // It's possible at some point we may send multiple errors
                                if($.isArray(resp.message)) {
                                    resp = (resp.message).join('<br/>');
                                }
                                else {
                                    resp = resp.message;
                                }
                            }
                            else {
                                resp = status;
                            }
                            resetDataService.smsStatus.text = resp;
                        });
                }
            };
        }]);