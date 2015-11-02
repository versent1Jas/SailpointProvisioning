'use strict';

/**
 * Controller for the Access Request Comment Dialog.
 */
angular.module('sailpoint.accessrequest').
    controller('AccessRequestCommentDialogCtrl', ['requestedAccessItem', '$modalInstance',

function(requestedAccessItem, $modalInstance) {

    ////////////////////////////////////////////////////////////////////////
    //
    // PROPERTIES
    //
    ////////////////////////////////////////////////////////////////////////

    /**
     * The comment initialized to the item comment
     * @type {String}
     */
    this.comment = requestedAccessItem.getComment();

    /**
     * The assignment note initialized to the item assignment note
     * @type {String|*}
     */
    this.assignmentNote =
        requestedAccessItem.isAssignmentNoteAllowed() ? requestedAccessItem.getAssignmentNote() : null;

    ////////////////////////////////////////////////////////////////////////
    //
    //  METHODS
    //
    ////////////////////////////////////////////////////////////////////////

    /**
     * Save the comment onto the requested access item
     */
    this.saveComment = function() {
        requestedAccessItem.setComment(this.comment);

        if (requestedAccessItem.isAssignmentNoteAllowed()) {
            requestedAccessItem.setAssignmentNote(this.assignmentNote);
        }

        $modalInstance.close();
    };

    /**
     * Cancel comment
     */
    this.cancel = function() {
        $modalInstance.dismiss('cancel');
    };

    /**
     * Check if we should show the assignment note tab
     *
     * @returns {boolean}
     */
    this.isAssignmentNoteAllowed = function() {
        return requestedAccessItem.isAssignmentNoteAllowed();
    };

}]);
