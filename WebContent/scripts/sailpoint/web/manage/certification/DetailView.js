Ext.ns('SailPoint', 'SailPoint.certification');

SailPoint.certification.detailNext = function(){
    var id = Ext.fly('nextEntity').dom.value;
    SailPoint.CurrentEntityIndex++;

    if ((SailPoint.CurrentEntityIndex + 1) == SailPoint.TotalEntities){
        Ext.getCmp('nextButton').disable();
    }

    if (SailPoint.CurrentEntityIndex == 1)
        Ext.getCmp('previousButton').enable();

    SailPoint.certification.updateDetailView(id);
};

SailPoint.certification.detailPrev = function(){
    var id = Ext.fly('prevEntity').dom.value;
    SailPoint.CurrentEntityIndex--;

    if (SailPoint.CurrentEntityIndex == 0){
        Ext.getCmp('previousButton').disable();
    }

    Ext.getCmp('nextButton').enable();

    SailPoint.certification.updateDetailView(id);
};


SailPoint.certification.getPanelGridCount = function(panelId) {
    var pan = Ext.getCmp(panelId).items;
    var c = 0;
    pan.each(function(p){
        if(p.getXType().indexOf('grid') > -1) { c++; }
    });
    return c;
};

SailPoint.certification.updateDetailView = function(id){
    var gridCount = SailPoint.certification.getPanelGridCount('decisionsPanel');
    var decPanel = Ext.getCmp('decisionsPanel');
    var mainPanel = Ext.getCmp('mainPanel');

    Ext.fly('title').addCls('loading');
    mainPanel.setActiveTab('decisionsPanel');
    SailPoint.CurrentEntityDetails.entityId = id;
    SailPoint.certification.getEntitySummary(id, false);
    
    var dpi = decPanel.items;
    dpi.each(function(p){
        if(p.getXType().indexOf('grid') > -1) { // could be basecertgrid or gridpanel
            p.getStore().applyPathParams([id]);
            p.getStore().loadPage(1);
        }
    });

    var msgsPanel = Ext.getCmp('messagesPanel');
    msgsPanel.update('');
    msgsPanel.hide();
    
    SailPoint.certification.updateGridColumns();
};

SailPoint.certification.updateGridColumns = function() {
	var entitlementsGrid = Ext.getCmp('certificationGrid-entitlements');
	if (entitlementsGrid && entitlementsGrid.columns) {		
		for (var i = 0; i < entitlementsGrid.columns.length; ++i) {
			var column = entitlementsGrid.columns[i];
			
			if (column.dataIndex == 'exceptionEntitlements-application') {
				column.setVisible(SailPoint.CurrentEntityDetails.showApp);
			}
			
			if (column.dataIndex == 'exceptionEntitlements-instance') {
				column.setVisible(SailPoint.CurrentEntityDetails.hasInstances);
			}
		}
	}
}

