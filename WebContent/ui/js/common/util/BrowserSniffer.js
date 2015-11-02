'use strict';

angular.module('sailpoint.util').

/**
 * Simple service to sniff browser
 */
factory('browserSniffer', function($window) {
    return {
        /**
         * Check if this is an iOS browser
         * @returns {Boolean} True if iOS, or false.
         */
        isIOS: function() {
            var iOSmatches = $window.navigator.userAgent.match(/(iPad|iPhone|iPod)/g);
            return !!iOSmatches;
        },

        /**
         * Check if this is a BlackBerry browser
         * @returns {Boolean} True if BlackBerry, or false.
         */
        isBlackBerry: function() {
            var matches = $window.navigator.userAgent.match(/BB10/g);
            return !!matches;
        },

        /**
         * Check if this is a Internet Explorer browser
         * @returns {Boolean} True if IE, or false.
         */
        isIE: function() {
            var matches = $window.navigator.userAgent.match(/MSIE/i) || $window.navigator.userAgent.match(/trident/i);
            return !!matches;
        },

        /**
         * Check if this is a windows phone browser
         * @returns {boolean} True if windows phone, or false
         */
        isWindowsPhone: function() {
            var matches = $window.navigator.userAgent.match(/Windows Phone/i);
            return !!matches;
        }

    };
});
