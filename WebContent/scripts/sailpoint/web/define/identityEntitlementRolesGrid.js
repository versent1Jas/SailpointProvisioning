// Create grid for define/identity/entitlementsNew.jsf with advanced search panel

Ext.define('SailPoint.Define.Grid.IdentityEntitlementRoles', {
    statics : {
        
        /**
         * Create a grid of the role assignments and role
         * detections that are stored in the IdentityEntitlement
         * table.
         */
        createGrid : function(identity, gridMetaData, gridStateStr, stateId) {
               
            Ext.QuickTips.init();
            // Push the role type icon in to the store
            var storeFields = [].concat(gridMetaData.fields);
            storeFields.push('roleTypeIcon');

            var entStore  = SailPoint.Store.createRestStore({
                autoLoad: false,
                url: SailPoint.getRelativeUrl('/rest/identities/{0}/identityEntitlementRoles'),
                fields: storeFields,
                method: 'GET',
                remoteSort: true,
                simpleSortMode: true
            });

            entStore.applyPathParams([SailPoint.Utils.encodeRestUriComponent(identity)]);
                  
            var grid = Ext.create('SailPoint.Define.Grid.IdentityEntitlementRoles.AdvSearchGrid', {
                store: entStore,
                id: 'identityentitlementrolesgrid',
                cls: 'smallFontGrid selectableGrid',
                stateId: stateId,
                stateful: true,
                gridStateStr: gridStateStr,
                gridMetaData: gridMetaData,
                viewConfig: {
                    scrollOffset: 1,
                    stripeRows:true
                },
                usePageSizePlugin: true
            });    
            grid.initialLoad(SailPoint.identity.setTabPanelHeight);
            
            return grid;
        },
        
        renderValue : function(value, p, r) {

            var rendered = value.escapeHTML();

            var name = r.get('name');
            var id = r.get('id');
            var identityId = r.get('identityId');
            var value = r.get('value');
            var roleId = r.get('roleId');
            
            if ( name && name.length > 0 ) {
                //should always be assigned or detected
                if ( name === "assignedRoles" || name === "detectedRoles" ) {
                    var assignmentId = r.get('assignmentId');
                    if ( roleId != null ) {
                    		var roleLink;
                    		if (assignmentId == null) {
                          roleLink = Ext.String.format('<a href="javascript:SailPoint.RoleDetailPanel.window(null, \'{0}\', \'{1}\', true, null, \'{2}\')" title="#{msgs.info_role_composition}">{3}</a>', roleId, identityId, name, rendered);
                    		} else {
                          roleLink = Ext.String.format('<a href="javascript:SailPoint.RoleDetailPanel.window(\'{0}\', \'{1}\', \'{2}\', true, null, \'{3}\')" title="#{msgs.info_role_composition}">{4}</a>', assignmentId, roleId, identityId, name, rendered);
                    		}
                        var roleType = r.get('roleType');
                        var typeIcon = r.get('roleTypeIcon');
                        if ( roleType == null ) {
                            rendered = '<div class="font10">' + roleLink + "</div>";
                        } else {
                            rendered = '<div style="padding-left:18px" class="font10 ' + typeIcon + '">' + roleLink + "</div>";
                        }
                    }
                } 
                
                var sunrise = r.get('startDate');
                var sunset = r.get('endDate');

                if($('editForm:roleId')) {
                    if(roleId == $('editForm:roleId').value) {
                        var sunsetTime;
                        var sunriseTime;
                        var sunsetD;
                        var sunriseD;
                        sunriseTime = $('editForm:sunriseDate').value;
                        sunsetTime = $('editForm:sunsetDate').value;
                        if(sunriseTime) {
                            sunriseD = new Date(parseInt(sunriseTime));
                            sunrise = Ext.Date.format(sunriseD, Ext.util.Format.dateFormat);
                        }
                        if(sunsetTime) {
                            sunsetD = new Date(parseInt(sunsetTime));
                            sunset = Ext.Date.format(sunsetD, Ext.util.Format.dateFormat);
                        }
                        
                        
                    }
                }
                
                if ( sunrise || sunset ) {
                    var sunriseDiv;
                    var sunsetDiv;
                    var activationEdit;
                    var baseDiv =
                        '<div class="activationNotice" style="margin: 10px 0pt">' 
                        + '<table cellspacing="0">'
                        + '<tr>'
                        + '{0}'
                        + '{1}'
                        + '{2}'
                        + '</tr>'
                        + '</table>'
                        + '<div class="vis-clear"></div>' 
                        + '<div class="vis-clear"></div>'
                       +'</div>';
                    if($('editForm:sunriseDate')) {
                        activationEdit = '<td>'
                                       + '<img id="roleassignmentEditBtn" src="'+ SailPoint.getRelativeUrl('/images/icons/calendar_edit.png') + '" onclick="javascript:editRoleActivation(\''+roleId+'\',\''+sunrise+'\',\''+sunset+'\')">'
                                       + '</td>';
                    } else {
                        activationEdit = '';
                    }
                    if ( sunrise ) {
                        sunriseDiv = '<td>' 
                                + '  <span class="label green">#{msgs.activate}: </span>' 
                                + sunrise
                                + '</td>';
                       } else {
                           sunriseDiv = '';
                    }
                    if ( sunset ) { 
                        sunsetDiv = '<td>' 
                            + '  <span class="label red">#{msgs.deactivate}: </span>' 
                            + sunset
                            + '</td>';
                    } else {
                        sunsetDiv = '';
                    }
                    
                    var section =  Ext.String.format(baseDiv, activationEdit, sunriseDiv, sunsetDiv)
                    rendered = Ext.String.format("{0}{1}", rendered, section);
                }
            }
            return rendered;
        },
        
        /*
         * Render role description wrapped in the grid
         */
        renderDescription : function(value, p, record) {    
            var str = '<div style="white-space:normal !important;">{0}</div>';
            return Ext.String.format(str, ( value == null ? '' : value));
        }
        
    }// end statics
});

