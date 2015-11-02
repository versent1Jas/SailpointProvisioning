/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.systemSetup', 'SailPoint.systemSetup.lcm');

SailPoint.systemSetup.lcm.getBusinessProcessesPanel = function(config) {
    var businessProcessesPanel;
    
    if (!config) {
        config = {};
    }
    
    if (!config.id) {
        config.id = 'businessProcessesPanel';
    }
    
    config.contentEl = 'businessProcessesContents';
    
    businessProcessesPanel = new Ext.Panel(config);

    businessProcessesPanel.on('resize', function(panel) {
        var panelHeight = panel.getHeight();
        var tableHeight = Ext.get('businessProcessesTable').getHeight();
        var panelDiv = Ext.get('businessProcesses');
        var processesHeight;
        
        if (tableHeight > panelHeight - 30) {
            processesHeight = tableHeight + 28;
        } else { 
            processesHeight = panelHeight;
        }

        panelDiv.setHeight(processesHeight);
    });

    return businessProcessesPanel;
};

