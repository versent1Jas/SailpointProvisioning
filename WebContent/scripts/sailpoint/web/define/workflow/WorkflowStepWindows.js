var DEFAULT_ICON = "Default";

Ext.define('SailPoint.WorkflowStepGatewayWindow', {
    extend : 'Ext.Window',
  step: null,
  
  /** A temporary transition array we use to store all changes until save **/
  transitions: null,
  
  transitionIndex: -1,
  
  removedTransitions: null,
  
  modal: true,
  
  initComponent : function() {
    
    Ext.apply(this, {
      id: 'gatewayWindow',
      width:768,
      closeAction:'hide',
      height:500,
      autoScroll:true,
      plain:true
    });
    
    this.items = [{xtype:'box', autoEl: {tag: 'span'}}];      
    
    this.buttons = [{
      text     : '#{msgs.button_save}', 
      window   : this,
      handler  : function () {
        this.window.save();
      }
    },{
      text     : '#{msgs.button_close}',
        cls : 'secondaryBtn',
        window   : this,
      handler  : function(){
        this.window.hide();
      }
    }];
    
    this.on('beforeshow', function() {
      this.initGateway(true);
      this.center();
    });
    
    SailPoint.WorkflowStepGatewayWindow.superclass.initComponent.apply(this);
  },
  
  initGateway : function (windowOpen) {
    this.setTitle("#{msgs.transitions_edit_from} '" + this.step.name + "'");
    this.clear();
    
    if(windowOpen) {
      this.transitions = this.step.transitions.slice(0);
    }
    
    for(var i=0; i<this.transitions.length; i++) {
      this.addTransition(this.transitions[i], i);
    }
    this.transitionIndex = this.transitions.length-1;
    
    this.removedTransitions = [];
  },
  
  clear : function() {    
    if(this.transitionIndex>=0) {
      for(i=0; i<=this.transitionIndex; i++) {
        this.removeTransition(i, false);
      }
      this.doLayout();
      this.transitionIndex = -1;
    }
  },
  
  addTransition : function(transition, index) {
    this.add({xtype:'box', id:'gw_title_'+index, autoEl: {tag:'div', html: '#{msgs.transition_to}: ' +transition.to}, cls:'gw_title'});
    
    var gwUp = new Ext.Component({
      id:'gw_up_'+index, 
      autoEl: 'div', 
      cls:'gw_up',
      index: index,
      window: this,
      listeners: {
        render: function(c) {
          c.getEl().on('click', function() {
            if(!this.off) {
              this.window.moveUp(this.index);
            }
          }, this);
        }
      }
    });
    var gwDown = new Ext.Component({
      id:'gw_down_'+index, 
      autoEl: 'div', 
      cls:'gw_down', 
      index: index,
      window: this,
      listeners: {
        render: function(c) {
          c.getEl().on('click', function() {
            if(!this.off) {
              this.window.moveDown(this.index);
            }
          }, this);
        }
      }
    });
    
    var gwRemove = new Ext.Component({
      id:'gw_remove_'+index, 
      autoEl: 'div', 
      cls:'gw_remove',
      index: index,
      window: this,
      listeners: {
        render: function(c) {
          c.getEl().on('click', function() {
            this.window.removeStepTrans(this.index);
          }, this);
        }
      }
    });
    
    if(index==0) {
      gwUp.addCls('off');
      gwUp.off = true;
    }
    if(index==this.transitions.length-1) {
      gwDown.addCls('off');
      gwDown.off = true;
    }

    this.add(gwRemove);
    this.add(gwDown);
    this.add(gwUp);
    this.add({xtype:'box', id:'gw_spacer1_'+index, autoEl: 'div', cls:'vis-clear'});
    var radio = new SailPoint.WorkflowScriptRadio({
        title: '#{msgs.workflow_transition_when}',
        id: 'gw_transition_'+index,
        helpText: '#{help.help_workflow_script_radio_when}',
        referenceables: this.panel.parent.editor.workflow.variables,
        callablesType: 'Action',
        variableName: transition.to,
        useNegate: true
    });
    
    this.add(radio);
    
    radio.load(transition.whenMethod, transition.whenSource, transition.negate); 
    this.add({xtype:'box', id:'gw_spacer2_'+index, autoEl: 'div', cls:'vis-clear line-spacer'}); 
  },
  
  removeStepTrans : function(index) {
      this.transitions.splice(index,1);
      this.initGateway(false);
      this.doLayout();
  },
  
  removeTransition : function(index, removeFromStep) {
    this.remove('gw_title_'+index,true);
    
    this.remove('gw_remove_'+index,true);
    this.remove('gw_up_'+index,true);
    this.remove('gw_down_'+index,true);
    this.remove('gw_spacer1_'+index,true);
    this.remove('gw_transition_'+index,true);
    this.remove('gw_spacer2_'+index,true);
    
    if(removeFromStep) {
      this.transitions.splice(index,1);
    }
  },
  
  moveDown : function(index) {
    this.updateTransitions();
    /** Switch this transition with the one below it **/
    var thisTran = this.transitions.splice(index,1)[0];
    this.transitions.splice(index+1,0,thisTran);
    
    this.initGateway(false);
    this.doLayout();   
  },
  
  moveUp : function(index) {
    this.updateTransitions();
    /** Switch this transition with the one below it **/
    var thisTran = this.transitions.splice(index,1)[0];
    this.transitions.splice(index-1,0,thisTran);
    
    this.initGateway(false);
    this.doLayout();
    
  },
  
  setStep : function(step) {
    this.step = step;
  },
  
  updateTransitions : function() {
    for(var i=0; i<this.transitions.length; i++) {
      var transitionObj = this.transitions[i];
      var transitionRadio = Ext.getCmp('gw_transition_'+i);      
      if(transitionRadio) {
        transitionObj.whenMethod = transitionRadio.getMethod();
        transitionObj.whenSource = transitionRadio.getSource();
        transitionObj.negate = transitionRadio.getNegate();
      }
    }
  },
  
  save : function() {
      
      
    this.updateTransitions();
    this.step.transitions = this.transitions.slice(0);
    
    var stepIndex = this.panel.parent.editor.workflow.getStepIndex(this.step);
    if(stepIndex.length > 0) {
        for(var i=0; i<stepIndex.length; i++) {
            Ext.getCmp('step_'+(stepIndex[i]+1)).redrawTransitions();
        }
    }    
    
    this.panel.parent.editor.workflow.markDirty();
    this.close();
  }
});


