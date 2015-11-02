/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Define',
       'SailPoint.Define.Grid',
       'SailPoint.Define.Grid.Group');

Ext.define('SailPoint.Group.SearchField', {
    extend: 'Ext.app.SearchField',
    alias: 'widget.groupsearchfield',
    onTrigger1Click: function() {
        this.clearValue();
        SailPoint.Define.Grid.Group.accountGroupSearch();
        this.fireEvent('trigger1click', this);
    },
    onTrigger2Click: function() {
        var store = this.getStore();
        var value = this.getValue();

        if (value.length < 1) {
            this.onTrigger1Click();
            return;
        }
                
        SailPoint.Define.Grid.Group.accountGroupSearch();
        this.showClearTrigger();
        this.fireEvent('trigger2click', this);
    }
});


SailPoint.Define.Grid.Group.getAdvancedSearchButton = function(gridName) {
    var filterAction = new Ext.Action({
        text : '#{msgs.advanced_search}',
        scale: 'medium',
        handler : function() {
            Ext.getCmp(gridName + 'FilterForm').toggleCollapse();
        }
    });

    return filterAction;
};

SailPoint.Define.Grid.Group.getImportGroupButton = function(){
    var newGroupAction = new Ext.Action({
        text : '#{msgs.explanation_button_import}',
        scale : 'medium',
        handler : function() {
            var importWindow = Ext.getCmp('importWindow');
            var windowWidth = 500;
            
            // The fileupload tag width isn't consistent across browsers so 
            // we need to accommodate the window width accordingly
            if (Ext.firefoxVersion > 0 || Ext.isIE) {
                windowWidth +=35;
            }
            
            if (Ext.isIE9) {
                windowWidth += 20;
            }

            if (!importWindow) {
                $('editForm').enctype = 'multipart/form-data';
                // IE ignores "enctype" - go figure
                $('editForm').encoding = 'multipart/form-data';
                
                importWindow = Ext.create('Ext.window.Window', {
                    id: 'importWindow',
                    title: '#{msgs.managed_attribute_title_import_entitlements}',
                    height: 525,
                    width: windowWidth,
                    layout: 'fit',
                    modal: true,
                    closeAction: 'hide',
                    autoRender: true,
                    items: [{
                            xtype: 'panel',
                            bodyPadding: 20,
                            bodyCls: 'spBackground',
                            contentEl: 'importDialog',
                            dockedItems: [{
                                xtype: 'toolbar',
                                dock: 'bottom',
                                style : 'background-color:#EEEEEE',
                                layout : {pack : 'center'},
                                ui: 'footer',
                                defaultType : 'button',
                                items: [{ 
                                    xtype: 'button',
                                    text: '#{msgs.explanation_button_import}',
                                    handler: function() {
                                        var fileToImport = $('importDialogForm:entitlementImport').value;
                                        if (!fileToImport || fileToImport == "") {
                                            Ext.Msg.show({
                                                title: '#{msgs.managed_attribute_title_import_entitlements}',
                                                msg: '#{msgs.explanation_import_no_import_file}',
                                                buttons: Ext.Msg.OK,
                                                icon: Ext.Msg.ERROR
                                            });
                                        } else {
                                            $('importDialogForm:importFileBtn').click();                                            
                                        }
                                    }
                                },{
                                    xtype: 'button',
                                    text: '#{msgs.button_cancel}',
                                    cls : 'secondaryBtn',
                                    handler: function(){
                                        Ext.getCmp('importWindow').hide();
                                    }
                                }]
                            }]
                        }
                    ]
                });
            }
            
            importWindow.show();
        },
        tooltip : {
            text : '#{msgs.tooltip_import_group}'
        }
    });

    return newGroupAction;
};


/* 
 * In an ideal world we would have a browser event that would fire when the download completed
 * and we would perform our post-processing activities then.  Unfortunately, our world is far from
 * ideal and no such event exists.  The workaround/hack for this is to set a cookie when the download
 * completes.  Every second we check for the presence of this cookie.  When we find it we know the 
 * download has completed and act appropriately
 */
