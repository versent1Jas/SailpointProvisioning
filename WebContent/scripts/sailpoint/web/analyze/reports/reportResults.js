/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Javascript for report results page.
 */

SailPoint.scheduleNotification = function() {
    var btn = Ext.getCmp('notifyButton');
    Ext.Ajax.request({
      method:'POST',
      url: SailPoint.getRelativeUrl('/rest/report/'+ SailPoint.taskResultId+'/notification'),
      success: function(response){

      },
      failure : function() {
          alert('Could not schedule notification.');
      }
    });
    if (btn)
        btn.destroy();
    Ext.get('notifyMessage').setDisplayed(true);
}

SailPoint.onCompletion = function(response) {

    if (SailPoint.taskComplete == true) {
        return;
    }

    SailPoint.taskComplete = true;

    var progBar = Ext.getCmp('progressBar');
    if (progBar) {
        progBar.updateProgress(100, "Completed", true);
    }

    Ext.fly('status').setHTML("#{msgs.rept_results_completed}");

    Ext.fly('notifyPanel').setDisplayed(false);
    Ext.fly('completePanel').setDisplayed(true);

    Ext.create('Ext.button.Button', {
        text:'#{msgs.rept_results_button_refresh}',
        cls : 'primaryBtn',
        renderTo:'refreshButton',
        handler : function(){
            SailPoint.Utils.goToURL(SailPoint.getRelativeUrl('/analyze/reports/viewResult.jsf?id=' + SailPoint.taskResultId));
        }
    });
};

SailPoint.initReportResults = function(gridColConf, summaryTableJson, chartDefinition, summaryTableTitle,
                                       taskDefinitionId, taskResultId, workItemId, hasGrid, percentDone,
                                       reportIsComplete){

    SailPoint.taskResultId = taskResultId;

    var backButtonConf = {
        xtype : 'button',
        cls : 'secondaryBtn',
        renderTo : 'back-button'
    };

    if (workItemId){

        backButtonConf.text = "#{msgs.button_return_to_workitem}";
        backButtonConf.handler = function(){
            $('editForm:returnToWorkItemButton').click();
        };

    }
    else if (taskDefinitionId != ""){

        backButtonConf.text = "#{msgs.rept_results_button_back}";
        backButtonConf.handler = function(){
            SailPoint.Utils.goToURL(SailPoint.getRelativeUrl("/analyze/reports/viewReports.jsf?resetTab=true"));
        };

        Ext.create("Ext.button.Button", {
            xtype : 'button',
            renderTo : 'edit-report-button',
            cls : 'secondaryBtn',
            text : "#{msgs.rept_results_button_edit}",
            handler : function(){
                SailPoint.Utils.goToURL(SailPoint.getRelativeUrl("/analyze/reports/editDefinitionForm.jsf?id=" + taskDefinitionId));
            }
        });

    }

    Ext.create('Ext.button.Button', backButtonConf);

    if (SailPoint.taskComplete == true) {

        if (hasGrid){
            var grid = SailPoint.GridReportLayout.buildGrid('reportGrid', gridColConf, gridTitle, SailPoint.getRelativeUrl('/rest/report/'+taskResultId+'/results'), false, workItemId);
            grid.getStore().load();
        }

        SailPoint.onCompletion({
            filePath:SailPoint.getRelativeUrl('/rest/file/'),
            grid:gridColConf
        });

        if (hasGrid && reportIsComplete) {
            Ext.create('Ext.button.Button', {
                text:'#{msgs.rept_results_button_pdf}',
                cls : 'secondaryBtn',
                renderTo:'pdfButton',
                handler : function(){
                    SailPoint.Utils.goToURL(SailPoint.getRelativeUrl('/rest/report/'+taskResultId+'/file/pdf'));
                }
            });

            Ext.create('Ext.button.Button', {
                text:'#{msgs.rept_results_button_csv}',
                cls : 'secondaryBtn',
                renderTo:'csvButton',
                handler : function(){
                    SailPoint.Utils.goToURL(SailPoint.getRelativeUrl('/rest/report/'+taskResultId+'/file/csv'));
                }
            });
        }

    } else {
        var progressBar = Ext.create('Ext.ProgressBar', {
            id:'progressBar',
            width:300,
            renderTo:'progress'
        });


        var msg = "#{reportResult.progressText}";

        progressBar.updateProgress(percentDone / 100, msg);

        SailPoint.updateProgress = function() {
            Ext.Ajax.request({
                url: SailPoint.getRelativeUrl('/rest/report/'+SailPoint.taskResultId+'/progress'),
                success: function(response) {
                    var response = Ext.decode(response.responseText);
                    response.filePath = SailPoint.getRelativeUrl('/rest/file/');
                    if (response.success == true) {
                        if (response.object.complete == true) {
                            var resp = response.object;
                            SailPoint.onCompletion(resp);
                        } else {
                            var progBar = Ext.getCmp('progressBar');
                            if (progBar)
                                progBar.updateProgress(response.object.percentComplete / 100, response.object.progress, true);
                        }
                    }
                }
            });

            // returning false here will end the task
            return !SailPoint.taskComplete;
        };

        Ext.TaskManager.start({
            run: SailPoint.updateProgress,
            interval: 5000
        });

        Ext.get('notifyPanel').show();

        Ext.create('Ext.button.Button', {
            id : 'notifyButton',
            text : '#{msgs.rept_results_button_notify}',
            handler : SailPoint.scheduleNotification,
            renderTo : 'notifyButton'
        });
    }

    var summaryItems = [];



    var summaryTable = null;
    if (summaryTableJson != null){

        var summaryTableItems = [];

        if (summaryTableJson.title && summaryTableJson.title != ''){
            summaryTableItems.push({
                xtype: 'container',
                margin:0,
                padding:0,
                html:"<h2>"+summaryTableJson.title+"</h2>"
            });
        }

        if (summaryTableJson.values){
            summaryTableJson.values.each(function(item){
                summaryTableItems.push({
                    xtype: 'displayfield',
                    name: item.name,
                    fieldLabel: item.label,
                    value:item.value
                });
            });
        }

        summaryTable = Ext.create('Ext.container.Container', {
            layout: {
                type: 'form'
            },
            flex:1,
            style:{margin:'20px'},
            defaults: {
                labelWidth: 150,
                flex: 1,
                style: {
                    padding: '10px'
                }
            },
            items: summaryTableItems
        });

        summaryItems.push(summaryTable);
    }

    var chart = null;
    if (chartDefinition != null) {
        chart = SailPoint.chart.ReportChartBuilder.createChart(chartDefinition);
        summaryItems.push(chart);
    }

    if (summaryItems.length > 0) {
        var summaryPanel = Ext.create('widget.panel', {
            id : 'reportSummaryPanel',
            title:summaryTableTitle,
            renderTo: 'summaryPanel',
            height:430,
            layout: {
                type: 'hbox'
            },
            items: summaryItems
        });
    }
}