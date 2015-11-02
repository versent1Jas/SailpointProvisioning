/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.Manage.Grid.AccessRequests');

SailPoint.Manage.Grid.AccessRequests.adornColumn = function() {
  var roleEls = Ext.query(".adornColumn");
  if (roleEls) {
  // each roleColumn td elem has child hidden input elements
  // that contain the data we need to properly display 
  // the role decorations 
    roleEls.each(
      function(elt) {
        var metaData = elt.children;
        var iconType, roleInfo, isGroupAttribute, appName, entName, roleSearchName, roleId;
        var requestId, requestItemId, identityId, assignmentId;
        
        // checking the length here to make sure there is metadata.
        // we might run into a column that has already been adorned.
        if (metaData.length <= 1) {
          return;
        }

        for (var i=0;i<metaData.length;++i) {
          if (metaData[i].getAttribute("id").indexOf("entitlementIcon") > -1) {
            iconType = metaData[i].value + "Icon";
          }
          else if (metaData[i].getAttribute("id").indexOf("entitlementName") > -1) {
            entName = metaData[i].value;
          }
          else if (metaData[i].getAttribute("id").indexOf("roleId") > -1) {
            roleId = metaData[i].value;
          }
          else if (metaData[i].getAttribute("id").indexOf("entitlementInfo") > -1) {
            roleInfo = metaData[i].value;
          }
          else if (metaData[i].getAttribute("id").indexOf("isGroupAttribute") > -1) {
            isGroupAttribute = metaData[i].value;
          }
          else if (metaData[i].getAttribute("id").indexOf("appName") > -1) {
            appName = metaData[i].value;
          } 
          else if (metaData[i].getAttribute("id").indexOf("requestId") > -1) {
            requestId = metaData[i].value;
          }
          else if (metaData[i].getAttribute("id").indexOf("requestItemId") > -1) {
              requestItemId = metaData[i].value;
          }
          else if (metaData[i].getAttribute("id").indexOf("roleSearchName") > -1) {
              roleSearchName = metaData[i].value;
          }
          else if (metaData[i].getAttribute("id").indexOf("assignmentId") > -1) {
            assignmentId = metaData[i].value;
          }
          else if (metaData[i].getAttribute("id").indexOf("identityId") > -1) {
            identityId = metaData[i].value;
          }
        }

        var roleName = (document.all) ? elt.innerText : elt.textContent;
        
        if (roleId && roleId.length > 0) {
          elt.innerHTML = Ext.String.format('<a onclick="SailPoint.RoleDetailPanel.window(\'{0}\', \'{1}\', \'{2}\', true, \'accessRequestItem\', \'{3}\', \'{4}\', \'{5}\')" title="#{msgs.info_role_composition}">{6}</a>', assignmentId, roleId, identityId, entName, requestId, requestItemId, roleName.escapeHTML());
        }

        if (isGroupAttribute == 'true') {
            if(roleSearchName){
                elt.innerHTML = '<a onclick="viewAccountGroup(\'' + appName + '\', \'' + entName + '\', \'' + roleSearchName + '\');">' + elt.innerHTML + '</a>';
            }else {
                elt.innerHTML = '<a onclick="viewAccountGroup(\'' + appName + '\', \'' + entName + '\', \'' + roleName + '\');">' + elt.innerHTML + '</a>';
            }
        }

        if (roleInfo && roleInfo.length > 0)
          elt.innerHTML = SailPoint.component.NameWithTooltip.getTooltipHtml(elt.innerHTML, roleInfo);

        if (iconType != 'Icon' && iconType.length > 0)
          elt.innerHTML = '<div style="padding-left:18px" class="' + iconType + '">' + elt.innerHTML + "</div>";
        else 
          elt.innerHTML = '<div>' + elt.innerHTML + "</div>";

      }
    );
  }

  SailPoint.Manage.Grid.AccessRequests.initQuickTips();
}

