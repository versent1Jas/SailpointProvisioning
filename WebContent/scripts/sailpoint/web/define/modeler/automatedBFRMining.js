/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.namespace('SailPoint', 'SailPoint.roles');

Ext.define('SailPoint.roles.AutomatedBFRMiningPanel', {
	extend : 'Ext.panel.Panel',
    initComponent: function() {
        var currentPanel = this;
        Ext.apply(this, {
            border: true
        });
        
        this.loader = {};
        
        SailPoint.roles.AutomatedBFRMiningPanel.superclass.initComponent.apply(this, arguments);
    },

    displayLaunchStatus: function() {
        var launchResults = $('businessRoleLaunchResultContents').innerHTML;
        Ext.MessageBox.alert('#{msgs.title_bfr_mining}', launchResults, function() { Ext.getCmp('roleMiningPanel').getLayout().setActiveItem( 0 ); });
    },
    
    displaySaveStatus: function() {
        var saveResults = $('businessRoleSaveResultContents').innerHTML;
        if(this.isResultSuccessful(saveResults)) {
          Ext.MessageBox.show({
            title:'#{msgs.title_role_mining_template}', 
            msg:'#{msgs.role_mining_template_success}',
            buttons: Ext.MessageBox.OK,
            icon: Ext.MessageBox.INFO,
            fn: function() { Ext.getCmp('roleMiningPanel').getLayout().setActiveItem( 0 ); }
          });
        } else {
          var msg = '#{msgs.role_mining_template_error}';
          if(saveResults!="error") {
            var msg = Ext.String.format('#{msgs.role_mining_template_error_msg}', saveResults);
          } 
          Ext.MessageBox.show({
            title:'#{msgs.title_role_mining_template}', 
            msg:msg,
            buttons: Ext.MessageBox.OK,
            icon: Ext.MessageBox.ERROR
          });
        }        
    },
    
    loadContent: function() {
      this.getLoader().load({
          url: SailPoint.getRelativeUrl('/define/roles/automatedMining/bfrMining.jsf'),
          params : {templateId: this.templateId},
          callback: function() {
              var bfrOwnerSuggest = new SailPoint.IdentitySuggest({
                  id: 'bfrOwnerSuggestCmp',
                  renderTo: $('bfrMiningOwnerSuggest'), 
                  binding: $('bfrMiningForm:bfrMiningOwner'),
                  allowBlank: false,
                  rawValue: $('bfrMiningOwnerSuggestValue').value,
                  emptyText: '#{msgs.select_owner}',
                  baseParams: {context: 'Owner'}
              });

        	  var ownerValue = $('bfrMiningForm:bfrMiningOwner').value;
              if ('' != ownerValue) {
            	  var options = {
            	      params: {
            	    	  query: $('bfrMiningOwnerSuggestValue').value
            	      },
            	      callback: function() {
        	              bfrOwnerSuggest.setValue(ownerValue);
        	          }
            	  };
            	  
	              bfrOwnerSuggest.getStore().load(options);
              }
              
              var bfrScopingSuggest = new SailPoint.MultiSuggest({
                  id: 'bfrScopingAttributesMultiSuggestCmp',
                  valueField: 'name',
                  renderTo: 'bfrMiningScopingAttributesMultiSuggest',
                  suggestType: 'userIdentityAttribute',
                  jsonData: Ext.decode($('bfrMiningScopingAttributesMultiSuggestData').innerHTML),
                  inputFieldName: 'bfrMiningScopingAttributesSuggest',
                  sortable: true
              });
              
              var bfrContainerSuggest = new SailPoint.BaseSuggest({
                  id: 'bfrContainerRoleSuggestCmp',
                  baseParams: {suggestType: 'containerRole'},
                  renderTo: $('bfrContainerRoleSuggest'), 
                  binding: $('bfrMiningForm:bfrContainerRole'),
                  allowBlank: false,
                  emptyText: '#{msgs.select_container_role}'
              });

              var containerRoleValue = $('bfrMiningForm:bfrContainerRole').value;
              if ('' != containerRoleValue) {
            	  var options = {
            	      params: {
            	    	  query: $('bfrContainerRoleSuggestValue').value
            	      },
            	      callback: function() {
            	    	  bfrContainerSuggest.setValue(containerRoleValue);
            	      }
            	  };
            	  
            	  bfrContainerSuggest.getStore().load(options);
              }
              
  
              var bfrMiningSuggest = new SailPoint.MultiSuggest({
                  id: 'bfrMiningApplicationMultiSuggestCmp',
                  renderTo: 'bfrMiningApplicationMultiSuggest',
                  suggestType: 'application',
                  jsonData: Ext.decode($('bfrMiningApplicationMultiSuggestData').innerHTML),
                  inputFieldName: 'bfrMiningApplicationSuggest',
                  emptyText: '#{msgs.select_application}',
                  sortable: true
              });
              
              // Make the app suggest display:none now that it has been properly initialized.
              // This hack is necessary to make the multisuggest's grid render correctly
              var appSuggestRow = Ext.get('bfrMiningAppMultiSuggestRow');
              appSuggestRow.setVisibilityMode(Ext.Element.VISIBILITY);
              appSuggestRow.setVisible(true);
              appSuggestRow.dom.style.display = 'none';
              
              this.body.applyStyles({
                  'overflow-x': 'hidden',
                  'overflow-y': 'auto'
              });
              
              buildTooltips($('bfrMining'));
              Ext.MessageBox.hide();
              SailPoint.roles.setITRoleOptionsDisabled($('bfrMiningForm:bfrAttachProfilesToBfr').checked);
              SailPoint.roles.setEntitlementOptionsDisabled(!$('bfrMiningForm:bfrMineForEntitlements').checked);
              this.updateContainerOption();
              
              if( $( 'bfrMiningForm:bfrRoleMiningTemplateId' ).value == '' ) {
                  Ext.getCmp( 'viewBFRTaskResultsBtn' ).hide();
              } else {
                  Ext.getCmp( 'viewBFRTaskResultsBtn' ).show();
              }
          },
          scope: this,
          ajaxOptions : {
              disableCaching: false
          },
          text: '#{msgs.loading_data}',
          scripts: false
      });
      
      this.isLoaded = true;
    },
    
    updateContainerOption: function() {
        var roleTypeOption = Ext.get('orgRoleTypeOption');
        roleTypeOption.dom.style['display'] = ($('bfrMiningForm:generateOrgRoles').checked && !$('bfrMiningForm:bfrAnalyzeOnly').checked) ? '' : 'none';
        var existingRootContainerOption = Ext.get('existingRootContainer');
        existingRootContainerOption.dom.style['display'] = $('bfrMiningForm:generateOrgRoles').checked ? 'none' : '';
    },
    
    toggleRoleCreationOptions: function() {
        var roleCreationOptions = Ext.DomQuery.select('tr[class*=roleCreationOption]', 'bfrMining');
        var isRoleCreationEnabled = !$('bfrMiningForm:bfrAnalyzeOnly').checked;
        var roleCreationOption;
        var i;
        for (i = 0; i < roleCreationOptions.length; ++i) {
            roleCreationOption = roleCreationOptions[i];
            if (isRoleCreationEnabled) {
                roleCreationOption.style['display'] = '';
                // If we're displaying role creation options make sure to hide the IT role and Entitlement options when necessary
                SailPoint.roles.setITRoleOptionsDisabled($('bfrMiningForm:bfrAttachProfilesToBfr').checked);
                SailPoint.roles.setEntitlementOptionsDisabled(!$('bfrMiningForm:bfrMineForEntitlements').checked);
            } else {
                roleCreationOption.style['display'] = 'none';                
            }
        }
        
        this.updateContainerOption();
    },
    
    isResultSuccessful: function(result) {
        // Note about trim(): it is only available in Javascript 1.8.1+, but 
        // ExtJS extends String to support this functionality in older versions
        // as well.
        return result && result.trim() == "success";
    }
});

