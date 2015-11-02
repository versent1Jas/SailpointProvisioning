/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint');

SailPoint.MAX_LINK_ATTRIBUTE_VALUES = 25;

/**
* @class SailPoint.LinkAttributeValueSuggest
* @extends Ext.form.ComboBo
* Suggest component for link attribute values and permission rights.
*/
Ext.define('SailPoint.LinkAttributeValueSuggest', {
	extend : 'Ext.form.ComboBox',
	alias : 'widget.linkattrvaluesuggest',

    /**
     * The name of the application.
     */
    application: null,

    /**
     * The name of the attribute or permission target.
     */
    attributeName: null,

    /**
     * True if this is a permission.
     */
    isPermssion: false,

    initComponent:function() {

        Ext.applyIf(this, {
            store:  SailPoint.Store.createStore({
                url: SailPoint.getRelativeUrl('/include/linkAttributeValueSuggest.json?application=' + this.application + '&attrName=' + this.attributeName + '&isPermission=' + this.isPermission),
                root: 'values',
                totalProperty: 'numValues',
                model : 'SailPoint.model.Value',
                remoteSort: true
            })
        });
        
        this.callParent(arguments);
    },
    
    typeAhead: true,
    displayField: 'value',
    valueField: 'value',
    queryMode: 'remote',
    emptyText: '#{msgs.link_attr_suggest_enter_value}',
    loadingText: '#{msgs.link_attr_suggest_finding_values}',
    pageSize: SailPoint.MAX_LINK_ATTRIBUTE_VALUES,
    minChars: 0,
    forceSelection: true,
    width: 300,
    displayInfo: true,
    displayMsg: "#{msgs.grid_paging_display_cnt_msg}"
});
