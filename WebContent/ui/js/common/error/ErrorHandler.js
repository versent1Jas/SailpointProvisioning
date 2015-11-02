/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

/* Error Handling class to help JAWS vocalize alerts on page load
 * in order to use this class every error message should be surrounded by a div with class .reader-error
 * additionally, there should be one div with id alertDiv that has role="alert" and aria-live="assertive"
 */
SailPoint.ns('SailPoint.ErrorHandler');

// have setErrorAlerts called after a short delay and ensure it has the correct dependencies
SailPoint.ErrorHandler.init = function (jQuery, document) {
    //Don't call until dom is ready'
    jQuery(function() {
            /* We need a short delay before filling in the role="alert" div so that the
             * reader can catch up */
            setTimeout(function(){
                SailPoint.ErrorHandler.setErrorAlerts(document);
            }, 50);
        }
    );
};

// add any error messages to alertDiv so JAWS will read the error messages immediately
SailPoint.ErrorHandler.setErrorAlerts = function (document) {
    if (document) {
        //class reader-error signifies an element with error text that should be alerted first
        var errorElements = document.querySelectorAll('.reader-error'),
            alertDiv = document.getElementById('alertDiv');

        if(alertDiv) {
            if (errorElements && errorElements.length > 0) {
                SailPoint.ErrorHandler.copyErrorAlerts(errorElements, alertDiv);
            } else {
                //hide the region from the screen reader if there are no errors
                alertDiv.setAttribute('aria-hidden', 'true');
            }
        }
    }
};

// helper function copies error messages into allertDiv to have JAWS read them immediately
SailPoint.ErrorHandler.copyErrorAlerts = function (errorElements, alertDiv) {
    if (!errorElements || !alertDiv) {
        return;
    }
    var errorElement, i, j, childNode;
    for (i = 0; i < errorElements.length; i++) {
        errorElement = errorElements[i];
        if (errorElement.hasChildNodes()) {
            for (j = 0; j < errorElement.childNodes.length; j++) {
                childNode = errorElement.childNodes[j];
                // Check for text nodes (type 3)
                if (childNode && childNode.nodeType === 3) {
                    alertDiv.appendChild(childNode.cloneNode(false));
                }
            }
        }
    }
};

SailPoint.ErrorHandler.setErrorMessages = function (scope, err) {
    if (err && err.data && err.data.message) {
        if ($.isArray(err.data.message)) {
            scope.errorMessages = (err.data.message).join('<br/>');
        }
        else {
            scope.errorMessages = err.data.message;
        }
    }
    else {
        scope.errorMessages = scope.unexpectedError || '#{msgs.js_error_unexpected}';
    }
};