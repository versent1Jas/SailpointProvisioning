/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Audit', 
       'SailPoint.Audit.Search',
       'SailPoint.Analyze', 
       'SailPoint.Analyze.Audit');

SailPoint.Audit.Search.getAuditSearchPanel = function(config) {
    var activeItem = 'auditSearchContents';
    if (config.activeCard) {
        activeItem = config.activeCard;
    }
    
    var searchContents = Ext.create('Ext.panel.Panel', {
        id: 'auditSearchContents',
        layout: 'fit',
        contentEl: 'auditSearchContentsDiv',
        border: false,
        autoScroll: true,
        bbar: [{
            id: 'preAuditSearchBtn',
            text: '#{msgs.button_run_search}',
            cls : 'primaryBtn',
            handler: function() {
                var searchPanel = Ext.getCmp('auditSearchPanel');
                searchPanel.validationErrors = SailPoint.Analyze.validateSearch('auditSearchForm', 'audit'); 
            }
        }, {
            id: 'auditClearBtn',
            text: '#{msgs.button_clear_search}',
            handler: function() {
                $('auditSearchForm:resetBtn').click()
            }
        }],
        loader: {
        	url: SailPoint.getRelativeUrl('/analyze/audit/auditSearchContents.jsf'),
            params: { searchType: 'Audit' },
            discardUrl: false,
            callback: SailPoint.Audit.Search.finishInit,
            nocache: false,
            text: '#{msgs.loading_data}',
            timeout: 30,
            scripts: true
        }
    });

    var resultsContents = SailPoint.Search.getResultsGrid({
        id: 'auditSearchResultsGrid',
        type: 'Audit',
        stateful: true,
        stateId: SailPoint.Analyze.gridStateIds.get('Audit'),
        url: SailPoint.getRelativeUrl('/analyze/audit/auditDataSource.json'),
        handleClick: SailPoint.Audit.Search.handleClick,
        pageSize: SailPoint.Analyze.defaultResultsPageSize,
        optionsPlugin: SailPoint.Search.getOptionsPlugin({
            searchType: 'Audit',
            cardPanelId: 'auditSearchPanel',
            searchPanelId: 'auditSearchContents',
            applySearchPanelStyles: SailPoint.Audit.Search.styleSearchPanels,
            options: [
                ['saveOrUpdate', '#{msgs.save_search}'],
                ['saveAsReport', '#{msgs.save_search_as_report}']
            ]
        })
    });
        
    resultsContents.on('afterlayout', function(contentPanel, layout) {
        SailPoint.Audit.Search.styleResultsGrid();
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
            
            SailPoint.Audit.Search.initResultsGrid();
            searchPanel.isLoaded = true;
        }
    },{
        single: true,
        scope: this
    });
    
    return searchPanel;
};

SailPoint.Audit.Search.displaySearchResults = function() {
    var searchPanel = Ext.getCmp('auditSearchPanel');
    searchPanel.getLayout().setActiveItem('auditSearchResultsGridWrapper');
    searchPanel.doLayout();
    if (Ext.isGecko) {
    	Ext.getCmp('auditSearchResultsGrid').getView().refresh();
    }
    Ext.MessageBox.hide();
    // We're not keeping track of the card panel anymore
    // $('stateForm:searchType').value = 'Audit';
    // $('stateForm:currentCardPanel').value = 'auditSearchResultsGrid';
    // $('stateForm:updatePanelStateBtn').click();
}

SailPoint.Audit.Search.displaySearchContents = function() {
    var searchPanel = Ext.getCmp('auditSearchPanel');
    searchPanel.getLayout().setActiveItem('auditSearchContents');
    // We're not keeping track of the card panel anymore
    // $('stateForm:searchType').value = 'Audit';
    // $('stateForm:currentCardPanel').value = 'auditSearchContents';
    // $('stateForm:updatePanelStateBtn').click();
};

SailPoint.Audit.Search.initResultsGrid = function() {
    SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/audit/auditDataSource.json'), 'auditSearchResultsGrid', 13, true);
};

