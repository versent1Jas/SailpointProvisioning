'use strict';

/**
 * The spFitRows directive finds the tallest div panel in each row and forces all the others to match. This allows
 * the next row to fall into the correct position.
 *
 * The directive should be used on the element that contains the ngRepeat.
 *
 * When the element width is the same as the container width (or there is one column) we don't resize.
 */
angular.module('sailpoint.directive').directive('spFitRows', function($timeout, $window) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {

            /**
             * Flags if applyHeights is called via a resize event, or from the last row in a ng-repeat.
             *
             * @type {boolean}
             */
            var manualResize = false;

            /**
             * Loops through all the cards and adjusts their heights to match the tallest member.
             */
            function applyHeight() {
                var $els = element.parent().find('div.panel'),
                    maxH = 0,
                    doSize;

                // don't resize if just one column
                doSize = (element.parent().width() !== $els.outerWidth(true));

                // find max height of all elements
                $els.each(function(i, p) {
                    var $p = $(p);

                    $p.css('min-height', '');
                    $p.css('height', '');

                    if (!doSize) {
                        return;
                    }

                    maxH = Math.max($p.outerHeight(true), maxH);
                });

                if (doSize) {
                    // resize all elements to max height
                    $els.each(function(i, p) {
                        $(p).css('min-height', maxH);
                        $(p).css('height', maxH);
                    });
                }
            }

            // handle window resizes
            angular.element($window).bind('resize', function() {
                scope.$apply(function() {
                    if(!manualResize) {
                        applyHeight();
                    }
                    else {
                        manualResize = false;
                    }
                });
            });

            // only apply height after ng-repeat is finished. when using isolated scope change to scope.$parent.$last
            if (!attrs.ngRepeat || (attrs.ngRepeat && true === scope.$last)) {
                return $timeout(function() {
                    // Yo Dawg, I herd you like $timeouts, so I put a $timeout in your $timeout so
                    // you can applyHeights after you render!
                    $timeout(function() {
                        manualResize = true;
                        applyHeight();
                    });
                });
            }
        }
    };
});
