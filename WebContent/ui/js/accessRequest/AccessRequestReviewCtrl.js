'use strict';

/**
 * The AccessRequestReviewCtrl handles displaying items that are being added or
 * removed on the review page, collecting additional information (eg - comments,
 * priority, sunrise/sunset), and submitting requests.
 */
angular.module('sailpoint.accessrequest').
    constant('RESPONSE_ERROR_TYPE', { 'MISSINGACCOUNTSELECTIONS' : 'missingAccountSelectionsException',
        'DUPLICATEASSIGNMENT' : 'duplicateAssignmentException'}).
    constant('SUNRISE_TEMPLATE_URL', SailPoint.CONTEXT_PATH + '/ui/js/common/modal/template/sunrise-dialog.html').
    constant('SUNRISE_FOOTER_URL', SailPoint.CONTEXT_PATH + '/ui/js/common/modal/template/sunrise-dialog-footer.html').
    constant('CURRENT_ACCESS_ITEM_DETAIL_TEMPLATE_URL',
        SailPoint.CONTEXT_PATH + '/ui/js/accessRequest/template/current-access-item-detail-dialog.html').
    constant('ADD_ACCESS_ITEM_DETAIL_TEMPLATE_URL',
        SailPoint.CONTEXT_PATH + '/ui/js/accessRequest/template/add-access-item-detail-dialog.html').
    controller('AccessRequestReviewCtrl', ['accessRequestDataService', 'AccessRequestItem', 'IdentityAccountSelection',
        'configService', 'spModal', 'spTranslateFilter', '$state', 'accessRequestReviewService',
        'spNotificationService', 'accessRequestAccountSelectionService', 'SP_CONFIG_SERVICE', 'SUNRISE_TEMPLATE_URL',
        'SUNRISE_FOOTER_URL', 'SP_CONTEXT_PATH', '$rootScope', 'CURRENT_ACCESS_ITEM_DETAIL_TEMPLATE_URL',
        'ADD_ACCESS_ITEM_DETAIL_TEMPLATE_URL', 'accessRequestDeepFilterService', 'MissingAccountSelections',
        'RESPONSE_ERROR_TYPE',

/* jshint maxparams: 20 */
/* jshint maxstatements: 44 */
function(accessRequestDataService, AccessRequestItem, IdentityAccountSelection, configService, spModal,
         spTranslateFilter, $state, accessRequestReviewService, spNotificationService,
         accessRequestAccountSelectionService, SP_CONFIG_SERVICE, SUNRISE_TEMPLATE_URL, SUNRISE_FOOTER_URL,
         SP_CONTEXT_PATH, $rootScope, CURRENT_ACCESS_ITEM_DETAIL_TEMPLATE_URL, ADD_ACCESS_ITEM_DETAIL_TEMPLATE_URL,
         accessRequestDeepFilterService, MissingAccountSelections, RESPONSE_ERROR_TYPE) {

    var me = this;

    var isDisplayPermittedRoles = {};


    ////////////////////////////////////////////////////////////////////////////
    //
    // PROPERTIES
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Array messages that - when added to - will be read out loud by a screen reader.
     *
     * @type {Array<String>}
     */
    this.screenReaderMessages = [];

    /**
     * Map of ColumnConfig objects used to render card data
     *
     * @type {Object}
     */
    this.columnConfigs = undefined;

    /**
     * Whether the requests are currently being submitted or not.
     * Updates the disabled state of the cancel/submit button as well
     * as the text of the submit button.
     *
     * @type {boolean}
     */
    this.isSubmitting = false;

    /**
     * Whether the user can set the priority on the cart or not
     * @type {boolean}
     */
    this.isPriorityEnabled = false;

    /**
     * @property {Array<String>} itemsMissingAccountSelections  The names of any
     * items that are found to be missing account selections after submitting.
     */
    this.itemsMissingAccountSelections = [];

    /**
     * @property {Array<String>} itemsAlreadyAssigned The names of any
     * items that are found to be already assigned or have a pending request for after submitting.
     */
    this.itemsAlreadyAssigned = [];

    /**
     * Allows us to trigger the display of the notification service error.
     * @type {boolean}
     */
    this.hasError = false;

    ////////////////////////////////////////////////////////////////////////////
    //
    // SUNRISE SUNSET FUNCTIONS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Loops through all RequestedAccessItems and if all the sunrise/sunset dates are the same
     * returns true, otherwise returns false.
     *
     * @returns {boolean}
     */
    this.areGlobalDatesSet = function() {
        var found = [],
            items = me.getRequestedItems();

        angular.forEach(items, function(item) {
            if (found.length > 0) {
                var foundSunrise = found[0].sunrise ? found[0].sunrise.getTime() : undefined,
                    foundSunset = found[0].sunset ? found[0].sunset.getTime() : undefined,
                    itemSunrise = item.getSunriseDate() ? item.getSunriseDate().getTime() : undefined,
                    itemSunset = item.getSunsetDate() ? item.getSunsetDate().getTime() : undefined;

                // Add an entry if the item dates don't match with existing found dates
                if (foundSunrise !== itemSunrise || foundSunset !== itemSunset) {
                    found.push({sunrise: item.getSunriseDate(), sunset: item.getSunsetDate()});
                }
            }
            // We haven't added anything to the found array yet add it now.
            else {
                found.push({sunrise: item.getSunriseDate(), sunset: item.getSunsetDate()});
            }
        });

        // All dates are the same, so return true.
        if (found.length === 1 && (found[0].sunrise || found[0].sunset)) {
            return true;
        }

        return false;
    };

    /**
     * Helper function to set global dates on all requested items.
     *
     * @param {number} sunrise date
     * @param {number} sunset date
     */
    function setAllItemDates(sunrise, sunset) {
        var items = me.getRequestedItems();

        angular.forEach(items, function(item) {
            item.setSunriseDate(sunrise ? new Date(sunrise) : undefined);
            item.setSunsetDate(sunset ? new Date(sunset) : undefined);
        });
    }

    /**
     * Helper function to display Sunrise/Sunset modal date picker
     *
     * @param {object} modalScope containing existing sunrise/sunset dates
     * @returns {*} modal promise
     */
    function showModal(sunriseSeed, sunsetSeed, title) {
        // NOTE: This snippet is reused in ApprovalItemCtrl.  If there is a need for this
        // someplace else, we should probably create a service for it and update the unit tests accordingly.
        // That would make testing a little simpler, and we could pull the SUNRISE_TEMPLATE_URL in there as well.
        return spModal.open({
            title: title || spTranslateFilter('ui_request_edit_start_end_date'),
            controller: 'SunriseDialogCtrl as ctrl',
            templateUrl: SUNRISE_TEMPLATE_URL,
            footerTemplateUrl: SUNRISE_FOOTER_URL,
            resolve: {
                sunriseDate: function() {
                    return sunriseSeed;
                },
                sunsetDate: function() {
                    return sunsetSeed;
                }
            },
            backdrop: 'static',
            keyboard: false
        });
    }

    /**
     * Shows a dialog that will adjust globalSunrise and globalSunset as well as loop through all RequestedAccessItems
     * and set those dates to the global values.
     */
    this.showGlobalSunriseSunsetDialog = function() {
        var me = this,
            modalInstance,
            sunriseSeed, sunsetSeed;

        // If all the items are the same, but the global dates aren't set yet, grab the first item
        // and use that to seed the global date dialog.
        if(me.areGlobalDatesSet()) {
            var items = me.getRequestedItems();
            if(items) {
                sunriseSeed = items[0].getSunriseDate() ? items[0].getSunriseDate() : undefined;
                sunsetSeed = items[0].getSunsetDate() ? items[0].getSunsetDate() : undefined;
            }
        }

        modalInstance = showModal(sunriseSeed, sunsetSeed);

        // When the dialog closes, update the global dates as well as all the items' dates.
        modalInstance.result.then(function(dates) {
            if (dates) {
                setAllItemDates(dates.sunrise, dates.sunset);
            }
        });

    };

    /**
     * Shows a dialog that will set/adjust the passed in RequestedAccessItem's sunrise/sunset dates.
     *
     * @param requestedAccessItem
     */
    this.showSunriseSunsetDialog = function(requestedItem) {
        var modalInstance, itemName,
            sunriseSeed, sunsetSeed;

        if(requestedItem) {
            /* Set up the isolated scope for the modal with the requested item sunrise/set dates */
            sunriseSeed = requestedItem.getSunriseDate() ? requestedItem.getSunriseDate() : undefined;
            sunsetSeed = requestedItem.getSunsetDate() ? requestedItem.getSunsetDate() : undefined;

            itemName = requestedItem.item.getDisplayableName() || requestedItem.getUniqueId();

            modalInstance = showModal(sunriseSeed, sunsetSeed,
                spTranslateFilter('ui_item_edit_start_end_date', itemName));

            // When the dialog closes, update the item's dates.
            modalInstance.result.then(function(dates) {
                if (dates) {
                    requestedItem.setSunriseDate(dates.sunrise ? new Date(dates.sunrise) : undefined);
                    requestedItem.setSunsetDate(dates.sunset ? new Date(dates.sunset) : undefined);
                }
            });
        }
        else {
            throw 'RequestedAccessItem required.';
        }
    };

    /**
     * Determines if the sunrise/sunset dialog buttons are visible or not, per the system config setting for
     * Configuration.ENABLE_ROLE_SUN_ASSIGNMENT
     *
     * @returns {boolean}
     */
    this.useSunriseDates = function() {
        return configService.getConfigValue('USE_SUNRISE_DATES');
    };


    ////////////////////////////////////////////////////////////////////////////
    //
    // LIST, ADD, REMOVE METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Determines if the loading mask should be shown or not.
     * @returns {boolean}
     */
    this.isPageReady = function() {
        if (!this.columnConfigs) {
            return false;
        }
        return true;
    };

    /**
     * Returns the appropriate columnConfig for the give item type.
     *
     * @param item
     * @returns {*}
     */
    this.getColumnConfig = function(item) {
        return me.columnConfigs[item.getAccessType()];
    };

    /**
     * Disable submit button if there are no items to submit
     *
     * @returns {boolean}
     */
    this.getSubmitDisabled = function() {
        return this.isSubmitting || (!this.hasRequestedItems() && !this.hasRemovedCurrentAccessItems());
    };

    /**
     * Return a non-null array of the RequestedAccessItems that are being added.
     *
     * @return {Array<RequestedAccessItem>} A non-null array of the
     *    RequestedAccessItems that are being added.
     */
    this.getRequestedItems = function() {
        // TODO: Consider sorting these ... but how should they be sorted?
        return accessRequestDataService.getRequestedItems();
    };
    
    /**
     * Return a non-null array of the RequestedAccessItems that are being added.
     *
     * @return {Array<RequestedAccessItem>} A non-null array of the
     *    RequestedAccessItems that are being added.
     */
    this.getTopLevelRequestedItems = function() {
        // TODO: Consider sorting these ... but how should they be sorted?
        return accessRequestDataService.getTopLevelRequestedItems();
    };

    /**
     * Return a non-null array of the RequestedAccessItems representing permitted
     * roles for the given top level requested item.
     *
     * @param {RequestedAccessItem} requestedItem Top level item
     * @returns {Array<RequestedAccessItem>} A non-null array of the
     *    RequestedAccessItems permitted by the given top level item
     */
    this.getRequestedPermittedItems = function(requestedItem) {
        return accessRequestDataService.getRequestedPermittedItems(requestedItem);
    };

    /**
     * Return whether permitted roles should be expanded or collapsed.
     *
     * @param {RequestedAccessItem} item  The item for which to determine display status.
     *
     * @return {boolean} true if permits should be shown.
     */
    this.isShowPermittedRoles = function(item) {
        var showValue = isDisplayPermittedRoles[item.item.getId()];
        // default to expanded so if the variable is unset return true to make it open
        if (typeof showValue === 'undefined') {
            return true;
        }
        return showValue;
    };

    /**
     * Toggle whether or not permitted roles should be shown.
     *
     * @param {RequestedAccessItem} item  The item for which to toggle.
     */
    this.toggleShowPermittedRoles = function(item) {
        var showValue = isDisplayPermittedRoles[item.item.getId()];
        // we expand by default so if the variable is unset we want to switch it to collapsed because !undefined would
        // be true and appear to do nothing on the first click
        if (typeof showValue === 'undefined') {
            isDisplayPermittedRoles[item.item.getId()] = false;
        } else {
            isDisplayPermittedRoles[item.item.getId()] = !showValue;
        }
    };

    /**
     * Return true if there are add access requests
     *
     * @return {Boolean} true if there are add access requests
     */
    this.hasRequestedItems = function() {
        return accessRequestDataService.getRequestedItems().length > 0;
    };

    /**
     * Remove the given access request item that was requested for addition.
     *
     * @param {RequestedAccessItem} requestedItem  The RequestedAccessIte to remove.
     */
    this.removeRequestedItem = function(requestedItem) {
        var accessRequestItem = requestedItem.item,
            removed = accessRequestDataService.removeRequestedItem(accessRequestItem);
        if (removed) {
            this.addRemovedItemMessage(accessRequestItem);
        }
    };

    /**
     * Return a non-null array of the CurrentAccessItems that are being removed.
     *
     * @return {Array<CurrentAccessItem>} A non-null array of the
     *    CurrentAccessItems that are being removed.
     */
    this.getRemovedCurrentAccessItems = function() {
        // TODO: Consider sorting these ... but how should they be sorted?
        return accessRequestDataService.getRemovedCurrentAccessItems();
    };

    /**
     * Return true if there are remove access requests
     *
     * @return {Boolean} true if there are remove access requests
     */
    this.hasRemovedCurrentAccessItems = function() {
        return accessRequestDataService.getRemovedCurrentAccessItems().length > 0;
    };

    /**
     * Remove the given access request item that was requested for removal.
     *
     * @param {CurrentAccessItem} item  The CurrentAccessItem to remove.
     */
    this.removeRemovedCurrentAccessItem = function(item) {
        var removed = accessRequestDataService.removeRemovedCurrentAccessItem(item);
        if (removed) {
            this.addRemovedItemMessage(item);
        }
    };

    /**
     * Sets the priority on the access request data service
     * @param priority
     */
    this.setPriority = function(priority) {
        accessRequestDataService.priority = priority;
    };

    /**
     * Returns the priority for the access request data service
     * @param priority
     * @returns {*}
     */
    this.getPriority = function(priority) {
        return accessRequestDataService.priority;
    };


    ////////////////////////////////////////////////////////////////////////////
    //
    // COMMENT DIALOG
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Show the comment dialog. Fill with existing comment/note.
     * @param requestedAccessItem
     */
    this.showCommentDialog = function(requestedAccessItem) {
        var title = requestedAccessItem.isAssignmentNoteAllowed() ?
            'ui_access_request_comment_note_dialog_title' : 'ui_access_request_comments_dialog_title';
        spModal.open({
            id: 'requestCommentsDialog',
            title: title,
            templateUrl: SP_CONTEXT_PATH + '/ui/js/accessRequest/template/access-request-comment-dialog.html',
            controller: 'AccessRequestCommentDialogCtrl as ctrl',
            autoFocus: true,
            backdrop: 'static',
            resolve:  {
                requestedAccessItem: function() {
                    return requestedAccessItem;
                }
            }
        });
    };


    ////////////////////////////////////////////////////////////////////////////
    //
    // SCREEN READER METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Adds a screeen reader message indicating the given item was removed.
     *
     * @param {AccessRequestItem} item  The item being removed.
     */
    this.addRemovedItemMessage = function(item) {
        this.screenReaderMessages.push(spTranslateFilter('ui_access_removed', item.getDisplayableName()));
    };


    ////////////////////////////////////////////////////////////////////////////
    //
    // ACTIONS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Get the appropriate text for the submit button based on the current submission state.
     *
     * @returns {*}
     */
    this.getSubmitText = function() {
        if (this.isSubmitting) {
            return spTranslateFilter('ui_access_submitting');
        }
        return spTranslateFilter('ui_access_submit');
    };

    /**
     * Cancel the current access request. All items will be removed from cart and user will be forwarded back to
     * dashboard.
     */
    this.cancelAccessRequest = function() {

        var modalInstance = spModal.open({
            title: 'ui_access_cancel_request_dialog_title',
            content: spTranslateFilter('ui_access_cancel_request_dialog_text'),
            buttons: [
                {
                    displayValue: 'ui_no'
                },
                {
                    displayValue: 'ui_yes',
                    primary: true,
                    action: function() {
                        return accessRequestDataService.clear();
                    },
                    close: true
                }
            ]
        });

        modalInstance.result.then(function() {
            // redirect to dashboard
            $state.go('dashboard', { completeFlow: 'accessRequest' });
        });
    };

    /**
     * Hand of error to correct handler
     *
     * @param {Object} response  The error response from the $http call.
     */
    function handleError(response) {
        me.isSubmitting = false;

        if (response.data.type === RESPONSE_ERROR_TYPE.MISSINGACCOUNTSELECTIONS) {
            response.data = new MissingAccountSelections(response.data.items);
            handleMissingAccountSelectionsError(response);
        }
        else if (response.data.type === RESPONSE_ERROR_TYPE.DUPLICATEASSIGNMENT) {
            handleAlreadyAssignedError(response);
        }
    }

    /**
     * Handle errors due to requested items being already assigned or pending.
     *
     * @param {Object} response  The error response from the $http call.
     */
    function handleAlreadyAssignedError(response) {
        me.itemsAlreadyAssigned = response.data.items;
    }

    /**
     * Handle any errors due to missing account selections from the given error response.  This
     * saves the missing account selections on the RequestedAccessItems and sets the
     * itemsMissingAccountSelections list.
     *
     * @param {Object} response  The error response from the $http call.
     */
    function handleMissingAccountSelectionsError(response) {
        var missingAccountSelections = response.data;

        // Update the requested items in the AccessRequestDataService to include the missing
        // account selections.
        accessRequestDataService.getRequestedItems().forEach(function(requestedItem) {
            var missingSelections = missingAccountSelections.getAccountSelectionsForItem(requestedItem.getUniqueId()),
                existingSelections;

            if (missingSelections && missingSelections.length) {
                // Merge these with the account selections that already exist so we don't
                // lose selections that were already made.
                existingSelections = requestedItem.getAccountSelections() || [];
                existingSelections =
                    IdentityAccountSelection.mergeAccountSelections(existingSelections, missingSelections);
                requestedItem.setAccountSelections(existingSelections);
            }
        });

        // Set itemsMissingAccountSelections to the names of the role/entitlements
        // that are missing selections.  This is cleared again when the next submit happens.
        me.itemsMissingAccountSelections = missingAccountSelections.getItemIds().map(function(itemId) {
            var requestedItem = accessRequestDataService.getRequestedItemById(itemId);
            return requestedItem.item.getDisplayableName();
        });
    }

    /**
     * Submit the current access request. Redirect to dashboard and show success.
     */
    this.submitAccessRequest = function() {
        var me = this,
            ids = accessRequestDataService.getIdentities(),
            itemsToRemove = accessRequestDataService.getRemovedCurrentAccessItems(),
            itemsToAdd = accessRequestDataService.getRequestedItems();

        me.isSubmitting = true;

        // Clear any previous error messages.
        me.itemsMissingAccountSelections.length = 0;
        me.itemsAlreadyAssigned.length = 0;

        // Return the promise so we can test the $broadcast.
        return accessRequestReviewService.submitAccessRequestItems(ids, itemsToAdd, itemsToRemove, me.getPriority())
            .then(function(response) {
                if (response && response.status === 200) {
                    // Broadcast a message that we are finished with the request.
                    $rootScope.$broadcast('accessRequest:requestSubmissionComplete', '');

                    var good = 0, bad = 0,
                        message = 'ui_access_request_submitted_requests',
                        status = spNotificationService.SUCCESS,
                        args = null;

                    angular.forEach(response.data.objects, function(item) {
                        // Increment bad if workflowStatus is one of WorkflowLaunch.STATUS_FAILED
                        // or WorkflowLaunch.STATUS_UNDEFINED
                        if (item && item.workflowStatus) {
                            if (item.workflowStatus === 'failed' || item.workflowStatus === 'undefined') {
                                bad++;
                            }
                            else {
                                good++;
                            }
                        }
                    });

                    if (bad > 0) {
                        message = 'ui_access_request_submitted_requests_failures';
                        status = spNotificationService.WARNING;
                        args = [good, bad];

                        if (bad === response.data.objects.length) {
                            status = spNotificationService.ERROR;
                        }
                    }

                    spNotificationService.setNotification(message, status, args);

                    accessRequestDataService.clear();
                    me.isSubmitting = false;
                    $state.go('dashboard', { completeFlow: 'accessRequest' });
                }
            },
            handleError);
    };

    /**
     * Displays account selection dialog for requestedItem
     * @param {RequestedAccessItem} requestedItem Item to edit account selections for
     */
    this.editAccountSelections = function(requestedItem) {
        accessRequestAccountSelectionService.editAccountSelections(requestedItem).then(function(results) {
            /* Update requested item with new account selections if resolved */
            requestedItem.accountSelections = results.accountSelections;
        });
    };

    /**
     * Opens the item details dialog
     * @param (AccessRequestItem) item The item to display in the dialog
     */
    this.showItemDetails = function(item, isAdded) {
        if (!item) {
            throw 'Item is required.';
        }

        var detailDialogTitle = 'ui_access_item_detail_entitlement_title',
            detailDialogURL = ADD_ACCESS_ITEM_DETAIL_TEMPLATE_URL,
            detailDialogCtrl = 'AddAccessItemDetailDialogCtrl as dialogCtrl';

        if(!isAdded) {
            detailDialogTitle = 'ui_access_item_detail_title';
            detailDialogURL = CURRENT_ACCESS_ITEM_DETAIL_TEMPLATE_URL;
            detailDialogCtrl = 'CurrentAccessItemDetailDialogCtrl as dialogCtrl';
        }

        // Dialog config and identity details will be retrieved by dialogCtrl
        spModal.open({
            title: detailDialogTitle,
            templateUrl: detailDialogURL,
            isContextual: true,
            controller: detailDialogCtrl,
            resolve: {
                item: function() {
                    return item;
                }
            }
        });
    };

    ////////////////////////////////////////////////////////////////////////////
    //
    // INITIALIZATION
    //
    ////////////////////////////////////////////////////////////////////////////

    // Fetch the column configs for the card data
    configService.getColumnConfigEntries([AccessRequestItem.UI_ROLE_COL_CONFIG,
        AccessRequestItem.UI_ENTITLEMENT_COL_CONFIG]).then(function(result) {

        me.columnConfigs = {};
        me.columnConfigs[AccessRequestItem.ACCESS_TYPE_ROLE] =
            result.data[AccessRequestItem.UI_ROLE_COL_CONFIG];

        me.columnConfigs[AccessRequestItem.ACCESS_TYPE_ENTITLEMENT] =
            result.data[AccessRequestItem.UI_ENTITLEMENT_COL_CONFIG];

    });

    /* Process deep links - first add the target identity to the data service, then fetch and
     * add the requested item(s) that fit the request parameter */
    if(accessRequestDeepFilterService.isDeepLinkReview()) {
        accessRequestDeepFilterService.getTargetIdentity().then(function(identity) {
            if(!identity) {
                me.hasError = true;
                spNotificationService
                    .setNotification('ui_access_request_invalid_deep_link_identity',
                        spNotificationService.ERROR);
            } else {
                accessRequestDataService.addIdentity(identity);

                try {
                    /*  Needs to happen after we get the target identity so we can use the identity's id in the
                     *  call to accessItems
                     */
                    accessRequestDeepFilterService.getReviewItems()
                        .then(function(reviewItems) {
                            if (reviewItems.length < 1) {
                                me.hasError = true;
                                spNotificationService
                                    .setNotification('ui_access_request_invalid_deep_link',
                                        spNotificationService.ERROR);
                            } else {
                                angular.forEach(reviewItems, function(reviewItem) {
                                    accessRequestDataService.addRequestedItem(reviewItem);
                                });
                            }
                            accessRequestDeepFilterService.reset();
                        });
                }
                catch(e) {
                    // Do nothing.  Do not add any requested items, just reset deep link service.
                    accessRequestDeepFilterService.reset();
                }
            }
        });
    }

    this.isPriorityEnabled =
        configService.getConfigValue(SP_CONFIG_SERVICE.ACCESS_REQUEST_ALLOW_PRIORITY_EDITING);
}]);