SailPoint.roles.getBusinessRoleMiningPanel = function(config) {
    var businessRoleMiningPanel = Ext.getCmp(config.id);
    
    if (!businessRoleMiningPanel) {
        businessRoleMiningPanel = new SailPoint.roles.AutomatedBFRMiningPanel({
            id: config.id,        
            title: config.title,
            header: false,
            tbar: [{
                id: 'viewTemplatesBtn',
                text: '#{msgs.view_mining_templates}',
                scale : 'medium',
                handler: function() {
                    var taskResultViewer = Ext.getCmp('taskResultViewerWindow');
                    if (taskResultViewer) {
                        taskResultViewer.hide();
                    }
                    Ext.getCmp('roleMiningPanel').getLayout().setActiveItem(0);
                }
            }],
            bbar: [{
                id: 'saveBFRTemplateBtn',
                text: '#{msgs.button_save}',
                cls : 'primaryBtn',
                layout: {
                    pack: 'center'
                },
                handler: function() {
                    var validated = SailPoint.roles.validateBFRSelections();
                    if(validated) {
                        SailPoint.roles.saveTemplatePrompt({
                            type: 'bfr',
                            panel: Ext.getCmp('bfrMiningPanel'),
                            templateName: $('bfrMiningForm:bfrRoleMiningTemplateName').value,
                            originalTemplateName: $('bfrMiningForm:bfrRoleMiningOriginalTemplateName').value,
                            saveFromExistingHandler: function() {
                                if(Ext.getCmp('bfrWindowTemplateSaveNew').checked) {
                                    $('bfrMiningForm:bfrRoleMiningTemplateId').value = '';
                                    $('bfrMiningForm:bfrRoleMiningTemplateName').value = Ext.getCmp('bfrWindowTemplateName').getValue();
                                }
                                Ext.getCmp('bfrMiningTemplateSaveWindow').hide();
                                $('bfrMiningForm:bfrSaveTemplateBtn').click();
                            }, 
                            saveFromScratchHandler: function(btn, text) {
                                $('bfrMiningForm:bfrRoleMiningTemplateId').value = '';
                                $('bfrMiningForm:bfrRoleMiningTemplateName').value = text;
                                $('bfrMiningForm:bfrSaveTemplateBtn').click();                                
                            }
                        });
                  } else {
                      Ext.MessageBox.alert('#{msgs.err_validation}', '#{msgs.err_bfr_launch_invalid}');
                  }
                  
                }
            },{
                id: 'launchBFRMiningBtn',
                text: '#{msgs.button_save_and_exec}',
                cls : 'primaryBtn',
                handler: function() {
                    var validated = SailPoint.roles.validateBFRSelections();
                    if(validated) {
                        SailPoint.roles.saveTemplatePrompt({
                            type: 'bfrSaveAndExec',
                            panel: Ext.getCmp('bfrMiningPanel'),
                            templateName: $('bfrMiningForm:bfrRoleMiningTemplateName').value,
                            originalTemplateName: $('bfrMiningForm:bfrRoleMiningOriginalTemplateName').value,
                            saveFromExistingHandler: function() {
                                if(Ext.getCmp('bfrSaveAndExecWindowTemplateSaveNew').checked) {
                                    $('bfrMiningForm:bfrRoleMiningTemplateId').value = '';
                                    $('bfrMiningForm:bfrRoleMiningTemplateName').value = Ext.getCmp('bfrSaveAndExecWindowTemplateName').getValue();
                                }
                                Ext.getCmp('bfrSaveAndExecMiningTemplateSaveWindow').hide();
                                $('bfrMiningForm:bfrSaveAndExecTemplateBtn').click();
                            },
                            saveFromScratchHandler: function(btn, text) {
                                $('bfrMiningForm:bfrRoleMiningTemplateId').value = '';
                                $('bfrMiningForm:bfrRoleMiningTemplateName').value = text;
                                $('bfrMiningForm:bfrSaveAndExecTemplateBtn').click();                                
                            }
                        });
                    } else {
                        Ext.MessageBox.alert('#{msgs.err_validation}', '#{msgs.err_bfr_launch_invalid}');
                    }
                }
            },{
                id: 'viewBFRTaskResultsBtn',
                text: '#{msgs.button_view_last_mining_result}',
                handler: function() {
                    $('bfrMiningForm:bfrViewLastTaskResult').click();
                }
            },{
              id:'clearBFRTemplateBtn',
              text: '#{msgs.button_cancel}',
              handler: function() {
                var panel = Ext.getCmp('bfrMiningPanel');
                panel.templateId = '';
                panel.loadContent();
                Ext.getCmp('roleMiningPanel').getLayout().setActiveItem(0);
              }
            }]
        });
    }
    
    return businessRoleMiningPanel;
};

