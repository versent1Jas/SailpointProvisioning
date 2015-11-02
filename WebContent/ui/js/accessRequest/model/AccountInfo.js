'use strict';

/**
 * AccountInfo is a model object that represents the information for an account.
 */
angular.module('sailpoint.accessrequest').

factory('AccountInfo', function() {

    /**
     * Constructor.
     *
     * @param {Object} data  An object with the data for this account.
     *
     * @throws If data is not an object.
     */
    function AccountInfo(data) {
        // Throw if the data is null or not a javascript object.
        if (!angular.isObject(data)) {
            throw 'Data required in constructor.';
        }

        // Instance variables.
        this.instance = data.instance;
        this.nativeIdentity = data.nativeIdentity;
        this.displayName = data.displayName;
        this.existingAssignment = data.existingAssignment;
    }

    /**
     * @return {AccountInfo} A deep copy of this account info.
     */
    AccountInfo.prototype.clone = function() {
        return new AccountInfo({
            instance: this.getInstance(),
            nativeIdentity: this.getNativeIdentity(),
            displayName: this.getDisplayName(),
            existingAssignment: this.getExistingAssignment()
        });
    };

    /**
     * Return whether the given AccountInfo matches this object.
     *
     * @param {AccountInfo} account  The info to check for equality.
     *
     * @return {Boolean} True if the given AccountInfo matches this object.
     */
    AccountInfo.prototype.equals = function(account) {
        return (null !== account) &&
            (this.instance === account.instance) &&
            (this.nativeIdentity === account.nativeIdentity) &&
            (this.displayName === account.displayName) &&
            (this.existingAssignment === account.existingAssignment);
    };

    /**
     * Return the instance.
     *
     * @return {String}  The account instance.
     */
    AccountInfo.prototype.getInstance = function() {
        return this.instance;
    };

    /**
     * Return the native identity.
     *
     * @return {String}  The native identity for the account.
     */
    AccountInfo.prototype.getNativeIdentity = function() {
        return this.nativeIdentity;
    };

    /**
     * Return the displayable name of the account.
     *
     * @return {String}  The identity's displayable name.
     */
    AccountInfo.prototype.getDisplayName = function() {
        return this.displayName;
    };

    /**
     * Return existing assignment.
     *
     * @return {String}  The the existing assignment role name or undefined.
     */
    AccountInfo.prototype.getExistingAssignment = function() {
        return this.existingAssignment;
    };

    return AccountInfo;
});
