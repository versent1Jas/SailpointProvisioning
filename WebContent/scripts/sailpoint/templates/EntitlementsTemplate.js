/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

// This template accepts a JSON 'entitlement' object of the form:
// [{
//     name: 'profileName',
//     application: 'app',
//     rules: [{ rule: 'filterString', forRole: 'roleName or blank' }, { ... }]
//     permissions: [{rights: 'csvRightsString', target: 'targetString', forRole: 'roleName or blank'}, { ... }],
//     withRoleName: true | false
// }, { ...
// }]
Ext.ns('SailPoint', 'SailPoint.modeler');

SailPoint.modeler.RoleEntitlementsTemplate = new SailPoint.TemplateWithTooltips(
    '<tpl for="entitlements">',
      '<tpl if="editMode && id.length &gt; 0">',
        '<span style="float: right">',
          '<span style="padding: 12px" id="edit" class="smallFakeLink" onclick="$(\'editForm:editedProfileId\').value = \'{id}\'; $(\'editForm:editProfile\').click();">',
            '\[{parent.editI18n}\]',
          '</span>',
          '<span id="delete" style="padding: 12px" class="smallFakeLink" onclick="$(\'editForm:editedProfileId\').value = \'{id}\'; $(\'editForm:deleteProfile\').click();">',
            '\[{parent.deleteI18n}\]',
          '</span>',
        '</span>',
      '</tpl>',
      '<div class="spContent reRoundedContent">',
        '<tpl if="profileOrdinal &gt; 0">',
           '<span class="sectionHeader spContentBody">{parent.entitlementsHeaderI18n} {application} ({profileOrdinal})</span>',
        '</tpl>',
        '<tpl if="profileOrdinal &lt; 1">',
           '<span class="sectionHeader spContentBody">{parent.entitlementsHeaderI18n} {application}</span>',
        '</tpl>',
        '<tpl if="description.length &gt; 0">',
          '<img id="imgHlpProfile{id}Info" src="' + SailPoint.getRelativeUrl('/images/icons/info.png') + '" style="cursor:pointer; padding:0px 7px 0px 7px" alt="{description}"/>',
		'</tpl>',
        
        '<tpl if="rules.length &gt; 0">',
          '<div class="spContentBody">',
            '<div class="spLightBlueTabledContent">',
              '<table class="spLightBlueTable">',
                '<thead>',
                  '<tpl if="withRoleName">',
                    '<th>{parent.roleI18n}</th>',
                  '</tpl>',
                  '<th>{parent.ruleI18n}</th>',
                '</thead>',
                '<tbody>',
                  '<tpl for="rules">',
                    '<tr>',
                      '<tpl if="forRole.length &gt; 0">',
                        '<td>{forRole}</td>',
                      '</tpl>',
                      '<td>{rule}</td>',
                    '</tr>',
                  '</tpl>',
                '</tbody>',
              '</table>',
            '</div>',
          '</div>',
        '</tpl>',
        
        '<tpl if="permissions.length &gt; 0">',
          '<div class="spContentBody">',
            '<div class="spLightBlueTabledContent">',
              '<table class="spLightBlueTable">',
                '<thead>',
                  '<tpl if="withRoleName">',
                    '<th>Role</th>',
                  '</tpl>',
                  '<th><span>{parent.targetI18n}</span></th>',
                  '<th><span>{parent.rightsI18n}</span></th>',
                  '<tpl if="hasAnnotation">',
                    '<th><span>{parent.annotationI18n}</span></th>',
                  '</tpl>',
                '</thead>',
                '<tbody>',
                  '<tpl for="permissions">',
                    '<tr>',
                      '<tpl if="forRole.length &gt; 0">',
                        '<td>{forRole}</td>',
                      '</tpl>',
                      '<td><span>{target}</td>',
                      '<td><span>{rights}</span></td>',
                      '<tpl if="annotation.length &gt; 0">',
                        '<td><span>{annotation}</span></td>',
                      '</tpl>',
                    '</tr>',
                  '</tpl>',
                '</tbody>',
              '</table>',
            '</div>',
          '</div>',
        '</tpl>',
        
        '<tpl if="(!(rules.length &gt; 0)) &amp;&amp; (!(permissions.length &gt; 0))">',
          '<div class="spContentBody">',
            '<table class="spLightBlueTable">',
              '<tbody><tr><td><span>{parent.noEntitlementsMsg}</span></td></tr></tbody>',
            '</table>',
          '</div>',
        '</tpl>',
        
      '</div>',
    
    '</tpl>'
);


SailPoint.modeler.RoleSimpleEntitlementsTemplate = new SailPoint.TemplateWithTooltips(
    '<tpl if="entitlements.length &gt; 0">',
      '<div class="spLightBlueTabledContent">',
        '<span class="sectionHeader">Entitlements:</span>',
      
        '<table class="spBlueTable" border="1">',
          '<thead>',
            '<th>#{msgs.role_simple_entitlement_application_name_header}</th>',
            '<th>#{msgs.role_simple_entitlement_property_header}</th>',
            '<th>#{msgs.role_simple_entitlement_value_header}</th>',
          '</thead>',
          
          '<tbody>',
            '<tpl for="entitlements">',
              '<tr>',
                '<td>{applicationName}</td>',
                '<td>{property}</td>',
                '<td>{displayValue}',
                  '<tpl if="description.length &gt; 0">',
                    '<img id="imgHlpProfile{[xindex]}Info" src="' + SailPoint.getRelativeUrl('/images/icons/info.png') + '" style="cursor:pointer; padding:0px 7px 0px 7px" alt="{description}"/>',
                  '</tpl>',
                '</td>',
              '</tr>',
            '</tpl>',
          '</tbody>',
        '</table>',
      '</div>',
    '</tpl>'
);


SailPoint.modeler.I18nEntitlementsWrapper = {
    editI18n: '#{msgs.button_edit}',
    deleteI18n: '#{msgs.button_delete}',
    roleI18n: '#{msgs.role}',
    ruleI18n: '#{msgs.rule}',
    entitlementsHeaderI18n: new Ext.Template('#{msgs.text_entitlements_on_app}').apply(['']),
    targetI18n: '#{msgs.target}',
    rightsI18n: '#{msgs.rights}',
    annotationI18n: '#{msgs.annotation}',
    descriptionI18n: '#{msgs.description}',
    noEntitlementsMsg: '#{msgs.profile_is_blank}'
};

