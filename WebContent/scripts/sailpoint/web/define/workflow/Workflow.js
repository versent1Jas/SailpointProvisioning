/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint');


////////////////////////////////////////////////////////////////////////////////
//
// A javascript representation of the SailPoint.object.Workflow object
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.Workflow = Class.create();
SailPoint.Workflow.prototype = {

  id: null,
  workflowId: null,
  name: null,
  isDirty: null,
  isMonitored: false,
  steps: null,
  variables: null,
  description: null,
  configForm: null,
  type: null,
  metrics: null,
  monitored: null,
  libraries: null,
  ruleLibraries: null,
  taskType: null,
  handler: null,
  
  /**
   * Constructor.
   * 
   * @param  wfInfo  The raw JSON workflow mapping information object.
   */
  initialize: function(wfInfo) {
    
      //Need to ensure the current steps/variables arrays are cleared.
      //Setting these to [] will create a new object and leave the old as is.
    if(this.variables) {
      this.variables.length = 0;
    }
    if(this.steps) {
        this.steps.length = 0;
    }
    if ( this.ruleLibraries ) {
        this.ruleLibraries.length = 0;
    }
    this.steps = [];
    this.variables = [];
    this.ruleLibraries = [];
    this.isDirty = false;
    // jsl - this is the original property that means that at least
    // one step is monitored, this is different than isMonitored which
    // says whether overall process monitoring is enabled, consider
    // reworking how monitoring is visualized 
    this.monitored = false;
    
    if(wfInfo) {
      //console.debug("[Workflow.initialize] Name: "+ wfInfo.name);
      this.name = wfInfo.name;   
      this.id = wfInfo.id;  
      this.workflowId = wfInfo.processId;
      this.isMonitored = wfInfo.isMonitored;
      this.description = wfInfo.description;
      this.configForm = wfInfo.configForm;
      this.metrics = wfInfo.metrics;
      this.type = wfInfo.type;
      this.libraries = wfInfo.libraries;
      this.handler = wfInfo.handler;
      this.taskType = wfInfo.taskType;
      
      //console.debug("[Workflow.initialize] ruleLibraries: "+ wfInfo.ruleLibraries);
      for(libIndex=0; libIndex<wfInfo.ruleLibraries.length; libIndex++) {
        this.ruleLibraries.push(new SailPoint.RuleLibrary(wfInfo.ruleLibraries[libIndex]));
      }
            
      //console.debug("[Workflow.initialize] Steps: "+ wfInfo.steps);
      for(stepIndex=0; stepIndex<wfInfo.steps.length; stepIndex++) {
        this.steps.push(new SailPoint.WorkflowStep(wfInfo.steps[stepIndex]));
      }
      
      //console.log("[Workflow.initialize] Variables: "+ wfInfo.variables);
      for(variableIndex=0; variableIndex<wfInfo.variables.length; variableIndex++) {
        this.variables.push(new SailPoint.WorkflowVariable(wfInfo.variables[variableIndex]));
      }
      
      this.initTransitions();
    }
  },
  
  /** Allows us to flag that this workflow has been changed and hasn't been saved **/
  markDirty: function() {
    this.isDirty = true;
  },
  
  /** Allows us to flag that this workflow has been changed saved **/
  markClean: function() {
    this.isDirty = false;
  },
  
  addStep: function(step) {
    if(!this.steps) {
      this.steps = [step];
    } else {
      this.steps.push(step);
    }
    //console.debug("[Workflow.addStep] Step: "+step + " Steps: " + this.steps);
  },
  
  addVariable: function(variable) {
    if(!this.variables) {
      this.variables = [variable];
    } else {
      this.variables.push(variable);
    }
     //console.debug("[Workflow.addVariable] Variable: "+variable + " Variables: " + this.variables);
  },
  
  getStep: function(index) {
    if(this.steps && index<this.steps.length) {
      step = this.steps[index];
      //console.debug("[Workflow.getStep] Step: "+step);
      return step;
    }
  },
  
  getStepById: function(id) {
    if(this.steps) {
    	for(var i=0; i<this.steps.length; i++) {
        var tempStep = this.steps[i];
        if(tempStep.id == id) {
          return tempStep;
        }
      }
    }
  },
  
  getStepIndex: function(step) {
    if(this.steps) {
        var indexArray = new Array();
      for(var i=0; i<this.steps.length; i++) {
        var tempStep = this.steps[i];
        if(step.id) {
            if(tempStep.id == step.id) {
                indexArray.push(i);
                return indexArray;
            }
        } else {
            //used for new workflows that have not yet been persisted to the backend
            if(tempStep.name == step.name) {
                indexArray.push(i);
            }
        }
      }
      return indexArray;
    }
  },
  
  /** Each WorkflowStepTransition has a toIndex field that points to the step number
   *   of another step.  These need to be initialized when a workflow is loaded as the
   *   indexes are not persisted...only the to names **/
  initTransitions: function() {
    for(stepIndex=0; stepIndex<this.steps.length; stepIndex++) {
      step = this.steps[stepIndex];
      step.initTransitions(this.steps);
    }
  },
  
  removeStep: function(index) {
    if(index>=0 && index<this.steps.length) {    
      this.steps.splice(index,1);
      
      /**Need to go through and remove all transitions that point to this step **/
      for(stepIndex=0; stepIndex<this.steps.length; stepIndex++) {
        this.steps[stepIndex].removeTransition(index+1);
      }
    }
  },
  
  getVariableById: function(id) {
    if(id) {
      for(vIndex=0; vIndex<this.variables.length; vIndex++) {
        variable = this.variables[vIndex];
        if(variable.id == id)
          return variable;
      }
    }
  },
  
  removeVariable: function(id) {
    if(id) {
      for(vIndex=0; vIndex<this.variables.length; vIndex++) {
        variable = this.variables[vIndex];
        if(variable.id == id) {
          this.variables.splice(vIndex, 1);
        }
      }
    }
  }
};

