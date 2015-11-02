'use strict';

angular.module('sailpoint.form').
/**
 * The spApplicationMultiSuggest directive provides an application suggest component that
 * allows typeahead completion and viewing a list of applications by clicking an
 * arrow button.
 *
 *  - ng-model: The model to bind to. [required]
 *  - sp-application-suggest-id: A unique ID for the application suggest component. [optional]
 *  - sp-application-suggest-limit: The maximum number of applications to show in the the suggest list.
 *    Defaults to 5 if not specified. [optional]
 *
 */
    directive('spApplicationMultiSuggest', ['$templateCache', 'applicationSuggestService',
        function($templateCache, applicationSuggestService) {
            return {
                restrict: 'E',
                scope: {
                    ngModel: '='
                },
                require: 'ngModel',
                templateUrl: 'template/application-suggest.html',
                link: function(scope, element, attrs) {
                    scope.searchApplications = function(query, limit) {
                        return applicationSuggestService.getApplications(query, limit);
                    };
                    scope.spApplicationMultiSuggestId = attrs.spApplicationMultiSuggestId || 'applicationSuggestField';
                    scope.spApplicationMultiSuggestLimit = attrs.spApplicationMultiSuggestLimit || 5;
                }
            };
        }]).
    run(['$templateCache', function($templateCache) {
        $templateCache.put('template/application-suggest.html',
            '<sp-multi-suggest ng-model="ngModel" ' +
                              'sp-multi-suggest-id="{{spApplicationMultiSuggestId}}" ' +
                              'sp-multi-suggest-limit="{{spApplicationMultiSuggestLimit}}" ' +
                              'sp-multi-suggest-query="searchApplications(query, limit)">' +
            '</sp-multi-suggest>');
    }]);