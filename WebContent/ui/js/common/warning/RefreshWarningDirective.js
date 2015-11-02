'use strict';

/**
* The spRefreshWarning directive registers and removes a refresh warning 
* whenever it is put in the DOM or removed from the DOM.  This can be disabled
* by using the refreshWarningOverrideService to prevent the warning.  Also, the
* directive accepts the sp-ignore-warning parameter, which allows registering a
* function that gets called when the page is being refreshed and can be used to
* prevent displaying the warning (for example, if there is no state on the page
* that will be lost after a refresh).
*
* Usage:
*
* <sp-refresh-warning sp-ignore-warnings="someFunction()" />
*
*/
angular.module('sailpoint.warning').directive('spRefreshWarning',
        ['$window', 'refreshWarningOverrideService', 'browserSniffer',
            function ($window, refreshWarningOverrideService, browserSniffer) {
    return {
        restrict: 'E',
        scope: {
            spIgnoreWarning: '&'
        },
        link: function(scope, element, attrs) {
            //set the refresh warning because this element is present

            // onebeforeunload is not properly supported by windows phone IE
            // so don't register onbeforeunload for windows phone
            if (!browserSniffer.isWindowsPhone()) {
                $window.onbeforeunload = function() {
                    var ignore = false;
                    if (scope.spIgnoreWarning) {
                        ignore = scope.spIgnoreWarning();
                    }

                    if(!ignore && !refreshWarningOverrideService.isOverride()) {
                        return '#{msgs.ui_refresh_warning}';
                    }

                    return undefined;
                };
            }
            scope.$on('$destroy', function(event){
                //the element has been removed so reset the onbeforeunload function
                $window.onbeforeunload = function(){};
                //also reset the override warning since it is no longer applicable
                refreshWarningOverrideService.disableOverride();
            });
        }
    };
}]);
