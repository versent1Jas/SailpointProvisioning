Ext.ns('SailPoint', 'SailPoint.activityDS');
SailPoint.activityDS.isLoaded = false;

SailPoint.activityDS.initDSContent = function(){
    
  if (!SailPoint.activityDS.isLoaded) {
        Ext.QuickTips.init();
        var gridWidth = $('activityDataSources-display').clientWidth;
        if (gridWidth == 0)
            gridWidth = $('activitiesTbl').clientWidth;
        else if (gridWidth > 800)
            gridWidth = Math.round(gridWidth * 0.75);
        
        var objectId = $("editForm:id").value;
        
        Ext.define('SailPoint.model.ActivityData', {
            extend : 'Ext.data.Model',
            fields: ['id', 'name', 'type', {name: 'modified', type: 'date', dateFormat: 'U'}]
        });

        // data store
        adsStore = new Ext.data.Store({
            model : 'SailPoint.model.ActivityData',
            autoLoad: false,
            proxy : {
                type : 'ajax',
                url: CONTEXT_PATH + '/define/applications/activityDataSourcesDataSource.json',
                reader : {
                    type : 'json',
                    root: 'activityDataSources',
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
        var adsGrid = new Ext.grid.Panel({
            id: 'adsGrid',
            renderTo: 'activityDataSources-display',
            store: adsStore,
            columns: cols,
            width: gridWidth,
            scroll: false,
            viewConfig: {
                stripeRows: true
            }       
        });
        
        // don't ask me why the listeners property on the grid throws errors
        // on this page... >:(    
        adsGrid.addListener('itemclick', SailPoint.activityDS.clickRow);     
        adsGrid.addListener('itemcontextmenu', SailPoint.activityDS.showContextMenu);     
        adsGrid.addListener('activate', SailPoint.activityDS.refreshPanel);     
                        
        adsStore.load({params:{start:0, limit:20}});
        
        SailPoint.activityDS.isLoaded = true;
    }
};

SailPoint.activityDS.showContextMenu = function(gridView, record, HTMLitem, index, e, eOpts){
    id = record.getId();
    name = record.get('name');

    var canEdit = $("activityDSCanEdit").value;
    var viewEditText = (canEdit) ? '#{msgs.menu_edit}' : '#{msgs.menu_view}';
    var viewEditIcon = (canEdit) ? "editBtn" : "viewDetailsBtn";
    
    var contextMenu = new Ext.menu.Menu();
    contextMenu.add(new Ext.menu.Item({text: viewEditText, 
                                       handler: SailPoint.activityDS.editADS, 
                                       iconCls: viewEditIcon}));
    if (canEdit) {                               
        contextMenu.add(new Ext.menu.Item({text: '#{msgs.menu_delete}', 
                                           handler: SailPoint.activityDS.deletePrompt, 
                                           iconCls: 'deleteBtn'}));
    }
      
    e.stopEvent();
    contextMenu.showAt(e.xy);
};


SailPoint.activityDS.clickRow = function(gridView, record, HTMLitem, index, e, eOpts){
    $('editForm:selectedDSForApp').value = record.getId();
    $('editForm:editButton').click();        
};


SailPoint.activityDS.editADS = function(menuItem, eventObj) {
    // there's no functional difference btwn this and clickRow
    $('editForm:selectedDSForApp').value = id;
    $('editForm:editButton').click();        
};


SailPoint.activityDS.deletePrompt = function() {
    $('editForm:selectedDSForApp').value = id;
    Ext.MessageBox.confirm('Confirm delete of "' + name + '"?', 
                           'Are you sure you want to delete "' + name + '"?', 
                           SailPoint.activityDS.deleteADS);
};


SailPoint.activityDS.deleteADS = function(button, text) {
    if (button == 'yes') {
        $('editForm:deleteButton').click();
    }
};

SailPoint.activityDS.refreshPanel = function(component) {
    component.getStore().load({params:{start:0, limit:20}});
};