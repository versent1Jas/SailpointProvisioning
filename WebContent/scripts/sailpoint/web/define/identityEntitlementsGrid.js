// Create grid for define/identity/entitlementsNew.jsf with advanced search panel 

Ext.define('SailPoint.Define.Grid.IdentityEntitlements', {
    statics : {
        /*
         * Create the grid that displays IdentityEntitlement objects. This grid
         * is interested in non-role entitlements. There is a separate grid for
         * displaying the role data stored in this table.
         * 
         */
        createGrid : function(identity, gridMetaData, gridStateStr, stateId) {

            //var entitlementsGridState = new SailPoint.GridState({name: stateId, gridStateObj: JSON.parse(gridStateStr)});
            Ext.QuickTips.init();

            var entStore  = SailPoint.Store.createRestStore({
                autoLoad: false,
                url: SailPoint.getRelativeUrl('/rest/identities/{0}/identityEntitlements'),
                fields: gridMetaData.fields,
                method: 'GET',
                remoteSort: true,
                simpleSortMode: true
            });

            entStore.applyPathParams([SailPoint.Utils.encodeRestUriComponent(identity)]);

            // callback for the tooltip rendering when the grid is loaded
            entStore.on('load', SailPoint.Define.Grid.IdentityEntitlements.initQuickTips, this );
                  
            var grid = Ext.create('SailPoint.Define.Grid.IdentityEntitlements.AdvSearchGrid', {
                store: entStore,
                cls: 'smallFontGrid selectableGrid',
                stateId: stateId,
                stateful: true,
                gridStateStr: gridStateStr,
                gridMetaData: gridMetaData,
                loadMask: true,
                viewConfig: {
                    scrollOffset: 1,
                    stripeRows:true
                },
                listeners : {
                    afterrender : {
                        fn : function() {
                            if(Ext.isIE7) {
                                /*
                                 * IE7 has problems rendering a grid into a dom that was copied into 
                                 * a component via contentEl (or something like that... hell I don't really know, 
                                 * this seems to work so let's just go with it.)
                                 */
                                Ext.defer(function() {
                                    var s = this.getStore();
                                    if(s) {
                                        s.add({id:'tmp'}); // add a record to force the grid to resize
    
                                        SailPoint.identity.setTabPanelHeight();
                                      
                                        var itp = Ext.getCmp('identityTabPanel');
                                        if(itp) {
                                            itp.getActiveTab().updateLayout({defer:true, isRoot:true});
                                        }
                                        
                                        // The defer within a defer is necessary to give the layout time 
                                        // to 'set' before removing the tmp record.
                                        Ext.defer(function(){
                                            this.getStore().removeAt(this.getStore().getCount() - 1);
                                        }, 100, this);
                                    }
                                }, 100, this);
                            }
                        },
                        single : true
                    }
                },
                usePageSizePlugin: true
            });
            
            grid.initialLoad();
            
            return grid;
        },
        
        /*
         * Method that is called to initialize the tool tips we provide for
         * entitlement descriptions.
         */
        initQuickTips : function() {
              Ext.QuickTips.init();
              Ext.apply(Ext.QuickTips.getQuickTip(), {
                showDelay: 1000,
                autoDismiss: false,
                dismissDelay: 0,
                trackMouse: false
              });       
              SailPoint.component.NameWithTooltip.registerTooltips();
        },
        
        renderAttribute : function(value, p, r) {
          var aggState = r.get('aggregationState');
          if(aggState == "Disconnected") {
          
            value = "<div class='nameWithTooltip'>"
              + "<span style='display:none'>#{msgs.identity_entitlements_aggregation_state_disconnected_tooltip}</span>"
              + "<img src='"+SailPoint.CONTEXT_PATH
              +"/images/icons/policy_violation_16.png' style='vertical-align:middle'/>&nbsp;"+value+"</div>";
          }
          return value;
        },

        /*
         * Render the value of an entitlement either as normal text or as a link
         * that can display the account group popup.
         */
        renderValue : function(value, p, r) {
            var rendered = value.escapeHTML();
            var name = r.get('name');
            if (name && name.length > 0) {
                var entitilementDescription = r.get('entitlementDescription');

                var nameWithTooltip = rendered;
                if (entitilementDescription != null && entitilementDescription.length > 0 ) {                
                    nameWithTooltip = SailPoint.component.NameWithTooltip.getTooltipHtml(rendered, entitilementDescription);
                }
                var appName = r.get('application');
                if (appName != null) {
                    var isGroup = r.get('isGroup');
                    if (isGroup) {
                        var value = r.get('value');
                        rendered = '<a onclick="javascript: SailPoint.Define.Grid.IdentityEntitlements.viewAccountGroup(\''
                                + Ext.String.htmlEncode(appName) + '\', \'' + Ext.String.htmlEncode(name) + '\', \'' + Ext.String.htmlEncode(value) + '\', event);">' + nameWithTooltip + '</a>';
                    } else {
                        rendered = '<div class="font10">' + nameWithTooltip + "</div>";
                    }
                }
            }
            return rendered;
        },
        
        viewAccountGroup: function(appName, name, value, event) {
            // stop the event from expanding the column too
            if(!event) {
                event = window.event;
            }
            Ext.EventManager.stopEvent(event);
            
            // show the account group dialog
            viewAccountGroup(appName, name, value);
            return null;
        }
    }// end statics
});

