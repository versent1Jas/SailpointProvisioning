/**
 * An object that manages all of the various panels/fields that provide filtering ability for the request
 * access grid.  This was built as an object rather than a container so we don't have to keep track of all
 * the nested panels and layout issues that that drive me crazy.
 */

Ext.define('SailPoint.LCM.RequestAccessRoleFilterPanel', {
  extend : 'Ext.form.Panel',
  alias : 'widget.sprequestaccessrolefilterpanel',

  /** A map that contains list of searchable attributes for roles/entitlements/identities **/
  attributeMap : null,

  /** The id of the grid that is associated with the filter panel **/
  listId: '',

  /** The request access list component **/
  parent: null,

  initComponent : function(){

    this.leftAttributeFields = [];
    this.centerAttributeFields = [];
    this.rightAttributeFields = [];

    Ext.define('RoleType', {
      extend: 'Ext.data.Model',
      fields: [
               {type: 'string', name: 'displayName'},
               {type: 'string', name: 'name'}
               ]
    });

    this.roleTypeCombo = new Ext.form.ComboBox({

      displayField: 'displayName',   
      valueField: 'name',     
      editable: false,
      typeAhead: false,
      queryMode: 'local',
      fieldLabel: '#{msgs.label_type}',
      labelAlign: 'top',
      id: 'q_type',
      store: Ext.create('Ext.data.Store', {
        autoDestroy: true,
        model: 'RoleType',
        data: this.roleTypes
      }),
      anchor:'95%',
      listeners:{
        change:function(f, n, o) {
          if(n == ""){
            f.clearValue();
          }
        }
      }
    });

    this.leftAttributeFields.push(this.roleTypeCombo);

    for(var i=0; i < this.attributeMap.roleAttributes.length; i++) {
      var attr = this.attributeMap.roleAttributes[i];
      var searchFieldObj = SailPoint.LCM.BuildSearchElement(attr, false, this.ruleData,'role_');

      // us710 - attribute value is set appropriately via deepLink only if filterFlag is set rolefilter 
      // and deep filters contains some value
      if (filterFlags['roleFilter']) {
          searchFieldObj.value = SailPoint.LCM.RequestAccess.getAttributeSearchValue(attr, 'q_');
      }

      searchFieldObj = Ext.widget(searchFieldObj);
      SailPoint.mobile.Support.addMobileSupport(searchFieldObj, 'requestAccessPanel');

      if(i%3==0) {
        this.centerAttributeFields.push(searchFieldObj);
      } else if(i%3==1) {
        this.rightAttributeFields.push(searchFieldObj);
      } else {
        this.leftAttributeFields.push(searchFieldObj);
      }
    }

    Ext.apply(this, {
      header: false,
      objectType: SailPoint.LCM.RequestAccess.OBJECT_TYPE_ROLE, /** used to trigger the grid which objects to show **/
      items: [{
        xtype:'container',
        anchor:'100%',
        layout:'hbox',
        items:[{
          xtype:'container',
          flex:1,
          layout:'anchor',
          items: this.leftAttributeFields
        },{
          xtype:'container',
          flex:1,
          layout:'anchor',
          items: this.centerAttributeFields
        },{
          xtype:'container',
          flex:1,
          layout:'anchor',
          items: this.rightAttributeFields
        }]
      }],
      fieldDefaults: {
        labelAlign: 'left',
        labelWidth: 150
      },
      buttons: [{
        text: "#{msgs.label_filter}",
        panel: this,
        handler: function(button) {
          this.panel.applySearch();
        }
      },{
        text: "#{msgs.button_reset}",
        cls : 'secondaryBtn',
        panel: this,
        handler: function(button) {
          this.panel.clearSearch(true);
        }
      }]
    });    
    
    this.on('afterrender', function() {
        var header = this.child('header');
        if (header) {
            header.setSize(0, 0);
        }
    });

    this.callParent();    
  },

  applySearch : function(filters) {   
    /** Apply roles tab filters **/
    filters = SailPoint.LCM.ApplySearchAttributes(this.attributeMap.roleAttributes,"role_");
    filters.q_type = this.roleTypeCombo.getValue();
    this.parent.runSearch(filters);
  },

  clearSearch: function(doSearch) {    
    this.roleTypeCombo.setValue('');
    SailPoint.LCM.ClearSearchAttributes(this.attributeMap.roleAttributes, 'role_');

    this.parent.clearFilters();
    if (doSearch) {
      this.parent.runSearch({});
    }
  }
});