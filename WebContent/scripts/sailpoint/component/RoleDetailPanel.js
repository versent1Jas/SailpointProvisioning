/**
* <p>
* Usage - This component can be rendered to the page using SailPoint.RoleDetailPanel.toggle().
* More or less, this method requires a role ID and the dom element where the component
* should be rendered.
* </p>
* <p>
* The SailPoint.RoleDetailPanel component is an Ext.TabPanel composed of one or two
* sub-panels. In the role which is being displayed is a detected role, only the
* 'Role Hierarchy' tab will be displayed. Assigned roles will have an additional
* 'Permitted and Required Roles' tab.
* <p>
* Each tab is an instance of SailPoint.RoleHierarchyPanel, which contains a tree
* on the left and a 'details' panel on the right. As tree nodes are clicked, the right
* pane is updated with the role's detailed info.
* <p>
* The tree components are instances of SailPoint.RoleHierarchyTree, which registers
* some events and wraps an internal child TreePanel. The tree uses a couple of
* ajax query params :
* - roleId : the current node whose children should be returned. (for an exception see ROOT below)
* - rootId : the id of the role at the root of the tree
* - certItemId : in cases where you don't have the role ID you can pass this in to get the role
* - flagMissingRoles : true if roles should be flagged with an X if the user doesn't have them.
*                      this only applies to permitted roles.
* - node : This the param Ext uses to pass the ID of the current item. In our case we are using
*          it to indicate what type of query we're performing. There are 4 types.

*          1. ROOT -          when we first load the root node we pass this to the query. This
*                             tells the backing bean to load the role given by the 'roleId' param, rather than
*                             loading it's children.
*          2. PERMITS -       return the permitted roles for the given role. We only return those roles
*                             the identity actually has.
*          3. REQUIREMENTS -  return the requirements for the given role. Roles which the identity
*                             does not have will be flagged with a special icon. In the case the
*                             param flagMissingRoles == true
*          4. HIERARCHY -     std role hierarchy. This is the default so we don't pass it in the query.
* </p>
*
*/

Ext.define('RoleNode', {
	extend: 'Ext.data.Model',
	
	statics: {
		ROOT: 'ROOT',
		PERMITS: 'PERMITS',
		REQUIREMENTS: 'REQUIREMENTS',
		INVALID_ROLE_IDS: ['', 'PERMITS', 'REQUIREMENTS', 'ROOT']
	},
	
	fields: [
	    { name: 'id', type: 'string' },
	    { name: 'roleId', type: 'string' },
	    { name: 'text', type: 'string' }
	],
	
	isRoleNode: function() {
		return this.getId() && RoleNode.INVALID_ROLE_IDS.indexOf(this.getId()) === -1;
	},
	
	getRoleId: function() {
		return this.raw.roleId;
	}
});

/**
 * The user should pass in the following fields in the config upon creation of
 * the store:
 *  - identityId
 *  - roleId
 *  - flagMissingRoles
 *  - certItemId
 */
Ext.define('SailPoint.data.RoleHierarchyTreeStore', {
	extend: 'Ext.data.TreeStore',
	
	constructor: function(config) {
		Ext.applyIf(config, {
			rootVisible: false
		});
		
		Ext.apply(config, {
			model: 'RoleNode',
			proxy: {
                type: 'ajax',
                url: SailPoint.getRelativeUrl('/identity/roleDetails.json'),
                extraParams: {
                    identityId: config.identityId,
                    assignmentId: config.assignmentId,
                    roleId: config.roleId,
                    rootId: config.roleId,
                    windowType : config.windowType,
                    requestId: config.requestId,
                    id2: config.id2,
                    flagMissingRoles: config.flagMissingRoles,
                    certItemId: config.certItemId
                }
            },
			listeners: {
                beforeload: {
                    fn: function(store, operation, options) {
                        if (operation.node.isRoleNode()) {
                            operation.params.roleId = operation.node.getRoleId();
                        }
                    }
                }
            }
		});
		
		this.callParent(arguments);
	}
});

Ext.define('SailPoint.role.HierarchyTreePanel', {
    extend: 'Ext.tree.Panel',
	
    constructor: function(config) {
        this.addEvents('roleclicked');

        Ext.apply(config, {
            rootVisible: config.rootVisible,
            region: 'west',
            width: 300,
            minWidth: 200,
            displayField: 'text',
            autoScroll: true,
            split: true,
            listeners: {
                itemclick: {
                    fn: function(view, record, item, index, e, options) {
                        if (record.isRoleNode()) {
                            this.fireEvent('roleclicked', record);
                        }
                    }
                }
            },
            viewConfig: {
                toggleOnDblClick: false
            }
        });

        this.callParent(arguments);
    }
});

