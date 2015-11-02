/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.LCM.ManageAccounts');

SailPoint.LCM.ManageAccounts.vRadio = new SailPoint.VirtualRadioButton('manageAccountsGrid','accountAction');
SailPoint.LCM.ManageAccounts.DECISIONS = "IIQ_decisions";
SailPoint.LCM.ManageAccounts.STATUS = "IIQ_status";
SailPoint.LCM.ManageAccounts.STATUS_CLASS = "IIQ_status_class";
SailPoint.LCM.ManageAccounts.NATIVE_IDENTITY = 'nativeIdentity';
SailPoint.LCM.ManageAccounts.RADIO_NAME = "accountAction";

SailPoint.LCM.ManageAccounts.refreshingIds = [];
SailPoint.LCM.ManageAccounts.completedIds = [];
SailPoint.LCM.ManageAccounts.autoRefreshStatusDisableApps = [];
SailPoint.LCM.ManageAccounts.autoRefreshcompletedIds = [];
SailPoint.LCM.ManageAccounts.DecisionWidth = 0;
SailPoint.LCM.ManageAccounts.storeIndex=0;
SailPoint.LCM.ManageAccounts.refreshInProgress=0;
SailPoint.LCM.ManageAccounts.batchOfAutoRefreshLinkProcess=5;
SailPoint.LCM.ManageAccounts.store = null;
SailPoint.LCM.ManageAccounts.identityId = null;
SailPoint.LCM.ManageAccounts.accountOperations = null;
SailPoint.LCM.ManageAccounts.currentRequests = null;
SailPoint.LCM.ManageAccounts.applicationSelector = null;
//cache the records that have some operation so we can get to them after page changes
//Key:record id, Value:record.
SailPoint.LCM.ManageAccounts.changedRecordCache = new Ext.util.MixedCollection({}); 

SailPoint.LCM.ManageAccounts.initializeGrid = function(gridMetaData, currentIdentity, accountOperations, allowAccountOnlyRequests, appsAvailable, currentRequests, autoRefreshStatusDisableApps) {
  
  SailPoint.LCM.ManageAccounts.identityId = currentIdentity;
  SailPoint.LCM.ManageAccounts.accountOperations = accountOperations;
  SailPoint.LCM.ManageAccounts.currentRequests = currentRequests;
  SailPoint.LCM.ManageAccounts.autoRefreshStatusDisableApps = autoRefreshStatusDisableApps;
  
  SailPoint.LCM.ManageAccounts.loadVirtualRadioButton(currentRequests);
  
    var store = SailPoint.Store.createRestStore({
        fields : gridMetaData.fields,
        autoLoad : false,
        url : SailPoint.getRelativeUrl('/rest/identities/' + SailPoint.Utils.encodeRestUriComponent(currentIdentity) + '/links/manageAccountsGrid'),
        remoteSort : true
    });
  
  var grid = Ext.create('SailPoint.grid.PagingGrid', {
    renderTo : 'manageAccountsContainer',
    store: store,
    id: 'manageAccountsGrid',
    cls: 'smallFontGrid',
    gridMetaData: gridMetaData,
    pageSize: 10,
    usePageSizePlugin: true,
    viewConfig : {
        stripeRows: true
    },
    hideIfEmptyColumns: 'instance',
    columnResizers: {
        column: 'id',
        resizer: SailPoint.LCM.ManageAccounts.getDecisionsColumnWidth
    },
    runInitialLoad : true,
    listeners : {
        itemcontextmenu : SailPoint.LCM.AccountsGridSupport.contextMenu,
        viewready : {
            // Need to set the correct decision column width based on the max # of radio buttons.
            fn : function() {
                var column = Ext.getCmp('manageAccountsGrid').getView().getHeaderCt().items.findBy(function(a){
                    if(a.dataIndex == 'id') {
                      return true;
                    }
                });
                if(column) {
                    column.setWidth(SailPoint.LCM.ManageAccounts.getDecisionsColumnWidth());
                }
            },
            scope : this
        },       
        load:{
            fn:function()
            {
                var disableAutoRefresh=SailPoint.LCM.ManageAccounts.autoRefreshStatusDisableApps.indexOf('disableAutoRefreshAcctStatus');
                SailPoint.LCM.ManageAccounts.count = 0;
                if(disableAutoRefresh == -1){
                    SailPoint.LCM.ManageAccounts.autoRefreshAccountStatus();
                }               
            }
        }      
  }
  });

  // Initialize the application selector if the user is allowed to created new accounts.
  if (allowAccountOnlyRequests) {
      var emptyText = (appsAvailable) ? '#{msgs.lcm_request_entitlements_select_application}' : '#{msgs.lcm_manage_accounts_no_applications}';
      SailPoint.LCM.ManageAccounts.applicationSelector =
          new SailPoint.component.ApplicationSelector({
              renderTo: 'applicationSelector',
              applicationParams: {
                  accountOnly: true,
                  suggestType: 'lcmApplication',
                  identityId: currentIdentity
              },
              emptyText: emptyText
          });
  }
};




