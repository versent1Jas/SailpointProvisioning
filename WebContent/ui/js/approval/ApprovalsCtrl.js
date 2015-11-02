'use strict';

/**
 * The ApprovalsCtrl handles listing approvals.
 */
angular.module('sailpoint.approval').
    /* jshint maxparams: 12 */
    controller('ApprovalsCtrl',
               ['$rootScope', '$scope', '$timeout', '$q',
                'APPROVAL_REQUEST_TYPES', 'approvalService', 'infoModalService', 'SortOrder', 'PagingData',
                'configService', 'APPROVAL_ITEM_ROLE_COLUMN_CONFIG', 'APPROVAL_ITEM_ENTITLEMENT_COLUMN_CONFIG',
                function($rootScope, $scope, $timeout, $q,
                         APPROVAL_REQUEST_TYPES, approvalService, infoModalService, SortOrder, PagingData,
                         configService, APPROVAL_ITEM_ROLE_COLUMN_CONFIG, APPROVAL_ITEM_ENTITLEMENT_COLUMN_CONFIG) {

    // SortOrder constant for newest first.
    var SORT_NEWEST = new SortOrder('created', false);

    // SortOrder constant for oldest first.
    var SORT_OLDEST = new SortOrder('created', true);

    // SortOrder constant for highest priority with a secondary sort on oldest.
    // Note that due to the way these are stored in the database, sorting descending
    // actually makes high priority show first, followed by normal, then low.
    var SORT_PRIORITY = new SortOrder('priority', false).add(SORT_OLDEST);

    /**
     * An array of approval objects to be displayed.
     */
    $scope.approvals = undefined;

    /**
     * The current one-based page of data to display.
     */
    $scope.pageInfo = new PagingData(5);

    /**
     * The SailPoint.util.SortOrder to use for sorting.
     */
    $scope.sort = SORT_NEWEST;

    /**
     * Fetch the approvals for the current page.
     */
    var fetchApprovals = function() {
        var promise =
            approvalService.getApprovals(APPROVAL_REQUEST_TYPES,
                    $scope.pageInfo.getStart(), $scope.pageInfo.itemsPerPage, $scope.sort);
        /* Load column configs up front so all the items can use them */
        var configPromise = configService.getColumnConfigEntries(
            [APPROVAL_ITEM_ROLE_COLUMN_CONFIG, APPROVAL_ITEM_ENTITLEMENT_COLUMN_CONFIG]);
        /* Reset approvals so the loading mask is displayed */
        $scope.approvals = undefined;
        $q.all([promise, configPromise]).then(function(result) {
            var approvalsResult = result[0],
                columnConfigsResult = result[1];
            $scope.approvals = approvalsResult.data.objects;
            $scope.pageInfo.setTotal(approvalsResult.data.count);
            
            approvalService.setColumnConfigs(columnConfigsResult.data);
        });
    };

    /**
     * Sort the approvals by the given SortOrder.
     */
    var sort = function(sort) {
        $scope.sort = sort;
        fetchApprovals();
    };

    /**
     * Sort the approvals showing the newest first.
     */
    $scope.sortByNewest = function() {
        sort(SORT_NEWEST);
    };

    /**
     * Return true if sorting by newest first.
     */
    $scope.isSortByNewest = function() {
        return SORT_NEWEST === $scope.sort;
    };

    /**
     * Sort the approvals showing the oldest first.
     */
    $scope.sortByOldest = function() {
        sort(SORT_OLDEST);
    };

    /**
     * Return true if sorting by oldest first.
     */
    $scope.isSortByOldest = function() {
        return SORT_OLDEST === $scope.sort;
    };

    /**
     * Sort the approvals showing the highest priority first.
     */
    $scope.sortByPriority = function() {
        sort(SORT_PRIORITY);
    };

    /**
     * Return true if sorting by priority.
     */
    $scope.isSortByPriority = function() {
        return SORT_PRIORITY === $scope.sort;
    };

    /**
     * Go to the requested page.
     */
    $scope.pageChanged = function() {
        fetchApprovals();
    };

    /**
     * Move to the next page if there are more pages.
     */
    $scope.nextPage = function() {
        if ($scope.pageInfo.next()) {
            $scope.pageChanged();
        }
    };

    /**
     * Move to the previous page if there are more pages.
     */
    $scope.prevPage = function() {
        if ($scope.pageInfo.previous()) {
            $scope.pageChanged();
        }
    };

    /**
     * Notify the ApprovalsCtrl that an approval was completed - this causes the
     * list of approvals to get refreshed.
     * 
     * approvalId - the id of the approval being completed
     * isDialog - pass true if calling from a dialog so that an extra timeout can be added for the completion animation
     */
    $scope.notifyApprovalCompleted = function(approvalId, isDialog) {
        function markCompleted() {
            /* If an approval ID is provided, mark the matching
             * approval as completed so that the UI can reflect it with animation */
            if (approvalId) {
                angular.forEach($scope.approvals, function(value, key) {
                    if (value.id === approvalId) {
                        value.completed = true;
                    }
                });
            }
        }

        function timeoutFetchApprovals() {
            /* Refetch the approvals.
             * Delay to allow animation of completed item to complete */
            $timeout(function() {
                fetchApprovals();
            }, 400);
        }

        // Determine whether we're on the last page and it is going away.
        var totalPages = $scope.pageInfo.getPageCount($scope.pageInfo.getTotal()),
            newTotalPages = $scope.pageInfo.getPageCount($scope.pageInfo.getTotal() - 1),
            isLastPage = !$scope.pageInfo.hasNext();

        // If the page that we're on is no longer, go back to the previous page.
        if (isLastPage && (newTotalPages < totalPages)) {
            $scope.pageInfo.previous();
        }

        if (isDialog) {
            $timeout(function() {
                markCompleted();
                timeoutFetchApprovals();
            }, 400);
        } else {
            markCompleted();
            timeoutFetchApprovals();
        }
    };

    /**
     * Notify the ApprovalsCtrl that an ObjectNotFoundException was encountered
     * when trying to perform an action - this shows a modal and refreshes the
     * approvals list.
     * 
     * @param {String} msg  The error message to display.
     */
    $scope.notifyObjectNotFoundException = function(msg) {

        var modal =
            infoModalService.open('#{msgs.my_approvals_not_found_title}',
                                  msg + ' <br/><br/>#{msgs.my_approvals_not_found_close_to_refresh}',
                                  'notFoundDialog');

        // Refresh the approvals list whether the dialog was closed or dismissed.
        return modal.result.then(function() {
            fetchApprovals();
        },
        function() {
            fetchApprovals();
        });
    };


    // Fetch the approvals when this controller is first loaded.
    fetchApprovals();
}]);
