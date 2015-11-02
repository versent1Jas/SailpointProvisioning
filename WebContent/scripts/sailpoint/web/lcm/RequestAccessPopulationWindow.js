Ext.define('SailPoint.LCM.RequestAccessPopulationWindow', {
  extend : 'Ext.window.Window',
  
  grid: null,
  store: null,
  toggleMatchedButton: null,
  queryParam : null,
  objectId: null,
  
  constructor : function(config){    
    this.grid = this.createGrid(config);
    
    this.toggleMatchedButton = new Ext.Button({
      id:'match',
      text:'#{msgs.mining_show_unmatched_identities}',
      iconCls:'groupDeleteIcon',
      handler:function(){
          var win = Ext.getCmp('populationWindow');
          
          store = win.grid.store;
          if (!store.showNonMatched){
              this.setText('#{msgs.mining_show_matched_identities}');
              this.setIconCls('groupAddIcon');
          } else {
              this.setText('#{msgs.mining_show_unmatched_identities}');
              this.setIconCls('groupDeleteIcon');
          }
          store.showNonMatched = !store.showNonMatched;
          win.filterAndLoad();         
      }
   });
    
    Ext.apply(config, {
        title: '#{msgs.population}',
        id: 'populationWindow',
        layout:'fit',
        width:768,
        height:450,
        modal:true,
        closeAction: 'hide',
        items : [this.grid],
        buttons: [
          {
            text:'#{msgs.button_close}', cls : 'secondaryBtn', window: this, handler: function() {
              Ext.getCmp('populationWindow').hide(); 
            } 
          }
        ],
        tbar: [this.toggleMatchedButton]
    });
    Ext.apply(this, config);    
    this.callParent(arguments);
  },
  
  filterAndLoad : function() {

    var extraParams = this.getFilterParams();
    Ext.applyIf(extraParams, {
        colKey : 'lcmPopulationSearchGridColumns',
        showNonMatched : this.store.showNonMatched
    });

    extraParams[this.queryParam] = this.objectId;

    this.store.getProxy().extraParams = extraParams;
    this.store.loadPage(1);
  },
  
  showIdentities : function(queryparam, id, name) {
    this.setTitle(Ext.String.format("#{msgs.lcm_request_access_population_title}", name));

    this.store.showNonMatched = false;
    this.toggleMatchedButton.show();
    this.toggleMatchedButton.setText('#{msgs.mining_show_unmatched_identities}');
    this.toggleMatchedButton.setIconCls('groupDeleteIcon');
    
    this.objectId = id;
    this.queryParam = queryparam;
    this.filterAndLoad();
    this.show();
  },
  
  showAllIdentities : function() {
    this.setTitle('#{msgs.population}');

    var extraParams = {
        colKey : 'lcmPopulationSearchGridColumns',
        showNonMatched : false
    };
    
    this.toggleMatchedButton.hide();
    this.store.getProxy().extraParams['showAll'] = false;
    this.store.getProxy().extraParams['roleId'] = null;
    this.store.getProxy().extraParams['entitlementId'] = null;
    this.store.loadPage(1);
    this.show();
  },

  showFilteredPopulation: function() {
      this.setTitle('#{msgs.population}');

      var extraParams = this.getFilterParams();
      Ext.applyIf(extraParams, {
          colKey : 'lcmPopulationSearchGridColumns',
          showNonMatched : false,
          showAll: false,
          roleId: null,
          entitlementId: null
      });

      this.toggleMatchedButton.hide();

      this.store.getProxy().extraParams = extraParams;
      this.store.loadPage(1);

      this.show();
  },

  getFilterParams: function() {
      var extraParams = {},
          requestAccessFilterPanel;

      requestAccessFilterPanel = Ext.getCmp('requestAccessFilterPanel');
      if (requestAccessFilterPanel) {
          for (var attrname in requestAccessFilterPanel.filters) {
              if (requestAccessFilterPanel.filters.hasOwnProperty(attrname)) {
                  extraParams[attrname] = requestAccessFilterPanel.filters[attrname];
              }
          }
      }

      return extraParams;
  },
  
  createGrid: function(config) {
    var extraParams = {
        colKey : 'lcmPopulationSearchGridColumns',
        showNonMatched : false
    };
    
    this.store = SailPoint.Store.createRestStore({
      fields: config.gridMetaData.fields,
      url: SailPoint.getRelativeUrl('/rest/identities/grid/filtered'),
      sorters : [{property: 'scorecard.totalViolations', direction: 'DESC' }],
      remoteSort: true,
      pageSize:10,
      extraParams : extraParams
    });
  
    this.grid = new SailPoint.grid.PagingGrid({
      cls: 'smallFontGrid wrappingGrid',
      store: this.store,
      id: 'populationGrid',
      disableMouseTracking: true,
      columns: config.gridMetaData.columns,
      viewConfig: {
        scrollOffset: 0,
        stripeRows: true
      }
    });
    
    return this.grid;
  }
});