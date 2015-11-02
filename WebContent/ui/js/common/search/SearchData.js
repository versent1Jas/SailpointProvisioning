'use strict';

/**
 * SearchData encapsulates search filters and a general "search term" (something
 * that is typed into a quick filter text box).
 */
angular.module('sailpoint.search').

factory('SearchData', function() {

    ////////////////////////////////////////////////////////////////////////////
    //
    // CONSTRUCTOR
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Constructor function
     * @param {SearchData} [searchData] If defined values from this will be copied into the new SearchData
     */
    function SearchData(searchData) {
        this.filterValues = {};

        if (searchData) {
            this.merge(searchData);
        }
    }


    ////////////////////////////////////////////////////////////////////////////
    //
    // PROPERTIES
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * @property {String} searchTerm  A search term for the search (eg -
     * something that is typed into a quick filter text box).
     */
    SearchData.prototype.searchTerm = undefined;

    /**
     * @property {Object} filterValues  An object mapping a filter property
     * name to the value for that filter.
     */
    SearchData.prototype.filterValues = undefined;


    ////////////////////////////////////////////////////////////////////////////
    //
    // METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Merges the passed SearchData
     * @param {SearchData} searchData The SearchData to merge
     */
    SearchData.prototype.merge = function(searchData) {
        this.searchTerm = searchData.searchTerm;
        this.filterValues = angular.copy(searchData.filterValues);
    };

    /**
     * Clear any stored filter values.
     */
    SearchData.prototype.clearFilterValues = function() {
        /* Reset each property to uninitialized state.  This plays nicer
         * with data binding and arrays */
        angular.forEach(this.filterValues, function(value, key) {
            if(angular.isArray(value)) {
                this.filterValues[key] = [];
            } else {
                this.filterValues[key] = undefined;
            }
        }, this);
    };

    /**
     * @return {Boolean} True if there are any filter values, false otherwise.
     */
    SearchData.prototype.hasFilterValues = function() {
        var hasValues = false;
        angular.forEach(this.filterValues, function(value, key) {
            if (isValidValue(value)) {
                hasValues = true;
            }
        });
        return hasValues;
    };

    /**
     * Scrub any invalid values from filterValues.
     *
     * The only 'invalid' values that $http does not ignore are:
     *  - the empty string
     *  - a string that is all spaces
     *  - empty objects
     * so remove those.
     */
    SearchData.prototype.scrubFilterValues = function() {
        angular.forEach(this.filterValues, function(value, key) {
            if(angular.isString(value) && !value.trim()) {
                delete this.filterValues[key];
            }
            /* Note: The definition here of empty object is a little loose:
             *  - An object
             *  - That is not an array (empty arrays are ok)
             *  - That is not a Date
             *  - and does not declare any properties
             * This can be confused by
             *  function A() {};
             *  A.prototype.foo = 'defaultValue';
             *  var a = new A();
             * But above is not really ideal and foo should be initialized
             * in the constructor rather than on the prototype
             * See isValidValue
             */
            if(angular.isObject(value) && !angular.isArray(value) && !angular.isDate(value) &&
                Object.keys(value).length === 0) {
                delete this.filterValues[key];
            }
        }, this);
    };

    /**
     * Check if filter value is valid of not
     */
    var isValidValue = function(value) {
        var isNonEmptyString = (angular.isString(value) && value !== ''),
            isNonEmptyObject = (angular.isObject(value) && Object.keys(value).length > 0),
            isNonEmptyArray = (angular.isArray(value) && value.length > 0),
            isNumber = angular.isNumber(value),
            isDate = angular.isDate(value);
        return (isNonEmptyString || isNonEmptyObject || isNonEmptyArray || isNumber || isDate);
    };

    return SearchData;
});