SailPoint.Manage.Grid.AccessRequests.initQuickTips = function() {
  // setup tooltips for role description info
  Ext.QuickTips.init();
  Ext.apply(Ext.QuickTips.getQuickTip(),
  {
    showDelay: 1000,
    autoDismiss: false,
    dismissDelay: 0,
    trackMouse: false
  }); 
  
  SailPoint.component.NameWithTooltip.registerTooltips();
}

SailPoint.Manage.Grid.AccessRequests.showPolicyViolations = function(requestId) {
    var columns = [
        {
          header: 'Policy Name',
          dataIndex: 'policyName'
        },
        {
          header: 'Policy Type',
          dataIndex: 'policyType'
        },
        {
          header: 'Rule Name',
          dataIndex: 'ruleName'
        }
    ];

    var violationsStore = SailPoint.Store.createStore({
        fields : ['id', 'policyName', 'policyType', 'ruleName'],
        autoLoad: false,
        extraParams: { requestId: requestId },
        root: 'details',
        url: CONTEXT_PATH + '/manage/accessRequest/policyViolationDetailsDataSource.json',
        remoteSort: true
      });

    violationsStore.load({params:{start:0, limit:5, requestId:requestId}});

    var violationsGrid = new SailPoint.grid.PagingGrid({
        id: 'violationsGrid',
        store: violationsStore,
        columns: columns,
        pageSize: 5,
        viewConfig : {stripeRows: true}
      });

    var detailsWindow = new Ext.Window({   
        title: 'Policy Violations',
        width: 600,
        maxHeight: 600,
        closable: true,
        modal: true,
        shim: true,
        bodyStyle: 'background-color: white',
        layout: 'fit',
        items: [ violationsGrid ],
        defaults: 
        {   
            border: false
        }
    }); 
    
    detailsWindow.show();
  }

SailPoint.Manage.Grid.AccessRequests.renderDate = function(value, p, r) {
    var val = SailPoint.Date.getDateStringFromMillis(value, SailPoint.DateTimeFormat); // from Date.js
    if(r.get('signOff')) {
        return '<span id="' + r.get('ownerId') + '-eSigTip">' + val + '<img src="' + SailPoint.CONTEXT_PATH + '/images/icons/esigned-16px.png" style="vertical-align:middle; margin-left:5px;"></span>';
    }
    return val;
};

SailPoint.Manage.Grid.AccessRequests.renderComments = function(value, p, r) {
  if (value.length === 0) {
    return value;
  }

  var i, html = '';
  for (i = 0; i < value.length; ++i) {
    var comment = value[i];

    html += '<div style="white-space: pre-line !important; word-wrap: break-word !important;">';
    html += comment.localizedMessage;
    html += '</div>';
  }

  return html;
};

SailPoint.Manage.Grid.AccessRequests.renderApplication = function(value, p, r) {
  var appInfo = r.data['applicationInfo'];
  if (appInfo && appInfo.length > 0) {
    return SailPoint.component.NameWithTooltip.getTooltipHtml(value, appInfo);
  }
  return value;
};

SailPoint.Manage.Grid.AccessRequests.renderApprovalDetails = function(value, p, r) {
  var result = Ext.String.format("#{msgs.dash_access_req_approvals_cnt}", "1");
  var detailsLink = '';
  var isAuthorized =r.data['authorized'];
  if (value != null && value.length > 0 && isAuthorized===true) {
    detailsLink = Ext.String.format(' <a onclick="SailPoint.Manage.Grid.AccessRequests.viewWorkItem(\'{0}\');">[#{msgs.access_request_approvals_grid_clickdetails}]</a>', value);
  }
  return result + detailsLink;
};

SailPoint.Manage.Grid.AccessRequests.renderEmail = function(value, p, r) {
  var ownerId = r.data['ownerId'];
  var workItemId = r.data['workItemId'];
  var emailLink = Ext.String.format('<a onclick="SailPoint.EmailWindow.open(\'{0}\',\'accessRequestReminderEmailTemplate\',\'{1}\', \'true\');">', ownerId, workItemId);
  var imgTag = '<img title="#{msgs.cert_email_child_cert}" src="' + SailPoint.CONTEXT_PATH + '/images/icons/email.png" style="vertical-align:middle; margin-right:4px;">'
  var result = emailLink + imgTag + value + "</a>";
  return result;
};

