/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Certification', 
       'SailPoint.Certification.Search',
       'SailPoint.Analyze', 
       'SailPoint.Analyze.Certification');

SailPoint.Certification.Search.getCertificationSearchPanel = function(config) {
    var activeItem = 'certificationSearchContents';
    if (config.activeCard) {
        activeItem = config.activeCard;
    }
    
    var searchContents = Ext.create('Ext.panel.Panel', {
        id: 'certificationSearchContents',
        layout: 'fit',
        contentEl: 'certificationSearchContentsDiv',
        border: false,
        autoScroll: true,
        bbar: [{
            id: 'preCertificationSearchBtn',
            text: '#{msgs.button_run_search}',
            cls : 'primaryBtn',
            handler: function() {
                var searchPanel = Ext.getCmp('certificationSearchPanel');
                searchPanel.validationErrors = SailPoint.Analyze.validateSearch('certificationSearchForm', 'certification'); 
            }
        }, {
            id: 'certificationClearBtn',
            text: '#{msgs.button_clear_search}',
            handler: function() {
                $('certificationSearchForm:resetBtn').click();
            }
        }],
        loader: {
            url: SailPoint.getRelativeUrl('/analyze/certification/certificationSearchContents.jsf'),
            params: { searchType: 'Certification' },
            discardUrl: false,
            callback: SailPoint.Certification.Search.finishInit,
            nocache: false,
            text: '#{msgs.loading_data}',
            timeout: 30,
            scripts: true
        }
    });

    var resultsContents = SailPoint.Search.getResultsGrid({
        id: 'certificationSearchResultsGrid',
        type: 'certification',
        stateful: true,
        stateId: SailPoint.Analyze.gridStateIds.get('Certification'),
        url: SailPoint.getRelativeUrl('/analyze/certification/certificationDataSource.json'),
        handleClick: SailPoint.Certification.Search.handleClick,
        contextMenu: SailPoint.Certification.Search.contextMenu,
        pageSize: SailPoint.Analyze.defaultResultsPageSize,
        sorters : [{ property: 'name', direction: 'ASC' }, {property: 'id', direction: 'ASC'}],
        optionsPlugin: SailPoint.Search.getOptionsPlugin({
            searchType: 'Certification',
            cardPanelId: 'certificationSearchPanel',
            searchPanelId: 'certificationSearchContents',
            applySearchPanelStyles: SailPoint.Certification.Search.styleSearchPanels,
            options: [
                ['saveOrUpdate', '#{msgs.save_search}'],
                ['saveAsReport', '#{msgs.save_search_as_report}']
            ]
        })
    });
    
    resultsContents.on('afterlayout', function(contentPanel, layout) {
        SailPoint.Certification.Search.styleResultsGrid();
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
            
            SailPoint.Certification.Search.initResultsGrid();
            searchPanel.isLoaded = true;
        }
    },{
        single: true,
        scope: this
    });
    
    return searchPanel;
};

SailPoint.Certification.Search.displaySearchResults = function() {
    var searchPanel = Ext.getCmp('certificationSearchPanel');
    searchPanel.getLayout().setActiveItem('certificationSearchResultsGridWrapper');
    searchPanel.doLayout();
    if (Ext.isGecko) {
        Ext.getCmp('certificationSearchResultsGrid').getView().refresh();
    }
    Ext.MessageBox.hide();
    // We're not keeping track of the card panel anymore
    // $('stateForm:searchType').value = 'Certification';
    // $('stateForm:currentCardPanel').value = 'certificationSearchResultsGrid';
    // $('stateForm:updatePanelStateBtn').click();
};

SailPoint.Certification.Search.displaySearchContents = function() {
    var searchPanel = Ext.getCmp('certificationSearchPanel');
    searchPanel.getLayout().setActiveItem('certificationSearchContents');
    // We're not keeping track of the card panel anymore
    // $('stateForm:searchType').value = 'Certification';
    // $('stateForm:currentCardPanel').value = 'certificaitonSearchContents';
    // $('stateForm:updatePanelStateBtn').click();
};

SailPoint.Certification.Search.initResultsGrid = function() {
    SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/certification/certificationDataSource.json'), 'certificationSearchResultsGrid', 13, true);
};

