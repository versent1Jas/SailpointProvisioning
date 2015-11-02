
/**
* This object defines the set of items that were selected in a grid.
*/
Ext.define('SailPoint.SelectionCriteria', {

    constructor: function(config){
        this.accountKeys = [];
        Ext.apply(this, config);
    },

    clone : function(){
        return new SailPoint.SelectionCriteria({
            selectAll: this.selectAll,
            selections: SailPoint.clone(this.selections),
            exclusions: SailPoint.clone(this.exclusions),
            filter: SailPoint.clone(this.filter),
            accountKeys: this.accountKeys
        });
    },

    /**
    * True if the user selected all items.
    */
    selectAll: false,

    /**
    * List of objects affected by the decision. Each item in
    * the array contains the item ID or entity ID.
    */
    selections: null,

    /**
    * List of items IDs to be excluded from the selection.
    */
    exclusions:null,

    /**
    * The filter used to return the items in the decision set.
    * This is needed when a bulk decision is made with
    * 'select all' checked.
    */
    filter: null,

    /**
     * Unique account key used to compare items to determine if an
     * account operation applies both items
        single: accountKey : null,
        pj: Need to handle multiple account keys
     */
    accountKeys : [],

    /**
     * Returns true if this is a bulk operation
     */
    isBulk : function(){
        return this.selectAll || this.selections && this.selections.length > 1;
    },

    includesItem: function(certItem) {

        if (!certItem) {
            return false;
        }

        if (this.selectAll) {
            if (!this.exclusions || this.exclusions.indexOf(certItem.getId()) === -1) {
                return true;
            }
        }
        else if (this.selections && (this.selections.indexOf(certItem.getId()) > -1 ||
            this.selections.indexOf(certItem.getEntityId()) > -1)) {
            return true;
        }
        else if (this.accountKeys.length > 0 && this.accountKeys.indexOf(certItem.getAccountKey()) > -1) {
            return true;
        }

        return false;
    },

    includesItemId : function(itemId){

        if (this.selectAll){
            if (!this.exclusions || this.exclusions.indexOf(itemId) === -1){
                return true;
            }
        } else if (this.selections && this.selections.indexOf(itemId) > -1) {
             return true;
        }

        return false;
    },

    isExcluded : function(id){
        return this.exclusions && this.exclusions.indexOf(id) > -1;
    },

    isSelected : function(id){
        return this.selections && this.selections.indexOf(id) > -1;
    },

    /**
     * Removed the given item from the list. If the item is
     * indeed included in the selection criteria, true is returned
     * otherwise returns false.
     */
    remove : function(certItem){
        if (certItem){
            return this.removeId(certItem.getId());
        }
        return false;
    },

    removeId : function(id){
        if (!id)
            return false;

        if (this.selectAll){
            if (!this.exclusions)
                this.exclusions = [];
            this.exclusions.push(id);
            return true;
        } else if (this.selections && this.selections.indexOf(id) > -1){
            Ext.Array.remove(this.selections, id);
            return true;
        }
        return false;
    },

    removeIds : function(idArray){
        if (!idArray || idArray.length == 0)
            return false;

        var removed = false;
        for(var i=0;i<idArray.length;i++){
            if (this.removeId(idArray[i]))
                removed = true;
        }
        return removed;
    },

    removeCriteria : function(selectionCriteria){

        if (!selectionCriteria || selectionCriteria.isEmpty())
            return false;

        if (selectionCriteria.selectAll){
            // if this is a 'select all' selection, we need to
            // reduce it only to a selection of those items which
            // were excluded from our new selection.
            if (this.selectAll){
                this.selectAll = false;
                if (selectionCriteria.exclusions){
                    for(var i=0;i<selectionCriteria.exclusions.length;i++){
                        var id = selectionCriteria.exclusions[i];
                        if (!this.isExcluded(id)){
                            this.selections.push(id);
                        }
                    }
                }
            } else {
                // Since the new selection is a 'select all', everything
                // must be removed from this selection except for the items
                // excluded from the new selection
                for(var i=0;i<this.selections.length;i++){
                    var id = this.selections[i];
                    if (!selectionCriteria.isExcluded(id)){
                        this.removeId(id);
                    }
                }
            }
        } else {
            this.removeIds(selectionCriteria.selections);
        }

    },

    removeAll : function(exclusions){
        var removed = false;
        for(var i=0;i<this.selections.length;i++){
            var id = this.selections[i];
            if (!exclusions || exclusions.indexOf(id) == -1){
                this.removeId(id);
            }
        }
    },

    isEmpty : function(){
        return (!this.selections || this.selections.length == 0) && !this.selectAll;
    }
});
