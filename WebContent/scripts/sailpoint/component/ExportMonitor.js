/* (c) Copyright 2013 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * The ExportMonitor is used to monitor the progress of exporting data to a
 * file.
 */
Ext.define('SailPoint.ExportMonitor', {

    // The name of the form that contains the "terminateExportButton".
    formName: null,

    // Whether the export that was kicked off is complete yet.
    exportComplete: true,

    // The export percent complete.
    percent: 0,


    /**
     * Constructor.
     * 
     * @param {String} formName  The name of the form that has the terminate
     *    button.
     */
    constructor: function(formName) {
        this.formName = formName;
    },
    
    /**
     * Display the export status dialog and start polling for status updates.
     * 
     * @param {String} exportType  The type of file being exported.
     */
    showDialog: function(exportType) {
        var message;
        
        SailPoint.setTimeoutLock(true);

        this.percent = 0;
        this.exportComplete = false;  
        
        if(exportType != "cef"){
            message = Ext.String.format('#{msgs.wait_for_search_export}', exportType);
        }
        else{
            message = Ext.String.format('#{msgs.wait_for_search_cef_export}', exportType);
        }
        
        Ext.MessageBox.show({
            title: '#{msgs.exporting_search}',
            msg: message,
            progressText: '#{msgs.exporting_search}',
            width: 300,
            buttons: Ext.MessageBox.CANCEL,
            fn: this.cancelExport,
            scope: this,
            progress: true,
            closable: false
        });

        Ext.defer(this.updateStatus, 1000, this);
    },
    
    /**
     * Update the status of the export monitor by performing an AJAX request to
     * get the current status.  If the export is complete this stops, otherwise
     * another update is scheduled.
     */
    updateStatus: function() {

        if (!this.exportComplete) {
    
            // Use an AJAX request here rather than an a4j button.  See bug 18410.
            Ext.Ajax.request({
                url: SailPoint.getRelativeUrl('/rest/export/status'),
                callback: function(options, success, response) {
                    var data, status, percentComplete;
    
                    if (success) {
                        // Grab the status out of the response.
                        data = Ext.decode(response.responseText);
                        status = data.status;
                        percentComplete = data.percentComplete;
                      
                        // If we are done, set the "exportComplete" variable to
                        // quit polling and hide the message box.
                        if ('done' === status) {
                            this.exportComplete = true;
                            Ext.MessageBox.updateProgress(1, '100% #{msgs.completed}');
                            Ext.MessageBox.hide();
                        }
                        else {
                            // Update the message box with the latest status.
                            if (percentComplete > this.percent){
                                this.percent = percentComplete;
                            }
                            Ext.MessageBox.updateProgress(this.percent/100,
                                                          this.percent + '% #{msgs.completed}');
                        }
                    }
                    else {
                        // On webkit based browsers, some AJAX requests won't actually
                        // get submitted because the entire page has already been POSTed
                        // and is waiting for a response.  This is a browser limitation.
                        // Eventually these requests will timeout.  Just ignore them.
                        if (!response.timedout) {
                            SailPoint.FATAL_ERR_ALERT('#{msgs.err_fatal_system}: ' + response.statusText);
                        }
                    }
                },
                scope: this
            });
    
            // Keep going...
            Ext.defer(this.updateStatus, 1000, this);
        }
    },
    
    /**
     * Callback when the "cancel" button on the dialog is clicked.  This causes
     * the terminate button to get clicked and the dialog to be closed the next
     * time it is polled.
     */
    cancelExport: function() {
        $(this.formName + ':terminateExportButton').click();
        this.exportComplete = true;
        return false;
    }
});
