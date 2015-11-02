/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Define', 
       'SailPoint.Define.Grid',
       'SailPoint.Define.Grid.Population');

SailPoint.Define.Grid.Population.createPopulationEditGrid = function(gridMetaData, gridStateStr, gridState, gridWidth, stateID, popId) {
		
	// data store
	store = SailPoint.Store.createRestStore({
	    autoLoad: false,
	    url: SailPoint.getRelativeUrl('/rest/identities/population/' + popId + '/groupDefinition'),
	    fields: gridMetaData.fields,
	    sorters: [{property: 'name', direction: 'ASC' }],
	    remoteSort: true
	});
	
	// data grid
	var grid = new SailPoint.grid.PagingGrid({
	    renderTo: 'populations-display',
	    store: store,
	    cls: 'smallFontGrid selectableGrid',
	    stateId: stateID,
	    stateful: true,
	    columns: gridMetaData.columns,
	    width: gridWidth,
	    viewConfig : {stripeRows: true},
	    collapsible: false,
	    animCollapse: true,
	    pageSize: 20,
	    listeners: { 
	        itemclick: SailPoint.Define.Grid.Population.clickRow, 
	        itemcontextmenu: SailPoint.Define.Grid.Population.showContextMenu
	    },
	    bbar: {
	      xtype : 'pagingtoolbar',
	      pageSize: 20,
	      store: store,
	      displayInfo: true
	    }
	});
	
	store.load({params:{'start':0, 'limit':20}});
	
	return grid;
};


SailPoint.Define.Grid.Population.showContextMenu = function(gridView, record, HTMLitem, index, e, eOpts){
	id = record.getId();
	name = record.get('name');
	
	var contextMenu = new Ext.menu.Menu();
	contextMenu.add(
	    new Ext.menu.Item({text: '#{msgs.menu_edit}', 
	                       handler: SailPoint.Define.Grid.Population.editIdentity, 
	                       iconCls: 'editBtn'})
	);          
	  
	e.stopEvent();
	contextMenu.showAt(e.xy);
};

SailPoint.Define.Grid.Population.clickRow = function(gridView, record, HTMLitem, index, e, eOpts){
	$('editForm:currentObjectId').value = record.getId();
	$('editForm:editButton').click();
};

SailPoint.Define.Grid.Population.editIdentity = function() {
	// there's no functional difference btwn this and clickRow
	$('editForm:currentObjectId').value = id;
	$('editForm:editButton').click();
};

