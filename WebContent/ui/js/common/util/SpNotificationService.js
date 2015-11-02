/**
 * Utility service that any controller can use to set and retrieve notifications for the user.
 */
angular.module('sailpoint.util').
    factory('spNotificationService', function () {
        return {

            /**
             * Status types
             */
            ERROR: 'ERROR',
            WARNING: 'WARNING',
            INFO: 'INFO',
            SUCCESS: 'SUCCESS',

            /**
             *  The currently available notification.  Has two properties:
             *    - message {String} The message key to display to the user
             *    - status {String} (ERROR|WARNING|INFO|SUCCESS) The type of message we are displaying to the user
             */
            notification: undefined,

            /**
             * Add a message to the service
             * @param messageOrKey {String} The message or messageKey to display to the user
             * @param status {String} (ERROR|WARNING|INFO|SUCCESS) The type of message we are displaying to the user
             * @param args Array An array of arguments to the translation for strings with var args inside them.
             * @returns {Notification} The notification that was created
             * @throws If message or status is not specified or invalid.
             */
            setNotification: function (messageOrKey, status, args) {

                if (!messageOrKey) {
                    throw 'messageOrKey is required';
                }
                if (!status) {
                    throw 'status is required';
                }

                if (status !== this.ERROR && status !== this.WARNING &&
                    status !== this.INFO && status !== this.SUCCESS) {
                    throw 'Invalid status.  Status should be one of ERROR,WARNING,INFO, or SUCCESS';
                }

                this.notification = {
                    messageOrKey: messageOrKey,
                    status: status,
                    args: args
                };

                return this.notification;
            },

            /**
             * Clears the current notification
             */
            clear: function () {
                this.notification = null;
            },

            /**
             * Returns the current notification
             * @returns {Notification} The notification that was created
             */
            getNotification: function () {
                return this.notification;
            }
        };
    }
);