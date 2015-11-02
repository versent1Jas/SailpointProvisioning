/**
 * Directive that renders a date picker that toggles open with a button
 * @param {expression} spDatepicker The data value to bind
 * @param {String} spDatepickerId This will be the id of the input
 * @param {expression} min The minimum date value
 * @param {expression} max The maximum date value
 * @param {String} alt Alternate text to be read by screen readers
 * @param {String} format The format string
 */
angular.module('sailpoint.form').
    config(['datepickerConfig', function(datepickerConfig) {
        /* Show weeks should be off by default.  Enable it on a case by case basis */
        datepickerConfig.showWeeks = false;
    }]).
    directive('spDatepicker', ['$locale', 'spTranslateFilter', function($locale, spTranslateFilter) {
        /**
         * Return a locale specific date format that does not contain ambiguous values (i.e. yy vs YYYY)
         * @returns {string} Returns a less ambiguous date format
         */
        function getDisplayableLocaleFormat() {
            return expandFormat($locale.DATETIME_FORMATS.shortDate,
                spTranslateFilter('ui_datepicker_format_letter_day'),
                spTranslateFilter('ui_datepicker_format_letter_month'),
                spTranslateFilter('ui_datepicker_format_letter_year'));
        }

        /**
         * Return a locale specific date format compatible with date filter
         * @returns {string} Date filter compatible format string
         */
        function getDateFilterFormat() {
            return expandFormat($locale.DATETIME_FORMATS.shortDate, 'd', 'M', 'y');
        }

        function expandFormat(format, dayLetter, monthLetter, yearLetter) {
            var dayRegexp = /d+/i,
                dayLiteral = dayLetter + dayLetter,
                monthRegexp = /m+/i,
                monthLiteral = monthLetter + monthLetter;
            return expandYears(format, yearLetter).
                replace(dayRegexp, dayLiteral).
                replace(monthRegexp, monthLiteral);
        }

        function expandYears(format, yearLetter) {
            var yearRegexp = /y+/i,
                yearLiteral = yearLetter + yearLetter + yearLetter + yearLetter;
            return format.replace(yearRegexp, yearLiteral);
        }

        return {
            restrict: 'EA',
            templateUrl: 'form/sp-datepicker.html',
            replace: 'true',
            scope: {
                spDatepicker: '=',
                spDatepickerId: '@',
                minDate: '=',
                maxDate: '=',
                alt: '@',
                format: '@'
            },
            link: function(scope, element, attributes) {
                scope.opened = false;
                scope.toggleOpen = function($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    scope.opened = !scope.opened;
                };

                // Don't calculate the displayable locale format in the link function
                // because spTranslate is not ready to translate yet.  Just let the
                // template call this function.
                scope.getDisplayableFormat = getDisplayableLocaleFormat;

                scope.dateFilterFormat = scope.format || getDateFilterFormat();
                /* Expand the year so datepicker renders the dates with the correct year format */
                scope.innerFormat = expandYears(scope.format || $locale.DATETIME_FORMATS.shortDate, 'y');
                scope.spDatepickerId = scope.spDatepickerId || 'datepickerInput';
            }
        };
    }]).
    /**
     * Directive for validating a date against a minimum date.  Used by SpDatepicker
     */
    directive('spDateMin', function() {
        return {
            require: 'ngModel',
            // set priority for parser ordering
            priority: 1,
            link: function(scope, elm, attrs, ctrl) {
                var validator = function(viewValue, returnUndefined) {
                    var enteredDate = new Date(viewValue).setHours(0, 0, 0, 0),
                        attrVal = scope.$eval(attrs.spDateMin),
                        minDate = new Date(attrVal).setHours(0, 0, 0, 0);
                    if (attrVal && viewValue) {
                        if(minDate <= enteredDate) {
                            // it is valid
                            ctrl.$setValidity('spDateMin', true);
                            return viewValue;
                        } else {
                            // it is invalid, return undefined (no model update)
                            ctrl.$setValidity('spDateMin', false);
                            return (returnUndefined) ? undefined : viewValue;
                        }
                    } else {
                        ctrl.$setValidity('spDateMin', true);
                        return viewValue;
                    }
                };

                ctrl.$parsers.push(function(viewValue) { return validator(viewValue, true); });
                ctrl.$formatters.push(function(viewValue) { return validator(viewValue, false); });
            }
        };
    }).
    /**
     * Directive for validating a date against a minimum date.  Used by SpDatepicker
     */
    directive('spDateMax', function() {
        return {
            require: 'ngModel',
            // set priority for parser ordering
            priority: 1,
            link: function(scope, elm, attrs, ctrl) {
                scope.spDateMax = scope.$eval(attrs.spDateMax);
                var validator = function(viewValue, returnUndefined) {
                    var enteredDate = new Date(viewValue).setHours(0, 0, 0, 0),
                        attrVal = scope.$eval(attrs.spDateMax),
                        maxDate = new Date(attrVal).setHours(0, 0, 0, 0);
                    if (attrVal && viewValue) {
                        if(maxDate >= enteredDate) {
                            // it is valid
                            ctrl.$setValidity('spDateMax', true);
                            return viewValue;
                        } else {
                            // it is invalid, return undefined (no model update)
                            ctrl.$setValidity('spDateMax', false);
                            return (returnUndefined) ? undefined : viewValue;
                        }
                    } else {
                        ctrl.$setValidity('spDateMax', true);
                        return viewValue;
                    }
                };
                
                ctrl.$parsers.push(function(viewValue) { return validator(viewValue, true); });
                ctrl.$formatters.push(function(viewValue) { return validator(viewValue, false); });
            }
        };
    }).directive('spDateFormat', ['spDateService', function(spDateService) {
        return {
            require: 'ngModel',
            // set priority to 2 so this parser will run first
            priority: 2,
            link: function(scope, elm, attrs, ctrl) {
                var validator = function(viewValue, returnUndefined) {
                    if (!viewValue || angular.isDate(viewValue)) {
                        ctrl.$setValidity('spDateFormat', true);
                        return viewValue;
                    } else if (angular.isString(viewValue)) {
                        var attrVal = scope.$eval(attrs.spDateFormat),
                                date = spDateService.parseDate(viewValue, attrVal);
                        if (date) {
                            ctrl.$setValidity('spDateFormat', true);
                            return date;
                        } else {
                            ctrl.$setValidity('spDateFormat', false);
                            return (returnUndefined) ? undefined : viewValue;
                        }
                    } else {
                        ctrl.$setValidity('spDateFormat', false);
                        return (returnUndefined) ? undefined : viewValue;
                    }
                };
                ctrl.$parsers.unshift(function(viewValue) { return validator(viewValue, true); });
                ctrl.$formatters.unshift(function(viewValue) { return validator(viewValue, false); });
            }
        };
    }]).
    /**
     * Directive to override the default behavior of ui.bootstrap.datepickerPopup.  In the bootstrap implementation
     * pressing the down arrow will open the datepicker.  However this is undesirable for 508 compliance so we need
     * to override that keydown handler with our own.
     * @see line 1535 of ui-bootstrap-tpls-0.11.0.js
     */
    directive('spPopupOverride', function() {
        return {
            restrict: 'A',
            priority: 2,
            link: function(scope, element, attrs, ctrl) {
                var keydown = function(evt) {
                    scope.keydown(evt);
                };
                element.unbind('keydown'); // Remove the default bootstrap handler
                element.bind('keydown', keydown); // and add our own to prevent the down arrow action

                scope.keydown = function(evt) {
                    if (evt.which === 27) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        scope.close();
                    }
                    else if (evt.which === 40 && !scope.isOpen) {
                        evt.preventDefault();
                        evt.stopPropagation();
                    }
                };
            }
        };
    });

