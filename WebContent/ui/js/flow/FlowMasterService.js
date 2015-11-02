'use strict';

angular.module('sailpoint.flow').

/**
 * The FlowMasterService manages Flows within the application.  All Flows must be
 * registered with the FlowMasterService.  This service then keeps track of the
 * currently active flow by listening to state/location changes, and display a dialog
 * that warns the user if they try to navigate to an invalid state.  This dialog
 * will use the Flow's onExitConfig to determine how to display the dialog and any
 * additional logic that needs to happen when exiting the flow.
 *
 * A flow becomes active when a state is entered that matches any of the registered
 * Flows valid states.
 *
 * A flow is completed (ie - deactivated) when a state transition with the
 * "completeFlow" state parameter occurs.  The value should be the name of the
 * currently active flow.
 *
 * Modules should register their flows with this service with initialized.  Example:
 *
 * module('foo', []).run([ 'flowMasterService', 'flow', function(flowMasterService, Flow) {
 *     flowMasterService.registerFlow(new Flow('myFlow', [ 'validState1' ]));
 * });
 */
factory('flowMasterService',
        ['spTranslateFilter', 'spModal', '$rootScope', '$location', '$q', '$state',
         function(spTranslateFilter, spModal, $rootScope, $location, $q, $state) {

    var flowMasterService = {};


    ////////////////////////////////////////////////////////////////////////////
    //
    // CONSTANTS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * @constant {String} PARAM_COMPLETE_FLOW  The name of the state parameter that
     *     contains the name of the flow to complete.
     */
    var PARAM_COMPLETE_FLOW = 'completeFlow';


    ////////////////////////////////////////////////////////////////////////////
    //
    // PRIVATE VARIABLES
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * @private {Array<Flow>} flows  The Flows that have been registered with the
     *    flowMasterService.
     */
    var flows = [];

    /**
     * @private {Flow} activeFlow  The currently active flow.
     */
    var activeFlow = null;


    ////////////////////////////////////////////////////////////////////////////
    //
    // PUBLIC METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Register the given Flow with the flowMasterService.
     *
     * @param {Flow} flow  The Flow to register.
     *
     * @throws If a Flow with the same name has already been registered.
     */
    flowMasterService.registerFlow = function(flow) {
        // Error if a flow with the given name already exists.
        if (findFlow(flow.name)) {
            throw 'A flow named "' + flow.name + '" is already registered';
        }

        flows.push(flow);
    };

    /**
     * @return {Flow} The currently active flow, or null if there is not an active
     *     Flow.  Calling code should not need this generally ... it is only used
     *     for unit tests.
     */
    flowMasterService.getActiveFlow = function() {
        return activeFlow;
    };


    ////////////////////////////////////////////////////////////////////////////
    //
    // PRIVATE METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Find a registered flow with the given name.
     *
     * @param {String} flowName  The name of the flow to find.
     *
     * @return {Flow} The registered Flow with the give name, or null if not found.
     *
     * @throws If multiple flows with the given name are found.
     */
    function findFlow(flowName) {
        var foundFlows = flows.filter(function(flow) {
            return flowName === flow.name;
        });
        if (foundFlows.length > 1) {
            throw 'Multiple flows found named ' + flowName;
        }

        return (foundFlows.length === 1) ? foundFlows[0] : null;
    }

    /**
     * Start the flow with a valid state that matches the given name (ie - make it active).
     * This is a no-op if there is already an active flow or there is not a registered
     * Flow for which the given state is valid.
     *
     * @param {String} toState  The name of state that is starting.
     *
     * @throws If multiple flows are found that would match the given toState.
     */
    function startFlow(toState) {
        var newFlow;

        if (!activeFlow) {
            flows.forEach(function(flow) {
                if (flow.isValidState(toState.name)) {
                    if (newFlow) {
                        throw 'Found two flows that match the given state';
                    }
                    newFlow = flow;
                }
            });

            activeFlow = newFlow;
        }
    }

    /**
     * Complete the flow with the given name.
     *
     * @param {String} flowName  The name of the flow to complete.
     *
     * @throws If there is not an active flow or the active flow's name does not
     *    match the given flowName.
     */
    function completeFlow(flowName) {
        // Error if there is no active flow or if the flow name doesn't match the active flow.
        if (!activeFlow) {
            throw 'There is not an active flow to complete.';
        }
        if (flowName !== activeFlow.name) {
            throw 'Cannot complete "' + flowName + '" because it is not the active flow.';
        }

        // Clear out the active flow.
        activeFlow = null;
    }

    /**
     * Renders a dialog with a message indicating that the user will lose changes and must confirm to continue
     *
     * @param message {String} [optional] Message or message key to be shown in the confirmation dialog.  If not
     *   specified ui_flow_leave_flow_message is used.
     * @returns {Promise} Promise that is resolved if navigation should continue and is rejected if navigation
     *   should stop.
     */
    function showDialog(message) {
        var content = spTranslateFilter(message || 'ui_flow_leave_flow_message');
        return spModal.open({
            title: 'ui_flow_leave_flow_title',
            content: content,
            warningLevel: 'warning',
            backdrop: 'static',
            buttons: [{
                displayValue: 'ui_no',
                close: false
            }, {
                displayValue: 'ui_yes',
                close: true,
                primary: true
            }]

        }).result;
    }

    /**
     * Handle exiting due to an invalid state transition by showing the dialog and
     * handling the response.  If the user chooses to continue with the transition
     * this clears the active flow and goes to where they were heading.
     *
     * @param toState {$state}  The state the user was transitioning to.
     * @param toParams {Object}  The parameters for the state transition.
     */
    function handleExit(toState, toParams) {
        if (activeFlow.showWarning(toState, toParams)) {
            // Show the dialog.
            showDialog(activeFlow.getOnExitMessage())
                .then(function() {
                    runExitFuncAndGo(toState, toParams);
                });
        }
        else {
            // if no showWarningFunc is defined or it returns false still execute the exitFunc and transition
            runExitFuncAndGo(toState, toParams);
        }
    }

    /**
     * Run the exitFunction and transition state
     *
     * @param toState {$state}  The state the user was transitioning to.
     * @param toParams {Object}  The parameters for the state transition.
     */
    function runExitFuncAndGo(toState, toParams) {
        var onExitFunc = activeFlow.getOnExitFunction();

        if (onExitFunc) {
            onExitFunc(toState, toParams);
        }

        // User chose to continue with exiting - clear the active flow and go
        // where they were heading to.
        activeFlow = null;
        $state.go(toState, toParams);
    }

    // Listen for $stateChangeStart events that come from the router and handle them.
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {

        // Grab the completeFlowName from the state parameters.
        var completeFlowName;
        if (toParams) {
            completeFlowName = toParams[PARAM_COMPLETE_FLOW];
        }

        // First, check to see if we are completing a flow.  If so, wrap it up.
        if (completeFlowName) {
            completeFlow(completeFlowName);
        }

        // Next, check if we are starting a new flow.  If so, kick it off.
        startFlow(toState);

        // If there is an active flow, check if we are exiting the active flow via an invalid
        // state.  If so, call the onExit function.
        if (activeFlow && !activeFlow.isValidState(toState.name)) {

            // Prevent the state change.  If the onExit function wants to continue,
            // it needs to handle the transition to the state.
            event.preventDefault();

            handleExit(toState, toParams);
        }
    });


    return flowMasterService;
}]);
