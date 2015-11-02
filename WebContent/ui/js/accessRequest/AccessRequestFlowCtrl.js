'use strict';

/**
 * The AccessRequestFlowCtrl provides information about which navigation elements
 * are available based on the selection state.
 */
angular.module('sailpoint.accessrequest').

    controller('AccessRequestFlowCtrl',
               ['accessRequestDataService', '$state',
                function(accessRequestDataService, $state) {

    ////////////////////////////////////////////////////////////////////////////
    //
    // TAB STATES
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Return whether the "Manage Access" tab is enabled.
     *
     * @return {Boolean} True if the "Manage Access" tab is enabled, false otherwise.
     */
    this.isManageAccessTabEnabled = function() {
        // Enabled after at least one identity is selected.
        return accessRequestDataService.isManageAccessTabEnabled();
    };

    /**
     * Return whether the "Remove Access" tab is enabled.
     *
     * @return {Boolean} True if the "Remove Access" tab is enabled, false otherwise.
     */
    this.isRemoveAccessTabEnabled = function() {
        // Enabled after at least one identity is selected.
        return accessRequestDataService.isRemoveAccessTabEnabled();
    };

    /**
     * Return whether the "Review" tab is enabled.
     *
     * @return {Boolean} True if the "Review" tab is enabled, false otherwise.
     */
    this.isReviewTabEnabled = function() {
        // Enabled after at least one identity is selected and one item has been
        // selected.
        return accessRequestDataService.isReviewTabEnabled();
    };

    /**
     * @return {Boolean} Whether the "Manage Access" tab is selected.
     */
    this.isManageAccessTabSelected = function() {
        // Use includes() since this could be the add or remove sub-navs.
        return $state.includes('accessRequest.manageAccess');
    };


    ////////////////////////////////////////////////////////////////////////////
    //
    // COUNTS ON TABS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * @return {Number} The number of items being requested for addition.
     */
    this.getAddedItemsCount = function() {
        return accessRequestDataService.getRequestedItems().length;
    };

    /**
     * @return {Number} The number of items being requested for removal.
     */
    this.getRemovedItemsCount = function() {
        return accessRequestDataService.getRemovedCurrentAccessItems().length;
    };
    
    /**
     * @returns {Number} The number of total items requested to be reviewed
     */
    this.getReviewItemsCount = function() {
        return this.getAddedItemsCount() + this.getRemovedItemsCount();
    };


    /**
     * @return {boolean} True if the user has made any selections in their cart,
     *     false otherwise.
     */
    this.isDirty = function() {
        return accessRequestDataService.isDirty();
    };

    this.isSelfService = function() {
        return accessRequestDataService.isSelfService();
    };
}]);
