Ext.define('SailPoint.WorkflowApprovalWindow', {
    extend : 'Ext.Window',  
  
    approvalObj : null,
    
    stepObj : null,
    
    stepId : null,
    
    modal: true,
    
    prefix : 'appr_',
    
    argPrefix : 'appr_arg_',
    
    errorText: '#{msgs.window_invalid}',
    
    errorIconCls : 'x-status-error',
    
    detailsPanel : null,
    
    argPanel : null,
    
    tabPanel : null,
    
    childrenPanel : null,
    
    ownerRadio : null,
    
    descriptionRadio : null,
    
    modeRadio : null,
    
    initComponent : function() {
    
      this.approvalObj = step.approval;
      
      this.bbar = new Ext.ux.StatusBar({
          id: 'approvalStatusBar',
          defaultText: ''
      });
      
      if(!this.approvalObj) {
        this.approvalObj = new SailPoint.WorkflowApproval();
        this.approvalObj.id = randomUUID();
        this.stepObj.approval = this.approvalObj;
      }
      
      this.ownerRadio = new SailPoint.WorkflowScriptRadio({
        title: '#{msgs.label_owner}',
        helpText: '#{help.help_workflow_approval_owner}',
        id: this.prefix+'owner_'+this.stepId,
        width:700,
        variableName: '#{msgs.label_owner}',
        referenceables: this.panel.parent.editor.workflow.variables
      });
      
      this.descriptionRadio = new SailPoint.WorkflowScriptRadio({
        title: '#{msgs.label_description}',
        id: this.prefix+'description_'+this.stepId,
        helpText: '#{help.help_workflow_approval_description}',
        width:700,
        variableName: '#{msgs.label_description}',
        referenceables: this.panel.parent.editor.workflow.variables
      });

      this.modeRadio = new SailPoint.WorkflowScriptRadio({
        title: '#{msgs.workflow_mode}',
        id: this.prefix+'mode_'+this.stepId,
        width:700,
        stringStore: this.panel.parent.editor.stores['approvalModeStore'],
        variableName: '#{msgs.workflow_mode}',
        referenceables: this.panel.parent.editor.workflow.variables
      });
      
      this.childrenPanel = new SailPoint.WorkflowApprovalTreePanel({
          id: 'approvalChildren',
          window: this
      });
      
      this.detailsPanel = new Ext.FormPanel({
        title: 'Details',
        id: 'ApprovalDetailsPanel',
        window: this,
        tbar : new Ext.Toolbar({
          items:[{text: '#{msgs.workflow_approval_add_child}', panel: this, handler: function() {this.panel.addChildApproval();}}]
        }),
        items: [
          {xtype:'textfield', 
            fieldLabel: '#{msgs.name}',
            itemId: 'approvalName',
            msgTarget: 'side',
            value: this.approvalObj.name, 
            width:400,
            window: this,
            listeners: {change : function(field) {
                                  this.window.childrenPanel.updateNodeText(this.window.approvalObj.id, field.getValue());
                                }
                       }
          },
          
          {xtype:'textfield', fieldLabel: '#{msgs.workflow_send}', helpText: '#{help.help_workflow_approval_send}', itemId: 'approvalSend',  width:400},
          {xtype:'textfield', fieldLabel: '#{msgs.workflow_return}', helpText: '#{help.help_workflow_approval_return}', itemId: 'approvalReturn', width:400},
          {xtype:'textfield', fieldLabel: '#{msgs.workflow_renderer}', helpText: '#{help.help_workflow_approval_renderer}', itemId: 'approvalRenderer',  width:400},
          this.modeRadio,
          this.ownerRadio,
          this.descriptionRadio
        ]
      });
      
      this.argPanel = new SailPoint.WorkflowArgAdvancedPanel({
        title         : '#{msgs.workflow_arguments}',
        id            : 'ApprovalArgumentsPanel',
        createToolbar : true,
        window        : this,
        argPrefix     : this.argPrefix,
        workflowObj   : this.approvalObj
      });
      
      this.workItemConfigPanel = new SailPoint.WorkItemConfigPanel({
        title               : '#{msgs.workflow_work_item_config}',
        window              : this,
        workItemConfigObj   : this.approvalObj.workItemConfig,
        id                  : 'approvalWorkItemConfig'
      });
      
      this.tabPanel = new Ext.TabPanel({
          activeTab         : 0,
          deferredRender    : false,
          layoutOnTabChange : true,
          defaults          : {autoScroll: true},
          height            : 435,
          region            : 'center',
          margins           : '3 3 3 0',
          items             : [this.detailsPanel, this.argPanel, this.workItemConfigPanel]
      });     

      Ext.apply(this, {
          id          : 'approvalWindow',
          width       : 768,
          height      : 630,          
          autoScroll  : true,
          layout      : 'border',
          plain       : true,
          closeAction : 'destroy'
      });
      
      this.items = [this.childrenPanel, this.tabPanel];
      
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
              this.window.close();
            }
          }
      ];
      
      this.on('beforeshow', function() {
        this.initApproval();
        this.center();
      });
      
      this.on('show', function() {
        this.panel.parent.editor.getEl().unmask();
      }, this);
      
      SailPoint.WorkflowApprovalWindow.superclass.initComponent.apply(this);
    },
    
    save : function () {
      
      if(!this.validate()) {
        return false;
      }
      
      this.approvalObj.name = this.detailsPanel.getComponent('approvalName').getValue();
      this.approvalObj.sendVal = this.detailsPanel.getComponent('approvalSend').getValue();
      this.approvalObj.returnVal = this.detailsPanel.getComponent('approvalReturn').getValue();
      this.approvalObj.renderer = this.detailsPanel.getComponent('approvalRenderer').getValue();
      
      this.approvalObj.ownerMethod = this.ownerRadio.getMethod();
      this.approvalObj.ownerSource = this.ownerRadio.getSource();
      
      this.approvalObj.modeMethod = this.modeRadio.getMethod();
      this.approvalObj.modeSource = this.modeRadio.getSource();
      
      this.approvalObj.descriptionMethod = this.descriptionRadio.getMethod();
      this.approvalObj.descriptionSource = this.descriptionRadio.getSource();      
      
      this.argPanel.save();
      this.childrenPanel.save();
      this.workItemConfigPanel.save();
      this.panel.parent.editor.workflow.markDirty();
      this.close();
    },
    
    savenohide : function () {
        
        if(!this.validate()) {
          return false;
        }
        
        this.approvalObj.name = this.detailsPanel.getComponent('approvalName').getValue();
        this.approvalObj.sendVal = this.detailsPanel.getComponent('approvalSend').getValue();
        this.approvalObj.returnVal = this.detailsPanel.getComponent('approvalReturn').getValue();
        this.approvalObj.renderer = this.detailsPanel.getComponent('approvalRenderer').getValue();
        
        this.approvalObj.ownerMethod = this.ownerRadio.getMethod();
        this.approvalObj.ownerSource = this.ownerRadio.getSource();
        
        this.approvalObj.modeMethod = this.modeRadio.getMethod();
        this.approvalObj.modeSource = this.modeRadio.getSource();
        
        this.approvalObj.descriptionMethod = this.descriptionRadio.getMethod();
        this.approvalObj.descriptionSource = this.descriptionRadio.getSource();      
        
        this.argPanel.save();
        this.childrenPanel.save();
        this.workItemConfigPanel.save();
        this.panel.parent.editor.workflow.markDirty();
      },
      
    validate : function() {
      var statusBar = Ext.getCmp('approvalStatusBar');
      
      if(!this.detailsPanel.getComponent('approvalName').getValue())
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
        this.tabPanel.activate('ApprovalDetailsPanel');
        this.detailsPanel.getComponent('approvalName').focus(true,true);
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
        this.tabPanel.setActiveTab('ApprovalArgumentsPanel');
        return false;
      }
      return true;
    },
    
    setStep : function (step) {
      this.stepObj = step;
    },
    
    setStepId : function (stepId) {
      this.stepId = stepId;
    },
    
    initApproval : function (approval) {
      /** If an approval is passed in, we are init'ing from a child approval,
        if there is no approval passed in, we are init'ing from a step **/
      if(approval) {
        this.approvalObj = approval;
        isChild = true;
      } else {
        this.approvalObj = step.approval;
        isChild = false;
      } 
      
      if(!this.approvalObj) {
        this.approvalObj = new SailPoint.WorkflowApproval();
        this.approvalObj.id = randomUUID();
        this.stepObj.approval = this.approvalObj;
      }
    
      this.argPanel.workflowObj = this.approvalObj;
      
      var titleTpl = new Ext.Template("#{msgs.workflow_approval_title}");
      
      this.setTitle(titleTpl.apply([this.stepObj.name]));
      
      if(!this.approvalObj.name) {
        this.approvalObj.name = this.stepObj.name;
      }
      
      
      this.detailsPanel.getComponent('approvalName').setValue(this.approvalObj.name);
      this.detailsPanel.getComponent('approvalSend').setValue(this.approvalObj.sendVal);
      this.detailsPanel.getComponent('approvalReturn').setValue(this.approvalObj.returnVal);
      this.detailsPanel.getComponent('approvalRenderer').setValue(this.approvalObj.renderer);
      
      
      /** Load the children tree only if this is a top-level approval **/
      if(!isChild) {
        this.childrenPanel.load(this.approvalObj);
      }
        
      /** Remove argument fields **/
      this.argPanel.clear();      
      this.argPanel.load(this.approvalObj.args);
      this.workItemConfigPanel.load(this.approvalObj.workItemConfig);
      this.ownerRadio.load(this.approvalObj.ownerMethod, this.approvalObj.ownerSource);
      this.descriptionRadio.load(this.approvalObj.descriptionMethod, this.approvalObj.descriptionSource);
      this.modeRadio.load(this.approvalObj.modeMethod, this.approvalObj.modeSource);
    },
    
    addChildApproval : function () {
      child = new SailPoint.WorkflowApproval();
      child.id = randomUUID();
      child.name = '#{msgs.workflow_approval_child}';
      this.approvalObj.addChild(child);
      
      this.childrenPanel.addChild(this.approvalObj.id, child);
    }
 
});

