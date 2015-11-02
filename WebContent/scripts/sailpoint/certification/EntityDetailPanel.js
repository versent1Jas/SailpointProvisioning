Ext.define('SailPoint.certification.EntityDetailPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.entitydetailpanel',

    /**
     * @config {String} Url this panel should load, expect entityId to be appended to url.
     */
    url: null,
    entityId: null,
    loader: null,

    constructor: function(config) {
        if (config.url) {
            this.loader = {
                url: config.url
            };
            this.url = config.url;
        }
        this.callParent(arguments);
    },

    initComponent: function() {

        this.on('render', function(panel) {
            panel.reload(SailPoint.CurrentEntityDetails.entityId);
        });

        this.on('show', function(panel) {
            if (panel.entityId && panel.entityId !== SailPoint.CurrentEntityDetails.entityId) {
                panel.reload(SailPoint.CurrentEntityDetails.entityId);
            }
        });

        this.callParent(arguments);
    },

    reload: function(id) {
        this.getLoader().load({
            scripts: true,
            url: this.url + id
        });

        this.entityId = id;
    }
});
