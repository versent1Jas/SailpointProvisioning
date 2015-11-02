Ext.define('SailPoint.define.applications.MainPanel', {
    extend : "Ext.container.Container",
    renderTo: 'tabedConfigPanelDiv',
    panels: new Array(),
    items: [{
        xtype: 'button',
        text: '#{msgs.app_button_add_object_type}',
        cls: 'secondaryBtn marDown',
        handler: function() {
            Ext.MessageBox.prompt('#{msgs.app_button_add_object_type}', '#{msgs.app_button_add_object_type_prompt}', function(buttonId, text, cfg) {
                var hiddenField, addSchemaButton;

                if (buttonId === 'ok') {
                    if (Ext.isEmpty(text)) {
                        //Re-Show with red label
                        var newMsg = '<span class="formError">#{msgs.app_button_add_object_type_prompt}</span>';
                        Ext.Msg.show(Ext.apply({}, { msg: newMsg }, cfg));
                        return false;
                    }


                    // do normal stuff here
                    hiddenField = $('editForm:hiddenSchemaObjectType');
                    if (hiddenField) {
                        hiddenField.value = text;
                    }
                    addSchemaButton = $('editForm:addObjectTypeBtn');
                    if (addSchemaButton) {
                        addSchemaButton.click();
                    }
                }
            });
        }
    }],
    registerPanel: function(panelComponent) {
        if (! Ext.Array.contains(this.panels, panelComponent)) {
            this.panels.push(panelComponent);
        }
    },
    /**
     * Fixes width issues on JDBC registered panels by updating the
     * Extjs layout.
     */
    updatePanelLayout: function() {
        var i;
        if (! Ext.isEmpty(this.panels)) {
            for (i = 0 ; i < this.panels.length ; i++) {
                this.panels[i].updateLayout();
            }
        }

    },
    validate: function() {
        var i;
        if (! Ext.isEmpty(this.panels)) {
            for (i = 0 ; i < this.panels.length ; i++) {
                this.panels[i].validate();
            }
        }
    }
});