Ext.define('SailPoint.WorkflowApprovalTreePanel', {
    extend : 'Ext.tree.Panel',

  initComponent : function () {
    
      
      
      Ext.apply(this, {
        region      : 'west',
        collapsed   : false,
        title       : '#{msgs.workflow_approval_children}',
        split       : true,
        width       : 200,
        collapsible : true,
        margins     : '3 0 3 3',
        animate     : true,
        rootVisible : false,
        root: {
            id: 'root',
            text: 'Root'
        },
        listeners: {
            cellclick: {
                fn: function(table, td, cellIndex, record, tr, rowIndex, event, eOpts) {
                    var me=this;
                    this.window.savenohide();
                    me.getSelectionModel().select(record);
                    this.window.initApproval(this.getApprovalForId(record.get('id')));
                }
            },
            itemcontextmenu: {
                fn: function(view, record, item, index, evt, eOpts) {
                    //Do not allow removal of top level approval
                    if(record.parentNode && record.parentNode.get('id') != 'root') {
                    var nodeId = record.get('id');
                    var contextMenu = new Ext.menu.Menu();  

                    contextMenu.add(
                      new Ext.menu.Item({text: '#{msgs.approval_remove}', window: this, iconCls: 'deleteBtn', handler: function() { this.window.deleteApproval(nodeId);}})
                    );
                    evt.stopEvent();
                    contextMenu.showAt(evt.xy);
                }
                }
            }
        }
      });
      
      SailPoint.WorkflowApprovalTreePanel.superclass.initComponent.apply(this);
    },
    
    updateNodeText : function(id, text) {
      node = this.getStore().getNodeById(id);
      if(node) {
        node.set('text',text);
      }
    },
    
    loadChildren : function () {
      return [];
    },

//We may need to pass isRoot into this as well.    
    createNode : function(parentId, childObj, defaultName) {
      
        var parNode = this.getStore().getNodeById(parentId);
        if(childObj.name) {
            nodeName = childObj.name;
          } else {
            nodeName = defaultName;
          }
        
         
        parNode.appendChild({id:childObj.id, text:nodeName, approval: childObj, expanded: true, children: []});

        
        if(childObj) {
            var numChildren = childObj.children.length;
            if(numChildren > 0) {
                for(var i=0; i<numChildren; i++) {
                    var childAppObj = childObj.children[i];
                    this.createNode(childObj.id, childAppObj, 'Child');
                }
            }
        }
        
    },
    
    contextMenu : function (nodeId, evt) {
      var contextMenu = new Ext.menu.Menu();  

      contextMenu.add(
        new Ext.menu.Item({text: '#{msgs.approval_remove}', window: this, iconCls: 'deleteBtn', handler: function() { this.window.deleteApproval(nodeId);}})
      );
      evt.stopEvent();
      contextMenu.showAt(evt.xy);
    },
    
    deleteApproval : function (nodeId) {
      this.window.approvalObj.deleteApprovalById(nodeId);
      this.load(this.window.approvalObj);
    },
    
    getApprovalForId : function (id) {
      var approval = this.window.stepObj.getApprovalById(id);
      return approval;
    },
    
    selectNode : function(node, eventObj) {
      /** Should we save the current approval before switching? **/
      this.window.initApproval(this.getApprovalForId(node.id));
    },
    
    load : function(approval) {
      /** Clear the nodes **/
      this.getStore().getRootNode().eachChild( function (child) {
        child.remove();
      });
      if(!approval.name) {
          approval.name='#{msgs.workflow_approval}';
      }
      this.createNode(this.getStore().getRootNode().get('id'), approval, '#{msgs.workflow_approval}');
      
      this.getSelectionModel().select(this.getStore().getNodeById(approval.id));
      this.window.approvalObj = approval;
    },
    
    addChild : function (id, approval) {
      newNode = this.createNode(id, approval, '#{msgs.workflow_approval_child}');

    },
    
    save : function () {

    }
});