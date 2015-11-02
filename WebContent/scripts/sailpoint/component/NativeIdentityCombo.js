/* (c) Copyright 2011 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * A combo that allows selecting a native identity for an identity on a given
 * application.  This can also react to instance selections from an instance
 * combo.
 */
Ext.define('SailPoint.component.NativeIdentityCombo', {
	extend : 'Ext.form.ComboBox',

    /**
     * @cfg {String} identityId  The ID of the identity for this native identity
     * combo (required if storeFactory not provided).
     */
    identityId: null,

    /**
     * @cfg {String} application  The name of the application for this native
     * identity combo (required if storeFactory not provided).
     */
    application: null,

    /**
     * @cfg {SailPoint.component.NativeIdentityStoreFactory} The factory that
     * will create the stores (required if identityId and application are not
     * provided).
     */
    storeFactory: null,

    /**
     * @cfg {String} instance  The instance for this for this native identity
     * combo.  This is optional and may change if instanceCombo is supplied.
     */
    instance: null,

    /**
     * @cfg {Ext.form.Combo} instanceCombo  The combo that allows selecting
     * which instance to display accounts for.  If specified, this combo reacts
     * when the instance selection changes.
     */
    instanceCombo: null,
    
    /**
     * @cfg {boolean} createRequested  Indicates that the ability to create a
     * "new account" was requested.  This adds a "create account" option.
     * Defaults to false.
     */
    createRequested: false,
    

    /**
     * Initialize this native identity combo.
     */
    initComponent: function() {

        this.autoRecord = null;
        var value = null;
        
        var config = {
            forceSelection: true,
            valueField: 'nativeIdentity',
            displayField: 'displayName',
            emptyText: '#{msgs.lcm_request_entitlements_select_native_identity}',
            listConfig : {
              getInnerTpl : function(displayField){ 
                var template =  '<div class="x-combo-list-item {icon}">';
                template+='<tpl if="displayName"><div>{displayName}</div></tpl>';
                template+='<tpl if="Ext.isEmpty(displayName)"><div>{nativeIdentity}</div></tpl>';                
                template+='<div class="indentedColumn">{nativeIdentity}</div></div>';
                return template;
              }
            },
            displayTpl: new Ext.XTemplate(
                        '<tpl for=".">' +
                            '{[typeof values === "string" ? values : ((values["displayName"] === null || values["displayName"] === "") ? values["nativeIdentity"] : values["displayName"])]}' +
                            '<tpl if="xindex < xcount">', '</tpl>' +
                        '</tpl>')
        };
        //With instances, we will call load once an instance is suggested,
        //so set query mode local to avoid reloading on trigger click
        if (this.instanceCombo) {
            config.queryMode = 'local';
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config));
    
        // If additional account is enabled, add a special record to the
        // store that will add an option to create a new account.
        if (this.createRequested) {
          this.autoRecord = this.createAutoRecord(true);
        }
    
        // Create our own store factory if one wasn't passed in.
        if (!this.storeFactory) {
            this.storeFactory =
                new SailPoint.component.NativeIdentityStoreFactory(this.identityId, this.application, autoRecord);
        }
        
        // Create the initial store.
        this.storeFactory.setAutoRecord(this.autoRecord);
        this.store = this.storeFactory.getStore(this.instance);
        
        // If the instance combo was given, disable this until a selection is
        // made and 
        if (this.instanceCombo) {
            // Disable if there is no value.
            if (!this.instanceCombo.getValue()) {
                this.disabled = true;
            }
            this.instanceCombo.on('select',
                function(combo, record, idx) {
                    this.setInstance(combo.getValue());
                    this.enable();
                }, this);
        }
    
        // If creation was requested, set it.  We need to call setValue()
        // instead of just providing a value in the config in order to get the
        // icon to render.  Note this also needs to happen after icon support is
        // added.
        
        this.callParent(arguments);
    },
    
    /**
     * Render this component - add icon support for the "create account" option.
     */
    onRender: function(ct, position){
        // Setup this suggest to render icons, but don't allow loading new items into the store.
        SailPoint.Suggest.IconSupport.addIconSupport(this, false);
        
        if (this.createRequested) {
          this.store.on('load', function(store, records, isSuccessful, options) {
            this.insert(0,this.autoRecord);
            if (records.length == 0) {
                this.setValue(this.autoRecord.get(this.valueField));
            }
          }, this.store);
        }
       
        this.callParent(arguments);
    },
    
    /**
     * Create an autoRecord for "create account".
     */
    createAutoRecord: function(forceCreate) {
        var id = (forceCreate) ? 'forceCreateAccount' : 'createAccount';
        
        return Ext.create('SailPoint.model.NativeIdentityRecord', {
            id: id,
            displayName: '#{msgs.lcm_request_entitlements_create_account_option}',
            nativeIdentity: '#{msgs.lcm_request_entitlements_create_account_option_desc}',
            icon: 'createAccountIcon'
        });
    },
    
    /**
     * Set the instance for this native identity combo.  This reloads the store.
     */
    setInstance: function(instance) {
        this.store = this.storeFactory.getStore(instance);
        this.bindStore(this.store);
        this.clearValue();
        this.reset();
        this.store.loadForCombo(this);
    },

    getSelectedId: function() {
        var id = null;
        var selectedVal = this.getValue();
        if (null !== selectedVal) {
            var selectedIdx = this.store.find('nativeIdentity', selectedVal);
            var record = this.store.getAt(selectedIdx);
            id = record.getId();
        }
        return id;
    },
    
    /**
     * Return whether the selection is "create account".
     */
    isCreateAccount: function() {
        var id = this.getSelectedId();
        return ('createAccount' === id) || ('forceCreateAccount' === id);
    },

    /**
     * Return the selection is a forced "create account".
     */
    isForceCreateAccount: function() {
        var id = this.getSelectedId();
        return ('forceCreateAccount' === id);
    }
});

