/**
 * An extension of the Ext.ComboBox that includes the button for launching the
 * rule editor.
 */
Ext.define('SailPoint.Rule.Editor.RuleComboBox', {
    extend : 'Ext.form.field.ComboBox',
    ruleType : undefined,
    formName : undefined,
    ruleEditorButton : undefined,

    initComponent : function() {
        this.callParent(arguments);

        // if no rule type is given, try to mine it from the store
        if ((!this.ruleType) && (this.store)) {
            this.ruleType = this.store.getProxy().extraParams['type'];
        }
        
        // add the button to launch the rule editor
        this.on('render', this.onrender);
    },

    /**
     * Jump through a lot of CSS hoops to display the rule editor launch button
     * next to the pulldown
     */
    onrender : function(ct) {
        var td = this.inputCell.parent().createChild({
            tag: "td"
        });
        
        this.button = td.createChild({
            tag   : "input",
            type  : "button",
            cls   : "ruleEditorBtn",
            value : "#{msgs.button_ellipsis}"
        });
        
        this.button.on("click", this.click, this);
        
        this.doComponentLayout();
    },

    onDestroy : function() {
        if (this.button) {
            this.button.removeAllListeners();
            this.button.remove();
        }

        this.callParent(arguments);
        if (this.ruleEditorButton) {
            this.ruleEditorButton.el.setStyle('top', '0px');
        }
    },

    getRuleType : function() {
        return this.ruleType;
    },

    click : function() {
        SailPoint.Rule.Editor.editRule(this);
    }
});