/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Provides a checkbox selection model that enforces a unique selection
 * in the grid.
 */
Ext.define('SailPoint.grid.UniqueCheckboxSelectionModel', {
    extend: 'Ext.selection.CheckboxModel',

    showHeaderCheckbox: false,

    checkOnly: true,

    constructor: function(config) {
        var me = this;

        me.callParent(arguments);

        me.on('beforeselect', function(selModel, record, index, eOpts) {
            me.deselectAll();
        });
    },

    getUniqueSelection: function() {
        var selection = this.getSelection();
        if (Ext.isEmpty(selection)) {
            return null;
        }

        return selection[0];
    }
});