/**
 * Loads any existing requests into the virtual radio button.  This is needed
 * when the user returns to the accounts page after clicking the "Make 
 * additional changes" button on the review page.
 */
SailPoint.LCM.ManageAccounts.loadVirtualRadioButton = function(currentRequests) {
    if (currentRequests == null) {
        return;
    }
    
    for (i = 0; i < currentRequests.length; i++) {
        var req =  currentRequests[i];
        if ((req.trackingId ==  null) || (req.operation == null)) {
            // corrupt request data?
            continue;
        }
        
        var name = SailPoint.LCM.ManageAccounts.RADIO_NAME + req.trackingId;
        var value = req.operation;        
        SailPoint.LCM.ManageAccounts.vRadio.radioValues[name] = value;
        SailPoint.LCM.ManageAccounts.vRadio.changedValues[name] = value;
    }
};


/**
 * This allows the columnResizers config to resize the decision column.
 */
SailPoint.LCM.ManageAccounts.getDecisionsColumnWidth = function() {
    return SailPoint.LCM.ManageAccounts.DecisionWidth;
};

/**
 * Retrieve the account operation object for the operation with the given name.
 */
SailPoint.LCM.ManageAccounts.getOperation = function(operation) {
    for(var i=0; i<SailPoint.LCM.ManageAccounts.accountOperations.length; i++) {
        var current = SailPoint.LCM.ManageAccounts.accountOperations[i];
        if (operation === current.operation) {
            return current;
        }
    }

    throw 'Could not find operation: ' + operation;
};

SailPoint.LCM.ManageAccounts.statusRenderer = function(value, p, r) {
    // Ideally this function wouldn't be here, but to avoid upgrading the
    // renderer in the ColumnConfig, just pass through.
    return SailPoint.LCM.AccountsGridSupport.statusRenderer(value, p, r);
};

SailPoint.LCM.ManageAccounts.nameRenderer = function(value, p, r) {
    // Ideally this function wouldn't be here, but to avoid upgrading the
    // renderer in the ColumnConfig, just pass through.
    return SailPoint.LCM.AccountsGridSupport.nameRenderer(value, p, r);
};

/**
 * Renders the refresh button.
 */

SailPoint.LCM.ManageAccounts.refreshButtonRenderer = function(value, p, r) {
  var canRefresh = r.get('IIQ_refresh_status');
  var radioValues = [];
  radioValues.push({
    label: "refreshStatus",
    value: 'lcmRefreshRadio'  
  });
  
  var callbacks = {
    onclick: function() {
      return "SailPoint.LCM.ManageAccounts.refreshButtonClicked(this);";
    },
    disabled: function(label, value, record) {
      return !canRefresh;
    }
  };
  
  result = ImageRadio.render(radioValues, SailPoint.LCM.ManageAccounts.RADIO_NAME, callbacks, r);
  return result + SailPoint.LCM.ManageAccounts.getRefreshMarkup(r.getId());
};

/**
 * The markup for the loading and loaded successfully message
 */
SailPoint.LCM.ManageAccounts.getRefreshMarkup = function(id) {
  var markup = '<div id="status_loading_'+id+'" class="status_loading" style="display:none"><img src="'+
    SailPoint.getRelativeUrl('/scripts/ext-4.1.0/resources/themes/images/default/grid/loading.gif')+
    '"/><span>#{msgs.lcm_manage_accounts_updating_status}</span></div>' +
    '<div id="status_complete_'+id+'" class="status_loading_complete" style="display:none"><img src="' +
    SailPoint.getRelativeUrl('/images/icons/accept.png')+
    '"/><span>#{msgs.lcm_manage_accounts_updating_status_complete}</span></div>';
  return markup;
};


