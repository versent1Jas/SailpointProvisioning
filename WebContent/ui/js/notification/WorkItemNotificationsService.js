'use strict';

/**
 * Service which manages state of work item notifications
 */
angular.module('sailpoint.notification').
    factory('workItemNotificationsService', ['SP_CONTEXT_PATH', '$q', '$http', '$rootScope',
        function(SP_CONTEXT_PATH, $q, $http, $rootScope) {

            var BASE_URL = SP_CONTEXT_PATH + '/ui/rest/workItems/notifications';

            var workItemNotificationsService = {};

            workItemNotificationsService.notificationCounts = {};

            workItemNotificationsService.notificationsViewed = false;


            /**
             * Returns a promise with the work item counts for notifications. This will return cached counts if they
             * exist.
             * @returns {promise}
             */
            workItemNotificationsService.getWorkItemNotifications = function() {
                if (angular.isDefined(workItemNotificationsService.notificationCounts) &&
                    Object.keys(workItemNotificationsService.notificationCounts).length !== 0) {
                    var deferred = $q.defer();
                    deferred.resolve({ data: workItemNotificationsService.notificationCounts });
                    return deferred.promise;
                }

                return workItemNotificationsService.doGetWorkItemNotifications();
            };

            /**
             * Sets the viewed flag
             * @param viewed value of the viewed flag
             */
            workItemNotificationsService.setNotificationsViewed = function(viewed) {
                workItemNotificationsService.notificationsViewed = viewed;
            };

            /**
             * Returns the boolean value of the viewed flag
             * @returns {*}
             */
            workItemNotificationsService.isNotificationsViewed = function() {
                return workItemNotificationsService.notificationsViewed;
            };

            /**
             * Forces a refresh of the counts from the REST endpoint.
             * @returns {promise}
             */
            workItemNotificationsService.refresh =
                function() {
                    return workItemNotificationsService.doGetWorkItemNotifications();
                };

            ////////////////////////
            // PRIVATE
            ///////////////////////

            /**
             * Does a GET to retrieve work item counts for notifications and returns a promise. THIS IS PRIVATE
             * but unit testable since it does the real work.
             * @returns {promise}
             */
            workItemNotificationsService.doGetWorkItemNotifications =
                function() {
                    return $http.get(BASE_URL)
                        .success(function(data) {
                            workItemNotificationsService.setNotificationCounts(data);
                        });
                };

            // THIS IS PRIVATE but we want to be able to unit test it
            workItemNotificationsService.setNotificationCounts =
                function(data) {
                    if (!angular.equals(workItemNotificationsService.notificationCounts, data)) {
                        workItemNotificationsService.notificationCounts = data;
                        workItemNotificationsService.setNotificationsViewed(false);
                    }
                };

            // Listen for a broadcast from AccessRequestReviewCtrl for possible new notifications.
            $rootScope.$on('accessRequest:requestSubmissionComplete', function() {
                workItemNotificationsService.refresh();
            });

            return workItemNotificationsService;
        }
    ]);
