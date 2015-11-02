SailPoint.ns('SailPoint.util');


/**
 * Constructor - create a SortOrder using a property and whether to sort
 * ascending or not.
 * 
 * @param {String} property  The name of the property to sort by.
 * @param {boolean} ascending  Optional sort direction - if not specified
 *    this defaults to true.
 */
SailPoint.util.SortOrder = function(property, ascending) {

    this.sorts = [];

    if (property) {
        this.addSort(property, ascending);
    }
};


/**
 * Constant for ascending sort order.
 */
SailPoint.util.SortOrder.ORDER_ASC = 'ASC';

/**
 * Constant for descending sort order.
 */
SailPoint.util.SortOrder.ORDER_DESC = 'DESC';


/**
 * SortOrder holds information about how to order list results.  This allows
 * sorting by multiple properties (ie - secondary sort, etc...).
 */
SailPoint.util.SortOrder.prototype = {

    /**
     * Add sorting by the given property and direction.
     * 
     * @param {String} property  The name of the property to sort by.
     * @param {boolean} ascending  Optional sort direction - if not specified
     *    this defaults to true.
     * 
     * @return This SortOrder to allow chaining. 
     */
    addSort: function(property, ascending) {
        // Default to ascending if not specified.
        if (angular.isUndefined(ascending)) {
            ascending = true;
        }

        // BaseListResource expect the ASC/DESC values.
        this.sorts.push({
            property: property,
            direction: (ascending) ? SailPoint.util.SortOrder.ORDER_ASC
                                   : SailPoint.util.SortOrder.ORDER_DESC
        });
        
        return this;
    },

    /**
     * Add the given SortOrder to this sort order.
     * 
     * @param {SortOrder} sort  The SortOrder to add to this order.
     * 
     * @return This SortOrder to allow chaining. 
     */
    add: function(sort) {
        if (sort) {
            this.sorts = this.sorts.concat(sort.getSorts());
        }

        return this;
    },

    /**
     * Return an array of sort objects that contain the property and direction.
     */
    getSorts: function() {
        return this.sorts;
    },

    /**
     * Convert this object to JSON.
     */
    toJson: function() {
        return angular.toJson(this.getSorts());
    }
};
