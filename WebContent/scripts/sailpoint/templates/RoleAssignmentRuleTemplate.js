/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

// This template accepts a JSON 'selector' object of the form:
// {
//     selectorI18n: 'Assignment Rule'
//     selectorType: 'matchList',
//     selectorDescription: 'A string represenation of the match list',
//     selectorContents: 'Some Contents'
// }
Ext.ns('SailPoint', 'SailPoint.modeler');

SailPoint.modeler.RoleAssignmentRuleTemplate = new Ext.XTemplate(
  '<div class="spContent reRoundedContent">',
    '<tpl if="!roleView">',
      '<span class="sectionHeader spContentBody">{selectorI18n}</span>',
    '</tpl>',
    '<div class="spContentBody">',
      '<div class="spLightBlueTabledContent">',
        '<table class="spLightBlueTable">',
          '<thead><th>{selectorDescription}</th></thead>',
          '<tbody><tr><td>{selectorContents}</td></tr></tbody>',
        '</table>',
      '</div>',
    '</div>',
  '</div>'
);