SailPoint.Audit.Search.styleResultsGrid = function() {
    var gridPanel = Ext.getCmp('auditSearchResultsGrid');
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

SailPoint.Audit.Search.finishInit = function() {
    SailPoint.Analyze.Audit.initializeAttributes();
    var accordion = Ext.getCmp('auditFieldsAccordion');
    if (!accordion) {
        var auditFields = [];
        if ($('auditFieldsTab')) {
            auditFields.push(Ext.create('Ext.panel.Panel', {
            	id: 'auditFieldsPanel',
            	collapsible: false,
            	hideCollapseTool: true,
            	contentEl: 'auditFieldsTab',
            	title: '#{msgs.audit_fields}'
            }));
        }
    
        accordion = new Ext.Panel({
            id: 'auditFieldsAccordion',
            layout: {
            	type: 'accordion',
                titleCollapse: false,
                fill: false
            },
            renderTo: 'auditFieldAccordionDiv',
            items: auditFields
        });
    }

    SailPoint.Audit.Search.styleSearchPanels();
    
    // Cache the stupid tomahawk calendar values so that we can manually reset them later 
    var i = 0;
    var monthOptions = Ext.DomQuery.select('option', 'auditSearchForm:auditStartDate.month');
    var selectedMonth;
    for (i = 0; i < monthOptions.length; ++i) {
        if (monthOptions[i].selected === true) {
            selectedMonth = monthOptions[i].value;
        }
    }
    
    SailPoint.Audit.startDateInit = {
        day: $('auditSearchForm:auditStartDate.day').value,
        month: selectedMonth,
        year: $('auditSearchForm:auditStartDate.year').value
    };

    monthOptions = Ext.DomQuery.select('option', 'activitySearchForm:auditEndDate.month');
    for (i = 0; i < monthOptions.length; ++i) {
        if (monthOptions[i].selected === true) {
            selectedMonth = monthOptions[i].value;
        }
    }

    SailPoint.Audit.endDateInit = {
        day: $('auditSearchForm:auditEndDate.day').value,
        month: selectedMonth,
        year: $('auditSearchForm:auditEndDate.year').value
    };

    buildTooltips($('auditSearchCriteria'));
    
    var submitOnEnter = new SailPoint.SubmitOnEnter("preAuditSearchBtn");
    var textFields = document.getElementsByClassName('searchInputText','attributes');
    textFields.each(function (textField) {
        submitOnEnter.registerTextField(textField);
    });
    
    SailPoint.Analyze.registerSubmits({
        className: 'searchInputText',
        container: $('auditSearchCriteria'),
        eventHandler: SailPoint.Analyze.submitEventHandler,
        options: {
            formName: 'auditSearchForm',
            searchType: 'Audit'
        }
    });
    
    Ext.MessageBox.hide();
}

SailPoint.Audit.Search.styleSearchPanels = function() {
    resizeTables('auditSearchForm');
    Ext.getCmp('auditSearchContents').doLayout();
    Ext.getCmp('auditFieldsAccordion').doLayout();
    
}

SailPoint.Audit.Search.styleResultsPanels = function() {}

SailPoint.Audit.Search.clearSearchFields = function() {
    var formName = 'auditSearchForm';
    
    if ($('auditStartDateSelect')) {
        $('auditStartDateSelect').checked = false;
        $('auditStartDateDiv').style['display'] = 'none';
        $(formName + ':auditStartDateType').value = 'None';
    }
    
    if ($('auditEndDateSelect')) {
        $('auditEndDateSelect').checked = false;
        $('auditEndDateDiv').style['display'] = 'none';
        $(formName + ':auditEndDateType').value = 'None';
    }
    
    var auditActionSuggest = Ext.getCmp('auditActionSuggestCmp');
    if (auditActionSuggest) {
      auditActionSuggest.clearValue();
      $('auditAction').value = '';
    }
    
    var sourceSuggest = Ext.getCmp('sourceSuggestCmp');
    if (sourceSuggest) {
      sourceSuggest.clearValue();
      $('source').value = '';
    }
    
    var applicationSuggest = Ext.getCmp('auditApplicationSuggestCmp');
    if (applicationSuggest) {
      applicationSuggest.clearValue();
      $('auditApplication').value = '';
    }
    
    var instanceSuggest = Ext.getCmp('auditInstanceSuggestCmp');
    if (instanceSuggest) {
      instanceSuggest.clearValue();
      $('auditInstance').value = '';
    }    
    
    var attributeNameSuggest = Ext.getCmp('attributeNameSuggestCmp');
    if (attributeNameSuggest) {
      attributeNameSuggest.clearValue();
      $('attributeName').value = '';
    }    
    
    var attributeValueSuggest = Ext.getCmp('attributeValueSuggestCmp');
    if (attributeValueSuggest) {
      attributeValueSuggest.clearValue();
      $('attributeValue').value = '';
    }
    
    var targetSuggest = Ext.getCmp('targetSuggestCmp');
    if (targetSuggest) {
      targetSuggest.clearValue();
      $('target').value = '';
    }
    
    var accountSuggest = Ext.getCmp('accountSuggestCmp');
    if (accountSuggest) {
      accountSuggest.clearValue();
      $('account').value = '';
    }
    
    
    SailPoint.Analyze.Audit.initializeAttributes();
    SailPoint.Analyze.resetFieldsToDisplay('audit');
}

SailPoint.Audit.Search.handleClick = function(gridView, record, HTMLitem, index, e, eOpts){
    var initialLoad = SailPoint.Audit.Search.AuditEventDetails == null;
    
    if (SailPoint.Audit.Search.AuditEventDetails == null){
        SailPoint.Audit.Search.AuditEventDetails = Ext.create('Ext.Window', {
            title: '#{msgs.audit_event_details}',
            modal: true,
            autoScroll: true,
            resizable: true,
            shadow: false,
            width: 600,
            height: 'auto',
            style: 'background-color: white',
            onEsc: function() { this.hide() },
            closeAction: 'hide',
            buttonAlign: 'center',
            buttons: [
                new Ext.Button({
                    text: '#{msgs.button_close}',
                    cls : 'secondaryBtn',
                    handler: function() { SailPoint.Audit.Search.AuditEventDetails.hide() }
                })
            ],
            loader: {
                url: SailPoint.getRelativeUrl("/analyze/audit/auditEventDetailsDialog.jsf?id=" + record.getId()), 
                callback: function() { 
                    // check the window's height and resize if necessary
                    if (this.target.getHeight() > 600)
                        this.target.setSize(600, 600);
                        
                    this.target.center();
                }
            }
        });
        
        SailPoint.Audit.Search.AuditEventDetails.on('afterlayout', function(p) {
            if (this.getHeight() > 600)
                this.setHeight(200);
            }, SailPoint.Audit.Search.AuditEventDetails);
    }        

    // reset the window height to auto in case the last load call required
    // the window height to be set to the max
    SailPoint.Audit.Search.AuditEventDetails.setSize(600, 'auto');
    SailPoint.Audit.Search.AuditEventDetails.show();
    var urlToLoad = SailPoint.getRelativeUrl("/analyze/audit/auditEventDetailsDialog.jsf?id=" + record.getId());
    SailPoint.Audit.Search.AuditEventDetails.getLoader().load({url: urlToLoad});
}
 
/** 
 * 
 * ANALYZE STUFF 
 * 
 * **/
SailPoint.Analyze.Audit.validateSearch = function(formName) {
  var errors = [];
  var isValid = true;
  
  var startDate = $('auditStartDateSelect');
  var endDate = $('auditEndDateSelect');
  /** Validate Dates **/
  if(startDate.checked) {
    isValid &= Validator.validateInputDate(formName+':auditStartDate', '');
  }
  if(endDate.checked) {
    isValid &= Validator.validateInputDate(formName+':auditEndDate', '');
  }
  
  if(startDate.checked && endDate.checked) {
    isValid &= Validator.validateStartEndDates(formName+':auditStartDate', formName+':auditEndDate', '#{msgs.err_invalid_start_end_date}')
  }

  if(!isValid) {
    errors = Validator.getErrors();
    Validator.clearErrors();
  }

  return errors;
}

SailPoint.Analyze.Audit.initializeAttributes = function() {
  var checkBox = $('auditStartDateSelect');
  if($('auditSearchForm:auditStartDateType').value != 'None') {
    checkBox.checked = true;
  }
  toggleDisplay($('auditStartDateDiv'), !(checkBox.checked));
  
  
  var checkBox2 = $('auditEndDateSelect');
  if($('auditSearchForm:auditEndDateType').value != 'None') {
    checkBox2.checked = true;
  }
  toggleDisplay($('auditEndDateDiv'), !(checkBox2.checked));
  
  var auditActionSuggest = Ext.getCmp('auditActionSuggestCmp');
  var auditActionVal = $('auditActionVal').innerHTML;
  
  if (auditActionSuggest) {
    auditActionSuggest.destroy();
  }  
  auditActionSuggest = new SailPoint.DistinctRestSuggest({
    id: 'auditActionSuggestCmp',
    renderTo: 'auditActionSuggest',
    binding: 'auditAction',
    value: auditActionVal,
    valueField: 'displayName',
    width: 200,
    freeText: true,
    className: 'AuditEvent',
    column: 'action',
    listConfig : {width : 300}
  });
  
  var sourceSuggest = Ext.getCmp('sourceSuggestCmp');
  var sourceVal = $('sourceVal').innerHTML;
  
  if (sourceSuggest) {
    sourceSuggest.destroy();
  }  
  sourceSuggest = new SailPoint.DistinctRestSuggest({
    id: 'sourceSuggestCmp',
    renderTo: 'sourceSuggest',
    binding: 'source',
    value: sourceVal,
    valueField: 'displayName',
    width: 200,
    freeText: true,
    className: 'AuditEvent',
    column: 'source',
    listConfig : {width : 300}
  });
  
  var instanceSuggest = Ext.getCmp('auditInstanceSuggestCmp');
  var instanceVal = $('auditInstanceVal').innerHTML;
  
  if (instanceSuggest) {
    instanceSuggest.destroy();
  }  
  instanceSuggest = new SailPoint.DistinctRestSuggest({
    id: 'auditInstanceSuggestCmp',
    renderTo: 'auditInstanceSuggest',
    binding: 'auditInstance',
    value: instanceVal,
    valueField: 'displayName',
    width: 200,
    freeText: true,
    className: 'Link',
    column: 'instance',
    listConfig : {width : 300}
  });
  
  var attributeNameSuggest = Ext.getCmp('attributeNameSuggestCmp');
  var attributeNameVal = $('attributeNameVal').innerHTML;
  
  if (attributeNameSuggest) {
    attributeNameSuggest.destroy();
  }  
  attributeNameSuggest = new SailPoint.DistinctRestSuggest({
    id: 'attributeNameSuggestCmp',
    renderTo: 'attributeNameSuggest',
    binding: 'attributeName',
    value: attributeNameVal,
    valueField: 'displayName',
    width: 200,
    freeText: true,
    className: 'AuditEvent',
    column: 'attributeName',
    listConfig : {width : 300}
  });
  
  var attributeValueSuggest = Ext.getCmp('attributeValueSuggestCmp');
  var attributeValueVal = $('attributeValueVal').innerHTML;
  
  if (attributeValueSuggest) {
    attributeValueSuggest.destroy();
  }  
  attributeValueSuggest = new SailPoint.DistinctRestSuggest({
    id: 'attributeValueSuggestCmp',
    renderTo: 'attributeValueSuggest',
    binding: 'attributeValue',
    value: attributeValueVal,
    valueField: 'displayName',
    width: 200,
    freeText: true,
    className: 'AuditEvent',
    column: 'attributeValue',
    listConfig : {width : 300}
  });
  
  var targetSuggest = Ext.getCmp('targetSuggestCmp');
  var targetVal = $('targetVal').innerHTML;
  
  if (targetSuggest) {
    targetSuggest.destroy();
  }  
  targetSuggest = new SailPoint.DistinctRestSuggest({
    id: 'targetSuggestCmp',
    renderTo: 'targetSuggest',
    binding: 'target',
    value: targetVal,
    valueField: 'displayName',
    width: 200,
    freeText: true,
    className: 'AuditEvent',
    column: 'target',
    listConfig : {width : 300}
  });
  
  var accountSuggest = Ext.getCmp('accountSuggestCmp');
  var accountVal = $('accountVal').innerHTML;
  
  if (accountSuggest) {
    accountSuggest.destroy();
  }  
  accountSuggest = new SailPoint.DistinctRestSuggest({
    id: 'accountSuggestCmp',
    renderTo: 'accountSuggest',
    binding: 'account',
    value: accountVal,
    valueField: 'displayName',
    width: 200,
    freeText: true,
    className: 'AuditEvent',
    column: 'accountName',
    listConfig : {width : 300}
  });
  
  var applicationSuggest = Ext.getCmp('auditApplicationSuggestCmp');
  var applicationVal = $('auditApplicationVal').innerHTML;
  
  if (applicationSuggest) {
    applicationSuggest.destroy();
  }  
  applicationSuggest = new SailPoint.DistinctRestSuggest({
    id: 'auditApplicationSuggestCmp',
    renderTo: 'auditApplicationSuggest',
    binding: 'auditApplication',
    value: applicationVal,
    valueField: 'displayName',
    width: 200,
    freeText: true,
    className: 'Application',
    column: 'name',
    listConfig : {width : 300}
  });
  
  SailPoint.Analyze.initializeSubmit('auditSearchForm', 'preAuditSearchBtn');
}

SailPoint.Analyze.Audit.finishRerender = function() {
    resizeTables('auditSearchForm');
    SailPoint.Analyze.Audit.initializeAttributes();
}
