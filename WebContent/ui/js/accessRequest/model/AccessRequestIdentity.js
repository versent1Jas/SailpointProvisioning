'use strict';

/**
 * An AccessRequestIdentity is a model object that represents an identity for
 * which access can be requested.
 */
angular.module('sailpoint.accessrequest').

factory('AccessRequestIdentity', function() {

    /**
     * Constructor.
     *
     * @param {Object} data  An object with the data for this identity.
     *
     * @throws If data is null or not an object.
     */
    function AccessRequestIdentity(data) {
        // Throw if the data is null or not a javascript object.
        if (!angular.isObject(data)) {
            throw 'Data required in constructor.';
        }

        // Instance variables.
        this.id = data.id;
        this.name = data.name;
        this.displayName = data.displayName;

        this.displayableName = data.displayName ? data.displayName : data.name;

        this.managerName = data.managerName;

        this.attributes = angular.copy(data);

        // removing these properties so that in IdentityUtil we don't show duplicate identity attributes when metadata
        // is not available
        delete this.attributes.managerName;
        delete this.attributes.name;
        delete this.attributes.id;
    }

    /**
     * Constant for the identity UIConfig entry.
     */
    AccessRequestIdentity.IDENTITY_CARD_COL_CONFIG = 'uiRequestAccessIdentityCard';

    /**
     * Return the ID of the identity.
     */
    AccessRequestIdentity.prototype.getId = function() {
        return this.id;
    };

    /**
     * Return the name of the identity.
     */
    AccessRequestIdentity.prototype.getName = function() {
        return this.name;
    };

    /**
     * Return the displayable name of the identity.
     */
    AccessRequestIdentity.prototype.getDisplayableName = function() {
        return this.displayableName;
    };

    /**
     * Return the identity's manager's name.
     */
    AccessRequestIdentity.prototype.getManagerName = function() {
        return this.managerName;
    };

    /**
     * Return an object containing the viewable attributes of the identity.
     */
    AccessRequestIdentity.prototype.getAttributes = function() {
        return this.attributes;
    };

    /**
     * Return the requested attribute for this identity.
     *
     * @param {String} attrName  The name of the attribute return.
     */
    AccessRequestIdentity.prototype.getAttribute = function(attrName) {
        return (this.attributes) ? this.attributes[attrName] : null;
    };

    return AccessRequestIdentity;
});
