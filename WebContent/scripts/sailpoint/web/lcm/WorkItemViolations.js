Ext.ns('SailPoint', 'SailPoint.lcm');

SailPoint.lcm.initWorkItemViolationsGrid = function(workitemId) {

    var newGrid = new SailPoint.grid.PagingGrid({
        id: 'workitemViolationsGrid',
        store: SailPoint.Store.createRestStore({
            model : 'SailPoint.model.Empty',
            url: SailPoint.getRelativeUrl('/rest/workitem/' + workitemId + '/violations'),
            remoteSort: true
        }),
        renderTo: 'lcmRequestViolations',
        cls: 'eraseTdPadding wrappingGrid',
        dynamic: true,
        columns: [],
        pageSize: 15,
        plugins: [ {ptype: 'certitemexpander', rowBodyTpl: ' '} ],
        viewConfig: {
            overflowX: 'hidden'
        }
    });
    
    newGrid.enableHdMenu = false;
    newGrid.view.handleHdOver = function(e,t) {
        e.preventDefault();
        e.stopPropagation();
        e.stopEvent();
    };
    
    newGrid.initialLoad();
    newGrid.show();
    newGrid.getView().refresh(true);
            
    return newGrid;
};