SailPoint.Manage.Grid.AccessRequests.renderValue = function(value, p, r) {
  var roleName = r.data['name'];
  if (roleName == null || roleName.length == 0) {
    var nameValue = r.data['nameValue'];
    if (nameValue != null && nameValue.length > 0) {
      return nameValue;
    }
  }
  if (roleName == 'password') {
    value = "****";
  }
  
  if (value == null) {
      value = "";
  }
  
  return roleName + " = " + value.escapeHTML();
};

SailPoint.Manage.Grid.AccessRequests.renderRole = function(value, p, r) {
  var isGroupAttribute = r.data['isGroupAttribute'];
  var appName = r.data['application'];
  var roleInfo = r.data['entitlementInfo'];
  var roleId = r.data['roleId'];
  var roleSearchValue = r.data['value'];
  var roleName = r.data['name'];
  var iconType = r.data['iconType'];
  var requestId = r.raw['requestId'];
  var requestItemId = r.raw['requestItemId'];
  var assignmentId = r.raw['assignmentId'];
  var identityId = r.raw['identityId'];

  if (value == null || value.length == 0) {
    return '';
  }

  var rendered = value.escapeHTML();

  if (roleId && roleId.length > 0) {
    rendered = Ext.String.format('<a onclick="SailPoint.RoleDetailPanel.window(\'{0}\', \'{1}\', \'{2}\', true, \'accessRequestItem\', \'{3}\', \'{4}\', \'{5}\')" title="#{msgs.info_role_composition}">{6}</a>', assignmentId, roleId, identityId, roleName, requestId, requestItemId, rendered);
  }
  else if (isGroupAttribute) {
      if(roleSearchValue){
          rendered = '<a onclick="viewAccountGroup(\'' + appName + '\', \'' + roleName + '\', \'' + roleSearchValue + '\');">' + value.escapeHTML() + '</a>';
      }else {
          rendered = '<a onclick="viewAccountGroup(\'' + appName + '\', \'' + roleName + '\', \'' + value + '\');">' + value.escapeHTML() + '</a>';
      }
  }

  var nameWithTooltip = rendered;

  if (roleInfo != null && roleInfo.length != 0) {
    nameWithTooltip = SailPoint.component.NameWithTooltip.getTooltipHtml(rendered, roleInfo);
  }

  if (iconType == null || iconType.length == 0) {
    rendered = '<div>' + nameWithTooltip + "</div>";
  }
  else {
    rendered = '<div style="padding-left:18px" class="' + iconType + 'Icon">' + nameWithTooltip + "</div>";
  }

  return rendered;
};

SailPoint.Manage.Grid.AccessRequests.renderEntitlement = function(value, p, r) {
  var isGroupAttribute = r.data['isGroupAttribute'];
  var appName = r.data['application'];
  var roleInfo = r.data['entitlementInfo'];
  var roleSearchValue = r.data['value'];
  var roleId = r.data['roleId'];
  var roleName = r.data['name'];
  var iconType = r.data['iconType']; 

  if (roleName == 'password') {
    value = '****';
  }

  if (value == null || value.length == 0) {
    return '';
  }

  var rendered = value.escapeHTML();

  if (roleId && roleId.length > 0) {
    rendered = Ext.String.format('<a onclick="SailPoint.RoleDetailPanel.window(null, \'{0}\', null, true)" title="#{msgs.info_role_composition}">{1}</a>', roleId, value.escapeHTML());
  }
  else if (isGroupAttribute == 'true') {
      if(roleSearchValue){
          rendered = '<a onclick="viewAccountGroup(\'' + appName + '\', \'' + roleName + '\', \'' + roleSearchValue + '\');">' + value.escapeHTML() + '</a>';
      }else {
          rendered = '<a onclick="viewAccountGroup(\'' + appName + '\', \'' + roleName + '\', \'' + value + '\');">' + value.escapeHTML() + '</a>';
      }
  }

  rendered = "value " + rendered + " on " + roleName;

  var nameWithTooltip = rendered;

  if (roleInfo != null && roleInfo.length != 0) {
    nameWithTooltip = SailPoint.component.NameWithTooltip.getTooltipHtml(rendered, roleInfo);
  }

  if (iconType == null || iconType.length == 0) {
    rendered = '<div>' + nameWithTooltip + "</div>";
  }
  else {
    rendered = '<div style="padding-left:18px" class="' + iconType + 'Icon">' + nameWithTooltip + "</div>";
  }

  return rendered;
};

