'use strict';

/**
 * A directive that displays a panel with an "X accounts selected" message and a
 * button that allows editing the selections when clicked.
 *
 * Required properties:
 *  - sp-requested-item: The RequestedAccessItem.
 *  - sp-on-click: A function to execute when the edit button is clicked.
 */
angular.module('sailpoint.accessrequest').
    directive('spSelectedAccountPanel',
              ['accessRequestAccountSelectionService', 'spTranslateFilter',
               function(accessRequestAccountSelectionService, spTranslateFilter) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                spRequestedItem: '=',
                spOnClick: '&'
            },
            link: function(scope, el, attrs) {
                /**
                 * @return {Number} The total number of account selections on the item.
                 */
                function getTotal() {
                    return accessRequestAccountSelectionService.getTotalAccountSelectionCount(
                               scope.spRequestedItem);
                }

                /**
                 * @return {Number} The number of completed account selections on the item.
                 */
                function getCompleted() {
                    return accessRequestAccountSelectionService.getCompletedAccountSelectionCount(
                               scope.spRequestedItem);
                }

                /**
                 * @return {Boolean} Whether this item has any account selections.
                 */
                scope.hasAccountSelections = function() {
                    return scope.spRequestedItem && (getTotal() > 0);
                };

                /**
                 * @return {String} The "x accounts selected" message for the item.
                 */
                scope.getMessage = function() {
                    if (scope.spRequestedItem.hasMissingAccountSelections()) {
                        return spTranslateFilter('ui_access_request_x_of_y_accounts_selected',
                                                 getCompleted(), getTotal());
                    }
                    else if (getTotal() > 1) {
                        return spTranslateFilter('ui_access_request_accounts_selected', getTotal());
                    }
                    else if (getTotal() === 1) {
                        return spTranslateFilter('ui_access_request_account_selected');
                    }

                    throw 'Should not retrieve message with no account selections.';
                };
            },
            template:
                '<div class="selected-account-panel"> ' +
                '  <div ng-if="hasAccountSelections()" class="well m-t-sm" ' +
                '       ng-class="{ \'b-danger\': spRequestedItem.hasMissingAccountSelections() }"> ' +
                '    <p class="text-info" ' +
                '       ng-class="{ \'text-danger\': spRequestedItem.hasMissingAccountSelections() }"> ' +
                '      <button type="button" class="btn btn-white btn-sm" tabindex="50" ' +
                '              aria-label="{{ getMessage() }}" ' +
                '              ng-click="spOnClick()"> ' +
                '        <i role="presentation" class="fa fa-pencil"></i> ' +
                '        <b class="sr-only">{{ getMessage() }}</b> ' +
                '      </button> ' +
                '      <b aria-hidden="true">{{ getMessage() }}</b> ' +
                '    </p> ' +
                '  </div> ' +
                '</div>'
        };
    }]);
