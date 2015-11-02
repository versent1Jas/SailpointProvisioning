/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

////////////////////////////////////////////////////////////////////////////////
//
// GENERAL FUNCTIONS
//
////////////////////////////////////////////////////////////////////////////////

function disableFormInputs() {
    $('configForm:saveButton').disabled = true;
    $('configForm:cancelButton').disabled = true;
}

function enableFormInputs() {
    $('configForm:saveButton').disabled = false;
    $('configForm:cancelButton').disabled = false;
}


////////////////////////////////////////////////////////////////////////////////
//
// SOURCE MAPPING MANAGEMENT
//
////////////////////////////////////////////////////////////////////////////////

// This object holds the currently selected source mapping for the purpose of reordering it
var currentSelection = {};

currentSelection.table = null;
currentSelection.row = null;
currentSelection.sequenceId = null;
currentSelection.sequenceIndex = null;

function selectMe(source) {
    resetSourceMappingTables();

    var selectedTable = $('sources');
    if (selectedTable.rows.length > 1) {
        currentSelection.table = selectedTable;
        selectedTable.className = 'selectionBox';
        var selectedRow = $(source);

        currentSelection.row = selectedRow;
        selectedRow.className = 'selectedSourceMapping';

        currentSelection.sequenceId = 'sources';
        currentSelection.sequenceIndex = getSequenceIndexForRow(selectedRow);

        var selectedArrows = $('selectionArrows');
        selectedArrows.style['display'] = '';
    }
}

function resetSourceMappingTables() {
    currentSelection.table = null;
    currentSelection.row = null;
    var allSourceTables = $('mappedSourceTable').getElementsByTagName('table');

    for (var i = 0; i < allSourceTables.length; ++i) {
        var currentTable = allSourceTables[i];
        if (allSourceTables[i].id == 'sources') {
          var rowsInTable = currentTable.rows;

          currentTable.className = 'selectionBox';
          // Reset all the other backgrounds to their defaults
          for (var j = 0; j < rowsInTable.length; ++j) {
              rowsInTable[j].className = '';
          }
        }
    }
}

// This function moves the current selection up a row
function moveMeUp() {
    if (currentSelection.row != null) {
        var currentRow = currentSelection.row;
        var currentRowIndex = currentRow.rowIndex;

        if (currentRowIndex > 0) {
            var targetRow = currentSelection.table.rows[currentRowIndex - 1];
            var targetRowContents = targetRow.cells[1].innerHTML;
            targetRow.cells[1].innerHTML = currentRow.cells[1].innerHTML;
            targetRow.className = 'selectedSourceMapping';
            currentRow.cells[1].innerHTML = targetRowContents;
            currentRow.className = '';
            currentSelection.row = targetRow;
            SequenceTracker.swapValue(currentSelection.sequenceId, currentSelection.sequenceIndex, -1);
            update();
        }
    }
}

// This function moves the current selection down a row
function moveMeDown() {
    if (currentSelection.row != null) {
        var currentRow = currentSelection.row;
        var currentRowIndex = currentRow.rowIndex;
        var numRows = currentSelection.table.rows.length;

        if (currentRowIndex < numRows - 1) {
            var targetRow = currentSelection.table.rows[currentRowIndex + 1];
            var targetRowContents = targetRow.cells[1].innerHTML;
            targetRow.cells[1].innerHTML = currentRow.cells[1].innerHTML;
            targetRow.className = 'selectedSourceMapping';
            currentRow.cells[1].innerHTML = targetRowContents;
            currentRow.className = '';
            currentSelection.row = targetRow;
            SequenceTracker.swapValue(currentSelection.sequenceId, currentSelection.sequenceIndex, 1);
            update();
        }
    }
}