angular.module('form/sp-datepicker.html', []).
    run(['$templateCache', function($templateCache) {
        $templateCache.put('form/sp-datepicker.html',
            '<div class="datepicker-container"> ' +
                '<p class="input-group" ng-form="innerForm"> ' +
                    '<input alt="{{\'ui_datepicker_placeholder\' | spTranslate:' +
                           '(alt | spTranslate):' +
                           '(format || getDisplayableFormat())}}" ' +
                           'id="{{spDatepickerId}}" ' +
                           'type="text" class="form-control" ' +
                           'sp-popup-override tabindex="50" ' +
                           'datepicker-popup="{{innerFormat}}" ' +
                           'ng-model="spDatepicker" ' +
                           'show-button-bar="false" ' +
                           'placeholder="{{format || getDisplayableFormat()}}" ' +
                           'is-open="opened" ' +
                           'min-date="minDate" ' +
                           'max-date="maxDate" ' +
                           'show-weeks="false" ' +
                           'sp-date-min="minDate" ' +
                           'sp-date-max="maxDate" ' +
                           'sp-date-format="innerFormat"' +
                           'aria-controls="minErr maxErr dateErr" ' +
                           'name="dateField"/>' +
                    '<span class="input-group-btn"> ' +
                        '<button class="btn btn-white" ' +
                                'type="button" ' +
                                'aria-hidden="true" ' +
                                'ng-click="toggleOpen($event)" ' +
                                'tabindex="-1">' +
                            '<i class="fa fa-calendar"></i>' +
                        '</button> ' +
                    '</span> ' +
                '</p> ' +
                '<div ng-if="innerForm.dateField.$error.spDateMin" ' +
                     'id="minErr" role="alert" aria-live="polite" ' +
                     'class="text-danger reader-error m-t-sm">' +
                     '{{\'ui_datepicker_min_error\' | spTranslate : ' +
                     '(alt | spTranslate) : ' +
                     '(minDate | date : dateFilterFormat)}}' +
                '</div>' +
                '<div ng-if="innerForm.dateField.$error.spDateMax" ' +
                     'id="maxErr" role="alert" aria-live="polite" ' +
                     'class="text-danger reader-error m-t-sm">' +
                     '{{\'ui_datepicker_max_error\' | spTranslate : ' +
                     '(alt | spTranslate) : ' +
                     '(maxDate | date : dateFilterFormat)}}' +
                '</div>' +
                '<div ng-if="innerForm.dateField.$error.spDateFormat" ' +
                    'id="dateErr" role="alert" aria-live="polite" ' +
                    'class="text-danger reader-error m-t-sm">' +
                    '{{\'ui_datepicker_format_error\' | spTranslate : ' +
                    '(alt | spTranslate) : ' +
                    '(format || getDisplayableFormat())}}' +
                '</div>' +
            '</div>' +
        '');
    }]);

