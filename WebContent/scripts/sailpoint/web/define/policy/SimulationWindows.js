/*(c) Copyright 2013 SailPoint Technologies, Inc., All Rights Reserved.*/

Ext.ns('SailPoint.Web.Define.Policy');
/**
 * This is used in simulation activities done on policies and rules.
 */
SailPoint.Web.Define.Policy.SimulationWindows = {

    /*This method is to show the modal pop up progress window for simulation action
     * @param objName name of rule or policy
     * @param isPolicy is to know it for rule or policy
     * @param objID is policy or rule id
     */
    showSimulationProgressWindow: function (objName, isPolicy, objID) {
        if (Ext.getCmp('simulationProgressWinID')) {
            simulationProgressWinID.close();
        }
        var entityType, simulationProgressWinID;
        if (isPolicy === true) {
            entityType = '#{msgs.simulate_target_policy_object}';
        } else {
            entityType = '#{msgs.simulate_target_rule_object}';
        }
        simulationProgressWinID = Ext.create('Ext.window.Window', {
            id: 'simulationProgressWinID',
            title: '#{msgs.title_view_simulation_progress}',
            height: 300,
            width: 500,
            modal: true,
            buttonAlign: 'center',
            bodyStyle: 'background-color: white; padding: 5px; overflow: auto',
            items: {
                xtype: 'label',
                html: '<div style="font-size:13px" width="80%" float="left"><br/><br/>' + Ext.String.format("#{msgs.subtitle_view_simulation_progress}", entityType) + '</div>',
                margin: 1
            },
            layout: 'fit',
            buttons: [{
                text: '#{msgs.button_cancel_simulation_task}',
                id: 'cancelsim',
                handler: function () {
                    this.setDisabled(true);
                    Ext.Ajax.request({
                        scope: this,
                        url: CONTEXT_PATH + '/define/policy/cancelSimulation.json',
                        success: function (response) {
                            var respObj, result, msg = "", errorMsg;
                            respObj = Ext.decode(response.responseText);
                            result = respObj.result;
                            msg = respObj.message;
                            if (result !== "success") {
                                errorMsg = Ext.String.format("#{msgs.error_simulation_task_terminate}", objName) + msg;
                                SailPoint.Web.Define.Policy.showMessageDialog(errorMsg);
                            } else {
                                Ext.Msg.show({
                                    title: '#{msgs.success_dialog_title}',
                                    msg: Ext.String.format("#{msgs.sub_title_cancel_simulation}", entityType, objName),
                                    buttons: Ext.Msg.OK,
                                    fn : function (button) {
                                        if (button === 'ok') {
                                            if (isPolicy === true && Ext.get('simulatePolicyButton') && Ext.get('resultPolicyButton')) {
                                                Ext.get('simulatePolicyButton').show();
                                                Ext.get('resultPolicyButton').hide();
                                            } else if (Ext.get('startSimulateRuleButton') && Ext.get('viewRuleResultsButton')) {
                                                Ext.get('startSimulateRuleButton').show();
                                                Ext.get('viewRuleResultsButton').hide();
                                            } else {
                                                var constraintStore = Ext.getCmp('CDGrid');
                                                var record = constraintStore.getStore().getById(objID);
                                                record.set('resultId', '');
                                                record.set('simulate', false);
                                            }
                                        }
                                    }
                                });
                            }
                            Ext.getCmp('simulationProgressWinID').close();
                        },
                        failure: function (response) {
                            var errorMsg, msg = "";
                            msg = response.responseText;
                            errorMsg = Ext.String.format("#{msgs.error_simulation_task_terminate}", objName) + msg;
                            SailPoint.Web.Define.Policy.showMessageDialog(errorMsg);
                            Ext.getCmp('simulationProgressWinID').close();
                        },
                        params: {
                            isPolicy: isPolicy,
                            constraintId: objID
                        }
                    });
                }
            },
            {
                text: '#{msgs.button_close}',
                cls : 'secondaryBtn',
                handler: function () {
                    simulationProgressWinID.close();
                    }
            }]
        });
        simulationProgressWinID.show();
        simulationProgressWinID.center();
    },

    /*This method is to show the modal pop up window for policy simulation action
     * @param objName name of policy/rule for which simulation results are to be displayed
     * @param lastRunDate last run time of policy
     * @param objID id of rule or policy
     * @param isStaleTaskResult flag to indicate stale task result id
     * @param isPolicy is to know it for rule or policy
     * @param simButton id of simulation button on main form.
     * @param policyType gives information of  the policy type
     */
    showSimulationResultsWindow: function (objName, lastRunDate, objID, isStaleTaskResult, isPolicy, simButton, isConstraintDisabled, policyType) {
        if (Ext.getCmp('simulationWinID')) {
            simulationWinID.close();
        }
        // create the data store
        var simstore = SailPoint.Store.createStore({
            fields : ['ruleName', 'violationCount', 'identityCount'],
            storeId: 'simstore',
            autoLoad: false,
            url: CONTEXT_PATH + '/define/policy/simulationResults.json',
            root: 'violationResults',
            extraParams: {
                'constraintId': objID,
                'isPolicy': isPolicy
                }
        });
        var simGridPanel = new Ext.grid.Panel({
            id: 'SIMGrid',
            store: simstore,
            stateful: false,
            autoHeight: true,
            autoWidth: true,
            margin: 15,
            columns: [{
                header: '#{msgs.header_simulation_rule_name}',
                align: 'left',
                style: 'text-align:center',
                flex: 1,
                sortable: true,
                dataIndex: 'ruleName'
                },{
                header: '#{msgs.header_simulation_no_of_violations}',
                align: 'center',
                flex: 0.5,
                sortable: true,
                dataIndex: 'violationCount'
                }
                ],
            viewConfig: {
                autoFill: true,
                scrollOffset: 0
                }
        });
        var  simulationWinID = Ext.create('Ext.window.Window', {
            id: 'simulationWinID',
            title: '#{msgs.title_policy_simulation_result}',
            height: 350,
            width: 725,
            modal: true,
            bodyStyle: 'background-color: white; padding: 5px; overflow: auto',
            items: [{
                xtype: 'label',
                html: '<div class="spContentTitle" style="width="80%" float="left">' + Ext.String.format("#{msgs.subtitle_policy_simulation_result}", objName) + '</div>'
                }, {
                    xtype: 'label',
                    html: '<div class="subtitle.highlight" style="text-align:Left;margin:3px;">' + Ext.String.format("#{msgs.sub_title_simulation_last_run_date}", lastRunDate) + '</div>',
                    algin: 'center',
                    id: 'lastRun'
                },
                   simGridPanel
                   ],
            buttons: [{
                text: '#{msgs.button_simulation_run_simulation}',
                handler: function () {
                    var confirmMessage;
                    if (isPolicy === true) {
                        //Display the confirmation message depend on the state of the policy and then call the simulate action
                        var isPolicyInactive = false;
                        confirmMessage = '#{msgs.verify_simulation_of_policy}';
                        var sel = $('mainForm:policyStateOption');
                        if(sel) {
                            if(sel.value === "Inactive")
                                isPolicyInactive = true;
                            else
                                isPolicyInactive = false;
                        }
                        if(isPolicyInactive) {
                            SailPoint.Web.Define.Policy.SimulationWindows.simulateFromResultDialog(isPolicy, objID, simButton);
                            simulationWinID.close();
                        } else {
                            Ext.MessageBox.confirm('', confirmMessage, function (button, text) {
                                if (button === 'yes') {
                                    SailPoint.Web.Define.Policy.SimulationWindows.simulateFromResultDialog(isPolicy, objID, simButton);
                                    simulationWinID.close();
                                }
                            });
                        }
                    } else {
                      //Display the confirmation message depend on the state of the rule and then call the simulate action
                        if(isConstraintDisabled === null) {
                            var checkBox = $('mainForm:constraintDisabled');
                            if(checkBox) {
                                isConstraintDisabled = checkBox.checked;
                            }
                        }
                        if(isConstraintDisabled) {
                            SailPoint.Web.Define.Policy.SimulationWindows.simulateFromResultDialog(isPolicy, objID, simButton);
                            simulationWinID.close();
                        } else {
                            if (isPolicy === true) {
                                confirmMessage = '#{msgs.verify_simulation_of_policy}';
                            } else {
                                confirmMessage = '#{msgs.verify_simulation_of_rule}';
                            }
                            Ext.MessageBox.confirm('', confirmMessage, function (button, text) {
                                if (button === 'yes') {
                                    SailPoint.Web.Define.Policy.SimulationWindows.simulateFromResultDialog(isPolicy, objID, simButton);
                                    simulationWinID.close();
                                }
                            });
                        }
                    }
                    
                }
            },
            {
                text: '#{msgs.button_close}',
                cls: 'secondaryBtn',
                handler: function () {
                    simulationWinID.close();
                    }
            }]});
        simstore.load({
            callback: function (records, operation, e) {
            	if (policyType === "Risk" || policyType === "Account" ) {
            		var identityCount, identityCountLabel;
                    identityCount = records[0].data.identityCount;
                    identityCountLabel = {
                            xtype: 'label',
                            html: '<div class="subtitle.highlight" style="text-align:Left;margin:3px;">' + Ext.String.format("#{msgs.header_simulation_no_of_identities_with_violations}", identityCount) + '</div>',
                            margin: '1'
                    }
                    Ext.getCmp('simulationWinID').add(identityCountLabel);
                    Ext.getCmp('simulationWinID').remove(simGridPanel);
            		
            	}
            	else if (isStaleTaskResult === true || null === records || records.length < 1) {
                    Ext.getCmp('SIMGrid').hide();
                    Ext.getCmp('lastRun').hide();
                    var noRulesLabel = {
                        xtype: 'label',
                        html: '<div style="font-size:15px;margin:5px;" width="80%" float="left" class="x-grid-empty">"#{msgs.error_simulation_noactive_rules}"</div>',
                        margin: '1'
                    };
                    var staleResultIdLabel = {
                            xtype: 'label',
                            html: '<div style="font-size:15px;margin:5px;" width="80%" float="left" class="x-grid-empty">"#{msgs.error_simulation_statle_taskresult}"</div>',
                            margin: '1'
                        };
                    if (isStaleTaskResult === true) {
                        Ext.getCmp('simulationWinID').add(staleResultIdLabel);
                    }
                    else {
                        Ext.getCmp('simulationWinID').add(noRulesLabel);
                    }
                    }
                else {
                    Ext.getCmp('simulationWinID').add(simGridPanel);
                    if (isPolicy === true) {
                        var identityCount, identityCountLabel;
                        identityCount = records[0].data.identityCount;
                        identityCountLabel = {
                                xtype: 'label',
                                html: '<div style="margin:3px;" class="subtitle.highlight">' + Ext.String.format("#{msgs.header_simulation_no_of_identities_with_violations}", identityCount) + '</div>',
                                margin: '1'
                        }
                        Ext.getCmp('simulationWinID').add(identityCountLabel);
                    }
                }
                Ext.getCmp('simulationWinID').show();
                }
        });
    },

    /*Retrieves task status and renders appropriate window.
     * @param objName name of policy for which simulation results are to be displayed
     * @param objId id of rule or policy
     * @param isPolicy is to know it for rule or policy
     * @param simButtonId id of simulation button on main form.
     */
    getTaskStatus: function (objName, objId, isPolicy, simButtonId, isConstraintDisabled) {
        Ext.Ajax.request({
            scope: this,
            url: CONTEXT_PATH + '/define/policy/taskStatus.json',
            success: function (response) {
                var respObj, status, lastRunDate, policyType;
                respObj = Ext.decode(response.responseText);
                status = respObj.status;
                lastRunDate = respObj.lastRunDate;
                policyType = respObj.policyType;
                if (status === "inprogress") {
                    this.showSimulationProgressWindow(objName, isPolicy, objId);
                    }
                else if (status === "complete") {
                    this.showSimulationResultsWindow(objName, lastRunDate, objId, false, isPolicy, simButtonId, isConstraintDisabled, policyType);
                    }
                else {
                    //this indicates task result cannot be determined and now we need to provide run link again
                    this.showSimulationResultsWindow(objName, lastRunDate, objId, true, isPolicy, simButtonId, isConstraintDisabled, policyType);
                    }
                },
                failure: function (response) {
                    var msg = "", errorMsg;
                    msg = response.responseText;
                    errorMsg = Ext.String.format("#{msgs.error_simulation_unknown_task_status}", objName) + msg;
                    SailPoint.Web.Define.Policy.showMessageDialog(errorMsg);
                    },
                    params: {
                        constraintId: objId,
                        isPolicy: isPolicy
                    }
                    }
        );
    },
    
    /* Call the simulate from the view results dialog
     * @param isPolicy is to know it for rule or policy
     * @param objID id of rule or policy
     * @param simButton id of simulation button on main form.
     */
    simulateFromResultDialog: function (isPolicy, objID, simButton){
        if ($('mainForm:gridObjectId')) {
            $('mainForm:gridObjectId').value = objID;
        }
        if ($('mainForm:isPolicy')) {
            $('mainForm:isPolicy').value = isPolicy;
        }
        if ($(simButton)) {
            var bgMsg;
            if ($(simButton).id === "mainForm:simHidPolicyButton") {
                bgMsg = '#{msgs.msgbox_policy_simulation_text_in_background}';
                } else if ($(simButton).id === "mainForm:simulateRuleButton") {
                    bgMsg = '#{msgs.msgbox_rule_simulation_text_in_background}';
                } else {
                    $(simButton).click();
                }
            if (bgMsg && bgMsg !== "") {
                Ext.Msg.show({
                    msg: bgMsg,
                    buttons: Ext.Msg.OK,
                    fn : function (button) {
                        if (button === 'ok') {
                            $(simButton).click()
                        }
                    }
                });
            }
        }
    },
    
    /* Call the simulate from the Rule Grid
     * @param record of the rule grid
     */
    simulateFromRuleGrid: function (record){
        $('mainForm:gridObjectId').value = record.getId();
        $('mainForm:simulateButton').click();
        //Set this to show the viewResult icon for first time
        record.set('simulate', true);
        //Explicitly refresh grid to update the icons for first
        //time when clicked on the simulate
        if (Ext.getCmp('CDGrid')) {
            Ext.getCmp('CDGrid').getView().refresh();
        }
    },

    /*Renderer for View Simulation and Run Simulation links
     * that you see on individual rule grid pages.
     */
    ruleGridSimulationRenderer: function (val, metadata, record) {
         var resultId = record.get('resultId');
         var renderedValue;
         var entitlementSimulateFunc =
             "SailPoint.Web.Define.Policy.SimulationWindows.ruleGridSimulationHandler(" + '\'' + record.getId() + '\'' + ',' + '\'' + this.getStore().storeId +
             '\'' + ',' + false + ");";
         var entitlementViewResultsFunc =
             "SailPoint.Web.Define.Policy.SimulationWindows.ruleGridSimulationHandler(" + '\'' + record.getId() + '\'' + ',' + '\'' + this.getStore().storeId +
             '\'' + ',' + true + ");";

         if ((resultId !== "") || record.get('simulate') === true) {
             metadata.tdAttr = 'onclick=' + entitlementViewResultsFunc;
             metadata.tdCls = "fakeLink";
             renderedValue = '#{msgs.simulate_view_results}';
             }
         else {
             metadata.tdAttr = 'onclick=' + entitlementSimulateFunc;
             metadata.tdCls = "fakeLink";
             renderedValue = '#{msgs.button_simulation_run_simulation}';
             }
         return renderedValue;
        },

    /*Handler for Run Simulation and View Simulation hyper links seen on rule grid
     * @param recordId id of rule
     * @param storeId id of store in individual policy pages
     * @param isSimulated on top of resultId this is used for rendering 
     * appropriate view or run simulation links
     */
    ruleGridSimulationHandler: function (recordId, storeId, isSimulated) {
        var store = Ext.data.StoreManager.lookup(storeId);
        var record = store.getById(recordId);
        if (record.get('resultId') !== "" || isSimulated === true) {
            this.getTaskStatus(record.get('displayName'), record.getId(), 'false', "mainForm:simulateButton", record.get('disabledState'));
            }
        else {
            if(record.get('disabledState') === true) {
                SailPoint.Web.Define.Policy.SimulationWindows.simulateFromRuleGrid(record);
            } else {
                Ext.MessageBox.confirm('',
                        '#{msgs.verify_simulation_of_rule}',
                                function (button, text) {
                    if (button === 'yes') {
                        SailPoint.Web.Define.Policy.SimulationWindows.simulateFromRuleGrid(record);
                    }
                });
            }
        }
    },

    /*Handler for Run Simulation of policy
     * and rule edit pages
     */
    simulatePolicy: function (button, text) {
        var bgMsg = "";
        if ($('mainForm:isPolicy').value === "true") {
            bgMsg = '#{msgs.msgbox_policy_simulation_text_in_background}';
        } else {
            bgMsg = '#{msgs.msgbox_rule_simulation_text_in_background}';
        }
        if (button === 'yes') {
            Ext.Msg.show({
                msg: bgMsg,
                buttons: Ext.Msg.OK,
                fn : function (button) {
                    if (button === 'ok') {
                        if ($('mainForm:isPolicy').value === "true") {
                          //this indicates action is from policy
                          //edit page
                            $('mainForm:simHidPolicyButton').click();
                        } else {
                            //this indicates action is from individual rule
                            //edit page
                            $('mainForm:simulateRuleButton').click();
                        }
                    }
                }
            });
        }
    },

    /* Prompt to confirm policy and rule simulation actions from the page
     * The Confirmation message is shown depending on the state of Rule/Policy
     * @param isPolicy set to indicate that we are working on policy
     */
    displaySimulationDialoguePrompt: function (isPolicy) {
        var msg;
        var isRuleDisabled, isPolicyInactive = false;
        if(isPolicy) {
            var sel = $('mainForm:policyStateOption');
            if(sel) {
                if(sel.value === "Inactive")
                    isPolicyInactive = true;
                else
                    isPolicyInactive = false;
            }
        } else {
            var checkBox = $('mainForm:constraintDisabled');
            if(checkBox) {
                if(checkBox.checked === true)
                    isRuleDisabled = true;
                else
                    isRuleDisabled = false;
            }
        }
        
        if(isRuleDisabled || isPolicyInactive) {
            if (isPolicy && isPolicy === true) {
                SailPoint.Web.Define.Policy.SimulationWindows.setIsPolicy();
            }
            SailPoint.Web.Define.Policy.SimulationWindows.simulatePolicy('yes', "")
        }
        else {
            if (isPolicy && isPolicy === true) {
                msg = '#{msgs.verify_simulation_of_policy}';
                SailPoint.Web.Define.Policy.SimulationWindows.setIsPolicy();
            }
            else {
                msg = '#{msgs.verify_simulation_of_rule}';
            }
            Ext.MessageBox.confirm('',
                    msg,
                    SailPoint.Web.Define.Policy.SimulationWindows.simulatePolicy);
        }
    },

    /*Handler for View Simulation button on policy edit page.
     * @param objName name of policy or rule for which simulation is invoked
     * @param objId is unique id of policy or rule sent
     * @param isPolicy is to know it for rule or policy
     * @param buttonId id of simulation button on policy or rule main form
     */
    displaySimulationResults: function (objName, objId, isPolicy, buttonId) {
        this.getTaskStatus(objName, objId, isPolicy, buttonId, null);
    },

    /*
     * set hidden variable isPolicy on policy edit
     * pages
     */
    setIsPolicy: function () {
        if ($('mainForm:isPolicy'))
            $('mainForm:isPolicy').value = "true";
        }
    };

    /*
     * Simple message box without title,icon.
     */
    SailPoint.Web.Define.Policy.showMessageDialog = function (msg) {
        Ext.Msg.show({
            msg: msg,
            buttons: Ext.Msg.OK
            });
    }