SailPoint.Manage.Grid.AccessRequests.columnWrap = function(value,p,r) {
    if (value == null) {
        return "";
    }
    return '<div style="white-space:normal !important; word-wrap: break-word !important;">'+ value +'</div>';
};

SailPoint.Manage.Grid.AccessRequests.createErrorsGrid = function(requestId) {
  var newDivId = 'errorsGrid';
  var errorsColumns = [];
  errorsColumns.push({header: '#{msgs.access_request_errors_grid_col_type}', 
                      id: 'type', dataIndex: 'type', sortable:true, hideable:true});
  errorsColumns.push({header: '#{msgs.access_request_errors_grid_col_message}', 
                      renderer: SailPoint.Manage.Grid.AccessRequests.columnWrap,
                      id: 'message', dataIndex: 'message', sortable:false, hideable:true});

    var store = SailPoint.Store.createStore({
        fields : ['type', 'message'],
        autoLoad: false,
        url: CONTEXT_PATH + '/manage/accessRequest/errorsDataSource.json',
        extraParams: {requestId:requestId},
        root: 'errors',
        remoteSort: true
    });

  var grid = new SailPoint.grid.PagingGrid({
        id: 'errsGrid',
        store: store,
        columns: errorsColumns,
        viewConfig : {stripeRows:true},
        usePageSizePlugin:true,
        pageSize: 5
    }); 

  var panelWidth = Ext.get(newDivId).getSize().width;

  var wrapperPanel = new Ext.Panel({
      layout:'fit',
      width: panelWidth - 15,
      items:[grid]
    });

  wrapperPanel.render(newDivId); 

  grid.getStore().load({params:{start:0, limit:5, requestId:requestId},
  callback: SailPoint.Manage.Grid.AccessRequests.initQuickTips});

  return grid;

};