/**
 * When the refresh status button is clicked, we store the account id
 * in an array of refreshing ids so that when the user pages, we show
 * them that the status is still refreshing (until it's done).  Also
 * we show the status_loading image.
 */
SailPoint.LCM.ManageAccounts.refreshButtonClicked = function(radio) {
  //radio.removeClass('selected');
  /** String off the 'accountAction' off of the front **/
  var id = radio.id.substring(16);
  SailPoint.LCM.ManageAccounts.refreshingIds.push(id);
  
  /** Hide the radio button **/
  radio.style.display = 'none';
  
  /** Show loading graphic **/
  $('status_loading_'+id).show();
  
  /** Submit targeted aggregation request **/
  $('editForm:linkId').value = id;
  $('editForm:refreshLinkStatusBtn').click();
};

/**
 * Called when the targeted aggregation finishes
 * This updates the store in the grid with the new account status,
 * status class, and loads any buttons for the new decision options
 * 
 * Also keeps a list of the ids that have been refreshed so the user can't
 * request a refresh again
 */
SailPoint.LCM.ManageAccounts.refreshButtonComplete = function(radio) {
  var summaryString = $('editForm:refreshSummaryStatus').innerHTML;
  var refreshSummary = Ext.JSON.decode(summaryString);
  SailPoint.LCM.ManageAccounts.processRefreshSummary(refreshSummary);
};

SailPoint.LCM.ManageAccounts.buttonRenderer = function(value, p, r) {

  var radioValues = [];
  var decisions = r.get(SailPoint.LCM.ManageAccounts.DECISIONS);
  for(var i=0; i<SailPoint.LCM.ManageAccounts.accountOperations.length; i++) {
      var current = SailPoint.LCM.ManageAccounts.accountOperations[i];

      /** Look at the decisions record to see if this operation is allowed for this account **/
      if(!decisions[current.operation]) {
        continue;
      }
      
      radioValues.push({
          label: current.operation,
          value: current.icon + 'Radio'  
      });
  }
  
  var callbacks = {
      onclick: function() {
          return "SailPoint.LCM.ManageAccounts.radioClick(this);";
      },
      selected: function(label, value, record) {
          var acctReq = SailPoint.AccountRequest.findMatching(
              record,
              SailPoint.LCM.ManageAccounts.currentRequests,
              SailPoint.LCM.ManageAccounts.accountRequestMatchesRecord
          );
          
          if (null !== acctReq) {
              return label === acctReq.getAttributeOrAccountOperation();
          }
          
          // if there was not a previously submitted request found then
          // check any unsaved changes
          var unsavedChanges = SailPoint.LCM.ManageAccounts.vRadio.getChangedValues();
          if (unsavedChanges) {
              var operation = null;
              unsavedChanges.each(function(pair) {
                  if (pair.key === record.getId()) {
                      operation = pair.value;
                      
                      return false;
                  }
              });
              
              if (null !== operation) {
                  return label === operation;
              }
          }
          
          return false;
      },
      disabled: function(label, value, record) {
          return SailPoint.LCM.ManageAccounts.getOperation(label).disabled;
      }
  };

  var thisDecisionWidth = radioValues.length * 33;
  if(thisDecisionWidth > SailPoint.LCM.ManageAccounts.DecisionWidth) {
      SailPoint.LCM.ManageAccounts.DecisionWidth = thisDecisionWidth;
  }

  return ImageRadio.render(radioValues, SailPoint.LCM.ManageAccounts.RADIO_NAME, callbacks, r);
};


