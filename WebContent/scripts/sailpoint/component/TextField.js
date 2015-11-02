Ext.define('SailPoint.TextField', {
    extend : 'Ext.form.field.Text',
    alias : 'widget.entertextfield',
    
    buttonId : null,
    buttonFinder : null,
    
    constructor : function(config) {
        Ext.apply(this, config);
        this.callParent(arguments);
    },
    
    initComponent : function() {
        this.addListener("keypress", this.detectEnterEvent, this, {buffer:100});
        this.callParent(arguments);
    },
    
    detectEnterEvent : function(event) {
        // IE workaround
        if (!event) {
            event = window.event;
        }
        
        if (Ext.EventObject.ENTER == event.keyCode) {
            // either fire event or click button.
            if(this.buttonId || this.buttonFinder) {
                var button = getButton(Ext.EventManager.getRelatedTarget(event));
                if(button) {
                    button.click();
                }
            }
            else {
                this.fireEvent("EnterKeyPressed");
            }
            Ext.EventManager.stopEvent(event);
        }
        
        return false; // not sure if this is needed (maybe for IE)
    },
    
    /**
     * Return the button to click based on either the buttonId or the
     * buttonFinder function.
     */
    getButton : function(textField) {
        var button = null;

        if (null != this.buttonId) {
            button = Ext.getDom(this.buttonId);
        }
        else if (null != this.buttonFinder) {
            button = this.buttonFinder(textField);
        }

        return button;
    }
});