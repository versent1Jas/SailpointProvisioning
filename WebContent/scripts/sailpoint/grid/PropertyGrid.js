/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.grid.PropertyGrid', {
    extend: 'Ext.grid.property.Grid',
    alias: 'widget.sppropgrid',

    url: '',
    requestParams: {},
    disableEdit: true,

    initComponent: function() {
        this.source = [];
        if (this.disableEdit) {
            this.addListener('beforeedit', function() {
                return false;
            });
        }
        this.callParent(arguments);
    },

    updateCallback: function(conn, response, options) {
        var record = Ext.JSON.decode(response.responseText, true);
        this.setSource(record);
    },

    load: function(parms) {
        var me = this;
        this.requestParams = parms;
        var conn = new Ext.data.Connection({
            url: this.url,
            // Ext.data.Connection does not pick up default headers automatically, so force them
            defaultHeaders: Ext.Ajax.defaultHeaders,
            listeners: {
                requestcomplete: {
                    fn: function(c, r, o, e) {
                        this.updateCallback(c, r, o, e);
                        if (parms.callback) {
                            parms.callback(c, r, o, e);
                        }
                    },
                    scope: me
                }
            }
        });
        conn.request({params: this.requestParams});
    }
});