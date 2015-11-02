/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

/**
 * The spRadioGroup and spRadio directives create properly themed radio components.
 * These directives are necessary because window.load events are fired within the
 * todo theme. Unfortunate for us, angular has not initialized the view and none of
 * the css selectors in window.load return elements.
 */
angular.module('sailpoint.form')
    .directive('spRadioGroup', function() {

        return {
            restrict: 'A',
            require: 'ngModel',
            replace: true,
            scope: true,
            link: {
                /**
                 * Pre-linking here so child directives have access to scope variables. 
                 */
                pre : function pre(scope, element, attr, controllers) {
                    
                    scope.name = attr.ngModel;
                    scope.childModel = {};
                    
                },
                /**
                 * Creates a watch on the ngModel attribute, so a two way binding can 
                 * occur between the child model and the parent model.
                 */
                post : function postLink(scope, element, attr, controllers) {
                    scope.$watch(attr.ngModel, function(value) {

                        // set the child model so we initialize properly
                        scope.childModel.childValue = value;

                        // update the parent ngModel value
                        if(controllers.$viewValue !== value) {
                            controllers.$setViewValue(value);
                        }

                    });
                }
            }

        };

    })
    .directive('spRadio', function($timeout) {
        
        return {
            restrict: 'A',
            require: '^ngModel',
            template: '<div class="radio">' +
                      '  <label class="radio-custom">' +
                      '    <input type="radio" id="{{radioId}}" value="{{value}}" name="{{name}}" tabindex="50" ' +
                      '           ng-model="childModel.childValue"/>' +
                      '    <i class="fa fa-circle-o" />{{label}}' +
                      '  </label>' +
                      '</div>',
            replace: true,
            scope: true,
            link: {
                /**
                 * Pre-linking here so child directives have access to scope variables. 
                 */
                pre: function preLink(scope, element, attrs, controllers) {
                    scope.radioId = attrs.radioId;
                    scope.value = attrs.spRadio;
                    scope.label = attrs.radioLabel;
                },
                /**
                 * Bind the childModel to the parent ngModel.
                 */
                post: function postLink(scope, element, attrs, controllers) {
                
                    //set the value of parent ngModel when the local childValue property changes
                    scope.$watch('childModel.childValue', function(value) {

                        if(controllers.$viewValue !== value) {
                            controllers.$setViewValue(value);
                        }
                    });
                    // Initialize the radio object similar to fuelux.js window.onLoad events.
                    // Need to do this here because angular does not initialize the view before
                    // window.onLoad fires.  Using a timeout because the $digest phase has not 
                    // occurred. This allows fuelux to properly set up the radio object so that
                    // it may be clicked.
                    $timeout(function() {
                        var el = $('input#'+scope.radioId);
                        if (el.data('radio')) {
                            return;
                        }
                        el.radio(el.data());
                        // scope.name should be an object, referenced by model.someProperty, and fuelux code does not
                        // wrap the group name in double quotes.  Errors ensue if we don't do this.
                        el.data().radio.groupName = '"' + scope.name + '"';
                    });
                }
            }
        };
        
    });