Ext.define('SailPoint.role.DetailPanel', {
	extend: 'Ext.panel.Panel',
	
	constructor: function(config) {
        var me = this;

		Ext.apply(config, {
			title: '#{msgs.role_detail_description_panel_title}',
			autoScroll: true,
			region: 'center',
            loader: {
                ajaxOptions: {
                    method: 'GET'
                },
                url: SailPoint.getRelativeUrl('/identity/businessRoleDetailsTabPanel.jsf'),
                loadMask: true,
                autoLoad: true,
                params: {
                    certItemId: config.certItemId,
                    identityId: config.identityId,
                    rootId: config.roleId,
                    requestId: config.requestId,
                    id2: config.id2,
                    windowType : config.windowType,
                    assignmentId: config.assignmentId,
                    roleId: config.roleId
                },
                listeners: {
                	beforeload: {
                		fn: function(loader, options, eOpts) {
                			var showEntitlementDescs = '';
                            if (Page.showEntitlementDescriptions != undefined && Page.showEntitlementDescriptions != null){
                                showEntitlementDescs = Page.showEntitlementDescriptions ? 'true' : 'false';
                            }
                            
                            options.params.displayEntitlementDescription = showEntitlementDescs;
                		}
                	},
                	load: {
                		fn: function(loader, response, options, eOpts) {
                			Ext.Ajax.request({
                                url: SailPoint.getRelativeUrl('/identity/roleJson.json'),
                                success: function(response){
                                    addDescriptionTooltips();
                                		
                                    var results = Ext.decode(response.responseText);
                                    var hasSimpleEntitlements = results.hasSimpleEntitlementsIgnoreCase;
                                    var i18nWrapper = SailPoint.modeler.I18nEntitlementsWrapper;
                                    var roleEntitlementsTemplate;
                                    
                                    if (hasSimpleEntitlements) {
                                        roleEntitlementsTemplate = SailPoint.modeler.RoleSimpleEntitlementsTemplate;
                                        var simpleEntitlementJson = Ext.decode(results.simpleEntitlementsIgnoreCase);
                                        i18nWrapper.entitlements = simpleEntitlementJson.entitlements;
                                    } else {
                                        roleEntitlementsTemplate = SailPoint.modeler.RoleEntitlementsTemplate;
                                        i18nWrapper.entitlements = results.roleDirectEntitlements;
                                    }

                                    function updateEntitlements() {
                                        var elToUpdate = me.getEl().down('.role-rule-desc');
                                        if (elToUpdate) {
                                            roleEntitlementsTemplate.overwrite(elToUpdate, i18nWrapper);
                                        }
                                    }

                                    if (me.getEl()) {
                                        updateEntitlements();
                                    } else {
                                        me.on({
                                            afterrender: {
                                                fn: updateEntitlements,
                                                single: true
                                            }
                                        });
                                    }
                                },
                                failure: function(){
                                    alert('Loading role details failed.');
                                },
                                params: { roleNodeId: ':' + options.params.roleId }
                            });
                		}
                	}
                }
            }
		});
		
		this.callParent(arguments);
	}
});

Ext.define('SailPoint.role.AccountDetailPanel', {
    extend: 'Ext.panel.Panel',
  
    constructor: function(config) {
        var me = this;
        
        Ext.apply(config, {
            autoScroll: true,
            region: 'center',
            loader: {
                ajaxOptions: {
                    method: 'GET'
                },
                url: SailPoint.getRelativeUrl('/identity/businessRoleAccountDetailsTabPanel.jsf'),
                loadMask: true,
                autoLoad: true,
                params: {
                    identityId: config.identityId,
                    assignmentId: config.assignmentId,
                    rootId: config.roleId,
                    windowType : config.windowType,
                    requestId: config.requestId,
                    id2: config.id2,
                    roleType: config.roleType,
                    roleId: config.roleId
                }
            }
        });
        
        this.callParent(arguments);
    }
});

