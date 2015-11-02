'use strict';

/**
 * Define the access request module.
 */
angular.module('sailpoint.accessrequest', [
    'ui.router',
    'ngTouch',
    'sailpoint.config',
    'sailpoint.directive',
    'sailpoint.flow',
    'sailpoint.http',
    'sailpoint.i18n',
    'sailpoint.modal',
    'sailpoint.model',
    'sailpoint.search',
    'sailpoint.util',
    'sailpoint.warning'
]).

// Define contants.
constant('SP_CONTEXT_PATH', SailPoint.CONTEXT_PATH || '').
constant('SP_CURR_USER_ID', SailPoint.CURR_USER_ID || '').
constant('SP_CURR_USER_NAME', SailPoint.CURR_USER_NAME || '').
constant('SP_CURR_DISPLAYABLE_USER_NAME', SailPoint.CURR_DISPLAYABLE_USER_NAME || '').

// Configure routing for this module.
config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.when('/accessRequest', '/accessRequest/selectUser');
    $urlRouterProvider.when('/accessRequestSelf', '/accessRequestSelf/add');

    $stateProvider.state('accessRequest', {
            url: '/accessRequest',
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/accessRequest/userAccessRequest.jsf',
            data: {
                lcmConfig: {
                    isLcm: true,
                    isSelfService: false
                }
            }
        }).state('accessRequest.selectUser', {
            url: '/selectUser?selectedView',
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/accessRequest/selectUser.jsf',
            controller: 'AccessRequestIdentitiesCtrl',
            controllerAs: 'identitiesCtrl'
        }).

        // MANAGE ACCESS TAB
        state('accessRequest.manageAccess', {
            url: '/manageAccess',
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/accessRequest/manageAccess.jsf',
            controller: 'AccessRequestFlowCtrl',
            controllerAs: 'flowCtrl'
        }).
        state('accessRequest.manageAccess.add', {
            url: '/add',
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/accessRequest/addAccess.jsf',
            controller: 'AccessRequestItemsCtrl',
            controllerAs: 'itemsCtrl'
        }).
        state('accessRequest.manageAccess.remove', {
            url: '/remove',
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/accessRequest/removeAccess.jsf',
            controller: 'CurrentAccessItemsCtrl',
            controllerAs: 'itemsCtrl'
        }).

        // REVIEW TAB
        state('accessRequest.review', {
            url: '/review',
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/accessRequest/reviewAccess.jsf',
            controller: 'AccessRequestReviewCtrl',
            controllerAs: 'reviewCtrl'
        }).

        // SELF SERVICE
        state('accessRequestSelf', {
            url: '/accessRequestSelf',
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/accessRequest/userAccessRequestSelf.jsf',
            data: {
                lcmConfig: {
                    isLcm: true,
                    isSelfService: true
                }
            }
        }).
        state('accessRequestSelf.remove', {
            url: '/remove',
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/accessRequest/removeAccess.jsf',
            controller: 'CurrentAccessItemsCtrl',
            controllerAs: 'itemsCtrl'
        }).
        state('accessRequestSelf.add', {
            url: '/add',
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/accessRequest/addAccess.jsf',
            controller: 'AccessRequestItemsCtrl',
            controllerAs: 'itemsCtrl'
        }).
        state('accessRequestSelf.review', {
            url: '/review',
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/accessRequest/reviewAccess.jsf',
            controller: 'AccessRequestReviewCtrl',
            controllerAs: 'reviewCtrl'
        });
}).run(['$rootScope', 'accessRequestDataService', 'AccessRequestIdentity', '$state', 'configService',
        'Flow', 'flowMasterService', 'SP_CONFIG_SERVICE', 'SP_CURR_USER_ID', 'SP_CURR_USER_NAME',
        'SP_CURR_DISPLAYABLE_USER_NAME', 'accessRequestDeepFilterService',
        /* jshint maxparams : 12 */
        function($rootScope, accessRequestDataService, AccessRequestIdentity, $state, configService,
                 Flow, flowMasterService, SP_CONFIG_SERVICE, SP_CURR_USER_ID, SP_CURR_USER_NAME,
                 SP_CURR_DISPLAYABLE_USER_NAME, accessRequestDeepFilterService) {

    // Register the access request flow.
    var onExitCfg = {
        // Since we're just passing a reference to the clear function, we need to bind
        // it to use accessRequestDataService as "this" so that it will get executed
        // correctly.
        onExitFunction: accessRequestDataService.clear.bind(accessRequestDataService),

        // Show the warning if something has been selected.
        showWarningFunction: function() {
            return accessRequestDataService.isDirty();
        }
    },
    flow = new Flow('accessRequest', [ 'accessRequest', 'accessRequestSelf' ], onExitCfg);

    flowMasterService.registerFlow(flow);

    /**
     * Returns true if the targetState would be invalid based on the AccessRequestDataService's current state
     * @param targetState Target state's name
     * @returns {boolean} true if the target state is invalid for the AccessRequestDataService's current state
     */
    function isInvalidTabState(targetState) {
        return (targetState.indexOf('add') > 0 && !accessRequestDataService.isManageAccessTabEnabled()) ||
            (targetState.indexOf('remove') > 0 && !accessRequestDataService.isRemoveAccessTabEnabled()) ||
            (targetState.indexOf('review') > 0 && !accessRequestDataService.isReviewTabEnabled());
    }

    // Handle state changes by setting up self-service requests and preventing going
    // deep into the tab if the appropriate data has not been selected.
    $rootScope.$on('$stateChangeStart',
    function(event, toState, toParams, fromState, fromParams) {
        var targetState = toState.name,
            ACCESS_REQUEST = 'accessRequest',
            ACCESS_REQUEST_SELF = 'accessRequestSelf',
            MANAGE_ACCESS = 'manageAccess',
            SELECT_USER = 'selectUser';

        // Make sure AccessRequestDataService is initialized properly for access request pages
        if (targetState.indexOf(ACCESS_REQUEST) === 0) {
            accessRequestDataService.setAllowRequestForOthers(
                configService.getConfigValue(SP_CONFIG_SERVICE.ALLOW_REQUEST_FOR_OTHERS));
            accessRequestDataService.setAllowRequestForSelf(
                configService.getConfigValue(SP_CONFIG_SERVICE.ALLOW_REQUEST_FOR_SELF));

            /* If the user is not allowed to request for others or self cancel navigation */
            if(!(accessRequestDataService.isAllowRequestForOthers() ||
                accessRequestDataService.isAllowRequestForSelf())) {
                event.preventDefault();
                if(!fromState.name) {
                    $state.go('dashboard');
                }
                return;
            }

            if (accessRequestDataService.isSelfService()) {

                // if self service add current user as identity to data service
                if(accessRequestDataService.getIdentities().length === 0) {
                    accessRequestDataService.addIdentity(new AccessRequestIdentity({
                        id: SP_CURR_USER_ID,
                        name: SP_CURR_USER_NAME,
                        displayName: SP_CURR_DISPLAYABLE_USER_NAME
                    }));
                }

                // Need to correct the url if they are trying to access a 'accessRequest' URL but
                // only have request for self privileges
                if(targetState.indexOf(ACCESS_REQUEST_SELF)<0) {
                    event.preventDefault();
                    // replace accessRequest with accessRequestSelf
                    targetState = targetState.replace(ACCESS_REQUEST, ACCESS_REQUEST_SELF);

                    //Strip out manage access if it is there
                    targetState = targetState.replace(MANAGE_ACCESS + '.', '');
                    // If select user is in the target state replace with add
                    targetState = targetState.replace(SELECT_USER, 'add');

                    $state.go(targetState, toParams, {
                        // don't update the location for deep links so we keep the params
                        location: !accessRequestDeepFilterService.isDeepLink()
                    });
                }
            }
        }

        /* For the accessRequest pages, first check with the data service to ensure the user should have access.
         * If they are not, the transitionTo() promise should be rejected with a 'transition prevented' error.
         *
         * Don't include the first tabs since that will create a redirect loop if you reload from it.
         */
        if (targetState.indexOf(ACCESS_REQUEST) === 0 && targetState.indexOf(ACCESS_REQUEST+'.selectUser') === -1 &&
            targetState.indexOf(ACCESS_REQUEST_SELF+'.add') === -1) {
            if (fromState.name.length === 0 && !accessRequestDeepFilterService.isDeepLink()) {
                event.preventDefault();
                $state.go(accessRequestDataService.isSelfService() ?
                        ACCESS_REQUEST_SELF + '.add' : ACCESS_REQUEST + '.selectUser');
            }
            if (isInvalidTabState(targetState)) {
                event.preventDefault();
            }

        }
    });
}]);

