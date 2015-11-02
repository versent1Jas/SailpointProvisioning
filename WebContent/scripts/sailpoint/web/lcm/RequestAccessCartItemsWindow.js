Ext.ns('SailPoint', 'SailPoint.LCM', 'SailPoint.LCM.RequestAccess');

SailPoint.LCM.RequestAccess.cartWindow = null;

Ext.define('SailPoint.LCM.RequestAccessCartItemsWindow', {
    extend: 'Ext.window.Window',

    statics: {
        isReadOnly: true
    },

    grid: null,
    store: null,
    itemsRemoved: false,

    initComponent: function () {
        this.createStore();

        // splice the column that renders the remove button if necessary
        if (SailPoint.LCM.RequestAccessCartItemsWindow.isReadOnly === true) {
            this.gridMetaData.columns.splice(0, 1);
        }

        this.grid = new SailPoint.grid.PagingGrid({
            cls: 'smallFontGrid wrappingGrid',
            store: this.store,
            disableMouseTracking: true,
            region: 'center',
            columns: this.gridMetaData.columns,
            viewConfig: {
                scrollOffset: 0,
                stripeRows: true,
                getRowClass: function (record, rowIndex, rowParams, store) {
                    return record.get("action");
                }
            }
        });

        var bva = {height:1020};
        if(SailPoint.getBrowserViewArea) {
            bva = SailPoint.getBrowserViewArea();
        }

        Ext.apply(this, {
            title: '#{msgs.cart}',
            items: [{
                    xtype: 'panel',
                    height: 100,
                    bodyStyle: 'padding:5px 10px',
                    region: 'north',
                    html: "<h2>#{msgs.lcm_request_access_cart_title}</h2><br/><p>#{msgs.lcm_request_access_cart_description}</p>"
                },this.grid
            ],
            width: 768,
            height: bva.height - bva.height / 3,
            modal: true,
            closeAction: 'hide',
            plain: true,
            layout: 'border',
            buttonAlign: 'center',
            buttons: [
                {
                    text: '#{msgs.lcm_checkout}',
                    id: 'cartWindowCheckoutButton',
                    margin: '10px',
                    handler: function () {
                        var checkoutEl = $('summaryForm:checkoutBtn');
                        if (checkoutEl) {
                            checkoutEl.click();
                        }
                    }
                },
                {
                    text: '#{msgs.button_close}',
                    cls : 'secondaryBtn',
                    margin: '10px 0',
                    handler: function () {
                        this.close();
                    },
                    scope: this
                }
            ],
            listeners: {
                show: {
                    fn: function (panel, eOpts) {
                        panel.store.load();
                    }
                }
            }
        });

        this.on('close', function () {
            if (this.itemsRemoved === true) {
                var list = Ext.getCmp('requestAccessList');
                if (list) {
                    if (list.getActiveTab().getId() === 'requestAccessCurrentAccessGrid') {
                        list.currentAccessGrid.getStore().load();
                    } else {
                        list.store.load();
                    }
                }
            }

            this.itemsRemoved = false;
        });

        this.callParent(arguments);
    },

    createStore: function () {
        this.store = SailPoint.Store.createStore({
            fields: this.gridMetaData.fields,
            autoLoad: true,
            root: 'requests',
            totalProperty: 'count',
            pageSize: 10,
            url: SailPoint.getRelativeUrl('/lcm/cartShortDataSource.json'),
            sorters: [{property: 'name', direction: 'ASC'}],
            remoteSort: true,
            listeners: {
                load: {
                    fn: function (store, records, success, eOpts) {
                        var checkoutButton = Ext.getCmp('cartWindowCheckoutButton');
                        if (checkoutButton) {
                            checkoutButton.setDisabled(store.getTotalCount() == 0);
                        }
                    }
                }
            }
        });
    }
});

SailPoint.LCM.RequestAccess.removeRequest = function (id) {
    $("cartForm:cartRemoveRequestsId").value = id;
    $("cartForm:cartRemoveRequestsBtn").click();
};

/** Renderers **/
SailPoint.LCM.RequestAccess.buttonRenderer = function (value, metadata, record, rowIndex) {
    return '<div class="remover" onclick="SailPoint.LCM.RequestAccess.removeRequest(\'' + record.getId() + '\')"></div>';
};

SailPoint.LCM.RequestAccess.showCartWindow = function () {

    if (!SailPoint.LCM.RequestAccess.cartWindow) {

        SailPoint.LCM.RequestAccess.cartWindow = new SailPoint.LCM.RequestAccessCartItemsWindow({
            id: 'cartItemsWindow',
            gridMetaData: cartGridMetaData
        });

    }
    SailPoint.LCM.RequestAccess.cartWindow.show();
};

SailPoint.LCM.RequestAccess.refreshCartWindow = function () {
    if (SailPoint.LCM.RequestAccess.cartWindow) {
        SailPoint.LCM.RequestAccess.cartWindow.itemsRemoved = true;
        SailPoint.LCM.RequestAccess.cartWindow.store.loadPage(1);
    }
};