/**
 * Workflow Editor Component. This component wraps several sub components to produce a view 
 * into creating and editing workflows.  This component directly holds onto two components in a 
 * split view: a collapsible panel that provides the ability to choose workflows and steps (the controlPanel)
 * and the designerPanel which has the panels for dragging/dropping steps and generally editing the workflow.
 */

var STEP_HEIGHT = 49;
var STEP_WIDTH = 48;
var BADGE_HEIGHT = 15;
var BADGE_WIDTH = 15;
var STEP_WIDTH_ACTUAL = 54;
var DESIGNER_WIDTH = 1500;
var DESIGNER_HEIGHT = 800;
var GW_HEIGHT = 36;
var GW_WIDTH = 36;
var GW_COLOR = "#000000";
var TRANSITION_COLOR = "#555555";
var STEP_COLOR = "#cbcbcb";
var TRANSITION_WIDTH = 1;

Ext.define('SailPoint.WorkflowEditor', {
    extend : 'Ext.panel.Panel',
    alias : 'widget.spworkfloweditor',
   
    designerPanel : null,
    
    controlPanel : null,
    
    stepCount : null,
    
    workflow : null,
    
    saveSuccessFn : null,
    
    constructor : function(config) {
        Ext.apply(config, {
            items : [
                {
                    xtype : 'spworkflowcontrolpanel',
                    region:'west',
                    id:'controlPanel',
                    width: 250,
                    split:true,
                    editor:this,
                    layout:'accordion'
                },
                {
                    xtype : 'spworkflowdesigner',
                    id:'workflowTabbedPanel',
                    region:'center',
                    plain:true,
                    editor:this,
                    autoScroll: true,
                    deferredRender:true,
                    layoutOnTabChange:true,
                    defaults:{autoScroll: true}
                }
            ],
            bbar : {
                xtype : 'statusbar',
                id: 'editorStatusBar',
                defaultText: '',
                layout:{pack: 'end'},
                items:[
                  {text: '#{msgs.new_workflow}', panel: this, handler: function() {this.panel.newCheck() }},
                  {text: '#{msgs.save_workflow}', panel: this, handler: function() {this.panel.saveReload(); }}, 
                  {text: '#{msgs.save_as_workflow}', panel: this, handler: function() {this.panel.saveAsPrompt(); }}, 
                  {id: 'deleteButton',
                      text: '#{msgs.delete_workflow}',
                      disabled: true,
                      panel: this, 
                      style: 'margin-top:20px',
                      handler: function() {
                          Ext.MessageBox.show({
                              title:'#{msgs.workflow_delete_title}',
                              msg: '#{msgs.workflow_delete_msg}',
                              buttons: Ext.MessageBox.OKCANCEL,
                              scope: this,
                              fn: function(btn) {  
                                  if(btn=='cancel') {
                                      return null;
                                  } else if(btn=='ok') {
                                      $("editForm:workflowId").value = this.panel.workflow.workflowId;
                                      $("editForm:deleteWorkflowBtn").click();
                                      this.disable();
                                      return null;
                                  }
                              },
                              icon: Ext.MessageBox.QUESTION
                          });
                      }
                  },
                  {xtype: 'tbseparator', margin: '0 10 0 10'},
                  {id: 'monitorButton', text: '#{msgs.monitor_workflow}', panel: this, handler: function() { this.panel.toggleMonitoring(this); }},
                  {text: '#{msgs.clear_workflow}', panel: this, handler: function() {this.panel.clear(true, true) }}
                ]
              }
        });
        
        this.callParent(arguments);
    },
    
    initComponent : function(){
      
      this.workflow = new SailPoint.Workflow();
    
      this.callParent(arguments);
      
      this.controlPanel = this.items.get('controlPanel');
      this.designerPanel = this.items.get('workflowTabbedPanel');
      
    },
    
    validate : function() {
      /** Let the tabbed designer panel perform it's own validation **/
      var validated = this.designerPanel.validate();
      return validated;
    },
    
    saveReload: function() {
        
        /** Attempt a save and then prompt the user with an okay alert.  When they hit okay,
        we create a new workflow **/
        this.saveSuccessFn = 
          function(btn) {
            var wfGrid = this.controlPanel.workflowGrid;
            
            var selected = wfGrid.getSelectionModel().getSelection()[0];
            //If the current selection is found on the current workflow Page, lets load the workflow
            if(selected) {
                var recInd = wfGrid.getStore().indexOf(wfGrid.getSelectionModel().getSelection()[0]);
                this.load(recInd, wfGrid.getView());
            } else {
                //If the workflow is on a different page, we have no access to the record, therefore we will simply
                // clear the editor to prevent any false session object problems
                this.clear(true, true);
            }
            
          }
        this.save(true);
    },
    
    saveAsPrompt: function () {

        this.createSaveAsPrompt('#{msgs.enter_workflow_name}', '');
    
    },
    
    createSaveAsPrompt: function(prompt, defaultText) {
        Ext.MessageBox.prompt('#{msgs.save_as_workflow}', prompt, function(btn, text) { this.saveAsHandler(btn, text) }, this, false, defaultText);
    },

    saveAsHandler: function(btn, text) {   
        if(btn!='cancel') {
            Ext.Ajax.request({
                url: CONTEXT_PATH + '/rest/workflows/' + text + '/exists',
                scope: this,
                success: function(result, response) {
                    var r = Ext.JSON.decode(result.responseText);
                    if (r && r.object === false) {
                        // execute save as
                        this.controlPanel.workflowGrid.getSelectionModel().deselectAll();
                        
                        this.designerPanel.setActiveTab('workflowDetailsPanel');
                        Ext.getCmp('workflowName').setValue(text);
                        var monitoringButton = this.getDockedComponent('editorStatusBar').getComponent('monitorButton');
                        monitoringButton.setText('#{msgs.monitor_workflow}');
                        
                        this.saveAs(true);
                    }
                    else {
                        // duplicate name redisplay the message
                        var newMsg = '#{msgs.enter_workflow_name} <div class="formError">#{msgs.workflow_nonunique_name}</div>';
                        this.createSaveAsPrompt(newMsg, text);
                    }
                },
                failure: function(result, response) {
                    // throw some kind of generic error here
                    this.showErrorMessageBox('#{msgs.save_as_workflow}', '#{msgs.err_fatal_system}');
                }
              });
        }
    },
    
    loadCheck: function(rowIndex, gridView) {
      /** Check to see whether the user would like to save their workflow before
      * loading a new one **/
      if(this.workflow.isDirty) {
        Ext.MessageBox.show({
           title:'#{msgs.msgbox_title_workflow_dirty}',
           msg: '#{msgs.msgbox_text_workflow_dirty}',
           buttons: Ext.MessageBox.YESNOCANCEL,
           scope: this,
           fn: function(btn) {
            var currentSelection;
            var currentSelectionIndex;

            if(btn=='cancel') {
              return null;
            } else if(btn=='no') {
              // Reset the state of the monitoring icons if necessary
                currentSelectionIndex = gridView.getStore().findBy(function(record, id) {
                  if (record.data.name == this.workflow.name) {
                    return true;
                  } else {
                    return false;
                  }
                }, this);
                currentSelection = gridView.getStore().getAt(currentSelectionIndex);
                if(currentSelection) {
                    currentSelection.set('monitored', this.workflow.originalMonitored);
                }
              this.load(rowIndex, gridView);
            } else {
              this.saveAndLoad(rowIndex, gridView);
            }
            
            return null;
           },
           icon: Ext.MessageBox.QUESTION
       });
      } else {
        this.load(rowIndex, gridView);
      }
    },
    
    loadStepOptions : function (rowIndex, gridView) {
        /** Load the steps for this workflow **/
        var record = gridView.getStore().getAt(rowIndex);
        
        this.controlPanel.stepLoader.proxy.extraParams.type = record.getData().type;
        this.controlPanel.stepLoader.load();
    },
    
    load : function (rowIndex, gridView) {
    
      this.getEl().mask(Ext.LoadMask.prototype.msg,'x-mask-loading');
      var record = gridView.getStore().getAt(rowIndex);
      this.clear(false, false);
      
      this.loadStepOptions(rowIndex, gridView);
      
      /** Load the workflow json **/
      Ext.Ajax.request({
        url: CONTEXT_PATH + '/define/workflow/workflowQueryJSON.json',
        scope: this,
        params: { id: record.getId(), forceLoad: true },
        success: function(result, response) {
            var monitorText = '#{msgs.monitor_workflow}';
            var unmonitorText = '#{msgs.unmonitor_workflow}';
            var monitorBtnCls = 'monitorBtn';
            var unmonitorBtnCls = 'unmonitorBtn';
            var monitoringButton = this.getDockedComponent('editorStatusBar').getComponent('monitorButton');
            var isWorkflowMonitored = false;
            var i;
            
            // Load the workflow
            this.workflow = new SailPoint.Workflow(JSON.parse(result.responseText));
            //Ensure that the workflow we are loading is selected in the control Panel
            var newRec = this.controlPanel.workflowsStore.findRecord('name',this.workflow.name,0,false,true,true);
            if(newRec) {
                this.controlPanel.workflowGrid.getSelectionModel().select(newRec);
            }
            this.designerPanel.load();
            this.designerPanel.setActiveTab('workflowDetailsPanel');
            
            // Reset the monitor button 
            for (i = 0; i < this.workflow.steps.length; ++i) {
                isWorkflowMonitored |= this.workflow.steps[i].isMonitored;
            }
            
            monitoringButton.setText(isWorkflowMonitored ? unmonitorText : monitorText);
            this.workflow.monitored = isWorkflowMonitored;
            
            this.updateLayout();
            
            // let's unmask after we are done executing EVERYTHING in the success method
            this.getEl().unmask();
        },
        failure: function(result, response) {
          this.getEl().unmask();
          alert('#{msgs.workflow_load_failed}');
        }
      });
    },
    
    updateConfigForm : function(configFormName, configFormContext, configFormStepName, parentComponentId, currentArgJSON, contextId) {
        var formName = $('updateConfigForm:configFormName');
        formName.value = configFormName;
        var formContext = $('updateConfigForm:configFormContext');
        formContext.value = configFormContext;
        var stepName = $('updateConfigForm:configFormStepName');
        stepName.value = (!Ext.isEmpty(configFormStepName)) ? configFormStepName : '';
        
        var compId = $('updateConfigForm:parentComponentId');
        compId.value = parentComponentId;
        
        var argJSON = $('updateConfigForm:argJSON');
        argJSON.value = currentArgJSON;
        
        var ctxId = $('updateConfigForm:contextId');
        ctxId.value = contextId;
        
        var updateButton = $('updateConfigForm:updateConfigFormButton');
        updateButton.click();
        
    },
    
    loadConfigForm: function(config) {
        var context = $('updateConfigForm:configFormContext');
        if (context && !Ext.isEmpty(context) && !Ext.isEmpty(context.value)) {
            var strMaskEnum = 'body';
            if (context.value === 'Step') {
                strMaskEnum = 'window';
            }
            Ext.applyIf(config, {maskerEnum: strMaskEnum});
        }
        
        var form = SailPoint.form.Util.updateFormPanel(config);
        var compId = $('updateConfigForm:parentComponentId');
        
        // when form is not found we still return a form object, thus check that it contains fields
        if (compId && !Ext.isEmpty(form) && !Ext.isEmpty(form.fields)) {
            var comp = Ext.getCmp(compId.value);
            // add configForm to the component so it may be referenced by the object later
            if (comp) {
                comp.setConfigFormPanel(form);
            }
        }
        
        // show errors if we had problems loading the form
        this.showError('#{msgs.msgbox_title_workflow_form_error}', 'span[id=configForm:formRenderer-1] ul li', function(buttonId, text, opt) {
            var context = $('updateConfigForm:configFormContext');
            var toggleButtonId = 'variableAdvancedButton';

            // Fall back on the advanced view if we can't display the form
            // check if the context is Step then get the Step Toggle Button
            if (context && 'Step' === context.value) {
                toggleButtonId = 'stepAdvancedButton';
            }
    
            // Get the WorkflowFormToggleButton and force it to show the advanced panel
            var toggleButton = Ext.getCmp(toggleButtonId);
            if (toggleButton) {
                toggleButton.btnEl.dom.click();
            }
        });
        
        var masker = SailPoint.form.Util.getMasker(config);
        if (masker) {
            masker.unmask();
        }
    },
    
    submitFormCallback: function(config, formId, action) {
        //Simply reLoad the form and show the refreshed form
        if(Ext.getCmp(formId)) {
            Ext.destroy(Ext.getCmp(formId));
        }
        this.loadConfigForm(config);
        
        
        var container = SailPoint.form.Util.getContainer(formId, 'configForm');
        if(container) {
            var containerId = SailPoint.form.Util.getHiddenField("actionParameterValue", container);
            var callbackComponent = Ext.getCmp(containerId.value);
            if(callbackComponent) {
                if(action !== "refresh") {
                    /**
                     * This is a submit/cancel
                     * Check for Errors
                     *  if errors exist, reshow the form with the error messages
                     *  else, we take the expanded values and merge them into the workflowconfig
                     */
                    callbackComponent.save();
                } 
            }
        }
    },
    
    newCheck: function() {
      /** Check to see whether the user would like to save their workflow before
      * loading a new one **/
      if(this.workflow.isDirty) {
        Ext.MessageBox.show({
           title:'#{msgs.msgbox_title_workflow_dirty}',
           msg: '#{msgs.msgbox_text_workflow_dirty}',
           buttons: Ext.MessageBox.YESNOCANCEL,
           scope: this,
           fn: function(btn) {
            if(btn=='cancel') {
              return;
            } else if(btn=='no') {
              this.newWorkflowPrompt();
            } else {
              this.saveAndNew();
            }
           },
           icon: Ext.MessageBox.QUESTION
       });
      } else {
        this.newWorkflowPrompt();
      }
    },
    
    newWorkflowPrompt: function () {

      Ext.MessageBox.prompt('#{msgs.new_workflow}', '#{msgs.enter_workflow_name}', function(btn, text) { this.newWorkflow(btn, text) }, this, false, '');
      
    },
    
    newWorkflow: function(btn, text) {   
      if(btn!='cancel') {
        this.clear(true, true);
        this.controlPanel.workflowGrid.getSelectionModel().deselectAll();
        
        this.designerPanel.setActiveTab('workflowDetailsPanel');
        Ext.getCmp('workflowName').setValue(text);
        var monitoringButton = this.getDockedComponent('editorStatusBar').getComponent('monitorButton');
        monitoringButton.setText('#{msgs.monitor_workflow}');
      }
    },
    
    saveAndNew : function () {
      /** Attempt a save and then prompt the user with an okay alert.  When they hit okay,
      we create a new workflow **/
      this.saveSuccessFn = 
        function(btn) {
          this.newWorkflowPrompt();
        }
      this.save(true);
    },
    
    saveAndLoad : function (rowIndex, gridView) {
      
      /** Attempt a save and then prompt the user with an okay alert.  When they hit okay,
      we load the next workflow that they clicked **/
      this.saveSuccessFn = 
        function(btn) {
          this.load(rowIndex, gridView);
        }
      this.save(true);
    },
    
    /**
     * Method executes after a basic form is submitted for validation and assimilation. This is the final method
     * invoke before sending to the server via the buttonComp click. 
     * @param hideAlert hides an alert that occurs if there are errors
     * @param buttonComp the button component we should click on to finish the save process, usually either the save or saveAs button 
     */
    finishSave : function (hideAlert, buttonComp) {
        var monitorText = '#{msgs.monitor_workflow}';
        var unmonitorText = '#{msgs.unmonitor_workflow}';
        var monitorBtnCls = 'monitorBtn';
        var unmonitorBtnCls = 'unmonitorBtn';

        var monitoringButton = this.getDockedComponent('editorStatusBar').getComponent('monitorButton');
        var isWorkflowMonitored = false;
        var i;
        /** Save steps **/
        this.designerPanel.stepPanel.save();
        
        workflowJSON = Ext.JSON.encode(this.workflow);
        //console.debug("[WorkflowJSON] : "+ workflowJSON);

        this.saveInput.value = workflowJSON;
        this.getEl().mask('#{msgs.workflow_saving}','x-mask-loading');
        //Set the workflow as clean which means we've saved all changes
        this.workflow.markClean();
        
        // Reset the monitor button 
        for (i = 0; i < this.workflow.steps.length; ++i) {
            isWorkflowMonitored |= this.workflow.steps[i].isMonitored;
        }
        monitoringButton.setText(isWorkflowMonitored ? unmonitorText : monitorText);

        if(!hideAlert || hideAlert!=true) {
          this.saveSuccessFn = function() {};
        }
        
        if (buttonComp) {
            buttonComp.click();
        }
    },
    
    prepareSave : function (hideAlert, buttonComp) {

      if(!this.validate()) 
      {
        return false;
      }
      
      /** Save workflow related stuff **/
      this.workflow.name = Ext.getCmp('workflowName').getValue();
      this.workflow.description = Ext.getCmp('workflowDescription').getValue();
      this.workflow.type = Ext.getCmp('workflowType').getValue();
      this.workflow.isMonitored = Ext.getCmp('workflowIsMonitored').getValue();

      /** Save variables 
       * If there is a form we will save it and register a callback, this will return false
       * If no form, return true and continue with the save
       * **/
      if(this.designerPanel.variablePanel.saveConfigForm(true, Ext.bind(this.finishSave, this, [hideAlert, buttonComp]), this.designerPanel.getActiveTab().id)) {
          this.finishSave(hideAlert, buttonComp);
      }
    },
    
    save : function (hideAlert) {
        if (this.prepareSave(hideAlert, this.saveBtn)) {
            
            return true;
        }
    },
    
    saveAs : function (hideAlert) {
        if (this.prepareSave(hideAlert, this.saveAsBtn)) {

            return true;
        }
        
        return false;
    },
    
    saveSuccess : function (isIgnoreCallback) {
      this.getEl().unmask();
      
      if(this.showError('#{msgs.msgbox_title_workflow_error}')) {
          // An error has occurred and we marked clean in finishSave, mark the workflow dirty again
          this.workflow.markDirty();
          return;
      }
      
      var textTpl = new Ext.Template("#{msgs.msgbox_text_workflow_saved}");
      this.controlPanel.workflowsStore.load({
          scope:this,
          callback: function() {
              var newRec = this.controlPanel.workflowsStore.findRecord('name',this.workflow.name,0,false,true,true);
              if(newRec) {
                  this.controlPanel.workflowGrid.getSelectionModel().select(newRec);
                  // Update the ID because it might have been changed by a 'Save As'
                  this.workflow.workflowId = newRec.get('id');
              }
      }});
      
      if (isIgnoreCallback === true) {
          this.saveSuccessFn = function() {};
      }
      Ext.MessageBox.show({
         title:'#{msgs.msgbox_title_workflow_saved}',
         msg: textTpl.apply([this.workflow.name]),
         buttons: Ext.MessageBox.OK,
         scope: this,
         fn: this.saveSuccessFn,
         icon: Ext.MessageBox.INFO
     });
      
    },
    
    showError : function(title, selector, fn) {
        /** Better error handling on save - Bug 6370 **/
        var tmpSelector = (!selector) ? 'div[id=spErrorMsgsDiv] ul li' : selector;
        var errors = Ext.DomQuery.selectNode(tmpSelector);
        if(errors) {
          var error = errors.innerHTML;
          
          // need to defer to allow the message dialog to display in front of the step window
          Ext.defer(function() {
              this.showErrorMessageBox(title, error, fn);
          }, 100, this);
          return true;
        }
        return false;
    },
    
    showErrorMessageBox : function(title, error, fn) {
        Ext.MessageBox.show({
            title:title,
            msg: error,
            buttons: Ext.MessageBox.OK,
            scope: this,
            icon: Ext.MessageBox.ERROR,
            fn: fn
        });
    },
    
    deleteSuccess : function () {
      this.clear(true, true);
      this.controlPanel.workflowGrid.getSelectionModel().deselectAll();
      this.controlPanel.workflowsStore.load();
    },
    
    clear : function (clearSession, clearControlPanel) {
      this.designerPanel.clear();
      
      this.workflow = new SailPoint.Workflow();
      
      if(clearSession)
        this.clearBtn.click();

      if (clearControlPanel === true) {
          this.controlPanel.clear();
      }
    },
    
    toggleMonitoring: function(toggleBtn) {
        var monitorText = '#{msgs.monitor_workflow}';
        var unmonitorText = '#{msgs.unmonitor_workflow}';
        var monitorBtnCls = 'monitorBtn';
        var unmonitorBtnCls = 'unmonitorBtn';
        var enable = toggleBtn.getText() == monitorText;
        var toggleMessage = enable ? '#{msgs.workflow_monitoring_enabled}' : '#{msgs.workflow_monitoring_disabled}';
        var steps = this.workflow.steps;
        var numSteps = steps.length;
        var stepId;
        var stepDiv;
        var i;
        var stepComponent;

        
        toggleBtn.setText(enable ? unmonitorText : monitorText);
        
        for (i = 0; i < numSteps; ++i) {
            if (enable !== steps[i].isMonitored) {
                steps[i].isMonitored = enable;
                stepId = i + 1;
                if(this.designerPanel.stepPanel.loaded) {
                    stepComponent = this.getComponent( 'workflowTabbedPanel' ).getComponent( 'workflowDesigner' ).getComponent( 'step_' + stepId );
                    if( enable ) {
                        stepComponent.addMonitoredBadge();
                    } else {
                        stepComponent.removeMonitoredBadge();
                    }
                }
            }
        }
        this.workflow.monitored = enable;
        this.workflow.markDirty();
        this.controlPanel.setMonitored(enable);
        
        Ext.MessageBox.alert('#{msgs.workflow_metrics}', toggleMessage);
    }
});



