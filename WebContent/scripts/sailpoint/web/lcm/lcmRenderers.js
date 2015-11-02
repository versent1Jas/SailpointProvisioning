Ext.ns('SailPoint', 
       'SailPoint.LCM.SummaryChanges',
       'SailPoint.LCM.Request',
       'SailPoint.LCM.RequestAccess');

SailPoint.LCM.RequestAccess.renderType = function(value, metaData, record) {
  var formatString = '<span class="{0}" style="padding-left: 20px;">{1}</span>';
  
  return Ext.String.format(formatString, record.raw.roleTypeIcon, record.raw.roleTypeName);
};

SailPoint.LCM.RequestAccess.scoreRenderer = function(value, p, record) {
  
  if(value=='null' || !value) {
    return '';
  }
  var str = '<div class=\'riskIndicator ri_{0}\'>{1}</div>';
  var color = record.data['IIQ_color'];
  return Ext.String.format(str, color, value);
};

SailPoint.LCM.RequestAccess.defaultRenderer = function(value, p, record) {
  return value;
}

/**
 * The statusRenderer function appears to have been lost at some point because
 * it is not defined, yet we ship multiple column configs that specify it. This
 * was causing some issues with HTML rendering. For now, just set it to the default
 * renderer and it can be customized in the future if necessary.
 */
SailPoint.LCM.RequestAccess.statusRenderer = SailPoint.LCM.RequestAccess.defaultRenderer;

/** Renderers **/
SailPoint.LCM.RequestAccess.currentAccessButtonRenderer = function(value, metadata, record, rowIndex) {
    var status = record.get('IIQ_status_class');
    if ((status && status === 'requested') || record.get('removable') === false) {
        return '';
    }
    else {
        return '<div class="remover" onclick="Ext.getCmp(\'requestAccessCurrentAccessGrid\').deassign(\''+record.getId()+'\','+rowIndex+')"></div>';
    }
};

//Adds 'expando' details link to the permitted roles view
SailPoint.LCM.RequestAccess.roleDetailRenderer = function(value, p, r) {
  var roleId = Ext.isEmpty(r.data.roleId) ? r.getId() : r.data.roleId,
      assignmentId = r.data.assignmentId;
  var roleType = r.raw['detectedOrAssigned'];
  
  if(r.get('IIQ_raw_type') == SailPoint.LCM.RequestAccess.OBJECT_TYPE_ROLE) {
    value = Ext.String.format('<a href="javascript:SailPoint.RoleDetailPanel.window(\'{0}\', \'{1}\', \'{2}\', true, null, \'{3}\')" title="#{msgs.info_role_composition}">{4}</a>', assignmentId, roleId, r.raw.identityId, roleType, Ext.String.htmlEncode(value));
  } 
  if(value && r.get('description')) {
    value = SailPoint.component.NameWithTooltip.getTooltipHtml(value, r.get('description'));
  }
  return value;
};

SailPoint.LCM.RequestAccess.renderScore = function(value, metadata, record, rowIndex) {
  var str = '<div class=\'riskIndicator ri_{0}\'>{1}</div>';
  var color = record.get('IIQ_color');
  return Ext.String.format(str, color, value);
};

SailPoint.LCM.SummaryChanges.renderScore = function(value, metadata, record, rowIndex) {
  var str = '<div class=\'riskIndicator ri_{0}\'>{1}</div>';
  var color = record.get('IIQ_color');
  return Ext.String.format(str, color, value);
};

SailPoint.LCM.SummaryChanges.nameRenderer = function(value, p, r) {
  
  var displayName = r.get('displayableName');
  if(!displayName) {
    displayName = r.get('name');
  }

  displayName = Ext.String.htmlEncode(displayName);
  
  var name = Ext.String.format('<div class="lcmNameTitle">{0}</div>', SailPoint.component.NameWithTooltip.getTooltipHtml(displayName, r.get('description')));
  if(r.get('activation_pretty')) {
    name+=Ext.String.format('<span class="sunrise"><strong>#{msgs.lcm_summary_role_activation}:</strong> {0}</span>', r.get('activation_pretty'));
  }
  if(r.get('deactivation_pretty')) {
    name+=Ext.String.format('<span class="sunset"><strong>#{msgs.lcm_summary_role_deactivation}:</strong> {0}</span>', r.get('deactivation_pretty'));
  }
  // show account display name instead of native identity
  if(r.raw['accountName']) {
  	name+=Ext.String.format('<span class="sunset property"><strong>#{msgs.label_account}:</strong> {0}</span>', r.raw['accountName']);
  }
  if(r.get('attribute')) {
    name+=Ext.String.format('<span class="sunset property"><strong>#{msgs.attribute}:</strong> {0}</span>', r.get('attribute'));
  }
  if(r.get('application') && r.get('application')!='IIQ') {
    name+=Ext.String.format('<span class="sunset property"><strong>#{msgs.application}:</strong> {0}</span>', r.get('application'));
  }

  //name += Ext.String.format('<p>{0}</p>', r.get('description'));
  return name;
};

