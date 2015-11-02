/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */
function getSelectedItemHidden(spanElement)
{
	return spanElement.parent().first("input[@type='hidden']");
}
function setSelectedValue(spanElement, val)
{
	getSelectedItemHidden(spanElement).dom.value = val;
}
function getSelectedValue(spanElement)
{
	return getSelectedItemHidden(spanElement).getValue();
}
function clickApprove(span)
{
	var spanElement = Ext.get(span);

	var selectedValue = getSelectedValue(spanElement);
	if (selectedValue == 'Unselected' || selectedValue == 'Reject')
	{
		spanElement.radioCls('selected');
		setSelectedValue(spanElement, 'Approve');
	}
}
function clickReject(span)
{
	var spanElement = Ext.get(span);

	var selectedValue = getSelectedValue(spanElement);
	if (selectedValue == 'Unselected' || selectedValue == 'Approve')
	{
		spanElement.radioCls('selected');
		setSelectedValue(spanElement, 'Reject');
	}
}
function checkAllItemsSelected()
{
	if (Ext.query("input[value='Unselected']").length > 0)
	{
		return false;
	}
	return true;
}
function showFinishAllMessage()
{
	Ext.get('finishAllItemsDiv').applyStyles({display:''});
}
function hideFinishAllMessage()
{
	Ext.get('finishAllItemsDiv').applyStyles({display:'none'});
}
function showUnsavedChangesMessage()
{
	Ext.get('unsavedChangesDiv').applyStyles({display:''});
}
function hideUnsavedChangesMessage()
{
	Ext.get('unsavedChangesDiv').applyStyles({display:'none'});
}
function checkBeforeComplete()
{
	if (checkAllItemsSelected() === true)
	{
		addComment('editForm:completeBtn', '#{msgs.button_complete}', '#{msgs.dialog_title_completion_comments}');
	}
	else
	{
		showFinishAllMessage();
	}
}
