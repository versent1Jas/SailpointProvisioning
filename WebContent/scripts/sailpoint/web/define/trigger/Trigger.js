Ext.ns('SailPoint.Define.Trigger.Trigger');

/**
 * The type of the IdentityTrigger for the certification event changed.  Hide
 * and show the appropriate fields.
 * 
 * @param  selectBox  The event type select box.
 */
SailPoint.Define.Trigger.Trigger.triggerTypeChanged = function(selectBox) {
    var selectedVal = selectBox.options[selectBox.selectedIndex].value;

    var attrChangeFields =
        $A([ $('attributeName'), $('oldAttributeFilter'), $('newAttributeFilter') ]);
    var managerFields =
        $A([ $('oldManagerFilter'), $('newManagerFilter') ]);
    var ruleFields =
        $A([ $('triggerRule') ]);

    _showOrHide(attrChangeFields, 'AttributeChange' === selectedVal);
    _showOrHide(managerFields, 'ManagerTransfer' === selectedVal);
    _showOrHide(ruleFields, 'Rule' === selectedVal);
};
