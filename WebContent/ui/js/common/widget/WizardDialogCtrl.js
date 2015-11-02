'use strict';

/**
 * A WizardDialogCtrl is an abstract class that can be extended to serve as a controller
 * for a "wizard".  Each step of the wizard is handled by an object that implements
 * the StepHandler "interface".
 *
 * The WizardDialogCtrl is responsible for managing the steps, the cancel/back/next/save
 * buttons, and the results from each step.
 *
 * Subclasses must implement createStepHandlers() to define the steps, and can
 * optionally implement refreshStepHandlers() if the steps may change depending
 * on decisions made in the wizard.  Optionally, sub-classes can also implement
 * formatStepResults() to send back a "friendly" result when the dialog is saved.
 */
SailPoint.ns('SailPoint.widget');


////////////////////////////////////////////////////////////////////////////////
//
// CONSTRUCTOR
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Constructor.
 *
 * @param {Object} $modalInstance  The modal instance that opened this dialog.
 *
 * @throws If modalInstance is not passed in.
 */
SailPoint.widget.WizardDialogCtrl = function($modalInstance) {

    if (!$modalInstance) {
        throw '$modalInstance is required.';
    }

    this.$modalInstance = $modalInstance;

    // Initialize the variables.
    this.currentStepIdx = 0;
    this.stepResults = {};

    // Let the sub-class create the steps, and save them.
    this.steps = this.createStepHandlers();

    // Set the title of the modal.
    this.setModalTitle();
};


////////////////////////////////////////////////////////////////////////////////
//
// PROPERTIES
//
////////////////////////////////////////////////////////////////////////////////

/**
 * @property {Object} $modalInstance  The modal instance that opened this dialog.
 */

/**
 * @property {Array<StepHandler>} steps  The StepHandlers for this wizard.
 */

/**
 * @property {Object<String,Object>} stepResults  The results from each step
 *    that has been saved.  Each result is keyed by StepHandler.getId().
 */

/**
 * @property {Number} currentStepIdx  The zero-based index of the current step.
 */


////////////////////////////////////////////////////////////////////////////////
//
// METHODS TO OVERRIDE
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Sub-classes must implement to create the StepHandlers - called upon construction.
 *
 * @return {Array<StepHandler>} The StepHandlers for the wizard.
 */
SailPoint.widget.WizardDialogCtrl.prototype.createStepHandlers = function() {
    throw 'Sub-clases must implement createStepHandlers()';
};

/**
 * Sub-classes may implement to recreate the step handlers after having more information
 * from the step results.  Called after a successful StepHandler.save() in
 * WizardDialogCtrl.save().
 *
 * @return {Promise<Array<StepHandler>>} A promise that resolves with the StepHandlers for the wizard,
 *     or null if the StepHandlers should not be changed.
 */
SailPoint.widget.WizardDialogCtrl.prototype.refreshStepHandlers = function() {
    throw 'Sub-clases must implement refreshStepHandlers()';
};

/**
 * Sub-classes may implement to return a "friendlier" version of the stepResults
 * when the dialog is saved.  This is useful if the caller might have trouble
 * parsing the individual results from the raw stepResults object.
 *
 * @return {Object} A "friendly" version of the step results to return when the
 *    dialog is saved, or null if the raw stepResults should be returned.
 */
SailPoint.widget.WizardDialogCtrl.prototype.formatStepResults = function() {
    return null;
};


////////////////////////////////////////////////////////////////////////////////
//
// METHODS
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Set the title on the modal dialog to the title of the current step.
 */
SailPoint.widget.WizardDialogCtrl.prototype.setModalTitle = function() {
    return this.$modalInstance.setTitle(this.getCurrentStep().getTitle());
};

/**
 * @return {StepHandler} The StepHandler for the current step.
 */
SailPoint.widget.WizardDialogCtrl.prototype.getCurrentStep = function() {
    return this.steps[this.currentStepIdx];
};

/**
 * @return {boolean} True if there are more steps, false otherwise.
 */
SailPoint.widget.WizardDialogCtrl.prototype.hasMoreSteps = function() {
    return (this.currentStepIdx < this.steps.length-1);
};

/**
 * @return {boolean} True if the previous button should be displayed, false otherwise.
 */
SailPoint.widget.WizardDialogCtrl.prototype.isShowPrevious = function() {
    return (this.currentStepIdx > 0);
};

/**
 * Move to the previous step.
 */
SailPoint.widget.WizardDialogCtrl.prototype.previous = function() {
    if (this.currentStepIdx === 0) {
        throw 'No previous steps.';
    }
    this.currentStepIdx--;

    // Set the title when changing steps.
    this.setModalTitle();
};

/**
 * @return {boolean} True if the save button is disabled, false otherwise.
 */
SailPoint.widget.WizardDialogCtrl.prototype.isSaveDisabled = function() {
    return this.getCurrentStep().isSaveDisabled();
};

/**
 * @return {String} The message key or string for the save button.
 */
SailPoint.widget.WizardDialogCtrl.prototype.getSaveButtonLabel = function() {
    var isLastStep = (this.currentStepIdx === this.steps.length-1);
    return this.getCurrentStep().getSaveButtonLabel(isLastStep);
};

/**
 * Handle a save of the current step.  This delegates to the StepHandler to save
 * the current step.  If successful, the step results are saved, the steps are
 * refreshed, and either we progress to the next step (if more steps remain) or
 * close the dialog with the step results.
 */
SailPoint.widget.WizardDialogCtrl.prototype.save = function() {
    var me = this,
        step = this.getCurrentStep(),
        stepPromise = step.save();

    stepPromise.then(function(stepResult) {
        var newStepsPromise, results;

        // Save the step result.
        me.stepResults[step.getStepId()] = stepResult;

        // Refresh the step handlers in case any steps need to be added as
        // a result of this save.  A null value means we shouldn't modify the
        // steps.
        newStepsPromise = me.refreshStepHandlers();
        newStepsPromise.then(function(newSteps){
            if (newSteps) {
                me.steps = newSteps;
            }

            // If there are more steps, go to the next one.
            if (me.hasMoreSteps()) {
                me.currentStepIdx++;

                // Set the title when changing steps.
                me.setModalTitle();
            }
            else {
                // Let the subclass format the results if it wants to.
                results = me.formatStepResults() || me.stepResults;

                // No more steps, resolve the modal.
                me.$modalInstance.close(results);
            }
        });
    });
};

/**
 * Dismiss the modal dialog without saving.
 */
SailPoint.widget.WizardDialogCtrl.prototype.cancel = function() {
    this.$modalInstance.dismiss();
};
