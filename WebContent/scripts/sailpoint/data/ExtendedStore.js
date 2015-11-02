/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */
/**
* @class SailPoint.data.ExtendedStore
* @extends Ext.data.Store
* <p>Extension of the Store that ensures that an item that is currently selected will be
* present on the page we end up on after sorting.  The base Store class will simply sort,
* leaving the page as is without regard to the current selection</p>
* <p>Note: This class lacks a key detail.  If the object that contains the store changes
* state without triggering a reload, the store will not sort properly.  The store's consumer
* has two options: The first is to reload the store every time the state changes.  The optimal
* option, though, is to manually update the store's lastOptions.params variable to reflect the
* state change.  An example of this can be found in the SailPoint.Role.updateState function in the
* roleViewer.js file.
*/

Ext.define('SailPoint.data.ExtendedStore', {
	extend : 'Ext.data.Store',
    /**
     * @cfg {string} gridInfoUrl
     * A URL that will respond with a JSON object that contains the information needed to load
     * the current page.  A specific example of such an object is:<pre><code>
{    
    start: 0,
    limit: 30, 
    selectedObjId: '123abc456'
}
     * </code></pre>
     */


    /**
     * Override the superclass's sort so that it applies our parameters before
     * loading the store
     * @private
     */
    sort : function(sortInfo){
        var sortDir = sortInfo.direction;
        var fieldName = sortInfo.property;
        var sorter = fieldName ? this.sorters.get(fieldName) : undefined;
        
        if(!sorter && fieldName && sortDir){
            this.sorters.add(fieldName, new Ext.util.Sorter({property: fieldName, direction: sortDir}));
        }

        if(!this.remoteSort){
            this.applySort();
            this.fireEvent("datachanged", this);
        } else {
            var currentParams = {'dir': sortDir, 'sort': fieldName};
            Ext.apply(currentParams, this.extraParams);

            Ext.Ajax.request({
                url: this.gridInfoUrl,
                success: this.sortAfterQuery,
                failure: function() {},
                params: currentParams,
                scope: this
            });
        }
    },
    
    /**
     * After doing our preliminary positional query we do the actual sort here
     * @private
     */
    sortAfterQuery : function(response, options) {
        var loadOptions = {};
        loadOptions.params = Ext.decode(response.responseText);
        if (this.afterSort) {
            loadOptions.callback = this.afterSort;
        }

        SailPoint.data.ExtendedStore.superclass.sort.apply(this, [{property: options.params['sort'], direction: options.params['dir']}]);
    }
});
