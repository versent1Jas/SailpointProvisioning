/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

/**
 * Project: identityiq
 * Author: michael.hide
 * Created: 2/18/14 1:12 PM
 */
angular.module('sailpoint.reset')
    .factory('resetDataService', [ '$location', function($location) {

        /**
         * Attribute names should match up with those passed back in LoginBean.craftUserResetQueryParams()
         * @type {{origin: string, accountId: string, action: string, smsStatus: object}}
         */
        var data = {
            /**
             * Should only be one of the enums defined in LoginBean.java
             * DESKTOP_RESET('desktopReset'),
             * DESKTOP_UI('desktopUIReset'),
             * MOBILE_UI('mobileUIReset');
             *
             * Default to the most common use case: desktopUIReset
             */
            origin: 'desktopUIReset',

            /**
             * The account id (username) entered by the user.  NOT the IIQ identity id.
             */
            accountId: '',

            /**
             * Should be one of the enums defined in LoginBean.java
             * PASSWORD_RESET('passwordReset'),
             * ACCOUNT_UNLOCK('accountUnlock');
             *
             * Default to the most common use case: passwordReset
             */
            action: 'passwordReset',

            /**
             * Object for passing status of sendSMS results from selection
             * page to the sms reset page.
             */
            smsStatus: {
                // Show the sms status text
                show: false,
                // Determines the CSS style of the message in the UI
                hasError: false,
                // Either a success or failure message.
                text: ''
            }
        };

        /**
         * Do this here to initialize data when the constructor is
         * called.  (We don't need nor want to read the query params
         * each time a controller uses this service.)
         *
         * NOTE that in order for $location.search() to work, the URL
         * needs to be in the format: <path>#/<routing>?a=b&c=d
         * with the query params coming AFTER the hash.
         * e.g. reset.jsf#/selection?origin=desktopReset&accountId=jsmith&action=passwordReset
         */
        (function read(obj) {
            var q = $location.search();
            for (var key in q) {
                if (q.hasOwnProperty(key) && obj.hasOwnProperty(key) && key !== 'smsStatus') {
                    // decodeURIComponent could throw an error, in that case leave the value alone.
                    // This should only happen with the accountId since it's the only parameter
                    // entered by the user.
                    try {
                        obj[key] = decodeURIComponent(q[key]) || obj[key];
                    }
                    catch (e) {
                        // Log it?
                    }
                }
            }
        })(data);

        return data;
    }]);
