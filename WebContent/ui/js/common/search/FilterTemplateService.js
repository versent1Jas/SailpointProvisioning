'use strict';

/**
 * A service for retrieving the template associated with a Filter
 */
angular.module('sailpoint.search').
    service('filterTemplateService', ['Filter', 'browserSniffer', function(Filter, browserSniffer) {
        function isSimpleString(filter) {
            return filter.dataType === Filter.DATA_TYPE_STRING && !filter.allowedValues;
        }

        function isNumber(filter) {
            return filter.dataType === Filter.DATA_TYPE_NUMBER;
        }

        function isDate(filter) {
            return filter.dataType === Filter.DATA_TYPE_DATE;
        }

        function isIdentity(filter) {
            return filter.dataType === Filter.DATA_TYPE_IDENTITY;
        }

        function isAllowedValue(filter) {
            return filter.dataType === Filter.DATA_TYPE_STRING && filter.allowedValues;
        }

        function isBoolean(filter) {
            return filter.dataType === Filter.DATA_TYPE_BOOLEAN;
        }
        
        function isApplications(filter) {
            return filter.dataType === Filter.DATA_TYPE_APPLICATION && filter.multiValued;
        }

        function isApplicationAttributes(filter) {
            return filter.dataType === Filter.DATA_TYPE_ATTRIBUTE && filter.multiValued;
        }

        /**
         * Return the id attribute/value to put into the template element.  Use
         * attrName as the attribute name if specified, otherwise just use 'id'.
         */
        function getIdAttr(id, attrName) {
            var attr = attrName || 'id';
            return attr + '="' + id + '"';
        }

        /**
         * Helper method to get the *real* id value to use (i.e. for suggests)
         */
        function getIdValue(filter, id) {
            var idValue = id;
            if(isIdentity(filter)) {
                idValue = filter.getSuggestId() || id;
            }
            return idValue;
        }

        /**
         * Returns the template for the specified filter
         * @param {Filter} filter  The filter to get a template for
         * @param {String} id  The ID of the input element to create.
         * @param {String} labelText The text to use for label (instead of <label> element)
         * @returns {String} The Template
         * @throws If filter is unsupported or an ID or filter is not specified.
         */
        this.getFilterTemplate = function(filter, id, labelText) {
            var suggestId, suggestContext;

            if (!filter) {
                throw 'Filter is required.';
            }
            if (!id) {
                throw 'id is required.';
            }

            if(isSimpleString(filter)) {
                return '<input ' + getIdAttr(id) +
                ' type="text" class="form-control" ng-model="ngModel" tabindex="50" />';
            }
            if(isNumber(filter)) {
                if(browserSniffer.isIE()) {
                    // IE's input type="number" handling of numbers is essentially broken, so we need to
                    // use a text field to filter the contents appropriately.
                    return '<input ' + getIdAttr(id) + ' sp-number-input="true"' +
                        ' type="text" class="form-control" ng-model="ngModel" tabindex="50"/>';
                }
                else {
                    return '<input ' + getIdAttr(id) +
                        ' type="number" class="form-control" ng-model="ngModel" tabindex="50"/>';
                }
            } else if(isDate(filter)) {
                return '<input ' + getIdAttr(id, 'sp-datepicker-id') + ' sp-datepicker="ngModel" ' +
                    'alt="' + filter.label + '" tabindex="50" />';
            } else if(isIdentity(filter)) {
                suggestId = getIdValue(filter, id);
                suggestContext = filter.getSuggestContext() || 'Global';

                return '<div ' + getIdAttr(suggestId, 'sp-identity-suggest-id') +
                       '   sp-identity-suggest="" ' +
                       '   sp-identity-suggest-context="' + suggestContext + '" ' +
                       '   ng-model="ngModel" ' +
                       '   sp-identity-suggest-limit="5"' +
                       '   sp-identity-suggest-editable="true"></div>';
            } else if(isAllowedValue(filter)) {
                return '<sp-dropdown ' + getIdAttr(id, 'sp-button-id') + ' ' +
                            'sp-options="{{spFilter.allowedValues}}" ' +
                            'sp-button-aria-label="' + labelText + '" ' +
                            'sp-show-blank="true" ' +
                            'ng-model="ngModel"/>';
            } else if(isBoolean(filter)) {
                return '<sp-boolean-dropdown ' + getIdAttr(id, 'sp-button-id') + ' ' +
                            'sp-show-blank="true" ' +
                            'sp-button-aria-label="' + labelText + '" ' +
                            'ng-model="ngModel"/>';
            } else if(isApplicationAttributes(filter)) {
                return '<sp-app-attribute-multi-suggest ' +
                            'ng-init="ngModel = ngModel || []" ' +
                            'ng-model="ngModel" '  +
                            'sp-app-attribute-multi-suggest-id="' + id + '"/>';
            } else if(isApplications(filter)) {
                return '<sp-application-multi-suggest ' +
                            'ng-init="ngModel = ngModel || []" ' +
                            'ng-model="ngModel" '  +
                            'sp-application-multi-suggest-id="' + id + '"/>';
            }

            throw 'Unsupported filter data type: ' + filter.dataType;
        };

        /**
         * Returns the ID of the actual input used for the filter. This is useful value to use in  
         * the "for" attribute in any label for the specified filter. 
         * @param {Filter} filter  The filter
         * @param {String} id  The ID of the input element
         * @returns {String} The ID for the actual input that should be tied to a label
         * @throws If ID or filter is not specified.
         */
        this.getInputId = function(filter, id) {
            if (!filter) {
                throw 'Filter is required.';
            }
            if (!id) {
                throw 'id is required.';
            }
            return getIdValue(filter, id);
        };
    }]);

