'use strict';

/**
 * The AccessRequestDataService holds state for the access request UI, including
 * the identity ids that are being requested for, the access items being added and
 * removed, any meta-data about the additions (account selection, etc...).
 */
angular.module('sailpoint.accessrequest').
    factory('accessRequestDataService',
            ['PageState', 'RequestedAccessItem', 'IdentityAccountSelection', 'accessRequestItemsService',
             'configService', 'SP_CONFIG_SERVICE', 'accessRequestDeepFilterService',

             /* jshint maxparams: 7 */
             function(PageState, RequestedAccessItem, IdentityAccountSelection, accessRequestItemsService,
                      configService, SP_CONFIG_SERVICE, accessRequestDeepFilterService) {

        ////////////////////////////////////////////////////////////////////////
        //
        // PRIVATE METHODS
        //
        ////////////////////////////////////////////////////////////////////////

        /**
         * Return the map key used for the given object.
         *
         * @return {String} The map key used for the given object.
         *
         * @throws If the given object is null or does not have an "id" property.
         */
        var getKey = function(object) {
            var getter, key;

            if (!object) {
                throw 'Expected a non-null object.';
            }

            // Prefer getUniqueId() over getId() if it is available.
            if (object.getUniqueId && angular.isFunction(object.getUniqueId)) {
                getter = object.getUniqueId;
            }
            else if (object.getId && angular.isFunction(object.getId)) {
                getter = object.getId;
            }

            if (!getter) {
                throw 'Object must have getId() or getUniqueId()';
            }

            key = getter.apply(object);

            if (!key) {
                throw 'Expected an object with an ID.';
            }

            return key;
        };

        /**
         * Convert the values of the given object into an array.
         *
         * @param {Object} object  A non-null object to collect values from.
         *
         * @return {Array} A non-null array of the values from the given object.
         */
        var objectValuesToArray = function(object) {
            var array = [];
            angular.forEach(object, function(value, key) {
                array.push(value);
            });
            return array;
        };

        /**
         * Convert the keys of the given object into an array.
         * @param {Object} object A non-null object to collect keys from.
         *
         * @return {Array} A non-null array of the keys from the given object.
         */
        var objectKeysToArray = function(object) {
            var array = [];
            angular.forEach(object, function(value, key) {
                array.push(key);
            });
            return array;
        };

        /**
         * Return whether the given objectMap (mapping ID to value) contains
         * the given object.
         *
         * @throws If the given object does not have an ID.
         */
        var containsObject = function(objectMap, object) {
            return !!(object && objectMap[getKey(object)]);
        };

        /**
         * Add the given object to the given objectMap if it has not already been
         * added.
         *
         * @param {Object} objectMap  The object map to which to add the object.
         * @param {Object} object  The object to add.
         *
         * @return True if the object was added, false otherwise.
         *
         * @throws If the given object does not have an ID.
         */
        var addObject = function(objectMap, object) {
            var added = false,
                key;

            if (object) {
                key = getKey(object);
                if (!containsObject(objectMap, object)) {
                    objectMap[key] = object;
                    added = true;
                }
            }

            return added;
        };

        /**
         * Remove the given object from the given objectMap.
         *
         * @param {Object} objectMap  The object map from which to remove the object.
         * @param {Object} object  The object to remove.
         *
         * @return True if the object was removed, false otherwise.
         *
         * @throws If the given object does not have an ID.
         */
        var removeObject = function(objectMap, object) {
            var removed = false,
                key;

            if (object) {
                key = getKey(object);
                if (objectMap[key]) {
                    delete objectMap[key];
                    removed = true;
                }
            }

            return removed;
        };

        /**
         * Removes account selections for identity from requestedItem
         *
         * @param {RequestedAccessItem} requestedItem The item to prune
         * @param {AccessRequestIdentity} identity The identity to remove selections for
         */
        function pruneAccountSelections(requestedItem, identity) {
            var selection, index;
            if(angular.isArray(requestedItem.accountSelections)) {
                /* Iterate over the list in reverse so we can drop items in place */
                for (index = requestedItem.accountSelections.length - 1; index >= 0; index--) {
                    selection = requestedItem.accountSelections[index];
                    if (selection.identityId === identity.getId()) {
                        requestedItem.accountSelections.splice(index, 1);
                    }
                }
            }
        }


        /**
         * If the given removedItem is a permitted role that has account selections that
         * are shared by other permitted roles in this request, copy the account selections
         * that are being used by the other permitted roles from the removedItem.
         *
         * @param {RequestedAccessItem} removedItem  The item that was just removed.
         */
        function copyAccountSelectionsFromRemovedItem(removedItem) {
            var permittingRole, otherPermits;

            // If this item is a permit that has account selections, try to copy the
            // selections to any peers that might need them.
            if (removedItem.permittedById && removedItem.accountSelections &&
                removedItem.accountSelections.length) {

                // First get the permitting role.
                permittingRole = accessRequestDataService.getRequestedItemById(removedItem.permittedById);
                if (!permittingRole) {
                    throw 'Expected to find the permitting role: ' + removedItem.permittedById;
                }

                // Then find any peers that are also permitted.  The removedItem has already
                // been removed, so won't show up in this list.
                otherPermits = accessRequestDataService.getRequestedPermittedItems(permittingRole);

                // Sort alphabetically so that we prefer putting the account selections
                // on items that will show up higher in the UI.
                otherPermits.sort(function(permit1, permit2) {
                    var permit1Name = permit1.item.getDisplayableNameOrName(),
                        permit2Name = permit2.item.getDisplayableNameOrName();
                    return permit1Name.localeCompare(permit2Name);
                });

                // Copy the account selections from the removed item to the first permit.
                // This will recursively call itself until all permits have been handled.
                if(otherPermits.length > 0) {
                    copyAccountSelectionsToPermit(otherPermits, 0, permittingRole, removedItem);
                }
            }
        }

        /**
         * Copy any account selections from the removed role that were being shared by
         * the permit at the given index in the allPermits list.  After the first permit
         * is handled, this recursively calls itself to walk through the entire allPermits
         * list.  The recursive calls (instead of calling in parallel) are required because
         * the first request may result in the account selections getting copied off of the
         * removed item, which may make it so that subsequent items don't need the same
         * account selections.
         *
         * @param {Array<RequestedAccessItem>} allPermits  All of the peer permits of the
         *    role that was removed.
         * @param {Number} currentPermitIdx  The index in the allPermits array of the permitted
         *    role that we are currently copying selections onto.
         * @param {RequestedAccessItem} permittingRole  The role that is permitting allPermits.
         * @param {RequestedAccessItem} removedRole  The role that was just removed, from
         *    which any shared account selections should be copied.
         */
        function copyAccountSelectionsToPermit(allPermits, currentPermitIdx, permittingRole, removedRole) {
            // Create a copy of the permits.
            var otherAddedRoles = allPermits.slice(0),
                currentPermit = allPermits[currentPermitIdx];

            // Add the permitting role.
            otherAddedRoles.push(permittingRole);

            // Remove the permitted role we are dealing with.
            otherAddedRoles.splice(currentPermitIdx, 1);

            // Call additional questions without the account selections from the
            // item being removed.  If this returns any account selections, we know
            // that some that are being removed are needed by this permit.
            accessRequestItemsService.getAdditionalQuestions(
                currentPermit.item,
                accessRequestDataService.getIdentityIds(),
                permittingRole.item,
                currentPermit.assignmentId,
                otherAddedRoles
            ).then(function(addtQuestions) {
                // If any account selections are returned, this means that
                // we needed some from the role that was removed.  Grab the
                // ones that we need.
                if (addtQuestions.accountSelections) {
                    addtQuestions.accountSelections.forEach(function(acctSel) {
                        acctSel.getProvisioningTargets().forEach(function(target) {
                            var removedSelection =
                                IdentityAccountSelection.find(removedRole.accountSelections,
                                                              acctSel, target),
                                permittedSelections;
                            if (removedSelection) {
                                permittedSelections = currentPermit.accountSelections;
                                if (!permittedSelections) {
                                    permittedSelections = [];
                                    currentPermit.accountSelections = permittedSelections;
                                }

                                IdentityAccountSelection.mergeAccountSelections(permittedSelections,
                                                                                [ removedSelection ]);
                            }
                        });
                    });
                }

                // Now recurse if there are any more permitted roles that need to be handled.
                if (currentPermitIdx < allPermits.length-1) {
                    currentPermitIdx++;
                    copyAccountSelectionsToPermit(allPermits, currentPermitIdx, permittingRole, removedRole);
                }
            });
        }


        ////////////////////////////////////////////////////////////////////////
        //
        // SERVICE DEFINITION
        //
        ////////////////////////////////////////////////////////////////////////

        var accessRequestDataService = {

            ////////////////////////////////////////////////////////////////////
            //
            // VARIABLES
            //
            ////////////////////////////////////////////////////////////////////

            /**
             * An object that holds the selected identities by mapping
             * AccessRequestIdentity.id to the AccessRequestIdentity.
             */
            identities: {},

            /**
             * An object that holds the requested access items that are being
             * requested for addition, mapped by AccessRequestItem.id to the
             * RequestedAccessItem.
             */
            requestedItems: {},

            /**
             * An object that holds the CurrentAccessItems(s) that are being
             * requested for removal, mapped by CurrentAccessItem.id to the
             * CurrentAccessItem.
             */
            removedCurrentAccessItems: {},

            /**
             * An object that holds the permitted roles indexed by the role id.
             */
            permitsByRoleId: {},


            ////////////////////////////////////////////////////////////////////
            //
            // PAGE STATE PROPERTIES
            //
            ////////////////////////////////////////////////////////////////////

            /**
             * @property {PageState} selectIdentityPageState  The PageState for
             * the "select users" tab.  Initialized to a default page state.
             */
            selectIdentitiesPageState: new PageState(),

            /**
             * @property {PageState} selectedIdentitiesPageState. The PageState for
             * the "select users" tab (for displaying the identities that have been selected.
             */
            selectedIdentitiesPageState: new PageState(),

            /**
             * @property {PageState} addAccessPageState  The PageState for
             * adding access.  Initialized to a default page state.
             */
            addAccessPageState: new PageState(),

            /**
             * @property {PageState} removeAccessPageState  The PageState for
             * removing access.  Initialized to a default page state.
             */
            removeAccessPageState: new PageState(),

            /**
             * Specifies whether the user has self-service access.
             *
             * @type {boolean}
             */
            selfService: false,

            /**
             * Specifies whether the user can request access for others.
             *
             * @type {boolean}
             */
            allowRequestForOthers: false,

            /**
             * Specifies whether the user can request access for self.
             *
             * @type {boolean}
             */
            allowRequestForSelf: false,


            /**
             * The priority of this access request (either "Low", "Normal", or "High")
             * @type {string}
             */
            priority: null,

            ////////////////////////////////////////////////////////////////////
            //
            // GENERAL FUNCTIONS
            //
            ////////////////////////////////////////////////////////////////////

            /**
             * Resets all the properties of the data service
             */
            clear: function() {
                this.identities = {};
                this.requestedItems = {};
                this.removedCurrentAccessItems = {};
                this.permitsByRoleId = {};
                this.priority = null;
                this.selectIdentitiesPageState = new PageState();
                this.addAccessPageState = new PageState();
                this.removeAccessPageState = new PageState();
            },

            ////////////////////////////////////////////////////////////////////
            //
            // IDENTITY STORAGE
            //
            ////////////////////////////////////////////////////////////////////

            /**
             * Looks at the list of identities to see if, when we add them, we will have more than
             * we are allowed to add.  Walks the list of identities being passed in and looks to see
             * if we are going to be adding them.  Then compares the count of identities to add plus
             * the number of existing identities and returns false if it is greater than the allowed max.
             *
             * @param identities {List<AccessRequestIdentity>} the list of identities we are adding
             * @returns {boolean} Whether we are able to fit all of these identities into the list or not.
             */
            validateCanAddIdentities: function(identities) {
                // The maximum configured number of identities that can be selected
                var maxSelectedIdentities =
                    configService.getConfigValue(SP_CONFIG_SERVICE.ACCESS_REQUEST_MAX_IDENTITY_SELECT);
                var identitiesToAdd = [];
                angular.forEach(identities, function(identity) {
                    if(!this.hasIdentity(identity)) {
                        identitiesToAdd.push(identity);
                    }
                }, this);

                if(identitiesToAdd.length + this.getIdentities().length > maxSelectedIdentities) {
                    return false;
                }
                return true;
            },

            /**
             * Return a read-only non-null array of identities.  Modifications
             * to this array are not reflected in this service.
             *
             * @return {Array<AccessRequestIdentity>} A non-null array of
             *   AccessRequestIdentities.
             */
            getIdentities: function() {
                return objectValuesToArray(this.identities);
            },

            /**
             * Return a read-only non-null array of identity ids as strings.  
             * Modifications to this array are not reflected in this service.
             *
             * @return {Array<String>} A non-null array of Strings.
             */
            getIdentityIds: function() {
                return objectKeysToArray(this.identities);
            },

            /**
             * @return {String} The ID of the identity being requested for if a
             *   single identity is being requested; otherwise null.
             */
            getRequesteeId: function() {
                var identities = this.getIdentities();
                return (identities.length === 1) ? identities[0].getId() : null;
            },

            /**
             * Return whether the given identity has been added.
             *
             * @throws If the given identity does not have an ID.
             */
            hasIdentity: function(identity) {
                return containsObject(this.identities, identity);
            },

            /**
             * This returns true if all of the specified identities are contained in the current list of
             * selected identities.
             * @param identities
             * @returns {boolean} If all of the specified identities are contained on the list
             */
            hasIdentities: function(identities) {
                if(!identities) {
                    return false;
                }

                var hasAll = true;
                angular.forEach(identities, function(identity) {
                    if(!this.hasIdentity(identity)) {
                        hasAll = false;
                        return;
                    }
                }, this);
                return hasAll;
            },

            /**
             * Add the given identity to this service if it has not already
             * been added.
             *
             * @param {AccessRequestIdentity} identity  The identity to add.
             *
             * @return True if the identity was added, false otherwise.
             *
             * @throws If the given identity does not have an ID.
             */
            addIdentity: function(identity) {
                return addObject(this.identities, identity);
            },


            /**
             * Takes an array of identities and adds them to the list of selected identities
             * @param {Array<AccessRequestIdentity>} identities The list of AccessRequestIdentity objects to add
             *
             * @return True if all of the identities were added, false otherwise.
             */
            addIdentities: function(identities) {
                if(!identities) {
                    return false;
                }
                var result = true;
                angular.forEach(identities, function(identity) {
                    if(!this.addIdentity(identity)) {
                        result = false;
                    }
                }, this);
                return result;
            },

            /**
             * Remove the given identity from this service.
             *
             * @param {AccessRequestIdentity} identity  The identity to remove.
             *
             * @return True if the identity was removed, false otherwise.
             *
             * @throws If the given identity does not have an ID.
             */
            removeIdentity: function(identity) {
                if(this.requestedItems) {
                    angular.forEach(this.requestedItems, function(item) {
                        pruneAccountSelections(item, identity);
                    });
                }
                return removeObject(this.identities, identity);
            },

            /**
             * Takes an array of identities and removes them from the list of selected identities.
             * @param {Array<AccessRequestIdentity>} identities The list of AccessRequestIdentity objects to remove
             *
             * @return True if all of the identities were removed, false otherwise.
             */
            removeIdentities: function(identities) {
                if(!identities) {
                    return false;
                }
                var result = true;
                angular.forEach(identities, function(identity) {
                    if(!this.removeIdentity(identity)) {
                        result = false;
                    }
                }, this);
                return result;
            },

            /**
             * Removes all of the identities in the list
             */
            removeAllIdentities: function() {
                if(this.requestedItems) {
                    angular.forEach(this.requestedItems, function(item) {
                        item.accountSelections = [];
                    });
                }
                this.identities = {};
            },

            /**
             * Reset the paging on the manage access tab when changing selected identity
             */
            resetManageAccessPaging: function() {
                this.addAccessPageState.pagingData.resetCurrentPage();
                this.removeAccessPageState.pagingData.resetCurrentPage();
            },


            ////////////////////////////////////////////////////////////////////
            //
            // REQUESTED ACCESS ITEM STORAGE
            //
            ////////////////////////////////////////////////////////////////////

            /**
             * Return a read-only non-null array of access request items that
             * are being requested to be added.  Modifications to this array
             * are not reflected in this service.
             *
             * @return {Array<RequestedAccessItem>} A non-null array of
             *   RequestedAccessItems.
             */
            getRequestedItems: function() {
                return objectValuesToArray(this.requestedItems);
            },

            /**
             * Returns requested item for passed AccessRequestItem
             * @param {AccessRequestItem} item The item to lookup an RequestedAccessItem for
             * @returns {RequestedAccessItem|undefined} Returns the RequestedAccessItem for the AccessRequestItem
             *   or undefined if there is no matching RequestedAccessItem
             */
            getRequestedItem: function(item) {
                return this.requestedItems[getKey(item)];
            },

            /**
             * Return the requested item with the given ID.
             *
             * @param {String} itemId  The ID of the requested item.
             *
             * @return {RequestedAccessItem} The requested item with given ID or
             *    undefined if there is not a requested item with the ID.
             */
            getRequestedItemById: function(itemId) {
                return this.requestedItems[itemId];
            },

            /**
             * Return whether the given access request item has been added.
             *
             * @param {AccessRequestItem} item  The item to look for.
             *
             * @throws If the given access request item does not have an ID.
             */
            hasRequestedItem: function(item) {
                // This will work for now since RequestedAccessItem.getUniqueId()
                // is the same as the AccessRequestItem ID (and that's how we
                // check for containsObject().
                return containsObject(this.requestedItems, item);
            },

            /**
             * Add the given access request item to this service if it has not
             * already been added.
             *
             * @param {AccessRequestItem} item  The item to add.
             * @param {AccessRequestItem} permittedBy  Optional item that permits
             *    the item that is being added.
             *
             * @return True if the item was added, false otherwise.
             *
             * @throws If the given item is null or does not have an ID.
             */
            addRequestedItem: function(item, permittedBy) {
                // Create a requested item and save the other info about the request.
                var requestedItem = new RequestedAccessItem(item);

                if (permittedBy) {
                    requestedItem.permittedById = permittedBy.getId();
                }

                return addObject(this.requestedItems, requestedItem);
            },

            /**
             * Remove the given requested access item from this service. If the 
             * requested access item permits any other requested access items,
             * those will be removed as well.
             *
             * @param {AccessRequestItem} item  The item to remove.
             *
             * @return True if the item was removed, false otherwise.
             *
             * @throws If the given item does not have an ID.
             */
            removeRequestedItem: function(item) {
                if (!item) {
                    // Do nothing for null item
                    return false;
                }

                // Remove the item.
                var requestedItem = this.requestedItems[getKey(item)],
                    removed = removeObject(this.requestedItems, item),
                    permittedItems;

                if (removed) {
                    // If this item has account selections, make sure that we don't get rid of
                    // any that are being shared by other related items.
                    copyAccountSelectionsFromRemovedItem(requestedItem);

                    // If this item permitted other items that were requested, remove them too.
                    permittedItems = this.getRequestedPermittedItems(requestedItem);
                    angular.forEach(permittedItems, function(permittedItem) {
                        removeObject(this.requestedItems, permittedItem);
                    }, this);
                }

                return removed;
            },

            /**
             * Remove all requested items.
             */
            clearRequestedItems: function() {
                this.requestedItems = {};
            },

            /**
             * Set the account selections for the requested item
             *
             * @param {AccessRequestItem} item  The item to update.
             * @param {IdentityAccountSelection} accountSelection  The desired selections.
             *
             * @throws If the given item does not have an ID. Or if there is no requested item for the access item.
             */
            setRequestedItemAccountSelections: function(item, accountSelection) {
                if (!angular.isObject(item)) {
                    // Throw if bad input
                    throw 'Expected valid object';
                }

                var requestedItem = this.requestedItems[getKey(item)];
                if (!angular.isObject(requestedItem)) {
                    // Throw if bad input
                    throw 'No RequestedAccessItem found for the AccessRequestItem passed in';
                }

                requestedItem.accountSelections = accountSelection;
            },

            /**
             * Return a read-only non-null array of requested access items that
             * are being requested to be added and are permitted by the given
             * item.  Modifications to this array are not reflected in this
             * service.
             *
             * @param {RequestedAccessItem} permittedBy  The item that permits
             *    the other items we are looking for.
             *
             * @return {Array<RequestedAccessItem>} A non-null array of
             *   RequestedAccessItems permitted by the given role.
             *
             * @throws If the given permittedBy item is null.
             */
            getRequestedPermittedItems: function(permittedBy) {
                var permits;

                if (!permittedBy) {
                    throw 'permittedBy item is required.';
                }

                permits = this.getRequestedItems().filter(function(requestedItem) {
                    return (requestedItem.permittedById === permittedBy.item.getId());
                });

                return permits;
            },

            /**
             * Return a read-only non-null array of requested access items that
             * are being requested to be added and are not permitted by another item.
             * Modifications to this array are not reflected in this service.
             * 
             * @return {Array<RequestedAccessItem>} A non-null array of
             *   top level RequestedAccessItems 
             */
            getTopLevelRequestedItems: function() {
                return this.getRequestedItems().filter(function(requestedItem) {
                    return !requestedItem.permittedById;
                });
            },

            /**
             * Returns all the RequestedAccessItems that are permitting or also permitted along with permittedBy item
             * @param {AccessRequestItem|String} permittedBy The item to get RequestedAccessItems for, or the ID 
             * @returns {Array<RequestedAccessItem>} RequestedAccessItem's permitted by permittedByItem and for
             *   permittedByItem
             */
            getOtherRequestedRoles: function(permittedBy) {
                var requestedItems = [],
                    requestedPermittedByItem;
                if(permittedBy) {
                    /* accessRequestDataService.getRequestedPermittedItems takes a RequestedAccessItem so look up
                     * the permittedBy requestedItem, to use to get the list of requestedPermittedItems and then
                     * add the permittedBy item's RequestedAccessItem 
                     */
                    requestedPermittedByItem = angular.isObject(permittedBy) ?
                        this.getRequestedItem(permittedBy) : this.requestedItems[permittedBy];
                    if (!requestedPermittedByItem) {
                        throw 'Unable to find requested item matching permittedBy value';
                    }
                    if(requestedPermittedByItem) {
                        requestedItems = this.getRequestedPermittedItems(requestedPermittedByItem);
                        requestedItems.push(requestedPermittedByItem);
                    }
                }
                return requestedItems;
            },

            /**
             * Sets the assignment id for the requested item
             * @param {AccessRequestItem} item Item being requested
             * @param {String} assignmentId Assignment ID
             */
            setAssignmentId: function(item, assignmentId) {
                if (!angular.isObject(item)) {
                    // Throw if bad input
                    throw 'Expected valid object';
                }

                var requestedItem = this.requestedItems[getKey(item)];
                if (!angular.isObject(requestedItem)) {
                    // Throw if bad input
                    throw 'No RequestedAccessItem found for the AccessRequestItem passed in';
                }

                requestedItem.assignmentId = assignmentId;
            },

            ////////////////////////////////////////////////////////////////////
            //
            // REMOVED ACCESS REQUEST ITEM STORAGE
            //
            ////////////////////////////////////////////////////////////////////

            /**
             * Return a read-only non-null array of access request items that
             * are being requested to be removed.  Modifications to this array
             * are not reflected in this service.
             *
             * @return {Array<AccessRequestItem>} A non-null array of AccessRequestItems.
             */
            getRemovedCurrentAccessItems: function() {
                return objectValuesToArray(this.removedCurrentAccessItems);
            },

            /**
             * Return whether the given current access item has been marked for
             * removal.
             *
             * @param {CurrentAccessItem} item  The item to look for.
             *
             * @throws If the given current access iitem does not have a
             *    unique ID.
             */
            hasRemovedCurrentAccessItem: function(item) {
                return containsObject(this.removedCurrentAccessItems, item);
            },

            /**
             * Mark the given current access item for removal already been marked.
             *
             * @param {CurrentAccessItem} item  The item to mark for removal.
             *
             * @return True if the item was marked, false otherwise.
             *
             * @throws If the given item does not have a unique ID.
             */
            addRemovedCurrentAccessItem: function(item) {
                return addObject(this.removedCurrentAccessItems, item);
            },

            /**
             * Unmark the given current access request item for removal.
             *
             * @param {CurrentAccessItem} item  The item to remove.
             *
             * @return True if the item was unmarked, false otherwise.
             *
             * @throws If the given item does not have a unique ID.
             */
            removeRemovedCurrentAccessItem: function(item) {
                return removeObject(this.removedCurrentAccessItems, item);
            },

            /**
             * Remove all current access items currently marked for removal.
             */
            removeAllRemovedCurrentAccessItems: function() {
                this.removedCurrentAccessItems = {};
            },


            ////////////////////////////////////////////////////////////////////
            //
            // PERMITTED ROLE STORAGE
            //
            ////////////////////////////////////////////////////////////////////

            /**
             * Retrieve the array of AccessRequestItems for the given role id.
             *
             * @param {String} roleId (required)  The id of the role to get permitted roles for.
             *
             * @return {Array<AccessRequestItem>} An array of AccessRequestItems or
             *    null if there are no roles that have been set for this item yet.
             *
             * @throws If roleId is not a valid value
             */
            getPermittedRoles: function(roleId) {
                if (!roleId) {
                    throw 'Expected valid parameter.';
                }

                return this.permitsByRoleId[roleId] || null;
            },

            /**
             * Set the list of permitted roles for the given role id.
             *
             * @param {String} roleId (required)  The id of the role to store permitted roles for.
             *
             * @param {Array<AccessRequestItem>} permittedRolesArray  The array of permitted roles associated with the
             *        given role. Empty array will reset the value.
             *
             * @throws If roleId is not a valid value
             */
            setPermittedRoles: function(roleId, permittedRolesArray) {
                if (!roleId) {
                    throw 'Expected valid parameter.';
                }

                if (angular.isArray(permittedRolesArray)) {
                    this.permitsByRoleId[roleId] = permittedRolesArray;
                } else {
                    throw 'Expected array for second parameter parameter.';
                }
            },


            ////////////////////////////////////////////////////////////////////
            //
            // TAB STATE
            //
            ////////////////////////////////////////////////////////////////////

            /**
             * Return whether the "Manage Access" tab is enabled.
             *
             * @return {Boolean} True if the "Manage Access" tab is enabled, false otherwise.
             */
            isManageAccessTabEnabled: function() {
                // Enabled after at least one identity is selected.
                return (accessRequestDeepFilterService.isDeepLinkManageAccess() ||
                    this.getIdentities().length > 0);
            },

            /**
             * Return whether the "Remove Access" tab is enabled.
             *
             * @return {Boolean} True if the "Remove Access" tab is enabled, false otherwise.
             */
            isRemoveAccessTabEnabled: function() {
                // Enabled after at least one identity is selected.
                return (this.getIdentities().length === 1);
            },

            /**
             * Return whether the "Review" tab is enabled.
             *
             * @return {Boolean} True if the "Review" tab is enabled, false otherwise.
             */
            isReviewTabEnabled: function() {
                // Enabled after at least one identity is selected and one item has been
                // selected or if this is a deep filter.
                return (accessRequestDeepFilterService.isDeepLinkReview() ||
                    ((this.getIdentities().length > 0) &&
                        ((this.getRequestedItems().length > 0) ||
                         (this.getRemovedCurrentAccessItems().length > 0))));
            },

            ////////////////////////////////////////////////////////////////////
            //
            // MISCELLANEOUS CONFIG STATE
            //
            ////////////////////////////////////////////////////////////////////

            /**
             * Return true if the user only has self-service access.
             *
             * @return {Boolean} true if the user only has self-service access, false otherwise.
             */
            isSelfService: function() {
                return !this.allowRequestForOthers && this.allowRequestForSelf;
            },

            /**
             * Return whether or not current user can request access for others.
             *
             * @returns {boolean}
             */
            isAllowRequestForOthers: function() {
                return this.allowRequestForOthers;
            },

            /**
             * Set allow request for others flag.
             *
             * @param allow
             */
            setAllowRequestForOthers: function(allow) {
                this.allowRequestForOthers = allow;
            },

            /**
             * Set allow request for self flag.
             *
             * @param allow
             */
            setAllowRequestForSelf: function(allow) {
                this.allowRequestForSelf = allow;
            },

            /**
             * Return whether or not current user can request access for self.
             *
             * @returns {boolean}
             */
            isAllowRequestForSelf: function() {
                return this.allowRequestForSelf;
            },

            /**
             * @return {boolean} True if the user has made any selections in the
             *     access request pages (users or access items for requests for
             *     others; access items for self-service).
             */
            isDirty: function() {
                var hasItems =
                    (this.getRequestedItems().length > 0) ||
                    (this.getRemovedCurrentAccessItems().length > 0);

                // Don't check identities for self-service since an identity is
                // automatically added.
                if (this.isSelfService()) {
                    return hasItems;
                }

                // For non-self-service, we're dirty if either an identity or items
                // have been selected.
                return (this.getIdentities().length > 0) || hasItems;
            }
        };

        return accessRequestDataService;
    }]);
