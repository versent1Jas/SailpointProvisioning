'use strict';

SailPoint.ns('SailPoint.accessRequest');

/**
 * An AccessRequestItem is a model object that represents an item (ie - role or
 * entitlement) that can be requested to be added to an identity.
 */

////////////////////////////////////////////////////////////////////////////
//
// CONSTRUCTOR
//
////////////////////////////////////////////////////////////////////////////

/**
 * Constructor.
 *
 * @param {Object} data  An object with the data for this item.
 *
 * @throws If data is null.
 */
SailPoint.accessRequest.AccessRequestItem = function(data) {
    if (!angular.isObject(data)) {
        throw 'Data required in constructor.';
    }

    this.id = data.id;
    this.accessType = data.accessType;
    this.displayableAccessType = data.displayableAccessType;
    this.type = data.type;
    this.name = data.name;
    this.displayableName = data.displayableName;
    this.owner = data.owner;
    this.description = data.description;
    this.icon = data.icon;
    this.application = data.application;
    this.attribute = data.attribute;
    this.riskScoreWeight = data.riskScoreWeight;
    this.riskScoreColor = data.riskScoreColor;
    this.riskScoreTextColor = data.riskScoreTextColor;
    this.populationStatistics = data.populationStatistics;
    this.permitted = data.permitted;
};


////////////////////////////////////////////////////////////////////////////
//
// CONSTANTS
//
////////////////////////////////////////////////////////////////////////////

/**
 * A constant for the entitlement type.
 */
SailPoint.accessRequest.AccessRequestItem.ACCESS_TYPE_ENTITLEMENT = 'Entitlement';

/**
 * A constant for the role type.
 */
SailPoint.accessRequest.AccessRequestItem.ACCESS_TYPE_ROLE = 'Role';

/** UIConfig entry key for roles */
SailPoint.accessRequest.AccessRequestItem.UI_ROLE_COL_CONFIG = 'uiAccessItemsColumnsRole';

/** UIConfig entry key for entitlements */
SailPoint.accessRequest.AccessRequestItem.UI_ENTITLEMENT_COL_CONFIG = 'uiAccessItemsColumnsEntitlement';

angular.extend(SailPoint.accessRequest.AccessRequestItem.prototype, {

    ////////////////////////////////////////////////////////////////////////////
    //
    // PROPERTIES
    //
    ////////////////////////////////////////////////////////////////////////////
    
    /** Item ID */
    id: undefined,
    
    /**  Acess type of the item - either ACCESS_TYPE_ROLE
     * or ACCESS_TYPE_ENTITLEMENT */
    accessType: undefined,
    
    /** Displayable access type */
    displayableAccessType: undefined,

    /** Item type */
    type: undefined,
    
    /** Name of the owner of the item */
    owner: undefined,
    
    /** Description of the item */
    description: undefined,
    
    // Entitlement only properties
    
    /** Icon of the entitlement */
    icon: undefined,
    /** Name of the application */
    application: undefined,
    /** Name of the attribute */
    attribute: undefined,
    
    // Role only properties

    /** Name of the role */
    name: undefined,

    /** Displayable name of the role */
    displayableName: undefined,
    
    /** Risk score weight */
    riskScoreWeight: undefined,
    
    /** Risk score color */
    riskScoreColor: undefined,
    
    /** Risk Score text color */
    riskScoreTextColor: undefined,
    
    // Identity search only properties
    
    /** Object representing population statistics for this item */
    populationStatistics: undefined,

    /** whether or not this is a top-level permitted role **/
    permitted: undefined,

    ////////////////////////////////////////////////////////////////////////////
    //
    // INSTANCE METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Return the ID of the item.
     */
    getId: function() {
        return this.id;
    },


    /**
     * Return the type of the item
     */
    getType: function() {
        return this.type;
    },

    /**
     * Return the access type of the item - either ACCESS_TYPE_ROLE
     * or ACCESS_TYPE_ENTITLEMENT
     */
    getAccessType: function() {
        return this.accessType;
    },

    /**
     * Return the displayable access type for use in UI
     */
    getDisplayableAccessType: function() {
        return this.displayableAccessType ? this.displayableAccessType : this.accessType;
    },

    /**
     * Return whether this is a role item.
     */
    isRole: function() {
        return SailPoint.accessRequest.AccessRequestItem.ACCESS_TYPE_ROLE === this.accessType;
    },

    /**
     * Return whether this is an entitlement item.
     */
    isEntitlement: function() {
        return SailPoint.accessRequest.AccessRequestItem.ACCESS_TYPE_ENTITLEMENT === this.accessType;
    },

    /**
     * Return the name of the role, or null if this is an entitlement.
     */
    getName: function() {
        return this.name;
    },

    /**
     * Return the displayable of the item.
     */
    getDisplayableName: function() {
        return this.displayableName;
    },

    /**
     * @return {String} Either the displayableName (if available) or the name.
     */
    getDisplayableNameOrName: function() {
        return this.displayableName || this.name;
    },

    /**
     * Return the name of owner of the item.
     */
    getOwner: function() {
        return this.owner;
    },

    /**
     * Return the description of the item.
     */
    getDescription: function() {
        return this.description;
    },

    /**
     * Return the icon of the entitlement (only available for entitlements).
     */
    getIcon: function() {
        return this.icon;
    },

    /**
     * Return the name of the application for the entitlement (only available
     * for entitlements).
     */
    getApplication: function() {
        return this.application;
    },

    /**
     * Return the attribute for the entitlement (only available for entitlements).
     */
    getAttribute: function() {
        return this.attribute;
    },

    /**
     * Return whether this item has a risk score greater than 0.
     */
    hasRiskScoreWeight: function() {
        return !!(this.riskScoreWeight && (this.riskScoreWeight > 0));
    },

    /**
     * Return the risk score weight of the item (only available for roles).
     */
    getRiskScoreWeight: function() {
        return this.riskScoreWeight;
    },

    /**
     * Return the risk score color of the item (only available for roles).
     */
    getRiskScoreColor: function() {
        return this.riskScoreColor;
    },

    /**
     * Return the risk score text color of the item (only available for roles).
     */
    getRiskScoreTextColor: function() {
        return this.riskScoreTextColor;
    },

    /**
     * Return the population statistics of the item (only available for
     * ientity searches).
     *
     * @return {Object} An object with the following properties:
     *   - total: The total number of identities.
     *   - count: The numer of identities that have this item.
     *   - highRisk: A boolean indicating whether anyone in the population
     *     is high risk.
     */
    getPopulationStatistics: function() {
        return this.populationStatistics;
    },

    /**
     * Return whether or not this is a top-level permitted role
     */
    isPermitted: function() {
        return !!this.permitted;
    }
});

/**
 * Expose as a factory model for angular injection
 */
angular.module('sailpoint.accessrequest').

    factory('AccessRequestItem', function() {
        return SailPoint.accessRequest.AccessRequestItem;
    });

