SailPoint.LCM.RequestAccess.ACTION_CHOOSE_INSTANCE = 1;
SailPoint.LCM.RequestAccess.ACTION_CHOOSE_NATIVE_IDENTITY = 2;
SailPoint.LCM.RequestAccess.ACTION_CREATE_ACCOUNT = 3;

Ext.define('SailPoint.LCM.RequestAccessAccountChoiceWindow', {
  extend : 'Ext.window.Window',
  account_request: null,
  
  /** Panels **/
  formPanel : null,
  detailsPanel : null,
    
  /** Whether this is bulk request **/
  isBulk: false,
  
  constructor : function(config){
      
      Ext.apply(this, {
          account_request: config.account_request,
          hasInstances: config.hasInstances, 
          isBulk: (!SailPoint.LCM.RequestAccess.identityId || SailPoint.LCM.RequestAccess.identityId == "")
      });
    
    this.template = new Ext.XTemplate(
        '<tpl for=".">',
          '<p class="accountChoiceDetailsInstructions">#{msgs.lcm_request_access_account_instructions}</p>',
          '<div class="accountChoiceDetails">',
            '<table class="details">',
              '<tr><td><label>#{msgs.name}:</label></td><td class="pl">{arguments.displayableName}</td></tr>',
              '<tr><td><label>#{msgs.application}:</label></td><td class="pl">{application}</td></tr>',
              '<tr><td><label>#{msgs.owner}:</label></td><td class="pl">{arguments.owner}</td></tr>',
            '</table>',
          '</div>',
        '</tpl>');
    
    this.detailsPanel = Ext.create('Ext.panel.Panel', {
      height:125,
      bodyStyle: 'padding: 10px;',
      region: 'north',
      tpl:  this.template,
      data: this.account_request
    });
    
    //For bulk requests, create a panel for each identity in config.identityMap
    var formItems = [];
    if (!this.isBulk) {
        var accountPanel = this.createSelectAccountPanel(SailPoint.LCM.RequestAccess.identityId, SailPoint.LCM.RequestAccess.identityName, config.action_type);
        formItems.push(accountPanel);
    } else if (config.identityMap) {
        for (var requesteeId in config.identityMap) {
            if (config.identityMap.hasOwnProperty(requesteeId)) {
                var accountPanel = this.createSelectAccountPanel(requesteeId, config.identityMap[requesteeId], config.actionMap[requesteeId]);
                formItems.push(accountPanel);
            }
        }
    }
    
      this.formPanel = Ext.create('Ext.form.Panel', {
          id: 'selectAccountFormPanel',
          region: 'center',
          defaults: {
              // applied to each contained panel
              padding: '0 0 5 0'
          },
          overflowY: 'auto',
          items: formItems
      });

      Ext.apply(config, {
        title: Ext.String.format("#{msgs.lcm_request_access_select_account_title}", config.account_request.arguments.displayableName),
        id: 'accountChoiceWindow',
        layout:'border',
        width:600,
        height:(formItems.length == 1) ? 300 : 400,
        items : [this.detailsPanel, this.formPanel],
        listeners: {
            close: function() {
                Ext.MessageBox.hide();
            }
        },
        buttons: [
          {
            text:'#{msgs.button_continue}',
            handler: function() {
              var window = Ext.getCmp('accountChoiceWindow');
                if(window.formPanel.getForm().isValid()) {
                    var panels = window.formPanel.queryBy(function(component){
                        return (component instanceof SailPoint.LCM.RequestAccessSelectAccountPanel);
                    });
                    
                    if (panels != null && panels.length > 0) {
                        for (i = 0; i < panels.length; i++) {
                            window.updateAccountRequest(window.account_request, panels[i]);
                        }
                    }

                    if (window.account_request.nativeIdentity === 'new' || window.isBulk) {
                        // This is a request for a new account or a bulk request.                        
                        // We're done.
                        Ext.getCmp('requestAccessList').addRequest(window.account_request);
                        window.close();
                    }
                    else {
                        // Well now we have to check their selection again.  Now that
                        // they've chosen an account to which to apply this entitlement,
                        // we need to to check again and make sure that this new account
                        // doesn't already have the entitlement.
                        var requests = [];
                        requests.push(window.account_request);
                        
                        Ext.Ajax.request({
                            method: 'POST',
                            url: SailPoint.getRelativeUrl('/rest/requestAccess/additionalQuestions'),
                            success: function(response) {
                                
                                // decode the response
                                var data = Ext.JSON.decode(response.responseText);
                                var dataStatus = data.status;
    
                                // Based on the response, what should we do?
                                switch(dataStatus) {
                                    case SailPoint.LCM.RequestAccess.RequestedObjectStatus.ADD_TO_CART:
                                        // This is what happens when the account selection is successful.
                                        // Add the request and close the dialog.
                                        Ext.getCmp('requestAccessList').addRequest(window.account_request);
                                        window.close();
                                        break;
    
                                    case SailPoint.LCM.RequestAccess.RequestedObjectStatus.PROMPT_PERMITTED_ROLES:
                                        // Huh? Permitted roles?  We're way off course if we end up here.
                                        // We're trying to find out to which account you want to apply the entitlement.
                                        break;
    
                                    case SailPoint.LCM.RequestAccess.RequestedObjectStatus.PROMPT_ACCOUNT_SELECTION:
                                        // We're already here.
                                        break;
    
                                    case SailPoint.LCM.RequestAccess.RequestedObjectStatus.PENDING_REQUEST:
                                        Ext.Msg.alert('#{msgs.lcm_request_access_unable_add_cart_title}', '#{msgs.lcm_request_access_pending_request}');
                                        break;
    
                                    case SailPoint.LCM.RequestAccess.RequestedObjectStatus.CURRENTLY_ASSIGNED:
                                        Ext.Msg.alert('#{msgs.lcm_request_access_unable_add_cart_title}', '#{msgs.lcm_request_access_currently_assigned}');
                                        break;
                                  
                                    case SailPoint.LCM.RequestAccess.RequestedObjectStatus.INVALID_REQUESTEES:
                                        var message = Ext.String.format('#{msgs.lcm_request_err_invalid_requestees}', data.invalidObject, data.invalidRequestees);
                                        Ext.Msg.alert('#{msgs.lcm_request_err_invalid_requestees_title}', message);
                                        break;
                                }
                            },
                            params: {'request':        Ext.JSON.encode(requests),
                                     'identityId':     SailPoint.LCM.RequestAccess.identityId,
                                     'allowPermitted': SailPoint.LCM.RequestAccess.allowPermitted},
                            scope: this
                        });
                    }
                }        
            } 
          },
          {
            text:'#{msgs.button_cancel}', cls : 'secondaryBtn', window: this, handler: function() { Ext.getCmp('accountChoiceWindow').close(); }
          }
        ]
    });
    Ext.apply(this, config);
    
    this.callParent(arguments);
  },
  
  setAccountRequest: function(account_request) {
    this.account_request = account_request;
    this.setTitle(Ext.String.format("#{msgs.lcm_request_access_select_account_title}", account_request.arguments.displayableName));
    this.detailsPanel.update(this.account_request);
  },
  
  getApplication : function() {
      return (this.account_request) ? this.account_request.application : null;
  },
    
  createSelectAccountPanel : function(identityId, identityName, action_type) {
      return Ext.create('SailPoint.LCM.RequestAccessSelectAccountPanel',
          {
             action_type: action_type,
             identityId: identityId,
              identityName: identityName,
             account_request: this.account_request,
             hasInstances: this.hasInstances
              
          });
  },

    /**
     *  Set the native identity nad instance information in the account request.
     *  For bulk requests, create an account info object and store it in the 
     *  arguments temporarily
     */
  updateAccountRequest : function(account_request, selectAccountPanel) {
      var nativeIdentity = selectAccountPanel.getNativeIdentity();
      if(nativeIdentity=='#{msgs.lcm_request_entitlements_create_account_option_desc}') {
          nativeIdentity = 'new';
          if (!this.isBulk) {
              account_request.operation = SailPoint.LCM.RequestAccess.MODIFY;
          }
      }
      
      var instance = selectAccountPanel.getInstance();

      if (this.isBulk) {
          var accountInfo = new SailPoint.LCM.RequestAccess.AccountInfo();
          accountInfo.identityId = selectAccountPanel.getIdentityId();
          accountInfo.nativeIdentity = nativeIdentity;
          accountInfo.instance = instance;

          if (!account_request.arguments.accountInfos) {
              account_request.arguments.accountInfos = [];
              account_request.arguments.accountInfoIds = accountInfo.id;
          } else {
              account_request.arguments.accountInfoIds = account_request.arguments.accountInfoIds + "," + accountInfo.id;
          }

          account_request.arguments.accountInfos.push(accountInfo);
          
      } else {
          account_request.nativeIdentity = nativeIdentity;
          account_request.instance = instance;
      }
  }
    
});