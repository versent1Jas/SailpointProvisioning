'use strict';

angular.module('sailpoint.i18n').

/**
 * Configure the $translateProvider to pull the message catalog from a REST
 * resource.
 */
config(['$translateProvider', '$provide', function ($translateProvider, $provide) {

    // angular-translate and angular-cookies interact in a weird way on startup such that sailpoint's
    // XSRF-TOKEN is not properly pushed into the browser cookies in time for the first rest call to the 
    // translate provider, which would result in a CsrfValidationException. So here we use a decorator to intercept 
    // $translateUrlLoader, and wait 100ms before invoking it, since 100ms is the maximum polling time used by 
    // angular-cookies for pushing cookies into the browser.
        
    $provide.decorator('$translateUrlLoader', ['$delegate', '$timeout',
        function($delegate, $timeout) {
            return function(options) {
                return $timeout(function() {
                    return $delegate(options);
                }, 100);
            };
        }]);

    $translateProvider.useUrlLoader(SailPoint.CONTEXT_PATH + '/ui/rest/messageCatalog');
    $translateProvider.preferredLanguage('en');
}]).


/**
 * The spTranslate filter is used to translate messages.  This is similar to
 * the angular-translate translate filter, but allows using the message key
 * format that we have in the java message catalog (eg - "hi {0}" instead of
 * "hi {{username}}").  An arbitrary number of parameters may be passed to the
 * filter, which will be used as variable replacements in the message.
 * Examples:
 *
 *   {{ 'ui_no_params' | spTranslate }}
 *
 *   {{ 'ui_with_params' | spTranslate:param1:param2 }}
 *
 *   {{ 'ui_with_params_and_literals' | spTranslate:param1:43}}
 *
 * Only messages that begin with "ui_" are included in the message catalog.
 *
 * Note that message translation will still largely happen on the server using
 * JSF expressions, such as #{msgs.my_msg_key}.  The translate filter only needs
 * to be used if there needs to be client-side variable replacement within
 * messages.  In other words, in places where we used to use <h:outputFormat>
 * with <f:param>, you will now use the translate filter.  All other places
 * should still use JSF expressions.
 * 
 * This filter is prefixed with "sp" to differentiate it from the translate
 * filter shipped with angular-translate.
 */
filter('spTranslate', ['$parse', '$translate', function ($parse, $translate) {
    return function (translationId) {
        var argMap, i, len, idx;

        // If there are any parameters, create an argument map for the translation
        // that has the keys that we expect in our messages.
        if (arguments.length > 1) {
            argMap = {};

            for (i = 1, len = arguments.length; i < len; i++) {
                idx = 'var' + (i-1).toString();
                argMap[idx] = arguments[i];
            }
        }

        // Let the translate service do the heavy lifting.
        return $translate.instant(translationId, argMap);
    };
}]);
