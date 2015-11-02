/* (c) Copyright 2010 SailPoint Technologies, Inc., All Rights Reserved. */
Ext.ns('SailPoint', 'SailPoint.Role', 'SailPoint.Role.Mining');

/**
 * This template consumes entitlements in this format:
 * <code>
 *     entitlements: [{
 *         applicationId: 'xxxxxx',
 *         application: 'App1',
 *         entitlementAttributes: [{
 *             id: 'xxxxxx',
 *             displayName: 'Entitlement1'
 *         },{
 *             id: 'xxxxxx',
 *             displayName: 'Entitlement2'
 *         },...] 
 *     },{
 *         applicationId: 'xxxxxx',
 *         application: 'App2',
 *         entitlementAttributes: [...]
 *     }, ...]
 * </code>
 */
SailPoint.Role.Mining.EntitlementsTemplate = new Ext.XTemplate(
    '<table class="spTable" style="width: 350px;"><thead>',
    '<tr><th colspan="2">#{msgs.role_mining_entitlements_to_exclude}</th></tr>',
    '</thead></table>',
    '<tpl if="this.isFixedHeight(entitlements)">',
      '<div style="height:151px; width: 350px; border-bottom: solid #CCCCCC 1px; overflow: auto">',
      '<table class="spTable" style="height:150px; border-bottom: none"><tbody style="height:150px">',
    '</tpl>',
    '<tpl if="!this.isFixedHeight(entitlements) && this.isHideBorder(entitlements)">',
      '<div style="height:151px; width: 350px; border-bottom: solid #CCCCCC 1px; overflow: auto">',
      '<table class="spTable" style="border-bottom: none"><tbody>',
    '</tpl>',
    '<tpl if="!this.isFixedHeight(entitlements) && !this.isHideBorder(entitlements)">',
      '<div style="height:151px; width: 350px; overflow: auto">',
      '<table class="spTable"><tbody>',
    '</tpl>',
    '<tpl if="entitlements.length == 0">',
        '<tr><td colspan="2" style="padding:0px">',
          '<div style="height:116px; padding:0px; vertical-align: center"/>',
            '<ul style="margin-top:32px"><li class="formInfo">#{msgs.role_mining_no_entitlements_excluded}</li></ul>',
          '</div>',
        '</td></tr>',
    '</tpl>',
    '<tr><td><ul style="display:inline">',
      '<tpl for="entitlements">',
          '<li style="display:inline; list-style:none"><div class="sectionHeader">#{msgs.application}: {application}</div></li>',
          '<tpl for="entitlementAttributes">',
            '<li style="display:inline"><a href="#" onclick="Ext.getCmp(\'itRoleMiningPanel\').includeEntitlement(&#123;',
                'application: \'{parent.applicationId}\',',
                'name: \'{displayName}\'',
                '&#125;);"><div>',
                '<span style="width:16px; padding:3px">',
                    '<img src="' + SailPoint.getRelativeUrl('/images/icons/remove_grey_12.png') + '" ',
                         'onmouseover="this.src=\'' + SailPoint.getRelativeUrl('/images/icons/remove_12.png') + '\';" ',
                         'onmouseout="this.src=\'' + SailPoint.getRelativeUrl('/images/icons/remove_grey_12.png') + '\';" ',
                         'width="12" height="12"/>',
                '</span>',
                '<span style="padding:3px">{displayName}</span>',
            '</div></a><//li>',
        '</tpl>',
      '</tpl>',
    '</ul></td></tr>',
    '</tbody></table>',
  '</div>', {
      isFixedHeight: function(entitlements) {
          var i;
          var j;
          var rowCount = 0;
          var isFixedHeight;
          
          for (i = 0; i < entitlements.length; ++i) {
              rowCount++;
              if (entitlements[i].entitlementAttributes) {
                  rowCount += entitlements[i].entitlementAttributes.length;
              }
          }
          
          if (Ext.isIE) {
              isFixedHeight = rowCount > 6;
          } else {
              isFixedHeight = rowCount > 7;
          }
          
          return isFixedHeight;
      },
      
      isHideBorder: function(entitlements) {
          var i;
          var j;
          var rowCount = 0;
          var isHideBorder;
          
          for (i = 0; i < entitlements.length; ++i) {
              rowCount++;
              if (entitlements[i].entitlementAttributes) {
                  rowCount += entitlements[i].entitlementAttributes.length;
              }
          }
          
          if (Ext.isIE) {
              isHideBorder = rowCount > 6;
          } else {
              isHideBorder = rowCount > 7;
          }
          
          return isHideBorder;
      }
  }
);


