/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.template.RestfulTemplateEditorWindow', {
    extend : 'SailPoint.template.TemplateEditorWindow',

    closeAction: 'destroy',

    createTemplateEditor : function() {
        this.templateEditor = new SailPoint.template.RestfulTemplateEditor({
            id : 'restfulTemplateEditor',
            beanType : this.beanType,
            formId : this.formId,
            usage: this.usage,
            window : this
        });
    },

    exit: function() {
        this.close();
    }
});

Ext.define('SailPoint.template.RestfulTemplateEditor', {
    extend : 'SailPoint.template.TemplateEditor',

    formId: null,

    initComponent: function() {
        this.callParent(arguments);
    },

    // Override parent(TemplateEditor) here to send JSON to restful endpoint
    submitChanges: function() {
        var me = this,
            isSaveSuccess = false,
            templateJSON = {
                name: this.templateName.getValue(),
                description: this.templateDescription.getValue(),
                owner: this.templateOwnerSource,
                ownerType: this.templateOwnerMethod,
                formType: this.beanType,
                application: (this.requireApplication) ? this.applicationSuggest.getValue() : null,
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

                         this.getApplication(form);
                         this.loadOwnerField(form);
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
        } else {
            this.getApplication();
        }
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
    },

    getApplication: function(form) {
        var me = this;
        if(this.requireApplication) {
            var appId = "",
                appName = "";

            if (form) {
                appId = form.appId;
                appName = form.appName;
            } 

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

    // Override parent(TemplateEditor).
    loadOwnerField : function(form) {
        var ownerType = form.ownerType;
        var owner = form.owner;
        this.setOwnerType(ownerType, owner);
    }
});