SailPoint.certification.initDetailView = function(doSecondPass){
    
    Ext.suspendLayouts();

    Page.addEvents('toggleExpando');
    Page.addEvents('closeAllExpandos');
    
    ImageRadio.disableClickOnMouseup = true;

    // We need to keep the onclick even if the radio is disabled
    // since we may enable disabled items
    ImageRadio.allowDisabledOnClick = true;

    // Create an array where we can store the list of grids to
    // display. Since not all entities will have all item types,
    // we conditionally decide which grids should be included
    // in the UI based on the count of CertificationItem types on the entity
    var detailGrids = [];

    SailPoint.certification.setEntityCustomFields();

    var vRadio = new SailPoint.VirtualRadioButton('mainPanel','itemDecision');

    SailPoint.gridWidth = Ext.getDom('mainPanelDiv').clientWidth;

    var itemType = SailPoint.CurrentEntityDetails.itemType != '' ? SailPoint.CurrentEntityDetails.itemType : null;
    var itemId = SailPoint.CurrentEntityDetails.itemId != '' ? SailPoint.CurrentEntityDetails.itemId : null;

    detailGrids = SailPoint.certification.initDetailGrids(SailPoint.CurrentEntityDetails.entityId,
            SailPoint.CurrentEntityDetails.certType, itemType);

    var detailGridIds = [];
    detailGrids.each(function(grid){
        detailGridIds.push(grid.id);
    });

    if (itemId){
        for(var i=0; i<detailGrids.length; i++) {
            detailGrids[i].extraParams["itemId"] = itemId;
        }
    }

    var decider = SailPoint.certification.initDetailDecider(SailPoint.certificationConfig, detailGridIds,
            doSecondPass);

    var decisionPanelItems = [];

    if (Ext.fly('bulkButtonContainer')){
        decisionPanelItems.push({xtype:'panel', contentEl:'bulkButtonContainer', border:false, style:'margin-left:10px'});
    }

    if (Ext.fly('entityClassification')){
        decisionPanelItems.push({xtype:'panel', contentEl:'entityClassification', border:false, style:'margin-left:10px'});
    }

    decisionPanelItems.push({xtype:'container', contentEl:'decisionLegend', style:'margin-left:10px'})

    detailGrids.each(function(grid){
        decisionPanelItems.push(grid);
    });

    var messagesPanel = new Ext.Panel({
        id:'messagesPanel',
        renderTo:'messagesDiv',
        height:125,
        style:'padding:5px',
        width: SailPoint.gridWidth,
        style:'margin-bottom:20px',
        autoScroll:true,
        hideMode:'display',
        hidden:true,
        title:'#{msgs.cert_panel_errors_and_warnings}'

    });

    //----------------------------------------------------
    //
    //  Create Tabs - these are generated based on cert type
    //
    //----------------------------------------------------

    var tabs = [{
        xtype: 'panel',
        id: 'decisionsPanel',
        title: '#{msgs.cert_decisions}',
        items: decisionPanelItems
    }];

    SailPoint.certification.initDetailTabs(SailPoint.CurrentEntityDetails.type, SailPoint.WorkItemId).each(function(tab){
        tabs.push(tab);
    });

    //----------------------------------------------------
    //
    //  Create and Render Main Panel
    //
    //----------------------------------------------------

    var mainPanel = Ext.create('Ext.TabPanel', {
        id : 'mainPanel',
        plain: true,
        activeItem : 'decisionsPanel',
        width : SailPoint.gridWidth,
        renderTo : 'mainPanelDiv',
        items : tabs
    });
    
    mainPanel.setActiveTab('decisionsPanel');

    //----------------------------------------------------
    //
    //  Create Buttons
    //
    //----------------------------------------------------

    var buttonsToHandle = [];
    if (Ext.fly('prevButton')){
        var prevButton = new Ext.Button({
            id:'previousButton',
            renderTo:'prevButton',
            text:SailPoint.prevButtonText,
            disabled:SailPoint.CurrentEntityIndex == 0,
            handler:SailPoint.certification.detailPrev
        });

        var nextButton = new Ext.Button({
            id:'nextButton',
            renderTo:'nextButton',
            text:SailPoint.nextButtonText,
            disabled:(SailPoint.CurrentEntityIndex + 1) == SailPoint.TotalEntities,
            handler:SailPoint.certification.detailNext
        });
    }

    var saveButton = new Ext.Button({
        id:'btnSave',
        text:'#{msgs.cert_button_save_decisions}',
        renderTo:'saveButton',
        hidden:true
    });
    saveButton.on('click', decider.save, decider);
    buttonsToHandle.push(saveButton);

    var cancelButton = new Ext.Button({
        id:'btnCancel',
        text:'#{msgs.cert_button_clear_decisions}',
        renderTo:'cancelButton',
        hidden:true
    });
    cancelButton.on('click', decider.removeAll, decider);
    buttonsToHandle.push(cancelButton);

    if (Ext.fly('backButton')){
        var backButton = new Ext.Button({
            id:'btnBack',
            text:'#{msgs.cert_button_back}',
            cls : 'secondaryBtn',
            renderTo:'backButton',
            handler:function(){
                try { Ext.getDom('editForm:goBack').click(); } catch(e) {}
            }
        });
        buttonsToHandle.push(backButton)
    }

    if (Ext.fly('createRoleButton')){
        var createRoleButton = new Ext.Button({
          id:'btnCreateRole',
          text:'#{msgs.create_role}',
          renderTo:'createRoleButton'
      });
      createRoleButton.on('click', function(){
          var createRoleDialog = new SailPoint.certification.CreateRoleDialog({
              entity:SailPoint.CurrentEntityDetails,
                  certification:SailPoint.certificationConfig});
          createRoleDialog.display();
      });
      buttonsToHandle.push(createRoleButton);
    }
    
    decider.on('beforeSave', function() {
       for (var i = 0; i < buttonsToHandle.length; i++) {
           buttonsToHandle[i].disable();
       } 
    });

    decider.on('afterSave', function() {
        for (var i = 0; i < buttonsToHandle.length; i++) {
            buttonsToHandle[i].enable();
        }
    });

    // ------------------------------------------------
    // Bulk Decision Buttons
    // ------------------------------------------------

    if (Ext.fly('bulkApproveBtn')){
        Ext.fly('bulkApproveBtn').on('click', function(event){
            SailPoint.certification.bulkDecisionHandler('bulkApproveBtn', SailPoint.Decision.STATUS_APPROVED);
        });
    }

    if (Ext.fly('bulkDelegateBtn')){
        Ext.fly('bulkDelegateBtn').on('click', function(event){
            SailPoint.certification.bulkDecisionHandler('bulkDelegateBtn', SailPoint.Decision.STATUS_DELEGATED);
        });
    }

    if (Ext.fly('bulkRevokeBtn')){
        Ext.fly('bulkRevokeBtn').on('click', function(event){
            SailPoint.certification.bulkDecisionHandler('bulkRevokeBtn', SailPoint.Decision.STATUS_REVOKE);
        });
    }

    if (Ext.fly('bulkRevokeAccountBtn')){
        Ext.fly('bulkRevokeAccountBtn').on('click', function(event){
            SailPoint.certification.bulkDecisionHandler('bulkRevokeAccountBtn', SailPoint.Decision.STATUS_REVOKE_ACCT);
        });
    }

    if (Ext.fly('bulkUndoBtn')){
        Ext.fly('bulkUndoBtn').on('click', function(event){
            SailPoint.certification.bulkDecisionHandler('bulkUndoBtn', SailPoint.Decision.STATUS_UNDO);
        });
    }

    if(SailPoint.isEntityDelegated && (!SailPoint.CurrentEntityDetails.workItemId || (SailPoint.CurrentEntityDetails.currentDelegationOwner != SailPoint.CurrentEntityDetails.loggedInUser))) {
      var identityMenuConfig = SailPoint.delegationStatus;
      new SailPoint.CertificationIdentityMenu(Ext.getDom('bulkDelegationDecisionMenu'),identityMenuConfig);
      SailPoint.certification.setBulkButtonsDisabled(true);
    }

    SailPoint.certification.updateGridColumns();
};

