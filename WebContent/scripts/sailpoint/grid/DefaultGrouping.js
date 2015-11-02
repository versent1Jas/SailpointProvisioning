/* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Default grouping feature for an Ext.grid.Panel. Adds the custom SailPoint 
 * header template to the existing Ext grouping object. Simply pass in the 
 * 'singularObjectName' and the 'pluralObjectName' to the constructor through 
 * the object configuration.
 */
Ext.define('SailPoint.grid.DefaultGrouping', {
    extend: 'Ext.grid.feature.Grouping',
    alias : 'feature.spdefaultgrouping',
    
    constructor: function(config) {
        Ext.applyIf(config, {
            singularObjectName: '',
            pluralObjectName: ''
        });
        
        Ext.apply(config, {
            groupHeaderTpl: [
                   '{columnName}: {name} ({rows.length} {rows:this.pluralize})',
                   {
                       singularObjectName: config.singularObjectName,
                       pluralObjectName: config.pluralObjectName,
                       pluralize: function(rows) {
                           return rows.length > 1 ? this.pluralObjectName : this.singularObjectName;
                       }
                   }
               ]
        });
        
        this.callParent(arguments);
    }
});