////////////////////////////////////////////////////////////////////////////////
//
// A javascript representation of the SailPoint.object.Workflow.Variable object
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.WorkflowVariable = Class.create();
SailPoint.WorkflowVariable.prototype = {

  id: null,
  name: null,
  type: null,
  initializer: null,
  isTransient : false,

  initializerMethod: null,
  initializerSource: null,
  initializerExplicitMethod: null,
  input: false,
  output: false,
  required: false,
  editable: false,
  description: null,
  prompt: null,
  
  
  /**
   * Constructor.
   * 
   * @param  wfInfo  The raw JSON workflow mapping information object.
   */
  initialize: function(variableInfo) {
    if(variableInfo) {
      this.id = variableInfo.id;
      this.name = variableInfo.name;
      this.initializer = variableInfo.initializer; 
      this.initializerMethod = variableInfo.initializerMethod;
      this.initializerSource = variableInfo.initializerSource;
      this.initializerExplicitMethod = variableInfo.initializerExplicitMethod;
      this.input = variableInfo.input;
      this.output = variableInfo.output;
      this.required = variableInfo.required;
      this.editable = variableInfo.editable;
      this.description = variableInfo.description;
      this.prompt = variableInfo.prompt;
      this.type = variableInfo.type;
      this.isTransient = variableInfo.isTransient;      
    }
    //console.debug("[WorkflowVariable.initialize] name: "+this.name + " initializer: "+this.initializer+" input: "+this.input);
  }
};


