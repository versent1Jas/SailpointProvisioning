/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * AccountsGridSupport is a static class that can holds common functionality
 * used by multiple account grids.  This includes a context menu that can popup
 * a window with account details, and various column renderers.
 * 
 * @static
 */
Ext.ns('SailPoint.LCM.AccountsGridSupport');


////////////////////////////////////////////////////////////////////////////////
//
// CONSTANTS
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.LCM.AccountsGridSupport.NATIVE_IDENTITY = 'nativeIdentity';


////////////////////////////////////////////////////////////////////////////////
//
// FIELDS
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.LCM.AccountsGridSupport.linkId = null;
SailPoint.LCM.AccountsGridSupport.applicationName = null;
SailPoint.LCM.AccountsGridSupport.accountWindow = null;


////////////////////////////////////////////////////////////////////////////////
//
// ACCOUNT WINDOW
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.LCM.AccountsGridSupport.addGridListeners = function(grid) {
    grid.on('itemcontextmenu', SailPoint.LCM.AccountsGridSupport.contextMenu);
};

SailPoint.LCM.AccountsGridSupport.contextMenu = function(gridView, record, HTMLitem, index, e, eOpts){
  var contextMenu = new Ext.menu.Menu();
  SailPoint.LCM.AccountsGridSupport.linkId = record.getId();
  SailPoint.LCM.AccountsGridSupport.applicationName = record.get('application-name');
  
  contextMenu.add(
      new Ext.menu.Item({text: '#{msgs.view_details}', handler:  SailPoint.LCM.AccountsGridSupport.accountDetails, iconCls: 'viewDetailsBtn', scope: SailPoint.LCM.AccountsGridSupport})
  );
  e.stopEvent();
  contextMenu.showAt(e.xy);
};

SailPoint.LCM.AccountsGridSupport.accountDetails = function() {
  
  if(this.accountWindow) {
    this.accountWindow.destroy();
  }
  
  var url = SailPoint.getRelativeUrl('/identity/linkDetails.jsf?id='+this.linkId);
  Ext.Ajax.request({
    method:'get',
    url: url,
    success: Ext.bind(function(response){
      var windowEl = response.responseText || "";
      
      this.accountWindow = new Ext.Window({
        id: 'accountDetailsWindow',
        title: 'Details for '+ this.applicationName,
        width: 500,
        cls: 'white',
        height: 350,
        html: windowEl,
        closable : false,
        layout : 'fit',
        autoScroll: true,
        buttons: [{
          text: "#{msgs.button_close}",
          cls : 'secondaryBtn',
          handler: function(){this.accountWindow.hide(); },
          scope: this
        }],
        listeners: {
            show: function() {
                addDescriptionTooltips();
            }
        }
      });
      
      this.accountWindow.show();
    }, this)
  });
};


////////////////////////////////////////////////////////////////////////////////
//
// RENDERERS
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.LCM.AccountsGridSupport.statusRenderer = function(value, p, r) {
  return Ext.String.format('<div class="{0}">{1}</div>', r.get('IIQ_status_class'), r.get('IIQ_status'));
};

SailPoint.LCM.AccountsGridSupport.nameRenderer = function(value, p, r) {
  var name = value;
  if(!name) {
    name = r.get(SailPoint.LCM.AccountsGridSupport.NATIVE_IDENTITY);
  }
  return name;
  
};
