/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.ProcessInstrumentation', 'SailPoint.ProcessInstrumentation.Search');

SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationSearchPanel = function(config) {
    var activeItem = 'processInstrumentationSearchContents';
    if (config.activeCard) {
        activeItem = config.activeCard;
    }
    
    var searchContents = Ext.create('Ext.panel.Panel', {
        id: 'processInstrumentationSearchContents',
        layout: 'fit',
        contentEl: 'processInstrumentationSearchContentsDiv',
        border: false,
        autoScroll: true,
        bbar: [{
            id: 'runInstrumentationSearchBtn',
            text: '#{msgs.button_run_search}',
            cls : 'primaryBtn',
            handler: function() {
                var runTheSearch = SailPoint.ProcessInstrumentation.Search.validate();
                if (runTheSearch) {
                    // This will trigger an a4j submission which will in turn call SailPoint.ProcessInstrumentation.Search.afterRunSearch
                    // upon completion
                    $('processInstrumentationSearchForm:processInstrumentationSearchBtn').click();
                }
            }
        }, {
            id: 'clearInstrumentationSearchBtn',
            text: '#{msgs.button_clear_search}',
            handler: function() {
                SailPoint.ProcessInstrumentation.Search.clearSearchFields();
            }
        }],
        loader: {
        	url: SailPoint.getRelativeUrl('/analyze/process/processInstrumentationSearchContents.jsf'),
            params: { searchType: 'ProcessInstrumentation' },
            discardUrl: false,
            callback: SailPoint.ProcessInstrumentation.Search.initSearchContents,
            nocache: false,
            text: '#{msgs.loading_data}',
            timeout: 30,
            scripts: true
        }
    });
    
    
    searchContents.on('show', function() {
        helpKey = 'METRICS_SEARCH';
    });
    
    var resultsContents = SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationResultPanel();
    
    resultsContents.on('afterlayout', function(contentPanel, layout) {
        // Do nothing for now.  If any styling hacks need to be applied this is the place to do it.
    });

    resultsContents.on('show', function() {
        helpKey = 'METRICS_SEARCH_RESULTS';
    });
    
    var executionsPanel = SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationExecutionsPanel();
    var stepOverviewPanel = SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationStepOverviewPanel();
    var stepExecutorsPanel = SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationStepExecutorsPanel();
    var approvalOverviewPanel = SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationApprovalOverviewPanel();
    var stepDetailsPanel = SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationStepDetailsPanel();
    
    var searchPanel = Ext.create('Ext.panel.Panel', {
        id: config.id,
        title: config.title,
        headerAsText: false,
        header: false,
        layout: 'card',
        activeItem: activeItem,
        items: [searchContents, resultsContents, executionsPanel, stepOverviewPanel, stepExecutorsPanel, approvalOverviewPanel, stepDetailsPanel]
    });
    
    searchPanel.on('activate', function(viewerPanel) {
        if (!searchPanel.isLoaded) {
            searchContents.getLoader().load();
            
            // SailPoint.ProcessInstrumentation.Search.initResultsGrid();
            
            searchPanel.isLoaded = true;
        }
    },{
        single: true,
        scope: this
    });
    
    return searchPanel;
};

/**
 * Validates the inputs and displays error messages if necessary.
 * @return true if the inputs were valid; false otherwise
 */
SailPoint.ProcessInstrumentation.Search.validate = function() {
    var isValid = true;
    var errors;
    Validator.clearErrors();
    Validator.validateInputDate('processInstrumentationSearchForm:processInstrumentationStartDate', '#{msgs.err_date_invalid}', false);
    Validator.validateInputDate('processInstrumentationSearchForm:processInstrumentationEndDate', '#{msgs.err_date_invalid}', false);
    Validator.validateGreaterThanOrEqual('processInstrumentationSearchForm:executionTimeThreshold', 0, Ext.String.format('#{msgs.err_number_less_than_zero}', $('processInstrumentationSearchForm:executionTimeThreshold').value), false);
    errors = Validator.getErrors();
    if (errors.length > 0) {
        Validator.displayErrors($('ProcessInstrumentationError'));
        isValid = false;
    } else {
        Validator.hideErrors('ProcessInstrumentationError');
    }
    return isValid;
};

 

SailPoint.ProcessInstrumentation.Search.afterRunSearchSubmit = function() {
    var resultsPanel = Ext.getCmp('processInstrumentationSearchResults');
    resultsPanel.update({timeUnits:$('processInstrumentationSearchForm:executionTimeThresholdUnits').value});
};


SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationResultPanel = function() {
    var resultsPanel = Ext.getCmp('processInstrumentationSearchResults');
    var resultsGrid;

    if (!resultsPanel) {
        resultsGrid = SailPoint.ProcessInstrumentation.Search.getResultsGrid({
            id: 'processInstrumentationSearchResultsGrid',
            stateful: true,
            stateId: SailPoint.Analyze.gridStateIds.get('ProcessInstrumentation'),
            title: '#{msgs.process_instrumentation_search_results}',
            columns: [{
                    header: '#{msgs.process_instrumentation_search_result_process}', 
                    sortable: true, 
                    dataIndex: 'stepOrProcess'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_avg_execution_time}',
                    sortable: true, 
                    dataIndex: 'averageExecutionTime'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_max_execution_time}',
                    sortable: true, 
                    dataIndex: 'maximumExecutionTime'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_min_execution_time}',
                    sortable: true, 
                    dataIndex: 'minimumExecutionTime'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_num_executions}', 
                    sortable: true, 
                    dataIndex: 'numberOfExecutions'
                }],
            store: SailPoint.Store.createStore({
                url: SailPoint.getRelativeUrl('/analyze/process/processInstrumentationDataSource.json'),
                remoteSort: true,
                root: 'results',
                idProperty: 'stepOrProcess',
                simpleSortMode: true,
                fields: [ 'stepOrProcess' , 'averageExecutionTime' , 'maximumExecutionTime' , 'minimumExecutionTime' , 'numberOfExecutions' ]
            })
        });
        resultsGrid.on('itemclick', SailPoint.ProcessInstrumentation.Search.handleClick);
        resultsGrid.on('itemcontextmenu', SailPoint.ProcessInstrumentation.Search.handleClick);

        resultsPanel = new SailPoint.ProcessInstrumentation.Search.DetailsPanel({
            id: 'processInstrumentationSearchResults',
            layout: 'border',
            grid: resultsGrid,
            url: SailPoint.getRelativeUrl('/analyze/process/processInstrumentationDataSource.json'),
            filterInfoTemplate: SailPoint.ProcessInstrumentation.Search.RESULTS_FILTER_TEMPLATE,
            breadcrumbsTemplate: SailPoint.ProcessInstrumentation.Search.SEARCH_RESULTS_BREADCRUMBS_TEMPLATE,
            type: 'process'
        });
    }
    
    return resultsPanel;
};

SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationExecutionsPanel = function() {
    var executionsGrid;
    var resultPanel = Ext.getCmp('processInstrumentationExecutions');
    
    if (!resultPanel) {
        executionsGrid = SailPoint.ProcessInstrumentation.Search.getResultsGrid({
            id: 'processInstrumentationExecutionsGrid',
            title: '#{msgs.process_instrumentation_search_result_executions}',
            columns: [{
                    header: '#{msgs.process_instrumentation_search_result_process_name}',
                    sortable: true, 
                    dataIndex: 'processName',
                    renderer: function(value, metadata, record, rowIndex, colIndex, store) {
                        if (record.data.hasSteps) {
                            value = SailPoint.grid.Util.renderFakeLink(value, metadata, record, rowIndex, colIndex, store);
                        }
                        return value;
                    }
                }, {
                    header: '#{msgs.process_instrumentation_search_result_started_by}',
                    sortable: true, 
                    dataIndex: 'startedBy'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_start_date}',
                    sortable: true, 
                    dataIndex: 'startDate'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_end_date}',
                    sortable: true, 
                    dataIndex: 'endDate'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_execution_time}', sortable: true, dataIndex: 'executionTime'
                }],
            store: SailPoint.Store.createStore({
                url: SailPoint.getRelativeUrl('/analyze/process/processInstrumentationExecutionsDataSource.json'),
                remoteSort: true,
                root: 'results',
                idProperty: 'caseId',
                simpleSortMode: true,
                fields: [ 'caseId', 'processName', 'startedBy', 'startDate', 'endDate', 'executionTime', 'hasSteps' ]
            })
        });
        
        executionsGrid.on('itemclick', SailPoint.ProcessInstrumentation.Search.handleExecutionsClick);        
    
        resultPanel = new SailPoint.ProcessInstrumentation.Search.DetailsPanel({
            id: 'processInstrumentationExecutions',
            layout: 'border',
            grid: executionsGrid,
            url: SailPoint.getRelativeUrl('/analyze/process/processInstrumentationExecutionsDataSource.json'),
            filterInfoTemplate: SailPoint.ProcessInstrumentation.Search.EXECUTIONS_FILTER_TEMPLATE,
            breadcrumbsTemplate: SailPoint.ProcessInstrumentation.Search.EXECUTIONS_BREADCRUMBS_TEMPLATE,
            type: 'executions'
        });
    }
     
    return resultPanel;
};


SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationStepOverviewPanel = function() {
    var stepOverviewGrid;
    var resultPanel = Ext.getCmp('processInstrumentationStepOverview');
    if (!resultPanel) {
        stepOverviewGrid = SailPoint.ProcessInstrumentation.Search.getResultsGrid({
            id: 'processInstrumentationStepOverviewGrid',
            title: '#{msgs.process_instrumentation_search_step_overview}',
            columns: [{
                    header: '#{msgs.process_instrumentation_search_result_step_name}',
                    sortable: true, 
                    dataIndex: 'stepName',
                    renderer: function(value, metadata, record, rowIndex, colIndex, store) {
                        if (record.data.isApproval) {
                            value = SailPoint.grid.Util.renderFakeLink(value, metadata, record, rowIndex, colIndex, store);
                        }
                        return value;
                    }
                }, {
                    header: '#{msgs.process_instrumentation_search_result_avg_execution_time}',
                    sortable: true, 
                    dataIndex: 'averageTime'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_min_execution_time}',
                    sortable: true, 
                    dataIndex: 'minTime'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_max_execution_time}',
                    sortable: true, 
                    dataIndex: 'maxTime'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_num_executions}', 
                    sortable: true, 
                    dataIndex: 'numExecutions'
                }],
            store: SailPoint.Store.createStore({
                url: SailPoint.getRelativeUrl('/analyze/process/processInstrumentationStepOverviewDataSource.json'),
                remoteSort: true,
                root: 'results',
                idProperty: 'stepName',
                simpleSortMode: true,
                fields: [ 'stepName', 'averageTime', 'minTime', 'maxTime', 'numExecutions', {name: 'isApproval', type: 'boolean'} ]
            })
        });
        
        stepOverviewGrid.on('itemclick', SailPoint.ProcessInstrumentation.Search.handleStepOverviewClick);
        stepOverviewGrid.on('itemcontextmenu', SailPoint.ProcessInstrumentation.Search.handleStepOverviewClick);
    
        resultPanel = new SailPoint.ProcessInstrumentation.Search.DetailsPanel({
            id: 'processInstrumentationStepOverview',
            layout: 'border',
            grid: stepOverviewGrid,
            url: SailPoint.getRelativeUrl('/analyze/process/processInstrumentationStepOverviewDataSource.json'),
            filterInfoTemplate: SailPoint.ProcessInstrumentation.Search.EXECUTIONS_FILTER_TEMPLATE,
            breadcrumbsTemplate: SailPoint.ProcessInstrumentation.Search.STEP_OVERVIEW_BREADCRUMBS_TEMPLATE,
            type: 'stepOverview'
        });
    }
     
    return resultPanel;
};

SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationStepExecutorsPanel = function(config) {
    var stepExecutorsGrid;
    var resultPanel = Ext.getCmp('processInstrumentationStepExecutors');
    if (!resultPanel) {
        stepExecutorsGrid = SailPoint.ProcessInstrumentation.Search.getResultsGrid({
            id: 'processInstrumentationStepExecutorsGrid',
            title: '#{msgs.process_instrumentation_search_step_executors}',
            columns: [{
                    header: '#{msgs.process_instrumentation_search_result_process_participant}',
                    sortable: true, 
                    dataIndex: 'participant'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_approval_name}',
                    sortable: true, 
                    dataIndex: 'approvalName'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_start_date}',
                    sortable: true, 
                    dataIndex: 'startDate'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_end_date}',
                    sortable: true, 
                    dataIndex: 'endDate'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_execution_time}', 
                    sortable: true, 
                    dataIndex: 'executionTime'
                }],
            store: SailPoint.Store.createStore({
                url: SailPoint.getRelativeUrl('/analyze/process/processInstrumentationStepExecutorsDataSource.json'),
                remoteSort: true,
                root: 'results',
                simpleSortMode: true,
                fields: [ 'id', 'participant', 'approvalName', 'startDate', 'endDate', 'executionTime' ]
            })
        });
            
        resultPanel = new SailPoint.ProcessInstrumentation.Search.DetailsPanel({
            id: 'processInstrumentationStepExecutors',
            layout: 'border',
            grid: stepExecutorsGrid,
            url: SailPoint.getRelativeUrl('/analyze/process/processInstrumentationStepExecutorsDataSource.json'),
            filterInfoTemplate: SailPoint.ProcessInstrumentation.Search.STEP_EXECUTORS_FILTER_TEMPLATE,
            breadcrumbsTemplate: SailPoint.ProcessInstrumentation.Search.STEP_EXECUTORS_BREADCRUMBS_TEMPLATE,
            type: 'stepExecutors'
        });
    }
     
    return resultPanel;
};

SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationStepDetailsPanel = function() {
    var stepDetailsGrid;
    var resultPanel = Ext.getCmp('processInstrumentationStepDetails');
    if (!resultPanel) {
        stepDetailsGrid = SailPoint.ProcessInstrumentation.Search.getResultsGrid({
            id: 'processInstrumentationStepDetailsGrid',
            title: '#{msgs.process_instrumentation_search_step_details}',
            columns: [{
                    header: '#{msgs.process_instrumentation_search_result_step_or_approval_name}',
                    sortable: true, 
                    dataIndex: 'stepOrApprovalName'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_process_participant}',
                    sortable: true, 
                    dataIndex: 'participant'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_start_date}',
                    sortable: true, 
                    dataIndex: 'startDate'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_end_date}',
                    sortable: true, 
                    dataIndex: 'endDate'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_execution_time}', 
                    sortable: true, 
                    dataIndex: 'executionTime'
                }],
            store: SailPoint.Store.createStore({
                url: SailPoint.getRelativeUrl('/analyze/process/processInstrumentationStepDetailsDataSource.json'),
                remoteSort: true,
                root: 'results',
                simpleSortMode: true,
                fields: [ 'id', 'stepOrApprovalName', 'participant', 'startDate', 'endDate', 'executionTime' ]
            })
        });
            
        resultPanel = new SailPoint.ProcessInstrumentation.Search.DetailsPanel({
            id: 'processInstrumentationStepDetails',
            layout: 'border',
            grid: stepDetailsGrid,
            url: SailPoint.getRelativeUrl('/analyze/process/processInstrumentationStepDetailsDataSource.json'),
            breadcrumbsTemplate: SailPoint.ProcessInstrumentation.Search.STEP_DETAILS_BREADCRUMBS_TEMPLATE,
            type: 'stepDetails'
        });
    }
     
    return resultPanel;
};

SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationApprovalOverviewPanel = function() {
    var approvalOverviewGrid; 

    var resultPanel = Ext.getCmp('processInstrumentationApprovalOverview');
    if (!resultPanel) {
        approvalOverviewGrid = SailPoint.ProcessInstrumentation.Search.getResultsGrid({
            id: 'processInstrumentationApprovalOverviewGrid',
            title: '#{msgs.process_instrumentation_search_approval_overview}',
            columns: [{
                    header: '#{msgs.process_instrumentation_search_result_approval_name}',
                    sortable: true, 
                    dataIndex: 'approvalName'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_avg_execution_time}',
                    sortable: true, 
                    dataIndex: 'averageTime'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_min_execution_time}',
                    sortable: true, 
                    dataIndex: 'minTime'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_max_execution_time}',
                    sortable: true, 
                    dataIndex: 'maxTime'
                }, {
                    header: '#{msgs.process_instrumentation_search_result_num_executions}', 
                    sortable: true, 
                    dataIndex: 'numExecutions'
                }],
            store: SailPoint.Store.createStore({
                url: SailPoint.getRelativeUrl('/analyze/process/processInstrumentationApprovalOverviewDataSource.json'),
                remoteSort: true,
                root: 'results',
                simpleSortMode: true,
                fields: ['id', 'approvalName', 'averageTime', 'minTime', 'maxTime', 'numExecutions']
            })
        });
            
        resultPanel = new SailPoint.ProcessInstrumentation.Search.DetailsPanel({
            id: 'processInstrumentationApprovalOverview',
            layout: 'border',
            grid: approvalOverviewGrid,
            url: SailPoint.getRelativeUrl('/analyze/process/processInstrumentationApprovalOverviewDataSource.json'),
            breadcrumbsTemplate: SailPoint.ProcessInstrumentation.Search.APPROVAL_OVERVIEW_BREADCRUMBS_TEMPLATE,
            filterInfoTemplate: SailPoint.ProcessInstrumentation.Search.STEP_EXECUTORS_FILTER_TEMPLATE,
            type: 'approvalOverview'
        });
    }
     
    return resultPanel;
};

