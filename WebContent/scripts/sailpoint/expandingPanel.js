/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/* Any file that makes use of the expandingPanel.xhtml template needs to include this. */
Ext.ns('SailPoint');

SailPoint.expanderLock = false;

SailPoint.initExpanders = function(formName) {
    var expandPanels = Ext.DomQuery.select('div[class*=baseWindow expandPanel]'),
        expandPanel,
        expandContent,
        expandButton,
        i;
    
    // Sometimes it's in a <ui:fragment> that wasn't rendered and other times there are multiples
    if (expandPanels && expandPanels.length > 0) {
        for (i = 0; i < expandPanels.length; ++i) {
            expandPanel = expandPanels[i];
            expandContent = Ext.DomQuery.selectNode('div[class*=expandPanelBody]', expandPanel);
            expandButton = Ext.DomQuery.selectNode('img[class=dashContentExpandBtn]', expandPanel);
            if (expandButton) {
                SailPoint.initExpander(expandButton, expandContent);
            }
        }
    }
}
    
SailPoint.initExpander = function(expandButton, expandContent) {
    Event.observe(
            expandButton, 'click',
            function (e) {
              var contentVisible = false;
              if(!SailPoint.expanderLock){
                SailPoint.lockExpander();
                
                // Check if the content is visible prior to starting the blind
                // effect.  If it is visible now it won't be after the toggle,
                // so negate isVisible().
                contentVisible = !Ext.fly(expandContent).isVisible();
                Effect.toggle(expandContent, 'Blind', {duration: '0.5'});

                if (!contentVisible) {
                    expandButton.src = CONTEXT_PATH + "/images/icons/plus.png";
                }
                else {
                    expandButton.src = CONTEXT_PATH + "/images/icons/minus.png";
                }

                setTimeout(SailPoint.unlockExpander, 500);
              }
            },   
            false    
          );
}

SailPoint.lockExpander = function() {
    SailPoint.expanderLock = true;
}

SailPoint.unlockExpander = function() {
    SailPoint.expanderLock = false;
}
