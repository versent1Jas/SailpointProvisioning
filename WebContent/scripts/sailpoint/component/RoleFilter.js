/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

var MAX_ROLES = 10;

Ext.define('SailPoint.RoleFilter', {
	extend : 'Ext.form.field.ComboBox',
	alias : 'widget.rolefilter',

    initComponent: function() {
        Ext.apply(this, {
            store: SailPoint.Store.createStore({
                storeId: 'roleDataStore',
                url: (this.url) ? this.url : 'roleQueryJSON.json',
                root: 'roles',
                totalProperty: 'numRoleResults',
                fields: [
                    { name: 'id', type: 'string' },
                    { name: 'name', type: 'string' },
                    { name: 'roleType', type: 'string'},
                    { name: 'displayableName', type: 'string'}
                ],
                remoteSort: true,
                // The baseParams below were hacked in to allow the inheritance filter to 
                // pass along the ID of the edited role, but any other components that 
                // may need that information can pass in an editedRoleId and take advantage
                // of this functionality
                extraParams: {editedRoleId : this.editedRoleId},
                pageSize: MAX_ROLES
            }),
            typeAhead: false,
            hideLabel: true,
            hideTrigger: true,
            valueField: 'name',
            displayField: 'displayableName',
            queryMode: 'remote',
            emptyText: '#{msgs.role_filter_enter_a_role_name}',
            minChars: 1,
            matchFieldWidth : true,
            width: 250,
            pageSize: MAX_ROLES,
            listConfig : {
                loadingText: '#{msgs.role_filter_loading_text}',
                getInnerTpl: function(displayField) {
                    return '<div class="search-item">' +
                               '<div class="sectionHeader">#{msgs.name}: {displayableName}</div>' +
                               '<div>#{msgs.type}: {roleType}</div>' +
                           '</div>';
                }
            }
        });
         
        this.callParent(arguments);
        
        this.on('select', function(combo, records, eOpts) {
        	if (records.length === 0 || !this.onSelect) {
        		return;
        	}
        	
        	var record = records[0];
        	
        	this.onSelect(record, combo.getStore().indexOf(record));
        });
    },

    getRecord: function() {
    	return this.findRecordByValue(this.getValue());
    }
});
