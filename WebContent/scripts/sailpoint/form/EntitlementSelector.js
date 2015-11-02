/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Multi-Select component that allows users to select specific entitlements or
 * permissions. The component is composed of a SelectionsGrid, a type(entitlement or permission) combobox
 * and a popup dialog which allows the user to enter in the app, entitlement/right and value/target.
 */
Ext.define('SailPoint.form.EntitlementSelector', {
    extend : 'SailPoint.form.MultiSelect',
    alias : 'widget.entitlementselector',

    /**
     * @cfg {String} ID of the hidden input this component is bound to. If set,
     * the value of the component will be persisted to the given field.
     */
    binding : null,

    /**
     * @cfg {boolean} If set to true, the entitlement selector only allows
     * selecting the application/attribute (not the entitlement value).
     */
    attributeOnly: false,
    
    /**
     * @cfg {boolean} If set to true, an entitlement selection must be done to
     * be valid.
     */
     required: false,
    
    constructor: function(config) {
        
        Ext.applyIf(config, {
            width: 400,
            forceSelection: false,
            datasourceUrl: "/rest/suggest/object/Application",
            suggest: true,
            allowBlank: false,
            msgTarget: 'under',
            emptyText: (config.attributeOnly) ? '#{msgs.ent_selector_attr_only_empty_text}' : '#{msgs.ent_selector_empty_text}'
        });
        
        this.callParent(arguments);
    },

    initComponent : function(){
        
        this.callParent(arguments); // this.comboBox and this.selectionsGrid exist after callParent.

        this.selectionsGrid.on('afterlayout', function(grid, eOpts) {
            var hRow = grid.getEl().down('tr.x-grid-header-row');
            if(hRow) {
                hRow.hide();
            }
        });
        
        // we don't want to add the record just yet.
        this.comboBox.un('select', this.addRecord, this);

        this.comboBox.on('select', function(combo, records, eOpts) {

            if (!combo.isValid()) {
                return;
            }

            this.getEntitlementDialog(combo.getValue(), combo.getRawValue()).show();
            
        }, this);

        /**
         * Bug#15152: the validation will be done by us not the combobox.
         * If we have validation in combobox it will be validated twice because
         * the comboBox is also added as a field by the form (Ext).
         */
        this.comboBox.validate = function() { return true; };
        
        this.load();

    },

    /**
     * Add a new entitlement or permission to the component store.
     * @param app Application Name
     * @param attr Attribute or Right name
     * @param attrVal Attribute or Target value
     */
    addEntitlement : function(app, attr, attrVal) {

        var displayName = app + '-' + attr;
        if (attrVal && attrVal !== '') {
            displayName += '-' + attrVal;
        }

        this.selectionsStore.add({
            id: Ext.JSON.encode( { app : app,  attr: attr, attrVal: attrVal } ),
            application: app,
            name: attr,
            value: attrVal,
            permission: false,
            displayName: displayName
        });

        this.persistSelections();
        
        // manually clear out the combo box value.  Not sure why we have to do this now.
        this.comboBox.clearValue();
        this.comboBox.clearInvalid();
    },

    /**
     * Creates a new Ext.Window instance used to collect details about the
     * entitlement.
     * @param type {String} 'entitlement' or 'permission'
     */
    getEntitlementDialog : function(applicationId, applicationName){

        var items = [];
         
        var selector = new SailPoint.form.ComboBox({
            suggest: true,
            fieldLabel:'#{msgs.lcm_request_entitlements_attribute}',
            valueField: 'attribute',
            displayField: 'attribute',
            queryParam: 'attribute',
            datasourceUrl: '/rest/managedAttributes/names',
            httpMethod: 'GET',
            emptyText: '#{msgs.lcm_request_entitlements_select_attribute}',
            baseParams:{
                purview : applicationId,
                requestable: true,
                excludeNullAttributes: true,
                excludedTypes: 'Permission'
            }
        });
        items.push(selector);

        var addButton = Ext.create('Ext.Button', {
            text:'#{msgs.ent_selector_button_add}',
            disabled: true
        });
        
        var cancelButton = new Ext.Button({
            text : '#{msgs.ent_selector_button_cancel}',
            cls : 'secondaryBtn'
        });

        var valueInput = null;
        if (!this.attributeOnly) {
            valueInput = new SailPoint.form.ManagedAttributeValueCombo({
                fieldLabel:'#{msgs.lcm_request_entitlements_value}',
                disabled: true,
                applicationName: applicationId,
                requestable: true,
                excludedTypes: 'Permission'
            });

            selector.on('select', function(comp, record, index){
                this.setAttribute(comp.getValue());
                this.getStore().load();
                this.enable();
            }, valueInput);
            items.push(valueInput);
            valueInput.on('select', function(comp, record, index){
                if( comp.getValue() ) {
                    addButton.enable(); 
                } else {
                    addButton.disable();
                }
            });
        } else {
            selector.on('select', function(comp, record, index){
                if( comp.getValue() ) {
                    addButton.enable(); 
                } else {
                    addButton.disable();
                }
            });
        }
        
        var win = new Ext.Window({
            title: (this.attributeOnly) ? '#{msgs.ent_selector_attr_only_title}' : '#{msgs.ent_selector_title}',
            width: 500,
            height: (this.attributeOnly) ? 110 : 150,
            closable:false,
            bodyStyle:'background-color:#FFF;padding:10px',
            layout:'form',
            application: applicationName,
            selector: selector,
            valueInput: valueInput,
            items: items,
            addEntitlement : function() {
                var rv = this.selector.getRawValue();
                var vi = (this.valueInput) ? this.valueInput.getValue() : null;
                this.fireEvent('add',  this.application, rv, vi);
                this.hide();
            },
            cancelChanges: function() {
                this.fireEvent('cancel' );
                this.destroy();
            },
            buttons : [addButton, cancelButton]
        });
        
        addButton.on('click', function(){
            this.addEntitlement();
        }, win);
        
        cancelButton.on('click', function(){
            this.cancelChanges();
        }, win);

        win.addEvents('add');
        win.on('add', this.addEntitlement, this);
        win.on('cancel', this.cancelChanges, this);

        return win;
    },
    
    cancelChanges: function( ) {
        this.comboBox.clearValue();
        this.comboBox.clearInvalid();
    },

    /**
     * Loads current value for this component from the field specified by this.binding.
     */
    load : function(){
        var i;
        if (this.binding){
            var bindInput = Ext.get(this.binding);
            if (bindInput && bindInput.dom.value !== ""){
                var val = Ext.decode(bindInput.dom.value);
                for(i=0;i<val.length;i++){
                    var row = val[i];
                    this.addEntitlement(row.application,
                            row.name, row.value[0]);
                }
            }
        }

        // parent class does this funny, redo it here
        if (this.value) {
          this.clear();
          if (Object.prototype.toString.apply(this.value) === '[object Array]'){
            for(i=0;i<this.value.length;i++){
              var o = this.value[i];
              this.addEntitlement(o.app, o.attr, o.attrVal);
            }
          }
        }
    },

    /**
     * Persist the current value of the component to the field specified by
     * this.binding.
     */
    persistSelections : function(){
        if (!this.binding) {
            return;
        }

        var records = this.selectionsGrid.getSelectionModel().getSelection();
        var bindingElem = Ext.get(this.binding);
        bindingElem.dom.value = Ext.encode(records);
    },
    
    getSelected: function() {
        var records = [];
        this.getSelectionsStore().each(function(record){
            this.push(record.data);
        }, records);
        return records;
    },
    
    validate: function() {
        
        if (!this.required) {
        	return true;
        }
        
        if (this.getValue().length === 0) {
            this.getComboBox().markInvalid(this.getComboBox().blankText);
            return false;
        } else {
            this.getComboBox().clearInvalid();
            return true;
        }
    }
    
});
