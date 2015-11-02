/* (c) Copyright 2009 SailPoint Technologies, Inc., All Rights Reserved. */
Ext.ns('SailPoint', 'SailPoint.Pager');

//
// This file is used to support pager.xhtml which is not an Ext component, but
// is a shared component through the use of a JSF include and backing java
// class.
//
// Requires: SailPoint.SubmitOnEnter
//

/**
 * Static function used as a button finder for SubmitOnEnter to find the "Jump
 * to page" button for the given text field.  This assumes that the button is
 * the next sibling in the DOM.  SubmitOnEnter usually uses a buttonId to find
 * the button, but this doesn't work for this component because the ID is
 * unknown and can cause "duplicate component ID" JSF problems if we specify it.
 * 
 * @param  txtField  The page number input text field for the pager.
 */
SailPoint.Pager.findJumpToPageBtn = function(txtField) {
    return Element.nextSiblings(txtField)[0];
}

/**
 * Static function used to initialize the SubmitOnEnter for the given text
 * field, if it is not yet initialized.
 * 
 * @param  txtField  The input text field for which to initialize the
 *                   SubmitOnEnter.
 */
SailPoint.Pager.initJumpToPageSubmitOnEnter = function(txtField) {
    if (typeof txtField.submitOnEnter == 'undefined') {
        var submitOnEnter =
            new SailPoint.SubmitOnEnter(null, null, SailPoint.Pager.findJumpToPageBtn);
        submitOnEnter.registerTextField(txtField);
        txtField.submitOnEnter = submitOnEnter;
    }
}
