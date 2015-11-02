/* (c) Copyright 2009 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * The login pages are very light (ie - they only include the bare minimum
 * javascript includes).  This class provides a couple of static functions
 * that are available in other javascript files, but pared down to have as
 * no dependencies
 */

SailPoint.ns('SailPoint.Login');

/**
 * A keypress handler that can be added to text fields to submit a form
 * when the enter key is pressed.  This is similar to
 * SailPoint.SubmitOnEnter.
 *
 * @param  myfield     The text field that is listening.
 * @param  e           The keypress event.
 * @param  btnToClick  The button to click to submit the form.
 */
SailPoint.Login.submitenter = function(myfield, e, btnToClick) {
    var keycode;
    if (window.event) {
        keycode = window.event.keyCode;
    } else if (e) {
        keycode = e.which;
    }else{
        return true;
    }

    if (keycode === 13){
        document.getElementById(btnToClick).click();
        return false;
    } else {
        return true;
    }
};
