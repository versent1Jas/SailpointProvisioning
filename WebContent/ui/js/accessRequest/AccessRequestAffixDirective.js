'use strict';

/**
 * The spAccessRequestAffix directive applies applies bootstrap's affix (http://getbootstrap.com/javascript/#affix)
 * functionality to the top button bar.  The height of the header is used to calculate where the affix offset is found.
 * Can be turned off by being set to "false"

 * Usage:
 *
 * <element sp-access-request-affix="true|false" />
 *
 */
angular.module('sailpoint.accessrequest').
    directive('spAccessRequestAffix', ['browserSniffer', '$window', '$document',
        function (browserSniffer, $window, $document) {
    return {
        restrict: 'A',
        scope: {
            spAccessRequestAffix : '='
        },
        link: function(scope, element, attrs) {
            /* Allow the user to turn it on off by setting true/false
               Disallow on iOS because of browser bugs with bootstrap affix on iOS
               See bug #22109 */

            if(scope.spAccessRequestAffix && !browserSniffer.isIOS()) {
                /* create the affix element and set it to the height of the page's header */
                element.affix({
                    offset : {
                        top: angular.element('header').height() || 0
                    },
                    target: 'html'
                }).on('affix.bs.affix affix-top.bs.affix affix-bottom.bs.affix', function(evt){
                        var viewportHeight, documentHeight, headerHeight;

                        // With BlackBerry if the document height is not long enough and the user scrolls
                        // enough to activate the affix scrollbar gets stuck bug23505
                        if (browserSniffer.isBlackBerry()) {
                            // get viewport height
                            viewportHeight = $window.screen.height;
                            // get document height
                            documentHeight = $document.height();
                            headerHeight = angular.element('header').height();

                            if (documentHeight < viewportHeight + headerHeight) {
                                evt.preventDefault();
                            }
                        }
                    }
                );
            }
        }
    };
}]);