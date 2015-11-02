/* (c) Copyright 2011 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * The CurrentEntitlementsGrid displays a grid with an identity's current
 * entitlements which can be removed.
 */
Ext.define('SailPoint.LCM.CurrentEntitlementsGrid', {

    ////////////////////////////////////////////////////////////////////////////
    //
    // FIELDS
    //
    ////////////////////////////////////////////////////////////////////////////
    
    // The ID of the identity.
    identityId: null,
    
    // An array of SailPoint.AccountRequest objects for the current requests.
    currentRequests: null,

    // Current entitlements grid.
    currentEntitlementsGrid: null,
    currentEntitlementsStore: null,
    
    // Virtual radio for removing current entitlements.
    vRadio: null,

    // Cache of entitlement id to a record
    recordCache: {},    

    ////////////////////////////////////////////////////////////////////////////
    //
    // CONSTRUCTOR
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Constructor - this should only be called by the static initializePage()
     * function.
     * 
     * @param  gridMetaData     The GridResponseMetaData object for the current
     *                          entitlements grid.
     * @param  currentRequests  An array of SailPoint.AccountRequest objects.
     * @param  currentIdentity  The ID of the identity to request for.
     */
    constructor: function(gridMetaData, currentRequests, currentIdentity) {
        this.identityId = currentIdentity;
        this.currentRequests = currentRequests;
        
       this.vRadio = new SailPoint.VirtualRadioButton('currentEntitlementsContainer', 'entitlementAction');

        this.currentEntitlementsStore = SailPoint.Store.createRestStore({
            fields: gridMetaData.fields,
            autoLoad: false,
            url: SailPoint.getRelativeUrl('/rest/identities/' + SailPoint.Utils.encodeRestUriComponent(this.identityId) + '/exceptions'),
            remoteSort: true,
            extraParams: { excludePermissions: true }
        });
        this.currentEntitlementsStore.on('load', function() { addDescriptionTooltips(); });

        this.currentEntitlementsGrid = new SailPoint.grid.PagingGrid({
            id: 'currentEntitlementsGrid',
            store: this.currentEntitlementsStore,
            cls: 'smallFontGrid wrappingGrid',
            gridMetaData : gridMetaData,
            width: $('currentEntitlementsContainer').clientWidth,
            loadMask: true,
            pageSize: 5,
            renderTo: 'currentEntitlementsContainer',
            usePageSizePlugin: true,
            viewConfig : {
                stripeRows: true
            },
            hideIfEmptyColumns: 'instance',
            columnResizers: {
                column: 'id',
                resizer: function() { return 33; }
            }
        });
        this.currentEntitlementsGrid.getView().on('refresh', function() { this.vRadio.updateRadios(); }, this);
        this.currentEntitlementsGrid.initialLoad();

        // The ImageRadio events don't always get attached correctly in IE.
        // Wait a short while and call this again to ensure they are setup.
        if (Ext.isIE) {
            new Ext.util.DelayedTask().delay(15, function() { this.vRadio.updateRadios(); }, this);
        }
    },

    
    ////////////////////////////////////////////////////////////////////////////
    //
    // GRID METHODS
    //
    ////////////////////////////////////////////////////////////////////////////
    
    switchEntitlementDescMode: function(showDescriptions) {
        this.currentEntitlementsGrid.store.getProxy().extraParams['showEntitlementDescriptions'] = showDescriptions;
        switchEntitlementDescriptionStyle(showDescriptions);
    },

    entitlementRadioSelected: function(radio) {
        this.vRadio.radioSelected(radio);
        
        var radioInput = ImageRadio.getRadio(radio);
        
        var namePrefix = 'entitlementAction';
        
        var entitlementId = radioInput.name.substr(namePrefix.length);
        var record = this.currentEntitlementsStore.getById(entitlementId);
        
        if (record != null) {        
            this.recordCache[entitlementId] = record;
        }
    },

    
    ////////////////////////////////////////////////////////////////////////////
    //
    // VALIDATION AND SUBMISSION
    //
    ////////////////////////////////////////////////////////////////////////////
    
    /**
     * Return whether the user has tried to remove any entitlements.
     */
    hasChanges: function() {
        if (!this.vRadio) {
          return false;
        }
        return (this.vRadio.getChangedValues().keys().length > 0);
    },
    
    /**
     * Return all requests to remove entitlements.
     */
    getAccountRequests: function() {
        var requests = [];

        // Convert removals into account requests.
        if (this.vRadio) {
          var changes = this.vRadio.getChangedValues();
          if (changes) {
              changes.each(function(pair) {
                  var id = pair.key;
                  var op = pair.value;
                  
                  var record = this.currentEntitlementsStore.getById(id);
                  if (record == null) {
                      record = this.recordCache[id];
                  }
                  
                  if (record != null) {
                      var acctReq =
                          SailPoint.LCM.CurrentEntitlementsGrid.createAccountRequestFromEntitlement(op, record);                      
                      
                      requests.push(acctReq);
                  }
              }.bind(this));
          }
        }
        
        return requests;
    }
});


