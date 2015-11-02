
Ext.ns('SailPoint', 
       'SailPoint.Report', 
       'SailPoint.Report.User');

SailPoint.Report.User.initialize = function() {
  var managersMultiSuggest = new SailPoint.MultiSuggest({
      id: 'userReportManagers',
      renderTo: 'managersMultiSuggest',
      suggestType: 'manager',
      jsonData: Ext.decode($('managerSuggestInfo').innerHTML),
      inputFieldName: 'managers',
      baseParams: {'type': 'manager', context: 'Manager'}
  });                                
  
  var businessRolesMultiSuggest = new SailPoint.MultiSuggest({
      renderTo: 'businessRolesMultiSuggest',
      suggestType: 'assignableRole',
      jsonData: Ext.decode($('roleSuggestInfo').innerHTML),
      inputFieldName: 'businessRoles'
  });
  
  var applicationsMultiSuggest = new SailPoint.MultiSuggest({
      renderTo: 'applicationsMultiSuggest',
      suggestType: 'application',
      jsonData: Ext.decode($('applicationSuggestInfo').innerHTML),
      inputFieldName: 'applicationsSuggest'
  });
  
  var groupsMultiSuggest = new SailPoint.MultiSuggest({
      renderTo: 'groupsMultiSuggest',
      suggestType: 'group',
      jsonData: Ext.decode($('groupsSuggestInfo').innerHTML),
      inputFieldName: 'groupsSuggest',
      baseParams: {'type': 'group'}
  });
  
  var checkBox1 = $('editForm:lastLoginSelect');
  toggleDisplay($('lastLoginDiv'), !(checkBox1.checked));
    
  var checkBox2 = $('editForm:lastRefreshSelect');
  toggleDisplay($('lastRefreshDiv'), !(checkBox2.checked));
  
  toggleDisabled($('editForm:inactiveSelect'), !$('editForm:useInactiveSelect').checked);
};

SailPoint.Report.User.updateGroup = function(selectBox) {
  $('editForm:componentSelect').disabled = true;
  $('editForm:groupSelect').value = selectBox.value;
  setTimeout('$(\'editForm:groupUpdateBtn\').click()', 100);
};