SailPoint.Define.Grid.Group.checkDownloadComplete = function(exportToken) {
    var exportCompletionIndicator = Ext.util.Cookies.get('MAExportToken');
    if (exportCompletionIndicator == exportToken) {
        Ext.Msg.close();
        Ext.Msg.alert('#{msgs.managed_attribute_title_export_entitlements}', '#{msgs.managed_attribute_exported_entitlements}');
    } else {
        // Need to create a new function every time because IE won't let you do setTimeout in a parameterized manner
        window.setTimeout(function() {
            SailPoint.Define.Grid.Group.checkDownloadComplete(exportToken);
        }, 1000);
    }
}

SailPoint.Define.Grid.Group.getExportGroupButton = function(){
    // Initialize the components in the export form
    var languageStore = SailPoint.Store.createRestStore({
        autoLoad: true,
        url: CONTEXT_PATH + '/rest/localizedAttribute/languageSuggest',
        model: 'LocaleModel'
    });
    
    var appSelector;
            
    var newGroupAction = new Ext.Action({
        text : '#{msgs.explanation_button_export}',
        scale : 'medium',
        handler : function() {
            var exportWindow = Ext.getCmp('exportWindow');
            componentsExist = exportWindow;
            
            if (!exportWindow) {
                // Create ExtJS for the window contents
                
                // Create the window itself
                exportWindow = Ext.create('Ext.window.Window', {
                    id: 'exportWindow',
                    title: '#{msgs.managed_attribute_title_export_entitlements}',
                    height: 600,
                    width: 500,
                    layout: 'fit',
                    modal: true,
                    closeAction: 'hide',
                    autoRender: true,
                    items: [{
                            xtype: 'panel',
                            bodyPadding: 20,
                            bodyCls: 'spBackground',
                            contentEl: 'exportDialog',
                            dockedItems: [{
                                xtype: 'toolbar',
                                dock: 'bottom',
                                style : 'background-color:#EEEEEE',
                                layout : {pack : 'center'},
                                ui: 'footer',
                                defaultType : 'button',
                                items: [{ 
                                    xtype: 'button',
                                    text: '#{msgs.explanation_button_export}',
                                    handler: function() {
                                        $('exportDialogForm:exportFileBtn').click()
                                    }
                                },{
                                    xtype: 'button',
                                    text: '#{msgs.button_cancel}',
                                    cls : 'secondaryBtn',
                                    handler: function(){
                                        Ext.getCmp('exportWindow').hide();
                                    }
                                }]
                            }]
                        }
                    ]
                });
            }
            
            exportWindow.show();

            // Ideally the following would have been done above.  Unfortunately, 
            // creating the multisuggest prior to showing the window causes it to render
            // incorrectly.  
            if (!componentsExist) {
                appSelector = Ext.create('SailPoint.MultiSuggest', {
                    id: 'exportAppSelectorCmp',
                    suggestType: 'application',
                    displayField: 'displayName',
                    inputFieldName: 'exportDialogForm:appsToExport',
                    renderTo: 'exportAppSelector'
                });
                appSelector.toggleSelectAll(true, '#{msgs.all_applications}', true);
                
                Ext.create('Ext.form.field.ComboBox', {
                    renderTo: 'exportTypeCombo',
                    queryMode: 'local',
                    store: new Ext.data.ArrayStore({
                        id: 0,
                        fields: [
                            'typeValue',
                            'typeDisplayName'
                        ],
                        data: [
                           ['properties', '#{msgs.managed_attribute_export_type_properties}'], 
                           ['descriptions', '#{msgs.managed_attribute_export_type_descriptions}']
                        ]
                    }),
                    valueField: 'typeValue',
                    displayField: 'typeDisplayName',
                    triggerAction: 'all',
                    tpl: Ext.create('Ext.XTemplate',
                        '<ul><tpl for=".">',
                          '<li role="option" class="' + Ext.baseCSSPrefix + 'boundlist-item">',
                            '<tpl for="."><div class="baseSearch"><div class="sectionHeader">{typeDisplayName}</div></div></tpl>',
                          '</li>',
                        '</tpl></ul>'
                    ),
                    value: 'properties',
                    width: 300,
                    listeners: {
                        select: function(combo, selections, opts) {
                            var type = selections[0].data['typeValue'];
                            $('exportDialogForm:exportType').value = type;
                            if (type == 'descriptions') {
                                $('descriptionsOptions').style.visibility = 'visible';
                            } else {
                                $('descriptionsOptions').style.visibility = 'hidden';
                            }
                        }
                    }
                });
                
                Ext.create('SailPoint.MultiSuggest', {
                    id: 'exportLanguageSelector',
                    suggest: Ext.create('Ext.form.ComboBox', {
                        queryMode: 'local',
                        valueField: 'value',
                        displayField: 'displayName',
                        width:200,
                        store: languageStore
                    }),
                    displayField: 'displayName',
                    inputFieldName: 'exportDialogForm:languagesToExport',
                    renderTo: 'languageSelector'
                });                                    
            }            
        },
        tooltip : {
            text : '#{msgs.tooltip_export_group}'
        }
    });

    return newGroupAction;
};

