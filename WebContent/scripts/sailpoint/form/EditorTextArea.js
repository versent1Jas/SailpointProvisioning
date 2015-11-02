/* (c) Copyright 2013 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Popup window edit script variables.
 */
Ext.define('SailPoint.form.EditorTextArea', {

    extend : 'Ext.form.Panel',

    alias : 'widget.editortextarea',

    width: 400,

    value: '',
    
    variableName: '',
    
    frame: false,
    
    labelStyle: 'float:left;width:90px;margin:none;padding:none;',
    
    border: false,
    
    bodyStyle: 'background:transparent',

    textArea: null,
    
    layout: 'column',

    manageOverflow: 2,
    
    listeners: {
        /**
         * Used to align the open editor button to the bottom of the textArea component.
         * textArea.getHeight does not include the top margin so we need to factor that into
         * the computation of the open editor top margin.
         */
        afterlayout: function(me) {
            if (me.textArea) {
                var taHeight = me.textArea.getHeight();
                var taMargin = me.textArea.getEl().getMargin();
                var openBtn = me.down('#openButtonId');
                var newHeight = taHeight + taMargin.top - openBtn.getHeight();
                
                openBtn.getEl().setStyle('margin-top', newHeight+'px');
            }
        }
    },

    initComponent: function() {
        var me = this;

        if(!me.fieldLabel){
        	me.fieldLabel = ' ';
        	me.fieldSeparator = '';
        }
        
        me.textArea = new Ext.form.TextArea({
        	readOnly: true,
        	columnWidth: 0.8,
        	fieldLabel: me.fieldLabel,
        	labelStyle: me.labelStyle,
        	labelSeparator: me.labelSeparator,
            fieldStyle: 'background: #dcdcdc 0 0;margin-top:5px;',
            value: me.value,
            style: {
        	    display: 'inline-block'
            }
        });
        
        Ext.apply(me, {
            items: [me.textArea,{
                xtype: 'button',
                itemId: 'openButtonId',
                text: '#{msgs.editor_text_field_btn_open_editor}',
                style: 'margin-left:5px',
                columnWidth: 0.2,
                handler: function(){
            	    var win = Ext.create('SailPoint.component.ScriptEditor', {
            	    	variableName: me.variableName,
            	        value: me.getValue(), // pass in initial script value
            	        listeners: {
            	            save: function(value) {
            	            me.setValue(value);
            	        }
            	    }
            	});

            	win.show();
            	}
            }]
        });

        me.addEvents('save');

        me.callParent();
    },

    setValue: function(value){
        if(this.textArea){
            this.textArea.setValue(value);
        }
        
        this.value = value;
	},
    	
    getValue: function(){
	    if(this.textArea){
	        return this.textArea.value;
	    }
	    return this.value;
	}

});