SailPoint.LCM.ManageAccounts.radioClick = function(divOrRadio) {
    var radio = ImageRadio.getRadio(divOrRadio);
    
    if (SailPoint.LCM.ManageAccounts.isLocked(Ext.get(radio).getAttribute('data-trackingId'))) {
        Ext.Msg.alert('#{msgs.lcm_manage_accounts_unable_perform_action}', '#{msgs.lcm_manage_accounts_edit_on_summary}');
        return;
    }
    
    var recordId = SailPoint.LCM.ManageAccounts.vRadio.stripPrefix(radio.name);
    var store = Ext.getCmp('manageAccountsGrid').getStore();
    var record = store.getById(recordId);
    
    if (SailPoint.LCM.ManageAccounts.vRadio._isSelected(radio)) {
        SailPoint.LCM.ManageAccounts.vRadio.radioUnselected(radio);
        ImageRadio.unselectRadio(radio);
        SailPoint.LCM.ManageAccounts.changedRecordCache.removeAtKey(recordId);
    } else {
        SailPoint.LCM.ManageAccounts.vRadio.radioSelected(radio);
        ImageRadio.selectRadio(radio);        
        SailPoint.LCM.ManageAccounts.changedRecordCache.add(recordId, record);
    }
};

SailPoint.LCM.ManageAccounts.isLocked = function(id) {
    var isLocked = false;
    
    SailPoint.LCM.ManageAccounts.currentRequests.each(function(req) {
       if (req.trackingId === id) {
           isLocked = true;
           
           return false;
       } 
    });
    
    return isLocked;
};

SailPoint.LCM.ManageAccounts.accountRequestMatchesRecord = function(record, acctReq) {
    var fromRecord =
        SailPoint.LCM.ManageAccounts.createAccountRequestFromRecord(null, null, record);
    return fromRecord.matches(acctReq);
};

SailPoint.LCM.ManageAccounts.submit = function() {
  var requests = [];

  var changes = SailPoint.LCM.ManageAccounts.vRadio.getChangedValues();
  if (changes) {
    changes.each(function(pair) {
      var id = pair.key;
      var op = pair.value;
      
      var record = SailPoint.LCM.ManageAccounts.changedRecordCache.get(id);
      
      if(record) {
        var request = SailPoint.LCM.ManageAccounts.createAccountRequestFromRecord(id, op, record);
        requests.push(request);
      }
    });
  }

  if (SailPoint.LCM.ManageAccounts.applicationSelector) {
      var app = SailPoint.LCM.ManageAccounts.applicationSelector.getApplication();
      if ((null !== app) && (app.length > 0)) {
          if (!SailPoint.LCM.ManageAccounts.applicationSelector.validate()) {
              return false;
          }
          
          var request = new SailPoint.AccountRequest();
          request.application = app;
          request.instance = SailPoint.LCM.ManageAccounts.applicationSelector.getInstance();
          request.operation = 'Create';
          request.trackingId = '';
          requests.push(request);
      }
  }
  
  if(requests.length==0 && SailPoint.LCM.ManageAccounts.currentRequests.length==0) {
    $("noChangesError").show();
    return false;
  }

  $('editForm:requestsJSON').value = Ext.JSON.encode(requests);
  return true;
};

SailPoint.LCM.ManageAccounts.createAccountRequestFromRecord = function(id, op, record) {
  
    if(!record) {
      return null;
    }

    var request = new SailPoint.AccountRequest();
    request.application = record.get('application-name');
    request.instance = record.get('instance');
    request.nativeIdentity = record.get('nativeIdentity');
    request.operation = op;
    request.trackingId = id;
    request.targetIntegration = SailPoint.LCM.ManageAccounts.identityId;
    return request;
};

SailPoint.LCM.ManageAccounts.autoRefreshAccountStatus = function(){
    SailPoint.LCM.ManageAccounts.storeIndex=0;
    SailPoint.LCM.ManageAccounts.refreshInProgress=0;
    SailPoint.LCM.ManageAccounts.store = null;
    SailPoint.LCM.ManageAccounts.gridSize = 0;  
    
    SailPoint.LCM.ManageAccounts.store = Ext.getCmp('manageAccountsGrid').getStore();
    SailPoint.LCM.ManageAccounts.store.each(function(){
        SailPoint.LCM.ManageAccounts.gridSize++;
    }); 
    SailPoint.LCM.ManageAccounts.autoRefreshNextBatch();    
};

/**
 * Check the number of links auto refresh in progress
 * if it is less than specified batch then it allow to fetch next record from the store   
 * for auto refresh & along with that it also checks if processed links store index is less than
 * total store count
 * 
 * Send link id for auto refresh status, If this link is not refreshed & also not disable
 * for auto refresh account status.  
 */

