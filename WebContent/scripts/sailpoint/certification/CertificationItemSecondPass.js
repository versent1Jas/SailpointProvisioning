/* (c) Copyright 2009 SailPoint Technologies, Inc., All Rights Reserved. */
Ext.ns("SailPoint.Certification");

/**
 * This is a static class (ie - no constructor) that can be used to load second
 * pass information about certification items using AJAX.  This offloads some
 * processing from when the page is originally displayed so that the initial
 * load will be faster.
 * 
 * Requires:
 *  - misc.js: SailPoint.Log
 *  - certification.js: getCertificationItemIds()
 */
SailPoint.Certification.CertificationItemSecondPass = {

    // An object holding the second pass information loaded via AJAX.  This has
    // an array of JSON-loaded objects.
    infos: null,

    // A lock used to prevent multiple second-pass AJAX requests from executing
    // at the same time.
    executing: false,

    // A array of item IDs that have been queued for second-pass loading.
    queuedItemIds: null,

    disabled : false,
    
    /**
     * Return whether the info has been loaded yet or not.
     */
    isLoaded: function() {
        return (null != this.infos);
    },
    
    /**
     * Return the second pass information to determine whether the certification
     * item with the given ID should show the remediation dialog.  This should only
     * be called if the second pass info has finished loading, otherwise an
     * exception is thrown.
     *
     * @param  itemId             The ID of the CertificationItem.
     *
     * @return The second pass info for the given item.
     */
    getInfo: function(itemId) {

        // If second pass is disabled, return a dummy object
        // with the dialogs disabled.
        if (this.disabled){
            return {
                itemId:itemId,
                showRemediationDialog : false,
                showRevokeAcctDialog : false
            };
        }

        // Throw if the info is not yet loaded.
        if (!this.isLoaded()) {
            throw 'Certification item second pass info yet loaded.';
        }

        // If we calculated it, look for this item.
        for (i=0; i<this.infos.length; i++) {
            var info = this.infos[i];
            if (itemId === info.itemId) {
                return info;
            }
        }

        // We got here without finding an info, so throw.
        throw 'Certification item second pass info not found for ' + itemId;
    },

    disable: function() {
        this.disabled = true;
    },
    
    /**
     * Load the second-pass info for the items on the page.  This will queue
     * parallel requests.
     *
     * @param isDetailPage  Whether this is loading for the detail page or the
     *                      entitlement view.
     * @param workItemId    The ID of the work item if this is a delegation.
     */
    load: function(isDetailPage, workItemId) {
        SailPoint.Log.message('load(): Entering');
    
        var container =
            (isDetailPage) ? 'currentIdentityDiv' : 'certIdsLiveGridContainer';
        if (isDetailPage && (null === $(container))) {
            container = 'certificationDecisions';
        }
        var itemIds = this.getCertificationItemIds(container);
    
        // Since scrolling the grid can fire this off many times, we'll lock when
        // the second pass AJAX call is executing and queue up the IDs.  We'll
        // replace the queued IDs if a newer request comes in.  After the AJAX
        // request completes, we'll kick off another request if anything is queued.
        if (!this.executing) {
            SailPoint.Log.message('load(): not executing ... launching request');
            this.loadItems(itemIds, workItemId);
        }
        else {
            SailPoint.Log.message('load(): is executing ... queuing request');
            this.queueItems(itemIds);
        }
    },


    loadGrids: function(gridIds, workItemId) {
        SailPoint.Log.message('loadGrids(): Entering');

        var itemIds = this.getGridItems(gridIds);

        // Since scrolling the grid can fire this off many times, we'll lock when
        // the second pass AJAX call is executing and queue up the IDs.  We'll
        // replace the queued IDs if a newer request comes in.  After the AJAX
        // request completes, we'll kick off another request if anything is queued.
        if (!this.executing) {
            SailPoint.Log.message('load(): not executing ... launching request');
            this.loadItems(itemIds, workItemId);
        }
        else {
            SailPoint.Log.message('load(): is executing ... queuing request');
            this.queueItems(itemIds);
        }
    },

    gridLoaded : function(workItemId, records){

        var itemIds = [];
        records.each(function(record){
            itemIds.push(record.getId());
        });


        this.loadItems(itemIds, workItemId);
    },

    
    /**
     * @private
     * 
     * Fire off an AJAX request to load the second-pass info into the infos
     * array.
     *
     * @param  itemIds     A comma-separated string of IDs to load.
     * @param  workItemId  The ID of the work item if this is a delegation.
     */
    loadItems: function(itemIds, workItemId) {
        SailPoint.Log.message('loadItems(): entering');

        var filteredItems = [];
        if (itemIds){
            for(var i=0;i<itemIds.length;i++){
                var id = itemIds[i];
                if (!this.hasItem(id))
                    filteredItems.push(id);
            }
        }

        if (filteredItems.length==0) {
            SailPoint.Log.message('loadItems(): no IDs - exiting')
            return;
        }
    
        SailPoint.Log.message('loadItems(): locking');
        this.executing = true;
        var params = 'itemIds='+filteredItems.join(',');
        if (null !== workItemId) {
            params += '&workItemId=' + workItemId;
        }
        var url = CONTEXT_PATH + '/certification/certificationSecondPass.json';
        new Ajax.Request(url, {
            method: 'post',
            parameters: params,
            onSuccess: function(transport) {
                SailPoint.Log.message('loadItems(): received success from AJAX request');
                var responseText = transport.responseText;
                var wrappedSecondPassInfo = JSON.parse(responseText);

                if (!this.infos){
                    this.infos = wrappedSecondPassInfo.contents;
                } else {
                    for(var i=0;i<wrappedSecondPassInfo.contents.length;i++){
                        var item = wrappedSecondPassInfo.contents[i];
                        this.infos.push(item);
                    }
                }

                this.executing = false;
                SailPoint.Log.message('loadItems(): unlocking');
    
                // If anything was queued up while this was executing, clear it off
                // the queue and fire a new request.
                if (null != this.queuedItemIds && this.queuedItemIds.length == 0) {
                    SailPoint.Log.message('loadItems(): have a queued request ... launching');
                    var newIds = this.queuedItemIds;
                    this.queuedItemIds = null;
                    this.loadItems(newIds, workItemId);
                }
            }.bind(this),
            onFailure: function(transport) {
                SailPoint.Log.message('loadItems(): received failure from AJAX request');
                alert('Failed to load second pass information. ' + transport.status);
                this.executing = false;
                SailPoint.Log.message('loadItems(): unlocking');
            }.bind(this)
        });
    },

    getCertificationItemIds : function(container) {
        container = (null == container) ? $('editForm') : $(container);
        var inputs = Ext.DomQuery.select("input.certItemPreviousStatus", container);

        var itemIds = [];

        inputs.each(function(elt) {
            var eltId = elt.id;
            var regex = /(\S+)_previousStatus/;
            if ((null != eltId) && regex.test(eltId)) {
                itemIds.push(RegExp.$1);
            }
        });

        return itemIds;
    },

    queueItems : function(itemIds){
        if (!itemIds || itemIds.length==0)
            return;

        if (!this.queuedItemIds)
            this.queuedItemIds = [];
        this.queuedItemIds.concat(itemIds);
    },

    getGridItems : function(gridIds){
        var itemIds = [];
        if (gridIds && gridIds.length > 0){
            gridIds.each(function(gridId){
                var gridStore = Ext.getCmp(gridId).getStore();
                gridStore.each(function(record){
                    itemIds.push(record.get('id'));
                });
            });
        }

        return itemIds;
    },

    hasItem : function(itemId){
        if (this.infos){
            for (i=0; i<this.infos.length; i++) {
                var info = this.infos[i];
                if (itemId === info.itemId) {
                    return true;
                }
            }
        }
        return false;
    }

}
