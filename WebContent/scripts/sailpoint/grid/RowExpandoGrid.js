/* (c) Copyright 2013 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * @class SailPoint.grid.RowExpandoGrid
 * @extends Ext.grid.PagingGrid
 * This class provides support for expando rows contained in a paging grid.
 * It borrows heavily from scripts/sailpoint/web/define/identityEntitlementsGrid.js
 */
Ext.define('SailPoint.grid.RowExpandoGrid', {
    extend : 'SailPoint.grid.PagingGrid',
    alias : 'widget.rowexpandogrid',
    expandoUrlOrTpl: null,
    expandoType: null, // SailPoint.grid.PagingGrid.URL or SailPoint.grid.RowExpandoGrid.TEMPLATE or SailPoint.grid.RowExpandoGrid.HTML
    rowBodyTpl: null, // Only used if the expandoType is SailPoint.grid.RowExpandoGrid.TEMPLATE
    rowBodyUrl: null, // Used if the expandoType is SailPoint.grid.PagingGrid.URL,
    expandoParamBuilder: null, // Function that builds the params that get passed into the URL-based row loader  
    expandoHtmlBuilder: null, // Function that builds the html content when expand , Only used if the expandoType is SailPoint.grid.RowExpandoGrid.HTML 
    expandoLoadingMsg: null, // Loading message -- Defaults to "Loading Data..."
    expandoCallback: null, // Callback that will be executed when a row is expanded 
    statics: {
        URL: 'url',
        TEMPLATE: 'tpl',
        HTML: 'html'
    },
    constructor : function(config) {
        if (!config.plugins) {
            config.plugins = [];
        }
        
        config.plugins.push({
            ptype: 'sprowexpander',
            rowBodyTpl: config.expandoType == SailPoint.grid.RowExpandoGrid.TEMPLATE ? config.rowBodyTpl : ' '
        });
        
        Ext.apply(this, config);
        this.callParent(arguments);
    },
    initComponent : function() {
        this.callParent(arguments);

        this.getView().on('expandbody', function(rowNode, record, expandRow, eOpts) {
            this.panel.loadExpandoContent(rowNode, record, expandRow, eOpts, this.panel);
        });
    },
    
    fireResizeHackForIE : function(e, s, r, o) {
        if(Ext.isIE) { // Give IE some time to get its act together!
            Ext.defer(function(){
                o.grid.getView().fireEvent('resize', null);
            }, 100);
        }
    },
    
    loadExpandoContent: function(rowNode, record, expandRow, eOpts, grid) {
        var rowBody = Ext.get(expandRow).query('.x-grid-rowbody')[0];
        //df: nobody using it now, but seems better to pass record in expandoParamBuilder
        var expandoParams = grid.expandoParamBuilder ? grid.expandoParamBuilder() : { id: record.getId() };
        
        if (grid.expandoType == SailPoint.grid.PagingGrid.URL) {
            Ext.get(rowBody).load({
                url: SailPoint.getRelativeUrl(grid.rowBodyUrl),
                scripts: true,
                params: expandoParams,
                text: grid.expandoLoadingMsg ? gridExpandoLoadingMsg : "#{msgs.loading_data}",
                callback : this.expandoCallback ? this.expandoCallback : this.fireResizeHackForIE,
                scope: this,
                grid: grid
            });
        } else if (grid.expandoType == SailPoint.grid.RowExpandoGrid.HTML) {
            //set the html content to dynamically generated content.
            if (grid.expandoHtmlBuilder) {
                var htmlContent = grid.expandoHtmlBuilder(record);
                Ext.get(rowBody).setHTML(htmlContent);
            }
        } else {
            // TODO: Support template-based expandos
        }
    }
});
    
    