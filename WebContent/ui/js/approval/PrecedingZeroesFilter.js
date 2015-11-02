/**
 * Filter to remove leading zeroes from a string.  For example the approval item id.
 */
angular.module('sailpoint.approval').
    filter('precedingZeroes', function() {
        var leadingZeroesRegex = /^0*/;
        return function(value) {
            if(angular.isDefined(value)) {
                return value.replace(leadingZeroesRegex, '');
            }
            return value;
        };
    });