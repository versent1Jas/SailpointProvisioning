/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.TierRecord', {
	extend: 'Ext.data.Model',
	idProperty: 'application',
	fields: [
	    {"name":"correlationRule","dataIndex":"correlationRule", hidden:true},
        {"name":"correlationMap","dataIndex":"correlationMap", hidden:true},
        {"name":"application","dataIndex":"application","width":130,"header":"#{msgs.#{msgs.app_tiers_grid_hdr_app}}"},
        {"name":"primaryTier","dataIndex":"primaryTier","width":130,"header":"#{msgs.app_tiers_grid_hdr_primary_tier}"}
	]
});

/**
 * This is the backing store for the CompositeDefinitionPanel. Each record in the store maps to one of the
 * tier applications. Includes methods for loading the data and persisting the data back into a form field
 * on the page once the page is saved.
 *
 * It stores 4 bits o' data
 *
 * - correlationRule: (String) Name of rule used to correlate links from this tier app and the primary
 * - correlationMap: (Object) Map of tier attribute names to the name of the attribute on the primary
 * - application (String) application name
 * - primaryTier (boolean) is this the primary tier?
 */
Ext.define('SailPoint.CompositeDefinitionPanelStore', {
	extend : 'Ext.data.Store',

    constructor: function (config) {

       Ext.apply(this, config);

       Ext.apply(this, {
    	   model: 'SailPoint.TierRecord',
    	   proxy: {
    		   type: 'memory',
    		   reader: {
    			   type: 'json',
    			   root: 'objects',
    			   totalProperty: 'count'
    		   }
    	   }
        });

       this.callParent(arguments);

       this.addEvents('accountAttrDeleted');
    },


    initComponent : function() {
    	this.callParent(arguments);
    	this.on('exception', SailPoint.DEFAULT_STORE_ERR_HANDLER, this);
    },

    validate : function(){

        var hasPrimary = false;

        this.each(function(record){
            if (record.get('primaryTier') === true){
                hasPrimary = true;
            }
        });

        if (!hasPrimary){
            return ['#{msgs.app_err_validation_no_composite_primary_tier}'];
        }


        return null;
    },

    load : function(compositeDef){
        if (compositeDef && compositeDef.tiers){

            for (var i=0;i<compositeDef.tiers.length;i++){
                var tier = compositeDef.tiers[i];
                var correlationMapData = [];

                // perform some magic to convert data which is coming from a java map
                // into a series of arrays. This allows us to use Ext's Record.update()
                // method, which at the current time doesnt handle Objects.
                if (tier.correlationMap) {
                    for (var tierAttr in tier.correlationMap) {
                        if (tier.correlationMap.hasOwnProperty(tierAttr)) { //exclude obj prototype funcs and stuff
                            var attrVal = tier.correlationMap[tierAttr];
                            correlationMapData.push([tierAttr, attrVal]);
                        }
                    }
                    tier.correlationMap = correlationMapData;
                } else {
                    tier.correlationMap = [];
                }

                // The grid expects each tier grid record to have a 'primaryTier' attribute.
                // Calculate this now by checking the value from the parent definition obj.
                tier.primaryTier = tier.application === compositeDef.primaryTier;
            }
        }


        var tiers = compositeDef.tiers;
        if (!tiers){
            tiers = [];
        }

        this.loadRawData({
            count : tiers.length,
            objects : tiers
        });
    },

    addTier : function(appData){
        var newRecord = Ext.create('SailPoint.TierRecord', appData);
        this.add([newRecord]);

        return newRecord;
    },

    /**
     * Converts the data in this store into an object that can be easily converted to
     * a string written out to a text field for submission to the server. It would be
     * alot nicer if we could do this with ajax, but alas we are stuck with jsf.
     */
    getPersistableDTO : function(){

        var dto = {
            tiers:[],
            primaryTier : "",
            remediationRule : "", // to be set by container panel
            accountRule : "" // to be set by container panel
        };

        this.each(function(record){

            var newRec = record.copy();
            if (newRec.get('correlationMap')){
                var formattedMap = {};
                for (var i=0; i < newRec.get('correlationMap').length;i++ ){
                    var item = newRec.get('correlationMap')[i];
                    formattedMap[item[0]] = item[1];
                }
                newRec.set('correlationMap', formattedMap);
            }

            dto.tiers.push(newRec.data);
            if (record.get("primaryTier") === true){
                dto.primaryTier = record.get("application");
            }

        }, dto);

        return dto;
    }

});

