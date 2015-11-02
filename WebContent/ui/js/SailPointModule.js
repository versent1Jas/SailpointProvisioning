'use strict';

var SailPoint = SailPoint || {};

/**
 * Define the sailpoint app and its dependencies.
 */
angular.module('sailpoint', [
    'sailpoint.csrf',
    'sailpoint.accessrequest',
    'sailpoint.model',
    'sailpoint.approval',
    'sailpoint.dashboard',
    'sailpoint.directive',
    'sailpoint.filter',
    'sailpoint.i18n',
    'sailpoint.warning',
    'sailpoint.timeout',
    'sailpoint.error',
    'sailpoint.http',
    'sailpoint.notification',
    'ngAnimate'
]).
constant('CURR_USER_ID', SailPoint.CURR_USER_ID).
run(['$rootScope', '$state', 'SP_LCM_ENABLED', 'SP_LCM_SELF_SERVICE_ENABLED',
    function($rootScope, $state, SP_LCM_ENABLED, SP_LCM_SELF_SERVICE_ENABLED) {
        $rootScope.$on('$stateChangeStart',
            function(event, toState, toParams, fromState) {
                var stateLcmConfig = toState.data && toState.data.lcmConfig;
                /* If the state requires LCM navigate away if LCM is not enabled.
                 * Similarly if the state requires self service and it is not enabled
                 * navigate away */
                if(stateLcmConfig && ((stateLcmConfig.isLcm && !SP_LCM_ENABLED) || (
                    stateLcmConfig.isSelfService && !SP_LCM_SELF_SERVICE_ENABLED))) {
                    event.preventDefault();
                    /* If there is no from state go to home */
                    if(!fromState.name) {
                        $state.go('dashboard');
                    }
                }
            });
    }
]);