////////////////////////////////////////////////////////////////////////////////
//
// A javascript representation of the SailPoint.object.Workflow.Step object
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.WorkflowStep = Class.create();
SailPoint.WorkflowStep.prototype = {

  id: null,
  name: null,
  description: null,
  configForm: null,
  isMonitored: false,
  catches: null,
  resultVariable: null,
  returns : null, 
  wait : null,
  
  icon: null,
  iconClass: null,
  
  hidden: null,
  
  index: null,
  
  args: null,
  transitions: null,
  
  conditionMethod: null,
  conditionSource: null,
  conditionExplicitMethod: null,
  conditionNegated: false,
  
  approval: null,
  actionMethod: null,
  actionSource: null,
  actionExplicitMethod: null,
  
  subprocess: null,
  subprocessConfigForm: null,
  
  form: null,
  
  posX: null,
  posY: null,
  
  /**
   * Constructor.
   * 
   * @param  wfInfo  The raw JSON workflow mapping information object.
   */
  initialize: function(stepInfo) {
    this.transitions = [];
    this.args = [];
    this.returns = [];
    this.approval = new SailPoint.WorkflowApproval();
    this.form = new SailPoint.WorkflowForm();
    this.name = 'New Step';
    
    if(stepInfo) {
      //console.debug("Step: " + stepInfo);
      this.id = stepInfo.id;
      this.name = stepInfo.name;
      this.description = stepInfo.description;
      this.configForm = stepInfo.configForm;
      this.isMonitored = stepInfo.isMonitored;
      this.resultVariable = stepInfo.resultVariable;
      this.icon = stepInfo.icon;
      this.wait = stepInfo.wait;
      if (this.isMonitored) {
          this.iconClass = stepInfo.iconClass + 'Monitored';
      } else {
          this.iconClass = stepInfo.iconClass;
      }
      this.approval = new SailPoint.WorkflowApproval(stepInfo.approval);
      this.form = new SailPoint.WorkflowForm(stepInfo.form);
      
      this.conditionMethod = stepInfo.conditionMethod;
      this.conditionSource = stepInfo.conditionSource;
      this.conditionExplicitMethod = stepInfo.conditionExplicitMethod;
      this.conditionNegated = stepInfo.conditionNegated;
      
      if(stepInfo.transitions) {
	      for(transitionIndex=0; transitionIndex<stepInfo.transitions.length; transitionIndex++) {          
	        this.transitions.push(new SailPoint.WorkflowStepTransition(stepInfo.transitions[transitionIndex]));
	      }
      }
      
      if(stepInfo.args) {
	      for(argIndex=0; argIndex<stepInfo.args.length; argIndex++) {
	        this.args.push(new SailPoint.WorkflowArgument(stepInfo.args[argIndex]));
	      }
      }
      
      if ( stepInfo.returns ) {
        for (returnIndex=0; returnIndex<stepInfo.returns.length; returnIndex++) {
          this.returns.push(new SailPoint.WorkflowStepReturn(stepInfo.returns[returnIndex]));
        }
      }
      this.actionMethod = stepInfo.actionMethod;
      this.actionSource = stepInfo.actionSource;
      this.actionExplicitMethod = stepInfo.actionExplicitMethod;
      this.subprocess = stepInfo.subprocess;
      this.subprocessConfigForm = stepInfo.subprocessConfigForm;
      this.posX = stepInfo.posX;
      this.posY = stepInfo.posY;
      this.hidden = stepInfo.hidden;
      this.catches = stepInfo.catches;
    }
  },
  
  /** Get a transition from this step that points to the provided index **/
  getTransition: function(index) {
    if(this.transitions && this.transitions.length>0) {
      for(transitionIndex=0; transitionIndex<this.transitions.length; transitionIndex++) {
        transition = this.transitions[transitionIndex];
        if(index == transition.toIndex) 
          return transition;
      }
    }
  },
  
  /** Given a list of steps, this method will go through the steps and find the step that corresponds to the
      "to" of the transitions that it contains.  It will then fill in the toIndex to point to that step. **/
  initTransitions: function(steps) {
    for(tIndex=0; tIndex<this.transitions.length; tIndex++) {
      transition = this.transitions[tIndex];
      if(transition.to && !transition.toIndex) {
        for(s=0; s<steps.length; s++) {
          tempStep = steps[s];
          if(tempStep.name == transition.to) {
            transition.toHidden = tempStep.hidden;
            transition.toIndex = s+1;
          }
        }
      }      
      //console.debug('[WorkflowTransition.initializeTransitionIndexes] to: ' + transition.to + ' toIndex: '+ transition.toIndex);
    }
  },
  
  /** Performed during a save...ensures that all transitions have their 'to' field populated correctly (in case the step name has changed)**/
  saveTransitions: function(steps) {
    for(tIndex=0; tIndex<this.transitions.length; tIndex++) {
      transition = this.transitions[tIndex];
      if(transition.toIndex) {
        tempStep = steps[transition.toIndex-1];
        transition.to = tempStep.name;
     
      }      
    }
  },
  
  getArgById: function(id) {
    if(id) {
      for(aIndex=0; aIndex<this.args.length; aIndex++) {
        arg = this.args[aIndex];
        if(arg.id == id)
          return arg;
      }
    }
  },
  
  getArgsJSON : function() {
      return Ext.JSON.encode(this.args);    
  },
  
  removeArg: function(id) {
    if(id) {
      for(aIndex=0; aIndex<this.args.length; aIndex++) {
        arg = this.args[aIndex];
        if(arg.id == id) {
          this.args.splice(aIndex, 1);
        }
      }
    }
  },
  
  isConditional: function() {
      // This may be undefined, so we can't just do a null check.
      return (this.conditionSource) ? true : false;
  },
  
  clearTransitionToIndexes : function() {
    for(tIndex=0; tIndex<this.transitions.length; tIndex++) {
        this.transitions[tIndex].toIndex = null;
    }
  },
  
  /** Removes the transition based on where it points **/
  removeTransition: function(toIndex) {
    if(toIndex) {
      for(tIndex=0; tIndex<this.transitions.length; tIndex++) {
        transition = this.transitions[tIndex];
        
        if(transition.toIndex == toIndex) {
          this.transitions.splice(tIndex, 1);
        }  
      }
    }
  },
  
  /** Removes the transition based on its position in the array of transitions **/
  removeTransitionByIndex: function(index) {
    this.transitions.splice(index, 1);
  },
  
  addTransition: function(transition) {
    if(!this.transitions) {
      this.transitions = [transition];
    } else {
      this.transitions.push(transition);
    }
  },
  
  addArg: function(arg) {
    if(!this.args) {
      this.args = [arg];
    } else {
      this.args.push(arg);
    }
  },
  
  /** According to Business Process Modeler Notation, if a step has more than
   * two transitions out or has a transition that is conditional, it needs
   * to be represented with a gateway
   */
  isGateway: function() {
    if(this.transitions.length>1) {
      return true;
    } else {
      for(var i=0; i<this.transitions.length; i++) {
        var transition = this.transitions[i];
        if(transition.whenSource) 
          return true;
      }
    }
    return false;
  },
  
  /** Returns all steps that have transitions to this step **/
  getIncomingSteps: function(steps, index) {
    var incoming = [];
    for(var i=0; i<steps.length; i++) {
      var step = steps[i];
      for(var j=0; j<step.transitions.length; j++) {
        var transition = step.transitions[j];
        step.index = i;
        if(transition.toIndex == index) {
          incoming.push(step);
        }
      }
    }
    return incoming;
  },
  
  getApprovalById: function(id) {
    if(id) {
      if(id==this.approval.id) 
        return this.approval;
      
      
      for(var cIndex=0; cIndex<this.approval.children.length; cIndex++) {
        var child = this.approval.children[cIndex];
        var approval = child.getApprovalById(id);
        if(approval)
          return approval;
      }
    }
  }
};


