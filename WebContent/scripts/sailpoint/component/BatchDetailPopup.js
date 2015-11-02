/* (c) Copyright 2013 SailPoint Technologies, Inc., All Rights Reserved. */

/**
* @class SailPoint.BatchDetailPopup
* @extends Ext.Window
*
* Popup window used to display batch request items grid.
*/
Ext.define('SailPoint.BatchDetailPopup', {
	extend : 'Ext.Window',
	alias : 'widget.BatchDetailPopup',

    grid:null,

    itemsStore:null,
        
    initComponent:function(){

        var itemsColumns = [];
        itemsColumns.push({header: '#{msgs.batch_detail_popup_grid_request_data}', dataIndex: 'requestData', sortable: true, hideable:true});
        itemsColumns.push({header: '#{msgs.batch_detail_popup_grid_status}', dataIndex: 'status', sortable: true, hideable:true});
        itemsColumns.push({header: '#{msgs.batch_detail_popup_grid_result}', dataIndex: 'result', sortable: true, hideable:true});

        // data store
        this.itemsStore = SailPoint.Store.createStore({
            autoLoad: false,
            url: CONTEXT_PATH + '/manage/batchRequest/batchItemsDataSource.json',
            root: 'objects',
            totalProperty: 'count',
            fields: ['id', 'requestData', 'status', 'result'],
            remoteSort: true,
            simpleSortMode : true
        });

        // batchrequests grid
        this.grid = new SailPoint.grid.PagingGrid({
          id: 'batchRequestsGrid',
          stateful: true,
          store: this.itemsStore,
          columns: itemsColumns,
          selType: 'cellmodel',
          layout:'fit',
          pageSize: 10,
          loadMask: true,
          viewConfig: {
            stripeRows: true,
            scrollOffset: 1
          }
        });


        Ext.apply(this, {
            title:'#{msgs.batch_items_title}',
            width:580,
            height:350,
            closeAction:'hide',
            plain: true,
            autoScroll:true,
            items:[this.grid],
            buttons:[
                new Ext.Button({
                    text:'#{msgs.button_close}',
                    cls : 'secondaryBtn',
                    handler:SailPoint.BatchDetailPopup.hide
                })
            ]
        });

        SailPoint.BatchDetailPopup.superclass.initComponent.apply(this, arguments);
    }
});

/**
 * Global instance of the popup
 * @private
*/
SailPoint.BatchDetailPopup.instance = null;

/**
* Gets the global instance, or creates a new one if none exists.
*/
SailPoint.BatchDetailPopup.getInstance = function(){
    if (!SailPoint.BatchDetailPopup.instance)
        SailPoint.BatchDetailPopup.instance = new SailPoint.BatchDetailPopup();
    return SailPoint.BatchDetailPopup.instance;
};

/**
* Hides global popup instance
*/
SailPoint.BatchDetailPopup.hide = function(){
    SailPoint.BatchDetailPopup.getInstance().hide() ;
};

/**
* Loads the date for the given link and shows the popup window.
* @param {String} linkId The ID of the link to display.
*/
SailPoint.BatchDetailPopup.show = function(batchId){
    SailPoint.BatchDetailPopup.getInstance().itemsStore.on('beforeload', function(s) {
      s.proxy.extraParams.id = batchId;
    });

    SailPoint.BatchDetailPopup.getInstance().grid.load({id:batchId});
    SailPoint.BatchDetailPopup.getInstance().show();
};
