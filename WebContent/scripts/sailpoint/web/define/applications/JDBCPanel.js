/**
 * @class
 * @extends Ext.panel.Panel
 * 
 * This is a component that adds panels for each div section in the JDBCAttributesInclude.xhtml.
 */
Ext.define('SailPoint.define.applications.JDBCPanel', {
    extend: 'SailPoint.define.applications.ApplicationObjectPanel',
    listeners: {
        // initialize the toggling checkbox divs
        afterRender: function() {
            var extCmp;
            
            this.togglePartitioning();
            this.togglePermissionQuery();
            this.toggleDeltaAgg();
            this.toggleMerging();
            
            // register this component with the mainPanel, 
            // we do this so mainPanel can iterate through the list of 
            // registered JDBCPanels and validate each one separately 
            extCmp = Ext.getCmp('mainPanel');
            if (extCmp) {
                extCmp.registerPanel(this);
            }
        }
    },

    constructor: function(config) {
        config.items = [];
        
        config.items.push({
            title: '#{msgs.app_tab_settings}',
            contentEl: 'tabSettings_' + config.spNamespace
        },
        {
            title: '#{msgs.app_tab_merging}',
            contentEl: 'tabMerging_' + config.spNamespace,
            listeners: {
                activate: function() {
                    Ext.getCmp('id_indexColumnsMain_' + config.spNamespace).doLayout();
                    Ext.getCmp('id_mergeColumnsMain_' + config.spNamespace).doLayout();
                }
            }
        });
        
        // add iteration partitioning only for accounts
        if ('' === config.spNamespace) {
            config.items.push({
                title: '#{msgs.app_tab_iteration}',
                contentEl: 'tabIteration_' + config.spNamespace
            });
        }
        
        config.items.push(
        {
            title: '#{msgs.app_jdbc_tab_delta}',
            contentEl: 'tabDelta_' + config.spNamespace
        });
        
        this.callParent(arguments);
    },
    
    togglePartitioning: function() {
        this.toggleFactory('#tabIteration_', '#partitionsRow_', 'partitionMode_');
    },
    
    togglePermissionQuery: function() {
        this.toggleFactory('#tabSettings_', '#getDirectPermObjectSQL_', 'checkBoxPmExecuteQuery_');   
    }, 
    
    toggleDeltaAgg: function() {
        this.toggleFactory('#tabDelta_', '#deltaTable_', 'aggregationMode_');   
        this.toggleFactory('#tabDelta_', '#getDeltaSQL_', 'aggregationMode_');   
    }, 
    
    toggleMerging: function() {
        this.toggleFactory('#tabMerging_', '#indexRowsTable_', 'mergeRows_');
        Ext.getCmp('id_indexColumnsMain_' + this.spNamespace).doLayout();
        Ext.getCmp('id_mergeColumnsMain_' + this.spNamespace).doLayout();
        //Here we have to update the layout again due to the two FacesMultiSuggest objects being re-calculated
        this.updateTabPanelLayout();
        this.updateAttributePanelLayout();
    },

    validate: function() {
        // we only validate the account schema at the moment
        if (this.spNamespace === "") {
            var userName = this.getFieldValue('user_');
            Validator.validateNonBlankString(userName, "The user cannot be null!");
            
            var dburl = this.getFieldValue('url_');
            Validator.validateNonBlankString(dburl, "The url cannot be null!");
            
            var dbdriverClass = this.getFieldValue('driverClass_');
            Validator.validateNonBlankString(dbdriverClass, "The driverClass cannot be null!");
            
            var dbSQL = this.getFieldValue('SQL_', '#tabSettings_', 'textarea');
            Validator.validateNonBlankString(dbSQL, "The SQL cannot be null!");
    
            // Validate the partition data is non null and that there aren't any lines 
            // in the partition line that evaluate to null.
            var partitioningEnabled = this.getField('partitionMode_', '#tabIteration_', 'input[type="checkbox"]');
            if ( partitioningEnabled && partitioningEnabled.checked == true) {
              var partitions = this.getField('partitions_', '#tabIteration_', 'textarea');                 
              // Split partitions "string" on new lines so we can look for empty
              var lines = (partitions && partitions.value) ? partitions.value.split(/\r\n|\r|\n/g) : [];
              var partitionsNew = '';
              if ( lines ) {
                for ( var i=0; i<lines.length ; i++ ) {
                  var line = lines[i];
                  if ( line && line.length > 0 ) {
                    partitionsNew += line + '\n';                        
                  } 
                }
              }                 
              partitions.value = partitionsNew;
              Validator.validateNonBlankString(partitionsNew, "Partitioning is enabled, but there are no partitions defined. Please define at least one partition or disable partitioning.");
            } 
            
            // Validate the delta table is non null if the delta aggregation is enabled
            var deltaAggEnabled = this.getField('aggregationMode_', '#tabDelta_', 'input[type="checkbox"]');
            if ( deltaAggEnabled && deltaAggEnabled.checked == true) {
              var deltaTable = this.getFieldValue('deltaTab_', '#tabDelta_', 'input[type="text"]');               
              Validator.validateNonBlankString(deltaTable, "Delta Aggregation is enabled, but there is no delta table specified. Please specify the delta table or disable the delta aggregation.");               
            }
        }
    }
        
});