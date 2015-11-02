/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

/**
 * Project: identityiq
 * Author: michael.hide
 * Created: 2/27/14 1:09 PM
 */
angular.module('sailpoint.reset')
    .directive('spPasswordConfirm', function() {
        return {
            restrict: 'E',
            require: ['ngModel'],
            scope: {
                ngModel: '=' // use the same name as the attribute
            },
            replace: true,
            template: '<div><label for="password">#{msgs.ui_reset_enter_new_password}</label>' +
                '<input id="password" type="password" tabindex="50" class="form-control"' +
                    'ng-required="true" ng-model="ngModel.password"/>' +
                '<div class="form-group" ng-class="{\'has-error\':isPasswordError()}">' +
                '<label for="confirmPassword">#{msgs.ui_reset_confirm_password}</label>' +
                '<input id="confirmPassword" type="password" tabindex="50" class="form-control"' +
                    'ng-required="true" ng-model="ngModel.confirm"/>' +
                '<div id="passConfErrDiv" role="alert" aria-live="rude" tabindex="50" class="has-error" ' +
                    'ng-hide="ngModel.doFieldsMatch()" ng-bind-html="ngModel.noMatchText"></div></div></div>'
        };
    });
