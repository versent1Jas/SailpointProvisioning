/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/*
 * Functions and stuff for the edit certification schedule page - editCertificationSchedule.xhtml
 *
 *
 * NOTE: After upgrading Tomahawk libraries, the tomahawk dataList has a bug with the ForceIdIndexFormula
 * For some strange reason, instead of generating formname:idindexevaluation it is truncating the last letter
 * of the form name and not including the :. A bug has been opened with Apache:
 * https://issues.apache.org/jira/browse/TOMAHAWK-1663
 * Once this is fixed, we can revert this revision. -rshea
  * See also svn #46173, bugzilla #16824
 */

Ext.ns('SailPoint');

SailPoint.CertificationScheduleForm = {

    cachedManagerInfo: {
        objectId: '',
        valueHasChanged: '',
        selectedFromList: '',
        value: ''
    },

    // A map of component ID to a function that will initialize the component.
    ajaxComponentInitializers: null,


    /**
     * Submit the schedule if validation was successful, possibly confirming if
     * the schedule looks like it could create lots of certs.
     */
    confirmAndSubmit: function(doConfirm) {

        var isInvalid = $('certificationScheduleForm:errorMessageInput').value;
        if(isInvalid !== 'true') {
            this.confirmRiskyCerts(doConfirm);
        }
        else {
            // The buttons were disabled when the submit was clicked, enable
            // them again because we're not done yet.
            Ext.getCmp('schedulePanel').reEnableButtons();
        }
    },

    /**
     * If the schedule looks like it could create a lot of certifications (aka -
     * is risky), popup a confirmation before actually saving the schedule.
     *
     * @param  doConfirm  Whether confirmation is required.
     */
    confirmRiskyCerts: function(doConfirm) {

        var warnings = [];

        // If certifying based on application, see if multiple or global are
        // selected.
        if (doConfirm) {
            var apps = Ext.getCmp('certifyAppNameMultiSuggest');
            if (apps) {
                var globalApp = $('certificationScheduleForm:globalAppCheckbox');
                if (globalApp.checked) {
                    warnings.push('#{msgs.cert_schedule_risk_global_application}');
                }
                else {
                    var numApps = apps.getValue().length;
                    if (numApps > 1) {
                        warnings.push('#{msgs.cert_schedule_risk_multiple_applications}');
                    }
                }
            }

            // If this is a manager cert, warn for the global option.
            var globalMgr = $('certificationScheduleForm:globalMgrCheckbox');
            if (globalMgr && globalMgr.checked) {
                warnings.push('#{msgs.cert_schedule_risk_global_manager}');
            }

            // If selecting roles for the cert, check for a type or global.
            var roleType = $('roleTypeSelection');
            var globalRole = $('globalRoleSelection');
            if (roleType) {
                if (roleType.checked) {
                    warnings.push('#{msgs.cert_schedule_risk_roles_by_type}');
                }
                else if (globalRole.checked) {
                    warnings.push('#{msgs.cert_schedule_risk_global_role}');
                }
            }

            // If "included applications" is available, check it.
            var includedApps = Ext.getCmp('certifyIncludedAppMultiSuggestCmp');
            if (includedApps) {
                var numIncludedApps = includedApps.getValue().length;
                if (0 === numIncludedApps) {
                    warnings.push('#{msgs.cert_schedule_risk_all_included_applications}');
                }
                else if (numIncludedApps > 1) {
                    warnings.push('#{msgs.cert_schedule_risk_multiple_included_applications}');
                }
            }

            if (warnings.length > 0) {
                var msg = '#{msgs.cert_schedule_confirm_risky_schedule_body}';
                msg += '<ul style="margin-top: 10px">';
                warnings.each(function(warning) {
                    msg += '<li>' + warning + '</li>';
                });
                msg += '</ul>';
                Ext.MessageBox.confirm('#{msgs.cert_schedule_confirm_risky_schedule_title}',
                                       msg,
                                       function(btnId) {
                                           if ('yes' === btnId) {
                                               $('certificationScheduleForm:scheduleCertifyBtn').click();
                                           }
                                           else {
                                               // Re-enable the buttons.
                                               Ext.getCmp('schedulePanel').reEnableButtons();
                                           }
                                       });
                return;
            }
        }

        // If we got here there were no warnings, so submit.
        $('certificationScheduleForm:scheduleCertifyBtn').click();
    },

    preScheduleBulkCertification: function(vCheckbox, formName, errorDiv) {
        if(vCheckbox.count < 1) {
            errorDiv.innerHTML = "<div class='formError'> "+'#{msgs.err_select_one_identity}' +" </div>";
            errorDiv.style.display='';
            return;
        } else {
           $(formName + ':idsToCertify').value = arrayToString(vCheckbox.getSelectedValues(), true);
           $(formName + ':certifyAll').value = vCheckbox.allChecked;
           $(formName + ':scheduleCertificationBtn').click();
        }
    },
    
    /**
     * When the date changes we need to redo
     * the calculations for dates for reminders
     * and escaltions
     */
    updateNotifications : function() {
      if (typeof certification_notifications != 'undefined') {
        certification_notifications.updateStartAndEndDates();
      }
    },

    /**
     * Called after any form submission - ajax or otherwise.  This makes sure
     * the layout is correct after re-rendering.
     */
    postSubmit: function() {
        // Re-layout the viewport so that the error messages won't cover the wizard.
        var viewport = Ext.getCmp('spViewport');
        if (null != viewport) {
            viewport.doLayout();
        }
        
        buildTooltips();
    },

    /**
     * Add an initializer function for the given component ID to be executed at
     * a later time.  There were some timing problems in IE where suggest
     * components were getting initialized in javascript within an ajax panel.
     * Even though this was in an Ext.onReady() this was getting executed before
     * the div that it was being rendered to was available in the DOM.  To get
     * around this, we'll add the initializers for these components as we
     * encounter them and later initialize them using initializeAjaxComponents().
     * These are keyed by component ID so we don't added duplicates.
     *
     * @param compId {String}    The ID of the component.
     * @param fn     {Function}  A function to be called to initialize the
     *                           component.
     */
    addAjaxComponentInitializer: function(compId, fn) {
        if (null == this.ajaxComponentInitializers) {
            this.ajaxComponentInitializers = {};
        }

        if (null == this.ajaxComponentInitializers[compId]) {
            this.ajaxComponentInitializers[compId] = fn;
        }
    },

    /**
     * Initializer all AJAX components that have been added via
     * addAjaxComponentInitializer().  This clears all initializers when
     * finished, so it is safe to call multiple times.
     */
    initializeAjaxComponents: function() {
        if (null != this.ajaxComponentInitializers) {
            for (var initializer in this.ajaxComponentInitializers) {
                this.ajaxComponentInitializers[initializer].call();
            }
            this.ajaxComponentInitializers = null;
        }
    },

    toggleRecipient: function(recipCompId, isChecked, continuousHasLaunched) {
        var suggest = Ext.getCmp(recipCompId);
        if (suggest == undefined)
            return;

        if (isChecked) {
            // Cache the info
            this.cachedManagerInfo.value = suggest.getValue();
            // Null out the info and replace it with the text 'All Managers' - since the field is now disabled, it won't get submitted
            suggest.disable();
            suggest.setValue('#{msgs.all_managers}');
        } else {
            if (!continuousHasLaunched) {
                // Restore the info in case it was accidentally wiped
                suggest.enable();
                if (this.cachedManagerInfo.value != '')
                    suggest.setValue(this.cachedManagerInfo.value);

                if (suggest.getValue() == '#{msgs.all_managers}')
                    suggest.setValue('');
            }
        }
    },

    toggleMultiSuggest: function(compId, isChecked, msg, continuousHasLaunched) {
        var msuggest = Ext.getCmp(compId);

        // if there's no component, must not need this right now
        if (msuggest == undefined) {
            return;
        }

        msuggest.toggleSelectAll(isChecked, msg, !continuousHasLaunched);
    },

    /**
     * Called when one of the "global" checkboxes is selected when scheduling
     * a certification to toggle the state of the explicit selection component.
     */
    globalClicked: function(isChecked, continuousHasLaunched) {
        this.toggleRecipient('crsComponent', isChecked, continuousHasLaunched);
        this.toggleMultiSuggest('certifyAppNameMultiSuggest',
            isChecked, '#{msgs.all_applications}', continuousHasLaunched);
        this.toggleMultiSuggest('certifyRoleMultiSuggest',
            isChecked, '#{msgs.select_item_all_biz_roles}', continuousHasLaunched);

        if ($('certificationScheduleForm:includeRoleHierarchy')){
            if (isChecked)
              $('certificationScheduleForm:includeRoleHierarchy').disabled=true;
            else
              $('certificationScheduleForm:includeRoleHierarchy').disabled=false;
        }
        // clear application object type when all applications is selected
        var chkBox = $('certificationScheduleForm:selectGroupsCheckboxId');
        if (chkBox) {
            if (isChecked === true) {
              if (chkBox.checked === true) {
                  chkBox.click();
              }
              chkBox.disabled = true;
            } else {
                chkBox.disabled = false;
            }
        }
    },

    roleTypeFilterChanged: function(type, continuousHasLaunched){
        this.globalClicked(type=="Global", continuousHasLaunched);
        this.toggleMultiSuggest('certifyRoleMultiSuggest', type!=="Manual",
                    '#{msgs.select_item_all_biz_roles}', continuousHasLaunched);
        this.toggleRoleTypeSelect(type=="Type");

        var glblCheckbox = $('certificationScheduleForm:globalRoleCheckbox');
        glblCheckbox.checked = type=="Global";
    },

    toggleRoleTypeSelect: function(enabled){
        var roleTypeSelect = $('certificationScheduleForm:roleTypeSelect');
        if (roleTypeSelect){
            roleTypeSelect.disabled = !enabled;
            if (!enabled){
                for(var i=0;i<roleTypeSelect.options.length;i++){
                    roleTypeSelect[i].selected = false;
                }
            }
        }
    },

    /**
     * Click handler for the "Run Now" checkbox on the cert schedule page.
     *
     * @param  runNowCheckbox   The run now checkbox.
     * @param  startDatePrefix  The prefix for the start date elements.
     */
    runNowClicked: function(runNowCheckbox, startDatePrefix) {

        // If we are running now, set the start date to now.  This will cause the
        // active/challenge/remediation durations to get recalculated correctly.
        if (runNowCheckbox.checked) {
            var day = $(startDatePrefix + '.day');
            var month = $(startDatePrefix + '.month');
            var year = $(startDatePrefix + '.year');

            var now = new Date();
            day.value = now.getDate();
            month.value = now.getMonth() + 1;
            year.value = now.getFullYear();
        }

        // Enable/disable the start date fields.
        toggleInputDate($(startDatePrefix), runNowCheckbox.checked);
    },

    /**
     * Fired when the user enables escalation. This will disable or enable the 'Once' option
     * on the reminder frequency input for the given escalation type.
     *
     * @param elementPrefix : Type prefix of the checkbox. This allows us to find the table which contains
     *  the checkbox.
     * @param selected : Is checkbox checked
     * @param continuousLaunched : Is current certification continuous and launched. If so, we won't
     *  touch make any modifications to the UI since the elements we care about will be read-only.
     */
    toggleEscalationEvent: function(elementPrefix, selected, continuousLaunched){

        // If this is a launched continuous cert, the radio will be read-only
        if (continuousLaunched)
            return;

        var radioName = 'certificationScheduleForm:' + elementPrefix + 'reminderFreq';
        var radios = document.getElementsByName(radioName);
        if (radios && radios.length > 0){
            radios[0].disabled= selected;
            radios[0].parentNode.style.color = selected ? '#C0C0C0' : '#000000';
            if (selected && radios[0].checked){
                radios[0].checked = false;
                radios[1].checked = true;
            }
        }
    },

    /**
     * Create timed observers for the given myfaces calendar widget and click the
     * given button if the day, month, or year changes.
     *
     * @param  dateFieldName  Name of the date component (eg - editForm:dateField).
     * @param  btnToClick     The name of the button to click when a change is
     *                        detected.
     */
    observeDateChange: function(dateFieldName, btnToClick) {

        new Form.Element.Observer(dateFieldName + ".day",
                                  0.2,  // 200 milliseconds
                                  function(el, value){
                                      $(btnToClick).click();
                                  });
        new Form.Element.Observer(dateFieldName + ".month",
                                  0.2,  // 200 milliseconds
                                  function(el, value){
                                      $(btnToClick).click();
                                  });
        new Form.Element.Observer(dateFieldName + ".year",
                                  0.2,  // 200 milliseconds
                                  function(el, value){
                                      $(btnToClick).click();
                                  });
    },

    /**
     * The given certifier type was selected.  Enable/disable the appropriate
     * fields and set the hidden value.
     */
    certifierTypeSelected: function(certifierType) {
        var mgrSelect = Ext.getCmp('defaultCertifierSuggestComp');
        var manualSuggest = Ext.getCmp('certifiersMultiSuggestComp');

        if ('Manager' === certifierType) {
            mgrSelect.show();
            manualSuggest.hide();
        }
        else if ('Manual' === certifierType) {
            mgrSelect.hide();
            manualSuggest.show();
        }
        else {
            alert('Unknown certifier type: ' + certifierType);
        }

        $('certificationScheduleForm:hiddenCertifierSelectionType').value = certifierType;
    },

    certificationFrequencyChanged: function(selectBox, existingCertGroup) {
        var selectedVal = selectBox.options[selectBox.selectedIndex].value;
        var isContinuous = ('continuous' === selectedVal);

        var activeOptions = $('activeOptions');
        var activePeriodEnterRule = $('activePeriodEnterRule');
        var challengeDates = $('certificationScheduleForm:challengeDates');
        var remediationDates = $('certificationScheduleForm:remediationDates');
        var notifications = $('certificationNotification');
        var notificationHeader = $('certificationNotificationHeader');
        var notificationOptions = $('certificationNotificationOptions');
        var escalationHeader = $('certEscalationHeader');
        var escalationOptions = $('certEscalationOptions');
        var revokeNow = $('processRevokesImmediately');
        var excludeInactive = $('excludeInactive');
        var approverRule = $('signOffApproverRule');
        var endPhaseRule = $('endPhaseRule');
        var automaticClosingHeader = $('automaticClosingHeader');
        var automaticClosingOptions = $('automaticClosingOptions');

        var certifiedDuration = $('certifiedDuration');
        var certReqDuration = $('certificationRequiredDuration');
        var certReqReminderHeader = $('certRequiredReminderHeader');
        var certReqReminderOptions = $('certRequiredReminderOptions');
        var overdueEscalationHeader = $('overdueEscalationHeader');
        var overdueEscalationOptions = $('overdueEscalationOptions');
        var autoSignoffPopupOption = $('autoSignoffPopupOption');
        var requireSubordinateCompletionOption = $('requireSubordinateCompletionOption');
        var autoSignOffWhenNothingToCertifyRow = $('autoSignOffWhenNothingToCertifyRow');
        var requireReassignmentCompletionRow = $('requireReassignmentCompletionRow');
        var returnReassignmentsToOriginalRow = $('returnReassignmentsToOriginalRow');
        var autoSignOffRow = $('autoSignOffRow');
        var eSigOption = $('eSigOption');
        var eSigConfig = $('eSigConfig');
        var eSigEnabledSelect = $('certificationScheduleForm:eSigEnabledSelect');
        var partitionSectionTitle = $('partitionSectionTitle');
        var partitionSectionEnable = $('partitionSectionEnable');

        var periodicFields =
            $A([activeOptions, activePeriodEnterRule, challengeDates, remediationDates, notifications,
                notificationHeader, notificationOptions,
                revokeNow, approverRule, endPhaseRule,
                automaticClosingHeader, automaticClosingOptions, autoSignoffPopupOption, requireSubordinateCompletionOption, autoSignOffWhenNothingToCertifyRow,
                requireReassignmentCompletionRow, returnReassignmentsToOriginalRow, autoSignOffRow, eSigOption, eSigConfig, partitionSectionTitle, partitionSectionEnable]);
        var continuousFields =
            $A([certifiedDuration, certReqDuration, certReqReminderHeader,
                certReqReminderOptions, overdueEscalationHeader,
                overdueEscalationOptions]);

        _showOrHide(periodicFields, !isContinuous);
        _showOrHide(continuousFields, isContinuous);

        $('certificationScheduleForm:continuous').value = isContinuous;

        if ($('certificationScheduleForm:completeReassignments')) {
            if (isContinuous) {
                $('certificationScheduleForm:completeReassignments').checked = false;
                $('certificationScheduleForm:completeReassignments').disabled = true;
                $('certificationScheduleForm:autoSignOffOnReassignments').checked = false;
                $('certificationScheduleForm:autoSignOffOnReassignments').disabled = true;
                $
            } else {
                $('certificationScheduleForm:completeReassignments').disabled = existingCertGroup;
                $('certificationScheduleForm:autoSignOffOnReassignments').disabled = existingCertGroup;
            }
        }
        
        if (!isContinuous && eSigEnabledSelect.checked == false) {
        	_showOrHide($A([eSigConfig]),false);
        }
    },

    /**
     * The "process revokes immediately" checkbox on the certification schedule page
     * was toggled.  Hide or show the challenge and remediation period dates as
     * appropriate.
     *
     * @param  checkbox  The "process revokes immediately" checkbox.
     */
    processRevokesImmediatelyToggled: function(checkbox) {

        var dateElts = $A([$('certificationScheduleForm:challengeDates'),
                           $('certificationScheduleForm:remediationDates')]);
        _showOrHide(dateElts, !checkbox.checked);
    },

    toggleCertificationPhaseOptions: function(checkbox, target) {

        showHideWithLock(target, checkbox);

    },
    toggleScheduleEmailOptions: function(daysBeforeEnd, maxReminders, sendRemindersCheck, target) {

        if ((null != $(daysBeforeEnd)) && (null != $(maxReminders))) {
            if (sendRemindersCheck.checked) {
                $(daysBeforeEnd).hide();
                $(maxReminders).show();
            }
            else {
                $(daysBeforeEnd).show();
                $(maxReminders).hide();
            }
        }

        showHideWithLock(target, sendRemindersCheck);
    },

    toggleGroupSelections: function(newValue) {
        this.toggleAdvancedCertSelections('.deleteGroupFlag', newValue);
    },

    toggleFactorySelections: function(newValue) {
        this.toggleAdvancedCertSelections('.deleteFactoryFlag', newValue);
    },

    toggleAdvancedCertSelections: function(className, newValue) {
        var inputs = Ext.DomQuery.select(className);
        for (var i = 0; i < inputs.length; ++i) {
            inputs[i].checked = newValue;
        }
    },

    updateAutoSignoffOption: function() {
        var isCompletionRequired = $('certificationScheduleForm:completeReassignments').checked;
        var isAutoSignoffDisabled = $('certificationScheduleForm:completeReassignments').checked || $('certificationScheduleForm:assimilateBulkReassignments').checked;
        $('certificationScheduleForm:autoSignOffOnReassignments').disabled = isAutoSignoffDisabled;
        if (isAutoSignoffDisabled) {
            $('certificationScheduleForm:autoSignOffOnReassignments').checked = false;
        }
    },

    onApproverRuleSelectionChange : function() {
      if (Ext.get('certificationScheduleForm:approverRules') == null) {
        return;
      }
      var selectedIndex = Ext.get('certificationScheduleForm:approverRules').dom.selectedIndex;
      if ((selectedIndex == 0 && Ext.get('approvalEmailTemplateConfig').isVisible()) ||
            (selectedIndex != 0 && !Ext.get('approvalEmailTemplateConfig').isVisible())) {
        showHideWithLock($('approvalEmailTemplateConfig'));
      }
    },

    onPreDelegationRuleSelectionChange : function() {
      if (Ext.get('certificationScheduleForm:preDelegationRules') == null) {
        return;
      }
      var selectedIndex = Ext.get('certificationScheduleForm:preDelegationRules').dom.selectedIndex;
      if (selectedIndex == 0) {
        if (Ext.get('preDelegationEmailTr').isVisible()) {
          showHideWithLock($('preDelegationEmailTr'));
        }
      } else {
        if (!Ext.get('preDelegationEmailTr').isVisible()) {
          showHideWithLock($('preDelegationEmailTr'));
        }
      }
    },
    
    wizard : null,
    
    /**
     * Creates the CompactMultiSuggest components
     */
    createGroupSuggests: function(disabled) {
    	var groupIdElements = Ext.select('input.groupDefinitionId');
    	if (groupIdElements) {
    		groupIdElements.each(function(e) {
    		    var groupId = e.getValue();
    		    var groupCertifiers = Ext.JSON.decode(Ext.get('groupDefinitionCertifiers_' + groupId).getValue());
    			
    		    new SailPoint.CompactMultiSuggest({
                    id: 'groupCertifiersComp_' + groupId,
                    renderTo: 'groupCertifiersSuggest_' + groupId,
                    inputFieldName: 'certificationScheduleForm:ipopsTabl' + groupId + ':groupCertifiersInput',
                    suggestType: 'identity',
                    jsonData: groupCertifiers,
                    baseParams: {'context': 'Owner'},
                    disabled: disabled,
                    contextPath: CONTEXT_PATH
                });
    		});
    	}
    }, 
    
    toggleIncludeAccessOptions : function (input) {
    	
      	if (input.value == 'true') {
      		// Incuded Access = Accounts
      		$('includeAccessOptions').hide();
        	$('certificationGranularityRow').hide();

			this.toggleIncludeAccessOptionsDisableFields(true);        	
			this.toggleIncludeAccessOptionsRestFields(true);        	
      	} else {
      		// Included Access = Entitlements
        	$('includeAccessOptions').show();
        	$('certificationGranularityRow').show();

			this.toggleIncludeAccessOptionsDisableFields(false);        	
			this.toggleIncludeAccessOptionsRestFields(false);        	
      	}
    },
    
    //disable / enable related fields, called in toggleIncludeAccessOptions() and OnReady() in editCertificationBehavior.xhtml
    toggleIncludeAccessOptionsDisableFields : function(includedAccessAccount) {

		var includeAccessOptionsElement = $('includeAccessOptions');
		if (!includeAccessOptionsElement) {
			return;
		}    	
        var enableAccountRevoke = $('certificationScheduleForm:enableAccountRevoke');//Behavior -> Decisions -> Enable Account Revocation 
        if (!enableAccountRevoke) {
        	return;
        }
        
        var enableBulkRevocationWorksheet = $('certificationScheduleForm:enableListViewBulkRevoke');//Behavior -> Bulk Actions -> Enable Bulk Revocation -> Worksheet View
        var enableBulkRevocationDetail = $('certificationScheduleForm:enableEntityBulkRevoke');//Behavior -> Bulk Actions -> Enable Bulk Revocation -> Detail View
        
        var enableBulkAccountRevocationWorksheet = $('certificationScheduleForm:enableListBulkAccountRevocation');//Behavior -> Bulk Actions -> Enable Bulk Account Revocation -> Worksheet View
        var enableBulkAccountRevocationDetail = $('certificationScheduleForm:enableEntityBulkAccountRevocation');//Behavior -> Bulk Actions -> Enable Bulk Account Revocation -> Detail View
    	
      	if (includedAccessAccount === true) {
        	enableBulkRevocationWorksheet.disable();
        	enableBulkRevocationDetail.disable();
        	enableBulkAccountRevocationWorksheet.enable();
        	enableBulkAccountRevocationDetail.enable();
      	} else {
        	enableBulkRevocationWorksheet.enable();
        	enableBulkRevocationDetail.enable();
        	enableBulkAccountRevocationWorksheet.disable();
        	enableBulkAccountRevocationDetail.disable();
      	}
    },
    
    //reset values for related fields, called in toggleIncludeAccessOptions()
    toggleIncludeAccessOptionsRestFields : function(includedAccessAccount) {

		var includeAccessOptionsElement = $('includeAccessOptions');
		if (!includeAccessOptionsElement) {
			return;
		}    	
        var enableAccountRevoke = $('certificationScheduleForm:enableAccountRevoke');//Behavior -> Decisions -> Enable Account Revocation 
        if (!enableAccountRevoke) {
        	return;
        }
        
        var enableBulkRevocationWorksheet = $('certificationScheduleForm:enableListViewBulkRevoke');//Behavior -> Bulk Actions -> Enable Bulk Revocation -> Worksheet View
        var enableBulkRevocationDetail = $('certificationScheduleForm:enableEntityBulkRevoke');//Behavior -> Bulk Actions -> Enable Bulk Revocation -> Detail View
        
        var enableBulkAccountRevocationWorksheet = $('certificationScheduleForm:enableListBulkAccountRevocation');//Behavior -> Bulk Actions -> Enable Bulk Account Revocation -> Worksheet View
        var enableBulkAccountRevocationDetail = $('certificationScheduleForm:enableEntityBulkAccountRevocation');//Behavior -> Bulk Actions -> Enable Bulk Account Revocation -> Detail View
    	
      	if (includedAccessAccount === true) {
        	enableAccountRevoke.checked = true;
        	enableBulkRevocationWorksheet.checked = false;
        	enableBulkRevocationDetail.checked = false;
        	enableBulkAccountRevocationWorksheet.checked = true;
        	enableBulkAccountRevocationDetail.checked = true;
      	} else {
        	enableAccountRevoke.checked = false;
        	enableBulkRevocationWorksheet.checked = true;
        	enableBulkRevocationDetail.checked = true;
        	enableBulkAccountRevocationWorksheet.checked = false;
        	enableBulkAccountRevocationDetail.checked = false;
      	}
    },
    
    toggleRequireElectronicSignature : function(eSigEnabledSelect) {
    	// disable the hidden field so the e sig name is not submitted in the post
    	if (! eSigEnabledSelect.checked) {
    		var eSigName = $('certificationScheduleForm:electronicSignatureName');
    		eSigName.disabled = true;
    		eSigName.value = '';
    		var eSigComboBoxExt = Ext.getCmp('electronicSignatureExt');
    		eSigComboBoxExt.setValue('');
    	}
    	
    }
};
