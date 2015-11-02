/* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Models in this file should be reusable in any store. All namespaces should
 * start with 'SailPoint.model.' in line with the ExtJS naming conventions.
 */

Ext.define('SailPoint.model.KeyValue', {
    extend : 'Ext.data.Model',
    fields : [ 'key', 'value' ]
});

Ext.define('SailPoint.model.Empty', {
    extend : 'Ext.data.Model',
    fields : []
});

Ext.define('SailPoint.model.NameValue', {
    extend : 'Ext.data.Model',
    fields : ['name', 'value']
});

Ext.define('SailPoint.model.IDName', {
    extend : 'Ext.data.Model',
    fields : ['id', 'name']
});

Ext.define('SailPoint.model.IDNameDisplayName', {
    extend : 'Ext.data.Model',
    fields : ['id', 'name', 'displayName']
});

Ext.define('SailPoint.model.Name', {
    extend : 'Ext.data.Model',
    fields : ['name']
});

Ext.define('SailPoint.model.Value', {
    extend : 'Ext.data.Model',
    fields : ['value']
});

Ext.define('SailPoint.model.NameDisplayName', {
    extend : 'Ext.data.Model',
    fields : ['name', 'disaplyName']
});

Ext.define('SailPoint.model.IdentitySuggest', {
    extend : 'Ext.data.Model',
    fields : [ 'id', 'name', 'firstname', 'lastname', 'email', 'emailclass', 'displayableName', 'icon' ]
});