SailPoint.ProcessInstrumentation.Search.underlineValueRenderer = SailPoint.grid.Util.renderFakeLink;

SailPoint.ProcessInstrumentation.Search.stepRenderer = SailPoint.grid.Util.renderFakeLink;


/**
 * Create a results grid
 * @param config - The configuration object supports the following properties:
 *   id - The grid's id
 *   cm or columnModel - The grid's column model
 *   store - The store that the grid will read from
 */
SailPoint.ProcessInstrumentation.Search.getResultsGrid = function(config) {
    var id = config.id;
    var store = config.store;
    var title = config.title;
    var timeSelector = Ext.create('Ext.form.field.ComboBox', {
        id: id + 'ProcessInstrumentationResultsTimeSelector',
        typeAhead: true,
        triggerAction: 'all',
        queryMode: 'local',
        store: Ext.create('Ext.data.Store', {
            fields: ['val', 'displayText'],
            data: [
                { val: 'minutes', displayText: '#{msgs.minutes}'},
                { val: 'hours', displayText: '#{msgs.hours}'},
                { val: 'days', displayText: '#{msgs.days}'}
            ]
        }),
        valueField: 'val',
        displayField: 'displayText'
    });
    
    var resultsGrid = new SailPoint.ProcessInstrumentation.Search.ResultsGrid({
        id: id,
        title: title,
        region: 'center',
        stateful: config.stateful,
        stateId: config.stateId,
        timeSelector: timeSelector,
        tbar: [
            '#{msgs.process_instrumentation_search_show_times_in} ',
            timeSelector
        ],
        columns: config.columns || config.gridMetaData.columns,
        store: store,
        pageSize: SailPoint.Analyze.defaultResultsPageSize
    });
    
    timeSelector.on('select', resultsGrid.changeTimeUnitSelection, resultsGrid);    
    resultsGrid.getStore().on('load', resultsGrid.initUnits, resultsGrid);
    
    return resultsGrid;
};


SailPoint.ProcessInstrumentation.Search.displaySearchResults = function() {
    var searchPanel = Ext.getCmp('processInstrumentationSearchPanel');
    searchPanel.getLayout().setActiveItem('processInstrumentationSearchResultsGridWrapper');
    searchPanel.doLayout();
    if (Ext.isGecko) {
        Ext.getCmp('processInstrumentationSearchResultsGrid').getView().refresh();
    }
    Ext.MessageBox.hide();
};

SailPoint.ProcessInstrumentation.Search.displaySearchContents = function() {
    var searchPanel = Ext.getCmp('processInstrumentationSearchPanel');
    searchPanel.getLayout().setActiveItem('processInstrumentationSearchContents');
};

SailPoint.Role.Search.initResultsGrid = function() {
    SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/role/roleDataSource.json'), 'roleSearchResultsGrid', 13, true);
};

SailPoint.ProcessInstrumentation.Search.styleResultsGrid = function() {
    // TODO
//    var gridPanel = Ext.getCmp('roleSearchResultsGrid');
//    if (gridPanel) {
//        var referenceDiv = Ext.get('example-grid');
//        if (referenceDiv) {
//            var gridWidth = referenceDiv.getWidth(true) - 20;
//            gridPanel.setWidth(gridWidth);
//            gridPanel.getPositionEl().applyStyles({
//                'margin-left': '10px',
//                'margin-right': '10px',
//                'margin-bottom': '10px'
//            });
//        }    
//    }
};

SailPoint.ProcessInstrumentation.Search.initSearchContents = function() {
    var contentPanel = Ext.getCmp('processInstrumentationSearchContents');
    var enableStartDate;
    var enableEndDate;
    var startInput = 'processInstrumentationSearchForm:processInstrumentationStartDate';
    var endInput = 'processInstrumentationSearchForm:processInstrumentationEndDate';
    var year;
    var month;
    var day;

    var participantMultiSuggest = Ext.getCmp('processParticpantMultiSuggestCmp');
    if (participantMultiSuggest) {
        participantMultiSuggest.destroy();
    }

    participantMultiSuggest = new SailPoint.MultiSuggest({
        id: 'processParticpantMultiSuggestCmp',
        renderTo: 'processParticipantMultiSuggest',
        suggestType: 'identity',
        jsonData: JSON.parse($('processParticipantMultiSuggestData').innerHTML),
        inputFieldName: 'processParticipantSuggest',
        emptyText: '#{msgs.process_instrumentation_select_particpant}'
    });
    
    var processNameSuggest = Ext.getCmp('processNameSuggestCmp');
    
    if (processNameSuggest) {
        processNameSuggest.destroy();
    }

    processNameSuggest = new SailPoint.BaseSuggest({
        id: 'processNameSuggestCmp',
        baseParams: {'suggestType': 'process'},
        binding: 'processName',
        renderTo: 'processNameSuggestDiv',
        value: $('processNameInitialVal').innerHTML,
        valueField: 'id',
        displayField: 'displayName',
        emptyText: '#{msgs.process_instrumentation_select_process}',
        width: 200,
        listConfig : {width : 300}
    });
    
    enableStartDate = $('processInstrumentationSearchForm:processInstrumentationEnableStartDateInput').value == 'true';
    $('processInstrumentationEnableStartDate').checked = enableStartDate;
    toggleDisplay($('processInstrumentationStartDateDiv'), !enableStartDate);
    
    enableEndDate = $('processInstrumentationSearchForm:processInstrumentationEnableEndDateInput').value == 'true';
    $('processInstrumentationEnableEndDate').checked = enableEndDate;
    toggleDisplay($('processInstrumentationEndDateDiv'), !enableEndDate);


    if (!contentPanel.originalStart) {
        year = $(startInput + '.year').value;
        month = $(startInput + '.month').value;
        day = $(startInput + '.day').value;
        contentPanel.originalStart = new Date(year, month, day);
    }
    
    if (!contentPanel.originalEnd) {
        year = $(endInput + '.year').value;
        month = $(endInput + '.month').value;
        day = $(endInput + '.day').value;
        contentPanel.originalEnd = new Date(year, month, day);
    }
    
    SailPoint.ProcessInstrumentation.Search.styleSearchPanels();

    Ext.MessageBox.hide();
};