////////////////////////////////////////////////////////////////////////////////
//
// A javascript representation of the SailPoint.object.Workflow.Transition object
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.WorkflowStepTransition = Class.create();
SailPoint.WorkflowStepTransition.prototype = {

  id: null,
  toIndex: null,
  to: null,
  negate: false,
  whenMethod: null,
  whenSource: null,
  whenExplicitMethod: null,
  
  /** If this transition points to a hidden step **/
  toHidden: null,
  
  /**
   * Constructor.
   * 
   * @param  wfInfo  The raw JSON workflow mapping information object.
   */
  initialize: function(transitionInfo) {
    if(transitionInfo) {
      this.id = transitionInfo.id;
      this.to = transitionInfo.to;
      this.negate = transitionInfo.negate;
      this.whenMethod = transitionInfo.whenMethod;
      this.whenSource = transitionInfo.whenSource;
      this.whenExplicitMethod = transitionInfo.whenExplicitMethod;
    }
    this.toHidden = false;
  },
  
  getToIndex: function(workflow) {
    if(!this.toIndex) {
      for(var k=0; k<workflow.steps.length; k++) {
        if(this.to == workflow.steps[k].name) {
          this.toIndex = k+1;
          break;
        }
      }
    }
    return this.toIndex;
  },
  
  isToHidden: function(workflow) {
    for(var k=0; k<workflow.steps.length; k++) {     
      if(this.to == workflow.steps[k].name && workflow.steps[k].hidden) {
        this.toHidden = true;
        break;
      }
    }
    return this.toHidden;
  }
};

