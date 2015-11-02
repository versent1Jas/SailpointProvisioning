Ext.ns('SailPoint', 'SailPoint.certification');

function addRemediation(element, roleName){
  var elementToRemove;
  // add the role to the selectedRolesToRemediate list. Or remove it if they
  // unchecked the role.
  if (element.checked){
      var newListElement = document.createElement('li');
      newListElement.setAttribute('id', 'li_' + element.id);
      newListElement.innerHTML = roleName;
      $('selectedRolesToRemediate').appendChild(newListElement);
  } else {
      /* Clicking like mad can cause weirdness in IE.  Ensure that the element
       * we are trying to remove still exists. */
      elementToRemove = $('li_' + element.id);
      if(elementToRemove) {
        $('selectedRolesToRemediate').removeChild(elementToRemove);
      }
  }
  $('actionForm:submitRemediationTargetsButton').disabled = (($('requirePolicyBusinessRoles').value === 'true')
                                                              && (!Validator.validateAtLeastOneChecked($$('input.BizRole'), '#{msgs.err_no_roles_selected}')));
      
}

//if the user is not mitigating, but they have entered an invalid date,
// reset the date so it passes validation.
function resetDate(){
    if (!Validator.validateInputDate('actionForm:expiration', '')){
        $('actionForm:expiration.day').value = '01';
        $('actionForm:expiration.month').selectedIndex = 1;
        $('actionForm:expiration.year').value=new Date().getFullYear();
    }
}

function validateRemediationItems(){

  var requireBusinessRoleSelection = $('requirePolicyBusinessRoles').value === 'true';
  if (requireBusinessRoleSelection && 
          !Validator.validateAtLeastOneChecked($$('input.BizRole'), '#{msgs.err_no_roles_selected}')){
      Validator.displayErrors($('certificationActionError'));
      return false;
  }

  clearErrors();
  return true;
}

function validateSubmit(){

  var currentAction = $('actionForm:selectedAction').options[$('actionForm:selectedAction').selectedIndex].value;

  if (currentAction === 'Allow'){
      if (!Validator.validateInputDate('actionForm:expiration', '#{msgs.err_expiration_past}', true)){
          Validator.displayErrors($('certificationActionError'));
          return false;
      }
  }

  var ownerCmp = Ext.getCmp('policyViolationDetailOwnerName');
  if (currentAction === 'Remediate' || currentAction === 'Delegate'){
      // checking for 'null' here just to handle a rare mystery bug in the suggest comp
      if (!ownerCmp.validate()){
            return false;
      }
  }

  // last minute 3.0 hack to enable to owner name suggest before submit. Otherwise the value
  // is not submitted if the field is disabled
  if (Ext.getCmp('ownerNameSuggest')) {
      Ext.getCmp('ownerNameSuggest').enable();
  }

  var ownerValue;
  if (ownerCmp) {
      ownerValue = ownerCmp.assigneeSuggest.getValue();
  }
  //if the default remediator is set and the owner is not, use the default remediator
  if ((!ownerValue || ownerValue === '') && $('actionForm:defaultRemediatorName').value)  {
      ownerValue = $('actionForm:defaultRemediatorName').value;
  }
  if (ownerValue) {
      $('actionForm:ownerId').value = ownerValue;
  } 

  clearErrors();
  return true;
}

function clearErrors(){
  $('certificationActionError').innerHTML = '';
  Element.hide($('certificationActionError'));
}

function disableAllCheckboxes(){
  var checkboxes = Ext.query("input[type=checkbox]");
  Ext.each(checkboxes, function(obj_item) {
              obj_item.disabled = true;
          });
  // Reenable last button?
}

