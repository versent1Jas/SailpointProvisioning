/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
* @class SailPoint.ExtendedPagingToolbar
* @extends Ext.PagingToolbar
* <p>Extension of the PagingToolbar that lets users specify a parameterBuilder function
* that returns an object containing additional parameters to send every time the store is 
* loaded</p>
*/

Ext.define('SailPoint.ExtendedPagingToolbar', {
    extend : 'Ext.PagingToolbar',
    /**
     * @cfg {Function} paramBuilder
     * A function that returns an object containing additional parameters that need to be
     * passed to the datasource when reloading the store on paging.  Here's a very simple 
     * sample function: <pre><code>
function myParamBuilder() {
    return {paramName: 'value', param2Name: 'value2'};
}
     * </code></pre>
     */

    /**
     * Override the superclass's doLoad so that it applies our parameters before
     * loading the store
     * @private
     */
    doLoad : function(start){
        var o;
        
        if (!this.paramBuilder)
            o = function() { return {}; }
        else 
            o = this.paramBuilder();
        var pn = this.paramNames;
        o[pn.start] = start;
        o[pn.limit] = this.store.pageSize;
        this.store.load({params:o});
    }, 
    
    /**
     * Provides a default paramBuilder
     * @private
     */
    initComponent: function() {
        SailPoint.ExtendedPagingToolbar.superclass.initComponent.apply(this, arguments);

        if (!this.paramBuilder) {
            this.paramBuilder = function() {
                return {};
            }
        }
    }
});
