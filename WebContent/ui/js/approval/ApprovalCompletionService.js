'use strict';

/**
 * A service that is responsible for showing the approval completion or electronic
 * signature dialog, and handling the decisions.
 */
angular.module('sailpoint.approval').
    factory('approvalCompletionService',
            ['$q', 'spModal',
             function($q, spModal) {

        var service = {};

        /**
         * Open the completion or electronic signature dialog for the given
         * approval.
         *
         * @param {Scope} $scope     The scope of the controller that is opening
         *    the completion dialog - should have method to notify of completion
         *    and object not found.
         * @param {Object} approval  The approval object.
         * @param {Function} revert  The function to call when reverting the
         *    decision (eg - if the dialog is cancelled or the decision fails).
         * @param {Function} decide  The function to call to perform a decision
         *    before completing the approval.
         */
        service.openCompletionDialog = function($scope, approval, revert, decide) {

            // These both use the CompletionDialogCtrl but have different templates.
            var id = 'completionDialog',
                title = 'ui_my_approvals_completion_title',
                templateUrl = SailPoint.CONTEXT_PATH + '/ui/js/approval/template/completion-dialog.html';

            if (approval.esigMeaning) {
                templateUrl = SailPoint.CONTEXT_PATH + '/ui/js/approval/template/esig-dialog.html';
                title = 'ui_my_approvals_esig_title';
                id = 'esigDialog';
            }

            var modalInstance = spModal.open({
                scope: $scope,
                id: id,
                title: title,
                templateUrl: templateUrl,
                controller: 'CompletionDialogCtrl',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    approval: function() {
                        return approval;
                    },
                    revert: function() {
                        return revert;
                    },
                    decide: function() {
                        return decide;
                    }
                },
                buttons: [{
                        displayValue: 'ui_button_cancel',
                        action: function() {
                            var deferred = $q.defer();
                            // The caller expects the dialog to dismiss with something
                            // like an http response
                            deferred.resolve({
                                status: 'cancel'
                            });
                            return deferred.promise;
                        }
                    }, {
                        displayValue: 'ui_button_complete',
                        primary: true,
                        action: function() {
                            return this.complete();
                        },
                        close: true
                    }]
                });

            // If the completion succeeded, let the ApprovalsCtrl know that an
            // approval was completed.
            modalInstance.result.then(function() {
                $scope.notifyApprovalCompleted(approval.id, true);
            }, function() {
                // On dismiss rollback the previous changes
                revert();
            });
        };

        return service;
    }]);
