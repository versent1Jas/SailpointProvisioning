Ext.onReady(function() {

  var tabContainer = Ext.get('appScoreTabs');
  if (tabContainer == null) 
    return;

  var tabPanel = new Ext.TabPanel({
    id: 'appScoreTabPanel',
    renderTo:'appScoreTabs',
    border:false,
    plain: true,
    activeTab: 0,
    width: $('appScoreTabs').clientWidth,
    items: [
            {title: '#{msgs.component_scores}', contentEl: 'componentContent', id: 'componentScorePanel'},
            {title: '#{msgs.composite_score}', contentEl: 'compositeContent', id: 'compositeScorePanel'}
    ]
  });
});

var isPageDirty = false;

function makePageDirty() {
  isPageDirty = true;
  // Return false so that we don't accidentally submit the form
  return false;
};

function confirmSaveOrCancel(saveActionButtonId, cancelActionButtonId) {
  // alert('isPageDirty is ' + isPageDirty);

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
