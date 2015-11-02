Ext.ns('SailPoint', 
       'SailPoint.Report', 
       'SailPoint.Report.ARM');

SailPoint.Report.ARM.initialize = function() {
  var approversMultiSuggest = new SailPoint.MultiSuggest({
      renderTo: 'approversMultiSuggest',
      suggestType: 'identity',
      jsonData: Ext.decode($('approverSuggestInfo').innerHTML),
      id: 'armReportsApprovers',
      baseParams: {context: 'Owner'},
      inputFieldName: 'approvers'
  });
  
  var requestorsMultiSuggest = new SailPoint.MultiSuggest({
      id: 'armReportsRequestors',
      renderTo: 'requestorsMultiSuggest',
      suggestType: 'identity',
      jsonData: Ext.decode($('requestorSuggestInfo').innerHTML),
      inputFieldName: 'requestors',
      baseParams: {context: 'Global'}
  });
  
  var rolesMultiSuggest = new SailPoint.MultiSuggest({
      renderTo: 'businessRolesMultiSuggest',
      suggestType: 'role',
      jsonData: Ext.decode($('roleSuggestInfo').innerHTML),
      inputFieldName: 'businessRolesSuggest',
      contextPath: CONTEXT_PATH
  });
  
  var checkBox1 = $('editForm:startDateSelect');
  toggleDisplay($('startDateDiv'), !(checkBox1.checked));

  var checkBox2 = $('editForm:endDateSelect');
  toggleDisplay($('endDateDiv'), !(checkBox2.checked));

  var checkBox3 = $('editForm:approvedStartDateSelect');
  toggleDisplay($('approvedStartDateDiv'), !(checkBox3.checked));

  var checkBox4 = $('editForm:approvedEndDateSelect');
  toggleDisplay($('approvedEndDateDiv'), !(checkBox4.checked));
}                                