function onSelectAction(selectedAction) {
    
  if (selectedAction === 'Certify'){
      $('actionForm:certifyButton').click();
      return true;
  }

  clearErrors();
//  $$( 'input.ViolationForm', 'div.ViolationForm','tr.ViolationForm', 'table.ViolationForm', 'div.ViolationForm' , 'entitlementSodViolationPanel' ).each(Element.hide);
  var pvdon = Ext.getCmp('policyViolationDetailOwnerName');
  if (pvdon) {
      pvdon.assigneeSuggest.clearValue();      
  }

  if (selectedAction != 'Allow'){
      resetDate();
  }

  // if the policy type doesnt require selecting business roles to remediate, skip ahead to assignment form
  var requireBusinessRoleSelection = $('requirePolicyBusinessRoles').value === 'true';
  var isEntitlementSodViolation = $('isEntitlementSodViolation').value === 'true';
  
  // pre-populate the description with the canned remediation desc text
  if (selectedAction === 'Remediate')
      $('actionForm:description').value = $('remediationDescription').value;

  // if it's a remed and they need to select biz roles, show the remedition advisor
  if (selectedAction === 'Remediate' && requireBusinessRoleSelection &&
          $('remediationAdvisor').style.display === "none"){
      // reset(hide) all the crap in the form
      $$('input.ViolationForm', 'div.ViolationForm','tr.ViolationForm', 'table.ViolationForm', 'div.ViolationForm', 'entitlementSodViolationPanel').each(Element.hide);          

      Element.show($('remediationAdvisor'));
      $('actionForm:submitRemediationTargetsButton').disabled = !( areViolationsSatified() );
      Element.show($('actionForm:submitRemediationTargetsButton'));
      return;
  }
  
  if( selectedAction === 'Remediate' && isEntitlementSodViolation && $( 'entitlementSodViolationPanel' ).style.display === 'none' ) {
      $$( 'input.ViolationForm', 'div.ViolationForm', 'tr.ViolationForm', 'table.ViolationForm', 'div.ViolationForm' ).each( Element.hide );          
      Element.show( $( 'entitlementSodViolationPanel' ) );
      $('actionForm:submitRemediationTargetsButton').disabled= !( areViolationsSatified() );
      Element.show($('actionForm:submitRemediationTargetsButton'));
      return;
  }

  if (selectedAction === 'Delegate'){
      // pre-populate the description with the canned remediation desc text
      $('actionForm:description').value = $('delegationDescription').value;
  }

  // reset(hide) all the crap in the form
  $$('input.ViolationForm', 'div.ViolationForm','tr.ViolationForm', 'table.ViolationForm', 'div.ViolationForm').each(Element.hide);
  Element.hide( $( 'entitlementSodViolationPanel' ) );

  if (selectedAction != ''){
      $$('input.' + selectedAction ,'tr.' + selectedAction, 'table.' + selectedAction, 'div.' + selectedAction).each(Element.show);
      $('actionForm:submitActionButton').value=decisionTextMap[selectedAction];
      Element.show($('actionForm:submitActionButton'));
  }
  
  if(selectedAction === 'Remediate' || selectedAction === 'Delegate') {
      // init the ownerName Suggest as this is the first time component is being displayed
      initOwnerNameSuggest();
      
      if(pvdon) {
          pvdon.updateLayout();
      }
  }
}

/**
 * Initialize the suggest component that will set the owner of the violation work item.  The process works as follows:
 * When a role being remediated as part of the correction has a multiple applications in its profile the screen it: 
 *   Defaults to the Global Revoker group set in the System Config 
 *   Allows to be assigned to self, defaults to self Yes 
 *
 * When a role being remediated as part of the correction has a single applications in its profile the screen it: 
 *   Defaults to the Revoker of the Application the role is part of 
 *   Allows for the action to be assigned to self, defaults to self 
 *   Allows for selection of the Revoker of the Application the role is part of 
 *   Allows for selection of the Owner of the Application the role is part of. 
 */
