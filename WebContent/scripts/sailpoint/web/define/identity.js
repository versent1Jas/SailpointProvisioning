/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */
//Page.addEvents('tabChange');
var loadedTabs = [];
/** Scripts for the identity page **/

function viewActivity(id) {
  var windowUrl = CONTEXT_PATH + "/identity/viewActivity.jsf?id="+id;

  SailPoint.confirm({url: windowUrl, options: {method: 'post'}},
               {windowParameters: {className:'sailpoint',
                                   title: "#{msgs.activity_details}",
                                   width:700},
                                   okLabel: "#{msgs.button_close}",
                                   ok:function(win) { 
                                      return true; 
                                   }
                 });
}

function viewSnapshot(id) {
  $('editForm:snapshotId').value = id;
  $('editForm:snapshotBtn').click();
}
var moveLinkWin;
var roleAssignWin;

/*
 * This function validates the input when the user has selected to move
 * a link on the app accounts tab.  Only one account may be selected.
 * Account may not be composite, on an authoritative app, and it must
 * have been manually correlated. If all is well, the linkId is set on
 * the link window.
 *
 *  Used on the app accounts page -  identityLinksList.xhtml
*/
function validateMoveLinkSelection(win){

    var checkCount = 0;
    var checkedId = null;

    var checkboxes = Ext.query('.linkChecker');
    var isAuthoritative = false;
    var isComposite = false;
    var isManuallyCorrelated = false;
    if (checkboxes){
        for(var i = 0; i < checkboxes.length;i++){
            if (checkboxes[i].checked == true){
                var classes = checkboxes[i].className.split(" ");
                win.linkId = classes[classes.length - 1];
                for(var c = 0; c < classes.length;c++){
                    if (classes[c] == 'composite'){
                        isComposite = true;
                    } else if (classes[c] == 'authoritative'){
                        isAuthoritative = true;
                    } else if (classes[c] == 'manuallyCorrelated'){
                        isManuallyCorrelated = true;
                    }
                }
                checkCount++;
            }
        }
    }

    if (checkCount == 0){
        Ext.Msg.alert("#{msgs.err_dialog_title}", "#{msgs.err_plz_select_account}");
        return false;
    } else if (checkCount > 1){
        Ext.Msg.alert("#{msgs.err_dialog_title}", "#{msgs.err_limit_one_account}");
        return false;
    } else if (isComposite){
        Ext.Msg.alert("#{msgs.err_dialog_title}", "#{msgs.err_cant_move_composite_account}");
        return false;
    //} else if (isAuthoritative){
    //    Ext.Msg.alert("#{msgs.err_dialog_title}", "#{msgs.cant_move_auth_app_account}");
    //    return false;
    //} else if (!isManuallyCorrelated){
    //    Ext.Msg.alert("#{msgs.err_dialog_title}", "#{msgs.cant_move_non_man_correlated_accts}");
    //    return false;
    }

    return true;
}

function validateDeleteLinkSelection() {
    var checkCount = 0;
    var checkedId = null;

    var checkboxes = Ext.query('.linkChecker');
    if (checkboxes){
        for(var i = 0; i < checkboxes.length;i++){
            if (checkboxes[i].checked == true){
                checkCount++;
            }
        }
    }

    if (checkCount == 0){
        Ext.Msg.alert("#{msgs.err_dialog_title}", "#{msgs.err_plz_select_account}");
        return false;
    } 

    return true;
}

function refreshTab(){
  if(!ajaxLock) {
    ajaxLock = true;
    $('editForm:tabUpdateBtn').click();
  } else {
    setTimeout('refreshTab()', 1000);
  }
}