// Update the newSourceOrder input parameter with the current source mappings
function update() {
    var sourceMappings = document.getElementsByClassName('selectionBox');
    var serializedMap = '[';

    sourceMappings.each(
        function(mapping) {
            var mappingID = mapping.id;
            serializedMap += '[' + mappingID + ': ' + SequenceTracker.sequence(mappingID) + '] ';
        });

    serializedMap += ']';

    $('configForm:newSourceOrder').value = serializedMap;
}

// Set the inputs needed for the back end to properly sort the attributes
function sortTable(newColumn) {
    var currentColumn = $('configForm:selectedSortColumn').value;

    if (currentColumn == newColumn) {
        // Toggle the direction if the user is clicking on the currently selected column
        var originalValue = $('configForm:sortAscending').value;
        $('configForm:sortAscending').value = ($('configForm:sortAscending').value != 'true');
    } else {
        // Reset the direction and change the column if the user is clicking on a different column
        $('configForm:selectedSortColumn').value = newColumn;
        $('configForm:sortAscending').value = true;
    }
}

function getSequenceIndexForRow(selectedRow) {
    var inputs = selectedRow.getElementsByTagName('input');
    return inputs[0].value;
}

// This function is used only for debugging
function dumpSequences() {
    var sourceMappings = document.getElementsByClassName('selectionBox');
    var alerttext = '';

    sourceMappings.each(
        function(mapping) {
            var mappingID = mapping.id;
            alerttext += mappingID + ': ' + SequenceTracker.sequence(mappingID) + '\n';
        });

    alert(alerttext);
}

function isAttributeID(id) {
    return beginsWith(id, 'mappedSourceTable:') && endsWith(id, 'attribute');
}


////////////////////////////////////////////////////////////////////////////////
//
// ADD SOURCE POPUP
//
////////////////////////////////////////////////////////////////////////////////

function showAddSourcePopup(editedAttribute) {
    var popup = Ext.getCmp('addSourceWindow');
    
    // Why does my window have a panel embedded in it?  Well, it's the only way to 
    if (!popup) {
        var addSrcMappingTpl = new Ext.Template("#{msgs.add_src_to_identity_attr}");
        popup = new Ext.Window({
            id: 'addSourceWindow',
            title: addSrcMappingTpl.apply([editedAttribute]),
            border: true,
            renderTo: 'addSourceDiv',
            items: [
                {
                    xtype : 'panel',
                    contentEl: 'addSourceContentsDiv',
                    layout: 'fit',
                    bodyStyle: 'background-color: #ffffff'
                }
            ],
            modal: true,
            autoScroll: true,
            closable: false,
            plain: true,
            width: 768,
            height: 300,
            layout: 'fit',
            buttons: [{
                text: '#{msgs.button_add}', 
                handler: function(){
                    var validationSucceeded = validateSourceCreation('configForm', editedAttribute);

                    if (validationSucceeded) {
                        var errorDiv = $('errorMessages');
                        Validator.hideErrors(errorDiv);
                        SequenceTracker.reset();
                        $('configForm:stealthAddSourceButton').click();
                    }  else {
                        var errorDiv = $('errorMessages');
                        Validator.displayErrors(errorDiv);
                    }

                    return validationSucceeded;
                }
            },{
                text: '#{msgs.button_cancel}',
                cls : 'secondaryBtn',
                handler: function() {
                    var errorDiv = $('errorMessages');
                    Validator.hideErrors(errorDiv);
                    clearAddSourceParams();
                    popup.hide();
                    enableFormInputs();
                }
            }],
            buttonAlign: 'center'
        });
    }
    
    disableFormInputs();
    
    popup.show();
    popup.alignTo('identityAttributeSettingsTbl', 't-t');
    $('addSourceContentsDiv').style.display = '';
    initSuggest();
}  // showAddSourcePopup()

