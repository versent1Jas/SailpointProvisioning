'use strict';

/**
 * Controller for the Approval Comment Dialogs.
 * Expects scope to contain:
 *   - isItem optional if this is a controller for an approval item if it's for an approval anything
 *     falsey including undefined will work
 *   - approval required to retrieve/add comments
 *   - approvalItem required if this is an approval item comment dialog, not required if this is for a work item
 */
angular.module('sailpoint.approval').
    controller('ApprovalCommentDialogCtrl',
               ['$scope', '$q', 'approvalService', 'spTranslateFilter',
                function($scope, $q, approvalService, spTranslateFilter) {

        //initialize newComment, not sure if this is necessary but better safe than sorry
        $scope.newComment = {};

        //initialize the form
        $scope.form = {};

        //keep track of whether user has attempted to submit
        $scope.submitted = false;
                    
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
         * add the approval comments to the scope unless this is an approval item dialog
         */
        if (!$scope.isItem){
            $scope.comments = approvalService.getComments(getApprovalId());
        } else {
            $scope.comments = approvalService.getItemComments(getApprovalId(), getApprovalItemId());
        }

        /**
         * Return true if the user made the comment.
         */
        $scope.isRightAligned = function(author){
            return SailPoint.CURR_DISPLAYABLE_USER_NAME === author;
        };

        /**
         * Add an approval comment or an item comment if this is an approval item dialog.
         */
        $scope.addComment = function() {
            var deferred,
                form = $scope.form.comment;

            // Set that user tried to submit, so we can mark invalid if necessary
            $scope.submitted = true;
            
            // Do nothing if the form is not valid.
            if (form && form.$invalid) {
                deferred = $q.defer();
                deferred.reject();
                return deferred.promise;
            }
            
            var promise, text = $scope.newComment.text;
            if (!$scope.isItem){
                promise = approvalService.addComment(getApprovalId(), text);
            } else {
                promise = approvalService.addItemComment(getApprovalId(), getApprovalItemId(), text);
            }
            promise.catch(function(){
                $scope.notifyObjectNotFoundException(spTranslateFilter('ui_my_approvals_comment_add_failed', text));
                
            });
            
            return promise;
        };

        /**
         * Validate field and return true if error message should be shown
         * @param field Field to validate
         * @returns {Boolean} True if invalid, otherwise false
         */
        $scope.showErrorMsg = function(field) {
            // Show if the field is invalid and user tried to submit.
            return field.$invalid && $scope.submitted;
        };
    }]);
