/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.modeler.AnalysisResultsPanel', {
	extend : 'Ext.Window',
    initComponent: function() {
        $('analysisResultsDiv').style['display'] = '';
        Ext.apply(this, {
            title: '#{msgs.modeler_quick_analysis_header}',
            border: true,
            renderTo:'analysisResultsCt',
            contentEl: 'analysisResultsDiv',
            closeAction: 'hide',
            width: 1000,
            modal: true
        });
        
        SailPoint.modeler.AnalysisResultsPanel.superclass.initComponent.apply(this, arguments);
    },
    
    hide: function() {
        var result = SailPoint.modeler.AnalysisResultsPanel.superclass.hide.apply(this, arguments);
        SailPoint.modeler.setButtonsDisabled(false);
        return result;
    },
    
    show: function() {
        var result = SailPoint.modeler.AnalysisResultsPanel.superclass.show.apply(this, arguments);
        SailPoint.modeler.setButtonsDisabled(true);
        return result;
    }
});
