/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.Search', 'SailPoint.Identity', 'SailPoint.Identity.Search');

/**
 * Gets a grid object given a config with the following options:
 * name
 * url
 * pageSize
 * optionsPlugin
 */
SailPoint.Search.getResultsGrid = function(config) {
    var resultsWrapper;
    var numberOfResultsDisplay;
    var gridId = config.id;
    var gridStateId = (config.stateId) ? config.stateId : config.id;
    var gridState = SailPoint.GridState.getGridState(gridStateId);
        
    var resultsGrid = Ext.getCmp(gridId);
    var currentPage = 1;
    var start = 0;
    var optionsPlugin = config.optionsPlugin;
    
    var searchType = config.type;
    var withCheckboxes = config.withCheckboxes;
    var resultsStore;
    
    if (!config.handleClick) {
        config.handleClick = SailPoint.Search.defaultHandleClick;
    }
    
    if (!config.contextMenu) {
        config.contextMenu = SailPoint.Search.defaultContextMenu;
    }
    
    var selectionModel = new Ext.selection.RowModel();
    if (withCheckboxes) {
        selectionModel = new SailPoint.grid.CheckboxSelectionModel( {selectMessageBox: $(searchType + 'selectedCount')});
    }
    
    if (!resultsGrid) {
        var sInfo = [{ property: 'name', direction: 'ASC' }];
        
        if(gridState && gridState._getValue('sortColumn')){
            sInfo = [{property: gridState._getValue('sortColumn'), direction: gridState._getValue('sortOrder') }];

            // if config.sorters has a secondary sort, append that to the selected column sort from gridState
            if (Ext.isArray(config.sorters) && config.sorters.length > 1) {
                sInfo.push(config.sorters[1]);
            }
        }
        else if (Ext.isArray(config.sorters) && config.sorters.length > 0) {
            sInfo = config.sorters;
        }

        // start and currentPage are important when a user returns to the grid
        // after clicking on a grid item.
        if(gridState && gridState.firstRow) {
            start = gridState.firstRow;
        }
        
        if(gridState && gridState.firstRow && gridState.pageSize && (gridState.pageSize > 0)) {
            currentPage = (gridState.firstRow / gridState.pageSize) + 1;
        }
        
        var pageSize;
        if(gridState && gridState.pageSize) {
            pageSize = gridState.pageSize;
        }
        
        if (!pageSize || pageSize.length === 0) {
            pageSize = SailPoint.Analyze.defaultResultsPageSize;
        }

        var store = SailPoint.Store.createStore({
            fields : ['id', 'name'],
            url: config.url,
            remoteSort: true,
            sorters: sInfo,
            pageSize: pageSize,
            currentPage: currentPage,
            extraParams: {'start' : start}
        });

        store.on('metachange', function(changedStore, newMetaData) {
            var i, tmpCC,
            grid = Ext.getCmp(gridId),
            columnConfig = newMetaData.columnConfig,
            sorters = [{property: 'name', direction: 'ASC'}];

            if(newMetaData.sorters) {
                sorters = Ext.JSON.decode(newMetaData.sorters);
            }
            else if(newMetaData.sortColumn) {
                sorters = [{property: newMetaData.sortColumn, direction: newMetaData.sortDirection}];
            }

            // if config.sorters has a secondary sort, append that to the selected column sort from newMetaData
            if (Ext.isArray(config.sorters) && config.sorters.length > 1) {
                sorters.push(config.sorters[1]);
            }

            changedStore.sorters.addAll(sorters);
            
            // Default empty renderers to htmlEncode
            for (i = 0; i < columnConfig.length; ++i) {
                if (!columnConfig[i].renderer) {
                    columnConfig[i].renderer = SailPoint.Utils.htmlEncode;
                }
                // Convert to function if we have a string name
                else if(Ext.isString(columnConfig[i].renderer) && columnConfig[i].renderer.length > 0) {
                    try {
                        columnConfig[i].renderer = SailPoint.evaluteFunctionByName(columnConfig[i].renderer, window);
                    }
                    catch(e) {
                        SailPoint.EXCEPTION_ALERT('searchResultsGrid.js - Could not evaluate renderer:' + columnConfig[i].renderer);
                    }
                }
            }
            
            // flex the remaining width-less columns equally
            columnConfig.each(function(col) {
              if (!col.width) {
                    col.flex = 1;
                }
            });

            // Put the 'name' column back on the left side for old times sake.
            for(i = 0; i < columnConfig.length; i++) {
                if(columnConfig[i].dataIndex === "name" || columnConfig[i].dataIndex === "shortName") {
                    tmpCC = columnConfig.splice(i, 1)[0];
                    break;
                }
            }
            if(tmpCC) {
                columnConfig.unshift(tmpCC);
            }

            if(grid) {
                grid.reconfigure(changedStore, columnConfig);
            }
        });
        
        // create the grid
        var gridConfig = {
            id: gridId,
            stateful: config.stateful,
            stateId: ((config.stateId) ? config.stateId : config.id),
            gridState: gridState,
            cls: 'smallFontGrid selectableGrid',
            store: store,
            region: 'center',
            viewConfig: {
              stripeRows:true
            },            
            usePageSizePlugin: true,
            pageSize: pageSize,
            columns : [{header: 'name', dataIndex: 'name', sortable: true}],
            selModel: selectionModel,
            listeners: { 
                itemclick: config.handleClick, 
                itemcontextmenu: config.contextMenu
            },
            tbar: new Ext.Toolbar({
                plugins: [optionsPlugin]
            }),
            usePageSizePlugin : true
        };
        
        if (withCheckboxes) {
            resultsGrid = new SailPoint.grid.PagingCheckboxGrid(gridConfig);
            resultsGrid.getSelectedIds = function() {
                return selectionModel.getSelectedIds();
            }
        } else {
            resultsGrid = new SailPoint.grid.PagingGrid(gridConfig);
        }
        
        resultsGrid.isRefresh = true;
        if (gridState) {
            resultsGrid.gridState = gridState;
        } else {
            resultsGrid.gridState = new SailPoint.GridState({
                name: gridId,
                gridStateObj: ''
            });
        }
        
        // this removes any start params that got set when the grid was first
        // constructed.  A non-zero start means the user is coming back to the 
        // grid after clicking on a grid item.  We only want to keep that start
        // value for the initial load.
        resultsGrid.on('sortchange', function() {
            var proxy = resultsGrid.getStore().getProxy();
            if (proxy.extraParams)
                proxy.extraParams = {};
        }, resultsGrid);
    }
    
    numberOfResultsDisplay = new SailPoint.Search.NumberOfResultsPanel({
        id: gridId + 'ResultsMessagePanel',
        region: 'north',
        height: 50
    });

    resultsStore = resultsGrid.getStore();
    resultsStore.on('load', function() {
        numberOfResultsDisplay.setNumberOfResults(resultsStore.getTotalCount());
    });


    resultsWrapper = Ext.create('Ext.panel.Panel', {
        id: gridId + 'Wrapper',
        layout: 'border',
        items: [numberOfResultsDisplay, resultsGrid]
    });
    
    // Hack the freaking toolbars because they don't render properly when the 
    // grid is not a 'top-level' tab panel
    resultsWrapper.on('resize', function() {
        SailPoint.Analyze.fixTheToolbar(resultsGrid.getTopToolbar());
        SailPoint.Analyze.fixTheToolbar(resultsGrid.getBottomToolbar());
    });
    
    
    if (Ext.isIE) {
    	resultsWrapper.on('afterlayout', function() {
    		var height = numberOfResultsDisplay.getHeight();
    		if (height <= 0) {
    			numberOfResultsDisplay.setHeight(50);
                numberOfResultsDisplay.doLayout();
                resultsGrid.doLayout();
                resultsGrid.getView().refresh(true);
    		}
    	});
    }
    
    return resultsWrapper;
};

