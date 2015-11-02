/**
 * @description
 * The spMoreLessToggle directive truncates and elides the passed text when its  length exceeds
 * the specified length for the current window size
 *
 * @param {string} text The text to render in the element
 * @param {number} [smallMaxLength] If specified this is the max length of text before truncation on small windows
 * @param {number} [largeMaxLength] If specified this is the max length of text before truncation on large windows
 */
angular.module('sailpoint.directive')
    .directive('spMoreLessToggle', ['$window', function($window) {
        /* Default values specified in TA6393 */
        var SMALL_MAX_LENGTH = 200,
            LARGE_MAX_LENGTH = 400,
            SMALL_WIDTH = 768;
        return {
            restrict: 'E',
            scope: {
                text: '@',
                smallMaxLength: '@',
                largeMaxLength: '@'
            },
            replace: true,
            link: function(scope) {
                var smallMaxLength = scope.smallMaxLength || SMALL_MAX_LENGTH,
                    largeMaxLength = scope.largeMaxLength || LARGE_MAX_LENGTH;

                function resizeListener() {
                    calculateText();
                    scope.$digest();
                }

                function calculateText() {
                    var maxLength;
                    scope.isSmall = $window.innerWidth < SMALL_WIDTH;
                    maxLength = getMaxLength();
                    scope.isTruncated = scope.text.length > maxLength;
                    scope.truncatedText = scope.text.substr(0, maxLength);
                    if(scope.isTruncated) {
                        scope.truncatedText += '...';
                    }
                }

                function getMaxLength() {
                    return scope.isSmall ? smallMaxLength : largeMaxLength;
                }

                scope.expanded = false;
                scope.toggle = function() {
                    scope.expanded = !scope.expanded;
                };
                calculateText();

                /* Register listener to the window resizing */
                angular.element($window).bind('resize', resizeListener);
                /* Unregister the resize listener */
                scope.$on('$destroy', function() {
                    angular.element($window).unbind('resize', resizeListener);
                });
            },
            template: '<div>' +
                        '<span ng-if="!expanded" ng-bind-html="truncatedText"></span>' +
                        '<span ng-if="expanded" class="text-muted" ng-bind-html="text"></span>' +
                        '<a ng-if="isTruncated" ng-click="toggle()">' +
                            '<span ng-if="!expanded" class="text text-info">{{\'ui_read_more\' | spTranslate}}</span>' +
                            '<div ng-if="expanded" class="text text-info">{{\'ui_read_less\' | spTranslate}}</div>' +
                        '</a>' +
                      '</div>'
        };
    }]);
