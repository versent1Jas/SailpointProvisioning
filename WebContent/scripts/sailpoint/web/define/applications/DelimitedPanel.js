/**
 * @class
 * @extends Ext.panel.Panel
 * 
 * This is a component that adds panels for each div section in the delimitedAttributesInclude.xhtml.
 */
Ext.define('SailPoint.define.applications.DelimitedPanel', {
    parseType: null,
    paritionType: null,
    transportType: null,
    extend: 'SailPoint.define.applications.ApplicationObjectPanel',
    listeners: {
        // initialize the toggling checkbox divs
        afterRender: function() {
            var extCmp;
            
            // register this component with the mainPanel,
            // we do this so mainPanel can iterate through the list of 
            // registered DelimitedPanels and validate each one separately
            extCmp = Ext.getCmp('mainPanel');
            if (extCmp) {
                extCmp.registerPanel(this);
            }
            
            // only set these for account, default these values if not already set
            if ('' === this.spNamespace) {
                // currently the connector does not set this value, default to delimited
                if (this.parseType === '') {
                    this.getFields('parseType_', '#sectionParsing_', 'input[type="radio"]')[0].checked = 'checked';
                }
            }
            this.toggleParsing();
            this.togglePartitioning();
            this.toggleTransport();
            
        }
    },
    
    constructor: function(config) {
        config.items = [];
        
        config.items.push({
            title: '#{msgs.app_tab_file}',
            contentEl: 'tabFile_' + config.spNamespace
        },{
            title: '#{msgs.app_tab_filtering}',
            contentEl: 'tabFiltering_' + config.spNamespace
        },{
            title: '#{msgs.app_tab_merging}',
            contentEl: 'tabMerging_' + config.spNamespace
        });

        // add iteration partitioning only for accounts
        if ('' === config.spNamespace) {
            config.items.push({
                title: '#{msgs.app_tab_iteration}',
                contentEl: 'tabIteration_' + config.spNamespace
            });
        }

        this.callParent(arguments);
    },

    toggleParsing: function() {
        var showHideArrayMap = [{
            show: ['#delimited_', '#sectionDelimitedBoolean_'],
            hide: ['#regexps_']
            },
            {
                show: ['#regexps_'],
                hide: ['#delimited_', '#sectionDelimitedBoolean_']
            }],
            mainPanel;
        this.toggleRadio('#sectionParsing_', showHideArrayMap, 'parseType_');
        
        // toggle the rest of the objects as well, only do this for the account object type
        if ('' === this.spNamespace) {
            mainPanel = Ext.getCmp('mainPanel');
            Ext.each(mainPanel.panels, function(item, index, allItems) {
                item.toggleRadio('#sectionParsing_', showHideArrayMap, 'parseType_');
            }, this);
        }

    },

    togglePartitioning: function() {
        var showHideArrayMap = [{
            show: [],
            hide: ['#partitionSizeConfig_']
            },
            {
                show: ['#partitionSizeConfig_'],
                hide: []
            }];
        this.toggleRadio('#sectionPartitioning_', showHideArrayMap, 'partitionOption_');
    },

    toggleTransport: function() {
        var showHideArrayMap = [{
            show: [],
            hide: ['#transportCredentials_']
            },
            {
                show: ['#transportCredentials_'],
                hide: []
            },
            {
                show: ['#transportCredentials_'],
                hide: []
            }];
        this.toggleRadio('#sectionTransport_', showHideArrayMap, 'transport_');
        
        // need to update layout on configuration settings tab when showing additional host,user,password fields
        Ext.getCmp('appTab').down('#detailsContent').updateLayout();
    }
});