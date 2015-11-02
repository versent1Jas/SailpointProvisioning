/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * @class SailPoint.grid.PagingCheckboxGrid
 * @extends Ext.grid.EditorGridPanel
 * This class wraps together a number of standard features needed for paging checkbox grids.
 * <ul>
 * <li>Initializes the toolbar with the grid's store.</li>
 * <li>If this is a dynamic grid, meaning that the column model and record model come from the ajax
 * datasource, that store metachange method is wired to the grid's metachange method. Check the metachange method for
 * a thorough description.</li>
 * <li>Creates a {@link SailPoint.grid.DefaultCheckboxSelectionModel DefaultCheckboxSelectionModel}
 * and wires it's events up with the grid's selection management methods.</li>
 * <li>Keeps track of what was selected on previous pages as the user pages around.</li>
 * </ul>
 */
Ext.define('SailPoint.grid.PagingGrid', {
    extend : 'Ext.grid.Panel',
    alias : 'widget.paginggrid',
    
    displayInfo : true,
    
    /**
     * @cfg {Integer} pageSize If passed, the number of rows on
     *      a page. Defaults to 25 (this should line up with the
     *      default size in GridState.java).
     */
    pageSize : 25,
    
    /**
     * @cfg {Object} Initialized by passing in a serialized
     *      string representation of the grid state as
     *      gridStateStr
     */
    gridState : null,
    
    /**
     * @cfg {Integer} start If passed, the first of row on a page. Defaults to 0.
     */
    start : 0,
    
    /**
     * @cfg {boolean} True if the grid configuration is provided by the ajax datasource. The column
     * model and record model will be refreshed when the store's metachange event fires.
     */
    dynamic : false,

    /**
     * @cfg {String} ID of the store for this grid. This should be specified if the grid
     * will dynamically generate it's store and you need to reference the store in another
     * component, such as a SearchField.
     */
    storeId : null,
    
    /**
     * @cfg {Object} Defines the columns and fields to be used in this grid.
     *      Generally, this will be a serialized sailpoint.web.extjs.GridResponseMetaData
     *     object.
     */
    gridMetaData : null,

    /**
     * @cfg {Object} Store Model object. This will be auto-generated if gridMetaData is specified
     */
    model : null,
    
    /**
    * @cfg {String} (optional) url The url to use to create a datasource. Not needed if you
    * pass in your own datastore.
    */
    url : null,
    
    forceFit : false,
    
    /**
    * @cfg {Object} (optional) viewConfig A config object that will be applied to the
    * grid's UI view. Any of the config options available for Ext.grid.View can be
    * specified here.  The default setting eliminates the gutter for the right scrollbar.
    * Any JS objects that extend this class and require a right scrollbar will have to
    * override the viewConfig property with their own.
    */
    viewConfig : {
        scrollOffset: 1 // if you set this to zero, you may cause a horizontal scrollbar to appear
    },
    
    /**
    * @cfg {Boolean} (optional) alwaysRefreshCols If true the columns will always be
     * refreshed on metachange. If true, the metachange event will only be handled
     * on the first data load. This prevents the col model from reloading every
     * time a request is made.
    */
    alwaysRefreshCols : true,
    
    /**
     * Number of time the metachange method has been called.
     * @private
     */
    colRefreshes : 0,
    
    /**
     * @cfg {String/Array) (optional) hideIfEmptyColumns  The names of the column
     * to hide after the grid is loaded if none of the cells in the column have any
     * data.
     */
    hideIfEmptyColumns : null,
    
    /**
     * @cfg {Object/Array} (optional) columnResizers  An array of objects that will
     * manually resize a column after the grid is loaded or the columns are resized.
     * Each object in the array is expected to have the following:
     *
     *  - column:  The name of the column to resize.
     *  - resizer: A function that can be called to return the desired size.
     */
    columnResizers : null,

    /**
     * @cfg {Object} Set of base parameters which should be applied to the
     * underlying store parameters when search() is called.
     */
    baseParams : null,
    
    /**
     * @cfg (int) Specifies the depth at which the grid parses a click inside a cell in order to determine
     * which cell was clicked.  The default is 4, but with some grids that contain additional html markup,
     * we need it to go deeper
     */
    cellSelectorDepth : 8,
    
    layout : 'fit',
    
    /**
     * @private
     * There are several events fired during the process of constructing a grid
     * that are also state events, meaning these events kick off a call to save
     * the grid state.  This doesn't really make any sense during grid construction
     * because nothing in the grid's state has changed, ergo, the state save call
     * is meaningless.  This flag is used by the saveState() method to determine 
     * whether or not the grid's construction is complete and the grid is loaded.  
     * Once the grid is loaded, calls to save state are processed.  Until then, 
     * they're ignored. 
     */
    stateReady: false,

    /**
     * @cfg If true we will not generate a bottom tool bar.
     */
    hidebbar : false,

    constructor : function(config) {      
        if(config && config.sm){
            config.selModel = config.sm;
            delete config.sm;
        }
        
        SailPoint.Utils.setColumnFlex(config);
        SailPoint.Utils.setDecisionColClass(config);

        Ext.apply(this, config);
        this.callParent(arguments);
        
        // 'resize' gets added to the grid's state events by the AbstractComponent. 
        // However, the event is useless since the grid's getState() method only 
        // pulls columns and sort info.  Remove the listener to prevent useless
        // state save calls that contributed to the situation that was creating 
        // duplicate UIPreferences.  Bug #11077
        if ((this.stateful) && (this.hasListeners.resize)) {
            this.un('resize', this.onStateChange, this);  
        }
        
        //Ext.util.Observable.capture(this, this.eventTracker);
    },

    // development/debug function
    eventTracker: function (event) {
        console.info(event, this.stateReady);
    },
    
    /**
     * Initializes component. Addes a paging toolbar with the
     * given store and specified config.pageSize parameter. If
     * config.dynamic = true, wires up events for refreshing
     * columns from the ajax response.
     * 
     * @private
     */
    initComponent : function() {
    
        this.addEvents(
            /**
             * Fired when the underlying store loads or reloads.
             */
             'load',
             /**
             * Fired when paging controls are used.
             * @param {Ext.PagingToolbar} The source Toolbar instance
             * @param {Object} changeEvent An object that has these properties:<ul>
             * <li><code>total</code> : Number <div class="sub-desc">The total number of records in the dataset as
             * returned by the server</div></li>
             * <li><code>activePage</code> : Number <div class="sub-desc">The current page number</div></li>
             * <li><code>pages</code> : Number <div class="sub-desc">The total number of pages (calculated from
             * the total number of records in the dataset as returned by the server and the current {@link #pageSize})</div></li>
             * </ul>
             */
             'page',
             /**
              * A RowExpander will fire this after expanding or collapsing itself so the grid can update the layout.
              */
             'expandoResize'
        );
        
        // once the grid has loaded, we need to enable the stateReady flag
        this.on('load', this.onLoad, this);

        if (this.gridMetaData){
            this.parseGridMetaData(this.gridMetaData);
        }
        
        // if there's no gridMetaData but there are columns, be sure to process the columns for consistency.
        if (!this.gridMetaData && this.columns) {
            this.parseGridMetaData({ columns: this.columns });
        }
        
        // If there are no columns we can't create a grid, so throw an error for the developer
        if(!this.columns){
            SailPoint.FATAL_ERR_JAVASCRIPT(new Error("Unable to create SailPoint.grid.PagingGrid"), "Columns are missing from PagingGrid config!");
        }

        if (!this.gridMetaData) {
            this.gridMetaData = {
                fields : this.columns
            };
        }
        
        if (this.url) {
            var conf = {
                storeId : this.storeId,
                fields : this.fields ? this.fields : this.gridMetaData.fields,
                url : this.url,
                root : 'objects',
                totalProperty : 'count',
                pageSize : this.pageSize,
                simpleSortMode : true,
                remoteSort : true,
                extraParams : (this.baseParams ? this.baseParams : (this.extraParams ? this.extraParams : {})),
                sorters: this.sorters
            };
            
            if(this.initialPathParams) {
                conf.initialPathParams = this.initialPathParams;
            }
            
            if(this.storeListeners) {
                conf.listeners = this.storeListeners;
            }

            if (this.groupField){
                conf.groupField = this.groupField;
            }

            if (this.url.indexOf("{0}") == -1){
                this.store = SailPoint.Store.createStore(conf);
            } else {
                this.store = SailPoint.Store.createRestStore(conf);
            }
        }
        
        // If the page size is passed as a config to the grid, assume that
        // overrides the one set in the store. (the store could be passed in
        // without a pageSize configured)
        if(this.store && this.pageSize) {
            this.store.pageSize = this.pageSize;
        }
      
        // Relay the store load event up to the grid so grid
        // implementations can respond to a load or reload
        this.store.on('load', function(store, records, options) {
                this.fireEvent('load', store, records, options);
            }, this
        );

        // auto attach an exception msg since by default there
        // is no indication that the load has failed.
        if (!this.store.hasListener('exception')) {
            this.store.on('exception', SailPoint.DEFAULT_STORE_ERR_HANDLER, this);
        }

        if (!this.store.getProxy().hasListener('exception')) {
             this.store.getProxy().on('exception', SailPoint.DEFAULT_STORE_ERR_HANDLER, this);
        }
    
        var pagerPlugins = '';
        if (this.usePageSizePlugin) {
            pagerPlugins = [ new SailPoint.PageSizePlugin({ gridId : this.getId(), addBefore: null }) ];
            if (this.additionalPlugins) {
                pagerPlugins = pagerPlugins.concat(this.additionalPlugins);
            }
        } 
        else if (this.additionalPlugins) {
            pagerPlugins = this.additionalPlugins;
        }
    
        // if the bottom toolbar wasn't passed in as an option, create one
        if (!this.hidebbar && !this.bbar) {
            Ext.apply(this, {
                bbar : {
                    xtype : 'sppagingtoolbar',
                    store : this.store,
                    cls : 'paging-toolbar',
                    displayInfo : this.displayInfo,
                    plugins : pagerPlugins,
                    listeners : {
                        beforechange : {
                            fn : function(toolbar, ev) {
                                // Fire a 'page' event whenever the pager is used.
                                return this.fireEvent('page', toolbar, ev);
                            },
                            scope : this
                        }
                    }
                }
            });
        }
    
        if (!this.viewConfig) {
            this.viewConfig = {};
        }
        this.viewConfig.cellSelectorDepth = this.cellSelectorDepth;
    
        Ext.apply(this, {
            trackMouseOver : true
        });
    
        if (this.disableMouseTracking) {
            Ext.apply(this, {
                trackMouseOver : false
            });
        }
    
        /** Initialize grid state from grid state string **/
        if (this.gridStateStr) 
            this.gridState = new SailPoint.GridState(JSON.parse(this.gridStateStr));

        if (this.gridState) {
            this.gridState.gridId = this.id;
    
            /**
             * Set the page size to last selection if in the grid state
             */
            if (this.gridState._getValue('pageSize')) {
                this.store.pageSize = this.gridState._getValue('pageSize');
            }
            
            /**
             * Set the query to fetch the correct first row
             * based on the page this grid is on 
             */
            if (this.gridState._getValue('firstRow') > 0) {
                this.start = this.gridState._getValue('firstRow');
            }
    
            /**
             * Restore the vertical scroll position if it is set
             * on the grid state 
             */
            if (this.gridState._getValue('scrollPosition') > 0) {
                this.getView().addListener('refresh', this.updateScrollPosition, this);
            }
    
            this.store.addListener('load', this.gridState.updateFirstRow, this.gridState, this.gridState);
        }

        if(!this.store.getProxy().extraParams) {
            this.store.getProxy().extraParams = {};
        }
    
        this.store.getProxy().extraParams.limit = this.getStore().pageSize;
    
        if (this.hideIfEmptyColumns) {
            this.hideIfEmptyColumns = (Ext.isArray(this.hideIfEmptyColumns)) ? this.hideIfEmptyColumns : [ this.hideIfEmptyColumns ];
            for ( var i = 0; i < this.hideIfEmptyColumns.length; i++) {
                var col = this.hideIfEmptyColumns[i];
                var callback = Ext.pass(Ext.bind(this.hideColumnIfEmpty, this), col);
                // Two handlers may be overkill, but stores that
                // autoLoad don't always get the load event.
                this.on('render', callback);
                this.store.on('load', callback);
            }
        }
    
        if (this.columnResizers) {
            this.columnResizers = (Ext.isArray(this.columnResizers)) ? this.columnResizers : [ this.columnResizers ];
            for ( var i = 0; i < this.columnResizers.length; i++) {
                var col = this.columnResizers[i].column;
                var resizer = this.columnResizers[i].resizer;
                var callback = Ext.pass(Ext.bind(this.resizeColumn, this), [col, resizer]);
                this.on('render', callback);
                this.store.on('load', callback);
            }
        }

        this.replaceEmptyRenderers(this.columns);

        if (this.dynamic) {
            this.getStore().on('metachange', this.metachange, this);
        }

        this.on('reconfigure', function(p, s, c, os, h, eopt){
            // This prevents the store from firing 'metachange' after the
            // reconfigure event that was kicked off from the metachange event.
            // See the circular reference there?  This causes metachange()
            // to be called once for every time it was previously called.
            p.getStore().suspendEvents(false);
        });

//        var existingSorters = [];
//        if(this.store && this.store.sorters) {
//            Ext.each(this.store.sorters.items, function(item){
//                existingSorters.push({property : item.property, direction : item.direction});
//            });
//        }
//        this.plugins.push(Ext.create('Ext.ux.InlineRemoteMultiSort', {
//            defaultSorters : existingSorters
//        }));

        this.callParent(arguments);

        // Override the onMaskBeforeShow in the grid. The reason for
        // this is to prevent it from calling deselectAll on the
        // selection model during paging. We want to persist the
        // selections across page changes
        this.getView().onMaskBeforeShow = function(){
            var loadingHeight = this.loadingHeight;

            //this.getSelectionModel().deselectAll();
            if (loadingHeight) {
                this.setCalculatedSize(undefined, loadingHeight);
            }
        };
        
        this.on('expandoResize', function() {
            var me = this;
            
            //give the expando a little time to resize before updating the grid.
            Ext.defer(function(){
                me.updateLayout({isRoot:false, defer:false});
            }, 200);
        }, this );
        
        if(this.hideHeader) {
            this.on('afterrender', function(){
                var head = this.child('header');
                if(head) {
                    head.setSize(0,0);
                }
            }, this);
        }
        
        /**
         * TODO: extjs4
         * This is an undocumented event that may be deprecated or changed in the future
         * but is currently the only known way to get the column that was clicked.
         */
        this.on('cellclick', function(view, cellEl, colIdx, record, rowEl, rowIdx, event) {
            view.clickedColumn = colIdx;
            view.clickedRow = rowIdx;
        });
        
        if(Ext.isDefined(this.runInitialLoad) && 
                ((Ext.isBoolean(this.runInitialLoad) && this.runInitialLoad) || Ext.isFunction(this.runInitialLoad)) ) {
            if(Ext.isFunction(this.runInitialLoad)) {
                this.initialLoad(this.runInitialLoad);
            }
            else {
                this.initialLoad();
            }
        }
    },

    parseGridMetaData : function(data){
        this.columns = [];
        var gridColumns = this.columns;
        data.columns.each(function(column){
            if (column.percentWidth) {
                column.width = this.width * (column.percentWidth / 100);
            }

            if(column.editor && Ext.typeOf(column.editor) == 'string' && column.editor.length > 0){
                try{
                    column.editor = Ext.ComponentMgr.create({xtype:column.editor}, null);
                } 
                catch(err){
                    alert('PagingGrid.js - Could not evaluate editor:' + column.editor);
                }
            }

            // test to see if the renderer is a string. If so eval it.
            if (column.renderer && Ext.typeOf(column.renderer) == 'string' && column.renderer.length > 0){
                try{
                    column.renderer = SailPoint.evaluteFunctionByName(column.renderer, window);
                } 
                catch(err){
                    alert('PagingGrid.js - Could not evaluate renderer:' + column.renderer);
                }
            }

            if (column.pluginClass && Ext.typeOf(column.pluginClass) == 'string' && column.pluginClass.length > 0){
                try{
                    if(column.pluginClass.indexOf('checkcolumn') > -1) {
                        column.xtype = 'checkcolumn';
                        column.renderer = Ext.ux.CheckColumn.prototype.renderer;
                        delete column.pluginClass;
                    }
                    else {
                        this.plugins.push(Ext.ComponentMgr.create(column, null));
                    }
                } 
                catch(err){
                    alert('PagingGrid.js - Could not evaluate plugin:' + column.pluginClass);
                }
            }
            
            if(Ext.isDefined(column.header) && column.header == null) {
                delete column.header;
            }

            gridColumns.push(column);
        });
        this.columns = gridColumns;
    },
    
    /**
     * Replaces empty renderers in the column model with Ext.util.Format.htmlEncode
     * @param columnModel The column model containing renderers to replace, may be null.
     */
    replaceEmptyRenderers : function(columns) {
        if (columns) {
            for ( var i = 0; i < columns.length; i++) {
                var config = columns[i];
                if (!config.renderer) {
                    config.renderer = SailPoint.Utils.htmlEncode;
                }
            }
        }
    },
    
    /**
    * <p>If the 'dynamic'=true, this function will be executed when the metadata for this grid
    * changes (the store 'metachange' event). It extracts the new column and record definitions
    * from the store response and builds a new column model, then refreshes the grid configuration.</p>
    * <p>The metadata returned by the store datasource should look like the standard metadata defined
    * by JsonStore. Additionally, the fields may contain the properties 'header', 'width' and 'auto'.
    * Eventually we may want to add render definitions and other goodies.
    * <ul>
    *    <li>header(optional) : header value for the column. May be left out if the field is not displayed as a column.</li>
    *    <li>width:(optional) : width of the column. Must be an Integer!</li>
    *    <li>auto(optional): true if the field is the autoexpand column. </li>
    * </ul>
    * </p>
    * <p>Sample json:
    * <pre><code>
      {
        rowCount:1,
        metaData:{
            root:"rows",
            id:'id',
            totalProperty:"rowCount",
            fields:[
                {name:"id"},
                {name:"company",header:"Company",width:"auto"},
                {name:"price",header:"Price",width:100},
                {name:"group",header:"The Group",width:100}
            ]
        },
        rows:[
        {id:0,group:"Nice companies",company:"3m Co",price:"71.72"}
        ]
      }
    * </code></pre>
    * </p>
    * @param {SailPoint.grid.PagingGrid} thisObj the grid, not really needed since this func
    * is executed in the grid's context.
    * @param {Object} meta New metadata providing the new definition of the columns and fields
    * in the grid.
    */
    metachange : function(store, meta, options) {
        try {
    
            if (this.colRefreshes > 0 && !this.alwaysRefreshCols) {
                return;
            }
    
            var field;
            var config = [];
            var autoExpand = false;
    
            // For backwards compatibility with ExtGridResponse,
            // also support meta.fields
            var columns = meta.columns ? meta.columns : meta.fields;


            var storeFieldList = [];

            for ( var i = 0; i < columns.length; i++) {
                // loop for every dataIndex, only add fields
                // with a header property
                field = columns[i];
                storeFieldList.push(field);
                if (field.header !== undefined) {
    
                    // if width is auto, set autoExpand variabel
                    // (should only be set after reconfigure for
                    // some reason)
                    if (field.width == "auto") {
                        field.flex = 1;
                    }
    
                    if (field.editorClass) {
                        field.editor = new Ext.grid.plugin.CellEditing({
                            'xtype' : field.editorClass
                        });
                    }
    
                    if (field.renderer != undefined) {
                        field.renderer = eval(field.renderer);
                    }
    
                    // add to the config (field.name is replaced by dataIndex)
                    delete field.name;
                    config[config.length] = field;
                }
            }
    
            // Create the new cm, and update the gridview.
            this.reconfigure(store, columns);
            this.colRefreshes++;
    
        } catch (err) {
            SailPoint.FATAL_ERR_JAVASCRIPT("Error in metachange()", err);
        }
    },
    
    /**
     * On the load, we will want to determine if the grid stored
     * a scroll position. If it's greater than 0, reset the
     * vertical scroll of the grid to the correct position.
     * delay added because the scroll position was getting reset
     * to 0 after the load.
     */
    updateScrollPosition : function() {
    
        if (this.gridState._getValue('scrollPosition') > 0) {
            var scrollTask = new Ext.util.DelayedTask(function() {
                        this.getView().scroller.dom.scrollTop = this.gridState._getValue('scrollPosition');
                        this.gridState._setValue('scrollPosition', 0);
                    }, this);
            scrollTask.delay(200);
        }
    },
    
    /**
     * Loads first page from the dataset.
     */
    initialLoad : function(callBackFn) {
        if (this.gridState && this.gridState._getValue('sortColumn')) {
            var srts = this.store.sorters;
            this.store.sorters.clear();
            this.store.sorters.addAll([{
                property: this.gridState._getValue('sortColumn'),
                direction: this.gridState._getValue('sortOrder')
            }]);
            if(srts && srts.length > 0) {
                var element, i;
                // Skip the first sorter (assuming we want to sort by the gridState value)
                for(i = 1; i < srts.items.length; i++) {
                    element = srts.items.get(i);
                    this.store.sorters.add(new Ext.util.Sorter({
                        property : element.property,
                        direction : element.direction
                    }));
                }
            }
        }
        var pageSize = this.getStore().pageSize;
        if (this.gridState && this.gridState._getValue('pageSize')) {
            pageSize = this.gridState._getValue('pageSize');
        }
        var loadConfig = {
            params : {
                'start' : this.start,
                'limit' : pageSize
            }
        };
        if(callBackFn){
            loadConfig.callback = function(records, operation, success) {
                if(success){
                    callBackFn();
                }
            };
        }
        this.store.load(loadConfig);
    },
    
    /**
     * Reloads grid data with the parameters from the last load.
     */
    reload : function() {
        this.store.load();
    },
    
    /**
     * Performs a new search with the given parameters. Resets
     * page to page 1 and sets the store baseParams to the given
     * parameters.
     * @param {Array/Object} Search parameters.
     */
    search : function(parameters) {
    
        var parms = parameters;
        if (this.baseParams) {
            for ( var item in this.baseParams) {
                parms[item] = this.baseParams[item];
            }
        }
        parms.limit = this.getStore().pageSize;
        this.store.getProxy().extraParams = parms;
        this.store.load({
            params : {
                'start' : 0
            }
        });
    },
    
    /**
     * Hide the column with the given name if every row being displayed does not
     * have a data in this column's cell.
     * 
     * @param {String} colName  The name of the column to hide if empty.
     */
    hideColumnIfEmpty : function(colName) {
        var hasValue = false;
        var store = this.getStore();
        
        for ( var i = 0; i < store.getCount(); i++) {
            var record = store.getAt(i);
            var value = record.get(colName);
            if (value || value === 0) {
                hasValue = true;
                break;
            }
        }
        
        for ( var i = 0; i < this.columns.length; i++) {
            if ( (this.columns[i].dataIndex == colName)) {
              if(!hasValue)
                this.columns[i].setVisible(false);
              else
                this.columns[i].setVisible(true);
            }
        }
    },
    
    /**
     * Resize the column with the given name, calling the columnSizer function
     * to determine the desired width.
     * 
     * @param {String}   colName      The dataIndex of the column to resize.
     * @param {Function} columnSizer  The function to call to return the width.
     */
    resizeColumn : function(colName, columnSizer, grid) {
        
        var column = this.getView().getHeaderCt().items.findBy(function(a){
            if(a.dataIndex == colName) return true;
        });

        if(column && column.setWidth){
            var newSize = columnSizer();
            if(newSize){
                column.setWidth(newSize);
            }
        }
    },
        
    getFirstSorter : function() {
        var store = this.getStore();
        if (store && !Ext.isEmpty(store.sorters)) {
            return store.sorters.first();
        }
        
        return null;
    },
    
    load : function(config) {
        var sorter = this.getFirstSorter();
        if (sorter) {
            var sortParams = {
                sort: sorter.property,
                dir: sorter.direction
            };
            
            if (config.params) {
                Ext.apply(config.params, sortParams);
            } else {
                config.params = sortParams;
            }
        }
        
        this.getStore().load(config);
    },
    
    //handles load after deletion. 
    //If the current page contains no item, 
    //then starts from the first page.
    // See also bug #18874.  Sometimes need to pass this in as a callback to .load()
    // at which point 'this' becomes the store and not the grid.
    loadAfterDelete : function() {
        var me = this;
        if (this.$className !== "Ext.data.Store") {
            me = this.getStore();
        }
        var currentCount = me.getCount();
        if (currentCount == 0) {
            me.loadPage(1);
        }
        else {
            me.load();
        }
    },

    getPagingToolbar: function() {
        return this.dockedItems.findBy(function(item) {
            if (item.alias.length === 0 || item.dock !== 'bottom') {
                return false;
            }
            
            for (var i = 0; i < item.alias.length; ++i) {
                if (item.alias[i] === 'widget.pagingtoolbar' || item.alias[i] === 'widget.sppagingtoolbar') {
                    return true;
                }
            }
            
            return false;
        });
    },


    /**
     * Once the grid has loaded, we're ready to worry about state events,
     * so toggle the stateReady flag.  However, we need to wait out any 
     * buffered state save events that fired before the grid loaded, hence 
     * running a task if we have a saveDelay defined instead of simply
     * setting the stateReady flag.
     */
    onLoad: function() {
        if (this.saveDelay) {
            var runner = new Ext.util.TaskRunner();
            var task = runner.newTask({
                run: function() { this.stateReady = true; }, 
                scope: this,
                interval: this.saveDelay + 100, // the extra 100 is just cya
                repeat: 1
            });
            task.start();
        } else {
            this.stateReady = true;
        }
    },

    
    /**
     * Check the stateReady flag before allowing calls to save state.
     */
    saveState: function() {   
        if (this.stateReady) 
            this.callParent();
    }   
});
