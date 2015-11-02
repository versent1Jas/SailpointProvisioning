'use strict';

angular.module('sailpoint.flow').

factory('Flow', [function() {

    /**
     * Constructor.
     *
     * @param {String} name  The unique logical name of this flow.
     * @param {Array<String>} validStates  An array of states that are valid (along
     *    with any child states) for this flow.
     * @param {Object} onExitConfig  An optionaly object that contains configuration
     *    information about how exiting due to an invalid state transition should be
     *    handled.  The following properties are available:
     *      - message {String}: An optional message key or localized message to display
     *          in the dialog that gets presented to warn the user.  If not specified,
     *          default text is used.
     *      - onExitFunction {Function}: An optional function to call if the user decides
     *          to continue navigating.  See getOnExitCallback() for the parameters and
     *          return value.
     *      - ignoreExitFunction {Function}: An optional function that is called with
     *          the toState and toParams to determine if exiting this flow via an
     *          invalid state should be ignored (ie - allowed without a warning).
     *
     * @throws If name or validStates are not given.
     */
    function Flow(name, validStates, onExitConfig) {
        if (!name) {
            throw 'name is required';
        }

        if (!validStates) {
            throw 'validStates are required.';
        }

        /**
         * @property {String} name  The unique logical name of this flow.
         */
        this.name = name;

        /**
         * @property {Array<String>} validStates  An array of valid states for this flow.
         */
        this.validStates = validStates;

        /**
         * @property {Object} onExitConfig  A configuration object with properties that
         *    describe how to handle exiting due to an invalid state.
         */
        this.onExitConfig = onExitConfig;
    }

    /**
     * @return {String} The message to display (either a message key or localized string)
     *    in the dialog that gets displayed when exiting due to an invalid state.
     */
    Flow.prototype.getOnExitMessage = function() {
        return (this.onExitConfig) ? this.onExitConfig.message : null;
    };

    /**
     * @return {Function} An optional function that gets called if the user decides to
     *    continue with exiting the flow due to an invalid state.  This function accepts
     *    two parameters and returns Promise that should resolve to continue with exiting
     *    the flow or reject to cancel exiting the flow.  Typically this is used to clean
     *    up any state before moving out of the flow.
     *
     *      - toState {$state}  The state that is being transitioned to.
     *      - toParams {Object} A map of the parameters to send to the state.
     */
    Flow.prototype.getOnExitFunction = function() {
        return (this.onExitConfig) ? this.onExitConfig.onExitFunction : null;
    };

    /**
     * Return whether or not to show the warning. Show by default.
     * This returns the result of the "showWarningFunction" from the onExitConfig
     * if available, or true otherwise.
     *
     * @param {$state} toState  The state that is being transitioned to.
     * @param {Object} toParams  A map of the parameters to send to the state.
     *
     * @return {boolean} True if warning dialog should be shown, showWarningFunction doesn't exist
     * or onExitConfig doesn't exist. False if showWarningFunction runs and returns false.
     */
    Flow.prototype.showWarning = function(toState, toParams) {
        var func = (this.onExitConfig) ? this.onExitConfig.showWarningFunction : null;
        return (func) ? func(toState, toParams) : true;
    };

    /**
     * Return whether the given state is a valid state for this flow.
     *
     * @param {String} state  The name of the state to check.
     *
     * @return {boolean} True if the given state is valid, false otherwise.
     *
     * @throws If state is null.
     */
    Flow.prototype.isValidState = function(state) {
        var isValid = false;

        if (!state) {
            throw 'state is required';
        }

        // If the given state starts with any of the valid states, then it is valid.
        // This allows for state nesting.  Example:
        //
        //   state = accessRequest.manageAccess.add
        //   validStates = [ accessRequest, accessRequestSelf ]
        //
        // Since the state starts with accessRequest, this is valid.
        this.validStates.forEach(function(validState) {
            if (state.indexOf(validState) === 0) {
                isValid = true;
            }
        });

        return isValid;
    };

    return Flow;
}]);
