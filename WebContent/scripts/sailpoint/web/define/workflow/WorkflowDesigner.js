/**
 * Workflow Step Panel. This is the drag and drop panel that allows the user
 * to rearrange workflow steps and edit their transitions, arguments, and details
 */

Ext.define('SailPoint.WorkflowStepPanel', {    
    extend : 'Ext.panel.Panel',
    alias : 'widget.spworkflowsteppanel',
    
    stepCount : null,
    stepTmpl : null,
    transitionWindow : null,
    conditionWindow: null,
    gatewayWindow : null,
    stepWindow : null,
    iconWindow : null,
    approvalWindow : null,
    transitionStart : false,
    startStepComponent : null,
    endStepComponent : null,
    connections : [],          // an array of the connections between the steps
    paper : null,              // the paper on which the lines are drawn
    maxPosX : 0,
    maxPosY: 0,
    tempConnection : null,     // temporary connection used when creating a new transition
    tempStepComponent : null,  // temporary stepcomponent used when creating a new transition
    loaded: false,
    
    constructor : function(config) {
        
        Ext.apply(this, {
            title:'#{msgs.workflow_designer}',
            margins:'0 5 5 0',
            style: {
                overflow: 'auto'  // Inserting style here, so we can scroll to see entire workflow
            },
            layout: {
                type: 'auto'
            }
        });
        this.callParent(arguments);
    },
    
    initComponent : function() {
        this.stepCount = 0;
        this.callParent(arguments);
    },
    
    afterRender : function() {
        this.paper = new Raphael(this.body.dom);
        this.addDocked([{
            xtype: 'toolbar',
            dock: 'top',
            id: 'workflowDesignerToolBar',
            items:[
                   {text: '#{msgs.auto_layout}', panel: this, handler: function() {this.panel.autoLayout()}},
                   {text: '#{msgs.undo_auto_layout}', hidden: true, id:'undoLayoutBtn', panel: this, handler: function() {this.panel.undoAutoLayout()}}
               ]
            }]);
        this.addDropSupport();
    },
    
    // Drag/Drop support has been heavily modeled after the extjs example 'Custom Drag and Drop'
    addDropSupport : function(v) {
        
        this.dropZone = Ext.create('Ext.dd.DropZone', this.getEl(), {

            // If the mouse is over a target node, return that node. This is
            // provided as the "target" parameter in all "onNodeXXXX" node event handling functions
            getTargetFromEvent: function(e) {
                return e.getTarget('#workflowDesigner-body');
            },
    
            // While over a target node, return the default drop allowed class which
            // places a "tick" icon into the drag proxy.
            onNodeOver : function(target, dd, e, data){
                return Ext.dd.DropZone.prototype.dropAllowed;
            },
    
            // On node drop, we read the coordinates from the browser event to update the 
            // step data. see spworkflowcontrolpanel.stepPanel.getDragData to see how we get
            // the step data obtained from the original store.
            onNodeDrop : function(target, dd, e, data){
                data.posX = this.getX(e);
                data.posY = this.getY(e);
                Ext.getCmp('workflowDesigner').addStep(data);
                return true;
            },
            // workaround for various browserEvent coordinates, as I am too lazy to 
            // use the canonical e.getX and calculate an offset based off of other elements on the page
            getX : function(e) {
                return (Ext.ieVersion === 0) ? e.browserEvent.layerX : e.browserEvent.x;
            },
            getY : function(e) {
                return (Ext.ieVersion === 0) ? e.browserEvent.layerY : e.browserEvent.y;
            }
        });
  
    },
    
    undoAutoLayout : function() {

        //We do not want to load the entire previous step, just the position of the step
        for(var i=0; i<this.oldWorkflow.steps.length; i++) {
            var newStep = this.parent.editor.workflow.getStepById(this.oldWorkflow.steps[i].id);
            if(newStep ) {
               newStep.posX = this.oldWorkflow.steps[i].posX;
               newStep.posY = this.oldWorkflow.steps[i].posY;
            }
        }
        this.clear();
        this.load(this.parent.editor.workflow.steps);
        this.updateWidth();
        Ext.getCmp('undoLayoutBtn').hide();
    },
    
    autoLayout : function() {
        workflowJSON = Ext.JSON.encode(this.parent.editor.workflow);
        
        var valid = this.validate();
        
        if (!valid) {
            var statusBar = Ext.getCmp('editorStatusBar');
            statusBar.setText(this.parent.errorText);
            statusBar.setStatus({
                iconCls:this.parent.errorIconCls, 
                clear: {
                    wait: 5000,
                    anim: true,
                    useDefaults: false
                }
            });
            return false;
        }
        
        if (this.parent.editor.workflow.steps.length > 0) {
            
            var oldFlow = this.parent.editor.workflow;
            
            this.parent.editor.getEl().mask(Ext.LoadMask.prototype.msg,'x-mask-loading');
            Ext.Ajax.request({
                url: CONTEXT_PATH + '/define/workflow/workflowAutoLayoutJSON.json',
                scope: this,
                params: { workflowJSON: workflowJSON },
                success: function(result, response) {
                    this.parent.editor.workflow = new SailPoint.Workflow(JSON.parse(result.responseText));  
                    this.clear();
                    this.load(this.parent.editor.workflow.steps);
                    /** Store the old workflow so that we can undo to it **/
                    this.oldWorkflow = oldFlow;
                    Ext.getCmp('undoLayoutBtn').show();
                    this.updateWidth();
                    this.parent.editor.getEl().unmask();
                }
            });
        }
    },
    
    updateWidth : function() {
        var newWidth = (this.maxPosX > DESIGNER_WIDTH) ? this.maxPosX + 100 : DESIGNER_WIDTH;
        var newHeight = (this.maxPosY > DESIGNER_HEIGHT) ? this.maxPosY + 100 : DESIGNER_HEIGHT;
        this.el.child('.x-panel-body').setWidth(newWidth);
        this.el.child('.x-panel-body').setHeight(newHeight);
        this.paper.setSize(newWidth, newHeight - 1);
    },
    
    addStep : function(step) {
        var stepClass = '';
        var posY = step.posY || 20;
        var posX = step.posX || 20;
        var stepName = step.name;
        var stepId = this.stepCount + 1;
        
        if (posX > this.maxPosX) this.maxPosX = posX;
        if (posY > this.maxPosY) this.maxPosY = posY;
        
        // If this is from a tree-node click, try to get the icon off the tree-node's data
        // of that node
        if (step && step.data) {
          this.parent.editor.workflow.markDirty();
          stepClass = step.data.stepClass;
          stepName = step.data.text;
        } 
        // If this is from a WorkflowStep object, try to get it off its stepClass attribute
        if (step.iconClass)  stepClass = step.iconClass;
        
        if (!stepName) stepName = '#{msgs.workflow_new_step}';

        var stepComponent = new SailPoint.WorkflowStepComponent({
            id: 'step_' + stepId,
            stepId: stepId,
            stepObj: step,
            stepClass: stepClass,
            x: posX,
            y: posY,
            stepName: stepName,
            panel: this,
            iconKey: stepClass
        });
        
        //If monitor entire process selected, make sure we set new step to monitored
        if(step && step.data) {
            if(this.parent.editor.workflow.monitored) {
                    stepComponent.stepObj.isMonitored = true;
                    stepComponent.setIconKey(stepComponent.stepObj.iconClass);
            }
            
        }
        this.add(stepComponent);
        this.updateWidth();
        this.stepCount++;
    },

    editGateway : function(step) {
        if( !this.gatewayWindow) {
            this.gatewayWindow = new SailPoint.WorkflowStepGatewayWindow({
                step:step,
                panel: this
            });
        }
        
        this.gatewayWindow.setStep(step);
        this.gatewayWindow.initGateway(true);
        this.gatewayWindow.show();
    },

    editCondition : function(step, stepId) {
        if (this.conditionWindow) {
            this.conditionWindow.close();
        }
            this.conditionWindow = new SailPoint.WorkflowStepConditionWindow({
                step: step,
                stepId: stepId,
                panel: this
            });
        
        this.conditionWindow.setStep(step);
        this.conditionWindow.setStepId( stepId );
        this.conditionWindow.show();
    },

    editStep : function(stepId) {
        step = this.parent.editor.workflow.getStep(stepId - 1);

        if(this.stepWindow) {
            this.stepWindow.close(); 
        }
        this.stepWindow = new SailPoint.WorkflowStepWindow({
            stepId: stepId,
            stepObj: step,
            panel: this
        });
        this.stepWindow.setStepId(stepId);
        this.stepWindow.setStep(step);
        this.stepWindow.show();
    },

    monitorStep : function(stepId) {
        var steps = this.parent.editor.workflow.steps;
        var step = this.parent.editor.workflow.getStep(stepId-1);
        var isWorkflowMonitored = true;
        var isAnyStepMonitored = false;
        var i;
        var monitorText = '#{msgs.monitor_workflow}';
        var unmonitorText = '#{msgs.unmonitor_workflow}';
        var monitorBtnCls = 'monitorBtn';
        var unmonitorBtnCls = 'unmonitorBtn';
        var stepComponent = this.getComponent( 'step_' + stepId );

        if( step.isMonitored ) {
        	stepComponent.removeMonitoredBadge();
        } else {
        	stepComponent.addMonitoredBadge();
        }
        step.isMonitored = !step.isMonitored;
        // Figure out if we need to disable monitoring now
        if (steps) {
            for (i = 0; i < steps.length; ++i) {
                isWorkflowMonitored &= steps[i].isMonitored;
                isAnyStepMonitored |= steps[i].isMonitored;
            }
        }

        this.parent.editor.controlPanel.setMonitored(isAnyStepMonitored);
        
        if (!isWorkflowMonitored) {
            this.parent.editor.workflow.monitored = false;
        } else {
            this.parent.editor.workflow.monitored = true;
        }
        
        var monitoringButton = Ext.getCmp('monitorButton');
        monitoringButton.setText(isWorkflowMonitored ? unmonitorText : monitorText);
        var stepCmp = Ext.getCmp("step_" + stepId);
        this.parent.editor.workflow.markDirty();
    },

    changeIcon : function(stepId) {
        step = this.parent.editor.workflow.getStep(stepId-1);

        if (!this.iconWindow) {
            Ext.Ajax.request({
                url: CONTEXT_PATH + '/rest/workflows/icons',
                scope: this,
                success: function(result, response) {
                    var stepList = JSON.parse(result.responseText);          
                    this.iconWindow = new SailPoint.WorkflowStepIconWindow({
                        stepId:stepId,
                        stepObj:step,
                        stepList:stepList,
                        panel:this
                    });
                    this.iconWindow.show();
                },
                failure: function(result, response) {
                    this.getEl().unmask();
                    alert('#{msgs.workflow_load_failed}');
                }
            });       
        } else {
            this.iconWindow.setStepId(stepId);
            this.iconWindow.setStep(step);   
            this.iconWindow.show();
        }
    },
    
    editApproval : function(stepId) {
        this.parent.editor.getEl().mask(Ext.LoadMask.prototype.msg,'x-mask-loading');
        step = this.parent.editor.workflow.getStep(stepId - 1);
        
        if (!step.approval.id) {
            step.approval = new SailPoint.WorkflowApproval();
            step.approval.id = randomUUID();
        }
        
        if(this.approvalWindow) {
            this.approvalWindow.close();
        }
        this.approvalWindow = new SailPoint.WorkflowApprovalWindow({          
            stepId:stepId,
            stepObj:step,
            panel:this
        });

        this.approvalWindow.setStepId(stepId);
        this.approvalWindow.setStep(step);   
        this.approvalWindow.show();
    },

    showReferencePopup : function(stepId, stepComponent, formRefId) {
        SailPoint.component.ReferenceFormPopup.showWorkflow(stepComponent, stepId, 'Workflow', formRefId);
    },

    editForm : function(stepId) {
        this.parent.editor.getEl().mask(Ext.LoadMask.prototype.msg,'x-mask-loading');
        step = this.parent.editor.workflow.getStep(stepId - 1);
        
        if(step) {
            if (!step.form.id) {
                step.form = new SailPoint.WorkflowForm();
                step.form.id = randomUUID();
            }
        }
        if (this.formWindow) {
            this.formWindow.close();
        }
        var height = Ext.getBody().getViewSize().height-50;
        this.formWindow = new SailPoint.WorkflowFormEditorWindow({
            beanType: 'form',
            height: height,
            title: "#{msgs.form_editor_title}",
            panel:this
        });

        this.formWindow.on('show', function() {
            this.parent.editor.getEl().unmask();
        }, this);

        this.formWindow.templateEditor.setStepId(stepId);
        this.formWindow.templateEditor.setStep(step);  
        this.formWindow.show();
    },
    
    removeApproval : function(stepId) {
        step = this.parent.editor.workflow.getStep(stepId - 1);
        step.approval = '';
    },
    
    removeForm : function(stepId) {
        step = this.parent.editor.workflow.getStep(stepId - 1);
        step.form = '';      
    },
    
    removeStep : function(stepId) {
      
        this.parent.editor.workflow.removeStep(stepId-1);
        this.parent.editor.workflow.markDirty();
        //Preserve oldWorkflow in case that we autoLayout before removing step.
        var oldWf = null;
        if(this.oldWorkflow) {
            oldWf = this.oldWorkflow;
        }
        this.clear();
        stepCount = this.parent.editor.workflow.steps.length;
        
        var isWorkflowMonitored = (stepCount > 0) ? true : false;
        var isAnyStepMonitored = false;
        
        for (stepIndex = 0; stepIndex < stepCount; stepIndex++) {
            var step = this.parent.editor.workflow.steps[stepIndex];   
            isWorkflowMonitored &= step.isMonitored;
            isAnyStepMonitored |= step.isMonitored;
            if(step) {
                this.addStep(step);
                step.clearTransitionToIndexes();
            }
        }
        
        // Draw the transition lines
        this.refreshTransitions();
        this.oldWorkflow = oldWf;
        this.loaded = true;
      //Possibly we should break the monitoring business logic into it's own function
        this.parent.editor.controlPanel.setMonitored(isAnyStepMonitored);
        
        
        
        if (!isWorkflowMonitored) {
            this.parent.editor.workflow.monitored = false;
        } else {
            this.parent.editor.workflow.monitored = true;
        }
    },
    
    removeTransitionsForStep: function (stepId, onlyFrom, onlyTo) {
        // optional parameters default to true
        onlyFrom = onlyFrom === true || onlyFrom !== false;
        onlyTo = onlyTo === true || onlyTo !== false;
        
        // figure out which connections to remove
        var indexesToRemove = [];
        for (var i = this.connections.length; i--;) {
            if (this.connections[i].idFrom == stepId && onlyFrom) {
                indexesToRemove.push(i);
            } else if (this.connections[i].idTo == stepId && onlyTo) {
                indexesToRemove.push(i);
            }
        }
        
        // Need to sort ascending, so that highest items in the array are removed first
        indexesToRemove.sort(function(a,b){return a - b});
        
        // remove connection lines
        for (var j = indexesToRemove.length; j--;) {
            var c = this.connections.splice(indexesToRemove[j], 1);
            if (c[0].bg)    c[0].bg.remove();
            if (c[0].line)  c[0].line.remove();
            if (c[0].arrow) c[0].arrow.remove();
        }
    },
    
    startTransition : function () {
        this.transitionStart = true;
        
        var startX = this.startStepComponent.x + (STEP_WIDTH/2);
        var startY = this.startStepComponent.y + (STEP_HEIGHT/2);
        
        var rectangle = this.paper.rect(startX, startY, 10, 10, 5);
        rectangle.attr({fill: "#000", stroke: "#000", "fill-opacity": 1, "stroke-width": 2}).toBack();
        
        this.tempStepComponent = { // Make a fake step component that will follow the cursor
            box: rectangle // raphael bounding box
        };
        
        this.tempConnection = this.connection(this.startStepComponent, this.tempStepComponent);
        
        // Create a handler that will update the position and line for the fakestep
        var followCursor = function (designer) {
            // Only need to register the "double-click on nothing to cancel" handler once
            var cancelRegistered = false;
            return function(evt, t, o) {
                // getPageX and getPageY are coordinates wrt the browser window.
                // Subtract the coordinates of the panel so that we get coordinates
                // wrt to the panel.
                var xPos = evt.getPageX() - this.getLeft() - 5;  // -5 to get to the center
                var yPos = evt.getPageY() - this.getTop() - 50;  // -30 for the "Auto Layout" toolbar at the top
                
                designer.tempStepComponent.box.attr({x: xPos, y: yPos});
                designer.connection(designer.tempConnection);

                if (!cancelRegistered) {
                    // double click to cancel creating the transition
                    designer.getEl().on('dblclick', designer.clearTransitionLine, designer);
                    cancelRegistered = true;
                }
            }
        };
        
        // Set up the listener
        this.getEl().on('mousemove', followCursor(this));
    },

    clearTransitionLine: function () {
        this.transitionStart = false;
        
        // It would be nice to use removeListener() or un(), but the handler
        // is anonymous, so we can't do that.  If there were any other listeners,
        // we might lose them here.
        this.getEl().removeAllListeners();  // remove the mousemove handler
        this.tempStepComponent.box.remove();
        this.tempStepComponent = null;
        // remove the temporary line
        this.tempConnection.line.remove();
        this.tempConnection.arrow.remove();
        this.tempConnection = null;
    },
    
    endTransition : function () {
        this.clearTransitionLine();
        
        transition = new SailPoint.WorkflowStepTransition();
        transition.toIndex = this.endStepComponent.stepId; 
        
        startStep = this.parent.editor.workflow.getStep(this.startStepComponent.stepId-1);
        endStep = this.parent.editor.workflow.getStep(this.endStepComponent.stepId-1);
        transition.to = endStep.name;
        
        var gatewayAlready = startStep.isGateway();
        startStep.addTransition(transition);
        this.parent.editor.workflow.markDirty();
        
        //  If this has changed from a normal step to a gateway, draw the gateway stuff
        if(!gatewayAlready && startStep.isGateway()) {      
            // remove the transitions from the paper emanating from this step
            this.removeTransitionsForStep(this.startStepComponent.stepId, true, false);  
            
            // feed it into the drawgateway method, which will draw the gateway and the relevant transitions.
            this.drawGateway(startStep, this.startStepComponent.stepId);
        } else {
            this.drawTransition(this.startStepComponent, this.endStepComponent, "transition");
        }
    },

    drawGateway : function(step, index) {
      
        var startComponent = Ext.getCmp('step_'+(index));
        startComponent.setGateway(true);
      
        // Draw Transitions from gateway to steps
        for (var i = 0; i < step.transitions.length; i++) {
            var transition = step.transitions[i];
            toIndex = transition.getToIndex(this.parent.editor.workflow);        
            if (toIndex) {
                endComponent = Ext.getCmp('step_' + toIndex);
                
                if (endComponent && startComponent) {
                    this.drawTransition(startComponent, endComponent, 'gateway');
                } 
            }
        }
    },
    
    drawTransition : function (startComponent, endComponent, type) {
        if (startComponent && endComponent) {
            if (startComponent.box && endComponent.box) {
                this.connections.push(this.connection(startComponent, endComponent));
            }
        }
    },
    
    refreshTransitions : function () {
        // Cycle through steps
        for(i = 0;  i < this.parent.editor.workflow.steps.length; i++) {
            step = this.parent.editor.workflow.steps[i];
            this.drawTransitionsForStep(step, i+1);
        }
    },
    
    drawTransitionsForStep : function(step, index) {
        
        if (step.hidden) {
            return;
        }
        
        // Draw transitions
        if(step.transitions) {
          
            if (step.isGateway()) {
                this.drawGateway(step, index);
            } else {
                var startComponent = Ext.getCmp('step_'+(index));
                startComponent.setGateway(false);
                transition = step.transitions[0];
                if (transition && !transition.isToHidden(this.parent.editor.workflow) && (transition.to || transition.toIndex)) {
                    toIndex = transition.getToIndex(this.parent.editor.workflow);
                    
                    if (toIndex) {
                        startComponent = Ext.getCmp('step_' + (index));
                        startComponent.setGateway(false);
                        endComponent = Ext.getCmp('step_' + toIndex);
                        
                        if (endComponent && startComponent) {
                            if (endComponent.box && startComponent.box) {
                                this.drawTransition(startComponent, endComponent, "transition");
                            }
                        } 
                    }
                }
            }
        }
    },
    
    clear : function () {
        if (this.paper && this.paper.clear) { 
            this.paper.clear();
        }

        for (i = 0; i < this.stepCount; i++) {
            var step = Ext.getCmp('step_'+(i+1));
            if (step) {
                this.remove(step, true);
            }
        }
        
        this.stepCount = 0;
        this.connections = [];
        this.oldWorkflow = null;
        this.transitionStart = false;
        this.loaded = false;
    },
    
    load : function (steps) {
        this.connections = [];
        this.maxPosX = 0;
        this.maxPosY = 0;

        this.clear();
        
        // reset the scroll bars
        this.getEl().scrollTo("left", 0);
        this.getEl().scrollTo("top", 0);

        stepCount = steps.length;  
        for (stepIndex = 0; stepIndex < stepCount; stepIndex++) {
            var step = steps[stepIndex];
            
            // Only add steps that aren't hidden
            if(!step.hidden) {
                this.addStep(step);
            }
        }
        Ext.getCmp('undoLayoutBtn').hide();
        // Draw the transition lines
        this.refreshTransitions();
        this.updateWidth();
        this.loaded = true;
        
    },
    
    save : function () {
        steps = this.parent.editor.workflow.steps
        for(s = 0; s < steps.length; s++) {
            steps[s].saveTransitions(steps);
        }
    },

    validate : function () {
        // Go through the workflow and look at the names of the steps.  If any two steps have
        // the same name, mark invalid
        
        var invalid = false;
        var dupeName = '';
        
        var steps = this.parent.editor.workflow.steps;
        var names = [];
        for (var i = 0; i < steps.length; i++) {
            var name = steps[i].name;
            if (names[name] > 0) {
                invalid = true;
                dupeName = name;
                break;
            }
            
            names[name] = i + 1;
        }
        
        if (invalid) {
            this.parent.errorText = Ext.String.format("#{msgs.workflow_error_duplicate_step_name}", dupeName);
            return false;
        } 
        
        return true;
    },

    isStepNameUnique : function(stepName) {

        //Check if a step name is unique
        var valid = true;
        var steps = this.parent.editor.workflow.steps;
        var i;
        if(steps) {
            for(i=0; i<steps.length; i++) {
                if(steps[i].name === stepName) {
                    valid = false;
                    break;
                }
            }

        }
        return valid;

    },
    
    generateUniqueStepName : function(stepName) {
    	var generatedName = stepName;
    	var i = 1;
    	while(!this.isStepNameUnique(generatedName)) {
    		generatedName = stepName + " (" + i + ")";
    		i++;
    	}
    	return generatedName;
    },

    /**
     * The connection method is used for both creation and update.
     * Depending on the objects provided, it will create new
     * lines or update the existing ones.
     * Heavily modified from an example:
     * http://raphaeljs.com/graffle.html
    **/
    connection : function (obj1, obj2) { 
        var stepFrom = null;
        var stepTo = null;
        var gate = false;
        
        // If we are updating existing lines, then set up our variables
        // else assume we just got two stepcomponents and we need to create the lines.
        if (obj1.line && obj1.from && obj1.to) {
            var line = obj1;
            obj1 = line.from;
            obj2 = line.to;
            gate = line.gate;
        } else {
            stepFrom = obj1;
            stepTo = obj2;
            if (obj1.isGateway()) {
                obj1 = obj1.gatewayImg;
                gate = true;
            } else {
                obj1 = obj1.box;
            }
            obj2 = obj2.box;
        }
        
        // get the stats on the objects.
        // Usually, we would use getBBox, but firefox sometimes has issues with it.      
        var o1x = obj1.attr("x");
        var o1y = obj1.attr("y");
        var o1h = obj1.attr("height");
        var o1w = obj1.attr("width");
        var o2x = obj2.attr("x");
        var o2y = obj2.attr("y");
        var o2h = obj2.attr("height");
        var o2w = obj2.attr("width");
        
        // define attachment points for the start object and the end object--the box on the stepcomponent
        // don't offset if this line is emanating from a gateway
        var attachOffset = gate ? 0 : 4;        
        var startTopX = o1x + o1w / 2 + attachOffset;
        var startBottomX = o1x + o1w / 2 - attachOffset;
        var startRightY = o1y + o1h / 2 + attachOffset;
        
        attachOffset = 4;
        
        var p = [{x: startTopX,                    y: o1y - 1},                       // 0 start top
                 {x: startBottomX,                 y: o1y + o1h + 1},                 // 1 start bottom
                 {x: o1x - 1,                      y: o1y + o1h / 2 - attachOffset},  // 2 start left
                 {x: o1x + o1w + 1,                y: startRightY},                   // 3 start right
                 {x: o2x + o2w / 2 - attachOffset, y: o2y - 1},                       // 4 end   top
                 {x: o2x + o2w / 2 + attachOffset, y: o2y + o2h + 1},                 // 5 end   bottom
                 {x: o2x - 1,                      y: o2y + o2h / 2 + attachOffset},  // 6 end   left
                 {x: o2x + o2w + 1,                y: o2y + o2h / 2 - attachOffset}]; // 7 end   right
        var d = {};
        var dis = [];
         
        // find the attachment point and calculate the distances       
        for (var i = 0; i < 4; i++) {
          
            // don't emanate from the left if this is a gate.  
            if (gate && i == 2) i++;  
          
            for (var j = 4; j < 8; j++) {
                var dx = Math.abs(p[i].x - p[j].x),
                    dy = Math.abs(p[i].y - p[j].y);
                if ((i == j - 4) || (((i != 3 && j != 6) || p[i].x < p[j].x) &&
                                     ((i != 2 && j != 7) || p[i].x > p[j].x) &&
                                     ((i != 0 && j != 5) || p[i].y > p[j].y) &&
                                     ((i != 1 && j != 4) || p[i].y < p[j].y))) {
                    if ((i == 2 || i == 3) && (j == 6 || j == 7)) {
                        // prefer left and right
                        dis.push(dx + dy - 8);
                    } else {
                        dis.push(dx + dy);
                    }
                    d[dis[dis.length - 1]] = [i, j];
                }
            }
        }
        
        // sort the distances with minimum first      
        if (dis.length == 0) {
            var res = [0, 4];
        } else {
            res = d[Math.min.apply(Math, dis)];
        }
        
        // Now the shortest distances are the first elements in the array      
        var x1 = p[res[0]].x,
            y1 = p[res[0]].y,
            x4 = p[res[1]].x,
            y4 = p[res[1]].y;
        
        // Calculate the control points for the bezier curves
        dx = Math.max(Math.abs(x1 - x4) / 2, 10);
        dy = Math.max(Math.abs(y1 - y4) / 2, 10);
        
        var x2 = [x1, x1, x1 - dx, x1 + dx][res[0]].toFixed(3),
            y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3),
            x3 = [0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3),
            y3 = [0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);
            
        x4 = x4.toFixed(3);
        y4 = y4.toFixed(3);
        
        // This is the SVG representation for the curve
        var path = ["M", x1.toFixed(3), y1.toFixed(3), "C", x2, y2, x3, y3, x4, y4].join(",");
        var arrowPath = "M " + x4 + " " + y4;
        
        if (res[1] == 6) {                          // connection on left: arrow points right
            arrowPath += " l -10 -5 l 5 5 l -5 5 z";
        } else if (res[1] == 7) {                   // connection on right: arrow points left
            arrowPath += " l 10 5 l -5 -5 l 5 -5 z";
        } else if (res[1] == 5) {                   // connection on bottom; arrow points up
            arrowPath += " l -5 10 l 5 -5 l 5 5 z";
        } else {                                    // connection on top; arrow points down
            arrowPath += " l 5 -10 l -5 5 l -5 -5 z";
        }
        
        // If this is an existing object, update it
        // else create a new object
        if (line && line.line) {
            line.line.attr({path: path});
            line.arrow.attr({path: arrowPath});
        } else {
            var connector = this.paper.path(path).attr({stroke: TRANSITION_COLOR, "stroke-width": TRANSITION_WIDTH, fill: "none"});
            var pointer = this.paper.path(arrowPath).attr({fill: TRANSITION_COLOR, stroke: TRANSITION_COLOR});
            
            // return an object which contains each of the pieces we need to manipulate it
            return {
                line: connector,
                arrow: pointer,
                from: obj1,
                to: obj2,
                idFrom: stepFrom.stepId,
                idTo: stepTo.stepId,
                gate: gate
            };
        }
    }
});

