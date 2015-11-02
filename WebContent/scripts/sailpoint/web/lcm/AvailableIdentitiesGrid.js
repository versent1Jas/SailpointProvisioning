/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.LCM.AvailableIdentitiesGrid', {
    extend : 'SailPoint.grid.PagingCheckboxGrid',
  
  isBulk : false,
  
  pageSize: 10,
  
  identityAttributes: [],
  
  filterValues: [],
  
  constructor : function(config){

    var fields = config.fields;
    
    this.isBulk = config.isBulk;
    this.identityAttributes = config.identityAttributes;
    this.filterValues = config.filterValues;

    config.store = SailPoint.Store.createRestStore({
        fields : fields,
        autoLoad : false,
        url : SailPoint.getRelativeUrl('/rest/identities/grid/{0}/managedIdentities'),
        storeId : config.id + '_store',
        sorters : [{property: 'name', direction: 'ASC' }],
        simpleSortMode : true,
        remoteSort : true,
        pageSize : this.pageSize
    });
    
    config.store.applyPathParams([SailPoint.Utils.encodeRestUriComponent(config.currentIdentity)]);
    
    config.store.on('load', function(store, records) {
      var toSelect = [];
      for(var i=0; i<records.length; i++) {
        if(records[i].get('IIQ_Selected')) {
          toSelect.push(records[i]);
        }        
      }
      this.getSelectionModel().select(toSelect);
    }, this);

    if(this.isBulk) {
      Ext.applyIf(config, {
        selModel: new SailPoint.grid.CheckboxSelectionModel({
          clickAll : true,
          listeners : { headerselectionchange: this.headerSelectionChange }
        }),
        listeners: { cellclick: this.clickIdentity }
      });
    } 
    else {
      Ext.applyIf(config, {
          selModel: new Ext.selection.RowModel(),
          listeners: { itemclick: this.clickSingleIdentity }
      });
    }
    
    var plugins = [this.initAdvSearchForm()];
    
    this.advSearchButton = new Ext.Action({
        text: '#{msgs.advanced_search}',
        scale: 'medium',
        enableToggle : true
    }); 
  
    Ext.applyIf(config, {
        cls : 'smallFontGrid selectableGrid',
        plugins:plugins,
        tbar: [
          {
            xtype : 'searchfield',
            id: 'AIDSF', // So Selenium can find the trigger
            store : config.store,
            paramName:'name',
            storeLimit:this.pageSize,
            emptyText:'#{msgs.label_filter_by_identity_name}',
            width:250
          },
          ' ', this.advSearchButton
        ],
        viewConfig: {
          scrollOffset: 1,
          stripeRows : true
        }
    });

    Ext.apply(this, config);
    this.callParent(arguments);
  },
  
  search : function(vals) {
    var valString = (Ext.JSON.encode(vals));
    $("editForm:filterString").value = valString;
    $("editForm:calculateFilterBtn").click();  
  },
  
  reset : function() {
    $("editForm:filterString").value = '';
    $("editForm:calculateFilterBtn").click();    
  },
  
  initComponent : function(){
    this.advSearchButton.setHandler( function(){
        this.fireEvent('toggleExpando', null);
    }, this);
    
    this.callParent(arguments);      
  },
  
  /** Click handler for the single identity request **/
  clickSingleIdentity : function(gridView, record) {
      $('editForm:identityId').value = record.getId();
      $('editForm:submitBtn').click();
  },
  
  clickIdentity : function(gridView, td, cellIndex, record, tr, rowIndex, e) {
    
      if(gridView.getSelectionModel().isSelected(record)) {
          if(cellIndex>0) {
              SailPoint.LCM.ChooseIdentities.removeIdentity( [record.getId()] );  
              gridView.getSelectionModel().selectWithEvent(record, e, true);          
          } else {
              SailPoint.LCM.ChooseIdentities.addIdentities( [record.getId()] );
          }
      } 
      else {
          if(cellIndex>0) {
              SailPoint.LCM.ChooseIdentities.addIdentities( [record.getId()] );
              gridView.getSelectionModel().selectWithEvent(record, e, true);
          } else{
              SailPoint.LCM.ChooseIdentities.removeIdentity(record.getId());
          }
      }
  },
  
  headerSelectionChange : function(model, selected, type) {
    var i,
    ids = [],
    count,
    store = this.getStore();
    
    if(type === 'selectPage') {
        for(i = 0, count = store.getCount(); i < count; i++) {
          ids.push(store.getAt(i).getId());
        }
      SailPoint.LCM.ChooseIdentities.addIdentities( ids );
    }
    else if(type === 'deselectPage') {
      for(i = 0, count = store.getCount(); i < count; i++) {
        ids.push(store.getAt(i).getId());
      }
      SailPoint.LCM.ChooseIdentities.removeIdentities( ids );
    }
    else if(type === 'selectAll') {
      $("editForm:identityIds").value = "";
      $("editForm:selectAllBtn").click();
    }
    else if(type === 'deselectAll') {
      $("editForm:deselectAllBtn").click();
    }
  },
  
  initAdvSearchForm : function(identity){

    var advSearchForm = new SailPoint.grid.GridExpandoPlugin({
      gridId : null,
      
      identityAttributes : this.identityAttributes,
      
      filterValues : this.filterValues,
      
      initExpandoPanel : function(grid){
      
        var leftAttributes = [],
        rightAttributes = [],
        i;
        
        for(i = 0; i < this.identityAttributes.length; i++) {
        
          var attr = this.identityAttributes[i];
          var searchFieldObj = SailPoint.LCM.Identity.BuildSearchElement(attr);
          var val = this.filterValues[attr.name];
          
          if(i%2 == 0) {
              leftAttributes.push(searchFieldObj);
          } else {
              rightAttributes.push(searchFieldObj);
          }          
        }
        
        var maxFields = 4; /** name/manager/application/role in left most panel **/
        if(leftAttributes.length > maxFields) {
          maxFields = leftAttributes.length;
        }
        
        var formHeight = 200 + ((maxFields - 3)) * 47;
              
        var searchForm = Ext.create('SailPoint.panel.Search', {
            id : grid.getId() + '-advSeachForm',
            gridId : grid.getId(),
            identityAttributes : this.identityAttributes,
            columns : [
                [{
                    xtype : 'form',
                    fieldDefaults : {labelAlign : 'top'},
                    border: false,
                    bodyBorder: false,
                    columnWidth :0.33,
                    bodyStyle: 'margin-left:15px;background-color:#EEEEEE',
                    items: [
                        {
                            xtype: 'identitySuggest',
                            id: 'suggest_name',
                            value: this.filterValues['name'],
                            anchor: '90%',
                            valueField: 'name',
                            fieldLabel: '#{msgs.displayable_name}',
                            baseParams: {
                                context: 'LcmPopulation'
                            },
                            listeners : { 
                                'specialkey': { fn: SailPoint.LCM.Identity.CaptureEnterKey }
                            }
                        },
                        {
                            xtype: 'identitySuggest',
                            id: 'suggest_manager',
                            value: this.filterValues['manager_name'],
                            anchor: '90%',
                            valueField: 'name',
                            fieldLabel: '#{msgs.manager}',
                            suggestType: 'manager',
                            baseParams: {
                                'type': 'manager',
                                context: 'LcmPopulationManager'
                            },
                            listeners : { 
                                'specialkey': { fn: SailPoint.LCM.Identity.CaptureEnterKey }
                            }
                        },
                        {
                            xtype: 'entertextfield', // this xtype listens for the enter key and fires a 'EnterKeyPressed' event
                            id: 'q_application',
                            value: this.filterValues['links_application_name'],
                            anchor: '90%',
                            fieldLabel: '#{msgs.application}',
                            listeners : { 
                                'specialkey': { fn: SailPoint.LCM.Identity.CaptureEnterKey }
                            }
                        },
                        {
                            xtype: 'entertextfield',
                            id: 'q_role',
                            value: this.filterValues['bundles_name'],
                            anchor: '90%',
                            fieldLabel: '#{msgs.role}',
                            listeners : { 
                                'specialkey': { fn: SailPoint.LCM.Identity.CaptureEnterKey }
                            }
                        }
                    ]
                }],
                [{
                  xtype : 'form',
                  fieldDefaults : {labelAlign : 'top'},
                  border:false,
                  bodyBorder:false,
                  columnWidth :0.33,
                  bodyStyle:'margin-left:15px;background-color:#EEEEEE',
                  items:leftAttributes
                }],
                [{
                  xtype : 'form',
                  fieldDefaults : {labelAlign : 'top'},
                  border:false,
                  bodyBorder:false,
                  columnWidth :0.33,
                  bodyStyle:'margin-left:15px;background-color:#EEEEEE',
                  items:rightAttributes
                }]
            ],
            
            doSearch : function(){
                var vals = {},
                i, qCmp, sCmp, attr;

                sCmp = Ext.getCmp('suggest_name');
                if(sCmp.getRawValue() !== "") {
                    vals.name = sCmp.getValue();
                }
                
                sCmp = Ext.getCmp('suggest_manager');
                if(sCmp.getRawValue() !== "") {
                    vals.manager_name = sCmp.getValue();
                }
                vals.links_application_name = Ext.getCmp('q_application').getValue();
                vals.bundles_name = Ext.getCmp('q_role').getValue();
                
                for(i = 0; i < this.identityAttributes.length; i++) {
                    attr = this.identityAttributes[i];
                    qCmp = Ext.getCmp('q_' + attr.name);
                    sCmp = Ext.getCmp('suggest_' + attr.name);
                    if(qCmp != null && qCmp.getRawValue() !== "") {
                        vals[attr.name] = qCmp.getValue();
                    } 
                    else if (sCmp != null && sCmp.getRawValue() !== "") {
                        vals[attr.name] = sCmp.getValue();
                    }
                }
                
                this.fireEvent('search', vals);
            },
            
            doReset : function(){
               this.resetRecursive(this);
               this.fireEvent('reset');
            }
        });
        
        searchForm.addEvents('reset', 'search');

        searchForm.on('reset', function(){
            this.reset();
            this.search({});
        }, grid);

        searchForm.on('search', function(values){
            this.search(values);
        }, grid);
        
        searchForm.on('EnterKeyPressed', function(values){
            this.search(values);
        }, grid);

        return searchForm;
      }
    });

    return advSearchForm;
  }
});

