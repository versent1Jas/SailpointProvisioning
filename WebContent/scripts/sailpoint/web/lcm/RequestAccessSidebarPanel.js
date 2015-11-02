/**
 * An object that manages all of the various panels/fields that provide filtering ability for the request
 * access grid.  This was built as an object rather than a container so we don't have to keep track of all
 * the nested panels and layout issues that that drive me crazy.
 */

Ext.define('SailPoint.LCM.RequestAccessSidebarPanel', {
  extend : 'Ext.panel.Panel',
  alias : 'widget.sprequestaccesssidebarpanel',

  /** A map that contains list of searchable attributes for roles/entitlements/identities **/
  attributeMap : null,

  identityPanel : null,

  populationPanel : null,

  allowRoles : false,

  allowEntitlements : false,

  filters : {},

  /** The id of the grid that is associated with the filter panel **/
  listId: '',

  initComponent : function() {

    Ext.apply(this, {
      plain: true,
      layout:'accordion',
      collapsed: true,
      collapseMode: 'mini',
      animCollapse: false
    });

    // trick to make it looks like all panels are collapsed by default
    var items = [{
      xtype: 'panel',
      id: 'hiddenFilterPanel',
      collapsed: false,
      hidden: true
    }];

    if (this.allowPopulationSearch) {
      this.populationPanel = new SailPoint.LCM.RequestAccessFilterPopulationPanel({
        id: 'filterPopulationPanel',
        attributeMap: this.attributeMap,
        parent: this,
        autoScroll:true
      });

      items.push(this.populationPanel);
    }

    if (this.allowIdentitySearch) {
      this.identityPanel = new SailPoint.LCM.RequestAccessFilterIdentityPanel({
        id: 'filterIdentityPanel',
        parent: this,
        autoScroll: true,
        id: 'requestAccessIdentitySearch'
      });

      items.push(this.identityPanel);
    }

    this.items = items;

    this.on('collapse', function(panel) {
      this.items.each(function(item) {
        if (!item.hidden && !item.getCollapsed()) {
          item.clearSearch();

          return false;
        }  

        return true;
      });

      var searchBtn = Ext.get('search_btn');

      Ext.getCmp('searchField').enable().focus();
      searchBtn.removeCls('disabled');
      searchBtn.dom.disabled = false;
    }, this);

    this.on('expand', function(panel) {
      var searchFieldCmp = Ext.getCmp('searchField');
      var searchBtn = Ext.get('search_btn');
      var currentVal = searchFieldCmp.getValue();

      searchFieldCmp.disable().setValue('');
      if (currentVal.length > 0) {
        searchBtn.dom.click();
      }

      searchBtn.addCls('disabled');
      searchBtn.dom.disabled = true;

      this.clearSearch();
    }, this);

    this.callParent();
  },

  /** Removes the specific filters for each of the attributes in the list **/
  removeSearchAttributes : function(attributes) {
    if(!attributes) {
      return;
    }
    // Loop through all extended attributes and add to search.
    for(var i=0; i < attributes.length; i++) {
      var attr = attributes[i];
      delete this.filters['q_'+attr.prefix+attr.name+".id"];
      delete this.filters['q_'+attr.prefix+attr.name];
      delete this.filters['date_'+attr.name];
    }
  },

  /** Clears the store/filter/and filter fields on the page and reruns the search **/
  clearSearch : function() {
    this.filters = {};
    Ext.getCmp(this.listId).runSearch(this.filters);
  },

  /** Applies the fields on the search panel to the filters **/
  applySearch : function() {        
    Ext.getCmp(this.listId).runSearch(this.filters);
  },

  /** Performs an ajax request to determine how many roles and entitlements match the criteria being searched **/
  getCounts : function() {
    var list = Ext.getCmp(this.listId);
    if(list) {
      Ext.Ajax.request({
        method: 'GET',
        url: SailPoint.getRelativeUrl('/rest/requestAccess/count'),
        success: function(response) {
          var respObj = Ext.decode(response.responseText); 

          var rolePanel = Ext.getCmp('rolePanel');
          if (rolePanel) {
            rolePanel.setTitle('#{msgs.roles} (' + respObj.role + ')');
          }

          var entitlementPanel = Ext.getCmp('entitlementPanel');
          if (entitlementPanel) {
            entitlementPanel.setTitle('#{msgs.entitlements} (' + respObj.entitlement + ')');
          }
        },
        params: list.store.proxy.extraParams,
        scope: this
      });
    }
  }
});