////////////////////////////////////////////////////////////////////////////////
//
// STATIC FUNCTIONS
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Create a SailPoint.AccountRequest from the given record from the current
 * entitlements store using the given operation for the attribute/permission
 * request.
 * 
 * @param  op      The operation to use for the attribute or permission request.
 * @param  record  The record from the current entitlements store to create the
 *                 AccountRequest from.
 *
 * @return A SailPoint.AccountRequest created from the given record from the
 *         current entitlements store.
 *
 * @static
 */
SailPoint.LCM.CurrentEntitlementsGrid.createAccountRequestFromEntitlement = function(op, record) {
    
    var request = new SailPoint.AccountRequest();
    request.application = record.get('application');
    request.instance = record.get('instance');
    request.nativeIdentity = record.get('nativeIdentity');
    request.operation = 'Modify';

    var req = null;
    var attrName = record.get('attribute');
    var permTarget = record.get('permissionTarget');
    if (null !== attrName) {
        req = new SailPoint.AttributeRequest();
        req.name = attrName;
        req.valueXmlAttribute = record.get('value');
    }
    else if (null !== permTarget) {
        req = new SailPoint.PermissionRequest();
        req.name = permTarget;
        req.valueXmlAttribute = record.get('permissionRight');
    }
    else {
        throw 'No attribute or permission information: ' + record.getId();
    }

    req.operation = op;
    request.addAttribute(req);

    return request;
};

/**
 * Return whether the given record from the current entitlements store matches
 * the given SailPoint.AccountRequest.
 * 
 * @param  record   The record from the current entitlements store.
 * @param  acctReq  The SailPoint.AccountRequest to compare to the record.
 * 
 * @return True if the record matches the account request, false otherwise.
 * 
 * @static
 */
SailPoint.LCM.CurrentEntitlementsGrid.accountRequestMatchesEntitlement = function(record, acctReq) {
    var fromRecord = SailPoint.LCM.CurrentEntitlementsGrid.createAccountRequestFromEntitlement(null, record);
    return fromRecord.matches(acctReq);
};


////////////////////////////////////////////////////////////////////////////////
//
// RENDERERS
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Render the radio buttons for the current entitlements table.
 * 
 * @static
 */
SailPoint.LCM.CurrentEntitlementsGrid.buttonRenderer = function(val, p, r) {

    var radioValues = [{ label: 'Remove', value: 'revokeAccountRadio' }];
    var config = {
        onclick: function() {
            return "SailPoint.LCM.RequestEntitlementsPage.getInstance().currentEntitlementRadioSelected(this)";
        },
        selected: function(label, value, record) {
            var acctReq =
                SailPoint.AccountRequest.findMatching(
                    record,
                    SailPoint.LCM.RequestEntitlementsPage.getInstance().currentRequests,
                    SailPoint.LCM.CurrentEntitlementsGrid.accountRequestMatchesEntitlement);
            var currentOp = (null !== acctReq) ? acctReq.getAttributeOrAccountOperation() : null;
            return (label === currentOp);
        }
    };
    return ImageRadio.render(radioValues, 'entitlementAction', config, r);
};

/**
 * Render the display name of the account - fallback to nativeIdentity if it is
 * null.
 * 
 * @static
 */
SailPoint.LCM.CurrentEntitlementsGrid.displayNameRenderer = function(value, p, r) {
    if (null === value) {
        return r.get('nativeIdentity');
    }
    return value;
};

/**
 * Render the attribute column with an entitlement description (if dealing with
 * a permission) in the current entitlements table.
 * 
 * @static
 */
SailPoint.LCM.CurrentEntitlementsGrid.attributeRenderer = function(value, p, r) {

    // If this is a permission, show the target with a description.
    var permTarget = r.get('permissionTarget');
    if (permTarget) {
        return SailPoint.LCM.CurrentEntitlementsGrid.renderValueAndDescription(permTarget, r);
    }
    return value;
};

/**
 * Render the value column with an entitlement description in the current
 * entitlements table.
 * 
 * @static
 */
SailPoint.LCM.CurrentEntitlementsGrid.displayValueRenderer = function(value, p, r) {
    return SailPoint.LCM.CurrentEntitlementsGrid.renderValueAndDescription(value, r);
};

/**
 * Render the given value with a description (if available).  The description
 * will be displayed initially if 'showDescriptionFirst' in the record is true.
 */
SailPoint.LCM.CurrentEntitlementsGrid.renderValueAndDescription = function(value, r) {

    var formatted = value;

    var descriptionFirst = r.get('showDescriptionFirst');
    var desc = r.get('description');

    if (null !== desc) {
        var displayNone = ' style="display: none" ';
    
        var tpl = '<span class="font10 {0}" {1} id="{4}_'+r.id+'">'
                  +'<span style="display:none">{3}</span>'
                  +'{3}<img style="margin-left:2px" src="' + SailPoint.CONTEXT_PATH + '/images/icons/info.png" height="14px" width="14px"/>'
                  +'</span>';
        
        var formattedVal = Ext.String.format(tpl, "entitlementValues", (descriptionFirst) ? displayNone : '', desc, value, 'name');
        var formattedDesc = Ext.String.format(tpl, "entitlementDescriptions", (descriptionFirst) ? '' : displayNone, value, desc, 'description');
        formatted = '<div style="display: inline">' + formattedVal + formattedDesc + '</div>';
    }

    return formatted;
};
