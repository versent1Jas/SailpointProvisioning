/**
 * Controller for the workgroup assignment dialog.  This expects the
 * approval to be available in the scope that is passed in as well as ApprovalCtrl methods.
 */
angular.module('sailpoint.approval').
    controller('WorkgroupAssignmentDialogCtrl',
        ['$scope', '$q', 'approvalService',
            function($scope, $q, approvalService) {

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
                 * Extra parameters needed for identity suggest 
                 */
                $scope.suggestParams = {
                    workgroup: $scope.isOwnerWorkgroup() ? getApproval().owner.id : null
                };

                /**
                 * Initialize the model
                 */
                $scope.assignmentModel = {};

                /**
                 * Set to true if validated and no assignment
                 * was selected
                 */
                $scope.missingAssignment = false;
                
                /**
                 * Get the current assignee display name.  If no assignee
                 * exists, get the workgroup owner display name.
                 * @returns {String} Identity/workgroup display name
                 */
                $scope.getCurrentAssignee = function() {
                    return $scope.getAssigneeName();
                };

                /**
                 * Get the assignee selected in the suggest
                 * @returns {Object} Identity object
                 */
                $scope.getAssignment = function() {
                    return $scope.assignmentModel.selectedIdentity;
                };

                /**
                 * Validate the assignment selection was made
                 * @returns {Promise} Promise that is resolved if assignment is made or rejected if not
                 */
                var validateAssignment = function() {
                    var deferred = $q.defer(),
                        promise = deferred.promise;
                        
                    $scope.missingAssignment = !$scope.getAssignment();
                    if ($scope.missingAssignment) {
                        deferred.reject();
                    } else {
                        deferred.resolve();
                    }
                    
                    return promise;
                };

                /**
                 * Assigns the approval to the given assignee, or removes assignment if null.
                 * Handles the error. 
                 * @param {Object} assignee New assignee for the approval, or null
                 * @returns {Promise} Promise that resolves with new assignee
                 */
                var assignApproval = function(assignee) {
                    var promise =
                        approvalService.assign(getApproval().id, (assignee) ? assignee.id : null)
                            .catch(function(response) {
                                // If a 404 occurred, display the error and refresh the page.
                                if (response && (404 === response.status)) {
                                    $scope.notifyObjectNotFoundException(response.data.message);
                                }
                                // Return a resolved promise so the dialog will close.
                                return $q.defer().resolve();
                            });

                    // Resolve with the new assignee if this was successful.
                    return promise.then(function() {
                        return assignee;
                    });
                };

                /**
                 * Removes the assignment
                 * @returns {Promise} Promise that resolves with new assignee, if successful
                 */
                $scope.removeAssignment = function() {
                    return assignApproval(null);
                };

                /**
                 * Validates new assignee is selected, then assigns the approval.
                 * @returns {Promise} Promise that resolves with new assignee, if successful
                 */
                $scope.saveAssignment = function() {
                    return validateAssignment().then(function() {
                        return assignApproval($scope.getAssignment());
                    });
                };
            }]);
