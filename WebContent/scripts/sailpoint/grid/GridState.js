/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

////////////////////////////////////////////////////////////////////////////////
//
// GridState is used to hold options used when rendering a grid such as sorting,
// the first row to display, etc...
//
////////////////////////////////////////////////////////////////////////////////

Ext.define('SailPoint.GridState', {
    
    ////////////////////////////////////////////////////////////////////////////
    //
    // STATIC METHODS
    //
    ////////////////////////////////////////////////////////////////////////////
    statics : {
    
        stateStoreId: 'gridStateStore',

        getGridState: function(gridStateId, stateStoreId) {
            if ((gridStateId == null) || (gridStateId == ''))
                return null;
            
            var storeId = storeId || this.stateStoreId;
            var gridStateStore = Ext.StoreMgr.get(storeId);
            if (gridStateStore === null)
                return null;
            
            var gridStateObj = gridStateStore.findRecord('name', gridStateId);
            if (gridStateObj === null)
                return null;
            else 
                return gridStateObj.get('state');
        }
    },
    
    
    ////////////////////////////////////////////////////////////////////////////
    //
    // FIELDS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * An object containing all of the interesting properties of the grid state.
     * See initialize for more details.
     */
    state: null,


    ////////////////////////////////////////////////////////////////////////////
    //
    // CONSTRUCTORS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Constructor that takes a regular javascript object that has the relevant
     * properties for the grid state.  Property accesses are delegated to this
     * object.  The reason for a constructor of this type is so we can accept a
     * JSON-generated object and use it for the data contents of the grid state.
     *
     * @param  obj  A regular javascript object with the properties of the grid
     *              state.
     */
    constructor: function(config) {
        config = config || {};
        this.state = config.state || config;
        this.name = config.name;
        config.id = config.name + 'State';
                
        if (this.state) {
            var sp = Ext.state.Manager.getProvider();
            if (sp === null)
                return;
            
            var state = sp.decodeValue(this.state);
            if (state && state.sort) {
                this.sortColumn = state.sort.property;
                //Pre extJS upgrade we used field instead of property
                if(Ext.isEmpty(this.sortColumn) && state.sort.field) {
                    this.sortColumn = state.sort.field;
                }
                this.sortOrder = state.sort.direction;
            }
        }
    },


    ////////////////////////////////////////////////////////////////////////////
    //
    // GETTERS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Return the zero-based first row to display in the grid (aka - the
     * offset).
     */
    getFirstRow: function() {
        return this._getValue('firstRow');
    },

    _getValue: function(property) {
        var val = this[property];

        if (-1 === val) 
            val = null;

        return val;
    },

    ////////////////////////////////////////////////////////////////////////////
    //
    // GETTERS
    //
    ////////////////////////////////////////////////////////////////////////////

    _setValue: function(property, value) {
      this[property] = value;
    },

    ////////////////////////////////////////////////////////////////////////////
    //
    // METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    encodeGridState: function(formName) {
        var grid = Ext.getCmp(this.gridId);
        if (grid) {
            var pageSize = grid.getStore().pageSize;
            this._setValue('pageSize', pageSize);
            
            var currentPage = grid.getStore().currentPage;
            var firstRow = (currentPage - 1) * pageSize;
            this._setValue('firstRow', firstRow);
            
            var sorters = grid.getStore().sorters;
            if (sorters && sorters.getCount() > 0) {
                var sorter = sorters.get(0);
                this._setValue('sortColumn', sorter.property);
                this._setValue('sortOrder', sorter.direction);
            }
        
            // todo extjs4 : cant find a property to make this work...
            //scrollTop = grid.getView().scroller.dom.scrollTop;
            //this._setValue('scrollPosition', scrollTop);
        }

        this.encodeInForm(formName);
    },
    
    /**
     * Save the details of the given LiveGrid into this object and encode the
     * details of into hidden form fields that have the given prefix (eg -
     * editForm:).  Note that this will popup an alert if any fields cannot be
     * found.
     *
     * @param  fieldNamePrefix  The prefix of the field names.
     */
    encodeInForm: function(fieldNamePrefix) {
        // Make sure the prefix contains a colon.  There is a handful 
        // of callers that does NOT have the colon as the last char, 
        // so just check for the existence of one.
        if (fieldNamePrefix.indexOf(':') == -1)
            fieldNamePrefix = fieldNamePrefix + ":";
        
        // this is WAY expensive, with ~350 keys to evaluate on the object
        // Object.keys(this).each(
        var stateProperties = [ 'sortColumn', 'sortOrder', 'firstRow', 'pageSize' ];
        for (var i = 0; i < stateProperties.length; i++) {
            var property = stateProperties[i];
            var value = this[property];
            var fieldName = fieldNamePrefix + property;
            var field = $(fieldName);
            if (null != field) {
                field.value = value;
            }
        }
    },

    /** Attempts to notify the grid state object of the current 'start' parameter
    on the load of the extjs store **/
    updateFirstRow: function(store, records, success, options) {
        // if a start param was sent then use it else default to 0
        var firstRow = (store.proxy.extraParams && store.proxy.extraParams.start) ? store.proxy.extraParams.start : 0;
        this._setValue('firstRow', firstRow);
        this._setValue('pageSize', store.proxy.extraParams.limit); //options.params.limit);
    }
});

Ext.define('SailPoint.model.GridStateStore', {
    extend : 'Ext.data.Model',
    fields : [
        {   
            name: 'name', 
            type: 'string'
        },
        {   
            name: 'sortColumn', 
            type: 'string'
        },
        {   
            name: 'sortOrder', 
            type: 'string'
        },
        {   
            name: 'firstRow', 
            type: 'string'
        },
        {   
            name: 'pageSize', 
            type: 'string'
        },
        {
            name: 'state',
            convert: function(value, recordData) {
                if(value == ""){
                    value = "{}";
                }
                
                return new SailPoint.GridState(recordData.raw);
            }
        }
    ]
});

/**
 * This store manages the initialization and maintenance of multiple grid states on a page
 */
Ext.define('SailPoint.GridStateStore', {
    extend : 'Ext.data.Store',
    model : 'SailPoint.model.GridStateStore',
    proxy : {
        type : 'ajax',
        reader: {
            type : 'json',
            idProperty: 'name',
            root: 'gridStates',
            totalProperty: 'numGridStates'
        }
    },

    constructor: function(config) {
        if(config.url){
            this.proxy.url = config.url;
            delete config.url;
        }
        
        if(config.extraParams){
            this.proxy.extraParams = config.extraParams;
            delete config.extraParams;
        }
        
        if(config.id){
            config.storeId = config.id;
            delete config.id;
        }
        
        this.callParent(arguments);
    }
});
