/* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This is an extension of Ext.button.Button that pops up a message indicating 
 * that the user should wait while a task that is long enough to merit a message but
 * no long enough to merit backgrounding completes
 */
Ext.define('SailPoint.button.LongRunningTaskButton', {
    extend : 'Ext.button.Button',
    alias: 'widget.splongrunningtaskbtn',
    runningMsg: '#{msgs.button_long_running_task_default_running_msg}',
    title: '#{msgs.button_long_running_task_default_title}',
    constructor : function(config) { 
        Ext.apply(this, config);
        this.callParent(arguments);
    },
    
    onMouseDown: function(e) {
        var me = this;
        if (!me.disabled && e.button === 0) {
            me.addClsWithUI(me.pressedCls);
            me.doc.on('mouseup', me.onMouseUp, me);
        }
        Ext.MessageBox.show({
            title: this.title,
            wait: true,
            waitConfig: {
                interval: 500,
                increment: 4,
                text: this.runningMsg
            },
            modal: false,
            icon: Ext.window.MessageBox.INFO,
            closable: false
        });
    }
});