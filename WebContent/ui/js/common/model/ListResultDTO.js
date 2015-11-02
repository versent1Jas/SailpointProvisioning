/* (c) Copyright 2015 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

/**
 * A ListResultDTO is a model object that represents a ListResult object returned
 * from a REST call.
 */
SailPoint.ns('SailPoint.model');

////////////////////////////////////////////////////////////////////////////
//
// CONSTRUCTOR
//
////////////////////////////////////////////////////////////////////////////

/**
 * Constructor.
 *
 * @param {Object} data  An object with the data for the ListResultDTO.
 * @throws If data is null.
 */
SailPoint.model.ListResultDTO = function(data) {
    if (!angular.isObject(data)) {
        throw 'Data required in constructor.';
    }

    this.attributes = data.attributes;
    this.complete = data.complete;
    this.count = data.count;
    this.errors = data.errors;
    this.failure = data.failure;
    this.metaData = data.metaData;
    this.objects = data.objects;
    this.requestID = data.requestID;
    this.retry = data.retry;
    this.retryWait = data.retryWait;
    this.status = data.status;
    this.success = data.success;
    this.warnings = data.warnings;
};

// Extend the prototype with properties and methods
angular.extend(SailPoint.model.ListResultDTO.prototype, {

    ////////////////////////////////////////////////////////////////////////////
    //
    // PROPERTIES
    //
    ////////////////////////////////////////////////////////////////////////////

    /** {object} */
    attributes: undefined,

    /** {boolean} */
    complete: false,

    /** {number} count of elements in objects array */
    count: 0,

    /** {array} */
    errors: undefined,

    /** {boolean} */
    failure: false,

    /** {object} */
    metaData: undefined,

    /** {array} objects */
    objects: undefined,

    /** {string} */
    requestID: undefined,

    /** {boolean} */
    retry: false,

    /** {number} */
    retryWait: 0,

    /** {string} */
    status: undefined,

    /** {boolean} */
    success: false,

    /** {array} */
    warnings: undefined,

    ////////////////////////////////////////////////////////////////////////////
    //
    // INSTANCE METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    getAttributes: function() {
        return this.attributes;
    },

    isComplete: function() {
        return this.complete;
    },

    getCount: function() {
        return this.count;
    },

    getErrors: function() {
        return this.errors;
    },

    getMetaData: function() {
        return this.metaData;
    },

    getObjects: function() {
        return this.objects;
    },

    getRequestID: function() {
        return this.requestID;
    },

    isRetry: function() {
        return this.retry;
    },

    getRetryWait: function() {
        return this.retryWait;
    },

    getStatus: function() {
        return this.status;
    },

    isSuccess: function() {
        return this.success;
    },

    getWarnings: function() {
        return this.warnings;
    },

    /**
     * Helper function to get metaData values
     *
     * @param name Key of the value to retrieve
     * @param defaultValue if metaData is null or the key doesn't exist, return this value
     * @returns {*} Requested value
     */
    getMetaDataValue:  function(name, defaultValue) {
        return (this.metaData && this.metaData[name]) ? this.metaData[name] : defaultValue;
    }

});

/**
 * Expose as a factory model for angular injection
 */
angular.module('sailpoint.model').
    factory('ListResultDTO', function() {
        return SailPoint.model.ListResultDTO;
    });

