/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Define', 
       'SailPoint.Define.Grid',
       'SailPoint.Define.Grid.Group');

var gridHeight = 400;
var innerGridHeight = 322;
var acctGroupsGrid;
var workgroupsGrid;

SailPoint.Define.Grid.Group.createGroupsGrid = function(fields, columns, gridStateStr, pageSize, stateId, gridWidth) {
    // var innerGridWidth=gridWidth-2;

    // data stores
    var groupsStore = SailPoint.Store.createStore({
        fields : fields,
        autoLoad : false,
        url : CONTEXT_PATH + '/define/groups/groupsDataSource.json',
        simpleSortMode : true,
        root : 'groups',
        totalProperty : 'totalCount',
        pageSize : pageSize,
        remoteSort : true
    });

    // grids
    return {
        xtype : 'paginggrid',
        id : 'groupsGrid',
        store : groupsStore,
        cls : 'selectableGrid',
        stateId : stateId,
        gridStateStr : gridStateStr,
        stateful : true,
        columns : columns,
        title : '#{msgs.groups}',
        bbar : {
            xtype : 'sppagingtoolbar',
            store : groupsStore,
            displayInfo : true
        },
        viewConfig : {
            stripeRows : true,
            scrollOffset : 0
        },
        tbar : [ {
            xtype : 'searchfield',
            store : groupsStore,
            paramName : 'name',
            storeLimit : 20,
            emptyText : '#{msgs.label_filter_by_group_name}',
            width : 250
        }, ' ', {
            xtype : 'button',
            text : '#{msgs.button_create_new_group}',
            scale : 'medium',
            cls : 'primaryBtn',
            disabled: $('editForm:createGroupButton').disabled,
            handler : function() {
                $("editForm:createGroupButton").click();
            }
        } ],
        listeners : {
            activate : SailPoint.Define.Grid.Group.refreshPanel,
            itemclick : SailPoint.Define.Grid.Group.clickRow,
            itemcontextmenu : SailPoint.Define.Grid.Group.showContextMenu
        }
    };
};

SailPoint.Define.Grid.Group.createPopsGrid = function(fields, columns, gridStateStr, pageSize, stateId, gridWidth) {

    // data stores
    var popsStore = SailPoint.Store.createStore({
        fields : fields,
        autoLoad : false,
        url : CONTEXT_PATH + '/define/groups/populationsDataSource.json',
        root : 'populations',
        pageSize : pageSize,
        remoteSort : true
    });

    // grids
    return {
        xtype : 'paginggrid',
        id : 'popsGrid',
        store : popsStore,
        cls : 'selectableGrid',
        columns : columns,
        gridStateStr : gridStateStr,
        stateId : stateId,
        stateful : true,
        viewConfig : {
            stripeRows : true,
            scrollOffset : 0
        },
        title : '#{msgs.populations}',
        bbar : {
            xtype : 'sppagingtoolbar',
            store : popsStore,
            displayInfo : true
        },
        tbar : [{
            xtype : 'searchfield',
            store : popsStore,
            paramName : 'name',
            storeLimit : pageSize,
            emptyText : '#{msgs.label_filter_by_population_name}',
            width : 250
        } ],
        listeners : {
            activate : SailPoint.Define.Grid.Group.refreshPanel,
            itemclick : SailPoint.Define.Grid.Group.clickRow,
            itemcontextmenu : SailPoint.Define.Grid.Group.showContextMenu
        }
    };
};

