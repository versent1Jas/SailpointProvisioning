/* (c) Copyright 2015 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

/**
 * The RoleEntitlementResultDTO model extends the ListResultDTO model to
 * provide convenience methods for RoleEntitlementItems
 */
angular.module('sailpoint.model').

factory('RoleEntitlementResultDTO', ['RoleEntitlementItem', function(RoleEntitlementItem) {

    function RoleEntitlementResultDTO(data) {
        // Call super constructor first, this will validate non-null data
        RoleEntitlementResultDTO._super.call(this, data);

        // Convert objects into RoleEntitlementItems
        this.objects = this.objects.map(function(item) {
            return new RoleEntitlementItem(item);
        });
    }

    // This needs to match up with RolesService.TOTAL_ENTITLEMENT_COUNT
    RoleEntitlementResultDTO.TOTAL_ENTITLEMENT_COUNT = 'totalEntitlementCount';

    //Extending ListResultDTO
    SailPoint.extend(RoleEntitlementResultDTO, SailPoint.model.ListResultDTO);

    // Add RoleEntitlementItem specific stuff
    angular.extend(RoleEntitlementResultDTO.prototype, {

        getTotalEntitlementCount: function() {
            return this.getMetaDataValue(RoleEntitlementResultDTO.TOTAL_ENTITLEMENT_COUNT, 0);
        }
    });

    return RoleEntitlementResultDTO;
}]);
