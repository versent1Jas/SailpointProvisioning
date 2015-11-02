
Ext.ns('SailPoint', 'SailPoint.LCM', 'SailPoint.LCM.RequestAccess');
SailPoint.LCM.RequestAccess.vRadio = new SailPoint.VirtualRadioButton('requestAccessGrid','roleAction');
SailPoint.LCM.RequestAccess.identityId = null;
SailPoint.LCM.RequestAccess.roleId = null;
SailPoint.LCM.RequestAccess.assignableTypes = null;
SailPoint.LCM.RequestAccess.currentRequests = null;
SailPoint.LCM.RequestAccess.recordCache = {};

/** Constants **/
SailPoint.LCM.RequestAccess.STATUS_KEY = "IIQ_status";
SailPoint.LCM.RequestAccess.RADIO_CLASS = "revokeAccountRadio";
SailPoint.LCM.RequestAccess.PAGE_SIZE = 10;

SailPoint.LCM.RequestAccess.OBJECT_TYPE_ROLE = "role";
SailPoint.LCM.RequestAccess.OBJECT_TYPE_ENTITLEMENT = "entitlement";

SailPoint.LCM.RequestAccess.RequestedObjectStatus = {
  ADD_TO_CART: 'ADD_TO_CART',
  PROMPT_ACCOUNT_SELECTION: 'PROMPT_ACCOUNT_SELECTION',
  PROMPT_PERMITTED_ROLES: 'PROMPT_PERMITTED_ROLES',
  PENDING_REQUEST: 'PENDING_REQUEST',
  CURRENTLY_ASSIGNED: 'CURRENTLY_ASSIGNED',
  INVALID_REQUESTEES: 'INVALID_REQUESTEES',
  PROMPT_ACCOUNT_SELECTION_ROLE: 'PROMPT_ACCOUNT_SELECTION_ROLE',
  HAS_EXISTING_ASSIGNMENT: 'HAS_EXISTING_ASSIGNMENT',
  UNIQUE_ASSIGNMENT: 'UNIQUE_ASSIGNMENT',
  PROMPT_ROLE_ASSIGNMENT_SELECTION: 'PROMPT_ROLE_ASSIGNMENT_SELECTION'
};

