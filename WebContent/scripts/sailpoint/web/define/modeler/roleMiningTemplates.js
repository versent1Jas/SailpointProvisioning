/* (c) Copyright 2010 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.namespace('SailPoint', 'SailPoint.roles');

var MINING_TASK_ID;
var MINING_TASK_TYPE;
var MINING_TASK_NAME;

SailPoint.roles.getMiningTemplatesPanel = function(config) {
  
  var templatesColumnConfig = Ext.JSON.decode($('miningTemplatesGridConfig').value);
  
  var objectsStore = SailPoint.Store.createStore({
    storeId: 'objectsStore',
    url: CONTEXT_PATH + '/define/roles/miningTemplatesDataSource.json',
    fields: templatesColumnConfig.fields,
    root: 'objects',
    totalProperty: 'count',
    remoteSort: true,
    extraParams: {types: 'RoleMining,ITRoleMining', colConfig:'miningTemplatesTableColumns'},
    autoLoad: false,
    sorters:[{property: 'name', direction: 'ASC' }],
    simpleSortMode : true
  });

  objectsStore.on('load', function() {
    Ext.MessageBox.hide();
  });
  
  var objectsGrid = new SailPoint.grid.PagingGrid({
      store:objectsStore,
      id: config.id,
      border: true,
      cls: 'smallFontGrid selectableGrid',
      pageSize:25,
      columns:templatesColumnConfig.columns,
      listeners: { itemclick: SailPoint.roles.clickTemplate, itemcontextmenu: SailPoint.roles.miningTemplatesContextMenu},
      viewConfig : {
          stripeRows:true
      },
      title:config.title,
      tbar: [
        {
          xtype : 'searchfield',
          store:objectsStore,
          paramName:'name',
          storeLimit:500,
          emptyText:'#{msgs.label_filter_by_template_name}',
          width:250
      }]
  });

  objectsGrid.on('show', function(contentPanel) {
    this.doLayout();
    this.getStore().load();
    contentPanel.isLoaded = true;
  });

  return objectsGrid;
};

SailPoint.roles.miningTemplatesContextMenu = function(gridView, record, HTMLitem, index, e, eOpts){
  var contextMenu = new Ext.menu.Menu();
  MINING_TASK_TYPE = record.get('subType');
  MINING_TASK_NAME = record.get('name');
  MINING_TASK_ID = record.getId();

  contextMenu.add(
    new Ext.menu.Item({text: '#{msgs.menu_edit}', handler: function() { SailPoint.roles.EditMiningTemplate(MINING_TASK_ID, MINING_TASK_TYPE); }, iconCls: 'editBtn'}),
    //new Ext.menu.Separator()
    new Ext.menu.Item({text: '#{msgs.menu_exec}', handler: function() { SailPoint.roles.ExecuteMiningTemplate(MINING_TASK_ID, MINING_TASK_TYPE, MINING_TASK_NAME); }, iconCls: 'executeBtn'}),
    new Ext.menu.Separator(),
    new Ext.menu.Item({text: '#{msgs.menu_delete}', handler: SailPoint.roles.DeleteMiningTemplatePrompt, iconCls: 'deleteBtn'})
  );          
    
  e.stopEvent();
  contextMenu.showAt(e.xy);
}; 

SailPoint.roles.EditMiningTemplate = function(id, type) {
  var panel;
  var activeItem;
  
  if(SailPoint.getUnicode(type) == "#{msgs.task_item_type_it_role_mining}") {
    panel = Ext.getCmp('itRoleMiningPanel');
    activeItem = 1;
  } else {
    panel = Ext.getCmp('bfrMiningPanel');
    activeItem = 2;
  }  
  panel.templateId = id;
  
  /** If the panel is already loaded, we need to reload it **/
  panel.loadContent(true);    
  Ext.getCmp('roleMiningPanel').getLayout().setActiveItem(activeItem);
}

