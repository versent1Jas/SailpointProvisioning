'use strict';

/**
 * Identity Details Dialog Controller.
 */
angular.module('sailpoint.accessrequest').
    controller('IdentityDetailDialogCtrl',
    ['accessRequestIdentityService', 'configService', 'identityId', '$q',
        function(accessRequestIdentityService, configService, identityId, $q) {

            var configPromise, identityDetailsPromise,
                me = this,
                /**
                 * Helper function to set identity data
                 */
                setIdentityDetails = function(identityData) {
                    me.identityDetails = identityData;
                };

            /**
             * Identity model that contains the data to show in the dialog
             *
             * @type {null}
             */
            this.identityDetails = undefined;

            // Make sure the meta data is loaded first
            configPromise = configService.getIdentityDetailsConfig();
            identityDetailsPromise = accessRequestIdentityService.getIdentityDetails(identityId);
            
            $q.all([configPromise, identityDetailsPromise]).then(function(multiResult) {
                var configResponse = multiResult[0];
                var identityDetailsResponse = multiResult[1];

                setIdentityDetails(SailPoint.util.applyIdentityAttributeMetaData(identityDetailsResponse.data,
                    configResponse.data));
            });

        }]);
        