SailPoint.certification.bulkDecisionHandler = function(buttonElementId, action){

    if (Ext.fly(buttonElementId).hasCls('disabled')){
        return;
    }

    var decider = SailPoint.Decider.getInstance();
    decider.bulkEntityDecide(action, SailPoint.CurrentEntityDetails.entityId);
};

SailPoint.certification.setBulkButtonStatus = function(buttonElement, disabled){
    if (Ext.fly(buttonElement)){
        if (disabled){
            Ext.fly(buttonElement).addCls('disabled');
        } else {
            Ext.fly(buttonElement).removeCls('disabled');
        }
    }
};

SailPoint.certification.setBulkButtonsDisabled = function(disabled){
    SailPoint.certification.setBulkButtonStatus('bulkApproveBtn', disabled);
    SailPoint.certification.setBulkButtonStatus('bulkDelegateBtn', disabled);
    SailPoint.certification.setBulkButtonStatus('bulkRevokeBtn', disabled);
    SailPoint.certification.setBulkButtonStatus('bulkRevokeAccountBtn', disabled);
    SailPoint.certification.setBulkButtonStatus('bulkUndoBtn', disabled);
};

SailPoint.certification.setEntityCustomFields = function(){
    if (SailPoint.setCustomEntityValues){
        SailPoint.setCustomEntityValues(SailPoint.CurrentEntityDetails.custom1, SailPoint.CurrentEntityDetails.custom2,
                SailPoint.CurrentEntityDetails.customMap);
    }
};

