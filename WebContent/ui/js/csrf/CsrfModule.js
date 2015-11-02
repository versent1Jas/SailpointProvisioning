/**
 * Created by ray.shea on 3/23/14.
 */

angular.module('sailpoint.csrf', ['ngCookies']).
    run([ 'csrfCookieInitializerService', function(csrfCookieInitializerService) {
    // No-op.  Just need to inject the service to make it initialize.
}]);