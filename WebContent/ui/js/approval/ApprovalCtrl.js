'use strict';

/**
 * The ApprovalCtrl handles displaying and acting on a single approval.  It is
 * assumed that a parent scope defines "approval".
 */
angular.module('sailpoint.approval').
    constant('APPROVAL_DETAIL_TEMPLATE_URL',
             SailPoint.CONTEXT_PATH + '/ui/js/approval/template/approval-detail-dialog.html').
    constant('VIOLATION_DETAIL_TEMPLATE_URL',
        SailPoint.CONTEXT_PATH + '/ui/js/approval/template/violation-detail-dialog.html').

    /* jshint maxparams: 9 */
    controller('ApprovalCtrl',
               ['$scope', '$q', 'spModal', 'approvalService', 'approvalCompletionService',
                    'APPROVAL_DETAIL_TEMPLATE_URL', 'VIOLATION_DETAIL_TEMPLATE_URL',
                    'approvalCommentService',
               function($scope, $q, spModal, approvalService, approvalCompletionService,
                    APPROVAL_DETAIL_TEMPLATE_URL, VIOLATION_DETAIL_TEMPLATE_URL, approvalCommentService) {

    ////////////////////////////////////////////////////////////////////////////
    //
    // PROPERTIES
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * A boolean indicating whether this approval is collapsed or not in the UI.
     */
    $scope.isCollapsed = true;


    ////////////////////////////////////////////////////////////////////////////
    //
    // GETTERS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Return the approval object for this controller.  This will throw if there
     * is not an approval in the scope.
     */
    var getApproval = function() {
        if (!$scope.approval) {
            throw 'Expected an approval in the scope.';
        }
        return $scope.approval;
    };

    /**
     * Return an array of approval items for this approval.
     */
    $scope.getApprovalItems = function() {
        return getApproval().approvalItems;
    };

    /**
     * Return whether the given approval item has a decision.
     */
    var hasDecision = function(approvalItem) {
        return !!approvalItem.decision;
    };

    /**
     * Return the number of approval items that still need decisions.
     */
    $scope.getRemainingCount = function() {
        var remaining = 0;

        angular.forEach(this.getApprovalItems(), function(approvalItem) {
            if (!hasDecision(approvalItem)) {
                remaining++;
            }
        });

        return remaining;
    };

    /**
     * Return the total number of approval items in this approval.
     */
    $scope.getTotalCount = function() {
        var items = this.getApprovalItems();
        return (items) ? items.length : 0;
    };

    /**
     * @description
     * Returns true is the passed object claims to be a workgroup
     * @param person The object to test
     * @returns {boolean} true if is a workgroup
     */
    var isWorkgroup = function(person) {
        if(person) {
            return person.isWorkgroup;
        }
        return false;
    };

    /**
     * @description
     * Returns true is the owner is a workgroup and false otherwise
     * @returns {boolean} True if owner is a workgroup otherwise false
     */
    $scope.isOwnerWorkgroup = function() {
        return isWorkgroup(getApproval().owner);
    };

    /**
     * Return the display name of the given identity object, which should
     * contain a displayName, name, and ID.
     */
    var getDisplayName = function(person) {
        return (person) ? person.displayName || person.name : '';
    };

    /**
     * Return the display name of the owner.
     */
    $scope.getOwnerName = function() {
        return getDisplayName(getApproval().owner);
    };

    /**
     * Return the display name of the requester.
     */
    $scope.getRequesterName = function() {
        return getDisplayName(getApproval().requester);
    };

    /**
     * Return the display name of the requestee.
     */
    $scope.getRequesteeName = function() {
        return getDisplayName(getApproval().target);
    };

    /**
     * Return the display name of the assignee, or the owner
     * if it is a workgroup
     */
    $scope.getAssigneeName = function() {
        var assigneeName;
        if (getApproval().assignee) {
            assigneeName = getDisplayName(getApproval().assignee);
        } else if ($scope.isOwnerWorkgroup()){
            assigneeName = $scope.getOwnerName();
        }
        
        return assigneeName;
    };

    /**
     * Return true if this is a high priority approval.
     */
    $scope.isHighPriority = function() {
        return 'High' === getApproval().priority;
    };

    /**
     * Return true if the completed flag has been set on the approval
     */
    $scope.isCompleted = function() {
        return !!getApproval().completed;
    };

    /**
     * Return the number of comments on the approval
     */
    $scope.getCommentCount = function() {
        return getApproval().commentCount;
    };

    /**
     * Return true if an assignee exists for the approval
     */
    $scope.hasAssignee = function() {
        return !!getApproval().assignee;
    };

    ////////////////////////////////////////////////////////////////////////////
    //
    // ACTIONS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Toggle the collapsed state of this approval.
     */
    $scope.toggleCollapsed = function() {
        this.isCollapsed = !this.isCollapsed;
    };

    /**
     * Set the decision for all items to the given decision.
     *
     * @param {String} decision  The decision to set on all items.
     */
    var setDecisions = function(decision) {
        angular.forEach($scope.getApprovalItems(), function(approvalItem) {
            approvalItem.decision = decision;
        });
    };

    /**
     * Return an object with keys of each approval item ID and values of the
     * current decision for each.
     */
    var getDecisions = function() {
        var decisions = {};
        angular.forEach($scope.getApprovalItems(), function(approvalItem) {
            decisions[approvalItem.id] = approvalItem.decision;
        });
        return decisions;
    };

    /**
     * Revert the decisions on all items to what is specified in previousDecisions.
     *
     * @param {Object} previousDecisions  An object with keys of each approval
     *    item ID and the values of the decision to revert to.
     */
    var revertDecisions = function(previousDecisions) {
        angular.forEach($scope.getApprovalItems(), function(approvalItem) {
            approvalItem.decision = previousDecisions[approvalItem.id];
        });
    };

    /**
     * Display the completion dialog for this approval.
     */
    var showCompletionDialog = function(approval, decideFunc, previousDecisions) {
        var decide = angular.bind($scope, decideFunc, approval.id),
            revert = angular.bind($scope, revertDecisions, previousDecisions);

        approvalCompletionService.openCompletionDialog($scope, approval, revert, decide);
    };

    /**
     * Display the completion dialog for this approval if all decisions were previously made.
     */
    $scope.completePreDecided = function() {
        var promise, approval = getApproval();
        //make promise that always succeeds since no further decisions are needed
        function decide() {
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
        }
        
        //if no esig complete without popup, else pop up esig dialog
        if (!approval.esigMeaning) {
            promise = approvalService.complete(approval.id);
            promise.then(function(){
                $scope.notifyApprovalCompleted(approval.id);
            });
            
        } else {
            approvalCompletionService.openCompletionDialog($scope, approval, angular.noop, decide);
        }
    };

    /**
     * Set all items to the given decision and display the completion dialog.
     *
     * @param {String} decision  The decision to set on all items.
     * @param {Function} decideFunction  The function to call when completing
     *    the completion dialog.
     */
    var bulkDecide = function(decision, decideFunc) {
        var approval = getApproval(),
            previousDecisions = getDecisions();

        // Pre-emptively change the decisions.
        setDecisions(decision);

        // Pop up the completion dialog.
        showCompletionDialog(approval, decideFunc, previousDecisions);
    };

    /**
     * Approve all items on this approval and display the completion dialog.
     */
    $scope.approveAll = function() {
        bulkDecide(approvalService.DECISION_APPROVED, approvalService.approveAll);
    };

    /**
     * Reject all items on this approval and display the completion dialog.
     */
    $scope.rejectAll = function() {
        bulkDecide(approvalService.DECISION_REJECTED, approvalService.rejectAll);
    };

    /**
     * Open up a details dialog for this approval.
     */
    $scope.showDetails = function() {
        spModal.open({
            title: 'ui_my_approvals_detail_title',
            isContextual: true,
            templateUrl: APPROVAL_DETAIL_TEMPLATE_URL,
            controller: 'ApprovalDetailDialogCtrl',
            scope: $scope
        });
    };

    /**
     * Open up a comment dialog for this approval.
     */
    $scope.showApprovalComments = function() {
        approvalCommentService.openCommentDialog($scope, '#{my_approvals_approval_comments}', getApproval());
    };
    
    /**
     * Opens a modal that shows the details of a violation
     * @param violation Violation from the approval (it just contains a ruleName and a policyName)
     */
    $scope.showViolationDetails = function(violation) {
        var scope = $scope.$new();
        scope.violation = violation;
        spModal.open({
            title: violation.ruleName,
            isContextual: true,
            templateUrl: VIOLATION_DETAIL_TEMPLATE_URL,
            controller: 'ViolationDetailDialogCtrl',
            scope: scope
        });
    };

    /**
     * Show the edit priority dialog.
     */
    $scope.showEditPriorityDialog = function() {
        var modalInstance = spModal.open({
            title: 'ui_my_approvals_edit_priority_title',
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/js/approval/template/edit-priority-dialog.html',
            controller: 'ApprovalPriorityDialogCtrl',
            scope: $scope,
            backdrop: 'static',
            keyboard: false,
            buttons: [{
                displayValue: 'ui_button_cancel'
            }, {
                displayValue: 'ui_button_save',
                primary: true,
                action: function() {
                    // Save the priority and handle the error.  It would be
                    // nice to be able to do the error handling below on the
                    // modalInstance.result promise, but spModal always returns
                    // a resolved promise unless the dialog should stay open.
                    return this.savePriority().catch(function(response) {
                        // If a 404 occurred, display the error and refresh the page.
                        if (response && (404 === response.status)) {
                            $scope.notifyObjectNotFoundException(response.data.message);
                        }
                        // Return a resolved promise so the dialog will close.
                        return $q.defer().resolve();
                    });
                },
                close: true
            }]
        });

        // If saving was successful, update the priority.
        modalInstance.result.then(function(newPriority) {
            getApproval().priority = newPriority;
        });
    };

    /**
     * Show the workgroup assignment dialog
     */
    $scope.showWorkgroupAssignmentDialog = function() {
        if (!$scope.isOwnerWorkgroup()) {
            throw 'Workgroup assignment not available for approvals not owned by workgroups';
        }
        
        var modalInstance = spModal.open({
            title: 'ui_my_approvals_workgroup_assignment_title',
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/js/approval/template/workgroup-assignment-dialog.html',
            controller: 'WorkgroupAssignmentDialogCtrl',
            scope: $scope,
            backdrop: 'static',
            keyboard: false,
            buttons: [{
                displayValue: 'ui_my_approvals_workgroup_assignment_remove_assignee',
                extraClass: 'pull-left',
                disabled: '!hasAssignee()',
                action: function() {
                    return this.removeAssignment();
                },
                close: true
            }, {
                displayValue: 'ui_button_cancel'
            }, {
                displayValue: 'ui_button_save',
                primary: true,
                action: function() {
                    return this.saveAssignment();
                },
                close: true
            }]
        });

        // If saving was successful, update the assignee.
        modalInstance.result.then(function(newAssignee) {
            getApproval().assignee = newAssignee;
        });
    };

    /**
     * Show the forward dialog.
     */
    $scope.showForwardDialog = function() {
        var scope = $scope.$new();
        scope.forward = {};
        scope.missingIdentity = false;
        scope.forwardAction = function() {
            if (!scope.forward.selectedIdentity) {
                scope.missingIdentity = true;
                return $q.reject();
            } else {
                scope.missingIdentity = false;
                var promise = approvalService.forwardApproval(getApproval().id,
                    scope.forward.selectedIdentity.id,
                    scope.forward.comment);
                promise.then(function() {
                    scope.notifyApprovalCompleted(getApproval().id, true);
                });
            }
        };
        
        spModal.open({
            title: 'ui_my_approvals_forward_title',
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/js/approval/template/forward-dialog.html',
            scope: scope,
            dialogId: 'ForwardDialog',
            backdrop: 'static',
            keyboard: false,
            buttons: [{
                displayValue: 'ui_button_cancel'
            }, {
                displayValue: 'ui_button_forward',
                primary: true,
                action: scope.forwardAction,
                close: true
            }]
        });
        return scope;
    };
}]);
