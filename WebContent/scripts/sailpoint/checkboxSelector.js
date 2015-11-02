/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

// This is a utility that can be used to toggle the checkboxes within a given table
// Sample (JSF-based) scenario:
// <h:column>
//   <f:facet name="header">
//     <h:selectBooleanCheckbox id="selectAllToggle" value="false" onclick="CheckboxSelector.toggleAll(this.id, this.checked, 'toggleMe');"/>
//   </f:facet>
//
//   <h:selectBooleanCheckbox id="checkbox" styleClass="toggleMe" value="#{someObj.selected[someObj.id]}"/>                            
// </h:column> 
// Author:  Bernie Margolis

// Constructor for the CheckboxSelector
function CheckboxSelectorInstance() {
    // This is a private function that helps determine the checkboxes' container.  
    // Note that the id of the 'all' checkbox is assumed to end in 'selectAllToggle,' as 
    // demonstrated in the sample scenario above.  Some details as to why this is needed
    // are provided below in the toggleAll function comments.
    function getTablePrefixForToggle(toggleId) {
        var endOfPrefix = toggleId.lastIndexOf(':selectAllToggle');
        return toggleId.substring(0, endOfPrefix);
    }
    
    // This function accepts three parameters: a toggle id that ends in 'selectAllToggle,' 
    // the new value to which all the checkboxes will be set, and an optional filterClass
    // parameter that specifies the class of checkbox elements that should be set.  If no
    // filterClass is specified, all the checkboxes in the table will be toggled.
    // See the sample scenario at the top of this file for more info. 
    // Forcing the id of the controlling checkbox to be 'selectAllToggle' is admittedly ugly,
    // but the alternative is to pass in the JSF-generated prefix for the table, which is 
    // potentially difficult.  I thought that this solution was the lesser of the two evils 
    // -- Bernie
    this.toggleAll = function(toggleId, newValue, filterClass) {
        var tableId = getTablePrefixForToggle(toggleId);
        var inputs;
        
        if (filterClass) {
            inputs = $(tableId).getElementsByClassName(filterClass);
        } else {
            inputs = $(tableId).getElementsByTagName('input');
        }
        
        for (var i = 0; i < inputs.length; ++i) {
            if (inputs[i].type == 'checkbox') {
                inputs[i].checked = newValue;
            }
        }
    }
}

var CheckboxSelector = new CheckboxSelectorInstance();
