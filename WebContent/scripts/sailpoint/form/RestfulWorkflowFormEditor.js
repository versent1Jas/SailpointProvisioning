Ext.define('SailPoint.form.RestfulWorkflowFormEditorWindow', {
    extend : 'SailPoint.template.TemplateEditorWindow',

    closeAction: 'destroy',

    createTemplateEditor : function() {
        this.templateEditor = new SailPoint.form.RestfulWorkflowFormEditor({
            id : 'restfulWorkflowFormEditor',
            beanType : this.beanType,
            standalone : true,
            formId : this.formId,
            window: this
        });
    },

    exit: function() {
        this.close();
    }
});

/**
 * Overrides some of the template field editor component to get the workflow
 * form editor that work within the confines of the centralize 'form'
 */
Ext.define('SailPoint.form.RestfulWorkflowFormEditor', {
    extend : 'SailPoint.WorkflowFormEditor',

    initComponent: function() {
        this.callParent(arguments);
    },

    // Overrides parent(WorkflowFormEditor) here to send JSON to restful endpoint
    submitChanges : function() {
        var me = this,
        isSaveSuccess = false,
        templateJSON = {
            name: this.templateName.getValue(),
            description: this.templateDescription.getValue(),
            formType: this.beanType,
            fields: this.fieldArray
        },
        url = "",
        params = {
            json: Ext.JSON.encode(templateJSON)
        };

        // Create params and url for Edit Form
        if (this.formId) {
            url = "/" + SailPoint.Utils.encodeRestUriComponent(this.formId);
            params['formId'] = this.formId;
        }

        Ext.Ajax.request({
            url: SailPoint.getRelativeUrl('/rest/form' + url),
            method: !this.formId ? 'POST' : 'PUT',
            params: params,
            success: function(response) {
                var res = Ext.JSON.decode(response.responseText);
                if(res.errors) {
                    // if error occurred show the errors on status bar
                    me.statusBar.setStatus({
                        text: "#{msgs.form_save_error} " + res.errors,
                        iconCls: me.errorIconCls,
                        clear: {
                            wait: 7000,
                            anim: true,
                            useDefaults: false
                        }
                    });
                } else {
                    // if success close the window
                    me.window.destroy();
                    // Reload the Grid here
                    var formGrid = Ext.getCmp('formGrid');
                    formGrid.getStore().load();
                    isSaveSuccess = true;
                }
            },
            failure: function(response) {
                SailPoint.FATAL_ERR_ALERT.call(this);
            }
        });
        return isSaveSuccess;
    },

    save : function() {
        if(this.validate() && this.fieldForm.validate()) {
            this.saveChanges();
            return this.submitChanges();
        }
        return false;
    },

    // Overrides parent(WorkflowFormEditor).
    load : function() {
        if (this.formId) {
            var url = "/" + SailPoint.Utils.encodeRestUriComponent(this.formId);
            Ext.Ajax.request({
                scope: this,
                url: SailPoint.getRelativeUrl('/rest/form' + url),
                method: 'GET',
                params: {formId:this.formId},
                success: function(result, response) {
                     var res = Ext.JSON.decode(result.responseText),
                         formData = JSON.parse(res);

                     if (formData.isAvailable) {
                         var form = formData.form[0];
                         this.fieldStore.loadRawData(this.getFieldData(form));
                         this.fieldForm.clear();

                         this.templateName.setValue(form.name);
                         this.templateDescription.setValue(form.description);
                         this.templateName.clearInvalid();
                     } else {
                         this.window.destroy();
                         Ext.MessageBox.show({
                             title:'#{msgs.err_dialog_title}',
                             msg: '#{msgs.form_display_error}',
                             buttons: Ext.MessageBox.OK,
                             icon: Ext.MessageBox.ERROR
                         });
                     }
                },
                failure: function(result, response) {
                    SailPoint.FATAL_ERR_ALERT.call(this);
                }
            });
        }

        // don't show 'Application' field on workflow form
        this.applicationSuggest.hide();
        this.detailsPanel.setHeight(150);
    },

    // Override parent(TemplateEditor) to avoid call to parents method
    getFieldData : function(form) {
        if (form && form.fields && form.fields.length) {
            this.fieldData.totalCount = form.fields.length;
            this.fieldData.objects = form.fields;
        } else {
            this.fieldData.totalCount = 0;
            this.fieldData.objects = new Array(0);
        }
        return this.fieldData;
    }
});

// Renders field help text into the form.
Ext.override(Ext.form.Field, {
    afterRender : function() {
        SailPoint.form.Util.renderHelpText(this);
        Ext.form.Field.superclass.afterRender.call(this);
        this.initValue();
    }
});