SailPoint.roles.saveTemplatePrompt = function(options) {
    var panel = options.panel;
    var templateName = options.templateName;
    var type = options.type;
    var saveFromExistingHandler = options.saveFromExistingHandler;
    var saveFromScratchHandler = options.saveFromScratchHandler;
    var saveWindow = Ext.getCmp(type + 'MiningTemplateSaveWindow');
    var templateNameField;
    var updateField;
  
    if(panel.templateId) {
        if(!saveWindow) {
            templateNameField = new Ext.form.TextField({
                id: type + 'WindowTemplateName',
                anchor: '95%',
                value: templateName
            });            
      
            updateField = new Ext.form.Radio({
                boxLabel: Ext.String.format('#{msgs.role_mining_template_update}', options.originalTemplateName), 
                id: type + 'WindowTemplateSaveUpdate',
                name: 'update'
            });
            
            updateField.on('check', function(checkbox) {
                if (checkbox.checked) {
                    Ext.get(type + 'WindowTemplateNameLabel').hide();
                    Ext.get(type + 'WindowTemplateName').hide();
                }
            });
      
            var saveNewField = new Ext.form.Radio({
                xtype:'radio', 
                boxLabel: '#{msgs.role_mining_template_save_new}',
                id: type + 'WindowTemplateSaveNew',
                name:'update'
            });
            
            saveNewField.on('check', function(checkbox) {
                if (checkbox.checked) {
                    Ext.get(type + 'WindowTemplateNameLabel').show();
                    Ext.get(type + 'WindowTemplateName').show();
                }
            });
      
            saveWindow = new Ext.Window({
                layout: 'form',
                id: type + 'MiningTemplateSaveWindow',
                width:400,
                title:'#{msgs.title_role_mining_template}',
                bodyStyle: 'padding:5px;',
                cls:'white',
                closeAction:'hide',
                modal:true,
                plain:true,
                labelWidth:5,
                defaults: { labelSeparator: '' },
                items: [{
                        xtype:'box',
                        style: 'margin-bottom:10px',
                        autoEl: { 
                            tag: 'p',
                            html: '#{msgs.role_mining_template_save_update_msg}'
                        }
                    },
                    updateField,
                    saveNewField, {
                        xtype: 'label',
                        html: '#{msgs.role_mining_template_name}:',
                        id: type + 'WindowTemplateNameLabel',
                        style: 'margin:10px 0 3px 0; display: block'
                    },
                    templateNameField
                    
                ],
                buttons: [{
                    text: '#{msgs.button_save}',
                    handler: saveFromExistingHandler
                },{
                    text: '#{msgs.button_cancel}',
                    cls : 'secondaryBtn',
                    handler: function() {
                        Ext.getCmp(type + 'MiningTemplateSaveWindow').hide();
                    }
                }]
            });
        } else {
            /** Update the field label of the update radio **/
            $(type + 'WindowTemplateSaveUpdate').nextSibling.innerHTML = Ext.String.format('#{msgs.role_mining_template_update}', options.originalTemplateName);
        }
    
        saveWindow.show();
        Ext.getCmp(type + 'WindowTemplateSaveUpdate').setValue(true);
        Ext.getCmp(type + 'WindowTemplateSaveNew').setValue(false);
        Ext.getCmp(type + 'WindowTemplateName').setValue(templateName);
    } else {
        /** If the user has hit save, the prompt hides the input field, need to show it**/
        saveFromScratchHandler('ok', templateName);
    }  
};

