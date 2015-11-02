'use strict';

/**
 * The TimeoutDialogCtrl handles redirecting to the login page from the timeout
 * dialog.
 */
angular.module('sailpoint.timeout').
    controller('TimeoutDialogCtrl',
               ['$scope', '$timeout', '$window', '$modalInstance', 'refreshWarningOverrideService',
                function($scope, $timeout, $window, $modalInstance, refreshWarningOverrideService) {

        /**
         * Close the dialog and redirect to the login page.
         */
        $scope.login = function() {
            refreshWarningOverrideService.enableOverride();
            var hash = $window.location.hash;
            if(hash) {
                // Strip off any query params
                if(hash.indexOf('?') > -1) {
                    hash = hash.substring(0, hash.indexOf('?'));
                }
                angular.element('#sessionTimeoutForm\\:preRedirectUrlHash').val(hash);
            }
            // Try to copy the current object's ID in the logoutForm
            // so this will get posted with the preLoginUrl.  This helps us
            // go back to the correct page after an auto-logout.
            var editFormId = angular.element('#editForm\\:id');
            if (editFormId) {
                angular.element('#sessionTimeoutForm\\:id').val(editFormId.val());
            }
            // The ui-bootstrap library adds a click listener to the document which calls scope.$digest.
            // With user triggered clicks this is fine because the click event will not be handled
            // mid-cycle but calling .click from javascript can cause the event listener to trigger during
            // the digest cycle.  Because $digest() will cause an error if called during a digest cycle,
            // We added a timeout to ensure this click action is fired outside of a angular digest cycle.
            $timeout(function(){
                angular.element('#sessionTimeoutForm\\:checkSessionBtn').click();
            });

            $modalInstance.dismiss('close');
        };
    }]);
