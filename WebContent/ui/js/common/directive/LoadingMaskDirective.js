/**
 * @description
 * The spLoadingMask directive shows a loading mask while a condition is false-y
 *
 * When the spLoadingMask expression evaluates to false the transcluded element is hidden with ng-show
 * and a loading element is shown with ng-hide.  Once spLoadingMask evaluates to true the loading element
 * is hidden and the transcluded element is shown.
 *
 * @param {expression} spLoadingMask If the expression evaluates to true then element is displayed otherwise
 *     a loading mask is displayed.
 * @param {string} [spLoadingMessage] If specified this message will be displayed on the loading element
 *     otherwise the default loading text is used.
 */
angular.module('sailpoint.directive').
    directive('spLoadingMask', function() {
        return {
            restrict: 'A',
            transclude: true,
            scope: false,
            templateUrl: 'directive/sp-loading-mask.html',
            link: function(scope, element, attrs) {
                /* Initialize isLoaded based on current value of the loading mask attribute
                 * Otherwise, if the value is already loaded before mask is rendered the mask 
                 * will never go away. 
                 */
                scope.isLoaded = !!scope[attrs.spLoadingMask];
                scope.loadingMessage = attrs.spLoadingMessage || '#{msgs.loading_data}';
                scope.$watch(attrs.spLoadingMask, function(value) {
                    /* We coerce a truthy value into true/false here because angular has
                     * a different definition of true and false */
                    scope.isLoaded = !!value;
                });
            }
        };
    });

/**
 * @description
 * The template for the loading mask will definitely be used so we pre-cache the value here
 * to save the http request later.  Who wants to wait for the waiting message?
 */
angular.module('directive/sp-loading-mask.html', []).
    run(['$templateCache', function($templateCache) {
        $templateCache.put('directive/sp-loading-mask.html',
            '<div class="row m-n" ng-if="!isLoaded">' +
                '<div class="col-md-12 loading-mask">' +
                    '<section class="panel">' +
                        '<div class="panel-body">' +
                            '<section>' +
                                '<div class="alert alert-info alert-block m-t-lg text-center">' +
                                    '<h1><i class="fa fa-spinner fa-spin"></i></h1>' +
                                    '<h5>{{loadingMessage}}</h5>'+
                                '</div>' +
                            '</section>' +
                        '</div>' +
                    '</section>' +
                '</div>' +
            '</div>' +
            '<div ng-if="isLoaded" ng-transclude></div>');
    }]);