SailPoint.Define.Grid.Group.createWorkgroupsGrid = function(fields, columns, gridStateStr, pageSize, stateId, gridWidth) {
  var innerGridWidth=gridWidth-2;
  var workgroupGridState = new SailPoint.GridState({name: 'workgroup', gridStateObj: JSON.parse(gridStateStr)}); 
  
  var workgroupsStore = SailPoint.Store.createStore({
      pageSize: pageSize,
      url: CONTEXT_PATH + '/define/groups/workgroupsDataSource.json',
      root: 'workgroups',
      fields: fields,
      autoLoad: false,
      remoteSort: true
  });
  
  workgroupsGrid = Ext.create('SailPoint.grid.PagingGrid', {
    id: 'workgroupsGrid',
    store: workgroupsStore,
    cls: 'selectableGrid',
    columns: columns,
    gridStateStr: gridStateStr,
    stateId: stateId,
    stateful: true,
    title:'#{msgs.workgroup_grid_title}',
    viewConfig: {
      stripeRows:true,
      scrollOffset: 0
    },
    bbar: {
      xtype : 'sppagingtoolbar',
      store: workgroupsStore,
      displayInfo: true
    },
    tbar: [
      {
        xtype : 'searchfield',
        id: 'workgroupSearchField',
        store: workgroupsStore,
        paramName:'name',
        emptyText:'#{msgs.workgroup_filter_by_name}',
        width:250,
        storeLimit:pageSize
      },
      ' ',
      {
        xtype : 'button',
        text: '#{msgs.workgroup_create}',
        scale : 'medium',
        cls : 'primaryBtn',
        disabled: $('editForm:createWorkgroupButton').disabled,
        handler: function() {
          $("editForm:createWorkgroupButton").click();
        }
      }],
      listeners : {
          activate : SailPoint.Define.Grid.Group.refreshPanel,
          itemclick : SailPoint.Define.Grid.Group.clickRow,
          itemcontextmenu : SailPoint.Define.Grid.Group.showContextMenu
      }
  });

  return workgroupsGrid;
};


SailPoint.Define.Grid.Group.createPanel = function(activeTab, grids, gridWidth) {
    return {
        xtype : 'sptabpanel',
        id : 'groups',
        plain : true,
        activeTab : activeTab,
        deferredRender : true,
        layoutOnTabChange : true,
        defaults : {
            autoScroll : true
        },
        items : grids
    };
};


SailPoint.Define.Grid.Group.clickRow = function(gridView, record, HTMLitem, index, event, eOpts) {
    root = gridView.store.getProxy().reader.root;
    id = record.getId();
    SailPoint.Define.Grid.Group.editObject(gridView);
};
    
SailPoint.Define.Grid.Group.deletePrompt = function(item) {
    var confTpl = new Ext.Template('#{msgs.conf_delete_win_title}');
    var areYouSureTpl = new Ext.Template('#{msgs.conf_delete_win_text}');
    var name = item.name ? item.name : item;
    Ext.MessageBox.confirm(confTpl.apply([name]), areYouSureTpl.apply([name]), SailPoint.Define.Grid.Group.deleteObject);
};
    
SailPoint.Define.Grid.Group.deleteObject = function(button, text) {
    if (button == 'yes') {
      switch (root) {
        case 'groups':
            $('editForm:currentGroupObjectId').value = id;
            $('editForm:deleteGroupButton').click();
                            
            break;
        case 'populations':
            $('editForm:currentPopsObjectId').value = id;
            $('editForm:deletePopButton').click();
                            
            break;
        // TODO: If we ever switch everything over to use the getGridResponse JSON method
        //       we need to rethink these if-blocks because all the roots will be hard-coded to 'rows'
        // case 'accountGroups':
        case 'objects':
            $('editForm:currentAccountGroupObjectId').value = id;
            $('editForm:deleteAccountGroupButton').click();
                            
            break;
        case 'workgroups':
            $('editForm:currentWorkgroupObjectId').value = id;
            $('editForm:deleteWorkgroupButton').click();
            break;
        default:
            // not one of the above? do nothing
            break;
      }
  }
};


SailPoint.Define.Grid.Group.newObject = function(item) {
    var grid = item.theGrid ? item.theGrid : item;
    if(grid.store.root == "accountGroups") {
        //redirect to edit page with no params
        location.replace(SailPoint.getRelativeUrl("/define/groups/editAccountGroup.jsf"));
    }
};
    