////////////////////////////////////////////////////////////////////////////////
//
// A javascript representation of the SailPoint.object.Workflow.Approval object
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.WorkflowApproval = Class.create();
SailPoint.WorkflowApproval.prototype = {

  id: null,
  name: null,
  
  returnVal: null,
  sendVal: null,
  renderer: null,
  
  /** Scripts **/
  modeMethod: null,
  modeSource: null,
  modeExplicitMethod: null,
  
  ownerMethod: null,
  ownerSource: null,
  ownerExplicitMethod: null,
  
  descriptionMethod: null,
  descriptionSource: null,
  descriptionExplicitMethod: null,
  
  scriptMethod: null,
  scriptSource: null,
  scriptExplicitMethod: null,
  
  afterMethod: null,
  afterSource: null,
  afterExplicitMethod: null,
  
  /** Arrays of objects **/
  args: null,
  children: null,
  
  /** Work Item **/
  workItemConfig: null,
  
  /**
   * Constructor.
   * 
   * @param  wfInfo  The raw JSON workflow mapping information object.
   */
  initialize: function(approvalInfo) {
    this.children = [];
    this.args = [];
    this.workItemConfig = new SailPoint.WorkflowWorkItemConfig();
    
    if(approvalInfo) {
      //console.debug('ApprovalInfo: '+Ext.JSON.encode(approvalInfo));
      this.id = approvalInfo.id;
      this.name = approvalInfo.name;
      this.renderer = approvalInfo.renderer;
      this.mode = approvalInfo.mode;
      this.returnVal = approvalInfo.returnVal;
      this.sendVal = approvalInfo.sendVal;
      
      if(approvalInfo.args){
	      for(argIndex=0; argIndex<approvalInfo.args.length; argIndex++) {
	        this.args.push(new SailPoint.WorkflowArgument(approvalInfo.args[argIndex]));
	      }
      }
      
      var childLength = approvalInfo.children.length;
      if(childLength>0) {
	      for(childIndex=0; childIndex<childLength; childIndex++) {
	        this.children.push(new SailPoint.WorkflowApproval(approvalInfo.children[childIndex]));
	      }
      }
      
      this.descriptionMethod = approvalInfo.descriptionMethod;
      this.descriptionSource = approvalInfo.descriptionSource;
      this.descriptionExplicitMethod = approvalInfo.descriptionExplicitMethod;
      
      this.modeMethod = approvalInfo.modeMethod;
      this.modeSource = approvalInfo.modeSource;
      this.modeExplicitMethod = approvalInfo.modeExplicitMethod;
      
      this.scriptMethod = approvalInfo.scriptMethod;
      this.scriptSource = approvalInfo.scriptSource;
      this.scriptExplicitMethod = approvalInfo.scriptExplicitMethod;
      
      this.ownerMethod = approvalInfo.ownerMethod;
      this.ownerSource = approvalInfo.ownerSource;
      this.ownerExplicitMethod = approvalInfo.ownerExplicitMethod;
      
      this.afterMethod = approvalInfo.afterMethod;
      this.afterSource = approvalInfo.afterSource;
      this.afterExplicitMethod = approvalInfo.afterExplicitMethod;
      
      this.workItemConfig = new SailPoint.WorkflowWorkItemConfig(approvalInfo.workItemConfig);
    }
  },
  
  removeArg: function(id) {
    if(id) {
      for(aIndex=0; aIndex<this.args.length; aIndex++) {
        arg = this.args[aIndex];
        if(arg.id == id) {
          this.args.splice(aIndex, 1);
        }
      }
    }
  },
  
  addArg: function(arg) {
    if(!this.args) {
      this.args = [arg];
    } else {
      this.args.push(arg);
    }
  },
  
  removeChild: function(id) {
    if(id) {
      for(cIndex=0; cIndex<this.children.length; cIndex++) {
        child = this.children[cIndex];
        if(child.id == id) {
          this.children.splice(cIndex, 1);
        }
      }
    }
  },
  
  addChild: function(child) {
    if(!this.children) {
      this.children = [child];
    } else {
      this.children.push(child);
    }
  },
  
  getApprovalById: function(id) {
    if(id) {
      if(id==this.id) 
        return this;
      
      
      for(var cIndex=0; cIndex<this.children.length; cIndex++) {
        var child = this.children[cIndex];
        var approval = child.getApprovalById(id);
        if(approval)
          return approval;
      }
    }
  },
  
  deleteApprovalById: function(id) {
    if(id) {
      if(id==this.id) 
        return;
      
      
      for(var cIndex=0; cIndex<this.children.length; cIndex++) {
        var child = this.children[cIndex];
        if(child.id == id) {
          this.children.splice(cIndex, 1);
          return 1;
        }
        if(child.deleteApprovalById(id)==1)
          return 1;
      }
    }
  },
  getArgById: function(id) {
      if(id) {
        for(aIndex=0; aIndex<this.args.length; aIndex++) {
          arg = this.args[aIndex];
          if(arg.id == id)
            return arg;
        }
      }
    }

};

