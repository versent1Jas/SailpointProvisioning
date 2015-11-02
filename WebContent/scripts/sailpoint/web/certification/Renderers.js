
SailPoint.certificationStatusRenderer = function(cellVal, metadata, record, rowIdx, colIdx, store){
    var total = record.get('totalCertifications');
    if (!total)
        total = 0;
    var completed = record.get('completedCertifications');
    if (!completed)
        completed = 0;
    var completionPercent = record.get('percentComplete');
    if (!completionPercent)
        completionPercent = 0;

    var template = new Ext.Template("#{msgs.cert_percent_complete}");
    var out = template.apply([completed, total, completionPercent]);
    return out;
};
