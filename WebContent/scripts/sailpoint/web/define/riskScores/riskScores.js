Ext.onReady(function() {

  var neutralColorStore = new SailPoint.Risk.NeutralColorStore({id : 'neutralColorStore'});
  neutralColorStore.load({
    callback: function(record, options, success) {
      if (success) {
        initPage.call(this);
      } 
    }
  });
});

function initTabs() {

  var tabContainer = Ext.get('riskScoreTabs');
  if (tabContainer == null) 
    return;

  var tabPanel = new Ext.TabPanel({
    id: 'riskScoresTabPanel',
    renderTo:'riskScoreTabs',
    border:false,
    plain: true,
    activeTab: $('editForm:currentPanel').value,
    width: $('riskScoreTabs').clientWidth,
    items: [
            {title: '#{msgs.baseline_access_risk}', contentEl: 'baselineContent', id: 'baselineAccessRiskPanel'},
            {title: '#{msgs.composite_scoring}', contentEl: 'compositeContent', id: 'compositeScorePanel'}
    ]
  });
  
  tabPanel.on('tabchange', function(panel, newTab, oldTab, options) {
    $('editForm:currentPanel').value = newTab.id;    
    if(newTab.id=='baselineAccessRiskPanel') {
      displayInstructions('baselineAccessRiskPanelInstructions');    
    } else {
      displayInstructions('compositeScorePanelInstructions'); 
      SailPoint.Risk.initCompositePanel();
    }
  })
}

var isPageDirty = false;

function initPage() {

  initTabs();

  var currentPanel = $('editForm:currentPanel').value;
  cacheInputs();
  var currentButton;
  if (currentPanel == 'compositeScorePanel') {
    currentButton = 'button0';
    SailPoint.Risk.initCompositePanel();
  } else if (currentPanel == 'baselineAccessRiskPanel') {
    currentButton = 'button1';
  } else {
    currentButton = 'button2';
  }  

  displayInstructions(currentPanel + 'Instructions');
}

function closePanel(panelElement) {
  panelElement.style['display'] = 'none';
  $('mainPanel').style['display'] = '';
  $('editForm:visibleSaveButton').show();
  $('editForm:visibleCancelButton').show();
}

function displayInstructions(visibleInstruction) {
  var helpPanels = $('instructionPanel').getElementsByTagName('div');

  for (var i = 0; i < helpPanels.length; ++i) {
    if (helpPanels[i].id == visibleInstruction) {
      helpPanels[i].style['display'] = '';
    } else {
      helpPanels[i].style['display'] = 'none';
    }
  }
}

function confirmSaveOrCancel(category, saveActionButtonId, cancelActionButtonId) {
  // alert('isPageDirty is ' + isPageDirty);
  $('editForm:category').value = category;

  if (isPageDirty && (isPageDirty == true || isPageDirty == 'true')) {
      Ext.Msg.show({
          title: '#{msgs.title_risk_scoring_configuration}',
          msg: '#{msgs.confirm_leave_page}',
          width: 500,
          buttons: Ext.Msg.OKCANCEL,
          buttonText: {
              ok: '#{msgs.button_save}',
              cancel: '#{msgs.button_cancel}'
          },
          fn: function(buttonId, text, opt) {
              if ('ok' === buttonId) {
                  return $(saveActionButtonId).click();
              }
              else if ('cancel' === buttonId) {
                  return $(cancelActionButtonId).click();
              }
          }
      });
  } else {
      return $(cancelActionButtonId).click();
  }
}