SailPoint.Manage.Grid.AccessRequests.createFilteredItemsGrid = function(requestId, requestType) {
  var newDivId = 'filteredItemsGrid';
  
  var changesColumns = [];
  changesColumns.push({header: '#{msgs.access_request_item_grid_col_operation}', 
                       dataIndex: 'operation', sortable: true, hideable:true});

  var storeFields = ['id', 'operation', 'name'];
  if (requestType == 'RolesRequest') {
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_role}',
                         renderer: SailPoint.Manage.Grid.AccessRequests.renderRole,
                         dataIndex: 'value', sortable: true, hideable:true});
    storeFields.push('value');
  }
  else if (requestType == 'AccountsRequest') {
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_account}', 
                         dataIndex: 'nativeIdentity', sortable:true, hideable:true});
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_application}', 
                         dataIndex: 'application', sortable:true, hideable:true});
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_instance}', 
                         dataIndex: 'instance', sortable:true, hideable:true});
    storeFields.push('application');
    storeFields.push('instance');
    storeFields.push('nativeIdentity');
  }
  else if (requestType == 'PasswordsRequest' || requestType == 'EntitlementsRequest') {
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_entitlement}', 
                         dataIndex: 'name', sortable: true, hideable:true});
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_value}', 
                         renderer: SailPoint.Manage.Grid.AccessRequests.renderRole,
                         dataIndex: 'value', sortProperty: 'value', sortable:true, hideable:true});
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_account}', 
                         dataIndex: 'nativeIdentity', sortable:true, hideable:true});
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_application}', 
                         dataIndex: 'application', sortable:true, hideable:true});
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_instance}', 
                         dataIndex: 'instance', sortable:true, hideable:true});
    storeFields.push('value');
    storeFields.push('application');
    storeFields.push('instance');
    storeFields.push('nativeIdentity');
  }
  else {
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_value}',
                         renderer: SailPoint.Manage.Grid.AccessRequests.renderValue,
                         dataIndex: 'value', sortProperty: 'value', sortable:true, hideable:true});
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_identity}', 
                         dataIndex: 'nativeIdentity', sortable:true, hideable:true});
    storeFields.push('value');
    storeFields.push('nativeIdentity');
  }

  changesColumns.push({header: '#{msgs.access_request_item_grid_col_comments}',
                       renderer: SailPoint.Manage.Grid.AccessRequests.columnWrap,
                       dataIndex: 'comments', sortable: false, hideable:true});
  changesColumns.push({header: '#{msgs.access_request_item_grid_col_approvalstatus}', 
                       dataIndex: 'approvalState', sortable:true, hideable:true});
  changesColumns.push({header: '#{msgs.access_request_item_grid_col_provisioningstatus}', 
                       dataIndex: 'provisioningState', sortable:true, hideable:true});

  storeFields.push('comments');
  storeFields.push('approvalState');
  storeFields.push('provisioningState');
  
  var store = SailPoint.Store.createStore({
      fields : storeFields,
      autoLoad: false,
      url: CONTEXT_PATH + '/manage/accessRequest/filteredItemsDataSource.json',
      extraParams: {requestId:requestId},
      root: 'items',
      remoteSort: true
  });

  var grid = new SailPoint.grid.PagingGrid({
        id: 'filteredGrid',
        store: store,
        columns: changesColumns,
        viewConfig : {stripeRows:true},
        usePageSizePlugin:true,
        pageSize: 5
    }); 

  var panelWidth = Ext.get(newDivId).getSize().width;

  var wrapperPanel = new Ext.Panel({
      layout:'fit',
      width: panelWidth,
      items:[grid]
    });

  wrapperPanel.render(newDivId); 
  grid.getStore().load({params:{start:0, limit:5, requestId:requestId},
    callback: SailPoint.Manage.Grid.AccessRequests.initQuickTips});
  return grid;
};

SailPoint.Manage.Grid.AccessRequests.createApprovalsGrid = function(requestId, terminatedOrCompleted) {
  var newDivId = 'approvalItemsGrid';

  var changesColumns = [];
  changesColumns.push({header: '#{msgs.access_request_approvals_grid_col_description}', 
                       dataIndex: 'description', sortable:true, hideable:true});

  changesColumns.push({header: '#{msgs.access_request_approvals_grid_col_owner}', 
                       renderer: terminatedOrCompleted ? '' : SailPoint.Manage.Grid.AccessRequests.renderEmail,
                       dataIndex: 'owner', sortable:true, hideable:true});

  changesColumns.push({header: '#{msgs.access_request_approvals_grid_col_opendate}', 
                       renderer : SailPoint.Date.DateTimeRenderer,
                       dataIndex: 'opendate', sortable:true, hideable:true});

  changesColumns.push({header: '#{msgs.access_request_approvals_grid_col_completiondate}',
                       renderer: SailPoint.Manage.Grid.AccessRequests.renderDate,
                       dataIndex: 'completiondate', sortable:true, hideable:true});

  changesColumns.push({header: '#{msgs.access_request_approvals_grid_col_comments}', 
                       renderer: SailPoint.Manage.Grid.AccessRequests.renderComments,
                       dataIndex: 'comments', sortable:false, hideable:true});

  changesColumns.push({header: '#{msgs.access_request_approvals_grid_col_status}', 
                       dataIndex: 'status', sortable:true, hideable:true});

  changesColumns.push({header: '#{msgs.access_request_approvals_grid_col_details}',
                       renderer: SailPoint.Manage.Grid.AccessRequests.renderApprovalDetails,
                       dataIndex: 'workItemId', sortable:false, hideable:true, tdCls:'wrappingGridCells'});

  var storeFields = ['id', 'description', 'owner', 'ownerId', 'workItemId', 'comments', 'opendate', 'completiondate', 'status', 'signOff', 'authorized'];

  var store = SailPoint.Store.createStore({
      fields : storeFields,
      autoLoad: false,
      url: CONTEXT_PATH + '/manage/accessRequest/approvalsDataSource.json',
      extraParams: {requestId:requestId},
      root: 'items',
      remoteSort: true,
      listeners : {
          load : function(store, r, s, eOpts) {
              Ext.each(r, function(item) {
                  var soh = item.get('signOff');
                  if(soh) {
                      SailPoint.Utils.setupESigTooltip(item.get('ownerId') + '-eSigTip', soh.signerDisplayName, soh.account, soh.date, soh.application, soh.text);
                  }
              });
          }
      }
  });

  var grid = new SailPoint.grid.PagingGrid({
        id: 'approvalsGrid',
        store: store,
        columns: changesColumns,
        viewConfig : {stripeRows:true},
        usePageSizePlugin:true,
        pageSize: 5
    }); 

  var panelWidth = Ext.get(newDivId).getSize().width;

  var wrapperPanel = new Ext.Panel({
      renderTo : newDivId,
      layout:'fit',
      width: panelWidth - 15,
      items:[grid]
    });

  grid.getStore().load({params:{start:0, limit:5, requestId:requestId}, 
      callback: SailPoint.Manage.Grid.AccessRequests.initQuickTips});
  return grid;
};

