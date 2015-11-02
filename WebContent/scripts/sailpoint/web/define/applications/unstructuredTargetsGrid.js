Ext.ns('SailPoint', 'SailPoint.targetDS');
SailPoint.targetDS.isLoaded = false;

SailPoint.targetDS.initDSContent = function(){
  if (!SailPoint.targetDS.isLoaded) {
        Ext.QuickTips.init();
        var gridWidth = $('targetSources-display').clientWidth;
        if (gridWidth == 0)
            gridWidth = $('targetsTbl').clientWidth;
        else if (gridWidth > 800)
            gridWidth = Math.round(gridWidth * 0.75);
        
        var objectId = $("editForm:id").value;
        
        Ext.define('SailPoint.model.TargetData', {
            extend : 'Ext.data.Model',
            fields: ['id', 'name', 'type', {name: 'modified', type: 'date', dateFormat: 'U'}]
        });

        // data store
        tgsStore = new Ext.data.Store({
            model : 'SailPoint.model.TargetData',
            autoLoad: false,
            proxy : {
                type : 'ajax',
                url: CONTEXT_PATH + '/define/applications/targetSourcesDataSource.json',
                reader : {
                    type : 'json',
                    root: 'targetSources',
                    totalProperty: 'totalCount'
                },
                extraParams: {'editForm:id': objectId }
            },       
            remoteSort: false
        });

        // display models       
        var cols = [{
            header: '#{msgs.name}', 
            id: 'name',
            flex : 1,
            dataIndex: 'name',
            width: 0.55 * gridWidth,
            sortable: true, 
            hideable: true
        },{
            header: '#{msgs.type}', 
            id: 'type', 
            dataIndex: 'type', 
            width: 0.15 * gridWidth,
            sortable: true, 
            hideable: true
        },{
            header: '#{msgs.modified}', 
            id: 'modified', 
            dataIndex: 'modified', 
            width: 0.3 * gridWidth,
            renderer: SailPoint.Date.DateTimeRenderer,
            sortable: true, 
            hideable: true
        }];
        
        // grid
        var tgsGrid = new Ext.grid.Panel({
            id: 'tgsGrid',
            renderTo: 'targetSources-display',
            store: tgsStore,
            columns: cols,
            width: gridWidth,
            scroll: false,
            viewConfig: {
                stripeRows: true
            }       
        });
        
        // don't ask me why the listeners property on the grid throws errors
        // on this page... >:(    
        tgsGrid.addListener('itemclick', SailPoint.targetDS.clickRow);     
        tgsGrid.addListener('itemcontextmenu', SailPoint.targetDS.showContextMenu);     
        tgsGrid.addListener('activate', SailPoint.targetDS.refreshPanel);     
                        
        tgsStore.load({params:{start:0, limit:20}});
        
        SailPoint.targetDS.isLoaded = true;
    }
};

SailPoint.targetDS.showContextMenu = function(gridView, record, HTMLitem, index, e, eOpts){
    id = record.getId();
    name = record.get('name');

    var canEdit = $("targetDSCanEdit").value;
    var viewEditText = (canEdit) ? '#{msgs.menu_edit}' : '#{msgs.menu_view}';
    var viewEditIcon = (canEdit) ? "editBtn" : "viewDetailsBtn";
    
    var contextMenu = new Ext.menu.Menu();
    contextMenu.add(new Ext.menu.Item({text: viewEditText, 
                                       handler: SailPoint.targetDS.editADS, 
                                       iconCls: viewEditIcon}));
    if (canEdit) {                               
        contextMenu.add(new Ext.menu.Item({text: '#{msgs.menu_delete}', 
                                           handler: SailPoint.targetDS.deletePrompt, 
                                           iconCls: 'deleteBtn'}));
    }
      
    e.stopEvent();
    contextMenu.showAt(e.xy);
};


SailPoint.targetDS.clickRow = function(gridView, record, HTMLitem, index, e, eOpts){
    $('editForm:selectedTargetsForApp').value = record.getId();
    $('editForm:editButtonTgs').click();        
};


SailPoint.targetDS.editADS = function(menuItem, eventObj) {
    // there's no functional difference btwn this and clickRow
    $('editForm:selectedTargetsForApp').value = id;
    $('editForm:editButtonTgs').click();        
};


SailPoint.targetDS.deletePrompt = function() {
    $('editForm:selectedTargetsForApp').value = id;
    Ext.MessageBox.confirm('Confirm delete of "' + name + '"?', 
                           'Are you sure you want to delete "' + name + '"?', 
                           SailPoint.targetDS.deleteADS);
};


SailPoint.targetDS.deleteADS = function(button, text) {
    if (button == 'yes') {
        $('editForm:deleteButtonTgs').click();
    }
};

SailPoint.targetDS.refreshPanel = function(component) {
    component.getStore().load({params:{start:0, limit:20}});
};