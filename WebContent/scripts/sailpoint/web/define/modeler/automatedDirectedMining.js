/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.namespace('SailPoint', 'SailPoint.roles');

Ext.define('SailPoint.roles.AutomatedDirectedMiningPanel', {
	extend : 'Ext.panel.Panel',
    initComponent: function() {
        var currentPanel = this;
        SailPoint.roles.visibleAutomatedMiningNewRoleErrors = [];
        SailPoint.roles.visibleAutomatedMiningExistingRoleErrors = [];
        SailPoint.roles.visibleAutomatedMiningIdentityFilterErrors = [];
        SailPoint.roles.visibleAutomatedMiningGroupFilterErrors = [];

        Ext.apply(this, {
            border: true,
            header: false,
            buttonAlign: 'center',
            tbar: [{
                id: 'viewTemplatesBtn',
                text: '#{msgs.view_mining_templates}',
                scale : 'medium',
                handler: function() {
                  Ext.getCmp('roleMiningPanel').getLayout().setActiveItem(0);
                }
            }],
            bbar: [{
                id: 'launchAutomatedDirectedMiningBtn',
                text: '#{msgs.launch_automated_mining}',
                cls : 'primaryBtn',
                handler: function() {
                    var validated = currentPanel.validateAutomatedDirectedMiningSelections();
                    if(validated) {
                        var miningBtn = $('automatedDirectedMiningForm:launchITRoleMining');
                        miningBtn.click();
                    } else {
                        Ext.MessageBox.alert('#{msgs.err_validation}', '#{msgs.err_automated_mining_launch_invalid}');
                    }
                }
            },{
                id: 'viewDirectedTaskResultsBtn',
                text: '#{msgs.button_view_last_mining_result}',
                handler: function() {
                    $('automatedDirectedMiningForm:automatedMiningViewLastTaskResult').click();
                }
            },{
              id: 'saveITTemplateBtn',
              text: '#{msgs.button_save_mining_template}',
              handler: function() {
                var validated = currentPanel.validateAutomatedDirectedMiningSelections();
                if(validated) {
                  SailPoint.roles.saveITTemplatePrompt();                  
                } else {
                    Ext.MessageBox.alert('#{msgs.err_validation}', '#{msgs.err_bfr_launch_invalid}');
                }                
              }
            },{
              id:'clearITTemplateBtn',
              text: '#{msgs.button_clear_mining_template}',
              handler: function() {
                var panel = Ext.getCmp('itRoleMiningPanel');
                panel.templateId = '';
                panel.loadContent();
              }
            }],
            loader: {}
        });
        
        this.callParent(arguments);
    },
    
    applyEntitlementCreationOptions: function() {
        var rowsToShow;
        var rowsToHide;
        var currentRow;
        var i;
        var creationSettingsTable = $('creationSettingsTbl');
        var messagesToShow;
        var messagesToHide;
        
        // The first order of business is to extract the selection from the radio input.  This turns out to be
        // more complex than one would expect.
        var selectedValue = SailPoint.roles.getAutomatedDirectedMiningCreationOption('entitlement');
        
        if (selectedValue == 'createNewRole') {
            rowsToShow = Ext.DomQuery.select('tr[class=newRoleOption]', creationSettingsTable);
            rowsToHide = Ext.DomQuery.select('tr[class=existingRoleOption]', creationSettingsTable);
            messagesToShow = SailPoint.roles.visibleAutomatedMiningNewRoleErrors;
            messagesToHide = SailPoint.roles.visibleAutomatedMiningExistingRoleErrors;
        } else {
            rowsToShow = Ext.DomQuery.select('tr[class=existingRoleOption]', creationSettingsTable);
            rowsToHide = Ext.DomQuery.select('tr[class=newRoleOption]', creationSettingsTable);
            messagesToShow = SailPoint.roles.visibleAutomatedMiningExistingRoleErrors;
            messagesToHide = SailPoint.roles.visibleAutomatedMiningNewRoleErrors;
        }
        
        for (i = 0; i < rowsToShow.length; ++i) {
            currentRow = Ext.get(rowsToShow[i]);
            currentRow.dom.style['display'] = '';
        }

        for (i = 0; i < rowsToHide.length; ++i) {
            currentRow = Ext.get(rowsToHide[i]);
            currentRow.dom.style['display'] = 'none';
        }
        
        // Hide or show validation messages when appropriate
        for (i = 0; i < messagesToShow.length; ++i) {
            currentRow = Ext.get(messagesToShow[i]);
            currentRow.dom.style['display'] = '';
        }
        
        for (i = 0; i < messagesToHide.length; ++i) {
            currentRow = Ext.get(messagesToHide[i]);
            currentRow.dom.style['display'] = 'none';
        }
    },
    
    applyFilterCreationOptions: function() {
        var rowsToShow;
        var rowsToHide;
        var currentRow;
        var i;
        var creationSettingsTable = $('miningSettingsTbl');
        var messagesToShow;
        var messagesToHide;
        
        // The first order of business is to extract the selection from the radio input.  This turns out to be
        // more complex than one would expect.
        var selectedValue = SailPoint.roles.getAutomatedDirectedMiningCreationOption('filter');
        
        if (selectedValue == 'identityFilter') {
            rowsToShow = Ext.DomQuery.select('tr[class=identityFilterOption]', creationSettingsTable);
            rowsToHide = Ext.DomQuery.select('tr[class=groupFilterOption]', creationSettingsTable);
            messagesToShow = SailPoint.roles.visibleAutomatedMiningIdentityFilterErrors;
            messagesToHide = SailPoint.roles.visibleAutomatedMiningGroupFilterErrors;
            
            // This is a hack to work around a problem where the 'Add Filter' button mysteriously disappears
            // after viewing the mining results
            var addFilterBtn = Ext.get($('automatedDirectedMiningForm:automatedMiningaddFilterBtn'));
            addFilterBtn.dom.style['display'] = '';
        } else {
            rowsToShow = Ext.DomQuery.select('tr[class=groupFilterOption]', creationSettingsTable);
            rowsToHide = Ext.DomQuery.select('tr[class=identityFilterOption]', creationSettingsTable);
            messagesToShow = SailPoint.roles.visibleAutomatedMiningGroupFilterErrors;
            messagesToHide = SailPoint.roles.visibleAutomatedMiningIdentityFilterErrors;
        }
        
        for (i = 0; i < rowsToShow.length; ++i) {
            currentRow = Ext.get(rowsToShow[i]);
            currentRow.dom.style['display'] = '';
        }

        for (i = 0; i < rowsToHide.length; ++i) {
            currentRow = Ext.get(rowsToHide[i]);
            currentRow.dom.style['display'] = 'none';
        }
        
        // Hide or show validation messages when appropriate
        for (i = 0; i < messagesToShow.length; ++i) {
            currentRow = Ext.get(messagesToShow[i]);
            currentRow.dom.style['display'] = '';
        }
        
        for (i = 0; i < messagesToHide.length; ++i) {
            currentRow = Ext.get(messagesToHide[i]);
            currentRow.dom.style['display'] = 'none';
        }
    },

    validateAutomatedDirectedMiningSelections: function() {
        var messagesToDisplay = [];
        var messagesToHide = [];
        var validationMessage;
        var i;
        
        var creationOption = SailPoint.roles.getAutomatedDirectedMiningCreationOption('entitlement');
        
        if (creationOption == 'createNewRole') {
            SailPoint.roles.visibleAutomatedMiningNewRoleErrors = [];

            // Check for name
            var newRoleName = $('automatedDirectedMiningForm:automatedDirectedMiningNewRoleName').value;
            if (!newRoleName || newRoleName.length <= 0) {
                SailPoint.roles.visibleAutomatedMiningNewRoleErrors.push('automatedDirectedMiningNewRoleNameValidationError');
                messagesToDisplay.push('automatedDirectedMiningNewRoleNameValidationError');
            } else {
                messagesToHide.push('automatedDirectedMiningNewRoleNameValidationError');
            }
            
            // Check for owner
            var selectedOwner = Ext.getCmp('automatedDirectedMiningRoleOwnerSuggestCmp').getValue();
            if (!selectedOwner || selectedOwner.length <= 0) {
                SailPoint.roles.visibleAutomatedMiningNewRoleErrors.push('automatedDirectedMiningOwnerValidationError');
                messagesToDisplay.push('automatedDirectedMiningOwnerValidationError');
            } else {
                messagesToHide.push('automatedDirectedMiningOwnerValidationError');
            }
            
            // Check type
            var selectedType = $('automatedDirectedMiningForm:automatedDirecteMiningNewRoleType').value;
            if (!selectedType || selectedType.length <= 0) {
                SailPoint.roles.visibleAutomatedMiningNewRoleErrors.push('automatedDirectedMiningTypeValidationError');
                messagesToDisplay.push('automatedDirectedMiningTypeValidationError');
            } else {
                messagesToHide.push('automatedDirectedMiningTypeValidationError');
            } 
        } else {
            SailPoint.roles.visibleAutomatedMiningExistingRoleErrors = [];

            // Check for business role to mine
            var businessRoleToMine = Ext.getCmp('automatedMiningExistingRoleSuggestCmp').getValue();
            if (!businessRoleToMine || businessRoleToMine.length <= 0) {
                SailPoint.roles.visibleAutomatedMiningExistingRoleErrors.push('automatedDirectedMiningExistingRoleValidationError');
                messagesToDisplay.push('automatedDirectedMiningExistingRoleValidationError');
            } else {
                messagesToHide.push('automatedDirectedMiningExistingRoleValidationError');
            }
        }
        
        creationOption = SailPoint.roles.getAutomatedDirectedMiningCreationOption('filter');
        
        if (creationOption == 'groupFilters') {
            SailPoint.roles.visibleAutomatedMiningGroupFilterErrors = [];
            
            // Check for groups
            var groups = $('automatedDirectedMiningGroupSuggest').value;
            if (!groups || groups.length == 0) {
                SailPoint.roles.visibleAutomatedMiningGroupFilterErrors.push('automatedDirectedMiningGroupValidationError');
                messagesToDisplay.push('automatedDirectedMiningGroupValidationError');
            } else {
                messagesToHide.push('automatedDirectedMiningGroupValidationError');
            }
        } else {
            SailPoint.roles.visibleAutomatedMiningIdentityFilterErrors = [];

            // Check for identity filters
            var identityFilter;
            if ($('automatedDirectedMiningForm:automatedMiningfilterSourceArea'))
                identityFilter = $('automatedDirectedMiningForm:automatedMiningfilterSourceArea').value;
            else
                identityFilter = $('automatedDirectedMiningForm:automatedMiningfilterSourceInput').value;
            
            if (!identityFilter || identityFilter.length == 0) {
                SailPoint.roles.visibleAutomatedMiningIdentityFilterErrors.push('automatedDirectedMiningIdentityFilterValidationError');
                messagesToDisplay.push('automatedDirectedMiningIdentityFilterValidationError');
            } else {
                messagesToHide.push('automatedDirectedMiningIdentityFilterValidationError');
            }
        }
        
        // Check for applications
        var applications = $('automatedMiningApplicationSuggest').value;
        if (!applications || applications.length == 0) {
            SailPoint.roles.visibleEntitlementErrors.push('automatedDirectedMiningApplicationsValidationError');
            messagesToDisplay.push('automatedDirectedMiningApplicationsValidationError');
        } else {
            messagesToHide.push('automatedDirectedMiningApplicationsValidationError');
        }
        
        // Always validate the threshold
        var percentageThreshold = Number($('automatedDirectedMiningForm:autoDirectedMiningThresholdPercentage').value);
        if (!Number.isInteger(percentageThreshold) || percentageThreshold > 100) {
            messagesToDisplay.push('automatedDirectedMiningThresholdValidationError');        
            SailPoint.roles.visibleEntitlementErrors.push('automatedDirectedMiningThresholdValidationError');
        } else {
            messagesToHide.push('automatedDirectedMiningThresholdValidationError');
        }

        for (i = 0; i < messagesToDisplay.length; ++i) {
            validationMessage = Ext.get(messagesToDisplay[i]);
            validationMessage.dom.style['display'] = '';
        }
        
        for (i = 0; i < messagesToHide.length; ++i) {
            validationMessage = Ext.get(messagesToHide[i]);
            validationMessage.dom.style['display'] = 'none';
        }
        
        return messagesToDisplay.length <= 0;
    },
    
    displayLaunchStatus: function() {
        var launchResults = $('launchResultContents').innerHTML;
        Ext.MessageBox.alert('#{msgs.title_automated_mining}', launchResults);
    },
    
    displaySaveStatus: function() {
      var saveResults = $('automatedSaveResultContents').innerHTML;
      if(saveResults=="success") {
        Ext.MessageBox.show({
          title:'#{msgs.title_role_mining_template}', 
          msg:'#{msgs.role_mining_template_success}',
          buttons: Ext.MessageBox.OK,
          icon: Ext.MessageBox.INFO
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
      url: SailPoint.getRelativeUrl('/define/roles/automatedMining/directedMining.jsf'),
      callback: function() {
          SailPoint.roles.directedMiningExistingRoleSuggest = new SailPoint.BaseSuggest({
              id: 'automatedMiningExistingRoleSuggestCmp',
              baseParams: {suggestType: 'itRole'},
              applyTo: $('automatedMiningExistingRoleSuggest'), 
              binding: $('automatedDirectedMiningForm:automatedMiningExistingRole'),
              allowBlank: true,
              emptyText: '#{msgs.select_it_role}'
          });
          
          new SailPoint.IdentitySuggest({
              id: 'automatedDirectedMiningRoleOwnerSuggestCmp',
              applyTo: $('automatedDirectedMiningRoleOwnerSuggest'), 
              binding: $('automatedDirectedMiningForm:automatedDirectedMiningNewRoleOwner'),
              allowBlank: false,
              emptyText: '#{msgs.select_owner}',
              baseParams: {context: 'Owner'}
          });
          
          SailPoint.roles.directedMiningContainerRoleSuggest = new SailPoint.BaseSuggest({
              id: 'automatedMiningContainerRoleSuggestCmp',
              baseParams: {suggestType: 'containerRole'},
              applyTo: $('automatedMiningContainerRoleSuggest'), 
              binding: $('automatedDirectedMiningForm:automatedMiningContainerRole'),
              allowBlank: true,
              emptyText: '#{msgs.select_container_role}'
          });
          
          SailPoint.roles.groupsMultiSuggest = new SailPoint.MultiSuggest({
              renderTo: 'automatedDirectedMiningGroupMultiSuggest',
              suggestType: 'group',
              jsonData: JSON.parse($('automatedDirectedMiningGroupMultiSuggestData').innerHTML),
              inputFieldName: 'automatedDirectedMiningGroupSuggest',
              baseParams: {'type': 'group'}
          });
          
          SailPoint.roles.automatedDirectedMiningAppsMultiSuggest = new SailPoint.MultiSuggest({
              renderTo: 'automatedDirectedMiningApplicationMultiSuggest',
              suggestType: 'application',
              jsonData: JSON.parse($('automatedDirectedMiningApplicationMultiSuggestData').innerHTML),
              inputFieldName: 'automatedMiningApplicationSuggest',
              baseParams: {'type': 'application'}
          });
          
          this.body.applyStyles({
              'background': '#dddddd',
              'overflow-x': 'hidden',
              'overflow-y': 'auto'
          });
          buildTooltips($('automatedDirectedMiningPanel'));
          
          //Backwards compatibility crap
          automatedMiningFiltersPage = FiltersPage.instance('div.automatedMiningspTabledAjaxContent', 'automatedMiningfilterBeanListTbl', 'automatedDirectedMiningForm', 'automatedMining');
          // This next call has a very important side effect.  When the page is first rendered it has to have all the possible 
          // logical operations that an attribute could conceivably have in its select list.  Otherwise when AJAX
          // rerenders them JSF will refuse to acknowledge them and validation will fail.  This initPage will force
          // the operations to rerender to the ones that are actually appropriate for the identity attribute that is
          // initially shown in the filter.  In other words, if you are copying off this page make sure that you initialize 
          // the filter select list accordingly
          automatedMiningFiltersPage.initPage();
          this.applyFilterCreationOptions();
          this.applyEntitlementCreationOptions();
          Ext.MessageBox.hide();
      },
      scope: this,
      params: {forceReset: true,templateId: this.templateId},
      text: '#{msgs.loading_data}',
      scripts: false,
      ajaxOptions : {
          disableCaching: false
      }
    });
    
    this.isLoaded = true;
  }
});

SailPoint.roles.getItRoleMiningPanel = function(config) {    
    var itRoleMiningPanel = Ext.getCmp(config.id);
    
    if (!itRoleMiningPanel) {
        itRoleMiningPanel = new SailPoint.Role.ITRoleMiningPanel(config);
    }    
    
    return itRoleMiningPanel;
}

SailPoint.roles.saveITTemplatePrompt = function(btn, text) {
  var panel = Ext.getCmp('itRoleMiningPanel');
  var saveWindow = Ext.getCmp('itMiningTemplateSaveWindow');
  var templateName = $('automatedDirectedMiningForm:itRoleMiningTemplateName').value;
  var originalTemplateName = $('automatedDirectedMiningForm:itRoleMiningOriginalTemplateName').value;
  
  if(panel.templateId) {
    if(!saveWindow) {
      
      var templateNameField = new Ext.form.TextField({
        id: 'itWindowTemplateName', 
        anchor: '95%',
        value: templateName
      });
      
      var updateField = new Ext.form.Radio({
        boxLabel: Ext.String.format('#{msgs.role_mining_template_update}', originalTemplateName), 
        id: 'itWindowTemplateSaveUpdate', 
        name:'update'
      });
      
      updateField.on('check', function(checkbox){
        if(checkbox.checked) {
          Ext.get('itWindowTemplateNameLabel').hide();
          Ext.get('itWindowTemplateName').hide();
        }
      });
      
      var saveNewField = new Ext.form.Radio({
        xtype:'radio', 
        boxLabel: '#{msgs.role_mining_template_save_new}', 
        id: 'itWindowTemplateSaveNew', 
        name:'update'
      });
      
      saveNewField.on('check', function(checkbox){
        if(checkbox.checked) {
          Ext.get('itWindowTemplateNameLabel').show();
          Ext.get('itWindowTemplateName').show();
        }
      });
      
      saveWindow = new Ext.Window({
        layout: 'form',
        id: 'itMiningTemplateSaveWindow',
        width:400,
        title:'#{msgs.title_role_mining_template}',
        bodyStyle: 'padding:5px;',
        cls:'white',
        closeAction:'hide',
        modal:true,
        plain:true,
        labelWidth:5,
        defaults: {
          labelSeparator: ''
        },
        items: [
          {xtype:'box', style: 'margin-bottom:10px', autoEl: { tag: 'p', html: '#{msgs.role_mining_template_save_update_msg}'}},
          updateField,
          saveNewField,
          {xtype:'label', html: '#{msgs.role_mining_template_name}:', id:'itWindowTemplateNameLabel', style:'margin:10px 0 3px 0;display:block'},
          templateNameField         
        ],
        buttons: [
          {
            text: '#{msgs.button_save}',
            handler: function() {
            
              var validated = Ext.getCmp('itRoleMiningPanel').validateAutomatedDirectedMiningSelections();
              if(validated) {
                if(Ext.getCmp('itWindowTemplateSaveNew').checked) {
                  SailPoint.roles.saveITTemplate('ok',  Ext.getCmp('itWindowTemplateName').getValue());
                } else {
                  SailPoint.roles.saveITTemplate('update', Ext.getCmp('itWindowTemplateName').getValue());                
                }
              } else {
                Ext.MessageBox.alert('#{msgs.err_validation}', '#{msgs.err_bfr_launch_invalid}');
              }

              Ext.getCmp('itMiningTemplateSaveWindow').hide();
            }
          },{
            text: '#{msgs.button_cancel}',
            cls : 'secondaryBtn',
            handler: function() {
              Ext.getCmp('itMiningTemplateSaveWindow').hide();
            }
          }
        ]
      });      
    } else {
      /** Update the field label of the update radio **/
      $('itWindowTemplateSaveUpdate').nextSibling.innerHTML = Ext.String.format('#{msgs.role_mining_template_update}', originalTemplateName);
    }
    
    saveWindow.show();
    Ext.getCmp('itWindowTemplateSaveUpdate').setValue(true);
    Ext.getCmp('itWindowTemplateSaveNew').setValue(false);
  } else {
    /** If the user has hit save, the prompt hides the input field, need to show it**/
    SailPoint.roles.saveITTemplate('ok', templateName);
  }  
};

SailPoint.roles.saveITTemplate = function(btn, text) {  

  /** Saving a new template **/
  if(btn=="ok") {
    $('automatedDirectedMiningForm:itRoleMiningTemplateId').value = '';
    $('automatedDirectedMiningForm:itRoleMiningTemplateName').value = text;
    $('automatedDirectedMiningForm:itSaveTemplateBtn').click();
  } else if(btn=="update"){
    $('automatedDirectedMiningForm:itSaveTemplateBtn').click();
  }
};

SailPoint.roles.getAutomatedDirectedMiningCreationOption = function(type) {
    var inputEl;
    if (type == 'entitlement')
        inputEl = $('automatedDirectedMiningForm:entitlementCreationOption');
    else
        inputEl = $('automatedDirectedMiningForm:filterCreationOption');
    
    var selections = Ext.DomQuery.select('input', inputEl);
    var selectedValue;
    
    for (i = 0; i < selections.length; ++i) {
        if (selections[i].checked)
            selectedValue = selections[i].value;
    }
    
    return selectedValue;
}