Ext.define('SailPoint.WorkflowStepConditionWindow', {
    extend : 'Ext.Window',

    conditionRadio: null,
    step: null,
    stepId: null,
    modal: true,
    
    initComponent : function() {
    
      this.conditionRadio = new SailPoint.WorkflowScriptRadio({
        title: '#{msgs.workflow_condition_when}',
        id: 'conditionScriptRadio',
        useNegate: true,
        helpText: '#{help.help_workflow_script_condition_when}',
        referenceables: this.panel.parent.editor.workflow.variables,
        callablesType: 'Action',
        includedItems: {"script":true, "rule":true, "call":true, "reference":true},
        variableName: '#{msgs.workflow_condition_when}',
        width: 650
      });
      
      Ext.apply(this, {
        layout: 'fit',
        id: 'conditionWindow',
        width: 650,
        closeAction:'destroy',
        plain:true
      });
      
      this.items = [ this.conditionRadio ];
      
      this.buttons = [{
        text     : '#{msgs.button_save}', 
        window   : this,
        handler  : function () {
          this.window.save();
        }
      },{
        text     : '#{msgs.button_close}',
        cls : 'secondaryBtn',
        window   : this,
        handler  : function(){
          this.window.close();
        }
      }];
      
      this.on('beforeshow', function() {
        this.initCondition();
        this.center();
      });
      
      SailPoint.WorkflowStepConditionWindow.superclass.initComponent.apply(this);
    },
    
    initCondition : function() {
      this.setTitle("#{msgs.condition_edit_title} '" + this.step.name + "'");
      this.conditionRadio.load(this.step.conditionMethod, this.step.conditionSource, this.step.conditionNegated);          
    },
    
    setStep : function(step) {
      this.step = step;
    },
    
    setStepId : function(stepId) {
        this.stepId = stepId;
    },
      
    validate : function() {
      return true;
    },
    
    save : function() {
      var stepComponent = this.panel.getComponent( 'step_' + this.stepId );
      if(!this.validate()) 
        return false;
        
      this.step.conditionMethod = this.conditionRadio.getMethod();
      this.step.conditionSource = this.conditionRadio.getSource();
      this.step.conditionNegated = this.conditionRadio.getNegate();
      if( step.isConditional()) {
        stepComponent.addConditionalBadge();
      } else {
        stepComponent.removeConditionalBadge();
      }

      this.panel.parent.editor.workflow.markDirty();
      this.close();
    }
});


