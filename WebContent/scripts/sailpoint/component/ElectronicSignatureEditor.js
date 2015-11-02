Ext.define('SailPoint.ESigEditor', {
    extend : 'Ext.Window',
    alias : 'widget.esigeditor',

    callbackFunction : null,

    modal : true,

    meaningList : [],

    originalName : null,

    statics : {

        show : function(isNew, callback, name, displayName, meaningObj) {

            Ext.create("SailPoint.ESigEditor", {
                name : name,
                displayName : displayName,
                meaningObj : meaningObj,
                isNew : isNew,
                callbackFunction : callback
            }).show();

        }
    },

    initComponent : function() {

        var me = this;

        this.convertMeaninObj(this.meaningObj);

        this.originalName = this.name;

        Ext.apply(me, {
            title : me.isNew ? "#{msgs.esig_new_page_title}" : "#{msgs.esig_edit_page_title}",
            id : 'eSigWindow',
            closable : false,
            bodyBorder : false,
            frameHeader : false,
            bodyPadding : 10,
            layout: 'fit',
            width: 650,
            header: {
                style: Ext.isIE ? 'margin: 5px 5px 0px 5px;' : ''
            },
            items : [
                {
                    xtype : 'container',
                    id : 'outerCntr',
                    border : false,
                    defaults : {
                        border : false,
                        bodyPadding : 10
                    },
                    layout : 'vbox',
                    items : [
                        {
                            xtype : 'form',
                            id : 'eSigContainer',
                            border : false,
                            defaults : {
                                border : false,
                                bodyPadding : 2,
                                width : 350,
                                labelStyle : 'white-space: nowrap;',
                                allowBlank : false  // requires a non-empty value
                            },
                            layout : 'vbox',
                            items : [
                                {
                                    xtype : 'textfield',
                                    name : 'meaningName',
                                    fieldLabel : '<span class="requiredText">*</span> #{msgs.esig_edit_name}',
                                    value : me.name || ""
                                },
                                {
                                    xtype : 'textfield',
                                    name : 'meaningDisplayName',
                                    fieldLabel : '#{msgs.esig_edit_displayname}',
                                    allowBlank : true,
                                    value : me.displayName || ""
                                },
                                {
                                    xtype : 'multilanghtmleditor',
                                    fieldLabel : '<span class="requiredText">*</span> #{msgs.esig_edit_meaning}',
                                    width : 600,
                                    height : 210,
                                    languageJSON : Ext.JSON.encode(me.meaningList),
                                    name:'sigMeaning',
                                    charLimit : 0, // set to zero or null for unlimited
                                    forcedDefaultLocale : SailPoint.CURR_USER_LOCALE,
                                    //sourceEdit : true,
                                    disableCounter : true
                                }
                            ]
                        },
                        {
                            xtype : 'panel',
                            id : 'errors',
                            bodyPadding : 5
                        }
                    ]
                }
            ],
            buttons : [
                {
                    text : "#{msgs.button_save}",
                    parent : me,
                    handler : function() {
                        this.parent.edit();
                    }
                },
                {
                    text : "#{msgs.button_cancel}",
                    cls : 'secondaryBtn',
                    parent : me,
                    handler : function() {
                        this.parent.cancel();
                    }
                }
            ],
            listeners : {
                show : function(cmp) {
                    Ext.defer(function() {
                        if(cmp.isNew) {
                            me.getForm().findField('meaningName').focus();
                        }
                        else {
                            me.getForm().findField('sigMeaning').getFocusEl().focus();
                        }

                    }, 250);
                }
            }
        });

        this.callParent(arguments);

    },

    getForm: function() {
        return this.items.getAt(0).items.getAt(0).getForm();
    },

    // Convert the meanings from ESignatureType into a
    // format consumable by the MultiLanguageHtmlEditor
    convertMeaninObj : function(obj) {
        this.meaningList = [];

        var keys = Object.keys(obj),
            mList = this.meaningList,
            isDefault = null,
            hasDefault = false;

        Ext.each(keys, function(key) {
            isDefault = (key === SailPoint.CURR_USER_LOCALE);
            mList.push({
                isDefault : isDefault,
                locale : key,
                value : obj[key]
            });
            if(isDefault) {
                hasDefault = true;
            }
        });

        // If there is no meaning for the browser locale, fall back to the system locale.
        if(hasDefault === false) {
            Ext.each(mList, function(item){
                if(item.locale === SailPoint.SYSTEM_LOCALE) {
                    item.isDefault = true;
                    return false;
                }
            });
        }
    },

    cancel : function() {
        this.close();
    },

    edit : function() {
        var me = this,
            meaningJSON = {};
        meaningJSON.name = me.getForm().findField('meaningName').getValue();
        meaningJSON.displayName = me.getForm().findField('meaningDisplayName').getValue();

        var val = me.getForm().findField('sigMeaning').getCleanValue();
        if(val && val !== "") {
            var meaningData = Ext.JSON.decode(val);
            var mObj = {};
            Ext.each(meaningData, function(m){
                if(m.value && m.value !== "") {
                    mObj[m.locale] = m.value;
                }
            });
            if(Ext.Object.getSize(mObj) > 0) {
                meaningJSON.meanings = mObj;
            }
        }

        if(meaningJSON.name === "" || meaningJSON.meanings == null) {
            Ext.getCmp('errors').update("<span class='formError'>#{msgs.esig_required_meaning_fields}</span>");
            return;
        }

        if(Ext.isFunction(me.callbackFunction)) {
            me.callbackFunction(me.originalName, meaningJSON);
        }
        me.close();
    }
});