Ext.define('SailPoint.LCM.RequestAccessFilterIdentityPanel', {
  extend : 'Ext.form.Panel',
  attributeMap : null,
  identityAttributeFields : [],

  initComponent : function(){
    var identityMultiSuggest;

    Ext.apply(this, {
      title: "#{msgs.lcm_request_access_filter_identities}",
      collapsible: true,
      bodyStyle: 'padding: 10px',
      bodyCls:'no-border',
      collapsed: true,
      id: 'fltrIdentityPanel',
      fieldDefaults: {
        labelAlign: 'top',
        labelWidth: 100
      },
      buttons : [{
        text: "#{msgs.label_search}",
        identityPanel: this,
        margin: '10 0',
        handler: function(button) {
          button.identityPanel.applySearch();
        }
      },{
        text: "#{msgs.button_reset}",
        cls : 'secondaryBtn',
        identityPanel: this,
        margin: '10',
        handler: function(button) {
          button.identityPanel.clearSearch();
        }
      }]
    });

    identityMultiSuggest = Ext.widget({
        xtype: 'multiSuggest',
        id: 'populationSearchGridExpandoIdentityMultiSuggest',
        suggestType: 'identity',
        baseParams: { context: 'LcmPopulation' },
        width:280
    });
    SailPoint.mobile.Support.addMobileSupport(identityMultiSuggest, 'requestAccessPanel');

    this.items = [{
      xtype:'component',
      autoEl: {
        tag: 'div',
        html: '<p class="helper">#{help.help_lcm_request_access_identity_help}</p>'
      }
    },{
      xtype:'label',
      text: '#{msgs.identities}'
    },
    identityMultiSuggest, {
      xtype:'component',
      id:'requestAccessIdentityHighRiskWarning',
      autoEl: {
        tag: 'div',
        html: '<p class="formWarn">#{msgs.lcm_request_role_high_risk_tip}</p><p style="text-align:right"><a href="javascript:populationWindow.showFilteredPopulation()">#{msgs.show_population}</a></p> '
      }
    }];

    this.callParent();
  },

  clearSearch : function() {  
    Ext.getCmp('populationSearchGridExpandoIdentityMultiSuggest').clear();   
    this.parent.clearSearch();
  },

  applySearch : function() {    
    this.parent.filters = {
      identityIds: Ext.getCmp('populationSearchGridExpandoIdentityMultiSuggest').getCsvValue()
    };

    // always sort by population
    this.parent.filters.sort = 'IIQ_population';
    this.parent.filters.dir = 'desc';

    this.parent.applySearch();
  }
});