Ext.define('SailPoint.Search.NumberOfResultsPanel', {
	extend : 'Ext.panel.Panel',
    constructor: function(config) {
        this.messageId = config.id + 'ResultsMessage';
        config.html = '<div id="' + this.messageId + '" class="spBackground"/>';
        this.callParent(arguments);
    },
    messageTemplate: new Ext.XTemplate(
        '<div id="{messageId}Content" class="spContent">',
          '<div id="{messageId}AdditionalMsg" style="padding:4px;display:none"></div>',
          '<div class="spContentTitle">',
            '#{msgs.search_results_returned_template}',
          '</div>',
        '</div>'
    ),
    setNumberOfResults: function(numberOfResults) {
        var height;
        var resultsGrid;
        var searchInputs;
        var i;
        
        this.messageTemplate.overwrite(Ext.get(this.messageId), {
            numberOfResults: numberOfResults,
            messageId: this.messageId
        });
        
        if (Ext.isIE) {
            // This hack prevents IE from displaying the background in places it shouldn't.
            // The other browsers render the background just fine without any help. --Bernie
        	Ext.get(this.messageId).setOpacity(1);
        	Ext.get(this.messageId + 'Content').setOpacity(1);
            // This hack prevents IE from displaying a blinking cursor in places it shouldn't.
            // The other browsers know not to show a cursor for an input that's not being displayed --Bernie
        	searchInputs = Ext.DomQuery.select('input[class*=searchInputText]', $('roleAttributes'));
        	for (i = 0; i < searchInputs.length; ++i) {
        	    searchInputs[i].blur();
        	}
        }
        height = 63;
        this.setHeight(height);
        this.ownerCt.doLayout();
    },
    
    displayMessage: function(messageDOMElement) {
        var height;
        var resultsGrid;
        var messageSection = Ext.get(this.messageId + 'AdditionalMsg');
        messageSection.update(messageDOMElement.innerHTML);
        messageSection.setVisibilityMode(Ext.Element.DISPLAY);
        messageSection.setVisible(true);
        height = 110;
        this.setHeight(height);
        this.ownerCt.doLayout();
    }
});

