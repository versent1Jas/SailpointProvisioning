/**
* A standalone component that allows editing of Template Field Objects currently associated with roles and applications.
* This is the Editor that wraps the field editors.
* PH 11/02/2009
*/
Ext.ns('SailPoint',
        'SailPoint.template',
        'SailPoint.template.TemplateEditor');

SailPoint.template.TemplateEditor.EditorPanel = null;
SailPoint.template.TemplateEditor.REQUIRED_FIELDS = [];

SailPoint.template.TemplateEditor.ShowEditorPanel = function(beanType, usage) {

  if(!SailPoint.template.TemplateEditor.EditorPanel) {
    SailPoint.template.TemplateEditor.EditorPanel = new SailPoint.Template.TemplateEditor({
      id: 'templateEditor',
      layout:'border',
      height: SailPoint.template.TemplateEditor.PANEL_HEIGHT,
      beanType:beanType,
      usage: usage
    });

    SailPoint.template.TemplateEditor.EditorPanel.render('templateEditorPanel');
    SailPoint.template.TemplateEditor.EditorPanel.load();
  } else {
      SailPoint.template.TemplateEditor.EditorPanel.setUsage(usage);
  }
};

Ext.define('SailPoint.template.TemplateEditor', {
    extend : 'Ext.panel.Panel',
    requires: 'SailPoint.template.TemplateFieldEditor',
    
  fieldGrid : null,

  fieldStore : null,

  fieldForm : null,

  fieldFormPanel: null,
  
  fieldFormPanelTitle: "#{msgs.template_editor_edit_fields}",
  
  /** The field data that we use to load the fields when the editor opens **/
  fieldData: {"totalCount":0,"objects":[]},
  
  /** Simple array of fields we want to serialize into JSON and save **/
  fieldArray: '',

  applicationSuggest: null,

  requireApplication: false,

  requireName: false,
  
  reviewRequiredEnabled: false,

  hideOwner: true,
  
  templateOwnerMethod : null,
  
  templateOwnerSource : null,
  
  readOnly: false,

  errorText: '#{msgs.window_invalid}',

  errorIconCls : 'x-status-error',

  typeStore : null,
  
  detailsHeight : 120,
  
  beanType: null,
  
  usage: null,
  
  initComponent : function(){
    var i;
    
    /**
     * Added this at the very end of the 5.0 release so that we can lookup the
     * localized name for field type. We have a similiar datasource in
     * ProvisiongPolicyFieldEditor, so there's some duplication which
     * should be resolved post 5.0  - jfb
     */
    this.typeStore = SailPoint.Store.createStore({
      model : 'SailPoint.model.Value',
      storeId:'fieldTypeStore',
      autoLoad: true,
      url: CONTEXT_PATH + '/include/template/templateFieldTypesDataSource.json',
      root: 'objects'
    });

    this.typeStore.load();
    if(this.beanType == 'application') {
      this.requireName = true;
      this.hideOwner = false;
      // In this case the status of review required will be initialized when 
      // the usage is applied to this editor.  Apps are special because all the
      // usages share an editor.
    } else if(this.beanType == 'role') {
      this.requireApplication = true;
      this.requireName = true;
      this.hideOwner = false;
    } else if(this.beanType == 'identity') {
        this.requireApplication = false;
        this.requireName = true;
    } else if(this.beanType == 'workflow') {
      this.requireApplication = false;
      this.requireName = true;
    } else {
      this.requireApplication = false;
      this.requireName = false;
    }

    this.templateName = new Ext.form.TextField({
      fieldLabel: '#{msgs.name}',
      id: 'templateName',
      allowBlank: !this.requireName,
      anchor:'95%'
    });

    this.templateDescription = new Ext.form.TextArea({
      fieldLabel:'#{msgs.label_description}',
      name: 'templateDescription',
      id: 'templateDescription',
      grow:true,
      growMax:400,
      anchor: '95%',
      growMin: 50,
      height:50
    });

    var ownerItems = [
          {boxLabel: '#{msgs.none}', name: 'templateOwner', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_NONE, checked: true },
          {boxLabel: '#{msgs.template_editor_rule}', name: 'templateOwner', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_RULE},
          {boxLabel: '#{msgs.template_editor_script}', name: 'templateOwner', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT}
    ];
    
    /** Only show the role owner field if this is on the roles grid **/
    if(this.requireApplication) {
      ownerItems.push({boxLabel: '#{msgs.template_editor_owner_role}', name: 'templateOwner', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_ROLE_OWNER});
      ownerItems.push({boxLabel: '#{msgs.template_editor_owner_application}', name: 'templateOwner', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_APP_OWNER});
    } else if(this.beanType=='application'){
      ownerItems.push({boxLabel: '#{msgs.template_editor_owner_application}', name: 'templateOwner', inputValue: SailPoint.template.TemplateEditorConstants.TYPE_APP_OWNER});
    } 
    
    this.templateOwnerRadios = new Ext.form.RadioGroup({
      id: 'templateOwnerRadios',
      fieldLabel: '#{msgs.template_editor_owner}',
      parent:this,
      items: ownerItems
    });

    this.templateOwnerRadios.on('change', function(group, radio) {
      this.parent.displayOwnerField(group, radio);
    });

    this.templateRulesStore = new Ext.data.Store({
      model : 'SailPoint.model.NameValue',
      autoLoad: true,
      proxy : {
          type : 'ajax',
          url: CONTEXT_PATH + '/include/rulesDataSource.json',
          extraParams: {'type':'Owner'},
          reader : {
              type : 'json',
              root: 'objects'
          }
      }
    });

    this.templateOwnerRule = new SailPoint.Rule.Editor.RuleComboBox({
      id: 'templateOwnerRule',
      fieldLabel: '#{msgs.template_editor_owner_rule}',
      name: 'templateOwnerRule',
      displayField: 'name',
      valueField:'value',
      triggerAction: 'all',
      width:400,
      hidden:true,
      listConfig : {width:400},
      store: this.templateRulesStore
    });

    this.templateOwnerScript = new Ext.form.TextArea({
      fieldLabel:'#{msgs.template_editor_owner_script}',
      name: 'templateOwnerScript',
      id: 'templateOwnerScript',
      grow:true,
      hidden:true,
      anchor: '95%',
      height:60
    });
    
    /** When this is used on the business process editor, there is no
     * need for the application suggest, so just make a box component
     */
    if($('templateApplication')) {
      this.applicationSuggest = new SailPoint.BaseSuggest({
        id: 'templateApplicationSuggestCmp',
        baseParams: {'suggestType': 'application'},
        fieldLabel:'#{msgs.application}',
        allowBlank: false,
        binding: 'templateApplication',
        emptyText: '#{msgs.select_application}',
        width: 300
      });
    } else {
      this.applicationSuggest = new Ext.Component({
        id: 'templateApplicationSuggestCmp',
        autoEl: { tag: 'span', html: ''}        
      });
    }

    if(this.hideOwner) {
      detailsItems = [this.templateName,
                      this.applicationSuggest,
                      this.templateDescription];
    } else {
      detailsItems = [this.templateName,
                      this.applicationSuggest,
                      this.templateDescription,
                      this.templateOwnerRadios,
                      this.templateOwnerRule,
                      this.templateOwnerScript];
      this.detailsHeight = this.detailsHeight + 85;
    }
    
    this.detailsPanel = new Ext.form.Panel({
      id: 'templateDetailsPanel',
      window: this,
      region:'north',
      height:this.detailsHeight,
      bodyStyle : 'padding:5px',
      autoScroll: true,
      items: detailsItems,
      defaults: {
        msgTarget:'side',
        onHide: function(){this.getEl().up('.x-form-item').setStyle('display','none');},
        onShow: function(){this.getEl().up('.x-form-item').setStyle('display','block');}
      }
    });

    this.fieldStore = SailPoint.Store.createStore({
        model : SailPoint.model.TemplateField,
        proxyType : 'memory',
        root : 'objects',
        data: this.getFieldData()
    });

    

    this.fieldGrid = new SailPoint.grid.PagingCheckboxGrid({
      region:'west',
      id:'fieldGrid',
      pageSize:999,
      store: this.fieldStore,
      selModel: new SailPoint.grid.CheckboxSelectionModel({noPaging : true}),
      columns: [
                {"name":"localizedDisplayName", "header":"#{msgs.name}", "dataIndex":"localizedDisplayName", "width":250,
                    renderer: function(value, meta, record, row, col, store, gridView) {
                      return SailPoint.Utils.isNullOrEmpty(value) ? record.get('name') : value;
                    }
                },
                {"name":"type", "header":"#{msgs.type}", "dataIndex":"type", "renderer": this.renderType}
               ],
      width: 350,
      editor:this,
      tbar: this.getToolbar(),
      bbar: {
          xtype : 'pagingtoolbar',
          store: this.fieldStore,
          displayInfo: true,
          hidden:true
      }
    });

    // When a users clicks a row we want to highlight the row so
    // they know what they're working on in the right panel.
    // We can't use the default ext selected row class b/c that
    // affects image used in the row selection checkboxes (by design).
    // This routine highlights the row without any side effects.
    this.fieldGrid.on('itemClick', function(gridView, record, HTMLitem, index, e, eOpts){//(grid, rowIdx, colIdx, e){
        if (gridView.clickedColumn < 1) {
            return;
        }
        
      gridView.getStore().each(function(record){
          var idx = this.getStore().indexOf(record);
          if (idx == index) {
              this.addRowCls('hightlightedGridRow');
          } else {
              this.removeRowCls('hightlightedGridRow');
          }
      }, gridView);

      var record = this.store.getAt(index);
      this.editor.editField(record);
    }, this.fieldGrid);

    this.fieldGrid.getSelectionModel().on('selectionchange', function(sel) {

      if(sel.selected.getCount()>0 || sel.selected.isAllSelected()) {
        Ext.getCmp('removeButton').enable();
      } else {
        Ext.getCmp('removeButton').disable();
      }
    }, this.fieldGrid);

    this.fieldForm = new SailPoint.template.TemplateFieldEditor({
      id:'fieldForm',
      editor:this,
      autoScroll: true
    });

    this.fieldFormPanel = new Ext.Panel({
      id:'fieldFormPanel',
      title:this.fieldFormPanelTitle,
      layout:'card',
      activeItem:0,
      region:'center',
      items:this.getFieldFormItems()
    });
    
    this.statusBar = Ext.ComponentManager.create({
      xtype: 'statusbar',
      id: 'templateEditorStatusBar',
      region: 'south',
      defaultText: ''
    });
    
    Ext.apply(this, {
      header: false,
      layout: 'border',
      region:'center',
      items: this.getItems()
    });

    this.callParent(arguments);
  },
  
  
  /** An overridable function for loading the items to be displayed in this panel **/
  getItems : function() {
    return [this.fieldGrid, this.detailsPanel, this.fieldFormPanel, this.statusBar];
  },
  
  getFieldFormItems : function() {
    return [{
      html:"<div style='margin-top: 30px; text-align: center;' id='correlationPanelMsg'>#{msgs.template_editor_select_field}</div>"
    },
    this.fieldForm];
  },

  addField : function() {
    this.fieldGrid.deselectAll();
    this.fieldForm.newField();
  },

  editField : function(record) {
    this.fieldForm.load(record);
  },
  
  removeField : function() {
    var store = this.fieldGrid.getStore();

    for(var i=0; i<this.fieldGrid.getSelectedIds().length; i++) {
      var id = this.fieldGrid.getSelectedIds()[i];
      if(this.fieldGrid.getExcludedIds().indexOf(id)>-1) {
        continue;
      }
      var record = store.getById(id);
      store.remove(record);
    }
    this.fieldGrid.getSelectionModel().toggleUiHeader(false);
    this.fieldGrid.deselectAll();
    this.fieldForm.clear();
  },

  /** Strips the 'sailpoint.object.' off of the front of the type if it's an object **/
  renderType : function(value, p, r) {
    if(value.indexOf('sailpoint.object.')===0){
      value = value.substring(17);
    }

    var lookupValue = null;
    var store = Ext.StoreMgr.get('fieldTypeStore');

    if (store){
        store.each(function(item){
            if (value == item.get('value'))
                lookupValue = item.get('name');
        });
    }

    if (lookupValue)
        return lookupValue;
    else
        return value;
  },

  /** Displays the correct default value field based on what the value source is set to **/
  displayOwnerField: function(group) {
    var ownerType = group.items.first().getGroupValue();
    this.templateOwnerScript.hide();
    this.templateOwnerRule.hide();

    if(ownerType==SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT) {
      this.templateOwnerScript.show();
    } else if(ownerType==SailPoint.template.TemplateEditorConstants.TYPE_RULE){
      this.templateOwnerRule.show();
    }
  },

  loadOwnerField : function() {
    var ownerType = this.getFieldValue('templateOwnerType');
    var owner = this.getFieldValue('templateOwner');
    this.setOwnerType(ownerType, owner);
  },

  setOwnerType : function(ownerType, owner) {
    if(!ownerType)
      ownerType = SailPoint.template.TemplateEditorConstants.TYPE_NONE;

    this.templateOwnerRadios.setValue({templateOwner:ownerType});
    if (ownerType==SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT) {
      this.templateOwnerScript.setValue(owner);
      this.templateOwnerScript.show();
      this.templateOwnerScript.autoSize();
    }
    else if (ownerType==SailPoint.template.TemplateEditorConstants.TYPE_RULE) {
      this.templateOwnerRule.setValue(owner);
      this.templateOwnerRule.setRawValue(this.getFieldValue('templateRuleName'));
      this.templateOwnerRule.show();
    }
  },

  load : function() {
    var me = this;
    
    this.fieldStore.loadRawData(this.getFieldData());
    this.fieldForm.clear();
    this.templateName.setValue(this.getFieldValue('templateName'));
    this.templateName.clearInvalid();
    this.templateDescription.setValue(this.getFieldValue('templateDescr'));

    this.loadOwnerField();

    if(this.requireApplication) {
      var appId = $('editForm:templateApplicationId').innerHTML;
      var appName = $('editForm:templateApplicationName').innerHTML;
      $('templateApplication').value = appId;
      
      me.applicationSuggest.getStore().load({
        params: {
          query: appName
        },
        callback: function() {
          me.applicationSuggest.setValue(appId);
        }
      });
    } else {
      me.applicationSuggest.hide();
    }
  },

  /** Perform Validation of the name/application **/
  validate : function() {

    if(!this.templateName.validate())
    {
      this.statusBar.setStatus({
        text: '#{msgs.error_provisioning_policy_name_required}',
        iconCls:this.errorIconCls,
        clear: {
          wait: 7000,
          anim: true,
          useDefaults: false
        }
      });
      this.templateName.focus(true,true);
      return false;
    }

    if(this.requireApplication && !this.applicationSuggest.getValue())
    {
      this.applicationSuggest.focus(true,true);
      return false;
    }

    if(this.applicationSuggest.clearInvalid)
      this.applicationSuggest.clearInvalid();
    
    //if creating new identity ensure it has a name field and passwords if required
    if(this.usage === 'CreateIdentity'){
        if(!this.validateRequiredField('name', '#{msgs.error_identity_provisioning_policy_name}')) {
            return false;
        }
        if($('passwordRequired').value == true || $('passwordRequired').value == 'true'){
            if(!this.validateRequiredField('password', '#{msgs.error_identity_provisioning_policy_password}')) {
                return false;
            }

            if(!this.validateRequiredField('passwordConfirm', '#{msgs.error_identity_provisioning_policy_password_confirmation}')) {
                return false;
            }
        }
    }
    
    return true;
  },
  
  /**
   * Validate that the template contains a field with the given name.  If not,
   * display the given error message in the status bar and return false.
   */
  validateRequiredField: function(fieldName, errorMsg) {
      if(!this.hasField(fieldName)){
          this.addField();
          this.fieldForm.invalidateField('fieldName', errorMsg);
          return false;
      }
      return true;
  },
  
  /**
   * Return whether a field with the given name is defined in this template.
   */
  hasField: function(fieldName) {
      var i;
      for (i=0; i < this.fieldStore.getCount(); i++) {
          if (this.fieldStore.getAt(i).data.name === fieldName) {
              return true;
          }
      }
      return false;
  },

  saveOwnerField : function() {
    if(this.templateOwnerRadios.items.first().getGroupValue) {
      this.templateOwnerSource = '';
      this.templateOwnerMethod = this.templateOwnerRadios.items.first().getGroupValue();

      if(this.templateOwnerMethod==SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT) {
        this.templateOwnerSource = this.templateOwnerScript.getValue();
      } else if(this.templateOwnerMethod==SailPoint.template.TemplateEditorConstants.TYPE_RULE) {
        this.templateOwnerSource = this.templateOwnerRule.getValue();
      } else if(this.templateOwnerMethod!=SailPoint.template.TemplateEditorConstants.TYPE_NONE) {
        this.templateOwnerSource = this.templateOwnerMethod;
      } 
      
      this.setFieldValue('templateOwner', this.templateOwnerSource);      
      this.setFieldValue('templateOwnerType', this.templateOwnerMethod);
    }
  },

  saveChanges : function() {
    /** Save the field form **/
    this.fieldForm.save();

    /** Serialize and save the the template fields as JSON and pass back to bean **/
    var fieldStore = Ext.getCmp('fieldGrid').getStore();
    this.fieldArray = [];

    for(var i=0; i<fieldStore.getCount(); i++) {
      var record = fieldStore.getAt(i).data;
      this.fieldArray.push(record);
    }

    var fieldsJSON = Ext.JSON.encode(this.fieldArray);

    /** Set the form fields **/
    this.setFieldValue('templateName',this.templateName.getValue());
    this.setFieldValue('templateDescr', this.templateDescription.getValue());
    this.setFieldValue('templateFieldsString', fieldsJSON);

    this.saveOwnerField();
  },

  save : function() {
    if(this.validate() && this.fieldForm.validate()) {

      this.saveChanges();

      /** Overridable final save action **/
      this.submitChanges();

      return true;
    }
    return false;
  },
  
  getFieldData : function() {
    var fieldJsonContainer = $('templateFieldJSON');
    
    if(fieldJsonContainer) {
      this.fieldData = Ext.JSON.decode(fieldJsonContainer.value);
    }
    
    return this.fieldData;
  },
  
  getFieldValue : function(fieldName) {
    var field = $('editForm:'+fieldName);
    if(field)
      return field.value;
  },
  
  setFieldValue : function(fieldName, value) {
    var field = $('editForm:'+fieldName);
    if(field)
      field.value = value;
  },
  
  submitChanges : function() {
    $('editForm:templateSaveBtn').click();
  },
  
  getToolbar : function() {
    var addButton = new Ext.Button({
      text: "#{msgs.template_editor_add_field}",
      cls : 'primaryBtn',
      hideParent:true,
      editor:this
    });
    addButton.on('click', this.addField, this);
  
    var removeButton = new Ext.Button({
        text: "#{msgs.template_editor_remove_field}",
        id: 'removeButton',
        hideParent: true,
        enableToggle: false,
        disabled: true
    });
    removeButton.on('click', this.removeField, this);
  
    /* If the user is in a read-only view, hide the buttons */
    if(this.readOnly) {
      addButton.hide();
      removeButton.hide();
    }
    
    return new Ext.Toolbar({
      items:[addButton, removeButton]
    });
  },
  
  setUsage: function(usage) {
      this.usage = usage;
  }
});
