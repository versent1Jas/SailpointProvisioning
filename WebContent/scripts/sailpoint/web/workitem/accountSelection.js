/* (c) Copyright 2011 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.web.workitem');

/**
 * This class handles components on the "Account Selection" page.  Use
 * getInstance() instead of calling the constructor directly.
 */
Ext.define('SailPoint.web.workitem.AccountSelection', {

    accountSelections: null,
    submitted: false,
    
    /**
     * Constructor.
     * 
     * @param  accountSelections  An array of account selection objects.
     * @param  disabled           Whether this page is disabled or not.
     */
    constructor: function(accountSelections, disabled) {
        this.accountSelections = accountSelections;

        // Create a combo for each account selection.
        for (var i=0; i<this.accountSelections.length; i++) {
            var acctSel = this.accountSelections[i];

            var allowedVals = [];
            for (var j=0; j<acctSel.accounts.length; j++) {
                var curr = acctSel.accounts[j];
                allowedVals.push([ curr.nativeIdentity, curr.displayName ]);
            }

            var store = new Ext.data.ArrayStore({
                fields: [{name:'nativeIdentity'}, {name:'displayName'}],
                data: allowedVals
            });
            var suggest = new SailPoint.Suggest({
                store: store,
                displayField: 'displayName',
                valueField: 'nativeIdentity',
                getSuggestTpl: function(displayField) {
                    return '<tpl for=".">' +
                             '<div class="baseSearch">' +
                               '<div class="sectionHeader">{[(values.displayName) ? Ext.String.htmlEncode(values.displayName) : Ext.String.htmlEncode(values.nativeIdentity)]}</div>' +
                               '<div class="indentedColumn">{nativeIdentity:htmlEncode}</div>' +
                             '</div>' +
                           '</tpl>';
                }
            });
            
            // Our input fields have issues with dynamic IDs.  Instead we'll
            // give them unique classes and find them in the DOM.
            var inputField =
                Ext.DomQuery.selectNode('.accountSelector_' + acctSel.applicationId);
            var inputFieldName = inputField.id;
            
            var multiSuggest = new SailPoint.MultiSuggest({
                id: acctSel.applicationId,
                value: acctSel.selectedNativeIdentities,
                suggest: suggest,
                renderTo: 'accountSelector_' + acctSel.applicationId,
                inputFieldName: inputFieldName,
                newlineDelimitedValue: true,
                disabled: disabled
            });
        }
    },

    /**
     * Save the account selections.
     */
    save: function() {
        // Prevent double submissions.
        if (this.submitted) {
            return false;
        }

        // Don't need to do anything - the multisuggest should copy the value and the
        // workflow will take care of validation.
        this.submitted = true;
        return true;
    }
});

/**
 * Return the singleton instance of AccountSelection.
 */
SailPoint.web.workitem.AccountSelection.getInstance = function(accountSelections) {
    if (!SailPoint.web.workitem.AccountSelection.instance) {
        SailPoint.web.workitem.AccountSelection.instance =
            new SailPoint.web.workitem.AccountSelection(accountSelections);
    }
    return SailPoint.web.workitem.AccountSelection.instance;
}
