'use strict';
/**
 * Dashboard module
 */
angular.module('sailpoint.dashboard', [
        'ui.router',
        'sailpoint.approval'
    ]).
    constant('DASHBOARD_CARDS', SailPoint.DASHBOARD_CARDS).
    constant('SP_CURR_USER_ID', SailPoint.CURR_USER_ID || '').
    constant('SP_CURR_USER_NAME', SailPoint.CURR_USER_NAME || '').
    constant('SP_CURR_DISPLAYABLE_USER_NAME', SailPoint.CURR_DISPLAYABLE_USER_NAME || '').
    constant('SP_LCM_ENABLED', SailPoint.LCM_ENABLED).
    constant('SP_LCM_SELF_SERVICE_ENABLED', SailPoint.configData.ALLOW_REQUEST_FOR_SELF).
    config(function($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.when('/home', '/dashboard');
        $urlRouterProvider.otherwise('/dashboard');

        $stateProvider.state('dashboard', {
            url: '/dashboard',
            params: {
                completeFlow: undefined
            },
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/dashboard/notifications.jsf',
            controller: 'DashboardCtrl',
            controllerAs: 'dash'
        });
    });