Ext.define('SailPoint.LCM.RequestAccessList', {
  extend : 'Ext.tab.Panel',
  alias : 'widget.sprequestaccesslist',
  
  statics : {
      buttonClick : function(btn, event, eOpts) {
          Ext.MessageBox.wait('#{msgs.loading_data}'); 
          var account_request = SailPoint.LCM.RequestAccess.createAccountRequestFromRecord(SailPoint.LCM.RequestAccess.ATTRIBUTE_OP_ADD, btn.record, SailPoint.LCM.RequestAccess.OBJECT_TYPE);
          Ext.getCmp('requestAccessList').preAddRequest(account_request);
      }
  },

  store: null,
  hideMsgBox: true,
  
  /** Accepts all of the values on all of the fields and builds a filter to be passed
   * to the rest resource for filtering our results
   */
  filters: {},

  /** Current page of store **/
  page: 1,
  attributeMap: null,
  /** Role Configurable Properties **/
  allowPermitted : false,  
  allowAssignable : false,
  allowRoles : false,
  allowEntitlements : false,
  resultDetailsOptInEnabled: false,
  searchMaxResults: null,
  roleResultsProperties: [],
  entitlementResultsProperties: [],

  permittedRolesWin : null,
  permittedRolesGrid : null,

  currentAccessGrid : null,

  roleTpl : null,
  entitlementTpl : null,  

  constructor : function(config) {
    SailPoint.LCM.RequestAccess.assignableTypes = config.assignableTypes;

    if(config.allowRoles) {
      SailPoint.LCM.RequestAccess.OBJECT_TYPE = SailPoint.LCM.RequestAccess.OBJECT_TYPE_ROLE;
    } else if(config.allowEntitlements) {
      SailPoint.LCM.RequestAccess.OBJECT_TYPE = SailPoint.LCM.RequestAccess.OBJECT_TYPE_ENTITLEMENT;
    }

    this.resultDetailsOptInEnabled = config.resultDetailsOptInEnabled;
    this.roleResultsProperties = config.roleResultsProperties;
    this.entitlementResultsProperties = config.entitlementResultsProperties;

    this.store = this.createStore(config);

    this.items = [];

    // Horrible hack to fix the wrong width calculation of these panels in 
    // IE9. Only way I could figure out how to fix it. Please change if you 
    // find a better way.
    var listeners = {};
    if (Ext.isIE9) {
      listeners.afterlayout = {
        fn: function() {
          var IE9_OFFSET = 35;
          var panelIds = ['requestAccessRoleTab', 'requestAccessEntitlementTab'];

          var hasVerticalScrollbar = function(el) {
            return el.clientHeight < el.scrollHeight;
          };

          panelIds.each(function(id) {
            var panel = Ext.getCmp(id);
            if (panel && panel.getEl() && hasVerticalScrollbar(panel.getEl().dom)) {
              panel.getEl().setWidth(panel.getEl().getWidth() + IE9_OFFSET);
            }
          });
        }
      };
    }

    // Roles
    if(config.allowRoles) {

      var roleList = {
          xtype: 'dataview',
          id: 'requestAccessRoleTab',
          deferEmptyText: false,
          region:'center',
          autoScroll: true,
          itemSelector: 'div.request_item',
          emptyText: '#{msgs.lcm_request_access_no_items}',
          store: this.store,
          objectType: SailPoint.LCM.RequestAccess.OBJECT_TYPE_ROLE,
          tpl: this.getRoleTpl(),
          style: 'padding: 10px 5px',
          prepareData: this.prepareData
      };

      this.items.push({
        xtype:'panel',
        title: '#{msgs.roles}',
        id:'rolePanel',
        objectType: SailPoint.LCM.RequestAccess.OBJECT_TYPE_ROLE,
        layout: 'border',
        items: [{
          xtype:'sprequestaccessrolefilterpanel',
          attributeMap: config.attributeMap,
          region:'north',
          id : 'roleFilterForm',
          parent:this,
          collapsible:true,
          collapsed:true,
          collapseMode: 'mini',
          title:"#{msgs.lcm_request_access_filter_panel_title}",
          roleTypes: config.roleTypes,
          ruleData: config.ruleData
          },
          roleList
        ],
        listeners: listeners
      });
    }
    
    // Entitlements
    if(config.allowEntitlements) {

      var entitlementList = {
          xtype: 'dataview',
          id: 'requestAccessEntitlementTab',
          title: '#{msgs.entitlements}',
          deferEmptyText: false,
          itemSelector: 'div.request_item',
          emptyText: '#{msgs.lcm_request_access_no_items}',
          store: this.store,
          autoScroll: true,
          style: 'padding: 10px 5px',
          objectType: SailPoint.LCM.RequestAccess.OBJECT_TYPE_ENTITLEMENT,
          tpl: this.getEntitlementTpl(),
          prepareData: this.prepareData,
          section: 'south'
      };

      var filterPanel = {
          region:'north',
          autoScroll: true,
          parent: this,
          xtype:'sprequestaccessentitlementfilterpanel',
          attributeMap: config.attributeMap,
          ruleData: config.ruleData,
          id : 'entitlementFilterForm',
          collapsible:true,
          collapseMode: 'mini',
          collapsed:true,
          split: true, // bug #21023 part deux - adding splitter to give user more control of visible filter panel height
          title:"#{msgs.lcm_request_access_filter_panel_title}"
      };
      /* The filter panel expands and runs off the screen easily on the
       * iPad the proper fix is probably a more wide sweeping reevaluation
       * of viewport usage -jw

       * Bug #21023: limit height of search panel when viewable area is below supported resolution.
       */
      if(SailPoint.Platform.isMobile() || SailPoint.getBrowserViewArea().height <= SailPoint.minSupportedHeight) {
          filterPanel.height = 150;
      }
      else {
          // Bug #21023 part deux - when the viewable area is above the supported resolution we
          // need to limit the filter panel height otherwise when there are lots of searchable 
          // entitlement attributes it's possible the height can exceed the viewable area height.
          filterPanel.height = 300;
      }

      this.items.push({
        xtype:'panel',
        title: '#{msgs.entitlements}',
        id:'entitlementPanel',
        objectType: SailPoint.LCM.RequestAccess.OBJECT_TYPE_ENTITLEMENT,
        layout: 'border',
        items: [
            filterPanel,
            entitlementList
        ],
        listeners: listeners
      });
    }

    // Current Requests
    if(SailPoint.LCM.RequestAccess.identityId) {
      this.currentAccessGrid = new SailPoint.LCM.RequestAccessCurrentAccessGrid({
        id: 'requestAccessCurrentAccessGrid',
        currentIdentity: SailPoint.LCM.RequestAccess.identityId,
        gridMetaData: assignedGridMetaData,
        title: '#{msgs.lcm_current_access}',
        autoScroll: true,
        pageSize: config.pageSize,
        stateId: CURRENT_ACCESS_GRID_STATE_ID,
        stateful: true
      });
      this.items.push(this.currentAccessGrid);
    }

    this.callParent(arguments);
  },


  initComponent : function(){

    Ext.apply(this, {
      deferEmptyText: false,
      itemSelector: 'div.request_item',
      emptyText: '#{msgs.lcm_request_access_no_items}',
      plain: true,
      dockedItems: [{
        xtype: 'toolbar',
        id: 'requestAccessListTbar',
        dock: 'top',
        hidden: (!this.allowRoles && !this.allowEntitlements),
        items: [{
          xtype: 'button',
          text: "#{msgs.button_narrow_results}",
          scale : 'medium',
          id:'filterSearchResultsBtn',
          identityPanel: this,
          dock: 'top',
          handler: function(button) {
            if(SailPoint.LCM.RequestAccess.OBJECT_TYPE === SailPoint.LCM.RequestAccess.OBJECT_TYPE_ROLE) {
              Ext.getCmp('roleFilterForm').toggleCollapse();
            }
            else if(SailPoint.LCM.RequestAccess.OBJECT_TYPE === SailPoint.LCM.RequestAccess.OBJECT_TYPE_ENTITLEMENT) {
              Ext.getCmp('entitlementFilterForm').toggleCollapse();
            }
          }
        }, '->', {
          xtype: 'pagingtoolbar',
          id: 'pagingtoolbar',
          store: this.store,   // same store GridPanel is using
          displayInfo: true
        }]
      }]
    }); 

    /** The filter panel that allows us to filter and sort the grid--defined 
     * in RequestAccessFilterPanel.js.  Includes a typeTabPanel
     */
    this.on('beforetabchange', function(tabPanel, newItem, oldItem) {
      this.changeType(newItem.objectType);
    }, this);

    if(this.filterPanel) {           
      this.on('afterrender', function() {
        this.store.load();
      }, this);
    }

    this.callParent();
  },

  checkForErrors: function(store) {
    var errors = store.getErrors();
    if (errors && (errors.length > 0)) {
      Ext.Msg.show({
        title: '#{msgs.lcm_request_entitlements_identity_search_too_many_results_title}',
        msg: errors.join('. '),
        buttons: Ext.Msg.OK,
        icon: Ext.MessageBox.INFO
      });
      store.removeAll();
    }
  },

  prepareData: function(data, recordIndex, record) {
    var percent = Math.round((data.IIQ_population/data.IIQ_population_total)*100);
    var width = 100;

    var completeClass = "progressBarCompleteRed";
    
    if(percent >= 80) {
      completeClass = "progressBarCompleteGreen";
    } else if(percent >= 30 && percent < 80) {
      completeClass = "progressBarCompleteYellow";
    }
    
    var percentWidth = (percent / 100) * width;

    var remainingWidth = width - percentWidth;
    data.percent = percent;
    data.progressBarClass = completeClass;
    data.width = width;
    data.percentWidth = percentWidth;
    data.remainingWidth = remainingWidth;

    var warningContainer = Ext.get('requestAccessIdentityHighRiskWarning');
    if(warningContainer) {
      if(record.get('IIQ_has_high_risk')) {
        warningContainer.dom.style.display = '';
      } else {
        warningContainer.dom.style.display = 'none';      
      }
    }

    warningContainer = Ext.get('requestAccessPopulationHighRiskWarning');
    if(warningContainer) {
      if(record.get('IIQ_has_high_risk')) {
        warningContainer.dom.style.display = '';
      } else {
        warningContainer.dom.style.display = 'none';      
      }
    }
    return data;
  },

  injectButtons: function(records) {
	  if(Ext.isArray(records)) {
	    records.each(function(record) {
	      var renderTo = SailPoint.LCM.RequestAccess.OBJECT_TYPE + '_button_' + record.getId();
	      var inCart = record.get('IIQ_Selected') === true;
	
	      var button = new Ext.Button({
	        id: renderTo + '_btn',
	        renderTo : renderTo,
	        record: record,
	        text : '#{msgs.lcm_add_to_cart}',
	        hidden: inCart
	      });
	      
	      // use managed listener for button clicks
	      button.mon(button, 'click', SailPoint.LCM.RequestAccessList.buttonClick);
	
	    });
	  }
  },

  getRoleTpl : function() {
    if(!this.roleTpl) {
      this.roleTpl = Ext.create('SailPoint.LCM.RequestAccess.ResultTemplate', {
        type: 'role',
        optInEnabled: this.resultDetailsOptInEnabled,
        properties: this.roleResultsProperties
      });
    }

    return this.roleTpl;
  },

  getEntitlementTpl : function() {
    if(!this.entitlementTpl) {
      this.entitlementTpl = Ext.create('SailPoint.LCM.RequestAccess.ResultTemplate', {
        type: 'entitlement',
        optInEnabled: this.resultDetailsOptInEnabled,
        properties: this.entitlementResultsProperties
      });
    }

    return this.entitlementTpl;
  },

  changeType: function(type) {

    if(type) {
      SailPoint.LCM.RequestAccess.OBJECT_TYPE = type;
      Ext.getCmp('requestAccessListTbar').show();

      this.store.proxy.extraParams.type = type;
      this.store.defaultParams.type = type;

      this.store.sorters.clear();
      this.store.sorters.add({
        property: 'displayableName',
        direction: 'ASC'
      });

      this.store.loadPage(1);
      this.page = 1;
    } else {
      Ext.getCmp('requestAccessListTbar').hide();
    }
  },

  getSortPropertyForType: function(type) {
    if (type === SailPoint.LCM.RequestAccess.OBJECT_TYPE_ROLE) {
      return 'displayableName';
    }

    return 'name';
  },

  createStore: function(config) {

    this.store = SailPoint.Store.createRestStore({
      fields : config.listStoreFields,
      autoLoad : false,
      pageSize: SailPoint.LCM.RequestAccess.PAGE_SIZE,
      url : SailPoint.getRelativeUrl('/rest/requestAccess/grid'),
      extraParams : {
        'allowPermitted' : config.allowPermitted,
        'allowAssignable' : config.allowAssignable,
        'lcm' : true,
        'identityId': config.currentIdentity,
        'type' : SailPoint.LCM.RequestAccess.OBJECT_TYPE
      },
      /** The default params are a bag of params that we keep on the store to apply to 
       * every search since we mess with the extraParams so much.  We keep them around so we can
       * always apply them back to the store once the user has hit "clear filters"
       */
      defaultParams : {
        'allowPermitted' : config.allowPermitted,
        'allowAssignable' : config.allowAssignable,
        'lcm' : true,
        'identityId': config.currentIdentity,
        'type' : SailPoint.LCM.RequestAccess.OBJECT_TYPE,
        'sort' : 'displayableName'
      },
      sorters : [{
        property : 'displayableName',
        direction : 'ASC'
      }],
      remoteSort : true
    });

    this.store.on('load', function(store, records, isSuccessful, operation, options) {
      this.checkForErrors(store);
      this.injectButtons(records);      
      this.updateTabCounts(store.getProxy().getReader().rawData);
    }, this);
    return this.store;
  },

  updateTabCounts: function(response) {
    var roleCount = response.count;
    var entitlementCount = response.inactiveCount;

    if (this.isEntitlementsTabActive()) {
      roleCount = response.inactiveCount;
      entitlementCount = response.count;
    }

    this.updateRoleTabCount(roleCount);
    this.updateEntitlementTabCount(entitlementCount);
  },

  updateRoleTabCount: function(count) {
    var roleTab = Ext.getCmp('rolePanel');
    if (roleTab) {
      roleTab.setTitle('#{msgs.roles} (' + this.formatCount(count) + ')');
    }
  },

  updateEntitlementTabCount: function(count) {
    var entitlementsTab = Ext.getCmp('entitlementPanel');
    if (entitlementsTab) {
      entitlementsTab.setTitle('#{msgs.entitlements} (' + this.formatCount(count) + ')');
    }
  },

  formatCount: function(count) {
    if (count >= this.searchMaxResults) {
      return this.searchMaxResults + '+';
    }

    return count;
  },

  isRolesTabActive: function() {
    return SailPoint.LCM.RequestAccess.OBJECT_TYPE === SailPoint.LCM.RequestAccess.OBJECT_TYPE_ROLE;
  },

  isEntitlementsTabActive: function() {
    return SailPoint.LCM.RequestAccess.OBJECT_TYPE === SailPoint.LCM.RequestAccess.OBJECT_TYPE_ENTITLEMENT;
  },

  preAddRequest : function(account_request) {

    var requests = [];
    requests.push(account_request);
 
    Ext.Ajax.request({
      method: 'POST',
      url: SailPoint.getRelativeUrl('/rest/requestAccess/additionalQuestions'),
      success: function(response) {
        var data = Ext.JSON.decode(response.responseText);
        var dataStatus = data.status;
        this.hideMsgBox = Boolean(dataStatus==SailPoint.LCM.RequestAccess.RequestedObjectStatus.ADD_TO_CART ||
 	    	     dataStatus==SailPoint.LCM.RequestAccess.RequestedObjectStatus.PROMPT_PERMITTED_ROLES ||
	    	     dataStatus==SailPoint.LCM.RequestAccess.RequestedObjectStatus.PROMPT_ACCOUNT_SELECTION_ROLE ||
                 dataStatus==SailPoint.LCM.RequestAccess.RequestedObjectStatus.PROMPT_ROLE_ASSIGNMENT_SELECTION);
        
        switch(dataStatus) {
          case SailPoint.LCM.RequestAccess.RequestedObjectStatus.ADD_TO_CART:
            this.addToCart(account_request, data);
            break;

          case SailPoint.LCM.RequestAccess.RequestedObjectStatus.PROMPT_PERMITTED_ROLES:
            account_request.arguments.updateable = "true";             
            this.promptPermittedRole(account_request, data, dataStatus);  
            break;

          case SailPoint.LCM.RequestAccess.RequestedObjectStatus.PROMPT_ACCOUNT_SELECTION:
            account_request.arguments.updateable = "true";
            this.promptAccountChoice(account_request, data.actionType, data.hasInstances, data.requesteeNameMap, data.requesteeActionMap);
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

          case SailPoint.LCM.RequestAccess.RequestedObjectStatus.PROMPT_ACCOUNT_SELECTION_ROLE:
            this.promptRoleAccountSelection(account_request, data, dataStatus);
            break;

          case SailPoint.LCM.RequestAccess.RequestedObjectStatus.PROMPT_ROLE_ASSIGNMENT_SELECTION:
            this.promptRoleAssignmentSelection(account_request, data, dataStatus);
            break;
        }
      },
      callback : function() {
    	  var hide = this.hideMsgBox;
    	  if(hide)
    		  Ext.MessageBox.hide();
      },
      params: {'request': Ext.JSON.encode(requests), 'identityId': SailPoint.LCM.RequestAccess.identityId, 'allowPermitted' : this.allowPermitted},
      scope: this
    });
  },

  addToCart: function(accountRequest, data) {
      // add assignment id to attribute request if exists, currently this is only
      // for direct permitted role requests
      if (!Ext.isEmpty(data.assignmentId)) {
          accountRequest.attributeRequests[0].assignmentId = data.assignmentId;
      }

      Ext.getCmp('requestAccessList').addRequest(accountRequest);
  },

  showItemInCart: function(stub) {
    var btn = Ext.getCmp(stub.getButtonCmpId());
    if (btn) {
      btn.hide();
    }
    
    var inCartEl = Ext.get(stub.getInCartId());
    if (inCartEl) {
      inCartEl.setStyle('display', 'inline');
    }
  },

  hasExistingAssignment : function(requests, accountInfos, popup) {
  	popup.enableButtons(false);
  	
    //Get the account info objects out of the account request arguments 
    // and put the JSON on the page.
    if (Ext.isEmpty(accountInfos)) {
      var accountInfos = [];
      for (i=0; i<requests.length; i++) {
        request = requests[i];
        if (request.arguments.accountInfos) {
            accountInfos.push.apply(accountInfos, request.arguments.accountInfos);
            request.arguments.accountInfos = null;
        }
      }
    }

    var hasExistingAssignment = false;
    var requestsJSON = Ext.JSON.encode(requests);
    var accountInfosJSON = Ext.JSON.encode(accountInfos);

    Ext.Ajax.request({
      method: 'POST',
      async: false,
      url: SailPoint.getRelativeUrl('/rest/requestAccess/checkUniqueAssignment'),
      success: function(response) {
        var data = Ext.JSON.decode(response.responseText);
        var dataStatus = data.status;
        
        switch(dataStatus) {
          case SailPoint.LCM.RequestAccess.RequestedObjectStatus.UNIQUE_ASSIGNMENT:
          	hasExistingAssignment = false;
          	break;
          case SailPoint.LCM.RequestAccess.RequestedObjectStatus.HAS_EXISTING_ASSIGNMENT:
          	popup.enableButtons(true);
    			  Ext.Msg.show( {
   				   title: '#{msgs.lcm_request_err_existing_assignment_title}',
   				   msg: data.errorMessage,
   				   buttons: Ext.Msg.OK,
   				   icon: Ext.MessageBox.ERROR
    			  } );

            hasExistingAssignment = true;
            break;
        }
      },
      params: {'requests': requestsJSON, 'accountInfos': accountInfosJSON},
      scope: this
    });
  	
  	return hasExistingAssignment;
  },


  addRequests : function(requests, accountInfos) {
    var me = this;
    var stubs = SailPoint.LCM.RequestAccess.createRequestStubs(requests);

    stubs.each(function(stub) {
      var btn = Ext.getCmp(stub.getButtonCmpId());
      if (btn) {
        btn.setDisabled(true);
      }
    });

    Page.on('cartItemsAdded', function() {
      stubs.each(function(stub) {
        me.showItemInCart(stub);

        var record = me.store.getById(stub.id);
        if (record) {
          record.set('IIQ_Selected', true);
        }
      });
    }, null, { single: true });

    Page.on('addCartItemsError', function() {
      stubs.each(function(stub) {
        var btn = Ext.getCmp(stub.getButtonCmpId());
        if (btn) {
          btn.setDisabled(false);
        }
      });
    }, null, { single: true });
    
      //Get the account info objects out of the account request arguments 
      // and put the JSON on the page.
    if (Ext.isEmpty(accountInfos)) {
      var accountInfos = [];
      for (i=0; i<requests.length; i++) {
        request = requests[i];
        if (request.arguments.accountInfos) {
            accountInfos.push.apply(accountInfos, request.arguments.accountInfos);
            request.arguments.accountInfos = null;
        }
      }
    }

    $('editForm:requestsJSON').value = Ext.JSON.encode(requests);
    $('editForm:accountInfosJSON').value = Ext.JSON.encode(accountInfos);
    $('editForm:addRequestBtn').click();
    $('editForm:requestsJSON').value = '[]';
    $('editForm:accountInfosJSON').value = '[]';
  },

  addRequest : function (account_request) {
    var requests = [];
    requests.push(account_request);  
    this.addRequests(requests);
  },

  promptPermittedRole : function(accountRequest, data, status) {
      var roleWizard = Ext.create('SailPoint.LCM.RequestAccessRoleWizard', {
          accountRequest: accountRequest,
          gridMetaData: this.gridMetaData,
          requestAccessList: this,
          allowAssignmentNote: data.isAssignable,
          status: status
      });

      roleWizard.show();
  },

  promptRoleAssignmentSelection: function(accountRequest, data, status) {
      var roleWizard = Ext.create('SailPoint.LCM.RequestAccessRoleWizard', {
          accountRequest: accountRequest,
          gridMetaData: this.gridMetaData,
          requestAccessList: this,
          allowAssignmentNote: data.isAssignable,
          identityId: SailPoint.LCM.RequestAccess.identityId,
          status: status
      });

      roleWizard.show();
  },

  promptRoleAccountSelection: function(accountRequest, data, status) {
      var roleWizard = Ext.create('SailPoint.LCM.RequestAccessRoleWizard', {
          accountSelections: data.requesteeSelections,
          accountRequest: accountRequest,
          gridMetaData: this.gridMetaData,
          requestAccessList: this,
          allowAssignmentNote: data.isAssignable,
          status: status,
          assignmentId: data.assignmentId
      });

      roleWizard.show();
  },

  promptAccountChoice : function(account_request, action_type, hasInstances, requesteeNameMap, requesteeActionMap) {
      if (this.accountChoiceWindow) {
          //If this is for a different application than the last time we used the 
          //account choice window, destroy it and make a new one. Otherwise, update the 
          //window for new account request.
          if (account_request.application !== this.accountChoiceWindow.getApplication()) {
              this.accountChoiceWindow.destroy();
              this.accountChoiceWindow = null;
          } else {
              this.accountChoiceWindow.setAccountRequest(account_request);
          }
      }
      
      if (!this.accountChoiceWindow) {
          this.accountChoiceWindow = new SailPoint.LCM.RequestAccessAccountChoiceWindow({
              account_request : account_request,
              closeAction: 'hide',
              modal:true,
              action_type: action_type,
              closable: true,
              hasInstances: hasInstances,
              identityMap: requesteeNameMap,
              actionMap: requesteeActionMap
            });
      }
    
    this.accountChoiceWindow.show();
  },

  clearFilters: function() {
    this.filters = {};
  },

  /** Takes the built filter and applies it to the store of the grid that is associated with the filter panel **/
  runSearch : function(filters) { 
    if(filters) {
      this.filters = filters;
    }

    var searchField = Ext.getCmp('searchField');
    if(!searchField.isDisabled()) {
      this.filters['query'] = searchField.getValue(); 
    } else { 
      delete this.filters.query;
    }

    /** Reset the store params using the defaultParams that we init'd the store with **/
    this.store.proxy.extraParams = {};

    /** Set the default parameters like type, showPermitted, etc... **/
    for (var attrname in this.store.defaultParams) {     
      if(this.store.defaultParams.hasOwnProperty(attrname)) {   
        this.store.proxy.extraParams[attrname] = this.store.defaultParams[attrname]; 
      }
    }

    for (var attrname in this.filters) { 
      /** Skip inherited properties such as functions **/
      if(this.filters.hasOwnProperty(attrname)) {
        this.store.proxy.extraParams[attrname] = this.filters[attrname];
      }
    }
    this.store.loadPage(1);
  }

});