SailPoint.Certification.Search.styleResultsGrid = function() {
    var gridPanel = Ext.getCmp('certificationSearchResultsGrid');
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

SailPoint.Certification.Search.finishInit = function() {
    SailPoint.Analyze.Certification.initializeAttributes();
    SailPoint.Analyze.Certification.renderTypeAttributes();
    SailPoint.Analyze.SearchDisplayFields.initDisplayFields('certification');
    SailPoint.Certification.Search.styleSearchPanels();
    SailPoint.Analyze.registerSubmits({
        className: 'searchInputText',
        container: $('certificationSearchCriteria'),
        eventHandler: SailPoint.Analyze.submitEventHandler,
        options: {
            formName: 'certificationSearchForm',
            searchType: 'Certification'
        }
    });
    Ext.getCmp('certificationSearchContents').doLayout();
    Ext.MessageBox.hide();
};

SailPoint.Certification.Search.styleSearchPanels = function() {
    resizeTables('certificationSearchForm');
    buildTooltips($('certificationSearchCriteria'));
    //SailPoint.Analyze.Certification.initializeAttributes();
    
    // When refining search after returning from a selected cert
    // the bottom bar is not displayed unless we sync the size and
    // layout the certificationSearchPanel.
    Ext.getCmp('certificationSearchPanel').doLayout();
    Ext.getCmp('certificationDisplayFieldsPanel').doLayout();
    
    // When refining search after returning from a selected cert
    // the tag filed is not displayed unless we sync the size and
    // layout the tag component.
    Ext.getCmp('tagsMultiSuggestCmp').doLayout();
};

SailPoint.Certification.Search.styleResultsPanels = function() {};

SailPoint.Certification.Search.clearSearchFields = function() {
    var formName = 'certificationSearchForm';
    $(formName+':certificationSearchGroupFilterResetBtn').click();
    var tagsSuggest = Ext.getCmp('tagsMultiSuggestCmp');
    if (tagsSuggest) {
        tagsSuggest.clear();
    }
    
    var certifierSuggest = Ext.getCmp('certifierSuggestCmp');
    if (certifierSuggest) {
        certifierSuggest.clearValue();
    }
    
    var memberSuggest = Ext.getCmp('memberSuggestCmp');
    if (memberSuggest) {
        memberSuggest.clearValue();
    }
    
    var esigSuggest = Ext.getCmp('certifierESignedSuggestCmp');
    if (esigSuggest) {
        esigSuggest.clearValue();
    }

    $(formName + ':certificationESigned').value = '';
    $(formName + ':certificationStates').value = 'all';
    
    $(formName + ':certPhases').value = '';
    $(formName + ':certName').value = '';
    $(formName + ':certPercentComplete').value = 'GreaterThan';
    $(formName + ':percentComplete').value = '';
    
    $(formName + ':certificationStartDateType').value = 'None';
    $('certificationStartDateSelect').checked = false;
    toggleDisplay($('certificationStartDateDiv'), true);    

    $(formName + ':certificationEndDateType').value = 'None';
    $('certificationEndDateSelect').checked = false;
    toggleDisplay($('certificationEndDateDiv'), true);    
    
    SailPoint.Analyze.Certification.clearTypeAttributes();
    SailPoint.Analyze.Certification.clearCertifierAttributes();
    SailPoint.Analyze.Certification.clearMemberAttributes();

    $(formName + ':certTypes').value = '';
    $(formName + ':certificationDates').value = 'created';
    
    SailPoint.Analyze.resetFieldsToDisplay('certification');
    SailPoint.Analyze.Certification.finishRerender();
};

SailPoint.Certification.Search.contextMenu = function(gridView, record, HTMLitem, index, e, eOpts){
    var contextMenu = new Ext.menu.Menu();
    gIsCertification = true;

    var viewDetailsItem = new Ext.menu.Item({text: '#{msgs.menu_view}', handler: SailPoint.Certification.Search.viewCertItem, iconCls: 'viewDetailsBtn'});
    viewDetailsItem.certificationId = record.getId();
    var disableForward = record.data.numCertifiers > 1 || !SailPoint.Utils.isNullOrEmpty(record.data.signed);
    var forwardFromMenuItem = new Ext.menu.Item({text: '#{msgs.menu_forward}', handler: SailPoint.Certification.Search.forwardFromMenu, iconCls: 'forwardBtn', disabled:(disableForward)});
    forwardFromMenuItem.certificationId = record.getId();
    forwardFromMenuItem.limitReassign = record.get("limitReassignments");
    contextMenu.add(viewDetailsItem, forwardFromMenuItem);
    e.stopEvent();
    contextMenu.showAt(e.xy);
}; 

SailPoint.Certification.Search.viewCertItem = function(item, e) {
    $('certificationResultForm:searchType').value = 'Certification';
    $('certificationResultForm:currentObjectId').value = item.certificationId;
    $('certificationResultForm:editButton').click();
};
  
SailPoint.Certification.Search.forwardFromMenu = function(item, e) {
    forwardCertificationWorkItem(item.certificationId, 'certificationSearchResults', item.limitReassign);
};
  
SailPoint.Certification.Search.handleClick = function(gridView, record, HTMLitem, index, e, eOpts){
    var colName = gridView.getHeaderCt().getHeaderAtIndex(gridView.clickedColumn).dataIndex;
    if(colName) {
        SailPoint.Analyze.captureGridState('Certification', 'certificationResultForm');
        
        $('certificationResultForm:searchType').value = 'Certification';
        $('certificationResultForm:currentObjectId').value = record.getId();
        $('certificationResultForm:editButton').click();
    }
};


/** 
 * 
 * ANALYZE STUFF 
 * 
 * **/

SailPoint.Analyze.Certification.validateSearch = function(formName) {
  var errors = [];
  var isValid = true;
  
  /** Validate Dates **/
  if($('certificationStartDateSelect').checked) {
    isValid &= Validator.validateInputDate(formName+':certificationStartDate', '');
  }
  if($('certificationEndDateSelect').checked) {
    isValid &= Validator.validateInputDate(formName+':certificationEndDate', '');
  }
  
  if($('certificationStartDateSelect').checked && $('certificationEndDateSelect').checked) {
    isValid &= Validator.validateStartEndDates(formName+':certificationStartDate', formName+':certificationEndDate', '#{msgs.err_invalid_start_end_date}')
  }
  
  if (!isValid) {
    errors = Validator.getErrors();
    Validator.clearErrors();
  }
  
  return errors;
}

SailPoint.Analyze.Certification.initializeAttributes = function() {
  var formName = 'certificationSearchForm'  
  var certifierVal = null;
  if($('certifierVal') && $('certifierVal').innerHTML)
      certifierVal = $('certifierVal').innerHTML;
  var memberVal = null;
  if($('memberVal') && $('memberVal').innerHTML)
      memberVal = $('memberVal').innerHTML;
  
  // Destroying the suggests is not the most efficient way to do things, but thanks
  // to the magic of a4j the DOM has potentially been pulled out from under them.
  // It's best to just put them out of their misery at that point because they 
  // are no longer reusable.
  var certifierSuggest = Ext.getCmp('certifierSuggestCmp');
  if (certifierSuggest) {
      certifierSuggest.destroy();
  }
  
  certifierSuggest = new SailPoint.IdentitySuggest({
    id: 'certifierSuggestCmp',
    renderTo: 'certifierSuggest',
    binding: 'certifier',
    rawValue: certifierVal,
    valueField: 'name',
    baseParams: {context: 'Owner'},
    width: 200,
    listConfig : {width : 300}
  });

  var memberSuggest = Ext.getCmp('memberSuggestCmp');
  if (memberSuggest) {
      memberSuggest.destroy();
  }
  memberSuggest = new SailPoint.IdentitySuggest({
    id: 'memberSuggestCmp',
    renderTo: 'memberSuggest',
    binding: 'member',
    rawValue: memberVal,
    baseParams: {context: 'Global'},
    width: 200,
    listConfig : {width : 300}
  });
  
  // Only initialize the suggest if it was rendered
  if ($('tagsMultiSuggest')) {
      var tagsMultiSuggest = Ext.getCmp('tagsMultiSuggestCmp');
      if (tagsMultiSuggest) {
          tagsMultiSuggest.destroy();
      }

      tagsMultiSuggest = new SailPoint.MultiSuggest({
          id: 'tagsMultiSuggestCmp',
          renderTo: 'tagsMultiSuggest',
          suggestType: 'tag',
          jsonData: JSON.parse($('tagsMultiSuggestData').innerHTML),
          inputFieldName: 'tagsSuggest'
      });
  }
  
  var checkBox = $('certificationStartDateSelect');
  if($(formName + ':certificationStartDateType').value != 'None') {
    checkBox.checked = true;
  }
  toggleDisplay($('certificationStartDateDiv'), !(checkBox.checked));
  
  
  var checkBox2 = $('certificationEndDateSelect');
  if($(formName + ':certificationEndDateType').value != 'None') {
    checkBox2.checked = true;
  }
  toggleDisplay($('certificationEndDateDiv'), !(checkBox2.checked));
  
  SailPoint.Analyze.initializeSubmit(formName, 'preCertificationSearchBtn');
}

SailPoint.Analyze.Certification.finishRerender = function() {
    resizeTables('certificationSearchForm');
    SailPoint.Analyze.Certification.initializeAttributes();
    if(!Ext.isIE) {
        SailPoint.Utils.initStyledSelects();
    }
}

SailPoint.Analyze.Certification.renderTypeAttributes = function() {
    var value = $('certificationSearchForm:certTypes').value;
  
    if(value == 'Manager') {
        SailPoint.Analyze.Certification.initializeManagerAttributes();
    } else if(value == 'BusinessRoleMembership' || value=='BusinessRoleComposition') {
        SailPoint.Analyze.Certification.initializeRoleAttributes();
    } else if(value == 'AccountGroupPermissions' || value=='AccountGroupMembership') {
        SailPoint.Analyze.Certification.initializeAccountGroupAttributes();
    } else if(value == 'ApplicationOwner' || value=='DataOwner') {
        SailPoint.Analyze.Certification.initializeApplicationAttributes();
    }
    
    SailPoint.Analyze.Certification.initializeESignedSuggest();
}

SailPoint.Analyze.Certification.clearTypeAttributes = function() {
    var value = $('certificationSearchForm:certTypes').value;

    if(value == "Manager") {
        SailPoint.Analyze.Certification.clearManagerAttributes();
    } else if(value == "BusinessRoleMembership" || value=="BusinessRoleComposition") {
        SailPoint.Analyze.Certification.clearRoleAttributes();
    } else if(value == "AccountGroupPermissions" || value=="AccountGroupMembership") {
        SailPoint.Analyze.Certification.clearAccountGroupAttributes();
    } else if(value == "ApplicationOwner") {
        SailPoint.Analyze.Certification.clearApplicationAttributes();
    }
    $("certificationSearchForm:searchTypePanel").hide();
}

SailPoint.Analyze.Certification.initializeManagerAttributes = function() {
  if ($('certificationManagerSuggest')) {
      var managerSuggest = Ext.getCmp('certifierManagerSuggestCmp');
      
      if (managerSuggest) {
          managerSuggest.destroy();
      }
        
      managerSuggest = new SailPoint.IdentitySuggest({
          id: 'certifierManagerSuggestCmp',
          renderTo: 'certificationManagerSuggest',
          binding: 'certificationManager', 
          width: 200,
          listConfig : {width : 300},
          valueField: 'name',
          rawValue: $('certificationManager').value,
          baseParams: {context: 'Manager'}
      });
  }
}

SailPoint.Analyze.Certification.initializeESignedSuggest = function() {
    
    if (Ext.fly('certificationESignedSuggest')) {
        
        var managerSuggest = Ext.getCmp('certifierESignedSuggestCmp');
        if (managerSuggest) {
            managerSuggest.destroy();
        }

        managerSuggest = new SailPoint.IdentitySuggest({
            id : 'certifierESignedSuggestCmp',
            renderTo : 'certificationESignedSuggest',
            binding : 'certificationESigned',
            width : 200,
            listConfig : {width : 300},
            rawValue : Ext.fly('certificationESigned').value,
            baseParams : {
                context : 'Global'
            }
        });
    }
};

SailPoint.Analyze.Certification.clearManagerAttributes = function() {
    var managerSuggest = Ext.getCmp('certifierManagerSuggestCmp');
    
    if (managerSuggest) {
        managerSuggest.clearValue();
        $('certificationManager').value = '';
    }
}

SailPoint.Analyze.Certification.clearCertifierAttributes = function() {
    var certifierSuggest = Ext.getCmp('certifierSuggestCmp');
    
    if (certifierSuggest) {
      certifierSuggest.clearValue();
        $('certifier').value = '';
    }
}

SailPoint.Analyze.Certification.clearMemberAttributes = function() {
  var memberSuggest = Ext.getCmp('memberSuggestCmp');
  
  if (memberSuggest) {
    memberSuggest.clearValue();
      $('member').value = '';
  }
}

SailPoint.Analyze.Certification.initializeRoleAttributes = function() {
    if ($('certificationRoleSuggest')) {
        var roleSuggest = Ext.getCmp('certifierRoleSuggest');
        
        if (roleSuggest) {
            roleSuggest.destroy();
        }
        
        roleSuggest = new SailPoint.BaseSuggest({
          id: 'certifierRoleSuggest',
          pageSize: 10,
          baseParams: {'suggestType': 'role'},
          renderTo: 'certificationRoleSuggest',
          binding: 'certificationRole',
          value: $('certificationRoleName').value,
          width: 200,
          listConfig : {width : 300}
        });           
    }
}

SailPoint.Analyze.Certification.clearRoleAttributes = function() {
    var roleSuggest = Ext.getCmp('certifierRoleSuggest');
    
    if (roleSuggest) {
        roleSuggest.clearValue();
        $('certificationRole').value = '';
    }
}


SailPoint.Analyze.Certification.initializeApplicationAttributes = function() {
    if ($('certificationApplicationSuggest')) {
        var applicationSuggest = Ext.getCmp('certifierApplicationSuggestCmp');
        if (applicationSuggest) {
            applicationSuggest.destroy();
        }
        
        applicationSuggest = new SailPoint.BaseSuggest({
            id: 'certifierApplicationSuggestCmp',
            pageSize: 10,
            baseParams: {'suggestType': 'application'},
            renderTo: 'certificationApplicationSuggest',
            binding: 'certificationApplication',
            value: $('certificationApplicationName').value,
            width: 200,
            listConfig : {width : 300}
        });
    }
}

SailPoint.Analyze.Certification.clearApplicationAttributes = function() {
    var applicationSuggest = Ext.getCmp('certifierApplicationSuggest');
    if (applicationSuggest) {
        applicationSuggest.clearValue();
        $('application').value = '';
    }
}

SailPoint.Analyze.Certification.initializeAccountGroupAttributes = function() {
    if ($('certificationAccountGroupSuggest')) {
        var acctGrpSuggest = Ext.getCmp('certifierAccountGroupSuggest');
        if (acctGrpSuggest) {
            acctGrpSuggest.destroy();
        }
        
        acctGrpSuggest = new SailPoint.BaseSuggest({
            id: 'certifierAccountGroupSuggest',
            pageSize: 10,
            baseParams: {'suggestType': 'accountGroup'},
            renderTo: 'certificationAccountGroupSuggest',
            binding: 'certificationAccountGroup',
            value: $('certificationAccountGroup').value,
            valueField: 'displayName',
            width: 200,
            listConfig : {width : 300}
        });       
    }
  
    if ($('certificationAccountGroupApplicationSuggest')) {
        var acctGrpAppSuggest = Ext.getCmp('certifierAccountApplicationGroupSuggest');
        
        if (acctGrpAppSuggest) {
            acctGrpAppSuggest.destroy();
        }
        
        acctGrpAppSuggest = new SailPoint.BaseSuggest({
            id: 'certifierAccountApplicationGroupSuggest',
            pageSize: 10,
            baseParams: {'suggestType': 'application'},
            renderTo: 'certificationAccountGroupApplicationSuggest',
            binding: 'certificationAccountGroupApplication',
            value: $('certificationAccountGroupAppName').value,
            width: 200,
            listConfig : {width : 300}
        });
    }
}

SailPoint.Analyze.Certification.clearAccountGroupAttributes = function() {
    var acctGrpSuggest = Ext.getCmp('certifierAccountGroupSuggest');
    var acctGrpAppSuggest = Ext.getCmp('certifierAccountApplicationGroupSuggest');
    if (acctGrpSuggest) {
        acctGrpSuggest.clearValue();
        $('accountGroup').value = '';
    }
    
  
    if (acctGrpAppSuggest) {
        acctGrpAppSuggest.clearValue();
        $('accountGroupApplication').value = '';
    }
}

