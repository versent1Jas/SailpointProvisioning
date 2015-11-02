'use strict';

SailPoint.ns('SailPoint.search');


////////////////////////////////////////////////////////////////////////////////
//
// CONSTRUCTOR
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Constructor for the AbstractListCtrl abstract class - this should only be
 * called by sub-classes.  An AbstractListCtrl contains common behavior for
 * loading items in a list page, searching/filtering, paging, etc...
 * Sub-classes should implement the abstract methods to return the correct data,
 * filters, and configuration to use to display their specific data.
 *
 * @param {SearchData} searchData  The SearchData class.
 * @param (Object} $q  The $q service.
 * @param {Object} $timeout  The $timeout service.
 * @param {Object} configService  The configService.
 * @param {PageState} initialPageState  The PageState to use when the page is
 *     initially loaded.
 *
 * @throws If initialPageState is null or doesn't have search data.
 */
SailPoint.search.AbstractListCtrl = function(SearchData, $q, $timeout, configService, initialPageState) {
    if (!initialPageState || !initialPageState.searchData) {
        throw 'Initial page state with searchData is required.';
    }

    // Save the dependencies on this object so the methods on the prototype
    // can access them.
    this.$q = $q;
    this.$timeout = $timeout;
    this.configService = configService;

    // Set up the page state based on the initial state.
    this.pageState = initialPageState;
    this.searchScratchPad = new SearchData(initialPageState.searchData);
};


