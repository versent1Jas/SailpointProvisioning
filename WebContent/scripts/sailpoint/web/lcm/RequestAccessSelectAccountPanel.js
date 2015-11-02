/**
 * Panel to be used with RequestAccessAccountChoiceWindow containing
 * some native identity and possible instance selectors
 */
Ext.define('SailPoint.LCM.RequestAccessSelectAccountPanel', {
    extend : 'Ext.panel.Panel',
    
    hasInstances: false,
    
    account_request: null,
    
    identityId: null,
    
    identityName: null,
    
    action_type: null,
    
    instanceCombo: null,
    
    nativeIdentityCombo: null,
    
    initComponent : function() {

        if (this.hasInstances) {
            this.instanceStore = SailPoint.Store.createRestStore({
                url: SailPoint.getRelativeUrl('/rest/applications/{0}/instances'),
                fields: ['instance'],
                remoteSort: true,
                method: 'GET'
            });

            this.instanceStore.applyPathParams([this.account_request.application]);
            this.instanceCombo = new Ext.form.ComboBox({
                id: 'instanceCombo-'+this.identityId,
                width:375,
                allowBlank: false,
                forceSelection: true,
                store: this.instanceStore,
                valueField: 'instance',
                displayField: 'instance',
                emptyText: '#{msgs.lcm_request_entitlements_select_instance}',
                fieldLabel: '#{msgs.label_instance}'
            });
        }

        this.nativeIdentityStoreFactory =
            new SailPoint.component.NativeIdentityStoreFactory(this.identityId, this.account_request.application);

        this.nativeIdentityCombo = new SailPoint.component.NativeIdentityCombo({
            id: 'nativeIdentityCombo-'+this.identityId,
            storeFactory: this.nativeIdentityStoreFactory,
            createRequested: this.action_type==SailPoint.LCM.RequestAccess.ACTION_CREATE_ACCOUNT,
            forceSelection: true,
            width:375,
            fieldLabel: '#{msgs.label_account}',
            allowBlank: false,
            instanceCombo: this.instanceCombo
        });

        var formItems = [];
        if (this.instanceCombo) {
            formItems.push(this.instanceCombo);
        }
        formItems.push(this.nativeIdentityCombo);

        Ext.apply(this, {
            id: 'selectAccountPanel-'+this.identityId,
            items: formItems,
            title: Ext.String.format('#{msgs.lcm_request_entitlements_select_native_identity_format}', this.identityName)
        });
        
        this.callParent(arguments);
    },
    
    hasInstances: function() {
        return this.hasInstances;
    },
    
    getInstance : function() {
        if (this.instanceCombo) {
            return this.instanceCombo.getValue();
        } else {
            return null;
        }
    },
    
    getNativeIdentity: function() {
        return this.nativeIdentityCombo.getValue();
    },
    
    getIdentityId: function() {
        return this.identityId;
    } 
});