Ext.define('SailPoint.role.DetailsPanelTab', {
	extend: 'Ext.panel.Panel',
	
	constructor: function(config) {
		var detailPanel = Ext.create('SailPoint.role.DetailPanel', {
			id: config.detailPanelId,
			identityId: config.identityId,
            certItemId : config.certItemId,
			assignmentId : config.assignmentId,
            requestId: config.requestId,
            id2: config.id2,
            windowType : config.windowType,
			roleId: config.roleId
		});
		
		var treeStore = Ext.create('SailPoint.data.RoleHierarchyTreeStore', {
			storeId: config.storeId,
			identityId: config.identityId,
			assignmentId: config.assignmentId,
			roleId: config.roleId,
      requestId: config.requestId,
      id2: config.id2,
      windowType : config.windowType,
			flagMissingRoles: config.flagMissingRoles,
			certItemId: config.certItemId,
			root: config.storeRoot
		});
		
		var treePanel = Ext.create('SailPoint.role.HierarchyTreePanel', {
			id: config.treePanelId,
			title: '#{msgs.role_detail_tree_panel_title}',
			store: treeStore,
			rootVisible: config.rootVisible
		});
		
		treePanel.on('roleclicked', function(record, options) {
			detailPanel.getLoader().load({
				params: {
					roleId: record.getRoleId()
				}
			});
		});
		
		Ext.apply(config, {
			layout: 'border',
			items: [
			    treePanel,
			    detailPanel
			]
		});
		
		this.callParent(arguments);
	}
});

Ext.define('SailPoint.role.AccountDetailsPanelTab', {
    extend: 'Ext.panel.Panel',
      
    constructor: function(config) {
        var detailPanel = Ext.create('SailPoint.role.AccountDetailPanel', {
            id: config.detailPanelId,
            identityId: config.identityId,
            windowType : config.windowType,
            requestId: config.requestId,
            id2: config.id2,
            assignmentId: config.assignmentId,
            roleType: config.roleType,
            roleId: config.roleId
        });
        
        
        Ext.apply(config, {
            layout: 'border',
            items: [
                detailPanel
            ]
        });
        
        this.callParent(arguments);
    }
});





Ext.define('SailPoint.role.DetailsPanel', {
	extend: 'Ext.tab.Panel',
	
	constructor: function(config) {
		// if no root is passed in then add a default
		Ext.applyIf(config, {
			rootVisible: false,
			roleHierarchyRoot: {
				id: RoleNode.ROOT,
				roleId: RoleNode.ROOT,
				expanded: true
			},
			allowedRolesRoot: {
				id: RoleNode.ROOT,
				roleId: RoleNode.ROOT,
				expanded: true,
				children: [
                    { id: RoleNode.REQUIREMENTS, roleId: RoleNode.REQUIREMENTS, text: '#{msgs.role_detail_section_requirements}', expanded: true },
                    { id: RoleNode.PERMITS, roleId: RoleNode.PERMITS, text: '#{msgs.role_detail_section_permits}', expanded: true }
				]
			}
		});
		
		config.items = [];
		if (config.isAssignedRole) {
			var allowedRolesPanel = Ext.create('SailPoint.role.DetailsPanelTab', {
				id: config.id + '-allowedRolesPanel',
				title: '#{msgs.role_detail_tab_permits_reqs}',
				storeId: 'allowedRolesTreeStore',
				storeRoot: config.allowedRolesRoot,
				detailPanelId: config.id + '-allowedRolesDetailPanel',
				treePanelId: config.id + '-allowedRolesTreePanel',
				identityId: config.identityId,
				assignmentId: config.assignmentId,
				roleId: config.roleId,
        requestId: config.requestId,
        id2: config.id2,
        windowType : config.windowType,
				flagMissingRoles: true,
				certItemId: config.certItemId
			});
			
			config.items.push(allowedRolesPanel);
		}
		
		var roleHierarchyPanel = Ext.create('SailPoint.role.DetailsPanelTab', {
			id: config.id + '-roleHierarchyPanel',
			title: '#{msgs.role_detail_tab_hierarchy}',
			storeId: 'roleHierarchyTreeStore',
			storeRoot: config.roleHierarchyRoot,
			rootVisible: config.rootVisible,
			detailPanelId: config.id + '-roleHierarchyDetailPanel',
			treePanelId: config.id + '-roleHierarchyTreePanel',
			identityId: config.identityId,
			assignmentId: config.assignmentId,
      requestId: config.requestId,
      id2: config.id2,
      windowType : config.windowType,
			roleId: config.roleId,
			flagMissingRoles: false,
			certItemId: config.certItemId
		});
		
		config.items.push(roleHierarchyPanel);
		
        if (config.windowType === "accessRequestItem" || config.windowType === "approvalItem") {
            if ("assignedRoles" === config.roleType) {
                
                //alert("requestId =" + config.requestId + ", reuestItemId =" + config.requestItemId);
                var accountDetailsPanel = Ext.create('SailPoint.role.AccountDetailsPanelTab', {
                    id: config.id + '-accountPanel',
                    title: '#{msgs.role_detail_tab_account_details}',
                    detailPanelId: config.id + '-accountDetailsPanel',
                    identityId: config.identityId,
                    windowType : config.windowType,
                    requestId: config.requestId,
                    id2: config.id2,
                    assignmentId: config.assignmentId,
                    roleId: config.roleId,
                    flagMissingRoles: true,
                    certItemId: config.certItemId
                });
                  
                config.items.push(accountDetailsPanel);
            }
        }
        else if (!Ext.isEmpty(config.identityId)) {
            var accountDetailsPanel = Ext.create('SailPoint.role.AccountDetailsPanelTab', {
                id: config.id + '-accountPanel',
                title: '#{msgs.role_detail_tab_account_details}',
                detailPanelId: config.id + '-accountDetailsPanel',
                assignmentId: config.assignmentId,
                identityId: config.identityId,
                roleId: config.roleId,
                flagMissingRoles: true,
                roleType: config.roleType,
                certItemId: config.certItemId
            });
              
            config.items.push(accountDetailsPanel);
        }
        
		this.callParent(arguments);
	}
});

