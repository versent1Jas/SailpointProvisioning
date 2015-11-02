'use strict';

/**
 * The AccessRequestSelectedIdentitiesCtrl handles passing the selected identities from the service to the view.
 */
angular.module('sailpoint.accessrequest').
    controller('AccessRequestSelectedIdentitiesCtrl', ['accessRequestDataService', '$state',
    function(accessRequestDataService, $state) {

        /**
         * Return a non-null array of the AccessRequestIdentity objects that are
         * being requested for.
         *
         * @return {Array<AccessRequestIdentity>} A non-null array of the
         *    AccessRequestIdentity objects that are being requested for.
         */
        this.getIdentities = function() {
            return accessRequestDataService.getIdentities();
        };

        /**
         * Click handler for the view selected identities button
         */
        this.showSelectedIdentities = function() {
            $state.go('accessRequest.selectUser', { selectedView: true });
        };
    }]);
