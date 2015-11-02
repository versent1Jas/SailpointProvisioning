'use strict';

/**
 * A service that is responsible for showing comments dialog for an approval or approval item.
 */
angular.module('sailpoint.approval')
.factory('approvalCommentService', ['$q', 'spModal',function($q, spModal) {

    var service = {};

    /**
     * Open the comment dialog.
     *
     * @param {Scope} $scope     The scope of the controller that is opening
     *    the comment dialog.  Should have a boolean isItem and approval or approvalItem depending on
     *    if isItem is respectively false or true.
     * @param String dialogTitle  The string to put as the title of the dialog.
     * @param {Approval or ApprovalItem} incrementObject  The approval or approvalItem to increment
     * the count on should a comment be sucessfully added.
     */
    service.openCommentDialog = function($scope, dialogTitle, incrementObject) {

        var modalInstance = spModal.open({
            scope: $scope,
            dialogId: 'CommentsDialog',
            title: dialogTitle,
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/js/approval/template/comment-dialog.html',
            footerTemplateUrl: SailPoint.CONTEXT_PATH + '/ui/js/approval/template/comment-dialog-footer.html',
            controller: 'ApprovalCommentDialogCtrl',
            backdrop: 'static',
            keyboard: false,
            buttons: [
                {
                    displayValue: 'ui_button_cancel'
                }, {
                    displayValue: 'ui_button_post',
                    primary: true,
                    action: function() {
                        return this.addComment();
                    },
                    close: true
                }
            ]
        });
        modalInstance.result.then(function(result){
            incrementObject.commentCount ++;
        });

        return modalInstance;
    };

    return service;
}]);