/**
 * This template is used for role creation.  Originally I was going to reuse the one 
 * above but this use case was different enough to make the amount of special casing
 * intolerable.  This template consumes entitlements in this format:
 * <code>
 * {
 *     entitlements: [{
 *         applicationId: 'xxxxxx',
 *         application: 'App1',
 *         entitlementAttributes: [{
 *             name: 'Entitlement1',
 *             explanation: 'Optional Description of entitlement',
 *             isMulti: true,
 *             value: 'entitlementValue'
 *         },{
 *             name: 'Entitlement2',
 *             explanation: 'Optional Description of entitlement',
 *             isMulti: true,
 *             value: 'entitlementValue'
 *         },...],
 *         permissions: [{
 *             target: 'Target1',
 *             rights: ['right1', 'right2', ...]
 *         },{
 *             target: 'Target2'
 *             rights: [...]
 *         }, ...] 
 *     },{
 *         applicationId: 'App2',
 *         entitlementAttributes: [...],
 *         permissions: [...] 
 *     }, ...]
 * }
 * </code>
 */
SailPoint.Role.Mining.RoleCreationEntitlementsTemplate = new Ext.XTemplate(
    '<tpl if="this.isIncludeTitle(title)">',
        '<table class="spTable entitlementsTitleTable" style="width:350px"><thead>',
        '<tr><th colspan="2">{title}</th></tr>',
        '</thead></table>',
    '</tpl>',
    '<div class="entitlementsBodyTableWrapper" style="height:150px; width: 350px; border-bottom: solid #CCCCCC 1px; background-color: #FFFFFF; overflow: auto">',
    '<table class="spTable entitlementsBodyTable" style="height:150px;"><tbody style="height:150px">',
    '<tpl if="entitlements.length == 0">',
      '<tr><td colspan="2" style="padding:0px;">',
        '<div style="height:116px; padding:0px; vertical-align: center"/>',
          '<ul style="margin-top:32px"><li class="formInfo">#{msgs.role_mining_no_entitlements_to_create_from}</li></ul>',
        '</div>',
      '</td></tr>',
    '</tpl>',
    '<tpl for="entitlements">',
      '<tr style="height:30px"><td colspan="2"><span class="sectionHeader">#{msgs.application}: {application}</span></td></tr>',
      '<tpl for="entitlementAttributes">',
        '<tr style="height:30px">',
          '<tpl if="this.isEditable(parent)">',
          '<td style="width:16px"><div>',
            '<a href="#" onclick="Ext.getCmp(\'{parent.selectorId}\').removeEntitlement(&#123;',
              'application: \'{parent.applicationId}\',',
              'name: \'{name}\',',
              'value: \'{value}\'',
              '&#125;);">',
              '<img src="' + SailPoint.getRelativeUrl('/images/icons/remove_grey_12.png') + '" ',
                'onmouseover="this.src=\'' + SailPoint.getRelativeUrl('/images/icons/remove_12.png') + '\';" ',
                'onmouseout="this.src=\'' + SailPoint.getRelativeUrl('/images/icons/remove_grey_12.png') + '\';" ',
                'width="12" height="12"/>',
            '</a>',
         '</div></td>',
         '</tpl>',
         '<td>',
           '<span>{displayName}</span>',
             '<tpl if="this.explanationIsNotNull(parent)">',
             '<img id="{parent.applicationId}App{name}Entitlement{value}Value:imgHlp" ',
               'src="' + SailPoint.getRelativeUrl('/images/icons/info.png') + '" ',
               'class="helpIcon" alt="#{msgs.help}"',
               'title="{explanation}"/>',
             '</tpl>',
          '</td>',
        '</tr>',
      '</tpl>',
      '<tpl for="permissions">',
        '<tr style="height:30px">',
          '<tpl if="this.isEditable(parent)">',
          '<td style="width:16px"><div>',
            '<a href="#" onclick="Ext.getCmp(\'{parent.selectorId}\').removeEntitlement(&#123;',
              'application: \'{parent.applicationId}\',',
              'target: \'{target}\',',
              'rights: &#91;',
              '<tpl for="rights">',
                '\'{.}\'',
                '{[xindex < xcount ? "," : ""]}',
              '</tpl>',
              '&#93;',
              '&#125;);">',
              '<img src="' + SailPoint.getRelativeUrl('/images/icons/remove_grey_12.png') + '" ',
                'onmouseover="this.src=\'' + SailPoint.getRelativeUrl('/images/icons/remove_12.png') + '\';" ',
                'onmouseout="this.src=\'' + SailPoint.getRelativeUrl('/images/icons/remove_grey_12.png') + '\';" ',
                'width="12" height="12"/>',
            '</a>',
          '</div></td>',
          '</tpl>',
          '<td>#{msgs.role_mining_permissions_for} {target}',
            '<tpl if="this.hasRights(rights)"> : ',
              '<tpl for="rights">',
                '\'{.}\'',
                '{[xindex < xcount ? ", " : ""]}',
              '</tpl>',
            '</tpl>',
          '</td>',
        '</tr>',
      '</tpl>',
    '</tpl>',
  '</tbody></table>', {
    explanationIsNotNull: function(entitlement) {
        return entitlement.explanation && entitlement.explanation.length && entitlement.explanation.length > 0;
    },
    
    isEditable: function(entitlement) {
        return !entitlement.readOnly;
    },
    
    isIncludeTitle: function(title) {
        return !(title === null);
    },
    
    hasRights: function(rights) {
        return rights != null && rights.length > 0 && rights[0] != "null";
    }
  }
);