Ext.define('SailPoint.WorkflowControlPanel', {
    extend : 'Ext.panel.Panel',
    alias : 'widget.spworkflowcontrolpanel',

  workflowGrid : null,
  stepsPanel : null,
  
  initComponent : function(){
      
    this.workflowsStore = SailPoint.Store.createStore({
        fields: ['id', 'name', 'monitored', 'type'],
        autoLoad: true,
        pageSize: 20,
        url: CONTEXT_PATH + '/define/workflow/workflowDataSource.json',
        root: 'objects',
        remoteSort: true
    });
    
    this.workflowGrid = new Ext.grid.Panel({
      id:'workflowsGrid',
      store: this.workflowsStore,
      selModel: new Ext.selection.RowModel({ mode: 'single' }),
      columns: [{
              dataIndex: 'monitored',
              flex: 1,
              renderer: function(dataValue, metadata, record, rowIndex, colIndex, store) {
                  metadata.tdCls = dataValue ? 'monitorBtn' : '';
                  return '';
              }
          }, {
              header: '#{msgs.task_item_type_workflow}',
              dataIndex: 'name',
              flex: 10
      }],
      hideHeaders: true,
      title:'#{msgs.edit_existing_workflow}',
      parent: this,
      border:false,
      autoScroll:true,
      listeners: { itemclick: function(gridView, record, HTMLitem, index, e, eOpts) {
              this.parent.editor.loadCheck(index, gridView); 
          }
      },
      dockedItems: [{
        xtype: 'pagingtoolbar',
        store: this.workflowsStore,
        beforePageText: '',
        inputItemWidth: 25,
        dock: 'bottom',
        cls: 'tinytoolbar',
        displayInfo: false
        }],
      viewConfig: {
        scrollOffset: 2,
        markDirty: false,
        stripeRows: true
      }
    });
    
    this.stepLoader = Ext.create('SailPoint.PagingTreeStore', {
        storeId : 'stepLoader',
        url : CONTEXT_PATH + '/define/workflow/workflowStepDataSource.json',
        defaultRootId: 'node',
        model: 'StepModel',
        autoLoad: true
    });
    
    this.stepsPanel = Ext.create('Ext.tree.Panel', {
      id:'stepsPanel',
      useArrows:true,
      autoScroll:true,
      title: '#{msgs.workflow_add_step}',
      border:false,
      parent:this,
      autoScroll:true,
      store: this.stepLoader,
      containerScroll: true,
      listeners: {
          itemClick : function(treeview, record, node, t) {
            this.parent.editor.designerPanel.setActiveTab('workflowDesigner');
            this.parent.editor.designerPanel.stepPanel.addStep(record, t);
          },
          // Drag/Drop support has been heavily modeled after the extjs example 'Custom Drag and Drop'
          render: function(v) {
              v.dragZone = Ext.create('Ext.dd.DragZone', v.getEl(), {

                  // On receipt of a mousedown event, see if it is within a draggable element.
                  // Return a drag data object if so. The data object can contain arbitrary application
                  // data, but it should also contain a DOM element in the ddel property to provide
                  // a proxy to drag.
                  getDragData: function(e) {
                      var sourceEl = e.getTarget(v.getView().itemSelector, 10), d;
                      if (sourceEl) {
                          d = sourceEl.cloneNode(true);
                          d.id = Ext.id();
                          
                          return v.dragData = {
                              sourceEl: sourceEl,
                              repairXY: Ext.fly(sourceEl).getXY(),
                              ddel: d,
                              // helpful trick to get the original record from the store, 
                              // and pass it as an object to the DropZone
                              data: v.getView().getRecord(sourceEl).data
                          };
                      }
                  },

                  // Provide coordinates for the proxy to slide back to on failed drag.
                  // This is the original XY coordinates of the draggable element.
                  getRepairXY: function() {
                      return this.dragData.repairXY;
                  }
              });
          }
      },
      rootVisible:false,
      collapseFirst:false,
      collapsible: true
    });
    
    this.items = [this.workflowGrid, this.stepsPanel];
  
    SailPoint.WorkflowControlPanel.superclass.initComponent.apply(this);
  },
  
  setMonitored: function(monitored) {
      var recordToModify = this.workflowGrid.getSelectionModel().getSelection();
      if (recordToModify && recordToModify.length > 0) {
          // Make sure we don't lose the original value because we may need it to restore state later
          if (this.ownerCt.workflow.originalMonitored===undefined) {
              this.ownerCt.workflow.originalMonitored = recordToModify[0].get('monitored');
          }
          if (recordToModify[0].get('monitored') != monitored) {
    
              recordToModify[0].set('monitored', monitored);
              recordToModify[0].commit();
          }
      }
  }, 
  
  /**
   * Resets the component to its initial state. Resets the list of steps in the 'Add a Step' panel.
   */
  clear: function() {
      this.stepLoader.proxy.extraParams.type = '';
      this.stepLoader.load();
  }
  
  
});

