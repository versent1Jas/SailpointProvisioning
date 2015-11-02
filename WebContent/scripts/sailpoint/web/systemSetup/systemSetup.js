function showTabPane(id, index) {
  displayAppropriatePane(id, 'button'+index);
  $('editForm:activeTab').value = index;
}

var isPageDirty = false;
function makePageDirty() {
  isPageDirty = true;
  // Return false so that we don't accidentally submit the form
  return false;
}

function initTabs() {

  var tabContainer = Ext.get('systemSetupTabs');
  if (tabContainer == null) 
      return;

  var tabPanel = new Ext.TabPanel({
      id: 'identitySettingsTabPan',
      renderTo:'systemSetupTabs',
      border:false,
      plain: true,
      activeTab: ACTIVE_TAB,
      width: $('systemSetupTabs').clientWidth,
      items: [
              {title: '#{msgs.sys_config_tab_mailsettings}', contentEl: 'mailPanelContent'},
              {title: '#{msgs.sys_config_tab_workItems}', contentEl: 'workItemPanelContent'},
              {title: '#{msgs.sys_config_tab_identities}', contentEl: 'identitiesPanelContent'},
              {title: '#{msgs.sys_config_tab_roles}', contentEl: 'rolePanelContent'},
              {title: '#{msgs.sys_config_tab_password}', contentEl: 'passwordPanelContent'},
              {title: '#{msgs.sys_config_tab_miscellaneous}', contentEl: 'miscPanelContent'}
      ]
  });
}

Ext.onReady(function() {
  initTabs();
});

function onHashSecretsChanged(el) {
    var IIQ_POLICY = 'Identity Password Policy';

    function doToggle() {
        makePageDirty();
        toggleInvalidFieldsForHashing(el.checked);
    }

    function containsIIQPolicy(values) {
        return Ext.Array.contains(values, IIQ_POLICY);
    }

    function isClientConfiguredForHash() {
        var trivial = $('editForm:passwordTriviality'),
            chars = $('editForm:minHistoryChars'),
            caseCheck = $('editForm:caseSensitiveCheck');

        return trivial.checked === false &&
               caseCheck.checked === false &&
               chars.value === '';
    }

    if (el.checked) {
        Ext.Ajax.request({
            url: SailPoint.getRelativeUrl('/rest/passwordPolicy/invalidHashPolicies'),
            success: function(response) {
                var result = Ext.JSON.decode(response.responseText),
                    tpl;

                // it could be the case that the identity policy that is currently
                // saved conflicts with hashing but they have made changes in the
                // UI that to solve the conflict so check to see if the policy is
                // conflicting and if it is check the pending changes
                if (containsIIQPolicy(result.objects) && isClientConfiguredForHash()) {
                    Ext.Array.remove(result.objects, IIQ_POLICY);
                }

                if (result.objects.length === 0) {
                    doToggle();
                } else {
                    el.checked = false;

                    tpl = new Ext.XTemplate(
                        '<p>#{msgs.sys_config_msg_invalid_constraints}</p>',
                        '<br />',
                        '<ul>',
                            '<tpl for=".">',
                                '<li>{.}</li>',
                            '</tpl>',
                        '</ul>'
                    );

                    Ext.MessageBox.show({
                        title: '#{msgs.sys_config_msg_invalid_constraints_title}',
                        buttons: Ext.MessageBox.OK,
                        modal: true,
                        msg: tpl.apply(result.objects)
                    });
                }
            },
            failure: function(response, opts) {
                SailPoint.EXCEPTION_ALERT(
                    "An error occurred while attempting to get conflicting password policies"
                );
            }
        });
    } else {
        doToggle();
    }
}

function toggleInvalidFieldsForHashing(enabled) {
	toggleInvalidPolicyFieldsForHashing(enabled);
	
	var el = $('editForm:hashingIterations');
	if (el) {
		el.disabled = !enabled;
		SailPoint.toggleClass('.nothash', 'disabled', !enabled);
	}
}

function toggleInvalidPolicyFieldsForHashing(enabled) {
    var el, i, field, fields = [{
            id: 'editForm:passwordTriviality',
            isCheckbox: true
        }, {
            id: 'editForm:minHistoryChars',
            isCheckbox: false
        }, {
            id: 'editForm:caseSensitiveCheck',
            isCheckbox: true
        }];

    for (i = 0; i < fields.length; i++) {
        field = fields[i];

        el = $(field.id);
        if (el) {
            el.disabled = enabled;

            // if enabled then either uncheck or clear value
            if (enabled) {
                if (field.isCheckbox) {
                    el.checked = false;
                } else {
                    el.value = '';
                }
            }
        }
    }

    SailPoint.toggleClass('.hash', 'disabled', enabled);
}

Ext.onReady(function() {
    var el = $('editForm:hashIdentitySecrets');
    if (el) {
        toggleInvalidFieldsForHashing(el.checked);
    }
});
