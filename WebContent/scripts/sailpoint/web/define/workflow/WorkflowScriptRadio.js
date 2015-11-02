
Ext.define('SailPoint.WorkflowScriptRadio', {
    extend : 'Ext.form.FieldSet',
    alias : 'widget.spworkflowscriptradio',

    method: null,
    source: null,
    
    includedItems: {"string":true, "script":true, "rule":true, "subprocess":false, "call":true, "reference":true},
    
    useNegate: false,
    negate: null,
    
    /** Help Text to be used in the fieldset to give the user some help on what is being configured **/
    helpText: '',
    
    /** Textarea used to write script when the method == 'script' **/
    textarea: null,
    
    /** Textfield used to write source when method == 'ref', 'call' or 'string' **/
    textfield: null,
    
    /** If the user passes in a stringStore config, we build a combobox for them to choose from
     * when the method is set to 'string'  */
    combo: null,
    
    stringStore: null,
    
    /** Whether to show the combo or now **/
    useCombo: false,
    
    /** combobox used to select rule when the method == 'rule' **/
    rule: null,
    
    rulesStore: null,
    
    /** combobox used to select reference when the method == 'reference' **/
    reference : null,
    
    /** combobox used to select subprocess when method == 'subprocess' **/
    subprocess: null,
    
    subprocessesStore: null,
    
    /** combobox used to select call when the method == 'call' **/
    callables: null,
    callablesStore: null,
    callablesType : 'Action',
    
    /** The referenceable items that can be set in the "reference" value **/
    referenceables: null,
    
    initComponent : function () {

        Ext.apply(this, {
        defaultType: 'radio',
        cls: 'initializer',
        defaults: {
          msgTarget:'side',
          labelSeparator : '',
          onHide: function(){this.getEl().up('.x-form-item').setStyle('display','none');},
          onShow: function(){this.getEl().up('.x-form-item').setStyle('display','block');}
        }
      });
      
      this.combo = new Ext.form.ComboBox({
          id: this.id+'_source_combo',
          fieldLabel: '#{msgs.workflow_script_source}', 
          name: this.id+'_source_textarea',        
          store:this.stringStore,
          hidden:true,
          width:300
      });
        
      this.useCombo = (this.stringStore!==null);
      
      this.rulesStore = SailPoint.Store.createStore({
          model : 'SailPoint.model.NameValue',
          url: CONTEXT_PATH + '/include/rulesDataSource.json',
          extraParams: { type:'Workflow', prompt:true },
          root: 'objects'
      });
      
      this.rule = Ext.create('SailPoint.Rule.Editor.RuleComboBox', {
        id: this.id+'_source_rule',
        fieldLabel: '#{msgs.workflow_script_rule}', 
        store:this.rulesStore,
        displayField: 'name',
        triggerAction: 'all',
        hidden:true,
        width:400,
        labelStyle: 'float:left;width:90px',
        listConfig : {width:400}
      });
      
      this.callablesStore = SailPoint.Store.createRestStore({
          url: CONTEXT_PATH + '/rest/workflows/callables/'+this.callablesType,
          root: 'objects',
          fields: ['id', 'name', 'description', 'requiredArguments']
      });
      
      this.callables = new Ext.form.ComboBox({
        id: this.id+'_source_call',
        name: this.id+'_source_call',
        listConfig : {
            getInnerTpl : function(){ 
                return '<div data-qtip="{description}<br/><strong>#{msgs.workflow_required_arguments}: </strong>' +
                '<ul><tpl for="requiredArguments">' +
                '<li>{name}<tpl if="description"> - {description}</tpl></li>' +
                '</tpl></ul>" class="x-combo-list-item">{name}</div>';
            }
        },
        fieldLabel: '#{msgs.workflow_script_call}', 
        store:this.callablesStore,
        triggerAction: 'all',
        hidden:true,
        displayField: 'name',
        width:400,
        labelStyle: 'float:left;width:90px'
      });
      
      var variables = [];
      if(this.referenceables) {
        for(var i=0; i<this.referenceables.length; i++) {
          variables.push(this.referenceables[i].name);
        }
      }

          this.reference = new Ext.form.ComboBox({
              id: this.id+'_source_reference',
              fieldLabel: '#{msgs.workflow_script_reference}',
              store:variables,
              hidden:true,
              width:400,
              labelStyle: 'float:left;width:90px',
              listConfig : {width:400}
          });

      this.subprocessesStore = SailPoint.Store.createStore({
          model : 'SailPoint.model.NameValue',
          url: CONTEXT_PATH + '/include/subprocessesDataSource.json',
          extraParams: {prompt:true },
          root: 'objects'
      });

      this.subprocess = new Ext.form.ComboBox({
        id: this.id+'_source_subprocess',
        fieldLabel: '#{msgs.workflow_script_subprocess}', 
        store:this.subprocessesStore,
        displayField: 'name',
        valueField:'value',
        triggerAction: 'all',
        hidden:true,
        labelStyle: 'float:left;width:90px',
        width:400,
        listConfig : {width:400}
      });
        
      this.negate = {
        labelStyle:'width:60px;margin-left:40px',
        xtype:'checkbox',
        id: this.id+"_negate",
        parent: this,
        fieldLabel: '#{msgs.workflow_script_negate}',
        labelStyle: 'float:left;width:90px',
        hidden:!this.useNegate
      };
      
      this.textarea = new SailPoint.form.EditorTextArea({
        id: this.id+'_source_textarea',
        name: this.id+'_source_textarea',
        fieldLabel: "#{msgs.workflow_script_source}",
        width:600,
        hidden:true,
        labelStyle: 'float:left;width:90px',
        variableName: this.variableName
      });
      
      this.textfield = new Ext.form.TextField({
        id: this.id+'_source_textfield',
        name: this.id+'_source_textfield',
        hidden: true,
        fieldLabel: "#{msgs.value}",
        labelStyle: 'float:left;width:90px',
        width:400
      });
      
      this.items = [];
      
      if(this.helpText) {
        this.items.push({
          xtype: 'box',
          autoEl: { tag: 'p', html: this.helpText },
          cls: 'help'
        });
      }
      
      if (this.includedItems.string === true) {
        this.items.push(
          { fieldLabel: '#{msgs.workflow_script_string}', 
            labelWidth:60,
            name:this.id+'_string', 
            helpText:'#{help.help_workflow_script_radio_string}',
            id: this.id+'_string', 
            inputValue: 'string', 
            parent: this,
            listeners : {change : this.changeType}
          }
        );
      }
      if (this.includedItems.reference === true) {
        this.items.push(
          { fieldLabel: '#{msgs.workflow_script_reference}',
          helpText:'#{help.help_workflow_script_radio_reference}',
          labelWidth:95,
          name:this.id+'_ref', 
          id: this.id+'_ref', 
          inputValue: 'ref', 
          parent: this,
          listeners : {change : this.changeType}
          }
        );
      }
      if (this.includedItems.script === true) {
        this.items.push(
          { fieldLabel: '#{msgs.workflow_script_script}', 
            helpText:'#{help.help_workflow_script_radio_script}',
            labelWidth:60,
            name:this.id+'_script', 
            id: this.id+'_script', 
            inputValue: 'script', 
            parent: this,
            listeners : {change : this.changeType}
           }
        );
      }
      if (this.includedItems.rule === true) {
        this.items.push(
          { fieldLabel: '#{msgs.workflow_script_rule}', 
            helpText:'#{help.help_workflow_script_radio_rule}',
            labelWidth:55,
            name:this.id+'_rule', 
            id: this.id+'_rule', 
            inputValue: 'rule', 
            parent: this,
            listeners : {change : this.changeType}
          }
        );
      }
      if (this.includedItems.subprocess === true) {
        this.items.push(
          { fieldLabel: '#{msgs.workflow_script_subprocess}', 
          helpText:'#{help.help_workflow_script_radio_subprocess}',
          labelWidth:95,
          name:this.id+'_subprocess', 
          id: this.id+'_subprocess', 
          inputValue: 'subprocess', 
          parent: this,
          listeners : {change : this.changeType}
          }
        );
      }
      if (this.includedItems.call === true) {
        this.items.push(
          { fieldLabel: '#{msgs.workflow_script_call}', 
          helpText:'#{help.help_workflow_script_radio_call}',
          labelWidth:95,
          name:this.id+'_call', 
          id: this.id+'_call', 
          inputValue: 'call', 
          parent: this,
          listeners : {change : this.changeType}
          }
        );
      }

      this.items.push(this.negate);
      this.items.push({xtype:'box', id:this.id+'spacer', autoEl: 'div', cls:'vis-clear'});
      
      if (this.includedItems.rule === true) {
        this.items.push(this.rule);
      }
      if (this.includedItems.call === true) {
        this.items.push(this.callables);
      }
      if (this.includedItems.reference === true) {
        this.items.push(this.reference);
      }
      if (this.includedItems.subprocess === true) {
        this.items.push(this.subprocess);
      }
      if (this.includedItems.script === true) {
        this.items.push(this.textarea);
      }
      if (this.includedItems.string === true && this.useCombo) {
          this.items.push(this.combo);
      } else if (this.includedItems.string === true) {
          this.items.push(this.textfield);
      }
      
      
      this.callParent(arguments);
      
      if(this.runInitialLoad) {
          this.load(this.runInitialLoad[0], this.runInitialLoad[1], this.runInitialLoad[2]);
      }
    },
    
    changeType : function(radio) {
      if(radio && radio.getValue()) {
        this.parent.resetRadios(radio);
        this.parent.method = radio.inputValue;

        // Hide all of the input components.
        this.parent.resetComponents();
        
        if(this.parent.method == 'script') {
          this.parent.textarea.show();
          this.parent.textarea.active = 1;
        
        } else if(this.parent.method == 'string' && this.parent.useCombo) {
          this.parent.combo.show();
          this.parent.combo.active = 1;
        
        } else if(this.parent.method == 'rule') {
          this.parent.rule.show();
          this.parent.rule.active = 1;
        
        } else if(this.parent.method == 'ref') {
          this.parent.reference.show();
          this.parent.reference.active = 1;
        
        } else if(this.parent.method == 'subprocess') {
          this.parent.subprocess.show();
          this.parent.subprocess.active = 1;
        
        } else if(this.parent.method == 'call') {
          this.parent.callables.show();
          this.parent.callables.active = 1;
        
        } else {
          this.parent.textfield.show();
          this.parent.textfield.active = 1;
        }
      }
    },
    
    load : function(method, source, negate) {
      this.reset();
      /** set method to string by default **/
      if(!method){
         if (this.includedItems.string === true) { 
           method = 'string';
         } else {
           method = 'script';
         }
      }
      
      this.method = method;
      this.source = source;
      
      /** Select the correct radio **/
      if(method && Ext.getCmp(this.id+'_'+method) && source) {
        Ext.getCmp(this.id+'_'+method).setValue(true);
      }
      
      /** Set the source **/
      var sourceField;
      
      if(this.method && this.method=='script') {
        sourceField = Ext.getCmp(this.id+'_source_textarea');
      } else if(this.method && this.method == 'string' && this.useCombo) {
        sourceField = Ext.getCmp(this.id+'_source_combo');
      } else if(this.method && this.method == 'rule' ) {
        sourceField = Ext.getCmp(this.id+'_source_rule');
      } else if(this.method && this.method == 'ref' ) {
        sourceField = Ext.getCmp(this.id+'_source_reference');
      } else if(this.method && this.method == 'call' ) {
        sourceField = Ext.getCmp(this.id+'_source_call');
      }  else if(this.method && this.method == 'subprocess' ) {
        sourceField = Ext.getCmp(this.id+'_source_subprocess');
      } else {
        sourceField = Ext.getCmp(this.id+'_source_textfield');
      }
      
           
      if(this.useNegate && typeof negate != 'undefined')
        Ext.getCmp(this.id+'_negate').setValue(negate==true);
      
      if(sourceField && source) {
        sourceField.show();
        
        if (this.method == 'rule') {
          // the store has to be loaded before setting the rule's value,
          // otherwise the rule id is displayed instead of its name
          sourceField.store.load({ callback: this.setRuleValue, scope: this });
        } else if (this.method == 'subprocess') {
          sourceField.store.load({ callback: this.setSubprocessValue, scope: this});
        } else if (this.method == 'call') {
          sourceField.store.load({ callback: this.setCallablesValue, scope: this});
        } else {
          sourceField.setValue(source);
        }
      }
    },
    
    reset : function() {
      this.textarea.setValue(null);
      this.combo.setValue(null);
      this.textfield.setValue(null);
      this.rule.setValue(null);
      this.reference.setValue(null);
      this.subprocess.setValue(null);
      this.callables.setValue(null);
      
      this.resetRadios();
      this.resetComponents();
    },
    
    resetRadios : function(source) {
      var components = [this.id+'_call', this.id+'_string', this.id+'_ref', this.id+'_rule', this.id+'_subprocess', this.id+'_script'];
      try {
        for(var i=0; i<components.length; i++) {
          if(!source || source.id!=components[i]) {
            var component = Ext.getCmp(components[i]);
            if(component && component.el) {
              component.setValue(false);
            }
          }
        }
      } catch(e){ }
    },

    resetComponents: function() {
        // Set them all to inactive so we can later determine which one to get
        // the value from.
        this.textarea.active = 0;
        this.textfield.active = 0;
        this.combo.active = 0;
        this.rule.active = 0;
        this.reference.active = 0;
        this.subprocess.active = 0;
        this.callables.active = 0;

        this.textfield.hide();
        this.textarea.hide();
        this.combo.hide();
        this.rule.hide();
        this.reference.hide();

        this.subprocess.hide();
        this.callables.hide();
    },
    
    getMethod : function () {
      return this.method;
    },
    
    getSource : function () {
      if(this.textarea.active) {
        this.source = this.textarea.getValue();
      
      } else if(this.combo.active){
        this.source = this.combo.getValue();
      
      } else if(this.rule.active){
        this.source = this.rule.getValue();
      
      } else if(this.reference.active){
        this.source = this.reference.getValue();
      
      } else if(this.subprocess.active){
        this.source = this.subprocess.getValue();
      
      } else if(this.callables.active){
        this.source = this.callables.getValue();
      
      } else {
        this.source = this.textfield.getValue();
      }
      
      return this.source;
    },
    
    getNegate : function() {
      return Ext.getCmp(this.id+'_negate').getValue();
    },
    
    setRuleValue : function() {
        this.rule.setValue(this.source);
        
        var foundRecord = this.rule.getStore().findRecord('name', this.source);
        // attempt to set by id if not found by name
        if ( foundRecord === null) {
            foundRecord = this.rule.getStore().findRecord('value', this.source);
            if (foundRecord !== null) {
                this.rule.setValue(foundRecord);
            }
        }
    },
    
    setCallablesValue : function() {
        this.callables.setValue(this.source);
    },
    
    setSubprocessValue : function() {
      this.subprocess.setValue(this.source);
    }
});
