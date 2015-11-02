/* (c) Copyright 2015 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

angular.module('sailpoint.model').

factory('RoleEntitlementItem', [function() {

    /**
     * Constructor.
     *
     * @param {Object} data  An object with the data for this item.
     *
     * @throws If data is null.
     */
    function RoleEntitlementItem(data) {
        if (!angular.isObject(data)) {
            throw 'Data required in constructor.';
        }

        /** @property {string} Description of the item */
        this.description = data.description;

        /** @property {string} Name of the application */
        this.applicationName = data.applicationName;

        /** @property {string} value of the property */
        this.value = data.value;

        /** @property {string} value of the property */
        this.property = data.property;

        /** @property {string} source of entitlement */
        this.roleName = data.roleName;

        /** @property {string} value to display in UI */
        this.displayValue = data.displayValue;
    }

    /**
     * Return the description of the item.
     */
    RoleEntitlementItem.prototype.getDescription = function() {
        return this.description;
    };

    /**
     * Return the name of the application.
     */
    RoleEntitlementItem.prototype.getApplicationName = function() {
        return this.applicationName;
    };

    /**
     * Return the value of the value.
     */
    RoleEntitlementItem.prototype.getValue = function() {
        return this.value;
    };

    /**
     * Return the value of the property
     */
    RoleEntitlementItem.prototype.getProperty = function() {
        return this.property;
    };

    /**
     * Return the role name of the source for the entitlement.
     */
    RoleEntitlementItem.prototype.getRoleName = function() {
        return this.roleName;
    };

    return RoleEntitlementItem;
}]);
