Ext.ns('SailPoint.define.applications');
/**
 * Model used to edit AttributeDefintion attributes
 */
Ext.define('SchemaAttributeDefinition', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'schemaObjectType', type: 'string'},
        {name: 'uid', type: 'string'},
        {name: 'name', type: 'string'},
        {name: 'managed', type: 'boolean'},
        {name: 'entitlement', type: 'boolean'},
        {name: 'multiValued', type: 'boolean'},
        {name: 'correlationKeyAssigned', type: 'boolean'},
        {name: 'minable', type: 'boolean'},
        {name: 'remediationModificationType', type: 'string'}
    ]
});

/**
 * Model used to set Instance/Display/Identity attributes on the schemas
 * schemaProperty should be: INSTANCE, DISPLAY, IDENTITY
 */
Ext.define('SchemaProperty', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'schemaObjectType', type: 'string'},
        {name: 'uid', type: 'string'},
        {name: 'schemaProperty', type: 'string'}
    ]
});

/**
 * Creates an Attribute Definition Schema object and uses it to populate a popup window
 * @param config config object used to construct the model
 *
 */
SailPoint.define.applications.createAttributeDefinitionSchema = function(config){
    var ads = Ext.create('SchemaAttributeDefinition', config);

    var windowId = 'attributeDefinitionSchema-' + ads.get('schemaObjectType');

    var formPanel = Ext.create('Ext.form.Panel', {
        id: 'attDefForm',
        xtype: 'form',
        border: false,
        bodyBorder: false,
        defaults: {
            padding: '5'
        },
        layout: {
            type: 'table',
            columns: 3
        },
        items:SailPoint.define.applications.getFormItems(ads.get('schemaObjectType'))
    });

    formPanel.loadRecord(ads);

    Ext.create('Ext.window.Window', {
        id: windowId,
        title: SailPoint.define.applications.computeWindowTitle(ads.get('name')),
        minHeight: 200,
        minWidth: 500,
        modal: true,
        resizable: false,
        border: false,
        bodyBorder: false,
        items: [
            formPanel
        ],
        bbar: [
            {
                xtype: 'button',
                text: '#{msgs.button_save}',
                cls : 'primaryBtn',
                margin: '0 0 0 5',
                handler: function() {
                    var f = Ext.getCmp('attDefForm').getForm();
                    $('editForm:attributeDefinitionJSON').value = Ext.JSON.encode(f.getFieldValues());
                    $('editForm:attributeDefinitionUpdateBtn').click();
                    Ext.getCmp(windowId).destroy();

                }
            },
            {
                xtype: 'button',
                text: '#{msgs.button_cancel}',
                cls : 'secondaryBtn',
                margin: '0 0 0 5',
                handler: function() {
                    Ext.getCmp(windowId).destroy();
                }
            }
        ],
        listeners : {
            show: function(me, opt){
                me.updateLayout();
                me.center();
            }
        }
    }).show();

};

SailPoint.define.applications.computeWindowTitle = function(attributeName) {
    //Might be better to use a message catalog key {0} Advanced Properties and use str replace to
    //set the {0} with attr Name
    if(!Ext.isEmpty(attributeName)) {
        return attributeName + ' - #{msgs.attr_def_schema_popup_title}';
    } else {
        return '#{msgs.attr_def_schema_popup_title}';
    }
};

