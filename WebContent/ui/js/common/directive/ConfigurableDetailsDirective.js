/**
 * Directive to configurably display details of an item based on column configs
 * 
 * ng-model (Required) - object
 * sp-col-configs (required) - the properties of the object to display
 */
angular.module('sailpoint.directive').
    directive('spConfigurableDetails', function() {
        return {
            restrict: 'E',
            require: ['ngModel'],
            transclude: true,
            scope: {
                ngModel: '=', // use the same name as the attribute
                spColConfigs: '=' // column config object(s)
            },
            templateUrl: 'directive/configurable-details.html',
            link: function(scope, element, attributes){
                scope.getDescription = function() {
                    return (typeof scope.ngModel.getDescription === 'function' && scope.ngModel.getDescription()) ||
                            scope.ngModel.description;
                };
            }
        };
    });

angular.module('directive/configurable-details.html', []).run(['$templateCache', function($templateCache) {
    $templateCache.put('directive/configurable-details.html',
        '<div class="panel-body cfg-details">' +
        '  <div ng-transclude />' +
        '  <p class="text-muted" ng-if="getDescription()">' +
        '   <sp-more-less-toggle text="{{getDescription()}}"></sp-more-less-toggle>' +
        '  </p>' +
        '  <div class="well">' +
            '<div sp-card-data="true" sp-data="ngModel" sp-col-configs="spColConfigs" class="spCardData"/>' +
        '  </div>' +
        '</div>');
}]);
