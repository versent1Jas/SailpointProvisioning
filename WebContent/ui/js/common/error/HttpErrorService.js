'use strict';
/**
 * @description
 * This service injects a responseError interceptor into the http service.  The interceptor
 * show a dialog when it receives an error response.  This behavior can be bypassed when
 * making a http request by setting the property handledErrors to an array of the status
 * codes you wish to not be intercepted.
 *
 * The templates for the severe and warning error messages are at:
 *  - /ui/js/error/template/severe.html
 *  - /ui/js/error/template/warn.html
 *
 * @example
 * This is an example of using the handledErrors property to bypass the interceptor on 401
 * and 404 error codes
 $http.get(url, {
        handledErrors: [401, 404],
        param: {
            someParameter: 'a value'
        }
    });
 */
angular.module('sailpoint.error').
    provider('httpError', function() {
        var interceptor = {};
        this.getInterceptor = function() {
            return interceptor;
        };

        this.$get = ['$rootScope', '$q', 'spModal', '$log', 'spTranslateFilter',
            function($rootScope, $q, spModal, $log, spTranslateFilter){
                /**
                 * Returns true if status is in ignoredStatuses array
                 * @param status Number status code
                 * @param ignoredStatuses Array of status codes to ignore
                 * @returns {boolean} True if status is in ignoredStatuses array
                 */
                function shouldBeIgnored(status, ignoredStatuses) {
                    var i;
                    if(ignoredStatuses) {
                        for(i =0; i < ignoredStatuses.length; i++) {
                            if(ignoredStatuses[i] === status) {
                                return true;
                            }
                        }
                    }
                    return false;
                }

                interceptor.responseError = function(responseError) {
                    /* Right off the bat check if we are supposed to handle this
                     * request or ignore it */
                    if(shouldBeIgnored(responseError.status, responseError.config.handledErrors)) {
                        return $q.reject(responseError);
                    }
                    
                    /* For 5xx errors, display the system error message in the dialog, including quickKey if it
                     * exists, and drop an error in the console log with the error text.
                     * For all other errors, just put the error text in the dialog.
                     */
                    var content;
                    if (responseError.status >= 500 ) {
                        var logMsg;
                        if (responseError.data.quickKey) {
                            content = spTranslateFilter('ui_err_fatal_system_qk', responseError.data.quickKey);
                            logMsg = responseError.data.quickKey + ' ' + responseError.data.message;
                        }
                        else {
                            content = spTranslateFilter('ui_err_fatal_system');
                            logMsg = responseError.data.message;
                        }
                        $log.error(logMsg);
                    }
                    else {
                        content = responseError.data.message;
                    }
                    spModal.open({
                        title: responseError.status >= 500 ? 'ui_error_severe_title' : 'ui_error_warn_title',
                        warningLevel: responseError.status >= 500 ? 'danger' : 'warning',
                        content: content
                    });
                    return $q.reject(responseError);
                };
            }];
    }).
    config(['$httpProvider','httpErrorProvider',
        function($httpProvider, httpErrorProvider) {
            $httpProvider.interceptors.push(function() {
                return httpErrorProvider.getInterceptor();
            });
        }
    ]).
    run(['httpError', function(httpError) {
        // No one directly uses this service, but it needs to be instantiated.  We included it as a dependency
        // of this run block to create an instance.  It was either do it here or on the sailpoint module, in either
        // place it is a no-op.
}]);