SailPoint.LCM.ManageAccounts.autoRefreshNextBatch = function() {
    while((SailPoint.LCM.ManageAccounts.refreshInProgress < SailPoint.LCM.ManageAccounts.batchOfAutoRefreshLinkProcess) && (SailPoint.LCM.ManageAccounts.gridSize > SailPoint.LCM.ManageAccounts.storeIndex)){
        var record = SailPoint.LCM.ManageAccounts.store.getAt(SailPoint.LCM.ManageAccounts.storeIndex);
        var recordId=record.get('id');
        var applicationName=record.get('application-name');
        var alreadyProcessed =SailPoint.LCM.ManageAccounts.autoRefreshcompletedIds.indexOf(recordId);
        var disabledApp=SailPoint.LCM.ManageAccounts.autoRefreshStatusDisableApps.indexOf(applicationName);
        if(alreadyProcessed == -1 && disabledApp == -1){
        
                SailPoint.LCM.ManageAccounts.autoRefreshCall(recordId);                 
                
            }
        SailPoint.LCM.ManageAccounts.storeIndex++;
    }
};

/**
 * Increase refreshInProgress count & add link id into the refreshingIds
 * 
 * Get refresh summary by Ajax request. On success of Ajax request, send refresh summary for further
 * processing & also decrease count of refreshInProgress.   
 */

SailPoint.LCM.ManageAccounts.autoRefreshCall = function(id){
    SailPoint.LCM.ManageAccounts.refreshingIds.push(id);
    SailPoint.LCM.ManageAccounts.refreshInProgress++;
    /** Hide the radio button **/
    $('lcmRefreshRadio_'+id).style.display = 'none';
      
    /** Show loading graphic **/
    $('status_loading_'+id).show();   
      
    Ext.Ajax.request({
         scope: this,        
         params:
         { 
          autoRefreshLinkId:id,
              
         },
         url: CONTEXT_PATH + '/lcm/manageAccountsAutoRefreshStatus.json',
         success: function (response) {
         respObj = Ext.decode(response.responseText);
         SailPoint.LCM.ManageAccounts.processRefreshSummary(respObj);
         SailPoint.LCM.ManageAccounts.refreshInProgress--;
         SailPoint.LCM.ManageAccounts.autoRefreshNextBatch();
         },
         failure: function (response) {          
          $('status_complete_'+id).show();    
          $('status_loading_'+id).hide();
          $('lcmRefreshRadio_'+id).hide();
          SailPoint.LCM.ManageAccounts.autoRefreshcompletedIds.push(id);
          SailPoint.LCM.ManageAccounts.refreshInProgress--;
          SailPoint.LCM.ManageAccounts.autoRefreshNextBatch();
         }
     });
};

SailPoint.LCM.ManageAccounts.processRefreshSummary = function(refreshSummary){    
      SailPoint.LCM.ManageAccounts.refreshingIds.pop(refreshSummary.id);      
      SailPoint.LCM.ManageAccounts.autoRefreshcompletedIds.push(refreshSummary.id);
      
      /** Update the grid **/
      var grid = Ext.getCmp('manageAccountsGrid');
      var record = grid.getStore().getById(refreshSummary.id);
      
      var decisions = record.get(SailPoint.LCM.ManageAccounts.DECISIONS);
      decisions.Unlock = true;
      for(var i=0; i<SailPoint.LCM.ManageAccounts.accountOperations.length; i++) {
        var current = SailPoint.LCM.ManageAccounts.accountOperations[i];
        decisions[current.operation] = refreshSummary.IIQ_decisions[current.operation];
      }
      
      record.set(SailPoint.LCM.ManageAccounts.DECISIONS, decisions);
      record.set(SailPoint.LCM.ManageAccounts.STATUS, refreshSummary.IIQ_status);
      record.set(SailPoint.LCM.ManageAccounts.STATUS_CLASS, refreshSummary.IIQ_status_class);
      
      $('status_complete_'+refreshSummary.id).show();     
      $('status_loading_'+refreshSummary.id).hide();
      $('lcmRefreshRadio_'+refreshSummary.id).hide();
      
      grid.resizeColumn('id', SailPoint.LCM.ManageAccounts.getDecisionsColumnWidth);
    };