/**
 * Workflow Designer Component. This is a tabbed panel with two components.
 * One component is the panel that contains the variables for the workflow.  The
 * other component is rendered with drag and drop components
 * that allows you to create and edit workflow objects.  This component is usually 
 * rendered inside a SailPoint.WorklowEditor
 */
 
Ext.define('SailPoint.WorkflowDesigner', {
    extend : 'SailPoint.TabPanel',
    alias : 'widget.spworkflowdesigner',

    stepCount : null,
    
    stepPanel : null,
    
    variablePanel : null,
    
    detailsPanel : null,
    
    errorText: '#{msgs.workflow_invalid}',
    
    errorIconCls : 'x-status-error',
    
    constructor : function(config) {
        Ext.apply(config, {
            items : [
                {
                    xtype : 'spworkflowdetailspanel',
                    id:'workflowDetailsPanel',
                    title:'#{msgs.workflow_details}',
                    parent: this
                },
                {
                    xtype : 'spworkflowvariablepanel',
                    id:'variablePanel',
                    title:'#{msgs.workflow_variables}',
                    parent:this,
                    html: ''
                },
                {
                    xtype : 'spworkflowsteppanel',
                    id:'workflowDesigner',
                    parent: this
                },
                {
                    xtype : 'spworkflowmetricspanel',
                    id: 'workflowMetricsPanel',
                    title: '#{msgs.workflow_metrics}',
                    html: '<div id="workflowMetricsDiv" class="spContent"><div class="formWarn">#{msgs.process_instrumentation_no_process_selected}</div></div>'          
                }
            ]
        });
        
        this.callParent(arguments);
    },
    
    initComponent : function(){
        this.callParent(arguments);
      
        this.detailsPanel = this.items.get('workflowDetailsPanel');
        this.variablePanel = this.items.get('variablePanel');
        this.stepPanel = this.items.get('workflowDesigner');
        this.metricsPanel = this.items.get('workflowMetricsPanel');
    },
    
    listeners: {
        tabchange: function(tabpanel, newCard, oldCard, opts) {

            var tabId = newCard.id;
            
            if(tabId == "variablePanel") {
                //Do not load if it has already been loaded
                if(!this.variablePanel.loaded || this.variablePanel.basic.configFormPanel) 
                    this.variablePanel.load(this.editor.workflow);
            } else if(tabId == "workflowDesigner")  {
                if(!this.stepPanel.loaded) {
                    this.stepPanel.load(this.editor.workflow.steps);
                    this.stepPanel.updateWidth();
                }
            } else if(tabId == "workflowMetricsPanel") {
                this.metricsPanel.load(this.editor.workflow);
            }

        },
        beforetabchange : function(tab, newpan, oldpan, opts) {
            if(newpan.id === 'variablePanel') {
                if(this.variablePanel.basic.configFormPanel)
                    this.variablePanel.clear();
            }
            if(oldpan.id === 'variablePanel') {
                //Need to save the form and register a callback. 
                //Save off the form if it exists
                return this.variablePanel.saveConfigForm(false, Ext.bind(this.finishTabChangeAfterSave, this, [newpan]), 'variablePanel');
            }
                
        }

    },
    
    finishTabChangeAfterSave : function(newpan) {
        //If save was successfull, go ahead and change tab
        this.setActiveTab(newpan);
    },
    
    load : function () {
        //Only load the initial panel. We will load the others when the tab is clicked
      this.detailsPanel.load(this.editor.workflow);
    },
    
    clear : function () {
      this.stepPanel.clear();
      this.variablePanel.clear();
      this.detailsPanel.clear();
    },
    
    validate : function () {
      var statusBar = Ext.getCmp('editorStatusBar');
      var isValid = this.detailsPanel.validate();
      
      if(!isValid) {
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
        this.setActiveTab(this.detailsPanel);
        return false;
      }
      
      isValid = this.variablePanel.validate();
      if(!isValid) {
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
        this.setActiveTab(this.variablePanel);
        return false;
      }
      
      isValid = this.stepPanel.validate();
      if(!isValid) {
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
        this.setActiveTab(this.stepPanel);
        return false;
      }
      return true;
    }
});


