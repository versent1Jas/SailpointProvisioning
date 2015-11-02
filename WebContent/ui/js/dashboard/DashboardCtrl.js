'use strict';

/**
 * DashboardCtrl handles the dashboard cards
 */
angular.module('sailpoint.dashboard').
    /* jshint maxparams: 9 */
    controller('DashboardCtrl',
               ['approvalService', 'APPROVAL_REQUEST_TYPES', 'SP_CURR_USER_ID', 'SP_CURR_USER_NAME',
                'SP_CURR_DISPLAYABLE_USER_NAME', 'DASHBOARD_CARDS', 'SP_LCM_ENABLED', '$state',
        function(approvalService, APPROVAL_REQUEST_TYPES, SP_CURR_USER_ID, SP_CURR_USER_NAME,
                 SP_CURR_DISPLAYABLE_USER_NAME, DASHBOARD_CARDS, SP_LCM_ENABLED, $state) {

            var me = this,
                REQUEST_FOR_OTHERS_STATE = 'accessRequest',
                REQUEST_FOR_SELF_STATE = 'accessRequestSelf';

            /**
             * Determines if the My Approvals card is shown
             *
             * @type {boolean}
             */
            me.showMyApprovalsCard = false;

            /**
             * Determines if the Manage Access card is shown
             *
             * @type {boolean}
             */
            me.showManageAccessCard = false;

            /**
             * The label for the Manage Access card button
             *
             * @type {string}
             */
            me.manageAccessLabel = null;

            /**
             * The state to send the user to from the Manage Access card.
             * i.e. manage themselves or manage others
             *
             * @type {string}
             */
            me.accessRequestState = null;

            /**
             * Fired when the user clicks the "Manage User Access" or "Manage My Access" dashboard
             * cards.
             */
            me.requestAccess = function() {
                $state.go(me.accessRequestState);
            };

            /**
             * Initialize the variables.
             */
            var init = function() {
                var i,
                    allowRequestForOthers = false,
                    allowRequestForSelf = false,
                    isSelfService = false;

                // Update the scope variables with bean data from SailPoint.DASHBOARD_CARDS
                if (DASHBOARD_CARDS) {
                    for (i = 0; i < DASHBOARD_CARDS.length; i++) {
                        if (DASHBOARD_CARDS[i].cardId === 'manageAccessCard' && DASHBOARD_CARDS[i].attributes) {
                            allowRequestForOthers = DASHBOARD_CARDS[i].attributes.allowRequestForOthers;
                            allowRequestForSelf = DASHBOARD_CARDS[i].attributes.allowRequestForSelf;
                            isSelfService = !allowRequestForOthers && allowRequestForSelf;
                        }
                    }
                }

                me.showMyApprovalsCard = SP_LCM_ENABLED;
                me.showManageAccessCard = SP_LCM_ENABLED && (allowRequestForOthers || allowRequestForSelf);

                if (me.showManageAccessCard) {
                    me.manageAccessLabel = isSelfService ?
                        '#{msgs.ui_access_manage_my_access}':
                        '#{msgs.ui_access_manage_user_access}';

                    me.accessRequestState = isSelfService ?
                        REQUEST_FOR_SELF_STATE : REQUEST_FOR_OTHERS_STATE;
                }
            };

            /**
             * getApprovalCount returns a promise.  When that promise resolves
             * we will add approvalCount to the scope
             *
             * @returns promise
             */
            approvalService.getApprovalCount(APPROVAL_REQUEST_TYPES).then(function(result) {
                me.approvalCount = result.data;
            });

            init();
        }
    ]
    );
