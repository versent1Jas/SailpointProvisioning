/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.AttributeEditor');

SailPoint.initAttributeEditor = function(type, alwaysCreateNew) {
    var queryString;
    var attributeEditors;
    var i;
    
    if (type) {
        queryString = 'table[id*=' + type + ']';
    } else {
        queryString = 'table[id*=ttributeEditorTable]';        
    }
    
    attributeEditors = Ext.DomQuery.select(queryString);
    
    for (i = 0; i < attributeEditors.length; ++i) {
        SailPoint.AttributeEditor.initEditableDates(attributeEditors[i], alwaysCreateNew);
        SailPoint.AttributeEditor.initReadOnlyDates(attributeEditors[i], alwaysCreateNew);
        SailPoint.AttributeEditor.initIdentitySuggests(type, attributeEditors[i], alwaysCreateNew);
        SailPoint.AttributeEditor.initTooltips(attributeEditors[i], alwaysCreateNew);
    }
}

SailPoint.AttributeEditor.setFocus = function(linkId) {
    var editorTable = Ext.get('linkAttributeEditorTable_' + linkId);
    if (editorTable != null) {
        editorTable.select('input:first').focus();
    }
}

SailPoint.AttributeEditor.initEditableDates = function(table, alwaysCreateNew) {
    var dateFields = Ext.DomQuery.select('div[class=dateField]', table);
    var i;
    var dateField;
    var dateInputs;
    var dateInput;
    var dateTimeInput;
    
    for (i = 0; i < dateFields.length; ++i) {
        dateField = dateFields[i];

        dateInputs = Ext.DomQuery.select('input', dateField);
        dateInput = dateInputs[0];

        dateTimeInput = new SailPoint.DateTimeInput({
            inputEl: dateInput, 
            renderTo: dateField.id
        });
        
        var form = Ext.get(dateField).parent('form', true);
        Ext.EventManager.on(form, 'submit', SailPoint.AttributeDateValidator, dateTimeInput);
    }
}

SailPoint.AttributeEditor.initReadOnlyDates = function(table, alwaysCreateNew) {
    var dateFields = Ext.DomQuery.select('div[class=readOnlyDateField]', table);
    var i;
    var dateField;
    var dateInputs;
    var dateInput;
    var dateInMillis;
    var dateToDisplay;
    var displayDivs;
    var displayDiv;
    
    for (i = 0; i < dateFields.length; ++i) {
        dateField = dateFields[i];

        dateInputs = Ext.DomQuery.select('div[class=readOnlyDateInput]', dateField);
        dateInput = dateInputs[0];

        dateInMillis = Number(dateInput.innerHTML);
        dateToDisplay = SailPoint.Date.DateTimeRenderer(dateInMillis);
        
        displayDivs = Ext.DomQuery.select('div[class=readOnlyDateDisplay]', dateField);
        displayDiv = displayDivs[0];
        
        Ext.DomHelper.overwrite(displayDiv, dateToDisplay);
    }
}

SailPoint.AttributeEditor.initIdentitySuggests = function(type, table, alwaysCreateNew) {
    
    var i, idInputDiv, idRawInputs, idRawInput, idJSFInputs,
        idJSFInput, idSuggest, rawValue;
    
    var idInputDivs = Ext.DomQuery.select('div[class=identitySuggest]', table);
    
    for (i = 0; i < idInputDivs.length; ++i) {
    	idInputDiv = idInputDivs[i];
    	idRawInputs = Ext.DomQuery.select('span[class=suggestRawInput]', idInputDiv);
    	idRawInput = idRawInputs[0];        
    	idJSFInputs = Ext.DomQuery.select('input[type=hidden]', idInputDiv.parentNode);
    	idJSFInput = idJSFInputs[0];
    	if(idRawInput){
	        rawValue = idRawInput.innerHTML;
	        Ext.get(idRawInput).parent().dom.removeChild(idRawInput);
    	}
        
        var config = {
            renderTo: idInputDiv, 
            binding: idJSFInput,
            allowBlank: true,
            baseParams: {context: 'IdentityAttribute'}
        };

        var names = Ext.DomQuery.select('input[class=suggestName]', idInputDiv);
        var name;
        if (names.length > 0) {
            name = names[0].value;
        }

        if (typeof(type) != 'undefined' && name && name != 'manager')  {
          config.id = type + '_IdentityAttribute_' + (i+1);  
        } else {
            if (name) {
                if (name.toLowerCase() == 'manager') {
                    config.id = 'IdentityManagerAttribute';
                } else {
                    config.id = name;
                }
            }
        }
        
        if (alwaysCreateNew) {
	        idSuggest = new SailPoint.IdentitySuggest(config);
        } else {
	        idSuggest = Ext.getCmp(config.id);
    	    if(!idSuggest) {
        	    idSuggest = new SailPoint.IdentitySuggest(config);
        	}
        }
        if(rawValue) {
	        idSuggest.setRawValue(rawValue);
	        // Assume it's a userIcon and not a groupIcon.  Not sure if there's an easy way to tell.
	        SailPoint.Suggest.IconSupport.setIconDiv(idSuggest, 'userIcon');
        }
        if(SailPoint.identity && SailPoint.identity.setTabPanelHeight) {
            if(Ext.isFunction(SailPoint.identity.setTabPanelHeight)) {
            	SailPoint.identity.setTabPanelHeight(); //adjust the tab panel height to account for all the new inputs.
            }
        }
    }
}