Ext.define('SailPoint.WorkflowStepIconWindow', {
    extend : 'Ext.Window',
  stepName : null,
  
  stepObj : null,
  
  stepId : null,
  
  stepList : null,
  
  icon : null,
  
  stepClass : null,
  
  modal: true,
  
  initComponent : function() {
  
    Ext.apply(this, {
        id: 'iconWindow',
        closeAction:'hide',
        width:350,          
        autoScroll:true,
        plain:true
    });
    
    this.items = [];
    
    for (var i = 0; i<this.stepList.objects.length; i++) {
        var icon = this.stepList.objects[i];
      if(i%4==0) {
        this.items.push(
        {
          xtype:'box',
          stepClass: 'vis-clear',
          parent: this,
          autoEl: {tag:'div', html:''},
          cls: 'vis-clear'
        });
        
      }
      this.items.push(
          {
            xtype:'box', 
            id: icon.name,
            stepClass: icon.stepClass,
            parent: this,
            autoEl: {tag:'div', html:icon.text}, 
            cls: 'gwe-icon '+icon.stepClass
          }
      );
    }
    
    this.buttons = [
        { text     : '#{msgs.button_save}', 
          window   : this,
          handler  : function () {
            this.window.save();
          }
        },
        { text     : '#{msgs.button_close}',
          cls : 'secondaryBtn',
          window   : this,
          handler  : function( ){
            this.window.hide();
          }
        }
    ];
    
    this.on('afterrender', function() {
      this.initStep();
    });
    
    SailPoint.WorkflowStepIconWindow.superclass.initComponent.apply(this);
  },
  
  selectIcon : function(icon, iconClass) {
    this.icon = icon;
    this.iconClass = iconClass;
    this.updateSelectedIcon();
  },
  
  updateSelectedIcon : function(icon) {
    this.items.each(function() {
      this.removeCls("icon-on");
    });
    
    Ext.getCmp(this.icon).addCls("icon-on");
  },
  
  save : function () {
    var stepCmp = Ext.getCmp('step_' + this.stepId);
    stepCmp.setIconKey(this.iconClass);
    
    this.stepObj.icon = this.icon;
    this.stepObj.iconClass = this.iconClass;
    
    this.panel.parent.editor.workflow.markDirty();
    this.hide();
  }, 
  
  initStep : function () {
    if(this.stepObj && this.stepObj.name) {
      title = this.stepObj.name;      
    }
    else  
      title = this.stepId;
    
    this.icon = this.stepObj.icon;
    if(!this.icon)
      this.icon = DEFAULT_ICON;
    
    this.iconClass = this.stepObj.iconClass;
    
    this.updateSelectedIcon();
    this.setTitle("#{msgs.change_icon}: "+title);
    
    this.items.each(function() {
      this.getEl().on('click', function() { 
        this.parent.selectIcon(this.id, this.stepClass);
      },    
      this);
    });
  },
  
  setStep : function (step) {
    this.stepObj = step;
  },
  
  setStepId : function (stepId) {
    this.stepId = stepId;
  }

});


