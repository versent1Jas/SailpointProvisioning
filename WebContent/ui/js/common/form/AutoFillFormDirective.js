/**
 * Directive to trigger change events in a form where the input fields have been
 * auto-filled, based on the implementation in autofill-event.js.
 * 
 * This is a hack to work around browser bug where they do not trigger any events when 
 * filling forms automatically. 
 */
angular.module('sailpoint.form').
    directive('spAutoFill', function($timeout) {
        return {
            restrict: 'A',
            scope: {},
            link: function(scope, element) {
                // Need to wait a bit to make sure any form fill will have finished
                $timeout(function() {
                    element.find('input').checkAndTriggerAutoFillEvent();
                }, 200);
            }
        };
    });