function initOwnerNameSuggest() {
    // get the list of combo options which will populate the right side (quickAssign) combo
    var assignmentOptionsElement = $('quickAssignmentOptionsJson');
    if (assignmentOptionsElement) {
        
        var assignmentHTML = assignmentOptionsElement.innerHTML;
        if (assignmentHTML.length > 0) {
            var assignmentOptions = Ext.decode(assignmentHTML);
            if (Ext.get('ownerNameSuggest')){
                var assigneeSelect = Ext.create('SailPoint.AssigneeSelector', {
                    id: 'policyViolationDetailOwnerName',
                    renderTo: 'ownerNameSuggest',
                    width: 600,
                    allowBlank: false,
                    quickAssignOptions: assignmentOptions['quickAssignmentOptions'],
                    baseParams: {context : 'Owner'}
                });

                // Apply the initial value
                var optionsCombo = assigneeSelect.quickAssign;
                var optionsStore = optionsCombo.getStore();
                // Default to the revoker when available
                var initialOption = optionsStore.findRecord('field2', '#{msgs.assign_default_remediator}');
                if (initialOption) {
                    optionsCombo.select(initialOption);
                    // Fire the event manually because Ext.form.field.ComboBox is stupid and won't 
                    // fire when a selection is programatically made
                    optionsCombo.fireEvent('select', optionsCombo, [initialOption]);
                }
            }
        }
    }
}

function handleSelectedEntitlements() {
    var selectedEntitlements = getSelectedEntitlements();
    populateSelectedEntitlementList( document.getElementById( 'SelectedEntitlementsDiv' ), selectedEntitlements );
    $( 'actionForm:selectedEntitlementsJson' ).value = Ext.encode( selectedEntitlements );
}

// This Entitlement Violation Stuff should probably be refactored into a seperate class
// todo using a global like this is a bad idea - jfb
var violationsTree;

/* returns true if violationsTree is satisfied */
function areViolationsSatified() {
    if( violationsTree ) {
        return areViolationsSatisfiedRec( violationsTree );
    }
    return false; 
}

function getSelectedEntitlements() {
    if( violationsTree ) {
        return getSelectedEntitlementsRec( violationsTree );
    }
}

function cloneViolationsTree(){
    if( violationsTree ) {
        return SailPoint.clone( violationsTree );
    }
}

function setViolationsTree(tree){
    violationsTree = tree;
}

function getSelectedEntitlementsRec( violations ) {
    var response = [];
    if( !hasChildren(violations) ) {
        if( violations.selected ) {
            response[ 0 ] = violations;
            return response;
        }
        return response;
    } else {
        Ext.each( violations.children, function( child ) { 
            response = response.concat( getSelectedEntitlementsRec( child ) );
        } );
    }
    return response;
}

function populateSelectedEntitlementList( div, violations ) {
    if( !violations ) {
        return;
    }
    while( div.hasChildNodes() ) {
        div.removeChild( div.firstChild );
    }
    var li, ul = document.createElement( 'ul' );
    div.appendChild( ul );
    
    Ext.each( violations, function( violation ) { 
        li = document.createElement( 'li' );
        li.appendChild( document.createTextNode( getViolationDisplayableApplicationName( violation ) + ' ' + getViolationDisplayableValue(violation) ) );
        ul.appendChild( li );
    } );
         
    Element.show( div );
}

/* Recursive function that returns true if violationsTree is satisfied */
function areViolationsSatisfiedRec( root ) {

    var response;

    if( !hasChildren(root) ) {
        return root.selected;
    }
    if( root.andOp === true ) {
        response = true;
        Ext.each( root.children, function( child ) {
            var selected = areViolationsSatisfiedRec( child );
            if( !selected ) {
                response = false;
            }
        } );
    } else {
        response = false;
        Ext.each( root.children, function( child ) {
            var selected = areViolationsSatisfiedRec( child );
            if( selected ) {
                response = true;
            }
        } );
    }
    
    return response;
}