SailPoint.Manage.Grid.AccessRequests.createRequestGrid = function(requestId, requestType) {
  var newDivId = 'requestItemsGrid';

  var storeFields = ['id', 'operation', 'name', 'value', 'displayableValue', 'application', 'instance', 'nativeIdentity', 'comments', 'approvalState', 'provisioningState'];

  var changesColumns = [];
  changesColumns.push({header: '#{msgs.access_request_item_grid_col_operation}', 
                       dataIndex: 'operation', sortable: true, hideable:true});

    changesColumns.push({header: '#{msgs.access_request_item_grid_col_entitlement}', dataIndex: 'name', sortable: true, hideable:true});

  if (requestType =='ForgotPassword' 
        || requestType == 'ExpirePassword' 
        || requestType == 'PasswordsRequest') {
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_value}', renderer: function() {return '****';}, sortable:false, hideable:false});
  }
  else if (requestType == 'AccessRequest' || requestType == 'EntitlementsRequest' || requestType == 'RolesRequest') {
    var addStoreFields = ['isGroupAttribute', 'roleId', 'entitlementInfo', 'iconType', 'roleSearchName'];
    storeFields = storeFields.concat(addStoreFields);
    
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_value}',
        renderer: SailPoint.Manage.Grid.AccessRequests.renderRole,
        dataIndex: 'value', sortProperty: 'value', sortable:true, hideable:true});

    changesColumns.push({header: '#{msgs.access_request_item_grid_col_display}',
        renderer: SailPoint.Manage.Grid.AccessRequests.renderRole,
        dataIndex: 'displayableValue', sortProperty: 'displayableValue', sortable:false, hideable:true});
  } 
  else {
     changesColumns.push({header: '#{msgs.access_request_item_grid_col_value}',
        dataIndex: 'value', sortProperty: 'value', sortable:true, hideable:true});

     changesColumns.push({header: '#{msgs.access_request_item_grid_col_display}',
         dataIndex: 'displayableValue', sortProperty: 'displayableValue', sortable:false, hideable:true});
  }

  if (requestType != 'IdentityCreateRequest' && requestType != 'IdentityEditRequest') {
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_account}', 
                         dataIndex: 'nativeIdentity', sortable:true, hideable:true});
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_application}', 
                         dataIndex: 'application', sortable:true, hideable:true});
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_instance}', 
                         dataIndex: 'instance', sortable:true, hideable:true});
  }

  changesColumns.push({header: '#{msgs.access_request_item_grid_col_comments}', 
	                   renderer: SailPoint.Manage.Grid.AccessRequests.columnWrap,
                       dataIndex: 'comments', sortable: false, hideable:true});
  changesColumns.push({header: '#{msgs.access_request_item_grid_col_approvalstatus}', 
                       dataIndex: 'approvalState', sortable:true, hideable:true});
  changesColumns.push({header: '#{msgs.access_request_item_grid_col_provisioningstatus}', 
                       dataIndex: 'provisioningState', sortable:true, hideable:true});

  var store = SailPoint.Store.createStore({
      fields : storeFields,
      autoLoad: false,
      url: CONTEXT_PATH + '/manage/accessRequest/requestItemsDataSource.json',
      extraParams: {requestId:requestId},
      root: 'items',
      remoteSort: true
  });

  var grid = new SailPoint.grid.PagingGrid({
        id: newDivId,
        store: store,
        columns: changesColumns,
        viewConfig : {stripeRows:true},
        usePageSizePlugin:true,
        pageSize: 5
    }); 

  var panelWidth = Ext.get(newDivId).getSize().width;

  var wrapperPanel = new Ext.Panel({
      layout:'fit',
      width: panelWidth - 15,
      items:[grid]
    });

  wrapperPanel.render(newDivId); 
  grid.getStore().load({params:{start:0, limit:5, requestId:requestId},
    callback: SailPoint.Manage.Grid.AccessRequests.initQuickTips});
  return grid;
};

