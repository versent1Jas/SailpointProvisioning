'use strict';

/**
 * ProvisioningTarget is a model that represents a single account selection.
 */
angular.module('sailpoint.accessrequest').
    factory('ProvisioningTarget', ['AccountInfo', function(AccountInfo) {

        /**
         * Constructor.
         *
         * @param {Object} data  The raw data for the provisioning target.
         *
         * @throws If data is null or not an object.
         */
        function ProvisioningTarget(data) {
            if (!angular.isObject(data)) {
                throw 'Data required in constructor.';
            }

            // Instance variables.
            this.applicationId = data.applicationId;
            this.applicationName = data.applicationName;
            this.roleName = data.roleName;
            this.allowCreate = data.allowCreate;
            this.createAccount = data.createAccount || false;
            if (angular.isArray(data.accountInfos)) {
                this.accountInfos = data.accountInfos.map(function(account) {
                    return new AccountInfo(account);
                });
            }
        }

        /**
         * @return {ProvisioningTarget} A deep copy of this target.
         */
        ProvisioningTarget.prototype.clone = function() {
            // Constructor expects data, so just pass our primitive properties.
            var cloned = new ProvisioningTarget({
                applicationId: this.getApplicationId(),
                applicationName: this.getApplicationName(),
                roleName: this.getRoleName(),
                allowCreate: this.isAllowCreate(),
                createAccount: this.isCreateAccount()
            });

            if (this.getSelectedAccount()) {
                cloned.selectedAccount = new AccountInfo(this.getSelectedAccount());
            }

            // Set the account infos to actual objects.
            if (this.getAccountInfos()) {
                cloned.accountInfos = this.getAccountInfos().map(function(account) {
                    return account.clone();
                });
            }

            return cloned;
        };

        /**
         * Return the id of the application the account selection is for.
         *
         * @return {String}  The application id.
         */
        ProvisioningTarget.prototype.getApplicationId = function() {
            return this.applicationId;
        };

        /**
         * The name of the application the account selection is for.
         *
         * @return {String}  The application name.
         */
        ProvisioningTarget.prototype.getApplicationName = function() {
            return this.applicationName;
        };

        /**
         * The name of the role if amex option is enabled so there can be an account for each role.
         *
         * @return {String}  The role name.
         */
        ProvisioningTarget.prototype.getRoleName = function() {
            return this.roleName;
        };

        /**
         * Return true if new accounts are allowed to be created and false otherwise.
         *
         * @return {boolean}  If accounts can be created.
         */
        ProvisioningTarget.prototype.isAllowCreate = function() {
            return this.allowCreate;
        };

        /**
         * Clear the selected account and create account settings for this target.
         */
        ProvisioningTarget.prototype.clear = function() {
            this.createAccount = false;
            this.selectedAccount = null;
        };

        /**
         * The AccountInfo for the selected account.
         *
         * @return {AccountInfo}  The selected account.
         */
        ProvisioningTarget.prototype.getSelectedAccount = function() {
            return this.selectedAccount;
        };

        /**
         * @return {Boolean} True if an account or the "create account" option
         *    is selected for the target, false otherwise.
         */
        ProvisioningTarget.prototype.hasSelection = function() {
            return !!(this.getSelectedAccount() || this.isCreateAccount());
        };

        /**
         * Selects the account that matches the given account.
         *
         * @param {AccountInfo}  selectedAccount The account selected by the user.
         */
        ProvisioningTarget.prototype.selectAccount = function(selectedAccount) {
            var found = this.accountInfos.filter(function(acctInfo) {
                return acctInfo.equals(selectedAccount);
            });

            if ((found.length > 1) || (found.length < 1)) {
                throw 'Expected to find one matching account: ' + found;
            }

            //if selecting account create account should be null
            this.createAccount = false;
            this.selectedAccount = found[0];
        };

        /**
         * Return true if the user wants to create an account false otherwise.
         *
         * @return {boolean}  If the user is creating an account.
         */
        ProvisioningTarget.prototype.isCreateAccount = function() {
            return this.createAccount;
        };

        /**
         * Sets the account creation boolean to the proper value.
         *
         * @param {boolean}  shouldCreate true if creating an account.
         */
        ProvisioningTarget.prototype.setCreateAccount = function(shouldCreate) {
            //if creating account selected account should be null
            if (shouldCreate) {
                this.selectedAccount = null;
            }
            this.createAccount = shouldCreate;
        };

        /**
         * Return the info for accounts to select from.
         *
         * @return {Array<AccountInfo>}  The information for the account selections.
         */
        ProvisioningTarget.prototype.getAccountInfos = function() {
            return this.accountInfos;
        };

        return ProvisioningTarget;
    }]);