/*
*Initializes violationTree and dynamically builds display e
* */
function createEntitlementSodViolationTable( button ) {
    if( !$( 'entitlementViolationsJson' ).value ) {
        return;
    }

    violationsTree = Ext.decode( $( 'entitlementViolationsJson' ).value );
    var table = createViolationTable();
    table.id = 'EntitlementSodViolationTable';

    createEntitlementSodViolationNode( violationsTree, table, button );

    document.getElementById( 'EntitlementSodViolationTableDiv' ).appendChild( table );
}


/*
* Added this so we can call this from a dialog.
* */
function createEntitlementSodViolationTableFromDialog(tree, button) {
    violationsTree = tree;
    var table = createViolationTable();
    table.id = 'EntitlementSodViolationTable';

    createEntitlementSodViolationNode( violationsTree, table, button );

    //bug21600 making sure the tool tips are added
    var entitlementSodViolationTable = document.getElementById( 'EntitlementSodViolationTableDiv' );
    entitlementSodViolationTable.appendChild( table );
    buildTooltips(entitlementSodViolationTable);
}

function createEntitlementSodViolationNode( violation, table, button ) {
    if( !hasChildren(violation) ) {
        createEntitlementSodViolationOrLeaf( violation, table, button );
    } else {
        if( violation.andOp === true ) {
            createEntitlementSodViolationAndNode( violation, table, button );
        } else {
            createEntitlementSodViolationOrNode( violation, table, button );
        }
    }
}

function createEntitlementSodViolationOrNode( violation, table, button ) {
    /* Non-leaf rows are new tables with a header describing the action that should be taken */
    var row = table.insertRow( 0 );
    var cell = row.insertCell( 0 );
    cell.style.paddingLeft = '8px';
    cell.style.paddingRight = '8px';
    var newTable = createSpTable();
    newTable.style.borderBottom = '1px #cccccc solid';
    cell.appendChild( newTable );
    
    Ext.each( violation.children, function( node ) {
        createEntitlementSodViolationNode( node, newTable, button );
    } );
    
    createHeaderRow( newTable, '#{msgs.violation_entitlement_sod_revoke_at_least_one}', 1 );
}

function createEntitlementSodViolationAndNode( violation, table, button ) {
    /* Create a new row */
    var row = table.insertRow( 0 );
    /* insert a table into that row */
    var cell = row.insertCell( 0 );
    cell.style.paddingLeft = '8px';
    cell.style.paddingRight = '8px';
    var andTable = createSpTable();
    andTable.style.borderBottom = '1px #cccccc solid';
    cell.appendChild( andTable );
    /* Add a row to the new table */
    row = andTable.insertRow( 0 );
    cell = row.insertCell( 0 );

    var itemStatus = getNodeStatus(violation);

    /* Add a check box that selects all direct children that are leafs */
    var checkBox = createViolationCheckBox( violation, itemStatus );
    cell.appendChild( checkBox );
    cell.width="20";
    /* Add a table with all children */
    cell = row.insertCell( 1 );
    var newTable = document.createElement( 'table' );
    newTable.width = '100%';
    cell.appendChild( newTable );
    Ext.each( violation.children, function( child ) {
        if( !hasChildren(child) ) {
            createEntitlementSodViolationAndLeaf( child, newTable );
        } else {
            createEntitlementSodViolationNode( child, newTable, button );
        }
    } );

    if (!itemStatus){
        checkBox.onclick = function() {
            Ext.each( violation.children, function( child ) {
                if( !hasChildren(child) ) {
                    child.selected = checkBox.checked;
                }
            } );
            var isSatisfied = areViolationsSatified();
            if (button.setDisabled){
                button.setDisabled(!isSatisfied);
            } else {
                button.disabled = !isSatisfied;
            }
        };
    }
    createHeaderRow( andTable, '#{msgs.violation_entitlement_sod_revoke_all}', 2 );
}

/*
 * Adds a header row to the top of table, optionally setting the colspan of
 * the th element.
 */