/**
 * Workflow Variable Panel. This panel holds all of the workflow variables
 */

Ext.define('SailPoint.WorkflowVariableAdvancedPanel', {
    extend : 'Ext.form.Panel',
    alias : 'widget.spworkflowvariableadvancedpanel', 
    
    /** Keeps track of the larges index in the list of variables so that we can pass through the list and
    update/remove variables **/
    variableIndex : null,
    
    varPrefix : 'var_',
    
    loaded : false,
    
    border : false,

    initComponent : function() {
      
      this.variableIndex = 0;
      
      this.callParent(arguments);
    },
    
    addVariable : function (variable, deferInsert) {
      var id = randomUUID();
      var initializerMethod = 'string';
      var initializerSource = '';
      var vName = '';
      var vInput = false;
      var vOutput = false;
      var vRequired = false;
      var vEditable = false;
      var vDescription = '';
      var styleClass = '';
      var index = 0;
      
      /** If the variable is not null, we are loading a workflow and populating
      the panel from its list of variables.  If the variable is null, the "add variable"
      button was clicked **/
      if(variable) {
        id = variable.id;
        vName = variable.name;
        styleClass = 'closed';
        vInput = variable.input;
        if(variable.description) {
          vDescription = variable.description.trim();
        } else {
          vDescription = '';
        }
        vOutput = variable.output;
        vRequired = variable.required;
        vEditable = variable.editable;
        if(variable.initializerSource) {
          initializerSource = variable.initializerSource;
          initializerMethod = variable.initializerMethod;
        }
      } else {
        this.parent.editor.workflow.markDirty();
        
        /** Scroll to the top **/
        var panel = this.body.dom;
        panel.scrollTop = 0;
      }
           
      index = this.variableIndex + 1;
      
      var scriptRadio = {
          xtype : 'spworkflowscriptradio',
          cls: 'scriptRadio',
          title: '#{msgs.initializer}',
          itemId: 'initializer',
          helpText: '#{help.help_workflow_script_radio_initializer}',
          referenceables: this.parent.editor.workflow.variables,
          callablesType: 'Initialization',
          width:700,
          runInitialLoad : [initializerMethod, initializerSource],
          variableName: vName
      };
      
      /** Create the new variable in one large container so we can hide/show it **/
      var ctr = {
          xtype : 'fieldset',
          collapsed: true,
          collapsible: true,
          cls: 'variable',
          title: '<div class="varName">'+vName+'</div><div class="varDescription">'+vDescription+'</div>',
          layout: {
              type: 'table',
              columns: 1
          },
          autoEl:{},
          defaults: {
              labelWidth:100
          },
          cls: 'variable',
          items: [
            {
              xtype: 'textfield',
              fieldLabel:'#{msgs.name}',
              name: 'name',
              itemId: 'name',
              width:500, 
              value:vName, 
              allowBlank: false,
              listeners: {
                  blur: function(field, opts){
                      var uppan = this.findParentByType('fieldset');
                      var descText = uppan.getComponent('descr');
                      uppan.setTitle('<div class="varName">'+this.getCleanValue()+'</div><div class="varDescription">'+descText.getCleanValue()+'</div>');
                  },
                  focus: function(field, opts){
                      var uppan = this.findParentByType('fieldset');
                      var descText = uppan.getComponent('descr');
                      uppan.setTitle('<div class="varName">'+this.getCleanValue()+'</div><div class="varDescription">'+descText.getCleanValue()+'</div>');
                  }
              },
                getCleanValue: function() {
                    return Ext.String.htmlEncode(this.getValue());
                }
            },
            {xtype:'checkbox', cls: 'block', helpText: '#{help.help_workflow_variable_input}', fieldLabel:'#{msgs.input}',name: 'input', itemId: 'input', checked:vInput, labelCls: 'variable-label', labelSeparator:''},
            {xtype:'checkbox', cls: 'block', helpText: '#{help.help_workflow_variable_output}', fieldLabel:'#{msgs.output}',name: 'output', itemId: 'output',  checked:vOutput, labelCls: 'variable-label', labelSeparator:''},
            {xtype:'checkbox', cls: 'block', helpText: '#{help.help_workflow_variable_editable}', fieldLabel:'#{msgs.oconfig_label_editable}',name: 'editable', itemId: 'editable',  checked:vEditable, labelCls: 'variable-label', labelSeparator:''},
            {xtype:'checkbox', cls: 'block', helpText: '#{help.help_workflow_variable_required}', fieldLabel:'#{msgs.required}',name: 'required', itemId: 'required',  checked:vRequired, labelCls: 'variable-label', labelSeparator:''},
            {xtype:'textarea', fieldLabel:'#{msgs.label_description}',name: 'description', itemId: 'descr', width:600, value: vDescription, itemCls: 'blocklabel', style:'margin-bottom:20px',              
                listeners: {
                    blur: function(field, opts){
                        var uppan = this.findParentByType('fieldset');
                        var nameText = uppan.getComponent('name');
                        uppan.setTitle('<div class="varName">'+nameText.getCleanValue()+'</div><div class="varDescription">'+this.getCleanValue()+'</div>');
                    },
                    focus: function(field, opts){
                        var uppan = this.findParentByType('fieldset');
                        var nameText = uppan.getComponent('name');
                        uppan.setTitle('<div class="varName">'+nameText.getCleanValue()+'</div><div class="varDescription">'+this.getCleanValue()+'</div>');
                    }
                },
                getCleanValue: function() {
                    return Ext.String.htmlEncode(this.getValue());
                }
            },
            {xtype:'box', autoEl: 'div', cls:'vis-clear spacer hideclosed'},
            scriptRadio,
            {xtype:'hidden',itemId: 'hidden', itemId: 'id', value:id},
            {xtype:'button', text:'#{msgs.button_remove}', panel: this, cls: 'secondaryBtn', id: this.varPrefix+'remove_'+index, handler: function() {this.panel.removeVariable(this)}}
          ]
      };
      
      if(!Ext.isDefined(deferInsert) || deferInsert == false) {
          this.insert(0, ctr);
      }
      
      this.variableIndex++;
      return ctr;
    },
    
    removeVariable : function (button) {
      var btnName = this.varPrefix+'remove_';
      var index;
      
      var panel = button.findParentByType('fieldset');
      
      /** This method can take either a button object or a string id **/
      if(button && button.id) {
        index = button.id.substring(btnName.length,button.id.length);
        dolayout = true;
      } else {
        index = button;
        dolayout = false;
      }   
      
      var idField = panel.getComponent('id');
      var varId = '';
      if(idField){
        varId = idField.getValue();
      }
      
      /** Remove the actual component **/
      this.remove(panel);
      
      if(dolayout) {
        if(varId)
          this.parent.editor.workflow.removeVariable(varId);
        if(index==this.variableIndex) {
          this.variableIndex--;
        }
        
        this.parent.editor.workflow.markDirty();
        this.updateLayout();
      }
    },
    
    /**
     * Used to serialize the existing arguments without persisting to the workflow model.  Invoked when 
     * switching from advanced to basic, prior to regenerating the configuration form. 
     */
    getArgsJSON : function() {
        var args = [];
        this.items.each(function(f) {   
            var container = f;
            var scriptRadio  = container.getComponent('initializer');
            var varId           = container.getComponent('id').getValue();
            var varName         = container.getComponent('name').getValue();
            var varInput        = container.getComponent('input').getValue();
            var varOutput       = container.getComponent('output').getValue();
            var varRequired = container.getComponent('required').getValue();
            var varEditable = container.getComponent('editable').getValue();
            var varDescription  = container.getComponent('descr').getCleanValue();

            var initializerMethod = scriptRadio.getMethod();
            var initializerSource = scriptRadio.getSource();
          
            if (!Ext.isEmpty(initializerSource)) {
                variable = new SailPoint.WorkflowVariable();
                variable.id = varId;
                variable.name = varName;
                variable.input = varInput;
                variable.required = varRequired;
                variable.editable = varEditable;
                variable.description = varDescription;
                variable.output = varOutput;
                variable.initializerMethod = initializerMethod;
                variable.initializerSource = initializerSource;
                
                args.push(variable);
            }
        }, this);
        
        return Ext.JSON.encode(args);
    },
    
    save : function() {

        /** Save each variable to the workflow **/      
        this.items.each(function(f) {   
            var container = f;
            var scriptRadio  = container.getComponent('initializer');
            var varId           = container.getComponent('id').getValue();
            var varName         = container.getComponent('name').getValue();
            var varInput        = container.getComponent('input').getValue();
            var varOutput       = container.getComponent('output').getValue();
            var varRequired = container.getComponent('required').getValue();
            var varEditable = container.getComponent('editable').getValue();
            var varDescription  = container.getComponent('descr').getCleanValue();

          var initializerMethod = scriptRadio.getMethod();
          var initializerSource = scriptRadio.getSource();
          
          variable = this.parent.editor.workflow.getVariableById(varId);
          if(variable) {
            variable.name = varName;
            variable.input = varInput;
            variable.editable = varEditable;
            variable.required = varRequired;
            variable.description = varDescription;
            variable.output = varOutput;
            variable.initializerMethod = initializerMethod;
            variable.initializerSource = initializerSource;
          } else {
            variable = new SailPoint.WorkflowVariable();
            variable.id = varId;
            variable.name = varName;
            variable.input = varInput;
            variable.required = varRequired;
            variable.editable = varEditable;
            variable.description = varDescription;
            variable.output = varOutput;
            variable.initializerMethod = initializerMethod;
            variable.initializerSource = initializerSource;
            this.parent.editor.workflow.addVariable(variable);
          }
        }, this);
    },
    
    copyMap : function(map) {
        this.items.each(function(p) {
            var container = p;
            if (container.getComponent) {
                var varName = container.getComponent('name').getValue();
                if (map.containsKey(varName)) {
                    var scriptRadio = container.getComponent('initializer');
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
                        // If the value is null reset radio which clears the values
                        scriptRadio.reset();
                    }
                }
            }
        });
    },
    
    validate : function () {
        var me = this;
        var isValid = true;
        me.items.each(function(p) {
            if(!p.getComponent('name').validate()) {
                //Expand the fieldset so the error will be more noticeable
                p.expand();
                p.getComponent('name').focus(true,true);
                isValid = false;
                return false;
            }
            
        });

      return isValid;
    },
    
    load : function (variables) {
        if (this.loaded === false) {
            var vCount = variables.length;
            
            var varArray = [];
            this.clear();
            for(var vIndex=0; vIndex<vCount; vIndex++) {
                var variable = variables[vIndex];
                varArray.push(this.addVariable(variable, true));
            }
            this.add(varArray);
            this.loaded = true;
        }
    },
    
    clear : function() {
    
        this.removeAll(true);
        this.variableIndex = 0;
        this.loaded = false;
    }
});


