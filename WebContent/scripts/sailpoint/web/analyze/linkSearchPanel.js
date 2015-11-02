/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Link', 
       'SailPoint.Link.Search',
       'SailPoint.Analyze', 
       'SailPoint.Analyze.Link');

SailPoint.Link.Search.getLinkSearchPanel = function(config) {
    var activeItem = 'linkSearchContents';
    if (config.activeCard) {
        activeItem = config.activeCard;
    }

    var searchContents = Ext.create('Ext.panel.Panel', {
        id: 'linkSearchContents',
        layout: 'fit',
        contentEl: 'linkSearchContentsDiv',
        border: false,
        autoScroll: true,
        bbar: [{
            id: 'preLinkSearchBtn',
            text: '#{msgs.button_run_search}',
            cls : 'primaryBtn',
            handler: function() {
                var searchPanel = Ext.getCmp('linkSearchPanel');
                searchPanel.validationErrors = SailPoint.Analyze.validateSearch('linkSearchForm', 'link'); 
            }
        }, {
            id: 'linkClearBtn',
            text: '#{msgs.button_clear_search}',
            handler: function() {
                $('linkSearchForm:resetBtn').click()
            }
        }],
        loader: {
            url: SailPoint.getRelativeUrl('/analyze/link/linkSearchContents.jsf'),
            params: { searchType: 'Link' },
            discardUrl: false,
            callback: SailPoint.Link.Search.finishInit,
            nocache: false,
            text: '#{msgs.loading_data}',
            timeout: 30,
            scripts: true
        }
    });

    var resultsContents = SailPoint.Search.getResultsGrid({
        id: 'linkSearchResultsGrid',
        type: 'Link',
        stateful: true,
        stateId: SailPoint.Analyze.gridStateIds.get('Link'),        
        url: SailPoint.getRelativeUrl('/analyze/link/linkDataSource.json'),
        pageSize: SailPoint.Analyze.defaultResultsPageSize,
        optionsPlugin: SailPoint.Search.getOptionsPlugin({
            searchType: 'Link',
            cardPanelId: 'linkSearchPanel',
            searchPanelId: 'linkSearchContents',
            applySearchPanelStyles: SailPoint.Link.Search.styleSearchPanels,
            options: [
                      ['saveOrUpdate', '#{msgs.save_search}'],
                      ['saveAsReport', '#{msgs.save_search_as_report}']
                  ]
        })
    });

    resultsContents.on('afterlayout', function(contentPanel, layout) {
        SailPoint.Link.Search.styleResultsGrid();
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

            SailPoint.Link.Search.initResultsGrid();
            searchPanel.isLoaded = true;
        }
    },{
        single: true,
        scope: this
    });

    return searchPanel;
};

/**
 * Initialize account tab page
 */
SailPoint.Link.Search.finishInit = function() {
    SailPoint.Analyze.Link.initializeAttributes();
    var accordion = Ext.getCmp('linkFieldsAccordion');
    if (!accordion) {
        var linkFields = [];
        if ($('linkFieldsTab')) {
            linkFields.push(Ext.create('Ext.panel.Panel', {
                id: 'linkFieldsPanel',
                collapsible: false,
                hideCollapseTool: true,
                contentEl: 'linkFieldsTab',
                title: '#{msgs.link_fields}'
            }));
        }

        accordion = new Ext.Panel({
            id: 'linkFieldsAccordion',
            layout: {
                type: 'accordion',
                titleCollapse: false,
                fill: false
            },
            renderTo: 'linkFieldAccordionDiv',
            items: linkFields
        });
    }

    SailPoint.Link.Search.styleSearchPanels();

    buildTooltips($('linkSearchCriteria'));

    var submitOnEnter = new SailPoint.SubmitOnEnter("preLinkSearchBtn");
    var textFields = document.getElementsByClassName('searchInputText','attributes');
    textFields.each(function (textField) {
        submitOnEnter.registerTextField(textField);
    });

    SailPoint.Analyze.registerSubmits({
        className: 'searchInputText',
        container: $('linkSearchCriteria'),
        eventHandler: SailPoint.Analyze.submitEventHandler,
        options: {
            formName: 'linkSearchForm',
            searchType: 'Link'
        }
    });

    Ext.MessageBox.hide();
}

SailPoint.Link.Search.styleSearchPanels = function() {
    resizeTables('linkSearchForm');
    Ext.getCmp('linkSearchContents').doLayout();
    Ext.getCmp('linkFieldsAccordion').doLayout();

}

SailPoint.Link.Search.styleResultsPanels = function() {}

