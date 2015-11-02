/**
 * @class
 * @extends SailPoint.define.applications.ApplicationObjectPanel
 * 
 * This is a component that adds panels for each div section in the SQLLoaderConnectorAttributesInclude.xhtml.
 * It also moves some javascript functions that toggle various UI components to a centralized place.
 */
Ext.define('SailPoint.define.applications.SQLLoaderPanel', {
    extend: 'SailPoint.define.applications.ApplicationObjectPanel',
    listeners: {
        afterRender: function() {
            this.togglePartitioning();
            this.togglePermissionQuery();
            this.toggleMerging();
            
            this.initDefaults();
            
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
        
        this.callParent(arguments);
    },
    
    
    // This is a leftover hack from version 6.3 to change the default
    // URL and Driver values. We are checking the 'mysql' string because
    // that is the default configured in the jdbc connector registry.
    initDefaults: function() {
        
        var currentClass = this.getField('driverClass_', '#tabSettings_' + this.spNamespace, 'input[type="text"]'),
            currentURL = this.getField('url_', '#tabSettings_' + this.spNamespace, 'input[type="text"]'),
            defaultUrl='jdbc:csv:/c:/data?_CSV_Separator=|', 
            defaultDriver='com.hxtt.sql.text.TextDriver';
            
        if((currentClass && currentClass.value.indexOf('mysql') !== -1)){      
            currentClass.value = defaultDriver;
        }
       
        if((currentURL && currentURL.value.indexOf('mysql') !== -1)){
            currentURL.value = defaultUrl;
        }    

    },
    
    togglePartitioning: function() {
        this.toggleFactory('#tabIteration_', '#partitionsRow_', 'partitionMode_');
    },
    
    togglePermissionQuery: function() {
        this.toggleFactory('#tabSettings_', '#getDirectPermObjectSQL_', 'checkBoxPmExecuteQuery_');   
    },
    
    toggleMerging: function() {
        this.toggleFactory('#tabMerging_', '#indexRowsTable_', 'mergeRows_');
        Ext.getCmp('id_indexColumnsMain_' + this.spNamespace).doLayout();
        Ext.getCmp('id_mergeColumnsMain_' + this.spNamespace).doLayout();
        //Here we have to update the layout again due to the two FacesMultiSuggest objects being re-calculated
        this.updateTabPanelLayout();
        this.updateAttributePanelLayout();
    },

    // Dynamically creates a URL based on the path and delimiter fields
    createDBURL: function() {
        var foldervalue = this.getFieldValue('folderPath_', '#tabSettings_' + this.spNamespace),        
            delimiter = this.getFieldValue('delimiterType_', '#tabSettings_' + this.spNamespace),
            urlField = this.getField('url_', '#tabSettings_' + this.spNamespace, 'input[type="text"]');

        if(foldervalue !== null && delimiter !== null && urlField !== null) {
            urlField.value ='jdbc:csv:/'+foldervalue+'?_CSV_Separator='+delimiter;   
        }

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
    
            var folderPath = this.getFieldValue('folderPath_');
            Validator.validateNonBlankString(folderPath, "The Folder Path cannot be null!");
        
            var delimiterType = this.getFieldValue('delimiterType_');
            Validator.validateNonBlankString(delimiterType, "The Delimiter cannot be null!");
    
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
        }
    }
    
});