function createHeaderRow( table, msg, colSpan ) {
    var headerRow = table.insertRow( 0 );
    var headerCell = document.createElement( 'th' );
    if (colSpan && colSpan > 1) {
        headerCell.colSpan = colSpan;
    }
    var headerText = document.createTextNode( msg );
    headerCell.appendChild( headerText ); 
    headerRow.appendChild( headerCell );
}

function createEntitlementSodViolationAndLeaf( violation, table, button ) {
    var row = table.insertRow( 0 );
    var cell = row.insertCell( 0 );
    populateEntitlementCell( cell, violation );

    var statusMsg = getNodeStatusMessage(violation);
    if (statusMsg && statusMsg != ""){
        var infoCell = row.insertCell(-1);
        var infoNode = document.createElement("span");
        infoNode.innerHTML = statusMsg;
        infoCell.appendChild(infoNode);
    }
}

function populateEntitlementCell( cell, violation ) {
    var src = SailPoint.getRelativeUrl('/images/icons/dashboard_help_16.png');
    var text = getViolationDisplayableApplicationName( violation ) + ' ' + getViolationDisplayableValue(violation);
    var cellContent = Ext.String.format('{0} <img id="imgHlp_{1}" style="padding-left:10px" src="{2}" alt="{3}" title=""/>', text, violation.name + violation.value ,src, violation.description);
    cell.innerHTML = cellContent;
}

function createEntitlementSodViolationOrLeaf( violation, table, button ) {
    var row = table.insertRow( 0 );
    var cell = row.insertCell( 0 );

    var rowTable = document.createElement( 'table' );
    rowTable.width = '100%';
    cell.appendChild( rowTable );
    row = rowTable.insertRow( 0 );
    cell = row.insertCell( 0 );

    var itemStatus = getNodeStatus(violation);

    var checkBox = createViolationCheckBox( violation, itemStatus );
    if (!itemStatus){
        checkBox.onclick = function() {
            violation.selected = checkBox.checked;
            var isSatisfied = areViolationsSatified();

            // check to see if we're dealing with a dom element or
            // an EXT JS button and use appropriate method. The cert
            // UI dialog uses an ext button here.
            if (button.setDisabled){
                button.setDisabled(!isSatisfied);
            } else {
                button.disabled = !isSatisfied;
            }
        };
    }
    populateEntitlementCell( cell, violation );
    cell = row.insertCell( 0 );
    cell.appendChild( checkBox );
    cell.width="20";

     var statusMsg = getNodeStatusMessage(violation);
    if (statusMsg && statusMsg != ""){
        var infoCell = row.insertCell(-1);
        var infoNode = document.createElement("span");
        infoNode.innerHTML = statusMsg;
        infoCell.appendChild(infoNode);
    }
}

function getNodeStatusMessage(node){
    if (!node.status)
        return "";

    var status = getNodeStatus(node);

    return SailPoint.certification.ViolationRemediationDialog.getDependantDecisionText(status);
}

SailPoint.STATUS_MULTIPLE = "multiple decision";

function getNodeStatus(node){

    var i, status, child, action, nodeStatus = null;

    if (node.status){
        for(i = 0; i < node.status.length; i++){
            status = node.status[i];

            action = getUnsavedNodeStatus(status.associatedItemId, status.associatedEntityId);
            if (!action) {
                action = status.action;
            }

            if (!nodeStatus){
                nodeStatus = action;
            } else if (nodeStatus != action){
                return SailPoint.STATUS_MULTIPLE;
            }
        }
    } else if (node.children && node.children.length > 0){

        // Loop through the child statuses and determine
        // 1. Do all items have the same action?
        // 2. Is there a mix of actions (including no action)
        for(i = 0; i < node.children.length; i++){
            child = node.children[i];
            status =  getNodeStatus(child);

            // We only want to return a consistent value if all items
            // are the same as the first status value
            if (i === 0){
                nodeStatus = status;
            } else if (status != nodeStatus){
                return SailPoint.STATUS_MULTIPLE;
            }
        }
    }

    return nodeStatus;
}

