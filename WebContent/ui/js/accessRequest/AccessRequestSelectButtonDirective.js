/**
 * Directive for a button to select/unselect an identity or an access item for access request flow
 * 
 * - sp-selected (Required): Expression evaluating to a truthy value indicating if object is initially selected 
 * 
 * - sp-label (Optional): The label for the checkbox.  Required for screenreaders to work correctly.
 *
 * - sp-on-select (Optional): Method in scope that will be called when button is clicked and selected status
 *                            changes from false to true. Should return either a truthy value or a promise that
 *                            resolves to a truthy value for whether selection occurred or not.
 *
 * - sp-on-deselect (Optional): Method in scope that will be called when button is clicked and selected status
 *                              changes from true to false  Should return either a truthy value or a promise that
 *                              resolves to a truthy value for whether deselection occurred or not.
 *
 * - sp-on-click (Optional): Method in scope that will be called when button is clicked.
 *                           Should take a boolean argument 'selected' which will be set to the new selected value.
 *                           Should return either a truthy value or a promise that resolves to a truthy value for
 *                           whether selection change should occur.
 *
 * - sp-metadata (Optional) : Argument to pass to callback methods
 * 
 * - sp-button-style (Optional) : 'Remove' to have a remove styled button. Default is 'Add'.
 *                              
 * Examples:
 * <sp-access-request-select-button sp-selected="{{isSelected}}" 
 *                                  sp-on-click="toggle(selected,metadata)"
 *                                  sp-metadata="metadataObject"/>
 *                                  
 * <sp-access-request-select-button sp-selected="{{isSelected}}"
 *                                  sp-on-select="select"
 *                                  sp-on-deselect="deselect" />
 *

 */
angular.module('sailpoint.accessrequest').
    directive('spAccessRequestSelectButton', ['$q', function($q) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                spSelected: '@',
                spLabel: '@',
                spOnSelect: '&',
                spOnDeselect: '&',
                spOnClick: '&',
                spMetadata: '=',
                spButtonStyle: '@',
                spDisabled: '='
            },
            link: function(scope, el, attrs) {
                /**
                 * Creates an object with 'metadata' and 'selected' set as appropriate
                 */
                var createCallbackObject = function() {
                    return {
                        metadata: scope.spMetadata,
                        selected: !scope.selected
                    };
                };
                
                scope.isSelected = function() {
                    return scope.selected;
                };
                
                scope.hasOnClick = function() {
                    return angular.isDefined(attrs.spOnClick);
                };
                
                scope.hasOnSelect = function() {
                    return angular.isDefined(attrs.spOnSelect);
                };
                
                scope.hasOnDeselect = function() {
                    return angular.isDefined(attrs.spOnDeselect);
                };

                /* Watch the spSelected value for any change so we can update selected */
                scope.$watch('spSelected', function(newValue) {
                    scope.selected = newValue==='true';
                }, true);
            
                scope.handleClick = function() {
                    var clickCallback = function(callbackFn) {
                        if (callbackFn) {
                            $q.when(callbackFn(createCallbackObject())).then(function(allowSelectionChange) {
                                if (allowSelectionChange) {
                                    scope.selected = !scope.selected;
                                }
                            });
                        }
                    };

                    // If the button is disabled, just bail out.
                    if (scope.isDisabled()) {
                        return;
                    }

                    if (scope.hasOnClick()) {
                        clickCallback(scope.spOnClick);
                    } else if (!scope.selected && scope.hasOnSelect()) {
                        clickCallback(scope.spOnSelect);
                    } else if (scope.selected && scope.hasOnDeselect()) {
                        clickCallback(scope.spOnDeselect);
                    } else {
                        clickCallback(function() {return true;});
                    }
                };
                
                scope.isRemoveButton = function() {
                    return scope.spButtonStyle === 'Remove';
                };
                
                scope.isAddButton = function() {
                    return (!scope.spButtonStyle) || (scope.spButtonStyle === 'Add');
                };

                scope.isDisabled = function() {
                    return !!scope.spDisabled;
                };

                if (!scope.isRemoveButton() && !scope.isAddButton()) {
                    throw 'Invalid spButtonStyle';
                }
            },
            template:
                '<button ng-click="handleClick()" class="btn btn-sm btn-rounded v-middle m-r-sm"' +
                    'ng-class="{ \'disabled\': isDisabled(), ' +
                                '\'btn-white\': !isSelected(), ' +
                                '\'btn-success\': (isSelected() && isAddButton()), ' +
                                '\'btn-danger\': (isSelected() && isRemoveButton()) }"' +
                    'aria-checked="{{ isSelected() }}" aria-disabled="{{ isDisabled() }}" ' +
                    'tabindex="50" aria-label="{{ spLabel }}" role="checkbox" type="button">' +
                  '<i class="fa" ng-class="{ \'fa-check\': isAddButton(), \'fa-times\': isRemoveButton() }"></i>' +
                '</button>'
        };

    }]);
