'use strict';

/**
 * Controller for the Approval Item Details Dialog.  The scope that is passed
 * into this controller is the scope of the ApprovalItemCtrl.  It is augmented
 * by this controller to expose more details.
 */
angular.module('sailpoint.approval').
    controller('ApprovalItemDetailDialogCtrl',
               ['$scope', 'approvalService',
    function($scope, approvalService) {

        /**
         * An array containing the target accounts for a role request.  This is
         * null until the target accounts are explicitly loaded, and are in the
         * format returned by approvalService.getItemTargetAccounts().
         */
        $scope.targetAccounts = null;

        /**
         *
         * @type {number}
         */
        $scope.totalRoleEntitlementsCount = 0;

        /**
         *
         * @type {array}
         */
        $scope.roleEntitlements = undefined;

        /**
         * Return the ID of the approval this item is a part of.  This throws an
         * error if there is not an approval in the scope.
         */
        var getApprovalId = function() {
            if (!$scope.approval) {
                throw 'Expected an approval in the scope.';
            }
            return $scope.approval.id;
        };

        /**
         * Return the ID of the approval item for this controller.  This throws
         * an error if there is not an approval item in the scope.
         */
        var getApprovalItemId = function() {
            if (!$scope.approvalItem) {
                throw 'Expected an approval item in the scope.';
            }
            return $scope.approvalItem.id;
        };

        /**
         * Load the target accounts if they are not yet loaded.
         */
        $scope.loadTargetAccounts = function() {
            if (!$scope.targetAccounts) {
                $scope.targetAccounts =
                    approvalService.getItemTargetAccounts(getApprovalId(), getApprovalItemId());
            }
        };

        /**
         * Load the role entitlement details
         */
        $scope.loadRoleEntitlements = function() {
            if (!$scope.roleEntitlements) {
                approvalService.getRoleEntitlements(getApprovalId(), getApprovalItemId()).then(function(response) {
                    // response should be a RoleEntitlementResultDTO object
                    if (response) {
                        $scope.totalRoleEntitlementsCount = response.getTotalEntitlementCount();
                        $scope.roleEntitlements = response.getObjects();
                    }
                });
            }
        };
    }]);
