(function() {
    'use strict';

    /* jshint maxparams: 13 */
    function AccessRequestIdentitiesCtrl(accessRequestIdentityService, accessRequestDataService,
        configService, AccessRequestIdentity, IDENTITY_DETAIL_TEMPLATE_URL, SearchData, spModal,
        $q, accessRequestFilterService, spTranslateFilter, SP_CONFIG_SERVICE, $timeout, $stateParams) {

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
        AccessRequestIdentitiesCtrl._super.call(this, SearchData, $q, $timeout, configService,
                                                accessRequestDataService.selectIdentitiesPageState);


        ////////////////////////////////////////////////////////////////////////
        //
        // PROPERTIES
        //
        ////////////////////////////////////////////////////////////////////////

        /**
         * An array of all of the AccessRequestIdentity objects that match the current filter on the page.
         * These are not full AccessRequestIdentity objects, just simple ones that contain id/name.
         * @type {Array}
         */
        this.allIdentities = undefined;

        /**
         * The full count of identities that match the current filter - This can be more than the length
         * of allIdentities.  The max length of allIdentities will always be capped at the LCM config
         * value that specifies the max number of identities that you can have in your cart.  This count
         * reflects the total number of identities that match the current filter, so it can be much greater.
         * @type {int}
         */
        this.allIdentitiesCount = 0;

        /**
         * Indicates that all identities that match the current filter are currently already selected and
         * contained in the identities array.
         * @type {boolean}
         */
        this.allSelected = false;

        /**
         * This controls whether we are showing the list of identities that can be added to the cart
         * vs. what identities are already in the cart
         * @type {boolean}
         */
        this.selectedDisplayed = false;

        /**
         * The page state for the list of selected identities.
         * @type {PageState}
         */
        this.selectedPageState = undefined;

        /**
         * When the user unselects all identities from the "selected identities" view, we need to keep a backup
         * list of what was originally in the identities list so we can put it back if they hit select all again
         * @type {Array}
         */
        this.backupSelectedIdentities = undefined;

        ////////////////////////////////////////////////////////////////////////
        //
        // AbtractListCtrl Methods
        //
        ////////////////////////////////////////////////////////////////////////

        /**
         * A simple switch that returns the appropriate page state depending on which view is selected,
         * either the identity selection view or the list of selected identities view
         * @returns {PageState}
         */
        this.getPageState = function() {
            return this.selectedDisplayed ? this.selectedPageState : this.pageState;
        };

        /*
         * Perform the search for identities.
         */
        this.doSearch = function(searchTerm, filterValues, startIdx, itemsPerPage) {
            var fetchAllPromise, fetchPromise;

            // Return the usual identities.
            fetchPromise = accessRequestIdentityService.getIdentities(searchTerm, filterValues, startIdx, itemsPerPage);

            // Also fetch all identities to get them set into the controller,
            // and decorate the selectAll after this is done.
            fetchAllPromise = this.fetchAllIdentities().then(decorateSelectAllIdentities);

            return $q.all([fetchPromise, fetchAllPromise]).then(function(results) {
                // Only return the fetch promise to the caller.
                return results[0];
            });
        };

        /*
         * Load the identity filters.
         */
        this.doLoadFilters = function() {
            return accessRequestFilterService.getIdentityFilters();
        };

        /*
         * Return the key of the ColumnConfigs to use.
         */
        this.getColumnConfigKey = function() {
            return AccessRequestIdentity.IDENTITY_CARD_COL_CONFIG;
        };

        /**
         * Extend the normal initialization process to also decorate the select all
         * identities button and pre-load the identity details config.
         */
        this.initialize = function() {
            // check to see if selectedView is to be shown
            this.selectedDisplayed = $stateParams.selectedView;

            // initialize selectedPageState
            this.selectedPageState = accessRequestDataService.selectedIdentitiesPageState;

            if (this.selectedDisplayed) {
                setupToggleShowSelected();
            }

            var promise = AccessRequestIdentitiesCtrl._super.prototype.initialize.apply(this, arguments),
                fetchAllPromise = me.fetchAllIdentities();

            // prefetch identity details meta data
            configService.getIdentityDetailsConfig();

            return $q.all([promise, fetchAllPromise]).then(function(result) {
                /* Decorate the select all button in case the user has come back to the select user tab
                and already has identities in their cart */
                decorateSelectAllIdentities();
            });
        };

        /**
         * Overrides the AbstractListCtrl to call fetchSelectedIdentities if the selected view is currently active.
         * Falls back to the super.fetchIdentities() call if the selected view is not active
         * @returns {Promise} a promise of the fetchItems
         */
        this.fetchItems = function() {
            var promise = this.selectedDisplayed ? this.fetchSelectedIdentities() :
                AccessRequestIdentitiesCtrl._super.prototype.fetchItems.apply(this, arguments);
            return promise;
        };

        ////////////////////////////////////////////////////////////////////////
        //
        // SHOW SELECTED METHODS
        //
        ////////////////////////////////////////////////////////////////////////

        /**
         * Get the selectedDisplayed value
         * @returns {boolean}
         */
        this.isSelectedDisplayed = function() {
            return this.selectedDisplayed;
        };


        /**
         * Toggles the display of the page between the identities that you can select and the identities
         * that you have selected
         */
        this.toggleShowSelected = function() {
            this.selectedDisplayed = !this.selectedDisplayed;

            setupToggleShowSelected();

            this.fetchItems();
        };

        /**
         * Fetches the selected identities from the accessRequestIdentity service by providing the full list of ids
         * that we've currently selected
         * @returns {Promise} a promise
         */
        this.fetchSelectedIdentities = function() {
            var pagingData = this.getPageState().pagingData,
                promise = accessRequestIdentityService.getSelectedIdentities(this.backupSelectedIdentities,
                        pagingData.getStart(), pagingData.itemsPerPage);

            /* Reset items so the loading mask is displayed */
            this.items = undefined;

            return promise.then(function(response) {
                me.items = response.data.objects;
                me.getPageState().pagingData.setTotal(response.data.count);
            });
        };


        ////////////////////////////////////////////////////////////////////////
        //
        // SELECT ALL METHODS
        //
        ////////////////////////////////////////////////////////////////////////

        /**
         * Determines whether the allSelected property should be true or false based on whether
         * all of the identities that match the current search filter are contained in the
         * list of selected identities.
         */
        function decorateSelectAllIdentities() {
            if(me.selectedDisplayed) {
                me.allSelected =
                    accessRequestDataService.getIdentities().length === me.backupSelectedIdentities.length &&
                        accessRequestDataService.hasIdentities(me.backupSelectedIdentities);
            } else {
                me.allSelected = me.allIdentities.length > 0 &&
                    accessRequestDataService.hasIdentities(me.allIdentities);
            }
        }

        /**
         * Get ready to show the selected view.
         * Backup selected identities, decorate the select all button and reset paging.
         */
        function setupToggleShowSelected() {
            /* Make a backup of the selected identities */
            me.backupSelectedIdentities = accessRequestDataService.getIdentities();

            /* Determine whether we should hightlight the select all button */
            decorateSelectAllIdentities();

            /* Reset the paging on the pageState */
            me.getPageState().pagingData.currentPage = 1;
        }

        /**
         * Fetch the list of all identities that match the current query parameters.
         */
        this.fetchAllIdentities = function() {
            var searchTerm = me.pageState.searchData.searchTerm,
                filterValues = me.pageState.searchData.filterValues,
                promise = accessRequestIdentityService.getAllIdentities(searchTerm,
                    filterValues);

            return promise.then(function(response) {
                me.allIdentities = response.data.objects;
                me.allIdentitiesCount = response.data.count;
            });
        };

        /**
         * @return {Promise} A promise that resolves.
         */
        function resolveMe() {
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
        }

        /**
         * Toggles the select all state of the page.  Then either adds the ids/names of the
         * identities that match the current search to the list or removes them from the list
         */
        this.toggleSelectAllIdentities = function() {
            var adding = !me.allSelected,
                requestedRolePromise;

            /* Validate that we aren't potentially adding too many identities
             * Do this first so we don't modify removed access item selections 
             * if we cannot select anything new.
             */
            if (!me.selectedDisplayed && adding) {
                if(me.allIdentitiesCount > me.allIdentities.length ||
                    !accessRequestDataService.validateCanAddIdentities(me.allIdentities)) {
                    me.showTooManySelectionsError();
                    return;
                }
            }

            // If we are adding identities, check that there aren't any roles in the cart.
            requestedRolePromise = (adding) ? preventAddingIdentityIfRoleIsRequested() : resolveMe();
            requestedRolePromise.then(function() {
                // Make sure that there is not any removed access in the cart.
                return me.checkRemovedAccess();
            }).then(function() {
                /* If we are in the selected identities view, we will just be adding/removing
                 from the list of current identities
                 */
                if(me.selectedDisplayed) {
                    if(adding) {
                        accessRequestDataService.addIdentities(me.backupSelectedIdentities);
                    } else {
                        accessRequestDataService.removeAllIdentities();
                    }
                } else {
                    if(adding) {
                        accessRequestDataService.addIdentities(me.allIdentities);
                    } else {
                        accessRequestDataService.removeIdentities(me.allIdentities);
                    }
                }

                accessRequestDataService.resetManageAccessPaging();

                /* Toggle the selected state */
                me.allSelected = !me.allSelected;
            });
        };

        /**
         * If the user tries to add too many selections to their cart (more than the configured limit),
         * we tell them that is a big no-no
         */
        this.showTooManySelectionsError = function() {
            spModal.open({
                title: 'ui_access_request_too_many_identities_title',
                warningLevel: 'warn',
                type: 'alert',
                content: spTranslateFilter('ui_access_request_too_many_identities_content',
                    configService.getConfigValue(SP_CONFIG_SERVICE.ACCESS_REQUEST_MAX_IDENTITY_SELECT))
            });
        };


        ////////////////////////////////////////////////////////////////////////
        //
        // IDENTITY SELECTION METHODS
        //
        ////////////////////////////////////////////////////////////////////////

        /**
         * @return {boolean} True if there are any requested roles in the cart.
         */
        function hasRoleRequest() {
            var hasRole = false;

            // Check if there are any roles in the cart.
            accessRequestDataService.getRequestedItems().forEach(function(requested) {
                if (requested.item.isRole()) {
                    hasRole = true;
                }
            });

            return hasRole;
        }

        /**
         * Check to see if there are any roles that are requested, and if so show a warning
         * dialog that says that they will lose all requested items if they add the identity.
         * If the user chooses to add the identity, the requested items are cleared from the
         * cart.
         *
         * @return {Promise} A promise that resolves if the identity should be added, and
         *    rejects otherwise.
         */
        function preventAddingIdentityIfRoleIsRequested() {
            var promise;

            if (hasRoleRequest()) {
                promise = spModal.open({
                    title: 'ui_error_warn_title',
                    content: spTranslateFilter('ui_access_request_lose_requested_roles_warning'),
                    warningLevel: 'warning',
                    backdrop: 'static',
                    buttons: [{
                        displayValue: 'ui_no',
                        // This causes the modal to reject.
                        close: false
                    }, {
                        displayValue: 'ui_yes',
                        primary: true,
                        action: function() {
                            // Clear all of the requested items if they choose to continue.
                            accessRequestDataService.clearRequestedItems();
                        },
                        // This causes the modal to resolve.
                        close: true
                    }]
                }).result;
            }

            // If there are no role requests, just return a promise that resolves.
            return promise || resolveMe();
        }

        /**
         * Return a non-null array of the AccessRequestIdentity objects that have been selected.
         *
         * @return {Array<AccessRequestIdentity>} A non-null array of the
         *    AccessRequestIdentity objects that have been selected.
         */
        this.getSelectedIdentities = function() {
            return accessRequestDataService.getIdentities();
        };

        /**
         * Select the given identity.  This will check for error/warning conditions
         * and prevent adding the identity if it should not be added.
         *
         * @param {AccessRequestIdentity} identity  The identity to select.
         */
        this.selectIdentity = function(identity) {
            // If this would add too many identities, don't do anything else.
            if(!accessRequestDataService.validateCanAddIdentities([identity])) {
                me.showTooManySelectionsError();
                return;
            }

            // Warn if there are any roles in the cart.
            preventAddingIdentityIfRoleIsRequested().then(function() {
                // If they chose to continue, check whether there is any removed access.
                return me.checkRemovedAccess();
            }).then(function() {
                var result = accessRequestDataService.addIdentity(identity);
                /* Determine if all is selected again */
                decorateSelectAllIdentities();
                if (result) {
                    accessRequestDataService.resetManageAccessPaging();
                }
                return result;
            });
        };

        /**
         * Deselect the given identity.
         *
         * @param {AccessRequestIdentity} identity  The identity to deselect.
         * @return {Promise} Promise that resolves with truthy value of whether
         *                   identity was deselected or not.
         */
        this.deselectIdentity = function(identity) {
            return this.checkRemovedAccess().then(function() {
                var result;
                me.allSelected = false;
                result = accessRequestDataService.removeIdentity(identity);
                if (result) {
                    accessRequestDataService.resetManageAccessPaging();
                }
                return result;
            });
        };

        /**
         * Return whether the given identity is selected.
         *
         * @param {AccessRequestIdentity} identity  The identity.
         *
         * @return {Boolean} True if the identity is selected, false otherwise.
         */
        this.isIdentitySelected = function(identity) {
            return accessRequestDataService.hasIdentity(identity);
        };

        /**
         * Check if any removed current access items have been selected. If so, prompt with a dialog
         * warning that these will be removed if identity selection continues
         * @returns {Promise} Promise that resolves if we should continue with selection,
         *     and reject otherwise.
         */
        this.checkRemovedAccess = function() {
            var hasRemovedAccessItems = accessRequestDataService.getRemovedCurrentAccessItems().length > 0,
                promise;

            if (hasRemovedAccessItems) {
                promise = spModal.open({
                    title: 'ui_error_warn_title',
                    content: spTranslateFilter('ui_access_request_lose_removed_access_items_warning'),
                    warningLevel: 'warning',
                    backdrop: 'static',
                    buttons: [{
                        displayValue: 'ui_no',
                        close: false
                    }, {
                        displayValue: 'ui_yes',
                        primary: true,
                        action: function() {
                            accessRequestDataService.removeAllRemovedCurrentAccessItems();
                        },
                        close: true
                    }]
                }).result;
            }

            // If there are no removed items, return a promise that resolves.
            return promise || resolveMe();
        };


        ////////////////////////////////////////////////////////////////////////
        //
        // IDENTITY DETAILS METHODS
        //
        ////////////////////////////////////////////////////////////////////////

        /**
         * Open the identity details modal dialog
         *
         * @param {AccessRequestIdentity} identity  The identity to display.
         *
         * @throws If the given identity is null.
         */
        this.showIdentityDetails = function(identity) {
            if (!identity) {
                throw 'Identity is required.';
            }
    
            // Dialog config and identity details will be retrieved by dialogCtrl
            spModal.open({
                title: 'ui_access_identity_detail_title',
                templateUrl: IDENTITY_DETAIL_TEMPLATE_URL,
                isContextual: true,
                controller: 'IdentityDetailDialogCtrl as dialogCtrl',
                resolve: {
                    identityId: function() {
                        return identity.getId();
                    }
                }
            });
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
    SailPoint.extend(AccessRequestIdentitiesCtrl, SailPoint.search.AbstractListCtrl);


    ////////////////////////////////////////////////////////////////////////////
    //
    // ANGULARJS REGISTRATION
    //
    ////////////////////////////////////////////////////////////////////////////

    angular.module('sailpoint.accessrequest').

    constant('IDENTITY_DETAIL_TEMPLATE_URL',
             SailPoint.CONTEXT_PATH + '/ui/js/accessRequest/template/identity-detail-dialog.html').

    controller('AccessRequestIdentitiesCtrl',
               ['accessRequestIdentityService', 'accessRequestDataService', 'configService', 'AccessRequestIdentity',
                'IDENTITY_DETAIL_TEMPLATE_URL', 'SearchData', 'spModal', '$q', 'accessRequestFilterService',
                'spTranslateFilter', 'SP_CONFIG_SERVICE', '$timeout', '$stateParams',
                AccessRequestIdentitiesCtrl]);
})();
