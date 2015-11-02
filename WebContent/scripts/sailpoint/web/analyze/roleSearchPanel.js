/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Role', 
       'SailPoint.Role.Search',
       'SailPoint.Analyze', 
       'SailPoint.Analyze.Role');

SailPoint.Role.Search.getRoleSearchPanel = function(config) {
    var activeItem = 'roleSearchContents';
    if (config.activeCard) {
        activeItem = config.activeCard;
    }
    
    var searchContents = {
        xtype : 'sptabcontentpanel',
        id: 'roleSearchContents',
        layout: 'fit',
        contentEl: 'roleSearchContentsDiv',
        border: false,
        autoScroll: true,
        bbar: [{
            id: 'preRoleSearchBtn',
            text: '#{msgs.button_run_search}',
            cls : 'primaryBtn',
            handler: function() {
                SailPoint.Analyze.validateSearch('roleSearchForm', 'role');
            }
        }, {
            id: 'roleClearBtn',
            text: '#{msgs.button_clear_search}',
            handler: function() {
                $('roleSearchForm:resetBtn').click()
            }
        }],
        loader: {
        	url: SailPoint.getRelativeUrl('/define/roles/search/roleSearchContentPanel.jsf'),
            params: { searchType: 'Role' },
            discardUrl: false,
            callback: SailPoint.Role.Search.initSearchContents,
            nocache: false,
            text: '#{msgs.loading_data}',
            timeout: 30,
            scripts: true
        }
    };

    var resultsContents = SailPoint.Search.getResultsGrid({
        id: 'roleSearchResultsGrid',
        type: 'role',
        stateful: true,
        stateId: SailPoint.Analyze.gridStateIds.get('Role'),
        url: SailPoint.getRelativeUrl('/analyze/role/roleDataSource.json'),
        pageSize: SailPoint.Analyze.defaultResultsPageSize,
        handleClick: SailPoint.Role.Search.handleClick,
        optionsPlugin: SailPoint.Search.getOptionsPlugin({
            searchType: 'Role',
            cardPanelId: 'roleSearchPanel',
            searchPanelId: 'roleSearchContents',
            applySearchPanelStyles: function() {
                resizeTables('roleSearchForm');
                Ext.getCmp('roleSearchContents').doLayout();
                Ext.getCmp('roleDisplayFieldsPanel').doLayout();
            },
            options: [
                ['saveOrUpdate', '#{msgs.save_search}'],
                ['saveAsReport', '#{msgs.save_search_as_report}']
            ]
        })
    });
    
    resultsContents.on('afterlayout', function(contentPanel, layout) {
        SailPoint.Role.Search.styleResultsGrid();
    });
    
    var searchPanel = {
        xtype : 'panel',
        id: config.id,
        title: config.title,
        headerAsText: false,
        header: false,
        layout: 'card',
        activeItem: activeItem,
        items: [searchContents, resultsContents],
        listeners : {
            activate : {
                fn : function(viewerPanel) {
                    if (!searchPanel.isLoaded) {
                        Ext.getCmp('roleSearchContents').getLoader().load();
                        SailPoint.Role.Search.initResultsGrid();
                        Ext.getCmp(config.id).isLoaded = true;
                    }
                },
                scope : this,
                single : true
            }
        }
    };
    
    return searchPanel;
};

SailPoint.Role.Search.displaySearchResults = function() {
    var searchPanel = Ext.getCmp('roleSearchPanel');
    searchPanel.getLayout().setActiveItem('roleSearchResultsGridWrapper');
    searchPanel.doLayout();
    if (Ext.isGecko) {
        Ext.getCmp('roleSearchResultsGrid').getView().refresh();
    }
    Ext.MessageBox.hide();
};

SailPoint.Role.Search.displaySearchContents = function() {
    var searchPanel = Ext.getCmp('roleSearchPanel');
    searchPanel.getLayout().setActiveItem('roleSearchContents');
};

SailPoint.Role.Search.initResultsGrid = function() {
    SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/role/roleDataSource.json'), 'roleSearchResultsGrid', 13, true);
};

