Ext.ns('SailPoint.Monitor.Grid.CertificationEvents');

/**
 * View the currently selected certification event.
 * 
 * @param  eventId  The ID of the event to edit.
 */
SailPoint.Monitor.Grid.CertificationEvents.editCertificationEvent = function(eventId) {
    $('editForm:currentEventId').value = eventId;
    $('editForm:editEventButton').click();
};

/**
 * Show a prompt to delete the currently selected certification event.
 * 
 * @param  eventId    The ID of the event to delete.
 * @param  eventName  The name of the event to delete.
 */
SailPoint.Monitor.Grid.CertificationEvents.deleteCertificationEventPrompt = function(args) {
	var eventId = args.eventId;
	var eventName = args.eventName;
	
    $('editForm:currentEventId').value = eventId;
    var confTpl = new Ext.Template("#{msgs.conf_delete_win_title}");
    var areYouSureTpl = new Ext.Template("#{msgs.conf_delete_win_text}");
    Ext.MessageBox.confirm(confTpl.apply([eventName]), areYouSureTpl.apply([eventName]), SailPoint.Monitor.Grid.CertificationEvents.deleteCertificationEvent);
};

/**
 * Handle deleting the selected event.
 */
SailPoint.Monitor.Grid.CertificationEvents.deleteCertificationEvent = function(btn, text) {
    if(btn=='yes') {
      $('editForm:deleteEventButton').click();
    }
};

/**
 * The cellclick handler for the certification events grid.
 */
SailPoint.Monitor.Grid.CertificationEvents.cellClickHandler = function(gridView, record, HTMLitem, index, e, eOpts) {
    SailPoint.Monitor.Grid.CertificationEvents.editCertificationEvent(record.getId());
};

/**
 * The contextmenu handler for the certification event grid.
 */
SailPoint.Monitor.Grid.CertificationEvents.contextMenuHandler = function(gridView, record, HTMLitem, index, e, eOpts) {
    var contextMenu = new Ext.menu.Menu();
    var id = record.getId();
    var name = record.get('name');
    
    contextMenu.add(
      new Ext.menu.Item({text: '#{msgs.menu_head_edit}', handler: SailPoint.Monitor.Grid.CertificationEvents.editCertificationEvent.createCallback(id), iconCls: 'editBtn'}),
      '-',
      new Ext.menu.Item({text: '#{msgs.menu_delete}', handler: SailPoint.Monitor.Grid.CertificationEvents.deleteCertificationEventPrompt.createCallback({eventId: id, eventName: name}), iconCls: 'deleteBtn'})
    );
    
    e.stopEvent();
    contextMenu.showAt(e.xy);
};

/**
 * Renderer for the disabled column.
 */
SailPoint.Monitor.Grid.CertificationEvents.renderDisabled = function(value, metadata, record) {
    return (value === true) ? '#{msgs.yes}' : '#{msgs.no}';
};