Ext.define('SailPoint.Role.Mining.EntitlementsSelector', {
	extend : 'Ext.Component',
    constructor: function(config) {
        if (config.binding) {
            this.binding = config.binding;
            this.entitlementsObj = Ext.JSON.decode($(this.binding).value); 
            this.readOnly = false;
        } else {
            this.entitlementsObj = { entitlements: [] };
            this.readOnly = true;            
        }
        this.selectorDisplay = config.selectorDisplay;
        SailPoint.Role.Mining.EntitlementsSelector.superclass.constructor.apply(this, arguments);
    },

    update: function(newEntitlementsObj, title) {
        var numEntitlements;
        var encoding;
        var i;
        
        if (newEntitlementsObj) {
            // Let's not mess with the original.  Make a local copy of the object instead.
            // I'm being lazy, so instead of manually creating a copy method I'm going to 
            // inefficiently encode and decode the object to create a copy.  We needed to
            // encode the object anyways to update the binding, so we might as well do it here.
            // --Bernie
            encoding = Ext.JSON.encode(newEntitlementsObj);
            this.entitlementsObj = Ext.JSON.decode(encoding);
            if (title) {
                this.entitlementsObj.title = title; 
            } else {
                this.entitlementsObj.title = '#{msgs.role_mining_entitlements_to_include}';
            }
            numEntitlements = this.entitlementsObj.entitlements.length;
            for (i = 0; i < numEntitlements; ++i) {
                // The template won't read more than one level above while iterating so we have
                // to attach this information to the entitlements object down a level.  It's not
                // pretty, but it's necessary --Bernie
                this.entitlementsObj.entitlements[i].readOnly = this.readOnly ? true : false;
                this.entitlementsObj.entitlements[i].selectorId = this.getId();
            }
            
            if (this.binding) {
                $(this.binding).value = encoding;
            }
        }
        SailPoint.Role.Mining.RoleCreationEntitlementsTemplate.overwrite(this.selectorDisplay, this.entitlementsObj);
    },
    
    /* @param entitlementToRemove {Object}
     * application - ID of the application to which the entitlement belongs
     * name - entitlement's attribute name (if this is an attribute-based entitlement)
     * value - entitlement's value (if this is an attribute-based entilement)
     * target - entitlement's target (if this is a permission-based entitlement)
     * right - entitlement's right (if this is a permission-based entitlement)
     */
    removeEntitlement: function(entitlementToRemove) {
        var entitlements = this.entitlementsObj.entitlements;
        var appId = entitlementToRemove.application;
        var indexOfEntitlementToRemove = -1;
        var indexOfApplicationToRemove = -1;
        var entitlementAttributes;
        var permissionAttributes;
        var i;
        var j;
        
        for (i = 0; i < entitlements.length; ++i) {
            if (appId == entitlements[i].applicationId) {
                // This is the app to which the entitlement belongs
                if (entitlementToRemove.name) {
                    entitlementAttributes = entitlements[i].entitlementAttributes;
                    for (j = 0; j < entitlementAttributes.length; ++j) {
                        if (entitlementAttributes[j].name == entitlementToRemove.name && 
                            entitlementAttributes[j].value == entitlementToRemove.value) {
                            indexOfEntitlementToRemove = j;
                        }
                    }
                    if (indexOfEntitlementToRemove > -1) {
                        entitlementAttributes.splice(indexOfEntitlementToRemove, 1);
                    }
                } else if (entitlementToRemove.target) {
                    permissionAttributes = entitltments[i].permissionAttributes;
                    for (j = 0; j < entitlementAttributes[j]; ++j) {
                        if (permissionAttributes[j].name == entitlementToRemove.name && 
                            permissionAttributes[j].value == entitlementToRemove.value) {
                            indexOfEntitlementToRemove = j;
                        }
                    }
                    if (indexOfEntitlementToRemove > -1) {
                        permissionAttributes.splice(indexOfEntitlementToRemove, 1);
                    }
                }
                
                // If nothing is left in this application let's not show it anymore
                if ((!entitlements[i].entitlementAttributes || entitlements[i].entitlementAttributes.length == 0) && 
                    (!entitlements[i].permissionAttributes || entitlements[i].permissionAttributes.length == 0)) {
                    indexOfApplicationToRemove = i;
                }
            }
        }
        
        if (indexOfApplicationToRemove > -1) {
            entitlements.splice(indexOfApplicationToRemove, 1);
        }
        
        this.update(this.entitlementsObj);
    }
});

/* Sort an array of included entitlements that has this form:
 * [{
 *     application: 'appName',
 *     applicationId: 'appId',
 *     entitlementAttributes: [{
 *         id: 'attributeId',
 *         displayName: 'attributeDisplayName'
 *     }, {
 *         ...
 *     }]
 * },{
 *     ...
 * }]
 * 
 * The top level array is sorted by application and the entitlementAttributes array is sorted by displayName
 */

SailPoint.Role.Mining.sortIncludedEntitlements = function(entitlements) {
    var i;
    var attributes;
    
    if (entitlements && entitlements.length > 1) {
        entitlements.sort(function(entitlementObj1, entitlementObj2) {
            return entitlementObj1.application.localeCompare(entitlementObj2.application);
        });
        
        for (i = 0; i < entitlements.length; ++i) {
            attributes = entitlements[i].entitlementAttributes;
            if (attributes && attributes.length > 1) {
                attributes.sort(function(attributeObj1, attributeObj2) {
                    return attributeObj1.displayName.localeCompare(attributeObj2.displayName);
                });
            }
        }
    }
};
