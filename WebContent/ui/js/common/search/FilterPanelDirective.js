'use strict';
angular.module('sailpoint.search').
    /**
     * A directive that renders a filter
     *  spId {string} Id of the element.
     *  ngModel {object} the attribute to bind to
     *  spFilter {Filter} The filter to render an element for
     */
    directive('spFilterPanelItem', ['$compile', 'filterTemplateService', 'Filter', 'spTranslateFilter',
        function($compile, filterTemplateService, Filter, spTranslateFilter) {
        /**
         * The application attribute suggest needs to know the model of the application suggest
         */
        function linkApplicationAndAttribute(element, attributeSuggest) {
            var applicationSuggest = element.parent().find('sp-application-multi-suggest');
            if (applicationSuggest.length > 0) {
                attributeSuggest.attr('sp-app-attribute-multi-suggest-application-suggest-id',
                    applicationSuggest.attr('sp-application-multi-suggest-id'));
            }
        }

        return {
            restrict: 'E',
            replace: true,
            require: 'ngModel',
            scope: {
                spId: '@',
                ngModel: '=',
                spFilter: '='
            },
            link: function (scope, element) {
                scope.filterLabel = spTranslateFilter(scope.spFilter.label);

                // Append the filter input to the div.
                var filterInputElement =
                    angular.element(
                        filterTemplateService.getFilterTemplate(scope.spFilter, scope.spId, scope.filterLabel));

                if(scope.spFilter.dataType === Filter.DATA_TYPE_ATTRIBUTE) {
                    linkApplicationAndAttribute(element, filterInputElement);
                }
                else if(scope.spFilter.dataType === Filter.DATA_TYPE_NUMBER) {
                    scope.screenReaderLabel = spTranslateFilter('ui_508_filter_label_numbers_only');
                }

                $compile(filterInputElement)(scope);
                element.append(filterInputElement);

                // Get the 'real' input id so our label gets tied to the right thing.
                scope.inputId = filterTemplateService.getInputId(scope.spFilter, scope.spId);
            },
            template: '<div class="form-group filter-item">' +
                        '<label for="{{inputId}}">' +
                        '{{filterLabel}}<span class="sr-only"' +
                        ' ng-if="screenReaderLabel">{{screenReaderLabel}}</span></label>' +
                        '<br/>' +
                      '</div>'
        };
    }]).

    /**
     * A directive that renders a panel that dynamically renders the passed filters
     * Attributes:
     *  id {string} The id of the element.  All children elements will use id in their ids
     *  spTitle {String} The title of the panel.
     *  spDisplayed {boolean} If true the panel is displayed otherwise it is not
     *  spFilters {[Filter]} Array of filters to render
     *  spSearchData {SearchData} Search data where filter values will be stored
     *  spApplyFunc {Function} Function that is called on the apply button
     */
    directive('spFilterPanel', [function() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                id: '@',
                spTitle: '=',
                spDisplayed: '=',
                spFilters: '=',
                spSearchData: '=',
                spApplyFunc: '&'
            },
            link: function (scope) {
                /**
                 * Toggles between displayed and not
                 */
                scope.toggle = function() {
                    scope.spDisplayed = !scope.spDisplayed;
                };
            },
            templateUrl: 'search/filter-panel.html'
        };
    }]);

angular.module('search/filter-panel.html', []).
    run(['$templateCache', function($templateCache) {
        $templateCache.put('search/filter-panel.html',
            '<div class="filter-panel" collapse="!spDisplayed">' +
                '<div class="panel panel-default"> ' +
                    '<div class="panel-body">' +
                        '<h5 ng-if="spTitle" class="font-thin m-t-n-xs">{{ spTitle }}</h5> ' +
                        '<form id="{{id}}Form" ng-submit="spApplyFunc()" class="form-inline" role="form"' +
                            ' autocomplete="off">' +
                            '<sp-filter-panel-item ng-repeat="filter in spFilters" ' +
                                'sp-id="{{id}}Item{{$index}}" ' +
                                'sp-filter="filter" ' +
                                'ng-model="spSearchData.filterValues[filter.property]">' +
                            '</sp-filter-panel-item>' +
                            '<p class="m-t">' +
                                '<a id="{{id}}CancelBtn" ' +
                                    'class="btn btn-link btn-sm filter-button-left" ' +
                                    'ng-click="toggle()" ' +
                                    'tabindex="50" ' +
                                    'role="button">' +
                                    '{{\'ui_access_cancel\' | spTranslate}}' +
                                '</a> ' +
                                '<button id="{{id}}ClearBtn" ' +
                                    'type="reset" ' +
                                    'class="btn btn-white btn-sm filter-button-left"  ' +
                                    'ng-class="{\'disabled\': !spSearchData.hasFilterValues()}" ' +
                                    'aria-disabled="{{!spSearchData.hasFilterValues()}}" ' +
                                    'ng-click="spSearchData.clearFilterValues()" ' +
                                    'tabindex="50">' +
                                    '{{\'ui_access_clear\' | spTranslate}}' +
                                '</button> ' +
                                '<button id="{{id}}ApplyBtn" ' +
                                    'type="submit" ' +
                                    'class="btn btn-info btn-sm filter-button-right" ' +
                                    'tabindex="50">' +
                                    '{{\'ui_access_apply\' | spTranslate}}' +
                                '</button>' +
                            '</p>' +
                        '</form>' +
                    '</div>' +
                '</div>' +
            '</div>');
    }]);
