/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

/**
 * Project: identityiq
 * @author: michael.hide
 * Created: 2/21/14 1:31 PM
 */
angular.module('sailpoint.reset')
    .factory('routingService', [ '$window', '$location', 'resetDataService', 'SP_CONTEXT_PATH',
        function($window, $location, dataService, SP_CONTEXT_PATH) {
            /**
             * Helper function to navigate outside the scope of the app.
             * See http://docs.angularjs.org/guide/dev_guide.services.$location
             *
             * @private
             * @param path The path to navigate to.
             */
            var navigate = function navigate(path) {
                var loc = $window.location;
                if (loc) {
                    loc.replace(loc.protocol + '//' + loc.host + SP_CONTEXT_PATH + path);
                }
            };

            var DASHBOARD_URL = '/dashboard.jsf',
                MOBILE_INDEX_URL = '/ui/index.jsf',
                MOBILE_LOGIN_URL = '/ui/login.jsf',
                DESKTOP_LOGIN_URL = '/login.jsf',
                GINA_LOGIN_URL = '/desktopreset';

            return {
                /**
                 * Handles the routing from the final step in the reset flow to
                 * the next appropriate page.  Routing is based on two variables
                 * stored in ResetDataService: origin and action.
                 */
                navigateSuccess: function() {
                    var target = DASHBOARD_URL; //default target to desktopUIReset password flow

                    // Coming from GINA, always go to the thank you page
                    // regardless if it is a password reset or account unlock.
                    //
                    // This is the only case where we can actually use $location.path()
                    if (dataService.origin === 'desktopReset') {
                        $location.path('/thankYou');
                        return;
                    }
                    // Otherwise we're coming from either mobile or desktop
                    else {
                        // If password reset flow,
                        if (dataService.action === 'passwordReset') {
                            // check if coming from mobile.
                            if (dataService.origin === 'mobileUIReset') {
                                target = MOBILE_INDEX_URL;
                            }
                        }
                        // Otherwise we are performing an account unlock.
                        else {
                            // Go to mobile login,
                            if (dataService.origin === 'mobileUIReset') {
                                target = MOBILE_LOGIN_URL;
                            }
                            // or desktop login.
                            else if (dataService.origin === 'desktopUIReset') {
                                target = DESKTOP_LOGIN_URL;
                            }
                        }
                    }

                    // and we're on our way...
                    navigate(target);
                },

                /**
                 * Handles cancel button action to return to origin
                 */
                navigateCancel: function() {
                    var target = DESKTOP_LOGIN_URL;
                    if (dataService) {
                        if (dataService.origin === 'mobileUIReset') {
                            target = MOBILE_LOGIN_URL;
                        }
                        else if (dataService.origin === 'desktopReset') {
                            target = GINA_LOGIN_URL;
                        }
                    }
                    navigate(target);
                }
            };
        }]);