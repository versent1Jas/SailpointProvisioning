'use strict';

/**
 * IdentityAccountSelection is a model that represents an account selection for an identity on one or more applications.
 */
angular.module('sailpoint.accessrequest').
    factory('IdentityAccountSelection', ['ProvisioningTarget', function(ProvisioningTarget) {

        /**
         * Constructor.
         *
         * @param {Object} data  The raw data for the identity account selection.
         *
         * @throws If data is null or not an object.
         */
        function IdentityAccountSelection(data) {
            if (!angular.isObject(data)) {
                throw 'Data required in constructor.';
            }

            // Instance variables.
            this.identityId = data.identityId;
            this.identityName = data.identityName;
            if (angular.isArray(data.provisioningTargets)) {
                this.provisioningTargets = data.provisioningTargets.map(function(target) {
                    return new ProvisioningTarget(target);
                });
            }
        }

        /**
         * @return {IdentityAccountSelect} A deep copy of this account selection.
         */
        IdentityAccountSelection.prototype.clone = function() {
            // Constructor expects data, so just pass our primitive properties.
            var cloned = new IdentityAccountSelection({
                identityId: this.getIdentityId(),
                identityName: this.getIdentityName()
            });

            // Set the provisioning targets to actual objects.
            if (this.getProvisioningTargets()) {
                cloned.provisioningTargets = this.getProvisioningTargets().map(function(target) {
                    return target.clone();
                });
            }

            return cloned;
        };

        /**
         * Return the id of the identity the account selection is for.
         *
         * @return {String}  The identity id.
         */
        IdentityAccountSelection.prototype.getIdentityId = function() {
            return this.identityId;
        };
    
        /**
         * The name of the identity the account selection is for
         *
         * @return {String}  The identity name.
         */
        IdentityAccountSelection.prototype.getIdentityName = function() {
            return this.identityName;
        };
    
        /**
         * Return the targets to select accounts for.
         *
         * @return {Array<ProvisioningTarget>}  The provisioning targets for the account selection.
         */
        IdentityAccountSelection.prototype.getProvisioningTargets = function() {
            return this.provisioningTargets;
        };

        /**
         * Add the given ProvisioningTarget to this IdentityAccountSelection.
         *
         * @param {ProvisioningTarget} target  The target to add.
         */
        IdentityAccountSelection.prototype.addProvisioningTarget = function(target) {
            if (!this.provisioningTargets) {
                this.provisioningTargets = [];
            }
            this.provisioningTargets.push(target);
        };

        /**
         * @return {boolean} True if all provisioning targets have selections.
         */
        IdentityAccountSelection.prototype.allTargetsHaveSelections = function() {
            if (this.provisioningTargets && this.provisioningTargets.length) {
                // Return false if any target does not have a selection.
                return this.provisioningTargets.reduce(function(previous, target) {
                    return previous && target.hasSelection();
                }, true);
            }

            // No targets - just return true.
            return true;
        };


        ////////////////////////////////////////////////////////////////////////
        //
        // STATIC METHODS
        //
        ////////////////////////////////////////////////////////////////////////

        /**
         * Merge the new account selections into the existing selections.  Note that this
         * modifies the existingSelections array by adding new elements and adding provisioning
         * targets to elements already in the array.
         *
         * @param {Array<IdentityAccountSelection>} existingSelections  The existing selections.
         * @param {Array<IdentityAccountSelection>} newSelections  The new selections to merge in.
         *
         * @return {Array<IdentityAccountSelection>} The existing selections with the new selections
         *    merged in.
         */
        IdentityAccountSelection.mergeAccountSelections = function(existingSelections, newSelections) {
            if (newSelections) {
                newSelections.forEach(function(newSelection) {
                    // Look to see if there is an existing selection for this identity.
                    var foundSelection = findIdentityAccountSelection(existingSelections, newSelection);

                    // If we didn't find an existing selection, just add this one.
                    if (!foundSelection) {
                        existingSelections.push(newSelection);
                    }
                    else {
                        // We found an existing selection, so merge the provisioning targets.
                        newSelection.getProvisioningTargets().forEach(function(newTarget) {
                            var foundTargets = foundSelection.getProvisioningTargets(),
                                foundTarget = findProvisioningTarget(foundTargets, newTarget);

                            // Didn't find it - add the target to the account selection.
                            if (!foundTarget) {
                                foundSelection.addProvisioningTarget(newTarget);
                            }
                        });
                    }
                });
            }

            return existingSelections;
        };

        /**
         * Search the given array of IdentityAccountSelections, and return a clone of
         * an IdentityAccountSelection that with a single target if we find one that
         * matches the requested account selection and target.
         *
         * @param {Array<IdentityAccountSelection>} acctSels  The array of selections to search.
         * @param {IdentityAccountSelection} acctSel  The account selection to search for.
         * @param {ProvisioningTarget} target  The target to search for.
         *
         * @return {IdentityAccountSelection} A cloned IdentityAccountSelection with a
         *    single target that matches the given parameters.
         *
         * @throws If multiple account selections or targets match.
         */
        IdentityAccountSelection.find = function(acctSels, acctSel, target) {
            var foundSel, foundTarget;

            if (acctSels) {
                foundSel = findIdentityAccountSelection(acctSels, acctSel);
                if (foundSel) {
                    foundTarget = findProvisioningTarget(foundSel.getProvisioningTargets(), target);

                    // If we find one, clone the account selection and set the targets to a
                    // list that just contains a clone of the found target.
                    if (foundTarget) {
                        foundSel = foundSel.clone();
                        foundSel.provisioningTargets = [ foundTarget.clone() ];
                        return foundSel;
                    }
                }
            }

            return null;
        };

        /**
         * Find the given IdentityAccountSelection in the given array.
         *
         * @param {Array<IdentityAccountSelection>} acctSels  The array to search.
         * @param {IdentityAccountSelection} toFind  The account selection to find.
         *
         * @return {IdentityAccountSelection} The matching selection, or null.
         *
         * @throws If more than one matching selection is found.
         */
        function findIdentityAccountSelection(acctSels, toFind) {
            return findOne(acctSels, function(acctSel) {
                return acctSel.getIdentityId() === toFind.getIdentityId();
            });
        }

        /**
         * Find the given ProvisioningTarget in the given array.
         *
         * @param {Array<ProvisioningTarget>} targets  The array to search.
         * @param {ProvisioningTarget} toFind  The target to find.
         *
         * @return {ProvisioningTarget} The matching target, or null.
         *
         * @throws If more than one matching target is found.
         */
        function findProvisioningTarget(targets, toFind) {
            return findOne(targets, function(target) {
                // We match if the apps are the same and the role is null on both or equal.
                return (target.getApplicationId() === toFind.getApplicationId()) &&
                        (target.getRoleName() === toFind.getRoleName());
            });
        }

        /**
         * Find one item in the given array that matches using the given finder function.
         *
         * @param {Array} array  An array of objects to search.
         * @param {Function} finderFun  A function that accepts the current element and
         *    returns true if the element matches.
         *
         * @return {*} The single item that matches the finder function, or null if none
         *    are found.
         *
         * @throws If more than one item matches using the finder function.
         */
        function findOne(array, finderFunc) {
            var found = array.filter(finderFunc);
            if (found.length > 1) {
                throw 'Expected to find a single match.';
            }
            return (found.length === 1) ? found[0] : null;
        }


        return IdentityAccountSelection;
    }]);
