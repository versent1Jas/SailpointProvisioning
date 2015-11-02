'use strict';

/**
 * The CurrentAccessItem model extends the AccessRequestItem model to
 * hold additional information about access items already held by an identity
 */
angular.module('sailpoint.accessrequest').

factory('CurrentAccessItem', ['AccessRequestRoleTarget', function(AccessRequestRoleTarget) {

    ////////////////////////////////////////////////////////////////////////////
    //
    // CONSTRUCTOR
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Constructor.
     *
     * @param {Object} data  An object with the data for this access item
     *
     * @throws If data is null.
     */
    function CurrentAccessItem(data) {
        // Call super constructor first, this will validate non-null data
        CurrentAccessItem._super.call(this, data);

        this.status = data.status;
        this.statusLabel = data.statusLabel;
        if (data.sunrise) {
            this.sunrise = new Date(data.sunrise);
        }
        if (data.sunset) {
            this.sunset = new Date(data.sunset);
        }
        this.nativeIdentity = data.nativeIdentity;
        this.accountName = data.accountName;
        this.instance = data.instance;
        this.value = data.value;
        this.assignmentNote = data.assignmentNote;
        this.comment = data.comment;
        this.assignmentId = data.assignmentId;
        if (angular.isArray(data.roleTargets)) {
            this.roleTargets = [];
            angular.forEach(data.roleTargets, function(value) {
                this.push(new AccessRequestRoleTarget(value));
            }, this.roleTargets);
        }
        this.roleLocation = data.roleLocation;
        this.removable = data.removable;
    }

    //Extending AccessRequestItem
    SailPoint.extend(CurrentAccessItem, SailPoint.accessRequest.AccessRequestItem);

    ////////////////////////////////////////////////////////////////////////////
    //
    // CONSTANTS
    //
    ////////////////////////////////////////////////////////////////////////////

    // Constant for an 'active' item.
    CurrentAccessItem.STATUS_ACTIVE = 'active';

    // Constant for a 'requested' item.
    CurrentAccessItem.STATUS_REQUESTED = 'requested';

    // UIConfig entry key for roles.
    CurrentAccessItem.UI_ROLE_COL_CONFIG = 'uiCurrentAccessItemsColumnsRole';

    // UIConfig entry key for entitlements
    CurrentAccessItem.UI_ENTITLEMENT_COL_CONFIG = 'uiCurrentAccessItemsColumnsEntitlement';


    // Add CurrentAccessItem specific stuff
    angular.extend(CurrentAccessItem.prototype, {
        /** status of the item, either STATUS_ACTIVE or STATUS_REQUESTED */
        status: undefined,

        /** Displayable status of the item */
        statusLabel: undefined,

        /** Sunrise date of the item, possibly null */
        sunrise: undefined,

        /** Sunset date of the item, possibly null */
        sunset: undefined,

        // Entitlement only properties

        /** Native Identity of the entitlement */
        nativeIdentity: undefined,

        /** Account name of the entitlement */
        accountName: undefined,

        /** Instance of the entitlement, if applicable */
        instance: undefined,
        
        /** Value of the entitlement, useful if there is no ID */
        value: undefined,

        //Role only properties 

        /** ID of the role assignment, if it exists */
        assignmentId: undefined,

        /** role assignment note, if it exists */
        assignmentNote: undefined,

        /** Comments related to request */
        comment: undefined,

        /** Array of AccessRequestRoleTarget items for the role */
        roleTargets: undefined,

        /** Role location for role */
        roleLocation: undefined,

        /** Flag to determine if the access is removable */
        removable: undefined,

        /**
         * Return the status of the current access - either STATUS_ACTIVE
         * or STATUS_REQUESTED
         */
        getStatus: function() {
            return this.status;
        },

        /**
         * Not allowing assignment notes to be added
         *
         * @returns {boolean}
         */
        isAssignmentNoteAllowed: function() {
            return false;
        },

        /**
         * Return true if the current access is active
         */
        isActive: function() {
            return CurrentAccessItem.STATUS_ACTIVE === this.status;
        },

        /**
         * Return true if the current access is requested
         */
        isRequested: function() {
            return CurrentAccessItem.STATUS_REQUESTED === this.status;
        },

        /**
         * Return the displayable label for the current access status
         */
        getStatusLabel: function() {
            return this.statusLabel;
        },

        /**
         * Return the sunrise date for the current access
         */
        getSunrise: function() {
            return this.sunrise;
        },

        /**
         * Return the sunset date for the current access
         */
        getSunset: function() {
            return this.sunset;
        },

        /**
         * Return the native identity (entitlement only)
         */
        getNativeIdentity: function() {
            return this.nativeIdentity;
        },

        /**
         * Return the account name (entitlement only)
         */
        getAccountName: function() {
            return this.accountName;
        },

        /**
         * Return the instance, if applicable (entitlement only)
         */
        getInstance: function() {
            return this.instance;
        },

        /**
         * Return the value (entitlement only)
         */
        getValue: function() {
            return this.value;
        },

        /**
         * Return the assignment ID (role only)
         */
        getAssignmentId: function() {
            return this.assignmentId;
        },

        /**
         * Return the assignment note (role only)
         */
        getAssignmentNote: function() {
            return this.assignmentNote;
        },

        /**
         * Return the comment
         */
        getComment: function() {
            return this.comment;
        },

        /**
         * Set comment
         * @param comment
         */
        setComment: function(comment) {
            this.comment = comment;
        },

        /**
         * @returns {boolean} if there is a comment or assignment note
         */
        hasCommentsOrNotes: function() {
            return !!(this.assignmentNote || this.comment);
        },

        /**
         * Return the AccessRequestRoleTarget objects for this role (role only)
         */
        getRoleTargets: function() {
            return this.roleTargets;
        },

        /**
         * Return the role location for this role
         */
        getRoleLocation: function() {
            return this.roleLocation;
        },

        /**
         * Returns true if item is for an assigned role
         * @returns {boolean} True if item is for an assigned role
         */
        isAssigned: function() {
            return this.isRole() && this.roleLocation === 'assigned';
        },

        /**
         * Returns true if item is for a detected role
         * @returns {boolean} True if item is for a detected role
         */
        isDetected: function() {
            return this.isRole() && this.roleLocation === 'detected';
        },

        /**
         * Determines whether or not this item is removable by the currently
         * logged in user.
         *
         * @returns {boolean} True if the item is removable, false otherwise
         */
        isRemovable: function() {
            return this.removable;
        },

        /**
         * Get a unique identifier for this current access
         */
        getUniqueId: function() {
            var uniqueId;
            if (this.isEntitlement()) {
                if (this.getId()) {
                    uniqueId = this.getId() + this.getNativeIdentity();
                } else {
                    uniqueId = this.getApplication() + this.getAttribute() +
                        this.getValue() + this.getNativeIdentity();
                }
                if (this.getInstance()) {
                    uniqueId += this.getInstance();
                }
            } else {
                uniqueId = this.getId();
                if (this.getAssignmentId()) {
                    uniqueId += this.getAssignmentId();
                }
            }
            return uniqueId;
        }
    });

    return CurrentAccessItem;
}]);