function initSuggest() {
    var appSuggest = Ext.getCmp('appSuggest');
    if (!appSuggest) {
        appSuggest = new SailPoint.BaseSuggest({
            id: 'appSuggest',
            pageSize: 10,
            baseParams: {'suggestType': 'application'},
            renderTo: 'sourceAppsSuggest',
            binding: 'sourceApps',
            value: $('sourceApps').value,
            valueField: 'displayName',                        
            width: 300,
            emptyText: '#{msgs.select_application}'
        });
            
        appSuggest.on('select', function(suggestField, record, index) {
            $('sourceApps').value = record[0].data['displayName'];
            $('configForm:updateAppBtn').click();
        });
    }
}

function validateSourceCreation(formName, attributeName) {
    var isValid, sourceApplication, sourceRule;

    var sourceOption = getSelectedRadioInput(formName + ':sourceOption');

    if (sourceOption == 'APPLICATION') {
      sourceApplication = $('sourceApps').value;
      isValid = Validator.validateNonBlankString(sourceApplication, 'No application was selected.');

      if (isValid) {
        var sourceAttribute = $('configForm:sourceAttributes').value;
        isValid = Validator.validateNonBlankString(sourceAttribute, 'No attribute was selected.');
      }
    } else if (sourceOption == 'RULE') {
      sourceRule = $('configForm:sourceRules').value;
      isValid = Validator.validateNonBlankString(sourceRule, 'No rule was selected.');

    } else if (sourceOption == 'APPRULE') {

      sourceApplication = $('sourceApps').value;
      isValid = Validator.validateNonBlankString(sourceApplication, 'No application was selected.');

      sourceRule = $('configForm:sourceRules').value;
      isValid = Validator.validateNonBlankString(sourceRule, 'No rule was selected.');
    }

    return isValid;
}

// This works around a JSF behavior where JSF refuses to submit inputs from
// unrendered fields.  That behavior conflicts with the a4j model, where 
// previously unrendered components may become rendered.  Our strategy, therefore,
// is for JSF to render what we need and for us to hide components accordingly
function displayIdentitySourceSelectOptions() {
     var selectedOption = getSelectedRadioInput('configForm:sourceOption');
     if ((selectedOption == 'APPLICATION')) {
         $('appDiv').style.display = '';
         if ($('sourceApps') && $('sourceApps').value && $('sourceApps').value.length > 0) {
             $('attributesDiv').style.display = '';
         }
         else {
             $('attributesDiv').style.display = 'none';
         }
         $('ruleDiv').style.display = 'none';
     } else if (selectedOption == 'RULE' || selectedOption == 'IDENTITY_ATTR_RULE') {
         $('appDiv').style.display = 'none';
         $('attributesDiv').style.display = 'none';
         $('ruleDiv').style.display = '';
     } else if ( selectedOption == 'APPRULE') {
        $('appDiv').style.display = '';
         $('attributesDiv').style.display = 'none';
         $('ruleDiv').style.display = '';
     }
}

function clearAddSourceParams() {
    $('sourceApps').value = '';
    $('configForm:sourceAttributes').value = '';
    $('configForm:sourceRules').value = '';
    $('attributesDiv').style.display = 'none';
    if ($('configForm:addAsTargetCheckbox')) {
        $('configForm:addAsTargetCheckbox').checked = false;
    }
    var appSuggest = Ext.getCmp('appSuggest');
    if (appSuggest) { 
        appSuggest.clearValue();
    }
}


////////////////////////////////////////////////////////////////////////////////
//
// DELETE SOURCES POPUP
//
////////////////////////////////////////////////////////////////////////////////

