/**
 * Controller for the approval priority editing dialog.  This expects the
 * approval to be available in the scope that is passed in.
 */
angular.module('sailpoint.approval').
    controller('ApprovalPriorityDialogCtrl',
               ['$scope', 'approvalService',
                function($scope, approvalService) {

        /**
         * Return the approval from the scope, or throw if it is not found.
         */
        var getApproval = function() {
            if (!$scope.approval) {
                throw 'Approval required in $scope.';
            }
            return $scope.approval;
        };

        /**
         * Initialize the priority on the scope to the value from the approval.
         */
        $scope.model = {
            priority: getApproval().priority
        };


        /**
         * Save the priority and return a promise that resolves with the new
         * priority.
         */
        $scope.savePriority = function() {
            var promise =
                approvalService.setPriority(getApproval().id, $scope.model.priority);

            // Resolve with the new priority if this was successful.
            return promise.then(function() {
                return $scope.model.priority;
            });
        };
    }]);
