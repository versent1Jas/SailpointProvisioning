/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
* @class SailPoint.LinkDetailPopup
* @extends Ext.Window
*
* Popup window which displays the attributes for a given link. The popup is
* managed as a singleton instance. All the hide/show methods are static methods
* on this class.
*/
Ext.define('SailPoint.LinkDetailPopup', {
	extend : 'Ext.Window',
	alias : 'widget.linkdetailpopup',

    grid:null,

    pendingMoveGrid:null,
    
    tabPanel:null,
    
    linkId:null,
        
    initComponent:function(){

        this.grid = new SailPoint.grid.PropertyGrid({
            url: SailPoint.getRelativeUrl('/manage/correlation/linkAttributes.json'),
            title:"#{msgs.title_account_attrs_dialog}",
            width:300,
            height:270,
            region:'center' // using a borderlayout to handle a bug with ie7
        });

        this.pendingMoveGrid = new Ext.grid.Panel({
                // store
                store: SailPoint.Store.createStore({
                    fields : ['id', 'pendingAction'],
                    url: SailPoint.getRelativeUrl('/manage/correlation/pendingMoves.json'),
                    root:'rows',
                    extraParams:{cmd:'getData', objName:'person'},
                    storeId:'pendingAction'
                })
     
                // column model
                ,columns:[{
                     dataIndex:'pendingAction'
                    ,header:'#{msgs.identity_correlation_pending_actions}'
                    ,width:200
                }]
     
                // force fit
                ,viewConfig:{scrollOffset:0}
                ,title:'#{msgs.identity_correlation_pending_actions}'
                ,width:300
                ,height:270
         });

        this.tabPanel = new Ext.TabPanel({
            activeTab:0,
            items:[this.grid, this.pendingMoveGrid]
        });

        this.pendingMoveGrid.on('show',
            function() {
              this.pendingMoveGrid.store.getProxy().extraParams = {id:this.linkId};
              this.pendingMoveGrid.store.load();
            }, this
        );

        Ext.apply(this, {
            title:'#{msgs.identity_correlation_account_info}',
            width:480,
            height:400,
            closeAction:'hide',
            plain: true,
            autoScroll:true,
            linkId:null,
            items:[this.tabPanel],
            buttons:[
                new Ext.Button({
                    text:'#{msgs.button_close}',
                    cls : 'secondaryBtn',
                    handler:SailPoint.LinkDetailPopup.hide
                })
            ]
        });

        SailPoint.LinkDetailPopup.superclass.initComponent.apply(this, arguments);
    }
});

/**
 * Global instance of the popup
 * @private
*/
SailPoint.LinkDetailPopup.instance = null;

/**
* Gets the global instance, or creates a new one if none exists.
*/
SailPoint.LinkDetailPopup.getInstance = function(){
    if (!SailPoint.LinkDetailPopup.instance)
        SailPoint.LinkDetailPopup.instance = new SailPoint.LinkDetailPopup();
    return SailPoint.LinkDetailPopup.instance;
};

/**
* Hides global popup instance
*/
SailPoint.LinkDetailPopup.hide = function(){
    SailPoint.LinkDetailPopup.getInstance().hide() ;
};

/**
* Loads the date for the given link and shows the popup window.
* @param {String} linkId The ID of the link to display.
*/
SailPoint.LinkDetailPopup.show = function(linkId){
    SailPoint.LinkDetailPopup.getInstance().tabPanel.setActiveTab(0);
    SailPoint.LinkDetailPopup.getInstance().linkId = linkId;
    SailPoint.LinkDetailPopup.getInstance().grid.load({id:linkId});
    SailPoint.LinkDetailPopup.getInstance().show();
};

/**
* Template used to generate the popup links in the name column of the grid.
*/
SailPoint.LinkDetailPopup.LinkTemplate = new Ext.Template(
    '<a onclick="SailPoint.LinkDetailPopup.show(\'{id}\');" style="text-decoration: underline">{name}</a>'
);

SailPoint.LinkDetailPopup.LinkPendingMoveTemplate = new Ext.Template(
    '<a onclick="SailPoint.LinkDetailPopup.show(\'{id}\');" style="text-decoration: underline">{name}</a>'
    ,'<img width="16px" height="16px" src='+SailPoint.getRelativeUrl("/images/icons/pending_move_16.png")+' alt="#{msgs.identity_acct_pending_move}" style="padding: 0px 7px;" title="#{msgs.identity_acct_pending_move}">'
);

/**
 * Rendered used in the linkGrid to create a popup link on the account id property. Passed in
 * as a part of the column config. Check ManualCorrelationLinkBean.java.
*/
SailPoint.LinkDetailPopup.renderGridCellLink = function (val, meta, record, row, col, store){
  if (record.data.pendingMove === true) {
    return SailPoint.LinkDetailPopup.LinkPendingMoveTemplate.apply({id:record.getId(), name:val});
  } else {
    return SailPoint.LinkDetailPopup.LinkTemplate.apply({id:record.getId(), name:val});
  }
};