/**
 * Workflow Step Component. This a drag and drop representation of the workflow 
  step object.
 */
Ext.define('SailPoint.WorkflowStepComponent', {
    extend: 'Ext.Component',
    config: {
        panel: null,
        stepObj : null,
        stepId : null,
        stepClass : null,
        box: null,
        iconKey: null,
        nameLabel: null,
        x: 10,
        y: 10,
        stepName: null,
        label: null,
        currentConnections: [],
        gateway: false,
        gatewayLine: null,
        gatewayImg: null,
        conditionalIcon: null,
        monitoredIcon: null,
        highlight: null
    },
    
    constructor: function(config) {
        this.initConfig(config);
        this.callParent(arguments);
        
        // drag and drop properties
        var start = function () {
                SailPoint.resetTimeout();

                this.box.ox = this.box.attr("x");
                this.box.oy = this.box.attr("y");
                this.box.animate({"opacity": 0.2}, 500);
                this.label.ox = this.label.attr("x");
                this.label.oy = this.label.attr("y");
                
                if( this.monitoredIcon ) {
                    this.monitoredIcon.ox = this.monitoredIcon.attr("x");
                    this.monitoredIcon.oy = this.monitoredIcon.attr("y");
                    this.monitoredIcon.animate({"opacity": 0.2}, 500);
                }
                
                if( this.conditionalIcon ) {
                    this.conditionalIcon.ox = this.conditionalIcon.attr("x");
                    this.conditionalIcon.oy = this.conditionalIcon.attr("y");
                    this.conditionalIcon.animate({"opacity": 0.2}, 500);
                }
                
                // Store only the connections that apply to the step we're
                // currently dragging, so we don't have to update them all.
                this.currentConnections = [];
                for (var i = this.panel.connections.length; i--;) {
                    if (this.panel.connections[i].idFrom == this.stepId || this.panel.connections[i].idTo == this.stepId) {
                        this.currentConnections.push(this.panel.connections[i]);
                    }
                }
            },
            move = function (dx, dy) {
            	// Move step icon
            	moveImage( this.box, dx, dy, 0 , 0 );
            	this.x = this.box.attr("x");
            	this.y = this.box.attr("y");
            	this.stepObj.posX = this.x;
            	this.stepObj.posY = this.y;
                if( this.conditionalIcon ) {
                	moveImage( this.conditionalIcon, dx, dy, 0, STEP_HEIGHT - BADGE_HEIGHT );
                }
                
                if( this.monitoredIcon ) {
                	moveImage( this.monitoredIcon, dx, dy, STEP_WIDTH - BADGE_WIDTH, 0);
                }

                // Label can be dragged out of bounds a little bit
                if( this.x > 0 ) {
                	this.label.attr( { x:this.label.ox + dx } );
                }
                if( this.y > 0 ) {
                	this.label.attr( { y:this.label.oy + dy } );
                }

                // If this step is a gateway, draw the gateway image+line to drag along
                // with the step.
                if (this.isGateway()) {
                    var newGatePath = ["M", this.x + STEP_WIDTH, this.y + STEP_HEIGHT/2, "l", 20, 0].join(",");
                    this.gatewayLine.attr({path: newGatePath});
                    this.gatewayImg.attr({x: this.x + STEP_WIDTH + 20, y: this.y + ((STEP_HEIGHT - GW_HEIGHT) / 2)});
                }

                // Update the connections between the steps.
                // Only update the lines connected to the step we're dragging.
                for (var i = this.currentConnections.length; i--;) {
                    this.panel.connection(this.currentConnections[i]);
                }
                //defect 19217  this only for chrome and needs this check so the other browsers will not see this code
                if(Ext.isChrome){
                    this.panel.load(this.panel.parent.editor.workflow.steps);
                }                 
            },
            end = function () {
                this.box.animate({"opacity": 1}, 500);
                if( this.monitoredIcon ) {
                    this.monitoredIcon.animate({"opacity": 1}, 500);
                }
                
                if( this.conditionalIcon ) {
                    this.conditionalIcon.animate({"opacity": 1}, 500);
                }

                if (this.x > this.panel.maxPosX) this.panel.maxPosX = this.x;
                if (this.y > this.panel.maxPosY) this.panel.maxPosY = this.y;
                
                this.panel.updateWidth();
                
                this.panel.parent.editor.workflow.markDirty();
            },
            moveImage = function( image, dx, dy, xOffset, yOffset ) {
                // don't drag above left of top max offset
                var dragX = image.ox + dx,
                    dragY = image.oy + dy,
                    newX = ( dragX > xOffset ? dragX : xOffset ),
                    newY = ( dragY > yOffset ? dragY : yOffset );
                	image.attr({x: newX, y: newY});
            },
            icon,
            name;
      
        // Only create a new step and add it to the workflow if it is a new step and not one
        // that was loaded from a workflow
        if (!this.stepObj || this.stepObj.data) {
            icon = this.stepObj.data.name;
            
            // If the step has a json representation, load that (we're getting a template step)
            if (this.stepObj.data.stepJson) {
                // Remove the transitions from the json
                this.stepObj.data.stepJson.transitions = [];
                this.stepObj = new SailPoint.WorkflowStep(this.stepObj.data.stepJson);
                // override positional information with config
                this.stepObj.posX = config.x;
                this.stepObj.posY = config.y;
            } else {
                name = this.stepObj.data.text;
                this.stepObj = new SailPoint.WorkflowStep(); 
                this.stepObj.name = name;
            }
            
            this.stepObj.iconClass = this.stepClass;
            this.stepObj.icon = icon;
            
            //Ensure we have a unique name on the stepObj
            this.stepObj.name = this.panel.generateUniqueStepName(this.stepObj.name);
            this.stepName = this.stepObj.name;
            
            this.panel.parent.editor.workflow.addStep(this.stepObj); 
        }

        // this is the image that represents the step.
        this.box = this.panel.paper.image(SailPoint.getRelativeUrl("/images/icons/gwe-icon-default.png"),
                this.x, this.y, STEP_WIDTH, STEP_HEIGHT).attr({cursor: "move", opacity: 1});
        
        if( this.stepObj.isConditional() ) {
        	this.addConditionalBadge();
        }
        if( this.stepObj.isMonitored ) {
        	this.addMonitoredBadge();
        }
        
        if (this.iconKey) this.setIconKey(this.iconKey);

        // set up mouse handlers
        this.box.drag(move, start, end, this, this, this);

        var dblclickHandler = function(context) {
            return function(e) { context.dblclick(e, context); };
        }(this);
        this.box.dblclick(dblclickHandler);

        // Raphael doesn't have a right-click handler.
        var rightClickHandler = function(context) {
            return function (e) {
                var rightclick; 
                if (!e) var e = window.event;
                if (e.which) rightclick = (e.which == 3);
                else if (e.button) rightclick = (e.button == 2);

                e.stopPropagation();

                if (rightclick) {
                    context.stepContextMenu(e, context);
                }
                return false;
            };
        }(this);
        this.box.mousedown(rightClickHandler);

        // highlight steps on mouseover when a new transition is started.
        var mouseoverHandler = function(context) {
            return function (e) {
                // if we are in a transition, create a circle or a rectangle, depending
                // on the shape of the icon
                if (context.panel.transitionStart)
                    if (context.iconKey == "start" || context.iconKey == "startMonitored" ||
                        context.iconKey == "stop"  || context.iconKey == "stopMonitored") {

                        context.highlight =
                                context.panel.paper.circle (
                                    context.x + STEP_WIDTH/2,
                                    context.y + STEP_HEIGHT/2,
                                    STEP_WIDTH/2
                                ).attr(
                                    {stroke: "#cc0000", "stroke-width": 2}
                                ).toFront();
                    } else {
                        context.highlight =
                                context.panel.paper.rect (
                                    context.x, context.y,
                                    STEP_WIDTH, STEP_HEIGHT, 10
                                ).attr({stroke: "#cc0000", "stroke-width": 2});
                    }
            };
        }(this);
        this.box.mouseover(mouseoverHandler);

        var mouseoutHandler = function(context) {
            return function(e) {
                if (context.highlight) {
                    context.highlight.remove();
                    context.highlight = null;
                }
            };
        }(this);
        this.box.mouseout(mouseoutHandler);
       
        // create the label for the step.
        this.label = this.panel.paper.text(this.x + STEP_WIDTH / 2, this.y + STEP_HEIGHT + 16, this.stepName);

        return this;
    },
    
    addMonitoredBadge : function() {
    	if( !this.monitoredIcon ) {
	        this.monitoredIcon = this.panel.paper.image(SailPoint.getRelativeUrl("/images/icons/eye.png"),
	                this.x + STEP_WIDTH - BADGE_WIDTH, this.y, BADGE_WIDTH, BADGE_HEIGHT).attr({cursor: "move", opacity: 1});
    	}
    },
    removeMonitoredBadge : function() {
    	if( this.monitoredIcon ) {
	        this.monitoredIcon.remove();
	        this.monitoredIcon = null;
    	}
    },
    addConditionalBadge : function() {
    	if( !this.conditionalIcon ) {
	        this.conditionalIcon = this.panel.paper.image(SailPoint.getRelativeUrl("/images/icons/step_condition.png"),
	                this.x, this.y + STEP_HEIGHT - BADGE_HEIGHT, BADGE_WIDTH, BADGE_HEIGHT).attr({cursor: "move", opacity: 1});
    	}
    },
    removeConditionalBadge : function() {
    	if( this.conditionalIcon ) {
	    	this.conditionalIcon.remove();
	        this.conditionalIcon = null;
    	}
    },

    /**
     * Remove transitions and gateways for this step and then redraw them
     **/
    redrawTransitions : function() {
      var stepId = this.id.substring('step_'.length, this.id.length);
      // Remove Lines/Pointers
      this.panel.removeTransitionsForStep(stepId, true, false);
      
      // remove the gateway if it exists
      var gateway = Ext.getCmp('gateway_step_' + stepId);
      if(gateway)
        this.panel.remove(gateway, true);
      
      if (this.gatewayLine) {      
        this.gatewayLine.remove();
        this.gatewayLine = null;
      }
      
      if (this.gatewayImg) {
        this.gatewayImg.remove();
        this.gatewayImg = null;
      }
  
      if (this.gatewayImgId) {
        this.panel.remove(this.gatewayImgId, true);
        this.gatewayImgId = null;
      }
      
      // Redraw Transitions
      this.panel.drawTransitionsForStep(this.stepObj, stepId);
    },

    /**
     * Add a reference form entry to a step object
     */
    addFormReference: function(sendVal, returnVal, ownerRadio, id, name, description) {
        if (null != id) {
            // Remove the embedded Form if a FormRef is selected.
            this.stepObj.form = new SailPoint.WorkflowForm();
            // ID is required for updating StepForm from JSON
            this.stepObj.form.id = randomUUID();
            this.stepObj.form.formRefId = id;
            // Copy the name and description to the form
            this.stepObj.form.name = name;
            this.stepObj.form.description = description;

            // Save approval fields in stepObj.form
            this.stepObj.form.sendVal = sendVal;
            this.stepObj.form.returnVal = returnVal;
            this.stepObj.form.ownerMethod = ownerRadio.getMethod();
            this.stepObj.form.ownerSource = ownerRadio.getSource();
        }
    },

    stepContextMenu : function(evt, context) {
        var stepId = context.stepId;
        var contextMenu = new Ext.menu.Menu();

        // current step component
        stepComponent = context;
        var stepObj = this.panel.parent.editor.workflow.getStep((stepId-1));
        if (stepComponent) {
            if (stepObj && stepObj.approval && stepObj.approval.id) {
                approvalExists = true;
                approvalTitle = '#{msgs.approval_edit}';
                approvalIcon = 'editBtn';
            } else {
                approvalExists = false;
                approvalTitle = '#{msgs.approval_add}';
                approvalIcon = 'addBtn';
            }
          
            if (stepObj && stepObj.form && stepObj.form.id) {
                formExists = true;
                formTitle = '#{msgs.form_edit}';
                formIcon = 'editBtn';
                if(stepObj.form.formRefId) {
                    formReference = true;
                } else {
                    formReference = false;
                }
            } else {
                formExists = false;
                formReference = false;
                formTitle = '#{msgs.form_add}';
                formIcon = 'addBtn';
            }
          
            contextMenu.add(
                new Ext.menu.Item({text: '#{msgs.step_edit}', iconCls: 'editBtn', handler: function() { stepComponent.panel.editStep(stepId)}}),
                new Ext.menu.Item({text: '#{msgs.step_monitor}', iconCls: 'monitorBtn', handler: function() { stepComponent.panel.monitorStep(stepId)}}),
                new Ext.menu.Item({text: '#{msgs.change_icon}', iconCls: 'infoBtn', handler: function() { stepComponent.panel.changeIcon(stepId)}}),
                new Ext.menu.Separator(),
                new Ext.menu.Item({text: '#{msgs.step_remove}', iconCls: 'deleteBtn', handler: function() {stepComponent.panel.removeStep(stepId)}}),
                new Ext.menu.Separator()
            );
        
            //if an approval exists, we don't allow you to add a form and visa versa since a step can't hold
            //two different approvals currently (a form is an approval) 
            if (approvalExists) {
                // approval exists, present edit option and removal option
                contextMenu.add(
                    new Ext.menu.Item({text: approvalTitle, iconCls: approvalIcon, handler: function() { stepComponent.panel.editApproval(stepId)}}),
                    new Ext.menu.Item({text: '#{msgs.approval_remove}', iconCls: 'deleteBtn', handler: function() {stepComponent.panel.removeApproval(stepId)}})
                );
            } else {
              
                // approval doesn't exist, check if a form exists...
                if(formExists) {
                    if (formReference) {
                           // reference form exists, show form edit and form remove option but no approval option
                           contextMenu.add(
                               new Ext.menu.Item({text: formTitle, iconCls: formIcon, handler: function() { stepComponent.panel.showReferencePopup(stepId, stepComponent, 'dummy')}}),
                               new Ext.menu.Item({text: '#{msgs.form_remove}', iconCls: 'deleteBtn', handler: function() {stepComponent.panel.removeForm(stepId)}})
                           );
                       } else {
                           // form exists, show form edit and form remove option but no approval option
                           contextMenu.add(
                               new Ext.menu.Item({text: formTitle, iconCls: formIcon, handler: function() { stepComponent.panel.editForm(stepId)}}),
                               new Ext.menu.Item({text: '#{msgs.form_remove}', iconCls: 'deleteBtn', handler: function() {stepComponent.panel.removeForm(stepId)}})
                           );
                       }
                } else {
                    // Neither form or approval exist...allow the user to create a form or approval
                    contextMenu.add(
                        new Ext.menu.Item({text: approvalTitle, iconCls: approvalIcon, handler: function() { stepComponent.panel.editApproval(stepId)}}),
                        new Ext.menu.Item({text: formTitle, iconCls: formIcon, handler: function() { stepComponent.panel.showReferencePopup(stepId, stepComponent)}})
                    );
                }
            }
            
            var conditionTxt = (stepObj.isConditional()) ? '#{msgs.step_edit_condition}' : '#{msgs.step_add_condition}';
            contextMenu.add(
                new Ext.menu.Separator(),
                new Ext.menu.Item(
                        {
                            text: conditionTxt, 
                            iconCls: 'stepCondition', 
                            handler: function() 
                                { 
                                context.panel.editCondition(context.stepObj, stepId)
                                }
                        })
            ); 
    
            if (stepComponent.panel.transitionStart && stepComponent.panel.stepCount>1) {
                stepComponent.panel.endStepComponent = stepComponent;
                contextMenu.add(
                    new Ext.menu.Separator(),
                    new Ext.menu.Item({text: '#{msgs.transition_end}', iconCls: 'transitionStart', handler: function() { stepComponent.panel.endTransition()}})
                ); 
            } else if (stepComponent.panel.stepCount > 1){
                stepComponent.panel.startStepComponent = stepComponent;
                contextMenu.add(
                    new Ext.menu.Separator(),
                    new Ext.menu.Item({text: '#{msgs.transition_start}', iconCls: 'transitionEnd', handler: function() { stepComponent.panel.startTransition()}})
                ); 
            }
            
            if(stepObj && stepObj.transitions && stepObj.transitions.length > 0) {
                contextMenu.add(
                        new Ext.menu.Item({
                            text: '#{msgs.transitions_edit}', 
                            handler: function() {
                              context.panel.editGateway(context.stepObj)
                            }, 
                            iconCls: 'editBtn',
                            step: stepComponent
                        })
                );
            }

            // prevent the browser context menu
            contextMenu.on('render', function (menu) {
                menu.getEl().on('contextmenu', Ext.emptyFn, null, {preventDefault: true});
            });

            contextMenu.showAt(evt.clientX, evt.clientY);
        }
    },

    gatewayContextMenu: function(evt, context) {
        
        var contextMenu = new Ext.menu.Menu();
        step = context;
        contextMenu.add(
                new Ext.menu.Item({
                    text: '#{msgs.transitions_edit}', 
                    handler: function() {
                      context.panel.editGateway(context.stepObj)
                    }, 
                    iconCls: 'editBtn',
                    step: step
                })
        );

        // prevent the browser context menu
        contextMenu.on('render', function (menu) {
            menu.getEl().on('contextmenu', Ext.emptyFn, null, {preventDefault: true});
        });

        contextMenu.showAt(evt.clientX, evt.clientY);
    },

    // double click is synonymous with start/end new transition 
    dblclick : function(evt, context) {
        if (context.panel.transitionStart && this.panel.stepCount > 1) {
            context.panel.endStepComponent = context;
            context.panel.endTransition();
            
        } else if (context.panel.stepCount > 1) {
            context.panel.startStepComponent = context;
            context.panel.startTransition();
        }
    },

    setIconKey: function(iconKey) {
        this.iconKey = iconKey;
        var iconMap = {
                step:               "gwe-icon-default.png",
                audit:              "gwe-icon-audit.png",
                auditMonitored:     "gwe-icon-audit.png",
                audit_sm:           "magnifier.png",
                analysis:           "gwe-icon-launch-analysis.png",
                analysisMonitored:  "gwe-icon-launch-analysis.png",
                analysis_sm:        "table.png",
                approval_sm:        "accept.png ",
                approval:           "gwe-icon-approval.png ",
                approvalMonitored:  "gwe-icon-approval.png ",
                undefinedMonitored: "gwe-icon-default.png",
                catches:            "gwe-icon-catches.png",
                catchesMonitored:   "gwe-icon-catches.png",
                task:               "gwe-icon-launch-task.png",
                taskMonitored:      "gwe-icon-launch-task.png",
                task_sm:            "server_go.png",
                undo:               "gwe-icon-undo.png",
                undoMonitored:      "gwe-icon-undo.png",
                undo_sm:            "arrow_undo.png",
                message:            "gwe-icon-comment.png",
                messageMonitored:   "gwe-icon-comment.png",
                message_sm:         "comments.png",
                email:              "gwe-icon-send-message.png",
                emailMonitored:     "gwe-icon-send-message.png",
                email_sm:           "email.png",
                provision:          "gwe-icon-provision.png",
                provisionMonitored: "gwe-icon-provision.png",
                provision_sm:       "application_form_edit.png",
                start:              "gwe-icon-start.png",
                startMonitored:     "gwe-icon-start.png",
                start_sm:           "go.png",
                stop:               "gwe-icon-stop.png",
                stopMonitored:      "gwe-icon-stop.png",
                stop_sm:            "cancel.png",
                "gwe-icon":         "gwe-icon-default.png",
                Monitored:          "gwe-icon-default.png"
              },
            iconPath = CONTEXT_PATH + "/images/icons/";
        if (this.box) {
            iconImg = iconMap[iconKey] ? iconMap[iconKey] : "gwe-icon-default.png";
            this.box.attr({src: iconPath + iconImg});
        }
    },

    setGateway: function(enable) {

        this.gateway = enable;

        if (enable) {
            // Calculate the start and end coordinates for the line between the step and the gateway
            var startX = this.x + STEP_WIDTH,
                startY = this.y + (STEP_HEIGHT/2),
                endX = startX + 20,
                endY = startY,
                imgSrc = CONTEXT_PATH + "/images/icons/gwe-gateway.png",
                linePath = ["M", startX, startY, "l", 20, 0].join(",");

            // draw the gateway image with raphael
            this.gatewayImg = this.panel.paper.image(imgSrc, endX, endY - (GW_HEIGHT/2), GW_WIDTH, GW_HEIGHT);

            // Raphael doesn't have a right-click handler.
            var rightClickHandler = function(context) {
                return function (e) {
                    var rightclick;

                    if (!e) var e = window.event;
                    if (e.which) rightclick = (e.which == 3);
                    else if (e.button) rightclick = (e.button == 2);

                   e.stopPropagation();

                    if (rightclick) {
                        context.gatewayContextMenu(e, context);
                    }
                    return false;
                };
            }(this);
            this.gatewayImg.mousedown(rightClickHandler);
            
            // draw the line from the step to the gateway
            this.gatewayLine = this.panel.paper.path(linePath).attr({stroke: TRANSITION_COLOR, "stroke-width": TRANSITION_WIDTH});

        } else {
            if (this.gatewayLine) this.gatewayLine.remove();
            if (this.gatewayImg) this.gatewayImg.remove();
        }
    },

    isGateway: function() {
        return this.gateway;
    }
});
