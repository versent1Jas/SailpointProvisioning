/**
 * This classes main purpose is to override getInputField from SailPoint.MultiSuggest.
 * In version 6.4 we allow multiple 'group' objects and refactored the UI. When using
 * the Faces JSF tag ui:repeat to render the new objects, the existing 
 * SailPoint.MultiSuggest.getInputField() could no longer perform a jquery $('editForm:id_indexColumn')
 * because of the way JSF renders components inside a ui:repeat. The attribute forceId
 * did not help once the component is embedded in a ui:repeat element. You can't append
 * the namespace to the id field because it's a build time vs. render time JSF component
 * rendering issue. Booooo!
 */
Ext.define('SailPoint.define.applications.FacesMultiSuggest', {
    extend: 'SailPoint.MultiSuggest',
    mixins: ['SailPoint.define.applications.FieldQuerier'],
    
    spNamespace: undefined,
    renderTo: undefined,
    jsonData: undefined,
    inputFieldName: undefined,
    objectType: undefined,
    suggestType: 'jdbcSchemaAttribute',
    valueField:'displayName',
    contextPath: CONTEXT_PATH,

    constructor: function(config) {
        var tmpObjectType = config.objectType;
        
        delete config.objectType;
        
        Ext.applyIf(config, {
            extraParams: {
                objectType: tmpObjectType
            }
        });
        
        this.callParent(arguments);
    }, 
    
    /**
     * We are overriding because the tomahawk trick of using forceId on a hidden input will not
     * append an expression language statement like #{nameSpace} to the id attribute. We need to 
     * query from a known parent element like the tabMerging_ div and search within that list of dom results
     * for a hidden element with the same suffix as inputFieldName.
     */
    getInputField: function() {
        return this.getField(this.inputFieldName, '#tabMerging_' + this.spNamespace, 'input[type="hidden"]');
    }

});