Ext.define('SailPoint.WorkflowStepWindow', {
    extend : 'Ext.Window',

    argIndex: null,
    
    tabPanel : null,
    
    detailsPanel : null,
    
    argPanel : null,
    
    /** the workflow designer panel */
    panel : null,
    
    argPrefix : 'step_arg_',
    
    actionRadio: null,
    
    approvalArea: null,
    
    errorText: '#{msgs.window_invalid}',
    
    errorIconCls : 'x-status-error',
    
    stepName : null,
    
    stepId : null,
    
    stepObj: null,
    
    modal: true,
    
    closable: false,
    
    draggable: false,
    
    initComponent : function() {
      
      this.argIndex = 0;
      
      this.bbar = new Ext.ux.StatusBar({
          id: 'stepStatusBar',
          defaultText: ''
      });
      
      this.actionRadio = new SailPoint.WorkflowScriptRadio({
        title: '#{msgs.srch_input_def_action}',
        id: 'stepAction',
        includedItems: {"string":false, "script":true, "rule":true, "subprocess":true, "call":true, "reference":false},
        width:700,
        helpText: '#{help.help_workflow_script_radio_action}',
        callablesType: 'Action',
        variableName: '#{msgs.srch_input_def_action}'
      });
      
      this.approvalArea = new Ext.form.FieldSet({
        id:'approvalArea',
        width:700,
        defaultType:'button',
        items: [
          {xtype:'box', autoEl: {tag:'p', html:'#{msgs.approval_notice}'}},
          {text : '#{msgs.approval_edit}', cls: 'secondaryBtn', window:this, handler:function () {this.window.editApproval();}},
          {text : '#{msgs.approval_remove}', cls: 'secondaryBtn', window:this, handler:function () {this.window.removeApproval();}}
        ]
      });
      
      this.stepName = new Ext.form.TextField({
        fieldLabel:'#{msgs.name}', 
        allowBlank: false, 
        name: 'name',
        id: 'stepName', 
        value: this.stepObj.name, 
        width:300,
        labelWidth:130,
        msgTarget: 'side'
      });
      
      this.detailsPanel = new Ext.FormPanel({
        title: '#{msgs.menu_details}',
        id: 'stepDetails',
        defaults : {
            labelWidth:130
        },
        items: [
          this.stepName,
          {xtype:'textarea',fieldLabel:'#{msgs.label_description}', name: 'description',itemId: 'stepDescription',value: this.stepObj.description,width:550},
          {xtype: 'textfield',  helpText: '#{help.help_workflow_step_result_variable}', fieldLabel: '#{msgs.workflow_result_variable}', name: 'stepResultVariable', itemId:'stepResultVariable', value: this.stepObj.resultVariable},
          {xtype: 'checkbox', helpText: '#{help.help_workflow_step_monitor}', fieldLabel: '#{msgs.process_instrumentation_monitor_step}', name: 'monitorStep', itemId:'monitorStep', checked: this.stepObj.isMonitored},
          this.approvalArea,
          this.actionRadio
        ]
      });
      
      this.argPanel = new SailPoint.WorkflowArgPanel({
        title: '#{msgs.workflow_arguments}',
        id: 'StepArgumentsPanel',
        window: this,
        argPrefix:this.argPrefix,
        workflowObj : this.stepObj
      });
      
      this.tabPanel = new Ext.TabPanel({
          activeTab : 0,
          deferredRender:false,
          layoutOnTabChange:true,
          defaults:{autoScroll: true},
          height:385,
          items : [this.detailsPanel, this.argPanel]
      });
      
      Ext.apply(this, {
          id: 'stepWindow',
          closeAction:'destroy',
          height:550,
          layout: 'fit',
          width:750,          
          autoScroll:true
      });
      
      this.items = [this.tabPanel];
      
      this.buttons = [
          { text     : '#{msgs.button_save}', 
            window   : this,
            handler  : function () {
              this.window.saveConfigForm();
            }
          },
          { text     : '#{msgs.button_close}',
            cls : 'secondaryBtn',
            window   : this,
            handler  : function( ){
                // clear the session on submit
                if (this.window.isConfigFormEnabled()) {
                    if (this.window.argPanel.basicPanel.configFormPanel) {
                        this.window.argPanel.basicPanel.configFormPanel.submit("cancel", "componentId", this.window.id, true);
                    }
                }
                this.window.close();
            }
          }
      ];
      
      this.on('beforeshow', function() {
        this.detailsPanel.doLayout();
        this.argPanel.doLayout();
        this.initStep();
        this.center();
      });
      
      SailPoint.WorkflowStepWindow.superclass.initComponent.apply(this);
    },
    
    validate : function() {
      var statusBar = Ext.getCmp('stepStatusBar');
      
      if(!this.stepName.validate())
      {
        statusBar.setText(this.errorText);
        statusBar.setStatus({
          text:this.errorText, 
          iconCls:this.errorIconCls, 
          clear: {
            wait: 2000,
            anim: true,
            useDefaults: false
          }
        });
        this.tabPanel.activate('stepDetails');
        this.stepName.focus(true,true);
        return false;
      }
      
      if(!this.argPanel.validate()) {
        statusBar.setText(this.errorText);
        statusBar.setStatus({
          text:this.errorText, 
          iconCls:this.errorIconCls, 
          clear: {
            wait: 2000,
            anim: true,
            useDefaults: false
          }
        });
        this.tabPanel.activate('StepArgumentsPanel');
        return false;
      }
      
      statusBar.clearStatus();
      return true;
    },
    
    saveConfigForm : function () {
      if(this.isConfigFormEnabled() && this.argPanel.isBasicActive === true) {
          this.argPanel.basicPanel.configFormPanel.submit("next", "componentId", this.id, false);
      } else {
          this.save();
      }  
    },
    
    save : function () {
      var wasMonitored = this.stepObj.isMonitored;
      var oldClass = null;
      var newClass = null;
      var stepNameDiv;
      var stepDiv;
      var stepComponent = this.panel.getComponent( 'step_' + this.stepId );

      if(!this.validate())
        return false;
      
      /**
       * Check for presence of a form. If the form has errors, do not proceed with the save, but instead show the form with the error msgs
       */
      if(this.isConfigFormEnabled()) {
          if(this.argPanel.basicPanel.configFormPanel.hasValidationMessages() 
                  || this.argPanel.basicPanel.configFormPanel.hasErrorMessages()) {
              //Had an error on the form. Go ahead and set focus to the arguments tab
              this.tabPanel.setActiveTab(1);
              return false;
          }
      }
      
        
      this.stepObj.name = this.stepName.getValue();
      this.stepObj.resultVariable = this.detailsPanel.getComponent('stepResultVariable').getValue();
      this.stepObj.description = this.detailsPanel.getComponent('stepDescription').getValue();
      this.stepObj.isMonitored = this.detailsPanel.getComponent('monitorStep').getValue();
      if( this.stepObj.isMonitored ) {
            stepComponent.addMonitoredBadge();
      } else {
            stepComponent.removeMonitoredBadge();
      }
      
      /** Need to update the transitions that point to this step **/
      this.updateTransitions();
      
      /** Clear any invalid markers on the step names **/
      this.updateInvalidSteps();
      
      if (this.actionRadio.getMethod() === 'subprocess') {
        this.stepObj.actionMethod = null;
        this.stepObj.actionSource = null;
        this.stepObj.subprocess = this.actionRadio.getSource();
      } else {
        this.stepObj.actionMethod = this.actionRadio.getMethod();
        this.stepObj.actionSource = this.actionRadio.getSource();
        this.stepObj.subprocess = null;
      }

      /** Find the step component and rename it on the step panel **/
      var stepComponent = Ext.getCmp('step_' + this.stepId);
      stepComponent.label.attr({text: this.stepObj.name});

      stepDiv = Ext.get('step_' + this.stepId);
      if (newClass !== null) {
          stepDiv.replaceCls(oldClass, newClass);
      }
      
      this.argPanel.save();
      this.panel.parent.editor.workflow.markDirty();
      this.close();
    },
    
    getConfigFormName : function() {
        // order of precedence is check the stepConfigForm then if the step calls a subprocess use the subprocessConfigForm
        var configFormName = this.stepObj.configForm;
        if (Ext.isEmpty(configFormName)) {
            configFormName = this.stepObj.subprocessConfigForm;
        }
        
        return configFormName;
    },
    
    isConfigFormEnabled : function() {
        return !Ext.isEmpty(this.getConfigFormName());
    },
    
    updateTransitions : function() {
      for(var i=0; i<this.panel.parent.editor.workflow.steps.length; i++) {
        var step = this.panel.parent.editor.workflow.steps[i];
        var transition = step.getTransition(this.stepId);
        if(transition) {
          transition.to = this.stepObj.name;
        }
      }
    },
    
    initStep : function () {
      if(this.stepObj && this.stepObj.name) 
        title = this.stepObj.name;
      else  
        title = this.stepId;
      
      this.setTitle(title);      
      
      this.detailsPanel.getComponent('stepDescription').setValue(this.stepObj.description);
      this.stepName.setValue(this.stepObj.name);
      this.detailsPanel.getComponent('monitorStep').setValue(this.stepObj.isMonitored);
      this.detailsPanel.getComponent('stepResultVariable').setValue(this.stepObj.resultVariable);
      
      /** Only show the action field if the step does not contain an approval **/
      if(this.stepObj.approval && this.stepObj.approval.id) { 
        this.actionRadio.hide();  
        this.approvalArea.show();
      } else {
        this.actionRadio.show();
        this.approvalArea.hide();
        this.loadActionRadio();
      }
      
      this.argPanel.workflowObj = this.stepObj;
      /** Remove argument fields **/
      this.argPanel.clear();      
      this.argPanel.load(this.stepObj.args);
    }, 
    
    setStep : function (step) {
      this.stepObj = step;
    },
    
    setStepId : function (stepId) {
      this.stepId = stepId;
    },
    
    loadActionRadio : function() {
        var actionMethod = this.stepObj.actionMethod;
        var actionSource = this.stepObj.actionSource;
        if (this.stepObj.subprocess != null) {
          actionMethod = 'subprocess';
          actionSource = this.stepObj.subprocess;
        }
        this.actionRadio.load(actionMethod, actionSource);
    },
    
    editApproval : function() {
      this.hide();
      this.panel.editApproval(this.stepId);
    },
    
    removeApproval: function() {
      this.stepObj.approval = new SailPoint.WorkflowApproval();
      this.approvalArea.hide();
      this.loadActionRadio(),
      this.actionRadio.show();
    },
    
    updateInvalidSteps: function() {
      var invalidSteps = Ext.DomQuery.select('div[class*=invalid]');
      if(invalidSteps.length>0) {
        invalidSteps.each(function (step) {
          Ext.get(step.id).removeCls('invalid');
        });
      }
    }
    
});

