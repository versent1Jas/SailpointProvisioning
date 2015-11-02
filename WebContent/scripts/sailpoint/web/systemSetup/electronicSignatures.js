Ext.define('MeaningModel', {
    extend: 'Ext.data.Model',

    fields: [
        { name: 'name', type: 'string' },
        { name: 'displayName', type: 'string' },
        { name: 'meanings', type: 'auto' }
    ],

    getName: function() {
        return this.get('name');
    },

    getDisplayName: function() {
        return this.get('displayName');
    },

    getMeanings: function() {
        return this.get('meanings');
    }
    
});

// name is original name.
// obj will be mapped to a ESignatureType object
// and contains the 'new' name (if it changed).
function editCallback(name, obj) {
    var isUpdate = false;
    if(name) {
        // this is an edit, post to /update/{name}
        isUpdate = true;
    }
    handleRequest(isUpdate, name, obj);
}

function handleRequest(isUpdate, name, obj) {
    var params = {
        name : name,
        json : Ext.JSON.encode(obj)
    };
    var url = "";
    if(isUpdate) {
        url = "/" + SailPoint.Utils.encodeRestUriComponent(name);
    }

    var me = this;

    Ext.Ajax.request({
        url: SailPoint.getRelativeUrl('/rest/electronicSignatures/meanings' + url),
        method: isUpdate ? 'PUT' : 'POST',
        params : params,
        success: function(response) {
            var r = Ext.JSON.decode(response.responseText);
            var em = Ext.get('errorMessages');
            em.setVisibilityMode(Ext.Element.DISPLAY);
            if(r.errors) {
                em.dom.innerHTML = "#{msgs.esig_edit_error} " + r.errors;
                em.setVisible(true);
            }
            else {
                em.innerHTML = "";
                em.setVisible(false);
            }
            
            //refresh grid
            me.meaningsStore.load();
            
        },
        failure: function(response) {
            // uh oh.
        }
    });
}

function handleSigEdit(view, record, item, index, e, eOpts) {
    if(record) {
        SailPoint.ESigEditor.show(false, editCallback, record.getName(), record.getDisplayName(), record.getMeanings());
    }
    else {
        SailPoint.ESigEditor.show(true, editCallback);
    }
}

function handleSigComboBoxChange(xstore, value) {
    var meaningText = '#{help.help_system_config_electronic_signature_meaning}';
    var selectedRecord = xstore.findRecord('name', value, 0, false, false, true);

    if (selectedRecord) {
        var meanings = selectedRecord.get('meanings');
        meaningText = SailPoint.grid.Util.renderESigMeaning(meanings);
    }
      
    Ext.getCmp('electronicSignatureMeaningExt').update(meaningText);
}

function initMeaningsComboBox(value, isDisabled, isReadOnly, eSigHiddenElementId) {

    meaningsStore = SailPoint.Store.createStore({
        model : 'MeaningModel',
        url : SailPoint.getRelativeUrl('/rest/electronicSignatures/meanings'),
        autoLoad : true,
        root : 'objects',
        listeners : {
            load: function(xstore, records, success, options) {
                // insert the default select option
                xstore.insert(0, { name : '',displayName: '#{msgs.esig_select_esig}' });
                var cmp = Ext.getCmp('electronicSignatureExt');
                if (cmp && cmp.value === '') {
                    cmp.select(this.data.items[0]);
                }

                handleSigComboBoxChange(xstore, cmp.value);
            }
        }
    });
    
    Ext.create('Ext.Img', {
        id: 'electronicSignatureMeaningImgExt',
        src: SailPoint.getRelativeUrl('/images/icons/dashboard_help_16.png'),
        style: {
            width: '12px',
            height: '12px',
            cursor: 'pointer',
            padding: '0px 7px 0px 7px'
        },
        renderTo: 'imgHlpESigComboBox'
    });
    
    Ext.create('Ext.tip.ToolTip', {
        id: 'electronicSignatureMeaningExt',
        target: 'electronicSignatureMeaningImgExt', 
        html: '#{help.help_system_config_electronic_signature_meaning}'
    });
    
    Ext.create('SailPoint.form.ComboBox', {
        store: meaningsStore,
        id: 'electronicSignatureExt',
        displayField: 'displayName',
        valueField: 'name',
        value: value,
        disabled: isDisabled,
        readOnly: isReadOnly,
        renderTo: 'eSigComboBox',
        width: 250,
        listeners: {
             select: {
                 fn: function() {
                       var newValue = Ext.getCmp('electronicSignatureExt').value;
                       document.getElementById( eSigHiddenElementId ).value = newValue;
                 }
             },
             change: {
                 fn: function() {
                     handleSigComboBoxChange(this.getStore(), this.value);
                 }
             }
        }
    
    });
    
}

