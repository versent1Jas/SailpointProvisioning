/* (c) Copyright 2009 SailPoint Technologies, Inc., All Rights Reserved. */
Ext.ns('SailPoint', 'SailPoint.Role', 'SailPoint.Role.Mining');

SailPoint.Role.Mining.getTaskResultWindow = function() {
    var taskResultWindow = Ext.getCmp('taskResultViewerWindow');
    
    if (!taskResultWindow) {
        taskResultWindow = new SailPoint.Role.Mining.TaskResultViewer({
            id: 'taskResultViewerWindow',
            renderTo: 'taskResultViewerWindowDiv'
        });
    }
    
    taskResultWindow.alignTo(Ext.getCmp('roleTabPanel').getEl(), 't-t');
    
    return taskResultWindow;
}

/**
 * A task result viewing window that is shared between the Business and IT Role Mining panels
 */
Ext.define('SailPoint.Role.Mining.TaskResultViewer', {
    extend : 'Ext.window.Window',
    initComponent: function() {
        var currentPanel = this;
        SailPoint.Role.Mining.visibleAutomatedMiningNewRoleErrors = [];
        SailPoint.Role.Mining.visibleAutomatedMiningExistingRoleErrors = [];
        
        var roleTabPanel = Ext.get('roleTabPanel');
        
        var winHeight = roleTabPanel ? roleTabPanel.getHeight() : 500;

        Ext.apply(this, {
            title: '#{msgs.title_view_last_mining_result}',
            modal: false,
            draggable: true,
            closable: true,
            closeAction: 'hide',
            hidden: true,
            layout: 'fit',
            width: 660,
            height: winHeight,
            items: [ new Ext.Panel({
                id: 'resultViewerContent',
                autoScroll: true,
                width: 620,
                loader: {}
            })]
        });
        
        this.callParent(arguments);
    },

    /**
     * This will kick off a 3-part sequence of events:
     * Part 1:  Load the content panel if necessary
     * Part 2:  refreshTaskResults - Clicks a hidden a4j button to submit the task id and populate the contents with the results
     * Part 3:  finsihShowTaskResults - Apply styles to the rerendered content
     */
    showTaskResults: function(resultsToShow) {
        this.resultsToShow = resultsToShow;
        
        Ext.MessageBox.wait('#{msgs.loading_data}');
        
        if (!this.isLoaded) {
            var contentPanel = Ext.getCmp('resultViewerContent');
            contentPanel.getLoader().load({
                url: SailPoint.getRelativeUrl('/define/roles/automatedMining/viewTaskResults.jsf'),
                params: {TaskResultId: this.resultsToShow},
                callback:this.refreshTaskResults,
                scope: this,
                text: '#{msgs.loading_data}',
                scripts: false,
                ajaxOptions : {
                    disableCaching: false
                }
            });
            this.isLoaded = true;
        } else {
            this.refreshTaskResults();
        }
    },
    
    refreshTaskResults: function() {
        $('TaskResultId').value = this.resultsToShow;
        $('resultsViewingForm:refreshTaskResults').click();
    },
    
    finishShowTaskResults: function() {
        // Bernie -- Sorry to be so quick and dirty about this, but it was the fastest way to make this happen:
        var buttonsToHide = Ext.DomQuery.select('input[type=button]', $('taskResultsDetailsDiv'));
        var i;
        var buttonToHide;
        var body;
        var rowToHide;
        var rowElToHide;
        
        for (i = 0; i < buttonsToHide.length; ++i) {
            buttonToHide = Ext.get(buttonsToHide[i]);
            buttonToHide.setVisibilityMode(Ext.Element.DISPLAY);
            buttonToHide.setVisible(false);
        }
        
        // Bernie -- Another hack to work around Jasper's idiotic rendering.  The bottom row of the report
        // table contains a huge blank image that only serves to make an unneeded scrollbar appear
        if ($('resultsViewingForm:report')) {
            // Hack upon hack.  Need to do this in two steps because apparently traversing two levels 
            // twice in a row is too much to ask of IE8.  Without digging too deeply I suspect that it 
            // "helpfully" caches query results when more than one level is involved so we're rerendering 
            // the results out from under it via a4j.  Regardless of the cause, breaking the query into 
            // two steps makes it work correctly -- Bernie
            body = Ext.dom.Query.selectNode('table > tbody', $('resultsViewingForm:report'));
            rowToHide = Ext.dom.Query.selectNode('tr:last-child', body);
            rowElToHide = Ext.get(rowToHide);
            if (rowElToHide) {
                rowElToHide.setVisibilityMode(Ext.Element.DISPLAY);
                rowElToHide.setVisible(false);                
            }
        }

        SailPoint.initExpanders('resultsViewingForm');

        Ext.MessageBox.hide();
        Ext.getCmp('taskResultViewerWindow').show();
    }
});