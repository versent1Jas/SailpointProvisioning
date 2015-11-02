/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Certification item assignee selection component. This is a
 * basically an identity suggest with an additional combo attached
 * which gives the user the option of picking from a short list
 * of common assignee types.
 */

Ext.define('SailPoint.AssigneeSelector', {
    extend : 'Ext.form.FieldContainer',
    alias : 'widget.assigneeselector',
    
    hideQuickAssign : false,
    quickAssignOptions : {},    
    assigneeSuggest : null,
    quickAssign : null,
    
    layout: 'hbox',
    
    initComponent : function() {
        
        this.callParent(arguments);
        
        var asConfig = {
            id: this.id + '-assigneeSuggCmp',
            validateOnBlur : false,
            validationEvent : false,
            name : 'owner',
            hideQuickAssign : this.initialConfig.hideQuickAssign,
            extraParams : this.baseParams || {},
            width : 200,
            matchFieldWidth : false,
            listConfig : {width : 300},
            listeners : {
                // when they pick from the suggest, clear the quick assign combo
                // update the valueField if it's being used
                select : {
                    scope : this,
                    fn : function(combo, record, index) {
                        if (this.quickAssign) {
                            this.quickAssign.setValue(null);
                        }
                    }
                }
            }
        };
        
        this.assigneeSuggest = Ext.create('SailPoint.IdentitySuggest', asConfig);
        this.add(this.assigneeSuggest);
        
        var qaConfig = {
            id: this.id + '-quickAssign',
            store: this.quickAssignOptions,
            width: 195,
            emptyText: "#{msgs.assign_manual}",
            style: 'font-size:8pt',
            disabled: this.disabled,
            listeners : {
                // update the main suggest value when an item in the quick assignment
                // combobox is selected
                select : {
                    scope: this.assigneeSuggest,
                    fn : function(combo, record, index) {
                        record = record[0];
                        var field1 = record.get('field1');
                        var field2 = record.get('field2');
                        if (Ext.typeOf(field1) !== "string" && Ext.typeOf(field1) !== "object") {
                            this.reset();
                        }
                        else {
                            if (!field1 || Ext.typeOf(field1) === "string") {
                                if(field1 !== "") {
                                    // loadValueByQuickAssign will change the context to "QuickAssign"
                                    this.loadValueByQuickAssign(field1);
                                }
                                else {
                                    this.clearValue();
                                    this.focus(false, true);
                                    /* The manually assigned identity list is not stored in the page so we
                                     * reload the datastore by doing this call with no name. */
                                    this.loadValueByName();
                                }
                            }
                            else {
                                this.setValue(field1.id);
                                this.setRawValue(field1.displayName ? field1.displayName : field1.name);
                            }
                        }
                    }
                }
            }
        };

        if (!this.hideQuickAssign) {
            this.add({
                xtype: 'splitter'
            });
            this.add({
                xtype: 'splitter'
            });
            this.quickAssign = Ext.create('Ext.form.field.ComboBox', qaConfig);
            this.quickAssign.store.on('exception', SailPoint.FATAL_ERR_ALERT, this);
            this.add(this.quickAssign);
        }
    },
    
    validate : function(){
        var isEmpty = !this.assigneeSuggest.getValue() || '' ==  this.assigneeSuggest.getValue();
        if (!this.allowBlank && isEmpty) {
            this.assigneeSuggest.markInvalid('#{err_req_recipient}');
            return false;
        }
        this.assigneeSuggest.clearInvalid();
        return true;
    }
    
});

Ext.define('SailPoint.AssignmentForm', {
    extend : 'Ext.form.Panel',

    commentsField : null,
    assignmentField : null,

    initComponent: function(){

        var ownerRequired = this.initialConfig.ownerRequired;

        var assignOptions = this.initialConfig.assignmentOptions;
        if (!assignOptions){
            assignOptions = [
                ["","#{msgs.assign_manual}"],
                [SailPoint.CURR_USER_NAME ,"#{msgs.assign_self}"]
            ]
        }

        var formId = this.id;

        this.assignmentField = Ext.create('SailPoint.AssigneeSelector', {
            fieldLabel: '#{msgs.assignment_form_label_recipient}',
            id: 'owner-' + formId,
            quickAssignOptions: assignOptions,
            allowBlank: !ownerRequired,
            baseParams: {context: 'Owner'}
        });

        // note that the hideAssignee method depends on the
        // assignment field being the 1st item
        var myItems = [
            this.assignmentField
        ];

        if (this.initialConfig.includeDescription){
            myItems.push(
                new Ext.form.TextField({
                    id:'description' + '-' + formId,
                    fieldLabel: '#{msgs.assignment_form_label_description}',
                    width:490,
                    name: 'description',
                    validateOnBlur:false,
                    allowBlank:false
                })
            );
        };

        this.commentsField = new Ext.form.TextArea({
            fieldLabel: '#{msgs.assignment_form_label_comments}',
            id: 'comments' + '-' + formId,
            name: 'comments',
            width:490,
            height:100,
            validateOnBlur:false,
            msgTarget:'under'
        });

        myItems.push(
            this.commentsField
        );

        Ext.apply(this, {
            labelWidth: 150,
            bodyStyle:'padding:15px',
            border:false,bodyBorder:false,
            width: 768,
            items:myItems
        });

        this.initialConfig.items = myItems;

        this.callParent(arguments);
    },

    setValues: function(vals){

        if (!vals)
            return;

        // match values up with the actual form field IDs
        var values = [
            {id:'comments' + '-' + this.id, value:vals['comments']},
            {id:'description' + '-' + this.id, value:vals['description']},
            {id:'owner' + '-' + this.id, value:vals['owner']}
        ];

        this.getForm().setValues(values);
        this.getForm().clearInvalid();
    },

    setAssignee : function(name){
        this.assignmentField.assigneeSuggest.setValue(name);
    },

    getValues: function(){
        var formVals = this.getForm().getValues();
        return formVals;
    },

    reset : function(){
        this.setValues([
            {id:'comments', value:''},
            {id:'description', value:''},
            {id:'owner', value:''}
        ]);
        this.assignmentField.assigneeSuggest.reset();
    },

    /**
     * todo this may not work if the items have already
     * been converted to fields on the underlying BasicForm
     */
    disableFields:function(){
        this.items.each(function(item){
            item.disable();
        });
    } ,

    setRequireComments : function requireComments(reqComments){
        if (this.commentsField)
            this.commentsField.allowBlank = !reqComments;
    },

    hasAssignee : function(){
        return this.assignmentField.assigneeSuggest.getValue() && this.assignmentField.assigneeSuggest.getValue() != null &&
               this.assignmentField.assigneeSuggest.getValue() != "";
    },

    hideAssignee : function(){
        this.items.get(0).el.up('.x-form-item').setDisplayed('none');
        this.items.get(0).allowBlank = true;
    },

    showAssignee : function(){
        this.items.get(0).el.up('.x-form-item').setDisplayed('');
        this.items.get(0).allowBlank = false;
    }

});