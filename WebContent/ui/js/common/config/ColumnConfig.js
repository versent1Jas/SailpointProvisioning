/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

/**
 * A ColumnConfigObject is a model object that represents a ColumnConfig from UIConfig.
 */
angular.module('sailpoint.config').
    factory('ColumnConfig', ['$filter', function($filter) {

        /**
         * Constructor.
         *
         * @param {Object} data  An object with the data for this column config.
         *
         * @throws If data is null or not an object.
         */
        function ColumnConfig(data) {

            // Throw if the data is null or not a javascript object.
            if (!angular.isObject(data)) {
                throw 'Data required in constructor.';
            }

            if (!angular.isDefined(data.dataIndex)) {
                throw 'dataIndex is a required property for ColumnConfig.';
            }

            // Instance variables.
            this.dataIndex = data.dataIndex;
            this.label = data.label || data.dataIndex;
            this.renderer = data.renderer;
            this.dateStyle = data.dateStyle;

            // Since fieldOnly is boolean, we should set it even if
            // it's not defined in the constructor config
            this.fieldOnly = false;

            if (angular.isDefined(data.fieldOnly)) {
                this.fieldOnly = data.fieldOnly;
            }
        }

        /**
         * Return the dataIndex of the identity.
         */
        ColumnConfig.prototype.getDataIndex = function() {
            return this.dataIndex;
        };

        /**
         * Returns the localized label for this field (or dataIndex if headerKey was null).
         */
        ColumnConfig.prototype.getLabel = function() {
            return this.label;
        };

        /**
         * Return the name of the renderer.
         */
        ColumnConfig.prototype.getRenderer = function() {
            return this.renderer;
        };

        /**
         * Return the if this is a field only config
         */
        ColumnConfig.prototype.isFieldOnly = function() {
            return this.fieldOnly;
        };

        /**
         * Returns the date style for this config.
         */
        ColumnConfig.prototype.getDateStyle = function() {
            return this.dateStyle;
        };

        /**
         * Returns if the column should be displayed.
         */
        ColumnConfig.prototype.isDisplayed = function() {
            return !this.fieldOnly;
        };

        /**
         * Returns the value, rendered with appropriate filters.
         * @returns string
         */
        ColumnConfig.prototype.renderValue = function(value, object) {
            try {
                if (this.renderer) {
                    return $filter(this.renderer)(value, object);
                }
                else if (this.dateStyle) {
                    return $filter('date')(value, this.dateStyle);
                }
            }
            catch (e) {
                throw 'Unable to apply filter ' + this.renderer + ' on value ' + value + '\n' + e.message;
            }

            return value;
        };

        return ColumnConfig;
    }]);