SailPoint.ProcessInstrumentation.Search.styleSearchPanels = function() {
    // TODO
    // resizeTables('roleSearchForm');
    buildTooltips($('processInstrumentationSearchContents'));    
    // Ext.getCmp('roleSearchContents').doLayout();
};

SailPoint.ProcessInstrumentation.Search.styleResultsPanels = function() {
    // TODO
//    if (Ext.isIE6 || Ext.isIE7) {
//        resizeIE6Tables('roleResultsForm');
//        var tabPanel = Ext.getCmp('roleTabPanel');
//        var resultsHeader = Ext.get('roleSearchResultsHeader');
//        var resultsContent = Ext.get(Ext.DomQuery.selectNode('div[class*=spBackground]', $('roleResultsForm')));
//        var resultsFooter = Ext.get('roleSearchResultsFooter');
//        var width = tabPanel.getWidth();
//        resultsHeader.setWidth(width);
//        resultsContent.setWidth(width);
//        resultsFooter.setWidth(width);
//    }
};

SailPoint.ProcessInstrumentation.Search.clearSearchFields = function() {
    var originalStart = Ext.getCmp('processInstrumentationSearchContents').originalStart;
    var originalEnd = Ext.getCmp('processInstrumentationSearchContents').originalEnd;
    SailPoint.Analyze.resetTomahawkDate('processInstrumentationSearchForm:processInstrumentationStartDate', originalStart);
    SailPoint.Analyze.resetTomahawkDate('processInstrumentationSearchForm:processInstrumentationEndDate', originalEnd);
    SailPoint.Analyze.resetSelectItems('processInstrumentationSearchForm:executionTimeThresholdChoice');

    if ($('processInstrumentationEnableStartDate').checked) {
        toggleDisplay($('processInstrumentationStartDateDiv'), true);
        $('processInstrumentationEnableStartDate').checked = false;
        $('processInstrumentationSearchForm:processInstrumentationEnableStartDateInput').value = false;
    }

    if ($('processInstrumentationEnableEndDate').checked) {
        toggleDisplay($('processInstrumentationEndDateDiv'), true);
        $('processInstrumentationEnableEndDate').checked = false;
        $('processInstrumentationSearchForm:processInstrumentationEnableEndDateInput').value = false;
    }

    $('processInstrumentationSearchForm:executionTimeThreshold').value = '0.0';
    SailPoint.Analyze.resetSelectItems('processInstrumentationSearchForm:executionTimeThresholdUnits');
    Ext.getCmp('processNameSuggestCmp').clearValue();
    $('processName').value = '';
    Ext.getCmp('processParticpantMultiSuggestCmp').clear();
    $('processParticipantSuggest').value = '';
    SailPoint.Analyze.resetSelectItems('processInstrumentationSearchForm:resultStatusSelection');
};

SailPoint.ProcessInstrumentation.Search.handleClick = function(view, record, item, index, e, eOpts) {
    e.stopEvent();
    SailPoint.ProcessInstrumentation.Search.displayDetailsMenu(e, record);
};

SailPoint.ProcessInstrumentation.Search.handleStepOverviewClick = function(view, record, item, index, e, eOpts) {
    var stepExecutorsPanel;
    var stepOverviewParams;
    var stepInfoParams;
    
    e.stopEvent();
    
    if (record.data['isApproval']) {
        stepExecutorsPanel = SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationStepExecutorsPanel();
        stepOverviewParams = view.ownerCt.getStore().getProxy().extraParams;
        stepInfoParams = {
            stepName: Ext.util.Format.htmlDecode(record.data['stepName'])
        };
        Ext.apply(stepInfoParams, stepOverviewParams);
        
        SailPoint.ProcessInstrumentation.Search.displayStepInfoMenu(stepInfoParams, e);
    }
};

SailPoint.ProcessInstrumentation.Search.handleExecutionsClick = function(view, record, item, index, e, eOpts) {
    var stepDetailsPanel;
    var stepExecutionsParams;
    var stepDetailsParams;
    e.stopEvent();
    
    if (record.data['hasSteps']) {
        stepDetailsPanel = SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationStepDetailsPanel();
        stepExecutionsParams = view.ownerCt.getStore().getProxy().extraParams;
        stepDetailsParams = {
            execution: Ext.util.Format.htmlDecode(record.data['caseId']),
            executionName: Ext.util.Format.htmlDecode(record.data['processName'])
        };
        
        Ext.apply(stepDetailsParams, stepExecutionsParams);
        
        stepDetailsPanel.update(stepDetailsParams);        
    }
};


SailPoint.ProcessInstrumentation.Search.displayDetailsMenu = function(eventObj, record) {
    var menu = Ext.menu.MenuMgr.get('processDetailsMenu');
    if (!menu) {
        menu = new SailPoint.ProcessInstrumentation.Search.DetailsMenu({id: 'processDetailsMenu'});
    }
    // Hack alert!!!  We're using the menu object to store state information so that the 
    // event that gets fired when a selection is made can have ready access to the state
    menu.currentParams = {
        process: Ext.util.Format.htmlDecode(record.data['stepOrProcess']), 
        timeUnits:$('processInstrumentationSearchForm:executionTimeThresholdUnits').value
    };
    
    menu.showAt(eventObj.getXY());
};