SailPoint.Link.Search.styleResultsGrid = function() {
    var gridPanel = Ext.getCmp('linkSearchResultsGrid');
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

SailPoint.Link.Search.initResultsGrid = function() {
    SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/link/linkDataSource.json'), 'linkSearchResultsGrid', 13, true);
};

/**
 * Initialize account tab search criteria attributes
 */
SailPoint.Analyze.Link.initializeAttributes = function() {
    var linkApplicationSuggest = Ext.getCmp('linkApplicationSuggestCmp');
    var linkApplicationVal = $('linkApplicationVal').innerHTML;

    if (linkApplicationSuggest) {
        linkApplicationSuggest.destroy();
    }  
    linkApplicationSuggest = new SailPoint.DistinctRestSuggest({
      id: 'linkApplicationSuggestCmp',
      renderTo: 'linkApplicationSuggest',
      binding: 'linkApplication',
      value: linkApplicationVal,
      valueField: 'displayName',
      width: 200,
      freeText: true,
      className: 'Application',
      column: 'name',
      listConfig : {width : 300}
    });

    var linkOwnerSuggest = Ext.getCmp('linkOwnerSuggestCmp');
    var linkOwnerVal = $('linkOwnerVal').innerHTML;
    
    if (linkOwnerSuggest) {
        linkOwnerSuggest.destroy();
    }  
    linkOwnerSuggest = new SailPoint.IdentitySuggest({
      id: 'linkOwnerSuggestCmp',
      renderTo: 'linkOwnerSuggest',
      binding: 'linkOwner',
      value: linkOwnerVal,
      valueField: 'displayName',
      width: 200,
      freeText: true,
      className: 'Identity',
      column: 'name',
      listConfig : {width : 300}
    });

    var linkNativeIdentitySuggest = Ext.getCmp('linkNativeIdentitySuggestCmp');
    var linkNativeIdentityVal = $('linkNativeIdentityVal').innerHTML;
    
    if (linkNativeIdentitySuggest) {
        linkNativeIdentitySuggest.destroy();
    }  
    linkNativeIdentitySuggest = new SailPoint.DistinctRestSuggest({
      id: 'linkNativeIdentitySuggestCmp',
      renderTo: 'linkNativeIdentitySuggest',
      binding: 'linkNativeIdentity',
      value: linkNativeIdentityVal,
      valueField: 'displayName',
      width: 200,
      freeText: true,
      className: 'Link',
      column: 'nativeIdentity',
      listConfig : {width : 300}
    });

    var linkInstanceSuggest = Ext.getCmp('linkInstanceSuggestCmp');
    var linkInstanceVal = $('linkInstanceVal').innerHTML;
    
    if (linkInstanceSuggest) {
        linkInstanceSuggest.destroy();
    }  
    linkInstanceSuggest = new SailPoint.DistinctRestSuggest({
      id: 'linkInstanceSuggestCmp',
      renderTo: 'linkInstanceSuggest',
      binding: 'linkInstance',
      value: linkInstanceVal,
      valueField: 'displayName',
      width: 200,
      freeText: true,
      className: 'Link',
      column: 'instance',
      listConfig : {width : 300}
    });

    SailPoint.Analyze.initializeSubmit('linkSearchForm', 'preLinkSearchBtn');
};

SailPoint.Link.Search.displaySearchResults = function() {
    var searchPanel = Ext.getCmp('linkSearchPanel');
    searchPanel.getLayout().setActiveItem('linkSearchResultsGridWrapper');
    searchPanel.doLayout();
    if (Ext.isGecko) {
        Ext.getCmp('linkSearchResultsGrid').getView().refresh();
    }
    Ext.MessageBox.hide();
    // We're not keeping track of the card panel anymore
    // $('stateForm:searchType').value = 'Link';
    // $('stateForm:currentCardPanel').value = 'linkSearchResultsGrid';
    // $('stateForm:updatePanelStateBtn').click();
};

SailPoint.Link.Search.displaySearchContents = function() {
    var searchPanel = Ext.getCmp('linkSearchPanel');
    searchPanel.getLayout().setActiveItem('linkSearchContents');
    // We're not keeping track of the card panel anymore
    // $('stateForm:searchType').value = 'Link';
    // $('stateForm:currentCardPanel').value = 'linkSearchContents';
    // $('stateForm:updatePanelStateBtn').click();
};

/**
 * Clear search criteria fields
 */
SailPoint.Link.Search.clearSearchFields = function() {
    var formName = 'linkSearchForm';

    var linkApplicationSuggest = Ext.getCmp('linkApplicationSuggestCmp');
    if (linkApplicationSuggest) {
        linkApplicationSuggest.clearValue();
        $('linkApplication').value = '';
    }

    $('linkSearchForm:linkDisplayName').value = '';

    var linkOwnerSuggest = Ext.getCmp('linkOwnerSuggestCmp');
    if (linkOwnerSuggest) {
        linkOwnerSuggest.clearValue();
        $('linkOwner').value = '';
    }

    var linkNativeIdentitySuggest = Ext.getCmp('linkNativeIdentitySuggestCmp');
    if (linkNativeIdentitySuggest) {
        linkNativeIdentitySuggest.clearValue();
        $('linkNativeIdentity').value = '';
    }

    var linkInstanceSuggest = Ext.getCmp('linkInstanceSuggestCmp');
    if (linkInstanceSuggest) {
        linkInstanceSuggest.clearValue();
        $('linkInstanceVal').value = '';
    }
 
    SailPoint.Analyze.Link.initializeAttributes();
    SailPoint.Analyze.resetFieldsToDisplay('link');
};

SailPoint.Analyze.Link.finishRerender = function() {
    resizeTables('linkSearchForm');
    SailPoint.Analyze.Link.initializeAttributes();
};