Ext.define('SailPoint.LCM.RequestAccessFilterPopulationPanel', {
  extend : 'Ext.form.Panel',
  attributeMap : null,
  identityAttributeFields : [],
  checkboxes : [],

  initComponent : function(){

    Ext.apply(this, {
      title: "#{msgs.lcm_request_access_filter_population}",
      collapsible: true,
      bodyStyle: 'padding: 10px',
      bodyCls:'no-border',
      collapsed: true,
      id: 'fltrPopulationPanel',
      fieldDefaults: {
        labelAlign: 'top',
        labelWidth: 100
      },
    buttons : [{
        text: "#{msgs.label_search}",
        populationPanel: this,
        margin: '10 0',
        handler: function(button) {
          button.populationPanel.applySearch();
        }
      },{
        text: "#{msgs.button_reset}",
        cls : 'secondaryBtn',
        populationPanel: this,
        margin: '10',
        handler: function(button) {
          button.populationPanel.clearSearch();
        }
      }]
    });

    var changeFn = function(checkbox, newValue){
      Ext.getCmp(checkbox.searchFieldId).setDisabled(!newValue);
    };

    var searchRows = [];

    for(var i=0; i < this.attributeMap.identityAttributes.length; i++) {
      var attr = this.attributeMap.identityAttributes[i];
      var searchFieldObj = SailPoint.LCM.BuildSearchElement(attr, true, this.ruleData);

      // us710 - attribute value via deepLink is set appropriately only if filterFlag is set to searchByPopulation 
      // and deep filters contains some value
      // default value for attributes displayed in User based Population search will be displayed properly
      if (filterFlags['searchByPopulation']) {
          searchFieldObj.value = SailPoint.LCM.RequestAccess.getAttributeSearchValue(attr, 
              'q_Identity.');
      }

      searchFieldObj.disabled = true;
      searchFieldObj.flex = 0.9;

      searchFieldObj = Ext.widget(searchFieldObj);
      SailPoint.mobile.Support.addMobileSupport(searchFieldObj, 'requestAccessPanel');

      this.checkboxes.push({
        xtype:'checkbox',
        style:'height:50px',
        id: searchFieldObj.id+'_check',
        searchFieldId : searchFieldObj.id,
        listeners:{
          'change':{
            fn:changeFn, scope:this
          }
        },
        flex: 0.1
      });

      this.identityAttributeFields.push(searchFieldObj);
      searchRows.push({
        xtype:'container',
        anchor: '100%',
        layout: 'hbox',
        defaults: {
          margin: '0 10 10 0'
        },
        items: [this.checkboxes[i], searchFieldObj]
      });
    };

    this.items = [{
      xtype:'component',
      autoEl: {
        tag: 'div',
        html: '<p class="helper">#{help.help_lcm_request_access_population_help}</p>'
      }
    },{
      xtype:'container',
      anchor: '100%',
      layout: 'anchor',
      items: searchRows
    },{
      xtype:'component',
      id:'requestAccessPopulationHighRiskWarning',
      autoEl: {
        tag: 'div',
        html: '<p class="formWarn">#{msgs.lcm_request_role_high_risk_tip}</p><p style="text-align:right"><a href="javascript:populationWindow.showFilteredPopulation()">#{msgs.show_population}</a></p> '
      }
    }];

    this.callParent();
  },

  clearSearch : function() {

    for(var i=0; i< this.identityAttributeFields.length; i++) {
      var field = Ext.getCmp(this.identityAttributeFields[i].id);

      /** if this is a field**/
      if(field.setValue) {

        for(var j=0; j<this.attributeMap.identityAttributes.length; j++) {
          var attr = this.attributeMap.identityAttributes[j];
          if(field.name && field.name==attr.name) {

            /** If the field has a valueId, it's an identity suggest that has a display name and an id **/
            if(attr.valueId) {

              var val = Ext.create('SailPoint.model.IdentitySuggest', {
                id : attr.valueId,
                displayableName: attr.value
              });

              field.setValue(val);
            } else {
              field.setValue(attr.value);                      
            }
          }
        }
      }

      var checkbox = Ext.getCmp(this.identityAttributeFields[i].id+'_check');
      if(checkbox) {
        checkbox.setValue(false);
      }
    }
    this.parent.clearSearch();
  },

  applySearch : function() {    
    this.parent.filters = SailPoint.LCM.ApplySearchAttributes(this.attributeMap.identityAttributes);    

    // always sort by population
    this.parent.filters.sort = 'IIQ_population';
    this.parent.filters.dir = 'desc';

    this.parent.applySearch();
  }
});

/** Looks for search fields based on the passed in attributes and clears them **/
SailPoint.LCM.ClearSearchAttributes = function(attributes, prefix) {
  
  if(!prefix)
    prefix = "";
  
  var i, cmp;
  for(i=0; i < attributes.length; i++) {
    var attr = attributes[i];

    if(attr.type != "Date") {
      cmp = Ext.getCmp('q_'+prefix+attr.name);         
      /** Try it as a suggest if not found **/
      if(!cmp) {
        cmp = Ext.getCmp('suggest_'+prefix+attr.name);
      }         
      if(cmp) {
        cmp.setValue('');
      }
    } else if(attr.type == "Date") {
      cmp = Ext.getCmp('date_'+prefix+attr.name);
      cmp.setValue('');
    }
  }
};

/** Applies the various search attributes to the filter object hanging on the filter panel **/
SailPoint.LCM.ApplySearchAttributes = function(attributes, prefix) {  
  if(!attributes) {
    return;
  }
  
  if(!prefix)
    prefix = "";

  var filters = {};

  // Loop through all extended attributes and add to search.
  var i, cmp;
  for(i=0; i < attributes.length; i++) {
    var attr = attributes[i];

    if(attr.type != "Date") {
      cmp = Ext.getCmp('q_'+prefix+attr.name);

      /** Try it as a suggest if not found **/
      if(!cmp) {
        cmp = Ext.getCmp('suggest_'+prefix+attr.name);
      }

      if(cmp && cmp.getValue() && !cmp.isDisabled()) {
        /** If it is an identity search, we need to append the id onto the end **/
        if(attr.type=='Identity') {
          var identKey = 'q_' + attr.prefix + attr.name;
          if (attr.name !== 'identAttr') {
            identKey += '.id';
          }
          
          filters[identKey] = cmp.getValue();       
        } else {
          filters['q_'+attr.prefix+attr.name] = cmp.getValue();
        }
      }
    } else if(attr.type == "Date") {
      cmp = Ext.getCmp('date_'+prefix+attr.name);
      if(cmp.getValue() && cmp.getValue() != "" && !cmp.disabled) {
        // getValue() returns a js Date object.
        var start = cmp.getValue();
        
        var end = new Date(start);
        end.setHours(23);
        end.setMinutes(59);
        end.setSeconds(59);

        // This value (startlong|endlong) is parsed in RoleListResource.java to generate two filters
        // of GE and LE to encompass the entire day of the date.
        filters['date_'+attr.name] = (Ext.Date.format(start, 'U') * 1000) + "|" + (Ext.Date.format(end, 'U') * 1000);
      } else {
        filters['date_'+attr.name] = ""; // Clear out old value
      }
    }
  }
  return filters;
};

