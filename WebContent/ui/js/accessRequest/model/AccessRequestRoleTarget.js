'use strict';

/**
 * The AccessRequestRoleTarget model holds the "account details" about a role assignment.
 */
angular.module('sailpoint.accessrequest').

factory('AccessRequestRoleTarget', function() {

    ////////////////////////////////////////////////////////////////////////////
    //
    // CONSTRUCTOR
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Constructor.
     *
     * @param {Object} data  An object with the data for this role target.
     *
     * @throws If data is null.
     */
    function AccessRequestRoleTarget(data) {
        if (!angular.isObject(data)) {
            throw 'Data required in constructor.';
        }

        this.role = data.role;
        this.application = data.application;
        this.instance = data.instance;
        this.nativeIdentity = data.nativeIdentity;
        this.accountName = data.accountName;
    }

    angular.extend(AccessRequestRoleTarget.prototype, {

        ////////////////////////////////////////////////////////////////////////////
        //
        // PROPERTIES
        //
        ////////////////////////////////////////////////////////////////////////////

        /** Name of the role */
        role: undefined,

        /** Name of the application */
        application: undefined,

        /** Name of the instance, if applicable */
        instance: undefined,

        /** Native identity */
        nativeIdentity: undefined,

        /** Display name of the account */
        accountName: undefined,

        ////////////////////////////////////////////////////////////////////////////
        //
        // INSTANCE METHODS
        //
        ////////////////////////////////////////////////////////////////////////////

        /**
         * Return the name of the role
         */
        getRole: function() {
            return this.role;
        },

        /**
         * Return the name of the application
         */
        getApplication: function() {
            return this.application;
        },

        /**
         * Return the name of the instance, if applicable.
         */
        getInstance: function() {
            return this.instance;
        },

        /**
         * Return the native identity
         */
        getNativeIdentity: function() {
            return this.nativeIdentity;
        },

        /**
         * Return the name of the account
         */
        getAccountName: function() {
            return this.accountName;
        }

    });

    return AccessRequestRoleTarget;
});