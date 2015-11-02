'use strict';

/**
* The spScrollBottom directive will make sure whatever HTML container it is applied to is scrolled to the
* bottom upon the promise being successfuly fulfilled.  The promise should be passed into the attribute's value
* 
* Usage:
*
* <element sp-scroll-bottom="[promise]" />
*
*/
angular.module('sailpoint.directive').directive('spScrollBottom', function ($timeout) {
    return {
        restrict: 'A',
        scope: {
            spScrollBottom: '='
        },
        link: function(scope, element, attrs) {
            //add scroll code to then clause so that it is not run before the promise is finished
            scope.spScrollBottom.then( function() {
                //wait until the next digest to make sure the dom is updated before scrolling
                $timeout(function(){
                    //scroll to the bottom
                    element.scrollTop( element.prop('scrollHeight'));
                });
            });
        }
    };
});
