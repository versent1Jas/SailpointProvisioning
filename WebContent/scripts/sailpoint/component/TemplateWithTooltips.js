/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This is an extension of the Ext.XTemplate that will call the tooltip builder on a node after it is overwritten with this template
 */
Ext.define('SailPoint.TemplateWithTooltips', {
	extend : 'Ext.XTemplate',
	overwrite: function(node, values, returnElement) {
		var result = SailPoint.TemplateWithTooltips.superclass.overwrite.apply(this, arguments);
		buildTooltips(Ext.get(node).dom);
		return result;
	}
});

