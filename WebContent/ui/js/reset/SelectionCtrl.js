'use strict';

/**
 * The SelectionCtrl handles actions from the user password reset selection page.  This page
 * will only be used when both authentication questions and sms reset functionality is enabled.
 */
angular.module('sailpoint.reset')
    .controller('SelectionCtrl',
        ['$scope', '$rootScope', '$location', 'resetDataService', 'SMSMessagingService', 'routingService',
            function($scope, $rootScope, $location, resetDataService, SMSMessagingService, routingService) {

                $rootScope.title = '#{msgs.ui_reset_selection_title}';

                // initialize to questions so the radio is checked, in order for scope
                // inheritance to function properly (children modify the parent scope and do 
                // not default to javascript prototype copying), it is necessary to create an object
                // that represents the model.
                $scope.selectionModel = {
                    authMethod: 'questions'
                };
                $scope.smsStatus = resetDataService.smsStatus;
                $scope.unexpectedError = '#{msgs.js_error_unexpected}';
                $scope.errorMessages = '';
                $scope.disableSubmit = false;

                $scope.submit = function() {

                    $scope.disableSubmit = true;
                    resetDataService.smsStatus.show = false; // Always reset this

                    if ('sms' === $scope.selectionModel.authMethod) {
                        sendSMS();
                    }
                    else {
                        route();
                    }
                };

                $scope.cancel = function() {
                    resetDataService.smsStatus.show = false; // Always reset this
                    routingService.navigateCancel();
                };

                $scope.navigateHaveACode = function() {
                    $scope.smsStatus.show = false;
                    $scope.selectionModel.authMethod = 'sms';
                    route();
                };

                /**
                 * Private method to send an sms text and handle the response.
                 */
                var sendSMS = function() {
                    SMSMessagingService.sendSMS().then(function(response) {
                        route();
                    }, function(response) {
                        $scope.disableSubmit = false;
                    });
                };

                var route = function() {
                    // push path to the location so routing is established.
                    $location.path('/' + $scope.selectionModel.authMethod);
                };

            }
        ]);
