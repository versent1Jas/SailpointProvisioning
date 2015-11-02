Ext.onReady(function(){

    var enableScopes = ($('editForm:enableScopes').value === 'true');
    // shorthand
    var Tree = Ext.tree;
    
    Ext.define('Scope', {
        extend: 'Ext.data.Model',
        
        fields: [
            { name: 'id', type: 'string' },
            { name: 'text', type: 'string' }
        ],
        
        isPageNode: function() {
            return this.isPageUpNode() || this.isPageDownNode();
        },
        
        isPageUpNode: function() {
            if(this.raw)
                return this.raw.pageNode === 'up';
            else
                return false;
        },
        
        isPageDownNode: function() {
            if(this.raw)
                return this.raw.pageNode === 'down';
            else
                return false;
        }
    });
    
    var scopeLoader = new SailPoint.PagingTreeStore({
        dataUrl: CONTEXT_PATH + '/systemSetup/scopes/scopesDataSource.json',
        model: 'Scope',
        autoLoad: false,
        defaultRootProperty: 'node'
    });


    //If we want to use static sized panel, we can set panel height to maxH
    var maxH = SailPoint.getBrowserViewArea().height/2;
    var tree = new Tree.TreePanel({
        id: 'treePanelId',
        renderTo: 'treePanel',
        store: scopeLoader,
        headerAsText: false,
        border: false,
        enableDD: enableScopes,
        //height: maxH,
        maxHeight: maxH,
        autoScroll: true,
        rootVisible: true,
        ddAppendOnly: true,
        root: {
            id: 'root',
            text: '#{msgs.title_scopes}',
            leaf: false,
            expanded: true
        },
        viewConfig: {
            plugins: { ptype: 'treeviewdragdrop',
                pluginId: 'treepaneldd',
                ddGroup: "TreeDD",
                appendOnly: true
            }
        },
        listeners : {
            itemclick : {
                fn : function(rowModel, record, index, eOpts) {
                    if (record.isPageNode()) {
                        this.getStore().fetchPage(record);
                    }
                }
            }
        }
    });
    

    tree.getView().on('afteritemexpand', function(node, index, item, opts) {
        this.refresh();
    });

    if (enableScopes){
        tree.on('itemmove',
            function(node, oldParent, newParent, index, opts) {
                $('editForm:movedScopeId').value = node.getId();
                $('editForm:oldParentScopeId').value = oldParent.getId();
                $('editForm:newParentScopeId').value = newParent.getId();
                $('editForm:moveScopeBtn').click();
            });
        
        
        //Get reference to the Tree Panel DropZone so we can override the getPosition method
        //This allows us to drag and drop onto leaf nodes
        var dropz = tree.getView().getPlugin('treepaneldd').dropZone;
        
        
        Ext.override(dropz, {
            getPosition: function(e, node) {
                var view = this.view,
                record = view.getRecord(node),
                y = e.getPageY(),
                noAppend = false,
                noBelow = false,
                region = Ext.fly(node).getRegion(),
                fragment;
                if (record.isRoot()) {
                return 'append';
                }
                if (this.appendOnly) {
                return noAppend ? false : 'append';
                }
                if (!this.allowParentInsert) {
                noBelow = record.hasChildNodes() && record.isExpanded();
                }
                fragment = (region.bottom - region.top) / (noAppend ? 2 : 3);
                if (y >= region.top && y < (region.top + fragment)) {
                return 'before';
                }
                else if (!noBelow && (noAppend || (y >= (region.bottom - fragment) && y <= region.bottom))) {
                return 'after';
                }
                else {
                return 'append';
                }
                } 
        });
        
        tree.on('itemcontextmenu',
                function(view, record, item, index, e) {
                if(!record.isPageNode()) {
                    var contextMenu = new Ext.menu.Menu();
                    
                    var nodeId = record.getId();
                    
                    contextMenu.add(
                        new Ext.menu.Item({text: '#{msgs.new}', handler: newScope, iconCls: 'addBtn', scope: { nodeId: nodeId }})
                    );
    
                    if ('root' !== nodeId) {
                        contextMenu.add(
                            new Ext.menu.Item({text: '#{msgs.edit}', handler: editScope, iconCls: 'editBtn', scope: { nodeId: nodeId }}),
                            new Ext.menu.Item({text: '#{msgs.delete}', handler: deleteScope, iconCls: 'deleteBtn', scope: { nodeId: nodeId }})
                        );
                    }
    
                    e.stopEvent();
                    contextMenu.showAt(e.xy);
                }
            });
    }

    function newScope() {
        $('editForm:parentId').value = this.nodeId;
        $('editForm:newScopeBtn').click();
    }

    function editScope() {
        $('editForm:selectedScopeId').value = this.nodeId;
        $('editForm:editScopeBtn').click();
    }

    function deleteScope() {
        $('editForm:selectedScopeId').value = this.nodeId;
        $('editForm:deleteScopeBtn').click();
    }

});
