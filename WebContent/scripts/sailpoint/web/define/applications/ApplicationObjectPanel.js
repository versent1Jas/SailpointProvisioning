/**
 * @class
 * @extends Ext.panel.Panel
 *
 * This is a common component that adds panels for each div section in a few of the
 * connector types like JDBC and Delimited File.
 */
Ext.define('SailPoint.define.applications.ApplicationObjectPanel', {
    extend: 'Ext.tab.Panel',
    alias : 'widget.applicationObjectPanel',
    mixins: ['SailPoint.define.applications.FieldQuerier'],
    deferredRender: false,
    spNamespace: undefined,
    collapsible: true,
    collapseMode: 'header',
    titleCollapse: true,
    activeTab: 0,
    defaults: {
        xtype: 'panel',
        autoScroll: true
    },
    constructor: function(config) {
        Ext.applyIf(config, {
            id: SailPoint.define.applications.ApplicationObjectPanel.createId(config.spNamespace)
        });

        this.callParent(arguments);
        //Update the layout for after the panel is laid out and there is a missing bottom section
        this.updateAttributePanelLayout();
    },

    initComponent: function() {
        this.callParent(arguments);
        //Attach a listener to the event 'tabchange' that will call a hook to help update the layout
        this.on('tabchange', this.onTabChange);
    },
    
    statics: {
        createId: function(prefix) {
            return prefix + 'Tab';
        }
    },

    afterCollapse: function() { this.callParent(arguments); this.updateAttributePanelLayout(); },
    afterExpand: function() { this.callParent(arguments); this.updateAttributePanelLayout(); },

    /**
     * List of functions to run after a 'tabchange' event for Application Object Panel
     * At the moment, it will update the object Tab layout and the attributes panel layout
     */
    onTabChange: function() {
        this.updateTabPanelLayout();
        this.updateAttributePanelLayout();
    },

    /**
     * Updating the appTab's attributesContent child tab will remove whitespace underneath this component
     * when it is collapsed or expanded.
     */
    updateAttributePanelLayout: function() {
        Ext.getCmp('appTab').down('#attributesContent').updateLayout();
    },
    /**
     * Update the current object's layout to resize the component so that the contents can appear without needing scroll bars.
     * Currently used in panels where toggling will require the panel to need more/less space such as when showing/hiding
     * FacesMultiSuggest objects
     * This was chosen vs updating the mainPanel which would update many other layouts that were not needed
     */
    updateTabPanelLayout: function() {
        Ext.getCmp(this.spNamespace + 'Tab').updateLayout();
    },

    /**
     * Common function used to show/hide an html element based on if a checkbox is selected.  There
     * seem to be at least 30 different functions each connector uses to perform the same thing. Ext
     * classes can extend from this and wrap their own toggles with this method. Example invocation :
     * this.toggleFactory('#parentElementOfCheckbox', '#elementToShowHide', 'checkboxThatTogglesSomething');
     * @see JDBCPanel.js
     */
    toggleFactory: function(sectionDiv, showHideDiv, checkboxSuffix) {
        var checkboxEnabled = this.getField(checkboxSuffix, sectionDiv + this.spNamespace, 'input[type="checkbox"]'),
            listPdiv = Ext.query(showHideDiv + this.spNamespace), pdiv;

        if (! Ext.isEmpty(listPdiv)) {
            pdiv = listPdiv[0];

            if ( pdiv ) {

                if ( checkboxEnabled && checkboxEnabled.checked == true) {
                    pdiv.style.display = "";
                } else {
                    pdiv.style.display = "none";
                }
                // hey why the heck not do this? everyone else is doing it. In all seriousness, it fixes elements
                // getting cut off when hidden elements are shown after clicking the checkbox.
                this.updateTabPanelLayout();
                this.updateAttributePanelLayout();
            }
        }

    },

    /**
     * Sigh, radio buttons. Similar to toggleFactory this is a common function to show/hide a series of
     * html elements based on selection of a radio button. Radio's can have more than 2 options, hence
     * we needed to do something a little trickier than what we did with toggleFactory. GOTCHA: We are
     * relying on the selector returning the radio elements to be in the same order as the parameter
     * showHideDivArray.
     * @param sectionDiv the parent element of the radios controlled
     * @param showHideDivArray array of objects in the format:
     * [{
     *   show: []
     *   hide: []
     * }, ...]
     * @param radioSuffix the suffix of the id attribute of the radio button
     */
    toggleRadio: function(sectionDiv, showHideDivArray, radioSuffix) {
        var radioArray = this.getFields(radioSuffix, sectionDiv, 'input[type="radio"]'),
            listPdiv, pdiv, tmpList, i;

        Ext.each(radioArray, function(item, index, allItems) {

            if ( item && item.checked == true) {
                if (showHideDivArray[index]) {

                    this.toggleStyle(showHideDivArray[index]['show'], '');
                    this.toggleStyle(showHideDivArray[index]['hide'], 'none');
                }
            }
        }, this);
        // hey why the heck not do this? everyone else is doing it. In all seriousness, it fixes elements
        // getting cut off when hidden elements are shown after clicking the checkbox.
        this.updateLayout();
    },

    /*
     * PRIVATE: sets the display css attribute for a given list of css selectors
     */
    toggleStyle: function(tmpList, displayValue) {
        var listPdiv, pdiv;

        for (i = 0; i < tmpList.length; i++) {
            listPdiv = Ext.query(tmpList[i] + this.spNamespace);
            if (! Ext.isEmpty(listPdiv)) {
                pdiv = listPdiv[0];

                pdiv.style.display = displayValue;
            }
        }
    }
});