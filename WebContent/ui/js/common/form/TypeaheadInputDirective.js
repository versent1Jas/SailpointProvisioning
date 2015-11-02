'use strict';
/**
 * spTypeaheadInput Directive is a wrapper around typeahead that adds a drop down button and
 * related functionality
 *
 * ng-model - The model to bind to [required]
 * sp-typeahead-input-items - The comprehension expression to be used with the underlying typeahead directive.
 *   See typeahead and select directives for more information.  [required]
 * sp-typeahead-input-id - The id to be used with the input element. Defaults to 'typeaheadInput' [optional]
 * sp-typeahead-input-editable - If only items from the list are selectable.  Defaults to false. [optional]
 * sp-typeahead-input-required - If the value is required.  Defaults to false. [optional]
 * sp-typeahead-input-template-url - Url or template for dropdown items.
 *   Default template uses item.displayName. [optional]
 * sp-typeahead-input-on-select-func - Function that will be invoked when an item is selected.
 *   This function will be invoked with the selected item as a parameter
 */
angular.module('sailpoint.form').
directive('spTypeaheadInput', function() {
        return {
            restrict: 'E',
            /* Do not create a new scope, so we don't run into any funny business
             * when evaluating the typeahead's comprehension expression */
            scope: false,
            link: {
                pre: function(scope, element, attrs){
                    /* spTypeaheadInputItems and ngModel are required */
                    if(angular.isUndefined(attrs.ngModel)) {
                        throw 'ng-model is required for sp-typeahead-input';
                    }
                    if(angular.isUndefined(attrs.spTypeaheadInputItems)) {
                        throw 'sp-typeahead-input-items is required for sp-typeahead-input';
                    }

                    scope.spTypeaheadInputId = attrs.spTypeaheadInputId || 'typeaheadInput';
                    scope.spTypeaheadInputEditable = scope.$eval(attrs.spTypeaheadInputEditable);
                    scope.spTypeaheadInputRequired = scope.$eval(attrs.spTypeaheadInputRequired);
                    scope.spTypeaheadInputTemplateUrl = attrs.spTypeaheadInputTemplateUrl ||
                        'template/typeahead-input-item.html';

                    if(attrs.spTypeaheadInputOnSelectFunc) {
                        scope.spTypeaheadInputOnSelectFunc = function($item) {
                            scope[attrs.spTypeaheadInputOnSelectFunc].call(scope, $item);
                        };
                    } else {
                        scope.spTypeaheadInputOnSelectFunc = angular.noop;
                    }
                },
                post: function(scope, element, attrs) {
                    /* Lifted from IdentitySuggest*/
                    scope.showList = function() {
                        var txt = angular.element('input#' + scope.spTypeaheadInputId, element);

                        // Set the view value to an empty space.  This directive
                        // ignores empty input, so a blank string won't work.  This
                        // will need to get filtered out when the query is made.
                        scope.typeaheadinputform.typeaheadInputField.$setViewValue('');

                        // Clear the value out of the DOM input element if there is
                        // any.  This makes the DOM match the view.
                        txt.val('');

                        // Focus on the text field so that the arrow keys will work
                        // to scroll through the list.
                        txt.focus();
                    };
                    scope.blurFunc = function(event) {
                        if(!scope.$eval(attrs.ngModel)) {
                            scope.spTypeaheadInputOnSelectFunc(undefined);
                        }
                    };

                }
            },
            template: function(scope, attrs) {
                return '<ng-form name="typeaheadinputform"> ' +
                    '  <div class="input-group">' +
                    '    <input type="text" ' +
                    '        id="{{spTypeaheadInputId}}" ' +
                    '        name="typeaheadInputField" ' +
                    '        ng-model="' + attrs.ngModel + '" ' +
                    '        typeahead="' + attrs.spTypeaheadInputItems + '" ' +
                    '        typeahead-editable="{{spTypeaheadInputEditable}}" ' +
                    '        ng-required="{{spTypeaheadInputRequired}}"' +
                    '        typeahead-min-length="-1" ' +
                    '        typeahead-wait-ms="50" ' +
                    '        typeahead-on-select="spTypeaheadInputOnSelectFunc($item)" ' +
                    '        typeahead-template-url="{{spTypeaheadInputTemplateUrl}}" ' +
                    '        ng-blur="blurFunc($event)" ' +
                    '        class="form-control"' +
                    '        tabindex="50" ' +
                    '        role="combobox" ' +
                    '        aria-haspopup="true"/>' +
                    '    <div class="input-group-btn">' +
                    '      <button type="button" class="btn btn-white dropdown-toggle" ' +
                    '          ng-click="showList()" tabindex="50">' +
                    '        <span class="fa fa-chevron-down" role="presentation"/>' +
                    '        <span class="sr-only">{{ \'ui_sr_toggle_dropdown\' | spTranslate}}</span>' +
                    '      </button>' +
                    '    </div> ' +
                    '  </div>' +
                    '</ng-form>';
            }
        };
    }).
    run(['$templateCache', function($templateCache) {
        $templateCache.put('template/typeahead-input-item.html',
            '<a class="suggest-item" role="option" aria-live="assertive">' +
                '  <div>' +
                '    <span bind-html-unsafe="match.model.displayName | typeaheadHighlight:query" />' +
                '  </div>' +
                '</a>');
    }]);