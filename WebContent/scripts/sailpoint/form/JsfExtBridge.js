/* (c) Copyright 2010 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.form');

/**
 * A static class that helps bring together pages that use both ExtJS and JSF
 * components.
 * 
 * @class SailPoint.form.JsfExtBridge
 * @static
 */
SailPoint.form.JsfExtBridge = {

    /**
     * Bind the given Ext.form.ComboBox to the JSF input field that has the
     * given class name.  This causes the combo to be initialized with the value
     * in the input field, and for the selected value of the combo to be set on
     * the input field.
     * 
     * This function uses a unique class name rather than an ID to look up the
     * JSF component because it can be very hard to get a consistent JSF
     * component ID.
     * 
     * @param {Ext.form.ComboBox} combo  The combo box (or subclass) to bind.
     * @param {String} jsfInputComponentCls  A unique class name for the JSF
     *    component to bind to the given combo.
     */
    bindCombo: function(combo, jsfInputComponentCls) {

        var jsfInputElts =
            Ext.DomQuery.select('input[class=' + jsfInputComponentCls + ']');
        var jsfInputElt = jsfInputElts[0];
        
        // Initialize from the JSF input field.
        combo.setValue(jsfInputElt.value);

        // When the value is changed, copy back to the JSF input field.
        combo.on('select', function(box, record, index) {
            this.value = record.get('value');
        }, jsfInputElt); 
    }
};
