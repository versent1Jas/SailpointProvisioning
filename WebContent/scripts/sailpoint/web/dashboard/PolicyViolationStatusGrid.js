/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.dashboard.PolicyViolationStatusGrid', {
    extend : 'SailPoint.grid.PagingGrid',
  
  isBulk : false,
  
  constructor : function(config){

    var fields = config.fields;
  
    config.store = SailPoint.Store.createRestStore({
      autoLoad: true,
      url: SailPoint.getRelativeUrl('/rest/violations/{0}'),
      fields: fields,
      pageSize: 20,
      sorters : [{property: 'identity.name', direction: 'ASC'}],
      remoteSort: true,
      simpleSortMode : true
    });

    config.store.applyPathParams([SailPoint.Utils.encodeRestUriComponent(config.currentIdentity)]);

    Ext.applyIf(config, {
        cls: 'smallFontGrid selectableGrid',
        usePageSizePlugin:true,
        listeners: { itemclick: this.clickViolation },
        tbar: [
          {
            xtype : 'searchfield',
            store: config.store,
            paramName: 'name',
            storeLimit: this.pageSize,
            emptyText: '#{msgs.label_filter_by_identity_name}',
            width: 250
          }
        ],
        viewConfig: {
          scrollOffset: 1,
          stripeRows : true
        }
    });
    
    Ext.apply(this, config);
    this.callParent(arguments);
  },
  
  clickViolation : function(gridView, record, HTMLitem, index, e, eOpts){
    $('dashboardForm:violationIds').value = '[' + record.getId() + ']';
    $('dashboardForm:selectedPolicyViolationButton').click();
  }
});