Ext.define('SailPoint.WorkflowArgPanel', {
    extend : 'Ext.panel.Panel',
    
    window : null,
    
    argPrefix : null,
    
    workflowObj : null,
    
    bar : null,
    
    advancedPanel : null,
    
    basicPanel : null,
    
    isBasicActive : false,
    
    initComponent : function() {
        this.items = [];
      
        this.basicPanel = Ext.create('SailPoint.WorkflowFormContainer',{
           id: 'stepWindowBasicPanel'
        });
        
        this.advancedPanel = new SailPoint.WorkflowArgAdvancedPanel({
            window: this.window,
            argPrefix:this.argPrefix,
            workflowObj : this.workflowObj
        });
        
        this.bar = Ext.create('Ext.toolbar.Toolbar');
        this.items.push(this.bar);
        
        if (this.window.isConfigFormEnabled()) {
            var tAdd = this.bar.insert(0, {text: '#{msgs.workflow_add_argument}', hidden: true, panel: this, handler: function() {this.panel.addArg()}});
            var tSep = this.bar.insert(0, {xtype: 'tbseparator', margin: '0 10 0 10', hidden: true});
            
            this.bar.insert(0, Ext.create('SailPoint.WorkflowFormToggleButton', { 
                                 id: 'stepAdvancedButton',
                                 spParent: this,
                                 maskerEnum: 'window',
                                 basicPanel: this.basicPanel,
                                 advancedPanel: this.advancedPanel,
                                 sepComp: tSep,
                                 addVarComp: tAdd
                               })
            );

            this.items.push(this.basicPanel);
            this.items.push(this.advancedPanel);
            this.advancedPanel.hide();
            
            this.updateConfigForm(this.workflowObj.getArgsJSON());

            this.isBasicActive = true;
        } else {
            this.bar.add({text: '#{msgs.workflow_add_argument}',panel: this, handler: function() {this.panel.addArg()}});
            this.items.push(this.advancedPanel);
        }

        this.callParent(arguments);
    },
    
    updateConfigForm : function(argsJSON) {
        var workflowPanel = Ext.getCmp('workflowPanel');
        if (workflowPanel) {
            var configFormName = this.window.getConfigFormName();
            workflowPanel.updateConfigForm(configFormName, 'Step',
                    this.workflowObj.name, 'stepWindowBasicPanel', argsJSON, this.window.stepId);
        }
    },
    
    copy : function(fromComp, toComp) {
        var aMap = fromComp.getMap();
        toComp.copyMap(aMap);
    },
    
    
    clear : function() {
        this.advancedPanel.clear();
    },
    
    validate : function() {
        return this.advancedPanel.validate();
    },
      
    save : function() {      
        // scrape the current form if it's basic and save to the advanced form
        if (this.isBasicActive === true) {
            this.copy(this.basicPanel, this.advancedPanel);
        }
        this.advancedPanel.save();
    },
    
    load : function(args) {
        this.advancedPanel.load(args);
    }, 
    
    addArg : function(arg) {
        this.advancedPanel.addArg();
    }
});