/* Create grid for a specific target integration */
SailPoint.Manage.Grid.AccessRequests.createGrid = function(requestId, targetIntegration, index, requestType) {
  // create new div to hold grid
  var newDivId = 'changesGrid-'+index;
  Ext.DomHelper.insertFirst('provisioningChangesGrids', {tag: 'div', cls: 'changeDetailsGrid', id: newDivId});

  // add the provisioning engine name as the title of the grid
  Ext.DomHelper.insertBefore(newDivId, '<span class="sectionHeader">'+targetIntegration+'</span>');

  var changesColumns = [];

  changesColumns.push({header: '#{msgs.access_provisioning_grid_hdr_operation}', 
                       dataIndex: 'operation', sortable: true, hideable:true});

  var storeFields = ['id', 'operation', 'name', 'value', 'displayableValue',  'nativeIdentity', 'application', 'instance', 'retries', 'provisioningState'];

  changesColumns.push({header: '#{msgs.access_request_item_grid_col_entitlement}', dataIndex: 'name', sortable: true, hideable:true});

  if (requestType == 'AccountsRequest') {
    changesColumns.push({header: '#{msgs.access_request_item_grid_col_value}', 
                         dataIndex: 'value', sortProperty: 'value', sortable:true, hideable:true});
  }
  else {
    if (requestType =='ForgotPassword' 
          || requestType == 'ExpirePassword' 
          || requestType == 'PasswordsRequest') {
      changesColumns.push({header: '#{msgs.access_request_item_grid_col_value}', renderer: function() {return '****';}, sortable:false, hideable:false});
    }
    else if (requestType == 'AccessRequest' || requestType == 'EntitlementsRequest' || requestType == 'RolesRequest') {
      var addStoreFields = ['isGroupAttribute', 'roleId', 'entitlementInfo', 'iconType','roleSearchName'];
      storeFields = storeFields.concat(addStoreFields);
      
      changesColumns.push({header: '#{msgs.access_request_item_grid_col_value}',
          renderer: SailPoint.Manage.Grid.AccessRequests.renderRole,
          dataIndex: 'value', sortProperty: 'value', sortable:true, hideable:true});
      if (targetIntegration != 'IdentityIQ') {
          //defect21346 - Things that show up in the IdentityIQ grid should use the displayableValue
          changesColumns.push({header: '#{msgs.access_request_item_grid_col_display}',
              renderer: SailPoint.Manage.Grid.AccessRequests.renderRole,
              dataIndex: 'displayableValue', sortProperty: 'displayableValue', sortable:false, hideable:true});
      }
    }
    else {
    }
  }

  changesColumns.push({header: '#{msgs.access_provisioning_grid_hdr_account}', 
                       dataIndex: 'nativeIdentity', sortable: true, hideable:true});
  changesColumns.push({header: '#{msgs.access_provisioning_grid_hdr_application}',
                dataIndex: 'application', 
                renderer: SailPoint.Manage.Grid.AccessRequests.renderApplication,
                sortable: true,
                hideable:true});

  if (targetIntegration != 'IdentityIQ') {
    changesColumns.push({header: '#{msgs.access_provisioning_grid_hdr_instance}', 
                         dataIndex: 'instance', sortable: true, hideable:true});

    // attempt to show provisioningRequestId for all target integrations other than IIQ
    storeFields.push('provisioningRequestId');
    changesColumns.push({header: '#{msgs.access_provisioning_grid_hdr_prov_req_id}',
                         dataIndex: 'provisioningRequestId',
                         // This is unsortable because it is not a Hibernate property.
                         // It's stored in the attributes map
                         sortable: false,  
                         hideable:true});
  }

  changesColumns.push({header: '#{msgs.access_provisioning_grid_hdr_status}', 
                       dataIndex: 'provisioningState', sortable: true, hideable:true});
  changesColumns.push({header: '#{msgs.access_provisioning_grid_hdr_retries}', 
                       dataIndex: 'retries', sortable: true, hideable:true});


  if (requestType == 'AccessRequest' || requestType == 'RolesRequest') {
    storeFields.push('startDate');
    storeFields.push('endDate');

    changesColumns.push({header: '#{msgs.access_provisioning_grid_hdr_start_date}',
                         dataIndex: 'startDate', 
                         sortable: true, 
                         hideable:true});
    changesColumns.push({header: '#{msgs.access_provisioning_grid_hdr_end_date}',
                         dataIndex: 'endDate', 
                         sortable: true, 
                         hideable:true});

  }
  storeFields.push('compilationStatus');
  changesColumns.push({header: '#{msgs.access_provisioning_grid_hdr_compilation_status}',
                         dataIndex: 'compilationStatus', 
                         sortable: true, 
                         hideable:true});

  var store = SailPoint.Store.createStore({
      url: CONTEXT_PATH + '/manage/accessRequest/provisioningChangesDataSource.json',
      autoLoad: false,
      fields : storeFields,
      root: 'changes',
      extraParams: {requestId:requestId, targetName:targetIntegration},
      remoteSort: true
  });

  var grid = new SailPoint.grid.PagingGrid({
        id: 'provisioningChangesGrid-'+index,
        store: store,
        columns: changesColumns,
        viewConfig : {stripeRows:true},
        usePageSizePlugin:true,
        pageSize: 5
    }); 

  var panelWidth = Ext.get(newDivId).getSize().width;

  var wrapperPanel = new Ext.Panel({
      layout:'fit',
      width: panelWidth - 15,
      items:[grid]
    });

  wrapperPanel.render(newDivId); 
  grid.getStore().load({params:{start:0, limit:5, requestId:requestId, targetName:targetIntegration},
    callback: SailPoint.Manage.Grid.AccessRequests.initQuickTips});
  return grid;
}

SailPoint.Manage.Grid.AccessRequests.viewRequestDetails = function(requestId) {
  var wid = Ext.query('input[name$=:requestId]');
  
  for (var i = 0; i < wid.length; i++) {
    wid[i].value = requestId;
  }
  
  var wib = Ext.query('input[name$=viewRequestDetails]');
  
  if (wib.length > 0 && wid[0].value.length > 0) {
    wib[0].click();
  }
}

SailPoint.Manage.Grid.AccessRequests.viewWorkItem = function(workItemId) {
  var wid = Ext.query('input[name$=workItemId]');
  
  if (wid.length > 0) {
    wid[0].value = workItemId;
  }
  
  var wib = Ext.query('input[name$=viewWorkItem]');
  
  if (wib.length > 0 && wid[0].value.length > 0) {
    wib[0].click();
  }
}