Ext.define('SailPoint.LCM.Identity', {
    statics : {
        BuildSearchElement : function(attr) {
            if (attr.type != null && (attr.type).indexOf("Identity") > -1) {
                return {
                    xtype : 'identitySuggest',
                    id : 'suggest_' + attr.name,
                    rawValue : attr.value,
                    value : attr.valueId,
                    anchor : '90%',
                    valueField : 'id',
                    fieldLabel : attr.displayName,
                    listeners : { 
                        'specialkey': { fn: SailPoint.LCM.Identity.CaptureEnterKey }
                    }
                };
            }

            return {
                xtype : "textfield",
                fieldLabel : attr.displayName,
                id : 'q_' + attr.name,
                anchor : '90%',
                listeners : { 
                    'specialkey': { fn: SailPoint.LCM.Identity.CaptureEnterKey }
                }               
            };
        },
        
        // prevents the ENTER key from causing a form submission 
        // that returns the user to the dashboard
        CaptureEnterKey : function(field, e) {
            if (e.getKey() == e.ENTER) {
                // preserve the KeyNav functionality of combo boxes, which
                // gets interrupted by the specialkey listener
                if (field.getXType() == 'identitySuggest') {
                    if (field.isExpanded) {
                        field.fireEvent('select');
                        e.preventDefault();
                        return;
                    }
                }
                
                e.preventDefault();
                Ext.getCmp('gridSearchBtn').fireEvent('click');
            }
        }
    }
});