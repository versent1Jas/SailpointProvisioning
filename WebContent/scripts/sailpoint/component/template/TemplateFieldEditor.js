/**
* A standalone component that allows editing of Template Field Objects currently associated with roles and applications.
* PH 11/02/2009
*/
Ext.ns('SailPoint',
       'SailPoint.template',
       'SailPoint.template.TemplateEditor');


Ext.define('SailPoint.template.TemplateEditorConstants', {
    statics: {
        TYPE_NONE: 'none',
        TYPE_LITERAL: 'literal',
        TYPE_RULE: 'rule',
        TYPE_SCRIPT: 'script',
        TYPE_STRING: 'string',
        TYPE_REFERENCE: 'reference',
        TYPE_METHOD: 'method',
        TYPE_BUTTON: 'button',
        TYPE_ROLE_OWNER: 'IIQRoleOwner',
        TYPE_APP_OWNER: 'IIQApplicationOwner', // Deprecated
        TYPE_REQUESTER: 'IIQRequester',
        TYPE_DEPENDENCY: 'appDependency'
    } 
});

Ext.define('SailPoint.template.TemplateFieldEditor', {
  extend : 'Ext.form.Panel',

  editor : null,

  nameField : null,

  filterField : null,

  field: null, /** The field currently being edited **/
  
  statics: {
      // This 'afterlayout' handler is a hack to fix the field set width.  Ideally 
      // this would happen via the built-in style property but that's not performing 
      // as advertised.
      fixFieldSetStyle: function(fieldset, layout, options) {
          var fieldsetEl = fieldset.getEl();
          var fieldsetBodies;
          var i;
          fieldsetEl.setStyle('width', '100%');
          // More hacking to prevent the rule combos from being cut off unnecessarily
          fieldsetBodies = Ext.dom.Query.select('div[class*=x-fieldset-body]', fieldsetEl.dom);
          for (i = 0; i < fieldsetBodies.length; ++i) {
              fieldsetBodies[i].style['width'] = '100%';
          }
      }

  },

  initComponent : function() {
    var me = this; 
    
    this.typeStore = SailPoint.Store.createStore({
      model : 'SailPoint.model.NameValue',
      autoLoad: true,
      url: CONTEXT_PATH + '/include/template/templateFieldTypesDataSource.json',
      extraParams: {'parent':this.editor.beanType, 'id':this.editor.objectId},
      root: 'objects'
    });

    this.typeCombo = Ext.create('Ext.form.ComboBox', {
      id: 'fieldType',
      fieldLabel: '#{msgs.type}',
      allowBlank:false,
      name: 'type',
      displayField: 'name',
      valueField: 'value',
      triggerAction: 'all',
      typeAhead:true,
      queryMode:'local',
      selectOnFocus:true,
      forceSelection:true,
      minChars:1,
      listConfig : {width:350},
      width:350,
      parent: this,
      store: this.typeStore,
      listeners : {
          select : {
              fn : function(combo, record, index) {
                  var type = record[0].get('value');
                  this.displayType(type);
                  // jsl - should be using startsWith("sailpont.object") like below?
                  if (type == 'sailpoint.object.Identity' || type == 'sailpoint.object.ManagedAttribute') {
                      this.valueSourceRadios.setGroupValue(SailPoint.template.TemplateEditorConstants.TYPE_RULE);
                  } else {
                      this.valueSourceRadios.setGroupValue(SailPoint.template.TemplateEditorConstants.TYPE_LITERAL);                      
                  }
              },
              scope : this
          }
      }
    });

    this.filterField = new Ext.form.TextField({
        fieldLabel: '#{msgs.label_filter}',
        allowBlank: true,
        id: 'fieldFilter',
        name: 'filter',
        parent: this
    });

    if(this.editor.beanType=='identity') {

      Ext.define('SailPoint.model.ProvPolicyField', {
          extend : 'Ext.data.Model',
          fields: ['id', 'name', 'displayName', 'type']
      });
        
      this.nameStore = SailPoint.Store.createStore({
          model : 'SailPoint.model.ProvPolicyField',
          proxyType : 'memory',
          data: Ext.JSON.decode(Ext.getDom('createAttributes').value)
      });

      this.nameField = Ext.create('Ext.form.ComboBox', {
        id: 'fieldName',
        fieldLabel: '#{msgs.attribute}',
        allowBlank:false,
        name: 'name',
        displayField: 'name',
        valueField: 'name',
        triggerAction: 'all',
        typeAhead:true,
        queryMode:'local',
        selectOnFocus:true,
        forceSelection:false,
        minChars:1,
        listConfig : {width:350},
        parent: this,
        store: this.nameStore,
        listeners : {
            select : {
                fn : function(combo, record, index) {
                    this.selectAttribute(record[0]);
                },
                scope : this
            }
        }
      });

    } else {
      this.nameField = new Ext.form.TextField({
        fieldLabel: '#{msgs.name}',
        allowBlank: false,
        id: 'fieldName',
        name: 'name',
        parent: this
      });
    }

    this.valueSourceRadios = new Ext.form.RadioGroup({
      id: 'valueSourceRadio',
      fieldLabel: '#{msgs.template_editor_value}',
      parent:this,
      items: [
        {boxLabel: '#{msgs.template_editor_literal}', name: 'valueSource', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_LITERAL, checked:true},
        {boxLabel: '#{msgs.template_editor_rule}', name: 'valueSource', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_RULE},
        {boxLabel: '#{msgs.template_editor_script}', name: 'valueSource', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT},
        {id: 'dependencyRadio', boxLabel: '#{msgs.template_editor_dependent}', name: 'valueSource', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_DEPENDENCY}
      ],
      listeners : {
          change : {
              fn : function(group, radio) {
                  this.displayValueField(group, radio);
              },
              scope : this
          }
      }
    });

    this.allowedValuesRadios = new Ext.form.RadioGroup({
      id: 'allowedValuesRadio',
      fieldLabel: '#{msgs.template_editor_allowed_values}',
      parent:this,
      items: [
        {boxLabel: '#{msgs.none}', name: 'allowedValuesType', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_NONE, checked: true },
        {boxLabel: '#{msgs.template_editor_literal}', name: 'allowedValuesType', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_LITERAL},
        {boxLabel: '#{msgs.template_editor_rule}', name: 'allowedValuesType', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_RULE},
        {boxLabel: '#{msgs.template_editor_script}', name: 'allowedValuesType', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT}
      ],
      listeners : {
          change : {
              fn : function(group, radio) {
                  this.displayAllowedValuesField(group, radio);
              },
              scope : this
          }
      }
    });

    this.validationRadios = new Ext.form.RadioGroup({
      id: 'validationRadio',
      fieldLabel: '#{msgs.template_editor_validation}',
      parent:this,
      items: [
        {boxLabel: '#{msgs.none}', name: 'validationType', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_NONE, checked: true },
        {boxLabel: '#{msgs.template_editor_rule}', name: 'validationType', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_RULE},
        {boxLabel: '#{msgs.template_editor_script}', name: 'validationType', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT}
      ],
      listeners : {
          change : {
              fn : function(group, radio) {
                  this.displayValidationField(group, radio);
              },
              scope : this
          }
      }
    });

    var ownerItems = [
      {boxLabel: '#{msgs.template_editor_owner_requester}', name: 'ownerType', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_NONE, checked: true },
      {boxLabel: '#{msgs.template_editor_rule}', name: 'ownerType', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_RULE},
      {boxLabel: '#{msgs.template_editor_script}', name: 'ownerType', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT}
    ];
    
    if(this.editor.requireApplication) {
      ownerItems.push({boxLabel: '#{msgs.template_editor_owner_role}', name: 'ownerType', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_ROLE_OWNER});
      ownerItems.push({boxLabel: '#{msgs.template_editor_owner_app}', name: 'ownerType', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_APP_OWNER});
    }
    else if(this.editor.beanType == 'application'){
      ownerItems.push({boxLabel: '#{msgs.template_editor_owner_app}', name: 'ownerType', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_APP_OWNER});      
    }
    
    this.ownerRadios = new Ext.form.RadioGroup({
      id: 'ownerRadio',
      fieldLabel: '#{msgs.template_editor_owner}',
      parent:this,
      items: ownerItems
    });

    this.ownerRadios.on('change', function(group, radio) {
      me.displayOwnerField(group, radio); 
    });
    
    this.booleanCombo = new Ext.form.ComboBox({
      id:'defaultValueBoolean',
      name:'defaultValueBoolean',
      hideEmptyLabel: false,
      queryMode:'local',
      triggerAction: 'all',
      width : 200,
      displayField: 'name',
      valueField: 'value',
      store: SailPoint.Store.createStore({
          model: 'SailPoint.model.NameValue',
          data: [
              {name: '#{msgs.txt_true}', value: 'true'},
              {name: '#{msgs.txt_false}', value: 'false'}
          ]
      })
    });

    this.valueRulesStore = SailPoint.Store.createStore({
        model : 'SailPoint.model.NameValue',
        autoLoad: true,
        url: CONTEXT_PATH + '/include/rulesDataSource.json',
        extraParams: {'type':'FieldValue'},
        root: 'objects'
    });

    this.allowedValuesRulesStore = SailPoint.Store.createStore({
        model : 'SailPoint.model.NameValue',
        autoLoad: true,
        url: CONTEXT_PATH + '/include/rulesDataSource.json',
        extraParams: {'type':'AllowedValues'},
        root: 'objects'
    });

    this.validationRulesStore = SailPoint.Store.createStore({
        model : 'SailPoint.model.NameValue',
        autoLoad: true,
        url: CONTEXT_PATH + '/include/rulesDataSource.json',
        extraParams: {'type':'Validation'},
        root: 'objects'
    });

    this.ownerRulesStore = SailPoint.Store.createStore({
        model : 'SailPoint.model.NameValue',
        autoLoad: true,
        url: CONTEXT_PATH + '/include/rulesDataSource.json',
        extraParams: {'type':'Owner'},
        root: 'objects'
    });

    this.defaultValuesRule = new SailPoint.Rule.Editor.RuleComboBox({
      id: 'fieldRule',
      name: 'rule',
      hideEmptyLabel: false,
      displayField: 'name',
      valueField: 'value',
      triggerAction: 'all',
      listConfig : {width:350},
      store: this.valueRulesStore
    });

    this.valuesMultiSelect = new SailPoint.form.MultiText({
      allowedValues: [],
      name: 'allowedValues',
      hideEmptyLabel: false,
      id: 'fieldAllowedValues'
    });

    this.allowedValuesRule = new SailPoint.Rule.Editor.RuleComboBox({
      id: 'fieldAllowedValuesRule',
      hideEmptyLabel: false,
      name: 'allowedValuesRule',
      displayField: 'name',
      valueField: 'value',
      triggerAction: 'all',
      hidden:true,
      listConfig : {width:350},
      store: this.allowedValuesRulesStore
    });

    this.validationRule = new SailPoint.Rule.Editor.RuleComboBox({
      id: 'fieldValidationRule',
      hideEmptyLabel: false,
      name: 'validationRule',
      displayField: 'name',
      valueField: 'value',
      triggerAction: 'all',
      hidden:true,
      listConfig : {width:350},
      store: this.validationRulesStore
    });

    this.ownerRule = new SailPoint.Rule.Editor.RuleComboBox({
      id: 'fieldOwnerRule',
      hideEmptyLabel: false,
      name: 'ownerRule',
      displayField: 'name',
      valueField: 'value',
      triggerAction: 'all',
      hidden:true,
      listConfig : {width:350},
      store: this.ownerRulesStore
    });    
    
    
    this.readOnlyValue = Ext.create('sailpoint.template.TemplateBooleanValue', {
        id: "id1", 
        name: "readOnly", 
        fieldLabel: "#{msgs.objconfig_edit_mode_readonly}", 
        parent: this,
        fieldDefaults: {
            labelWidth:100,
            labelPad: 10
        },
        defaults: {
            msgTarget:'side',
            anchor: '95%',
            onHide: function(){this.bodyEl.up('.x-form-item').setStyle('display','none');},
            onShow: function(){this.bodyEl.up('.x-form-item').setStyle('display','block');}
        }
    });
    this.hiddenValue = Ext.create('sailpoint.template.TemplateBooleanValue', {
        id: "id2", 
        name: "hidden", 
        fieldLabel: "#{msgs.label_hidden}", 
        parent: this,
        fieldDefaults: {
            labelWidth:100,
            labelPad: 10
        },
        defaults: {
            msgTarget:'side',
            anchor: '95%',
            onHide: function(){this.bodyEl.up('.x-form-item').setStyle('display','none');},
            onShow: function(){this.bodyEl.up('.x-form-item').setStyle('display','block');}
        }
    });
    
    var saveButton = new Ext.Button({
        text: "#{msgs.nav_save}",
        cls : 'primaryBtn',
        hideParent: true,
        hideMode:'visibility',
        enableToggle: false
    });
    saveButton.on('click', this.save, this);

    var clearButton = new Ext.Button({
        text: "#{msgs.nav_reset}",
        hideParent: true,
        hideMode: 'visibility',
        enableToggle: false
    });
    clearButton.on('click', this.clear, this);

    /* If the user is in a read-only view, hide the buttons */
    if(this.editor.readOnly) {
      saveButton.hide();
      clearButton.hide();
    }
    
    //If we are in Application page, we need to add the ability to have suggest
    //for the app dependencies in the create policy.
    if($('editForm:appName')) {
        
        var appName = $('editForm:appName').getValue();
    
        Ext.define('SchemaAttr', {
           extend: 'Ext.data.Model',
           fields: [
                    {name: 'name'},
                    {name: 'id'},
                    {name: 'displayName'},
                    {name: 'attrType'}
                    ]
        });
    
        Ext.define('DependentApp', {
           extend: 'Ext.data.Model',
           fields: [
                    {name: 'id'},
                    {name: 'displayField'},
                    {name: 'displayName'}
                    ]
        });
        
        //Create the store for field dependencies.
        var schemaAttrStore = SailPoint.Store.createRestStore({
            model : 'SchemaAttr',
            url: SailPoint.getRelativeUrl('/rest/applications/{0}/schemaAttributes')
            
        });
        
        var appComboStore = Ext.create('Ext.data.Store', {
            id: 'appComboStore',
            model: 'DependentApp',
            proxy:{
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'objects'
                }
            },
            listeners: {
                load: function(store, records, succes, opts) {
                    var recs = Ext.getCmp('applicationDependencyCmp').selectedStore.getRange();
                    //Need to manipulate the data so the SailPoint Suggest will render properly
                    for(var i=0; i<recs.length; i++) {
                        if(SailPoint.Utils.isNullOrEmpty(recs[i].get('displayName'))) {
                            recs[i].set('displayName',recs[i].get('displayField'));
                            
                        }
                        if(SailPoint.Utils.isNullOrEmpty(recs[i].get('name'))) {
                            recs[i].set('name',recs[i].get('displayField'));
                        }
                    }
                    this.loadData(recs);
                }
            }
        });
        
        this.dependentAttr = new SailPoint.Suggest({
            id: 'fieldDependentAttr',
            name: 'dependentAttr',
            fieldLabel: '#{msgs.template_editor_dependent_attr}',
            valueField: 'name',
            forceSelection: true,
            disabled: true,
            store: schemaAttrStore,
            allowBlank: false,
            validateOnChange: false,
            validateOnBlur: false,
            listeners: {
                select : function(combo, rec, opts) {
                    if(rec[0].get("attrType")) {
                        Ext.getCmp("fieldType").setValue(rec[0].get("attrType"));
                    } else {
                        Ext.getCmp("fieldType").setValue("string");
                    }
                }
            }
        });
        
        
        this.dependentAppName = new SailPoint.Suggest({
            id: 'fieldDependentAppName',
            name: 'dependentApp',
            fieldLabel: '#{msgs.template_editor_dependent_app}',
            valueField: 'name',
            forceSelection: true,
            disabled: true,
            store: appComboStore,
            allowBlank: false,
            validateOnChange: false,
            validateOnBlur: false,
            listeners: {
                change: function(combo, newVal, oldVal, eOpts) {
                   if(SailPoint.Utils.isNullOrEmpty(newVal)) {
                       var schemaField = Ext.getCmp('fieldDependentAttr');
                       schemaField.getStore().removeAll();
                       schemaField.clearValue();
                   } else {
                       var tmp = this.getStore().findRecord('name',newVal);
                       if(tmp) {
                           var schema = Ext.getCmp('fieldDependentAttr');
                           schema.clearValue();
                           schema.getStore().removeAll();
                           schema.getStore().applyPathParams([newVal]);
                           schema.getStore().load();
                       }
                   }  
                }
            }
            
        });

    }
    
    

    Ext.apply(this, {
      bodyStyle: 'padding:10px;',
      fieldDefaults: {
          labelWidth:100,
          labelPad: 10
      },
      layout: 'anchor',
      defaults: {
        msgTarget:'side',
        anchor: '90%'
//        onHide: function(){this.bodyEl.up('.x-form-item').setStyle('display','none');},
//        onShow: function(){this.bodyEl.up('.x-form-item').setStyle('display','block');}
      },
      defaultType: 'textfield',
      items: [{
          id: 'fieldSetFieldProperties',
          name: 'fieldProperties',
          xtype: 'fieldset', 
          title: '#{msgs.template_editor_fieldset_field_properties}',
          defaultType: 'textfield',
          fieldDefaults: {
              labelWidth:100,
              labelPad: 10
          },
          defaults: {
              msgTarget:'side',
              anchor: '95%',
              onHide: function(){this.bodyEl.up('.x-form-item').setStyle('display','none');},
              onShow: function(){this.bodyEl.up('.x-form-item').setStyle('display','block');}
          },
          listeners : {
              afterlayout : {
                  fn : SailPoint.template.TemplateFieldEditor.fixFieldSetStyle
              }
          },
          items: [{
              xtype:'hidden', name:'fieldId', id:'fieldId'
          }, this.nameField, {
              fieldLabel:'#{msgs.att_display_name}', 
              allowBlank: true, 
              id:'fieldDisplayName', 
              name:'displayName'
          },{
              fieldLabel:'#{msgs.template_editor_help_key}', 
              id:'fieldHelpKey', 
              name: 'helpKey'
          }, 
          this.typeCombo, 
          this.filterField, {
              fieldLabel:'#{msgs.label_filter}', 
              allowBlank: true, 
              id:'fieldFilter', 
              name:'filter'
          }, 
          {
              xtype:'checkbox', 
              fieldLabel: '#{msgs.multi_valued}', 
              id:'fieldMulti', 
              name: 'multi'
          },
          this.readOnlyValue,
          this.hiddenValue,
          this.ownerRadios,
          this.ownerRule, {
              xtype:'textarea', 
              itemCls:'fieldOwnerScript', 
              hideEmptyLabel: false, 
              id:'fieldOwnerScript', 
              grow:true, 
              growMax:400, 
              growMin: 250, 
              height:50, 
              name: 'ownerScript', 
              hidden:true
          },{
              xtype:'checkbox', 
              fieldLabel: '#{msgs.required}', 
              id:'fieldRequired', 
              name: 'required'
          },{
              xtype:'checkbox', 
              fieldLabel: '#{msgs.template_editor_review_required}', 
              id:'fieldReviewRequired', 
              name: 'reviewRequired'
          },{
              xtype:'checkbox', 
              fieldLabel: '#{msgs.template_editor_post_back}', 
              id:'fieldPostBack', 
              name: 'postBack'
          },{
              xtype:'checkbox',
              fieldLabel: '#{msgs.template_editor_display_only}',
              id:'fieldDisplayOnly',
              name: 'displayOnly'
          },{
              xtype:'checkbox',
              fieldLabel: '#{msgs.template_editor_authoritative}',
              id:'fieldAuthoritative',
              name: 'authoritative'
          }]
      },
      {
          xtype: 'fieldset',
          id: 'fieldSetValueProp',
          title: '#{msgs.template_editor_fieldset_value_properties}',
          defaultType: 'textfield',
          defaults: {
              msgTarget:'side',
              anchor: '95%'
//              onHide: function(){this.bodyEl.up('.x-form-item').setStyle('display','none');},
//              onShow: function(){this.bodyEl.up('.x-form-item').setStyle('display','block');}
          },
          listeners : {
              afterlayout : {
                  fn : SailPoint.template.TemplateFieldEditor.fixFieldSetStyle
              }
          },
          items: [
                  this.valueSourceRadios, {
                      id:'fieldDefaultValue', 
                      name:'defaultValue', 
                      hideEmptyLabel: false
                  },{
                      xtype:'datefield', 
                      hideEmptyLabel: false, 
                      id:'fieldDefaultValueDate', 
                      name:'defaultValueDate'
                  }, this.booleanCombo,
                  this.defaultValuesRule, {
                      xtype:'textarea', 
                      hideEmptyLabel: false, 
                      itemCls:'fieldScript', 
                      id:'fieldScript', 
                      grow:true, 
                      growMax:400, 
                      growMin: 50, 
                      height:50, 
                      name: 'script'
                  }, {
                      xtype: 'fieldset',
                      id:'fieldAppDependent',
                      name: 'appDependent',
                      hidden: true,
                      items: [
                          this.dependentAppName,
                          this.dependentAttr
                      ],
                      listeners: {
                          //Set Disabled on hide so that the allowBlank validation does not try to validate
                          //when the dependent radio is not currently selected
                          hide: function(fieldset, opts) {
                              Ext.getCmp('fieldSetFieldProperties').items.each(function(i) {
                                  i.enable(); 
                               });
                              Ext.getCmp('fieldSetValueProp').items.each(function(i) {
                                 i.enable(); 
                              });
                              
                              if(Ext.getCmp('fieldDependentAppName')) {
                                  Ext.getCmp('fieldDependentAppName').setDisabled(true)
                              }
                              if(Ext.getCmp('fieldDependentAttr')) {
                                  Ext.getCmp('fieldDependentAttr').setDisabled(true);
                              }


                          },
                          show: function(fieldset, opts) {
                              Ext.getCmp('fieldSetFieldProperties').items.each(function(i) {
                                  if(i.getId() !== 'fieldDisplayName' && i.getId() !== 'fieldName' && i.getId() !== 'fieldId') {
                                      i.reset();
                                      i.disable();
                                  } 
                               });
                              Ext.getCmp('fieldSetValueProp').items.each(function(i) {
                                  if(i.getId() !== 'valueSourceRadio' && i.getId() !== 'fieldAppDependent') {
                                      i.reset();
                                      i.disable();
                                  }
                               });
                              if(Ext.getCmp('fieldDependentAppName')) {
                                  //Since we reuse the same component, we need to clear any validation errors upon show
                                  Ext.getCmp('fieldDependentAppName').setDisabled(false);
                                  Ext.getCmp('fieldDependentAppName').clearInvalid();
                              }
                              if(Ext.getCmp('fieldDependentAttr')) {
                                  Ext.getCmp('fieldDependentAttr').setDisabled(false);
                                  Ext.getCmp('fieldDependentAttr').clearInvalid();
                                  var rec = Ext.getCmp('fieldDependentAttr').getStore().findRecord('id', Ext.getCmp('fieldDependentAttr').getValue());
                                  if(rec && rec.get('attrType')) {
                                      Ext.getCmp('fieldType').setValue(rec.get('attrType'));
                                  } else {
                                      Ext.getCmp('fieldType').setValue("string");
                                  }
                              }

                          }
                      }
                      
                  },                  
                  this.allowedValuesRadios,
                  this.allowedValuesRule,
                  this.valuesMultiSelect, {
                      xtype:'textarea', 
                      hideEmptyLabel: false, 
                      id:'fieldAllowedValuesScript',
                      grow:true, 
                      growMax:400, 
                      growMin: 50, 
                      height:50, 
                      name: 'allowedValuesScript', 
                      hidden:true
                  }, this.validationRadios,
                  this.validationRule,{
                      xtype:'textarea', 
                      hideEmptyLabel: false, 
                      id:'fieldValidationScript', 
                      grow:true, 
                      growMax:400, 
                      growMin: 50, 
                      height:50, 
                      name: 'validationScript', 
                      hidden:true
                  },{
                      xtype:'checkbox', 
                      fieldLabel: '#{msgs.template_editor_dynamic}', 
                      id:'fieldDynamic', 
                      name: 'dynamic'
                  }
                  
              ]
      }
      ],
      bbar: [saveButton, clearButton]
    });
    
    this.on('beforeShow', function(suggest, opts){
        if(this.editor.usage == 'Create' && this.editor.beanType == 'application') {
            //Need to load the store each time this is shown in case the dependent apps were edited
            Ext.getCmp('fieldDependentAppName').getStore().load();
            Ext.getCmp('dependencyRadio').show();
        } else {
            Ext.getCmp('dependencyRadio').hide();
        }
    });
    
    
    this.callParent(arguments);
  },

  newField : function() {
    this.clear();

    this.valuesMultiSelect.clear();

    //refresh the store for Attributes because it is different between create/update
    if(Ext.getCmp('fieldName').getXType() !== 'textfield') {
        var fieldNameStore = Ext.getCmp('fieldName').getStore(); 
        fieldNameStore.clearFilter(); 
        fieldNameStore.loadData(Ext.JSON.decode($('createAttributes').value)); 
      }
    
    //Default to string type for new fields
    this.typeCombo.setValue(SailPoint.template.TemplateEditorConstants.TYPE_STRING);
    this.displayType(SailPoint.template.TemplateEditorConstants.TYPE_STRING);
    this.editor.fieldFormPanel.getLayout().setActiveItem(1);
    this.displayAllowedValuesField(this.allowedValuesRadios);
    this.applyReviewRequiredOptions();
  },

  overrideOwner: function(checkbox) {
    if(checkbox && checkbox.getValue()) {
      Ext.getCmp('fieldOwnerScript').show();
      Ext.getCmp('fieldOwnerScript').autoSize();
    } else {
      Ext.getCmp('fieldOwnerScript').hide();
      Ext.getCmp('fieldOwnerScript').setValue('');
    }
  },

  load : function(record) {
    // This function sets values on all items in the form,
    // descending through any fieldsets contained in the form as well
    var setValueOnFormItem = function(item) {
        var value = record.get(item.name);
        if (value || value !== undefined) {
            if (item.name && item.name !== 'allowedValues') { 
                if (item instanceof Ext.form.RadioGroup) {
                    item.setGroupValue(value);
                } else {
                    item.setValue(value);
                }
            }            
        } else if (item.items) {
            // Handle fieldsets
            item.items.each(setValueOnFormItem);                
        }
    };
    
    this.field = record;
    
    if(Ext.getCmp('fieldName').getXType() !== 'textfield') {
      var fieldNameStore = Ext.getCmp('fieldName').getStore(); 
      fieldNameStore.clearFilter(); 
      fieldNameStore.loadData(Ext.JSON.decode($('createAttributes').value)); 
    }

    this.displayType(record.get('type'));
    var valuesType = record.get('allowedValuesType');
    if(!valuesType) {
      valuesType = SailPoint.template.TemplateEditorConstants.TYPE_NONE;
    }
    this.allowedValuesRadios.setGroupValue(valuesType);

    var ownerType = record.get('ownerType');
    if(!ownerType) {
      ownerType = SailPoint.template.TemplateEditorConstants.TYPE_NONE;
    }
    this.ownerRadios.setGroupValue(ownerType);

    this.displayAllowedValuesField(this.allowedValuesRadios);

    this.valuesMultiSelect.clear();
    this.editor.fieldFormPanel.getLayout().setActiveItem(1);

    this.items.each(setValueOnFormItem);

    if(record.get('type') == 'boolean') {
        this.booleanCombo.setValue(record.get('defaultValue'));
    }
    else if(record.get('type') == 'date') {
        Ext.getCmp('fieldDefaultValueDate').setRawValue(record.get('defaultValue'));
    }
    

    Ext.getCmp('fieldId').setValue(record.getId());

    this.setValueField(record);
    this.setAllowedValuesField(record);
    this.setValidationField(record);
    this.setOwnerField(record);
    this.displayValidationField(this.validationRadios);
    this.applyReviewRequiredOptions();
    
  },

  /** Controls what fields are shown on the policy editor when a type is chosen **/
  displayType: function(type) {
    var literalRadio = this.valueSourceRadios.items.get(0); 
    Ext.getCmp('fieldScript').hide();
    Ext.getCmp('fieldDefaultValue').hide();
    this.booleanCombo.hide();
    Ext.getCmp('fieldDefaultValueDate').hide();
    Ext.getCmp('fieldRule').hide();
    literalRadio.setDisabled(false);
    
    if(type=='boolean'){
        this.booleanCombo.show();
        this.hideAllowedValues();
    }
    else if(type=='date'){
        Ext.getCmp('fieldDefaultValueDate').show();
        this.hideAllowedValues();
    }
    else if(type=='sailpoint.object.Identity'){
        this.hideAllowedValues();
        // The 'Value' radio and is not enabled for Identities.
        // Default to Rule instead.
        literalRadio.setDisabled(true);
    } 
    else {
        Ext.getCmp('fieldDefaultValue').show();
        this.showAllowedValues();
    }
    
    var filter = Ext.getCmp('fieldFilter');
    var spObjectPrefix = 'sailpoint.object';
    if (type != null &&  typeof(type) === 'string' 
    	&& type.substring(0,spObjectPrefix.length) == spObjectPrefix) {
        filter.show();
    }
    else {
        filter.hide();
    }

    this.applyMultiOption(type);

  },

  selectAttribute: function(record) {
    if(record.get('name') == 'name') {
      Ext.getCmp('fieldRequired').setValue(true);
    } else {
      Ext.getCmp('fieldRequired').setValue(false);
    }
    var type = record.get('type');
    if(!type) {
      type = 'string';
    }
    this.typeCombo.setValue(type);
    this.displayType(type);
    Ext.getCmp('fieldDisplayName').setValue(record.get('displayName'));
  },

  /** Load the value source and set up the correct fields **/
  setValueField: function(record) {
    if(record.get('script')) {
      this.valueSourceRadios.setGroupValue(SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT);
    } else if(record.get('rule')) {
      this.valueSourceRadios.setGroupValue(SailPoint.template.TemplateEditorConstants.TYPE_RULE);
    } else if(record.get('dependentApp')) {
      this.valueSourceRadios.setGroupValue(SailPoint.template.TemplateEditorConstants.TYPE_DEPENDENCY);
    } else if (record.get('type') == 'sailpoint.object.Identity') {
      // Literals are disabled for Identities so we can't use that as the default
      this.valueSourceRadios.setGroupValue(SailPoint.template.TemplateEditorConstants.TYPE_RULE);
    } else {
      // Default to literal for every other type
      this.valueSourceRadios.setGroupValue(SailPoint.template.TemplateEditorConstants.TYPE_LITERAL);
    }

    this.displayValueField(this.valueSourceRadios);
  },

  /** Displays the correct default value field based on what the value source is set to **/
  displayValueField: function(group) {
    if(group) {
        var valueSource = group.items.first().getGroupValue();

        Ext.getCmp('fieldScript').hide();
        Ext.getCmp('fieldDefaultValue').hide();
        this.booleanCombo.hide();
        Ext.getCmp('fieldDefaultValueDate').hide();
        Ext.getCmp('fieldRule').hide();
        if(Ext.getCmp('fieldAppDependent')) {
            Ext.getCmp('fieldAppDependent').hide();
        }
    
        var type = this.allowedValuesRadios.items.first().getGroupValue();

        if(valueSource==SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT) {
            Ext.getCmp('fieldScript').show();
            Ext.getCmp('fieldScript').autoSize();
        }
        else if(valueSource==SailPoint.template.TemplateEditorConstants.TYPE_RULE){
            Ext.getCmp('fieldRule').show();
        }
        else if(valueSource==SailPoint.template.TemplateEditorConstants.TYPE_DEPENDENCY) {
            Ext.getCmp('fieldAppDependent').show();
        }
        else {
            this.displayType(Ext.getCmp('fieldType').getValue());
        }
    }
  },

  setAllowedValuesField: function(record) {
    var allowedValue = record.get('allowedValues');
    var type = record.get('allowedValuesType');

    if(type==SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT) {
      Ext.getCmp('fieldAllowedValuesScript').setValue(allowedValue);
    } else if(type==SailPoint.template.TemplateEditorConstants.TYPE_RULE) {
      this.allowedValuesRule.setValue(allowedValue);
    } else if(type==SailPoint.template.TemplateEditorConstants.TYPE_LITERAL){
        var records = [];
        if (allowedValue) {
            for (var i = 0; i < allowedValue.length; ++i) {
                var value = allowedValue[i];
                
                records.push({id: value, displayName: value});
            }
        }
        
        this.valuesMultiSelect.setValue(records);
    }
  },
  
  applyReviewRequiredOptions: function() {
      var reviewRequiredEnabled = false;
      // Usages for provisioning policies
      var USAGES_WITH_REVIEW_REQUIRED = ['Create', 'Update', 'Delete', 'ChangePassword', 'Enable', 'Unlock', 'Disable','Assign', 'Deassign'];
      var reviewRequiredField = this.items.get('fieldSetFieldProperties').items.get('fieldReviewRequired');
      if(this.editor.beanType == 'application') {
          // Check for Standalone forms
          if (this.editor.usage == 'Standalone') {
              reviewRequiredEnabled = true;
          }
          for (i = 0; i < USAGES_WITH_REVIEW_REQUIRED.length; ++i) {
              if (this.editor.usage == USAGES_WITH_REVIEW_REQUIRED[i]) {
                  reviewRequiredEnabled = true;
              }
          }
      } else if (this.editor.beanType == 'role') { 
          reviewRequiredEnabled = true;
      }

      if (reviewRequiredEnabled) {
          reviewRequiredField.show();
      } else {
          reviewRequiredField.setValue(false);
          reviewRequiredField.hide();
      }
  },
  
  applyMultiOption: function(type) {
      var multi = Ext.getCmp('fieldMulti');
      var spObjectPrefix = 'sailpoint.object';
      var showMulti = false;
      if (!type) {
          showMulti = false;
      } else if (type.substring(0,spObjectPrefix.length) == spObjectPrefix) {
          // type.startsWith('sailpoint.object') is new in Javascript 1.8 
          // so needed to do the ugly hack above instead
          showMulti = true;
      } else if (type == SailPoint.template.TemplateEditorConstants.TYPE_STRING) {
          showMulti = true;
      }
      
      if (showMulti) {
          multi.show();
      } else {
          multi.hide();
      }
  },


  setValidationField: function(record) {
    var validationScript = record.get('validationScript');
    var validationRule = record.get('validationRule');
    var script = Ext.getCmp('fieldValidationScript');

    if(validationScript) {
      this.validationRadios.setValue({validationType:SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT});
      this.validationRule.setValue(null);
      script.setValue(validationScript);
      script.autoSize();
    } else if(validationRule) {
      this.validationRadios.setValue({validationType:SailPoint.template.TemplateEditorConstants.TYPE_RULE});
      this.validationRule.setValue(validationRule);
      script.reset();
    } else {
      this.validationRadios.setValue({validationType:SailPoint.template.TemplateEditorConstants.TYPE_NONE});
    }
  },

  setOwnerField: function(record) {
    var owner = record.get('owner');
    var type = record.get('ownerType');

    if(type==SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT) {
      Ext.getCmp('fieldOwnerScript').setValue(owner);
      Ext.getCmp('fieldOwnerScript').autoSize();
    } else if(type==SailPoint.template.TemplateEditorConstants.TYPE_RULE) {
      this.ownerRule.setValue(owner);
    }
  },

  /** Fired when the allowed values radio group changes to specify what type
   * of allowed value should be entered  */
  displayAllowedValuesField: function(group) {
    var type = group.getGroupValue();
    var script = Ext.getCmp('fieldAllowedValuesScript');

    this.valuesMultiSelect.hide();
    this.allowedValuesRule.hide();
    script.hide();

    var sourceType = this.valueSourceRadios.items.first().getGroupValue();

    if(type==SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT) {
      script.show();
      script.autoSize();
    } else if(type==SailPoint.template.TemplateEditorConstants.TYPE_RULE) {
      this.allowedValuesRule.show();
    } else if(type==SailPoint.template.TemplateEditorConstants.TYPE_LITERAL){
      this.valuesMultiSelect.show();
    }
  },

  /** Fired when the allowed values radio group changes to specify what type
   * of allowed value should be entered  */
  displayValidationField: function(group) {
    var type = group.items.first().getGroupValue();
    var script = Ext.getCmp('fieldValidationScript');

    this.validationRule.hide();
    script.hide();

    if(type==SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT) {
      script.show();
      script.autoSize();
    } else if(type==SailPoint.template.TemplateEditorConstants.TYPE_RULE) {
      this.validationRule.show();
    }
  },

  /** Displays the correct default value field based on what the value source is set to **/
  displayOwnerField: function(group) {
    var ownerType = group.items.first().getGroupValue();
    var ownerScript = Ext.getCmp('fieldOwnerScript');
    ownerScript.hide();
    this.ownerRule.hide();

    if(ownerType==SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT) {
      ownerScript.show();
      ownerScript.autoSize();
    } else if(ownerType==SailPoint.template.TemplateEditorConstants.TYPE_RULE){
      this.ownerRule.show();
    }
  },

  clear : function() {
    var resetItemsInForm = function(item) {
        if (item.reset) {
            item.reset();
            item.clearInvalid();            
        } else if (item.items) {
            // Handle field sets
            item.items.each(resetItemsInForm);
        }
    };
    
    this.items.each(resetItemsInForm);

    this.field = null;

    /** Clear the highlighted rows in the grid **/
    this.editor.fieldGrid.getStore().each(function(record){
      this.getView().removeRowCls(record, 'hightlightedGridRow');
    }, this.editor.fieldGrid);


    this.editor.fieldFormPanel.getLayout().setActiveItem(0);
  },

  save : function() {
    var field;
    var setItemsOnField = function(formItem) {
        if (formItem.getValue) {
            field.set(formItem.name, formItem.getValue());
        } else if (formItem.items){
            // This is a field set so we need to traverse it
            formItem.items.each(setItemsOnField);
        }
    };
    
    if(this.validate()) {
      if(Ext.getCmp('fieldName').getValue()) {
        var fieldId = Ext.getCmp('fieldId').getValue();
        
        /** If it's a new record, add it to the fields list **/
        if(!fieldId){
          var id = randomUUID();
          if(this.field) {
            field = this.field;
            field.id = id;
          } else {
            field = Ext.create('SailPoint.model.TemplateField', {id: id}, id);
          }
          this.items.each(setItemsOnField);

          if(field.get('type') == 'boolean') {
            field.set('defaultValue', this.booleanCombo.getValue());
          } else if(field.get('type') == 'date') {
            field.set('defaultValue', Ext.getCmp('fieldDefaultValueDate').getRawValue());
          }

          field = this.setValueSource(field);
          field = this.setAllowedValues(field);
          field = this.setValidation(field);
          field = this.setOwner(field);

          if(field.get('displayName')) {
              /** Make AJAX call to fetch the localized displayName and add the new Field to the store */
              this.addLocalizedDisplayToField(field, true);
          } else {
              /** DisplayName wasn't provided, therefore we have nothing to localize */
              this.editor.fieldStore.insert(this.editor.fieldStore.getCount(),[field]);
          }
          
          
        } else {
          /** Updating a record...find the record in the store and update it. */
          field = this.editor.fieldStore.getById(fieldId);
          this.items.each(setItemsOnField);

          if(field.get('type') == 'boolean') {
            field.set('defaultValue', this.booleanCombo.getValue());
          } else if(field.get('type') == 'date') {
            field.set('defaultValue', Ext.getCmp('fieldDefaultValueDate').getRawValue());
          }

          field = this.setValueSource(field);
          field = this.setAllowedValues(field);
          field = this.setValidation(field);
          field = this.setOwner(field);
        }
        
        if(field.get('displayName')) {
            /** Make AJAX call to fetch the localized displayName and refresh the grid */
            this.addLocalizedDisplayToField(field, false);
        } else {
            /** DisplayName wasn't provided, therefore we have nothing to localize */
            //mark whole entry dirty because only fields edited will show up 
            //dirty and they may not be on the table
            field.setDirty(true);
            //Clear and localizedDispalyName we may have previously had
            field.set('localizedDisplayName', '');
            this.editor.fieldGrid.view.refresh(true);

            this.clear();
        }


      }
    }
  },

  setValueSource : function(field) {
    var valueSource = this.valueSourceRadios.items.first().getGroupValue();
    if(valueSource=='script') {
      field.set('defaultValue','');
      field.set('rule','');
      field.set('dependentApp','');
      field.set('dependentAttr','');
    } else if(valueSource=='rule') {
      field.set('defaultValue','');
      field.set('script','');
      field.set('dependentApp','');
      field.set('dependentAttr','');
    } else if(valueSource=='appDependency') {
      field.set('defaultValue','');
      field.set('script','');
      field.set('rule','');
    } else {
      field.set('rule','');
      field.set('script','');
      field.set('dependentApp','');
      field.set('dependentAttr','');
    }
    return field;
  },

  setAllowedValues : function(field) {
    var type = this.allowedValuesRadios.items.first().getGroupValue();
    var value = '';

    if(type==SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT) {
      value = Ext.getCmp('fieldAllowedValuesScript').getValue();
    } else if(type==SailPoint.template.TemplateEditorConstants.TYPE_RULE) {
      value = this.allowedValuesRule.getValue();
    } else if(type==SailPoint.template.TemplateEditorConstants.TYPE_LITERAL){
      value = this.valuesMultiSelect.getValue();
    } else {
      value = null;
    }

    field.set('allowedValuesType', type);
    field.set('allowedValues', value);
    return field;
  },

  setValidation : function(field) {
    var type = this.validationRadios.items.first().getGroupValue();
    var rule = '';
    var script = '';

    if(type==SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT) {
      script = Ext.getCmp('fieldValidationScript').getValue();
    } else if(type==SailPoint.template.TemplateEditorConstants.TYPE_RULE) {
      rule = this.validationRule.getValue();
    }

    field.set('validationScript', script);
    field.set('validationRule', rule);
    return field;
  },

  setOwner : function(field) {
    var type = this.ownerRadios.items.first().getGroupValue();
    var rule = '';
    var script = '';

    if(type==SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT) {
      field.set('owner',Ext.getCmp('fieldOwnerScript').getValue());
    } else if(type==SailPoint.template.TemplateEditorConstants.TYPE_RULE) {
      field.set('owner',this.ownerRule.getValue());
    } else {
      if(type==SailPoint.template.TemplateEditorConstants.TYPE_NONE) {
        field.set('owner', '');
      } else {
        field.set('owner',type);
      }
    }

    field.set('ownerType', type);
    return field;
  },

  validate : function() {
    var isValid = true;
    var validateItemInForm = function(item) {
        var isItemValid;
        if (item.validate) {
            isItemValid = item.validate();
            if(!isItemValid) {
              isValid = false;
            }
        } else if (item.items){
            // This is a field set that needs to be traversed
            item.items.each(validateItemInForm);
        }
      }; 

    if(Ext.getCmp('fieldForm').isVisible()){
      this.items.each(validateItemInForm);

      if(!isValid)
        return isValid;

      isValid = this.validateDuplicates();
    }
    return isValid;
  },

  /** Need to prevent duplicate field names **/
  validateDuplicates : function() {
    var nameCmp = Ext.getCmp('fieldName');
    var name = nameCmp.getValue();
    var id = Ext.getCmp('fieldId');

    if(name) {
      /** Check in current editor **/
      var dupe = this.editor.fieldStore.findBy(
          function(record, id) {
            if(record.get('name')==name)
              return id;
          }
      );
      if(dupe>=0) {

        /** Get the dupe's id to see if these are the same field **/
        var record = this.editor.fieldStore.getAt(dupe);
        if(record.getId() != id.getValue() && record.get('name')==name) {
          this.invalidateField('fieldName', '#{msgs.template_editor_error_duplicate}');
          return false;
        }
      }

      /** Check against other templates with same purview **/
      var templatesField = $('templatesJSON');
      if(templatesField) {
        var templates = Ext.JSON.decode(templatesField.value);
        if(templates.length>1 && $('editForm:templateId')) {          
          var templateId = $('editForm:templateId').value;
          var purview = this.editor.applicationSuggest.getValue();
          for(var i=0; i<templates.length; i++) {
            var template = Ext.JSON.decode(templates[i]);
            
            if (typeof template === 'string') {
                template = Ext.JSON.decode(template);
            }
  
            /** If this is a different template, but with the same purview, check for dupes **/
            if(template.id!=templateId && purview == template.purview && template.fields.length>0) {
              for(var j=0; j<template.fields.length; j++) {
                var field = template.fields[j];
                if(field.name == name) {
                  this.invalidateField('fieldName', '#{msgs.template_editor_error_duplicate}');
                  return false;
                }
              }
            }
  
          }
        }
      }
    }

    nameCmp.clearInvalid();
    return true;
  },

  invalidateField : function(fieldId, message) {
    var field = Ext.getCmp(fieldId);
    if(field) {

      field.markInvalid(message);
      this.editor.statusBar.setStatus({
        text:message,
        iconCls:this.editor.errorIconCls,
        clear: {
          wait: 7000,
          anim: true,
          useDefaults: false
        }
      });
    }
  },
  
  hideAllowedValues: function() {
      this.allowedValuesRadios.hide();
      this.valuesMultiSelect.hide();
      this.allowedValuesRule.hide();
      Ext.getCmp('fieldAllowedValuesScript').hide();
  },
  
  showAllowedValues: function() {
      var allowedValuesType = this.allowedValuesRadios.items.first().getGroupValue();
      this.allowedValuesRadios.show();
      if (allowedValuesType == SailPoint.template.TemplateEditorConstants.TYPE_LITERAL) {
          this.valuesMultiSelect.show();
          this.allowedValuesRule.hide();
          Ext.getCmp('fieldAllowedValuesScript').hide();
      } else if (allowedValuesType == SailPoint.template.TemplateEditorConstants.TYPE_RULE) {
          this.valuesMultiSelect.hide();
          this.allowedValuesRule.show();
          Ext.getCmp('fieldAllowedValuesScript').hide();          
      } else if (allowedValuesType == SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT) {
          this.valuesMultiSelect.hide();
          this.allowedValuesRule.hide();
          Ext.getCmp('fieldAllowedValuesScript').show();
      } else {
          this.valuesMultiSelect.hide();
          this.allowedValuesRule.hide();
          Ext.getCmp('fieldAllowedValuesScript').hide();          
      }
  },
  
  addLocalizedDisplayToField : function(field, isNewField){

      var url = Ext.String.format("/rest/messageCatalog/{0}", field.get('displayName'));

      Ext.Ajax.request({
          scope:this,
          method: 'GET',
          url: SailPoint.getRelativeUrl(url),
          success: function(response){

              var respObj = Ext.decode(response.responseText);
              if(isNewField) {
                  field.set("localizedDisplayName", respObj);
                  this.editor.fieldStore.insert(this.editor.fieldStore.getCount(),[field]);
              } else {
                  field.set("localizedDisplayName", respObj);
                  //mark whole entry dirty because only fields edited will show up 
                  //dirty and they may not be on the table
                  field.setDirty(true);
                  this.editor.fieldGrid.view.refresh(true);

                  this.clear();
              }
              
              return field;
          },
          failure: function(response){
              if(isNewField) {
                  this.editor.fieldStore.insert(this.editor.fieldStore.getCount(),[field]);
              } else {
                  //mark whole entry dirty because only fields edited will show up 
                  //dirty and they may not be on the table
                  field.setDirty(true);
                  this.editor.fieldGrid.view.refresh(true);

                  this.clear();
              }
          }
      });
  }

});