/*
 * Builds a config object based on the type of role attribute passed in
 */
SailPoint.LCM.BuildSearchElement = function(attr, popSearch, ruleData, prefix) {
  if(!prefix)
    prefix = '';
  
  var type = "entertextfield"; // this xtype listens for the enter key and fires a 'EnterKeyPressed' event
  var datastore;
  //console.debug(attr.displayName + ' name: ' + attr.name + ' type: ' + attr.type);
  if(attr.type == "String" && attr.allowed != null) {
    type = "combo";
    datastore = new Ext.data.ArrayStore({
      fields: ['displayText', 'dataText'],
      data: Ext.JSON.decode(attr.allowed),
      autoLoad: false
    });
  }
  if(attr.type == "Boolean") {
    type = "combo";
    datastore = new Ext.data.ArrayStore({
      fields: ['displayText', 'dataText'],
      data: [['True', 'true'], ['False', 'false']],
      autoLoad: false
    });
  }
  if(attr.type == "Rule") {
    type = "combo";
    datastore = new Ext.data.ArrayStore({
      fields: ['displayText', 'dataText'],
      data: ruleData,
      autoLoad: false
    });
  }

  if(type == "combo"){
    return {
      xtype: type,
      displayField: 'displayText',   // what the user sees in the popup
      valueField: 'dataText',     // what is passed to the 'change' event
      editable: false,
      typeAhead: false,
      queryMode: 'local',
      fieldLabel: attr.displayName,
      id: 'q_'+prefix+attr.name,
      name : attr.name,
      store: datastore,
      anchor:'95%',
      listeners:{
        change:function(f, n, o) {
          if(n == ""){
            f.clearValue();
          }
        }
      }
    };
  }

  // Anything else besides a combo box below here
  if(attr.type == "Date"){
    type = "datefield";
    return {
      xtype: type,
      fieldLabel: attr.displayName,
      id: 'date_'+prefix+attr.name,
      anchor:'95%',
      name : attr.name,
      listeners:{
        change:function(f, n, o) {
          if(n == ""){
            f.setValue('');
          }
        }
      }
    };
  }

  var valueFieldName = "name";

  if(popSearch) {
    valueFieldName = "id";
  }
  if(attr.type == 'Identity') {
    var val = Ext.create('SailPoint.model.IdentitySuggest', {
      id : attr.valueId,
      displayableName: attr.value
    });
    if(attr.name == 'manager') {
      return {
        xtype: 'identitySuggest',
        id: 'suggest_' +prefix+ attr.name,
        suggestType: 'manager',
        value: val,
        anchor: '95%',
        name : attr.name,
        fieldLabel: attr.displayName,
        valueField: valueFieldName,
        displayField: 'displayableName',
        initialData: jsonFilterPopulationManager,
        baseParams: {
          'type': 'manager',
          context: 'LcmPopulationManager'
        }
      };
    } 
    else {
      return {
        xtype: 'identitySuggest',
        id: 'suggest_' +prefix+ attr.name,
        value: val,
        anchor: '95%',
        name : attr.name,
        valueField: valueFieldName,
        fieldLabel: attr.displayName
      };
    }
  }

  // Population searches have different requirements for search fields.
  if(popSearch) {
    /** Do suggests **/
    if(attr.type == "String") {
      type = "distinctRestSuggest";

      return {
        xtype: type,
        id: 'suggest_'+prefix+attr.name,
        fieldLabel: attr.displayName,
        valueField: 'displayName',
        freeText: true,
        isLCM: true,
        name : attr.name,
        className: 'Identity',
        column: attr.name,
        value: attr.value,
        anchor:'95%'
      };
    }
  }

  if(attr.type == "Integer") {
    type = "numberfield";
  }

  return {
    xtype: type,
    fieldLabel: attr.displayName,
    id: 'q_'+prefix+attr.name,
    anchor: '95%',
    name : attr.name,
    hideTrigger : type === 'numberfield' ? true : false,
    listeners: {
      change: function(f, n, o) {
        if(n == ""){
          f.setValue('');
        }
      }
    }
  };
};