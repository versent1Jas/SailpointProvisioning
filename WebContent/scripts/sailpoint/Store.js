/**
 * Store factory to hide some of the mess in creating stores.  Stores in ExtJS 4.x 
 * need a model and a proxy, so let's just wrap all that up into a nice neat factory.
 * 
 * TODO: If there is ever a way to determine if a model is already in memory with the
 * exact same fields, we should use that instead of creating a new uniquely named model
 * with the same info.  Probably not a big deal, but it would be cleaner.
 */
Ext.define('SailPoint.Store', {
    // load these BEFORE this class is created
    requires : [ 'Ext.data.Store', 'Ext.data.Model', 'Ext.data.Proxy'],  //also requires misc.js
    
    // load these CONCURRENTLY with this class
    uses : [ 'SailPoint.data.RestJsonStore' ],
    
    // Static methods
    statics : {

        /** 
         * 'PRIVATE' function:
         * 
         * Create a new store config with the values from the config parameter.
         * Assign all the known stuff, and then apply whatever is left over
         * to the root of the store config.
         */
        getStoreConfig : function(config) {

            // If there are fields passed in, always assume that means to build a unique model.
            if (config.fields) {
            
                // A trailing comma in the array causes problems in IE, so fix it here 
                // before we get to the define.
                Ext.Array.each(config.fields, function(f, i){
                    if(Ext.typeOf(f) === 'undefined') {
                        config.fields.splice(i, 1);
                    }
                });
                
                // Since we need the 'id' field for record.getId(), might as well force everyone to use it.
                // TODO: is this a 'good' idea?
                if(this.hasIdProperty(config.fields) === false) {
                    config.fields.unshift('id');
                }
                
                config.model = "SailPoint.model." + randomUUID(6); // Generate a unique namespace with misc.js randomUUID().
                Ext.define(config.model, {
                    extend : 'Ext.data.Model',
                    fields : config.fields
                });
                delete config.fields;
            }
            
            if(config.dataUrl && !config.url) {
                config.url = config.dataUrl;
            }
            
            if (config.urlBuilder){
                config.buildUrl = config.urlBuilder;
                config.proxyType = 'rest';
                config.urlTemplate = config.url;
            }

            if (!config.model || (!config.url && !config.data) ) {
                // Throw an error because we can't build a store without a model or a url/data. Right? RIGHT?!?
                Ext.Error.raise({
                    msg : "Unable to create store in Store.js. Required data not found in config.",
                    config : config
                });
                return null;
            }
            
            // Start with the basics
            var storeConfig = {
                model : config.model
            };
            
            // Clear out data we've already used
            delete config.model;

            // Set default proxyType if not passed in
            config.proxyType = config.proxyType ? config.proxyType : 'ajax';
            
            var tmpProxy = {
                type : config.proxyType
            };

            if (config.timeout)
                tmpProxy.timeout = config.timeout;
            
            if(config.url){
                tmpProxy.url = config.url;
                delete config.url;
            }
            
            if (typeof config.simpleSortMode == "boolean") {
                tmpProxy.simpleSortMode = config.simpleSortMode;
            }
            delete config.simpleSortMode;
            
            // If there is a URL we have a valid proxy, otherwise we should have a 
            // config.data object to load the store with.
            if(tmpProxy.url || config.proxyType == 'memory') {
                storeConfig.proxy = tmpProxy;
            }
            
            // Clear out data we've already used
            delete config.proxyType;
            
            // If there's a root(for json) or a record(for xml), assume we need to create a reader.
            if(config.root || config.record) {
                
                //If there's a record but no readerType, be nice and set it to xml.
                if(config.record && !config.readerType) {
                    config.readerType = 'xml';
                }
                config.readerType = config.readerType ? config.readerType : 'json';
                // TODO: As part of migrating everything to use the GridReponse object we need to default
                // this to 'rowCount' because GridResponse object automatically serializes everything to that
                // --Bernie 5/23/2012
                config.totalProperty = config.totalProperty ? config.totalProperty : 'totalCount';
                
                var readerConfig = {
                    type : config.readerType,
                    totalProperty : config.totalProperty
                };
                
                delete config.readerType;
                delete config.totalProperty;
                
                if(config.root) {
                    readerConfig.root = config.root;
                    delete config.root;
                }
                if(config.record) {
                    readerConfig.record = config.record;
                    delete config.record;
                }
                
                // Don't set idProperty unless it's passed in.
                if(config.idProperty) {
                    readerConfig.idProperty = config.idProperty;
                    delete config.idProperty;
                }
                
                // Might not have a proxy if we just pass in config.data without config.url.
                if(storeConfig.proxy) {
                    storeConfig.proxy.reader = readerConfig;
                }
            }
            
            // Set the reader if it's passed in.  THIS WILL OVERRIDE ALL THE PASSED IN READER CONFIGS (root, totalPropery, etc..)!!
            if(config.reader) {
                storeConfig.proxy.reader = config.reader;
                delete config.reader;
            }

            // Set baseParams and extraParams to proxy.extraParams.
            // Preferably we'll only use extraParams, but let's include baseParams for 
            // backward compatibility.
            if (config.extraParams && storeConfig.proxy) {
                storeConfig.proxy.extraParams = config.extraParams;
                delete config.extraParams;
            }
            // TODO: this section can probably be removed once we migrate everything over to ExtJS 4.x.
            if (config.baseParams && storeConfig.proxy) { //extraParams take precedence over baseParams, hence applyIf
                if (Ext.isDefined(Ext.global.console)) {
                    Ext.global.console.info("[Store] baseParams have been deprecated. Please use extraParams instead.");
                }
                if(!storeConfig.proxy.extraParams) {
                    storeConfig.proxy.extraParams = {};
                }
                Ext.applyIf(storeConfig.proxy.extraParams, config.baseParams); // Don't overwrite stuff already set with extraParams.
                delete config.baseParams;
            }
            
            // 'id' is deprecated, but we'll accept it anyway for the sake of compatibility.
            if(config.id){
                if (Ext.isDefined(Ext.global.console)) {
                    Ext.global.console.info("[Store] id has been deprecated. Please use storeId instead.");
                }
                storeConfig.storeId = config.id;
                delete config.id;
            }
            // a storeId will auto generate if we don't set it.
            if (config.storeId) {
                storeConfig.storeId = config.storeId; // storeId overwrites id if already set.
                delete config.storeId;
            }
            
            // TODO: this section can probably be removed once we migrate everything over to ExtJS 4.x.
            if(config.sortInfo) {
                if (Ext.isDefined(Ext.global.console)) {
                    Ext.global.console.info("[Store] sortInfo has been deprecated. Please use sorters instead.");
                }
                // sortInfo used to be an object of type {field: "name", direction: "ASC"}
                // However, sorters needs an array: [{property: "name", direction: "ASC"}]
                if(!(config.sortInfo instanceof Array)) {
                    if(config.sortInfo.field) { // Fix the field/property thing just in case.
                        if (Ext.isDefined(Ext.global.console)) {
                            Ext.global.console.info("[Store] 'field' has been deprecated in sorters objects. Please use 'property' instead.");
                        }
                        config.sortInfo.property = config.sortInfo.field;
                        delete config.sortInfo.field;
                    }
                    config.sortInfo = [config.sortInfo];
                }
                storeConfig.sorters = config.sortInfo;
                delete config.sortInfo;
            }
            
            // Preferably use sorters instead of sortInfo.
            if(config.sorters) {
                if(!(config.sorters instanceof Array)) {
                    config.sorters = [config.sorters];
                }
                // check for old 'field' property in the first object (most likely scenario when upgrading)
                if(config.sorters[0].field){
                    if (Ext.isDefined(Ext.global.console)) {
                        Ext.global.console.info("[Store] 'field' has been deprecated in sorters objects. Please use 'property' instead.");
                    }
                    config.sorters[0].property = config.sorters[0].field;
                    delete config.sorters[0].field;
                }
                storeConfig.sorters = config.sorters;
                delete config.sorters;
            }

            // If we need to POST instead of GET, set config.method = "POST" and this will set the default behavior.
            if(config.method && storeConfig.proxy){
                storeConfig.proxy.actionMethods = {create: "POST", read: config.method, update: "POST", destroy: "POST"};
                delete config.method;
            }
            
            // Anything else left over go ahead and apply to storeConfig before we create the store.
            Ext.applyIf(storeConfig, config);
            
            return storeConfig;
        },
        
        // helper function to test if config.fields contains an 'id' field.
        hasIdProperty : function(fields) {
            var len = fields.length, i;
            for(i = 0; i < len; i++) {
                if(fields[i] === 'id') {
                    return true;
                }
                else if(Ext.isObject(fields[i])) {
                    if(fields[i].name === 'id') {
                        return true;
                    }
                }
            }
            return false;
        },
        
        /**
         * Convenience method to create generic store.
         */
        createStore : function(config) {
            return Ext.create('Ext.data.Store', this.getStoreConfig(config));
        },

        /**
         * Convenience method to create RestJson store.
         */
        createRestStore : function(config) {
            return Ext.create('SailPoint.data.RestJsonStore', this.getStoreConfig(config));
        },
        
        /**
         * Convenience method to create named store.
         */
        createNamedStore : function(storeName, config) {
            return Ext.create(storeName, this.getStoreConfig(config));
        },
        
        // Debug function to print out the config string
        getStoreConfigString : function(config) {
            return Ext.JSON.encode(this.getStoreConfig(config));
        }
        
    }// end statics
});