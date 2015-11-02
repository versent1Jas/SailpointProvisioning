/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Activity', 
       'SailPoint.Activity.Search',
       'SailPoint.Analyze', 
       'SailPoint.Analyze.Activity');

SailPoint.Activity.Search.getActivitySearchPanel = function(config) {
    var activeItem = 'activitySearchContents';
    if (config.activeCard) {
        activeItem = config.activeCard;
    }
    
    var searchContents = Ext.create('Ext.panel.Panel', {
        id: 'activitySearchContents',
        layout: 'fit',
        contentEl: 'activitySearchContentsDiv',
        border: false,
        autoScroll: true,
        bbar: [{
            id: 'preActivitySearchBtn',
            text: '#{msgs.button_run_search}',
            cls : 'primaryBtn',
            handler: function() {
                var searchPanel = Ext.getCmp('activitySearchPanel');
                searchPanel.validationErrors = SailPoint.Analyze.validateSearch('activitySearchForm', 'activity'); 
            }
        }, {
            id: 'activityClearBtn',
            text: '#{msgs.button_clear_search}',
            handler: function() {
                $('activitySearchForm:resetBtn').click()
            }
        }],
        loader: {
            url: SailPoint.getRelativeUrl('/analyze/activity/activitySearchContents.jsf'),
            params: { searchType: 'Activity' },
            discardUrl: false,
            callback: SailPoint.Activity.Search.finishInit,
            nocache: false,
            text: '#{msgs.loading_data}',
            timeout: 30,
            scripts: true
        }
    });

    var resultsContents = SailPoint.Search.getResultsGrid({
        id: 'activitySearchResultsGrid',
        type: 'Activity',
        stateful: true,
        stateId: SailPoint.Analyze.gridStateIds.get('Activity'),
        url: SailPoint.getRelativeUrl('/analyze/activity/activityDataSource.json'),
        handleClick: SailPoint.Activity.Search.handleClick,
        pageSize: SailPoint.Analyze.defaultResultsPageSize,
        optionsPlugin: SailPoint.Search.getOptionsPlugin({
            searchType: 'Activity',
            cardPanelId: 'activitySearchPanel',
            searchPanelId: 'activitySearchContents',
            applySearchPanelStyles: function() {
                resizeTables('activitySearchForm');
                Ext.getCmp('activitySearchContents').doLayout();
                Ext.getCmp('activityDisplayFieldsPanel').doLayout();
            },
            options: [
                ['saveOrUpdate', '#{msgs.save_search}'],
                ['saveAsReport', '#{msgs.save_search_as_report}']
            ]
        })
    });
    
    resultsContents.on('afterlayout', function(contentPanel, layout) {
        SailPoint.Activity.Search.styleResultsGrid();
    });
    
    var searchPanel = Ext.create('Ext.panel.Panel', {
        id: config.id,
        title: config.title,
        headerAsText: false,
        header: false,
        layout: 'card',
        activeItem: activeItem,
        items: [searchContents, resultsContents]
    });
    
    searchPanel.on('activate', function(viewerPanel) {
        if (!searchPanel.isLoaded) {
        	searchContents.getLoader().load();
            
            SailPoint.Activity.Search.initResultsGrid();
            searchPanel.isLoaded = true;
        }
    },{
        single: true,
        scope: this
    });
    
    return searchPanel;
};

SailPoint.Activity.Search.displaySearchResults = function() {
    var searchPanel = Ext.getCmp('activitySearchPanel');
    searchPanel.getLayout().setActiveItem('activitySearchResultsGridWrapper');
    searchPanel.doLayout();
    if (Ext.isGecko) {
    	Ext.getCmp('activitySearchResultsGrid').getView().refresh();
    }
    Ext.MessageBox.hide();
    // We're not keeping track of the card panel anymore
    // $('stateForm:searchType').value = 'Activity';
    // $('stateForm:currentCardPanel').value = 'activitySearchResultsGrid';
    // $('stateForm:updatePanelStateBtn').click();
};

SailPoint.Activity.Search.displaySearchContents = function() {
    var searchPanel = Ext.getCmp('activitySearchPanel');
    searchPanel.getLayout().setActiveItem('activitySearchContents');
    // We're not keeping track of the card panel anymore
    // $('stateForm:searchType').value = 'Activity';
    // $('stateForm:currentCardPanel').value = 'activitySearchContents';
    // $('stateForm:updatePanelStateBtn').click();
};

