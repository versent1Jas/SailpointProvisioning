/**
 * An extension of the Ext.ComboBox that includes the button for launching the
 * rule editor.
 */
Ext.define('SailPoint.ClickToolTip', {
    extend : 'Ext.tip.ToolTip',
    
    initComponent : function() {
        Ext.apply(this, {
            style: 'background-color:#ebf3fd;',
            bodyStyle: 'background-color:#ebf3fd;'
        });
        this.callParent(arguments);
    },
    
    showDelay : 0,
    
    setTarget : function(target){ 
        
        var me = this,
            t = Ext.get(target),
            tg;
        
        if (me.target) {
            tg = Ext.get(me.target);
            //me.mun(tg, 'mouseover', me.onTargetOver, me);
            me.mun(tg, 'click', me.onTargetOver, me);
            me.mun(tg, 'mouseout', me.onTargetOut, me);
            me.mun(tg, 'mousemove', me.onMouseMove, me);
        }
        
        me.target = t;
        if (t) {
        
            me.mon(t, {
                // TODO - investigate why IE6/7 seem to fire recursive resize in e.getXY
                // breaking QuickTip#onTargetOver (EXTJSIV-1608)
                freezeEvent: true,
        
                //mouseover: me.onTargetOver,
                click: this.onTargetOver,
                mouseout: me.onTargetOut,
                mousemove: me.onMouseMove,
                scope: me
            });
        }
        if (me.anchor) {
            me.anchorTarget = me.target;
        }
    }
});