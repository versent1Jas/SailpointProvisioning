'use strict';

/**
 * PageState encapsulates information about a search page in order to be able
 * to restore the state when returning to a page.  Often this is stored in a
 * service.
 */
angular.module('sailpoint.search').

factory('PageState', ['PagingData', 'SearchData',
                      function(PagingData, SearchData) {

    ////////////////////////////////////////////////////////////////////////////
    //
    // CONSTRUCTOR
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Default constructor - initialized with default PagingData and SearchData.
     */
    function PageState() {
        this.pagingData = new PagingData();
        this.searchData = new SearchData();
    }


    ////////////////////////////////////////////////////////////////////////////
    //
    // PROPERTIES
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * @property {PagingData} pagingData  The PagingData for this page.
     */
    PageState.prototype.pagingData = undefined;

    /**
     * @property {SearchData} searchData  The SearchData for this page.
     */
    PageState.prototype.searchData = undefined;

    return PageState;
}]);
