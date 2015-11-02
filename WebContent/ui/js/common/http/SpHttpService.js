angular.module('sailpoint.http').

/**
 * Service for any REST helper methods or functionality to share
 */
factory('spHttpService', ['spDateService', function(spDateService) {
    return {
        /**
         * Encode a component of a URL for all special characters.
         * REST service should use decodeRestUriComponent on any value encoded by this. 
         * 
         * @param {String} component The string component to encode. Required.
         * @returns {String} Encoded value of the component
         */
        encodeComponent : function(component) {
            if (!component) {
                throw 'Component is required!';
            }
            
            // Encode twice so that forward slashes can get through
            return encodeURIComponent(encodeURIComponent(component));
        },

        /**
         * Given a map of query parameter name to value, convert the values to
         * things that the REST service expectes (eg - convert a Date to the
         * long utime).
         *
         * @param {Object} params  The (possibly null) query parameters to convert.
         * @param {String} objectValueProperty The (possibly undefined) name of property to use as  value for
         *                 Object values in the params. For example, "id" or "name".  If null,
         *                 Object will not be converted. If undefined, default of "name" will be used.
         *
         * @return {Object} A converted copy of the query parameters.
         */
        convertQueryParams: function(params, objectValueProperty) {
            var newParams;

            /**
             * Return the beginning of the given date according to local time.
             */
            function getStart(date) {
                return spDateService.setDateComponents(date, 0, 0, 0, 0);
            }

            /**
             * Return the end of the given date according to local time.
             */
            function getEnd(date) {
                return spDateService.setDateComponents(date, 23, 59, 59, 999);
            }

            if (params) {
                newParams = {};
                /* Differentiate between null and undefined. Null will mean no conversion.
                   Undefined we will default to 'name' */
                if (!angular.isDefined(objectValueProperty)) {
                    objectValueProperty = 'name';
                }
                angular.forEach(params, function(value, key) {
                    // Convert a date to the long utime.
                    if (angular.isDate(value)) {
                        value = getStart(value).getTime() + '|' + getEnd(value).getTime();
                    } else if (angular.isDefined(objectValueProperty) &&
                        angular.isObject(value) &&
                        angular.isDefined(value[objectValueProperty])) {
                        value = value[objectValueProperty];
                    }
                    newParams[key] = value;
                });
            }

            return newParams;
        }
    };
}]);