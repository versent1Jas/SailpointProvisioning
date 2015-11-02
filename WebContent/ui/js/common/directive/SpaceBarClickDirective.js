'use strict';

/**
 * Simple directive that will bind an event to click the element when space bar is pressed.
 * It is useful for accessibility on anchor tags, since space bar support is expected.
 */
angular.module('sailpoint.directive').directive('spSpaceBarClick', function () {
    return {
        restrict: 'A',
        link: function(scope, element) {
            element.bind('keypress', function(event) {
                if (event && event.keyCode === 32) {
                    element.click();
                    
                    // Stop anything else from happening
                    event.preventDefault();
                }
            });
        }
    };
});