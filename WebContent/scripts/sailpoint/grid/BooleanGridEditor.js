/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * @class SailPoint.grid.BooleanComboEditor
 * @extends Ext.grid.GridEditor
 * Overrides constructor to initialize the field as a boolean combo box.
*/
Ext.define('SailPoint.grid.BooleanComboEditor', {
	extend : 'Ext.grid.plugin.CellEditing',
	alias : 'widget.booleancomboeditor',
	constructor : function(config){
		var field = new Ext.form.ComboBox({
        	triggerAction: 'all',
            lazyRender:true,
            queryMode:'local',
            editable:false,
            store : ['#{msgs.txt_false}','#{msgs.txt_true}']
	    });
	
		this.callParent(arguments);
	}
});

SailPoint.grid.BooleanComboEditor.options = ['#{msgs.txt_false}','#{msgs.txt_true}'];
