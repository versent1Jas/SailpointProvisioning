/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.certification.ExclusionsGrid', {
	extend : 'SailPoint.grid.PagingGrid',

    /**
     * @cfg UI Column config to use
     */
    colKey:null,

    /**
     * @cfg {String} Guid of the certification whose exclusions should be loaded.
     */
    certificationId:null,

    /**
     * @cfg {String} Guid of the certification group whose exclusions should be loaded.
     */
    certificationGroupId : null,

    /**
     * @cfg {String} Type of entity included in this certification. Defaults to 'Identity'.
     */
    entityType : "Identity",

    /**
     *
     * @cfg showEntitlementDesc {Boolean} True if the grid should load entitlement descriptions
     */
    showEntitlementDesc: false,

    /**
     * @private Show Entitlement Descriptions toolbar button
     */
    showDescBtn : null,

    constructor : function(config){

        // Customize quick search text based on the entity type in the
        // certification
        var quickSearchText = "#{msgs.cert_exclusions_filter_by_identity}";
        if (config.entityType == 'AccountGroup'){
            quickSearchText = "#{msgs.cert_exclusions_filter_by_account_group}";
        } else if (config.entityType == 'Role'){
            quickSearchText = "#{msgs.cert_exclusions_filter_by_role}";
        } else if (config.entityType == 'DataOwner') {
        	quickSearchText = "#{msgs.cert_exclusions_filter_by_data_owner}";
        }

        var baseParams = {colKey:config.colKey};
        if (config.certificationId){
            baseParams.certId = config.certificationId;
        }
        if (config.certificationGroupId){
            baseParams.certGroupId = config.certificationGroupId;
        }

        Ext.applyIf(config, {
            cls:'wrappingGrid',
            usePageSizePlugin:true,
            store : SailPoint.Store.createRestStore({
                url: SailPoint.getRelativeUrl("/rest/exclusions/"),
                fields:config.fields,
                remoteSort:true,
                extraParams:baseParams,
	            simpleSortMode : true
            }),
            viewConfig:{
                stripeRows : true,
                enableRowBody : true,
                autoFill:true
            }
       });

       this.quickSearch = new Ext.app.SearchField({
        store:config.store,
        paramName:'query',
        emptyText:quickSearchText
       });

       this.showDescBtn = new Ext.Action({
           text: '#{msgs.cert_exclusions_button_show_descriptions}',
           enableToggle:false,
           scope:this,
           handler:this.toggleEntitlementDesc
       });

       config.tbar = [this.quickSearch, '->', this.showDescBtn];

       Ext.apply(this, config);
       this.callParent(arguments);
    },

    /**
     * @private Handler for the 'Show Entitlement Desc' button
     */
    toggleEntitlementDesc : function(){
        this.showEntitlementDesc = !this.showEntitlementDesc;
        this.getStore().getProxy().extraParams.showDesc = this.showEntitlementDesc;
        this.reload();
        
        if (this.showEntitlementDesc){
            this.showDescBtn.setText('#{msgs.cert_exclusions_button_show_values}');
         } else {
             this.showDescBtn.setText('#{msgs.cert_exclusions_button_show_descriptions}');
         }
    },

    /**
     * @private
     */
    initComponent : function() {
        SailPoint.certification.ExclusionsGrid.superclass.initComponent.apply(this, arguments);
    },

    reload: function(){
        var lastOps = this.getStore().lastOptions;
        if (!lastOps)
            lastOps = {params:{start:0}};
        else if (!lastOps.params)
            lastOps.params = {start:0};
        lastOps.params.showDesc = this.showEntitlementDesc;
        this.getStore().load(lastOps);
    },

    load : function () {
        this.getStore().load();
    }

});

SailPoint.certification.ExclusionsGrid.renderDescription = function(value, p, record) 
{
    var str = '<span class=\'notItalic font10\'>{0}</span>';
    return Ext.String.format(str, ( value == null ? '' : value));
}