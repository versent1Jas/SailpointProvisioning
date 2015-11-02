/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */

var formStore = SailPoint.Store.createStore({
    fields: ['id','name', 'type', 'description'],
    url : SailPoint.getRelativeUrl('/rest/forms'),
    autoLoad : false,
    totalProperty : 'count',
    pageSize: 10,
    root : 'objects',
    remoteSort: true,
    sorters: [{
        property: 'name',
        direction: 'ASC'
    }]
});

Ext.define('SailPoint.grid.FormGrid', {
    extend : 'SailPoint.grid.PagingGrid',
    alias : 'widget.formgrid',
    isRef : true,
    statics : {
        editForm : function(formId, formType) {
            var height = Ext.getBody().getViewSize().height-50;
            // Check the form type. If form type is not null then simply open the form in relevant (based on form type) editor.
            if ('null' != formType) {
                SailPoint.grid.FormGrid.showFormWindowCallBack(formId, formType, height);
            }
            // If it is null then create a new form type selection dialogue.
            else {
                SailPoint.form.FormTypeDialog.show(formId, SailPoint.grid.FormGrid.showFormWindowCallBack);
            }
        },
        selectForm : function(formId,  formName, formDescription) {
            var formsWindow = Ext.getCmp('formsWindow');
            var type = formsWindow.formType;
            if ('Application' === type || 'Role' === type) {
                $('editForm:templateFormRefId').value =  formId;
                $('editForm:templateFormRefName').value= formName;
                $('editForm:templateAddFormRefBtn').click();
            } else if ('Workflow' === type) {
                // Pass approval fields along with referenced form
                var approvalPanelItem = Ext.getCmp('approvalPanelItem'),
                sendVal = approvalPanelItem.formSend.getValue(),
                returnVal = approvalPanelItem.formReturn.getValue(),
                ownerRadio = approvalPanelItem.ownerRadio;
                formsWindow.stepComponent.addFormReference(sendVal, returnVal, ownerRadio,
                        formId, formName, formDescription);
            }
            formsWindow.close();
        },
        //callback function to show form editor window based on Form Type selected
        showFormWindowCallBack : function(formId, formType, height) {
            switch (formType) {
            case ('Application'):
                this.appFormWindow = Ext.create('SailPoint.template.RestfulTemplateEditorWindow', {
                                         beanType: formType.toLowerCase(),
                                         height: height,
                                         formId: formId,
                                         usage: '#{msgs.form_field_standalone}',  // this is passed as a dummy flag to show Review Require checkbox in Form Editor Fields
                                         title: '#{msgs.application_form_editor_title}'
                                     });
                this.appFormWindow.show();
                break;

            case ('Role'):
                this.roleFormWindow = Ext.create('SailPoint.template.RestfulTemplateEditorWindow', {
                                          beanType: formType.toLowerCase(),
                                          height: height,
                                          formId: formId,
                                          usage: '#{msgs.form_field_standalone}',  // this is passed as a dummy flag to show Review Require checkbox in Form Editor Fields
                                          title: '#{msgs.role_form_editor_title}'
                                      });
                this.roleFormWindow.show();
                break;

            case ('Workflow'):
                this.workflowFormWindow = Ext.create('SailPoint.form.RestfulWorkflowFormEditorWindow', {
                                              beanType: formType.toLowerCase(),
                                              height: height,
                                              formId: formId,
                                              title: "#{msgs.workflow_form_editor_title}"
                                          });
                this.workflowFormWindow.show();
                break;
            }
        }
    },
    columns: [{id: 'selectCol', flex:1.5, hideable:false, renderer: function(value, metaData, record, rowIndex, colIndex, store){
                                    return '<button type="button" class="secondaryBtn" id="" onClick="SailPoint.grid.FormGrid.selectForm(\'' + record.get('id') +
                                    '\', \'' + record.get('name') + '\',\'' + record.get('description') + '\')">#{msgs.select}</button>';
                                 }
              },
              {header: '#{msgs.reference_form_column_id}', flex: 4, dataIndex: 'id', sortable: true, hidden:true, hideable:false},
              {header: '#{msgs.reference_form_column_name}', flex: 4, dataIndex: 'name', sortable: true},
              {header: '#{msgs.type}', flex: 2, dataIndex: 'type',sortable: true},
              {header: '#{msgs.description}', flex: 6, dataIndex: 'description'},
              {id: 'editCol', flex: 1.5, hideable:false, renderer: function(value, metaData, record, rowIndex, colIndex, store){
                  return '<a onclick="SailPoint.grid.FormGrid.editForm(\'' + record.get('id') + '\', \'' + record.get('type')
                                          + '\');" class="attributeEdit">#{msgs.edit}</a>';
              }}
              ],
    store: formStore,
    pageSize: 10,
    tbar: [{
        xtype: 'button',
        id: 'createFormBtn',
        cls: 'primaryBtn',
        text: '#{msgs.form_create_button}',
        handler: function() {
            // pass formId as null for create form.  
            SailPoint.form.FormTypeDialog.show(null, SailPoint.grid.FormGrid.showFormWindowCallBack);
        }},
        {
        xtype: 'tbspacer',
        id: 'tbarSpace'
        },
        {
        xtype: 'searchfield',
        width: 500,
        store: formStore,
        paramName: 'name',
        emptyText: '#{msgs.reference_form_popup_search_empty_text}'
        }
    ],

    constructor : function(config) {
        Ext.apply(this, config);
        this.callParent(arguments);
        this.store.proxy.extraParams = config.filters;
        this.store.load();
        this.hideColumnByType();
    },
    initComponent : function() {
        this.callParent(arguments);
    },

    hideColumnByType: function() {
        if(this.isRef) {
            Ext.getCmp('createFormBtn').setVisible(false);
            Ext.getCmp('tbarSpace').setVisible(false);
            Ext.getCmp('editCol').setVisible(false);
        }
        else {
            Ext.getCmp('selectCol').setVisible(false);
        }
    }

});