function showDeleteSourcesPopup(editedAttribute) {
    var popup = Ext.getCmp('deleteSourcesWindow');
    
    // Why does my window have a panel embedded in it?  Well, it's the only way to 
    if (!popup) {
        var deleteSrcMappingTpl = new Ext.Template("#{msgs.delete_src_from_identity_attr}");
        popup = new Ext.Window({
            id: 'deleteSourcesWindow',
            title: deleteSrcMappingTpl.apply([editedAttribute]),
            border: true,
            renderTo: 'deleteSourceDiv',
            closable: false,
            items: [
                new Ext.Panel({
                    contentEl: 'deleteSourceContentsDiv',
                    layout: 'fit',
                    bodyStyle: 'background-color: #ffffff; overflow-y:auto'
                })
            ],
            modal: true,
            plain: true,
            width: 768,
            height: 300,
            layout: 'fit',
            buttons: [{
                text: '#{msgs.button_delete}', 
                handler: function() {
                    SequenceTracker.reset();
                    $('configForm:stealthDeleteSourcesButton').click();
                    enableFormInputs();
                }
            },{
                text: '#{msgs.button_cancel}',
                cls : 'secondaryBtn',
                handler: function() {
                    clearDeleteSourceParams();
                    popup.hide();
                    enableFormInputs();
                }
            }],
            buttonAlign: 'center'
        });
    }
    
    disableFormInputs();
    
    popup.show();
    popup.alignTo('identityAttributeSettingsTbl', 't-t');
    $('deleteSourceContentsDiv').style.display = '';
}

function clearDeleteSourceParams() {
    var inputsToUncheck = Ext.DomQuery.select('input[checked=true]', 'configForm:deleteSourceTable');
    var i;
    
    for (i = 0; i < inputsToUncheck.length; ++i) {
        inputsToUncheck[i].checked = false;
    }
}


////////////////////////////////////////////////////////////////////////////////
//
// ADD TARGET POPUP
//
////////////////////////////////////////////////////////////////////////////////

function showTargetPopup(editedAttribute, isAdd) {
    var titleTpl =
        (isAdd) ? new Ext.Template("#{msgs.add_identity_attr_target_title}")
                : new Ext.Template("#{msgs.edit_identity_attr_target_title}");
    var popup = new Ext.Window({
        id: 'addTargetWindow',
        title: titleTpl.apply([editedAttribute]),
        border: true,
        renderTo: 'addTargetDiv',
        items: [
            new Ext.Panel({
                contentEl: 'addTargetContentsDiv',
                layout: 'fit',
                bodyStyle: 'background-color: #ffffff'
            })
        ],
        modal: true,
        autoScroll: true,
        closable: false,
        plain: true,
        width: 768,
        height: 300,
        layout: 'fit',
        buttons: [{
            text: (isAdd) ? '#{msgs.button_add}' : '#{msgs.button_save}', 
            handler: function(){
                var valid = validateTarget();
                if (valid) {
                    var btn = (isAdd) ? 'configForm:stealthAddTargetButton'
                                      : 'configForm:stealthEditTargetButton';
                    $(btn).click();
                }  else {
                    Validator.displayErrors($('targetErrorMessages'));
                }
                return valid;
            }
        },{
            text: '#{msgs.button_cancel}',
            cls : 'secondaryBtn',
            handler: function() {
                closeTargetWindow();
            }
        }],
        buttonAlign: 'center'
    });

    // The app suggest is created outside of the window, so we need to
    // explicitly destroy it when the window is destroyed.
    popup.on('destroy', function(window, opts) {
        Ext.getCmp('targetAppSuggest').destroy();
    });
    
    disableFormInputs();
    
    popup.show();
    popup.alignTo('identityAttributeSettingsTbl', 't-t');
    $('addTargetContentsDiv').style.display = '';
    initTargetAppSuggest();
}

function closeTargetWindow() {
    Ext.getCmp('addTargetWindow').close();
    enableFormInputs();
}

function initTargetAppSuggest() {
    var appName = $('targetApp').value;
    var appSuggest = new SailPoint.BaseSuggest({
        id: 'targetAppSuggest',
        pageSize: 10,
        baseParams: {'suggestType': 'application'},
        renderTo: 'targetAppSuggest',
        binding: 'targetApp',
        initialData: appName,
        valueField: 'displayName',
        width: 300,
        emptyText: '#{msgs.select_application}'
    });

    appSuggest.on('select', function(suggestField, record, index) {
        $('targetApp').value = record[0].data['displayName'];
        $('configForm:updateTargetAppBtn').click();
    });
}

