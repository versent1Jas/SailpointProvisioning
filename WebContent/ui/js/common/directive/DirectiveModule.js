'use strict';

/**
 * The directive module contains common directives that can be used across
 * different areas of the UI.  Directives that are specific to a page should
 * not go into this module, but should be included in the module in which they
 * are used.
 */
angular.module('sailpoint.directive', [
    'ui.bootstrap',
    'ngSanitize',
    'directive/sp-loading-mask.html',
    'directive/configurable-details.html'
]);
