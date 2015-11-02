Ext.define('SailPoint.panel.NoHeaderPanel', {
    extend : 'Ext.panel.Panel',
    alias : 'widget.noheaderpanel',

    title: ' ', // force header creation so we can hide it in afterrender.
    header: false, // this should prevent the header from being created, but doesn't.

    initComponent : function() {
        this.on('afterrender', function(){
            var head = this.child('header');
                if(head) {
                    head.setSize(0,0);
                }
            }, this);
        this.callParent(arguments);
    }
});