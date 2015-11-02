'use strict';

/* Reset Module */
var resetApp = angular.module('sailpoint.reset', [
    'ngRoute',
    'ngSanitize',
    'sailpoint.csrf',
    'sailpoint.form',
    'sailpoint.i18n',
    'sailpoint.modal',
    'sailpoint.util',
    'ui.bootstrap'
]);

// Add this constant to make mocking easier.
resetApp.constant('SP_CONTEXT_PATH', SailPoint.CONTEXT_PATH || '');

resetApp.config([ '$routeProvider', 'SP_CONTEXT_PATH',
    function($routeProvider, SP_CONTEXT_PATH) {
        $routeProvider.when('/selection', {
            templateUrl: SP_CONTEXT_PATH + '/ui/external/resetSelectionView.jsf',
            controller: 'SelectionCtrl'
        }).when('/sms', {
            templateUrl: SP_CONTEXT_PATH + '/ui/external/smsResetView.jsf',
            controller: 'SMSResetCtrl'
        }).when('/questions', {
            templateUrl: SP_CONTEXT_PATH + '/ui/external/authQuestionResetView.jsf',
            controller: 'AuthQuestionCtrl'
        }).when('/thankYou', {
            templateUrl: SP_CONTEXT_PATH + '/ui/external/desktopResetThankyou.jsf'
        }).otherwise({
            controller: 'LoginRedirectCtrl',
            template: '<div/>'
        });
    } ]);