function postTabUpdate() {
  /** Grab the new node from the a4jpanel and slap it into the tab panel **/
  var activeTab = Ext.getDom('editForm:activeTab').value;
  var tab = Ext.getCmp('identityTabPanel').getActiveTab();


  var newTab = Ext.DomQuery.selectNode('span[id=editForm:identityPanels] div[id='+tab.contentEl+']');
 
  if (newTab && newTab.innerHTML == '') {
    SailPoint.identity.setTabPanelHeight();
    return;
  }
  
  var loaded = Ext.Array.contains(loadedTabs, activeTab);
  
  //don't update the content for Attribute and User Right tab if they are loaded, 
  //because they have user inputs and update may cause user selections get lost.   
  if (!loaded || (activeTab != 0 && activeTab != 7)) {
    tab.getEl().update(newTab.innerHTML);
    newTab.innerHTML = '';
  }
  
  var editorType = $('identityAttributeEditorTable') ? 'identityAttributeEditorTable' : null;
  
  ajaxLock = false;

  if (activeTab == 0  && !loaded) {
     initAttributesTab();
     if ($('identityAttributeEditorTable')) {
         SailPoint.style.alternateTableRows('identityAttributeEditorTable');
         SailPoint.initAttributeEditor(editorType, true);
     }
  }

  if (activeTab == 1 ) {
     initEntitlementsTab();
     
     buildTooltips(tab.getEl().dom);
  }
  
  if (activeTab == 4 ) {   
     initHistoryTab();
  }
  
  if (activeTab == 7 && !loaded) {
      renderSuggests();
      initializeCapabilities();
  }
  
  if (activeTab == 8 ) {
      initEventsTab();
  }
  
  /** initialize tooltips **/
  if(activeTab == 1|| activeTab==2) {
    addDescriptionTooltips();
  }
  
  unmaskPanel();
  
  SailPoint.identity.setTabPanelHeight();
  
  if (! loaded) {
      loadedTabs.push(activeTab);
  }
}

function initIdentityTabPanel(items) {
    var activeTab = parseInt($('editForm:activeTab').value);
    loadedTabs.push(activeTab);
    loadedTabs.push(0);
    
    var tabPanel = Ext.create('Ext.tab.Panel', {
        renderTo:'identityTabs',
        region: 'center',
        plain: true,
        id:'identityTabPanel',
        activeTab: activeTab,
        width: Ext.getDom('identityTabs').clientWidth,
        items: items
    });
    
    tabPanel.on('tabchange', function(tabPanel, tab) {
        //Page.fireEvent('tabChange');
        maskPanel();
      
        var activeTab = parseInt(tab.tabIndex);
        Ext.getDom('editForm:activeTab').value = activeTab;
      
        refreshTab();
        //loadedTabs.push(activeTab);
      
        SailPoint.identity.setTabPanelHeight();
    });

    if ($('attributeEditorTable')) { 
        SailPoint.style.alternateTableRows('attributeEditorTable'); 
    }
    
    initAttributesTab();

    if (activeTab == 1 ) {
        initEntitlementsTab();
    }

    if (activeTab == 2) {
        refreshTab();
    }
    
    if (activeTab == 4 ) {
        initHistoryTab();
    }

    if (activeTab == 8 ) {
        initEventsTab();
    }
    
    /** initialize tooltips **/
    if(activeTab == 1 || activeTab==2) {
        addDescriptionTooltips();
    }
    
    /*
     * This is a popup window on the application accounts page. Contains
     * a form used to move links from one identity to another.
     *
     *  Used on the app accounts page -  identityLinksList.xhtml
     */
    moveLinkWin = new SailPoint.MoveLinkWindow({
        title:"#{dialog_title_select_account_owner}",
        closable:false,
        width:600,
        resizable:false,
        draggable:false
    });
    
    /*
     * This is a popup window for performing role assignment on the entitlements
     * tab of the identities page.  Contains a form for adding and removing
     * roles on an identity.
     */
    
    /*
    * Callback function executed when an identity link has been sucessfully moved.
    * on the move link dialog. Refreshes the grid and uchecks any checkboxes.
    *
    *  Used on the app accounts page -  identityLinksList.xhtml
    */
    moveLinkWin.on('success',
            function(){
                var checkboxes = Ext.query('.linkChecker');
                if (checkboxes){
                    for(var i = 0; i < checkboxes.length;i++) {
                        var checkbox = checkboxes[i];
                        if (checkbox)
                           checkbox.checked = false;
                    }
                }
                refreshTab();
            }, this
    );

    SailPoint.initAttributeEditor();
}

function saveRoleAssignment() {
  
  if(roleAssignWin.form.sunriseDate && roleAssignWin.form.sunriseDate.getValue()) {
      var riseVal = roleAssignWin.form.sunriseDate.getValue();
      riseVal.setHours(roleAssignWin.form.sunriseHour);
      riseVal.setMinutes(roleAssignWin.form.sunriseMin);
    $('editForm:sunriseDate').value = riseVal.getTime();
  } else {
      $('editForm:sunriseDate').value = "";
  }
  
  
  if(roleAssignWin.form.sunsetDate && roleAssignWin.form.sunsetDate.getValue()) {
      var setVal = roleAssignWin.form.sunsetDate.getValue();
      setVal.setHours(roleAssignWin.form.sunsetHour);
      setVal.setMinutes(roleAssignWin.form.sunsetMin);
      $('editForm:sunsetDate').value = setVal.getTime();
  } else {
      $('editForm:sunsetDate').value = "";
  }
  
  if(roleAssignWin.roleId) {
    $('editForm:roleId').value = roleAssignWin.roleId;
  } else {
      $('editForm:roleId').value = "";
  }
  
  if(roleAssignWin.type == 'add') {
    $('editForm:roleSaveButton').click();
  } else if(roleAssignWin.type == 'edit') {
    $('editForm:roleEditButton').click();
  } else {
    $('editForm:roleDeleteButton').click();
  }
}

