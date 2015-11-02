/* (c) Copyright 2011 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.component.NameWithTooltip');

/**
 * Return the HTML to render a name with a tooltip.
 * 
 * @param name     The name to display.
 * @param tooltip  The text for the tooltip.
 */
SailPoint.component.NameWithTooltip.getTooltipHtml = function(name, tooltip) {
    return '<span style="" class="nameWithTooltip">' +
           '<span style="display:none">' + tooltip + '</span>' +
           name +
           '<img width="14px" height="14px" src="' + SailPoint.getRelativeUrl("/images/icons/info.png") +  '" style="vertical-align:middle; margin-left:2px"/></span>';
};

/**
 * Register all NameWithTooltip-rendered tooltips on the page as Ext.QuickTips.
 */
SailPoint.component.NameWithTooltip.registerTooltips = function() {
    if(Ext.isIE) {
        var tooltipTask = new Ext.util.DelayedTask( 
            SailPoint.component.NameWithTooltip.reallyRegisterTooltips, this
        );
        tooltipTask.delay(1000);
    }
    else {
        SailPoint.component.NameWithTooltip.reallyRegisterTooltips();
    }
};

SailPoint.component.NameWithTooltip.reallyRegisterTooltips = function() {
    var values = Ext.DomQuery.select('.nameWithTooltip img');

    if (null != values) {
        // Some tooltips contain long text that does not wrap (eg - a DN), so
        // increase the maxWidth so that we will show all of it.
        Ext.apply(Ext.QuickTips.getQuickTip(), {
            maxWidth: 500
        });

        for (var i = 0; i < values.length; i++) {
            var current = values[i];
            var parent = current.parentNode;
            var child = parent.firstChild;

            if (child) {
                Ext.QuickTips.register({
                    target: Ext.Element.get(current),
                    text: child.innerHTML
                });
            }
        }
    }
};
