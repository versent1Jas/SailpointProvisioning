/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Dashboard.MySubordinates');

SailPoint.Dashboard.MySubordinates.CREATE_IDENTITY = 'Create Identity';

SailPoint.Dashboard.MySubordinates.chooseQuickLink = function(action, identityId) {
  
  if(action!=SailPoint.Dashboard.MySubordinates.CREATE_IDENTITY) {
    if(identityId) {
      $('dashboardForm:identityId').value = identityId;
    } else {
        /** This is a request for others -- need to see if we have any requestees first **/
      var requestees = parseInt($('requesteeCount').innerHTML);
      if(requestees===0) {
        Ext.MessageBox.alert('#{msgs.my_subordinates_no_requestess_title}', '#{msgs.my_subordinates_no_requestees_msg}');
        return;
      }
    }
  }

  $('dashboardForm:quickLink').value = action;
  $('dashboardForm:chooseQuickLinkBtn').click();
};

SailPoint.Dashboard.MySubordinates.changeQuicklinks = function(item) {
  item.className = 'on';
  if(item.id=='myQuickLinksSelector') {
    $('identityQuickLinks').hide();
    $('myQuickLinks').show();
    $('identityQuickLinksSelector').className = '';
    
  } else {
    $('myQuickLinks').hide();
    $('identityQuickLinks').show();
    $('myQuickLinksSelector').className = '';
  }
}