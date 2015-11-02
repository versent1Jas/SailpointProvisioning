/**
 * Filter to render default text when a value is falsey.  emptyText can be either
 * a regular text value or a message key
 *
 * Ex.
 * <p>{{ someValue | emptyText:'ui_default_message_key' }}</p>
 *
 */
angular.module('sailpoint.filter').
    filter('emptyText', ['spTranslateFilter', function(spTranslateFilter) {
        return function(text, emptyText) {
            if(!text) {
                return spTranslateFilter(emptyText);
            }
            return text;
        };
    }]);
