/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */
Ext.ns('SailPoint', 'SailPoint.workitems');


SailPoint.workitems.ApprovalItemsMultiSelectGrid = Ext.extend(SailPoint.grid.PagingCheckboxGrid, {
    initComponent : function(){
    	SailPoint.workitems.ApprovalItemsMultiSelectGrid.superclass.initComponent.apply(this, arguments);
	}

} );
