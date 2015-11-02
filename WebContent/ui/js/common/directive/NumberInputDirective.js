/* (c) Copyright 2015 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

angular.module('sailpoint.directive').
    directive('spNumberInput', function() {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, modelCtrl) {

                modelCtrl.$parsers.push(function(inputValue) {
                    // this next if is necessary for when using ng-required on the input.
                    // In such cases, when a letter is typed first this parser will be called
                    // again, and the 2nd time the value will be undefined.
                    if (!inputValue) {
                        return '';
                    }
                    // only allow numbers, period, and comma.
                    // Need to specify space outside the brackets for some reason.
                    var transformedInput = inputValue.replace(/[^0-9+.+,]\s*/g, '');
                    if (transformedInput !== inputValue) {
                        modelCtrl.$setViewValue(transformedInput);
                        modelCtrl.$render();
                    }

                    return transformedInput;
                });

            }
        };
    });