Ext.define('SailPoint.Define.Grid.IdentityEntitlements.AdvSearchGrid', {
    extend : 'SailPoint.grid.PagingGrid',
    
    disableActions : false,
    requester : null,
    isAdvSearchExpanded: false,
    
    constructor : function(config){

        config.plugins = [this.initAdvSearchForm(), {
            ptype: 'sprowexpander',
            rowBodyTpl: ' ',
            expandOnDblClick: false

        }];
        
        config.tbar = {
            xtype : 'toolbar',
            enableOverflow: true,
            items : [ 
                {
                    xtype : 'searchfield',
                    id: 'identityEntitlementsSearchField',
                    store: config.store,
                    paramName:'nameOrValue',
                    emptyText:'#{msgs.identity_entitlements_by_name}',
                    width:250,
                    storeLimit:10
                }, 
                ' ',
                {
                    xtype : 'searchfield',
                    id : 'identityEntitlementAppNameField',
                    store: config.store,
                    paramName:'application',
                    emptyText: "#{identity_entitlements_by_application}"
                }, 
                ' ',
                {
                    xtype: 'checkbox',
                    id: 'identityEntitlementAdditional',
                    boxLabel: '#{msgs.identity_entitlements_only_additional}',
                    cls: 'identityEntitlementAdditional',
                    handler: function(button, state){       
                      var ops = {start: 0, limit: config.storeLimit};
                      config.store.getProxy().extraParams = config.store.getProxy().extraParams || {};
                      config.store.getProxy().extraParams['additionalOnly'] = state;
                      config.store.load({params:ops});
                    }
                }, 
                ' ',
                {
                    xtype : 'button',
                    text: '#{msgs.advanced_search}',
                    scale: 'medium',
                    enableToggle: true,
                    handler : function() {
                        var grid = this.findParentByType('paginggrid');
                        grid.fireEvent('toggleExpando', null);
                        grid.isAdvSearchExpanded = !grid.isAdvSearchExpanded;
                        grid.fireEvent('afterToggleExpando', grid.isAdvSearchExpanded);
                    }
                }
            ]
        };
        
        Ext.apply(this, config);
        this.callParent(arguments);
    },
    
    initComponent : function() {
        this.callParent(arguments);

        this.getView().on('expandbody', function(rowNode, record, expandRow, eOpts) {
            this.panel.loadExpandoContent(rowNode, record, expandRow, eOpts, this.panel);
        });
        
        this.getView().on('resize', function() {
            SailPoint.identity.setTabPanelHeight();
        });
        
        SailPoint.identity.addGrid(this.getId());
    },
    
    fireResizeHackForIE : function(e, s, r, o) {
        if(Ext.isIE) { // Give IE some time to get its act together!
            Ext.defer(function(){
                o.grid.getView().fireEvent('resize', null);
            }, 100);
        }
    },
    
    loadExpandoContent: function(rowNode, record, expandRow, eOpts, grid) {
        var rowBody = Ext.get(expandRow).query('.x-grid-rowbody')[0];
        Ext.get(rowBody).load({
            url: SailPoint.getRelativeUrl('/identity/identityEntitlementExpando.jsf?forceLoad=true'),
            scripts: true,
            params: {
                id: record.getId()
            },
            text: "#{msgs.identity_entitlements_loading_details}",
            callback : this.fireResizeHackForIE,
            grid: grid
        });
    },

    /**
     * @private Initializes and returns the advanced search form plugin.
     */
    initAdvSearchForm : function(){

        var advSearchForm = new SailPoint.grid.GridExpandoPlugin({

            gridId : null,

            initExpandoPanel : function(grid){
               
                var sourceStore = SailPoint.Store.createStore({
                    autoLoad : true,
                    model : 'SailPoint.model.KeyValue',
                    data : [ { key : 'Aggregation', value: '#{msgs.source_aggregation}'},
                             { key : 'LCM', value : '#{msgs.source_lcm}' },
                             { key : 'Rule', value : '#{msgs.source_rule}' },
                             { key : 'Task', value : '#{msgs.source_task}' },
                             { key : 'WebServices', value : '#{msgs.source_web_service}' } ]
                });
                
                var entTypeStore = SailPoint.Store.createStore({
                    autoLoad : true,
                    model : 'SailPoint.model.KeyValue',
                    data : [ { key : 'Entitlement', value : '#{msgs.entitlement}' }, 
                             { key : 'Permission', value : '#{msgs.permission}' } ]
                });
                
                var trueFalseStore = SailPoint.Store.createStore({
                    autoLoad : true,
                    model : 'SailPoint.model.KeyValue',
                    data : [ { key : 'true', value : '#{msgs.txt_true}' }, 
                             { key : 'false', value : '#{msgs.txt_false}' } ]
                });
                
                var searchForm = Ext.create('SailPoint.panel.Search', {
                    id: grid.getId() + '-identityEntitlementSearchForm',
                    gridId : grid.getId(),
                    labelAlign : 'top',
                    columns : [
                        [
                            {
                                xtype : 'textfield',
                                name : 'accountDisplayName',
                                id: grid.getId() + '-accountDisplayName',
                                width : 175,
                                fieldLabel : '#{msgs.account_name}'
                            },
                            {
                                xtype : 'combobox',
                                name : 'aggregationState',
                                id : grid.getId() + '-aggregationState',
                                anchor : '60%',
                                queryMode : 'local',
                                emptyText : '#{msgs.identity_entitlements_select_null}',
                                displayField : 'value',
                                valueField : 'key',
                                fieldLabel : '#{msgs.identity_entitlements_aggregation_state_display}',
                                store : trueFalseStore
                            },
                            {
                                xtype : 'combobox',
                                name : 'hasPendingCert',
                                id : grid.getId() + '-hasPendingCert',
                                anchor : '60%',
                                queryMode : 'local',
                                emptyText : '#{msgs.identity_entitlements_select_null}',
                                displayField : 'value',
                                valueField : 'key',
                                fieldLabel : '#{msgs.identity_entitlements_has_pending_cert}',
                                store : trueFalseStore
                            }
                        ],
                        [
                            {
                                xtype : 'textfield',
                                name : 'instance',
                                id: grid.getId() + '-instance',
                                width : 175,
                                fieldLabel : '#{msgs.instance}'
                            },
                            {
                                xtype : 'combobox',
                                name : 'type',
                                id : grid.getId() + '-type',
                                anchor : '60%',
                                queryMode : 'local',
                                emptyText : '#{msgs.identity_entitlements_select_null}',
                                displayField : 'value',
                                valueField : 'key',
                                fieldLabel : '#{msgs.srch_input_def_entitlement_type}',
                                store : entTypeStore
                            },
                            {
                                xtype : 'combobox',
                                name : 'hasCurrentRequest',
                                id : grid.getId() + '-hasCurrentRequest',
                                anchor : '60%',
                                queryMode : 'local',
                                emptyText : '#{msgs.identity_entitlements_select_null}',
                                displayField : 'value',
                                valueField : 'key',
                                fieldLabel : '#{msgs.identity_entitlements_no_request}',
                                store : trueFalseStore
                            }
                        ],
                        [
                            {
                                xtype : 'textfield',
                                name : 'assigner',
                                id: grid.getId() + '-assigner',
                                width : 175,
                                fieldLabel : '#{msgs.identity_entitlements_assigner}'
                            },
                            {
                                xtype : 'combobox',
                                name : 'assigned',
                                id : grid.getId() + '-assigned',
                                anchor : '60%',
                                queryMode : 'local',
                                emptyText : '#{msgs.identity_entitlements_select_null}',
                                displayField : 'value',
                                valueField : 'key',
                                fieldLabel : '#{msgs.identity_entitlements_assigned}',
                                store : trueFalseStore
                            },
                            {
                                xtype : 'combobox',
                                name : 'hasPendingRequest',
                                id : grid.getId() + '-hasPendingRequest',
                                anchor : '60%',
                                queryMode : 'local',
                                emptyText : '#{msgs.identity_entitlements_select_null}',
                                displayField : 'value',
                                valueField : 'key',
                                fieldLabel : '#{msgs.identity_entitlements_has_pending_request}',
                                store : trueFalseStore
                            }
                        ],
                        [
                            {
                                xtype : 'combobox',
                                name : 'source',
                                id : grid.getId() + '-source',
                                anchor : '60%',
                                queryMode : 'local',
                                emptyText : '#{msgs.identity_entitlements_select_null}',
                                displayField : 'value',
                                allowBlank : true,
                                editable: true,
                                valueField : 'key',
                                fieldLabel : '#{msgs.identity_entitlements_source}',
                                store : sourceStore
                            },
                            {
                                xtype : 'combobox',
                                name : 'hasCurrentCert',
                                id : grid.getId() + '-hasCurrentCert',
                                anchor : '60%',
                                queryMode : 'local',
                                emptyText : '#{msgs.identity_entitlements_select_null}',
                                displayField : 'value',
                                valueField : 'key',
                                fieldLabel : '#{msgs.identity_entitlements_no_certification}',
                                store : trueFalseStore
                            }
                        ]
                    ],

                    doSearch : function() {
                        var vals = this.getValues();
                        
                        Ext.iterate(vals, function(v) {
                            if(v == "aggregationState") {
                                if(vals[v] == 'true') {
                                    vals[v] = 'Connected';
                                } else {
                                    vals[v] = 'Disconnected';
                                }
                            }
                        });
                        
                        // include name, additional and app name in the tool bar
                        var field = Ext.getCmp("identityEntitlementsSearchField");
                        if ( field != null && !Ext.isEmpty(field.getValue()) ) {
                            vals['nameOrValue'] = field.getValue();
                        }
                        field = Ext.getCmp("identityEntitlementAppNameField");
                        if ( field != null && !Ext.isEmpty(field.getValue()) ) {
                            vals['application'] = field.getValue();
                        }
                        field = Ext.getCmp("identityEntitlementAdditional");
                        if ( field != null && !Ext.isEmpty(field.getValue()) ) {
                            vals['additionalOnly'] = field.getValue();
                        }
                        this.fireEvent('search', vals);
                    },
   
                    doReset : function(){
                        this.resetValues();
                        
                        var quickSearch = Ext.getCmp('identityEntitlementsSearchField');
                        if ( quickSearch != null ) {
                            if (quickSearch.reset)
                                quickSearch.reset();
                            if (quickSearch.clear)
                                quickSearch.clear();
                        }
                        var identityEntitlementAppNameField = Ext.getCmp("identityEntitlementAppNameField");
                        if ( identityEntitlementAppNameField != null ) {
                            if (identityEntitlementAppNameField.reset)
                               identityEntitlementAppNameField.reset();
                            if (identityEntitlementAppNameField.clear)
                               identityEntitlementAppNameField.clear();
                        }
                        var identityEntitlementAdditional = Ext.getCmp("identityEntitlementAdditional");
                        if ( identityEntitlementAdditional != null ) {
                            if (identityEntitlementAdditional.reset)
                                identityEntitlementAdditional.reset();
                            if (identityEntitlementAdditional.clear) 
                                identityEntitlementAdditional.clear();
                        }
                        this.fireEvent('reset');
                    },
                       
                    listeners : {
                        reset : {
                            fn : function(){
                                this.search({});
                            },
                            scope : grid
                        },
                        search : {
                            fn : function(values){
                                this.search(values);
                            },
                            scope : grid
                        }
                    }
                });

                return searchForm;
            }

        }); // END new SailPoint.grid.GridExpandoPlugin

        return advSearchForm;
    }
});