SailPoint.roles.saveBFRTemplate = function(btn, text) {  

  /** Saving a new template **/
  if(btn=="ok") {
    $('bfrMiningForm:bfrRoleMiningTemplateId').value = '';
    $('bfrMiningForm:bfrRoleMiningTemplateName').value = text;
    $('bfrMiningForm:bfrSaveTemplateBtn').click();
  } else if(btn=="update"){
    $('bfrMiningForm:bfrSaveTemplateBtn').click();
  }
};

SailPoint.roles.setITRoleOptionsDisabled = function(isDisabled) {
    var itRoleOptions = Ext.DomQuery.select('tr[class*=ITRoleOption]', 'bfrMiningItTable');
    var isRoleCreationDisabled = $('bfrMiningForm:bfrAnalyzeOnly').checked;
    var option;
    
    for (var i = 0; i < itRoleOptions.length; ++i) {
        option = Ext.get(itRoleOptions[i]);
        option.dom.style.display = isDisabled ? 'none' : '';
    }
    
    // If we're displaying IT role options make sure to hide the role creation ones when necessary
    if (isRoleCreationDisabled && !isDisabled) {
        Ext.getCmp('bfrMiningPanel').toggleRoleCreationOptions();
    }    
};

SailPoint.roles.setEntitlementOptionsDisabled = function(isDisabled) {
    var entitlementMiningOptions = Ext.DomQuery.select('tr[class*=entitlementMiningOption]', 'bfrMiningItTable');
    var isRoleCreationDisabled = $('bfrMiningForm:bfrAnalyzeOnly').checked;
    var option;
    var errorsToDisplay;
    var errorsToHide;
    var i;
    
    for (i = 0; i < entitlementMiningOptions.length; ++i) {
        option = Ext.get(entitlementMiningOptions[i]);
        option.dom.style.display = isDisabled ? 'none' : '';
    }
    
    if (isDisabled) {
        errorsToHide = Ext.DomQuery.select('tr[class*=entitlementMiningError]', 'bfrMiningItTable');
        for (i = 0; i < errorsToHide.length; ++i) {
            var errorToHide = Ext.get(errorsToHide[i]);
            errorToHide.dom.style.display = 'none';
        }        
    } else {
        SailPoint.roles.setITRoleOptionsDisabled($('bfrMiningForm:bfrAttachProfilesToBfr').checked);
        
        errorsToDisplay = SailPoint.roles.visibleEntitlementErrors;
        for (i = 0; i < errorsToDisplay.length; ++i) {
            var errorToDisplay = Ext.get(errorsToDisplay[i]);
            errorToDisplay.dom.style.display = '';
        }
    }
    
    // If we're displaying entitlement options make sure to hide the role creation ones when necessary
    if (isRoleCreationDisabled && !isDisabled) {
        Ext.getCmp('bfrMiningPanel').toggleRoleCreationOptions();
    }
};

