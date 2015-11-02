(function() {
    'use strict';

    /**
     * The CurrentAccessItemsCtrl handles listing/searching and selecting items
     * to remove from a user.  This is only available if a single identity has
     * been selected when requesting access.
     */
    /* jshint maxparams: 11*/
    function CurrentAccessItemsCtrl(accessRequestItemsService, accessRequestDataService,
                                    SearchData, configService, $q, $timeout, AccessRequestItem,
                                    CurrentAccessItem, accessRequestFilterService,
                                    CURRENT_ACCESS_ITEM_DETAIL_TEMPLATE_URL, spModal) {

        ////////////////////////////////////////////////////////////////////////
        //
        // PRIVATES
        //
        ////////////////////////////////////////////////////////////////////////

        var me = this;


        ////////////////////////////////////////////////////////////////////////
        //
        // CONSTRUCTOR
        //
        ////////////////////////////////////////////////////////////////////////

        // Call the super class constructor with the required parameters.
        CurrentAccessItemsCtrl._super.call(this, SearchData, $q, $timeout, configService,
                                           accessRequestDataService.removeAccessPageState);


        ////////////////////////////////////////////////////////////////////////
        //
        // AbtractListCtrl Methods
        //
        ////////////////////////////////////////////////////////////////////////

        /*
         * Perform the search for items.
         */
        this.doSearch = function(searchTerm, filterValues, startIdx, itemsPerPage) {
            return accessRequestItemsService.getCurrentAccessItems(searchTerm, filterValues, startIdx, itemsPerPage,
                                                                   accessRequestDataService.getRequesteeId());
        };

        /*
         * Load the item filters.
         */
        this.doLoadFilters = function() {
            return accessRequestFilterService.getCurrentAccessFilters(accessRequestDataService.getRequesteeId());
        };

        /**
         * This controller has two different column configs that it uses depending
         * on which card is being displayed.  During initialization we will load
         * both of these.
         */
        this.initialize = function() {
            var promise = CurrentAccessItemsCtrl._super.prototype.initialize.apply(this, arguments),
                configPromise;

            // Fetch the column configs for the card data.
            configPromise = configService.getColumnConfigEntries([CurrentAccessItem.UI_ROLE_COL_CONFIG,
                                                                  CurrentAccessItem.UI_ENTITLEMENT_COL_CONFIG]);

            // Set the column configs after everything has resolved.
            return $q.all([configPromise, promise]).then(function(result) {
                var cfgs = {};
                cfgs[AccessRequestItem.ACCESS_TYPE_ROLE] =
                    result[0].data[CurrentAccessItem.UI_ROLE_COL_CONFIG];

                cfgs[AccessRequestItem.ACCESS_TYPE_ENTITLEMENT] =
                    result[0].data[CurrentAccessItem.UI_ENTITLEMENT_COL_CONFIG];
                me.setColumnConfigs(cfgs);
            });
        };


        ////////////////////////////////////////////////////////////////////////
        //
        // ITEM SELECTION FUNCTIONS
        //
        ////////////////////////////////////////////////////////////////////////

        /**
         * Select the given item.
         *
         * @param {CurrentAccessItem} item  The CurrentAccessItem to select.
         */
        this.selectItem = function(item) {
            return accessRequestDataService.addRemovedCurrentAccessItem(item);
        };

        /**
         * Deselect the given item.
         *
         * @param {CurrentAccessItem} item  The item to deselect.
         */
        this.deselectItem = function(item) {
            return accessRequestDataService.removeRemovedCurrentAccessItem(item);
        };

        /**
         * Return whether the given item is selected.
         *
         * @param {CurrentAccessItem} item  The item.
         *
         * @return {Boolean} True if the item is selected, false otherwise.
         */
        this.isItemSelected = function(item) {
            return accessRequestDataService.hasRemovedCurrentAccessItem(item);
        };


        ////////////////////////////////////////////////////////////////////////
        //
        // COLUMN CONFIG FUNCTIONS
        //
        ////////////////////////////////////////////////////////////////////////

        /**
         * Returns the appropriate columnConfig for the give item type.
         *
         * @param item
         * @returns {*}
         */
        this.getColumnConfig = function(item) {
            return me.columnConfigs[item.getAccessType()];
        };

        ////////////////////////////////////////////////////////////////////////
        //
        // ITEM DETAILS METHODS
        //
        ////////////////////////////////////////////////////////////////////////


        /**
         * Opens the item details dialog
         * @param (AccessRequestItem) item The item to display in the dialog
         */
        this.showItemDetails = function(item) {
            if (!item) {
                throw 'Item is required.';
            }

            // Dialog config and identity details will be retrieved by dialogCtrl
            spModal.open({
                title: 'ui_access_item_detail_title',
                templateUrl: CURRENT_ACCESS_ITEM_DETAIL_TEMPLATE_URL,
                isContextual: true,
                controller: 'CurrentAccessItemDetailDialogCtrl as dialogCtrl',
                resolve: {
                    item: function() {
                        return item;
                    }
                }
            });
        };

        /**
         * Returns the message key associated with the role's status
         * @param item {CurrentAccessItem} Item to get the key for
         * @returns {string} The message key for the status
         * @throw If item is not from a role
         */
        this.getRoleStatus = function(item) {
            if(!item.isRole()) {
                throw 'item is not for a role';
            }
            if(item.isAssigned()) {
                return 'ui_access_request_current_access_assigned';
            } else if(item.isDetected()) {
                return 'ui_access_request_current_access_detected';
            }
            return 'ui_access_request_current_access_requested';
        };


        ////////////////////////////////////////////////////////////////////////
        //
        // INITIALIZATION
        //
        ////////////////////////////////////////////////////////////////////////

        // Initialize when the controller is constructed.
        this.initialize();
    }

    // Make this controller extend AbstractListCtrl.
    SailPoint.extend(CurrentAccessItemsCtrl, SailPoint.search.AbstractListCtrl);


    ////////////////////////////////////////////////////////////////////////////
    //
    // ANGULARJS REGISTRATION
    //
    ////////////////////////////////////////////////////////////////////////////

    angular.module('sailpoint.accessrequest').

    constant('CURRENT_ACCESS_ITEM_DETAIL_TEMPLATE_URL',
        SailPoint.CONTEXT_PATH + '/ui/js/accessRequest/template/current-access-item-detail-dialog.html').

    controller('CurrentAccessItemsCtrl',
        ['accessRequestItemsService', 'accessRequestDataService', 'SearchData','configService',
         '$q', '$timeout', 'AccessRequestItem', 'CurrentAccessItem', 'accessRequestFilterService',
         'CURRENT_ACCESS_ITEM_DETAIL_TEMPLATE_URL', 'spModal',
         CurrentAccessItemsCtrl]);
})();
