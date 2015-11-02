'use strict';

/**
* The placeholder patch directive adds placeholder support for ie9.
* 
* Usage:
*
* <input or textarea placeholder="[message text]" />
*
*/
angular.module('sailpoint.form').directive('placeholder', function ($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var isInputSupported = 'placeholder' in document.createElement('input');
            var isTextareaSupported = 'placeholder' in document.createElement('textarea');
            //if element is input or textarea and input is not supported then add placeholder support
            if(!isInputSupported && element[0].localName === 'input' ||
                    !isTextareaSupported && element[0].localName === 'textarea'){
                //make sure angular updates the values first
                $timeout(function(){element.placeholder();});
            }
        }
    };
});
