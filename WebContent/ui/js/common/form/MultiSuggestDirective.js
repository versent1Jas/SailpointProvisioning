'use strict';

angular.module('sailpoint.form').

/**
 * The spMultiSuggest directive provides a base for typeahead multisuggests
 *
 *  - ng-model: The model to bind to. [required]
 *  - sp-multi-suggest-id: A unique ID for the application suggest component. Defaults to multiSuggestField [optional]
 *  - sp-multi-suggest-limit: The maximum number of items to show in the suggest list.  Defaults to 5 [optional]
 *  - sp-multi-suggest-query: A function accepting two parameters query and limit.  [required]
 *  - sp-multi-suggest-equals: A function that accepts two parameters value1 and value2 and returns true if parameters
 *      are equal. Defaults to equality based on id [optional]
 *  - sp-multi-suggest-label: A function that accepts a parameter, value, and returns the string value to be displayed
 *      in the suggest and in the list of selected items.  If not defined value.displayName is used [optional]
 *  - sp-multi-suggest-item-template-url: Url to the template to render items with.
 *      Defaults to rendering displayName [optional]
 *
 * Example:
 *   <sp-multi-suggest ng-model="ngModel"
 *     sp-multi-suggest-id="{{spApplicationSuggestId}}"
 *     sp-multi-suggest-limit="{{spApplicationSuggestLimit}}"
 *     sp-multi-suggest-query="searchApplications($viewValue)">
 *   </sp-multi-suggest>');

 */
    directive('spMultiSuggest', [function() {
            return {
                restrict: 'E',
                scope: {
                    ngModel: '=',
                    spMultiSuggestId: '@',
                    spMultiSuggestLimit: '@',
                    spMultiSuggestEquals: '&',
                    spMultiSuggestQuery: '&',
                    spMultiSuggestLabel: '&'
                },
                templateUrl: 'template/multi-suggest.html',
                link: {
                    pre: function(scope, element, attrs) {
                        /* The only piece that needs to be in the pre-link is setting up the search
                         * function, but grouping all the validation seems like a good idea */
                        if(angular.isUndefined(attrs.ngModel)) {
                            throw 'ng-model is required for sp-multi-suggest';
                        }
                        if(!attrs.spMultiSuggestQuery) {
                            throw 'sp-multi-suggest-query is required';
                        }
                        if(attrs.spMultiSuggestItemTemplateUrl) {
                            scope.spMultiSuggestItemTemplateUrl = attrs.spMultiSuggestItemTemplateUrl;
                        }

                        scope.itemList = 'innerSearchFunc(query)';
                        // The suggestId is needed in the template to set the DOM ids.
                        // Default it if not found in the attributes.
                        scope.innerMultiSuggestId = attrs.spMultiSuggestId || 'multiSuggestField';
                        // Allow the result limit to be overriden, but default to 5.
                        scope.innerMultiSuggestLimit = attrs.spMultiSuggestLimit || 5;
                    },
                    post: function(scope, element, attrs) {
                        /* Here testing attrs instead of scope because functions on isolated scope
                         * are always set to a function even if not defined on scope */
                        /* Default equal function to equality by id */
                        if(attrs.spMultiSuggestEquals) {
                            scope.innerEquals = function(value1, value2) {
                                return scope.spMultiSuggestEquals({value1: value1, value2: value2});
                            };
                        } else {
                            /* Default equality function tests id equality.  If objects do not have
                             * an id property then object equality is done */
                            scope.innerEquals = function(value1, value2) {
                                if(angular.isUndefined(value1) || angular.isUndefined(value2)) {
                                    return value1 === value2;
                                }
                                if(angular.isUndefined(value1.id) || angular.isUndefined(value2)) {
                                    return value1 === value2;
                                }
                                return value1.id === value2.id;
                            };
                        }
                        /* Default label is the display name */
                        if(attrs.spMultiSuggestLabel) {
                            scope.innerLabelFunc = function(item) {
                                return scope.spMultiSuggestLabel({value: item});
                            };
                        } else {
                            scope.innerLabelFunc = function(item) {
                                if(item) {
                                    return item.displayName || item;
                                }
                            };
                        }

                        /* Indirectly call the search function so we can remap parameters */
                        scope.innerSearchFunc = function(query) {
                            return scope.spMultiSuggestQuery({
                                query: query,
                                limit: scope.innerMultiSuggestLimit
                            });
                        };

                        /* A place to track all our internal state the current input value,
                         * if the add button is enabled, and what was selected */
                        scope.state = {
                            selectedItems: scope.ngModel || []
                        };

                        /**
                         * Returns true if the add button should be enabled
                         * @returns {boolean}
                         */
                        scope.addEnabled = function() {
                            return scope.state.currentItem && !containsItem(scope.state.currentItem);
                        };

                        /* ngModel can be updated outside of this directive.  The case in
                         * mind here is that when used as a filter often the filter's value
                         * is cleared.  So if that happens clear selected items and
                         * the current item */
                        scope.$watchCollection('ngModel', function(newValue) {
                            if(angular.isArray(newValue)) {

                                if(newValue.length === 0) {
                                    scope.state.selectedItems = [];
                                    scope.state.currentItem = undefined;
                                    scope.state.query = undefined;
                                } else {
                                    var currentItemFound = false,
                                        currentItemIndex;
                                    /* If the current value is found in the list we want splice it
                                     * out of the selected items list.  Otherwise set selected items
                                     * to new items and clear the current stuff */
                                    angular.forEach(newValue, function(value, index) {
                                        if(scope.innerEquals(scope.state.currentItem, value)) {
                                            currentItemIndex = index;
                                            currentItemFound = true;
                                        }
                                    });
                                    if(currentItemFound) {
                                        scope.state.selectedItems = newValue.slice(0, currentItemIndex).
                                            concat(newValue.slice(currentItemIndex + 1, newValue.length));
                                    } else {
                                        scope.state.currentItem = undefined;
                                        scope.state.query = undefined;
                                        scope.state.selectedItems = newValue;
                                    }

                                }
                            }
                        });

                        /**
                         * Loops over items and returns true if parameter is there.
                         * @param item The item to look for
                         * @param items If specified the array to look for item in.
                         *      If not it defaults to selectedItems
                         * @returns {boolean} True if the item is found
                         */
                        function containsItem(item, items) {
                            var found = false;
                            items = items || scope.state.selectedItems;
                            angular.forEach(items, function (value) {
                                if (scope.innerEquals(value, item)) {
                                    found = true;
                                }
                            });
                            return found;
                        }

                        /**
                         * Adds item to selected items if is not already there and resets the search and resets
                         * the search field and the button status
                         * @param item {Object} The item to add
                         */
                        scope.addItemToSelectedList = function(item) {
                            if(!containsItem(item)) {
                                /* the model was updated on selection so here we just need to
                                 * udpate the selected list and clear the state stuff */
                                scope.state.query = undefined;
                                scope.state.currentItem = undefined;
                                scope.state.selectedItems.push(item);
                                /* the button that has focus is being removed so move focus back to the
                                 * compent's main input */
                                element.find('.form-control')[0].focus();
                            }
                        };

                        /**
                         * Removes the specified item from the selected items if present.
                         * @param item {Object} Item to remove
                         */
                        scope.removeItem = function(item) {
                            var modelIndex,
                                selectedItemsIndex;
                            angular.forEach(scope.ngModel, function (value, key) {
                                if(scope.innerEquals(value, item)) {
                                    modelIndex = key;
                                }
                            });
                            if(angular.isDefined(modelIndex)) {
                                scope.ngModel.splice(modelIndex, 1);
                            }

                            angular.forEach(scope.state.selectedItems, function (value, key) {
                                if(scope.innerEquals(value, item)) {
                                    selectedItemsIndex = key;
                                }
                            });
                            if(angular.isDefined(selectedItemsIndex)) {
                                scope.state.selectedItems.splice(selectedItemsIndex, 1);
                            }
                            /* the button that has focus is being removed so move focus back to the
                                 * compent's main input */
                            element.find('.form-control')[0].focus();
                        };

                        /**
                         * Called when an item is selected from the typeahead field
                         * @param item {Object} The item selected
                         */
                        scope.itemSelected = function(item) {
                            /* If the items is in the selected items list don't
                             * do anything with it */
                            if(containsItem(item)) {
                                return;
                            }
                            /* We are changing currentItem so if it is defined
                             * pop it off the stack */
                            if(scope.state.currentItem && scope.ngModel) {
                                scope.ngModel.pop();
                            }
                            scope.state.currentItem = item;
                            if(item && !containsItem(item, scope.ngModel)) {
                                scope.ngModel.push(item);
                            }
                        };

                    }
                }
            };
        }]).

    run(['$templateCache', function($templateCache) {
        $templateCache.put('template/multi-suggest.html',
            '<div class="multi-suggest">' +
            '  <div class="multi-suggest-container">' +
            '      <sp-typeahead-input ' +
            '          ng-model="state.query" ' +
            '          sp-typeahead-input-id="{{innerMultiSuggestId}}" ' +
            '          sp-typeahead-input-items="item as innerLabelFunc(item) ' +
            '              for item in innerSearchFunc($viewValue)" ' +
            '          sp-typeahead-input-template-url="{{spMultiSuggestItemTemplateUrl}}" ' +
            '          sp-typeahead-input-label-func="innerLabelFunc(item)" ' +
            '          sp-typeahead-input-on-select-func="itemSelected" >' +
            '      </sp-typeahead-input>' +
            '        <div class="input-group-btn">' +
            '          <button ng-disabled="!addEnabled()" type="button" ' +
            '              class="multi-suggest-add-btn" ' +
            '              tabindex="50" ng-click="addItemToSelectedList(state.currentItem)">' +
            '            <i class="fa fa-plus" role="presentation"></i>' +
            '            <span class="sr-only">' +
            '              {{\'ui_access_add_item_button\' | spTranslate : ' +
            '                  innerLabelFunc(state.currentItem)}}' +
            '            </span>' +
            '          </button>' +
            '        </div>' +
            '  </div>' +
            '  <div class="selected-items" ng-repeat="selectedItem in state.selectedItems"> ' +
            '      <div class="input-group">' +
            '          <input type="text" class="form-control" readonly="true" tabindex="50"' +
            '                 value="{{innerLabelFunc(selectedItem)}}"/> ' +
            '          <div class="input-group-btn">' +
            '              <button type="button" class="multi-suggest-remove-btn" ' +
            '                      ng-click="removeItem(selectedItem)" tabindex="50"> ' +
            '                  <i class="fa fa-minus" role="presentation"></i> ' +
            '                  <span class="sr-only">' +
            '                       {{\'ui_access_remove_item_button\' | spTranslate : ' +
            '                           innerLabelFunc(selectedItem)}}' +
            '                  </span>' +
            '              </button> ' +
            '          </div>' +
            '      </div>' +
            '  </div> '+
            '</div>');
    }]);