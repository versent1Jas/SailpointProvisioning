/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

SailPoint.ns('SailPoint.util');

/**
 * @author: michael.hide
 * Created: 8/19/14 11:24 AM
 */

/**
 * Takes either a flattened array of identity attributes, or an AccessRequestIdentity and
 * generates an ordered list of viewable attributes with appropriately translated labels.
 *
 * @param identitydata (flattened array of attributes | AccessRequestIdentity)
 * @param metadata Ordered array of keys and translated labels
 * @returns {Array}
 */
SailPoint.util.applyIdentityAttributeMetaData = function(identitydata, metadata) {
    var i, attribute, attributes, attrObj,
        identity = [],
        identityDetails = [];

    /**
     * Inner helper function to pull out the attribute value from identitydata
     *
     * @param data A flattened array of identity attributes
     * @param key The attribute key to look for
     * @returns {*}
     */
    function getIdentityAttribute(data, key) {
        var i;
        if (data) {
            for (i = 0; i < data.length; i++) {
                if (data[i][key] !== undefined) {
                    return data[i][key];
                }
            }
        }
        return null;
    }

    /**
     * Helper function to push a config object into identityDetails (which is used to display
     * an ordered list of viewable identity details).
     *
     * @param val The value to display
     * @param key The translated label for the value
     */
    var pushObject = function(val, key) {
        if (val) {
            identityDetails.push({
                label: key,
                value: val
            });
        }
    };

    // Handle different input types.  If it's an array, we can assume it's in the format
    // we want.  Otherwise it should be an IdentityClass in which case we need to
    // flatten it into an array of attribute objects.
    if (angular.isArray(identitydata)) {
        identity = identitydata;
    }
    else {
        try {
            identity.push({'id': identitydata.getId()});
            identity.push({'name': identitydata.getDisplayableName()});
            identity.push({'manager': identitydata.getManagerName()});
            attributes = identitydata.getAttributes();
            angular.forEach(attributes, function(val, key) {
                attrObj = {};
                attrObj[key] = val;
                identity.push(attrObj);
            });
        }
        catch (e) {
            // if we get here we have bigger problems, throw an exception
            throw 'Unable to transform Identity object.';
        }
    }

    if (metadata) {
        for (i = 0; i < metadata.length; i++) {
            attribute = getIdentityAttribute(identity, metadata[i]['attribute']);
            pushObject(attribute, metadata[i]['label']);
        }
    }
    // If we don't have the meta data, fall back to showing just the key:value from the data
    else if (identity.length > 0) {
        for (i = 0; i < identity.length; i++) {
            angular.forEach(identity[i], pushObject);
        }
    }

    return identityDetails;
};

/**
 * Helper function to generate a list of selected ids
 *
 * @param {Array} Array of selected identity objects
 * @returns {Array}
 */
SailPoint.util.getIdList = function(identities) {
    var list = [];
    angular.forEach(identities, function(identity) {
        list.push(angular.isFunction(identity.getId) ? identity.getId() : identity.id);
    });
    return list;
};
