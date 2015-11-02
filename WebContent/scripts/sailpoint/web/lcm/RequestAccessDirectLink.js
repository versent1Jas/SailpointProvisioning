Ext.ns('SailPoint.LCM.RequestAccess');

/**    Auto-populate the filters and display filtered set of roles and entitlements. 
 *    The requestAccessList store is first set. Then few of the required filter component like 
 *    Role, Keyword, Entitlement, and Identity are set to their respective values (cosmetic UI changes).
 *
 **/

SailPoint.LCM.RequestAccess.initDirectLink = function() {
    // gets all the deepFilters map keys
    var keys = Object.keys(deepFilters);
    if (keys.length > 0) {
        for (var i = 0; i < keys.length; i++) {
            // setting the store for all provided filters
            requestAccessList.store.proxy.extraParams[keys[i]] = deepFilters[keys[i]];
        }
        // Role Filter value is set and narrow results panel is expanded in afterRender event
        // there is no need to set the activeTab, as Role tab is set by default
        if (filterFlags['roleFilter']) {
            Ext.getCmp('q_type').setValue(deepFilters['q_type']);
            var roleFilterCmp = Ext.getCmp('roleFilterForm');
            roleFilterCmp.on('afterrender', function (roleFilterCmp){
                roleFilterCmp.toggleCollapse();
            });
            // setting keyword search filter
        } else if (filterFlags['keywordSearch']) {
            Ext.getCmp('searchField').setValue(deepFilters['query']);
            // toggling to the Entitlement from Role tab using the set activeTab 
            // then collapsing the narrow result inside the beforerender event 
        } else if (filterFlags['entitlementFilter'] ) {
            var requestListConfig = Ext.getCmp('requestAccessList');
            requestListConfig.on('beforerender', function (requestListConfig) {
                requestListConfig.setActiveTab('entitlementPanel');
            });
            var entFilterCmp = Ext.getCmp('entitlementFilterForm');
            entFilterCmp.on('afterrender', function (entFilterCmp){
                entFilterCmp.toggleCollapse();
            });
            if (filterApplicationJsonData) {
                var appMultiSuggest = Ext.getCmp('applicationMultiSuggest');
                appMultiSuggest.on('afterrender', function (appMultiSuggest) {
                    appMultiSuggest.setValue(filterApplicationJsonData.objects);
                });
            }
            if (filterEntitlementAttributeJsonData) {
                var attributeMultiSuggest = Ext.getCmp('attributeSelector');
                attributeMultiSuggest.on('afterrender', function (attributeMultiSuggest) {
                    attributeMultiSuggest.setValue(filterEntitlementAttributeJsonData.objects);
                });
            }
            if(deepFilters['value']) {
                var entSugCmp = Ext.getCmp('entitlementSuggest');
                entSugCmp.on('beforerender', function (entSugCmp){
                    entSugCmp.setValue(deepFilters['value']);
                });
            }
        } else if (filterFlags['searchByIdentity']) {
            var searchByIdnty = Ext.getCmp('fltrIdentityPanel');
            searchByIdnty.on('afterrender', function (searchByIdnty) {
                //Toggling from keywordbased search to userbased search
                SailPoint.LCM.RequestAccess.toggleSearch(document.getElementById('userBasedSearchID'));
                searchByIdnty.toggleCollapse();
            });
            // Cosmetic changes for Identity Filter panel
            if (jsonFilterIdentity) {
                var identityMultiSuggest = Ext.getCmp('populationSearchGridExpandoIdentityMultiSuggest');
                identityMultiSuggest.on('afterrender', function (identityMultiSuggest) {
                    identityMultiSuggest.setValue(jsonFilterIdentity.objects);
                });
            }
        } else if (filterFlags['searchByPopulation']) {
            var searchByPop = Ext.getCmp('fltrPopulationPanel');
            searchByPop.on('afterrender', function () {
                // Toggling from keywordbased search to userbased search
                SailPoint.LCM.RequestAccess.toggleSearch(document.getElementById('userBasedSearchID'));
                var extAttrStartWith = "q_Identity.";
                for (var i = 0; i < keys.length; i++) {
                    var strKey = keys[i];
                    var indexVal = strKey.search(extAttrStartWith);
                    if (indexVal === 0) {
                        if (strKey !== 'q_Identity.manager.id') {
                            //the manager key in extraParams is only different in populationfilter
                            // so rather then creating more confusion to create manager id we are addressing it later
                            var fieldIniStr = 'suggest_';
                            var extendedAttribute = strKey.substr(extAttrStartWith.length);
                            var fieldId = fieldIniStr.concat(extendedAttribute);
                            //Need to make the suggest box enable so when the user click the search the value populated
                            //in the suggest box will be loaded in the store
                            Ext.getCmp(fieldId).disabled = false;
                            Ext.getCmp('fltrPopulationPanel').toggleCollapse();
                        } else {
                            Ext.getCmp('suggest_manager').disabled = false;
                            Ext.getCmp('fltrPopulationPanel').toggleCollapse();
                        }
                    }
                }
            });
        }
    }
}

/**
 * creating a Object as per filterEntitlementAttribute suggest data
 */
SailPoint.LCM.RequestAccess.listToSuggestData = function(attributeList) {
    if (attributeList) {
        var objects = [],
            result = {
                count: attributeList.length,
                objects: objects
            }, cnt;

        for (cnt = 0; cnt < attributeList.length; cnt++) {
            objects.push({
                id: attributeList[cnt],
                displayField: attributeList[cnt]
            });
        }
        return result;
    } 
    return null;
}

/**
 * populating the filters
 * This function returns the search field value for the combo box of extended attr
 * The value is searched in deepFilters if set
 */
SailPoint.LCM.RequestAccess.getAttributeSearchValue = function(attr, deepFilterPrefix) {
    var keys = Object.keys(deepFilters);
    var extendedAttribute;
    for (var k = 0; k < keys.length; k++) {
        var strKey = keys[k];
        var indexVal = strKey.search(deepFilterPrefix);
        if (indexVal === 0) {
            extendedAttribute = strKey.substr(deepFilterPrefix.length);
        }
        if (extendedAttribute && extendedAttribute.toUpperCase() === (attr.name).toUpperCase()) {
            return deepFilters[strKey];
        }
    }
    return null;
};
