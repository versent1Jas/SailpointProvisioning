/* (c) Copyright 2011 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.LCM');

/**
 * A set of fields for selecting instances and native identities for all
 * requests for a single app on a single identity.
 */
Ext.define('SailPoint.LCM.RequestEntitlementsDetailGroup', {

    ////////////////////////////////////////////////////////////////////////////
    //
    // FIELDS
    //
    ////////////////////////////////////////////////////////////////////////////
    
    // The EntitlementIdentityGroup for this panel.
    identityGroup: null,
    
    // Select all components.
    selectAllCheckbox: null,
    selectAllInstanceCombo: null,
    selectAllNativeIdentityCombo: null,
    
    // Individual entitlement components.
    instanceCombos: null,
    nativeIdentityCombos: null,
    
    // The store factory shared for all native identity selectors.
    nativeIdentityStoreFactory: null,


    ////////////////////////////////////////////////////////////////////////////
    //
    // CONSTRUCTOR
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Construct and render this detail panel.
     */
    constructor: function(identityGroup) {
        this.identityGroup = identityGroup;

        this.instanceCombos = [];
        this.nativeIdentityCombos = [];
        
        this.nativeIdentityStoreFactory =
            new SailPoint.component.NativeIdentityStoreFactory(this.identityGroup.identityId,
                                                               this.identityGroup.application);
        
        this.render();
    },
    

    ////////////////////////////////////////////////////////////////////////////
    //
    // RENDERING
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Render this panel.
     */
    render: function() {
        // Render the "select for all" combos if there are multiple requests.
        if (this.identityGroup.entitlementIdentities.length > 1) {
            this.renderSelectAllControls();
        }

        // Render the controls for each entitlement identity in the group.
        this.renderIndividualControls();
    },

    /**
     * Render the "select all" controls.  This assumes that there are multiple
     * entitlement identities for this group.
     */
    renderSelectAllControls: function() {
        // Create the "select for all" checkbox.
        this.selectAllCheckbox = new Ext.form.Checkbox({
            id: 'selectAllCheckbox',
            renderTo: 'selectAllCheckbox_' + this.identityGroup.id,
            checked: true,
            boxLabel: '#{msgs.lcm_request_entitlements_select_all_acct_instance}'
        });
        this.selectAllCheckbox.on('check', this.showSelectAllToggled, this);
        
        // If there are instances render the instance selector.
        this.selectAllInstanceCombo =
            this.createInstanceCombo('selectAllInstanceCombo_' + this.identityGroup.id);
        if (this.selectAllInstanceCombo) {
            this.selectAllInstanceCombo.on('select', this.selectAllInstanceComboSelected, this);
        }

        // Create that native identity selector.  Instance is null since no
        // instance has been selected yet.
        var instance = null;
        var createAccount = this.identityGroup.entitlementIdentities[0].showCreateAccount;
        this.selectAllNativeIdentityCombo =
            this.createNativeIdentityCombo(instance, createAccount,
                                           'selectAllNativeIdentityCombo_' + this.identityGroup.id,
                                           this.selectAllInstanceCombo);
        this.selectAllNativeIdentityCombo.on('select', this.copySelectAllNativeIdentity, this);
    },

    /**
     * Render the individual controls for this panel.
     */
    renderIndividualControls: function() {
        for (var i=0; i<this.identityGroup.entitlementIdentities.length; i++) {
            var config = this.identityGroup.entitlementIdentities[i];
            var id = config.id;

            var instanceCombo =
                this.createInstanceCombo('instance_' + id);
            this.registerInstanceCombo(instanceCombo, config);

            var nativeIdentityCombo =
                this.createNativeIdentityCombo(config.instance,
                                               config.showCreateAccount,
                                               'nativeIdentity_' + id,
                                               instanceCombo);
            this.registerNativeIdentityCombo(nativeIdentityCombo, config);
        }
    },
    
    /**
     * Create an instance combo if there are instances to select.
     */
    createInstanceCombo: function(cmpId) {
        var combo = null;
        if (this.identityGroup.instanceStore && this.identityGroup.instanceStore.length > 0) {
            combo = new Ext.form.ComboBox({
                id: cmpId,
                renderTo: cmpId + '_container',
                width: 200,
                listWidth: 200,
                allowBlank: true,
                forceSelection: true,
                typeAhead: true,
                triggerAction: 'all',
                queryMode: 'local',
                store: this.identityGroup.instanceStore,
                emptyText: '#{msgs.lcm_request_entitlements_select_instance}'
            });
        }
        return combo;
    },
    
    /**
     * Create a NativeIdentityCombo using the given parameters.
     * 
     * @param  instance           The selected instance (if an instance is already
     *                            selected).
     * @param  showCreateAccount  Whether to show the "create account" option even
     *                            if the user already has an account.
     * @param  cmpId              The ID of this component.
     * @param  instanceCombo      The instance combo to which to bind the native
     *                            identity combo (possibly null).
     */
    createNativeIdentityCombo: function(instance, showCreateAccount, cmpId, instanceCombo) {
        // It is important that we use a store factory here instead of allowing
        // each combo to create its own combo.  The reason is that when "select
        // all" is enabled there are typically many combos backed by the same
        // store.  When the "select all" instance combo is selected we need to
        // load the native identity combos for each individual entitlement to
        // see if we can auto-select a value (ie - if there are zero or 1 accounts
        // for the identity/application).  Without sharing stores, selecting an
        // instance for all could cause many loads, which would slow down the
        // page.
        var suggest = new SailPoint.component.NativeIdentityCombo({
            id: cmpId,
            renderTo: cmpId + '_container',
            storeFactory: this.nativeIdentityStoreFactory,
            createRequested: showCreateAccount,
            instanceCombo: instanceCombo,
            width: 200,
            listWidth: 200,
            forceSelection: true,
            allowBlank: true
        });
        
        // Keep track of when the store is loaded.  This prevents double-loading
        // the store when we need to load it programatically.
        this.addLoadMarker(suggest);

        return suggest;
    },

    
    ////////////////////////////////////////////////////////////////////////////
    //
    // HANDLERS
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * The "on check" handler for the select all checkbox.  This hides or shows
     * the appropriate components.
     */
    showSelectAllToggled: function(checkbox, checked) {
        var selectAllDiv = $('selectAllDiv_' + this.identityGroup.id);
        var idsDiv = $('entitlementIdentitiesDiv_' + this.identityGroup.id);

        if (checked) {
            selectAllDiv.show();
            idsDiv.hide();
        }
        else {
            selectAllDiv.hide();
            idsDiv.show();
        }
    },
    
    /**
     * The "on select" handler for the select all instance combo.  This copies
     * the instance to all individual instance combos and sets the instance on
     * all individual native identity combos.
     */
    selectAllInstanceComboSelected: function(combo, record, idx) {
        var instance = combo.getValue();

        // Copy the selected instance to all instance combos.
        var combos = this.getInstanceCombos();
        var i;
        for (i=0; i<combos.length; i++) {
            combos[i].setValue(instance);
        }

        // Set the instance on all native identity combos.
        combos = this.getNativeIdentityCombos();
        for (i=0; i<combos.length; i++) {
            combos[i].setInstance(instance);
            combos[i].enable();
        }
    },

    /**
     * The "on select" handler for the select all native identity combo.  This
     * copies the value to all individual native identity combos.
     */
    copySelectAllNativeIdentity: function(combo, record, idx) {
        var combos = this.getNativeIdentityCombos();
        
        var callbackFn = function(records, options, success) {
          this.setValue(combo.getValue());
        };
        
        for (var i=0; i<combos.length; i++) {
            // Load the store for this combo first so that the record
            // can be looked up when setting the value.
            if (!this.hasBeenLoaded(combos[i])) {
                combos[i].store.load({
                    callback: callbackFn,
                    scope: combos[i]
                });
            }
            else {
                combos[i].setValue(combo.getValue());
            }
        }
    },
    
    
    ////////////////////////////////////////////////////////////////////////////
    //
    // COMPONENT MANAGEMENT
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Setup a handler that will remember when the store for the given combo is
     * loaded.
     */
    addLoadMarker: function(combo) {
        combo.getStore().on('load',
                            function(store, records, options) {
                                store.loadComplete = true;
                            }, this);
    },
    
    /**
     * Return whether the store for the given combo has been loaded.
     */
    hasBeenLoaded: function(combo) {
        return combo.getStore().loadComplete;
    },
    
    registerInstanceCombo: function(combo, config) {
        if (combo) {
            this.instanceCombos.push(combo);
            combo.entitlementIdentityId = config.id;
        }
    },

    registerNativeIdentityCombo: function(combo, config) {
        if (combo) {
            this.nativeIdentityCombos.push(combo);
            combo.entitlementIdentityId = config.id;
        }
    },

    getInstanceCombos: function() {
        return this.instanceCombos;
    },

    getNativeIdentityCombos: function() {
        return this.nativeIdentityCombos;
    },
    

    ////////////////////////////////////////////////////////////////////////////
    //
    // VALIDATION AND SUBMISSION
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Validate that all fields have values.
     */
    validate: function() {
        var valid = true;
        if (this.selectAllCheckbox && this.selectAllCheckbox.checked) {
            if (!this.validateCombo(this.selectAllInstanceCombo, true, this.identityGroup.id)) {
                valid = false;
            }
            if (!this.validateCombo(this.selectAllNativeIdentityCombo, false, this.identityGroup.id)) {
                valid = false;
            }
        }
        else {
            if (!this.validateCombos(this.getInstanceCombos(), true)) {
                valid = false;
            }
            if (!this.validateCombos(this.getNativeIdentityCombos(), false)) {
                valid = false;
            }
        }
        return valid;
    },
    
    validateCombo: function(combo, isInstance, id) {
        var valid = true;
        if (combo) {
            var typeString = (isInstance) ? 'instance' : 'nativeIdentity';
            var errorDiv = $('error_' + typeString + '_' + id);
            if (!combo.getValue()) {
                valid = false;
                errorDiv.show();
            }
            else {
                errorDiv.hide();
            }
        }
        return valid;
    },
    
    validateCombos: function(combos, isInstance) {
        var valid = true;
        for (var i=0; i<combos.length; i++) {
            var combo = combos[i];
            if (!this.validateCombo(combo, isInstance, combo.entitlementIdentityId)) {
                valid = false;
            }
        }
        return valid;
    },
    
    /**
     * Copy the information from this group onto the form to be submitted.  This
     * assumes that validation has already occurred.
     */
    submit: function() {
        if (this.selectAllCheckbox && this.selectAllCheckbox.checked) {
            var instance = (this.selectAllInstanceCombo) ? this.selectAllInstanceCombo.getValue() : null;
            var createAccount = this.selectAllNativeIdentityCombo.isCreateAccount();
            var forceCreate = this.selectAllNativeIdentityCombo.isForceCreateAccount();
            var nativeIdentity = (!createAccount) ? this.selectAllNativeIdentityCombo.getValue() : null;
            for (var i=0; i<this.identityGroup.entitlementIdentities.length; i++) {
                var id = this.identityGroup.entitlementIdentities[i].id;
                $('editForm:hidden_instance_' + id).value = instance;
                $('editForm:hidden_nativeIdentity_' + id).value = nativeIdentity;
                $('editForm:hidden_createAccount_' + id).value = createAccount;
                $('editForm:hidden_forceCreateAccount_' + id).value = forceCreate;
            }
        }
        else {
            for (var i=0; i<this.getInstanceCombos().length; i++) {
                combo = this.getInstanceCombos()[i];
                instance = combo.getValue();
                $('editForm:hidden_instance_' + combo.entitlementIdentityId).value = instance;
            }
            for (var i=0; i<this.getNativeIdentityCombos().length; i++) {
                combo = this.getNativeIdentityCombos()[i];
                createAccount = combo.isCreateAccount();
                forceCreate = combo.isForceCreateAccount();
                nativeIdentity = (!createAccount) ? combo.getValue() : null;
                $('editForm:hidden_nativeIdentity_' + combo.entitlementIdentityId).value = nativeIdentity;
                $('editForm:hidden_createAccount_' + combo.entitlementIdentityId).value = createAccount;
                $('editForm:hidden_forceCreateAccount_' + combo.entitlementIdentityId).value = forceCreate;
            }
        }
    }
});