function editRoleAssignment(roleId, sunriseDate, sunsetDate) {

  if(!roleAssignWin) {
    roleAssignWin = createRoleAssignWin(true);
  }
  roleAssignWin.roleId = roleId;
  roleAssignWin.setType('edit');
  roleAssignWin.show();
  if(sunriseDate) {
      var riseDate = new Date(sunriseDate);
      roleAssignWin.form.sunriseDate.setValue(riseDate);
      roleAssignWin.form.sunriseHour = riseDate.getHours();
      roleAssignWin.form.sunriseMin = riseDate.getMinutes();
  } else {
    roleAssignWin.form.sunriseDate.reset();
  }
  if(sunsetDate) {
      var setDate = new Date(sunsetDate);
      roleAssignWin.form.sunsetDate.setValue(setDate);
      roleAssignWin.form.sunsetHour = setDate.getHours();
      roleAssignWin.form.sunsetMin = setDate.getMinutes();
  } else {
    roleAssignWin.form.sunsetDate.reset();
  }
}

function editRoleActivation(roleId, sunriseDate, sunsetDate) {
    //Always create a new window
    if(roleAssignWin) {
        roleAssignWin.destroy();
        roleAssignWin = null;
      }
    roleAssignWin = createRoleAssignWin(true,true);
      roleAssignWin.roleId = roleId;
      roleAssignWin.setType('edit');
      roleAssignWin.show();
      if(sunriseDate && sunriseDate != "null") {
        var riseDate = new Date(sunriseDate);
        roleAssignWin.form.sunriseDate.setValue(riseDate);
        roleAssignWin.form.sunriseHour = riseDate.getHours();
        roleAssignWin.form.sunriseMin = riseDate.getMinutes();
        
      } else {
        roleAssignWin.form.sunriseDate.setValue(null);
        roleAssignWin.form.sunriseDate.disable();
      }
      if(sunsetDate && sunsetDate != "null") {
        var setDate = new Date(sunsetDate);
        roleAssignWin.form.sunsetDate.setValue(setDate);
        roleAssignWin.form.sunsetHour = setDate.getHours();
        roleAssignWin.form.sunsetMin = setDate.getMinutes();
      } else {
        roleAssignWin.form.sunsetDate.setValue(null);
      }
}

function refreshRoleAssignmentWin() {
  
  if(roleAssignWin) {
    roleAssignWin.destroy();
    roleAssignWin = null;
  }
  
  $('editForm:sunsetDate').value = '';
  $('editForm:sunriseDate').value = '';
}


function refreshRoleDetailPanels() {
  Page.fireEvent('cleanupRoleDetailPanels');
}

function createRoleAssignWin(showAssignDates, hidesuggest) {
  var hidesug = false;
  if(hidesuggest) {
      hidesug = hidesuggest;
  }
    
  return new SailPoint.RoleAssignmentWindow({
    title: "#{msgs.title_add_role}",
    width: 350,
    showAssignDates: showAssignDates,
    closeAction : 'hide',
    saveAction : saveRoleAssignment,
    noSuggest : hidesug
  });  
}

function addNewRole(showAssignDates) {

  if(!roleAssignWin) {
    roleAssignWin = createRoleAssignWin(showAssignDates);
  }
  roleAssignWin.setType('add');
  roleAssignWin.show();
}

function deleteRole(showAssignDates) {
  if(showAssignDates) {

    if(!roleAssignWin) {
      roleAssignWin = createRoleAssignWin(showAssignDates);
    }
    roleAssignWin.setType('delete');
    roleAssignWin.show();
  } else {
    $('editForm:roleDeleteButton').click();    
  }
}

