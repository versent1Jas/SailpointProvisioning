'use strict';

/**
 * The TimeoutService handles enabling, disabling, and resetting timeouts.
 */
angular.module('sailpoint.timeout').
    provider('timeoutService', function TimeoutServiceProvider() {
        /* We register this object with httpProvider so we can configure it
         * after we instantiate the timeoutService.  This removes the need
         * to lazily inject timeoutService into the config block or modal
         * in the service constructor */
        var interceptor = {};
        this.getInterceptor = function() {
            return interceptor;
        };
        this.$get = ['$timeout', '$q', '$modal', 'SESSION_TIMEOUT', 'DIALOG_TEMPLATE_PATH_REGEX', 'spModal',
            function($timeout, $q, $modal, SESSION_TIMEOUT, DIALOG_TEMPLATE_PATH_REGEX, spModal) {
                var dialogDisplayed,
                    nextTimeout,
                    timeoutService = {};
                /* Configure the interceptor that we registers with the httpProvider */
                interceptor.request = function(httpConfig) {
                    /* JW: When the screen is locked on a phone the javascript engine stops counting
                     * down timeouts and intervals.  iOS does not give us an event to listen to when
                     * the screen is unlocked.
                     *
                     * Because of the above we are intercepting http requests and seeing if they have
                     * the session timeout has been exceeded.  */
                    var deferred;
                    if(timeoutService.isTimeoutExpired()) {
                        /* Even though inline the modal template always goes through the
                         * http service, so we need to make accommodations */
                        if(!DIALOG_TEMPLATE_PATH_REGEX.test(httpConfig.url)) {
                            timeoutService.showTimeoutDialog();
                            deferred = $q.defer();
                            deferred.reject('timeout exceeded');
                        }
                    }
                    return deferred ? deferred.promise : httpConfig;
                };
                interceptor.response = function(response) {
                    /* Reset the timeout on successful response.  */
                    timeoutService.resetTimeout();
                    return response;
                };

                // The Promise returned from starting the reset timer.
                timeoutService.timeoutPromise = null;

                /**
                 * Reset the timeout timer to execute the given callback after the
                 * session timeout has elapsed.
                 */
                timeoutService.resetTimeout = function() {
                    var waitTime = SESSION_TIMEOUT + 30000;
                    // If there is currently a timeout, cancel it.
                    if (this.timeoutPromise) {
                        $timeout.cancel(this.timeoutPromise);
                    }
                    nextTimeout = Date.now() + waitTime;
                    // Save the promise so we can cancel the timeout if we need to.
                    this.timeoutPromise = $timeout(this.showTimeoutDialog, waitTime);
                };

                timeoutService.isTimeoutExpired = function() {
                    return Date.now() > nextTimeout;
                };

                timeoutService.showTimeoutDialog = function() {
                    // Only show the dialog once.
                    if(dialogDisplayed) {
                        return;
                    }
                    if(spModal) {
                        spModal.closeAll();
                    }
                    dialogDisplayed = true;
                    angular.element('.dropdown.open').click();
                    // Open a modal dialog that prompts to login.  Note that we put
                    // the template HTML in this call so we don't have to issue
                    // another AJAX request to get the contents (this would fail
                    // because we are not authenticated).
                    $modal.open({
                        controller: 'TimeoutDialogCtrl',
                        backdrop: 'static',
                        keyboard: false,
                        template: '<div id="timeoutDialog">' +
                            '  <div class="modal-header">' +
                            '    <h4 class="modal-title">#{msgs.session_expiration_title}</h4>' +
                            '  </div>' +
                            '  <div class="modal-body">' +
                            '    <div>#{msgs.session_expiration_msg}</div>' +
                            '  </div>' +
                            '  <div class="modal-footer">' +
                            '    <button class="btn btn-info" ng-click="login()">' +
                            '      #{msgs.button_login}' +
                            '    </button>' +
                            '  </div>' +
                            '</div>'
                    });
                };
                return timeoutService;
            }];
    }).
    config(['$httpProvider', 'timeoutServiceProvider',
        function($httpProvider, timeoutServiceProvider) {
            $httpProvider.interceptors.push(function() {
                return timeoutServiceProvider.getInterceptor();
            });
        }
    ]);
