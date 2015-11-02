/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
* @class SailPoint.ApplicationSuggest
* @extends Ext.form.ComboBo
* Suggest component for applications.
*/
Ext.define('SailPoint.ApplicationSuggest', {
	extend : 'Ext.form.ComboBox',
	alias : 'widget.appsuggest',

    /**
    * Clears out contents of input field.
    * @private
    */
    onTriggerClick : function(){

        if(this.disabled)
            return;

        this.collapse();
        this.clearValue();
        this.fireEvent('triggerClick');
    },

    // private
    initComponent:function() {

        this.addEvents(
	        /**
	         * @event triggerClick
	         * Fires when the trigger is clicked
	         */
	        'triggerClick'
        );

         // Override trigger style
        Ext.apply(this,{
			triggerCls:'x-form-clear-trigger'
		});

        Ext.applyIf(this, {
            store:  SailPoint.Store.createStore({
                url: SailPoint.getRelativeUrl('/include/applicationQuery.json'),
                root: 'applications',
                totalProperty: 'numApplications',
                model : 'SailPoint.model.Name',
                remoteSort: true
            }),
            tpl: new Ext.XTemplate(
                '<tpl for="."><div class="search-item">',
                  '<div class="sectionHeader">{name}</div>',
                '</div></tpl>'
            )
        })
    },

    typeAhead: true,
    displayField: 'name',
    queryMode: 'remote',
    emptyText: "#{msgs.appsuggest_enter_app}",
    loadingText: "#{msgs.appsuggest_finding_apps}",
    pageSize: 25,
    minChars: 1,
    width: 300,
    itemSelector: 'div.search-item',
    displayInfo: true,
    displayMsg: "#{msgs.grid_paging_display_cnt_msg}"
});