SailPoint.Activity.Search.initResultsGrid = function() {
    SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/activity/activityDataSource.json'), 'activitySearchResultsGrid', 13, true);
};

SailPoint.Activity.Search.styleResultsGrid = function() {
    var gridPanel = Ext.getCmp('activitySearchResultsGrid');
    if (gridPanel) {
        var referenceDiv = Ext.get('example-grid');
        if (referenceDiv) {
            var gridWidth = referenceDiv.getWidth(true) - 20;
            gridPanel.setWidth(gridWidth);
            gridPanel.getPositionEl().applyStyles({
                'margin-left': '10px',
                'margin-right': '10px',
                'margin-bottom': '10px'
            });
        }    
    }
};

SailPoint.Activity.Search.finishInit = function() {
    SailPoint.Analyze.Activity.initializeAttributes();
    SailPoint.Analyze.SearchDisplayFields.initDisplayFields('activity');
    SailPoint.Activity.Search.styleSearchPanels();
    SailPoint.Utils.styleSelects();
    
    // Cache the stupid tomahawk calendar values so that we can manually reset them later 
    var i = 0;
    var monthOptions = Ext.DomQuery.select('option', 'activitySearchForm:startDate.month');
    var selectedMonth;
    for (i = 0; i < monthOptions.length; ++i) {
        if (monthOptions[i].selected === true) {
            selectedMonth = monthOptions[i].value;
        }
    }
    
    SailPoint.Activity.startDateInit = {
        day: $('activitySearchForm:startDate.day').value,
        month: selectedMonth,
        year: $('activitySearchForm:startDate.year').value
    };

    monthOptions = Ext.DomQuery.select('option', 'activitySearchForm:endDate.month');
    for (i = 0; i < monthOptions.length; ++i) {
        if (monthOptions[i].selected === true) {
            selectedMonth = monthOptions[i].value;
        }
    }

    SailPoint.Activity.endDateInit = {
        day: $('activitySearchForm:endDate.day').value,
        month: selectedMonth,
        year: $('activitySearchForm:endDate.year').value
    };
    
    Ext.MessageBox.hide();
};

SailPoint.Activity.Search.styleSearchPanels = function() {
    resizeTables('activitySearchForm');
    buildTooltips($('activitySearchCriteria'));
    Ext.getCmp('activitySearchContents').doLayout();
};

SailPoint.Activity.Search.styleResultsPanels = function() {}

SailPoint.Activity.Search.clearSearchFields = function() {
    var formName = 'activitySearchForm';
    var appNameMultiSuggest = Ext.getCmp('activityAppNameMultiSuggestCmp');
    var ownerMultiSuggest = Ext.getCmp('ownersMultiSuggest');
    var ipopName = $(formName + ':ipopName');
    
    $(formName + ':dateOrTimePeriodSelection').value = 'timePeriod';
    
    if ($('startDateSelect')) {
        $('startDateSelect').checked = false;
        $('startDateDiv').style['display'] = 'none';
    }
    
    if ($('endDateSelect')) {
        $('endDateSelect').checked = false;
        $('endDateDiv').style['display'] = 'none';
    }
    
    if ($('timePeriodSelectionDiv')) {
        SailPoint.clearCheckboxMultiSelections($('timePeriodSelectionDiv'));
    }
    
    $(formName + ':activityActionType').value = 'Equal';
    SailPoint.clearMultiSelections($('activitySearchForm:activityActionOption'));
    
    if (appNameMultiSuggest) {
        appNameMultiSuggest.clear();
        $('activityAppNameSuggest').value = '';
    }
    
    $(formName + ':catOrTargetSelection').value = 'Category';
    $(formName + ':selectCategory').value = '';
    $(formName + ':targetSelectionOption').value = '';
    
    SailPoint.clearMultiSelections($('targetsDisplayDiv'));
    
    var ipopOrIdentitySelection = $(formName + ':ipopOrIdentitySelection');
    if (ipopOrIdentitySelection) {
        SailPoint.Analyze.resetSelectItems(ipopOrIdentitySelection);
    }
    
    if (ownerMultiSuggest) {
        ownerMultiSuggest.clear();
        $('activityOwners').value = '';
    }
    
    if (ipopName) {
        ipopName.value = '';
    }
    
    SailPoint.clearMultiSelections($(formName + 'activityResult'));
    SailPoint.Activity.Search.restoreCalendarDefaults();
    SailPoint.Analyze.resetFieldsToDisplay('activity');
};

