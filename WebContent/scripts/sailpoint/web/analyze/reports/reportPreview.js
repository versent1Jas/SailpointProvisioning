/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */


/**
 * Javascript for report preview page.
 */

SailPoint.currentChanges = [];

SailPoint.doAction = function(actionName) {

    if (actionName == 'schedule'){
        SailPoint.scheduleTask();
    } else {
        var controlsElem = Ext.get('controls');
        var reviewActionInput = controlsElem.query('.reviewAction')[0];
        reviewActionInput.value = actionName;

        var reviewActionButton = controlsElem.query('.reviewActionButton')[0];
        reviewActionButton.click();
    }
    // Reset the action selecter back to default state
    Ext.getCmp('actionSelect').reset();
};

SailPoint.showUnsavedChanges = function(){
    Ext.get('unsaved-changes-msg').setDisplayed(true);
    var saveChangesButton = Ext.getCmp('saveChangesButton');
    if (!saveChangesButton){
        saveChangesButton = new Ext.Button({
            id:'saveChangesButton',
            text:"#{msgs.rept_preview_button_save_changes}",
            renderTo:'changeSaveButton',
            handler:SailPoint.persistChanges

        });
    }

    var changeCancelButton = Ext.getCmp('changeCancelButton');
    if (!changeCancelButton){
        changeCancelButton = new Ext.Button({
            id:'changeCancelButton',
            text:"#{msgs.rept_preview_button_cancel_changes}",
            renderTo:'changeCancelButton',
            href:'viewReportPreview.jsf?id=' + SailPoint.currentDefinitionId,
            hrefTarget:''
        });
    }
}

SailPoint.finishSavingChanges = function(){
    Ext.get('unsaved-changes-msg').setDisplayed(false);
    SailPoint.currentChanges = [];
}

SailPoint.persistChanges = function(){
    var url = "/rest/report/" + SailPoint.currentDefinitionId + "/updateLayout";
    Ext.get('pageContentContainer').mask();
    Ext.Ajax.request({
      scope:this,
      method:'POST',
      url: SailPoint.getRelativeUrl(url),
      success: function(response){
        SailPoint.finishSavingChanges();
        var grid = Ext.getCmp("reportGrid");
        grid.reload();
        Ext.get('pageContentContainer').unmask();
      },
      /**
      * Throws up a sys err msg. Note that this is not called when
      * success==false in the response, but if the call returns a 404 or 500.
      */
      failure: function(response){
           Ext.get('pageContentContainer').unmask();
          SailPoint.FATAL_ERR_ALERT.call(this);
      },
      params:{
          updates : Ext.encode(SailPoint.currentChanges)
      }
    });
}

SailPoint.showColumn = function(container, column, eOpts){
    SailPoint.showUnsavedChanges();
    SailPoint.currentChanges.push({action:'show', column:column.dataIndex});
};

SailPoint.hideColumn = function(container, column, eOpts){
    SailPoint.showUnsavedChanges();
    SailPoint.currentChanges.push({action:'hide', column:column.dataIndex});
};

SailPoint.sortChange = function(gridHeader, column, direction, eOpts ){
    SailPoint.showUnsavedChanges();
    SailPoint.currentChanges.push({action:'sort', column:column.dataIndex, ascending:direction != 'DESC'});
}

SailPoint.moveColumn = function(container, column, fromIdx, toIdx, eOpts ){
    SailPoint.showUnsavedChanges();
    SailPoint.currentChanges.push({action:'move', column:column.dataIndex, position:toIdx});
}

SailPoint.disableSummary = function(){
    SailPoint.showUnsavedChanges();
    SailPoint.currentChanges.push({action:'disableSummary'});
};

SailPoint.disableDetail = function(){
    SailPoint.showUnsavedChanges();
    SailPoint.currentChanges.push({action:'disableDetail'});
};

