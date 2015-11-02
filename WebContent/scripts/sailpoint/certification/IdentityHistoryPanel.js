Ext.ns('SailPoint', 'SailPoint.IdentityHistoryPanel');

Page.addEvents('addEntitlementComment');

SailPoint.IdentityHistoryPanel.GRID_CMP_PREFIX = 'decHistoryGrid_';

SailPoint.IdentityHistoryPanel.getStoreInstance = function(itemId, identity){
    return SailPoint.Store.createRestStore({
        url: SailPoint.getRelativeUrl('/rest/identities/' + SailPoint.Utils.encodeRestUriComponent(identity)+ '/history/byItem?itemId=' + itemId),
        remoteSort:true,
        method: 'GET',
        root: 'objects',
        totalProperty: 'count',
        extraParams: {
            'sort': 'entryDate', 
            'dir': 'DESC'
        },
        fields: [
            'id',
            'status',
            'actor',
            'entryDate',
            'comments',
            'actingWorkItem'
        ]  
    });
};

SailPoint.IdentityHistoryPanel.renderStatus = function(value, metaData, record) {
	metaData.style = 'vertical-align: middle;'
	if (!record.get('id')) {
	    value = Ext.String.format('<i>{0}</i>', 
                value);
	}
	if (record.get('actingWorkItem')) {
		return Ext.String.format('{0} <img src="{1}" title="{2}"/>', 
				value,
				SailPoint.getRelativeUrl('/images/icons/delegated_item_12.png'), 
				'#{msgs.cert_item_view_hist_grid_decision_delegated}');
	}	else {	
		return value;
	}
}

SailPoint.IdentityHistoryPanel.renderItalic = function(value, metaData, record) {
    metaData.style = 'vertical-align: middle';
    
    if (!record.get('id') && !Ext.isEmpty(value)) {
        return Ext.String.format('<i>{0}</i>', 
                value);
    }   else {  
        return value;
    }
}

SailPoint.IdentityHistoryPanel.getColumns = function(){
    return [
        {header: "#{msgs.cert_item_view_hist_grid_hdr_action}", width:120, sortable: false, dataIndex: 'status', renderer: 'SailPoint.IdentityHistoryPanel.renderStatus'},
        {header: "#{msgs.cert_item_view_hist_grid_hdr_actor}", width: 140, sortable: false,  dataIndex: 'actor', renderer: 'SailPoint.IdentityHistoryPanel.renderItalic'},
        {header: "#{msgs.cert_item_view_hist_grid_hdr_date}", width: 180, sortable: false, dataIndex: 'entryDate', renderer: 'SailPoint.IdentityHistoryPanel.renderItalic'},
        {header: "#{msgs.cert_item_view_hist_grid_hdr_comments}", sortable:false, dataIndex: 'comments', 
        	css:'white-space:normal;padding-right:10px', renderer: 'SailPoint.IdentityHistoryPanel.renderItalic'}
     ];
};

// Prevent rows on nested grids from handling each others' mouseover and mouseout events. 
Ext.override(Ext.grid.View, {
    onRowOver: function(e, t) {
        var row;
        var rowEl;
        
        if(((row = this.findRowIndex(t)) || row === 0) && (rowEl = this.getRow(row)) && !e.within(rowEl, true) && Ext.fly(rowEl).contains(t)){
            this.addRowClass(row, "x-grid-row-over");
        }
    },

    onRowOut: function(e, t) {
        var row;
        var rowEl;
        
        if(((row = this.findRowIndex(t)) || row === 0) && (rowEl = this.getRow(row)) && !e.within(rowEl, true) && Ext.fly(rowEl).contains(t)){
            this.removeRowClass(row, "x-grid-row-over");
        }
    }
});

SailPoint.IdentityHistoryPanel.getPanel = function(itemId, identity, targetEl) {

    var grid = Ext.create('SailPoint.grid.PagingGrid', {
        store: SailPoint.IdentityHistoryPanel.getStoreInstance(itemId, identity),
        id: SailPoint.IdentityHistoryPanel.GRID_CMP_PREFIX  + itemId,
        itemId: itemId,
        renderTo: targetEl,
        columns: SailPoint.IdentityHistoryPanel.getColumns(),
        selModel: new Ext.selection.RowModel( {
            selectRow: Ext.emptyFn
        } ),
        onMouseDown : function( e ) {
    		e.stopEvent();
    	},
        onClick : function( e ) {
        	e.stopEvent();
    	},
        onDblClick : function( e ) {
        	e.stopEvent();
    	},

    	pageSize: 6,
        height: 235,
        enableColumnMove: false,
        enableColumnHide: false,
        viewConfig: {
            stripeRows: true,
            emptyText: '<div style="text-align:center">#{msgs.cert_item_view_hist_grid_no_results}</div>'
        },
        tools:  [{
            type: 'close',
            qtip: '#{msgs.role_detail_panel_qtip_close}',
            handler: function(event, toolEl, owner, tool) {
            	owner.ownerCt.fireEvent('closeClick');
            }
        }],
        title:'#{msgs.cert_item_view_hist_grid_title}'
    });
    
    Page.on("addEntitlementComment", function() {
        var gridCmp = Ext.getCmp(SailPoint.IdentityHistoryPanel.GRID_CMP_PREFIX  + this.itemId);
        if (gridCmp) {
            gridCmp.getStore().load();
        }
    }, {'itemId':itemId});

    var destroyFunc = function() {
        var gridCmp = Ext.getCmp(SailPoint.IdentityHistoryPanel.GRID_CMP_PREFIX  + this.itemId);
        if (gridCmp) {
            gridCmp.destroy();
        }
        Page.un('certIdentityNextOrPrev', this.theFunc, this);
    };

    Page.on("certIdentityNextOrPrev", destroyFunc, {'itemId':itemId, theFunc:destroyFunc});
    
    grid.store.load({params:{start:0, limit:6}});

    grid.enableHdMenu = false;
    grid.viewConfig.headersDisabled = true;
    return grid;
};


SailPoint.IdentityHistoryPanel.toggleDialog = function(itemId, identity) {

    var grid = new SailPoint.grid.PagingGrid({
        store: SailPoint.IdentityHistoryPanel.getStoreInstance(itemId, identity),
        columns: SailPoint.IdentityHistoryPanel.getColumns(),
        pageSize: 10,
        enableColumnMove:false,
        enableColumnHide:false,
        bbar: [{
            xtype: 'tbtext',
            text: '#{msgs.cert_action_pending}'
        }],    
         viewConfig: {
            stripeRows: true,
            emptyText: '<div style="text-align:center">#{msgs.cert_item_view_hist_grid_no_results}</div>'
        }
    });

    var win = new Ext.Window({
        layout      : 'fit',
        width       : 768,
        height      : 340,
        closeAction :'destroy',
        plain       : true,
        items:[grid],
        title:'#{msgs.cert_item_view_hist_grid_title}',
        buttons: [{
            text     : '#{msgs.button_close}',
            cls : 'secondaryBtn',
            handler  : function() {
                win.destroy();
            }
        }]
    });

    win.show();

    grid.store.load({params:{start:0, limit:10}});
};

/**
 * Show the window to add a comment to a certification item.
 *
 * @param  itemId       The ID of the certification item.
 */
SailPoint.IdentityHistoryPanel.showHistoryCommentDialog = function(itemId) {
    SailPoint.Manage.Certification.addEntitlementComment(itemId, function() {
        Page.fireEvent("addEntitlementComment", itemId); // update the history grid if it's open
    });
};
