'use strict';

/**
 * The AuthQuestionCtrl handles actions from the auth question page.
 */
angular.module('sailpoint.reset').
    /* jshint maxparams: 11 */
    controller('AuthQuestionCtrl', ['$scope', '$rootScope', 'AuthAnswerModel', 'authQuestionService',
        'spTranslateFilter', 'changePasswordService', 'routingService', 'resetDataService', 'unlockAccountService',
        'spModal', 'browserSniffer', function($scope, $rootScope, AuthAnswerModel, authQuestionService,
                 spTranslateFilter, changePasswordService, routingService, resetDataService, unlockAccountService,
                 spModal, browserSniffer) {

            $rootScope.title = '#{msgs.ui_reset_questions_title}';

            $scope.questions = [];
            $scope.answers = [];
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
            $scope.unexpectedError = '#{msgs.js_error_unexpected}';
            $scope.errorMessages = '';
            $scope.disableSubmit = false;
            $scope.isIE = browserSniffer.isIE();

            /**
             * Disable Submit when passwords are shown and the passwords are different or
             * the question/answer selections are invalid
             * @returns {boolean}
             */
            $scope.isDisableSubmit = function isDisableSubmit() {
                if ($scope.disableSubmit ||
                        ($scope.showPasswordFields() && $scope.passwordModel.password === '') ||
                        !validateAnswers(false)) {
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

            $scope.getQuestionLabel = function(idx) {
                return spTranslateFilter('ui_reset_question_label', parseInt(idx, 10) + 1);
            };

            // When the select is changed, sync the answer id with the question id.
            $scope.setAnswerId = function(a, q) {
                if (a) {
                    if (q) {
                        a.id = q.id;
                    }
                    else {
                        a.id = '';
                    }
                }
            };

            // Cancel the flow and return to the start
            $scope.cancel = function cancel() {
                routingService.navigateCancel();
            };

            $scope.submit = function() {
                $scope.disableSubmit = true;
                $scope.errorMessages = '';

                if (validateAnswers(true)) {
                    // Handle account unlocks
                    if (resetDataService.action === 'accountUnlock') {
                        unlockAccountService.withQuestions($scope.answers)
                            .then(function(resp) {
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
                        //All questions/answers are populated
                        changePasswordService.withQuestions($scope.answers, $scope.passwordModel.password)
                            .then(function(resp) {
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
                }
            };

            /**
             * return true if valid, false otherwise
             * @param populateMessages Boolean on whether to set errorMessages on the scope or not
             */
            var validateAnswers = function(populateMessages) {
                if ($scope.answers && $scope.answers.length > 0) {
                    var i = 0;
                    var msgs = [];
                    var selectedQuestions = [];
                    for (i = 0; i < $scope.answers.length; i++) {
                        //Ensure the Answer has a questionId
                        if ($scope.answers[i].id === '') {
                            msgs.push('#{msgs.ui_reset_questions_questUndefined}');
                        }
                        else {
                            //Check for duplicate selected questions
                            if (selectedQuestions.indexOf($scope.answers[i].id) >= 0) {
                                msgs.push('#{msgs.ui_reset_questions_duplicateSelectedQuestion}');
                            }
                            else {
                                selectedQuestions.push($scope.answers[i].id);
                            }
                        }
                        //Ensure the answer has an answerText
                        if ($scope.answers[i].answer === '') {
                            msgs.push('#{msgs.ui_reset_questions_answerUndefined}');
                        }
                    }

                    if (msgs.length > 0) {
                        if (populateMessages) {
                            $scope.errorMessages = msgs.join('<br/>');
                        }
                        return false;
                    }

                }

                return true;
            };

            var fetchAuthQuestions = function() {

                var promise = authQuestionService.getAuthQuestions();
                //Reset the questions
                $scope.answers = [];
                $scope.questions = [];

                promise.then(function(resp) {
                        //Success
                        var quest = resp.data.questions;
                        $scope.questions = quest;

                        if (quest) {
                            if (resp.data.numRequired) {
                                var i;
                                for (i = 0; i < resp.data.numRequired; i++) {
                                    $scope.answers.push(new AuthAnswerModel());
                                }
                            }
                        }
                    },
                    function(err) {
                        //Error
                        SailPoint.ErrorHandler.setErrorMessages($scope, err);
                    });
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

            //Fetch Auth Questions when the controller is first loaded
            fetchAuthQuestions();
        }]);