SailPoint.certification.initDetailDecider = function(certificationConfig, gridIds, doSecondPass){

    var decider = SailPoint.Decider.init({
        gridIds:gridIds,
        certificationConfig:certificationConfig,
        doLoadSecondPass:doSecondPass
    });

    if (SailPoint.certificationConfig.editable){

        SailPoint.StatusWidget = new SailPoint.CertificationStatusor({
            renderTo:'statusWidget'
        });

        decider.on('statusChange', function(decisionCount) {
            SailPoint.StatusWidget.setCount(decisionCount);
            if (decisionCount > 0) {
                Ext.getCmp('btnSave').show();
                Ext.getCmp('btnCancel').show();
            } else {
                Ext.getCmp('btnSave').hide();
                Ext.getCmp('btnCancel').hide();
            }
        });
        
        decider.on('beforeSave', function() {
            SailPoint.certification.setBulkButtonsDisabled(true); 
        });

        decider.on('afterSave', function(shouldGoBack) {
            Page.fireEvent('closeAllExpandos');
            SailPoint.certification.setBulkButtonsDisabled(false);
            if (shouldGoBack == true)
                setTimeout(SailPoint.certification.goBack, 1000);
        });
    }

    /** Need to update the delegation status when the decisions are saved 
     * in case the delegation has been revoked
     */
    decider.on('save', function(response) {
        // Save the value of workItemComplete to the hidden input..
        var workItemComplete = Ext.getDom('editForm:workItemComplete');
        if (workItemComplete) {
            workItemComplete.value = response.workItemComplete;
        }
        
        var id = SailPoint.CurrentEntityDetails.entityId;
        SailPoint.certification.getEntitySummary(id, true, SailPoint.certificationConfig.workItemId);
    });

    return decider;
};

SailPoint.certification.goBack = function() {
    if($('editForm:goBack'))
            $('editForm:goBack').click()
};

/** 
 * Provides a full summary of the entity used to paint various pieces of the page 
 * delegationOnly is used when the user submits a decision that involves updating the delegation status
 **/
SailPoint.certification.getEntitySummary = function(id, delegationOnly, workItemId){

    var url = '/rest/certEntity/'+id+'/summary';
    
    if (workItemId) {
        url = url + '?workItemId=' + workItemId;
    }

    Ext.Ajax.request({
        scope:this,
        url: SailPoint.getRelativeUrl(url),
        success: function(response){
            if (Ext.fly("title")){
                Ext.fly('title').removeCls('loading');
            }
            var respObj = Ext.decode(response.responseText);
            if (!respObj.success){
                if (!respObj.errors || respObj.errors.length == 0){
                    SailPoint.FATAL_ERR_ALERT();
                } else {
                    SailPoint.EXCEPTION_ALERT(respObj.errors[0]);
                }
            } else{
                var data = respObj.object;
                
                if(!delegationOnly) {
                  SailPoint.CurrentEntityDetails.entityId = data.id;
                  SailPoint.CurrentEntityDetails.workItemId = data.delegationStatus ? data.delegationStatus.workItemId : null;
                  SailPoint.CurrentEntityDetails.delegationDesc = data.delegationDesc;
                  SailPoint.CurrentEntityDetails.remediationDesc = data.remediationDesc;
                  Ext.fly('title-name').update(data.name);
                  Ext.fly('title-index').update(data.index);
                  Ext.fly('nextEntity').dom.value= data.nextEntity;
                  Ext.fly('prevEntity').dom.value= data.prevEntity;
                }
                
                SailPoint.CurrentEntityDetails.currentDelegationOwner = data.currentDelegationOwner;

                SailPoint.CurrentEntityDetails.custom1 = data.custom1;
                SailPoint.CurrentEntityDetails.custom2 = data.custom2;
                SailPoint.CurrentEntityDetails.customMap = data.customMap;

                SailPoint.CurrentEntityDetails.activeDelegations  = data.activeDelegations;
                SailPoint.CurrentEntityDetails.savedDecisionCount  = data.savedDecisionCount;
                
                SailPoint.CurrentEntityDetails.hasInstances = data.hasInstances;
                SailPoint.CurrentEntityDetails.showApp = data.showApp;
                
                if(Ext.get('bulkDelegationMsg') && data.delegationStatus.description) {
                    Ext.get('bulkDelegationMsg').show();
                    Ext.getDom('bulkDelegationMsgTxt').innerHTML = data.delegationStatus.description;

                  if(data.delegationStatus.isDelegated) {
                    new SailPoint.CertificationIdentityMenu(Ext.getDom('bulkDelegationDecisionMenu'), data.delegationStatus);
                    SailPoint.certification.setBulkButtonsDisabled(true);
                  }
                  
                } else if (Ext.get('bulkDelegationMsg')){
                  var elem = Ext.get('bulkDelegationMsg');
                  elem.setVisibilityMode(Ext.Element.DISPLAY);
                  elem.setVisible(false); 
                  SailPoint.certification.setBulkButtonsDisabled(false);
                }

                 SailPoint.certification.setEntityCustomFields();
                 SailPoint.certification.updateGridColumns();
            }
        },
        /**
        * Throws up a sys err msg. Note that this is not called when
        * success==false in the response, but if the call returns a 404 or 500.
        */
        failure: function(response){
            Ext.fly('title').removeCls('loading');
            SailPoint.FATAL_ERR_ALERT.call(this);
        },
        params: { }
    });
};