Ext.define('SailPoint.ProcessInstrumentation.Search.DetailsMenu', {
	extend : 'Ext.menu.Menu',
    items: [{
        style: 'font-weight:bold; color:#FFFFFF',
        disabled: true,
        disabledClass: 'x-grid-header',
        cls: 'x-grid-header', 
        text: '#{msgs.process_instrumentation_process_details}'
    },{
        icon: SailPoint.getRelativeUrl('/images/icons/table.png'),
        text: '#{msgs.process_instrumentation_view_executions}',
        handler: function(item, eventObj) {
            var currentParams = item.parentMenu.currentParams;
            var executionsPanel = SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationExecutionsPanel();
            executionsPanel.update(currentParams);
        }
    },{
        icon: SailPoint.getRelativeUrl('/images/icons/table_multiple.png'),
        text: '#{msgs.process_instrumentation_view_step_overview}',
        handler: function(item, eventObj) {
            var currentParams = item.parentMenu.currentParams;
            var stepOverviewPanel = SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationStepOverviewPanel();
            stepOverviewPanel.update(currentParams);
        }
    },{
        icon: SailPoint.getRelativeUrl('/images/icons/application_form_edit.png'),
        text: '#{msgs.process_instrumentation_edit_process}',
        handler: function(item, eventObj) {
            $('processMetricsEditForm:processToEdit').value = item.parentMenu.currentParams.process;
            $('processMetricsEditForm:editProcess').click();
        }        
    }]
});

SailPoint.ProcessInstrumentation.Search.displayStepInfoMenu = function(stepInfoParams, eventObj) {
//    SailPoint.ProcessInstrumentation.Search.displayStepInfoMenu(grid, stepInfoParams, e);
    var menu = Ext.menu.MenuMgr.get('stepInfoMenu');
    if (!menu) {
        menu = new SailPoint.ProcessInstrumentation.Search.StepInfoMenu({id: 'stepInfoMenu'});
    }
    // Hack alert!!!  We're using the menu object to store state information so that the 
    // event that gets fired when a selection is made can have ready access to the state
    menu.currentParams = stepInfoParams;
    menu.showAt(eventObj.getXY());
};

Ext.define('SailPoint.ProcessInstrumentation.Search.StepInfoMenu', {
	extend : 'Ext.menu.Menu',
    items: [{
        style: 'font-weight:bold; color:#FFFFFF',
        disabled: true,
        disabledClass: 'x-grid-header',
        cls: 'x-grid-header', 
        text: '#{msgs.process_instrumentation_step_info}'
    },{
        icon: SailPoint.getRelativeUrl('/images/icons/table.png'),
        text: '#{msgs.process_instrumentation_view_participants}',
        handler: function(item, eventObj) {
            var currentParams = item.parentMenu.currentParams;
            var stepExecutorsPanel = SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationStepExecutorsPanel();
//            var stepOverviewParams = grid.getStore().getProxy().extraParams;
//            var stepExecutorParams = {stepName: Ext.util.Format.htmlDecode(record.data['stepName'])};
//            Ext.apply(stepExecutorParams, stepOverviewParams);
//            stepExecutorsPanel.update(stepExecutorParams);            
            stepExecutorsPanel.update(currentParams);
        }
    },{
        icon: SailPoint.getRelativeUrl('/images/icons/table_multiple.png'),
        text: '#{msgs.process_instrumentation_view_approval_overview}',
        handler: function(item, eventObj) {
            var currentParams = item.parentMenu.currentParams;
            var approvalOverviewPanel = SailPoint.ProcessInstrumentation.Search.getProcessInstrumentationApprovalOverviewPanel();
            approvalOverviewPanel.update(currentParams);
        }
    }]
});

SailPoint.ProcessInstrumentation.Search.RESULTS_FILTER_TEMPLATE = new Ext.XTemplate(
    '<table><tbody>',
      '<tpl if="hasName">',
        '<tr>',
          '<td>#{msgs.label_name}</td>',
          '<td>{name}</td>',
        '</tr>',
      '</tpl>',
      '<tpl if="hasParticipants">',
        '<tr>',
          '<td>#{msgs.process_instrumentation_search_containing_participants}</td>',
          '<td>',
            '<tpl for="participants">',
              '<div>{.}</div>',
            '</tpl>',
          '</td>',
        '</tr>',
      '</tpl>',
      '<tpl if="hasActiveDates">',
        '<tpl if="hasStartDate &amp;&amp; hasEndDate">',
          '<tr>',
            '<td>#{msgs.process_instrumentation_search_result_active_during}</td>',
            '<td>{startDate} - {endDate}</td>',
          '</tr>',
        '</tpl>',
        '<tpl if="hasStartDate &amp;&amp; !hasEndDate">',
          '<tr>',
            '<td>#{msgs.process_instrumentation_search_result_active_after}</td>',
            '<td>{startDate}</td>',
          '</tr>',
        '</tpl>',
        '<tpl if="!hasStartDate &amp;&amp; hasEndDate">',
          '<tr>',
            '<td>#{msgs.process_instrumentation_search_result_active_before}</td>',
            '<td>{endDate}</td>',
          '</tr>',
        '</tpl>',
      '</tpl>',
      '<tpl if="hasExecutionTime">',
        '<tr>',
          '<td colspan="2">{executionTime}</td>',
        '</tr>',
      '</tpl>',
      '<tpl if="hasResultStatus">',
        '<tr>',
          '<td>#{msgs.process_instrumentation_result_status}</td>',
          '<td>{resultStatus}</td>',
        '</tr>',
      '</tpl>',
    '</tbody></table>'
);

SailPoint.ProcessInstrumentation.Search.EXECUTIONS_FILTER_TEMPLATE = new Ext.XTemplate(
    '<table><tbody>',
      '<tpl if="hasName">',
        '<tr>',
          '<td>#{msgs.label_name}</td>',
          '<td>{name}</td>',
        '</tr>',
      '</tpl>',
      '<tpl if="hasParticipants">',
        '<tr>',
          '<td>#{msgs.process_instrumentation_search_containing_participants}</td>',
          '<td>',
            '<tpl for="participants">',
              '<div>{.}</div>',
            '</tpl>',
          '</td>',
        '</tr>',
      '</tpl>',
      '<tpl if="hasActiveDates">',
        '<tr>',
          '<td>#{msgs.process_instrumentation_search_result_active_during}</td>',
          '<td>{startDate} - {endDate}</td>',
        '</tr>',
      '</tpl>',
      '<tpl if="hasResultStatus">',
        '<tr>',
          '<td>#{msgs.process_instrumentation_result_status}</td>',
          '<td>{resultStatus}</td>',
        '</tr>',
      '</tpl>',
    '</tbody></table>'
);

