'use strict';

/**
 * The ConfigService handles retrieving and caching config entries using the config REST services.
 */
angular.module('sailpoint.config').
    // Define config contants.
    constant('SP_CONFIG_SERVICE', {
        ACCESS_REQUEST_MAX_IDENTITY_SELECT : 'ACCESS_REQUEST_MAX_IDENTITY_SELECT',
        ALLOW_REQUEST_FOR_OTHERS : 'ALLOW_REQUEST_FOR_OTHERS',
        ALLOW_REQUEST_FOR_SELF: 'ALLOW_REQUEST_FOR_SELF',
        ACCESS_REQUEST_ALLOW_PRIORITY_EDITING: 'ACCESS_REQUEST_ALLOW_PRIORITY_EDITING'
    }).
    factory('configService',
        ['$http', 'SP_CONTEXT_PATH', '$q', 'ColumnConfig',
        function($http, SP_CONTEXT_PATH, $q, ColumnConfig) {

            var configService = {},
                IDENTITY_DETAILS_CONFIG = 'IDENTITY_DETAILS',
                CONFIG_URL = '/ui/rest/configuration/uiconfig';

            /**
             * Config entry cache
             */
            configService.configEntries = {};

            /**
             * Helper function to transform the $http response from JSON object
             * to ColumnConfig objects.
             *
             * @param data
             * @returns {*}
             */
            function transformResponseToColumnConfig(data) {
                angular.forEach(data, function(val, key) {
                    var configs = [];
                    if(angular.isArray(val)) {
                        // val is the array of column configs
                        angular.forEach(val, function(cfg) {
                            configs.push(new ColumnConfig(cfg));
                        });
                        configService.configEntries[key] = configs;
                    }
                    else {
                        configService.configEntries[key] = new ColumnConfig(val);
                    }
                });
                return configService.configEntries;
            }

            /**
             * Pulls a config value from the SailPoint.configData object based on the provide key
             *
             * If the value is not found, it returns null.
             * @param key The name of the value to look up in the SailPoint.configData map
             */
            configService.getConfigValue = function(key) {
                if (SailPoint && SailPoint.configData && SailPoint.configData.hasOwnProperty(key)) {
                    return SailPoint.configData[key];
                }
                return null;
            };

            ////////////////////////////////////////////////////////////////////////
            //
            // Config List Functions
            //
            ////////////////////////////////////////////////////////////////////////

            /**
             * Get identity details config
             *
             * @returns {promise} A promise that will resolve to an array of identity detail config entries
             */
            configService.getIdentityDetailsConfig = function() {

                if (configService.configEntries[IDENTITY_DETAILS_CONFIG]) {
                    var deferred = $q.defer();
                    deferred.resolve({ data: configService.configEntries[IDENTITY_DETAILS_CONFIG] });
                    return deferred.promise;
                }

                return $http.get(SP_CONTEXT_PATH + CONFIG_URL + '/identity')
                    .success(function(data) {
                        configService.configEntries[IDENTITY_DETAILS_CONFIG] = data;
                    });
            };

            /**
             * Return a promise that will resolve to a config entries.
             *
             * @param {Array} An array of the request types to return.
             * @return {HttpPromise} A promise that will resolve to a object of config entries
             */
            configService.getColumnConfigEntries = function(keys) {

                var i, k, deferred,
                    partialEntries = false,
                    entries = {};

                // Ensure we have an array
                if(keys && !angular.isArray(keys)) {
                    keys = [keys];
                }

                // We'll return from the cache only if all the items can be found
                if (keys) {
                    // iterate through and check keys
                    for (i = 0; i < keys.length; i++) {
                        k = keys[i];
                        if (configService.configEntries[k]) {
                            entries[k] = configService.configEntries[k];
                        }
                        else {
                            // no partial cache results
                            partialEntries = true;
                            break;
                        }
                    }

                    if (!partialEntries) {
                        deferred = $q.defer();
                        deferred.resolve({ data: entries });
                        return deferred.promise;
                    }
                }

                // Append the transformResponseToColumnConfig function to the array of
                // default transformResponse functions so we can return ColumnConfig objects in the promise
                return $http.get(SP_CONTEXT_PATH + CONFIG_URL + '/entries', {
                    params: {
                        key: keys
                    },
                    transformResponse: $http.defaults.transformResponse.concat([transformResponseToColumnConfig])
                });
            };

            return configService;
        }]);
