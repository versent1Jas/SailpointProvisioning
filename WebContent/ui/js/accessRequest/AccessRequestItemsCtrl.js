(function() {
    'use strict';

    /**
     * The AccessRequestItemsCtrl handles listing/searching access request items and
     * selecting items.
     */
    /* jshint maxparams: 15 */
    function AccessRequestItemsCtrl(accessRequestItemsService, accessRequestDataService,
                                    SearchData, configService, $q, $timeout, AccessRequestItem,
                                    accessRequestFilterService, accessRequestAccountSelectionService,
                                    spTranslateFilter, AccessRequestAdditionalQuestions, spModal,
                                    ADD_ACCESS_ITEM_DETAIL_TEMPLATE_URL, accessRequestDeepFilterService,
                                    spNotificationService) {

        ////////////////////////////////////////////////////////////////////////
        //
        // PRIVATES
        //
        ////////////////////////////////////////////////////////////////////////

        var me = this;

        var isDisplayPermittedRoles = {};

        /**
         * Allows us to trigger the display of the notification service error.
         * @type {boolean}
         */
        this.hasError = false;

        ////////////////////////////////////////////////////////////////////////
        //
        // CONSTRUCTOR
        //
        ////////////////////////////////////////////////////////////////////////

        // Call the super class constructor with the required parameters.
        AccessRequestItemsCtrl._super.call(this, SearchData, $q, $timeout, configService,
                                           accessRequestDataService.addAccessPageState);


        ////////////////////////////////////////////////////////////////////////
        //
        // AbtractListCtrl Methods
        //
        ////////////////////////////////////////////////////////////////////////

        /*
         * Perform the search for identities.
         */
        this.doSearch = function(searchTerm, filterValues, startIdx, itemsPerPage) {
            return accessRequestItemsService.getAccessRequestItems(searchTerm, filterValues, startIdx, itemsPerPage,
                                                                   accessRequestDataService.getRequesteeId());
        };

        /*
         * Load the identity filters.
         */
        this.doLoadFilters = function() {
            return accessRequestFilterService.getAccessItemFilters(accessRequestDataService.getRequesteeId());
        };

        /**
         * This controller has two different column configs that it uses depending
         * on which card is being displayed.  During initialization we will load
         * both of these.
         */
        this.initialize = function() {

            var promise = AccessRequestItemsCtrl._super.prototype.initialize.apply(this, arguments),
                configPromise;

            // Fetch the column configs for the card data.
            configPromise = configService.getColumnConfigEntries([AccessRequestItem.UI_ROLE_COL_CONFIG,
                                                                  AccessRequestItem.UI_ENTITLEMENT_COL_CONFIG]);

            var promises = [configPromise, promise];
            /* Process deep links - first add the target identity to the data service, then fetch and
             * add the search data item(s) that fit the request parameters */
            if (accessRequestDeepFilterService.isDeepLinkManageAccess()) {
                promises.push(accessRequestDeepFilterService.getTargetIdentity().then(function(identity) {
                    if (!identity) {
                        me.hasError = true;
                        spNotificationService
                            .setNotification('ui_access_request_invalid_deep_link_identity',
                                spNotificationService.ERROR);
                    } else {
                        accessRequestDataService.addIdentity(identity);

                        /* Needs to happen after we get the target identity so we can use the identity's id in the
                         * call to accessItems
                         */
                        return accessRequestDeepFilterService.getItemSearchData()
                            .then(function(searchData) {
                                me.searchScratchPad.searchTerm = searchData.searchTerm;
                                /* Use angular extend since we don't want to wipe out any blank arrays for multi-valued
                                attributes */
                                me.searchScratchPad.filterValues =
                                    angular.extend(me.searchScratchPad.filterValues, searchData.filterValues);
                                me.search();
                                accessRequestDeepFilterService.reset();
                            });
                    }
                }));
            }

            // Set the column configs after everything has resolved.
            return $q.all(promises).then(function(result) {
                var tmpColumnConfigs = {};
                tmpColumnConfigs[AccessRequestItem.ACCESS_TYPE_ROLE] =
                    result[0].data[AccessRequestItem.UI_ROLE_COL_CONFIG];

                tmpColumnConfigs[AccessRequestItem.ACCESS_TYPE_ENTITLEMENT] =
                    result[0].data[AccessRequestItem.UI_ENTITLEMENT_COL_CONFIG];

                // Need to call the super class setter to ensure this.items is updated appropriately.
                me.setColumnConfigs(tmpColumnConfigs);
            });
        };


        ////////////////////////////////////////////////////////////////////////
        //
        // ITEM SELECTION FUNCTIONS
        //
        ////////////////////////////////////////////////////////////////////////

        /**
         * Save the permits from the given questions for the given item.
         *
         * @param {AccessRequestItem} item  The item to save the permits for.
         * @param {AdditionalQuestions} addtQuestions  The additional questions.
         */
        function savePermits(item, addtQuestions) {
            // Save the permits.  Set this as an empty array if we got null back.
            var permits = addtQuestions.permittedRoles || [];
            accessRequestDataService.setPermittedRoles(item.getId(), permits);
        }

        /**
         * Handles additional questions on the selected item. Checks for errors and/or
         * launches additional questions dialog as needed. Returns promise which resolves if all
         * checks and selections are made successfully.
         * 
         * Note this assumes the AccessRequestItem has already been added to data service.
         *
         * @param {AccessRequestItem} item  The item being requested.
         * @param {AdditionalQuestions} addtQuestions  The additional questions.
         * @param {AccessRequestItem} permittedBy The role permitting item
         * 
         * @returns {Promise} Promise is resolved if all is well, rejected if error or canceled.
         */
        function handleAdditionalQuestions(item, addtQuestions, permittedBy) {
            var acctSelections = addtQuestions.accountSelections,
                ambiguousAssignedRoles = addtQuestions.ambiguousAssignedRoles,
                deferred = $q.defer(),
                result = deferred.promise;

            // Check the status to see if they are actually allowed to add the item.  If not, return false
            if(addtQuestions.status && !handleInvalidRequest(addtQuestions)) {
                deferred.reject();
            } else {
                // Save the permits.
                savePermits(item, addtQuestions);

                // If there are any ambiguous role assignments or account selections, display the dialog.
                if ((acctSelections && acctSelections.length) ||
                    (ambiguousAssignedRoles && ambiguousAssignedRoles.length)) {
                    accessRequestAccountSelectionService.
                        openDialog(item, acctSelections, ambiguousAssignedRoles,
                            (permittedBy) ? permittedBy.id : undefined, undefined)
                        .then(function(results) {
                            if (results.assignmentId) {
                                accessRequestDataService.setAssignmentId(item, results.assignmentId);
                            }
                            if (results.accountSelections) {
                                accessRequestDataService.setRequestedItemAccountSelections(item,
                                    results.accountSelections);
                            }
                            deferred.resolve();
                        }, function() {
                            deferred.reject();
                        });
                } else {
                    deferred.resolve();
                }
            }

            return result;
        }

        /**
         * Looks at the status on the additional questions for the item to determine if it can be added.
         * @param addtQuestions The additional questions object -- we are looking at the status on it
         * @returns {boolean} Returns true if the request is valid, false if invalid
         */
        function handleInvalidRequest(addtQuestions) {
            if(addtQuestions.status===AccessRequestAdditionalQuestions.STATUS_CURRENTLY_ASSIGNED) {
                showSelectionError('ui_access_request_select_prevented_currently_assigned');
                return false;
            } else if(addtQuestions.status===AccessRequestAdditionalQuestions.STATUS_PENDING_REQUEST) {
                showSelectionError('ui_access_request_select_prevented_pending');
                return false;
            }
            else if(addtQuestions.status === AccessRequestAdditionalQuestions.STATUS_INVALID_REQUESTEES ||
                    addtQuestions.status === AccessRequestAdditionalQuestions.STATUS_BULK_ASSIGNED_OR_PENDING) {

                spModal.open({
                    id: 'invalidRequesteesDialog',
                    title: 'ui_access_request_invalid_requestees_title',
                    backdrop: 'static',
                    warningLevel: 'warning',
                    templateUrl: SailPoint.CONTEXT_PATH +
                        '/ui/js/accessRequest/template/invalid-requestees-dialog.html',
                    controller: 'InvalidRequesteesDialogCtrl as dialogCtrl',
                    resolve: {
                        invalidRequestees: function() {
                            return addtQuestions.invalidRequestees;
                        },
                        renderLimit: function() {
                            return 5;
                        },
                        messageKey: function() {
                            if (addtQuestions.status === AccessRequestAdditionalQuestions.STATUS_INVALID_REQUESTEES) {
                                return 'ui_access_request_invalid_requestees_header';
                            }
                            else if (addtQuestions.status ===
                                AccessRequestAdditionalQuestions.STATUS_BULK_ASSIGNED_OR_PENDING) {
                                return 'ui_access_request_bulk_assigned_header';
                            }
                            return '';
                        }
                    },
                    buttons: [{
                        displayValue: 'ui_ok',
                        primary: true
                    }]
                });
                return false;
            }

            return true;
        }

        /**
         * If the user tries to select an item that they are unable to (currently assigned, pending), prompt them
         * @param statusKey (The i18n key to display as the error message when the modal appears
         */
        function showSelectionError(statusKey) {
            spModal.open({
                title: 'ui_access_request_select_prevented_title',
                warningLevel: 'warn',
                type: 'alert',
                content: spTranslateFilter(statusKey)
            });
        }

        /**
         * Select the given item.
         *
         * @param {AccessRequestItem} item  The AccessRequestItem to select.
         * @param {AccessRequestItem} permittedBy  The role that permits the
         *    role being selected, or null if there is not a permitting role.
         */
        this.selectItem = function(item, permittedBy) {
            var identityIds = accessRequestDataService.getIdentityIds(),
                otherRequestedRoles = accessRequestDataService.getOtherRequestedRoles(permittedBy),
                requestedItem = accessRequestDataService.getRequestedItem(item);

            accessRequestDataService.addRequestedItem(item, permittedBy);

            // Check to see if there are any additional questions.
            accessRequestItemsService.getAdditionalQuestions(item, identityIds, permittedBy,
                    requestedItem ? requestedItem.assignmentId : undefined, otherRequestedRoles)
                .then(function(addtQuestions) {
                    handleAdditionalQuestions(item, addtQuestions, permittedBy).then(null,
                        function() {
                            // If handleAdditionalQuestions rejects, remove the item
                            accessRequestDataService.removeRequestedItem(item);
                        });
                }).catch(function() {
                    // If handleAdditionalQuestions throws, remove the item
                    accessRequestDataService.removeRequestedItem(item);
                });
        };

        /**
         * Deselect the given item.
         *
         * @param {AccessRequestItem} item  The item to deselect.
         */
        this.deselectItem = function(item) {
            return accessRequestDataService.removeRequestedItem(item);
        };

        /**
         * Return whether the given item is selected.
         *
         * @param {AccessRequestItem} item  The item.
         *
         * @return {Boolean} True if the item is selected, false otherwise.
         */
        this.isItemSelected = function(item) {
            return accessRequestDataService.hasRequestedItem(item);
        };

        /**
         * Displays account selection dialog for item with existing request
         * @param {AccessRequestItem} item The item to reselect accounts for
         */
        this.editAccountSelections = function(item) {
            var requestedItem = accessRequestDataService.getRequestedItem(item);
            if(!requestedItem) {
                throw 'Could not find RequestedAccessItem';
            }
            accessRequestAccountSelectionService.editAccountSelections(requestedItem).then(function(results) {
                requestedItem.accountSelections = results.accountSelections;
            });
        };

        /**
         * Return the requested item for the given AccessRequestItem, or null if
         * there is not one.
         *
         * @param {AccessRequestItem} item  The AccessRequestItem.
         *
         * @return {RequestedAccessItem} The requested item, or null.
         */
        this.getRequestedItem = function(item) {
            return accessRequestDataService.getRequestedItem(item);
        };


        ////////////////////////////////////////////////////////////////////////
        //
        // PERMITTED ROLES
        //
        ////////////////////////////////////////////////////////////////////////

        /**
         * Return the permitted roles for the given item.
         *
         * @param {AccessRequestItem} item  The item for which to return roles.
         *
         * @return {Array<AccessRequestItem>} The permitted roles.
         */
        this.getPermittedRoles = function(item) {
            return accessRequestDataService.getPermittedRoles(item.getId());
        };

        /**
         * Returns the number of permitted roles for the item.
         *
         * @param AccessRequestItem item
         * @returns {number} permitted roles for this item
         */
        this.getSelectedPermittedRoleCount = function(item) {
            var permittedRoles = accessRequestDataService.getRequestedPermittedItems({item: item});
            if (permittedRoles) {
                return permittedRoles.length;
            } else {
                return 0;
            }
        };

        /**
         * Return whether permitted roles should be expanded or collapsed.
         *
         * @param {AccessRequestItem} item  The item for which to determine display status.
         *
         * @return {boolean} true if permits should be shown.
         */
        this.isShowPermittedRoles = function(item) {
            return !!isDisplayPermittedRoles[item.getId()];
        };

        /**
         * Toggle whether or not permitted roles should be shown.
         *
         * @param {AccessRequestItem} item  The item for which to toggle.
         */
        this.toggleShowPermittedRoles = function(item) {
            isDisplayPermittedRoles[item.getId()] = !isDisplayPermittedRoles[item.getId()];
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
                title: 'ui_access_item_detail_entitlement_title',
                templateUrl: ADD_ACCESS_ITEM_DETAIL_TEMPLATE_URL,
                isContextual: true,
                controller: 'AddAccessItemDetailDialogCtrl as dialogCtrl',
                resolve: {
                    item: function() {
                        return item;
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
    SailPoint.extend(AccessRequestItemsCtrl, SailPoint.search.AbstractListCtrl);


    ////////////////////////////////////////////////////////////////////////////
    //
    // ANGULARJS REGISTRATION
    //
    ////////////////////////////////////////////////////////////////////////////

    angular.module('sailpoint.accessrequest').

    constant('ADD_ACCESS_ITEM_DETAIL_TEMPLATE_URL',
        SailPoint.CONTEXT_PATH + '/ui/js/accessRequest/template/add-access-item-detail-dialog.html').

    controller('AccessRequestItemsCtrl',
        ['accessRequestItemsService', 'accessRequestDataService', 'SearchData','configService',
         '$q', '$timeout', 'AccessRequestItem', 'accessRequestFilterService', 'accessRequestAccountSelectionService',
         'spTranslateFilter', 'AccessRequestAdditionalQuestions', 'spModal', 'ADD_ACCESS_ITEM_DETAIL_TEMPLATE_URL',
         'accessRequestDeepFilterService', 'spNotificationService',
         AccessRequestItemsCtrl]);
})();
