/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.monitor.certifications.CertificationsGrid', {
    extend : 'SailPoint.grid.PagingGrid',
    alias : 'widget.certificationsgrid',

    fields : null,

    /**
     * @cfg columnConfig - Column config key which will be passed to the datasource
     */
    columnConfig : null,

    /**
     * @cfg config {Boolean} If true, empty or pending certifications will be ignored
     */
    filterEmpty : false,

    constructor : function(config){

        var fields = config.fields ? config.fields : [];
        fields.push('totalCertifications');
        fields.push('completedCertifications');
        fields.push('percentComplete');
        fields.push('id');

        if (!config.store) {
            config.store = SailPoint.Store.createRestStore({
                storeId: 'certificationGroupsGridStore',
                fields: fields,
                url: SailPoint.getRelativeUrl('/rest/certificationGroups'),
                remoteSort: true,
                defaultSort: 'name',
                root : config.root ? config.root : 'objects',
                totalProperty : 'count',
                simpleSortMode : true,
                autoLoad: config.autoLoadStore,
                extraParams: {colKey:config.columnConfig, filterEmpty:config.filterEmpty},
                method: 'POST'
            });            
        }
        
        config.cls = 'smallFontGrid selectableGrid';
        config.loadMask = true;

        Ext.apply(this, config);
        this.callParent(arguments);
    },

    /**
     * @private
     */
    initComponent : function() {
        var me = this;

        // This button expands and hides the adv search form
        this.advSearchButton = Ext.create('Ext.button.Button', {
            text: '#{msgs.advanced_search}',
            scale: 'medium',
            enableToggle:true
        });

        this.advSearchButton.setHandler( function(){
            this.fireEvent('toggleExpando', null);
        }, this);

        this.quickSearch = Ext.create('Ext.app.SearchField', {
            store:this.getStore(),
            paramName:'name',
            storeLimit:20,
            emptyText:'#{msgs.cert_grp_grid_search}',
            width:250
        });

        this.tbar = [
            this.quickSearch, ' ', this.advSearchButton
        ];

        this.plugins = [this.initAdvSearchForm()];
    
        this.addListener('itemclick', function(gridView, record, HTMLitem, index, e, eOpts){
            var id = record.get("id");
            if ($('editForm:certificationGroupId')){
                $('editForm:certificationGroupId').value = id;
                $('editForm:viewCertificationGroup').click();
            }
            else if ($('dashboardForm:certificationGroupId')) {
                $('dashboardForm:certificationGroupId').value = id;
                $('dashboardForm:viewCertificationGroup').click();
            }          
        });

        this.addListener('itemcontextmenu', function(gridView, record, HTMLitem, index, e, eOpts){
            var contextMenu = new Ext.menu.Menu();
            var recordId = record.getId();
            
            var grid = gridView.panel;

            contextMenu.add(
              new Ext.menu.Item({certId:recordId, text: '#{msgs.cert_grp_grid_action_change_owner}',
                  handler: grid.changeOwnerHandler, iconCls: 'forwardBtn', scope:this}),
              new Ext.menu.Item({certId:recordId, text: '#{msgs.cert_grp_grid_action_create_from_template}',
                  handler: me.createCertificationFromTemplate, iconCls: 'addBtn', scope: me})
            );
            
            e.stopEvent();
            contextMenu.showAt(e.xy);
        });

        this.callParent(arguments);
    },
    
    createCertificationFromTemplate: function(menuItem, e) {
        $('editForm:templateCertId').value = menuItem.certId;
        $('editForm:newCertificationButton').click();
    },

    search: function(parameters){
       if (this.quickSearch.getValue().length > 0){
           parameters.name = this.quickSearch.getValue();
           this.quickSearch.showClearTrigger();
       }
       parameters.colKey=this.columnConfig;
       this.callParent(arguments);
    },

    reset : function () {
        this.quickSearch.reset();
    },

    changeOwnerHandler : function(menuItem, event) {

        // scope of the handler is the grid. This is for readability
        var grid = this;

        var win = new Ext.Window({
            title:'#{msgs.cert_grp_grid_change_owner_dialog_title}',
            layout:"form",
            width:400,
            height:125,
            bodyStyle:'background-color:#FFF;padding:10px',
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'bottom',
                layout : {pack : 'end'},
                ui: 'footer',
                items: [{
                    scope: {window:win, certId:menuItem.certId},
                    text:'#{msgs.cert_grp_grid_change_owner_dialog_button_save}',
                    handler:function(){
                        var newOwnerId = win.getNewOwner();
                        if (!newOwnerId || newOwnerId === ''){
                            win.validate();
                            return;
                        }

                        var url = "/rest/certificationGroups/" + this.certId + "/forward";
                        win.getEl().mask();
                        Ext.Ajax.request({
                            scope: win,
                            url: SailPoint.getRelativeUrl(url),
                            method:'POST',
                            success: function(response){
                                win.getEl().unmask();
                                var respObj = Ext.decode(response.responseText);
                                if (!respObj.errors){
                                    win.fireEvent("forward");
                                    win.close();
                                } else {
                                    win.addError(respObj.errors);
                                }
                            },
                            failure: function(response){
                                win.getEl().unmask();
                                SailPoint.FATAL_ERR_ALERT.call(this);
                            },
                            params: {newOwner:newOwnerId, window:this.window}
                        });
                    }},
                    {
                        text:'#{msgs.cert_grp_grid_change_owner_dialog_button_cancel}',
                        cls : 'secondaryBtn',
                        handler:function(){win.close()},
                        scope:win
                    }
                ]}
            ],
            items:[{
                html:'', border:false, bodyBorder:false},
                 {
                    id: 'certChangeOwnerSuggestCmp',
                    xtype : 'identitySuggest',
                    width: 200,
                    listConfig: {width : 300},
                    baseParams: {context: 'Owner'},
                    allowBlank: false,
                    fieldLabel:'#{msgs.cert_grp_grid_label_new_owner}'
                }
            ],
            addError:function(error){
                this.setHeight(225);
                this.items.get(0).getEl().update("<div  class='formError'>" + error + "</div>");
            },
            getNewOwner: function(){
                return this.items.get(1).getValue();
            },
            validate: function(){
                var val = this.getNewOwner();
                if (!val || val === '') {
                    this.items.get(1).markInvalid();
                    return false;
                }

                this.items.get(1).clearInvalid();
                return true;
            }
        });

        win.addEvents('forward');

        // Refresh the grid once a forward is completed
        win.on('forward', function(){
            this.reload();
        }, grid);

        win.show();
    },


    /**
     * @private Initializes and returns the advanced search form plugin.
     */
    initAdvSearchForm : function(){

        var advSearchForm = new SailPoint.grid.GridExpandoPlugin({

            gridId : null,

            initExpandoPanel : function(grid) {
                
                var searchForm = Ext.create('SailPoint.panel.Search', {
                    id: grid.getId() + '-advSeachForm',
                    gridId: grid.getId(),
                    labelAlign: 'top',
                    columns: [
                        [
                            {
                                xtype: 'identitySuggest',
                                id: grid.getId() + '-owner',
                                width: 233,
                                listConfig: {width : 300},
                                baseParams: {context: 'Owner'},
                                fieldLabel: '#{msgs.cert_grp_grid_label_owner}'
                            },
                            {
                                xtype: 'daterange',
                                id: grid.getId() + '-dateRange',
                                fieldLabel: '#{msgs.cert_grp_grid_label_created}',
                                fieldWidth: 100,
                                name: 'startDate'
                            }
                        ],
                        [
                            {
                                xtype: 'percentrange',
                                id: grid.getId() + '-completion',
                                fieldLabel: '#{msgs.cert_grp_grid_label_completion}'
                            }
                        ],
                        [
                          {
                            xtype: 'multiselect',
                            id : grid.getId() + '-tags',
                            fieldLabel:"#{msgs.cert_grp_reviews_tags}",
                            width: 300,
                            listConfig: {width : 300},
                            httpMethod:'POST',
                            datasourceUrl : '/rest/suggest/object/Tag/',
                            emptyText:'#{msgs.grp_selector_empty_txt_value}'
                          }
                        ]
                    ],
                    
                    doSearch : function(){
                        var vals = {};

                        var dateRangeInput = Ext.getCmp( this.gridId + '-dateRange');
                        var ownerInput = Ext.getCmp(this.gridId +  '-owner');
                        var completionInput = Ext.getCmp(this.gridId +  '-completion');
                        var tagsInput = Ext.getCmp(this.gridId +  '-tags');

                        vals.completionMin = completionInput.getStartValue();
                        vals.completionMax = completionInput.getEndValue();

                        var dateRange = dateRangeInput.getSPFormValue();
                        if (dateRange) {
                            if (dateRange.start)
                                vals.createdMin = dateRange.start;
                            if (dateRange.end)
                                vals.createdMax = dateRange.end;
                        }

                        var owner = ownerInput.getValue();
                        if (owner) {
                            vals.owner = owner;
                        }

                        var tags = tagsInput.getValue();
                        if (tags) {
                            vals.tags = tags;//tags.join(','); this will mess up MultivaluedMap
                        }

                        this.fireEvent('search', vals);
                    },

                    doReset : function(){
                       this.resetValues();
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

                return searchForm;
            }

        }); 

        return advSearchForm;
    }


});