SailPoint.Role.Search.styleResultsGrid = function() {
    var gridPanel = Ext.getCmp('roleSearchResultsGrid');
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

SailPoint.Role.Search.initSearchContents = function() {
    SailPoint.Analyze.Role.initializeAttributes();
    SailPoint.Analyze.SearchDisplayFields.initDisplayFields('role');
    SailPoint.Role.Search.styleSearchPanels();
    SailPoint.Analyze.registerSubmits({
        className: 'searchInputText',
        container: $('roleSearchCriteriaContent'),
        eventHandler: SailPoint.Analyze.submitEventHandler,
        options: {
            formName: 'roleSearchForm',
            searchType: 'Role'
        }
    });
    Ext.MessageBox.hide();
};

SailPoint.Role.Search.styleSearchPanels = function() {
    resizeTables('roleSearchForm');
    buildTooltips($('roleSearchCriteriaContent'));    
    Ext.getCmp('roleSearchContents').doLayout();
};

SailPoint.Role.Search.styleResultsPanels = function() {
    if (Ext.isIE7) {
        var tabPanel = Ext.getCmp('roleTabPanel');
        var resultsHeader = Ext.get('roleSearchResultsHeader');
        var resultsContent = Ext.get(Ext.DomQuery.selectNode('div[class*=spBackground]', $('roleResultsForm')));
        var resultsFooter = Ext.get('roleSearchResultsFooter');
        var width = tabPanel.getWidth();
        resultsHeader.setWidth(width);
        resultsContent.setWidth(width);
        resultsFooter.setWidth(width);
    }
};

SailPoint.Role.Search.clearSearchFields = function() {
    var formName = 'roleSearchForm';
    Ext.getCmp('roleAttributesOwnerSuggest').clearValue();
    $('roleOwner').value = '';
    SailPoint.Analyze.clearExtendedAttributeFields('roleAttributes');
    SailPoint.Analyze.resetFieldsToDisplay('role');
    
    //clears out the value of the extended identity attributes
    var cells = Ext.query(".searchIdentitySuggestCell");
    for (var cell in cells){
        var element=Ext.get(cells[cell]);
        if (element){
            var id = element.child('div').getAttribute('id') + "Input";
            if(id){
               $(id).value = ''; 
            }
        }
    }
};

SailPoint.Role.Search.handleClick = function(gridView, record, HTMLitem, index, e, eOpts){
    //gridView.clickedColumn is calculated in PagingGrid.js using a deprecated cellclick event
    //We may need to rethink this
    var col = gridView.getHeaderCt().getHeaderAtIndex(gridView.clickedColumn).dataIndex;
    var resultGrid = gridView.findParentByType('grid');
    resultGrid.gridState._setValue('pageSize', resultGrid.pageSize);
    if(col) {
        if(Ext.getCmp('roleTabPanel')) {
            $('roleSearchForm:currentObjectId').value = record.getId();
            $('ajaxEditButton').click();
        } else {
            $('roleSearchForm:currentObjectId').value = record.getId();
            $('roleSearchForm:editButton').click();
        }
    } else {
        e.stopEvent();
    }
};


/** 
 * 
 * ANALYZE STUFF 
 * 
 * **/
SailPoint.Analyze.Role.validateSearch = function(formName) {
  var errors = [];
  var isValid = true;
  
  /** Validate Dates **/
  if($('roleStartDateSelect').checked) {
    isValid &= Validator.validateInputDate(formName+':roleStartDate', '');
  }
  if($('roleEndDateSelect').checked) {
    isValid &= Validator.validateInputDate(formName+':roleEndDate', '');
  }
  
  if($('roleStartDateSelect').checked && $('roleEndDateSelect').checked) {
    isValid &= Validator.validateStartEndDates(formName+':roleStartDate', formName+':roleEndDate', '#{msgs.err_invalid_start_end_date}')
  }
  
  if (!isValid) {
    errors = Validator.getErrors();
    Validator.clearErrors();
  }
  
  return errors;
};

SailPoint.Analyze.Role.initializeAttributes = function() {
  var ownerSuggest = Ext.getCmp('roleAttributesOwnerSuggest');
  if (ownerSuggest) {
      ownerSuggest.destroy();
  }

  ownerSuggest = new SailPoint.IdentitySuggest({
      id: 'roleAttributesOwnerSuggest',
      renderTo: 'roleOwnerSuggestDiv',
      binding: 'roleOwner',
      nameLookup: $('roleSearchInitialOwnerVal').innerHTML,
      valueField: 'name',
      baseParams: {context: 'Owner'},
      width: 200,
      listConfig : {width : 300}
  });
  
  /*For the clear Extended attributes to work on the identity Suggest, the Div must end in Suggest, 
  The Input must end in the div (id + 'Input'), and id must end in the Div (Id + 'Cmp') */
  var cells = Ext.query(".searchIdentitySuggestCell");
  for (var cell in cells){
      var element=Ext.get(cells[cell]);
      if (element){
          var id = element.child('div').getAttribute('id');
          var identitySuggest = Ext.getCmp(id + 'Cmp');
          if (identitySuggest) {
              identitySuggest.destroy();
          }   
      
          identitySuggest = new SailPoint.IdentitySuggest({
              id: id  + 'Cmp',
              renderTo: id,
              binding: id + 'Input',
              valueField:'name',
              baseParams: {context: 'Owner'},
              width: 200,
              listConfig : {width : 300}
          });
      }
  }
    
  var dateFields = $$('input.hiddenDateType');
  if(dateFields.length>0) {
      for(i=0; i<dateFields.length; i++) {
    
          if(dateFields[i].value != 'None') {
              /** Trim "roleSearchForm:" **/
              var start = 15;
              var id = dateFields[i].id.substring(start, dateFields[i].id.indexOf('Type'));
              var checkBox = $(id+'Select');
              checkBox.checked = true;
              toggleDisplay($(id+'Div'), !(checkBox.checked));
          }      
      }
  }

  var checkBox = $('roleStartDateSelect');
  if($('roleSearchForm:roleStartDateType').value != 'None') {
      checkBox.checked = true;
  }
  toggleDisplay($('roleStartDateDiv'), !(checkBox.checked));


  var checkBox2 = $('roleEndDateSelect');
  if($('roleSearchForm:roleEndDateType').value != 'None') {
      checkBox2.checked = true;
  }
  toggleDisplay($('roleEndDateDiv'), !(checkBox2.checked));  

  SailPoint.Analyze.initializeSubmit('roleSearchForm', 'preRoleSearchBtn');    
};

SailPoint.Analyze.Role.finishRerender = function() {
  resizeTables('roleSearchForm');
  SailPoint.Analyze.Role.initializeAttributes();
};

SailPoint.Analyze.Role.renderDescription = function(value, p, r) {
    // Descriptions may contain HTML.  The default column renderer HTML encodes
    // values, which causes them to show up as the actual tags.  Just return the
    // value to disable HTML encoding.
    return value;
};
