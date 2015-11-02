Ext.define('SailPoint.LCM.RequestAccessPermittedRolesWindow', {
  extend : 'Ext.window.Window',
  col_selected :  "IIQ_Selected",
  grid: null,
  store: null,
  account_request: null,
  
  constructor : function(config){
    this.account_request = config.account_request;
    
    this.grid = this.createGrid(config);
    
    this.template = new Ext.XTemplate(
        '<tpl for=".">',
          '<p class="permittedRoleDetailsInstructions">#{msgs.lcm_request_access_permit_instructions}</p>',
          '<div class="permittedRoleDetails">',
            '<table class="details">',
              '<tr><td><label>#{msgs.name}:</label></td><td class="pl">{arguments.displayableName}</td></tr>',
              '<tr><td><label>#{msgs.owner}:</label></td><td class="pl">{arguments.owner}</td></tr>',
              '<tr><td><label>#{msgs.description}:</label></td><td class="pl">{arguments.description}</td></tr>',
            '</table>',
          '</div>',
        '</tpl>');
    
    this.detailsPanel = Ext.create('Ext.panel.Panel', {
      height:200,
      bodyStyle: 'padding: 10px;',
      region: 'north',
      tpl:  this.template,
      data: this.account_request,
      autoScroll: true
    });
    
    Ext.apply(config, {
        title: Ext.String.format("#{msgs.lcm_request_access_further_info}", config.account_request.arguments.displayableName),
        id: 'permittedRolesWin',
        layout:'border',
        width:768,
        height:500,
        items : [this.detailsPanel, this.grid],
        buttons: [
          
          {
            text:"#{msgs.button_continue} &raquo;", 
            handler: function() {
              
              /**
               * take a list of Ext.Model things and create account requests out of them
               * Then set them on the page.
               * @param selections Ext.Model array
               */
              function assimilateSelections(selections) {
                  var requests = [];

                  requests.push(window.account_request);
                  
                  for (var i = 0; i < selections.length; i++) {
                      var record = selections[i];
                      var request = SailPoint.LCM.RequestAccess.createAccountRequestFromRecord(SailPoint.LCM.RequestAccess.ATTRIBUTE_OP_ADD, record, SailPoint.LCM.RequestAccess.OBJECT_TYPE);                
                      request.arguments.permittedBy = window.account_request.arguments.id;
                      requests.push(request);
                  }     
                  Ext.getCmp('requestAccessList').addRequests(requests); 
              };

              var window = Ext.getCmp('permittedRolesWin');
              var grid = Ext.getCmp('permittedRolesGrid');
              var selections = [];
              var exclusions;
              var selectCriteria = grid.getSelectionCriteria();
              if (selectCriteria.selectAll) {
                  // get every record from the store except for exclusions
                  exclusions = selectCriteria.exclusions || [];
                  
                  // ugh, we have to create another store for select all since we build
                  // account requests in javascript.  we can't just tell the
                  // server to include everything since the browser is keeping
                  // score right now.  Also we can't just do an Ext.ajax.request
                  // since we need to provide the rows as an Ext.Model array
                  var selectAllStore = SailPoint.Store.createRestStore({
                      fields:      grid.metaDataFields,
                      autoLoad:    false,
                      url:         grid.sourceUrl,
                      sorters:     [{property : 'displayableName', direction : 'ASC' }],
                      remoteSort:  true,
                      extraParams: {
                          excludedIds: exclusions.join(","),
                          selectAll:   selectCriteria.selectAll,
                          limit:       1000   // A thousand permitted roles should be enough for anybody.
                      }
                  });
                  
                  selectAllStore.load({
                      scope:    this,
                      callback: function(records, operation, success) {
                          if (!success) {
                              SailPoint.FATAL_ERR_ALERT();
                          } else {
                              assimilateSelections(records);
                          }
                      }
                  });
                  
              } else {
                  selections = grid.getSelectionModel().getSelection();
                  assimilateSelections(selections);
              }
            
              window.close();           
            } 
          },
          {
            text:"#{msgs.button_cancel}", cls : 'secondaryBtn', window: this, handler: function() { Ext.getCmp('permittedRolesWin').close(); }
          }
        ]
    });
    Ext.apply(this, config);
    
    this.callParent(arguments);
  },
  
  setAccountRequest: function(account_request) {
    this.account_request = account_request;
    this.setTitle(Ext.String.format("#{msgs.lcm_request_access_further_info}", account_request.arguments.name));
    this.grid.getStore().getProxy().url = SailPoint.getRelativeUrl('/rest/roles/grid/' + this.account_request.arguments.id + '/permits');
    this.detailsPanel.update(this.account_request);
    this.grid.deselectAll();
  },
  
  createGrid: function(config) {
    var sourceUrl = SailPoint.getRelativeUrl('/rest/roles/grid/' + this.account_request.arguments.id + '/permits');
    this.fields = config.gridMetaData.fields;
     
    this.store = SailPoint.Store.createRestStore({
      fields : config.gridMetaData.fields,
      autoLoad : false,
      url : sourceUrl,
      sorters : [{property : 'displayableName', direction : 'ASC' }],
      remoteSort : true
    });
  
    this.grid = new SailPoint.grid.PagingCheckboxGrid({
      cls: 'smallFontGrid wrappingGrid',
      store: this.store,
      region: 'center',
      id: 'permittedRolesGrid',
      disableMouseTracking: true,
      pageSize:5,
      gridMetaData: config.gridMetaData,
      viewConfig: {
        scrollOffset: 0,
        stripeRows: true
      },
      sourceUrl: sourceUrl,
      metaDataFields: config.gridMetaData.fields
    });
    
    this.store.on('load', function(store, records) {
      var toSelect = [];
      for(var i=0; i<records.length; i++) {
        if(records[i].get(this.col_selected)) {
          toSelect.push(records[i]);
        }        
      }
      this.grid.getSelectionModel().select(toSelect, true);
    }, this);

    return this.grid;
  }
});