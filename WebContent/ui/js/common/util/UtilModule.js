'use strict';

/**
 * Define the util module.  This module provides various utilities to our
 * angular app.  In some cases, the utilities will be plain javascript classes
 * so that they can also be used outside of angular.  In these cases, we will
 * simply provide the javascript class constructor as a service.
 */
angular.module('sailpoint.util', [
    'util/modal-dialog.html',
    'util/modal-alert.html'
]).


/**
 * Expose our SortOrder class to the angular app through DI.
 */
factory('SortOrder', function() {
    // Return the SortOrder constructor.
    return SailPoint.util.SortOrder;
});
