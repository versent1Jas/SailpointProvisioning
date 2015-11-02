'use strict';

/**
 * PagingData holds information that helps with pagination - items per page,
 * number of pages, total results, and methods to deal with these.
 */
angular.module('sailpoint.search').

factory('PagingData', function() {

    ////////////////////////////////////////////////////////////////////////////
    //
    // CONSTRUCTOR
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Constructor.
     *
     * @param {Number} itemsPerPage  The number of items to display on each page.
     *   Defaults to 12 if not specified.
     */
    function PagingData(itemsPerPage) {
        // Default to 12 items per page if not specified.
        this.itemsPerPage = itemsPerPage || 12;
    }


    ////////////////////////////////////////////////////////////////////////////
    //
    // PROPERTIES
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * @property {Number} itemsPerPage  The number of items to display on each
     * page.
     */
    PagingData.prototype.itemsPerPage = undefined;

    /**
     * @property {Number} currentPage  The 1-based index of the current page.
     * This can be set directly or via the previous() and next() methods. 
     */
    PagingData.prototype.currentPage = 1;

    /**
     * @property {Number} total  The total number of results.  This should be
     * set via setTotal().
     * @private
     */
    PagingData.prototype._total = undefined;

    
    ////////////////////////////////////////////////////////////////////////////
    //
    // METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Set the total number of results.  This may also change the current page
     * if the current page is no longer in the bounds of the new total.
     *
     * @param {Number} total  The total number of results.
     */
    PagingData.prototype.setTotal = function(total) {
        var pageCount;

        this._total = total;

        // Make sure that the currentPage is within the bounds.
        pageCount = this.getPageCount(total);
        this.currentPage = Math.min(this.currentPage, pageCount);
    };

    /**
     * @return {Number} The total number of results.
     */
    PagingData.prototype.getTotal = function() {
        return this._total;
    };

    /**
     * @throws If the total has not been set.
     */
    PagingData.prototype.assertTotal = function() {
        if (angular.isUndefined(this._total)) {
            throw 'total must be set before calling hasNext().';
        }
    };

    /**
     * Decrement the current page if not already on the first page.
     *
     * @return {Boolean}  True if the current page was decremented, false otherwise.
     *
     * @throws If total has not be set before calling this method.
     */
    PagingData.prototype.previous = function() {
        if (this.hasPrevious()) {
            this.currentPage--;
            return true;
        }
        return false;
    };

    /**
     * Increment the current page if not already on the last page.
     *
     * @return {Boolean}  True if the current page was incremented, false otherwise.
     *
     * @throws If total has not be set before calling this method.
     */
    PagingData.prototype.next = function() {
        if (this.hasNext()) {
            this.currentPage++;
            return true;
        }
        return false;
    };

    /**
     * @return {Boolean} True if there is a previous page before the current page.
     *
     * @throws If total has not be set before calling this method.
     */
    PagingData.prototype.hasPrevious = function() {
        this.assertTotal();
        return (this.currentPage > 1);
    };

    /**
     * @return {Boolean} True if there is a next page after the current page.
     *
     * @throws If total has not be set before calling this method.
     */
    PagingData.prototype.hasNext = function() {
        var totalPages;
        this.assertTotal();
        totalPages = Math.ceil(this._total / this.itemsPerPage);
        return (this.currentPage < totalPages);
    };

    /**
     * @return {Number} The zero-based start index for the first item in the
     * list - this is the actual item index and not the page index.
     */
    PagingData.prototype.getStart = function() {
        return (this.currentPage-1) * this.itemsPerPage;
    };

    /**
     * Return the number of pages (min of 1) for the given number of total
     * objects - this ignores the "total" property.
     *
     * @param {Number} numObjects  The number of total objects for which to
     *   return the page count.
     */
    PagingData.prototype.getPageCount = function(numObjects) {
        return Math.max(Math.ceil(numObjects / this.itemsPerPage), 1);
    };

    /**
     * Return true if there are multiple pages and false otherwise.
     */
    PagingData.prototype.hasMultiplePages = function() {
        return this.getPageCount(this.getTotal()) > 1;
    };

    /**
     * Reset current page to the first page.
     */
    PagingData.prototype.resetCurrentPage = function() {
        this.currentPage = 1;
    };

    return PagingData;
});