////////////////////////////////////////////////////////////////////////////////
//
// A javascript representation of the SailPoint.object.Workflow.Arg object
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.WorkflowArgument = Class.create();
SailPoint.WorkflowArgument.prototype = {

  id: null,
  name: null,
  
  valueMethod: null,
  valueSource: null,
  valueExplicitMethod: null,
  
  /**
   * Constructor.
   * 
   * @param  wfInfo  The raw JSON workflow mapping information object.
   */
  initialize: function(argumentInfo) {
    if(argumentInfo) {
      this.id = argumentInfo.id;
      this.name = argumentInfo.name;
      
      this.valueMethod = argumentInfo.valueMethod;
      this.valueSource = argumentInfo.valueSource;
      this.valueExplicitMethod = argumentInfo.valueExplicitMethod;
    }
  }
};

////////////////////////////////////////////////////////////////////////////////
//
// A javascript representation of the SailPoint.object.Workflow.Arg object
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.WorkflowWorkItemConfig = Class.create();
SailPoint.WorkflowWorkItemConfig.prototype = {

  id: null,
  workItemOverride: false,
  workItemEnabled: false,
  escalationStyle: 'none',
  
  daysTillReminder: null,
  daysBetweenReminders: null,
  
  maxReminders: null,
  daysTillEscalation: null,
  escalationRule: null,
  
  notificationEmail: null,
  reminderEmail: null,
  escalationEmail: null,
  
  ownerIds: null,
  ownersData: null,
  
  electronicSignature : null,
  
  /**
   * Constructor.
   * 
   * Although the electronicSignature isn't really stored in the db as
   * a workitem config attribute it is adorned to the workItemInfo DTO.
   * 
   * @param  wfInfo  The raw JSON workflow mapping information object.
   */
  initialize: function(wiConfigInfo) {
    this.ownersData = {"totalCount":0,"objects":[]};
    this.ownerIds = [];
    if(wiConfigInfo) {
      this.id = wiConfigInfo.id;
      
      this.workItemOverride = wiConfigInfo.workItemOverride;
      this.workItemEnabled = wiConfigInfo.workItemEnabled;
      this.escalationStyle = wiConfigInfo.escalationStyle;
      
      this.daysTillReminder = wiConfigInfo.daysTillReminder;
      this.daysBetweenReminders = wiConfigInfo.daysBetweenReminders;
      
      this.maxReminders = wiConfigInfo.maxReminders;
      this.daysTillEscalation = wiConfigInfo.daysTillEscalation;
      this.escalationRule = wiConfigInfo.escalationRule;
      
      this.notificationEmail = wiConfigInfo.notificationEmail;
      this.reminderEmail = wiConfigInfo.reminderEmail;
      this.escalationEmail = wiConfigInfo.escalationEmail;
      
      this.ownersData = JSON.parse(wiConfigInfo.ownersData);
      this.ownerIds = wiConfigInfo.ownerIds;
      
      this.electronicSignature = wiConfigInfo.electronicSignature;
    }
  }
};

