'use strict';

/**
 * Define the approval module.
 */
angular.module('sailpoint.approval', [
    'ui.bootstrap',
    'ui.router',
    'ngResource',
    'ngSanitize',
    'ngTouch',
    'sailpoint.config',
    'sailpoint.http',
    'sailpoint.filter',
    'sailpoint.form',
    'sailpoint.i18n',
    'sailpoint.modal',
    'sailpoint.model',
    'sailpoint.search',
    'sailpoint.util',
    'sailpoint.widget'
]).

    /**
     * An array of the types of approvals that are currently supported by the UI.
     */
    constant('APPROVAL_REQUEST_TYPES', [ 'AccessRequest', 'AccountsRequest' ]).
    /**
     * Key for column config for role approval items
     */
    constant('APPROVAL_ITEM_ROLE_COLUMN_CONFIG', 'uiApprovalItemsColumnsRole').
    /**
     * Key for column config for entitlement approval items
     */
    constant('APPROVAL_ITEM_ENTITLEMENT_COLUMN_CONFIG', 'uiApprovalItemsColumnsEntitlement').
    config(function($stateProvider) {
        $stateProvider.state('myApprovals', {
            url: '/myApprovals',
            templateUrl: SailPoint.CONTEXT_PATH + '/ui/approvals/myApprovals.jsf',
            data: {isLcm: true}
        });
    });
