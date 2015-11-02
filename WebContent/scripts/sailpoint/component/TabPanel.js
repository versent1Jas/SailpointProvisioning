/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * @class SailPoint.TabPanel
 * @extends Ext.TabPanel
 * This class extends the functionality of the ext tabpanel to allow our tab panels
 * to store their active tab on the session.  As a tab is clicked on the panel,
 * an ajax request is fired off to store the current tab on the session using the
 * id of the newly-activated tab.
 * 
 * NOTE: To avoid possible tab state collisions across pages, make sure that the 
 * tab ids are unique across all of identityiq.
 */
Ext.define('SailPoint.TabPanel', {
    extend : 'Ext.tab.Panel',
    alias : 'widget.sptabpanel',

    /**
     * A flag which causes the Component to store the currently active tab
     * so that later visits to the page will show the same tab as when the 
     * page was last visited.  Since this behavior is kinda the whole point of
     * our version of TabPanel, I'm not sure why anyone would want to
     * disable it, but the option is there.   
     */
    tabState: true,
    
    
    constructor: function(config) {
         this.messagePanelId = config.id + 'MessagePanel';
         this.callParent(arguments);
    },
    
    /**
     * When the currently active tab changes, sets  the new active tab on  the 
     * StateBean for later retrieval.
     */
    tabchange : function(tabPanel, tab) {
      new Ajax.Request(CONTEXT_PATH + '/state.json',
      {
        method:'post',
        parameters: {activeTab: tab.id},
        onSuccess: function(transport){ tabPanel.updateMessages(); },
        // TODO - report some kind of message on failure?
        onFailure: function(){}
      });
    },
    
    
    /**
     * Initializes component. Adds the tabchange listener if tabState is true and
     * sets the initial activeTab.
     * @private
     */
    initComponent : function() {
        // the activeTab could be an id of a component on a different page, check 
        // that it is valid for this tab panel, otherwise set to first tab
        if (Ext.isString(this.activeTab) && !this.containsItemWithId(this.activeTab)) {
            this.activeTab = 0;
        }
        
        SailPoint.TabPanel.superclass.initComponent.apply(this, arguments);

        if ((this.tabState) && (!this.hasListener('tabchange'))) {
            this.on('tabchange', this.tabchange, this);
        }
    },
    
    /**
     * Checks to see if there is an item in the tab panel with the specified 
     * string id.
     * @param id The component id
     * @return boolean True if contains item with id, false otherwise.
     */
    containsItemWithId: function(id) {
        if (this.items) {
            for (var i = 0; i < this.items.length; ++i) {
                var itemId = this.items[i].id;
                if (itemId === id) {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    /**
     * Updates the message panel with the active tab's message contents.  In order for 
     * this method to have any effect the tab panel has to have been constructed using the 
     * SailPoint.getMessagedTabPanel factory method.  Also, the panels that need to display 
     * messages need to extend SailPoint.TabContentPanel and populate the 'messages' field with
     * whatever they want displayed.  Otherwise this will method will effectively no-op.
     */
    updateMessages: function() {
        var messagePanel = Ext.getCmp(this.messagePanelId),
            spViewport;
        if (messagePanel) {
            var messageElement = Ext.get(messagePanel.body);
            activeTab = this.getComponent(this.activeTab);
            
            msgs = activeTab.messages;

            if (!msgs) {
                // Hack alert:
                // For some weird reason the height goes wacky on IE if the contents are completely blank.
                // Adding a blank list generates a predictable height that we can properly handle.
                // --Bernie
                msgs = '<ul></ul>';
            }

            // pjeong: for some reason we get new lines in the message, filter this out so that the element doesnt show
            msgs = msgs.replace(/\r\n|\n/g,"");
            
            messageElement.update(msgs);
            // One would expect the layout manager to take care of that when 
            // doLayout is called but, alas, that is not the case
            messagePanel.getEl().setVisibilityMode(Ext.Element.DISPLAY);
            if(msgs && msgs !== '<ul></ul>') {
                messagePanel.setVisible(true);
            }
            else {
                messagePanel.setVisible(false);
            }
            
            // Lay out the message panel and all its parents to accomodate the new messages
            messagePanel.doLayout();
            this.doLayout();
            spViewport = Ext.getCmp('spViewport');
            if (spViewport) {
                spViewport.doLayout();
            }
        }
    },
    
    statics: {
        /**
         * This method is a handles an Ext.tab.Panel's afterlayout event.
         * It resizes the panel contents to match the tab panel's current height.
         * If the tab panel's current height is less than the contents' original height the
         * height is set to the contents' original height.  To handle this, the panel should
         * apply a scrollbar by including this in their config:
         * <pre>  
         *     bodyStyle: 'overflow:auto'
         * </pre>
         * This is useful when applying a spBackground to the panel body.  See the
         * afterlayout event on the Ext.tab.Panel class for details on when this is called.
         * @param tabPanel The panel that's being laid out.
         * @param layout The panel's layout
         * @param options The options object passed to Ext.util.Observable.addListener
         */
        sizeContentsToPanel: function(tabPanel, layout, options) {
            var panelContents = tabPanel.getEl().down('div[class*=spContent]');
            var tabHeight = tabPanel.getHeight();
            var newHeight = tabHeight - 35;
            if (!panelContents.initialHeight) {
                panelContents.initialHeight = panelContents.getHeight();
            }
            
            if (newHeight < panelContents.initialHeight) {
                newHeight = panelContents.initialHeight;
            }
            
            panelContents.setHeight(newHeight);
        },
        
        /**
         * This method applies attaches the currently display message to the specified tab so
         * that it's only displayed when the user is on that tab.
         * @param tab The tab to which you want to attach the specified message
         * @param messageSource DOM element containing the messages
         */
        applyMessage: function(tab, messageSource) {
            var tabPanel = tab.findParentByType('tabpanel');
            tab.messages = messageSource.innerHTML;
            // We are effectively moving the message source.  If we don't clear the original
            // it may display overlaid on top of the other message.  That's not pretty 
            messageSource.innerHTML = '';
            tabPanel.updateMessages();
        }
    }
});


/**
 * Returns an Ext.Panel containing a SailPoint.Tab panel and an error panel.
 * Note that if you want to attach events to the tab panel you will have to 
 * either look up the tab panel yourself after the fact or get it from the returned
 * Ext.Panel like this:  var tabPanel = messagedTabPanel.items.get(1);
 * @param config The config should have whatever parameters are available for a 
 * SailPoint.TabPanel as well as a 'messages' property that contains any messages
 * that are initially displayed.  This property can be left out or just set to 
 * '' if there are no messages to display.
 */
SailPoint.getMessagedTabPanel = function(config) {
    return Ext.create('Ext.panel.Panel', {
        layout: 'border',
        preventHeader: true,
        cls: 'messagePanelContainer',
        items: [
            {
                xtype: 'panel',
                id: config.id + 'MessagePanel',
                region: 'north',
                border: false,
                html: '<div/>',
                cls: 'messagePanel',
                hidden: true
            },
            Ext.apply(config, {xtype: 'sptabpanel', region: 'center'})
        ]
    });
};

/**
 * @class SailPoint.TabContentPanel
 * @extends Ext.Panel
 * This class extends the Ext.Panel to facilitate its participation in message handling
 * for SailPoint.TabPanels that are constructed with the SailPoint.getMessagedTabPanel 
 * factory method.  Any time a message should be displayed the 'messages' property on the
 * SailPoint.TabContentPanel needs to be updated.  If this panel is already the active tab,
 * the parent SailPoint.TabPanel's updateMessages() method should be called.  Otherwise that
 * method will be called when the tab changes.
 * @cfg {String} HTML contents to initially populate the message panel with.  If this is
 * left blank the message panel will effectively be hidden.
 */
Ext.define('SailPoint.TabContentPanel', {
    extend : 'Ext.panel.Panel',
    alias : 'widget.sptabcontentpanel',
    constructor: function(config) {
        this.messages = config.messages;
        this.callParent(arguments);
    }
});

SailPoint.TabErrorMessageTemplate = new Ext.XTemplate(
    '<div class="formError">',
      '<tpl for=".">',
        '<div>{.}</div>',
      '</tpl>',
    '</div>'
);