////////////////////////////////////////////////////////////////////////////////
//
// A javascript representation of the SailPoint.object.Form object
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.WorkflowForm = Class.create();
SailPoint.WorkflowForm.prototype = {

  id: null,
  name: null,
  formRefId: null,
  sendVal: null,
  returnVal: null,
  description: null,
  fields: [],
  ownerMethod: null,
  ownerSource: null,
  ownerExplicitMethod: null,
  fieldsJSON: '',
  
  /**
   * Constructor.
   * 
   * @param  wfInfo  The raw JSON workflow mapping information object.
   */
  initialize: function(formConfig) {
    if(formConfig) {
      this.id = formConfig.id;
      this.formRefId = formConfig.formRefId;
      this.name = formConfig.name;
      this.description = formConfig.description;
      this.sendVal = formConfig.sendVal;
      this.returnVal = formConfig.returnVal;
      this.fields = formConfig.fields;
      this.ownerMethod = formConfig.ownerMethod;
      this.ownerSource = formConfig.ownerSource;
      this.ownerExplicitMethod = formConfig.ownerExplicitMethod;
      //this.fields = Ext.util.JSON.decode(this.fieldsJSON);
      //console.debug(this.fieldsJSON);
    }
  }
};


////////////////////////////////////////////////////////////////////////////////
//
// A javascript representation of each element in a Workflow's RuleLibrary 
// list
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.RuleLibrary = Class.create();
SailPoint.RuleLibrary.prototype = {
  id: null,
  name: null,

  /**
   * Constructor.
   * 
   * @param  ruleLibraryConfig  The raw JSON ruel library json object map
   */
  initialize: function(libInfo) {
    if(libInfo) {
      this.id = libInfo.id;      
      this.name = libInfo.name;
    }
  }
};


////////////////////////////////////////////////////////////////////////////////
//
// A javascript representation of a SailPoint.object.Workflow.Return
// object
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.WorkflowStepReturn = Class.create();
SailPoint.WorkflowStepReturn.prototype = {

  to: null,
  name: null,
  merge: false,
  local: false,
  
  valueMethod: null,
  valueSource: null,
  valueExplicitMethod: null,

  /**
   * Constructor.
   * 
   * @param  returnConfig  The raw JSON object map representing a Return
   */
  initialize: function(returnInfo) {
    if(returnInfo) {
      //console.debug("returnConfig" + returnConfig.to + " name " + returnConfig.name);
      this.to = returnInfo.to;      
      this.name = returnInfo.name;
      this.merge = returnInfo.merge;
      this.local = returnInfo.local;
      this.valueSource = returnInfo.valueSource;
      
      this.valueMethod = returnInfo.valueMethod;
      this.valueSource = returnInfo.valueSource;
      this.valueExplicitMethod = returnInfo.valueExplicitMethod;
    } 
  }
};