// This function makes sure that a date is valid before it is submitted.
// It assumes that it's being called in the scope of the input in question
SailPoint.AttributeDateValidator = function(eventObj, formElement, options) {
    var dateTimeInput = this;
    var row = dateTimeInput.getEl().parent('tr');
    // todo rshea bug #18307: guarding against null row here. This prevents
    // js error on cancel in role editor for now, but we need to figure
    // out why it's returning null in the first place.
    if (row) {
        var errorDiv = row.down('div[class=formError]');

        if (dateTimeInput.isValid()) {
            errorDiv.setStyle('display', 'none');
        } else {
            errorDiv.setStyle('display', '');
            eventObj.preventDefault();
        }
    }
};

/**
 * Hide the specified attributes
 * @cfg {String} type Type of attribute editor
 * @cfg {Array} attributesToHide array of strings containing the names of the hidden attributes
 */
SailPoint.AttributeEditor.updateHiddenAttributes = function(options) {
    var attributesToHide = options ? options.attributesToHide : null, 
    numAttributesToHide = (attributesToHide && attributesToHide.length) ? attributesToHide.length : 0,
    type = options ? options.type : 'unknown',
    queryString = type ? ('table[id*=' + type + ']') : 'table[id*=ttributeEditorTable]',
    attributeEditors = Ext.dom.Query.select(queryString),
    numAttributeEditors = (attributeEditors && attributeEditors.length) ? attributeEditors.length : 0,
    mapOfAttributesToHide = {},
    currentEditor, numTotalAttributes, currentAttribute, currentAttributeName, hideCurrentAttribute, i, j;
    
    /**
     * This function is private to the SailPoint.AttributeEditor.hideAttributes method.  
     * It shows the attribute associated with the specified "attributeName" span element.
     * This function assumes the following structure for an edited attribute:
     * <pre>
     *   <tr>
     *    <td>
     *      <span class="attributeName" style="display:none" value="name of attribute"/> ...
     *    </td> ...
     *   </tr>
     * </pre>
     * If that structure ever changes this method will have to change accordingly
     * @param span element of class "attributeName" that contains the name of the attribute being shown
     * @param show true to show the attribute; false to hide it 
     */
    function displayAttribute(span, show) {
        var parentRow;
        
        if (span) {
            parentRow = Ext.fly(span).findParent('tr');
            if (show) {
                Ext.fly(parentRow).setVisibilityMode(Ext.dom.Element.DISPLAY).show();       
            } else {
                Ext.fly(parentRow).setVisibilityMode(Ext.dom.Element.DISPLAY).hide();
            }
        }
    }

    /**
     * Cache a map of attributes to hide so that we can easily determine
     * whether to show or hide attributes as we iterate over attributes
     */  
    for (i = 0; i < numAttributesToHide; ++i) {
        mapOfAttributesToHide[attributesToHide[i]] = true;
    }

    // Iterate over all the attribute editors on the page
    for (i = 0; i < numAttributeEditors; ++i) {
        currentEditor = attributeEditors[i];
        attributesToShowOrHide = Ext.dom.Query.select('span[class*=attributeName]', currentEditor);
        numTotalAttributes = (attributesToShowOrHide && attributesToShowOrHide.length) ? attributesToShowOrHide.length : 0;
        // Iterate over all the attributes on each editor
        for (j = 0; j < numTotalAttributes; j++) {
            currentAttribute = attributesToShowOrHide[j];
            currentAttributeName = currentAttribute.innerHTML ? currentAttribute.innerHTML.trim() : '';
            hideCurrentAttribute = mapOfAttributesToHide[currentAttributeName];
            // Show or hide the attribute as needed
            displayAttribute(attributesToShowOrHide[j], !hideCurrentAttribute);
        }
        
    }
};

// need to call this again when the page reloads on role type change
SailPoint.AttributeEditor.initTooltips = function(table, alwaysCreateNew) {
  buildTooltips(table);
}

// This will effectively no-op in most cases, but it is useful during debugging because
// it initializes the suggests when a page refresh to be performed.  If this is taken out,
// we have to leave the page and come back to clear out the edit state so we can trigger
// initialization
// TQM: this was creating problem when we want to init attributeeditor with 'type' information
//  so removing it. 
//Ext.onReady(SailPoint.initAttributeEditor);

