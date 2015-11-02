angular.module('sailpoint.form').
    /**
     * Directive to render a drop down with configured options, bound to ng-model.
     * It supports either attribute or element definition.
     * 
     * The following attributes are defined:
     *
     *  - sp-dropdown: List of objects defining 'label' and 'value'. The 'label' will be shown in the dropdown
     *  and the 'value' will be assigned to ng-model.
     *  
     *  -sp-options: In element mode, allows alternate way to define string options.
     *  
     *  -sp-show-blank: If true, add blank line to top of options to allow no value. If selected, ng-model will be 
     *  set to undefined.
     *
     *  -sp-button-id: ID for the dropdown button on the directive.
     *  
     *  -sp-button-aria-label: Text to use as aria-label for the dropdown button.
     *  
     *  -sp-on-select: Function to call whenever the user makes a selection.
     *
     *  -ng-model: Value to bind selection to.
     */
    directive('spDropdown', ['$timeout', 'spTranslateFilter', function ($timeout, spTranslateFilter) {
        return {
            restrict: 'EA',
            require: 'ngModel',
            scope: {
                spOptions: '@',
                spShowBlank: '@',
                spButtonAriaLabel: '@',
                spOnSelect: '&',
                spButtonId: '@'
            },
            link: function(scope, element, attrs, ngModel) {
                scope.allOptions = scope.$eval(attrs.spDropdown);
                if (!scope.allOptions) {
                    scope.allOptions = scope.$eval(scope.spOptions);
                    if (!scope.allOptions) {
                        throw 'No Options defined!';
                    }
                }

                scope.selectedOption = null;
                
                scope.isOpen = false;
                
                /**
                 * Update the selected option when value changes. 
                 */
                ngModel.$render = function() {
                    if (angular.isDefined(ngModel.$viewValue)) {
                        angular.forEach(scope.allOptions, function(option) {
                            if (option.value === ngModel.$viewValue) {
                                scope.selectedOption = option;
                            }
                        });
                    } else {
                        scope.selectedOption = null;
                    }
                };

                /**
                 * Set the value on the ngModel
                 */
                scope.selectOption = function(newOption) {
                    ngModel.$setViewValue(newOption ? newOption.value : undefined);
                    ngModel.$render();
                    if(angular.isFunction(scope.spOnSelect)){
                        scope.spOnSelect();
                    }
                };

                /**
                 * Get the label for the current selected value.
                 */
                scope.getLabel = function() {
                    return (scope.selectedOption) ? scope.selectedOption.label : '';
                };

                scope.getSrLabel = function() {
                    var label = scope.getLabel();
                    if (!label) {
                        label = spTranslateFilter('ui_dropdown_no_selection');
                    }
                    return label;
                };

                scope.handleToggle = function(isOpen) {
                    if (isOpen) {

                        // Set aria-expanded to true
                        element.find('.dropdown-menu').attr('aria-expanded', true);

                        // Set focus on the first link in the dropdown
                        $timeout(function() {
                            element.find('.dropdown-menu li:first-child a').focus();
                        });
                    } else {
                        // Set aria-expanded to false                                            
                        element.find('.dropdown-menu').attr('aria-expanded', false);

                        // Set focus back to dropdown toggle
                        element.find('.input-group-btn > button.dropdown-toggle ').focus();
                    }
                };
            },
            template:
                    '<div class="dropdown dropdown-directive" on-toggle="handleToggle(open)" is-open="isOpen">' +
                    '  <div class="input-group " >' +
                    '    <input class="form-control btn btn-text dropdown-toggle" data-toggle="dropdown" ' +
                    '            role="presentation" type="text"  ' +
                    '            readonly="true" ng-model="selectedOption.label">' +
                    '    </input>' +
                    '    <div class="input-group-btn">'   +
                    '      <button id="{{spButtonId}}" class="btn btn-white btn-sm m-r-sm dropdown-toggle" ' +
                    '              type="button" tabindex="50" aria-haspopup="true" ' +
                    '              aria-label="{{spButtonAriaLabel}} {{getSrLabel()}}">' +
                    '        <i class="fa fa-chevron-down" role="presentation"></i>' +
                    '      </button> ' +
                    '    </div>' +
                    '  </div>'+
                    '  <ul class="dropdown-menu dropdown-menu-right dropdown-toggle" ' +
                    '      role="menu" aria-expanded="false">' +
                    '    <li ng-if="spShowBlank" role="presentation">' +
                    '     <a href="" ng-click="selectOption()" role="menuitem" ' +
                    '        sp-space-bar-click="">' +
                    '       <span class="sr-only">{{\'ui_dropdown_no_selection\' | spTranslate}}</span>' +
                    '     </a>' +
                    '    </li>' +
                    '    <li ng-repeat="option in allOptions" role="presentation">' +
                    '      <a href="" ng-click="selectOption(option)" role="menuitem" ' +
                    '         sp-space-bar-click="">' +
                    '        {{option.label | spTranslate}}' +
                    '      </a>' +
                    '    </li>' +
                    '  </ul>' +
                    '</div>'


        };
    }]);