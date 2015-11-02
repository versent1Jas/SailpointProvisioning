/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This class is the base certification decision dialog. Components
 * which generate a DecisionDialog expect a 'finish' event to fire
 * which should return a SailPoint.Decision object.
 */
Ext.define('SailPoint.certification.CreateRoleDialog', {
    extend: 'Ext.Window',

    certification: null,
    entity: null,
    contentPanel: null,
    approverSuggest: null,
    descriptionEditor: null,

    constructor: function(config) {
        Ext.apply(this, {
            id: 'RoleDialogWindow',
            buttons: [
                {
                    text: "#{msgs.button_save}",
                    parent: this,
                    handler: function() {
                        this.parent.save();
                    }
                },
                {
                    text: "#{msgs.button_cancel}",
                    cls: 'secondaryBtn',
                    parent: this,
                    handler: function() {
                        this.parent.cancel();
                    }
                }
            ]
        });
        this.callParent(arguments);
    },

    initComponent: function() {
        var me = this;

        Page.on('roleCreationComplete', function() {
            this.onSaveHandler();
        }, this);

        // Hide the mask that we rendered while initializing
        this.on('initComplete', function() {
            this.hideMask();
        }, this);

        // Hide the mask that we rendered while initializing
        this.on('readyForDisplay', function() {
            this.readyForDisplay();
        }, this);

        Ext.apply(this, {
            layout: 'fit',
            modal: true,
            closable: false
        });

        this.setTitle("#{msgs.dialog_create_business_role}");

        this.contentPanel = Ext.create("Ext.Panel", {
            id: 'createRoleContentPanel',
            loader: {
                url: SailPoint.getRelativeUrl("/certification/roleFromCertification.jsf?certificationIdentityId=" + this.entity.entityId),
                autoLoad: true,
                success: function() {
                    me.initApproverSuggest();
                    me.initDescriptionEditor();
                    me.reSizeWindow();
                }
            },
            bodyStyle: 'padding: 20px'
        });
        this.items = [this.contentPanel];

        this.callParent(arguments);
    },

    /**
     * Initialize the approver suggest component for the dialog.  This gets
     * inserted into the content that is loaded into roleFromCertification.jsf,
     * so this must be executed after the panel is loaded.
     */
    initApproverSuggest: function() {
        if (this.approverSuggest) {
            this.approverSuggest.destroy();
        }

        this.approverSuggest = new SailPoint.IdentitySuggest({
            id: 'approverSuggestCmp',
            renderTo: 'approverSuggest',
            binding: 'roleFromCertificationForm:approver',
            value: $('approverSuggestInitialValue').innerHTML,
            width: 300,
            baseParams: {context: 'Owner'}
        });
    },

    initDescriptionEditor: function(){
        if(this.descriptionEditor) {
            this.descriptionEditor.destroy();
        }

        if ($('roleDescriptionHTML')) {
            this.descriptionEditor = Ext.create('SailPoint.MultiLanguageHtmlEditor', {
                renderTo: 'roleDescriptionHTML',
                width: 500,
                height: 200,
                languageJSON: '',
                id: 'roleDescriptionHTMLCmp',
                langSelectEnabled: $('allowRoleLocalization').innerHTML === 'true',
                defaultLocale: SailPoint.CURR_USER_LOCALE
            });
        }
    },

    reSizeWindow: function() {
        var me = this;
        me.updateLayout();
        me.center();
    },

    //---------------------------------------------------------------
    //
    // EXTENSIONS POINTS - insert your customizations in these methods
    //
    //---------------------------------------------------------------

    handleError: function(exception, msg) {
        SailPoint.FATAL_ERR_JAVASCRIPT(exception, msg);
        this.cancel();
    },

    validateForm: function() {
        return true;
    },


    //---------------------------------------------------------------
    //
    // BASE METHODS - These should most likely not be modified or extended
    //
    //---------------------------------------------------------------

    display: function(entityDetails, certificationConfig) {
        this.show();
    },

    /**
     * Called when the dialog is completed by the user. Note that
     * this method does not handle the cancel button click.
     */
    save: function() {
        var roleDescriptionCmp = Ext.getCmp('roleDescriptionHTMLCmp');
        if (roleDescriptionCmp) {
            $('roleFromCertificationForm:jfDescriptionsJSON').value = roleDescriptionCmp.getCleanValue();
        }
        try {
            $('roleFromCertificationForm:saveRoleBtn').click();
        } catch (err) {
            SailPoint.FATAL_ERR_JAVASCRIPT(err, 'Error creating role.');
        }
        return false;
    },

    /**
     * Called when the cancel button is clicked
     */
    cancel: function() {
        this.destroy();
    },

    onSaveHandler: function() {
        var validationError =
            $('roleFromCertificationForm:validationErrorDetected').value === 'true';
        if (!validationError) {
            this.destroy();
        }
    },

    validate: function() {
        if (this.isReadOnly) {
            return true;
        }

        return this.validateForm();
    },

    showMask: function() {
        this.getEl().mask(Ext.LoadMask.prototype.msg, 'x-mask-loading');
    },

    hideMask: function() {
        this.getEl().unmask();
    }

});