Ext.define('SailPoint.WorkflowVariablePanel', {
    extend : 'Ext.panel.Panel',
    alias : 'widget.spworkflowvariablepanel',
    basic : null,
    advanced : null, 
    toolbar : null,
    
    loaded : false,
    isBasicActive : false,
    callbackFunc : null,
    //Need to keep track of whether or not we have already saved the form so we do not try
    //to submit the form multiple times.
    configFormSaved : false,
    
    initComponent : function() {
        this.init();
        this.callParent(arguments);
    },
    
    init : function() {

        this.basic = Ext.create('SailPoint.WorkflowFormContainer', {
            id: 'variableBasicPanel'
        });
        
        this.advanced = Ext.create('SailPoint.WorkflowVariableAdvancedPanel', {
            parent : this.parent
        });
        
        this.toolbar = Ext.create('Ext.toolbar.Toolbar');
    },
    
    saveConfigForm : function(onlySaveBasic, callback, activeTab) {
        /**
         * If the tab is not variablePanel, do not try and save. The save has already
         * happened when the tab was changed.
         * If we have a form, go ahead and submit the form for expansion/validation
         * The OnComplete function of formPanel submit button will call save()
         */
        
        // currently executed when a form is configured no matter if we are in a basic or advanced view
        if(activeTab == 'variablePanel' && this.basic.configFormPanel && !this.configFormSaved) {
            this.callbackFunc = callback;
            /**
             * Get a reference to the Ext component containing the save method
             */
            this.basic.configFormPanel.submit("next", "componentId", this.id, false);
            this.configFormSaved = true;
            return false;
        } else {
            //Did not make an ajax call, therefore we can clear the callbacks
            this.callbackFunc = null;
            /**
             * if we are not only saving the basic panel or there is not configForm,
             * go ahead and save the advanced panel
             */
            if(!onlySaveBasic || !this.basic.configFormPanel) {
               return this.save();
            }
            return true;
        }
    },
    
    createAddVariableButton : function(isHidden) {
        var newButton = Ext.create('Ext.Button', {cls: 'secondaryBtn', text: '#{msgs.workflow_add_variable}', hidden: isHidden, panel: this.advanced, handler: function() {
            var me = this;
            var newvar = this.panel.addVariable(null,true);
            newvar.collapsed = false;
            this.panel.insert(0,newvar);
            
        }});
        return newButton;
    },
    
    save : function() {
        
        /**
         * Check for presence of a form. If we have a form, we must submit the form for validation/expansion
         * If the form has errors, do not proceed with the save, but instead show the form with the error msgs
         */
        if(this.basic.configFormPanel) {
            if(this.basic.configFormPanel.hasValidationMessages() 
                    || this.basic.configFormPanel.hasErrorMessages()) {
                //If error/validation messages, reset savedStatus so we can resubmit once the errors have been fixed
                this.configFormSaved = false;
                return false;
            }
        }
        // scrape the current form if it's basic and save to the advanced form
        if (this.isBasicActive === true) {
            var basicMap = this.basic.getMap();
            this.advanced.copyMap(basicMap);
        }
        this.advanced.save();
        
        if(this.callbackFunc) {
            this.callbackFunc.call();
        }
        return true;
    },
    
    validate : function() {
        return this.advanced.validate();
    },
    
    load : function(workflow) {
        // being that we clear and load this panel, we need to recreate the ext components on load
        if(this.loaded)
            this.clear();
        this.init();
        this.configForm = workflow.configForm;
        
        this.add(this.toolbar);
        
        if (!Ext.isEmpty(this.configForm)) {
            // add the basicPanel and toolbar items, moving to hide/show methodology to work around ie8 bug
            var tAdd = this.toolbar.insert(0, this.createAddVariableButton(true));
            var tSep = this.toolbar.insert(0, {xtype: 'tbseparator', margin: '0 10 0 10', border: 1, hidden: true});
            
            this.toolbar.insert(0, Ext.create('SailPoint.WorkflowFormToggleButton', { 
                                     id: 'variableAdvancedButton',
                                     spParent: this,
                                     maskerEnum: 'body',
                                     basicPanel: this.basic,
                                     advancedPanel: this.advanced,
                                     sepComp: tSep,
                                     addVarComp: tAdd
                                   })
            );
            this.add(this.basic);
            this.add(this.advanced);
            this.advanced.hide();
            
            this.updateConfigForm(Ext.JSON.encode(this.parent.editor.workflow.variables));
            this.isBasicActive = true;
        }
        else {
            // advancedPanel
            this.toolbar.add(this.createAddVariableButton(false));
            this.add(this.advanced);
        }

        //load the advanced even if it is not shown, decreases the button toggle time
        this.advanced.load(workflow.variables);
        this.loaded = true;
    },
    
    copy : function(fromComp, toComp) {
        var aMap = fromComp.getMap();
        toComp.copyMap(aMap);
    },
    
    updateConfigForm : function(argJSON) {
        if (!Ext.isEmpty(this.configForm)) {
            var workflowPanel = Ext.getCmp('workflowPanel');
            if (workflowPanel) {
                workflowPanel.updateConfigForm(this.configForm, 'Workflow', null, 'variableBasicPanel', argJSON, this.getId());
            }
        }
    },

    clear : function() {
        this.advanced.clear();
        this.basic.clear();
        this.removeAll(true);
        
        this.isBasicActive = false;
        this.configFormSaved = false;
        this.loaded = false;
    }
});

