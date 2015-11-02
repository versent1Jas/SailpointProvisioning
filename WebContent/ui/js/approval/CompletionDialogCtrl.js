'use strict';

/**
 * The CompletionDialogCtrl is used to handle completing approvals.  The decide
 * and revert dependencies are functions that will be called by the modal.
 *
 * decide() is called when complete() is called and must return a promise that
 * will reject if the decision fails or resolve otherwise.
 *
 * revert() is called if the decide() function fails during completion or when
 * cancel() is called.  This should revert any decision back to their previous
 * state.
 */
/* jshint maxparams:7 */
angular.module('sailpoint.approval').
    controller('CompletionDialogCtrl',
               ['$scope', '$q', 'approvalService', 'authnInfoService', 'approval', 'decide', 'revert',
                function($scope, $q, approvalService, authnInfoService, approval, decide, revert) {

    /**
     * A boolean that indicates whether the dialog is working.
     */
    $scope.completing = false;

    /**
     * A boolean that indicates that the user has attempted to sumbmit the form.
     */
    $scope.submitted = false;

    /**
     * The approval object that is being completed.
     */
    $scope.approval = approval;

    /**
     * An error that occurred during signing to display to the user.
     */
    $scope.esigError = null;

    /**
     * The credentials object holds the username and password that are entered
     * into the esignature form.  Username is pre-populated with the original
     * auth ID if available.
     */
    $scope.credentials = {
        username: authnInfoService.getAuthId(),
        password: null
    };

    /**
     * ui will be used to hold a reference to form since it will otherwise be
     * written to an ngIncluded scope
     */
    $scope.ui = {};

    /**
     * Return whether this completion requires an e-sig or not.
     */
    var isEsig = function() {
        return !!(approval.esigMeaning);
    };

    /**
     * Return whether an original auth ID is set.
     */
    var hasOriginalAuthId = function() {
        return !!authnInfoService.getAuthId();
    };

    /**
     * Return the username or null if there was an original auth ID.
     */
    var getUsername = function() {
        return (hasOriginalAuthId()) ? null : $scope.credentials.username;
    };

    /**
     * Return the password entered by the user.
     */
    var getPassword = function() {
        return $scope.credentials.password;
    };

    /**
     * Return whether the user is required to enter or user name or if this is
     * already provided.
     */
    $scope.isUsernameRequired = function() {
        return !hasOriginalAuthId();
    };

    /**
     * Return whether to show an error message for the given field.
     *
     * @param {Field} field  The angular field object.
     */
    $scope.showErrorMsg = function(field) {
        // Show if the field is invalid and is either dirty or the user has
        // tried to submit the form.
        return field.$invalid &&
               (field.$dirty || $scope.submitted);
    };

    /**
     * The approvalService.checkSignature() function just returns a data
     * structure with the auth check results.  Convert this results into the
     * same structure that is return from the sign() function, so we can handle
     * it consistently.
     *
     * @param {Object} data  The result from approvalService.checkSignature().
     *
     * @return {Object}  An object that mimics the HTTP response returned from
     *    approvalService.sign() if signing failed.  Otherwise, return null.
     */
    var convertCheckSignatureError = function(data) {
        var response;
        if (data && !data.success) {
            response = {
                status: 401,
                data: {
                    message: data.message
                }
            };
        }
        return response;
    };

    /**
     * If this is an esignature, check the credentials provided and return a
     * promise that will resolve if there are no auth problems and will reject
     * with an HTTP-like response (similar to approvalService.sign()) if authn
     * failed.  If this does not require esignatures, this just returns a
     * promise that resolves.
     *
     * @return {Promise}  A promise that will resolve if authn wasn't required
     *    or succeeded and rejects if authn fails.
     */
    var checkSignature = function() {
        var promise;

        if (isEsig()) {
            promise = approvalService.checkSignature(approval.id, getPassword(), getUsername());

            // If authn failed, reject the promise.
            promise = promise.then(function(data) {
                if (data && !data.success) {
                    // Check the signature failed.  Set the error message.
                    $scope.esigError = data.message;
                    $scope.completing = false;

                    // Convert the response to what gets returned by the
                    // approvalService.sign() function so we can handle this
                    // consistently.
                    return $q.reject(convertCheckSignatureError(data));
                }

                // No problems here - just return the authn response.
                return $q.when(data);
            });
        }
        else {
            // If this isn't an esig, just fake a promise.
            var deferred = $q.defer();
            promise = deferred.promise;
            deferred.resolve();
        }

        return promise;
    };

    /**
     * Perform the decision by calling the decide() function.  If this fails,
     * revert back using the revert function.
     */
    var makeDecision = function() {
        // Tell the service to do it.
        var decisionPromise = decide();

        // If saving failed, revert the decisions.
        return decisionPromise.catch(function(response) {
            revert();
            return $q.reject(response);
        });
    };

    /**
     * Complete or sign this approval and return the promise.
     *
     * @return {Promise}  The promise from completing or signing the approval.
     */
    var completeOrSign = function() {
        // Sign if this is an esig - otherwise, just complete it.
        if (isEsig()) {
            return approvalService.sign(approval.id, getPassword(), getUsername());
        }
        return approvalService.complete(approval.id);
    };

    /**
     * Store the username as the original auth ID if esigning and it was not
     * previously set.
     */
    var storeOriginalAuthId = function() {
        if (isEsig() && !hasOriginalAuthId()) {
            authnInfoService.setOriginalAuthId($scope.credentials.username);
        }
    };

    /**
     * Handle any failures that might have occurred during authenticating,
     * deciding, completing, and signing.
     *
     * @param {Object} reponse  The HTTP response object that can indicate
     *    authn failure.
     */
    var handleCompletionFailure = function(response) {
        var deferred = $q.defer();
        // If esig authentication failed, show the error.
        if (isEsig() && response && (401 === response.status)) {
            $scope.esigError = response.data.message;
            $scope.completing = false;
            deferred.reject();
        } else if(response && response.status === 404) {
            // If a 404 occurred, display the error and refresh the page.
            $scope.notifyObjectNotFoundException(response.data.message).finally(function() {
                // Resolve rather than reject because we want to close the dialog
                deferred.resolve();
            });
        } else {
            deferred.resolve();
        }
        return deferred.promise;
    };

    /**
     * Complete the approval by calling the decide() function then complete().
     * If the decide() function fails, the revert() function is called to revert
     * decisions.
     */
    $scope.complete = function() {
        var deferred,
            form = $scope.ui.form;
        // Reset the error since we're trying again.
        $scope.esigError = null;

        // Even if validation fails we want to register the fact that the form
        // was submitted.
        $scope.submitted = true;

        // Do nothing if the form is not valid.
        if (form && form.$invalid) {
            deferred = $q.defer();
            deferred.reject();
            return deferred.promise;
        }

        // Set completing to true to disable form inputs.
        $scope.completing = true;


        // Check the credentials first.
        return checkSignature().

        // Save the decision.
        then(function() {
            return makeDecision();
        }).

        // Call complete.
        then(function() {
            return completeOrSign();
        }).

        // Save the original auth ID.
        then(function() {
            return storeOriginalAuthId();
        }).

        // After everything is done, close the dialog or display the authn error.
        catch(function(response) {
            return handleCompletionFailure(response);
        });
    };

    /**
     * Call complete if the given event is pressing the enter key.
     */
    $scope.handleKeyPress = function($event) {
        // Complete on enter key and prevent multiple submissions
        if (13 === $event.keyCode && !$scope.inProgress) {
            $scope.inProgress = true;
            $scope.complete().then(function() {
                $scope.$close();
            }).finally(function() {
                $scope.inProgress = false;
            });
        }
    };

}]);
