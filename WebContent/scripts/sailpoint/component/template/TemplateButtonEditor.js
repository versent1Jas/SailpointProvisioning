Ext.define('SailPoint.template.TemplateButtonEditor', {
  extend : 'Ext.form.Panel',

  editor: null,

  initComponent : function() {
    this.actionStore = SailPoint.Store.createRestStore({
      fields : ['name','value'],
      autoLoad : true,
      method: 'POST',
      filterOnLoad: false,
      url : SailPoint.getRelativeUrl('/rest/form/buttons')
    });

    this.actionField = Ext.create('Ext.form.ComboBox', {
      id: 'buttonAction',
      fieldLabel: '#{msgs.action}',
      allowBlank:false,
      name: 'action',
      displayField: 'name',
      valueField: 'value',
      triggerAction: 'all',
      typeAhead:true,
      queryMode:'local',
      minChars:1,
      selectOnFocus:true,
      forceSelection:true,
      listConfig : {width:350},
      parent: this,
      store: this.actionStore
    });


    Ext.apply(this, {
      bodyStyle: 'padding:10px;',
      fieldDefaults: {
        labelWidth:100,
        labelPad: 10
      },
      defaults: {
        msgTarget:'side',
        anchor: '90%',
        onHide: function(){this.bodyEl.up('.x-form-item').setStyle('display','none');},
        onShow: function(){this.bodyEl.up('.x-form-item').setStyle('display','block');}
      },
      defaultType: 'textfield',
      items: [
              {xtype:'hidden', name:'fieldId', id:'buttonId'},
              this.actionField,
              {fieldLabel:"#{msgs.template_editor_label}", allowBlank: true, id:'buttonLabel', name:'label'},
              {fieldLabel:"#{msgs.template_editor_parameter}", allowBlank: true, id:'buttonParameter', name:'parameter'},
              {fieldLabel:"#{msgs.template_editor_read_only}", xtype:'checkbox', allowBlank: true, id:'buttonReadOnly', name:'readOnly'},
              {fieldLabel:"#{msgs.template_editor_skip_validation}", xtype:'checkbox', allowBlank: true, id:'buttonSkipValidation', name:'skipValidation'},
              {fieldLabel:"#{msgs.template_editor_value}", allowBlank: true, id:'buttonValue', name:'value'}
              ],
              bbar: this.getBottomBar()
    });

    this.callParent(arguments);
  },

  getBottomBar : function() {
    var saveButton = new Ext.Button({
      text: "#{msgs.nav_save}",
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

    return [clearButton, saveButton];
  },

  clear : function() {
    this.items.each(function() {
      this.reset();
      this.clearInvalid();
    });

    this.field = null;

    /** Clear the highlighted rows in the grid **/
    this.editor.fieldGrid.getStore().each(function(record){
      this.getView().removeRowCls(record, 'hightlightedGridRow');
    }, this.editor.fieldGrid);


    this.editor.fieldFormPanel.getLayout().setActiveItem(0);
  },

  save : function() {
    var buttonId;
    var id;
    var field;
    
    if(this.validate()) {
      if(Ext.getCmp('buttonAction').getValue()) {
        buttonId = Ext.getCmp('buttonId').getValue();
        /** If it's a new record, add it to the fields list **/
        if(!buttonId){
          /** Create a new field **/
          id = randomUUID();
          if(this.field) {
            field = this.field;
            field.id = id;
          } else {
            field = Ext.create('SailPoint.model.TemplateField', {id: id}, id);
          }
          this.items.each(function() {
            field.set(this.name,this.getValue());
          });

          field.set('type', SailPoint.template.TemplateEditorConstants.TYPE_BUTTON);
          field.set('name', field.get('action'));
          this.setDefaultLabelIfNeeded(field);
          field.set('displayName', field.get('label'));
          this.editor.fieldStore.insert(this.editor.fieldStore.getCount(),[field]);

        } else {
          /** Updating a record...find the record in the store and update it. */
          field = this.editor.fieldStore.getById(buttonId);
          this.items.each(function() {
            field.set(this.name,this.getValue());
          });
          this.setDefaultLabelIfNeeded(field);
          field.set('name', field.get('action'));
          field.set('displayName', field.get('label'));

          this.editor.fieldStore.data.each(function(record, index, data) {
            record.commit();
          });
        }

        this.clear();
      }
    }
  },

  validate : function() {
    var isValid = true;

    if(Ext.getCmp('buttonForm').isVisible()){
      this.items.each(function() {
        valid = this.validate();
        if(!valid) {
          isValid = false;
        }
      });

      if(!isValid)
        return isValid;

      isValid = this.validateDuplicates();
    }
    return isValid;
  },

  newField : function() {    
    // Exclude existing actions from the action store
    this.actionStore.getProxy().extraParams['actionsToExclude'] = this.getExistingActions();
    
    this.actionStore.loadPage(1, {
        callback: function() {
            this.clear();

            if (this.actionStore.getCount() === 0) {
                // Display an error message when no actions are available anymore
                Ext.MessageBox.show({
                    title: '',
                    msg: '#{msgs.template_editor_error_no_actions_left}',
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.MessageBox.ERROR
                });
            } else {
                //Default to string type for new fields
                this.editor.fieldFormPanel.getLayout().setActiveItem(2);
            }            
        }, 
        scope: this
    });

  },

  load : function(record) {
    this.field = record;

    // Exclude existing actions from the button form's action store
    var currentAction = record.get('name');
    this.actionStore.getProxy().extraParams['actionsToExclude'] =  this.getExistingActions(currentAction);
    this.actionStore.loadPage(1, {
        callback: function() {
            this.editor.fieldFormPanel.getLayout().setActiveItem(2);

            this.items.each(function(item) {
                var value = record.get(item.name);
                if(value) {
                    item.setValue(value);
                } else {
                    item.setValue('');
                }
            });

            Ext.getCmp('buttonId').setValue(record.get('id'));
        },
        scope: this
    });
  },
  
  /**
   * @return false if this button's edited label matches an existing button label
   */
  validateDuplicates: function() {
      var currentAction = this.items.get('buttonAction');
      var currentLabel = this.items.get('buttonLabel');
      var buttonFields = this.getExistingButtonFields(currentAction);
      var numButtonFields = buttonFields.getCount();
      var buttonField;
      var displayName;
      var isDuplicateFound = false;
      var i;
      
      for (i = 0; i < numButtonFields; ++i) {
          buttonField = buttonFields.getAt(i);
          displayName = buttonField.get('displayName');
          if (displayName == currentLabel.getValue() && buttonField.get('id') != Ext.getCmp('buttonId').getValue()) {
              isDuplicateFound = true;
          }
      }
      
      if (isDuplicateFound) {
          currentLabel.markInvalid('#{msgs.template_editor_error_duplicate_btn}');
      }

      return !isDuplicateFound;
  },
  
  /* Returns button actions that have already been added to the form */
  getExistingActions: function(currentAction) {
      var existingActions = [];
      var buttonFields = this.getExistingButtonFields(currentAction);
      var numButtonFields = buttonFields.getCount();
      var buttonField;
      var buttonAction;
      var i;
      
      for (i = 0; i < numButtonFields; ++i) {
          buttonField = buttonFields.getAt(i);
          buttonAction = buttonField.get('name');
          existingActions.push(buttonAction);
      }
      
      return existingActions;
  },
  
  getExistingButtonFields: function(actionToExclude) {
      var buttonFields = this.editor.fieldStore.queryBy(function(queriedRecord, queriedRecordId){
          var isButtonRecord = queriedRecord.get('type') == SailPoint.template.TemplateEditorConstants.TYPE_BUTTON;
          // This logic excludes the button record whose action matches the one specified in the function call
          if (actionToExclude) {
              isButtonRecord &= (queriedRecord.get('name') != actionToExclude);
          }
          return isButtonRecord;
      });
      return buttonFields;
  },
  
  /* Checks if the specified field label is blank and applies a default value if needed */
  setDefaultLabelIfNeeded: function(field) {
      var action = field.get('action');
      var label = label = field.get('label');
      var actionLabel;
      var selectedActionRecord;
      if (!label || label.length === 0) {
          selectedActionRecord = this.actionStore.findRecord('value', action);
          if (selectedActionRecord) {
              actionLabel = selectedActionRecord.get('name');
              field.set('label', actionLabel);              
          }
      }
  }

});