Ext.define('SailPoint.Search.SearchOptionsPlugin', {
	extend : 'Ext.util.Observable',
	alias : 'plugin.searchOptionsPlugin',
	
    constructor: function(config) {
        config = config || {};
        this.searchType = config.searchType;
        this.options = config.options;
        this.cardPanelId = config.cardPanelId;
        this.searchPanelId = config.searchPanelId;
        this.scheduleCertGridId = config.scheduleCertGridId;
        this.applySearchPanelStyles = config.applySearchPanelStyles;
        this.checkboxGridId = config.checkboxGridId;
        this.callParent(arguments);
    },
    
    init: function(toolbar) {
        this.toolbar = toolbar;
        toolbar.on('render', this.onRender, this);
    },
    
    onRender: function() {
        var searchType = this.searchType;
        
        if (this.options) {
            this.searchOptions = Ext.ComponentMgr.create(Ext.applyIf(this.comboCfg||{}, {
                store:new Ext.data.ArrayStore({
                    fields:['searchOption', 'searchDisplayValue'],
                    data: this.options
                }),
                displayField:'searchDisplayValue',
                valueField:'searchOption',
                emptyText: '#{msgs.label_result_options}',
                queryMode:'local',
                triggerAction:'all',
                width: 200,
                xtype:'combo'
            }));
            this.searchOptions.on('select', this.saveSearch, this);
    
            this.toolbar.add(this.searchOptions);

            this.toolbar.add(new Ext.toolbar.Spacer());
        }
        
        this.toolbar.add(new Ext.Button({
            text: '#{msgs.button_refine_search}',
            handler: this.returnToSearchPanel,
            cardPanelId: this.cardPanelId,
            searchPanelId: this.searchPanelId,
            applySearchPanelStyles: this.applySearchPanelStyles,
            checkboxGridId: this.checkboxGridId
        }));
        this.toolbar.add(new Ext.toolbar.Spacer());
        
        if (this.scheduleCertGridId) {
            var scheduleCertGridId = this.scheduleCertGridId;
            var searchType = this.searchType;
            this.toolbar.add(new Ext.Button({
                text: '#{msgs.button_schedule_cert}',
                handler: function() {
                    var scheduleCertGrid = Ext.getCmp(scheduleCertGridId);
                    var type;
                    var isAdvanced = false;
                    if (searchType == 'Identity') {
                        type = 'Identity';
                    }
                    else {
                        type = 'AdvancedIdentity';
                        isAdvanced = true;
                    }
                    
                    $('identityResultForm:searchType').value = type;
                    SailPoint.Identity.Search.scheduleCertification(scheduleCertGrid, isAdvanced);
                }
            }));
            this.toolbar.add(new Ext.toolbar.Spacer());
        }
        
        this.toolbar.add(new Ext.toolbar.Fill());
        
        // only the syslog tab doesn't export to PDF - doesn't make sense
        // for the kind of data contained in syslog events, esp stacktrace
        if (searchType != 'Syslog') {
            this.toolbar.add(new Ext.button.Button({
                iconCls: 'pdfIcon',
                handler: function() {
                    $('searchSaveForm:searchType').value = searchType;
                    SailPoint.Analyze.exportReport('pdf');
                }
            }));
        }
    
        this.toolbar.add(new Ext.button.Button({
            iconCls: 'csvIcon',
            handler: function() {
                $('searchSaveForm:searchType').value = searchType;
                SailPoint.Analyze.exportReport('csv');
            }
        }));

        // HP ArcSight Integration - IdentityIQ CEF data feed
        if (searchType == 'Identity' || searchType == 'Audit' || searchType == 'Syslog' || searchType == 'Link') {
            this.toolbar.add(new Ext.button.Button({
                iconCls: 'cefIcon',
                handler: function() {
                    $('searchSaveForm:searchType').value = searchType;
                    SailPoint.Analyze.exportReport('cef');
                }
            }));
        }
    },

    
    returnToSearchPanel: function() {
    	SailPoint.Search.clearForRefineSearch(this.checkboxGridId);
    	
    	var cardPanel = Ext.getCmp(this.initialConfig.cardPanelId);
    	cardPanel.getLayout().setActiveItem(this.initialConfig.searchPanelId);

    	// We're not keeping track of the card panel anymore
//  	if ($('stateForm')) {
//  	$('stateForm:currentCardPanel').value = this.initialConfig.searchPanelId;
//  	$('stateForm:updatePanelStateBtn').click();
//  	}
    	if (this.applySearchPanelStyles) {
    		this.applySearchPanelStyles();
    	}
    },
    
    saveSearch: function (saveOption, forced) {
        var selValue = saveOption.getValue();
        var formName = 'searchSaveForm';
        $(formName + ':searchType').value = this.searchType;
        if ( selValue == 'saveOrUpdate' ) {
            SailPoint.Analyze.saveQuery($(formName + ':rememberQuery'), '#{msgs.save_search}', 'search_lcase');
        } else if ( selValue == 'saveAsReport' ) {
            SailPoint.Analyze.saveQuery($(formName + ':saveQueryAsReport'), '#{msgs.save_search_as_report}', 'report_lcase');
        } else if ( selValue == 'saveAsPopulation' ) {
            SailPoint.Analyze.saveQuery($(formName + ':saveQueryAsIpop'), '#{msgs.save_identities_as_population}', 'population_lcase');
        } else if ( selValue == 'showEntitlements' ) {
            // This one is specific to identities, so we defer to the identity search panel
            SailPoint.Identity.Search.preShowEntitlements(this.searchType, formName);
        } else if ( selValue == 'saveAsIdentity' ) {
            SailPoint.Analyze.saveQuery($(formName + ':rememberQueryAsIdentity'), '#{msgs.save_search_as_identity_search}', 'search_lcase');
        }
        saveOption.setValue('');
    }
});

