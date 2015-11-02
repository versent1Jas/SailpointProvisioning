/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

var riskScoresStore;
var riskScoresGrid;
var activeTab;
var identityCount;

Ext.define('SailPoint.Manage.Grid.RiskScores', {
    statics : {
        
        initialize : function(columnConfig, stateId, tabs, count, activeTab) {

            Ext.QuickTips.init();
            var gridWidth = $('riskScores-display').clientWidth;
            identityCount = count;

              riskScoresStore = SailPoint.Store.createStore({
                  fields: columnConfig.fields,
                  autoLoad: false,
                  url: CONTEXT_PATH + '/manage/riskScores/riskScoresDataSource.json',
                  root: 'objects',
                  totalProperty: 'count',
                  method : 'POST',
                  listeners: {
                      beforeLoad: SailPoint.Manage.Grid.RiskScores.updateParams,
                      load: SailPoint.Manage.Grid.RiskScores.updateTitle
                  },
                  pageSize: 25,
                  remoteSort: true
              });

            // risk score grid
            // note the titleChange listener - once the title gets updated, the
            // grid's new size is set, enabling us to update the size of the 
            // panel containing both this grid and the tabs
            // QUESTION: Why doesn't the resize event fire when the store reloads?
            riskScoresGrid = new SailPoint.grid.PagingCheckboxGrid({
              id: 'riskScoresGrid',
              store: riskScoresStore,
              cls: 'selectableGrid',
              stateId: stateId,
              stateful: true,
              dynamic: true,
              gridMetaData: columnConfig,
              selModel: new SailPoint.grid.CheckboxSelectionModel({selectMessageBox: $('selectedCount')}),
              viewConfig : {stripeRows: true},
              width: gridWidth,
              listeners: {
                itemclick: SailPoint.Manage.Grid.RiskScores.clickIdentity,
                titleChange: SailPoint.Manage.Grid.RiskScores.resizeParent,
                itemcontextmenu: SailPoint.Manage.Grid.RiskScores.doNothing
              },
              region: 'center',
              title: ' ',
              margins: '0 0 15 0',
              bbar: {
                xtype : 'pagingtoolbar',
                store: riskScoresStore,
                displayInfo: true
              }
            });
            
            //reset Store to match Pager
            riskScoresStore.pageSize = riskScoresGrid.pageSize;
            
            // tab panel 
            var tabPanel = new Ext.TabPanel({
              id: 'tabs',
              width: gridWidth,
              plain: true,
              activeItem: activeTab,
              defaults: {autoScroll: true},
              border: false,
              region: 'north',
              margins: '0 0 -4 0',
              // overrides a light grey buried somewhere within ExtJS
              style: 'background-color: white',
              activeTab: activeTab,
              items: tabs
            });
              
            // load up the data store so that the grid is ready to go once the
            // panel below displays
            //activeTab = tabs.items.get(0).getId();
            //riskScoresStore.load({params: {start: 0, limit: 20}});
            
            // the height of this panel gets set dynamically, based on the size
            // of the items it contains.  The reloading of the grid's store 
            // causes the grid to be redrawn, which in turn triggers this panel
            // to get redrawn at the new size. 
            var layoutPanel = new Ext.Panel({
              id: 'myLayoutPanel',
              layout:'border',
              height: 550,
              border: false,
              bodyBorder: false,
              renderTo: 'riskScores-display',
              items: [tabPanel, riskScoresGrid]
            });

            SailPoint.initExpanders('editForm');
          },
          
          // handles row clicks
          clickIdentity : function(gridView, record, HTMLitem, index, e, eOpts) {
              // dont go to identity page if they clicked on the checkbox
              if (gridView.clickedColumn == 0)
                  return;
              
              $('editForm:currentObjectId').value = record.getId();
              $('editForm:editButton').click();
          },
          
          // eliminates right mouse clicks on the row
          doNothing : function(gridView, record, HTMLitem, index, e, eOpts) {       
              e.stopEvent();
          },
          
          // handles some housekeeping when a new tab is clicked
          refreshPanel : function(component) {
              // pick up the newly-activated tab
              activeTab = component.getId();
              
              //reset pager
              riskScoresGrid.reload();
              riskScoresGrid.getPagingToolbar().moveFirst();
              
              // tell the backing bean
              $('editForm:currentCategoryName').value = activeTab;

              // load up the new data        
              riskScoresStore.load({params: {start: 0, limit: riskScoresGrid.pageSize}});

              // clear any identities that were selected on the previous tab.
              // However, the grid won't have any props on page load, hence
              // the if check.
              if (riskScoresGrid.getSelectionModel().grid)
                  riskScoresGrid.deselectAll();
          },
          
          // resizes the parent panel containing the tabs and grid after the grid's 
          // data store has been reloaded and the grid has been resized
          resizeParent : function(component) {
              component.ownerCt.doLayout();
          },
          
          // this is a weird little hook that's required in order to specify
          // which tab we're currently looking at.  Is there a better way?
          updateParams : function(store, options) {
                  store.getProxy().extraParams.selectedCategoryName = activeTab;
          },
          
          // recompute the percentage of identities in the grid title after the
          // data store has been reloaded.  display a friendly message if the
          // identityCount is zero since div by zero displays as NaN.
          updateTitle : function(store) {
              var title = '';
              if (identityCount > 0) {
                  pct = riskScoresStore.getTotalCount() / identityCount;   
                  pct = Math.round(pct * 100);
                 
                  title = Ext.String.format('#{msgs.identity_risk_description}',
                      riskScoresStore.getTotalCount(), identityCount, pct);
              } else {
                  title = '#{msgs.identity_risk_none_found}';
              }
             
              riskScoresGrid.setTitle(title);
          },
          
        //pre-submit checks and value assignments
          verifySelections : function() {
              if (riskScoresGrid.selModel.isAllSelected()) {
                  // set the "select all" flag on the bean
                  $('editForm:certifyAll').value = 'true';
                  
                  // If the user unselected some identities after selecting all, then
                  // we need to get those and exclude them from the cert
                  if (riskScoresGrid.selModel.getExcludedIds().length > 0) {
                      $('editForm:idsToCertify').value = 
                          arrayToString(riskScoresGrid.selModel.getExcludedIds(), true);
                  }
                
                  return true;
              } else if (riskScoresGrid.selModel.getSelectedIds().length == 0) {
                  Ext.MessageBox.alert('#{msgs.dialog_no_identities}', '#{msgs.err_select_one_identity}');
                  return false;
              } else {
                  // "normal" usage where a handful of identities have been chosen
                  $('editForm:idsToCertify').value = 
                      arrayToString(riskScoresGrid.selModel.getSelectedIds(), true);
                      
                  return true;
              }       
          }
    }
});

<!--//--><![CDATA[//><!--
SailPoint.Manage.Grid.RiskScores.renderScore = function(value, p, record) {
    str = '<div class=\'riskIndicator ri_{0}\'>{1}</div>';
    return Ext.String.format(str, value.color, value.score);
}
//--><!]]>
       