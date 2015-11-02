Ext.define('SailPoint.LCM.RequestAccessCurrentAccessGrid', {
  extend : 'SailPoint.grid.PagingGrid',
  
  store: null,
  
  type : SailPoint.LCM.RequestAccess.OBJECT_TYPE_ROLE,
  
  constructor : function(config){
    if (!config.pageSize){
    	config.pageSize = SailPoint.LCM.RequestAccess.PAGE_SIZE;
    }
    Ext.applyIf(config, {
      cls: 'smallFontGrid wrappingGrid',
      layout:'fit',
      store: this.createStore(config),
      pageSize : config.pageSize,
      disableMouseTracking: true,
      columns: config.gridMetaData.columns,
      viewConfig: {
        scrollOffset: 0,
        stripeRows: true,
        getRowClass: function(record, rowIndex, rowParams, store){
          return record.get("IIQ_Selected") ? "row-removed" : "";
        }
      },
      listeners : {
        'activate':{
          fn:function() {
            this.getStore().loadPage(1);
          }, scope:this
        }
      },
      hidebbar: true,
      dockedItems: [{
    	  xtype: 'toolbar',
    	  dock: 'top',
    	  id: 'currentAccessTbar',
    	  items: ['->', {
    		  xtype : 'sppagingtoolbar',
              store : this.store,
              displayInfo : true,
              style: 'border: none;',
              listeners : {
                  beforechange : {
                      fn : function(toolbar, ev) {
                          // Fire a 'page' event whenever the pager is used.
                          return this.fireEvent('page', toolbar, ev);
                      },
                      scope : this
                  }
              }
    	  }]
      }]
    });
    
    Ext.apply(this, config);
        
    this.callParent(arguments);
  },
  
  typeChange: function(field, newValue, oldValue, options) {
    this.getStore().proxy.extraParams['type'] = newValue;
    this.type = newValue;
    this.getStore().loadPage(1);
  },
  
  createStore: function(config) {
    this.store = SailPoint.Store.createRestStore({
        fields : config.gridMetaData.fields,
        autoLoad : false,
        pageSize: config.pageSize,
        url : SailPoint.getRelativeUrl('/rest/requestAccess/assigned'),
        extraParams : {
          'identityId': config.currentIdentity,
          'type' : SailPoint.LCM.RequestAccess.OBJECT_TYPE_ROLE
        },
        sorters : [{
          property : 'displayableName',
          direction : 'ASC'
        }],
        remoteSort : true
    });
    this.store.on('load', function() {
      SailPoint.component.NameWithTooltip.registerTooltips();
    });
    return this.store;
  },
  
  deassign : function(id, rowIndex) {
    //Mask the tabPanel so we don't try to fire multiple AJAX requests too fast.
    Ext.getCmp('requestAccessList').mask();
    
    var record = this.getStore().getById(id);
    var request = SailPoint.LCM.RequestAccess.createAccountRequestFromRecord(SailPoint.LCM.RequestAccess.REMOVE, record, record.get('IIQ_raw_type'));
    
    var requests = [];
    requests.push(request);  
    $('editForm:requestsJSON').value = Ext.JSON.encode(requests);
    $('editForm:addRequestBtn').click();
    
    
    this.getView().addRowCls(rowIndex, 'row-removed');

  }
});
