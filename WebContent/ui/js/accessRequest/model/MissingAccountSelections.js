'use strict';

/**
 * This contains an error response that has all missing account selections for
 * each requested item.
 */
angular.module('sailpoint.accessrequest').

factory('MissingAccountSelections', ['IdentityAccountSelection', function(IdentityAccountSelection) {

    ////////////////////////////////////////////////////////////////////////////
    //
    // CONSTRUCTOR
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Constructor.
     *
     * @param {Object} data  An object with the raw data - expected to map item IDs
     *    to an array of identity account selections.
     *
     * @throws If the data is null.
     */
    function MissingAccountSelections(data) {
        var me = this;

        if (!data) {
            throw 'Data is required.';
        }

        ////////////////////////////////////////////////////////////////////////////
        //
        // PROPERTIES
        //
        ////////////////////////////////////////////////////////////////////////////

        /**
         * @property {Object<String,Array<IdentityAccountSelection>} missingSelections  An
         *    object mapping item ID to an array of IdentityAccountSelections.
         */
        this.missingSelections = {};

        // Convert the raw data into objects.
        angular.forEach(data, function(acctSels, itemId) {
            me.missingSelections[itemId] = acctSels.map(function(selData) {
                return new IdentityAccountSelection(selData);
            });
        });
    }


    ////////////////////////////////////////////////////////////////////////////
    //
    // METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Return the account selections that are missing for the given item, or null
     * if none are missing.
     *
     * @param {String} itemId  The ID of the item.
     *
     * @return {Array<IdentityAccountSelection} the account selections that are missing
     *    for the given item, or null if none are missing.
     */
    MissingAccountSelections.prototype.getAccountSelectionsForItem = function(itemId) {
        return this.missingSelections[itemId];
    };

    /**
     * @return {Array<String>} An array containing the IDs of all items that are
     *    missing account selections.
     */
    MissingAccountSelections.prototype.getItemIds = function() {
        return Object.keys(this.missingSelections);
    };


    return MissingAccountSelections;
}]);
