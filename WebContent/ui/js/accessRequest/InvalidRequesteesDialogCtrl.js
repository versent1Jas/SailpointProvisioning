/**
 * Controller for Invalid Requestees Dialog.
 * Both invalidRequestees and renderLimit are resovled into the controller on modal.open().
 * - invalidRequestees is an array of Strings containing the displayable name of
 *   the invalid identities.
 * - renderLimit is the maximum number of identities to render into the dialog
 * - messageKey contains the message key to be used
 */
angular.module('sailpoint.accessrequest').
    controller('InvalidRequesteesDialogCtrl', function (invalidRequestees, renderLimit, messageKey) {
        return {
            /**
             * Returns the number of identities not rendered in the dialog
             * @returns {number} Number of identities not renderered in the dialog
             */
            requesteeOverflowCount: function() {
                return Math.max(0, invalidRequestees.length - renderLimit);
            },
            /**
             * Returns invalid identity names up to limit
             * @returns {Array<String>} Limited list of invalid requestees
             */
            renderedInvalidRequestees: function() {
                return invalidRequestees.slice(0, renderLimit);
            },
            /**
             * Return the message key to be used
             */
            getMessageKey: function() {
                return messageKey;
            }
        };
    }
);