Ext.ns('SailPoint.RoleDetailPanel');

SailPoint.RoleDetailPanel.window = function(assignmentId, selectedRoleId, selectedIdentityId, isAssignedRole, windowType, roleType, requestId, id2) {
    var windowId = selectedIdentityId + '-' + selectedRoleId;
    
    var window = Ext.getCmp(windowId);
    if (window && window.isVisible()) {
        return;
    }
  
    if (!window) {
        var panel = Ext.create('SailPoint.role.DetailsPanel', {
            id: 'panel_' + windowId,
            assignmentId : assignmentId,
            roleId: selectedRoleId,
            identityId: selectedIdentityId,
            isAssignedRole: isAssignedRole,
            windowType : windowType,
            roleType : roleType,
            requestId : requestId,
            id2 : id2,
            hideCloseButton: true
        });
    
        window = Ext.create('Ext.window.Window', {
            width: 768,
            id: windowId,
            height: 330,
            layout: 'fit',
            plain: true,
            title: '#{msgs.title_role_info_dialog}',
            items: [panel],
            buttons:[{
                text: '#{msgs.button_close}',
                cls : 'secondaryBtn',
                handler: function() {
                    Ext.getCmp(windowId).destroy();
                }
            }]
        });
    }
    
    window.show();
}

/**
 * Creates a SailPoint.RoleDetailPanel component for the given role in the
 * target element.
 * 
 * @param {String}
 *            selectedRoleId Role ID
 * @param {String}
 *            selectedIdentityId Id of the identity being examined. May be null
 *            if identity entitlement info not needed
 * @param {boolean}
 *            isAssignedRole If this is an assigned role, the Permitted and
 *            Required Roles tab is displayed
 * @param {Element
 *            ID or Dom Element} targetElement - Element or element ID the
 *            component should be rendered to.
 * @param {String}
 *            (optional) certificationItemId - ID of the current certification
 *            item.[Optional]
 */
SailPoint.RoleDetailPanel.toggle = function(selectedRoleId, selectedIdentityId, isAssignedRole, targetElement, certificationItemId, link, assignmentId, roleType) {

    // this will get the target dom element regardless of whether
    // targetElement is a dom element or id.
    var extElement = Ext.get(targetElement);
    var panelId = 'role-expando-' + selectedIdentityId + '-' + selectedRoleId + '-' + assignmentId;
    var panel = Ext.getCmp(panelId);

    // if the panel is visible and the user has toggled the expando link, close it.
    if (panel && panel.isVisible()) {
        extElement.hide();
        panel.hide();
        if(link) {
            SailPoint.Utils.toggleDisclosureLink(link, false);
        }
        return;
    }

    // If we haven't found the panel by ID, create it. Otherwise show the hidden
	// panel
    if (!panel) {
        panel = Ext.create('SailPoint.role.DetailsPanel', {
            id: panelId,
            renderTo: targetElement,
            roleId: selectedRoleId,
            identityId: selectedIdentityId,
            isAssignedRole: isAssignedRole,
            certItemId: certificationItemId,
            height: 260,
            roleType: roleType,
            assignmentId: assignmentId
        });

        Page.on('cleanupRoleDetailPanels', function(){
            if (panel){
                panel.destroy();
                panel=null;
            }
        }, this);

    } else {
        extElement.show();
        panel.show();
    }

    if(link) {
        SailPoint.Utils.toggleDisclosureLink(link, true);
    }

    // we need to destroy the panel when the tab changes since the page is
    // being updated by a4j.
    Page.on('tabChange', function(){
        // TODO: it would be much better to remove the handler after it's fired since the
        // panel has been destroyed. Otherwise we keep hanging new event
		// handlers onto the Page obj. Shouldn't be a problem unless they open lots of panels though.
        if (panel){
            panel.destroy();
            panel = null;
        }
    }, this);
    
    return panel;
}
