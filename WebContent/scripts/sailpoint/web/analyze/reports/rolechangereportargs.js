Ext.ns('SailPoint', 
       'SailPoint.Report', 
       'SailPoint.Report.Role');

SailPoint.Report.Role.initialize = function() {
  var applicationsMultiSuggest = new SailPoint.MultiSuggest({
      renderTo: 'applicationsMultiSuggest',
      suggestType: 'application',
      jsonData: Ext.decode($('applicationsSuggestInfo').innerHTML),
      inputFieldName: 'applicationsSuggest',
      contextPath: CONTEXT_PATH
      });                
  
  var ownersMultiSuggest = new SailPoint.MultiSuggest({
      renderTo: 'ownersMultiSuggest',
      suggestType: 'identity',
      jsonData: Ext.decode($('ownersSuggestInfo').innerHTML),
      inputFieldName: 'owners',
      id: 'roleReportsOwnersFilter',
      baseParams: {context: 'Owner'},
      contextPath: CONTEXT_PATH
      });
      
  var checkBox1 = $('editForm:startDateSelect');
  toggleDisplay($('startDateDiv'), !(checkBox1.checked));

  var checkBox2 = $('editForm:endDateSelect');
  toggleDisplay($('endDateDiv'), !(checkBox2.checked));
};
