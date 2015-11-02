/**
 * This directive is used to switch the focus when a watched property changed to a truthy value
 *
 * usage <input sp-focus-snatcher="watchedProperty"/>
 */
angular.module('sailpoint.directive').
    directive('spFocusSnatcher', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            scope: {
                spFocusSnatcher: '='
            },
            link: function(scope, element) {
                /* When changing from false to true reset focus asynchronously */
                scope.$watch('spFocusSnatcher', function(newValue, oldValue) {
                    if(newValue && !oldValue) {
                        $timeout(function() {
                            element.focus();
                            /* Reset focus monitor to false */
                            scope.spFocusSnatcher = false;
                        });
                    }
                });
            }
        };
    }]);