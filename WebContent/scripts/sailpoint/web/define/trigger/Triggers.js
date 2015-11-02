Ext.ns('SailPoint.Define.Trigger.Triggers');

SailPoint.Define.Trigger.Triggers.GRID_ID = 'triggersGrid';

/**
 * Create the identity triggers grid.
 */
SailPoint.Define.Trigger.Triggers.createTriggersGrid = function(stateId, fields, cols) {

  var triggersStore = SailPoint.Store.createStore({
    storeId: 'triggersStore',
    url: CONTEXT_PATH + '/define/trigger/triggersDataSource.json',
    fields: fields,
    root: 'objects',
    totalProperty: 'count',
    remoteSort: true,
    autoLoad: true,
    simpleSortMode : true,
    sorters: [{property: 'name'}]
  });
  
  var triggersGrid = new SailPoint.grid.PagingGrid({
    store: triggersStore,
    id: SailPoint.Define.Trigger.Triggers.GRID_ID,
    cls: 'smallFontGrid selectableGrid',
    stateId: stateId,
    stateful: true,
    viewConfig : {
        stripeRows: true
    },
    columns: cols,
    layout:'fit',
    title: '#{msgs.grid_title_identity_triggers}',
    tbar: [
      {
        xtype : 'searchfield',
        store: triggersStore,
        paramName: 'triggerSearch',
        storeLimit: 20,
        emptyText: '#{msgs.label_filter_by_identity_trigger_name}',
        width:250
      },
      ' ',
      {
        xtype : 'button',
        text: '#{msgs.identity_trigger_new_identity_trigger_btn}',
        scale : 'medium',
        cls : 'primaryBtn',
        handler: function() {
          $("editForm:newTriggerButton").click();
        }
      }
    ]
  });
  
  triggersGrid.addListener('itemclick', SailPoint.Define.Trigger.Triggers.cellClickHandler);
  triggersGrid.addListener('itemcontextmenu', SailPoint.Define.Trigger.Triggers.contextMenuHandler);
  
  return triggersGrid;
};

/**
 * Cell click handler for the triggers grid.
 */
//( Ext.view.View this, Ext.data.Model record, HTMLElement item, Number index, Ext.EventObject e, Object eOpts )
SailPoint.Define.Trigger.Triggers.cellClickHandler = function(gridView, record, HTMLitem, index, e, eOpts) {
    SailPoint.Define.Trigger.Triggers.editTrigger(record.getId());
};

/**
 * Context menu handler for the triggers grid.
 */
SailPoint.Define.Trigger.Triggers.contextMenuHandler = function(gridView, record, HTMLitem, index, e, eOpts){
    var contextMenu = new Ext.menu.Menu();
    var id = record.getId();
    var name = record.get('name');
    
    contextMenu.add(
      new Ext.menu.Item({text: '#{msgs.menu_head_edit}', handler: Ext.bind(SailPoint.Define.Trigger.Triggers.editTrigger, this, [id]), iconCls: 'editBtn'}),
      '-',
      new Ext.menu.Item({text: '#{msgs.menu_delete}', handler: Ext.bind(SailPoint.Define.Trigger.Triggers.deleteTriggerPrompt, this, [id, name]), iconCls: 'deleteBtn'})
    );
    
    e.stopEvent();
    contextMenu.showAt(e.xy);
};

/**
 * View the trigger with the given ID.
 * 
 * @param  triggerId  The ID of the trigger to edit.
 */
SailPoint.Define.Trigger.Triggers.editTrigger = function(triggerId) {
    $('editForm:selectedId').value = triggerId;
    $('editForm:editTriggerButton').click();
};

/**
 * Show a prompt to delete the trigger with the given ID and name.
 * 
 * @param  triggerId    The ID of the trigger to delete.
 * @param  triggerName  The name of the trigger to delete.
 */
SailPoint.Define.Trigger.Triggers.deleteTriggerPrompt = function(triggerId, triggerName) {
    $('editForm:selectedId').value = triggerId;
    var confTpl = new Ext.Template("#{msgs.conf_delete_win_title}");
    var areYouSureTpl = new Ext.Template("#{msgs.conf_delete_win_text}");
    Ext.MessageBox.confirm(confTpl.apply([triggerName]), areYouSureTpl.apply([triggerName]), SailPoint.Define.Trigger.Triggers.deleteTrigger);
};

/**
 * Handle deleting the selected trigger.
 */
SailPoint.Define.Trigger.Triggers.deleteTrigger = function(btn, text) {
    if(btn=='yes') {
      $('editForm:deleteTriggerButton').click();
    }
};

/**
 * Refresh the triggers grid.
 */
SailPoint.Define.Trigger.Triggers.getGrid = function() {
    return Ext.getCmp(SailPoint.Define.Trigger.Triggers.GRID_ID);
};

/**
 * Renderer for the disabled column.
 */
SailPoint.Define.Trigger.Triggers.renderDisabled = function(value, metadata, record) {
    return (value === true) ? '#{msgs.yes}' : '#{msgs.no}';
};