SailPoint.define.applications.getFormItems = function(schemaObjectType) {
    // data store for the remediation type
    var typeStore = SailPoint.Store.createStore({
        autoLoad : true,
        fields: ['label', 'value'],
        url : CONTEXT_PATH + '/define/groups/attributeSchemaDataSource.json',
        pageSize : 20,
        remoteSort : true
    });
    var formConfig = [];
    if (Ext.isDefined(schemaObjectType)) {

        if (schemaObjectType === 'account') {

            formConfig.push({
                xtype: 'checkbox',
                boxLabel: '#{msgs.attr_managed}',
                name: 'managed',
                itemId: 'managed'
            });
        } else {
            formConfig.push({
                xtype: 'checkbox',
                boxLabel: '#{msgs.entitlement}',
                name: 'entitlement',
                itemId: 'entitlement'
            });
        }
        formConfig.push({
                xtype: 'checkbox',
                boxLabel: '#{msgs.attr_correlation_key}',
                name: 'correlationKeyAssigned',
                itemId: 'correlationKeyAssigned'
            },
            {
                rowspan: 3,
                cellCls: 'top',
                xtype: 'combobox',
                store: typeStore,
                name: 'remediationModificationType',
                fieldLabel: '#{msgs.attr_remedidation_modification_type}',
                displayField: 'label',
                valueField: 'value',
                labelAlign: 'top',
                disabled: false
        });

        if (schemaObjectType === 'account') {

            formConfig.push({
                xtype: 'checkbox',
                boxLabel: '#{msgs.entitlement}',
                name: 'entitlement',
                itemId: 'entitlement'
            });
        } else {
            formConfig.push({
                xtype: 'checkbox',
                boxLabel: '#{msgs.attr_multi_valued}',
                name: 'multiValued',
                itemId: 'multiValued'
            });
        }

        formConfig.push({
            xtype: 'checkbox',
            boxLabel: '#{msgs.attr_minable}',
            name: 'minable',
            itemId: 'minable'
        });

        if (schemaObjectType === 'account') {
            formConfig.push({
                colspan: 3,
                xtype: 'checkbox',
                boxLabel: '#{msgs.attr_multi_valued}',
                name: 'multiValued',
                itemId: 'multiValued'
            });
        }

        formConfig.push({
                colspan: 3,
                xtype: 'label',
                id: 'schemaUpdateMsg',
                cls: 'formInfo',
                style: {
                    'padding-right': '20px !important',
                    'padding-left': '35px !important'
                },
                hidden: true,
                autoRender: true
            },
            {
                colspan: 3,
                xtype: 'container',
                layout: 'hbox',
                defaults: {
                    margin: '0 5 0 0'
                },
                items: [
                    {
                        xtype: 'button',
                        cls: 'secondaryBtn',
                        text: '#{msgs.attr_def_schema_popup_button_set_id_attr}',
                        handler: function() {
                            SailPoint.define.applications.setSchemaProperty('IDENTITY');
                        }
                    },
                    {
                        xtype: 'button',
                        cls: 'secondaryBtn',
                        text: '#{msgs.attr_def_schema_popup_button_set_display_attr}',
                        handler: function() {
                            SailPoint.define.applications.setSchemaProperty('DISPLAY');
                        }
                    },
                    {
                        xtype: 'button',
                        cls: 'secondaryBtn',
                        text: '#{msgs.attr_def_schema_popup_button_set_instance_attr}',
                        handler: function() {
                            SailPoint.define.applications.setSchemaProperty('INSTANCE');
                        }
                    }
                ]
            },
            {
                xtype: 'hiddenfield',
                name: 'schemaObjectType'
            },
            {
                xtype: 'hiddenfield',
                name: 'uid'
            },
            {
                xtype: 'hiddenfield',
                id: 'schemaUpdateProperty',
                submitValue: false
            });

    }

    return formConfig;
};

SailPoint.define.applications.setSchemaProperty = function(property) {
    var f = Ext.getCmp('attDefForm').getForm();
    var schemaObjType = f.findField('schemaObjectType').getValue();
    var attrUid = f.findField('uid').getValue();
    var model = Ext.create('SchemaProperty', {
        schemaObjectType: schemaObjType,
        uid: attrUid,
        schemaProperty: property
    });
    Ext.getCmp('schemaUpdateProperty').setValue(property);
    $('editForm:schemaPropertyJSON').value = Ext.JSON.encode(model.getData());
    $('editForm:schemaPropertyUpdateBtn').click();
};

/**
 * Called from schemaPropertyUpdateBtn onComplete to show a success message
 */
SailPoint.define.applications.updatePropertyMsg = function() {
    var prop = Ext.getCmp('schemaUpdateProperty').getValue();
    if(Ext.isDefined(prop)) {
        if(prop === 'IDENTITY') {
            var updateMsg = Ext.getCmp('schemaUpdateMsg')
            updateMsg.setText('#{msgs.attr_def_schema_popup_identity_set}');
            updateMsg.show();
            Ext.getCmp('attDefForm').doComponentLayout();
        } else if (prop === 'DISPLAY') {
            var updateMsg = Ext.getCmp('schemaUpdateMsg')
            updateMsg.setText('#{msgs.attr_def_schema_popup_display_set}');
            updateMsg.show();
            Ext.getCmp('attDefForm').doComponentLayout();
        } else if (prop === 'INSTANCE') {
            var updateMsg = Ext.getCmp('schemaUpdateMsg')
            updateMsg.setText('#{msgs.attr_def_schema_popup_instance_set}');
            updateMsg.show();
            Ext.getCmp('attDefForm').doComponentLayout();
        }
    }
};