SailPoint.Search.getOptionsPlugin = function(config) {
    var optionsPlugin = new SailPoint.Search.SearchOptionsPlugin(config);
    return optionsPlugin;
};

SailPoint.Search.handleClick = function(grid, rowIndex, columnIndex, e) {
    var pos = gridView.getSelectionModel().getCurrentPosition();
    //TODO extjs4: verify this is using cellselction model
    var col = gridView.getHeaderCt().getHeaderAtIndex(pos.column).dataIndex;
    gridView.gridState._setValue('pageSize', grid.pageSize);
    if(col) {
        $('resultsForm:currentObjectId').value = record.getId();
        $('resultsForm:editButton').click();
    } else {
        e.stopEvent();
    }
};

SailPoint.Search.defaultContextMenu = function(view, record, item, index, e, eOpts) {
    e.stopEvent();
};

SailPoint.Search.defaultHandleClick = function(view, record, item, index, e, eOpts) {
    e.stopEvent();
};

SailPoint.Search.clearForRefineSearch = function(checkboxGridId) {
	//clear any messages that are leftover from previous search
	var msgsUlList = Ext.query('#spErrorMsgsDiv ul');
	if (msgsUlList && msgsUlList.size() > 0) {
		var msgsUl = msgsUlList.first();
		msgsUl.innerHTML="";
		Ext.getCmp('spViewport').doLayout();
	}
	
	//deselect any checkboxes
	if (checkboxGridId) {
		var checkboxGrid = Ext.getCmp(checkboxGridId);
		if (checkboxGrid) {
			checkboxGrid.getSelectionModel().deselectAll();
		}
	}
};
