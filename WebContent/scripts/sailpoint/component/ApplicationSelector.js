
/**
 * @class
 * @extends Ext.Container
 * 
 * This is a component that allows selecting an application and an instance if
 * the selected application has instances.
 */
Ext.define('SailPoint.component.ApplicationSelector', {
	extend : 'Ext.Container',

    ////////////////////////////////////////////////////////////////////////////
    //
    // CONFIGURATION PROPERTIES
    //
    ////////////////////////////////////////////////////////////////////////////
    
    /**
     * @cfg {Array} An optional array of strings that has additional fields to
     * load into the application store.
     */
    extraApplicationFields: null,
    
    /**
     * @cfg {Object} An optional object with query parameters to pass to the
     * datasource for the application store.
     */
    applicationParams: null,

    /**
     * @cfg {String} An optional message to display when no applications have
     * been selected.
     */
    emptyText: '#{msgs.lcm_request_entitlements_select_application}',
    
    /**
     * @cfg {Boolean} If true, the spinner will continue spinning after the
     * instances are loaded.  This can be useful if the caller is sharing a
     * spinner and has more processing to perform after the instance is
     * selected.  Defaults to false.
     */
    keepSpinning: false,

    /**
     * @cfg {SailPoint.LoadingSpinner} An optional spinner to use while loading.
     * If null, a new spinner is created.
     */
    spinner: null,
    
    /**
     * @cfg {Ext.util.DelayedTask} An optional delayed task to use to show and
     * hide the spinner.  If null, a new task is created.
     */
    spinnerTask: null,


    ////////////////////////////////////////////////////////////////////////////
    //
    // FIELDS
    //
    ////////////////////////////////////////////////////////////////////////////
    
    /**
     * @private {SailPoint.form.ComboBox} The application ComboBox.
     */
    applicationCombo: null,

    /**
     * @private {SailPoint.form.ComboBox} The instance ComboBox (may be null).
     */
    instanceCombo: null,
    
    
    ////////////////////////////////////////////////////////////////////////////
    //
    // COMPONENT INITIALIZATION
    //
    ////////////////////////////////////////////////////////////////////////////

    initComponent: function() {

        this.addEvents(
            /**
             * @event applicationSelected
             * Fires when an application is selected but before the instances
             * are loaded.
             */
            'applicationSelected',
            
            /**
             * @event applicationAndInstanceSelected
             * Fires when both the application and instance (if required) are
             * selected.
             */
            'applicationAndInstanceSelected'
        );
    
        // Not sure why we need the autoEl, but this wasn't rendering without it.
        Ext.applyIf(this, {
            autoEl: 'div',
            layout: 'column'
        });

        // Create the spinner if one wasn't passed in.
        if (!this.spinner) {
            this.spinner = new SailPoint.LoadingSpinner();
        }
        if (!this.spinnerTask) {
            this.spinnerTask = new Ext.util.DelayedTask();
        }
        
        var appParams = (this.applicationParams) ? this.applicationParams : {};
        Ext.applyIf(appParams, {
            suggestType: 'application'
        });
        
        // Setup the application suggest.  Using ComboBox rather than a Suggest
        // since suggest has validation neutered for some reason.
        this.applicationCombo =
            new SailPoint.form.ComboBox({
                suggest: true,
                totalProperty: 'totalCount',
                root: 'objects',
                allowBlank: false,
                valueField: 'id',
                displayField: 'displayName',
                extraFields: this.extraApplicationFields,
                datasourceUrl: '/include/baseSuggest.json',
                httpMethod: 'GET',
                forceSelection: true,
                baseParams: appParams,
                emptyText: this.emptyText
            });
        this.applicationCombo.on('select', this.applicationSelected, this);

        // Create a store for instances.
        this.instanceStore = SailPoint.Store.createRestStore({
            url: SailPoint.getRelativeUrl('/rest/applications/{0}/instances'),
            fields: ['instance'],
            remoteSort: true,
            method: 'GET'
        });

        this.items = [ this.applicationCombo ];
        
        SailPoint.component.ApplicationSelector.superclass.initComponent.apply(this);
    },
    

    ////////////////////////////////////////////////////////////////////////////
    //
    // GETTERS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Return the application ComboBox component.
     */
    getApplicationComponent: function() {
        return this.applicationCombo;
    },

    /**
     * Return the Ext.data.Store used by the application ComboBox.
     */
    getApplicationStore: function() {
        return this.applicationCombo.getStore();
    },
            
    getApplicationId: function() {
        return this.applicationCombo.getValue();
    },
    
    getApplication: function() {
        return this.applicationCombo.getRawValue();
    },

    getInstance: function() {
        return (null !== this.instanceCombo) ? this.instanceCombo.getValue() : null;
    },

    
    ////////////////////////////////////////////////////////////////////////////
    //
    // METHODS
    //
    ////////////////////////////////////////////////////////////////////////////

    reset: function() {
        this.resetComponent(this.applicationCombo);
        this.resetComponent(this.instanceCombo);
    },
    
    /**
     * Reset the given component, resetting, disabling, destroying, and hiding
     * as needed.
     */
    resetComponent: function(comp) {
        if (comp) {
            comp.reset();
            comp.disable();

            if (this.instanceCombo === comp) {
                this.remove(this.instanceCombo);

                this.instanceCombo.destroy();
                this.instanceCombo = null;
            }
        }
    },

    /**
     * Return the selected application name.  This is not really safe to call if
     * you want the full value (including the instance), this method is just
     * implemented to have a consistent interface with other input components.
     */
    getValue: function() {
        return this.getApplication();
    },
    
    /**
     * Validate this component.
     */
    validate: function() {
        var valid = this.applicationCombo.validate();
        if (this.instanceCombo && !this.instanceCombo.validate()) {
            valid = false;
        }
        return valid;
    },
    
    /**
     * A 'select' handler for the application suggest that will reset the UI and
     * reload the instanceStore with the appropriate information.
     */
    applicationSelected: function(suggestField, record, index) {

        // Reset all of the components after the application suggest.
        this.resetComponent(this.instanceCombo);

        // Fire the applicationSelected event in case the listener cares.
        this.fireEvent('applicationSelected', suggestField, record, index);
       
        // Show the spinner while we're loading the store.
        this.showSpinner(this.applicationCombo);
       
        // Need to see if there are any instances for the selected application.
        // Point the instance store at the selected app and load it.

        // bug21083 - we should use encodeURIComponent() instead of escape()
        // Not sure why we're converting %20 -> + and * -> 2A, but leaving
        // existing behavior as is. 
        var application = encodeURIComponent(this.getApplication());
        application = application.replace(/%20/g, '+').replace(/\*/g, '%2A');
        this.instanceStore.applyPathParams([application]);
        this.instanceStore.load({
            callback: this.instancesLoaded,
            scope: this
        });
    },
   
    /**
     * A 'load' handler for the instanceStore that will create the instance
     * combo if needed, or otherwise call applicationAndInstanceComplete.
     */
    instancesLoaded: function(records, options, success) {

        if (!this.keepSpinning) {
            this.hideSpinner();
        }

        // If there are any instances, show the combo box to select the instance.
        if (records.length > 0) {

            // Hide the spinner until the instance is selected ... if there is
            // no need to display this keep showing the spinner so we don't get
            // a flicker by hiding then reshowing immediately in
            // applicationAndInstanceComplete.
            this.hideSpinner();
            
            this.instanceCombo = new Ext.form.ComboBox({
                id: 'instanceCombo',
                allowBlank: false,
                forceSelection: true,
                store: this.instanceStore,
                valueField: 'instance',
                displayField: 'instance',
                emptyText: '#{msgs.lcm_request_entitlements_select_instance}'
            });
            this.instanceCombo.on('select', this.applicationAndInstanceComplete, this);

            this.add(this.instanceCombo);
            this.doLayout();
        }
        else {
            // No instances.  Get rid of the combo if there is one.
            this.resetComponent(this.instanceCombo);

            // Application selection is done.
            this.applicationAndInstanceComplete();
        }
    },

    /**
     * Called when the application and instance have been selected.
     */
    applicationAndInstanceComplete: function() {
        this.fireEvent('applicationAndInstanceSelected');
    },
    
    /**
    * Show the spinner in a short while (500 ms) if it doesn't get hidden again.
    */
   showSpinner: function(component) {
       // Usually our background tasks happen so fast that showing a spinner
       // just looks like a flash on the screen.  Delay showing for 500 ms to
       // make sure this is really taking a while.
       this.spinnerTask.delay(
           500,
           function(component) {
               this.spinner.display(component.wrap.dom);
           },
           this,
           [component]);
   },
   
   /**
    * Hide the spinner or cancel the request to show the spinner if it has not
    * yet been shown.
    */
   hideSpinner: function() {
       this.spinnerTask.cancel();
       this.spinner.hide();
   }
});
