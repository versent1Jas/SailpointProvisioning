Ext.ns('SailPoint', 'SailPoint.Role', 'SailPoint.Role.Mining');

/*
 * {
 *     identityFilterType: <'attribute' or 'ipop'>,
 *     identityAttributes: [{                       // If identityFilterType is attribute, this is expected
 *         name: <attribute name>,
 *         value: <attribute value>
 *     },{
 *         name: <attribute name>,
 *         value: <attribute value>
 *     }, {...}],
 *     ipop: <ipop name>                            // If identityFilterType is ipop, this is expected
 * }  
 */

SailPoint.Role.Mining.IdentityFilter = new Ext.XTemplate(
    '<tpl if="this.isAttribute(identityFilterType)">',
      '<table class="spTable" style="background-color: #FFFFFF;"><thead><th colspan="2">#{msgs.title_identity_attributes}</th></thead><tbody>',
      '<tpl if="this.hasAttributes(identityAttributes)">',
        '<tpl for="identityAttributes">',
          '<tr><td>{name}</td><td>{value}</td></tr>',
        '</tpl>',
      '</tpl>',
      '<tpl if="!this.hasAttributes(identityAttributes)">',
        '<tr><td colspan="2">#{msgs.view_it_role_mining_filter_no_attributes}</td></tr>',
      '</tpl>',
    '</tpl>',
    '<tpl if="this.isIpop(identityFilterType)">',
      '<table class="spTable" style="background-color: #FFFFFF;"><thead><th>#{msgs.label_population}</th></thead><tbody>',
      '<tr><td>{ipop}</td></tr>',
    '</tpl>',
    '</tbody></table>',{
        isAttribute: function(filterType) {
            return filterType == "attribute";
        },
        isIpop: function(filterType) {
            return filterType == "ipop";
        },
        hasAttributes: function(attributes) {
            return attributes.length > 0;
        }
    }
);