/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.LogFileCollectorConfig');

SailPoint.LogFileCollectorConfig.init = function() {
    // Fill in the lines to skip field with a default if none existed
    var linesToSkipInput = $('editForm:linesToSkip');
    if (linesToSkipInput) { 
        var linesToSkip = linesToSkipInput.value;
        if (linesToSkip == '') {
            linesToSkipInput.value = '0';
        }
    }
    
    if ($('transportSettingsContent')) {
        // displayAppropriatePane comes from menu.js
        displayAppropriatePane('transportSettingsContent', 'button0');
    }
}

SailPoint.LogFileCollectorConfig.updateTransportSettings = function() {
    $('editForm:updateTransportSettings').click();
}

Ext.onReady(SailPoint.LogFileCollectorConfig.init);
