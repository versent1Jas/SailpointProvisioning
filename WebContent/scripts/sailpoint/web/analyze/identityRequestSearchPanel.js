/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.IdentityRequest', 'SailPoint.IdentityRequest.Search');

SailPoint.IdentityRequest.Search.getIdentityRequestSearchPanel = function(config) {
    var activeItem = 'identityRequestSearchContents';
    
    var searchContents = Ext.create('Ext.panel.Panel', {
        id: 'identityRequestSearchContents',
        layout: 'fit',
        contentEl: 'identityRequestSearchContentsDiv',
        border: false,
        autoScroll: true,
        bbar: [{
            id: 'preIdentityRequestSearchBtn',
            text: '#{msgs.button_run_search}',
            cls : 'primaryBtn',
            handler: function() {
                var searchPanel = Ext.getCmp('identityRequestSearchPanel');
                searchPanel.validationErrors = SailPoint.Analyze.validateSearch('identityRequestSearchForm', 'identityRequest'); 
            }
        }, {
            id: 'identityRequestClearBtn',
            text: '#{msgs.button_clear_search}',
            handler: function() {
                $('identityRequestSearchForm:resetBtn').click();
            }
        }],
        loader: {
        	url: SailPoint.getRelativeUrl('/analyze/identityRequest/identityRequestSearchContents.jsf'),
            params: { searchType: 'IdentityRequest' },
            discardUrl: false,
            callback: SailPoint.IdentityRequest.Search.initIdentityRequestSearchPanel,
            nocache: false,
            text: '#{msgs.loading_data}',
            timeout: 30,
            scripts: true
        }
    });

    var resultsContents = SailPoint.Search.getResultsGrid({
        id: 'identityRequestSearchResultsGrid',
        type: 'IdentityRequest',
        stateful: true,
        stateId: SailPoint.Analyze.gridStateIds.get('IdentityRequest'),
        url: SailPoint.getRelativeUrl('/analyze/identityRequest/identityRequestDataSource.json'),
        handleClick: SailPoint.IdentityRequest.Search.handleClick,
        pageSize: SailPoint.Analyze.defaultResultsPageSize,
        optionsPlugin: SailPoint.Search.getOptionsPlugin({
            searchType: 'IdentityRequest',
            cardPanelId: 'identityRequestSearchPanel',
            searchPanelId: 'identityRequestSearchContents',
            applySearchPanelStyles: function() {
              resizeTables('identityRequestSearchForm');
              Ext.getCmp('identityRequestSearchContents').doLayout();
              Ext.getCmp('identityRequestDisplayFieldsPanel').doLayout();
              
            },
            options: [
                ['saveOrUpdate', '#{msgs.save_search}'],
                ['saveAsReport', '#{msgs.save_search_as_report}']
            ]
        })
    });
        
    //resultsContents.on('afterlayout', function(contentPanel, layout) {
    //    SailPoint.IdentityRequest.Search.styleResultsGrid();
    //});
    
        
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
            
            SailPoint.IdentityRequest.Search.initResultsGrid();
            searchPanel.isLoaded = true;
        }
    },{
        single: true,
        scope: this
    });
    
    return searchPanel;
};

SailPoint.IdentityRequest.Search.displaySearchResults = function() {
    var searchPanel = Ext.getCmp('identityRequestSearchPanel');
    searchPanel.getLayout().setActiveItem('identityRequestSearchResultsGridWrapper');
    searchPanel.doLayout();
    if (Ext.isGecko) {
    	Ext.getCmp('identityRequestSearchResultsGrid').getView().refresh();
    }
    Ext.MessageBox.hide();
}

SailPoint.IdentityRequest.Search.displaySearchContents = function() {
    var searchPanel = Ext.getCmp('identityRequestSearchPanel');
    searchPanel.getLayout().setActiveItem('identityRequestSearchContents');
};

SailPoint.Analyze.IdentityRequest.validateSearch = function(formName) {
  var errors = [];
  var isValid = true;
  
  /** Validate Dates **/
  if($('identityRequestStartDateSelect').checked) {
    isValid &= Validator.validateInputDate(formName+':identityRequestStartDate', '');
  }
  if($('identityRequestEndDateSelect').checked) {
    isValid &= Validator.validateInputDate(formName+':identityRequestEndDate', '');
  }
  
  if($('identityRequestStartDateSelect').checked && $('identityRequestEndDateSelect').checked) {
    isValid &= Validator.validateStartEndDates(formName+':identityRequestStartDate', formName+':identityRequestEndDate', '#{msgs.err_invalid_start_end_date}')
  }
  
  if (!isValid) {
    errors = Validator.getErrors();
    Validator.clearErrors();
  }
  
  return errors;
}

