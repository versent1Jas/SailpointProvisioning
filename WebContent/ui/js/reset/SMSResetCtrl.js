/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

/**
 * Project: identityiq
 * Author: michael.hide
 * Created: 2/18/14 3:57 PM
 */
angular.module('sailpoint.reset')
    /* jshint maxparams: 8 */
    .controller('SMSResetCtrl', ['$scope', '$rootScope',
        'resetDataService', 'SMSMessagingService', 'routingService', 'changePasswordService', 'unlockAccountService',
        'spModal', function($scope, $rootScope, resetDataService, SMSMessagingService,
                 routingService, changePasswordService, unlockAccountService, spModal) {

            $rootScope.title = '#{msgs.ui_reset_sms_title}';

            // Initialize some scope variables
            $scope.textCode = '';
            $scope.passwordModel = {
                password: '',
                confirm: '',
                noMatchText: '#{msgs.ui_reset_password_not_match}',
                doFieldsMatch: function() {
                    var match = !(this.password !== '' && this.password !== this.confirm);
                    // Manipulate noMatchText so JAWS will read it each time.
                    if (match) {
                        this.noMatchText = '';
                    } else {
                        this.noMatchText = '#{msgs.ui_reset_password_not_match}';
                    }
                    return match;
                }
            };
            $scope.$watch(function() {
                    return resetDataService.smsStatus;
                },
                function(newVal, oldVal) {
                    $scope.smsStatus = newVal;
                },
                true
            );
            $scope.unexpectedError = '#{msgs.js_error_unexpected}';
            $scope.errorMessages = '';
            $scope.disableSubmit = false;

            /**
             * Disable Submit when the passwords are different
             * @returns {boolean}
             */
            $scope.isDisableSubmit = function isDisableSubmit() {
                if (!$scope.textCode || $scope.textCode === '' ||
                    ($scope.showPasswordFields() && $scope.passwordModel.password === '') ||
                    $scope.disableSubmit) {
                    return true;
                }
                return ($scope.showPasswordFields() && !$scope.passwordModel.doFieldsMatch());
            };
            
            /**
             * Only show password fields if we are in context of Password Reset
             */
            $scope.showPasswordFields = function showPasswordFields() {
                if(resetDataService.action === 'passwordReset') {
                    return true;
                } else {
                    return false;
                }
            };

            // Request another SMS reset token
            $scope.sendSMS = function sendSMS() {
                // Reset this to false to give a visual indication that we're doing something.
                resetDataService.smsStatus.show = false;
                // Reset this to '' so JAWS will read it again when it is updated.
                resetDataService.smsStatus.text = '';
                // Reset the errorMessages before sending SMS
                $scope.errorMessages = '';

                // Status messages are set in sendSMS, but we have to manually update the div
                // so that JAWS will read the text.
                SMSMessagingService.sendSMS();
            };

            // Cancel the flow and return to the start
            $scope.cancel = function cancel() {
                routingService.navigateCancel();
            };

            // Submit the password change request
            $scope.submit = function submit() {
                // Disable submit for visual indication
                $scope.disableSubmit = true;
                // Reset this to false to give a visual indication that we're doing something.
                resetDataService.smsStatus.show = false;
                // Reset these to '' so JAWS will read them again when they are updated.
                resetDataService.smsStatus.text = '';
                $scope.errorMessages = '';

                // Handle account unlocks
                if (resetDataService.action === 'accountUnlock') {
                    unlockAccountService.withSMS($scope.textCode).
                        then(function(resp) {
                            //Success
                            if(resetDataService.origin !== 'desktopReset') {
                                //Non Desktop Reset - Show modal dialog
                                var modal = showUnlockPopup();
                                modal.result['finally'](function() {
                                    routingService.navigateSuccess();
                                });
                            } else {
                                //DesktopReset - Navigate to GINA thankyou
                                routingService.navigateSuccess();
                            }
                            
                        }, function(err) {
                            //Error
                            $scope.disableSubmit = false;
                            SailPoint.ErrorHandler.setErrorMessages($scope, err);
                        });
                }
                // Handle password changes
                else {
                    // At this point we should have data in textCode and a matched password.
                    changePasswordService.withSMS($scope.textCode, $scope.passwordModel.password).
                        then(function(resp) {
                            //Success
                            if(resetDataService.origin !== 'desktopReset') {
                                changePasswordService.loginUser($scope.passwordModel.password)['finally'](
                                        function(resp) {
                                            routingService.navigateSuccess();
                                        }
                                );
                            } else {
                                routingService.navigateSuccess();
                            }
                        }, function(err) {
                            //Error
                            $scope.disableSubmit = false;
                            SailPoint.ErrorHandler.setErrorMessages($scope, err);
                        });
                }
            };
            
            var showUnlockPopup = function() {
                return spModal.open({
                    title: '#{msgs.user_reset_unlock_confirmation_title}',
                    content: '#{msgs.user_reset_unlock_submit_msg}',
                    scope: $scope,
                    buttons: [{
                        displayValue: 'ui_button_complete',
                        primary: true,
                        close: true
                    }]
                });
                
            };
            
            
        }
    ]);
