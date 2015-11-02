'use strict';

/**
 * A Filter describes a field that can be used for filtering a search.  This
 * includes information required to render the filter in the UI and to pass
 * filter values up to a list REST resource.
 */
angular.module('sailpoint.search').

factory('Filter', [function() {

    ////////////////////////////////////////////////////////////////////////////
    //
    // CONSTRUCTOR
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Constructor.
     *
     * @param {Object} data  The object containing the data with which to
     *    construct this filter - typically returned from a REST resource.
     *
     * @throws If the data is null or there is no 'property' in the data.
     */
    function Filter(data) {
        if (!data) {
            throw 'Data is required to construct a filter.';
        }
        if (!data.property) {
            throw 'A property is required for a filter.';
        }

        this.property = data.property;
        this.multiValued = !!data.multiValued;
        this.label = data.label;
        this.dataType = data.dataType || Filter.DATA_TYPE_STRING;
        this.allowedValues = data.allowedValues;
        this.attributes = data.attributes;
    }


    ////////////////////////////////////////////////////////////////////////////
    //
    // CONSTANTS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * @constant {String} DATA_TYPE_STRING  Data type for string filters.
     */
    Filter.DATA_TYPE_STRING = 'String';

    /**
     * @constant {String} DATA_TYPE_NUMBER  Data type for number filters.
     */
    Filter.DATA_TYPE_NUMBER = 'Number';

    /**
     * @constant {String} DATA_TYPE_BOOLEAN  Data type for boolean filters.
     */
    Filter.DATA_TYPE_BOOLEAN = 'Boolean';

    /**
     * @constant {String} DATA_TYPE_DATE  Data type for date filters.
     */
    Filter.DATA_TYPE_DATE = 'Date';

    /**
     * @constant {String} DATA_TYPE_IDENTITY  Data type for identity filters.
     */
    Filter.DATA_TYPE_IDENTITY = 'Identity';

    /**
     * @constant {String} DATA_TYPE_APPLICATION Data type for application filters.
     */
    Filter.DATA_TYPE_APPLICATION = 'Application';

    /**
     * @constant {String} DATA_TYPE_ATTRIBUTE Data type for attribute filters.
     */
    Filter.DATA_TYPE_ATTRIBUTE = 'Attribute';

    /**
     * @constant {String} ATTR_SUGGEST_CONTEXT  The name of the attribute that
     *    holds the suggest context.  This should match the constant in ListFilterDTO.
     */
    Filter.ATTR_SUGGEST_CONTEXT = 'suggestContext';

    /**
     * @constant {String} ATTR_SUGGEST_ID  The name of the attribute that holds
     *    the suggestId.  This should match the constant in ListFilterDTO.
     */
    Filter.ATTR_SUGGEST_ID = 'suggestId';


    ////////////////////////////////////////////////////////////////////////////
    //
    // PROPERTIES
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * @property {String} property  The name of the property being searched.
     */
    Filter.prototype.property = undefined;

    /**
     * @property {boolean} multiValued  Whether the filter allows searching for
     *    multiple values.
     */
    Filter.prototype.multiValued = false;

    /**
     * @property {String} label  The message key for the label to display when
     *    rendering the filter.
     */
    Filter.prototype.label = undefined;

    /**
     * @property {String} dataType  The type of filter to display - one of the
     *    DATA_TYPE constants.  Defaults to string.
     */
    Filter.prototype.dataType = Filter.DATA_TYPE_STRING;

    /**
     * @property {Array} allowedValues  An optional array of allowed values that
     *    can be displayed in a drop-down when rendering filters.
     */
    Filter.prototype.allowedValues = undefined;

    /**
     * @property {Object} attributes  An optional object with key/value pairs
     *    that can be used to assist in rendering the filter.  These are specific
     *    to the type of filter.
     */
    Filter.prototype.attributes = undefined;


    ////////////////////////////////////////////////////////////////////////////
    //
    // METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Return the value for the requested attribute, or null if not available.
     */
    Filter.prototype.getAttribute = function(attr) {
        var val = null;
        if (this.attributes && this.attributes[attr]) {
            val = this.attributes[attr];
        }
        return val;
    };

    /**
     * Return the suggest context from this filter's attributes if available.
     */
    Filter.prototype.getSuggestContext = function() {
        return this.getAttribute(Filter.ATTR_SUGGEST_CONTEXT);
    };

    /**
     * Return the suggestId from this filter's attributes if available.
     */
    Filter.prototype.getSuggestId = function() {
        return this.getAttribute(Filter.ATTR_SUGGEST_ID);
    };


    return Filter;
}]);
