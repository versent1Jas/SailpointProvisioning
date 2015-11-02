/**
 * Controller for the Approval Details Dialog.
 */
/* jshint maxparams: 8 */
angular.module('sailpoint.approval').
    constant('CURR_USER_DISPLAYNAME', SailPoint.CURR_DISPLAYABLE_USER_NAME).
    controller('ApprovalDetailDialogCtrl',
        ['$scope', 'dateFilter', 'spTranslateFilter', 'precedingZeroesFilter', 'priorityFilter', 'approvalService',
            'configService', 'CURR_USER_DISPLAYNAME',
    function($scope, dateFilter, spTranslateFilter, precedingZeroesFilter, priorityFilter, approvalService,
             configService, CURR_USER_DISPLAYNAME) {

        /**
         * An array that will contain the forwarding history for this approval
         * after loadForwardingHistory() is called.
         */
        $scope.forwardingHistory = null;

        /**
         * An array that will contain the identity details for the target identity
         * after loadIdentityDetails() is called.
         */
        $scope.identityDetails = null;

        /**
         * @description
         * Builds the approval details key value pair for the approval and adds
         * it to the current scope
         */
        function buildApprovalDetails() {
            var approvalDetails = [];
            approvalDetails.push({
                label: spTranslateFilter('ui_approval_details_work_item_id'),
                value: precedingZeroesFilter($scope.approval.workItemName || '')
            });
            approvalDetails.push({
                label: spTranslateFilter('ui_approval_details_access_request_id'),
                value: precedingZeroesFilter($scope.approval.accessRequestName || '' )
            });
            approvalDetails.push({
                label: spTranslateFilter('ui_approval_details_requester'),
                value: $scope.getRequesterName()
            });
            approvalDetails.push({
                label: spTranslateFilter('ui_approval_details_owner'),
                value: $scope.getOwnerName()
            });
            if($scope.isOwnerWorkgroup()) {
                approvalDetails.push({
                    label:  spTranslateFilter('ui_approval_details_assignee'),
                    value: $scope.getAssigneeName()
                });
            }
            approvalDetails.push({
                label: spTranslateFilter('ui_approval_details_created'),
                value: dateFilter($scope.approval.created, 'medium')
            });
            approvalDetails.push({
                label: spTranslateFilter('ui_approval_details_priority'),
                value: priorityFilter($scope.approval.priority)
            });
            $scope.approvalDetails = approvalDetails;
        }

        /**
         * Return the approval ID for the approval.
         */
        function getApprovalId() {
            if (!$scope.approval) {
                throw 'Approval is required in scope.';
            }
            return $scope.approval.id;
        }

        /**
         * Return true if the user made the comment.
         */
        $scope.isRightAligned = function(author){
            return CURR_USER_DISPLAYNAME === author;
        };

        /**
         * @description
         * Loads the identity details and builds key value pairs for the approval
         * if it is not yet loaded.
         */
        $scope.loadIdentityDetails = function() {
            if (!$scope.identityDetails) {
                // Make sure the meta data is loaded first
                configService.getIdentityDetailsConfig().then(function(response) {
                    // Then call the approvalService to set identityDetails
                    approvalService.getIdentityDetails(getApprovalId()).then(function(result) {
                        $scope.identityDetails = SailPoint.util.applyIdentityAttributeMetaData(result.data,
                            response.data);
                    });
                });
            }
        };

        /**
         * Load the forwarding history onto the scope if it is not yet loaded.
         */
        $scope.loadForwardingHistory = function() {
            if (!$scope.forwardingHistory) {
                $scope.forwardingHistory =
                    approvalService.getForwardingHistory(getApprovalId());
            }
        };

        // Cache the identity details when the controller is instantiated
        configService.getIdentityDetailsConfig();

        buildApprovalDetails();
    }]);
