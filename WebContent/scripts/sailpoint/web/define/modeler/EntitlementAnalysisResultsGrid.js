Ext.ns('SailPoint', 'SailPoint.roles', 'SailPoint.modeler.entitlementMining');

SailPoint.modeler.entitlementMining.handleResultsGridPaging = function(action, app, page){

    if (page && !page.toString().search(/^-?[0-9]+$/) == 0){
        Ext.MessageBox.alert('', Ext.String.format('#{msgs.err_invalid_number}', page));
        return false;
    }

    var nodes = $('pager').childNodes;
    nodes[0].value= app;
    nodes[1].value=page;
    for(var i = 1;i < nodes.length;i++){
        if (action === nodes[i].value){
            nodes[i].click();
        }
    }
}

SailPoint.modeler.entitlementMining.handleResultsGridPagingEvent = function(event, action, app, page){

    var keyCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
    if (keyCode === 13) {
        if (event.returnValue)
            event.returnValue=false;
        event.cancel = true;
        SailPoint.modeler.entitlementMining.handleResultsGridPaging(action, app, page);
        return false;
    }

    return true;
}

SailPoint.modeler.entitlementMining.resetCheckboxes = function () {
    var results = Ext.query('.selectionCheckbox');
    if (results){
        results.each(function(elem){
            elem.checked=false;
        });
    }

}

/**
 * Fires after paging has been executed
 */
SailPoint.modeler.entitlementMining.pagingCallback = function () {
    // HACK! - This ensures that the selected checkbox is kept in
    // sync with the underlying value.
    var results = Ext.query('.entValueHolder');
    results.each(function(elem){
        var checkboxSrch = Ext.query('input[type=checkbox]', elem.parentNode);
        if (checkboxSrch && checkboxSrch.length > 0){
            var checker = checkboxSrch[0];
            if (elem.value=='true')
               checker.checked=true;
            else
               checker.checked=false;
        }
    });
    
    SailPoint.Role.EntitlementsAnalysis.addDescriptionTooltips();

}

/**
 * When the checkbox in the header is clicked. Then select or unselect all items.
 */
SailPoint.modeler.entitlementMining.selectUnselectAll = function (mainSelect) {

    //Get the root of the select. This is the div the table lives in. The div id is appId_bucketsContent
    var resultsRoot = Ext.get(mainSelect).findParentNode('div[id$="bucketsContent"]');
    var results = Ext.query('.entValueHolder', resultsRoot);

    results.each(function(elem){
        var checkboxSrch = Ext.query('input[type=checkbox]', elem.parentNode);
        if (checkboxSrch && checkboxSrch.length > 0){
            var checker = checkboxSrch[0];
            checker.checked = mainSelect.checked;
        }
    });
}

SailPoint.modeler.entitlementMining.toggleIdentitiesGrid = function (id, bucketId, appId, sourceLink) {
    var idBase = 'sp' + id,
        targetTR = Ext.get(idBase + '_tr'),
        gridDiv = idBase + '_identity_grid',
        gridId = gridDiv + '_obj',
        isVisible = targetTR.isVisible();

    if (!isVisible) {
        targetTR.show();
        targetTR.dom.style.display = ''; // target.show() doesn't seem to clear this...
        SailPoint.modeler.entitlementMining.renderIdentitiesGrid(gridDiv, gridId, appId, bucketId);
    } else {
        var grid = Ext.getCmp(gridId);
        if (grid) {
            grid.hide();
        }
        targetTR.dom.style.display = 'none';
    }

    SailPoint.Utils.toggleDisclosureLink(sourceLink, !isVisible);
}


SailPoint.modeler.entitlementMining.renderIdentitiesGrid = function(targetElement, gridId, applicationId, bucket){
    // we need to destroy the old grid because these grids are kept in a4j panels that are re-rendered - Bug #5517
    var grid = Ext.getCmp(gridId);
    if (grid){
      grid.destroy();
    }

    var matchingIdentitiesGrid = null;
    var matchingIdStore = null;

     matchingIdStore = Ext.create('Ext.data.Store', {
    	 autoLoad: true,
         model: 'SailPoint.model.Empty',
         proxy : {
             type : 'ajax',
             url: SailPoint.getRelativeUrl('/define/roles/modeler/entitlementProfileIdentityListJson.json'),
             extraParams:{bucketId:bucket, applicationId:applicationId}
         },
        remoteSort:false,
        showNonMatched : false // custom property
     });

     var toggleMatchedButton = Ext.create('Ext.button.Button', {
        text:'#{msgs.mining_show_unmatched_identities}'
     });

     matchingIdentitiesGrid = Ext.create('SailPoint.grid.PagingGrid', {
        id:gridId,
        dynamic: true,
        height:300,
        viewConfig:{
            autoFill:true
        }, 
        store:matchingIdStore,
        frame:false,
        width:Ext.fly(targetElement).getWidth(),
        tbar:[toggleMatchedButton],
        alwaysRefreshCols:false,
        columns: [],
        renderTo: targetElement
    });

    toggleMatchedButton.setHandler(function(){
        var store = matchingIdentitiesGrid.getStore();
        var pagingToolbar = matchingIdentitiesGrid.getPagingToolbar();
        if (!store.showNonMatched){
            this.setText('#{msgs.mining_show_matched_identities}');
        } else {
            this.setText('#{msgs.mining_show_unmatched_identities}');
        }
        store.showNonMatched = !matchingIdStore.showNonMatched;
        store.getProxy().extraParams['showNonMatched'] = store.showNonMatched;
        //Use moveFirst to reset paging to first page and reset toolbar
        pagingToolbar.moveFirst();
    }, toggleMatchedButton);

    // this will only run the first time load is called
    matchingIdStore.on('load', function() {
       this.headerCt.getGridColumns().each(function(item) {
        	item.flex = 1;
       });
    }, matchingIdentitiesGrid, {single:true});
}