SailPoint.scheduleTask = function(){

    var now = new Date();
    var defaultRunTime = new Date(now.getTime() + 600000);

    var dialog = new Ext.Window({
        title:"#{msgs.task_new_schedule}",
        id : 'scheduleDialog',
        width:500, height:300,
        layout:'fit',
        items:[
            {
                id:'scheduleForm',
                defaultType: 'textfield',
                xtype:'form',
                bodyPadding:15,
                url:SailPoint.getRelativeUrl("/rest/report/schedule"),
                baseParams:{"definitionId": SailPoint.currentDefinitionId},
                items:[
                    {
                        name:'name',
                        allowBlank:false,
                        fieldLabel:"#{msgs.label_name}"
                    },
                    {
                        name:'description',
                        fieldLabel:"#{msgs.label_description}"
                    },
                    {
                        id:'scheduleStartDateContainer',
                        name:'startDate',
                        fieldLabel:"#{msgs.label_task_first_execution}",
                        xtype:'fieldcontainer',
                        layout:'hbox',
                        items:[
                            {
                                id:'scheduleStartDate',
                                name:'startDate',
                                xtype:'datefield',
                                allowBlank:false,
                                value: defaultRunTime,
                                minValue:new Date()
                            },
                            {
                                id:'scheduleStartTime',
                                name:'startTime',
                                xtype:'timefield',
                                allowBlank:false,
                                value:  defaultRunTime
                            }
                        ]
                    },
                    {
                        id:'scheduleRunNow',
                        name:'runNow',
                        fieldLabel:"#{msgs.label_task_run_now}",
                        xtype:'checkbox',
                        listeners:{
                            'change': {
                                fn: function(checkbox, newVal,  oldValue,  eOpts){
                                    var dateInput = Ext.getCmp('scheduleStartDateContainer');
                                    dateInput.setDisabled(newVal);
                                }
                            }
                        }
                    },
                    {
                        name:'frequency',
                        fieldLabel:"#{msgs.label_task_execution_frequency}",
                        xtype:'combobox',
                        allowBlank:false,
                        store:[
                            ["Monthly","#{msgs.frequency_monthly}"],
                            ["Once","#{msgs.frequency_once}"],
                            ["Hourly","#{msgs.frequency_hourly}"],
                            ["Daily","#{msgs.frequency_daily}"],
                            ["Weekly","#{msgs.frequency_weekly}"],
                            ["Quarterly","#{msgs.frequency_quarterly}"],
                            ["Annually","#{msgs.frequency_annually}"]
                        ]

                    }
                ]
            }
        ],
        buttons : [
            {
                text:"#{msgs.button_schedule}",
                handler : function(){

                    var form = Ext.getCmp('scheduleForm').getForm();
                    if (form.isValid()) {

                        var runNow = Ext.getCmp('scheduleRunNow');
                        if (runNow.getValue() == false){
                            var dt = Ext.getCmp('scheduleStartDate');
                            var dtValue = dt.getValue();

                            var tm = Ext.getCmp('scheduleStartTime');
                            var timeFieldValue = tm.getValue();
                            dtValue.setHours(timeFieldValue.getHours());
                            dtValue.setMinutes(timeFieldValue.getMinutes());
                            dtValue.setSeconds(0);
                            dtValue.setMilliseconds(0);
                            form.baseParams['dateTime'] = dtValue.getTime();
                        } else {
                            form.baseParams['dateTime'] = '';
                        }

                        form.submit({
                            success: function(form, action) {

                               var hideTask = new Ext.util.DelayedTask(function(){
                                   var elem = Ext.get('schedule-success-msg');
                                   elem.setVisibilityMode(Ext.Element.DISPLAY);
                                   elem.hide(true);
                               });

                               Ext.getCmp('scheduleDialog').destroy();

                               var elem = Ext.get('schedule-success-msg');
                               elem.setVisibilityMode(Ext.Element.DISPLAY);
                               elem.show(true);

                               hideTask.delay(4000);
                            },
                            failure: function(form, action) {
                                if (action.result && action.result.object && action.result.object.duplicateName === true){
                                    Ext.Msg.alert('Failed', "#{msgs.rept_preview_schedule_error_duplicate_name}");
                                } else {
                                    Ext.Msg.alert('Failed', "#{msgs.rept_preview_schedule_error}");
                                }
                            }
                        });
                    }
                }
            },
            {
                text:"#{msgs.button_cancel}",
                cls : 'secondaryBtn',
                handler:function(){
                    Ext.getCmp('scheduleDialog').destroy();
                }
            }
        ]


    });

    dialog.show();


};

