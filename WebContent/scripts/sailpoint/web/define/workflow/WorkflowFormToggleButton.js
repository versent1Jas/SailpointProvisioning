/* (c) Copyright 2013 SailPoint Technologies, Inc., All Rights Reserved. */

/**
* @class SailPoint.WorkflowFormToggleButton
* @extends Ext.Button
* This component is the Basic/Advanced toggle button that exists in workflows which 
* have configuration forms enabled.
*/
Ext.define('SailPoint.WorkflowFormToggleButton', { 
    extend: 'Ext.Button',

    text: '#{msgs.workflow_button_advanced}',
    width: 150,
    cls: 'secondaryBtn',
    spParent: null,
    maskerEnum: null,
    basicPanel: null,
    advancedPanel: null,
    sepComp: null,
    addVarComp: null,
    
    initComponent : function() {
        this.callParent(arguments);
    },
    
    handler: function(button, event) {
        var parentComponent = button.spParent;
        if (parentComponent.isBasicActive === true) {
            this.toggleToAdvanced(parentComponent);
        } else {
            this.toggleToBasic(parentComponent);
        }
    },
    
    toggleToAdvanced : function(parentComponent) {
        parentComponent.isBasicActive = false;
        
        var isFormEmpty = this.submitConfigForm();
        if (isFormEmpty) {
            // If the form is empty always fall back to the advanced panel
            this.showAdvancedPanel();
        }
        
        // see save as it will copy from basic to advanced AFTER waiting for the save to fire
    }, 
    
    toggleToBasic : function(parentComponent) {
        var argsJSON = this.advancedPanel.getArgsJSON();
        parentComponent.isBasicActive = true;
        
        var masker = SailPoint.form.Util.getMasker({maskerEnum: this.maskerEnum});
        if (masker) {
            masker.mask(Ext.LoadMask.prototype.msg,'x-mask-loading');
        }
        // copy from basic to advanced BEFORE regenerating the form
        this.spParent.updateConfigForm(argsJSON);
        
        this.showBasicPanel();
    }, 
    
    submitConfigForm : function() {
        var isFormEmpty = true;
        
        if (!Ext.isEmpty(this.basicPanel.configFormPanel)) {
            var masker = SailPoint.form.Util.getMasker({maskerEnum: this.maskerEnum});
            if (masker) {
                masker.mask(Ext.LoadMask.prototype.msg,'x-mask-loading');
            }
            this.basicPanel.configFormPanel.submit("next", "componentId", this.id, false);
            isFormEmpty = false;
        }
        
        return isFormEmpty;
    },
    
    /**
     * Save is the callback that occurs after the config form is submitted. Think of this method name as
     * submitConfigFormCallback.  So after the response returns we want to copy the basic parameters back 
     * to the advanced so they can be persisted to the model when the user clicks the save button.
     */
    save: function() {
        if (this.spParent.isBasicActive === false) {
            // unmask before possible EJECT
            var masker = SailPoint.form.Util.getMasker({maskerEnum: this.maskerEnum});
            if (masker) {
                masker.unmask();
            }
            //Had an error on the form. eject, eject, EJECT!
            if (!Ext.isEmpty(this.basicPanel.configFormPanel)
                    &&  (this.basicPanel.configFormPanel.hasValidationMessages() 
                            || this.basicPanel.configFormPanel.hasErrorMessages()) ) {
                this.spParent.isBasicActive = true;
                return;
            }
            
            this.spParent.copy(this.basicPanel, this.advancedPanel);
            
            this.showAdvancedPanel();
        }
    },
    
    showAdvancedPanel: function() {
        this.basicPanel.hide();
        this.advancedPanel.show();
        this.sepComp.show();
        this.addVarComp.show();
        this.setText('#{msgs.workflow_button_basic}');
        
    }, 
    
    showBasicPanel: function() {
        this.advancedPanel.hide();
        this.basicPanel.show();
        this.sepComp.hide();
        this.addVarComp.hide();
        this.setText('#{msgs.workflow_button_advanced}');
    }
    
});