SailPoint.LCM.SummaryChanges.renderAccount = function(value, p, r) {

    if (null === value || 'new' == value) {
        return '<div class="lcmNewAccount">#{msgs.lcm_request_entitlements_summary_new_account}</div>';
    }
    return value;
};

SailPoint.LCM.SummaryChanges.buttonRenderer = function(value, p, r) {
  return '<div class="remover" onclick="SailPoint.LCM.SummaryChanges.removeRequest(\''+r.getId()+'\')"></div>';
};

SailPoint.LCM.SummaryChanges.editDetailsRenderer = function(value, p, r) {
  if(r.get('updateable')) {
    return '<span class="edit_details unboldFakeLink" onclick="SailPoint.LCM.SummaryChanges.editDetails(\''+r.getId()+'\')">' +
      "#{msgs.lcm_summary_edit_details}</span>";
  }
  return '';
};

SailPoint.LCM.SummaryChanges.actionRenderer = function(value, p, r) {
    var markup = value;
    
    if (value === 'Add') {
        markup = '<div class="lcm-op-Create">#{msgs.lcm_summary_action_add}</div>';
    } else if (value === 'Remove') {
        markup = '<div class="lcm-op-Delete">#{msgs.lcm_summary_action_remove}</div>';
    } else if (value === 'Delete') {
        markup = '<div class="lcm-op-Delete">#{msgs.lcm_summary_action_delete}</div>'; 
    }
    return markup;
};


SailPoint.LCM.SummaryChanges.renderAction = function(value, p, r) {
  return Ext.String.format('<div class="lcm-op lcm-op-{1}">{0}</div>', value, r.get('op'));
};

SailPoint.LCM.SummaryChanges.renderEntitlementAction = function(value, p, r) {
  return Ext.String.format('<div class="lcm-op lcm-op-{1}">{0}</div>', value, r.get('attributeOp'));
};

SailPoint.LCM.SummaryChanges.renderDescription = function(value, p, r) {
    // Descriptions may contain HTML.  The default column renderer HTML encodes
    // values, which causes them to show up as the actual tags.  Just return the
    // value to disable HTML encoding.
    return value;
};

SailPoint.LCM.SummaryChanges.renderIdentityRemover = function(value, p, r) {

  var removeButton =
    '<a href="#" ' +
    'onclick="SailPoint.LCM.SummaryChanges.removeIdentity(\''+r.getId()+'\'); return false;" />' +
    '<img src="' + SailPoint.getRelativeUrl('/images/icons/remove_grey_18.png') + '" ' +
    'onMouseOver="this.src=\'' + SailPoint.getRelativeUrl('/images/icons/remove_18.png') + '\'" ' +
    'onMouseOut="this.src=\'' + SailPoint.getRelativeUrl('/images/icons/remove_grey_18.png') + '\'" ' +
    'height="18" width="18" />' +
    '</a>';
  return removeButton;
};

SailPoint.LCM.SummaryChanges.renderPassword = function(value,p,r) {
    return Ext.util.Format.htmlDecode(value);
}

SailPoint.LCM.SummaryChanges.renderComments = function(value,p,r) {
  var comments = "";
  if(r.get('comments')) {
    // Need to encode the comments, so that someone can't enter insecure html
    comments = Ext.String.htmlEncode(r.get('comments'));
    return Ext.String.format(
        '<div style="white-space:normal !important;">'
          + '<a href="javascript:SailPoint.LCM.SummaryChanges.comment(\'{0}\')"><img src="'+SailPoint.CONTEXT_PATH+'/images/icons/comments_edit.png"/></a>'
        + '<span id="comment_text_{0}">{1}</span></div>', r.getId(), comments);
  } else {
    return Ext.String.format(
      '<div style="white-space:normal !important;">'
        + '<a href="javascript:SailPoint.LCM.SummaryChanges.comment(\'{0}\')"><img src="'+SailPoint.CONTEXT_PATH+'/images/icons/add.png"/></a>'
      + '</div>', r.getId(), r.get('comments'));
  }
};

SailPoint.LCM.SummaryChanges.renderAssignmentNote = function(value,p,r) {
  if (!r.raw["allowAssignmentNote"]) {
  	return "";
  }
  var assignmentNote = "";
  if(r.get('assignmentNote')) {
    // Need to encode the comments, so that someone can't enter insecure html
    assignmentNote = Ext.String.htmlEncode(r.get('assignmentNote'));
    return Ext.String.format(
        '<div style="white-space:normal !important;">'
          + '<a href="javascript:SailPoint.LCM.SummaryChanges.assignmentNote(\'{0}\')"><img src="'+SailPoint.CONTEXT_PATH+'/images/icons/comments_edit.png"/></a>'
        + '<span id="assignmentNote_text_{0}">{1}</span></div>', r.getId(), assignmentNote);
  } else {
    return Ext.String.format(
      '<div style="white-space:normal !important;">'
        + '<a href="javascript:SailPoint.LCM.SummaryChanges.assignmentNote(\'{0}\')"><img src="'+SailPoint.CONTEXT_PATH+'/images/icons/add.png"/></a>'
      + '</div>', r.getId(), r.get('assignmentNote'));
  }
};