Ext.define('SailPoint.Define.Grid.IdentityEntitlementRoles.AdvSearchGrid', {
    extend : 'SailPoint.grid.PagingGrid',
    alias : 'widget.spidentroladvsearchgrid',
    
    disableActions : false,
    requester : null,
    isAdvSearchExpanded: false,
    quickSearch : null,
    
    constructor : function(config){ 

        config.plugins = [this.initAdvSearchForm(), {
            ptype: 'sprowexpander',
            rowBodyTpl: ' ',
            expandOnDblClick: false
        }];
        
        config.tbar = [
            {
                xtype : 'searchfield',
                id: 'identityEntitlementRolesSearchField',
                store: config.store,
                paramName: 'value',
                emptyText: '#{msgs.identity_entitlements_by_roleName}',
                width: 250,
                storeLimit: 10
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
        ];
        
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
            url: SailPoint.getRelativeUrl('/identity/identityEntitlementExpando.jsf'),
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

        return {
            
            ptype : 'gridexpandoplugin',

            gridId : null,

            initExpandoPanel : function(grid) {

                var showRequesterInput = !grid.requester;
               
                var sourceStore = SailPoint.Store.createStore({
                    autoLoad : true,
                    model : 'SailPoint.model.KeyValue',
                    data : [ { key : 'LCM', value : '#{msgs.source_lcm}' },
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
                    id: grid.getId() + '-identityRoleSearchForm',
                    gridId : grid.getId(),
                    labelAlign : 'top',
                    columns : [[
                            {
                                xtype : 'datefield',
                                id: grid.getId() + '-startDateBefore',
                                name : 'startDateBefore',
                                anchor : '60%',
                                fieldLabel : '#{msgs.identity_entitlements_before_start_date}'
                            },
                            {
                                xtype : 'identitySuggest',
                                name : 'assigner',
                                anchor : '60%',
                                id: grid.getId() + '-assigner',
                                fieldLabel : '#{msgs.identity_entitlements_assigner}',
                                valueField: 'name'
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
                                xtype : 'datefield',
                                id :  grid.getId() + '-startDateAfter',
                                name : 'startDateAfter',
                                anchor : '60%',
                                fieldLabel : '#{msgs.identity_entitlements_after_start_date}'
                            },
                            {
                                xtype : 'combobox',
                                name : 'allowed',
                                id : grid.getId() + '-allowed',
                                anchor : '60%',
                                queryMode : 'local',
                                emptyText : '#{msgs.identity_entitlements_select_null}',
                                displayField : 'value',
                                valueField : 'key',
                                fieldLabel : '#{msgs.identity_entitlements_role_allowed}',
                                store : trueFalseStore
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
                                xtype : 'datefield',
                                id: grid.getId() + '-endDateBefore',
                                name : 'endDateBefore',
                                anchor : '60%',
                                fieldLabel : '#{msgs.identity_entitlements_before_end_date}'
                            },
                            {
                                xtype : 'combobox',
                                name : 'source',
                                id : grid.getId() + '-source',
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
                                xtype : 'datefield',
                                id :  grid.getId() + '-endDateAfter',
                                name : 'endDateAfter',
                                anchor : '60%',
                                fieldLabel : '#{msgs.identity_entitlements_after_end_date}'
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

                         // include name, additional and app name in the tool bar
                         var field = Ext.getCmp("identityEntitlementRolesSearchField");
                         if ( field != null && !Ext.isEmpty(field.getValue()) ) {
                             vals['value'] = field.getValue();
                         }

                         this.fireEvent('search', vals);
                    },

                    doReset : function() {
                        this.resetValues();

                        var quickSearch = Ext.getCmp('identityEntitlementRolesSearchField');
                        if ( quickSearch != null ) {
                           if (quickSearch.reset) {
                               quickSearch.reset();
                           }
                           if (quickSearch.clear) {
                               quickSearch.clear();
                           }
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

        };
    }
});
