/**
 * @private
 * @class Ext.ux.layout.component.field.CodeMirror
 * @extends Ext.layout.component.field.Field
 * @author Adrian Teodorescu (ateodorescu@gmail.com; http://www.mzsolutions.eu)
 * @docauthor Adrian Teodorescu (ateodorescu@gmail.com; http://www.mzsolutions.eu)
 *
 * Layout class for {@link Ext.ux.form.field.CodeMirror} fields. Handles sizing the codemirror field.
 */
Ext.define('Ext.ux.layout.component.field.CodeMirror', {
    extend: 'Ext.layout.component.field.Field',
    alias: ['layout.codemirror'],

    toolbarSizePolicy: {
        setsWidth: 0,
        setsHeight: 0
    },

    beginLayout: function(ownerContext) {
        this.callParent(arguments);
        ownerContext.editorContext = ownerContext.getEl('editorEl');
        ownerContext.toolbarContext = ownerContext.getEl('toolbar');
    },

    getItemSizePolicy: function(item) {
        return this.toolbarSizePolicy;
    },

    getLayoutItems: function() {
        var toolbar = this.owner.getToolbar();
        return toolbar ? [toolbar] : [];
    },

    getRenderTarget: function() {
        return this.owner.bodyEl;
    },

    publishInnerHeight: function(ownerContext, height) {
        var me = this,
            innerHeight = height - me.measureLabelErrorHeight(ownerContext) -
                ownerContext.toolbarContext.getProp('height') -
                ownerContext.bodyCellContext.getPaddingInfo().height;


        if (Ext.isNumber(innerHeight)) {
            ownerContext.editorContext.setHeight(innerHeight);
        }
        else {
            me.done = false;
        }
    },

    publishInnerWidth: function(ownerContext, width) {
        var me = this;

        width = ownerContext.bodyCellContext.el.getWidth();
        if (Ext.isNumber(width)) {
            ownerContext.editorContext.setWidth(width);
            ownerContext.toolbarContext.setWidth(width);
        }
        else {
            me.done = false;
        }
    }
});