SailPoint.reportPreviewInit = function(gridColConf, gridTitle, definitionId, hasSummary, hasChart){

    SailPoint.currentDefinitionId = definitionId;

    var grid = null;
    if (gridColConf){
        grid = SailPoint.GridReportLayout.buildGrid('reportGrid', gridColConf, gridTitle, SailPoint.getRelativeUrl('/rest/report/' + definitionId + '/data', true));

        // Add an exception handler so the user knows an error occurred
        grid.getStore().on('load', function(store, records, successful, eOpts ){
            if (!successful){
                SailPoint.EXCEPTION_ALERT("#{msgs.err_fatal_system}");
            }
        });

        grid.getStore().load();

        grid.on('columnhide', SailPoint.hideColumn);
        grid.on('columnshow', SailPoint.showColumn);
        grid.on('sortchange', SailPoint.sortChange);
        grid.on('columnmove', SailPoint.moveColumn);
    }

    var summaryWidth = Ext.fly('summaryPanel').getWidth();

    if (hasSummary || hasChart){
        Ext.fly('summaryPanel').mask('#{msgs.loading_data}');
    }

    var summaryLoaded = false;
    var chartLoaded = false;

    var summaryItems = [];
    if (hasSummary) {
        var summaryTable =  Ext.create('Ext.container.Container', {
            id:'summaryContainer',
            width:(summaryWidth * 0.4),height:430
        });
        Ext.Ajax.request({
            url: SailPoint.getRelativeUrl('/rest/report/'+definitionId+'/summary'),
            success: function(response){
                var text = response.responseText;
                var response = Ext.decode(text);
                var tableJson = response.object;

                var summaryTable = SailPoint.GridReportLayout.buildSummaryTable(tableJson);

                var container = Ext.getCmp('summaryContainer');
                container.add(summaryTable);
                summaryLoaded = true;
                if (!hasChart || chartLoaded)
                    Ext.fly('summaryPanel').unmask();
                container.doLayout();
            }
        });
        summaryItems.push(summaryTable);
    }

    if (hasChart) {
        var chart =  Ext.create('Ext.container.Container', {
            id:'chartContainer',
            width:(summaryWidth * 0.6),height:430
        });
        Ext.Ajax.request({
            url: SailPoint.getRelativeUrl('/rest/report/'+definitionId+'/chart'),
            success: function(response){
                var text = response.responseText;
                var response = Ext.decode(text);
                var chartDef = response.object;

                var chart = SailPoint.chart.ReportChartBuilder.createChart(chartDef);

                var container = Ext.getCmp('chartContainer');
                container.add(chart);
                chartLoaded = true;
                if (!hasSummary || summaryLoaded)
                    Ext.fly('summaryPanel').unmask();;
                container.doLayout();
            }
        });
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
            items: summaryItems,
            tools:[{
                type:'close',
                tooltip: "#{msgs.rept_form_field_disable_summary}",
                handler: function(event, toolEl, panel){
                    SailPoint.disableSummary();
                    Ext.getCmp("reportSummaryPanel").hide();
                }
            }]
        });
    }


    var tb = Ext.create('Ext.toolbar.Toolbar');
    tb.render('toolbar');
    tb.suspendLayouts();
    tb.add(
            new Ext.form.ComboBox({
                id:'actionSelect',
                emptyText:"#{msgs.rept_preview_actions_empty_text}",
                store:[
                    ['exec',"#{msgs.rept_preview_actions_execute}"],
                    ['schedule',"#{msgs.rept_preview_actions_schedule}"]
                ],
                listeners: {
                    select: {
                        fn: function(combo, records, eOpts) {
                            SailPoint.doAction(records[0].get('field1'));
                        }
                    }
                },
                typeAhead: true,
                hideLabel: true
            }),
            '->',
            {
                text:"#{msgs.rept_preview_button_refine}",
                cls : 'primaryBtn',
                handler:function() {
                    SailPoint.doAction('refine');
                }
            },
            {
                text:"#{msgs.rept_preview_button_cancel}",
                handler:function() {
                    SailPoint.doAction('cancel');
                }
            }
    );

    tb.resumeLayouts(true);

};
