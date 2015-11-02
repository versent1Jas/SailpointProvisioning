/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Input widget which allows you to select groups factories.
 */
Ext.define('SailPoint.form.GroupFactorySelector', {
	extend : 'Ext.form.FieldContainer',
	alias : 'widget.groupselector',

    constructor: function(config) {
    	var width = 300;

        Ext.applyIf(config, {
            layout: 'anchor',
            items: [
                {
	        		xtype: 'spcombo',
	        		datasourceUrl: '/rest/groupFactory/list',
	        		emptyText: '#{msgs.grp_selector_empty_txt_group}',
	        		width: width,
	        		margin: 0
	        	}, 
	        	{
	        	    xtype: 'multiselect',
	                datasourceUrl : '/rest/groupFactory/options/',
	                comboWidth : '90%',
	                matchFieldWidth : config.matchFieldWidth ? config.matchFieldWidth : false,
	                selectionsGridHeight: 100,
	                selectionsGridWidth: width,
	                comboWidth: width,
	                emptyText: '#{msgs.grp_selector_empty_txt_value}',
	                disabled: true
	            }
	        ]
        });
        
        this.callParent(arguments);
    },

    initComponent: function() {
    	var me = this;
    	
        this.callParent(arguments);
        
        this.groupCombo = this.items.get(0);
        this.valuePicker = this.items.get(1);
        
        // this will append the group factory name to the option name when
        // a new group is added to the selections list - ie 'Region - North America'
        this.valuePicker.on('beforeAdd', function(combo, record, index) {
            var optionValue = record.get('displayName');
            record.set('displayName', me.groupCombo.getRawValue() + '-' + optionValue);
            record.commit(true); // this will prevent the record from showing as 'dirty' in the grid
        });

        this.groupCombo.on('select', function(combo, record, index) {
        	//reset the current page.  If this isn't done, a previous page result of 5 applied
        	//to a different list of 2 pages will fail.
        	me.valuePicker.getStore().currentPage = 1;
            me.valuePicker.getStore().getProxy().extraParams.id = record[0].getId();
            me.valuePicker.enable();
            me.valuePicker.getStore().load();
        });
    },

    getValue: function() {
        return this.valuePicker.getValue();
    },

    clear: function() {
        this.groupCombo.reset();
        this.valuePicker.clear();
    }
});