/* (c) Copyright 2013 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Popup window used to edit script variables.
 */
Ext.define('SailPoint.component.ScriptEditor', {

    extend : 'Ext.window.Window',

    alias : 'widget.scripteditor',

    value: '',

    variableName: null,

    modal: true,

    height: 600,

    width: 600,

    initComponent: function() {
        var me = this,
            title;

        title = Ext.isEmpty(me.variableName) ?
                    '#{msgs.script_editor_title}' :
                    Ext.String.format('#{msgs.script_editor_title_name}', me.variableName);

        Ext.apply(me, {
            modal: me.modal,
            title: title,
            height: me.height,
            width: me.width,
            layout: 'fit',
            closable: false,
            items: [{
                xtype: 'textareafield',
                value: me.value
            }],
            bbar: ['->', {
                xtype: 'button',
                text: '#{msgs.script_editor_btn_save}',
                cls : 'primaryBtn',
                handler: function() {
                    me.fireEvent('save', me.items.getAt(0).getValue());
                    me.close();
                }
            }, {
                xtype: 'button',
                text: '#{msgs.script_editor_btn_cancel}',
                handler: function() {
                    me.close();
                }
            }]
        });

        me.addEvents('save');

        me.callParent();
    }

});
