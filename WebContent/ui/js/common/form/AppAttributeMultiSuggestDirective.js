'use strict';

angular.module('sailpoint.form').
/**
 * Multi Suggest component for selecting application attributes
 *
 * ng-model - The model to bind to [required]
 * sp-app-attribute-multi-suggest-application-suggest-id - If defined the model from the application multi select will
 *      be used to determine the available attributes [optional]
 * sp-app-attribute-multi-suggest-id - If specified the id of the suggest.
 *      If not specified defaults to 'attributeSuggestField' [optional]
 * sp-app-attribute-multi-suggest-limit - If specified the max items shown in the dropdown.
 *      If not specified defaults to 5 [optional]
 */
    directive('spAppAttributeMultiSuggest', ['$templateCache', 'appAttributeSuggestService', '$timeout',
        function($templateCache, appAttributeSuggestService, $timeout) {
            return {
                restrict: 'E',
                scope: {
                    ngModel: '=',
                    spAppAttributeMultiSuggestApplicationSuggestId: '@'
                },
                require: 'ngModel',
                templateUrl: 'template/attribute-suggest.html',
                link: function(scope, element, attrs) {
                    /**
                     * Remove from the attributes list any attributes that do not belong to an application in
                     * applications. If applications is empty all attributes are kept.
                     *
                     * @param applications {Array} Array of applications
                     */
                    function pruneAttributes(applications) {
                        var appIndex,
                            attrIndex;
                        /* If the new application list is empty then keep all the selected attributes */
                        if(angular.isUndefined(applications) || applications.length === 0) {
                            return;
                        }
                        if(scope.ngModel) {
                            /* Looping attributes from the end so we can modify the array in place */
                            for(attrIndex = scope.ngModel.length - 1; attrIndex >= 0; attrIndex--) {
                                var found = false;
                                for(appIndex = 0; appIndex < applications.length && !found; appIndex++) {
                                    if(applications[appIndex].id === scope.ngModel[attrIndex]['application-id']) {
                                        found = true;
                                    }
                                }
                                /* We did not find the application for this attribute so remove it */
                                if(!found) {
                                    scope.ngModel.splice(attrIndex, 1);
                                }
                            }
                        }
                    }

                    /* This should happen after the digest loop has completed to assure the
                     * element we are looking up has been compiled and linked, so through it
                     * in a timeout */
                    $timeout(function() {
                        var applicationSuggest = angular.element(
                            'sp-application-multi-suggest[sp-application-multi-suggest-id="' +
                            scope.spAppAttributeMultiSuggestApplicationSuggestId + '"]');
                        if(applicationSuggest.length > 0) {
                            /* If the application suggest is defined we need to grab it's scope
                             * so we can watch for changes on the model.  Just monitoring the
                             * model directly fails when the object backing the model is replaced.
                             * This is the $watch equivalent of ng-model should have a dot in it. */
                            scope.spAppAttributeMultiSuggestApplications = applicationSuggest
                                .find('sp-multi-suggest').scope().ngModel;
                            scope.appSuggestScope = applicationSuggest.find('sp-multi-suggest').scope();
                            scope.$watchCollection(function() {
                                    return scope.appSuggestScope.ngModel;
                                }, pruneAttributes);
                        }
                    });
                    scope.searchAttributes = function(query, limit) {
                        var applications;
                        if(scope.appSuggestScope) {
                            applications = scope.appSuggestScope.ngModel;
                        }
                        return appAttributeSuggestService.getAttributes(query, limit, applications);
                    };

                    /* Attributes are equal if the application id and attribute name are the same*/
                    scope.attributeEquals = function(value1, value2) {
                        if(angular.isUndefined(value1) || angular.isUndefined(value2)) {
                            return value1 === value2;
                        }
                        return value1['application-id'] === value2['application-id'] &&
                            value1.attribute === value2.attribute;
                    };

                    /* Attributes need to be rendered with application name and attribute name */
                    scope.labelValue = function(value) {
                        if(value) {
                            return value.attribute + ' - ' + value['application-name'];
                        }
                    };
                    scope.spAppAttributeMultiSuggestId = attrs.spAppAttributeMultiSuggestId || 'attributeSuggestField';
                    scope.spAppAttributeMultiSuggestLimit = attrs.spAppAttributeMultiSuggestLimit || 5;
                }
            };
        }]).
    run(['$templateCache', function($templateCache) {
        $templateCache.put('template/attribute-suggest.html',
            '<sp-multi-suggest ng-model="ngModel" ' +
                'sp-multi-suggest-item-template-url="template/attribute-suggest-item.html"' +
                'sp-multi-suggest-id="{{spAppAttributeMultiSuggestId}}" ' +
                'sp-multi-suggest-limit="{{spAppAttributeMultiSuggestLimit}}" ' +
                'sp-multi-suggest-equals="attributeEquals(value1, value2)" ' +
                'sp-multi-suggest-label="labelValue(value)" ' +
                'sp-multi-suggest-query="searchAttributes(query, limit)">' +
            '</sp-multi-suggest>');
        $templateCache.put('template/attribute-suggest-item.html',
            '<a class="suggest-item" role="option" aria-live="assertive">' +
                '  <div>' +
                '    <span bind-html-unsafe="match.model.attribute | typeaheadHighlight:query" />' +
                '    <span class="indented">{{match.model["application-name"]}}</span>' +
                '  </div>' +
            '</a>');
    }]);