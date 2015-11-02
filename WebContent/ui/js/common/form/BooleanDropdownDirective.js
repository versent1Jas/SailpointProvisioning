angular.module('sailpoint.form').
    /**
     * Directive to render a drop down with True/False options, bound to ng-model.
     * It supports either attribute or element definition.
     *
     * The following attributes are defined:
     *
     *  -sp-show-blank: If true, add blank line to top of options to allow no value. If selected, ng-model will be
     *  set to undefined. 
     *  
     *  -ng-model: Value to bind selection to.
     */
    directive('spBooleanDropdown', ['spTranslateFilter', function(spTranslateFilter) {
        return {
            restrict: 'EA',
            require: 'ngModel',
            scope: {
                spShowBlank: '@',
                spButtonId: '@',
                spButtonAriaLabel: '@',
                ngModel : '=' //make it bidirectional so we can pass it through automagically,
            },
            link: {
                /**
                 * Pre-linking here so dropdown directive has some options
                 */
                pre: function(scope) {
                    var makeOption = function(label, value) {
                        return {
                            label: label,
                            value: value
                        };
                    };

                    scope.booleanOptions = [
                        makeOption(spTranslateFilter('ui_true'), true),
                        makeOption(spTranslateFilter('ui_false'), false)
                    ];
                }
            },
            template:
                '<div sp-dropdown="{{booleanOptions}}" sp-button-id="{{spButtonId}}" ' +
                '     sp-button-aria-label="{{spButtonAriaLabel}}" sp-show-blank="{{spShowBlank}}" ' +
                '     ng-model="ngModel" />'
        };
    }]);