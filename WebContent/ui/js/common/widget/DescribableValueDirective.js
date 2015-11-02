/**
 * Directive to handle showing either value text or an anchor with info bubble if there is a description
 * 
 * spClick (Required) - method to invoke when the anchor is clicked if there is a description,
 *                      to show dialog, for example.
 * spHasDescription (Required) - boolean value if value has a description or not
 * spValue (Required) - value to show
 */
angular.module('sailpoint.widget')
    .directive('spDescribableValue', function() {
        return {
            restrict: 'E',
            scope: {
                spClick: '&',
                spHasDescription: '=',
                spValue: '='
            },
            replace: true,
            template: '<span><a href="" ng-click="spClick()" tabindex="50" ng-show="spHasDescription">'+
                         '{{ spValue }} <i class="fa fa-question-circle text-info" role="presentation"></i>'+
                       '</a>'+
                       '<span ng-show="!spHasDescription">{{ spValue }}</span></span>'
        };
    });