'use strict';

angular.module('sailpoint.http').

/**
 * The httpVerbTunneler translates PATCH requests into an X-HTTP-Method-Override
 * header for browsers that do not support PATCH.  This has to be a provider
 * because it must be injected into config() function to add an interceptor to
 * the $httpProvider.
 */
provider('httpVerbTunneler', function() {
    var interceptor = {};

    this.getInterceptor = function() {
        return interceptor;
    };

    /**
     * When the httpVerbTunneler service is instantiated, setup the request
     * handler on the interceptor.  This must be done upon service retrieval
     * because this relies on the browserSniffer service, which is not available
     * to providers.
     */
    this.$get = ['browserSniffer', function(browserSniffer) {
        interceptor.request = function(config) {
            var headers;

            // Only tweak the config if this is a PATCH request on BlackBerry.
            // All other browsers seem to work fine, but BlackBerry turns the
            // PATCH request into a GET.
            if (config && ('PATCH' === config.method) &&
                browserSniffer.isBlackBerry()) {

                // Set our special header.
                headers = config.headers || {};
                config.headers = headers;
                headers['X-HTTP-Method-Override'] = 'PATCH';

                // Change the verb to a POST.
                config.method = 'POST';
            }

            return config;
        };
    }];
}).

/**
 * Add the httpVerbTunneler's interceptor to the $httpProvider.
 */
config(['$httpProvider', 'httpVerbTunnelerProvider',
        function($httpProvider, httpVerbTunnelerProvider) {

    $httpProvider.interceptors.push(function() {
        return httpVerbTunnelerProvider.getInterceptor();
    });
}]).

/**
 * Inject the httpVerbTunneler into a run() function.  This causes the $get()
 * method on the httpVerbTunnelerProvider to be called, which sets up the
 * request interceptor.
 */
run(['httpVerbTunneler', function(httpVerbTunneler) {
    // No-op.
}]);