SailPoint.roles.validateBFRSelections = function() {
    var messagesToDisplay = [];
    var messagesToHide = [];
    var validationMessage;
    var isRoleCreationEnabled = !$('bfrMiningForm:bfrAnalyzeOnly').checked;
    var i;
    
    // Check for name
    var nameField = $('bfrMiningForm:bfrRoleMiningTemplateName');
    if (nameField.value == undefined || nameField.value === '') {
        messagesToDisplay.push('bfrMiningTemplateNameError');
    } else {
        messagesToHide.push('bfrMiningTemplateNameError');
    }

    // Check for scoping attributes
    var scopingAttributes = Ext.getCmp('bfrScopingAttributesMultiSuggestCmp');
    var numScopingAttributes = scopingAttributes.getSelectedCount();
    if (numScopingAttributes <= 0) {
        messagesToDisplay.push('scopingAttributesValidationError');
    } else {
        messagesToHide.push('scopingAttributesValidationError');
    }
    
    // Check for owner
    var selectedOwner = Ext.getCmp('bfrOwnerSuggestCmp').getValue();
    if (isRoleCreationEnabled && (!selectedOwner || selectedOwner.length <= 0)) {
        messagesToDisplay.push('bfrMiningOwnerValidationError');
    } else {
        messagesToHide.push('bfrMiningOwnerValidationError');
    }
    
    SailPoint.roles.visibleEntitlementErrors = [];
    
    // Check for applications and percentage threhold if mining for IT entitlements
    var isMiningForITEntitlements = $('bfrMiningForm:bfrMineForEntitlements').checked;
    if (isMiningForITEntitlements) {
        var selectedApps = Ext.getCmp('bfrMiningApplicationMultiSuggestCmp');
        var numSelectedApps = selectedApps.getSelectedCount();
        if (numSelectedApps <= 0) {
            messagesToDisplay.push('bfrMiningEntitlementApplicationValidationError');
            SailPoint.roles.visibleEntitlementErrors.push('bfrMiningEntitlementApplicationValidationError');
        } else {
            messagesToHide.push('bfrMiningEntitlementApplicationValidationError');
        }
        
        var percentageThreshold = Number($('bfrMiningForm:bfrThreshold').value);
        if (!Number.isInteger(percentageThreshold) || percentageThreshold > 100) {
            messagesToDisplay.push('bfrMiningThresholdValidationError');        
            SailPoint.roles.visibleEntitlementErrors.push('bfrMiningThresholdValidationError');
        } else {
            messagesToHide.push('bfrMiningThresholdValidationError');
        }
    }
    
    // 
    var minNumUsers = $('bfrMiningForm:bfrMinNumUsers').value;
    if (!Number.isInteger(minNumUsers)) {
        messagesToDisplay.push('bfrMiningMinNumUsersValidationError');        
    } else {
        messagesToHide.push('bfrMiningMinNumUsersValidationError');
    }

    for (i = 0; i < messagesToDisplay.length; ++i) {
        validationMessage = Ext.get(messagesToDisplay[i]);
        validationMessage.dom.style.display = '';
    }
    
    for (i = 0; i < messagesToHide.length; ++i) {
        validationMessage = Ext.get(messagesToHide[i]);
        validationMessage.dom.style.display = 'none';
    }
    
    return messagesToDisplay.length <= 0;
};

/**
 * This field is used by the SailPoint.roles.validateBFRSelections() and 
 * SailPoint.roles.setEntitlementOptionsDisabled() functions to maintain a list
 * of entitlement errors that need to be redisplayed when that section becomes visible.  
 */
SailPoint.roles.visibleEntitlementErrors = [];
