/**
 * This is the dialog we generate when a user chooses to
 * allow an exception.
 */
Ext.define('SailPoint.certification.ViolationRemediationDialog', {
	extend : 'SailPoint.certification.BaseDecisionDialog',

    form:null,

    wizard : null,

    currentPage : 0,

    editableEntitlements : null,

    remediationEditor : null,
	
	constructor : function(config) {
		Ext.apply(this, {
			buttons : [
				{
                    id:"violationRemediationDialogContinueBtn",
                    text:"#{msgs.button_revoke}",
                    parent:this,
                    disabled:true,
                    handler: function() {
                        this.parent.nextPage();
                    }
                },
                {
                    text:"#{msgs.cert_delegation_review_button_accept}",
                    parent:this,
                    handler: function() {
                        this.parent.acceptDelegationReview();
                    }
                },
                {
                    text:"#{msgs.cert_delegation_review_button_reject}",
                    parent:this,
                    handler: function() {
                        this.parent.rejectDelegationReview();
                    }
                },
                {
                    text:"#{msgs.button_cancel}",
                    cls : 'secondaryBtn',
                    parent:this,
                    handler: function() {
                        this.parent.cancel();
                    }
                }
			]
		});
		this.callParent(arguments);
	},
	
    initComponent:function() {

        this.setHeight(550);

        this.setTitle("#{msgs.dialog_title_correct_violation}");

        this.remediationEditor = new SailPoint.certification.RemediationEditor({
            id:'violationRemediationEditorPanel', 
            minHeight:100
        });

        // Assignment form, this will be the 2nd page in the dialog
        // in SOD violations
        this.form = new Ext.form.Panel({
            style:'padding:15px 0 15px 15px;background-color:#fff' ,
            border:false,
            bodyBorder:false,
            autoScroll:true,
            labelWidth:150,
            items:[
                new Ext.Panel({
                    id : 'violationDelegationReviewDetails',
                    hidden:true,
                    border:false, bodyBorder:false,
                    html:"<div id='violationDelegationReviewMsg' class='informationPanel' style='margin:20px'></div>"
                }),
                new Ext.Panel({
                    id : 'violationProvisioningMessage',
                    hidden:true,
                    border:false, bodyBorder:false,
                    html:"<div id='violationProvisioningMessageContent' class='informationPanel'></div>"
                }),
                new SailPoint.form.PanelField({
                    id:'violationSelectionsPanel',
                    html:'<div id="violationSelectionsContent"></div>',
                    fieldLabel:"#{msgs.violation_selected_remediations}"
                }),
                {
                	xtype : 'assigneeselector',
                    quickAssignOptions : [['', '']],
                    fieldLabel:'#{msgs.recipient}',
                    afterLabelTextTpl: "<span style='color:red'>*</span>",
                    id:'violationRemediationAssignee',
                    allowBlank:false,
                    msgTarget:'under',
                    baseParams: {context: 'Owner'}
                },
                new SailPoint.form.PanelField({
                    id:'violationSummaryPanel',
                    html:'<div id="violationSummaryContent"></div>',
                    fieldLabel:"#{msgs.violation_remed_panel_desc}"
                }),
                new SailPoint.form.PanelField({
                    id:'violationRemediationAdvicePanel',
                    html:'<div id="violationRemediationAdvicePanel"></div>',
                    fieldLabel:"#{msgs.label_correction_adv}"
                }),
                new Ext.form.TextArea({
                    id:'violationRemediationComments',
                    fieldLabel:'#{msgs.label_comments}',
                    name: 'violationRemediationComments',
                    width:473,
                    height:190
                }),
                this.remediationEditor
            ]
        });


        var remediationPanelHtml = "<div id='violationDetailsDelegationReviewMsg' class='informationPanel' style='display:none;margin:20px'></div>";

        remediationPanelHtml += '<div class="dialogItem"><label>#{msgs.label_violation}:</label><span id="violationRemediationDialogName"></span></div><div style="clear:both;margin-bottom:10px;"></div>';
        remediationPanelHtml += '<div class="dialogItem"><label>#{msgs.violation_remed_panel_desc}:</label><span id="violationRemediationDialogDesc"></span></div><div style="clear:both;margin-bottom:10px;"></div>';
        remediationPanelHtml += '<div id="SODViolationRemediationDialogAdviceRow" class="dialogItem"><label>#{msgs.label_correction_adv}:</label><span id="SODViolationRemediationDialogAdvice"></span></div><div style="clear:both;margin-bottom:10px;"></div>';

        // Entitlement SOD Form
        remediationPanelHtml += '<div id="entitlementSODPanel">' +
                '<div style="margin-bottom:10px" class="bold">#{msgs.inst_select_entitlements_to_remove}</div>' +
                '<div id="entitlementSODHeading" class="dialogItem"><label>#{msgs.violation_conflicting_entitlements}:</label></div>' +
                '<div style="clear:both;margin-bottom:10px;"></div>';
        remediationPanelHtml += '<div id="EntitlementSodViolationTableDiv"></div></div>';

        // Role SOD Form
        remediationPanelHtml += '<div id="roleSODPanel"><div id="roleSODHeading" class="dialogItem bold">#{msgs.inst_select_roles_to_remove}:</div><div style="clear:both;margin-bottom:10px;"></div>';
        remediationPanelHtml += '<div id="roleSODDiv" class="roleSODPanel_remediation_table">';
        remediationPanelHtml += '<div class="bold">#{msgs.violation_conflicting_roles}:</div>';
        remediationPanelHtml += '<table class="spTable" id="violationRightRoles"><tr><th></th><th>#{msgs.business_role}</th><th>#{msgs.description}</th><th>#{msgs.violation_remed_dialog_notes}</th></thead></tr></table>';
        remediationPanelHtml += '<div class="bold">#{msgs.biz_roles}:</div>';
        remediationPanelHtml += '<table class="spTable" id="violationLeftRoles"><tr><th></th><th>#{msgs.business_role}</th><th>#{msgs.description}</th><th>#{msgs.violation_remed_dialog_notes}</th></tr></table>';
        remediationPanelHtml += '</div></div>';

        this.wizard = new Ext.Panel({
            layout:'card',
            activeItem: 0, // make sure the active item is set on the container config!
            bodyStyle: 'padding:15px',
            defaults: {
                border:false
            },
            items: [
                {
                    id: 'violationRemediationDialog-0',
                    html:remediationPanelHtml
                },
                this.form
            ]
        });

        this.currentPage = 0;

        this.items = [
            this.wizard
        ];

        this.callParent(arguments);
    },

    /**
     * Resets the dialog back to it's default state.
     */
    reset : function() {

        this.remediationEditor.reset();

        // If the components have been rendered, init them.
        // If the name doesnt exist, then they havent been
        // rendered yet, so skip this step
        if (Ext.fly('violationRemediationDialogName')) {
            Ext.fly('violationRemediationDialogName').dom.innerHTML = "";
            Ext.fly('violationRemediationDialogDesc').dom.innerHTML = "";
            Ext.fly('EntitlementSodViolationTableDiv').dom.innerHTML = "";
            Ext.fly('violationSummaryContent').dom.innerHTML = "";
            Ext.fly('violationSelectionsContent').dom.innerHTML = "";
        }

        // Remove any old rows in the role SOD selection tables
        if (Ext.fly('roleSODDiv')) {
            Ext.query('.roleRemedRow', Ext.fly('roleSODDiv').dom).each(function(element) {
                if (element)
                    Ext.fly(element).remove();
            });
        }

        this.remediationEditor.hide();

        if (Ext.getCmp('violationDelegationReviewDetails'))
            Ext.getCmp('violationDelegationReviewDetails').hide();
        if (Ext.fly('violationDetailsDelegationReviewMsg')) {
            Ext.fly('violationDetailsDelegationReviewMsg').setStyle('display', 'none');
            Ext.fly('violationDetailsDelegationReviewMsg').dom.innerHTML = '';
        }

        if (Ext.fly('SODViolationRemediationDialogAdvice')) {
            Ext.fly('SODViolationRemediationDialogAdvice').dom.innerHTML = '';
            Ext.fly('SODViolationRemediationDialogAdvice').hide();
        }

        var assignmentCmp = Ext.getCmp('violationRemediationAssignee');
        assignmentCmp.assigneeSuggest.reset();
        assignmentCmp.assigneeSuggest.clearInvalid();
        assignmentCmp.assigneeSuggest.setDisabled(this.isReadOnly);
        assignmentCmp.setDisabled(this.isReadOnly);

        var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;
        
        // this button should start out disabled since we only enable
        // it in SOD violations once they selected at least one
        // entitlement
        buttons.getAt(0).disable();

        buttons.getAt(0).setText('#{msgs.button_revoke}');
        buttons.getAt(0).show();
        buttons.getAt(1).hide();
        buttons.getAt(2).hide();
    },

    init : function() {

        this.baseInit();

        var id = this.decision.selectionCriteria.selections[0];
        var url = Ext.String.format("/rest/certification/item/{0}/remediationAdvice?workItemId={1}",
                id, this.decision.workItemId);

        // Get the remediation advice, this will determine whether or not the
        // dialog has one or two forms to fill out, as well as the default values
        // for our inputs
        Ext.Ajax.request({
            scope:this,
            url: SailPoint.getRelativeUrl(url),
            success: function(response) {
                try {
                    var respObj = Ext.decode(response.responseText);
                    this.handleRemediationAdvice(respObj.object);
                } catch(err) {
                    this.handleError(err, "Error initializing violation remediation dialog.");
                }
            },
            /**
             * Throws up a sys err msg. Note that this is not called when
             * success==false in the response, but if the call returns a 404 or 500.
             */
            failure: function(response) {
                this.hideMask();
                SailPoint.Decider.getInstance().gridIds.each(function(gridId) {
                    var grid = Ext.getCmp(gridId);
                    grid.unmask();
                });
                this.cancel();
                SailPoint.FATAL_ERR_ALERT.call(this);
            }
        });
    },

    /**
     * Validate the form. This is called before the dialog is submitted
     */
    validateForm : function() {

        var valid = true;

        var assignmentCmp = Ext.getCmp('violationRemediationAssignee');
        if (!assignmentCmp.hidden) {
            valid = assignmentCmp.validate();
        }
        if (valid && this.remediationEditor) {
            valid = this.remediationEditor.validateNewValues();
        }

        return valid;
    },

    /**
     * This is called to get the updated decision record,
     * updated with any changes made by the user's input.
     */
    getDecision : function() {

        var comments = Ext.getCmp('violationRemediationComments').getValue();
        var assignmentCmp = Ext.getCmp('violationRemediationAssignee');

        this.decision.requiresDelegationReview = false;
        this.decision.status = 'Remediated';
        this.decision.recipient = assignmentCmp.assigneeSuggest.getValue();
        this.decision.recipientDisplayName = assignmentCmp.assigneeSuggest.getRawValue();
        this.decision.comments = comments;
        this.decision.dialogState.push("ViolationRemediationDialog");
        if (this.remediationEditor.hasEditableEntitlements()) {
            this.decision.remediationDetails = this.remediationEditor.getValues();
        }

        this.decision.entitlementViolationTree = cloneViolationsTree();
        if (this.decision.entitlementViolationTree)
            this.decision.selectedViolationEntitlements =
                    getSelectedEntitlementsRec(this.decision.entitlementViolationTree);

        return this.decision;
    },

    nextPage : function() {
        this.currentPage++;
        var pages = this.wizard.items.getCount();
        if (this.currentPage < pages) {
            this.showMask();
            this.reloadSummaryDetails();

            if (this.decision.requiresDelegationReview) {
            	var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;
                buttons.getAt(0).hide();
                buttons.getAt(1).show();
                buttons.getAt(2).show();
            }

        } else {
            this.save();
        }
    },

    /**
     * Based on the type of violation, we may need to get
     * remediation details from the server.
     */
    reloadSummaryDetails : function() {
        var id = this.decision.selectionCriteria.selections[0];
        var certId = this.decision.certificationId;
        var url = Ext.String.format("/rest/certification/item/{0}/summary?workItemId={1}", id, this.decision.workItemId);

        var remediationJson = "";
        if (this.decision.revokedRoles && this.decision.revokedRoles.length > 0) {
            remediationJson = this.decision.revokedRoles;
        } else {
            remediationJson = getSelectedEntitlements();
        }

        Ext.Ajax.request({
            scope:this,
            method:'POST',
            url: SailPoint.getRelativeUrl(url),
            success: function(response) {
                var respObj = Ext.decode(response.responseText).object;

                if (respObj.remediationDetails && respObj.remediationDetails.length > 0) {
                    this.remediationEditor.show();
                    this.remediationEditor.showRevocationDetailsPanel(respObj.remediationDetails,
                            respObj.useManagedAttributesForRemediation, this.isReadOnly);
                }

                // Add a summary of the user's selections to the final form page
                if (this.decision.revokedRoles && this.decision.revokedRoles.length > 0) {
                    this.populateSelectedRoles();
                } else {
                    populateSelectedEntitlementList(Ext.fly('violationSelectionsContent').dom, getSelectedEntitlements());
                }

                if (respObj.owner)
                    this.populateAssignmentField(respObj.owner);

                this.populateAssignmentOptions(respObj.assignmentOptions);

                var assignmentCmp = Ext.getCmp('violationRemediationAssignee');
                if (respObj.remediationAction == 'SendProvisionRequest' || (!respObj.enableOverrideDefaultRemediator && respObj.defaultRemediator)) {
                    this.hideField(assignmentCmp);
                } else {
                    this.showField(assignmentCmp);
                }

                if (respObj.remediationAction == "SendProvisionRequest"){
                    var provisioners = "";
                    if (respObj.provisioners) {
                        if (respObj.provisioners.length > 1) {
                            provisioners = respObj.provisioners.join(", ");
                        } else {
                            provisioners = respObj.provisioners[0];
                        }
                    } else {
                        provisioners = "#{msgs.identityiq}";
                    }

                    var provMsg = Ext.String.format("#{msgs.automatic_remediation_confirmation}", provisioners);                    
                    Ext.fly('violationProvisioningMessageContent').dom.innerHTML = provMsg;

                    this.showField(Ext.getCmp('violationProvisioningMessage'));
                    this.hideField(Ext.getCmp('violationRemediationComments'));
                } else {
                    this.hideField(Ext.getCmp('violationProvisioningMessage'));
                    this.showField(Ext.getCmp('violationRemediationComments'));
                }

                this.hideMask();
                this.wizard.getLayout().setActiveItem(this.currentPage);
            },
            /**
             * Throws up a sys err msg. Note that this is not called when
             * success==false in the response, but if the call returns a 404 or 500.
             */
            failure: function(response) {
                this.hideMask();
                SailPoint.Decider.getInstance().gridIds.each(function(gridId) {
                    var grid = Ext.getCmp(gridId);
                    grid.unmask();
                });
                this.cancel();
                SailPoint.FATAL_ERR_ALERT.call(this);
            },
            params:{
                details : Ext.encode(remediationJson)
            }
        });

    },

    /**
     * Populates the selected roles element on the remediation form.
     */
    populateSelectedRoles : function() {

        var html = "<ul>";

        this.decision.revokedRolesDisplayableNames.each(function(role) {
            html += "<li>" + role + "</li>";
        });

        html += "</ul>";
        Ext.fly('violationSelectionsContent').dom.innerHTML = html;
    },
    
    addDescriptions : function(violationTree, descriptions){
        if (descriptions[violationTree.value] != null){
            violationTree.description = descriptions[violationTree.value];
        }
        if (violationTree.children && violationTree.children.length > 0){
            for (child in violationTree.children) {
                this.addDescriptions(violationTree.children[child], descriptions);
            }
        }
    },

    /**
     * Renders remediation advice from the server. The remediation advice
     * determines how many forms we will have in the dialog, as well as
     * what some of the defaults are. We will have two forms if we
     * are dealing with an SOD violation.
     */
    handleRemediationAdvice : function(queryResponse) {
        try {
            var disableAssignment = false;
            var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;

            Ext.fly('violationRemediationDialogName').dom.innerHTML = queryResponse.advice.violationConstraint;
            Ext.fly('violationRemediationDialogDesc').dom.innerHTML = queryResponse.advice.violationSummary;

            var requiresRoleRemediation = queryResponse.advice.leftRoles;
            var requiresEntitlementRemediation = queryResponse.advice.entitlementsToRemediate;

            // We display remediation advice if it exists. We also display it in one of two places,
            // if we're in an SOD we'll show it on the first page above the conflicting entitlements
            // form, if we're in a non-sod violation we'll show it on the details form.
            if (queryResponse.advice.remediationAdvice && queryResponse.advice.remediationAdvice != '') {
                Ext.fly('SODViolationRemediationDialogAdvice').dom.innerHTML = queryResponse.advice.remediationAdvice;
                Ext.fly('SODViolationRemediationDialogAdvice').show();

                // If we're showing remed advice the first page, we can  hide the remed advice on the second pg
                if (requiresRoleRemediation || requiresEntitlementRemediation) {
                    this.hideField(Ext.getCmp('violationRemediationAdvicePanel'));
                } else {
                    Ext.fly('violationRemediationAdvicePanel').dom.innerHTML = queryResponse.advice.remediationAdvice;
                    this.showField(Ext.getCmp('violationRemediationAdvicePanel'));
                }
            } else {
                Ext.fly('SODViolationRemediationDialogAdviceRow').setStyle('display', 'none');
                this.hideField(Ext.getCmp('violationRemediationAdvicePanel'));
            }

            var comments = this.decision.comments ? this.decision.comments : queryResponse.summary.comments;

            var commentsInput = Ext.getCmp('violationRemediationComments');
            commentsInput.setValue(comments ? comments : "");
            commentsInput.setDisabled(this.isReadOnly);

            if (queryResponse.summary.owner) {
                this.populateAssignmentField(queryResponse.summary.owner);
            }

            //this.populateAssignmentField(owner);
            if (queryResponse.summary) {
                this.populateAssignmentOptions(queryResponse.summary.assignmentOptions);
            }

            if (this.decision.requiresDelegationReview == true) {
                var delegationOwner = queryResponse.summary.delegation.owner;
                var msg = "#{msgs.cert_decision_accept_delegate_remediation}";
                var reviewMsg = Ext.String.format(msg, delegationOwner.displayName ? delegationOwner.displayName :
                        delegationOwner.name);
                Ext.fly('violationDelegationReviewMsg').dom.innerHTML = reviewMsg;

                var detailMsg = Ext.String.format("#{msgs.cert_decision_violation_remediation_ok}",
                        delegationOwner.displayName ? delegationOwner.displayName :
                                delegationOwner.name);
                Ext.fly('violationDetailsDelegationReviewMsg').dom.innerHTML = detailMsg;
                Ext.fly('violationDetailsDelegationReviewMsg').show();
                Ext.getCmp('violationDelegationReviewDetails').show();

            }

            if (requiresRoleRemediation) {
                this.currentPage = 0;
                Ext.getCmp('violationSummaryPanel').hide();
                Ext.getCmp('violationSelectionsPanel').show();


                Ext.fly('entitlementSODPanel').hide();
                Ext.fly('roleSODPanel').show();

                this.buildRoleTable(queryResponse.advice.rightRoles, "violationRightRoles");
                this.buildRoleTable(queryResponse.advice.leftRoles, "violationLeftRoles");

                buttons.getAt(0).setDisabled(!this.decision.revokedRoles || this.decision.revokedRoles.length == 0);
            } else if (requiresEntitlementRemediation) {
                this.currentPage = 0;
                Ext.fly('entitlementSODPanel').show();
                Ext.fly('roleSODPanel').hide();
                Ext.getCmp('violationSummaryPanel').hide();
                Ext.getCmp('violationSelectionsPanel').show();

                // If we're editing an existing unsaved decision the violation tree will
                // be stored on the decision
                if (!this.decision.entitlementViolationTree) {
                    var violationTree = queryResponse.advice.entitlementsToRemediate;
                    this.addDescriptions(violationTree, queryResponse.entitlementDescriptions);
                    createEntitlementSodViolationTableFromDialog(violationTree, Ext.getCmp('violationRemediationDialogContinueBtn'));
                } else {
                    var violationTree = this.decision.entitlementViolationTree;
                    createEntitlementSodViolationTableFromDialog(violationTree, Ext.getCmp('violationRemediationDialogContinueBtn'));
                }

                // If we're editing a decision where some entitlements have already been
                // selected, enable the revoke button.
                if (getSelectedEntitlements().length > 0) {
                    buttons.getAt(0).enable();
                }

            } else {

                buttons.getAt(0).enable();

                var violationSummaryHtml = queryResponse.advice.violationSummary;
                if (violationSummaryHtml == null) {
                    violationSummaryHtml = "";
                }
                if (this.isReadOnly) {
                	violationSummaryHtml = '<span class="x-item-disabled">' + violationSummaryHtml + '</span>';
                }
                
                Ext.fly('violationSummaryContent').dom.innerHTML = violationSummaryHtml;
                Ext.getCmp('violationSummaryPanel').show();
                Ext.getCmp('violationSelectionsPanel').hide();
                this.currentPage = 1;

                if (this.decision.requiresDelegationReview) {
                    buttons.getAt(0).hide();
                    buttons.getAt(1).show();
                    buttons.getAt(2).show();
                }

            }

            var assignmentCmp = Ext.getCmp('violationRemediationAssignee');
            if (!this.isReadOnly && !queryResponse.summary.enableOverrideDefaultRemediator && queryResponse.summary.defaultRemediator) {
                this.hideField(assignmentCmp);
            } else {
                this.showField(assignmentCmp);
            }

            var readOnly = this.isReadOnly;
            this.form.items.each(function (item) {
            	if (!(item instanceof Ext.panel.Panel) && item.setDisabled) {
            		item.setDisabled(readOnly);
            	}
            });
            
            this.wizard.getLayout().setActiveItem(this.currentPage);

            this.fireEvent('initComplete');
        } catch(err) {
            this.handleError(err, "Violation remediation dialog error.");
        }
    },

    populateAssignmentOptions : function(options) {
        var assignmentCmp = Ext.getCmp('violationRemediationAssignee');
        if (assignmentCmp && options.length > 0) {
            var records = [];
            options.each(function(item) {
                var identityName = item.identity
                var arr = [item.identity, item.description];
                records.push(arr);
            });
            assignmentCmp.quickAssign.getStore().loadData(records, false);
        }
    },

    populateAssignmentField : function(ownerRecord) {

        if (!ownerRecord)
            return;

        var assignmentCmp = Ext.getCmp('violationRemediationAssignee');

        ownerRecord.displayableName = ownerRecord.displayName;

        var model = assignmentCmp.assigneeSuggest.getStore().model.create(ownerRecord);

        assignmentCmp.assigneeSuggest.getStore().add(ownerRecord);

        assignmentCmp.assigneeSuggest.setValue(ownerRecord.id);
        //assignmentCmp.assigneeSuggest.setRawValue(displayName ? displayName : value);
        assignmentCmp.assigneeSuggest.setDisabled(this.isReadOnly);
        assignmentCmp.assigneeSuggest.clearInvalid();
        assignmentCmp.setDisabled(this.isReadOnly);
    },


    buildRoleTable : function(roles, elementId) {

        var cmpId = '"' + this.id + '"';

        this.roleItemIds = [];

        var rolesTbl = Ext.get(elementId);
        var selectedRoles = [];
        var selectedRolesDisplayableNames = [];
        for (var i = 0; i < roles.length; i++) {
            var role = roles[i];

            var isSelected = role.selected == true;

            // If we're editing an existing un-saved decision, override
            // the server response with the value stored ont he decision
            if (this.decision.revokedRoles)
                isSelected = this.decision.revokedRoles.indexOf(role.name) > -1;

            var itemStatus = this.checkRoleRevokeStatus(role.certItemId, role.roleName, role.status);
            var note = SailPoint.certification.ViolationRemediationDialog.getDependantDecisionText(itemStatus);

            // If the role was revoked in the certification, go ahead and revoke it here.
            var revokedInCert = itemStatus === SailPoint.Decision.STATUS_REVOKE;
            if (revokedInCert){
                isSelected = true;
            }

            if (isSelected) {
                selectedRoles.push(role.name);
                selectedRolesDisplayableNames.push(role.displayableName);
            }

            // If the checkbox for a role is to be disabled, we have to hide the actual checkbox and display a
            // fake disabled checkbox. This is because IE will not submit values on a disabled checkbox
            var disabledCheckbox = "<input type='checkbox' "+ (isSelected ? "checked='true'" : "") +" disabled='true' />";

            var rowTpl = "<tr class='roleRemedRow'><td>{6}<input onclick='SailPoint.certification.ViolationRemediationDialog.roleChecked({0}, this, \"{8}\")' type='checkbox' {1} {5} value='{3}'/></td><td>{3}</td>" +
                    "<td>{4}</td><td>{7}</td></tr>";
            var row = Ext.String.format(rowTpl, cmpId, isSelected === true ? "checked='true'" : '',
                    role.id, role.displayableName, role.description, itemStatus != null ? "style='display:none'" : "",
                    itemStatus != null ? disabledCheckbox : "", note, role.name);

            rolesTbl.insertHtml('beforeEnd', row);
        }

        // When we load decisions from the grid datasource, the revokedRoles list
        // wont be populated. If that's the case, set it here
        if (!this.decision.revokedRoles && selectedRoles.length > 0) {
            this.decision.revokedRoles = selectedRoles;
        }
        
        // set the displayable names
        if (!this.decision.revokedRolesDisplayableNames && selectedRolesDisplayableNames.length > 0) {
        	this.decision.revokedRolesDisplayableNames = selectedRolesDisplayableNames;
        }
    },

    selectRole : function(name, selected, displayableName) {

        if (!this.decision.revokedRoles) {
        	this.decision.revokedRolesDisplayableNames = [];
            this.decision.revokedRoles = [];
        }

        if (selected) {
            this.decision.revokedRoles.push(name);
            this.decision.revokedRolesDisplayableNames.push(displayableName);
        } else if (this.decision.revokedRoles.indexOf(name) > -1) {
        	var roleNameIndex = this.decision.revokedRoles.indexOf(name);
            this.decision.revokedRoles.splice(roleNameIndex, 1);
            
            var roleDisplayableNameIndex = this.decision.revokedRolesDisplayableNames.indexOf(displayableName);
            this.decision.revokedRolesDisplayableNames.splice(roleDisplayableNameIndex, 1);
        }

        var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;
        buttons.getAt(0).setDisabled(this.decision.revokedRoles.length == 0);
    },

    /**
     * Verify that the persisted decision for a role matches the
     * state of the UI.
     *
     * @param roleName
     * @param persistedStatus {Boolean} true if the role decision coming from the server is a revoke.
     */
    checkRoleRevokeStatus : function(itemId, entityId, persistedStatus){

        var status = persistedStatus;

        var statuses = ['Remediated', 'Cleared', 'Delegated', 'Approved', 'Mitigated'];

        var decider = SailPoint.Decider.getInstance();
        var decision = decider.findDecisionByItemProperties(itemId, entityId, null, statuses);
        if (decision != null && decision.status){
            status = decision.status;
        }

        return status == SailPoint.Decision.STATUS_CLEARED ? null : status;
    }

});

