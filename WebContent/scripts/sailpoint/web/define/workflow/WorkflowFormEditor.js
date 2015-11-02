Ext.define('SailPoint.WorkflowFormEditorWindow', {
    extend : 'SailPoint.template.TemplateEditorWindow',

    // Window should be destroyed on close.
    closeAction: 'destroy',
    exit: function() {
        this.close();
    },

    createTemplateEditor : function() {
        this.templateEditor = new SailPoint.WorkflowFormEditor({
            id : 'templateEditor',
            beanType : this.beanType,
            standalone : false,
            window : this
        });
    }
});

/**
 * Overrides some of the template field editor component to get the provisioning
 * policy editor to work within the confines of the workflow editor
 */
Ext.define('SailPoint.WorkflowFormEditor', {
    extend : 'SailPoint.template.TemplateEditor',

    stepObj : null,

    fieldFormPanelTitle : '#{msgs.form_editor_edit_fields}',

    stepId : null,

    buttonForm : null,

    hideOwner : true,

    ownerRadio : null,

    detailsHeight : 300,

    initComponent : function() {

        if (!this.standalone) {
            // Referenceables variables resolves like this -
            // window - Class=SailPoint.WorkflowFormEditorWindow id=templateEditorWindow
            //   panel - Class=SailPoint.WorkflowStepPanel id=workflowDesigner
            //     parent - Class=SailPoint.WorkflowDesigner id=workflowTabbedPanel
            //       editor - Class=SailPoint.WorkflowEditor id=workflowPanel
            this.approvalPanel = new Sailpoint.component.ApprovalPanel({referenceables:
                this.window.panel.parent.editor.workflow.variables});
        }

        var addButton = new Ext.Button({
            text : "#{msgs.template_editor_add_button}",
            hideParent : true,
            editor : this
        });
        addButton.on('click', this.addButton, this);

        this.buttonForm = new SailPoint.template.TemplateButtonEditor({
            id : 'buttonForm',
            editor : this,
            autoScroll : true
        });

        this.callParent(arguments);

        if (this.approvalPanel) {
            this.detailsPanel.add(this.approvalPanel.formSend);
            this.detailsPanel.add(this.approvalPanel.formReturn);
            this.detailsPanel.add(this.approvalPanel.ownerRadio);
        }
    },

    setStep : function(step) {
        this.stepObj = step;
    },

    setStepId : function(stepId) {
        this.stepId = stepId;
    },

    submitChanges : function() {
        this.stepObj.form.name = this.templateName.getValue();
        this.stepObj.form.description = this.templateDescription.getValue();
        this.stepObj.form.fields = this.fieldArray;

        this.saveOwnerField();

        if (this.approvalPanel) {
            this.stepObj.form.sendVal = this.approvalPanel.formSend.getValue();
            this.stepObj.form.returnVal = this.approvalPanel.formReturn.getValue();
            this.stepObj.form.ownerMethod = this.approvalPanel.ownerRadio.getMethod();
            this.stepObj.form.ownerSource = this.approvalPanel.ownerRadio.getSource();
        }

        // Remove the FormRef for an embedded form
        this.stepObj.form.formRefId = null;

        this.window.panel.parent.editor.workflow.markDirty();
        this.window.hide();
    },

    getFieldData : function() {
        if (this.stepObj && this.stepObj.form && this.stepObj.form.fields) {
            this.fieldData.totalCount = this.stepObj.form.fields.length;
            this.fieldData.objects = this.stepObj.form.fields;
        }
        return this.fieldData;
    },

    editField : function(record) {
        if (record.get('type') == 'button') {
            this.buttonForm.load(record);
        } else {
            this.fieldForm.load(record);
        }
    },

    load : function() {
        this.fieldStore.loadRawData(this.getFieldData());
        this.fieldForm.clear();
        if (this.stepObj) {
            this.templateName.setValue(this.stepObj.form.name);
            this.templateDescription.setValue(this.stepObj.form.description);
            if (this.approvalPanel) {
                this.approvalPanel.formSend.setValue(this.stepObj.form.sendVal);
                this.approvalPanel.formReturn.setValue(this.stepObj.form.returnVal);
                this.approvalPanel.ownerRadio.load(this.stepObj.form.ownerMethod,
                        this.stepObj.form.ownerSource);
            }
        }
        this.templateName.clearInvalid();
    },

    getToolbar : function() {
        toolbar = this.callParent(arguments);
        var addButtonBtn = new Ext.Button({
            text : "#{msgs.template_editor_add_button}",
            hideParent : true,
            editor : this
        });

        addButtonBtn.on('click', this.addButton, this);
        toolbar.add(addButtonBtn);

        return toolbar;
    },

    getFieldFormItems : function() {
        var items = this.callParent(arguments);
        items.push(this.buttonForm);
        return items;
    },

    addButton : function() {
        this.fieldGrid.deselectAll();
        this.buttonForm.newField();
    }
});