SailPoint.Define.Grid.Group.getNewGroupButton = function(){
    return new Ext.Action({
        text : '#{msgs.button_new_group}',
        scale : 'medium',
        cls : 'primaryBtn',
        handler : function() {
            location.replace(SailPoint.getRelativeUrl("/define/groups/editAccountGroup.jsf?forceLoad=true"));
        },
        tooltip : {
            text : '#{msgs.tooltip_new_group}'
        }
    });
};

/**
 * @return true if there are form values set; false otherwise -- used to determine whether or not to have the search expando collapsed on entry
 */
SailPoint.Define.Grid.Group.hasSearchFilter = function() {
    var hasSearchFilter = false;
    hasSearchFilter |= $('acctGroupAttribute') && $('acctGroupAttribute').value && $('acctGroupAttribute').value.length > 0;
    hasSearchFilter |= $('accountGroupOwner') && $('accountGroupOwner').value && $('accountGroupOwner').value.length > 0;
    hasSearchFilter |= $('nativeIdentity') && $('nativeIdentity').value && $('nativeIdentity').value.length > 0;
    hasSearchFilter |= $('accountGroupApplication') && $('accountGroupApplication').value && $('accountGroupApplication').value.length > 0;
    hasSearchFilter |= $('editForm:accountGroupTarget') && $('editForm:accountGroupTarget').value && $('editForm:accountGroupTarget').value.length > 0;
    hasSearchFilter |= $('editForm:accountGroupRights') && $('editForm:accountGroupRights').value && $('editForm:accountGroupRights').value.length > 0;
    hasSearchFilter |= $('editForm:accountGroupAnnotation') && $('editForm:accountGroupAnnotation').value && $('editForm:accountGroupAnnotation').value.length > 0;
    hasSearchFilter |= $('accountGroupTypeFilter') && $('accountGroupTypeFilter').value && $('accountGroupTypeFilter').value.length > 0;
    
    return hasSearchFilter;
}

SailPoint.Define.Grid.Group.accountGroupSearch = function(pageToLoad) {
    
    var grid = Ext.getCmp('acctGroupsGrid');
    var proxy = grid.getStore().getProxy();
    proxy.extraParams = {};
    
    if ($('editForm:searchFieldVal')) {
        $('editForm:searchFieldVal').value = Ext.getCmp('acctGroupsSearchField').getValue();
    }
    
    //editForm:accountGroupName
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'attribute', Ext.getCmp('acctGroupAttributeSuggestCmp'));

    //accountGroupOwnerSuggest
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'owner.id', Ext.getCmp('accountGroupOwnerSuggest'));

    //nativeIdentitySuggestCmp
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'native.id', Ext.getCmp('nativeIdentitySuggestCmp'));

    //accountGroupApplicationSuggestCmp
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'application', Ext.getCmp('accountGroupApplicationSuggestCmp'));

    //editForm:accountGroupTarget
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'target', Ext.fly('editForm:accountGroupTarget'));

    //editForm:accountGroupRights
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'rights', Ext.fly('editForm:accountGroupRights'));

    //editForm:accountGroupAnnotation
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'annotation', Ext.fly('editForm:accountGroupAnnotation'));

    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'type', Ext.getCmp('typeFilterCombo'));
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'items', Ext.getCmp('acctGroupsSearchField'));

    // Add any extended attributes to the query
    var suggestFields = Ext.DomQuery.select('div[id$=Suggest]');
    for (i = 0; i < suggestFields.length; ++i) {
        var s = Ext.getCmp(suggestFields[i].id + "Cmp");
        if(s && s.getId().indexOf("ManagedAttribute_") > -1){
            var id = suggestFields[i].id;
            id = id.substring(0, id.length - 7);
            id = Ext.fly(id + "Nbr");
            if(id && id.dom.innerHTML) {
                // prefix key with AccountGroupSearchBean.ATT_IDT_SEARCH_MA_PREFIX
                SailPoint.Define.Grid.Group.setProxyParam(proxy, "ManagedAttribute." + id.dom.innerHTML, s);
            }
        }
    }
    var booleanFields = Ext.DomQuery.select('select[id*=Form\:extended]');
    for (i = 0; i < booleanFields.length; ++i) {
        var b = Ext.get(booleanFields[i]);
        if(b) {
            // prefix key with AccountGroupSearchBean.ATT_IDT_SEARCH_MA_PREFIX
            SailPoint.Define.Grid.Group.setProxyParam(proxy, "ManagedAttribute." + booleanFields[i].nextSibling.nextSibling.innerHTML, b);
        }
    }

    if (pageToLoad) {
        grid.getStore().loadPage(pageToLoad);        
    } else {
        grid.getStore().loadPage(1);
    }
};