function validateTarget(formName) {
    var sourceApplication = $('targetApp').value;
    var appValid = Validator.validateNonBlankString(sourceApplication, '#{msgs.target_no_app_selected}');

    var sourceAttribute = $('configForm:targetAttribute').value;
    var attrValid = Validator.validateNonBlankString(sourceAttribute, '#{msgs.target_no_attr_selected}');

    return (appValid && attrValid);
}


////////////////////////////////////////////////////////////////////////////////
//
// IDENTITY ATTRIBUTE METHODS
//
////////////////////////////////////////////////////////////////////////////////

function validateAttributeCreation() {
    var isValid;

    var attributeName = $('createIdentityAttributeForm:attributeName').value;
    isValid = Validator.validateNonBlankString(attributeName, 'The name is missing.');

    if (isValid) {
      isValid = Validator.validateAlphanumericOrSpace(attributeName, 'The name contained non-alphanumeric characters.');
    }

    // Fix spaces
    var nameParts = attributeName.split(' ');
    var validName = nameParts[0];

    for (var i = 1; i < nameParts.length; ++i) {
        if (nameParts[i] != '') {
            validName += ' ';
            validName += nameParts[i];
        }
    }

    $('createIdentityAttributeForm:attributeName').value = validName;

    return isValid;
}

function setSearchableIfNeeded(isStandardAttribute) {
    var wasSetToGroupFactory = $('configForm:groupFactory').checked;
    var isSearchable;
      
    if (isStandardAttribute === false) {
        if (wasSetToGroupFactory === true) {
            isSearchable = $('configForm:extended').checked;
            if (isSearchable === false) {
                $('configForm:extended').click();
            }
        }
    }
}
  
function disableGroupFactoryIfNeeded() {
    var wasSetSearchable = $('configForm:extended').checked;
    var isGroupFactory;
      
    if (wasSetSearchable === false) {
        isGroupFactory = $('configForm:groupFactory').checked;
        if (isGroupFactory === true) {
            $('configForm:groupFactory').click();
        }
    }
}
  
function checkAttributeType(initialName, initialIsMulti, initialIsExtended) {
    var type = $('configForm:attributeType').value;
    var multiValued = $('configForm:multiValued');
    var extended = $('configForm:extended');
    if (initialName === 'manager') {
      multiValued.checked = false;
      multiValued.disable();
      if (extended) {
          extended.checked = false;
          extended.disable();                  
      }
      $('configForm:multiValuedCheckboxValue').value = false;
      $('configForm:searchableCheckboxValue').value = false;
    } else if (type === 'sailpoint.object.Identity') {
      multiValued.checked = false;
      multiValued.disable();
      if (extended) {
          extended.checked = true;
          extended.disable();                  
      }
      $('configForm:multiValuedCheckboxValue').value = false;
      $('configForm:searchableCheckboxValue').value = true;
    } else {
      multiValued.enable();
      multiValued.checked = initialIsMulti;
      if (extended) {
          extended.enable();
          extended.checked = initialIsExtended;                  
      }
      $('configForm:multiValuedCheckboxValue').value = initialIsMulti;
      $('configForm:searchableCheckboxValue').value = initialIsExtended;
    }
}
  
function copyCheckboxValuesFromFields() {
    var multiValued = $('configForm:multiValued');
    var extended = $('configForm:extended');
    if (multiValued) {
        $('configForm:multiValuedCheckboxValue').value = multiValued.checked;                
    }
    if (extended) {
        $('configForm:searchableCheckboxValue').value = extended.checked;                
    }
}

function copyCheckboxValuesToFields() {
    var multiValued = $('configForm:multiValued');
    var extended = $('configForm:extended');
    if (multiValued) {
        multiValued.checked = $('configForm:multiValuedCheckboxValue').value === "true";                
    }
    if (extended) {
        extended.checked = $('configForm:searchableCheckboxValue').value === "true";                
    }
}
