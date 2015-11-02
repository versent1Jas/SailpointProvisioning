/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

/**
 * Controller for WorkItem notifications (aka the 'bell icon' in the upper right corner of the responsive UI).
 * Has functions for the state of the button, number of existing notifications, popup of notification details,
 * and whether notifications have been viewed.
 */
angular.module('sailpoint.notification').
    controller('WorkItemNotificationsCtrl', ['workItemNotificationsService', 'spTranslateFilter', '$timeout',

    function(workItemNotificationsService, spTranslateFilter, $timeout) {

        ////////////////////////////////////////////////////////////////////////
        //
        //  METHODS
        //
        ////////////////////////////////////////////////////////////////////////

        /**
         * returns the notification details text for the contents of the popover
         *
         * @returns {string} Message catalog value with data
         */
        this.getNotificationDetails = function() {
            var data = workItemNotificationsService.notificationCounts;
            if(data && data.total > 0) {
                return spTranslateFilter('ui_notifications_popover_content',
                    data.Form, data.ViolationReview, data.ManualAction);
            }
            return spTranslateFilter('ui_notifications_popover_no_workitems');
        };

        /**
         * True/False if the user has viewed the details yet.
         *
         * @returns {boolean}
         */
        this.isNotificationsViewed = function() {
            return workItemNotificationsService.isNotificationsViewed();
        };

        /**
         * Called when the user clicks the bell to show the notifications.
         */
        this.setNotificationsViewed = function() {
            workItemNotificationsService.setNotificationsViewed(true);
        };

        /**
         * returns the total number of notifications (the number to display in the bubble.)
         *
         * @returns {number}
         */
        this.getTotalNotifications = function() {
            if(workItemNotificationsService.notificationCounts) {
                return workItemNotificationsService.notificationCounts.total;
            }
            return undefined;
        };

        /**
         * returns true if the indicator needs to be visible (this would be used to show the numbers bubble or not;
         * the bell will always be visible).
         *
         * @returns {boolean}
         */
        this.isVisible = function() {
            var count = this.getTotalNotifications();
            if(count) {
                return count > 0;
            }
            return false;
        };

        // getWorkItemNotifications triggers a REST call, but since we are early in the cycle, it's possible due to 
        // some weird implementation in angular-cookies internals, that we don't yet have the correct XSRF-TOKEN 
        // value set in the browser cookies (see bug #18624 and the comments in TranslateFilter.js for detail), 
        // which would cause a spurious CSRF validation error in the server logs.
        //
        // There is no great solution to this, but the simplest is to just delay priming the pump for 100ms, which
        // is the maximum delay that angular-cookies will wait before pushing the correct XSRF-TOKEN cookie value.
        $timeout(function() {
            // Prime the pump.
            workItemNotificationsService.getWorkItemNotifications();
        }, 100);
    }]);
