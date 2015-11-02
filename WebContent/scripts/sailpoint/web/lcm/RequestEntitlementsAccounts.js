/* (c) Copyright 2011 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * A class that helps to render, validate, and submit the "request entitlements
 * accounts" page.  This allows selecting instances, native identities, and
 * whether new accounts should be created when requesting entitlements.
 */
Ext.define('SailPoint.LCM.RequestEntitlementsAccounts', {

    // The EntitlementIdentityGroup objects.
    identityGroups: null,

    // The RequestEntitlementsDetailsGroups.
    detailGroups: null,
    
    
    /**
     * Create and render the page for the given groups.
     */
    constructor: function(identityGroups) {
        this.identityGroups = identityGroups;
        this.detailGroups = [];

        this.render();
    },
    
    /**
     * Render the components for the page.
     */
    render: function() {
        for (var i=0; i<this.identityGroups.length; i++) {
            var group = new SailPoint.LCM.RequestEntitlementsDetailGroup(this.identityGroups[i]);
            this.detailGroups.push(group);
        }
    },

    /**
     * Validate that all fields have values.
     */
    validate: function() {
        var valid = true;
      
        for (var i=0; i<this.detailGroups.length; i++) {
            if (!this.detailGroups[i].validate()) {
                valid = false;
            }
        }

        return valid;
    },
    
    /**
     * Validate the input get the form ready for submission if all is well.
     * Return false if validation fails.
     */
    submit: function() {
        if (!this.validate()) {
            return false;
        }

        for (var i=0; i<this.detailGroups.length; i++) {
            this.detailGroups[i].submit();
        }

        return true;
    }
});


////////////////////////////////////////////////////////////////////////////////
//
// STATIC FUNCTIONS
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Initialize a singleton instance of this page.
 * 
 * @static
 */
SailPoint.LCM.RequestEntitlementsAccounts.initializePage = function(identityGroups) {
    SailPoint.LCM.RequestEntitlementsAccounts.INSTANCE =
        new SailPoint.LCM.RequestEntitlementsAccounts(identityGroups);
};

/**
 * Return the singleton instance of this page.  This will throw if initializePage
 * has not yet been called.
 * 
 * @static
 */
SailPoint.LCM.RequestEntitlementsAccounts.getInstance = function() {
    if (!SailPoint.LCM.RequestEntitlementsAccounts.INSTANCE) {
        throw "A RequestEntitlementsAccounts instance has not yet been created - call initializePage first.";
    }
    return SailPoint.LCM.RequestEntitlementsAccounts.INSTANCE;
};