Ext.define('SailPoint.WorkflowArgAdvancedPanel', {
    extend : 'Ext.FormPanel',
  
    argPrefix: null,
    
    argIndex: null,
    
    argRadios : null,
    
    workflowObj : null,
    
    argsToRemove : null,
    
    createToolbar : false,
    
    initComponent : function() {
      this.argIndex = 0;
      
      if (this.createToolbar === true) {
          this.tbar = new Ext.Toolbar({
            items:[{text: '#{msgs.workflow_add_argument}',panel: this, handler: function() {this.panel.addArg()}}]
          });
      }
      this.argRadios = [];
      
      this.argsToRemove = [];
      
      Ext.apply(this, {
        items: [{xtype:'box', autoEl: {tag: 'span'}}],
        defaultType: 'textfield',
        labelWidth:100
      });
      SailPoint.WorkflowArgAdvancedPanel.superclass.initComponent.apply(this);
    },
    
    clear : function() {
      if(this.argIndex>0) {
        this.removeAll(true);
        this.doLayout();
        this.argIndex = 0;
      }
    },
    
    validate : function () {
      for(var i=0; i<=this.argIndex; i++) {      
        var name = Ext.getCmp(this.argPrefix+'name_'+i);
        if(name) {
          if(!name.validate()) {
            name.focus(true, true);
            return false;
          }
        }
      }
    
      return true;
    },
    
    /**
     * Used to serialize the existing arguments without persisting to the workflow model.  Invoked when 
     * switching from advanced to basic, prior to regenerating the configuration form. 
     */
    getArgsJSON : function() {
        var args = [];
        this.items.each(function(item) {
            var argId, argName, argRadio, argValueMethod, argValueSource, argument;
            //ensure that this is a container
            if(item.isXType('container') && item.getId().substring(0,12) == "argContainer") {
                argId = item.getComponent('argId').getValue();
                argName = item.getComponent('argName').getValue();
                argRadio = item.getComponent('argRad');
                if(argRadio) {
                  argValueMethod = argRadio.getMethod();
                  argValueSource = argRadio.getSource();
                } else {
                  argValueMethod = '';
                  argValueSource = '';
                }
                
                if (!Ext.isEmpty(argValueSource)) {
                    argument = new SailPoint.WorkflowArgument();
                    argument.id = argId;
                    argument.name = argName;
                    argument.valueMethod = argValueMethod;
                    argument.valueSource = argValueSource;
                    
                    args.push(argument);
                }
            }
        }, this);
        
        return Ext.JSON.encode(args);
    },
    
    save : function() {      
        this.items.each(function(item) {
            var argId, argName, argRadio, argValueMethod, argValueSource, argument;
            //ensure that this is a container
            if(item.isXType('container') && item.getId().substring(0,12) == "argContainer") {
                argId = item.getComponent('argId').getValue();
                argName = item.getComponent('argName').getValue();
                argRadio = item.getComponent('argRad');
                if(argRadio) {
                  argValueMethod = argRadio.getMethod();
                  argValueSource = argRadio.getSource();
                } else {
                  argValueMethod = '';
                  argValueSource = '';
                }
                
              argument = this.workflowObj.getArgById(argId);
              if(argument) {
                argument.name = argName;
                argument.valueMethod = argValueMethod;
                argument.valueSource = argValueSource;
              } else {
                argument = new SailPoint.WorkflowArgument();
                argument.id = argId;
                argument.name = argName;
                argument.valueMethod = argValueMethod;
                argument.valueSource = argValueSource;
                this.workflowObj.addArg(argument);
              }
            }
            
        }, this);
        
        //Remove all removed args from the workflowObj
        var i;
        for(i=0; i<this.argsToRemove.length; i++) {
            this.workflowObj.removeArg(this.argsToRemove[i]);
        }
    },
    
    load : function(args) {
      var argIndex;
        if(args) {
        count = args.length;
        for(argIndex=0; argIndex<count; argIndex++) {
          var arg = args[argIndex];
          this.addArg(arg);
        }
      }
      
      this.argsToRemove = [];
    },
    
    copyMap : function(map) {
        this.items.each(function(container) {
            if (container.getComponent) {
                var varName = container.getComponent('argName').getValue();
                if (map.containsKey(varName)) {
                    var scriptRadio = container.getComponent('argRad');
                    var initializerMethod = scriptRadio.getMethod();
                    var mapValue = map.get(varName);  // the method:source fully qualified value
                    if (!Ext.isEmpty(mapValue)) {
                        // convert booleans to handle checkbox fields
                        mapValue = mapValue.toString();
                        var colonIndex = mapValue.indexOf(":");
                        var mapMethod = 'string';
                        var mapSource = mapValue;
                        if (colonIndex !== -1) {
                            mapMethod = mapValue.substr(0, colonIndex);
                            mapSource = mapValue.substr(colonIndex+1);
                        }
                        scriptRadio.load(mapMethod, mapSource);
                    } else {
                        // If the value is empty reset the radio
                        // to null the value.
                        scriptRadio.reset();                        
                    }
                }
            }
        });
    },

  
    addArg : function (arg) {
      var name = '';
      var valueMethod = '';
      var valueSource = '';
      var id = randomUUID();
      
      /** If argument is defined, this is an initialization, otherwise the
       * 'add argument' button has been clicked   */
      if(arg) {
        id = arg.id;
        name = arg.name;
        valueMethod = arg.valueMethod;
        valueSource = arg.valueSource;
      } else {
        /** Scroll to the top **/
        var panel = this.body.dom;
        panel.scrollTop = 0;
      }
      
      index = this.argIndex+1;
      
      var container = Ext.create('Ext.container.Container', {
          /** Give each container id a common prefix followed by a unique id so we can ensure we are 
           * dealing with an arg container upon save**/
          id: 'argContainer'+id
      });
      
      var argRadio = new SailPoint.WorkflowScriptRadio({
        itemId: 'argRad',
        title: '#{msgs.label_value}:',
        method: valueMethod,
        source: valueSource,
        referenceables: this.window.panel.parent.editor.workflow.variables,
        callablesType: 'Action',
        helpText: '#{help.help_workflow_script_radio_argument}',
        variableName: name,
        width:700
      });     
      
      argRadio.on('afterrender', function(radio) {
        radio.load(radio.method, radio.source);

        this.fixScriptRadio(radio);
      }, this);
      container.insert(0,{xtype:'box', autoEl: 'div', cls:'vis-clear line-spacer'});
      container.insert(0,{xtype:'button', text:'#{msgs.button_remove}', window: this, itemId: 'button', index: index, handler: function() {this.window.removeArg(this)}});
      container.insert(0,argRadio);      
      container.insert(0,{xtype:'hidden',itemId: 'argId', value:id});
      /** Add arg name **/
      container.insert(0,{
          xtype: 'textfield',
        fieldLabel:'#{msgs.name}', 
        name: 'name', 
        itemId: 'argName', 
        width:500, 
        value:name, 
        allowBlank:false,
        msgTarget:'side'
      });
      
      this.insert(0,container);
      
      this.doLayout();
      this.argIndex++;
    },
    
    fixScriptRadio : function(radio) {

      /** Remove the width property on the combobox wrappers **/
      var element_name = "x-form-el-"+radio.id;
      var reference_radio = $(element_name + "_source_reference");
      if(reference_radio) {
        reference_radio.firstChild.style.width = '';
      } 
      var callable_radio = $(element_name + "_source_call");
      if(callable_radio) {
        callable_radio.firstChild.style.width = '';
      } 
    },
  
    removeArg : function (button) {
      var btnName = this.argPrefix+'remove_';
      var index,dolayout;
      /** This method can take either a button object or a string id **/
      if(button && button.index) {
        index = button.index;
        dolayout = true;
      } else {
        index = button;
        dolayout = false;
      }   
      
      var cont = button.findParentByType('container');
      if(cont && cont.getId().substring(0,12) == "argContainer") {
          var argId = cont.getComponent('argId').getValue();
          //remove all items from container
          cont.removeAll(true);
          //remove the container from the FormPanel
          this.remove(cont, true);
          /** Indicates that the remove button was clicked rather than just a refresh **/
          if(dolayout) {
            //This was removing the arg from the workflowObj even if close was clicked
            //this.workflowObj.removeArg(argId);
            this.argsToRemove.push(argId);
            if(index == this.argIndex)
              this.argIndex--;
            
            this.doLayout();
          }
      }
      
    }
    
});