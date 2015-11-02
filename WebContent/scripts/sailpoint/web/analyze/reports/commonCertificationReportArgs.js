Ext.ns('SailPoint', 
       'SailPoint.Report', 
       'SailPoint.Report.Certification');

SailPoint.Report.Certification.initializeCommonArgs = function() {
    var tagsMultiSuggest = new SailPoint.MultiSuggest({
        renderTo: 'tagsMultiSuggest',
        suggestType: 'tag',
        jsonData: Ext.JSON.decode($('tagsMultiData').value),
        inputFieldName: 'tags',
        contextPath: CONTEXT_PATH
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