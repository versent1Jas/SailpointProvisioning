/* (c) Copyright 2015 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

/**
 * Directive to enable rotating a clickable element.
 *
 * spExpander {String} css selector for descendant element that will rotate
 *
 * Example usage: <i class="fa fa-chevron-up pull-right text-info" sp-expander=""></i>
 */
angular.module('sailpoint.directive').
    directive('spExpander', function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var expandTarget = attrs.spExpander ? element.find(attrs.spExpander) : element;
                expandTarget.addClass('unrotate');

                element.on('click', function() {
                    expandTarget.toggleClass('rotate');
                    expandTarget.toggleClass('unrotate');
                });
            }
        };
    });