// Add the properties and methods to the class.
angular.extend(SailPoint.search.AbstractListCtrl.prototype, {

    ////////////////////////////////////////////////////////////////////////////
    //
    // PROPERTIES
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * An array of objects to be displayed.
     */
    items: undefined,

    /**
     * Holds items until columnConfig is ready.
     */
    tmpItems: undefined,

    /**
     * Holds item count until columnConfig is ready.
     */
    tmpCount: undefined,

    /**
     * The page state for the list.
     * @type {PageState}
     */
    pageState: undefined,

    /**
     * Intermediary place between the searchData and the UI.  When search/apply is clicked
     * the values should be copied over to the searchData shared with the service
     * @type {SearchData}
     */
    searchScratchPad: undefined,

    /**
     * Array of ColumnConfigs used to display card data.  This is automatically
     * populated during initialization if the sub-class returns a value from
     * getColumnConfigKey(), otherwise it is the responsibility of the sub-class
     * to load and use the appropriate column config.
     *
     * @type {Array}
     */
    columnConfigs: undefined,

    /**
     * An array of all filters to be displayed in the filter panel.
     *
     * @type Array<Filter>
     */
    filters: undefined,

    /**
     * A boolean indicating if the filter panel is collapsed or expanded
     */
    filtersDisplayed: false,

    /**
     * Used to indicate that the result set should be focused
     * @type {boolean}
     */
    focusResults: false,


    ////////////////////////////////////////////////////////////////////////////
    //
    // ABSTRACT METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Sub-class should implement to perform the search for items using the
     * given parameters.
     *
     * @param {String} searchTerm  The search term to search with.
     * @param {Object} filterValues  An object with key/value pairs of filter
     *     properties and their values.
     * @param {Number} startIdx  The zero-based start index.
     * @param {Number} itemsPerPage  The numbef of items to display per page.
     *
     * @return {Promise<ListResult>} A promise that will resolve to a ListResult
     *     with the requested items.
     */
    doSearch: function(searchTerm, filterValues, startIdx, itemsPerPage) {
        throw 'Must be implemented in sub-class.';
    },

    /**
     * Sub-class should implement to retrieve the Filters to be displayed in the
     * filter panel.
     *
     * @return {Promise<Array<Filter>>} A promise that will resolve to an array
     *     of Filters to be displayed in the filter panel.
     */
    doLoadFilters: function() {
        throw 'Must be implemented in sub-class.';
    },

    /**
     * Sub-classes may implement this to return the configuration key that holds
     * the ColumnConfigs for this list page.  If unimplemented, this returns null
     * and the sub-class is responsible for managing ColumnConfigs.
     */
    getColumnConfigKey: function() {
        return null;
    },


    ////////////////////////////////////////////////////////////////////////////
    //
    // METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Fetch the objects for the current page by delegating to doSearch() and
     * set the results when complete.
     */
    fetchItems: function() {
        var searchTerm = this.getPageState().searchData.searchTerm,
            filterValues = this.getPageState().searchData.filterValues,
            pagingData = this.getPageState().pagingData,
            promise = this.doSearch(searchTerm, filterValues, pagingData.getStart(), pagingData.itemsPerPage),
            me = this;

        if (this.items) {
            /* Reset items so the loading mask is displayed */
            this.items = undefined;
        }

        return promise.then(function(response) {
            me.setItems(response.data.objects, response.data.count);
        });
    },

    /**
     * Search handler.  Executes search sets current page to 1.  If event is passed
     * search is only performed if event is for the enter key
     *
     * @param {KeyboardEvent} [keyEvent] If specified search is only performed if for enter key
     */
    search: function(keyEvent) {
        var me = this,
            searchTimeout = 0;

        /* If we got a key event see if it was enter */
        if(keyEvent && keyEvent.keyCode !== 13) {
            return;
        }

        if (this.filtersDisplayed) {
            /* Give some time for the collapsing animation to complete */
            searchTimeout = 400;
            /* Reset items so the loading mask is displayed */
            this.items = undefined;
            /* Hide the filter panel */
            this.filtersDisplayed = false;
        }

        // Use timeout to avoid DOM conflicts and let the animations complete if necessary
        this.$timeout(function() {
            // Scrub the scratch pad filters to get rid of any empty junk.
            me.searchScratchPad.scrubFilterValues();

            // Transfer scratch value to search value.
            me.getPageState().searchData.merge(me.searchScratchPad);

            // Go back to the first page.
            me.getPageState().pagingData.currentPage = 1;

            // Send the focus back to the results after searching.
            me.focusResults = true;

            // Fetch the items
            me.fetchItems();
        }, searchTimeout);
    },

    /**
     * Fetches previous page of results updating page state
     */
    nextPage: function() {
        if (this.getPageState().pagingData.next()) {
            this.fetchItems();
        }
    },

    /**
     * Fetches next page of results updating page state
     */
    previousPage: function() {
        if (this.getPageState().pagingData.previous()) {
            this.fetchItems();
        }
    },

    /**
     * Returns the pageState object
     * @returns {PageState|pageState}
     */
    getPageState: function() {
        return this.pageState;
    },

    /**
     * Return whether to show the current page info ("Showing x-y of z").  This
     * is not displayed if there are no results.
     */
    showCurrentPageInfo: function() {
        return !!this.getPageState().pagingData.getTotal();
    },

    /**
     * Function that toggles the filter panel between collapsed and expanded
     */
    toggleFiltersDisplayed: function() {
        this.filtersDisplayed = !this.filtersDisplayed;
    },

    /**
     * Return true if any filters have values and have been applied.
     */
    hasAppliedFilters: function() {
        return this.getPageState().searchData.hasFilterValues();
    },

    /**
     * Determines if the loading mask should be shown or not.
     * @returns {boolean}
     */
    isPageReady: function() {
        return (this.columnConfigs && this.items);
    },

    /**
     * Sets the items only if columnConfigs is defined, otherwise will store them in tmpItems
     * until setColumnConfigs is called.
     *
     * @param items objects to be displayed
     * @param count total number of results
     */
    setItems: function(items, count) {
        if(this.columnConfigs) {
            this.items = items;
            this.getPageState().pagingData.setTotal(count);
        }
        else {
            this.tmpItems = items;
            this.tmpCount = count;
        }
    },

    /**
     * Sets columnConfigs, then updates items and pagingData.total count.
     *
     * @param configs array of column configs
     */
    setColumnConfigs: function(configs) {
        this.columnConfigs = configs;
        if(this.tmpItems) {
            this.items = this.tmpItems;
            this.tmpItems = undefined;
            this.getPageState().pagingData.setTotal(this.tmpCount);
            this.tmpCount = undefined;
        }
    },


    ////////////////////////////////////////////////////////////////////////////
    //
    // INITIALIZATION
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the data for this controller.  Sub-classes should call this
     * when they are constructed.
     *
     * @return {Promise} A promise that is resolved when both the configuration
     *    and data fetching are complete.
     */
    initialize: function() {
        var configKey = this.getColumnConfigKey(),
            blockingPromises = [],
            me = this,
            fetchPromise, configPromise;

        // Load the items.
        fetchPromise = this.fetchItems();
        blockingPromises.push(fetchPromise);

        // If the sub-class returns a column config key, load them.
        if (configKey) {
            configPromise = this.configService.getColumnConfigEntries(configKey).
                then(function(result) {
                    me.setColumnConfigs(result.data[configKey]);
                });
            blockingPromises.push(configPromise);
        }

        // Load the filters.
        this.doLoadFilters().then(function(filters) {
            me.filters = filters;
        });

        return this.$q.all(blockingPromises);
    }
});
