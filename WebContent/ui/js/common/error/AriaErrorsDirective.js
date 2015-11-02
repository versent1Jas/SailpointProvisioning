/**
 * Directive to add a single aria error div that will be updated with errors 
 * from the rest of the page.  This registers an error if the ng-hide class is not 
 * on the element containing the error. 
 * 
 * spSelector - the selector query to use to find the error divs. Defaults to '.reader-error'
 */
angular.module('sailpoint.error').
    directive('spAriaErrors', ['$timeout', function($timeout){
        return {
            restrict: 'E',
            replace: true,
            template: '<div role="alert" aria-live="rude" class="sr-only">' +
                '<span class="sr-only" ng-repeat="error in errors">{{error.text}}</span>' +
                '</div>',
            scope: {
                selector: '@spSelector'
            },
            link: function(scope) {
                var selector;
                scope.errors = [];
                if (!scope.selector) {
                    scope.selector = '.reader-error';
                }
                selector = scope.selector;

                /**
                 * Set the error text for the given error
                 * @param idx Index of error
                 * @param errorElement Element with error text
                 */
                var setError = function(idx, errorElement) {
                    if (scope.errors && scope.errors.length > idx) {
                        var error = scope.errors[idx];
                        if (error) {
                            if (isVisible(errorElement)) {
                                error.text = errorElement.text();
                            } else {
                                error.text = null;
                            }
                        }
                    }
                };

                /**
                 * Return true if element does not have class 'ng-hide'
                 * @param element JQLite element 
                 * @returns {boolean} True if element is non-null and visible
                 */
                var isVisible = function(element) {
                    return (element && !element.hasClass('ng-hide'));
                };

                /**
                 * Add a watch for visibility change and text change 
                 * to the given element
                 * @param idx Index of element
                 * @param errorElement JQLite element
                 */
                var addWatch = function(idx, errorElement) {
                    scope.$watch(function() {
                        return isVisible(errorElement);
                    }, function() {
                        setError(idx, errorElement);
                    });

                    scope.$watch(function() {
                        return errorElement.text();
                    }, function() {
                        setError(idx, errorElement);
                    });
                };

                /* Here we use timeout to execute asynchronously so that any error elements
                 * being included/transcluded from directives will resolve */
                $timeout(function() {
                    var errorDivs = angular.element(selector);
                    if (errorDivs && errorDivs.length > 0) {
                        var i, error;
                        for (i = 0; i < errorDivs.length; i++) {
                            error = errorDivs[i];
                            scope.errors.push({
                                text: ''
                            });
                            addWatch(i, angular.element(error));
                        }
                    }
                }, 0);
            }
        };
    }]);