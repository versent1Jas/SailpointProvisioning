'use strict';

/**
 * Directive for a button indicating selected user/users for access request flow
 */
angular.module('sailpoint.accessrequest').
    directive('spSelectedIdentitiesButton', ['spTranslateFilter', '$window', function(spTranslateFilter, $window) {
        var SMALL_WIDTH = 768;
        return {
            restrict: 'E',
            replace: true,
            scope: {
                spIdentities: '&',
                spId: '@',
                spOnClick: '&',
                spSelectedDisplayed: '&'
            },
            link: function(scope) {

                /**
                 * Truncates the user name if it is longer than the calculated width of the
                 * containing button div.
                 *
                 * @param {String} User name
                 * @returns {String} Possibly truncated user name
                 */
                function truncate(name) {
                    /* Calculate the max width based on 50% button width divided by a constant. */
                    var maxNameLength = Math.floor(($window.innerWidth / 2) / 9);
                    if($window.innerWidth < SMALL_WIDTH && name.length > maxNameLength) {
                        name = name.substring(0, maxNameLength) + '...';
                    }
                    return name;
                }

                /**
                 * Return the label to display for the button text.
                 */
                scope.getLabel = function() {
                    var buttonLabel;
                    if (scope.spSelectedDisplayed()) {
                        buttonLabel = spTranslateFilter('ui_access_show_all');
                    }
                    else if (scope.hasIdentities()) {
                        if (scope.spIdentities().length === 1) {
                            // Single identity, show displayable name
                            buttonLabel = truncate(scope.spIdentities()[0].getDisplayableName());
                        } else {
                            // Multiple identities, show count
                            buttonLabel = scope.spIdentities().length;
                        }
                    } else {
                        // No identities, show zero
                        buttonLabel = 0;
                    }
                    return buttonLabel;
                };

                /**
                 * Return the label to display for small screens
                 */
                scope.getSmallLabel = function() {
                    if (!scope.spSelectedDisplayed() && (scope.hasIdentities() && scope.spIdentities().length === 1)) {
                        return scope.spIdentities().length;
                    }
                    return scope.getLabel();
                };

                /**
                 * Return the text to read for a screen reader on the button.
                 */
                scope.getScreenReaderText = function() {
                    var txt;
                    if (scope.spSelectedDisplayed()) {
                        txt = spTranslateFilter('ui_access_show_all');
                    }
                    else {
                        if (!scope.hasIdentities()) {
                            // No identities, show "no users selected"
                            txt = spTranslateFilter('ui_access_no_users_selected');
                        }
                        else if (scope.spIdentities().length === 1) {
                            // Single identity, show displayable name
                            txt = spTranslateFilter('ui_access_one_user_selected',
                                              scope.spIdentities()[0].getDisplayableName());
                        } else {
                            // Multiple identities, show count
                            txt = spTranslateFilter('ui_access_x_users_selected',
                                              scope.spIdentities().length);
                        }
                    }
                    return txt;
                };

                /**
                 * Return whether any identities are selected.
                 */
                scope.hasIdentities = function() {
                    return (scope.spIdentities() && scope.spIdentities().length > 0);
                };

                /**
                 * Only disable the button when in show all view and no identities are selected
                 *
                 * @returns {boolean}
                 */
                scope.shouldDisableButton = function() {
                    return !scope.hasIdentities() && !scope.spSelectedDisplayed();
                };
            },

            template:
                '<button aria-label="{{getScreenReaderText()}}" id="{{spId}}" '+
                '   ng-click="spOnClick()" class="btn btn-sm pull-left" ' +
                '   ng-class="{ \'disabled\' : shouldDisableButton(), ' +
                '   \'btn-success\': hasIdentities() && !spSelectedDisplayed(), ' +
                    '\'btn-white\': !hasIdentities() || spSelectedDisplayed()}"' +
                '   role="button" type="button" tabindex="50" ng-disabled="shouldDisableButton()">' +
                '  <i class="fa fa-user" role="presentation"></i> ' +
                '  <span aria-hidden="true" class="hidden-xs-inline">{{getLabel()}}</span>' +
                '  <span aria-hidden="true" class="visible-xs-inline">{{getSmallLabel()}}</span>' +
                '  <span class="sr-only">{{getScreenReaderText()}}</span>' +
                '</button>'
        };
    }]);
