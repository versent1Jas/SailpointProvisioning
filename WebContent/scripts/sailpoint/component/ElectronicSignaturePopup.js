Ext.define('SailPoint.ESigPopup', {
    extend : 'Ext.Window',
    alias : 'widget.esigpopup',
    
    originalAuthId : null,  // This should be the display name
    
    nativeAuthId : null,  // This will usually be the DN
    
    meaning : null,
    
    callbackFunction : null,

    callbackCancelFunction : null, // If we need to handle anything on cancel
    
    signatureModel : null,
    
    modal : true,
    
    callbackScope : null,
    
    focusManagerEnabled : false,
    
    signatureObject : null,
    
    objectId : null,

    statics : {
    	
        show : function(nAuthId, oAuthId, meaningText, callback, cancelCallback, callbackScope, objectType, objId) {
            var dialog,
                inputs,
                i;
            this.focusManagerEnabled = Ext.FocusManager.enabled;
            Ext.FocusManager.enable(false);

            dialog = Ext.create("SailPoint.ESigPopup", {
                nativeAuthId : nAuthId,
                originalAuthId : oAuthId,
                meaning : meaningText,
                callbackFunction : callback,
                callbackCancelFunction : cancelCallback,
                callbackScope : callbackScope,
                signatureObject : objectType,
                objectId : objId
            }).show();
            /* iOS does not set focus into the defaultFocus field.
             * Here we loop through inputs and select the first enabled one */
            inputs = dialog.body.query('input');
            for(i = 0; i < inputs.length; i++) {
                if(!inputs[i].disabled) {
                    inputs[i].focus();
                    break;
                }
            }

        }
    },
    
    initComponent : function() {
        /* The username field is disabled and populated if either of
         * these values are set */
        var usernameDisabled = this.originalAuthId || this.nativeAuthId;
        
        Ext.apply(this, {
            title : "#{msgs.esig_popup_title}",
            id : 'eSigWindow',
            closable : false,
            bodyBorder : false,
            frameHeader : false,
            bodyPadding : 5,
            layout: 'fit',
            width: 500,
            header: {
                style: Ext.isIE ? 'margin: 5px 5px 0px 5px;' : ''
            },
            items : [
                {
                    xtype : 'container',
                    id : 'eSigContainer',
                    border : false,
                    defaults : {
                        border : false,
                        bodyPadding : 8
                    },
                    layout : 'vbox',
                    items : [
                        {
                            xtype : 'panel',
                            id : 'meaning',
                            width : 480,
                            html : this.meaning
                        },
                        {
                            xtype : 'panel',
                            id : 'esigErrors',
                            width : 480,
                            html : ''
                        },
                        {
                            xtype : 'form',
                            margin : '10 0 0 0',
                            defaults : {
                                width : 450,
                                allowBlank : false  // requires a non-empty value
                            },
                            items : [
                                {
                                    xtype : 'textfield',
                                    id: 'nameField',
                                    name : 'nameField',
                                    fieldLabel : '#{msgs.label_username}',
                                    value : this.originalAuthId || this.nativeAuthId,
                                    disabled : usernameDisabled,
                                    listeners : {
                                        specialkey : function(field, e, eOpts) {
                                            if (e.getKey() === e.ENTER || e.getKey() === e.TAB) {
                                                e.stopEvent();
                                                this.findParentByType('window').getForm().findField('passField').focus();
                                            }
                                        }
                                    }
                                },
                                {
                                    xtype : 'textfield',
                                    id: 'passField',
                                    name : 'passField',
                                    fieldLabel : '#{msgs.password}',
                                    inputType : 'password',
                                    listeners : {
                                        specialkey : function(field, e, eOpts) {
                                            if (e.getKey() === e.ENTER) {
                                                e.stopEvent();
                                                this.findParentByType('window').sign();
                                            }
                                        }
                                    }
                                }
                                
                            ]
                        }
                    ]
                }
            ],
            buttons : [
                {
                    text : "#{msgs.esig_popup_button_sign}",
                    parent : this,
                    handler : function() {
                        this.parent.sign();
                    }
                },
                {
                    text : "#{msgs.button_cancel}",
                    cls : 'secondaryBtn',
                    parent : this,
                    handler : function() {
                        this.parent.cancel();
                    }
                }
            ],
            listeners : {
                close : function() {
                    if(!this.focusManagerEnabled) {
                        Ext.FocusManager.disable();
                    }
                }
            },
            defaultFocus: usernameDisabled ? 'passField' : 'nameField'
        });
        
        this.callParent(arguments);
        
    },
    
    getForm: function() {
        return this.items.getAt(0).items.getAt(2).getForm();
    },
    
    cancel : function() {
        if(Ext.isFunction(this.callbackCancelFunction)) {
            var fn = this.callbackCancelFunction;
            if (this.callbackScope) {
                fn = Ext.bind(fn, this.callbackScope);
            }
            fn();
        }
        this.close();
    },
    
    sign : function() {
        
        var un = this.getForm().findField('nameField').getValue();
        var pw = this.getForm().findField('passField').getValue();
        var errDiv = Ext.getCmp('esigErrors');
        
        if(pw == null || pw === "" || un == null || un === "") {
            errDiv.update("<div class='formError' style='padding-left:45px'>#{msgs.esig_required_fields}</div>");
            return;
        }
        else {
            errDiv.update("");
        }

        Ext.getCmp('eSigWindow').mask();
        
        Ext.Ajax.request({
            url: SailPoint.getRelativeUrl('/rest/electronicSignatures/auth'),
            method: 'POST',
            params : {
                accountId : this.nativeAuthId || un,
                password : pw,
                objectType : this.signatureObject,
                objId : this.objectId
                
            },
            success: function(response) {
                var r = Ext.JSON.decode(response.responseText);
                var errDiv = Ext.getCmp('esigErrors');
                var win = Ext.getCmp('eSigWindow');
                win.unmask();
                
                if(r.success === false) {
                    var msg = '#{msgs.esig_popup_auth_failure}';
                    if (r.errors) {
                        msg += ': <br />' + r.errors;
                    }

                    errDiv.update("<div class='formError' style='padding-left:45px'>" + msg + "</div>");
                    
                    var pwf = win.getForm().findField('passField');
                    if(pwf) {
                        pwf.selectText();
                        pwf.focus();
                    }
                }
                else {
                    errDiv.update("");

                    if(win) {
                        if(Ext.isFunction(win.callbackFunction)) {
                            var fn = win.callbackFunction;
                            if (win.callbackScope) {
                                fn = Ext.bind(fn, win.callbackScope);
                            }
                            fn(this.nativeAuthId || un, pw); // The expectation is that the callback function requires auth info.
                        }
                        win.close();
                    }
                }
            },
            failure: function(response) {
                // uh oh.
                var r = Ext.JSON.decode(response.responseText);
                var errDiv = Ext.getCmp('esigErrors');
                var win = Ext.getCmp('eSigWindow');
                win.unmask();
                
                var msg = '#{msgs.esig_popup_auth_failure}';
                if (r.errors) {
                    msg += ': <br />' + r.errors;
                }

                errDiv.update("<div class='formError' style='padding-left:45px'>" + msg + "</div>");
                
                var pwf = win.getForm().findField('passField');
                if(pwf) {
                    pwf.selectText();
                    pwf.focus();
                }
            }
        });
    }
});


// Pass through button to make writing configs a little easier
// This seems like the most logical place to put it for now.
// Otherwise we'd have to include another new source file on all pages
// that need eSignatures.
Ext.define('SailPoint.PassthroughButton', {
    extend : 'Ext.button.Button',
    alias : 'widget.passthroughbutton',
    
    initComponent : function() {
        if(this.passClick) {
            this.handler = function() {
                Ext.fly(this.passClick).dom.click();
            };
        }
        this.callParent(arguments);
    }
});

SailPoint.ESigPopup.CertType = "certification";
SailPoint.ESigPopup.WorkItemType = "workitem";