function getUnsavedNodeStatus(itemId, entityId){
    var status = null;
    var decider = SailPoint.Decider.getInstance();
    var statuses = ['Remediated', 'RevokeAccount', 'Cleared', 'Delegated', 'Approved', 'Mitigated'];
    var decision = decider.findDecisionByItemProperties(itemId, entityId, null, statuses);
    if (decision != null && decision.status){
        status = decision.status;
    }

    return status === SailPoint.Decision.STATUS_CLEARED ? null : status;
}

function getViolationDisplayableApplicationName( violation ) {
 return ( violation.application == null ? "IdentityIQ" : violation.application )
}

function getViolationDisplayableValue(violation) {
    return (violation.displayValue) ? violation.displayValue : violation.name + ' ' + violation.value;
}

function createViolationCheckBox( violation, status ) {

    var isChecked = areViolationsSatisfiedRec(violation),
        checkBox;

    if (status){
        isChecked = (status === SailPoint.Decision.STATUS_REVOKE || status === SailPoint.Decision.STATUS_REVOKE_ACCT);

        if (isChecked) {
            violation.selected=true;
        }

        var html = "<input name='violationCheckBox' type='checkbox' disabled='true'";
        if (isChecked) {
            html += " checked='true' ";
        }
        html += "/>";

        html += "<input name='violationCheckBox' style='display:none' type='checkbox' ";
        if( isChecked ) {
            html += " checked='true' ";
        }
        html += ">";

        checkBox = document.createElement( "span" );
        checkBox.innerHTML = html;

    }  else {

        checkBox = document.createElement("input");
        checkBox.type = "checkbox";
        checkBox.name = "violationCheckBox";
        checkBox.checked = isChecked;

    }

    return checkBox;
}

/**
 * Create a table with the given class name.
 */
function createTableWithClass(className) {
    var table = document.createElement( 'table' );
    table.className = className;
    return table;
}

/**
 * Create the violation container table.
 */
function createViolationTable() {
    return createTableWithClass('width100');
}

/**
 * Create an spTable.
 */
function createSpTable() {
    return createTableWithClass('spTable');
}

// End Entitlement Violation Stuff


//Set the decision select menu and other form items
// to reflect the last decision made
function setLastDecision(currentStatus) {
    var action;
    var comments = $('lastDecisionComments').value;
    var ownerName = $('lastDecisionOwnerName').value;
    var wiOwnerName = $('workItemOwnerName').value;
    var wiComments = $('workItemComments').value;
    
    if (currentStatus === 'policy_violation_mitigated') {
      action = 'Allow';
      onSelectAction(action);
      $('actionForm:comments').value = comments;
    }
    else if (currentStatus === 'policy_violation_remediated') {
      action = 'Remediate';
      onSelectAction(action);
      $('remediationAdvisor').disabled = true;
      $('actionForm:submitRemediationTargetsButton').disabled = true;
      $('actionForm:description').disabled = true;
      var assignee = Ext.getCmp('policyViolationDetailOwnerName');
      if (assignee){
          assignee.assigneeSuggest.setRawValue(ownerName);
          assignee.disable();
          Ext.getCmp('policyViolationDetailOwnerName-quickAssign').disable();
      }
      $('actionForm:comments').value = comments;
      $('actionForm:comments').disabled = true;
      disableAllCheckboxes();
    }
    else if (currentStatus === 'policy_violation_delegated') {
      action = 'Delegate';
      onSelectAction(action);
      Ext.getCmp('policyViolationDetailOwnerName').assigneeSuggest.setRawValue(wiOwnerName);
      $('actionForm:comments').value = wiComments;
    }
    if (action) {
      $('actionForm:selectedAction').value = action;
    }
    if (action && (currentStatus != 'policy_violation_delegated') && (currentStatus != 'policy_violation_mitigated')) {
      $('actionForm:selectedAction').disabled = true;
      $('actionForm:submitActionButton').disabled = true;
    }
}

function hasChildren(node){
    return node.children && node.children.length > 0;
}
