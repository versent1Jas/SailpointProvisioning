/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.modeler.model.RoleTypeDefModel', {
    extend : 'Ext.data.Model',
    fields : [
        {name: 'id', type: 'string'},
        {name: 'name', type: 'string'},
        {name: 'displayName', type: 'string'},
        {name: 'icon', type: 'string'},
        {name: 'noAssignmentSelector', type: 'boolean'},
        {name: 'noAutoAssignment', type: 'boolean'},
        {name: 'noManualAssignment', type: 'boolean'},
        {name: 'noDetection', type: 'boolean'},
        {name: 'noPermits', type: 'boolean'},
        {name: 'noProfiles', type: 'boolean'},
        {name: 'noRequirements', type: 'boolean'},
        {name: 'noSubs', type: 'boolean'},
        {name: 'noSupers', type: 'boolean'},
        {name: 'noIIQ', type: 'boolean'},
        {name: 'notPermittable', type: 'boolean'},
        {name: 'notRequired', type: 'boolean'}
    ],
    proxy : {
        type : 'ajax',
        url : SailPoint.getRelativeUrl('/define/roles/modeler/roleTypeDefQuery.json'),
        reader : {
            type : 'json',
            id : 'name',
            root : 'definitions',
            totalProperty : 'numDefinitions'
        }
    }
});

/**
* @class SailPoint.modeler.RoleTypeDefinitionStore
* @extends Ext.data.Store
* <p>Pre-configured Store that stores RoleTypeDefinitions</p>
*/
Ext.define('SailPoint.modeler.RoleTypeDefinitionStore', {
    extend : 'Ext.data.Store',
    model : 'SailPoint.modeler.model.RoleTypeDefModel',
       
    /**
     * Return a JavaScript object containing all the properties in the RoleTypeDefinition 
     * for the specified type
     */
    getTypeDefinition: function(type) {
        var typeDef;
        var matchingRecordIndex = this.find('name', type);
        if (matchingRecordIndex >= 0) {
            typeDef = this.getAt(matchingRecordIndex).data;
        } else {
            typeDef = null;
        }
        
        return typeDef;
    }
});

