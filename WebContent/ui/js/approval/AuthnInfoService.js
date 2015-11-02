'use strict';

var SailPoint = SailPoint || {};

/**
 * The AuthnInfoService holds some data about how the logged in user
 * authenticated with IIQ.
 */
angular.module('sailpoint.approval').
    factory('authnInfoService', [function($http, $resource) {

        return {
            // Default the auth ID to what was registered in the page.
            originalAuthId: SailPoint.ORIGINAL_AUTH_ID,

            // Use what was registered in the page.
            nativeAuthId: SailPoint.ORIGINAL_NATIVE_ID,

            /**
             * Return the original authn ID, or null if not set.
             */
            getOriginalAuthId: function() {
                return this.originalAuthId;
            },

            /**
             * Set the original authn ID to the given value.  Normally this is
             * set on the server after successful authentication, but can need
             * to be done on the client if successful authentication occurs and
             * the page is not refreshed.
             */
            setOriginalAuthId: function(authId) {
                this.originalAuthId = authId;
            },

            /**
             * Return either the original auth ID (if available) or the native
             * auth ID otherwise.  This will return null if neither are
             * available.
             */
            getAuthId: function() {
                return this.originalAuthId || this.nativeAuthId;
            }
        };
    }]);