/**
 * Workflow Details Panel. This is a panel for setting general information about the workflow
 * such as description, name, owner, etc...
 */


Ext.define('SailPoint.WorkflowDetailsPanel', {
    extend : 'Ext.FormPanel',
    alias : 'widget.spworkflowdetailspanel',

    name : null,
    description : null,
    isMonitored : null,    
    isLoading : false,
    
    initComponent : function(){  
      
      this.name = new Ext.form.TextField({
        name: 'workflowName',
        fieldLabel:'#{msgs.name}',
        id: 'workflowName',
        allowBlank: false,
        msgTarget: 'side',
        width: 500,
        trackResetOnLoad : true,
        listeners : {
            change : this.markDirty
        }
      });
      
      this.isMonitored = new Ext.form.Checkbox({
        name: 'workflowIsMonitored',
        id: 'workflowIsMonitored',
        fieldLabel:'#{msgs.process_instrumentation_monitor_step}',
        listeners : {
            change : this.markDirty
        }
      });

      this.description = new Ext.form.TextArea({
        name: 'workflowDescription',
        id: 'workflowDescription',
        fieldLabel:'#{msgs.label_description}',
        width:550,
        height:100,        
        listeners : {
            change : this.markDirty
        }
      });
      
      this.type = new Ext.form.ComboBox({
        name: 'workflowType',
        fieldLabel: '#{help.workflow_type}',
        id: 'workflowType',
        listConfig : {
            getInnerTpl : function(displayField){ 
                return '<div data-qtip="{description}" class="x-combo-list-item">{name}</div>';
          }
        },
        listeners : {
            change : function(field, newVal, oldVal, opts) {
                if (field.value) {
                    var detailsPanel = field.ownerCt;
                    if (detailsPanel.isLoading === false) {
                        var workflowEditor = Ext.getCmp('workflowPanel');
                        if (workflowEditor) {
                            workflowEditor.controlPanel.stepLoader.proxy.extraParams.type = field.value;
                            workflowEditor.controlPanel.stepLoader.load();
                            
                            workflowEditor.workflow.markDirty();
                        }
                    }
                }
            }
            },
        valueField: 'value',
        displayField: 'name',
        msgTarget: 'side',
        helpText: '#{help.help_workflow_type_description}',
        labelCls: 'variable-label',
        width:500,
        store: SailPoint.Store.createRestStore({
            url: CONTEXT_PATH + '/rest/workflows/workflowTypes',
            root: 'objects',
            fields: ['id', 'name', 'description', 'value']
          })
      });
      
      this.items = [      
        this.name,
        this.type,
        this.description,
        this.isMonitored
      ];
      SailPoint.WorkflowDetailsPanel.superclass.initComponent.apply(this);  
    },
    
    markDirty : function(textField, newVal, oldVal, opts) {
        //Mark the WF dirty when the name is changed.
        //This allows the popup to show when trying to navigate away asking
        //if the user would like to save before leaving.
        Ext.getCmp('workflowPanel').workflow.markDirty();
    },
    
    load : function (workflow) {
      this.isLoading = true;
      
      this.name.setValue(workflow.name);
      if(workflow.description) {
        workflow.description = workflow.description.trim();
      } 
      this.workflow=workflow;
      this.type.setValue(this.workflow.type);
      this.description.setValue(workflow.description);
      this.isMonitored.setValue(workflow.isMonitored);
      //Upon load we need to mark Clean because we now have a change listener that marks the WF dirty onChange
      //moving here as we added dirty checks on description and type
      Ext.getCmp('workflowPanel').workflow.markClean();
      Ext.getCmp('deleteButton').enable();
      
      this.isLoading = false;
    },
    
    clear : function () {
      this.name.setValue('');
      this.name.clearInvalid();
      this.type.setValue('');
      this.type.clearInvalid();
      this.description.setValue('');
      Ext.getCmp('deleteButton').disable();
    },
    
    validate : function() {      
      if(!this.name.validate()) {
        this.name.focus(true, true);
        return false;
      }
      if(!this.type.validate()) {
        this.type.focus(true, true);
        return false;
      }
      
      return true;
    }
});

