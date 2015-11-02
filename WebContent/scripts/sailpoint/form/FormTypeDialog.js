/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This is the dialog we generate when a user choose to
 * create/edit a form.
 */
Ext.define('SailPoint.form.FormTypeDialog', {
    extend : 'Ext.Window',

    id: 'formTypeDialog',

    formId: null,

    callbackFunction : null,

    modal: true,

    statics : {
        show : function(formId, callback) {
            Ext.create("SailPoint.form.FormTypeDialog", {
                formId : formId,
                callbackFunction : callback
            }).show();
        }
    },

    constructor : function(config) {
        var me = this;

        Ext.apply(this, {
            buttons : [
                {
                    text:"#{msgs.form_create_dialog_button_cancel}",
                    cls : 'secondaryBtn',
                    handler: function() {
                        me.close();
                    }
                },
                {
                    text:"#{msgs.form_create_dialog_button_next}",
                    handler: function() {
                        // Get selected form type
                        // Get the height of the element available to lay content out in so that
                        // window created afterwards will have a default value of height-50
                        var formTypeCombo = Ext.getCmp("createformTypeCombo"),
                            formType = formTypeCombo.getValue();
                            height = Ext.getBody().getViewSize().height-50;
                        if (!formType) {
                            formTypeCombo.markInvalid("#{msgs.invalid_form_type}");
                        } else {
                            if(Ext.isFunction(me.callbackFunction)) {
                                me.callbackFunction(me.formId, formType, height);
                            }
                            me.close();
                        }
                    }
                }
            ]
        });
        this.callParent(arguments);
    },

    initComponent:function() {
        var me = this,
            title = !me.formId ? "#{msgs.form_create_dialog_title}" : "#{msgs.form_edit_dialog_title}";
        this.setTitle(title);
        this.setHeight(175);
        this.setWidth(327);

        var formTypeStore = SailPoint.Store.createRestStore({
            url : SailPoint.getRelativeUrl('/rest/form/formTypes'),
            root: 'objects',
            fields: ['name','value']
        });

        this.form = Ext.create("Ext.form.Panel", {
            style:'padding:15px;background-color:#fff' ,
            border:false,
            bodyBorder:false,
            items:[
                {
                    xtype : 'label',
                    margin: "25 10 25 5",
                    name : 'selectTypeLabel',
                    text : !me.formId ? "#{msgs.form_create_dialog_select_type_label}" : "#{msgs.form_edit_dialog_select_type_label}",
                },
                {
                    xtype : 'combo',
                    id: 'createformTypeCombo',
                    margin: "8 10 25 5",
                    allowBlank: false,
                    forceSelection: true,
                    editable:false,
                    store: formTypeStore,
                    valueField: 'value',
                    displayField: 'name',
                    width: 260,
                    emptyText: '#{msgs.form_create_dialog_select_type}'
                }]
        });

        this.items = [
            this.form
        ];

        this.callParent(arguments);
    }
});