/**
 * A store that returns native identities for an identity on a given application
 * (and instance).
 */
Ext.define('SailPoint.component.NativeIdentityStore', {
	extend : 'SailPoint.data.RestJsonStore',

    // An array of combos waiting to be updated after the store is loaded.
    waitingCombos: null,

    // Whether the store is currently loading.
    loading: false,

    // Whether loading has been completed.
    loadComplete: false,    

    /**
     * Constructor.
     */
    constructor: function(config) {
        Ext.applyIf(config, {
            proxy: {
              type: 'ajax',
              url: SailPoint.getRelativeUrl('/rest/identities/' + SailPoint.Utils.encodeRestUriComponent(config.identityId) + '/links'),
              reader: {
                type: 'json',
                root: 'objects'
              }
            }, 
            model: 'SailPoint.model.NativeIdentityRecord',
            remoteSort: true,
            method: 'GET'
        });

        config.extraParams = config.baseParams || {};
        config.extraParams.application = SailPoint.Utils.encodeRestUriComponent(config.application);
        if (config.instance) {
          config.extraParams.instance = config.instance;
        }

        this.callParent(arguments);
    },
    
    /**
     * Load the store for the given combo, and after load is complete select the
     * first value if there is just one (or zero) values returned.
     */
    loadForCombo: function(combo) {
        // Keep a list of the combos that are waiting to be updated.
        this.waitingCombos = this.waitingCombos || [];
        this.waitingCombos.push(combo);

        // Only do something if we are not currently loading.  Otherwise,
        // storeLoaded() is going to get called soon anyway.
        if (!this.loading) {
            // If the load hasn't finished, fire off a load.
            if (!this.loadComplete) {
                // The callback will the value if the store has 0 or 1 items.
                this.loading = true;
                this.load({
                    callback: this.storeLoaded,
                    scope: this
                });
            }
            else {
                // Already loaded, just setup to the combo.
                this.storeLoaded(this.getRange(), null, true);
            }
        }
    },

    /**
     * Callback that is called of the store is loaded.  This will automatically
     * select an account (or "create account") if 0 or 1 entries are returned.
     */
    storeLoaded: function(records, options, success) {
        // Change the state.
        this.loading = false;
        this.loadComplete = true;

        // Iterate over any combos that are waiting to be updated, and set their
        // values if there is zero or one records returned.
        if (this.waitingCombos) {
            for (var i=0; i<this.waitingCombos.length; i++) {
                var combo = this.waitingCombos[i];

                // Auto-select first (or choose createAccount) if none.
                if (records.length < 2) {
                    // A single record was returned, so select it.
                    if (1 === records.length) {
                       combo.setValue(records[0].get(combo.valueField));
                    }
                    else {
                        // No records were returned - this is a create.
                        if (!this.autoRecord) {
                            var autoRecord = combo.createAutoRecord(false);
                            this.setAutoRecord(autoRecord);
            
                            // The store is empty - add the "create account" record so that
                            // the icon will show up when we select it.
                            this.add(autoRecord);
                        }
        
                        combo.setValue(this.autoRecord.get(combo.valueField));
                    }
                }
            }
            delete this.waitingCombos;
        }
    }
});

/**
 * A factory that creates native identity stores per instance for a given
 * identity and application.  Some pages may have many combos for the same
 * identity/application/instance.  Using a store prevents creating the same
 * store many times, and more importantly from having to load the store many
 * times.
 */
Ext.define('SailPoint.component.NativeIdentityStoreFactory', {
    
    identityId: null,
    application: null,
    autoRecord: null,    
    storesByInstance: null,
    
    /**
     * Constructor.
     */
    constructor: function(identityId, application) {
        this.identityId = identityId;
        this.application = application;        
        this.storesByInstance = {};
    },

    /**
     * Set the autoRecord for this factory.
     */
    setAutoRecord: function(autoRecord) {
        this.autoRecord = autoRecord;
    },
    
    /**
     * Return a store for the given (possibly null) instance.
     */
    getStore: function(instance) {
        var key = instance || 'NULL_INSTANCE';

        var store = this.storesByInstance[key];
        if (!store) {
            store = new SailPoint.component.NativeIdentityStore({
                identityId: this.identityId,
                application: this.application,
                instance: instance,
                autoRecord: this.autoRecord
            });
            this.storesByInstance[key] = store;
        }

        return store;
    }
});

Ext.define('SailPoint.model.NativeIdentityRecord', {
  extend: 'Ext.data.Model',
  idProperty: 'id',
  fields: [
      {name: 'id',  type: 'string'},
      {name: 'displayName',   type: 'string'},
      {name: 'nativeIdentity', type: 'string'},
      {name: 'icon', type: 'string'}
  ]
});
