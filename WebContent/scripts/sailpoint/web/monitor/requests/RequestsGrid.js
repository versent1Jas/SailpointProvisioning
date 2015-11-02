// Create grid for monitor/requests/requests.jsf with advanced search panel 

Ext.ns('SailPoint',
       'SailPoint.Monitor',
       'SailPoint.Monitor.Grid',
       'SailPoint.Monitor.Grid.Request');

SailPoint.Monitor.Grid.Request.createGrid = function(gridMetaData, gridStateStr, stateId) {
    var requestsGridState = new SailPoint.GridState({name: 'requests', gridStateObj: JSON.parse(gridStateStr)});  
    Ext.QuickTips.init();

    var requestsStore = SailPoint.Store.createRestStore({
        fields: gridMetaData.fields,
        autoLoad: false,
	    url: CONTEXT_PATH + '/rest/requests/list',
	    method: 'POST',
	    remoteSort: true
	});
	  
    var grid = new SailPoint.Monitor.Grid.Request.RequestAdvSearchGrid({
        store: requestsStore,
        cls: 'smallFontGrid selectableGrid',
        stateId: stateId,
        stateful: true,
        gridStateStr: gridStateStr,
        gridMetaData: gridMetaData,
        listeners: { itemclick: SailPoint.Monitor.Grid.Request.clickRequest },
	    viewConfig: {
	        scrollOffset: 1,
	        stripeRows:true
	    },
	    usePageSizePlugin: true
    });

    grid.initialLoad();
	  
    return grid;
};

Ext.define('SailPoint.Monitor.Grid.Request.RequestAdvSearchGrid', {
	extend : 'SailPoint.grid.PagingGrid',
    
    disableActions : false,
    
    requester : null,

    isAdvSearchExpanded: false,
    
	constructor : function(config){ 
	    // This button expands and hides the adv search form
	    this.advSearchButton = new Ext.Action({
	         text: '#{msgs.advanced_search}',
             scale: 'medium',
	         enableToggle:true
	    }); 
	    
	    config.plugins = [this.initAdvSearchForm()];
	    config.tbar = [ this.advSearchButton ];
	    	    
	    Ext.apply(this, config);
	    this.callParent(arguments);
	},
	
    initComponent : function() {

        // Fire event registered by 
        this.advSearchButton.setHandler( function(){
            this.fireEvent('toggleExpando', null);                     
            this.isAdvSearchExpanded = !this.isAdvSearchExpanded;
            this.fireEvent('afterToggleExpando', this.isAdvSearchExpanded);
        }, this);

        this.callParent(arguments);
    },
    
    /**
     * @private Initializes and returns the advanced search form plugin.
     */
    initAdvSearchForm : function(){

        var advSearchForm = new SailPoint.grid.GridExpandoPlugin({

            gridId : null,

            initExpandoPanel : function(grid){

                var showRequesterInput = !grid.requester;

                var searchForm = Ext.create('SailPoint.panel.NoHeaderPanel', {
                    id:grid.getId() + '-requestSeachForm',
                    gridId : grid.getId(),
                    collapsed:true,
                    height:210,
                    animCollapse: false, 
                    border:false,
                    bodyBorder:false,
                    frame:false,
                    style:'background-color:#EEEEEE;border:1px solid #CCCCCC',
                    bodyStyle:'background-color:#EEEEEE;padding-top:10px',
                    buttonAlign:'right',
                    layout:'column',
                    items: [
                        {
                        	xtype: 'form',
                        	fieldDefaults : {
                        		labelAlign: 'top'
                        	},
                            border:false,
                            bodyBorder:false,
                            columnWidth :.5,
                            bodyStyle:'margin-left:15px;background-color:#EEEEEE',
                            items:[
                                   {
                                       id:grid.getId() + '-name',
                                       xtype:'textfield',
                                       fieldLabel: '#{msgs.name}',
                                       width:200
                                   },
                                   {
                                       xtype: 'spcombo',
                                       id: grid.getId() + '-type',
                                       datasourceUrl: '/rest/requests/typeList',
                                       fieldLabel: '#{msgs.type}',
                                       width: 200,
                                       editable: false
                                   },  
                                   {
                                       id:grid.getId() + '-target',
                                       xtype:'textfield',
                                       fieldLabel: '#{msgs.target}',
                                       width:200
                                   }
                                  ]
                        },
                        {
                        	xtype: 'form',
                        	fieldDefaults : {
                        		labelAlign: 'top'
                        	},
                            columnWidth :.5,
                            border:false,
                            bodyBorder:false,
                            bodyStyle:'background-color:#EEEEEE',
                            items:[
                                   {
                                       id: grid.getId() + '-createdDateRange',
                                       xtype:'daterange',
                                       fieldLabel: '#{msgs.created}'
                                   },
                                   {
                                       xtype: 'combobox',
                                	   id: grid.getId() + '-completed',
                                       store: [['',''], ['false', '#{msgs.txt_false}'],['true', '#{msgs.txt_true}']],
                                       fieldLabel: '#{msgs.completed}',
                                       width: 100,
                                       queryMode: 'local',
                                       editable: false
                                   }
                                 ]
                        }
                    ],
                    
                    buttons : [
						{
							text:"#{msgs.button_search}",
							handler: function() {
								var searchForm = this.ownerCt.ownerCt;
								searchForm.doSearch();
							}
						},
						{
							text:"#{msgs.button_reset}",
                            cls : 'secondaryBtn',
							handler: function() {
								var searchForm = this.ownerCt.ownerCt;
								searchForm.doReset();
							}
						}
                    ],

                    doSearch : function(){
                    	 var vals = {};

                         var nameInput = Ext.getCmp( this.gridId + '-name');
                         var typeInput = Ext.getCmp(this.gridId + '-type');
                         var targetInput = Ext.getCmp(this.gridId +  '-target');
                         var createdDateRangeInput = Ext.getCmp(this.gridId +  '-createdDateRange');
                         var completedInput = Ext.getCmp(this.gridId +  '-completed');

                         vals.name = nameInput.getValue();
                         vals.type = typeInput.getValue();
                         
                         //'Target' translates to string1 column
                         vals.string1 = targetInput.getValue();

                         var createdDateRange = createdDateRangeInput.getSPFormValue();
                         if (createdDateRange) {
                             if (createdDateRange.start)
                                 vals.createdStartDate = createdDateRange.start;
                             if (createdDateRange.end)
                                 vals.createdEndDate = createdDateRange.end;
                         }
                         
                         vals.completed = completedInput.getValue();

                         this.fireEvent('search', vals);
                    },

                    doReset : function(){
                        this.items.each(function(panel){
                            panel.items.each(function(field){
                                if (field.reset)
                                field.reset();
                                if (field.clear)
                                    field.clear();
                            });
                       });
                       this.fireEvent('reset');
                    }

                });

                searchForm.addEvents('reset', 'search');

                searchForm.on('reset', function(){
                    this.search({});
                }, grid);

                searchForm.on('search', function(values){
                    this.search(values);
                }, grid);

                return searchForm;
            }

        }); //  END new SailPoint.grid.GridExpandoPlugin

        return advSearchForm;
    }
});

SailPoint.Monitor.Grid.Request.clickRequest = function(view, record, item, index, e, eOpts) {
    $('editForm:selectedId').value = record.getId();
    $('editForm:editButton').click();
};