SailPoint.Define.Grid.Group.editObject = function(item) {
  var grid = item.theGrid ? item.theGrid : item;
  switch (root) {
    case 'subgroups':
        grid.panel.gridState.encodeGridState('editForm:SG');
        $('groupForm:currentSubGroupObjectId').value = id;
        $('groupForm:editSubGroupButton').click();
                        
        break;
    case 'groups':
        grid.panel.gridState.encodeGridState('editForm:G');
        $('editForm:currentGroupObjectId').value = id;
        $('editForm:editGroupButton').click();
                        
        break;
    case 'populations':
        grid.panel.gridState.encodeGridState('editForm:P');
        $('editForm:currentPopsObjectId').value = id;
        $('editForm:editPopButton').click();
                        
        break;
    // TODO: If we ever switch everything over to use the getGridResponse JSON method
    //       we need to rethink these if-blocks because all the roots will be hard-coded to 'rows'
    // case 'accountGroups':
    case 'objects':
        grid.panel.gridState.encodeGridState('editForm:AG');
        $('editForm:currentAccountGroupObjectId').value = id;
        $('editForm:editAccountGroupButton').click();
                        
        break;
     case 'workgroups':
        grid.panel.gridState.encodeGridState('editForm:WG');
        $('editForm:currentWorkgroupObjectId').value = id;
        $('editForm:editWorkgroupButton').click();

        break;
    default:
        // not one of the above? do nothing
        break;
  }
};

SailPoint.Define.Grid.Group.refreshPanel = function(component) {
    component.initialLoad();

    // hide the "Create New Group" button if it's not the 
    // main groups grid being displayed
    var createBtn = $('editForm:createGroupButton');
    if (component.getId() == 'groupsGrid')
        createBtn.style.visibility = 'visible';
    else
        createBtn.style.visibility = 'hidden';

    // hide the "Create New Workgoup Group" button if it's not the 
    // workgroup grid being displayed
    var createWorkgroupBtn = $('editForm:createWorkgroupButton');
    if (component.getId() == 'workgroupsGrid')
        createWorkgroupBtn.style.visibility = 'visible';
    else
        createWorkgroupBtn.style.visibility = 'hidden';
};

SailPoint.Define.Grid.Group.renderStatus = function(value, p, r) {
  if(value == true)
    return Ext.String.format('<span class=\'successBox font10\' >{0}</span>', ' ');
  else if(value == false)
    return Ext.String.format('<span class=\'failBox font10\' >{0}</span>', ' ');
  else if(value=='Warning')
    return Ext.String.format('<span class=\'warnBox font10\' >{0}</span>', ' ');
  else
    return Ext.String.format('{0}', value);
};

SailPoint.Define.Grid.Group.showContextMenu = function(gridView, record, HTMLitem, index, event, eOpts) {
  root = gridView.store.getProxy().reader.root;
  id = record.getId();
  name = record.get('name');
  
  var deleteDisabled = null,
      deleteBtn = null;
  
  if(root == "workgroups") {
      deleteBtn = $('editForm:deleteWorkgroupButton');
  } else if (root == "groups") {
      deleteBtn = $('editForm:deleteGroupButton');
  } else if (root == "populations") {
      deleteBtn = $('editForm:deletePopButton');
  }

  if (deleteBtn) {
      deleteDisabled = deleteBtn.disabled;
  }
  
  // This shouldn't ever happen, but the demo data Permissions are messed up, 
  // so it's conceivable that customers will screw them up too
  if (!name || name == "null" || name == "undefined") {
      name = record.get('value');
  }

  if (!name || name == "null" || name == "undefined") {
      name = record.get('attribute');
  }
  
  // If we get to this point the group is really messed up, but let's show them 
  // what we can
  if (!name || name == "null" || name == "undefined") {
      name = id;
  }
  
  var contextMenu = new Ext.menu.Menu();
  contextMenu.add(
      new Ext.menu.Item({text: '#{msgs.menu_edit}', 
                         handler: SailPoint.Define.Grid.Group.editObject, 
                         iconCls: 'editBtn',
                         theGrid: gridView})
  );          
  // don't allow deleting of subgroups
  if (root != 'subgroups') {
    contextMenu.add(
      new Ext.menu.Item({text: '#{msgs.menu_delete}', 
                         handler: SailPoint.Define.Grid.Group.deletePrompt, 
                         iconCls: 'deleteBtn',
                         disabled: deleteDisabled,
                         name: name})
    );          
  }
  
  if(root == "accountGroups"){
      contextMenu.add(new Ext.menu.Item({text: '#{msgs.menu_new_group}', 
                         handler: SailPoint.Define.Grid.Group.newObject, 
                         iconCls: 'addBtn',
                         theGrid: gridView}) );
  }
    
  event.stopEvent();
  contextMenu.showAt(event.xy);
};