SailPoint.certification.initGrid = function(type, title, entityId){

    var workItemId = SailPoint.CurrentEntityDetails ? SailPoint.CurrentEntityDetails.workItemId : null;
    
    var gridConfig = {
        xtype: 'basecertgrid',
        id: 'certificationGrid-' + type,
        title: title,
        gridMetaData: SailPoint.gridLayouts[type],
        url: SailPoint.getRelativeUrl('/rest/certEntity/{0}/' + type),
        pageSize: 15,
        buttonsDisabled: SailPoint.certificationConfig.buttonsDisabled,
        style: 'margin:0 10px 10px 10px',
        allowToolTips: SailPoint.certificationConfig.allowToolTips,
        plugins: [ {ptype: 'certitemexpander', expandOnDblClick: false, rowBodyTpl: ' '} ],
        runInitialLoad: true, // config for PagingGrid to call initalLoad() in initComponent.
        initialPathParams: [entityId], // config for RestJsonStore to call applyPathParams() in constructor.
        storeListeners : {
            load : {
                fn : function(store, records, options) {
                    var grid = Ext.getCmp('certificationGrid-' + type);
                    if (records.size() == 0) {
                        grid.hide();
                    }
                    else {
                        grid.show();
                    }

                    if (SailPoint.certificationConfig.doSecondPass)
                        SailPoint.Certification.CertificationItemSecondPass.gridLoaded(
                                SailPoint.CurrentEntityDetails.workItemId, records);
                    
                    if(SailPoint.observableAgent) {
                        SailPoint.observableAgent.fireEvent('storeLoadComplete');
                    }
                }
            }
        }
    };
    
    if (workItemId) {
        gridConfig.extraParams = {workItemId : workItemId};
    }
    
    //Disable hover event methods since no actions on these columns
    if (gridConfig.gridMetaData) {
        gridConfig.gridMetaData.columns.each(function(column){
            column.onTitleMouseOver = Ext.emptyFn;
            column.onTitleMouseOut = Ext.emptyFn;
        });
    }

    return gridConfig;
};

