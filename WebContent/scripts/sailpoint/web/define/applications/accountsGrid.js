/* (c) Copyright 2013 SailPoint Technologies, Inc., All Rights Reserved. */
Ext.define('SailPoint.Define.Applications.AccountsGrid', {
    statics: {
        getAccountsGridConfig: function() {
            var gridMetaData = Ext.decode($('applicationAccountGridMetadata').innerHTML);
            var storeId = 'accountsStore';
            var pageSize = 25;
            
            var gridConfig = {
                id: 'accountsGridCmp',
                itemId: 'accountsGridContent',
                title: '#{msgs.app_accts_grid_title}',
                xtype : 'rowexpandogrid',
                url : SailPoint.getRelativeUrl('/rest/applications/' + makeEscapedQueryParam($('editForm:id').value) + '/links/accountsGrid'),
                gridMetaData : gridMetaData,
                storeId : storeId,
                cls : 'smallFontGrid selectableGrid',
                layout : 'fit',
                pageSize: pageSize,
                hideIfEmptyColumns: 'instance',
                listeners : {
                    activate: showExtTab
                },
                expandoCallback: function(e, s, r, o) {
                    addDescriptionTooltipsFn(e.target.dom);
                    this.fireResizeHackForIE(e, s, r, o);
                },
                renderTo: 'accountsGrid',
                viewConfig : {
                    scrollOffset : 1,
                    stripeRows : true,
                    overflowY: 'scroll'
                },

                tbar : [{
                    xtype : 'searchfield',
                    storeId : storeId,
                    paramName : 'query',
                    storeLimit : pageSize,
                    emptyText : '#{msgs.label_filter_by_name}',
                    width : 250
                }],
                
                usePageSizePlugin : true,
                runInitialLoad : true,
                expandoType: SailPoint.grid.PagingGrid.URL,
                rowBodyUrl: '/identity/linkDetails.jsf',
                sorters: [{ property: 'nativeIdentity', direction: 'ASC', ignoreCase: 'true'}]
            };
            
            return gridConfig;
        },
        
        adjustWidth: function() {
            var adjustedWidth = Math.floor(Ext.get('applicationExtTabs').getWidth() * 0.95);
            var accountsGrid = Ext.getCmp('accountsGridCmp');
            var listener = {
                options: {
                    single: true,
                    scope: accountsGrid
                }
            };
            accountsGrid.setWidth(adjustedWidth);
            // Hack around the improper toolbar rendering
            // that is triggered by the width adjustment
            accountsGrid.addListener('afterlayout', function() {
                this.getView().refresh();
            }, accountsGrid, {single: true});
        },
        
        renderIdentityNavLink: function(value, metadata, record, rowIndex, colIndex, store) {
            var hasViewIdentityRight = ($('hasIdentityViewRight').innerHTML.toLowerCase() == "true");
            var renderedValue;
            
            if (hasViewIdentityRight) {
                metadata.tdAttr = 'onclick="Ext.EventManager.stopEvent(this); ' +
                                           '$(\'viewIdentityForm:identityToView\').value = \'' + record.get('identity-id') + '\';' +
                                           '$(\'viewIdentityForm:currentTab\').value = \'accountsGridContent\'; ' +
                                           '$(\'viewIdentityForm:viewIdentityBtn\').click();"';
                renderedValue = SailPoint.grid.Util.renderFakeLink(value, metadata, record, rowIndex, colIndex, store);
            } else {
                renderedValue = value;
            }
            
            return renderedValue;
        }
    }
});
