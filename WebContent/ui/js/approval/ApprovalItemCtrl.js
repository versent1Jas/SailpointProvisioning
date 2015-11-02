'use strict';

/**
 * The ApprovalItemCtrl handles displaying and acting on a single approval item.
 * It is assumed that a parent scope defines "approvalItem".
 */
angular.module('sailpoint.approval').
    constant('SUNRISE_TEMPLATE_URL', SailPoint.CONTEXT_PATH + '/ui/js/common/modal/template/sunrise-dialog.html').
    constant('SUNRISE_FOOTER_URL', SailPoint.CONTEXT_PATH + '/ui/js/common/modal/template/sunrise-dialog-footer.html').
    /* jshint maxparams: 10 */
    /* jshint maxstatements: 44 */
    controller('ApprovalItemCtrl',
               ['$scope', '$q', 'spModal', 'approvalService', 'approvalCompletionService', 'approvalCommentService',
                   'SUNRISE_TEMPLATE_URL', 'SUNRISE_FOOTER_URL', 'APPROVAL_ITEM_ROLE_COLUMN_CONFIG',
                   'APPROVAL_ITEM_ENTITLEMENT_COLUMN_CONFIG',
                function($scope, $q, spModal, approvalService, approvalCompletionService, approvalCommentService,
                         SUNRISE_TEMPLATE_URL, SUNRISE_FOOTER_URL, APPROVAL_ITEM_ROLE_COLUMN_CONFIG,
                         APPROVAL_ITEM_ENTITLEMENT_COLUMN_CONFIG) {

    ////////////////////////////////////////////////////////////////////////////
    //
    // CONSTANTS
    //
    ////////////////////////////////////////////////////////////////////////////

    // Constants for the item types.
    var TYPE_ENTITLEMENT = 'Entitlement',
        TYPE_ROLE = 'Role',
        TYPE_ACCOUNT = 'Account';


    ////////////////////////////////////////////////////////////////////////////
    //
    // GETTERS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Return the approval this item is a part of.  This throws an error if
     * there is not an approval in the scope.
     */
    var getApproval = function() {
        if (!$scope.approval) {
            throw 'Expected an approval in the scope.';
        }
        return $scope.approval;
    };

    /**
     * Return the approval item for this controller.  This throws an error if
     * there is not an approval item in the scope.
     */
    var getApprovalItem = function() {
        if (!$scope.approvalItem) {
            throw 'Expected an approval item in the scope.';
        }
        return $scope.approvalItem;
    };

    /**
     * Return the item type for this approval item.
     */
    var getItemType = function() {
        return getApprovalItem().itemType;
    };

    /**
     * Return true if this is an entitlement request.
     */
    $scope.isEntitlementRequest = function() {
        return TYPE_ENTITLEMENT === getItemType();
    };

    /**
     * Return true if this is a role request.
     */
    $scope.isRoleRequest = function() {
        return TYPE_ROLE === getItemType();
    };

    /**
     * Return true if this is an account request.
     */
    $scope.isAccountRequest = function() {
        return TYPE_ACCOUNT === getItemType();
    };

    /**
     * Return the operation for this request - either an account operation or
     * item level operation.
     */
    $scope.getOperation = function() {
        return getApprovalItem().operation;
    };

    /**
     * Return whether or not a new account is created for this request.
     */
    $scope.isNewAccount = function() {
        return getApprovalItem().isNewAccount;
    };

    /**
     * Return the name of the attribute for an entitlement request.
     */
    $scope.getAttribute = function() {
        return getApprovalItem().name;
    };

    /**
     * Return the display value of this item.  This returns the display value if
     * available (eg - for an entitlement with a display value), or just the raw
     * value otherwise.
     */
    $scope.getDisplayValue = function() {
        var item = getApprovalItem();
        return item.displayValue || item.value;
    };

    /**
     * Return the entitlement description for this item.
     */
    $scope.getDescription = function() {
        return getApprovalItem().description;
    };

    /**
     * Return whether this approval item has an entitlement description.
     */
    $scope.hasDescription = function() {
        return !!this.getDescription();
    };

    /**
     * Return the account display name for this approval item if available.
     */
    $scope.getAccountDisplayName = function() {
        var item = getApprovalItem();

        // Fall back to the native identity in case it is not defined.
        return item.accountDisplayName || item.nativeIdentity;
    };

    /**
     * Return the application name for this approval item if available.
     */
    $scope.getApplication = function() {
        return getApprovalItem().application;
    };

    /**
     * Return the sunrise date as a long if available.
     */
    $scope.getSunrise = function() {
        return getApprovalItem().sunrise;
    };

    /**
     * Return the sunset date as a long if available.
     */
    $scope.getSunset = function() {
        return getApprovalItem().sunset;
    };

    /**
     * Return whether the approval item has a sunrise date or not.
     */
    $scope.hasSunrise = function() {
        return !!this.getSunrise();
    };

    /**
     * Return whether the approval item has a sunset date or not.
     */
    $scope.hasSunset = function() {
        return !!this.getSunset();
    };

    /**
     * Return whether the approval item has had a sunrise or sunset in the past.
     */
    $scope.hadSunriseSunset = function() {
        return !!getApprovalItem().hadSunriseSunset;
    };

    /**
     * Return whether the date column should be displayed or not.
     */
    $scope.showDateColumn = function() {
        return this.hasSunrise() || this.hasSunset() || this.hadSunriseSunset();
    };

    /**
     * Return true if this item is approved.
     */
    $scope.isApproved = function() {
        return approvalService.DECISION_APPROVED === getApprovalItem().decision;
    };

    /**
     * Return true if this item is rejected.
     */
    $scope.isRejected = function() {
        return approvalService.DECISION_REJECTED === getApprovalItem().decision;
    };

    /**
     * Return the number of comments on the approval item
     */
    $scope.getItemCommentCount = function() {
        return getApprovalItem().commentCount;
    };

    /**
     * Get the assignment note
     */
    $scope.getAssignmentNote = function() {
        return getApprovalItem().assignmentNote;
    };

    /**
     * Get the display name of owner of the access item targeted by the approval item
     */
    $scope.getOwnerName = function() {
        return (getApprovalItem().owner) ? getApprovalItem().owner.displayName : null;
    };

    /**
     * Return true if there is an owner for the access item targeted by the approval item,
     * otherwise false
     */
    $scope.hasOwner = function() {
        return !!(getApprovalItem().owner);
    };

    /**
     * Gets the column configs corresponding to the type of this item. Requires
     * the column configs to have been previously loaded and stored in approvalService.
     * This happens in ApprovalsCtrl.fetchApprovals. If column configs were not loaded,
     * this method will throw.
     *
     * @returns {Array} Array of ColumnConfig objects
     */
    $scope.getColumnConfigs = function() {
        var configKey = this.isRoleRequest() ? APPROVAL_ITEM_ROLE_COLUMN_CONFIG :
                APPROVAL_ITEM_ENTITLEMENT_COLUMN_CONFIG,
            columnConfigs = approvalService.getColumnConfigs();

        /* If the column configs that we expect aren't there, something has gone 
         * terribly wrong, throw.*/
        if (!columnConfigs || !columnConfigs[configKey]) {
            throw 'Column configs not properly loaded';
        }

        return columnConfigs[configKey];
    };
                    
    ////////////////////////////////////////////////////////////////////////////
    //
    // ACTIONS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Open the approval item details dialog using the given scope.
     *
     * @param {Scope} scope  The Scope to use for the spModal.
     */
    var openItemDetails = function(scope) {
        spModal.open({
            title: 'ui_my_approvals_item_detail_title',
            isContextual: true,
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/js/approval/template/approval-item-detail-dialog.html',
            controller: 'ApprovalItemDetailDialogCtrl',
            scope: scope
        });
    };

    /**
     * Display the detail dialog for this approval item.
     */
    $scope.showItemDetails = function() {
        openItemDetails($scope);
    };


    /**
     * Display the completion dialog for this approval item.
     *
     * @param {Object} approval  The approval object.
     * @param {Object} item  The approval item object.
     * @param {Function} decideFunction  The function to call with the work
     *    item ID and approval item ID to make the decision.
     * @param {String} previousDecision  The previous decision to revert to.
     */
    var showCompletionDialog = function(approval, item, decideFunction, previousDecision) {
        var decide = angular.bind($scope, decideFunction, approval.id, item.id),
            revert = angular.bind($scope, setDecision, previousDecision);

        approvalCompletionService.openCompletionDialog($scope, approval, revert, decide);
    };

    /**
     * Set the decision for this item.
     */
    var setDecision = function(decision) {
        getApprovalItem().decision = decision;
    };

    /**
     * Return the decision for this item.
     */
    var getDecision = function() {
        return getApprovalItem().decision;
    };

    /**
     * Return true if the given decision for this item is the last decision for
     * the entire approval.
     *
     * @param {String} decision  The new decision.
     */
    var isLastDecision = function(decision) {
        // This is the last decision if there are no items remaining and the
        // requested decision is not "undo".
        return ((0 === $scope.getRemainingCount()) &&
                (approvalService.DECISION_UNDO !== decision));
    };

    /**
     * Save the given decision by calling the decideFunction.  If this fails,
     * the decision is reverted to what it started out as.
     *
     * @param {String} decision  One of the DECISION_* constants or null to undo
     *    the decision.
     * @param {Function} decideFunction  The function to call with the work
     *    item ID and approval item ID to make the decision.
     */
    var saveDecision = function(decision, decideFunction) {
        var item = getApprovalItem(),
            approval = getApproval(),
            previousDecision = getDecision(),
            decidePromise;

        // Pre-emptively change the decision.
        setDecision(decision);

        // If this is the last decision, popup the completion dialog.
        if (isLastDecision(decision)) {
            showCompletionDialog(approval, item, decideFunction, previousDecision);
        }
        else {
            // Not the last decision - just save it.
            decidePromise = decideFunction(approval.id, item.id);

            // Revert the decision in the UI if the decision failed.
            decidePromise.catch(function(response) {
                setDecision(previousDecision);
                // If a 404 occurred, display the error and refresh the page.
                if (404 === response.status) {
                    $scope.notifyObjectNotFoundException(response.data.message);
                }
            });
        }
    };

    /**
     * Approve this item.
     */
    $scope.approve = function() {
        // Only save if the item isn't already approved.
        if (!this.isApproved()) {
            saveDecision(approvalService.DECISION_APPROVED, approvalService.approveItem);
        }
    };

    /**
     * Reject this item.
     */
    $scope.reject = function() {
        // Only save if the item isn't already rejected.
        if (!this.isRejected()) {
            saveDecision(approvalService.DECISION_REJECTED, approvalService.rejectItem);
        }
    };

    /**
     * Undo this item.
     */
    $scope.undo = function() {
        // Only undo if there is a decision.
        if (approvalService.DECISION_UNDO !== getDecision()) {
            saveDecision(approvalService.DECISION_UNDO, approvalService.undoItem);
        }
    };

    /**
     * Open up a comment dialog for this approval item.
     */
    $scope.showApprovalItemComments = function(isItem) {
        $scope.isItem = true;
        approvalCommentService.openCommentDialog($scope, '#{my_approvals_approval_item_comments}', getApprovalItem());
    };

    /**
     * Open edit dialog for sunrise/sunset dates.
     */
    $scope.showSunriseSunsetDialog = function() {
        var modalInstance, promise,
            sunriseSeed, sunsetSeed, sunriseDate, sunsetDate,
            approvalItem = getApprovalItem();

        /* Set up the isolated scope for the modal with sunrise/set, approval, and approvalItem*/
        sunriseSeed = approvalItem.sunrise ? new Date(approvalItem.sunrise) : undefined;
        sunsetSeed = approvalItem.sunset ? new Date(approvalItem.sunset) : undefined;

        // NOTE: This snippet is reused in AccessRequestReviewCtrl.  If there is a need for this
        // someplace else, we should probably create a service for it and update the unit tests accordingly.
        // That would make testing a little simpler, and we could pull the SUNRISE_TEMPLATE_URL in there as well.
        modalInstance = spModal.open({
            title: 'ui_my_approvals_item_edit_start_end_date',
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

        // When the dialog closes, update the approvalItem.
        modalInstance.result.then(function(dates) {
            if (dates) {
                sunriseDate = dates.sunrise ? dates.sunrise.getTime() : undefined;
                sunsetDate = dates.sunset ? dates.sunset.getTime() : undefined;

                promise = approvalService.setSunriseSunset(getApproval().id, approvalItem.id, {
                    sunrise: sunriseDate,
                    sunset: sunsetDate
                });

                /* When success update the model */
                promise.then(function() {
                    approvalItem.sunrise = sunriseDate;
                    approvalItem.sunset = sunsetDate;
                    approvalItem.hadSunriseSunset = true;
                })
                .catch(function(response) {
                    // If a 404 occurred, display the error and refresh the page.
                    if (response && (404 === response.status)) {
                        $scope.notifyObjectNotFoundException(response.data.message);
                    }
                    // Return a resolved promise so the dialog will close.
                    return $q.defer().resolve();
                });
            }
        });
    };
}]);
