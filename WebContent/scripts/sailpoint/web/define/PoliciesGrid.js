/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.Define.Grid.Policy', {
    statics : {
        
        createGrid : function(fields, gridMetaData, stateId, typeStore) {
            
            var violationFilterForm = Ext.create('SailPoint.panel.Search', {
                id : 'violationFilterForm',
                columns : [
                    {
                        xtype : 'combobox',
                        fieldLabel : '#{msgs.label_policy_type} ',
                        name : 'violationType',
                        id : 'violationType',
                        listConfig : { width : 300 },
                        width : 300,
                        store : typeStore
                    }
                ],
                doSearch : function() {
                    policiesGrid.getStore().getProxy().extraParams['name'] = Ext.getCmp('violationSearchField').getValue();
                    policiesGrid.getStore().getProxy().extraParams['policyType'] = Ext.getCmp('violationType').getValue();
                    policiesGrid.getStore().load({params : { start:0, limit:25 } });
                },
                doReset : function() {
                    Ext.getCmp('violationType').reset();
                    Ext.getCmp('violationSearchField').reset();

                    policiesGrid.getStore().getProxy().extraParams['name'] = '';
                    policiesGrid.getStore().getProxy().extraParams['policyType'] = '';
                    policiesGrid.getStore().load({params : { start:0, limit:25 } });
                }
            });

            var violationFilter = new Ext.Action({
                text : '#{msgs.advanced_search}',
                scale: 'medium',
                handler : function() {
                    violationFilterForm.toggleCollapse();
                }
            });

            // data store
            var policiesStore = SailPoint.Store.createStore({
                fields : fields,
                autoLoad : false,
                url : CONTEXT_PATH + '/define/policy/policiesDataSource.json',
                root : 'objects',
                sorters : [{property : 'name', direction : 'ASC'}],
                simpleSortMode : true,
                remoteSort : true,
                totalProperty: 'count',
                pageSize : 25,
                method : 'POST'
            });

            var policiesGrid = Ext.create('SailPoint.grid.PagingGrid', {
                id : 'policiesGrid',
                cls : 'selectableGrid',
                stateId : stateId,
                stateful : true,
                store : policiesStore,
                gridMetaData: gridMetaData,
                flex : 1,
                listeners : {
                    itemclick : SailPoint.Define.Grid.Policy.clickRow,
                    itemcontextmenu : SailPoint.Define.Grid.Policy.showContextMenu
                },
                viewConfig : {
                    stripeRows : true,
                    scrollOffset : 0
                }
            });

            var ct = Ext.create('Ext.panel.Panel', {
                items : [ violationFilterForm, policiesGrid ],
                autoScroll : true,
                tbar : [{
                    xtype : 'searchfield',
                    id : 'violationSearchField',
                    store : policiesStore,
                    paramName : 'name',
                    emptyText : '#{msgs.label_filter_by_policy_name}',
                    width : 250,
                    storeLimit : 25
                }, ' ', violationFilter ]
            });

            policiesStore.load({params : { start:0, limit:25 } });

            return ct;
        },

        showContextMenu : function(gridView, record, HTMLitem, index, e, eOpts) {
            id = record.getId();
            name = record.get('name');

            var viewEditText = (canEdit) ? '#{msgs.menu_edit}' : '#{msgs.menu_view}';
            var viewEditIcon = (canEdit) ? "editBtn" : "viewDetailsBtn";

            var contextMenu = new Ext.menu.Menu();
            contextMenu.add(new Ext.menu.Item({
                text : viewEditText,
                handler : SailPoint.Define.Grid.Policy.edit,
                iconCls : viewEditIcon
            }));
            if (canEdit) {
                contextMenu.add(new Ext.menu.Item({
                    text : '#{msgs.menu_delete}',
                    handler : SailPoint.Define.Grid.Policy.deletePrompt,
                    iconCls : 'deleteBtn'
                }));
            }

            e.stopEvent();
            contextMenu.showAt(e.xy);
        },

        // Ext.view.View this, Ext.data.Model record, HTMLElement item, Number
        // index, Ext.EventObject e, Object eOpts
        clickRow : function(gridView, record, HTMLitem, index, e, eOpts) {
            $('policyForm:currentObjectId').value = record.getId();
            $('policyForm:editButton').click();
        },

        edit : function() {
            // there's no functional difference btwn this and clickApplication
            $('policyForm:currentObjectId').value = id;
            $('policyForm:editButton').click();
        },

        deletePrompt : function() {
            $('policyForm:currentObjectId').value = id;
            var title = '#{msgs.policies_grid_delete_prompt_title}';
            var body = '#{msgs.policies_grid_delete_prompt_text}';
            Ext.MessageBox.confirm(Ext.String.format(title, name), Ext.String.format(body, name), SailPoint.Define.Grid.Policy.deletePolicy);
        },

        deletePolicy : function(button, text) {
            if (button == 'yes') {
                $('policyForm:currentObjectId').value = id;
                $('policyForm:deleteButton').click();
            }
        },

        newPolicy : function(sel) {
            $('policyForm:newPolicyType').value = sel.value;
            $('policyForm:createPolicyButton').click();
        }
    }
// end statics
});