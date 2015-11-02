'use strict';

SailPoint.ns('SailPoint.widget');

////////////////////////////////////////////////////////////////////////////////
//
// CONSTRUCTOR
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Constructor for the StepHandler abstract class - this should only be
 * called by sub-classes.  StepHandler is a pseudo-interface, defining methods that
 * must be implemented in sub-classes that are used in a WizardDialogCtrl.
 */
SailPoint.widget.StepHandler = function() {

};

// Add the method stubs to the abstract class
angular.extend(SailPoint.widget.StepHandler.prototype, {

    /**
     * Return the title of the dialog for the step.
     * @return {String} Title of dialog for the step
     */
    getTitle: function() {
        throw 'Must be implemented in sub-class.';
    },

    /**
     * Return a unique ID for the step.  This can be used by the template to
     * conditionally render content based on the step, and is also used to key
     * the results in the step results object.
     * @return {String} Unique ID
     */
    getStepId: function() {
        throw 'Must be implemented in sub-class.';
    },

    /**
     * Return whether the save button is disabled.
     * @return {Boolean} True if save button is disabled, otherwise false
     */
    isSaveDisabled: function() {
        throw 'Must be implemented in sub-class.';
    },

    /**
     * Return a message key or label string for the save button.
     *
     * @param {boolean} isLastStep  Whether this is the last step currently in
     *    the wizard.
     *
     * @return {String} Label for the save button
     */
    getSaveButtonLabel: function(isLastStep) {
        throw 'Must be implemented in sub-class.';
    },

    /**
     * Save the current step
     * @return {Promise<Object>} A promise that is resolved with the result
     * upon successful save, and rejected if save failed (eg - validation errors).
     */
    save: function() {
        throw 'Must be implemented in sub-class.';
    }
});