SailPoint.certification.ViolationRemediationDialog.roleChecked = function(cmpId, checkbox, name) {
    var remedDialog = Ext.getCmp(cmpId);
    remedDialog.selectRole(name, checkbox.checked, checkbox.value);
}

/**
  * Used by the Decider to either create a new instance or re-use an
  * existing one.
 */
SailPoint.certification.ViolationRemediationDialog.getInstance = function(){
    var dialog = SailPoint.certification.BaseDecisionDialog.baseGetInstance(
            SailPoint.certification.ViolationRemediationDialog,
                        {id:'violationRemediationDialog'});
    return dialog;
};

SailPoint.certification.ViolationRemediationDialog.getDependantDecisionText = function(itemStatus){
    var note = "";
    if (itemStatus != null){
        if (itemStatus == SailPoint.Decision.STATUS_REVOKE){
            note = "#{msgs.violation_remed_dialog_note_revoked}";
         } else if (itemStatus == SailPoint.Decision.STATUS_DELEGATED){
            note = "#{msgs.violation_remed_dialog_note_delegated}";
        } else if (itemStatus == SailPoint.Decision.STATUS_APPROVED){
            note = "#{msgs.violation_remed_dialog_note_approved}";
        } else if (itemStatus == SailPoint.Decision.STATUS_MITIGATED){
            note = "#{msgs.violation_remed_dialog_note_mitigated}";
        } else {
            note = "#{msgs.violation_remed_dialog_note_other}";
        }

        note = "<div class='sod-revoke-note'>"+note+"</div>";
    }

    return note;
};