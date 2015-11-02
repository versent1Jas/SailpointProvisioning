Ext.ns('SailPoint', 
       'SailPoint.Report', 
       'SailPoint.Report.Remediation');

SailPoint.Report.Remediation.initialize = function(groups, savedDefinitions) {
  Ext.QuickTips.init();
  
  
  var applicationsMultiSuggest = new SailPoint.MultiSuggest({
    renderTo: 'applicationsMultiSuggest',
    suggestType: 'application',
    jsonData: Ext.decode($('applicationsData').innerHTML),
    inputFieldName: 'applicationsSuggest',
    contextPath: CONTEXT_PATH
  });

  var managersMultiSuggest = new SailPoint.MultiSuggest({
    id: 'remediationProgressReportManagers',
    renderTo: 'managersMultiSuggest',
    suggestType: 'manager',
    jsonData: Ext.decode($('managersData').innerHTML),
    inputFieldName: 'managers',
    baseParams: {'type': 'manager', context: 'Manager'},
    contextPath: CONTEXT_PATH
  });
  
  var groupSelectorPanel = new SailPoint.GroupedItemSelector({
      renderTo : 'groupSelector',
      savedDefinitions:savedDefinitions,
      groupComboData: groups,
      inputFieldName:'editForm:groupsInput'
  });

  var checkBox1 = $('editForm:startDateSelect');
  toggleDisplay($('startDateDiv'), !(checkBox1.checked));

  var checkBox2 = $('editForm:endDateSelect');
  toggleDisplay($('endDateDiv'), !(checkBox2.checked));

  var checkBox3 = $('editForm:signedStartDateSelect');
  toggleDisplay($('signedStartDateDiv'), !(checkBox3.checked));

  var checkBox4 = $('editForm:signedEndDateSelect');
  toggleDisplay($('signedEndDateDiv'), !(checkBox4.checked));

  var checkBox5 = $('editForm:dueStartDateSelect');
  toggleDisplay($('dueStartDateDiv'), !(checkBox5.checked));

  var checkBox6 = $('editForm:dueEndDateSelect');
  toggleDisplay($('dueEndDateDiv'), !(checkBox6.checked));
};