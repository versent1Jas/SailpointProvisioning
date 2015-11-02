/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.PagingTreeStore', {
    extend : 'Ext.data.TreeStore',
    
    constructor : function(config) {
        config = config || {};
        
        // root has different meaning for a TreeStore and getStoreConfig does bad 
        // things to it
        var originalRoot = config.root;
        
        Ext.apply(config, SailPoint.Store.getStoreConfig(config));
        
        if (originalRoot) {
        	delete config.proxy.reader.root;
        	
        	config.root = originalRoot;
        }
        
        this.callParent(arguments);
    },
    
    createNode: function(attr) {
        var createdNode = this.callParent(arguments); 
        // The server-side JSON generator is responsible for communicating the current
        // paging state to the tree.  The pageUp() and pageDown() functions will in turn
        // relay that information back when paging
        if (attr['pageNode'] == 'up') {
            createdNode.on('click', SailPoint.PagingLogic.pageUp, createdNode);
            createdNode.currentPage = attr['currentPage'];
        } else if (attr['pageNode'] == 'down') {
            createdNode.on('click', SailPoint.PagingLogic.pageDown, createdNode);
            createdNode.currentPage = attr['currentPage'];
        }
      
        return createdNode;
    },
      
    getParams: function(node) {
        var buf = $A([this.callParent(arguments)]);

        if (node.parentNode && (node.parentNode !== null)) {
            var nodeObjIds = node.id.split(':');
            var currentNodeObjId = nodeObjIds[nodeObjIds.length - 1];
            
            // Inherit the filteredNode from the parent node
            if (node.parentNode.filteredNode !== currentNodeObjId) {
                node.filteredNode = node.parentNode.filteredNode;
            }
        }

        // Are we filtering on a node?  If so, which one?
        if (node.filteredNode) {
            buf.push("&filterOnNode=", encodeURIComponent(node.filteredNode)); 
        }
      
        // What is the current page?
        if (node.currentPage) {
            buf.push("&currentPage=", encodeURIComponent(node.currentPage));
        }
      
        // Are we paging?  If so are we paging up or down?
        if (node.pagingDirection) {
            buf.push("&pagingDirection=", encodeURIComponent(node.pagingDirection));
        }
      
        return buf.join("");
    },
    
    // We are overriding this function so that we can wrap our node array inside of an object.
    // This works around a potential JSON vulnerability.  See bug 3828 for details.
    processResponse : function(response, node, callback){
        var json = response.responseText;
        try {
            var obj = Ext.decode(json);
            var o = obj.node;
            node.beginUpdate();
            for(var i = 0, len = o.length; i < len; i++){
                var n = this.createNode(o[i]);
                if(n){
                    node.appendChild(n);
                }
            }
            node.endUpdate();
            if(typeof callback == "function"){
                callback(this, node);
            }
        }catch(e){
            this.handleFailure(response);
        }
    },
    
    fetchPage: function(record) {
    	if (!record.isPageNode()) {
    		return;
    	}
    	
    	var pagingDirection = record.isPageUpNode() ? 'up' : 'down';
    	var node = record.parentNode ? record.parentNode : null;
    	
    	this.load({
    		node: node,
    		params: {
        		currentPage: record.raw.currentPage,
        		pagingDirection: pagingDirection
        	}
    	});
    }
});

SailPoint.PagingLogic = {
        pageUp: function() {
            var parentNode = this.parentNode;
          
            parentNode.currentPage = this.currentPage;
            parentNode.pagingDirection = 'up';
            // Decache the children
            parentNode.attributes.children = undefined;
            parentNode.reload();
        
            return true;
        },
        
        pageDown: function() {
            var parentNode = this.parentNode;
      
            parentNode.currentPage = this.currentPage;
            parentNode.pagingDirection = 'down';
            // Decache the children
            parentNode.attributes.children = undefined;
            parentNode.reload();
                        
            return true;
        }
}