SailPoint.METRICS_PANEL_TEMPLATE = new Ext.XTemplate(
    '<table class="spPaddedTable"><tbody>',
      '<tr><td colspan="2">',
        '<span style="padding-right:4px">#{msgs.process_instrumentation_search_show_times_in}</span>',
        '<select id="workflowMetricsTimeUnits" size="1" name="workflowMetricsTimeUnits" onchange="Ext.getCmp(\'workflowMetricsPanel\').updateTimes(this.value);">',
          '<tpl if="timeUnits == \'minutes\'">',
            '<option selected="selected" value="minutes">#{msgs.minutes}</option>',
            '<option value="hours">#{msgs.hours}</option>',
            '<option value="days">#{msgs.days}</option>',
          '</tpl>',
          '<tpl if="timeUnits == \'hours\'">',
            '<option value="minutes">#{msgs.minutes}</option>',
            '<option selected="selected" value="hours">#{msgs.hours}</option>',
            '<option value="days">#{msgs.days}</option>',
          '</tpl>',
          '<tpl if="timeUnits == \'days\'">',
            '<option value="minutes">#{msgs.minutes}</option>',
            '<option value="hours">#{msgs.hours}</option>',
            '<option selected="selected" value="days">#{msgs.days}</option>',
          '</tpl>',
        '</select>',
      '</td></tr>',
      '<tr class="odd"><td>#{msgs.process_instrumentation_executions}</td><td>{numExecutions}</td></tr>',
      '<tr class="even"><td>#{msgs.process_instrumentation_successful_executions}</td><td>{numSuccessfulExecutions}</td></tr>',
      '<tr class="odd"><td>#{msgs.process_instrumentation_failed_executions}</td><td>{numFailedExecutions}</td></tr>',
      '<tr class="even"><td>#{msgs.process_instrumentation_pending_executions}</td><td>{numPendingExecutions}</td></tr>',
      '<tr class="odd"><td>#{msgs.process_instrumentation_average_execution_time}</td><td id="workflowMetricsAvgTime">{averageExecutionTime}</td></tr>',
      '<tr class="even"><td>#{msgs.process_instrumentation_max_execution_time}</td><td id="workflowMetricsMaxTime">{maxExecutionTime}</td></tr>',
      '<tr class="odd"><td>#{msgs.process_instrumentation_last_execution_date}</td><td>{lastExecutionDate}</td></tr>',
    '</tbody></table>'
);

