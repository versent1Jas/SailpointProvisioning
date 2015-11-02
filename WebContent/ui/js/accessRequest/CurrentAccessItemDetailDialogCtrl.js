'use strict';

/**
 * Current Access Item Details Dialog Controller.
 * For use with the accessRequest/templates/current-access-item-detail-dialog.html
 */
angular.module('sailpoint.accessrequest').
    controller('CurrentAccessItemDetailDialogCtrl',
        ['item', 'accessRequestItemsService', function (item, accessRequestItemsService) {
            var me = this;

            /* Need to copy the accountName to account for use with the target account directive */
            angular.forEach(item.roleTargets, function(target) {
                target.account = target.accountName;
            });
            /**
             * Returns whether the type of item we are looking at is a role or not based on the accessType of the item
             * @returns {boolean}
             */
            this.isRole = function () {
                return item.isRole();
            };


            /**
             * Returns the actual access request item we are working with
             * @returns {AccessRequestItem}
             */
            this.getItem = function () {
                return item;
            };

            /**
             * Count of the total number of entitlements on the role (direct and inherited, simple and complex).
             *
             * @type {number}
             */
            this.totalRoleEntitlementsCount = 0;

            /**
             * Array of RoleEntitlementItem objects
             *
             * @type {array}
             */
            this.roleEntitlements = undefined;

            /**
             * Loads the specified role entitlements via http get request on accessRequestItemsService
             *
             * @param roleId
             */
            this.loadRoleEntitlements = function() {
                if(!me.roleEntitlements && me.getItem()) {
                    accessRequestItemsService.getRoleEntitlements(me.getItem().getId()).then(function(response) {
                        // response should be a RoleEntitlementResultDTO object
                        if (response) {
                            me.totalRoleEntitlementsCount = response.getTotalEntitlementCount();
                            me.roleEntitlements = response.getObjects();
                        }
                    });
                }
            };
        }]);
