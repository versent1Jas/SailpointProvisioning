/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

////////////////////////////////////////////////////////////////////////////////
//
// A javascript representation of the SailPoint.object.ProvisioningPlan.AccountRequest object
//
////////////////////////////////////////////////////////////////////////////////

Ext.define('SailPoint.AccountRequest', {

    id: null,
    application: null,
    instance: null,
    type: null,
    trackingId: null,
    nativeIdentity: null,
    operation: null,
    requestID: null,
    arguments: null,
    targetIntegration: null,
    args: null,
    attributeRequests: null,
    permissionRequests: null,

    constructor: function (arInfo) {
        this.args = {};
        this.attributeRequests = [];
        this.permissionRequests = [];
        this.arguments = {};

        if (arInfo) {
            this.identityId = arInfo.identityId;
            this.id = arInfo.id;
            this.application = arInfo.application;
            this.instance = arInfo.instance;
            this.trackingId = arInfo.trackingId;
            this.nativeIdentity = arInfo.nativeIdentity;
            this.operation = arInfo.operation;
            this.requestId = arInfo.requestId;
            this.type = arInfo.type;
            this.args = arInfo.args;

            if (arInfo.attributeRequests) {
                for (var attrIndex = 0; attrIndex < arInfo.attributeRequests.length; attrIndex++) {
                    this.attributeRequests.push(new SailPoint.AttributeRequest(arInfo.attributeRequests[attrIndex]));
                }
            }

            if (arInfo.permissionRequests) {
                for (var permIndex = 0; permIndex < arInfo.permissionRequests.length; permIndex++) {
                    this.permissionRequests.push(new SailPoint.PermissionRequest(arInfo.permissionRequests[permIndex]));
                }
            }
        }
    },

    addAttribute: function (attr) {
        if (!this.attributeRequests) {
            this.attributeRequests = [];
        }
        this.attributeRequests.push(attr);
    },

    addPermission: function (perm) {
        if (!this.permissionRequests) {
            this.permissionRequests = [];
        }
        this.permissionRequests.push(perm);
    },

    setArgument: function (name, value) {
        if (!this.args) {
            this.args = {};
        }
        this.args[name] = value;
    },

    /**
     * Return the operation from either the single attribute or permission request
     * in this account request, or from the account request if there are no
     * account or permission requests.
     */
    getAttributeOrAccountOperation: function () {
        var op = null;

        if (this.attributeRequests && (this.attributeRequests.length === 1)) {
            op = this.attributeRequests[0].operation;
        }
        else if (this.permissionRequests && (this.permissionRequests.length === 1)) {
            op = this.permissionRequests[0].operation;
        }
        else {
            // No attribute or permission requests, return the account request op.
            op = this.operation;
        }

        return op;
    },

    /**
     * Return whether the given AccountRequest matches this AccountRequest.  Note
     * that this does not compare operations.
     */
    matches: function (other) {
        if (!other) {
            return false;
        }

        // Check the app, instance, and nativeIdentity.
        if ((this.application !== other.application) ||
            (this.instance !== other.instance) ||
            (this.nativeIdentity !== other.nativeIdentity)) {
            return false;
        }

        if (!SailPoint.AccountRequest.compareRequests(this.attributeRequests, other.attributeRequests)) {
            return false;
        }

        if (!SailPoint.AccountRequest.compareRequests(this.permissionRequests, other.permissionRequests)) {
            return false;
        }

        return true;
    }
});

/**
 * Return true if the two lists of attribute/permission requests all match.
 */
SailPoint.AccountRequest.compareRequests = function (reqs1, reqs2) {
    if (reqs1.length !== reqs2.length) {
        return false;
    }
    else if (reqs1.length > 0) {
        // Currently we only generate AccountRequests with single attribute or
        // permission requests.  I'm being lazy but we may need to beef this up
        // later.
        if (reqs1.length !== 1) {
            throw 'Can currently only handle single requests: ' + reqs1;
        }
        var thisAttr = reqs1[0];
        var otherAttr = reqs2[0];
        if ((thisAttr.name !== otherAttr.name) ||
            (thisAttr.valueXmlAttribute !== otherAttr.valueXmlAttribute)) {
            return false;
        }
    }

    return true;
};

/**
 * Create an array of SailPoint.AccountRequest objects from the given array of
 * config objects that contain account request properties.
 *
 * @param  acctReqObjs  Objects that contain account request properties -
 *                      usually decoded JSON.
 *
 * @return Array of SailPoint.AccountRequest objects.
 *
 * @static
 */
SailPoint.AccountRequest.createList = function (acctReqObjs) {
    var requests = [];
    if (acctReqObjs) {
        for (var i = 0; i < acctReqObjs.length; i++) {
            requests.push(new SailPoint.AccountRequest(acctReqObjs[i]));
        }
    }
    return requests;
};

/**
 * Find the SailPoint.AcountRequest in the given array that matches the given
 * record, potentially using the matchingFunction to compare.  If a matching
 * function is not specified we compare the requestID to the record's ID.
 *
 * @param  record            The Ext.data.Record we are trying to find.
 * @param  accountRequests   An array of account requests in which to search for
 *                           a match for the given record.
 * @param  matchingFunction  Optional function that will be called to compare
 *                           every account request to the given record.  This
 *                           accepts the record and a SailPoint.AccountRequest
 *                           as parameters and is expected to return a boolean.
 *
 * @return The SailPoint.AccountRequest in the given accountRequests array that
 *         matches the given record.
 *
 * @static
 */
SailPoint.AccountRequest.findMatching = function (record, accountRequests, matchingFunction) {
    if (accountRequests) {
        for (var i = 0; i < accountRequests.length; i++) {
            var current = accountRequests[i];
            var matched = false;

            if (matchingFunction) {
                matched = matchingFunction(record, current);
            }
            else if (current.requestID === record.getId()) {
                matched = true;
            }

            if (matched) {
                return current;
            }
        }
    }
    return null;
};


////////////////////////////////////////////////////////////////////////////////
//
// A javascript representation of the SailPoint.object.ProvisioningPlan.AttributeRequest object
//
////////////////////////////////////////////////////////////////////////////////

Ext.define('SailPoint.GenericRequest', {
    name: null,
    value: null,
    valueXmlAttribute: null,
    operation: null,
    trackingId: null,
    args: null,
    assignmentId: null,

    constructor: function (arInfo) {
        this.args = {};
        if (arInfo) {
            this.name = arInfo.name;
            this.value = arInfo.value;
            this.valueXmlAttribute = arInfo.value;
            this.operation = arInfo.operation;
            this.trackingId = arInfo.trackingId;
            this.args = arInfo.args;
            this.assignmentId = arInfo.assignmentId;
        }
    }
});


Ext.define('SailPoint.AttributeRequest', {extend: 'SailPoint.GenericRequest'});
Ext.define('SailPoint.PermissionRequest', {extend: 'SailPoint.GenericRequest'});
