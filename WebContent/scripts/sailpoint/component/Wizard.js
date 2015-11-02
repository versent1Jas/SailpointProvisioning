/**
 * A Wizard gives a wizard interface with a summary panel on the left and the
 * wizard content on the right.  Navigation using previous/next buttons and
 * by clicking on the summary items is taken care of automatically.
 * 
 * @class   SailPoint.Wizard
 * @extends Ext.Panel
 * @author  Kelly Grizzle
 */
Ext.define('SailPoint.Wizard', {
    extend : 'Ext.panel.Panel',
    alias : 'widget.sailpoint-wizard',

    /**
     * @cfg {Array} panels  An array of objects that have information object the
     *   panels of the wizard.  Each object should have a title, contentEl, and
     *   description (optional).  The title is used as the panel title and in
     *   the summary list.  The contentEl is an element that holds the content
     *   to include in the panel.  The description is (if specified) displayed
     *   in the summary panel when the step is selected.
     */

    /**
     * @cfg {Array} btns  An optional array of button objects or buttons configs
     *   to add to the wizard in addition to the previous and next buttons.
     */

    /**
     * @cfg {Function} navHandler  An optional function that will be called with
     *   a scope of this when a navigation event occurs (ie - when previous/next
     *   are clicked or a step is selected from the summary section).  The index
     *   of the panel to which we are navigating is passed in as an argument.
     *   This can optionally return the index of a panel to navigate to if the
     *   navigation logic allows skipping pages or forking.
     */

    /**
     * @cfg {Number} summaryPanelWidth  An optional width for the summary panel.
     *   Defaults to 200.
     */

    config : {
        wizardPanel : {}
    },

    /**
     * Initialize this component.
     */
    initComponent: function() {

        this.summaryPanel = this.initSummaryPanel();
        this.wizardPanel = this.initWizardPanel();

        Ext.apply(this, {
            layout: 'border',
            defaults: {
                bodyStyle: 'padding: 5px'
            },
            items: [ this.summaryPanel, this.wizardPanel ]
        });

        this.callParent(arguments);
    },

    /**
     * Initialize the summary panel and return it.  This also initializes the
     * summaryTemplate.
     */
    initSummaryPanel: function() {

        // See getSummaryTemplateData() for the arguments to the template.
        this.summaryTemplate = new Ext.XTemplate(
            '<div>',
              '<div class="wizardSummarySteps">#{msgs.wizard_summary_steps}</div>',
              '<ol class="wizardStepList">',
                '<tpl for="panels">',
                  '<li onclick="Ext.getCmp(\'{parent.wizardId}\').activateItem({[xindex-1]});"',
                      'class="wizardStep{[xindex-1 === parent.selectedIndex ? " wizardStepSelected" : ""]}">{title}</li>',
                '</tpl>',
              '</ol>',
            '</div>',
            '<div style="margin-top: 15px">',
              '{selectedDescription}',
            '</div>'
        );

        // Create a component with the summaryWizardTemplate div.  The
        // xtemplate will get rendered into this div.
        var box = new Ext.Component({
            autoEl: {
                tag: 'div',
                html: this.summaryTemplate.apply(this.getSummaryTemplateData(0))
            },
            id: 'summaryWizardTemplate'
        });

        var summaryPanel = new Ext.Panel({
            // Panel config
            id: this.id + '-summaryPanel',
            title: '#{msgs.wizard_summary_title}',
            width: this.summaryPanelWidth || 200,
            items: [ box ],
            // BorderLayout config
            region: 'west',
            margins: '0',
            split: true,
            minWidth: 100,
            maxWidth: 250
        });

        return summaryPanel;
    },

    /**
     * Initialize the wizard panel and return it.
     */
    initWizardPanel: function() {

        // Create a panel for each panel config that is specified.
        var items = [];
        for (var i=0; i<this.panels.length; i++) {
            items.push({
                id: this.id + '-card-' + i,
                contentEl: this.panels[i].contentEl,
                border: false,
                autoScroll: true
            });
        }
        
        // Create the previous/next buttons by default.
        this.prevBtn = new Ext.Button({
            id: this.id + '-card-prev',
            handler: Ext.bind(this.internalNavHandler, this, [-1]),
            text: '&laquo; #{msgs.wizard_prev_btn}',
            disabled: true
        });
        this.nextBtn = new Ext.Button({
            id: this.id + '-card-next',
            handler: Ext.bind(this.internalNavHandler, this, [1]),
            text: '#{msgs.wizard_next_btn} &raquo;'
        });
        var allBtns = [ '->', this.prevBtn, this.nextBtn ];

        // Add any additional buttons to the button bar.
        if (this.btns) {
            Ext.each(this.btns, function(button){
                allBtns.push(button);
            });
        }

        var wizardPanel = new Ext.panel.Panel({
            // Panel config
            id: this.id + '-wizard-panel',
            title: this.panels[0].title,
            layout: 'card',
            collapsible: false,
            activeItem: 0, 
            bbar: allBtns,
            items: items,
            // BorderLayout config
            region: 'center',
            margins: '0'
        });

        return wizardPanel;
    },

    /**
     * @private Return an object with the data used to render the summaryTemplate.
     */
    getSummaryTemplateData: function(selectedPanelIdx) {
        return {
            wizardId: this.id,
            selectedIndex: selectedPanelIdx,
            selectedDescription: this.panels[selectedPanelIdx].description || '',
            panels: this.panels
        };
    },

    /**
     * @private Refresh the summary template to reflect the given panel being
     * selected.
     */
    refreshSummaryTemplate: function(selectedPanelIdx) {
        var data = this.getSummaryTemplateData(selectedPanelIdx);
        this.summaryTemplate.overwrite('summaryWizardTemplate', data, true);
    },

    /**
     * @private Navigation handler called when the previous/next buttons are
     * clicked.
     */
    internalNavHandler: function(incr) {
        var layout = this.wizardPanel.getLayout();
        var i = layout.activeItem.id.split(this.id + '-card-')[1];
        var next = parseInt(i) + incr;

        this.activateItem(next);
    },
    
    /**
     * Active the panel with the given index.  This will first call to the
     * configured navHandler (if specified) to allow custom navigation handling.
     * The custom navHandler can return an index of a panel that should be
     * navigated to rather than the requested panel.  This allows branching
     * logic in the wizard.  By default, this method will activate the selected
     * panel, toggle enablement of the previous/next buttons, refresh the
     * summary content, and change the wizard panel title.
     */
    activateItem: function(selectedItemIdx) {

        if (this.navHandler) {
            var newIdx = this.navHandler.apply(this, [selectedItemIdx]);
            if (newIdx != undefined) {
                selectedItemIdx = newIdx;
            }
        }

        var layout = this.wizardPanel.getLayout();
        layout.setActiveItem(selectedItemIdx);

        // Disable the next/prev depending on the index.
        this.prevBtn.setDisabled(selectedItemIdx==0);
        this.nextBtn.setDisabled(selectedItemIdx==this.panels.length-1);

        this.refreshSummaryTemplate(selectedItemIdx);
        this.wizardPanel.setTitle(this.panels[selectedItemIdx].title);

        this.firePanelSelected(selectedItemIdx);
    },
    
    /**
     * Disable all of the buttons in the footer of the wizard.  This remembers
     * the previous states of the buttons so that they can be restored later
     * with reEnableButtons().
     */
    disableButtons: function() {
        this.previousButtonState = {};

        this.wizardPanel.getBottomToolbar().items.each(
            function(item) {
                if (item.setDisabled) {
                    this.previousButtonState[item.id] = item.disabled;
                    item.setDisabled(true);
                }
            }, this);
    },
    
    /**
     * Re-enable all of the buttons in the footer of the wizard that were
     * disabled by calling disableButtons().  If disableButtons() has not been
     * called, this does nothing.
     */
    reEnableButtons: function() {
        if (this.previousButtonState) {
            this.wizardPanel.getBottomToolbar().items.each(
                function(item) {
                    if (item.setDisabled) {
                        var disabled = this.previousButtonState[item.id];
                        if (typeof disabled !== 'undefined') {
                            item.setDisabled(disabled);
                        }
                    }
                }, this);

            // Get rid of the previous state now that we have re-enabled.
            delete this.previousButtonState;
        }
    },
    
    /**
     * Following are used for letting the panels know that
     * a tab has been selected.
     */
    panelSelectedHandlers : [],
    
    addPanelSelectedHandler : function(val) {
      this.panelSelectedHandlers.push(val);
    },
    
    removePanelSelectedHandler : function(val) {
      Ext.Array.remove(this.panelSelectedHandlers, val);
    },
    
    firePanelSelected : function(selectedIndex) {
      for (var i=0; i<this.panelSelectedHandlers.length; ++i) {
        this.panelSelectedHandlers[i].onPanelSelected(selectedIndex);
      }
    }
    
});