SailPoint.ProcessInstrumentation.Search.SEARCH_RESULTS_BREADCRUMBS_TEMPLATE = new Ext.Template(
    '<div style="padding:4px">',
      '<span style="text-decoration:underline; color:#037da1; cursor:pointer" onclick="Ext.getCmp(\'processInstrumentationSearchPanel\').getLayout().setActiveItem(\'processInstrumentationSearchContents\');">',
        '#{msgs.process_instrumentation_search}',
      '</span> &nbsp;',
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '&nbsp; #{msgs.process_instrumentation_search_results}',
    '</div>'    
);

SailPoint.ProcessInstrumentation.Search.EXECUTIONS_BREADCRUMBS_TEMPLATE = new Ext.Template(
  '<div style="padding:4px">',
    '<span style="text-decoration:underline; color:#037da1; cursor:pointer" onclick="Ext.getCmp(\'processInstrumentationSearchPanel\').getLayout().setActiveItem(\'processInstrumentationSearchContents\');">',
      '#{msgs.process_instrumentation_search}',
    '</span> &nbsp;',
    '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
    '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
    '&nbsp; <span style="text-decoration:underline; color:#037da1; cursor:pointer" onclick="Ext.getCmp(\'processInstrumentationSearchPanel\').getLayout().setActiveItem(\'processInstrumentationSearchResults\');">',
      '#{msgs.process_instrumentation_search_results}',
    '</span> &nbsp;', 
    '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
    '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
    '&nbsp; {executionsDescription}',
  '</div>'    
);

SailPoint.ProcessInstrumentation.Search.STEP_OVERVIEW_BREADCRUMBS_TEMPLATE = new Ext.Template(
    '<div style="padding:4px">',
      '<span style="text-decoration:underline; color:#037da1; cursor:pointer" onclick="Ext.getCmp(\'processInstrumentationSearchPanel\').getLayout().setActiveItem(\'processInstrumentationSearchContents\');">',
        '#{msgs.process_instrumentation_search}',
      '</span> &nbsp;',
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '&nbsp; <span style="text-decoration:underline; color:#037da1; cursor:pointer" onclick="Ext.getCmp(\'processInstrumentationSearchPanel\').getLayout().setActiveItem(\'processInstrumentationSearchResults\');">',
        '#{msgs.process_instrumentation_search_results}',
      '</span> &nbsp;', 
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '&nbsp; {stepOverviewDescription}',
    '</div>'
);

SailPoint.ProcessInstrumentation.Search.STEP_DETAILS_BREADCRUMBS_TEMPLATE = new Ext.Template(
    '<div style="padding:4px">',
      '<span style="text-decoration:underline; color:#037da1; cursor:pointer" onclick="Ext.getCmp(\'processInstrumentationSearchPanel\').getLayout().setActiveItem(\'processInstrumentationSearchContents\');">',
        '#{msgs.process_instrumentation_search}',
      '</span> &nbsp;',
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '&nbsp; <span style="text-decoration:underline; color:#037da1; cursor:pointer" onclick="Ext.getCmp(\'processInstrumentationSearchPanel\').getLayout().setActiveItem(\'processInstrumentationSearchResults\');">',
        '#{msgs.process_instrumentation_search_results}',
      '</span> &nbsp;', 
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '&nbsp;  <span style="text-decoration:underline; color:#037da1; cursor:pointer" onclick="Ext.getCmp(\'processInstrumentationSearchPanel\').getLayout().setActiveItem(\'processInstrumentationExecutions\');">',
        '{executionsDescription}',
      '</span> &nbsp;',
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '&nbsp; {stepDetailsDescription}',
    '</div>'    
);

SailPoint.ProcessInstrumentation.Search.STEP_EXECUTORS_FILTER_TEMPLATE = new Ext.XTemplate(
    '<table><tbody>',
    '<tpl if="hasParticipants">',
      '<tr>',
        '<td>#{msgs.process_instrumentation_search_containing_participants}</td>',
        '<td>',
          '<tpl for="participants">',
            '<div>{.}</div>',
          '</tpl>',
        '</td>',
      '</tr>',
    '</tpl>',
    '<tpl if="hasActiveDates">',
      '<tr>',
        '<td>#{msgs.process_instrumentation_search_result_active_during}</td>',
        '<td>{startDate} - {endDate}</td>',
      '</tr>',
    '</tpl>',
    '</tbody></table>'
);

SailPoint.ProcessInstrumentation.Search.STEP_EXECUTORS_BREADCRUMBS_TEMPLATE = new Ext.Template(
    '<div style="padding:4px">',
      '<span style="text-decoration:underline; color:#037da1; cursor:pointer" onclick="Ext.getCmp(\'processInstrumentationSearchPanel\').getLayout().setActiveItem(\'processInstrumentationSearchContents\');">',
        '#{msgs.process_instrumentation_search}',
      '</span> &nbsp;',
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '&nbsp; <span style="text-decoration:underline; color:#037da1; cursor:pointer" onclick="Ext.getCmp(\'processInstrumentationSearchPanel\').getLayout().setActiveItem(\'processInstrumentationSearchResults\');">',
        '#{msgs.process_instrumentation_search_results}',
      '</span> &nbsp;', 
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '&nbsp; <span style="text-decoration:underline; color:#037da1; cursor:pointer" onclick="Ext.getCmp(\'processInstrumentationSearchPanel\').getLayout().setActiveItem(\'processInstrumentationStepOverview\');">',
        '{stepOverviewDescription}',
      '</span> &nbsp;',
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
      '&nbsp; {stepExecutorsDescription}',
    '</div>'
);

