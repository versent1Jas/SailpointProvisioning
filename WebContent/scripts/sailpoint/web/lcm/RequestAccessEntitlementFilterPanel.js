/**
 * An object that manages all of the various panels/fields that provide filtering ability for the request
 * access grid.  This was built as an object rather than a container so we don't have to keep track of all
 * the nested panels and layout issues that that drive me crazy.
 */

Ext.define('SailPoint.LCM.RequestAccessEntitlementFilterPanel', {
  extend : 'Ext.form.Panel',
  alias : 'widget.sprequestaccessentitlementfilterpanel',

  /** A map that contains list of searchable attributes for roles/entitlements/identities **/
  attributeMap : null,

  /** The id of the grid that is associated with the filter panel **/
  listId: '',

  applicationMultiSuggest : null,
  entitlementSuggest : null,
  ownerSuggest : null,
  attributeMultiSuggest : null,

  currentIdentity : null,

  /** The request access list component **/
  parent: null,

  initComponent : function(){

    this.leftAttributeFields = [];
    this.centerAttributeFields = [];
    this.rightAttributeFields = [];

    this.leftAttributeFields.push({
      xtype: 'label',
      forId: 'applicationMultiSuggest',
      text: '#{msgs.applications}:',
      style: 'display:block'
    });

    this.applicationMultiSuggest = new SailPoint.MultiSuggest({
      id: 'applicationMultiSuggest',
      fieldLabel: '#{msgs.applications}',
      isFormField: true, // Required to render label
      suggestType: 'lcmApplication',
      baseParams: {
        showRequestable: true,
        identityId: this.currentIdentity
      },
      width: 225,
      listHeight: 80,
      margin: '0 0 15 0'
    });

    /** TO DO **/
    this.applicationMultiSuggest.on('addSelection', this.applicationAdded, this);
    this.applicationMultiSuggest.on('removeSelection', this.applicationRemoved, this);

    this.leftAttributeFields.push(this.applicationMultiSuggest);

    this.entitlementSuggest = new SailPoint.ManagedAttributeSuggest({
      id: 'entitlementSuggest',
      fieldLabel: '#{msgs.entitlement}',
      requesteeId: this.currentIdentity,
      lcm: true,
      forceSelection: false,
      valueField: 'displayValue'
    });
    this.rightAttributeFields.push(this.entitlementSuggest);

    // We supply the suggest for this MultiSuggest because it is special.

    this.attrSuggest = new SailPoint.ManagedAttributeNameSuggest({
      requesteeId: this.currentIdentity,
      lcm: true
    });

    this.attributeMultiSuggest = new SailPoint.MultiSuggest({
      id: 'attributeSelector',
      fieldLabel: '#{msgs.attributes}',
      isFormField: true, // Required to render label
      suggest: this.attrSuggest,
      allowBlank: true,
      width: 225,
      listHeight: 80
    });

    /** TO DO **/
    this.attributeMultiSuggest.on('addSelection', this.attributeAdded, this);
    this.attributeMultiSuggest.on('removeSelection', this.attributeRemoved, this);

    this.centerAttributeFields.push({
      xtype: 'label',
      forId: 'attributeSelector',
      text: '#{msgs.attributes}:'
    });
    this.centerAttributeFields.push(this.attributeMultiSuggest);    

    this.ownerSuggest = new SailPoint.IdentitySuggest({
      id: 'requestEntitlementsEntitlementOwnerSuggest',
      context: 'EntitlementOwner',
      fieldLabel: '#{msgs.owner}',
      initialData: jsonFilterEntitlementOwnerIdentity
    });

    this.rightAttributeFields.push(this.ownerSuggest);

    for(var i=0; i < this.attributeMap.entitlementAttributes.length; i++) {
      var attr = this.attributeMap.entitlementAttributes[i];
      var searchFieldObj = SailPoint.LCM.BuildSearchElement(attr, false, this.ruleData,'ent_');

      // us710 - attribute value is set appropriately via deepLink only if filterFlag is set entitlementFilter 
      // and deep filters contains some value
      if (filterFlags['entitlementFilter'] ) {
          searchFieldObj.value = SailPoint.LCM.RequestAccess.getAttributeSearchValue(attr, 'q_');
      }

      searchFieldObj = Ext.widget(searchFieldObj);
      SailPoint.mobile.Support.addMobileSupport(searchFieldObj, 'requestAccessPanel');

      this.rightAttributeFields.push(searchFieldObj);
    }

    SailPoint.mobile.Support.addMobileSupport(this.applicationMultiSuggest, 'requestAccessPanel');
    SailPoint.mobile.Support.addMobileSupport(this.entitlementSuggest, 'requestAccessPanel');
    SailPoint.mobile.Support.addMobileSupport(this.ownerSuggest, 'requestAccessPanel');
    SailPoint.mobile.Support.addMobileSupport(this.attributeMultiSuggest, 'requestAccessPanel');

    Ext.apply(this, {
      header: false,
      objectType: SailPoint.LCM.RequestAccess.OBJECT_TYPE_ENTITLEMENT, /** used to trigger the grid which objects to show **/
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
        labelAlign: 'top',
        labelWidth: 150,
        maxWidth: 225,
        anchor: '95%'
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

  applicationAdded: function(suggest, records, index) {
    for (var i=0; i<records.length; i++) {
      this.attributeMultiSuggest.suggest.addExtraParam('applicationIds', records[i].getId());
      this.entitlementSuggest.addExtraParam('applicationIds', records[i].getId());
    }
    this.constrainAttrsToSelectedApps();
  },

  applicationRemoved: function(suggest, record, index) {
    this.attributeMultiSuggest.suggest.removeExtraParam('applicationIds', record.getId());
    this.entitlementSuggest.removeExtraParam('applicationIds', record.getId());

    this.constrainAttrsToSelectedApps();
  },

  attributeAdded: function(suggest, records, index) {
    for (var i=0; i<records.length; i++) {
      this.entitlementSuggest.addExtraParam('attributes', records[i].get('attribute'));
    }
  },

  attributeRemoved: function(suggest, record, index) {
    this.entitlementSuggest.removeExtraParam('attributes', record.get('attribute'));
  },

  /**
   * Remove any selected attributes that are not in the selected apps list.
   */
  constrainAttrsToSelectedApps: function() {
    var selectedApps = this.applicationMultiSuggest.getValue();

    // Only constrain the values if we're filtering by app.
    if (selectedApps.length > 0) {
      var store = this.attributeMultiSuggest.selectedStore;
      var toRemove = [];

      // Only keep an attribute if it is one of the selected apps.
      store.each(function(selectedAttrRecord) {
        var idx = selectedApps.indexOf(selectedAttrRecord.get('purview'));
        if (idx === -1) {
          toRemove.push(selectedAttrRecord);
        }
      });

      for (var i=0; i<toRemove.length; i++) {
        store.remove(toRemove[i]);
      }
    }
  },

  applySearch : function(filters) {  
    filters = SailPoint.LCM.ApplySearchAttributes(this.attributeMap.entitlementAttributes, "ent_");
    /** Apply entitlements tab filters **/
    filters.applicationIds = this.applicationMultiSuggest.getValue();
    filters.ownerId = this.ownerSuggest.getValue();
    filters.attributes = this.attributeMultiSuggest.getValue();
    filters.value = this.entitlementSuggest.getValue();
    this.parent.runSearch(filters);
  },

  clearSearch: function(doSearch) {
    SailPoint.LCM.ClearSearchAttributes(this.attributeMap.entitlementAttributes, "ent_");
    this.applicationMultiSuggest.setValue('');
    this.ownerSuggest.setValue('');
    this.attrSuggest.setValue('');

    this.entitlementSuggest.setValue('');
    this.entitlementSuggest.restoreOriginalExtraParams();

    this.attributeMultiSuggest.setValue('');
    this.attributeMultiSuggest.suggest.restoreOriginalExtraParams();

    this.parent.clearFilters();
    if (doSearch) {
      this.parent.runSearch({});
    }
  }
});