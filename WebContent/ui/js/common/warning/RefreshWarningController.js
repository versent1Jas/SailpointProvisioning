'use strict';

/**
 * The RefreshWarningController provides access to the refreshWarningOverrideService methods to the DOM.
 */
angular.module('sailpoint.warning').
    controller('RefreshWarningController', ['refreshWarningOverrideService',
            function(refreshWarningOverrideService) {
        /**
         * Override the refresh warning to ensure the user does not see the dialog.
         */
        this.enableOverride = function(){
            refreshWarningOverrideService.enableOverride();
        };

        /**
         * Disable the override if it is no longer desired to prevent the refresh warning dialog.
         */
        this.disableOverride = function(){
            refreshWarningOverrideService.disableOverride();
        };
    }]);