SailPoint.IdentityRequest.Search.initResultsGrid = function() {
    SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/identityRequest/identityRequestDataSource.json'), 'identityRequestSearchResultsGrid', 13, true);
};

SailPoint.IdentityRequest.Search.styleResultsGrid = function() {
    var gridPanel = Ext.getCmp('identityRequestSearchResultsGrid');
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

SailPoint.IdentityRequest.Search.initIdentityRequestSearchPanel = function() {
    SailPoint.Analyze.IdentityRequest.initializeAttributes();
    SailPoint.Analyze.SearchDisplayFields.initDisplayFields('identityRequest');

    buildTooltips($('identityRequestSearchCriteria'));
    
    SailPoint.Analyze.registerSubmits({
        className: 'searchInputText',
        container: $('identityRequestSearchCriteria'),
        eventHandler: SailPoint.Analyze.submitEventHandler,
        options: {
            formName: 'identityRequestSearchForm',
            searchType: 'IdentityRequest'
        }
    });

    Ext.getCmp('identityRequestSearchContents').doLayout();
    Ext.MessageBox.hide();
}

SailPoint.IdentityRequest.Search.styleResultsPanels = function() {}

SailPoint.IdentityRequest.Search.clearSearchFields = function() {
    var formName = 'identityRequestSearchForm';
    var applicationSuggest = Ext.getCmp('requestApplicationSuggestCmp');
    if (applicationSuggest) {
        applicationSuggest.clearValue();
        $('requestApplication').value = '';
    }
    
    var operationSuggest = Ext.getCmp('operationSuggestCmp');
    if (operationSuggest) {
        operationSuggest.clearValue();
        $('operation').value = '';
    }
    
    var stateSuggest = Ext.getCmp('stateSuggestCmp');
    if (stateSuggest) {
        stateSuggest.clearValue();
        $('state').value = '';
    }
    
    var instanceSuggest = Ext.getCmp('requestInstanceSuggestCmp');
    if (instanceSuggest) {
      instanceSuggest.clearValue();
        $('requestInstance').value = '';
    }
    
    var requestorSuggest = Ext.getCmp('requestorSuggestCmp');
    if (requestorSuggest) {
      requestorSuggest.clearValue();
      $('requestor').value = '';
    }
    
    var requesteeSuggestCmp = Ext.getCmp('requesteeSuggestCmp');
    if (requesteeSuggestCmp) {
      requesteeSuggestCmp.clearValue();
      $('requestee').value = '';
    }
    
    var formName = 'identityRequestSearchForm';
    $(formName + ':requestId').value = '';
    $(formName + ':identityRequestVerified').value = '';
    $(formName + ':identityRequestCompilationStatus').value = '';
    $(formName + ':identityRequestCompletionStatus').value = '';
    $(formName + ':identityRequestPriority').value = '';
    $(formName + ':identityRequestFlow').value = '';
    $(formName + ':identityRequestApprovalState').value = '';
    $(formName + ':identityRequestProvisioningState').value = '';
    
    $('identityRequestStartDateSelect').checked = false;
    toggleDisplay($('identityRequestStartDateDiv'), true);
    $('identityRequestEndDateSelect').checked = false;
    toggleDisplay($('identityRequestEndDateDiv'), true);
    
  
    SailPoint.Analyze.IdentityRequest.initializeAttributes();
    SailPoint.Analyze.resetFieldsToDisplay('identityRequest');
    SailPoint.Analyze.IdentityRequest.finishRerender();
}


SailPoint.IdentityRequest.Search.handleClick = function(gridView, record, HTMLitem, index, e, eOpts) {
    var colName = gridView.getHeaderCt().getHeaderAtIndex(gridView.clickedColumn).dataIndex;
    if (colName) {
        $('identityRequestResultForm:currentObjectId').value = record.getId();
        $('identityRequestResultForm:editButton').click();
    }
};

/** 
 * 
 * ANALYZE STUFF 
 * 
 * **/


SailPoint.Analyze.IdentityRequest.initializeAttributes = function() {
  var requestorSuggest = Ext.getCmp('requestorSuggestCmp');
  var requestorVal = $('requestorVal').innerHTML;
  
  if (requestorSuggest) {
    requestorSuggest.destroy();
  }  
  requestorSuggest = new SailPoint.IdentitySuggest({
    id: 'requestorSuggestCmp',
    renderTo: 'requestorSuggest',
    binding: 'requestor',
    rawValue: requestorVal,
    baseParams: {context: 'Identity'},
    width: 200,
    listConfig : {width : 300}
  });
  

  var requesteeSuggest = Ext.getCmp('requesteeSuggestCmp');
  var requesteeVal = $('requesteeVal').innerHTML;
  
  if (requesteeSuggest) {
    requesteeSuggest.destroy();
  }  
  requesteeSuggest = new SailPoint.IdentitySuggest({
    id: 'requesteeSuggestCmp',
    renderTo: 'requesteeSuggest',
    binding: 'requestee',
    rawValue: requesteeVal,
    baseParams: {context: 'Identity'},
    width: 200,
    listConfig : {width : 300}
  });
  
  var applicationSuggest = Ext.getCmp('requestApplicationSuggestCmp');
  var applicationVal = $('requestApplicationVal').innerHTML;
  
  if (applicationSuggest) {
    applicationSuggest.destroy();
  }  
  applicationSuggest = new SailPoint.BaseSuggest({
    id: 'requestApplicationSuggestCmp',
    renderTo: 'requestApplicationSuggest',
    binding: 'requestApplication',
    value: applicationVal,
    baseParams: {'suggestType': 'application'},
    valueField: 'displayName',
    width: 200,
    listConfig : {width : 300}
  });
  
  var stateSuggest = Ext.getCmp('stateSuggestCmp');
  var stateVal = $('stateVal').innerHTML;
  
  if (stateSuggest) {
    stateSuggest.destroy();
  }  
  stateSuggest = new SailPoint.UIRestSuggest({
    id: 'stateSuggestCmp',
    renderTo: 'stateSuggest',
    binding: 'state',
    value: stateVal,
    baseParams: {'key':'identityRequestStateAllowedValues'},
    valueField: 'displayName',
    width: 200,
    freeText: true,
    listConfig : {width : 300}
  });
  
  var operationSuggest = Ext.getCmp('operationSuggestCmp');
  var operationVal = $('operationVal').innerHTML;
  
  if (operationSuggest) {
    operationSuggest.destroy();
  }  
  operationSuggest = new SailPoint.UIRestSuggest({
    id: 'operationSuggestCmp',
    renderTo: 'operationSuggest',
    binding: 'operation',
    value: operationVal,
    baseParams: {'key':'identityRequestOperationAllowedValues'},
    valueField: 'displayName',
    width: 200,
    freeText: true,
    listConfig : {width : 300}
  });
  
  var instanceSuggest = Ext.getCmp('requestInstanceSuggestCmp');
  var instanceVal = $('requestInstanceVal').innerHTML;
  
  if (instanceSuggest) {
    instanceSuggest.destroy();
  }  
  instanceSuggest = new SailPoint.DistinctRestSuggest({
    id: 'requestInstanceSuggestCmp',
    renderTo: 'requestInstanceSuggest',
    binding: 'requestInstance',
    value: instanceVal,
    valueField: 'displayName',
    width: 200,
    freeText: true,
    className: 'Link',
    column: 'instance',
    listConfig : {width : 300}
  });
  
  var formName = 'identityRequestSearchForm';
  var checkBox = $('identityRequestStartDateSelect');
  if($(formName + ':identityRequestStartDateType').value != 'None') {
    checkBox.checked = true;
  }
  toggleDisplay($('identityRequestStartDateDiv'), !(checkBox.checked));
  
  var checkBox2 = $('identityRequestEndDateSelect');
  if($(formName + ':identityRequestEndDateType').value != 'None') {
    checkBox2.checked = true;
  }
  toggleDisplay($('identityRequestEndDateDiv'), !(checkBox2.checked));

}

SailPoint.Analyze.IdentityRequest.finishRerender = function() {
  resizeTables('identityRequestSearchForm');
  SailPoint.Analyze.IdentityRequest.initializeAttributes();
}
