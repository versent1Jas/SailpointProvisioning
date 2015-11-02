/**
 * Simple directive to animate an element based on a value change
 *
 * Usage: <span sp-animate-change="ctrl.value" sp-animate-change-class="fadeInDown">{{ctrl.value}}</span>
 */
angular.module('sailpoint.directive')
    .directive('spAnimateChange', ['$animate', function($animate) {
        return {
            restrict: 'A',
            link: function(scope, element, attributes) {
                
                // Make sure we have 'animated' class
                element.addClass('animated');
                
                // Watch the expression in the attribute, then add/remove the class when changes
                scope.$watch(attributes.spAnimateChange, function() {
                    $animate.addClass(element, attributes.spAnimateChangeClass, function() {
                        element.removeClass(attributes.spAnimateChangeClass);
                    });
                });
            }
        };
    }]);