SailPoint.roles.ExecuteMiningTemplate = function(id, type, name) {
    if( type == 'IT Role Mining' ) {
        Ext.Ajax.request( {
	        url: SailPoint.getRelativeUrl('/rest/roleMiningTemplate/execute/'),
	        params: { templateId : id },
	        success: function( response, request ) {
	        			/* TODO: Something is wrong.  The JSON has to be decoded twice because something
	        			 * is escaping quotes in the string */
	    				var tmpData = Ext.JSON.decode( response.responseText );
	    				var responseData = Ext.JSON.decode( tmpData );
	    				if( !responseData.success ) {
	    					/* Show fail dialog */
		        			  Ext.Msg.show( {
		        				   title: '#{msgs.err_dialog_title}',
		        				   msg: responseData.message,
		        				   buttons: Ext.Msg.OK,
		        				   icon: Ext.MessageBox.ERROR
		        				} );
	    				} else { 
	    					/* Show success dialog */
		        			  Ext.Msg.show( {
		        				   title: '#{msgs.role_mining_launched}',
		        				   msg: responseData.message,
		        				   buttons: Ext.Msg.OK,
		        				   fn: function() {
				        			  var miningResultsGrid = Ext.getCmp( 'miningResultsGrid' ); 
				        			  if( miningResultsGrid ) {
				        				  miningResultsGrid.reload();
				        			  }
		        			  		},
		        				   icon: Ext.MessageBox.INFO
		        				} );
		        			  /* Refresh the results panel if it has been created */
	    				}
	        		  },
	        failure: function( response ) {
	        			  /* Failure means there was some sort of server type problem, not that the method failed */
	        			  Ext.Msg.show( {
	        				   title: '#{msgs.err_dialog_title}',
	        				   msg: '#{msgs.err_trouble_communicating_with_server}',
	        				   buttons: Ext.Msg.OK,
	        				   icon: Ext.MessageBox.ERROR
	        				} );
	        		  }
	    } );
	} else {
	    $('templateId').value = id;
	    $('businessRoleMiningLaunchFromGridForm:launchBFRMining').click();
	}
};

SailPoint.roles.DeleteMiningTemplatePrompt = function() {
  var confTpl = new Ext.Template("#{msgs.conf_delete_win_title}");
  var areYouSureTpl = new Ext.Template("#{msgs.role_mining_delete_win_text}");
  Ext.MessageBox.confirm(confTpl.apply([MINING_TASK_NAME]), areYouSureTpl.apply([MINING_TASK_NAME]), SailPoint.roles.DeleteMiningTemplate);
};

SailPoint.roles.DeleteMiningTemplate = function(btn, text) {
  if(btn=='yes') {
    $('tabState:miningSelectedId').value = MINING_TASK_ID;
    $('tabState:miningDeleteBtn').click(); 
  }
};

SailPoint.roles.AfterMiningTemplateDelete = function() {
    var roleMiningTemplatesPanel = Ext.getCmp('roleMiningTemplatesPanel');
    if (roleMiningTemplatesPanel) {
        roleMiningTemplatesPanel.getStore().load({ callback: roleMiningTemplatesPanel.loadAfterDelete });
    }
    SailPoint.roles.closeDialogs();
    var miningResultsGrid = Ext.getCmp('miningResultsGrid');
    if (miningResultsGrid) {
        miningResultsGrid.getStore().load({ callback: miningResultsGrid.loadAfterDelete });
    }
    var miningResultsPanel = Ext.getCmp('miningResultsPanel');
    if(miningResultsPanel) {
        miningResultsPanel.getLayout().setActiveItem(0);
    }
    Ext.getCmp('spViewport').doLayout();
};

SailPoint.roles.clickTemplate = function(gridView, record, HTMLitem, index, e, eOpts){
  SailPoint.roles.EditMiningTemplate(record.getId(), record.get('subType'));
};