Ext.define('SailPoint.WorkflowMetricsPanel', {
    extend : 'Ext.panel.Panel',
    alias : 'widget.spworkflowmetricspanel',
    
    currentUnits: 'minutes',
    avgTimeInMinutes: -1,
    maxTimeInMinutes: -1,
    
    load: function(workflow) {
        SailPoint.METRICS_PANEL_TEMPLATE.overwrite(Ext.get('workflowMetricsDiv'), workflow.metrics);
    },
    
    updateTimes: function(timeUnits) {
        var avgTime;
        var maxTime;
        
        // Note that this behavior relies on the fact that times are always initially in minutes.
        // If that ever changes we need to compensate here.  We want to always store the time in 
        // the most precise time unit available so that we don't lose precision whenever we switch to 
        // less precise time units
        if (this.avgTimeInMinutes > 0) {
            avgTime = this.avgTimeInMinutes;
        } else {
            avgTime = new Number($('workflowMetricsAvgTime').innerHTML);
            this.avgTimeInMinutes = avgTime;
        }
        
        if (this.maxTimeInMinutes > 0) {
            maxTime = this.maxTimeInMinutes;
        } else {
            maxTime = new Number($('workflowMetricsMaxTime').innerHTML);
            this.maxTimeInMinutes = maxTime;
        }
        
        avgTime = this.updateTimeToUnits(avgTime, timeUnits);
        $('workflowMetricsAvgTime').innerHTML = avgTime;
        maxTime = this.updateTimeToUnits(maxTime, timeUnits);
        $('workflowMetricsMaxTime').innerHTML = maxTime;
        this.currentUnits = timeUnits;
    },
    
    /**
     * @param timeToUpdate time in minutes
     * @param timeUnits time units into which the given time should be converted
     * @return Converted time in the specified units and rounded to two decimal places
     */
    updateTimeToUnits: function(timeToUpdate, timeUnits) {
        var convertedTime = timeToUpdate;
        
        if (timeUnits != this.currentUnits) {
            // Convert from minutes if necessary
            if (timeUnits == 'hours') {
                convertedTime /= 60.0;
            } else if (timeUnits == 'days') {
                convertedTime /= 1440.0;
            }            
        }
        
        // Round to 2 decimal places
        convertedTime *= 100.0;
        convertedTime = Math.round(convertedTime);
        convertedTime /= 100.0;
        
        return convertedTime;
    }
});

Ext.override(Ext.form.Field, {
  afterRender : function() {    
    SailPoint.form.Util.renderHelpText(this);
    Ext.form.Field.superclass.afterRender.call(this);
    this.initValue();
  }
});

Ext.define('StepModel', {
    extend: 'Ext.data.Model',
    
    fields: [
        { name: 'id', type: 'string' },
        { name: 'text', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'stepClass', type: 'string' },
        {name: 'stepJson'}
        
    ]
});
