/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

function groupBuckets() {
  $('editForm:groupBucketBtn').click();
}

function searchAgain() {
  $('editForm:searchComplete').value = 'false';
  $('editForm:searchAgain').click();
}

function validateGroup() {
  validated = validateSelections($('errorDiv'), false);
  
  if(validated)
  $('editForm:groupBucketBtn').click();
    
}

function validateSelections(errorDiv, validateTbl) {

  //Check to see if any checkboxes are checked
  var inputs = Ext.DomQuery.select("input[type=checkbox]", $('entitlementProfileResultsDiv'));
  var selectedCount = 0;
  var tableId = null;
  var parent;
  var splitId;
  
  for(i=0; i<inputs.length; i++) {
    if(inputs[i].checked) {
      if(validateTbl) {
        parent=inputs[i].parentNode;
        while(parent.tagName!="TABLE") {
          //alert("Parent: " + parent + " " + parent.tagName);
          parent = parent.parentNode;
        }
        if(parent.id!="") {
          splitId = parent.id.split("_");
          if(tableId == null) {
            tableId = splitId[0];
          } else if(splitId[0] != tableId) {
            //errorDiv.innerHTML = "<div class='formError'> You cannot group entitlements from different applications. </div>";         
            //errorDiv.style.display='';           
            //return false;
          }
        }
      }
      
      selectedCount++;
    }
  }      
  if(selectedCount < 1) {
      errorDiv.innerHTML = "<div class='formError'> " + '#{msgs.err_entitlement_mining_group}' +  " </div>";         
      errorDiv.style.display='';           
      return false;
  } else if(errorDiv.visible()) {
    errorDiv.style.display = 'none';
  }
  return true;
}

function showGroupedBuckets(id, sourceLink) {
    var groupTr = Ext.get(id + '_groupTr');
    showHideWithLock([$(id + '_groupTr')], null, '0.5', {
        fn1: SailPoint.Utils.toggleDisclosureDiv,
        args: {link: sourceLink, div: groupTr}
    });
}

function showGroupedIdentities(id, sourceLink) {
    var idBase = 'sp' + id,
        targetTR = Ext.get(idBase + '_groupIdent_tr'),
        gridDiv = idBase + '_groupIdent_divIdentities',
        gridId = gridDiv + '_obj',
        isVisible = targetTR.isVisible();

    if (!isVisible) {
        targetTR.show();
        targetTR.dom.style.display = ''; // target.show() doesn't seem to clear this...
        renderGroupedIdentitiesGrid(gridDiv, gridId, id);
    } else {
        var grid = Ext.getCmp(gridId);
        if (grid) {
            grid.hide();
        }
        targetTR.dom.style.display = 'none';
    }
    SailPoint.Utils.toggleDisclosureLink(sourceLink, !isVisible);
}

function renderGroupedIdentitiesGrid (targetElement, gridId, groupId){

    // we need to destroy the old grid because these grids are kept in a4j panels that are re-rendered - Bug #5517
    var grid = Ext.getCmp(gridId);
    if (grid){
        grid.destroy();
    }

    var groupedIdentitiesGrid = null;
    var groupedIdentitiesStore = null;

    groupedIdentitiesStore = Ext.create('Ext.data.Store', {
        autoLoad: true,
        model : 'SailPoint.model.Empty',
        proxy : {
            url: SailPoint.getRelativeUrl('/define/roles/modeler/entitlementMiningBucketIdentityListJson.json'),
            type : 'ajax',
            extraParams:{bucketGroupId:groupId}
        },
        remoteSort:false
    });

    groupedIdentitiesGrid = Ext.create('SailPoint.grid.PagingGrid', {
        id:gridId,
        dynamic: true,
        height:300,
        viewConfig:{
            autoFill:true
        }, 
        store:groupedIdentitiesStore,
        frame:false,
        width:Ext.fly(targetElement).getWidth(),
        alwaysRefreshCols:false,
        columns: [],
        renderTo: targetElement
    });

    // this will only run the first time load is called
    groupedIdentitiesStore.on('load',function(){
        this.headerCt.getGridColumns().each(function(item) {
            item.flex = 1;
        });
    }, groupedIdentitiesGrid, {single:true});

}

