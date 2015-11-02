/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.model.Color', {
    extend : 'Ext.data.Model',
    fields : [{name: 'upper', type: 'int'}, 
              {name: 'lower', type: 'int'}, 
              {name: 'color', type: 'string'}, 
              {name: 'enabled', type: 'boolean'}]
});

/**
 * @class SailPoint.Risk.ColorStore
 * @extends Ext.data.Store
 * This class aids in determining which color goes with which risk band so that proper
 * indicators can be displayed for scores
 */
Ext.define('SailPoint.Risk.ColorStore', {
	extend : 'Ext.data.Store',
    remoteSort: true,
    model : 'SailPoint.model.Color',
    proxy : {
        type : 'ajax',
        url: 'bandConfigJSON.json',
        reader : {
            type : 'json',
            root : 'colorBands',
            totalProperty : 'numColors'
        }
    },
    
    /**
     * @param {int} The risk score whose indicator color we need to find
     * {string} The color of the indicator corresponding to the specified score
     */
    getColorForScore: function(score) {
        
        function colorFinder(record, id) {
            var ret = record.data.lower <= score && record.data.upper >= score;
            return ret;
        }

        var recordIndex = this.findBy(colorFinder);
        var record = this.getAt(recordIndex);
        return record.data.color;
    },
    
    getImageUrlForScore: function(score) {
        var color = this.getColorForScore(score);
        var imageBase = SailPoint.getRelativeUrl('/images/icons/risk_indicator_');
        var imageFormat = '.png';
        var indexOfPound = color.indexOf('#');
        var image = imageBase + color.substr(indexOfPound + 1) + imageFormat;
        return image;
    }
});

Ext.define('SailPoint.Risk.NeutralColorStore', {
    extend : 'SailPoint.Risk.ColorStore',
    model : 'SailPoint.model.Color',
    data : [
            {id: 1, lower: 0, upper: 333, color: '#ffffff', enabled: true},
            {id: 2, lower: 334, upper: 666, color: '#80aac3', enabled: true},
            {id: 3, lower: 667, upper: 1000, color: '#025588', enabled: true}
            ],
    initComponent: function() {
        SailPoint.Risk.NeutralColorStore.superclass.initComponent.apply(this, arguments);
        this.callParent(arguments);
    }
});