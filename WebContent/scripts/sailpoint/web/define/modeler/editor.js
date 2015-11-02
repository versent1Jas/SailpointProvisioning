/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

// Editor
// 
// This Object helps us keep track of and respond to changes on editors.
// 
// Author: Bernie Margolis

var Editor = {
    isPageDirty : false,
    displayElements: null,
    enableElements: null,

    setPageDirty: function(isDirty) {
        var i;
        var displayElement;
        var enableElement;
        
        this.isPageDirty = isDirty;
        
        if (isDirty === true) {
            if (this.displayElements) {
                for (i = 0; i < this.displayElements.length; ++i) {
                    displayElement = this.displayElements[i];
                    if (displayElement && displayElement.style !== undefined) {
                        displayElement.style['visibility'] = 'visible';
                    }
                }
            }
            
            if (this.enableElements) {
                for (i = 0; i < this.enableElements.length; ++i) {
                    enableElement = this.enableElements[i];
                    if (enableElement && enableElement.disabled !== undefined) {
                        enableElement.disabled = false;
                    }
                }
            }
        } else {
            if (this.displayElements) {
                for (i = 0; i < this.displayElements.length; ++i) {
                    displayElement = this.displayElements[i];
                    if (displayElement && displayElement.style !== undefined) {
                        displayElement.style['visibility'] = 'hidden';
                    }
                }
            }        

            if (this.enableElements) {
                for (i = 0; i < this.enableElements.length; ++i) {
                    enableElement = this.enableElements[i];
                    if (enableElement && enableElement.disabled !== undefined) {
                        enableElement.disabled = true;
                    }
                }
            }
        }
    },

    // This function returns an object whose default values are backed by the Editor
    // object.  The advantage of this is that we can set isPageDirty on the instance 
    // without affecting other instances of the Editor object.  
    // 
    // Parameters:
    // displayElements - an array containing elements that we want to hide 
    // when the page is clean and display when the page is dirty.  This may be some 
    // text or an icon
    // 
    // enableElements - an array containing elements that we want to disable when
    // the page is clean and enable when the page is dirty.  An input button is a 
    // good example of such an element
    instance: function(displayElements, enableElements) {
        function EditorInstance(someDisplayElements, someEnableElements) {
            this.displayElements = someDisplayElements;
            this.enableElements = someEnableElements;
        }
        
        EditorInstance.prototype = this;     
        return new EditorInstance(displayElements, enableElements);
    }
};