Ext.define('SailPoint.LCM.RequestAccess.ResultTemplate', {
  extend: 'Ext.XTemplate',

  statics: {
    MAX_DESC_CHARS: 270
  },

  type: null,

  optInEnabled: false,

  properties: [],

  staticProperties: ['name', 'displayableName', 'description'],

  constructor: function(config) {
    var me = this;
    config = config || {};
    
    Ext.applyIf(config, {
      properties: []
    });

    var header = [
      '<tpl for=".">',
        '<tpl if="this.isRole()">',
          '<div class="request_item {IIQ_icon} {IIQ_icon}Large">',
        '<tpl else>',
          '<div class="request_item {application-icon}Large">',
        '</tpl>',
          '<tpl if="IIQ_population">',
            '<div class="progressBarContainer" onclick="populationWindow.showIdentities(\'{[this.getPopulationIdParam()]}\', \'{id}\', \'{name}\');">',
              '<span class="progressBarNumComplete">',
                '<span class="progressBarTotal">{percent}% ({IIQ_population}/{IIQ_population_total})&nbsp;<img class="progressDisclosure" src="'
                  + SailPoint.getRelativeUrl('/images/icons/general_disclosure_arrow_10.png') + '"/>',
                '</span>',
              '</span>',
              '<div class="progressBar short" style="width: {width}px;">',
                '<span class="{progressBarClass}" style="width: {percentWidth}px; left: 1px;"></span>',
                '<span class="progressBarRemainingDarkGray" style="width: {remainingWidth}px; left: {percentWidth}px;"></span>',
              '</div>',
            '</div>',
          '</tpl>',
          '<div class="lcmNameTitle">',
            '<tpl if="this.isRole()">',
              '<a href="javascript:SailPoint.RoleDetailPanel.window(null, \'{id}\', \'{identityId}\', true)" title="#{msgs.info_role_composition}">',
                '{[Ext.String.htmlEncode(values.displayableName)]} {identityId}',
              '</a>',
            '<tpl else>',
              '{name}',
            '</tpl>',
          '</div>',
          '<tpl if="this.isOptInEnabled()">',
            '<span id="trunc_desc_{[this.getType()]}_{id}" class="description">{[this.getTruncatedDescription(values.description)]}</span>',
            '<div id="result_details_{[this.getType()]}_{id}" style="display: none;">',
          '</tpl>',
          '<span class="description">{description}</span>',
          '<div class="properties">'
    ];

    var properties = [];
    config.properties.each(function(property) {
      if (me.isInvalidProperty(property)) {
        return true;
      }

      if (me.hasRenderer(property)) {
        property.renderer = SailPoint.evaluteFunctionByName(property.renderer, window);
      }

      properties.push(me.renderPropertyTemplate(property));
    });

    var footer = [
          '</div>',
          '<tpl if="this.isOptInEnabled()">',
            '</div>',
            '<div class="request-access-view-details">',
              '<a href="#" class="show-details" onclick="SailPoint.LCM.RequestAccess.toggleDetails(this, \'{id}\', \'{[this.getType()]}\'); return false;">',
                '#{msgs.lcm_request_access_view_details}',
              '</a>',
            '</div>',
          '</tpl>',
          '<div class="buttonHolder">',
            '<span class="in-cart" id="{[this.getType()]}_button_{id}_incart" style="display: {[values.IIQ_Selected === true ? "inline" : "none"]};">',
              '#{msgs.lcm_in_cart}',
            '</span>',
            '<span id="{[this.getType()]}_button_{id}"></span>',
          '</div>',
        '</div>',
      '</tpl>'
    ];

    this.callParent([header.concat(properties, footer).join(''), config]);
  },

  isInvalidProperty: function(property) {
    return property.hidden === true || this.staticProperties.indexOf(property.dataIndex) >= 0;
  },

  hasRenderer: function(property) {
    return property.renderer && Ext.typeOf(property.renderer) === 'string' && property.renderer.length > 0;
  },

  renderPropertyTemplate: function(property) {
    var rendered = '';

    if (property.renderer) {
      rendered = property.renderer(property);
    } else {
      rendered = this.renderDefaultPropertyTemplate(property);
    }

    return Ext.String.format('<span class="property">{0}</span>', rendered);
  },

  renderDefaultPropertyTemplate: function(property) {
    return property.header + ': {[values["' + property.dataIndex + '"] === null ? "" : values["' + property.dataIndex + '"]]}';
  },

  getType: function() {
    return this.type;
  },

  isRole: function() {
    return this.getType() === 'role';
  },

  isEntitlement: function() {
    return this.getType() === 'entitlement';
  },

  getPopulationIdParam: function() {
    if (this.isEntitlement()) {
      return 'entitlementId';
    }

    return 'roleId';
  },

  isOptInEnabled: function() {
    return this.optInEnabled;
  },

  getTruncatedDescription: function(description) {
    if (!description) {
      return '';
    }

    var maxLength = this.getMaxDescriptionLength();
    if (description.length <= maxLength) {
      return description;
    }

    return description.substring(0, maxLength) + '...';
  },

  getMaxDescriptionLength: function() {
    return SailPoint.LCM.RequestAccess.ResultTemplate.MAX_DESC_CHARS;
  }

});

