/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.IdentityCorrelationGrid', {
    extend : 'SailPoint.grid.PagingCheckboxGrid',

    extAttrFields : null,

    gridStateId : null,
    
    identityDs : null,
    
    isAdvSearchExpanded : false,
    
    constructor : function(config){ 

        config.plugins = [this.initAdvSearchForm()];
        
        this.identityDs = SailPoint.Store.createStore({
            fields : config.gridMetaData.fields, // this is actually a colModel, but will work for a temp field list
            url : SailPoint.getRelativeUrl('/manage/correlation/identitySearch.json'),
            remoteSort : true
        });
        
        config.tbar = [
            {
                xtype : 'searchfield',
                store : this.identityDs,
                paramName : 'q_userName',
                emptyText : '#{msgs.filter_by_name}',
                width : 250,
                storeLimit : 10,
                getExtraParams : function(){

                    var v = this.getValue();

                    var xtraParms = this.store.getProxy().extraParams || {};
                    xtraParms.start = 0;
                    xtraParms['q_userName'] = v;
                    xtraParms['q_lastName'] = v;
                    xtraParms['q_displayName'] = v;
                    xtraParms['q_firstName'] = v;
                    xtraParms['quickSearch'] = 'true';

                    return xtraParms;
                }
            }, 
            ' ',
            {
                xtype : 'button',
                text : '#{msgs.advanced_search}',
                scale: 'medium',
                enableToggle : true,
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

        Ext.apply(this, {
            stateId : this.gridStateId,
            width : this.width,
            store : this.identityDs,
            gridMetaData : this.gridMetaData,
            height : 300,
            viewConfig : {
                stripeRows:true,
                autoFill:true
            },
            runInitialLoad : this.runInitialLoad ? this.runInitialLoad : false,
            selModel : new SailPoint.grid.CheckboxSelectionModel({
                mode : 'single', 
                allowDeselect : true,
                showHeaderCheckbox : false
            }),
            listeners : {
                afteredit : {
                    fn : function(editEvent){
                        Ext.Ajax.request({
                            url : SailPoint.getRelativeUrl('/define/identity/correlationStatus.json'),
                            success : function(){},
                            failure : function(){alert('An error occurred connecting to the server');},
                            params : {id : editEvent.record.getId(), value : editEvent.value}
                        });
                    }
                },
                afterToggleExpando : {
                    fn : function(isExpanding) {
                        var me = this;
                        Ext.defer(function() {
                            me.updateLayout({isRoot:false, defer:true});
                            var form = Ext.getCmp(me.getId() + '-identityCorrelationSearchForm');
                            if(form) {
                                me.setHeight(form.getHeight() + 300);
                            }
                        }, 50);
                    }
                }
            }
        });
        
        this.callParent(arguments);
    },
    
    initAdvSearchForm : function() {
        return {
            
            ptype : 'gridexpandoplugin',

            gridId : null,

            initExpandoPanel : function(grid) {
                
                var extAttrsColLeft = {
                    columnWidth : 0.5,
                    fieldDefaults : {labelAlign:'top'},
                    xtype : 'form'
                };

                var extAttrsColRight = {
                    columnWidth : 0.5,
                    fieldDefaults : {labelAlign:'top'},
                    xtype : 'form'
                };

                if (grid.extAttrFields && grid.extAttrFields.length > 0) {
                    while(grid.extAttrFields.length > 0) {
                        var nextItem = grid.extAttrFields.shift();
                        nextItem.anchor = '95%';
                        if (!extAttrsColLeft.items) {
                            extAttrsColLeft.items = [nextItem];
                        }
                        else if (!extAttrsColRight.items) {
                            extAttrsColRight.items = [nextItem];
                        }
                        else if (extAttrsColRight.items.length < extAttrsColLeft.items.length) {
                            extAttrsColRight.items.push(nextItem);
                        }
                        else {
                            extAttrsColLeft.items.push(nextItem);
                        }
                    }
                }

                var searchForm = Ext.create('SailPoint.panel.Search', {
                    id : grid.getId() + '-identityCorrelationSearchForm',
                    gridId : grid.getId(),
                    labelAlign : 'top',
                    usePanelFormCSS : true,
                    columns : [
                        [
                            {
                                title : '#{msgs.standard_attrs}',
                                bodyStyle :'background-color:transparent;padding:5px',
                                layout :'column',
                                defaults : { // defaults are applied to items, not this container
                                    bodyBorder : false,
                                    border : false,
                                    bodyStyle : 'background-color:#EEEEEE'
                                },
                                bodyBorder : false,
                                border : false,
                                bodyStyle : 'background-color:#EEEEEE',
                                items : [
                                   {
                                        columnWidth : 0.5,
                                        xtype : 'form',
                                        fieldDefaults : {labelAlign:'top'},
                                        items : [{
                                                xtype:'textfield',
                                                fieldLabel: '#{msgs.first_name}',
                                                name: 'q_firstName',
                                                anchor:'95%'
                                            },{
                                                xtype:'textfield',
                                                fieldLabel: '#{msgs.user_name}',
                                                name: 'q_userName',
                                                anchor:'95%'
                                            },{
                                                xtype:'textfield',
                                                fieldLabel: '#{msgs.display_name}',
                                                name: 'q_displayName',
                                                anchor:'95%'
                                            },
                                            {
                                                xtype : 'combobox',
                                                width:100,
                                                triggerAction: 'all',
                                                queryMode:'local',
                                                editable:false,
                                                name: 'q_inactive',
                                                fieldLabel: '#{msgs.usr_status_inactive}',
                                                store : [['',''], ['false', '#{msgs.txt_false}'],['true', '#{msgs.txt_true}']]
                                            },
                                            {
                                                xtype : 'combobox',
                                                width:100,
                                                triggerAction: 'all',
                                                queryMode:'local',
                                                editable:false,
                                                name: 'q_correlated',
                                                fieldLabel: '#{msgs.identity_correlation_field_correlation_status}',
                                                store : [['',''], ['false', '#{msgs.txt_false}'],['true', '#{msgs.txt_true}']]
                                            }
                                        ]
                                    },
                                    {
                                        columnWidth : 0.5,
                                        xtype : 'form',
                                        fieldDefaults : {labelAlign:'top'},
                                        items : [{
                                                xtype:'textfield',
                                                fieldLabel: '#{msgs.last_name}',
                                                name: 'q_lastName',
                                                anchor:'95%'
                                            },{
                                                xtype:'textfield',
                                                fieldLabel: '#{msgs.email}',
                                                name: 'q_email',
                                                anchor:'95%'
                                            },{
                                                xtype:'textfield',
                                                fieldLabel: '#{msgs.manager}',
                                                name: 'q_manager',
                                                anchor:'95%'
                                            }
                                        ]
                                    }
                                ]
                            }
                        ],
                        [
                            {
                                title : '#{msgs.searchable_attrs}',
                                bodyStyle : 'padding:5px',
                                layout : 'column',
                                defaults : { // defaults are applied to items, not this container
                                    bodyBorder : false,
                                    border : false,
                                    bodyStyle : 'background-color:#EEEEEE'
                                },
                                bodyBorder : false,
                                border : false,
                                bodyStyle : 'background-color:#EEEEEE',
                                items: [extAttrsColLeft, extAttrsColRight]
                            }
                        ]
                    ],

                    doSearch : function() {
                         var vals = this.getValues();

                         this.fireEvent('search', vals);
                    },

                    doReset : function() {
                        this.resetRecursive(this);
                        
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

