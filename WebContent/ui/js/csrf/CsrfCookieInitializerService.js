/**
 * Created by ray.shea on 3/23/14.
 */

/**
 * A service which sets the XSRF-TOKEN cookie to the token value retrieved from the bean. Angular will automatically
 * copy this value into the X-XSRF-TOKEN header on every request.
 */
angular.module('sailpoint.csrf').
    factory('csrfCookieInitializerService', ['$cookies', function($cookies) {
        $cookies['XSRF-TOKEN'] = SailPoint.XSRF_TOKEN;
    }]
    );
