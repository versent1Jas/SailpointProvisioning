/* (c) Copyright 2010 SailPoint Technologies, Inc., All Rights Reserved. */
Ext.namespace('SailPoint', 'SailPoint.roles');

SailPoint.roles.viewGroupPopulation = function (record, totalIdentities) {

  var identifier = record.get("identifier");
  var exactMatches = record.get("exactMatches");
  var allMatches = record.get("allMatches");
  var resultId = Ext.getCmp('itRoleMiningResultsPanel').getStore().getProxy().extraParams['ITRoleMiningTaskResults'];
  
  var popWindow = Ext.getCmp('roleMiningPopulationWindow');
  var gridWidth = Ext.getCmp('itRoleMiningResultsPanel').getWidth();
  if (!popWindow) {
    popWindow = new SailPoint.roles.RoleMiningPopulationWindow({
        id:'roleMiningPopulationWindow',
        width: gridWidth
    });
  }
  
  popWindow.exactMatches = exactMatches;
  popWindow.allMatches = allMatches;
  popWindow.resultId = resultId;
  popWindow.identifier = identifier;
  popWindow.totalIdentities = totalIdentities;
  popWindow.show();
};

Ext.define('SailPoint.roles.RoleMiningPopulationWindow', {
    extend : 'Ext.Window',
  identifier : null,  
  resultId : null,
  
  initComponent : function(config) {
  
    Ext.apply(this, {
      closeAction:'hide',
      autoScroll:true,
      layout:'fit',
      plain:true,
      title: ' '
    });    
    
    var comboStore = [[0,'#{msgs.role_mining_view_population_match}'], [1,'#{msgs.role_mining_view_population_match_exclusive}']];

    this.combo =new Ext.form.ComboBox({
      store:comboStore, 
      width:200,
      panel:this,
      value: 0
    });
    
    this.combo.on('select', function(combo, record) {    
      combo.panel.store.getProxy().extraParams['ITRoleMiningPopMatchType'] = combo.getValue();
      combo.panel.store.load();
      this.updateStatus();
    }, this);

    var gridState = Ext.JSON.decode($('miningPopulationGridState').value);
    
    var sp = new SailPoint.state.StateProvider({
      stateIds: [gridState.name],
      states:   [gridState.state]
    });
    Ext.state.Manager.setProvider(sp);
    
    var colConfig = Ext.JSON.decode($('miningPopulationGridConfig').value);
    
    this.store = SailPoint.Store.createStore({
      storeId: 'roleMiningPopulationGridStore',
      url: CONTEXT_PATH + '/define/roles/roleMining/viewITRoleMiningPopulationDataSource.json',
      root: 'objects',
      totalProperty: 'count',
      fields: colConfig.fields,
      remoteSort: true,
      autoLoad: false,
      sorters:[{property: 'name', direction: 'ASC' }]
    });
    
    this.grid = new SailPoint.grid.PagingGrid({
      id: 'roleMiningPopulationGrid',
      cls: 'smallFontGrid',
      stateId: gridState.name,
      stateful: true,
      columns:colConfig.columns,
      store: this.store,
      viewConfig : {
          stripeRows: true
      },
      pageSize: 25,
      width:750,
      height:500,
      tbar: [
        this.combo,
        {xtype:'box', autoEl:{tag: 'div'}, style:'width:10px'},
        {xtype:'label', text:'Hello', id:'roleMiningPopulationGridStatus'}
      ]
    });
    
    gridState = new SailPoint.GridState(gridState);
    
    this.items = [this.grid]; 
    
    this.on('beforeshow', function() {
      this.load();
      this.center();
    });
    
    SailPoint.roles.RoleMiningPopulationWindow.superclass.initComponent.apply(this);
  },
  
  updateStatus: function() {
    var status = '';
    if(this.combo.getValue()==1) {
      var parts = this.exactMatches.split(" ");
      status = " : "+parts[0]+"/"+this.totalIdentities+" "+parts[1];
    } else {
      var parts = this.allMatches.split(" ");
      status = " : "+parts[0]+"/"+this.totalIdentities+" "+parts[1];
    }
    Ext.getCmp('roleMiningPopulationGridStatus').setText(status);
  },
  
  load : function() {
    this.setTitle(Ext.String.format("#{msgs.role_mining_view_population_title} ",this.identifier));
    this.store.getProxy().extraParams['ITRoleMiningPopTaskResult'] = this.resultId;
    this.store.getProxy().extraParams['ITRoleMiningPopIdentifier'] = this.identifier;
    this.store.load();
    this.updateStatus();
  }
});