// This is a hack to work around a mysterious issue that prevents the calendar
// from being properly reset after clearing the search.  If we don't do this we
// wind up with uncorrectable validation errors
SailPoint.Activity.Search.restoreCalendarDefaults = function() {
    var monthValToSelect;
    var monthOptions;
    
    $('activitySearchForm:startDate.day').value = SailPoint.Activity.startDateInit.day;
    monthValToSelect = SailPoint.Activity.startDateInit.month;
    monthOptions = Ext.DomQuery.select('option', $('activitySearchForm:startDate.month'));
    for (i = 0; i < monthOptions.length; ++i) {
        if (monthOptions[i].value == monthValToSelect) {
            monthOptions[i].selected = true;
        } else {
            monthOptions[i].selected = false;
        }
    }
    $('activitySearchForm:startDate.year').value = SailPoint.Activity.startDateInit.year;

    $('activitySearchForm:endDate.day').value = SailPoint.Activity.endDateInit.day;
    monthOptions = Ext.DomQuery.select('option', $('activitySearchForm:endDate.month'));
    for (i = 0; i < monthOptions.length; ++i) {
        if (monthOptions[i].value == monthValToSelect) {
            monthOptions[i].selected = true;
        } else {
            monthOptions[i].selected = false;
        }
    }
    $('activitySearchForm:endDate.year').value = SailPoint.Activity.endDateInit.year;
};


/** 
 * 
 * ANALYZE STUFF 
 * 
 * **/
SailPoint.Analyze.Activity.validateSearch = function(formName) {
  var errors = [];
  var isValid = true;
  
  /** Validate Activity Dates **/
  if($(formName+':dateOrTimePeriodSelection').value=='activityDate') {
    if($('startDateSelect').checked) {
      isValid &= Validator.validateInputDate(formName+':startDate', '');
    }
    if($('endDateSelect').checked) {
      isValid &= Validator.validateInputDate(formName+':endDate', '');
    }
  }
  
  if (!isValid) {
    errors = Validator.getErrors();
    Validator.clearErrors();
  }
  
  return errors;
};

SailPoint.Analyze.Activity.initializeAttributes = function() {
  var formName = 'activitySearchForm';
  
  var appNameMultiSuggest = Ext.getCmp('activityAppNameMultiSuggestCmp');
  if (appNameMultiSuggest) {
      appNameMultiSuggest.destroy();
  }

  appNameMultiSuggest = new SailPoint.MultiSuggest({
      id: 'activityAppNameMultiSuggestCmp',
      renderTo: 'activityAppNameMultiSuggest',
      suggestType: 'application',
      jsonData: JSON.parse($('activityAppNameMultiSuggestData').innerHTML),
      inputFieldName: 'activityAppNameSuggest',
      valueField: 'displayName'
  });
  
  var checkBox = $('startDateSelect');
  if($(formName + ':startDateType').value != 'None') {
      checkBox.checked = true;
  }
  toggleDisplay($('startDateDiv'), !(checkBox.checked));


  var checkBox2 = $('endDateSelect');
  if ($(formName + ':endDateType').value != 'None') {
      checkBox2.checked = true;
  }
  toggleDisplay($('endDateDiv'), !(checkBox2.checked));
    
  SailPoint.Analyze.supportLongSourceAppNames(formName);
  SailPoint.Analyze.Activity.renderOwners();
  SailPoint.Analyze.initializeSubmit(formName, 'preActivitySearchBtn');
};

SailPoint.Analyze.Activity.finishRerender = function() {
  resizeTables('activitySearchForm');
  SailPoint.Analyze.Activity.initializeAttributes();    
};

//the div containing this multisuggest gets re-rendered by 
//an ajax call, in which case we need to re-render the 
//multisuggest component itself        
SailPoint.Analyze.Activity.renderOwners = function() {
  if ($('activityOwnersMultiSuggest')) {
      var ownersMultiSuggest = Ext.getCmp('activityOwnersMultiSuggestCmp');
      
      if (ownersMultiSuggest) {
          ownersMultiSuggest.destroy();
      }
      
      ownersMultiSuggest = new SailPoint.MultiSuggest({
          id: 'activityOwnersMultiSuggestCmp',
          renderTo: 'activityOwnersMultiSuggest',
          suggestType: 'identity',
          jsonData: JSON.parse($('activityOwnersMultiSuggestData').innerHTML),
          inputFieldName: 'activityOwners',
          baseParams: {context: 'Owner'}
      });
  }
  SailPoint.Utils.styleSelects();
};