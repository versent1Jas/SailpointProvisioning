'use strict';

/**
 * A RequestedAccessItem is an item that has been requested to be added to one
 * or more identities.  It contains information about the access being requested
 * as well as any meta-information that is required to provision.
 */
angular.module('sailpoint.accessrequest').

factory('RequestedAccessItem', [function() {

    ////////////////////////////////////////////////////////////////////////////
    //
    // CONSTRUCTOR
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Constructor.
     *
     * @param {AccessRequestItem} item  The item being requested.
     *
     * @throws If the item is null.
     */
    function RequestedAccessItem(item) {
        if (!item) {
            throw 'Item is required.';
        }

        ////////////////////////////////////////////////////////////////////////////
        //
        // PROPERTIES
        //
        ////////////////////////////////////////////////////////////////////////////

        /**
         * @property {AccessRequestItem}  The item that is being requested.
         */
        this.item = item;

        /**
         * @property {String} permittedById  The ID of the item that permits this
         *    requested item.  This should be set when requesting a permitted role
         *    underneath a business role.  Note that this will not be set for a
         *    top-level permitted role that is allowed by a role that was assigned
         *    in a previous request.  In this case, the AccessRequestItem permitted flag will be used.
         */
        this.permittedById = null;

        /**
         * @property {Array} accountSelections List of IdentityAccountSelections for
         * this item.
         */
        this.accountSelections = null;

        /**
         * @property {Date} request sunrise date
         */
        this.sunriseDate = null;

        /**
         * @property {Date} request sunset date
         */
        this.sunsetDate = null;

        /**
         * @property {String} request comment
         */
        this.comment = null;

        /**
         * @property {String} request assignment note
         */
        this.assignmentNote = null;

        /**
         * @property {String} id of the role assignment
         */
        this.assignmentId = null;
    }


    ////////////////////////////////////////////////////////////////////////////
    //
    // METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * @return {String} A unique ID for this requested item.
     */
    RequestedAccessItem.prototype.getUniqueId = function() {
        // For now we'll return the ID of the AccessRequestItem - I believe that
        // this is safe for now since you can only request a role/entitlement
        // once in a single flow.
        var id = this.item.getId();
        if (!id) {
            throw 'Access item must have an ID.';
        }
        return id;
    };

    /**
     * @return {Date} get sunrise date
     */
    RequestedAccessItem.prototype.getSunriseDate = function() {
        return this.sunriseDate;
    };

    /**
     * @param {Date} set sunrise date
     */
    RequestedAccessItem.prototype.setSunriseDate = function(sunriseDate) {
        this.sunriseDate = sunriseDate;
    };

    /**
     * @return {Date} get sunset date
     */
    RequestedAccessItem.prototype.getSunsetDate = function() {
        return this.sunsetDate;
    };

    /**
     * @param {Date} set sunset date
     */
    RequestedAccessItem.prototype.setSunsetDate = function(sunsetDate) {
        this.sunsetDate = sunsetDate;
    };

    /**
     * Returns true if either or both of the sunrise/sunset dates have been set to something other than
     * null or undefined.
     *
     * @return {boolean}
     */
    RequestedAccessItem.prototype.isDateSet = function() {
        return !!(this.getSunriseDate() || this.getSunsetDate());
    };

    /**
     * @return {String} comment
     */
    RequestedAccessItem.prototype.getComment = function() {
        return this.comment;
    };

    /**
     * @param {String} comment
     */
    RequestedAccessItem.prototype.setComment = function(comment) {
        this.comment = comment;
    };

    /**
     * @return {String} assignment note
     */
    RequestedAccessItem.prototype.getAssignmentNote = function() {
        return this.assignmentNote;
    };

    /**
     * @param {String} assignment note
     */
    RequestedAccessItem.prototype.setAssignmentNote = function(note) {
        this.assignmentNote = note;
    };

    /**
     * @return {String} id of the role assignment
     */
    RequestedAccessItem.prototype.getAssignmentId = function() {
        return this.assignmentId;
    };

    /**
     * @param {String} id of the role assignment
     */
    RequestedAccessItem.prototype.setAssignmentId = function(assignmentId) {
        this.assignmentId = assignmentId;
    };

    /**
     * Assignment note is only allowed on non-permitted by roles.
     * permittedBy is set during the request. AccessRequestItem permitted flag is set for top-level permitted roles.
     *
     * @return {boolean} whether or not an assignment note is allowed on this item
     */
    RequestedAccessItem.prototype.isAssignmentNoteAllowed = function() {
        return (this.item.isRole() && (this.permittedById === null) && !this.item.isPermitted());
    };

    /**
     * @return {boolean} true if comments or assignment note is not empty
     */
    RequestedAccessItem.prototype.hasCommentsOrNotes = function() {
        return !!(this.assignmentNote || this.comment);
    };

    /**
     * @return {Array<IdentityAccountSelection>} The account selections for this
     *     item, or null if there are none.
     */
    RequestedAccessItem.prototype.getAccountSelections = function() {
        return this.accountSelections;
    };

    /**
     * Set the account selections on this item.
     *
     * @param {Array<IdentityAccountSelection>} selections  The account selections.
     */
    RequestedAccessItem.prototype.setAccountSelections = function(selections) {
        this.accountSelections = selections;
    };

    /**
     * @return {boolean} True if any account selections has not been answered.
     */
    RequestedAccessItem.prototype.hasMissingAccountSelections = function() {
        if (this.accountSelections && this.accountSelections.length) {
            // Return true if any account selection is missing selections.
            return this.accountSelections.reduce(function(previous, acctSel) {
                return previous || !acctSel.allTargetsHaveSelections();
            }, false);
        }

        // No account selections exist ... we cool.
        return false;
    };

    return RequestedAccessItem;
}]);
