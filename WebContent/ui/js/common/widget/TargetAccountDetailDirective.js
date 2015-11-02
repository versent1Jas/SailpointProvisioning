/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

/**
 * Directive to display target account details in a table format.
 *
 * accounts (required) - array of objects with detailed account info
 *
 * @author: michael.hide
 * Created: 12/2/14 4:40 PM
 */
angular.module('sailpoint.widget').
    directive('spTargetAccounts', function() {
        return {
            restrict: 'E',
            replace: 'true',
            scope: {
                /**
                 * {array} of target accounts
                 */
                accounts: '=',
                /**
                 * {string} name of the parent role. Used when a target account does not have a role name.
                 */
                parent: '@'
            },
            templateUrl: 'widget/target-account.html'
        };
    }).
    run(['$templateCache', function($templateCache) {
        $templateCache.put('widget/target-account.html',
        '<div role="presentation" class="panel">' +
        '    <div ng-if="accounts.length > 0" role="presentation" ' +
        '      class="table-responsive table-responsive-wide-title">' +
        '      <table class="table table-striped m-b-none text-md">' +
        '        <thead>' +
        '          <tr>' +
        '            <th>{{ \'ui_item_detail_role\' | spTranslate }}</th>' +
        '            <th>{{ \'ui_item_detail_application\' | spTranslate }}</th>' +
        '            <th>{{ \'ui_item_detail_account_name\' | spTranslate }}</th>' +
        '          </tr>' +
        '        </thead>' +
        '        <tbody>' +
        '          <tr ng-repeat="targetAccount in accounts">' +
        '            <td data-title="{{ \'ui_item_detail_role\' | spTranslate }}">' +
        '               {{ targetAccount.role || parent}}</td>' +
        '            <td data-title="{{ \'ui_item_detail_application\' | spTranslate }}">' +
        '               {{ targetAccount.application }}</td>' +
        '            <td data-title="{{ \'ui_item_detail_account_name\' | spTranslate }}">' +
        '               {{ targetAccount.account | emptyText:\'ui_item_detail_new_account\' }}</td>' +
        '          </tr>' +
        '        </tbody>' +
        '      </table>' +
        '    </div>' +
        '    <div ng-if="!accounts || accounts.length === 0" class="panel-body" role="presentation">' +
        '      {{ \'ui_item_detail_no_target_accounts\' | spTranslate }}' +
        '    </div>' +
        '</div>');
    }]);