SailPoint.Define.Grid.Group.setProxyParam = function(p, key, comp) {
    if(comp && comp.getValue() && comp.getValue() !== "") {
        p.extraParams[key] = comp.getValue();
    }
};

SailPoint.Define.Grid.Group.accountGroupSearchReset = function() {
    var grid = Ext.getCmp('acctGroupsGrid');
    var proxy = grid.getStore().getProxy();
    var tmpObj;

    SailPoint.Analyze.clearExtendedAttributeFields(null);

    tmpObj = Ext.getCmp('acctGroupAttributeSuggestCmp');
    if(tmpObj) {
        tmpObj.setDisabled(true);
    }

    tmpObj = Ext.getCmp('accountGroupOwnerSuggest');
    if(tmpObj) {
        tmpObj.setValue('');
    }

    tmpObj = Ext.getCmp('nativeIdentitySuggestCmp');
    if(tmpObj) {
        tmpObj.setDisabled(true);
    }

    tmpObj = Ext.getCmp('typeFilterCombo');
    if (tmpObj) {
        SailPoint.Analyze.AccountGroup.updateTypeSuggest('');
    }
    
    proxy.extraParams = {};
    proxy.extraParams['type'] = '';

    tmpObj = Ext.fly('editForm:clearSearchBtn');
    if (tmpObj) {
        tmpObj.dom.click();
    }
    else {
        Ext.getCmp('acctGroupsSearchField').onTrigger1Click();        
    }
};

SailPoint.Define.Grid.Group.createSearchForm = function(grid, gWidth) {
    var config = {
        xtype : 'panel',
        id : grid.id + 'FilterForm',
        stateId : grid.id + 'FilterForm',
        stateful : true,
        region : 'north',
        frame : false,
        collapsed : !SailPoint.Define.Grid.Group.hasSearchFilter(),
        header: false,
        placeholder: {
            xtype: 'container',
            padding: 0,
            height: 0,
            border: 0
        },
        width : gWidth,
        bodyStyle : 'padding:8px; background-color:#EEEEEE;',
        bodyCls: 'x-panel-body-plain',
        style : 'background-color:#EEEEEE',
        defaults: { // defaults are applied to items, not this container
            bodyBorder : false,
            border : false,
            cls : 'searchPanelField' // defined in sp-components.css
        },
        cls : 'x-panel-no-border',
        html : Ext.fly('accountGroupAttributesDiv').dom.innerHTML, //set search panel to included entitlementsCatalogAttributes.xhtml
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'bottom',
            style : 'background-color:#EEEEEE',
            layout : {pack : 'end'},
            ui: 'footer',
            defaultType : 'button',
            cls : 'searchPanelToolbar', // defined in sp-components.css
            items: [{
                text : '#{msgs.button_filter}',
                handler : function() {
                    Ext.fly('editForm:saveQueryBtn').dom.click();
                }
            },{
                text : '#{msgs.button_reset}',
                cls : 'secondaryBtn', // adjusts padding
                handler : function() {
                    SailPoint.Define.Grid.Group.accountGroupSearchReset();
                }
            }]
        }]
    };
    /* Bug #21023: limit height of search panel when viewable area is below supported resolution. */
    if(SailPoint.getBrowserViewArea().height <= SailPoint.minSupportedHeight) {
        config.maxHeight = 150;
        config.bodyStyle += 'overflow-y:scroll;';
    }
    return config;
};

