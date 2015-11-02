////////////////////////////////////////////////////////////////////////////////
//
// A menu for a certification identity.
//
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
//
// BaseMenu is a base class for any menus.  To subclass, implement
// createMenu(menu) and make sure to call baseMenuInitialize in initialize.
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.BaseMenu = Class.create();
SailPoint.BaseMenu.prototype = {

    // Instance variables.
    menu: null,
    element: null,
    menuCreated: false,
    disabledSrc: null,
    enabledSrc: null,
    boundMouseOverEvent: null,
    boundMouseOutEvent: null,
    boundContextMenuEvent: null,
    boundClickEvent: null,

    // Base class pseudo-constructor.
    //
    // buttonId: The ID of the button to click when enter is pressed in any of
    //           the registered text fields.
    // disabledSrc: The img to show for a disabled menu.
    baseMenuInitialize: function(element, enabledSrc, disabledSrc) {
        this.element = element;
        this.enabledSrc = enabledSrc;
        this.disabledSrc = disabledSrc;

        // create the base menu and register it - things will be fleshed out by the subclass
        this.menu = new Ext.menu.Menu({
            minWidth: 200
        });

        // set the listeners on the image
        var el = Ext.get(this.element);
        if (el) {

            // jfb - note that this will not work if different instances of the
            // same menu is reapplied to the same dom element multiple times.
            // You would need to remove all listeners in that case

            el.on('mouseover', function() {
               element.src = disabledSrc;
            });
            el.on('mouseout', function() {
               element.src = enabledSrc;
            });

            // show the menu on either left or right mouse click
            el.on('click', this.show, this);

            // Use preventDefault to cause the browser's context menu to not popup.
            el.on('contextmenu', this.show, this, { preventDefault: true });
        }
    },

    show: function(e, el, pos, parentMenu) {
        this.menu.showBy(el);
    },

    // Hide the menu.
    hide: function() {
    	this.callParent(arguments);

        if (null != this.enabledSrc)
           this.element.src = this.enabledSrc;
    }
};

SailPoint.CertificationIdentityMenu = Class.create();
Object.extend(Object.extend(SailPoint.CertificationIdentityMenu.prototype, SailPoint.BaseMenu.prototype), {

    // Constructor.
    initialize: function(element, config) {

        this.entityId = config.entityId;
        this.workItemId = config.workItemId;
        this.delegationId = config.delegationId;
        this.isDelegated = config.isDelegated;
        this.hasComments = config.hasComments;
        this.delegateName = config.delegateName;

        // If the menu has been applied to the element more than once
        // we need to remove the listeners before adding it
        var el = Ext.get(element);
        if (el)
            el.removeAllListeners();

        this.baseMenuInitialize(element,
            SailPoint.CONTEXT_PATH+ '/images/icons/certif_openmenu_enabled_16.png', 
            SailPoint.CONTEXT_PATH+'/images/icons/certif_openmenu_disabled_16.png');
        
        this.createMenu(this.menu);
    },

    // Fill in the details of the menu.  Called from the super-class.
    createMenu: function(menu) {

        if (this.isDelegated) {
            menu.add(new Ext.menu.Item({ 
                text: '#{msgs.menu_undo_delegation}',
                handler: this.revokeIdentityDelegation,
                scope: this,
                iconCls: 'undoBtn'
            }));
            
            if (null != this.workItemId) {
                menu.add(new Ext.menu.Item({ 
                    text: '#{msgs.menu_view_work_item}', 
                    handler: this.viewIdentityWorkItem,
                    scope: this,
                    iconCls: 'viewDetailsBtn'
                }));                
            }
        }

        if (this.hasComments) {
            var commentsPanelId = "delegationComments_" + this.delegationId;
            var commentsPanel = $(commentsPanelId);
            var action = (commentsPanel && commentsPanel.visible()) ? "Hide" : "View";
            var titleTpl = new Ext.Template("#{msgs.dialog_title_action_comments}");
            var title = titleTpl.apply([action]);
            if (null != this.delegateName){
                var idTitleTpl = new Ext.Template("#{msgs.dialog_title_identity_action_comments}");
                title = idTitleTpl.apply([action, this.delegateName]);
            }

            menu.add(new Ext.menu.Item({ 
                text: title,
                handler: this.viewIdentityCompletionComments,
                scope: this,
                iconCls: 'viewCommentBtn'
            }));            
        }
    },

    revokeIdentityDelegation: function() {
      var decider = SailPoint.Decider.getInstance();
      decider.bulkEntityDecide(SailPoint.Decision.STATUS_UNDO_DELEGATION, this.entityId);
    },

    viewIdentityWorkItem: function() {
      $('editForm:selectedWorkItemId').value = this.workItemId;
      try { $('editForm:viewWorkItemButton').click(); } catch(e) {}
    },

    viewIdentityCompletionComments: function() {
        var commentsElt = "delegationComments_" + this.delegationId;
        showHideWithLock($(commentsElt));
    }
});