function initializeCapabilities() {
  capabilitiesInput = $('editForm:capabilityInput');
  if (capabilitiesInput) {
      capabilities = capabilitiesInput.value;
      if(capabilities) {
          allcapabilities = $('allcapabilities');
          caps = stringToArray(capabilities, true);
          for(i=0; i<caps.length; i++) {
              cap = caps[i];
              for(j=0; j<allcapabilities.options.length; j++) {
                  if(allcapabilities.options[j].value == cap) 
                      allcapabilities.options[j].selected = 'selected';
              }
          }
      }
  }
}

function updateCapabilities(container) {
  caps = [];
  for(i=0; i<container.options.length; i++) {
    if(container.options[i].selected) {
      caps.push(container.options[i].value);
    }
  }
  $('editForm:capabilityInput').value = arrayToString(caps, true);
}

function toggleEventDetails(eventId, link) {
  var eventDetailEl = $('event_detail_'+ eventId);
  showHideWithLock(eventDetailEl);
  SailPoint.Utils.toggleDisclosureDiv({link:link, div:eventDetailEl});
  eventDetailEl.className = $('event_'+ eventId).className;
}

function toggleStartAndEndDateFields(suggest, newValue, oldValue) {
  if ((newValue == null) || (newValue == ""))
      disableStartAndEndDates();
  else
      enableStartAndEndDates();
}

function enableStartAndEndDates() {
  $('editForm:forwardingStart').disabled = false;
  $('editForm:startLabel').className = "normal";

  $('editForm:forwardingEnd').disabled = false;
  $('editForm:endLabel').className = "normal";
}

function disableStartAndEndDates() {
  toggleDisplay($('startDateDiv'), true);

  $('editForm:forwardingStart').disabled = true;
  $('editForm:forwardingStart').checked = false;
  $('editForm:startLabel').className = "disabled";

  $('editForm:forwardingEnd').disabled = true;
  $('editForm:forwardingEnd').checked = false;
  $('editForm:endLabel').className = "disabled";
}

/**
 * The masking functions help with some user confusion issues on IE7 
 * during the tab load process.  Typical MS weirdness... 
 */
function maskPanel() {
    if (Ext.isIE7) {
        Ext.fly('identityTabPanel-body').mask(SailPoint.Identity.loadMaskMsg);
    }
}

function unmaskPanel() {
    if (Ext.isIE7) {
        Ext.fly('identityTabPanel-body').unmask();
    }
}


Ext.define('SailPoint.identity', {
    statics : {
        
        gridIds : [],
        
        addGrid : function(grid) {
            if(!Ext.Array.contains(SailPoint.identity.gridIds, grid)) {
                SailPoint.identity.gridIds.push(grid);
            }
        },
        
        updateGridLayouts : function() {
            var g = null;
            Ext.Array.each(SailPoint.identity.gridIds, function(gid){
                g = Ext.getCmp(gid);
                if(g) {
                    g.fireEvent('expandoResize');
                }
            });
        },
        
        setTabPanelHeight : function() {
            // var aTab = Ext.getCmp('identityTabPanel').getActiveTab();
            var tabH = 74;
            var cmps = Ext.DomQuery.select('div[class*=spAjaxContent]', Ext.getDom('identityTabPanel-body'));

            if (cmps) {
              cmps = Ext.get(cmps);
              cmps.each(function(dom) {
                  if(dom.isVisible()) {
                      tabH += dom.getHeight();
                  }
              });
            }

            var idtp = Ext.getCmp('identityTabPanel');
            if(idtp) {
                idtp.setHeight(tabH);
            }
        },

        toggleDisclosure : function(targetId) {
            // Find marker input element
            var marker = Ext.select('input.displayButtonMarker[id="' + targetId + '"]'),
                ls = Ext.get('linkSpinner_' + targetId),
                isCollapsed = true,
                nextSib;

            if(ls) {
                ls = ls.next('.detailsPanel');
                if(ls) {
                    isCollapsed = ls.getStyle('display') === 'none' ? true : false;
                }
            }

            if (marker == null) {
                return; // marker not found
            }

            // Click on the next sibling element
            nextSib = marker.elements[0].nextSibling;

            if (!nextSib) {
                return; // a4j button not found?
            }

            if (!nextSib.nextElementSibling) {
                nextSib = nextSib.nextSibling.nextSibling;
            }
            else {
                nextSib = nextSib.nextElementSibling;
            }

            nextSib = Ext.get(nextSib);
            if(nextSib && nextSib.is('a')) {
                if(isCollapsed) {
                    nextSib.removeCls('disclosureUp');
                }
                else {
                    nextSib.addCls('disclosureUp');
                }
            }
        }
    }
});
