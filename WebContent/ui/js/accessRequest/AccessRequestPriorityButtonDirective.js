/**
 * Directive to render access a button for choosing the priority of an access request
 *
 * sp-on-click (Optional) - Ties the clicking of a priority option to the actual method that should be fired when
 * the priority is set.
 *
 * sp-priority (Optional) - The default priority to set when the directive is initialized.
 */
angular.module('sailpoint.accessrequest').
    directive('spAccessRequestPriorityButton', ['spTranslateFilter', function (spTranslateFilter) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                spOnClick: '&',
                spPriority: '='
            },
            link: function (scope, el, attrs) {
                scope.setPriority = function (priority) {
                    scope.spPriority = priority;
                    if(scope.spOnClick) {
                        scope.spOnClick({priority: priority});
                    }
                };
                scope.isLow = function () {
                    return scope.spPriority === 'Low';
                };
                scope.isHigh = function () {
                    return scope.spPriority === 'High';
                };
                scope.isNormal = function () {
                    return !scope.spPriority || scope.spPriority === 'Normal';
                };

                /**
                 * Return the text to read for a screen reader on the button.
                 */
                scope.getScreenReaderText = function () {
                    var txt;
                    if (scope.isHigh()) {
                        txt = spTranslateFilter('ui_access_priority_high_xs');
                    } else if (scope.isLow()) {
                        txt = spTranslateFilter('ui_access_priority_low_xs');
                    } else {
                        txt = spTranslateFilter('ui_access_priority_normal_xs');
                    }
                    return txt;
                };
            },
            template:
                '<div id="btnRequestAccessPriorityContainer" class="btn-group sp-access-request-priority-btn">'+
                    '<button id="btnRequestAccessPriority" data-toggle="dropdown" tabindex="50" ' +
                        'aria-label="{{getScreenReaderText()}}" ' +
                        'class="btn  btn-sm dropdown-toggle hidden-xs"'+
                        'ng-class="{ \'btn-white\': isNormal(), ' +
                            '\'btn-danger\': isHigh(), ' +
                            '\'btn-info\': isLow()}">' +
                        '<span ng-if="isNormal()">' +
                            '<i role="presentation" class="fa fa-flag m-r-xs text-success"></i> ' +
                            '{{\'ui_access_priority_normal_xs\' | spTranslate}} <i class="fa fa-chevron-down"></i>'+
                        '</span>' +
                        '<span ng-if="isHigh()">' +
                            '<i role="presentation" class="fa fa-flag m-r-xs"></i> ' +
                            '{{\'ui_access_priority_high_xs\' | spTranslate}} <i class="fa fa-chevron-down"></i>'+
                        '</span>' +
                        '<span ng-if="isLow()">' +
                            '<i role="presentation" class="fa fa-flag m-r-xs"></i> ' +
                            '{{\'ui_access_priority_low_xs\' | spTranslate}} <i class="fa fa-chevron-down"></i>'+
                        '</span>' +
                    '</button>'+
                    '<button id="btnRequestAccessPriorityXS" data-toggle="dropdown" tabindex="50" ' +
                        'class="btn btn-sm dropdown-toggle visible-xs"'+
                        'ng-class="{ \'btn-white\': isNormal(), ' +
                            '\'btn-danger\': isHigh(), ' +
                            '\'btn-info\': isLow()}">'+
                        '<i class="fa fa-flag" ng-class="{\'text-success\' : isNormal()}"></i> ' +
                        '<span ng-if="isNormal()">{{\'ui_access_priority_normal_xs\' | spTranslate}} </span>' +
                        '<span ng-if="isHigh()">{{\'ui_access_priority_high_xs\' | spTranslate}} </span>' +
                        '<span ng-if="isLow()">{{\'ui_access_priority_low_xs\' | spTranslate}} </span>' +
                        '<i class="fa fa-chevron-down"></i>'+
                    '</button>'+
                    '<ul class="dropdown-menu" id="dropdownRequestAccessPriority" role="menu" ' +
                        'aria-labelledby="btnRequestAccessPriority">' +
                        '<li role="presentation">'+
                            '<a id="optionRequestAccessPriorityHigh" href="" role="menuitem" tabindex="50" ' +
                                'ng-click="setPriority(\'High\')">' +
                                '<i role="presentation" class="fa fa-flag m-r-xs text-danger"></i>' +
                                '{{\'ui_access_priority_high\' | spTranslate}}'+
                                ' <i class="fa fa-check text-muted" ng-if="isHigh()"></i>' +
                            '</a>'+
                        '</li>'+
                        '<li role="presentation">'+
                            '<a id="optionRequestAccessPriorityNormal" href="" role="menuitem" tabindex="50" ' +
                                'ng-click="setPriority(\'Normal\')">' +
                                '<i role="presentation" class="fa fa-flag m-r-xs text-success"></i>' +
                                '{{\'ui_access_priority_normal\' | spTranslate}}'+
                                ' <i class="fa fa-check text-muted" ng-if="isNormal()")></i>' +
                            '</a>'+
                        '</li>'+
                        '<li role="presentation">'+
                            '<a id="optionRequestAccessPriorityLow" href="" role="menuitem" tabindex="50" ' +
                                'ng-click="setPriority(\'Low\')">' +
                                '<i role="presentation" class="fa fa-flag m-r-xs text-info"></i>' +
                                '{{\'ui_access_priority_low\' | spTranslate}}'+
                                ' <i class="fa fa-check text-muted" ng-if="isLow()"></i>' +
                            '</a>'+
                        '</li>'+
                    '</ul>'+
                '</div>'
        };
    }]);