SailPoint.LCM.RequestAccess.createRequestStubs = function(requests) {
  var stubs = [];
  requests.each(function(request) {
    stubs.push({
      id: request.arguments.id,

      type: request.type,

      getButtonContainerId: function() {
        return this.type + '_button_' + this.id;
      },

      getButtonCmpId: function() {
        return this.getButtonContainerId() + '_btn';
      },

      getInCartId : function() {
        return this.getButtonContainerId() +'_incart';
      }
    });
  });

  return stubs;
};

SailPoint.LCM.RequestAccess.toggleDetails = function(el, id, type) {
  var element = Ext.get(el);
  var truncDescEl = $(Ext.String.format('trunc_desc_{0}_{1}', type, id));
  var detailsEl = $(Ext.String.format('result_details_{0}_{1}', type, id));

  if (element.hasCls('show-details')) {
    truncDescEl.hide();
    detailsEl.show();
    element.removeCls('show-details')
           .addCls('hide-details')
           .setHTML('#{msgs.lcm_request_access_hide_details}');
  } else {
    truncDescEl.show();
    detailsEl.hide();
    element.removeCls('hide-details')
           .addCls('show-details')
           .setHTML('#{msgs.lcm_request_access_view_details}');
  }
};

SailPoint.LCM.RequestAccess.loadPage = function(page) {
  var requestAccessList = Ext.getCmp('requestAccessList');
  requestAccessList.getStore().loadPage(page);
  requestAccessList.page = page;
};

SailPoint.LCM.RequestAccess.riskScoreRenderer = function(property) {
  return property.header + ': <div class="riskIndicator ri_{IIQ_color}">{riskScore}</div>';
};

Ext.define('SailPoint.LCM.RequestAccess.AccountInfo', {

    id: null,

    identityId: null,

    nativeIdentity: null,

    instance: null,
    
    constructor: function() {
        this.id = randomUUID();
    }

});
