/* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This file contains a collection of utilities to help apply SailPoint styles to 
 * HTML/JSF components after they have been rendered.  The contents of the roundedecorners.js
 * file provide a good example of the type of utilities contained here.
 */
Ext.define('SailPoint.style', {
	statics : {
		alternateTableRows : function(tableId) {
		    var oddRows = Ext.DomQuery.select('tr:even', Ext.getDom(tableId));
		    var evenRows = Ext.DomQuery.select('tr:odd', Ext.getDom(tableId));
		    var i;

		    for (i = 0; i < oddRows.length; ++i) {
		        Ext.get(oddRows[i]).addCls('odd');
		    }
		    
		    for (i = 0; i < evenRows.length; ++i) {
		        Ext.get(evenRows[i]).addCls('even');
		    }
		}
	}
});