function initMeaningsGrid()
{
    meaningsStore = SailPoint.Store.createStore({
        model : 'MeaningModel',
        url : SailPoint.getRelativeUrl('/rest/electronicSignatures/meanings'),
        autoLoad : true,
        root : 'objects'
    });

    var meaningsGrid = Ext.create('Ext.grid.Panel', {
        id: 'meaningsGrid',
        renderTo: 'meanings',
        store: meaningsStore,
        emptyText: '#{msgs.e_sig_config_no_meanings_configured}',
        columns: [
            { text: '#{msgs.name}', dataIndex: 'displayName', flex: 1, hideable: false, sortable: true },
            { text: '#{msgs.meaning}', dataIndex: 'meanings', flex: 4, hideable: false, sortable: false, renderer: SailPoint.grid.Util.renderESigMeaning }
        ],
        tbar: [
            {
                xtype: 'button',
                text: '#{msgs.e_sig_config_new_meaning}',
                handler: function() {
                    handleSigEdit();
                }
            }
        ],
        listeners: {
            itemclick : function(view, record, item, index, e, eOpts) {
                e.stopEvent();
                handleSigEdit(view, record, item, index, e, eOpts);
            },
            itemcontextmenu : function(view, record, item, index, e, eOpts) {
                e.stopEvent();

                Ext.create('Ext.menu.Menu', {
                    items: [
                        {
                            xtype: 'menuitem',
                            text: '#{msgs.edit}',
                            iconCls: 'editBtn',
                            handler: function() {
                                handleSigEdit(view, record, item, index, e, eOpts);
                            }
                        },
                        {
                            xtype: 'menuitem',
                            text: '#{msgs.delete}',
                            iconCls: 'deleteBtn',
                            handler: function() {
                                Ext.Msg.show({
                                    title: Ext.String.format('#{msgs.conf_delete_win_title}', record.getDisplayName()),
                                    msg: Ext.String.format('#{msgs.conf_delete_win_text}', record.getDisplayName()),
                                    buttons: Ext.Msg.YESNO,
                                    icon: Ext.Msg.QUESTION,
                                    fn: function(buttonId, text, opt) {
                                        if ('yes' === buttonId) {
                                            Ext.Ajax.request({
                                                url: SailPoint.getRelativeUrl('/rest/electronicSignatures/meanings/' +
                                                    SailPoint.Utils.encodeRestUriComponent(record.getName())),
                                                method: 'DELETE',
                                                success: function(response, opts) {
                                                    var responseObj = Ext.JSON.decode(response.responseText);
                                                    if (responseObj.success === true) {
                                                        meaningsStore.load();
                                                    } else {
                                                        Ext.Msg.show({
                                                            title: '#{msgs.err_dialog_title}',
                                                            msg: '#{msgs.err_fatal_system}',
                                                            icon: Ext.Msg.ERROR,
                                                            buttons: Ext.Msg.OK
                                                        });
                                                    }
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    ]
                }).showAt(e.getXY());
            }
        }
    });
}
