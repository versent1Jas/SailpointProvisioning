Ext.onReady(function() {

    var selectionModel = new SailPoint.grid.CheckboxSelectionModel({
        selectAllMenu : new Ext.menu.Menu({
            id:'grid-ctx',
            items :  [
                {
                    selectionType:'selectAll',
                    text: "#{msgs.defselectionmodel_select_everything}",
                    iconCls: 'gridSelectAll',
                    scope:this
                },{
                    selectionType:'deselectAll',
                    text: "#{msgs.defselectionmodel_deselect_everything}",
                    iconCls: 'gridDeselectAll',
                    scope:this
                }
            ]}) // end selectAllMenu
            ,handleCellClick : function(grid, row, cell, e) {
              if (e.button === 0 && cell == 0  || this.clickAll) {
        
                if (!this.isLocked()){
                  var view = this.grid.getView();
                  var record = this.grid.store.getAt(row);
          
                  if (this.isSelected(record)) {
                    this.deselect(record);
                    this.uncheckHeader();
                    view.onRowDeselect(row);
                    this.fireEvent("rowselect", this, row, record);
                  } else {
                    this.checkBoxStateManager.select(record);
                    view.onRowSelect(row);
                    this.fireEvent("rowselect", this, row, record);
                  }
                  this.updateSelectMessageBox();
                  this.fireEvent("selectionchange", this, row);
                }
        
                e.stopEvent();
                return;
              }
            }// end handleCellClick
      } // end config-object
      );
    
    var roleTypeStore = SailPoint.Store.createStore({
    	storeId: 'roleAttributesDataStore',
    	autoLoad: true,
    	url: SailPoint.getRelativeUrl('/systemSetup/roleTypeIncludedAttributesDataSource.json'),
    	root: 'attributes',
    	totalProperty: 'numAttributes',
    	fields: [
    	    'allowed',
    	    'name',
    	    'category',
    	    'description'
    	]
    });
    
    var pagingCheckboxGrid = new SailPoint.grid.PagingCheckboxGrid({
        hidebbar: 'true',
        id: 'roleAttributesGrid',
        height:250,
        store: roleTypeStore,
        columns: [{
            header: '#{msgs.name}', sortable: true, dataIndex:'name', width:75
        }, {
            header: '#{msgs.category}', sortable: true, dataIndex: 'category', width:75
        }, {
            header: '#{msgs.description}', sortable: false, dataIndex: 'description', flex: 1 
        }],
        selModel: selectionModel,
        viewConfig: {autoFill: true, emptyText: 'No role types', scrollOffset: 1}
    });

    var mainPanel = new Ext.Panel({
    border:false,
    bodyBorder:false,
    height : 250,
    frame:false,
        items:[
      pagingCheckboxGrid
    ]
  });

pagingCheckboxGrid.store.on('load', selectSelectedIds);

mainPanel.render('mainPanel');

Ext.get('mainForm:saveButton').on('click', function(){setSelectedIds();return true;});

});

function setSelectedIds() {
  Ext.getDom('mainForm:selectedIds').value = Ext.getCmp('roleAttributesGrid').getSelectedIds();
}

function selectSelectedIds() {
  var grid = Ext.getCmp('roleAttributesGrid');
  var count = grid.store.getCount();
  for (var i=0; i<count; ++i) {
    var record = grid.store.getAt(i);
    if (record.data.allowed) {
      grid.selModel.select(record, true);
    }
  }
  
  if (Ext.isIE) {
    var task = new Ext.util.DelayedTask(function() {Ext.getCmp('roleAttributesGrid').view.refresh();});
    task.delay(1000);
  } else {
    grid.view.refresh();
  }
}
