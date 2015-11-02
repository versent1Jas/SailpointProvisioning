/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.certification.CertificationGroupReviewGrid', {
	extend : 'SailPoint.grid.PagingGrid',

    certGroupId : null,

    constructor : function(config){

        var dsUrl = "/rest/certifications/search";

        if (!this.baseParams)
            this.baseParams = {};
        this.baseParams["certGroupId"] = config.certGroupId;
        this.baseParams["colKey"] = "certificationAccessReviewsTableColumns";

        Ext.applyIf(config, {
            usePageSizePlugin:true,
            store : SailPoint.Store.createRestStore({
                url: SailPoint.getRelativeUrl(dsUrl),
                fields:config.gridMetaData.fields,
                remoteSort:true,
                method:'POST',
                extraParams:this.baseParams
            }),
            viewConfig:{
                stripeRows : true,
                enableRowBody : true,
                autoFill:true
            }
       });

       this.quickSearch = new Ext.app.SearchField({
          store:config.store,
          paramName:'name',
          emptyText:'#{msgs.cert_grp_reviews_filter_by_name}'
       });

       config.tbar = [ this.quickSearch, ' ', {
           xtype : 'button',
           text: '#{msgs.advanced_search}',
           scale: 'medium',
           enableToggle:true,
           listeners : {
               click : {
                   fn : function(){
                       this.fireEvent('toggleExpando', null);
                   },
                   scope: this
               }
           }
       } ];

       config.selModel = new Ext.selection.RowModel({mode:'single'});

       Ext.apply(this, config);
       this.callParent(arguments);
    },

    /**
     * @private
     */
    initComponent : function() {
    	var me = this;

        this.plugins = [this.initAdvSearchForm()];

        this.addListener('itemcontextmenu', function(gridView, record, HTMLitem, index, e, eOpts){
            var contextMenu = new Ext.menu.Menu();
            var recordId = record.getId();
            var recordLimitReassign = record.get("limitReassignments");

            if (!record.data.signed && this.enableForwarding) {
                contextMenu.add(
                    new Ext.menu.Item({
                        certId: recordId,
                        limitReassignments: recordLimitReassign,
                        text: '#{msgs.cert_grp_grid_action_forward}',
                        handler: me.forwardHandler,
                        iconCls: 'forwardBtn',
                        scope: this,
                        disabled:(record.data.certifiers.length>1)
                    })
                );
            }

            contextMenu.add(
                new Ext.menu.Item({
                    certId: recordId,
                    text: '#{msgs.cert_grp_reviews_email}',
                    handler: me.emailHandler,
                    iconCls: 'emailBtn',
                    scope: this
                })
            );

            e.stopEvent();
            contextMenu.showAt(e.xy);
        });

        SailPoint.certification.CertificationGroupReviewGrid.superclass.initComponent.apply(this, arguments);
    },

    forwardHandler : function(menuItem, event){
        forwardCertificationWorkItem(menuItem.certId, 'viewCertificationGroup', menuItem.limitReassignments);
    },

    emailHandler : function(menuItem, event){
        SailPoint.EmailWindow.open(null, 'certificationReminderEmailTemplate', menuItem.certId);
    },

    search: function(parameters){
        if (this.quickSearch.getValue().length > 0){
            parameters.name = this.quickSearch.getValue();
            this.quickSearch.showClearTrigger();
        }
        this.callParent(arguments);
    },

    load : function () {
        this.getStore().load();
    },

    reset : function () {
        this.quickSearch.clearValue();
    },

    /**
     * @private Initializes and returns the advanced search form plugin.
     */
    initAdvSearchForm : function(){

        var advSearchForm = new SailPoint.grid.GridExpandoPlugin({

            gridId : null,

            initExpandoPanel : function(grid){

                var searchForm = Ext.create('SailPoint.panel.Search', {
                    id : grid.getId() + '-advSeachForm',
                    gridId : grid.getId(),
                    labelAlign : 'top',
                    columns : [[
                        {
                            xtype : 'identitySuggest',
                            id: grid.getId() + '-certifier',
                            width: 200,
                            listConfig : {width : 300},
                            baseParams: {context: 'Owner'},
                            fieldLabel:'#{msgs.cert_grp_reviews_certifier}'
                        },
                        new SailPoint.form.PercentRangeInput({
                            xytpe : 'percentrange',
                            id: grid.getId() + '-completion',
                            width: 40,
                            fieldLabel:'#{msgs.cert_grp_reviews_complete}'
                        }),
                        {
                            xtype: 'spBooleanCombo',
                            id: grid.getId() + '-eSigned',
                            fieldLabel: '#{msgs.cert_grp_grid_label_esigned}'
                        }],[
                        {
                            xtype : 'multiselect',
                            id : grid.getId() + '-tags',
                            fieldLabel:"#{msgs.cert_grp_reviews_tags}",
                            datasourceUrl : '/rest/suggest/object/Tag/',
                            httpMethod:'POST',
                            width: 400,
                            emptyText:'#{msgs.grp_selector_empty_txt_value}'
                        }]
                    ],

                    doSearch : function(){
                        var vals = {};

                        var certifierInput = Ext.getCmp(this.gridId +  '-certifier');
                        var completionInput = Ext.getCmp(this.gridId +  '-completion');
                        var tagsInput = Ext.getCmp(this.gridId +  '-tags');
                        var eSignInput = Ext.getCmp(this.gridId + '-eSigned');
                        
                        vals.itemCompMin = completionInput.getStartValue();
                        vals.itemCompMax = completionInput.getEndValue();

                        var certifiers = certifierInput.getValue();
                        if (certifiers) {
                            vals.certifiers = certifiers;
                        }

                        var tags = tagsInput.getValue();
                        if (tags) {
                            vals.tags = tags;//tags.join(','); this will mess up MultivaluedMap
                        }
                        
                        var esigned = eSignInput.getValue();
                        if (esigned) {
                            vals.esigned = esigned;
                        }
                        
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
