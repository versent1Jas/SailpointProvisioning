/* (c) Copyright 2010 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * A combo box for selecting ManagedAttribute values.
 * 
 * @class   SailPoint.form.ManagedAttributeValueCombo
 * @extends SailPoint.form.ComboBox
 */
Ext.define('SailPoint.form.ManagedAttributeValueCombo', {
    extend : 'SailPoint.form.ComboBox',
    alias : 'widget.managedattvaluecombo',
    
    /**
     * @cfg {String} The name of the application for which to return values.
     */
    applicationName: null,

    /**
     * @cfg {String} The application instance for which to return values.
     */
    instance: null,

    /**
     * @cfg {String} The name of the attribute for which to return values.
     */
    attribute: null,

    /**
     * @cfg {String} The type of values to return - 'Entitlement', 'Permission',
     *               or null to not filter by type.
     */
    type: null,

    /**
     * @cfg {boolean} Filter to only include requestable or non-requestable
     *                entitlements.
     */
    requestable: null,

    /**
     *
     * @param config {Array} The type of MA to exclude or null to not exclude any
     */
    excludedTypes: null,

    /**
     * Constructor.
     */
    constructor: function(config) {
        Ext.applyIf(config, {
            suggest: true,
            valueField: 'value',
            displayField: 'displayValue',
            extraFields: ['description'],
            queryParam: 'value',
            datasourceUrl: '/rest/managedAttributes',
            httpMethod: 'GET',
            emptyText: '#{msgs.lcm_request_entitlements_select_value}',
            tpl: new Ext.XTemplate(
                    '<tpl for=".">',
                        '<div class="x-boundlist-item">',
                                '<div class="sectionHeader">{displayValue}</div>',
                                '<div class="indentedColumn">{[(values.description) ? values.description: ""]}</div>',
                        '</div>',
                    '</tpl>')
        });

        // Super initializes the store.  We need this before setting parameters
        // that change the extraParams.
        this.callParent(arguments);

        this.setApplicationName(config.applicationName);
        this.setInstance(config.instance);
        this.setAttribute(config.attribute);
        this.setType(config.type);
        this.setRequestable(config.requestable);
    },


    setApplicationName: function(applicationName) {
        this.applicationName = applicationName;
        this.setExtraParam('purview', applicationName); // TODO: Bug #12739 change purview to appId.
    },

    setInstance: function(instance) {
        this.instance = instance;
        this.setExtraParam('instance', instance);
    },

    setAttribute: function(attribute) {
        this.attribute = attribute;
        this.setExtraParam('attribute', attribute);
    },

    setType: function(type) {
        this.type = type;
        this.setExtraParam('type', type);
    },

    setRequestable: function(requestable) {
        this.requestable = requestable;
        this.setExtraParam('requestable', requestable);
    },

    setExcludedTypes: function(excludedTypes) {
        this.excludedTypes = excludedTypes;
        this.setExtraParam('excludedTypes', excludedTypes);
    },
    
    /**
     * @private
     */
    setExtraParam: function(paramName, value) {
        if (null != value) {
            this.store.getProxy().extraParams[paramName] = value;
        }
        else {
            delete this.store.getProxy().extraParams[paramName];
        }
    }
});
