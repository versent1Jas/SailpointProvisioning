/* (c) Copyright 2011 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * A grid that displays the selected identities for a bulk LCM request.
 */
Ext.define('SailPoint.LCM.ChosenIdentitiesGrid', {
    extend : 'SailPoint.grid.PagingGrid',
    alias : 'widget.spchosenidentitiesgrid',
    
    /**
     * Constructor.
     * 
     * @param  gridMetaData  The metadata for the grid.
     * @param  gridConfig    Optional config that will override defaults.
     */
    constructor: function(gridMetaData, gridConfig) {
        
        if(!gridConfig) {
          gridConfig = {};
        }
        
        Ext.apply(gridConfig, {
            renderTo : 'chosenIdentitiesContainer',
            runInitialLoad : true,
            pageSize: 10,
            store: SailPoint.Store.createStore({
                fields : gridMetaData.fields,
                url: SailPoint.getRelativeUrl('/lcm/chooseIdentitiesDataSource.json'),
                root: 'objects',
                totalProperty: 'count',
                simpleSortMode : true,
                sorters: [{property: 'name', direction: 'ASC' }],
                pageSize : 10
            }),
            id:'chosenIdentityGrid',
            cls: 'smallFontGrid',
            layout:'fit',
            gridMetaData: gridMetaData,
            // Set the height to 450 to match closely to the available identities grid.
            height: 450
        });
        
        this.callParent([gridConfig]);
    }
});
