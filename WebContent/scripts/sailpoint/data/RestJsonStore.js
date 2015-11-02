/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.data.RestJsonStore', {
    extend : 'Ext.data.Store',
    alias : 'widget.restjsonstore',
    
    model : 'SailPoint.model.Empty', // set to generic, should get overwritten in constructor.

    /**
     * @cfg Default HTTP method to use, defaults to GET
     */
    method : 'GET',

    /**
     * @private {String} Original url string. Stored here so we
     * can rebuild the url with different path parameters.
     */
    originalDataSourceUrl : null,

    /**
     * @private pathParams {Array} - path parameters currently applied
     * to the store's data source url.
     */
    pathParams : [],
    
    /**
     * @private {Ext.data.Record}  A record that - if set - will automatically
     * be included as the first record in this store.  This allows the client to
     * force records into the store.
     */
    autoRecord : null,
    
    proxy : {type:'ajax'},

    constructor: function(config) {
        config = config || {};
        
        if(!config.proxy){
            config.proxy = {type:'ajax', reader:{}};
        }
        
        if(!config.proxy.reader) {
            config.proxy.reader = {};
        }
        
        //Pass the URL to the proxy
        if(config.url) {
            config.proxy.url = config.url;
            delete config.url;
        }
        
        if(config.extraParams){
            config.proxy.extraParams = config.extraParams;
            delete config.extraParams;
        }
        
        // Pass the baseParams to the proxy extraParams, but don't override already set extraParams
        if(config.baseParams){
            Ext.applyIf(config.proxy.extraParams, config.baseParams);
            delete config.baseParams;
        }
        
        Ext.applyIf(config.proxy.reader, {
            root: 'objects',
            totalProperty: 'count',
            successProperty: 'success'
        });

        if (config.autoRecord) {
            //Try and determine if config.autoRecord is already a model or if we should
            //coerce it to a model
            if(!config.autoRecord.data) {
                if(config.model) {
                    config.initialData = Ext.create(config.model, config.autoRecord);
                }
            } else {
                config.initialData = config.autoRecord.data;
            }
        }
        var rute = SailPoint.Utils.isNullOrEmpty(config.root) ? config.proxy.reader.root : config.root;
        // The default data may just be an array of objects
        // and not contain all the crap the reader needs. Check
        if (config.initialData && !config.initialData[rute]){
            var data = {};
            var initVal = config.initialData ? config.initialData : [];
            if (!Ext.isArray(initVal)) {
                initVal = [initVal];
            }
            config.data = initVal;
        }
        
        // Set the model (this should be a string, not an object)
        if(config.model){
            this.model = config.model;
        }
        
        Ext.apply(this, config);
        
        this.callParent(arguments);

        if (!this.hasListener('exception')){
            this.on('exception', SailPoint.DEFAULT_STORE_ERR_HANDLER, this);
        }

        this.originalDataSourceUrl = this.proxy.url;
        
        // If this store was set up as a config in a grid instead of 
        // instantiated first, apply the path params now.
        if(this.initialPathParams) {
            this.applyPathParams(this.initialPathParams);
            delete this.initialPathParams;
        }
    },

    /**
     * Append a new parameter to the end of this Store's
     * data source url.
     * @param param {String} path parameter text
     */
    appendPathParam: function(param) {
        this.pathParams.push(param);
        this.proxy.url = this.proxy.url + '/' + encodeURIComponent(param);
    },

    /**
     * Apply the list of parameters to the data source url of this
     * store. This assumes that the data source url is a template
     * in the form /foo/{0}/{1}/bar
     * @param params {Array} array of parameter values
     */
    applyPathParams: function(params){
        this.clearPathParams();
        var i, urlTemplate = new Ext.Template(this.originalDataSourceUrl);
        if(Ext.isArray(params)) {
            for(i = 0; i < params.length; i++) {
                this.pathParams.push(encodeURIComponent(params[i]));
            }
        }
        this.proxy.url = urlTemplate.apply(this.pathParams);
    },

    /**
     * Remove all path params from this Store's data source url.
     */
    clearPathParams : function(){
        this.pathParams = [];
        this.proxy.url = this.originalDataSourceUrl;
    },
    
    /**
     * Set a record to be included as the first record in the store.  This
     * allows the client to force records into the store.
     */
    setAutoRecord: function(record) {
        this.autoRecord = record;
    },
    
   
    ////////////////////////////////////////////////////////////////////////////
    //
    // Additional information about the last load
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * @private
     * Return information from the last load.
     */
    getJsonData: function(key) {
        return (this.proxy.reader.jsonData) ? this.proxy.reader.jsonData[key] : null;
    },

    /**
     * Return any warnings returned from the last load.
     */
    getWarnings: function() {
        return this.getJsonData('warnings');
    },

    /**
     * Return any errors returned from the last load.
     */
    getErrors: function() {
        return this.getJsonData('errors');
    },

    /**
     * Return the status from the last load - failure, success, etc...  These
     * will be the constant values in RequestResult.
     */
    getStatus: function() {
        return this.getJsonData('status');
    }
});