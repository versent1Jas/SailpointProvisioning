'use strict';

/**
* The config will check to see if the browser is a desktop browser and remove the angular swipe directives if it is.
* 
* Usage:
*
* <element ng-swipe-left="function()" />
* <element ng-swipe-right="function()" />
*
*/
angular.module('ngTouch')
.config(['$provide', function($provide){
    /**
     * Check if the browser is touch enabled
     * @returns {Boolean} True if touches are supported, or false.
     */
    function hasTouch($window) {
        return (('ontouchstart' in $window) ||
               ($window.navigator.MaxTouchPoints > 0) ||
               ($window.navigator.msMaxTouchPoints > 0));
    }
    $provide.decorator('ngSwipeLeftDirective', ['$delegate', '$window', function($delegate, $window) {
        // unless mobile remove directive
        if(!hasTouch($window)){
            //$delegate is array of all ng-swipe-left directives
            //in this case first one is angular builtin
            //so we remove it.
            $delegate.shift();
        }
        return $delegate;
    }]);
    $provide.decorator('ngSwipeRightDirective', ['$delegate', '$window', function($delegate, $window) {
        // unless mobile remove directive
        if(!hasTouch($window)){
            //$delegate is array of all ng-swipe-right directives
            //in this case first one is angular builtin
            //so we remove it.
            $delegate.shift();
        }
        return $delegate;
    }]);
}]);