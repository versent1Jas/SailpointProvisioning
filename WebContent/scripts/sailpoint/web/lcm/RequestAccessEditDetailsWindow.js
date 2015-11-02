Ext.define('SailPoint.LCM.RequestAccessEditDetailsWindow', {
  extend : 'Ext.window.Window',
  col_selected :  "IIQ_Selected",

  record: null,
  deselects : [],
  /** Panels **/
  formPanel : null,
  detailsPanel : null,
  allowActivationEditing : false,

  constructor : function(config){
    this.record = config.record;

    this.mapRecordFields();

    var activationEditingField = $('allowActivationEditing');
    if(activationEditingField && activationEditingField.value=='true') {
      this.allowActivationEditing = true;
    }

    this.template = new Ext.XTemplate(
        '<tpl for=".">',
        '<p class="permittedRoleDetailsInstructions"></p>',
        '<div class="permittedRoleDetails">',
          '<table class="details">',
            '<tr><td><label>#{msgs.name}:</label></td><td class="pl">{[Ext.String.htmlEncode(values.displayableName)]}</td></tr>',
            '<tr><td><label>#{msgs.owner}:</label></td><td class="pl">{owner}</td></tr>',
            '<tr><td><label>#{msgs.description}:</label></td><td class="pl">{description}</td></tr>',
          '</table>',
        '</div>',
    '</tpl>');

    this.nativeIdentityStoreFactory =
      new SailPoint.component.NativeIdentityStoreFactory(this.record.get('identityId'),
          this.record.get('application'));

    this.nativeIdentityCombo = new SailPoint.component.NativeIdentityCombo({
      storeFactory: this.nativeIdentityStoreFactory,
      createRequested: true,
      forceSelection: true,
      width:375,
      fieldLabel: '#{msgs.label_account}',
      allowBlank: false
    });

    this.now = new Date();

    this.sunriseDate = new Ext.form.DateField({
      name:'sunrise', 
      id:'sunriseExtWin',
      vtype: 'daterange',
      labelSeparator: ' ',
      minValue: this.now,
      hidden: !this.allowActivationEditing,
      fieldLabel: '#{msgs.lcm_summary_role_activation}',
      endDateField: 'sunsetExtWin'
    });

    this.sunsetDate = new Ext.form.DateField({
      name:'sunset', 
      id:'sunsetExtWin', 
      vtype: 'daterange',
      labelSeparator: ' ',
      minValue: this.now,
      hidden: !this.allowActivationEditing,
      fieldLabel: '#{msgs.lcm_summary_role_deactivation}',
      startDateField: 'sunriseExtWin'
    }); 
    
    if(this.record.get('activation')) {
      this.sunriseDate.setValue(new Date(this.record.get('activation')));
    }
    
    if(this.record.get('deactivation')) {
      this.sunsetDate.setValue(new Date(this.record.get('deactivation')));
    }
    
    this.formPanel = Ext.create('Ext.form.Panel', {
      region: 'center',
      items: [this.sunriseDate, this.sunsetDate /** this.nativeIdentityCombo **/]
    });

    this.detailsPanel = Ext.create('Ext.panel.Panel', {
      height:250,
      bodyStyle: 'padding: 10px;',
      region: 'north',
      items: [{
        xtype: 'panel',
        region: 'north',
        tpl: this.template,
        data: this.recordMap
      },
      this.formPanel
      ]
    });

    var items = [this.detailsPanel];
    if (this.isEditingRole()) {
      this.grid = this.createGrid(config);

      items.push(this.grid);
    }

    Ext.apply(config, {
      title: Ext.String.format("#{msgs.lcm_request_access_edit_details}", Ext.String.htmlEncode(config.record.get('displayableName'))),
      id: 'editDetailsWin',
      layout:'border',
      width:768,
      height:500,
      items : items,
      buttons: [
                {
                  text:"#{msgs.button_save}", 
                  handler: function() {          
                    var window = Ext.getCmp('editDetailsWin');    
                    if(window.allowActivationEditing) {
                      if(window.sunriseDate.isValid() && window.sunsetDate.isValid()) {

                        $("editForm:requestId").value = window.record.getId();
                        $("editForm:activationDate").value = '';
                        $("editForm:deactivationDate").value = '';

                        var startDateObj = window.sunriseDate.getValue();
                        var endDateObj = window.sunsetDate.getValue();

                        if(startDateObj) {
                          $("editForm:activationDate").value = startDateObj.getTime();
                          window.record.set('activation', window.sunriseDate.getRawValue());
                        }

                        if(endDateObj) {
                          $("editForm:deactivationDate").value = endDateObj.getTime();
                          window.record.set('deactivation', window.sunsetDate.getRawValue());
                        }

                        window.record.commit();    
                      }
                    }

                    var requests = [];

                    // only try to manage grid selections if we are editing a role request
                    if (window.isEditingRole()) {
                      var grid = Ext.getCmp('permittedRolesGrid');
                      var selections = grid.getSelectedIds();
                      /** Add any selected roles to the cart (doesn't matter if they are dupes). **/
                      if(selections.length>0) {

                        SailPoint.LCM.RequestAccess.OBJECT_TYPE = SailPoint.LCM.RequestAccess.OBJECT_TYPE_ROLE;

                        for(var i=0; i<selections.length; i++) {
                          var record = grid.getStore().getById(selections[i]);
                          var request = SailPoint.LCM.RequestAccess.createAccountRequestFromRecord(SailPoint.LCM.RequestAccess.ATTRIBUTE_OP_ADD, record, SailPoint.LCM.RequestAccess.OBJECT_TYPE);
                          request.arguments.permittedBy = window.record.get('objectId');
                          requests.push(request);
                        }
                      }

                      /** If they deselected anything, add it to the list or requests as a remove **/
                      if(window.deselects.length>0) {
                        for(var i=0; i<window.deselects.length; i++) {
                          record = window.deselects[i];
                          requests.push(SailPoint.LCM.RequestAccess.createCartRemoveRequest(record));
                        }
                      }
                    }

                    $("editForm:requestsJSON").value = Ext.JSON.encode(requests);              
                    $("editForm:updateRequestBtn").click();
                    window.close();
                  } 
                },
                {
                  text:"#{msgs.button_cancel}", cls : 'secondaryBtn', window: this, handler: function() { Ext.getCmp('editDetailsWin').close(); }
                }

                ]
    });
    Ext.apply(this, config);

    this.callParent(arguments);
  },

  isEditingRole: function() {
    return this.record.get('type') === 'Role';
  },

  mapRecordFields : function() {
    this.recordMap = {};
    this.recordMap.name = this.record.get('name');
    this.recordMap.displayableName = this.record.get('displayableName');
    this.recordMap.description = this.record.get('description');
    this.recordMap.owner = this.record.get('owner'); 
  },

  createGrid: function(config) {

    this.store = SailPoint.Store.createRestStore({
      fields : SailPoint.LCM.SummaryChanges.permittedRolesGridMetaData.fields,
      autoLoad : true,
      url : SailPoint.getRelativeUrl('/rest/roles/grid/' + this.record.get('objectId') + '/permits'),
      sorters : [{property : 'name', direction : 'ASC' }],
      remoteSort : true
    });

    this.grid = new SailPoint.grid.PagingCheckboxGrid({
      cls: 'smallFontGrid wrappingGrid',
      store: this.store,
      region: 'center',
      id: 'permittedRolesGrid',
      disableMouseTracking: true,
      pageSize: 5,
      gridMetaData: SailPoint.LCM.SummaryChanges.permittedRolesGridMetaData,
      viewConfig: {
        scrollOffset: 0,
        stripeRows: true
      }
    });

    this.store.on('load', function(store, records) {
      var toSelect = [];
      for(var i=0; i<records.length; i++) {
        if(records[i].get(this.col_selected)) {
          toSelect.push(records[i]);
        }        
      }
      this.grid.getSelectionModel().select(toSelect);
    }, this);

    /** keep track of any records that were deselected from the grid so we can remove them **/
    this.grid.getSelectionModel().on('deselect', function(row, record) {
      this.deselects.push(record);
    }, this);

    return this.grid;
  }
});