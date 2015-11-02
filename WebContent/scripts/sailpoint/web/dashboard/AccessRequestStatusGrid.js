/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.dashboard.AccessRequestStatusGrid', {
    extend : 'SailPoint.grid.PagingGrid',
    alias : 'widget.spaccessrequeststatusgrid',

    /**
     * @cfg {Boolean} True if the user is not allowed to perform actions on the
     * requests from the grid instance. This will hide the selection checkboxes.
     */
    disableActions : false,

    /**
     * @cfg requester {String} Name of identity this grid should be limited to.
     */

    requester : null,

    isAdvSearchExpanded: false,

    /**
    * Special handling for the grid when shown in the Events tab of Define:Identity
    */
    isEventsTab: false,

    /**
     * @cfg {Boolean} If true, a link to the My Access Requests page will be displayed in the
     * toolbar
     */
    showViewAccessRequestLink : false,
    
    /**
     * Show External Ticket search field in advanced search
     */
    showExternalTicketSearch : true,

    constructor : function(config){
        var me = this;

        // We can create the fields list for the store using the
        // columns by adding a little extra info
        var cols = config.columns;
        var fields = [];
        if (cols) {
            for (var i = 0; i < cols.length; i++) {
                var col = cols[i];
                // in order to use the columns def for the datasource fields
                // we need to have a 'name' property, which matches the dataIndex.
                col.name = col.dataIndex;
                fields.push(col);
            }
        }

        // Add approvalItems - this is a hidden field used to populate the expando
        // fields.push({"name":"workItems","dataIndex":"workItems", hidden:true});
        fields.push({"name":"id","dataIndex":"id", hidden:true});

        // Add a hint that the user can click on grid rows

        var rowExpander = this.initRowExpander();
        
        rowExpander.onItemClick = function(view, record, item, index, e, eOpts) {
          if (view.clickedColumn != 0) {
            var target = Ext.get(e.target);
            if (target && (target.hasCls('x-grid-cell-inner') || target.up('div').hasCls('x-grid-cell-inner')) ) {
              this.toggleRow(index);
            }
          }
        };

        if (!config.disableActions) {
            var actionColumn = {
                xtype: 'actioncolumn',
                width: 50,
                menuText: '#{msgs.dash_access_req_cancel_action}',
                items: [{
                    tooltip: '#{msgs.dash_access_req_cancel_action}',
                    handler: me.showCancelDialog,
                    scope: me,
                    getClass: function(v, metadata, record) {
                        var executionStatus = record.get('executionStatus');
                        var completionDate = record.get('endDate');
                        if ((!completionDate || completionDate.length == 0) && (executionStatus && executionStatus != 'Terminated')) {
                            return 'remover';
                        } else {
                            return 'x-hide-display'; 
                        }
                    }
                }]
            };
            
            config.columns.unshift(actionColumn);
        }

        this.baseParams = {};

        if (config.identity)
          this.baseParams['identity'] = config.identity;

        // if showing grid from dashboard widget always show just pending
        if (config.showViewAccessRequestLink || config.id == 'dashboardAccessRequestGrid') {
            this.baseParams['status'] =  'pending';
            this.baseParams['isDashboardWidget']  = 'true';
        }
        
        var store;
        if (config.store) {
            store = config.store;
            store.extraParams = this.baseParams;
        } else {
            store = SailPoint.Store.createRestStore({
                url: SailPoint.getRelativeUrl('/rest/identityRequests/'),
                fields:fields,
                remoteSort:true,
                method:'POST',
                totalProperty: 'count',
                // todo note we're setting this again in onTrigger1Click in the searchField
                extraParams: this.baseParams
            });
        }

        // Apply these properties if they weren't specified in the
        // config
        Ext.applyIf(config, {
            usePageSizePlugin:true,
            store: store,
            plugins: [this.initAdvSearchForm(), rowExpander],
            viewConfig:{
                stripeRows : true,
                enableRowBody : true,
                autoFill:true
            }
       });

       var searchLabel = '#{msgs.advanced_search}';
       if (config.isEventsTab) {
           searchLabel = '#{msgs.search}';
       }

       // This button expands and hides the adv search form
       this.advSearchButton = new Ext.Action({
            text: searchLabel,
            scale: 'medium',
            enableToggle:true
       }); 

       if (config.isEventsTab) {
         config.tbar = [ this.advSearchButton ];
       }
       else {
         this.quickSearch = new Ext.app.SearchField({
          store:config.store,
          paramName:'identityName',
          emptyText:'#{msgs.dash_access_filter_by_identity}',
            listeners : {
                'focus' : {
                    fn : function(f) {
                        if (this.emptyText == f.getValue()) {
                            f.setValue('');
                        }
                    },
                    scope : this
                }
            }
         });
         config.tbar = [this.quickSearch, ' ', this.advSearchButton];
       }

        if (config.showViewAccessRequestLink){
            config.tbar.push('->');
            config.tbar.push('<a style="text-decoration:none" href="'+SailPoint.getRelativeUrl('/manage/accessRequest/myAccessRequests.jsf')+'">#{msgs.dash_access_req_link_my_acess_requests}<img style="margin-left:4px" src="'+SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png')+'"/></a>' ); 
        }

       Ext.apply(this, config);
       this.callParent(arguments);
    },

    /**
     * @private
     */
    initComponent : function() {
        // Fire event registered by 
        this.advSearchButton.setHandler( function(){
            this.fireEvent('toggleExpando', null);
            this.isAdvSearchExpanded = !this.isAdvSearchExpanded;
            this.fireEvent('afterToggleExpando', this.isAdvSearchExpanded);
            if(this.afterSearchButtonAction){
                this.afterSearchButtonAction();
            }
        }, this);

        this.callParent(arguments);
        
        this.getView().on('expandbody', this.loadExpandoContent);
    },

     search: function(parameters){
        if (this.quickSearch && this.quickSearch.getValue() && this.quickSearch.getValue().length > 0){
            parameters.identity = this.quickSearch.getValue();
            this.quickSearch.showClearTrigger();
        }
        this.callParent(arguments);
    },

    /**
     * @private Initializes and returns the advanced search form plugin.
     */
    initAdvSearchForm : function(){

        return {
            
            ptype : 'gridexpandoplugin',

            gridId : null,

            initExpandoPanel : function(grid){

                var showRequesterInput = !grid.requester;

                var items = [[
                              {
                                  xtype : 'identitySuggest',
                                  id: grid.getId() + '-requester',
                                  width: 200,
                                  listConfig : {width : 300},
                                  initialData: jsonFilterRequesterIdentity,
                                  fieldLabel:'#{msgs.dash_access_req_col_requester}'
                              },
                              {
                                  xtype : 'identitySuggest',
                                  id: grid.getId() + '-targetIdentity',
                                  width: 200,
                                  listConfig : {width : 300},
                                  initialData: jsonFilterRequesteeIdentity,
                                  fieldLabel:'#{msgs.srch_input_def_request_requestee}'
                              },
                              {
                                  xtype:'textfield',
                                  id: grid.getId() + '-requestId',
                                  fieldLabel: '#{msgs.dash_access_req_search_id}',
                                  name: 'requestId',
                                  width:150,
                                  listConfig:{width:150}
                              },
                              {
                                  xtype:'combo',
                                  id: grid.getId() + '-type',
                                  fieldLabel: '#{msgs.dash_access_req_search_type}',
                                  name: 'type',
                                  displayField: 'displayName',
                                  valueField: 'name',
                                  store : SailPoint.Store.createRestStore({
                                      url: SailPoint.getRelativeUrl('/rest/requestAccess/types'),
                                      fields: ['name', 'displayName'],
                                      remoteSort:true,
                                      method:'GET',
                                      totalProperty: 'count'
                                  }),
                                  width:150,
                                  listConfig:{width:150}
                              }
                          ]];

                if (grid.isEventsTab) {
                    items[0].splice(1, 1);
                }

                var panel2items = [{ 
                    xtype:'daterange',
                    id: grid.getId() + '-dateRange',
                    layout: {
                              type: 'column'
                            },
                    fieldLabel: '#{msgs.dash_access_req_search_date_range}',
                    name: 'startDate'
                }];

                if (!grid.showViewAccessRequestLink) {
                    panel2items.push({
                        xtype:'combo',
                        id: grid.getId() + '-status',
                        fieldLabel: '#{msgs.dash_access_req_search_status}',
                        name: 'status',
                        store:[
                            ['all', '#{msgs.dash_access_req_search_status_option_all}'],
                            ['pending', '#{msgs.dash_access_req_search_status_option_pending}'],
                            ['canceled', '#{msgs.dash_access_req_search_status_option_canceled}'],
                            ['complete','#{msgs.dash_access_req_search_status_option_complete}']
                        ],
                        width:150,
                        listConfig:{width:150}
                    });
                }
                
                panel2items.push({
                        xtype:'combo',
                        id: grid.getId() + '-priority',
                        fieldLabel: '#{msgs.dash_access_req_search_priority}',
                        name: 'priority',
                        store:[
                            ['normal', '#{msgs.work_item_level_normal}'],
                            ['high', '#{msgs.work_item_level_high}'],
                            ['low', '#{msgs.work_item_level_low}']
                        ],
                        width:150,
                        listConfig:{width:150}
                    },
                    {
                        xtype:'textfield',
                        id: grid.getId() + '-extTicketId',
                        fieldLabel: '#{msgs.dash_access_req_search_externalTicketID}',
                        name: 'extTicketId',
                        width:150,
                        listConfig:{width:150},
                        hidden: !grid.showExternalTicketSearch
                });

                items.push(panel2items);

                items.push({
                    xtype:'groupselector',
                    id: grid.getId() + '-group',
                    matchFieldWidth : true,
                    datasourceUrl : '/rest/groupFactory/list',
                    fieldLabel: '#{msgs.dash_access_req_search_group}',
                    name: 'group'
                });

                var searchForm = Ext.create('SailPoint.panel.Search', {
                    id:grid.getId() + '-accessRequestSearchForm',
                    gridId : grid.getId(),
                    labelAlign : 'top',
                    columns : items,
                    doSearch : function() {
                        
                        var vals = {};

                        var dateRangeInput = Ext.getCmp(this.gridId + '-dateRange');
                        var statusInput = Ext.getCmp(this.gridId + '-status');
                        var requesterInput = Ext.getCmp(this.gridId + '-requester');
                        var groupSelectInput = Ext.getCmp(this.gridId + '-group');
                        
                        var priorityInput = Ext.getCmp(this.gridId + '-priority');
                        var requestIdInput = Ext.getCmp(this.gridId + '-requestId');
                        var typeInput = Ext.getCmp(this.gridId + '-type');
                        var targetIdentity = Ext.getCmp(this.gridId + '-targetIdentity');
                        var externalTicketInput = Ext.getCmp(this.gridId + '-extTicketId');

                        if (requesterInput.getValue() != null  && requesterInput.getValue().length > 0)
                          vals.requester = requesterInput.getValue();

                        if (statusInput != null && statusInput.getValue() != null  && statusInput.getValue().length > 0) {
                          vals.statusParm = statusInput.getValue();
                        }

                        if (priorityInput.getValue() != null  && priorityInput.getValue().length > 0)
                          vals.priority = priorityInput.getValue();

                        if (requestIdInput.getValue() != null  && requestIdInput.getValue().length > 0)
                          vals.requestId = requestIdInput.getValue();

                        if (typeInput.getValue() != null  && typeInput.getValue().length > 0)
                          vals.requestType = typeInput.getValue();

                        if (targetIdentity && targetIdentity.getValue() != null && targetIdentity.getValue().length > 0)
                          vals.identity = targetIdentity.getValue();

                        if (dateRangeInput) {
                          var dateRange = dateRangeInput.getSPFormValue();
                          if(dateRange) {
                              if (dateRange.start) {
                                  vals.startDate = dateRange.start;
                              }
                              if (dateRange.end) {
                                  vals.endDate = dateRange.end;
                              }
                          }
                        }

                        var groups = groupSelectInput.getValue();
                        if (groups && groups.length && groups.length > 0) {
                            vals.groups = groups.join(',');
                        }
                        
                        if(externalTicketInput && externalTicketInput.getValue().length > 0) {
                            vals.extTicketId = externalTicketInput.getValue();
                        }
                        
                        vals.saveSearch = 'true';

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

                return searchForm;
            }

        };
    },

    loadExpandoContent: function(rowNode, record, expandRow, eOpts) {
        var rowBody = Ext.get(expandRow).query('.x-grid-rowbody')[0];
        
        Ext.get(rowBody).load({
            url: SailPoint.getRelativeUrl('/manage/accessRequest/accessRequestDetails.jsf'),
            scripts: true,
            params: {
                id: record.getId()
            },
            text: '#{msgs.dash_access_req_loading_info}',
            callback: SailPoint.Manage.Grid.AccessRequests.adornColumn
        });
    },

    initRowExpander : function() {
        return {
            ptype: 'sprowexpander',
            rowBodyTpl: ' '
        };
    },

    loadSettings: function(gid, settings) {

        var dateRangeInput = Ext.getCmp(gid + '-dateRange');
        var statusInput = Ext.getCmp(gid + '-status');
        var groupSelectInput = Ext.getCmp(gid +  '-group');
        
        var priorityInput = Ext.getCmp(gid +  '-priority');
        var requestIdInput = Ext.getCmp(gid +  '-requestId');
        var typeInput = Ext.getCmp(gid +  '-type');
        var externalTicketInput = Ext.getCmp(gid + '-extTicketId');

        typeInput.setValue(settings.requestType);

        statusInput.setValue(settings.requestStatus);

        requestIdInput.setValue(settings.requestId);

        var dateRange = {};
        if (settings.startDate != 0) {
          dateRange.start = new Date(settings.startDate);
        }
        if (settings.endDate != 0) {
          dateRange.end = new Date(settings.endDate);
        }

        dateRangeInput.setValue(dateRange);
    
        priorityInput.setValue(settings.priority);
        
        externalTicketInput.setValue(settings.extTicketId);

        var searchForm = Ext.getCmp(gid + '-accessRequestSearchForm');

        searchForm.doSearch();
    },

    load : function () {
        this.getStore().load();
    },

    reset : function () {
      if (this.quickSearch) {
        this.quickSearch.clearValue();
      }
    },

    showCancelDialog : function(grid, rowIndex){

        var record = this.getStore().getAt(rowIndex);

        var win = new SailPoint.lcm.CancelWorkflowDialog({
            taskResultId:record.getId()
        });

        win.on('workflowCanceled', function(){
            this.load();    
        }, this);

        win.show();
    }

});

/**
 * Generates approval grid popup window.
 * @param workItemId
 */
SailPoint.dashboard.AccessRequestStatusGrid.showApprovalItems = function(itemUid) {

    var win = Ext.getCmp('win-approvals-' + itemUid );
    if (!win) {
        var win = new Ext.Window({
            id:'win-approvals-' + itemUid ,
            cls:'smallFontGrid',
            items:[
                new Ext.grid.TableGrid('approvals-' + itemUid, {
                    cls:'wrappingGrid',
                    height:350, 
                    width:768,
                    viewConfig: {
                        stripeRows: true
                    }
                })
            ],
            buttons : [
                {
                    text:'#{msgs.dash_access_req_dialog_button_close}', 
                    listeners : {
                        'click' :{
                            fn:function() {
                                this.hide();
                            }, scope:win
                        }
                    }
                }
            ],
            closable:false,
            layout:'fit',
            width:1000,
            height:350,
            bodyStyle:'background-color:#FFF',
            title:'#{msgs.dash_access_req_dialog_title_appr_items}',
            closeAction:'hide'
        });
    }
    win.show();
};

