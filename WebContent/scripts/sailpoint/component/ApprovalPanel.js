/* (c) Copyright 2015 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * A standalone component containing Workflow Step Approval Field Objects.
 */
Ext.define('Sailpoint.component.ApprovalPanel', {
    extend: 'Ext.form.Panel',
    alias: 'widget.spapprovalpanel',

    region: 'north',
    bodyStyle: 'padding:5px',
    autoScroll: true,
    border: true,
    referenceables: null,
    defaults: {
        msgTarget: 'side',
        onHide: function() {this.getEl().up('.x-form-item').setStyle('display','none');},
        onShow: function() {this.getEl().up('.x-form-item').setStyle('display','block');}
    },

    initComponent: function() {
        this.formSend = Ext.create('Ext.form.TextField', {
            fieldLabel: '#{msgs.workflow_send}',
            id: 'formSend',
            anchor: '95%'
        });

        this.formReturn = Ext.create('Ext.form.TextField', {
            fieldLabel: '#{msgs.workflow_return}',
            id: 'formReturn',
            anchor: '95%'
        });

        this.ownerRadio = Ext.create('SailPoint.WorkflowScriptRadio', {
            title: '#{msgs.label_owner}',
            helpText: '#{help.help_workflow_approval_owner}',
            id: 'formOwner',
            anchor: '95%',
            variableName: '#{msgs.label_owner}',
            standalone: this.standalone,
            referenceables: this.referenceables
        });

        this.callParent(arguments);

        // Adding fields in a panel
        this.add(this.formSend);
        this.add(this.formReturn);
        this.add(this.ownerRadio);
    }
})
