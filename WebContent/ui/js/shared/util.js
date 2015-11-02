/**
 * Utility functions used throughout common javascript files
 */

/* Bootstrap the SailPoint scope */
window['SailPoint'] = window['SailPoint'] || {};

/**
 * Creates a namespace.  Any intermediate spaces are created.
 * Ex. SailPoint.namespace('SailPoint.Some.Long.Namespace');
 * @param namespace dotted namespace to create
 */
SailPoint.namespace = function(namespace) {
    var spaces = namespace.split('.'),
        scope = window,
        space, i;
    for(i = 0; i < spaces.length; i++) {
        space = spaces[i];
        if(!scope[space]) {
            scope[space] = {};
        }
        scope = scope[space];
    }
};

/**
 * Shortcut for SailPoint.namespace
 * @param namespace namespace to create
 */
SailPoint.ns = function(namespace) {
    SailPoint.namespace(namespace);
};

/**
 * Extend the given parent class with the child class.  Note that the prototype
 * on the child class must be configured *after* this call is made because the
 * prototype is replaced with the parent's prototype.  This is required to allow
 * the child to get new functions that are later added to the parent's prototype.
 *
 * @param {Function} childCtor  The child class constructor.
 * @param {Function} parentCtor  The parent class constructor to extend from.
 */
SailPoint.extend = function(childCtor, parentCtor) {
    // Add a special _super property to the child so it can call the parent.
    childCtor._super = parentCtor;

    // Set the child prototype to that of the parent so we get all functions
    // and properties from the parent copied onto the child.  Also, set the
    // constructor to the child so instanceof will work.
    childCtor.prototype = Object.create(parentCtor.prototype, {
        constructor: {
            value: childCtor,
            enumerable: false
        }
    });
};

/**
 * Execute the given function when the document is ready.  This delegates to
 * ExtJS or jQuery if available.  If neither are available an error is thrown.
 *
 * @param {Function} fn  The function to execute.
 */
/* global Ext: false */
SailPoint.ready = function(fn) {
    if (window.Ext && Ext.onReady) {
        Ext.onReady(fn);
    }
    else if (window.$ && $.ready) {
        $(document).ready(fn);
    }
    else {
        throw 'ExtJS or jQuery are required.';
    }
};
