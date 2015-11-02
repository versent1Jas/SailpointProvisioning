/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This file contains the grid for Role Baseline Access Risk Configuration
 */

Ext.ns('SailPoint', 'SailPoint.Risk');

SailPoint.Risk.initRoleBarPanel = function(record, options, success) {
    
    var gridWidth = $('roleGrid').clientWidth;
    
    var roleBarStore = SailPoint.Store.createStore({
        url: 'roleRiskQueryJSON.json',
        root: 'roles',
        totalProperty: 'numRoleResults',
        fields : [ 'id', 'roleId', 'name', 'roleType', 'description', 'riskScore' ],
        remoteSort: true
    });
    
    var roleBarGrid = new SailPoint.SliderGrid({
        id: 'roleBarSliderGrid',
        colorStore: this,
        store: roleBarStore,
        columns: [{ 
            header: '#{msgs.name}', width: 226, sortable: true, dataIndex:'name'
        },{
            header: '#{msgs.type}', width: 130, sortable: true, dataIndex: 'roleType'
        }, {
            header: '#{msgs.description}', flex : 1, width: 226, sortable: false, dataIndex: 'description'
        }],
        frame: true,
        width: gridWidth,
        editUrl: 'businessRoleBARUpdate.json',
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'bottom',
            layout : {pack : 'start'},
            ui: 'footer',
            items: [{
                    id: 'saveChangesBtn',
                    text: '#{msgs.button_save}',
                    handler: function() {
                        $('editForm:saveBtn').click();
                    }
                }, {
                    id: 'cancelChangesBtn',
                    text: '#{msgs.button_cancel}',
                    cls : 'secondaryBtn',
                    handler: function() {
                        $('editForm:cancelBtn').click();
                    }
                }]
        }]
    });
    
    /** Report Scheduled Grid **/
    var roleBarFilterForm = Ext.create('SailPoint.panel.NoHeaderPanel', {
      id:'roleBarFilterForm',
      frame:false,
      collapsed: true,
      items: [
          new Ext.form.ComboBox({
            fieldLabel: '#{msgs.type}', 
            name: 'type',
            id: 'frmRoleType',
            listConfig : {width:200},
            store:roleBarTypeStore
          })
      ],      
      bodyStyle : 'padding:5px;background-color:#EEEEEE;border:0',
      style : 'background-color:#EEEEEE',
      defaults: { // defaults are applied to items, not this container
          bodyBorder : false,
          border : false,
          bodyStyle : 'background-color:#EEEEEE'
      },
      cls : 'x-panel-no-border',
      dockedItems: [{
          xtype: 'toolbar',
          dock: 'bottom',
          style : 'background-color:#EEEEEE;padding:0px 0px 5px 0px;',
          layout : {pack : 'end'},
          ui: 'footer',
          defaultType : 'button',
          items: [
              {
                  text : '#{msgs.button_filter}',
                  handler : function() {
                    roleBarStore.getProxy().extraParams['name'] = Ext.getCmp('roleBarSearchField').getValue();
                    roleBarStore.getProxy().extraParams['type'] = Ext.getCmp('frmRoleType').getValue(); 
                    roleBarStore.load({params:{start:0,limit:15}});
                  }
              },
              {
                  text : '#{msgs.button_reset}',
                  cls : 'secondaryBtn',
                  handler : function() {
                    Ext.getCmp('frmRoleType').reset();
                    Ext.getCmp('roleBarSearchField').reset();
                    roleBarStore.getProxy().extraParams['name'] = '';
                    roleBarStore.getProxy().extraParams['type'] = ''; 
                    roleBarStore.load({params:{start:0, limit:15}});
                  }
              }
          ]
      }]
    });
    
    var roleBarFilter = new Ext.Action({
        text: '#{msgs.advanced_search}',
        scale: 'medium',
        handler: function(){  
          roleBarFilterForm.toggleCollapse();
        }
    });
    
    var roleBarPanel = new Ext.Panel({
      renderTo: 'roleGrid',
      width:gridWidth,
      title: '#{msgs.title_biz_role_baseline_access_risk_conf}',
      items: [roleBarFilterForm, roleBarGrid],
      tbar: [
        {
          xtype : 'searchfield',
          id:'roleBarSearchField',
          store:roleBarStore,
          paramName:'name',
          emptyText:'#{msgs.filter_by_name}',
          width:250,
          storeLimit:15
        }, ' ',
        roleBarFilter
      ]
    });

    roleBarStore.load({params: {start: 0, limit: 15}});
}

Ext.onReady(function() {
    Ext.QuickTips.init();
    var colorStore = new SailPoint.Risk.ColorStore({id: 'colorStore'});
    colorStore.load({
        callback: function(record, options, success) {
            if (success) {
                SailPoint.Risk.initRoleBarPanel.call(this, options.value);
            }
        }
    });
});