SailPoint.certification.initDetailGrids = function(entityId, certType, itemType){

    var grids = [];

    var hasViolations =certType != "BusinessRoleMembership" && certType != "AccountGroupMembership" &&
            certType != "AccountGroupPermissions" && certType != "DataOwner" && certType != "BusinessRoleComposition";

    if (itemType && itemType != 'PolicyViolation')
        hasViolations = false;

    if (hasViolations){
        var violationGrid = SailPoint.certification.initGrid('violations', '#{msgs.policy_violations}', entityId);
        grids.push(violationGrid);
    }

    var hasRoles = certType != "AccountGroupMembership"&& certType != "BusinessRoleComposition"
            && certType != "AccountGroupPermissions"  && certType != "DataOwner";

    if (itemType && itemType != 'Bundle')
        hasRoles = false;

    if (hasRoles){
        var roleGrid = SailPoint.certification.initGrid('roles', '#{msgs.cert_entity_section_roles}', entityId);
        grids.push(roleGrid);
    }

    var hasEntitlements = certType != "BusinessRoleMembership" && certType != "AccountGroupMembership"
            && certType != "AccountGroupPermissions" && certType != "DataOwner" && certType != "BusinessRoleComposition";

    if (itemType && itemType != 'Exception' && itemType != 'Account')
        hasEntitlements = false;

    if (hasEntitlements){
        var entitlementGrid = SailPoint.certification.initGrid('entitlements', '#{msgs.additional_entitlements}', entityId);
        grids.push(entitlementGrid);
        
        Page.on('toggleEntitlementDescriptions', function() {
        	var entitlementsGrid = Ext.getCmp('certificationGrid-entitlements');
        	if (entitlementsGrid) {
        		entitlementsGrid.doLayout();
        	}
        });
    }

    if (certType == "AccountGroupPermissions"){
        var permissionsGrid = SailPoint.certification.initGrid('permissions', '#{msgs.account_group_permissions}', entityId);
        grids.push(permissionsGrid);
    }

    if (certType == "DataOwner"){
        var dataOwnerGrid = SailPoint.certification.initGrid('dataowner', '#{msgs.cert_detail_dataowner_grid_title}', entityId);
        grids.push(dataOwnerGrid);
    }


    var hasGroupMembership= certType == "AccountGroupMembership";
    if (hasGroupMembership){
        var groupMembersGrid = SailPoint.certification.initGrid('memberships', '#{msgs.account_group_membership}', entityId);
        grids.push(groupMembersGrid);
    }

    if (certType == "BusinessRoleComposition"){

        if (!itemType || itemType == 'BusinessRoleProfile'){
            var roleProfilesGrid = SailPoint.certification.initGrid('profiles', '#{msgs.cert_item_role_comp_profiles}', entityId);
            grids.push(roleProfilesGrid);
        }

        if (!itemType || itemType == 'BusinessRoleHierarchy' || itemType == 'BusinessRoleRequirement' || itemType == 'BusinessRolePermit'){
            var relatedRolesGrid = SailPoint.certification.initGrid('relatedroles', '#{msgs.cert_item_role_comp_related_roles}', entityId);
            grids.push(relatedRolesGrid);
        }

        if (!itemType || itemType == 'BusinessRoleGrantedCapability' || itemType == 'BusinessRoleGrantedScope'){
            var scopesAndCapsGrid = SailPoint.certification.initGrid('scopes', '#{msgs.cert_item_role_comp_grants}', entityId);
            grids.push(scopesAndCapsGrid);
        }
    }

    return grids;
};

SailPoint.certification.initDetailTabs = function(entityType, workItemId){
    var tabs = [];
    if (entityType == "Identity"){
        tabs.push(
            {
                xtype : 'entitydetailpanel',
                id:'recentChanges',
                title:'#{msgs.recent_changes}',
                url:SailPoint.getRelativeUrl('/manage/certification/tabContent/differencesPanel.jsf?workItemId='+workItemId+'&entityId=')
            }
        );
        tabs.push(
            {
                xtype : 'entitydetailpanel',
                id:'employeeData',
                title:'#{msgs.emp_data}',
                url:SailPoint.getRelativeUrl('/manage/certification/tabContent/employeeData.jsf?workItemId='+workItemId+'&entityId=')
            }
        );
        tabs.push(
            {
                xtype : 'entitydetailpanel',
                id:'riskData',
                title:'#{msgs.risk_data}',
                url:SailPoint.getRelativeUrl('/manage/certification/tabContent/certificationScoreCard.jsf?workItemId='+workItemId+'&entityId=')
            }
        );
    } else if (entityType == "AccountGroup"){
        tabs.push(
            {
                xtype : 'entitydetailpanel',
                id:'groupDetails',
                title:'#{msgs.group_info}',
                url:SailPoint.getRelativeUrl('/manage/certification/tabContent/groupDetails.jsf?workItemId='+workItemId+'&entityId=')
            }
        );
    } else if (entityType == "BusinessRole"){
        tabs.push(
            {
                xtype : 'entitydetailpanel',
                id:'roleDetails',
                title:'#{msgs.role_details_tab}',
                url:SailPoint.getRelativeUrl('/manage/certification/tabContent/roleDetailsTab.jsf?workItemId='+workItemId+'&entityId=')
            }
        );
    }

    return tabs;
};
