'use strict';

var SailPoint = SailPoint || {};

/**
 * Define the timeout module.
 */
angular.module('sailpoint.timeout', ['ui.bootstrap', 'sailpoint.modal', 'sailpoint.warning']).
    //The number of milliseconds before the user's session times out.
    constant('SESSION_TIMEOUT', SailPoint.SESSION_TIMEOUT || 1800000).
    constant('DIALOG_TEMPLATE_PATH_REGEX', /^template\/modal/).
    run(['$document', 'timeoutService',
        function($document, timeoutService) {
            // Ensure the timer is counting once the page loads.
            $document.ready(function() {
                timeoutService.resetTimeout();
            });
        }
    ]);
