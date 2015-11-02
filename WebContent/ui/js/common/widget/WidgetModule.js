'use strict';

/**
 * The widget module contains common components that can be used across
 * different areas of the UI.  Directives that are specific to a page should
 * not go into this module, but should be  included in the module in which they
 * are used.
 */
angular.module('sailpoint.widget', [
    'ngSanitize',
    'widget/message-template.html',
    'template/popover/popover.html',
    'ui.bootstrap.popover',
    'sailpoint.i18n',
    'sailpoint.filter'
]);
