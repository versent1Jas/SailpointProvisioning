/**
 * Filter to render sunrise or sunset dates from an object into a localized string.
 * See ColumnConfig.prototype.renderValue for target usage.
 *
 * Ex.
 * <p>{{ anything | sunriseSunsetFilter : objectWithDates }}</p>
 * 
 * sunriseSunsetFilter(anything, objectWithDates);
 *
 */
angular.module('sailpoint.approval')
.filter('sunriseSunset', ['spTranslateFilter', '$filter', function(spTranslateFilter, $filter) {
    return function(value, object) {
        var dateText = '',
            sunrise = object.sunriseDate || object.sunrise,
            sunset = object.sunsetDate || object.sunset;
        if (sunrise && !sunset) {
            dateText = spTranslateFilter('ui_date_start', $filter('date')(sunrise, 'shortDate'));
        }
        if (sunset && !sunrise) {
            dateText = spTranslateFilter('ui_date_end', $filter('date')(sunset, 'shortDate'));
        }
        if (sunrise && sunset) {
            dateText = spTranslateFilter('ui_date_range', $filter('date')(sunrise, 'shortDate'),
                    $filter('date')(sunset, 'shortDate'));
        }
        return dateText;
    };
}]);
