'use strict';

/**
 * The refreshWarningOverrideService provides a way to override the refresh warning so that 
 * if the warning is enabled it will not show up.
 */
angular.module('sailpoint.warning').
    factory('refreshWarningOverrideService', [function() {
        var overrideService = {},
            override = false;

        /**
         * Override the warning to not show up even if the directive is present.
         */
        overrideService.enableOverride = function(){
            override = true;
        };

        /**
         * Allow the warning to perform its regular behavior.
         */
        overrideService.disableOverride = function(){
            override = false;
        };

        /**
         * Return boolean of whether or not to override the refresh warning.
         */
        overrideService.isOverride = function(){
            return override;
        };

        return overrideService;
    }]);