SailPoint.Define.Grid.Group.createAcctGrid = function(options) {
    /* @cfg {Array} array of fields that will be included in the grid */
    var fields = options.fields;
    /* @cfg {Array} array of column configs corresponding to the fields in the grid */
    var columns = options.columns;
    /* @cfg {String} the grid state */
    var gridStateStr = options.gridStateStr;
    /* @cfg {Number} the page size for the grid */
    var pageSize = options.pageSize;
    /* @cfg {String} the grid's identifier */
    var stateId = options.stateId;
    /* @cfg {Number} the grid's width */
    var gridWidth = options.gridWidth;
    /* @cfg {Boolean} true to enable the creation of new account groups from the grid; false otherwise */
    var enableNewAccountGroups = options.enableNewAccountGroups;
    
    var dataSource = options.isEntitlementCatalog ? CONTEXT_PATH + '/define/groups/entitlementCatalogDataSource.json' : CONTEXT_PATH + '/define/groups/accountGroupsDataSource.json';
    
    var acctGroupsStore = SailPoint.Store.createStore({
        autoLoad : false,
        url : dataSource,
        root : 'objects',
        totalProperty: 'count',
        fields : fields,
        remoteSort : true,
        pageSize : pageSize,
        method : 'POST'
    });

    var gridName = 'acctGroupsGrid';

    var gridConfig = {
        xtype : 'paginggrid',
        id : gridName,
        store : acctGroupsStore,
        cls : 'selectableGrid',
        title : '#{msgs.account_groups}',
        columns : columns,
        region: 'center',
        gridStateStr : gridStateStr,
        stateId : stateId,
        stateful : true,
        border: false,
        loadMask : true,
        header: !options.isEntitlementCatalog,
        viewConfig : {
            stripeRows : true,
            scrollOffset : 0
        },
        height: 600,
        listeners : {
            itemclick : SailPoint.Define.Grid.Group.clickRow,
            itemcontextmenu : SailPoint.Define.Grid.Group.showContextMenu
        }
    };

    var searchButton = SailPoint.Define.Grid.Group.getAdvancedSearchButton(gridName);
    var searchFormConfig = SailPoint.Define.Grid.Group.createSearchForm(gridConfig);

    // Note:  The search form is populated with the contents of the accountGroupAttributesDiv below.
    var searchFieldConfig = {
        xtype : 'groupsearchfield',
        id : 'acctGroupsSearchField',
        store : acctGroupsStore,
        paramName : 'items',
        emptyText : '#{msgs.label_filter_entitlements}',
        width : 250,
        dock: 'top',
        value: $('editForm:searchFieldVal') ? $('editForm:searchFieldVal').value : '',
        storeLimit : pageSize
    };
        
    var toolbar = [
        searchFieldConfig,
        ' ',
        searchButton,
        {xtype: 'tbfill'}, ' ',
        SailPoint.Define.Grid.Group.getImportGroupButton(), ' ',
        SailPoint.Define.Grid.Group.getExportGroupButton()
    ];
    
    if (enableNewAccountGroups) {
        toolbar.push(' ');
        toolbar.push(SailPoint.Define.Grid.Group.getNewGroupButton());        
    }

    if (!options.isEntitlementCatalog) {
        SailPoint.Define.Grid.Group.accountGroupSearch();
    } // Otherwise we'll defer loading this until the attributes have been loaded

    //Clear out original search div to avoid duplicate ids.
    Ext.fly('accountGroupAttributesDiv').dom.innerHTML = "";

    return {
        xtype: 'panel',
        tbar: toolbar,
        layout: 'border',
        items: [searchFormConfig, gridConfig]
    };
};
