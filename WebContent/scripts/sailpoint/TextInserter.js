/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint'); 

/**
 * A TextInserter consists of two fields a text field and a select list.  When
 * a value is chosen from the select list, the selected value is inserted into
 * the text field.
 */
SailPoint.TextInserter = Class.create();
SailPoint.TextInserter.prototype = {

    /**
     * The text field element.
     */
    textField: null,

    /**
     * The text field element.
     */
    selectField: null,
    
    /**
     * Constructor.
     * 
     * @param  textFieldElt    The ID of the text field.
     * @param  selectFieldElt  The ID of the select field.
     */
    initialize: function(textFieldElt, selectFieldElt) {
        this.textField = $(textFieldElt);
        this.selectField = $(selectFieldElt);

        Event.observe(this.selectField, "change", this.insertElementFromSelect.bind(this), false);
    },

    /**
     * Insert the selected option's value into the text field, overwriting what
     * is currently selected if there is a selection.
     */
    insertElementFromSelect: function() {

        var selectedIdx = this.selectField.selectedIndex;
        if (selectedIdx > -1) {
            var selectedVal = this.selectField.options[selectedIdx].value;
            this.insertValue(selectedVal);
        }
    },

    /**
     * Insert the given value into the text field, overwriting what is currently
     * selected if there is a selection.
     * 
     * @param  selectedVal  The value to insert into the text field.
     */
    insertValue: function(selectedVal) {

        // IE uses the document selection.
        if (document.selection) {
            this.textField.focus();
            sel = document.selection.createRange();
            sel.text = selectedVal;
        }
        // Firefox uses selectionStart and selectionEnt.
        else if (this.textField.selectionStart || this.textField.selectionStart == '0') {
            var startPos = this.textField.selectionStart;
            var endPos = this.textField.selectionEnd;
            this.textField.value =
                this.textField.value.substring(0, startPos) +
                selectedVal +
                this.textField.value.substring(endPos, this.textField.value.length);
        }
        else {
            // Otherwise, just add it to the end.
            this.textField.value += selectedVal;
        }
    }
};