SailPoint.ProcessInstrumentation.Search.APPROVAL_OVERVIEW_BREADCRUMBS_TEMPLATE = new Ext.Template(
        '<div style="padding:4px">',
        '<span style="text-decoration:underline; color:#037da1; cursor:pointer" onclick="Ext.getCmp(\'processInstrumentationSearchPanel\').getLayout().setActiveItem(\'processInstrumentationSearchContents\');">',
          '#{msgs.process_instrumentation_search}',
        '</span> &nbsp;',
        '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
        '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
        '&nbsp; <span style="text-decoration:underline; color:#037da1; cursor:pointer" onclick="Ext.getCmp(\'processInstrumentationSearchPanel\').getLayout().setActiveItem(\'processInstrumentationSearchResults\');">',
          '#{msgs.process_instrumentation_search_results}',
        '</span> &nbsp;', 
        '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
        '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
        '&nbsp; <span style="text-decoration:underline; color:#037da1; cursor:pointer" onclick="Ext.getCmp(\'processInstrumentationSearchPanel\').getLayout().setActiveItem(\'processInstrumentationStepOverview\');">',
          '{stepOverviewDescription}',
        '</span> &nbsp;',
        '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
        '<img alt="" src="' + SailPoint.getRelativeUrl('/images/icons/arrow_right_transparent.png') + '"/>',
        '&nbsp; {approvalOverviewDescription}',
      '</div>'
  );

SailPoint.ProcessInstrumentation.Search.HISTORY_TEMPLATE = new Ext.Template(
    '<div id="{type}HistoryContents">', 
      '<div id="{type}HistoryBreadcrumbs"></div>',
      '<div id="{type}FilterWrapper" class="spBackground">', 
        '<div id="{type}FilterContents" class="spContent">',
          '<table style="border:none" class="spTable">',
            '<tbody><tr>',
              '<td style="valign: center">',
                '<span class="spContentTitle">#{msgs.label_filter}</span>',
              '</td>',
              '<td>',
                '<div id="{type}FilterString"/>',
              '</td>',
            '</tr></tbody>',
          '</table>',
        '</div>',
      '</div>',
    '</div>'
);

Ext.define('SailPoint.ProcessInstrumentation.Search.ResultsGrid', {
	extend : 'SailPoint.grid.PagingGrid',
    constructor: function(config) {
        this.timeSelector = config.timeSelector;
        this.callParent(arguments);
    },
    
    changeTimeUnitSelection: function(combo, record, index) {
        var selection = record[0].data.val;
        var gridStore = this.getStore();
        var loadOptions = gridStore.getProxy().extraParams;
        if (!loadOptions) {
            loadOptions = {};
        }
        Ext.apply(loadOptions, {timeUnits: selection});
        gridStore.getProxy().extraParams = loadOptions;
        gridStore.load();
    },
    
    initUnits: function(store, records, success, options) {
        // Find out the selector option that we should use and apply it to all the headers
        var params = store.getProxy().extraParams;
    	if (params && params.timeUnits) {
    		this.timeSelector.setValue(params.timeUnits);
    	}
    }
});

Ext.define('SailPoint.ProcessInstrumentation.Search.DetailsPanel', {
	extend : 'Ext.panel.Panel',
    constructor: function(config) {
        this.grid = config.grid;
        this.url = config.url;
        this.filterInfoTemplate = config.filterInfoTemplate;
        this.breadcrumbsTemplate = config.breadcrumbsTemplate;
        this.type = config.type;        
        Ext.apply(config, {
            items: [
                Ext.create('Ext.panel.Panel', {
                    id: config.id + 'History',
                    layout: 'fit',
                    region: 'north',
                    html: SailPoint.ProcessInstrumentation.Search.HISTORY_TEMPLATE.apply({type: config.type})
                }),
                config.grid
            ]
        });
        
        this.callParent(arguments);
    },

    update: function(params) {
        var loadParams = {
            url: this.url,
            discardUrl: false,
            nocache: false,
            text: '#{msgs.loading_data}',
            timeout: 30,
            params: {
                limit: this.pageSize,
                start: 0
            },
            callback: this.postUpdate,
            scope: this
        };
        
        if (params) {
            // Update the baseParams so that refreshes and sorts don't wipe out the time settings
            this.grid.getStore().getProxy().extraParams = params;
        }
        this.grid.getStore().load(loadParams);
    },
    
    postUpdate: function(records, options, success) {
        // Resend the options that were used to update the grid and tack on 
        // additional information to indicate that we want a filter for process executions
        
        var params  = {type: this.type};
        Ext.apply(params, options.params);
        Ext.Ajax.request({
            url: SailPoint.getRelativeUrl('/analyze/process/processInstrumentationSearchFilterString.json'),
            params: params,
            callback: function(options, success, response) {
                var historyPanel = Ext.getCmp(this.id + 'History');
                var filterInfo = JSON.parse(response.responseText);
                var filterContentWrapper;
//                SailPoint.ProcessInstrumentation.Search.EXECUTIONS_FILTER_TEMPLATE.overwrite('processInstrumentationExecutionsFilterString', executionsInfo);
//                SailPoint.ProcessInstrumentation.Search.EXECUTIONS_DESCRIPTION_TEMPLATE.overwrite('executionsDescription', executionsInfo);

                if (this.filterInfoTemplate) {
                    this.filterInfoTemplate.overwrite(this.type + 'FilterString', filterInfo);
                } else {
                    // Don't show a filter if there isn't one
                    filterContentWrapper = Ext.get(this.type + 'FilterWrapper');
                    filterContentWrapper.setVisibilityMode(Ext.Element.DISPLAY);
                    filterContentWrapper.setVisible(false);
                }
                
                if (this.breadcrumbsTemplate) {
                    this.breadcrumbsTemplate.overwrite(this.type + 'HistoryBreadcrumbs', filterInfo);
                }
                
                Ext.getCmp('processInstrumentationSearchPanel').getLayout().setActiveItem(this.id);
                // Update the height of the history panel to account for changed parameters between searches
                historyPanel.setHeight(Ext.get(this.type + 'HistoryContents').getHeight());
                historyPanel.doLayout();
                Ext.getCmp('processInstrumentationSearchPanel').doLayout();
            },
            scope: this
        }); 
    }
});

