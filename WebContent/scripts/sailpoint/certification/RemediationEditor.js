Ext.define('SailPoint.certification.RemediationEditor', {
    extend : 'Ext.panel.Panel',

    editableEntitlements : null,

    initComponent : function(){

        Ext.applyIf(this, {
            html:"<div class='bold' style='margin:15px 8px'>#{msgs.remed_edit_details_section_edit_details}</div><div id='"+this.getEditorDivId()+"'></div>",
            border:false,
            bodyBorder:false
        });

        this.callParent(arguments);
    },

    getEditorDivId : function(){
        return this.id + "-editorTable";
    },

    getOperationSelectorId : function(lineItem){
        return 'opSuggest_' + lineItem.id
    },

    getValueSelectorId : function(lineItem){
        return 'valueSuggest_' + lineItem.id;
    },
    
    getValueTextFieldId : function(lineItem){
        return 'valueText_' + lineItem.id;
    },

    hasEditableEntitlements : function(){
        return this.editableEntitlements.length > 0;
    },

    getValues : function(){
        var values = [];
        for (var i=0;i<this.editableEntitlements.length;i++){
            var item = this.editableEntitlements[i];
            var newVal = this.getValueForEntitlement(item);

            var val = {
                operation: Ext.getCmp(this.getOperationSelectorId(item)).getValue(),
                newValue: newVal,
                application: item.application,
                instance: item.instance,
                nativeIdentity: item.nativeIdentity,
                attribute: item.attribute,
                attributeValue : item.value,
                permissionTarget: item.permissionTarget,
                permissionRights : item.permissionRights
            };

            values.push(val);
        }
        return values;
    },
    
    getValueForEntitlement : function(item) {
        var val = null;
        
        var select = Ext.getCmp(this.getValueSelectorId(item));
        if (select){
            val = select.getValue();
        } else {
            var text = Ext.getCmp(this.getValueTextFieldId(item));
            if (text) {
                val = text.getValue();
            }
        }
        
        return val;
    },
    
    validateNewValues : function() {
        if (this.editableEntitlements) {
            for (var i=0;i<this.editableEntitlements.length;i++){
                var item = this.editableEntitlements[i];
                var newVal = this.getValueForEntitlement(item);

                if (Ext.isEmpty(newVal, false)) {
                    return false;
                }
            }
        }

        return true;
    },

    reset : function(){
        this.editableEntitlements = [];
        if (Ext.fly(this.getEditorDivId()))
            Ext.fly(this.getEditorDivId()).dom.innerHTML = '';
    },
    
    comboAfterrenderLoader : function(comp, opt) {
        var val = comp.initialValue;
        var proxy = comp.getStore().getProxy();
        proxy.extraParams.value = val;
        proxy.extraParams.attribute = comp.initialConfig.attribute;
        proxy.extraParams.purview = comp.initialConfig.applicationName;
        
        comp.getStore().load({cid:comp.id, dn:val, callback:function(rec, o, s) {
            var proxy = Ext.getCmp(o.cid).getStore().getProxy();
            delete proxy.extraParams.value; // reset
            if (rec && rec.length > 0) {
                Ext.each(rec, function(r){
                    if(r.get('value') === o.dn) {
                        comp.initialRecord = r;
                        comp.setValue(r.get('value'));
                        return false;
                    }
                });
            } else {
                //This must not be a managed attribute, so
                //make a new record for it
                var newRecord = {};
                newRecord[comp.displayField] = o.dn;
                newRecord[comp.valueField] = o.dn;                
                var newRecordModels = comp.getStore().add(newRecord);
                comp.initialRecord = newRecordModels[0];
                comp.setValue(o.dn);
                return false;
            }
        }});
    },

    showRevocationDetailsPanel : function(remediationDetails, useManagedAttributes, certificationConfig, readOnly){

        var html = '<table class="spTable width100">';
        html += '<tr>';
        html += "<th>#{msgs.remed_edit_details_col_op}</th>";
        html += "<th>#{msgs.remed_edit_details_col_attr}</th>";
        html += "<th width='175px'>#{msgs.remed_edit_details_col_value}</th>";
        html += "<th>#{msgs.remed_edit_details_col_app}</th>";
        html += "<th>#{msgs.remed_edit_details_col_user_name}</th>";
        html += '</tr>';

        var app = "";
        var editableItems = [];
        for (var i=0;i<remediationDetails.length; i++){
            var item = remediationDetails[i];
            var itemEditable = !readOnly && item.editable;
            
            if (itemEditable){
                this.editableEntitlements.push(item);
            }

            var itemName = item.attribute ? item.attribute : item.permissionTarget;
            var itemValue = item.attribute ? item.attributeValue : item.permissionRights;
            var itemOp = item.operation[0];

            html += "<tr>";
            
            if (itemEditable){
                html += "<td valign='top' id='remedOp_"+item.id+"'></td>";
            } else {
                html += "<td valign='top' id='remedOp_"+item.id+"'>" + itemOp + "</td>";
            }

            html += "<td valign='top'>"+ itemName +"</td>";
            if (itemEditable){
                if (item.inputType == 'select'){
                    html += "<td valign='top' id='remedValue_"+item.id+"'></td>";
                } else {
                    html +="<td valign='top'><div id='remedValue_"+item.id+"' style='width:150px'/></td>";
                } 
            } else {
                html += "<td valign='top'>"+itemValue+"</td>";
            }
            html += "<td valign='top'>"+ item.application +"</td>";
            html += "<td valign='top'>"+ item.nativeIdentity +"</td>";
            html += "</tr>";
        }

        Ext.fly(this.getEditorDivId()).dom.innerHTML = html;

        // Once the html is rendered, we can drop in the controls. Each line
        // will get two controls. A combo for selecting the operation and possible
        // a combo for the value, if that's appropriate
        for(var i=0;i<this.editableEntitlements.length;i++){
            var item = this.editableEntitlements[i]
            var itemValue = item.attribute ? item.attributeValue : item.permissionRights;

            var valueSelectorId = this.getValueSelectorId(item);
            var valueEditId = this.getValueTextFieldId(item);

            // Create the option picker, this allows the user to select
            // whether they want to Remove or Modify the entitlement
            var opPicker = new Ext.form.ComboBox({
                id: this.getOperationSelectorId(item),
                renderTo: "remedOp_"+item.id,
                store: item.selectOptions,
                width: 75,
                valueSelectId: valueSelectorId,
                textInputId: valueEditId,
                editable: false,
                listeners : {
                    render : {
                        fn : function(comp, opt) {
                            var val = item.operation[0];
                            if(val) {
                                comp.setValue(val);
                            }
                        }
                    }
                }
            });
            
            opPicker.on('select', this.updateValuePicker);

            // check to see input type, if we need a select box, generate
            // the components. Otherwise we can do with the text box that's
            // already included
            if (item.inputType == 'select') {
                if (item.attribute) {
                    if (useManagedAttributes) {
                        new SailPoint.form.ManagedAttributeValueCombo({
                           id: valueSelectorId,
                           renderTo: 'remedValue_' + item.id,
                           width: 150,
                           listConfig: {minWidth:250},
                           pageSize: 25,
                           applicationName: item.applicationId,
                           attribute: item.attribute,
                           initialValue: itemValue,
                           forceSelection: true,
                           allowBlank: false,
                           msgTarget: 'side',
                           listeners : {
                               afterrender : this.comboAfterrenderLoader,
                               change : {
                                   // Don't let the old value go away when we click the trigger
                                   fn : function(comp, newVal, oldVal) {
                                       if(newVal == null && comp != null) {
                                           if(comp.initialRecord != null && comp.initialRecord.get('value') == oldVal) {
                                               comp.getStore().add(comp.initialRecord);
                                               comp.setValue(oldVal);
                                           }
                                       }
                                   }
                               }
                           }
                        });
                    } else {
                        new SailPoint.LinkAttributeValueSuggest({
                            id:valueSelectorId,
                            renderTo: 'remedValue_' + item.id,
                            width: 150,
                            listConfig:{minWidth: 250},
                            application: item.application,
                            attributeName: item.attribute,
                            isPermission: false,
                            initialValue : itemValue,
                            forceSelection: true,
                            allowBlank: false,
                            msgTarget:'side',
                            listeners : {
                                afterrender : this.comboAfterrenderLoader
                            }
                        });
                    }
                } else if (item.permissionTarget){
                    // ManagedAttributes don't track permission rights, so we'll use
                    // the LinkAttributeValueSuggest, which uses the RightConfig.
                    new SailPoint.LinkAttributeValueSuggest({
                        id:valueSelectorId,
                        renderTo: 'remedValue_' + item.id,
                        width: 150,
                        listConfig:{minWidth: 250},
                        application: item.application,
                        attributeName: item.permissionTarget,
                        isPermission: true,
                        initialValue : itemValue,
                        forceSelection: true,
                        allowBlank: false,
                        msgTarget:'side',
                        listeners : {
                            afterrender : this.comboAfterrenderLoader
                        }
                    });
                }
            } else {
                new Ext.form.TextField({
                    id:valueEditId,
                    renderTo: 'remedValue_' + item.id,
                    width: 150,
                    initialValue: itemValue,
                    value: itemValue,
                    allowBlank:false,
                    msgTarget:'side',
                    //gotta override this to get the parent div 
                    //for error message on validation
                    getErrorCt : function() {
                        return this.el.findParent("div#remedValue_"+ item.id,5,true);
                    }
                });
            }
            
            if (!item.existingRemediation && certificationConfig != null && certificationConfig.defaultRemediationModifiableOp == 'Remove') {
                opPicker.setValue('Remove');
            }
            this.updateValuePicker(opPicker);
        };

        return html += '</table>';
    },
    
    // When the value changes, if they are choosing to remove the entitlement
    // we should disable the value picker. We also want to revert the input
    // to it's initial value.
    updateValuePicker : function(combo) {
        var value = combo.getValue();
        var valuePicker = Ext.getCmp(combo.valueSelectId);
        if (!valuePicker){
            valuePicker = Ext.getCmp(combo.textInputId);
        }
        if (valuePicker){
            valuePicker.setDisabled(value === 'Remove');
            valuePicker.setValue(valuePicker.initialValue);
        } 
    }
    
});
