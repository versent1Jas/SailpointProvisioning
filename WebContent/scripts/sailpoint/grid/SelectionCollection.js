/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * @class SailPoint.grid.SelectionCollection
 * @extends Ext.util.MixedCollection
 */
Ext.define('SailPoint.grid.SelectionCollection' , {

    mixins: {
        observable: 'Ext.util.Observable'
    },

    localSelections : null,
    exclusions : null,
    everythingSelected : false,
    store : null,

    constructor: function() {
        var me = this;
        me.mixins.observable.constructor.call(me);

        // Provide a custom key method for our collections so that equality is based
        // upon the sailpoint obj ID
        this.localSelections = new Ext.util.MixedCollection(false);
        this.exclusions = new Ext.util.MixedCollection(false);
    },

    isExcluded : function(record){
        return record && this.exclusions.indexOfKey(record.getId()) > -1;
    },

    setStore : function(store){
        this.store = store;
    },

    selectAll  : function(){
        this.exclusions.clear();
        this.everythingSelected = true;
        // can't pass selected items since we're selecting
        // the entire data set which may not all be loaded
        //this.fireEvent('selectionchange', this);
    },

    deselectAll  : function(){
        this.clear();
        //this.fireEvent('selectionchange', this, []);
    },

    getCount : function(){
        if (this.everythingSelected){
            return this.store.getTotalCount() - this.exclusions.getCount();
        }else{
            return this.localSelections.getCount();
        }
    },

    remove : function(model){
        if (this.everythingSelected){
            return this.exclusions.add(model.getId(), model);
        }else{
            return this.localSelections.removeAtKey(model.getId());
        }
    },

    add : function(model){
        if (this.everythingSelected) {
            if (this.exclusions.indexOfKey(model.getId()) != -1) {
                this.exclusions.removeAtKey(model.getId());
            }
        }
        this.localSelections.add(model.getId(), model);
    },

    isSelected : function(model){
        if (this.everythingSelected){
            return model && this.exclusions.indexOfKey(model.getId()) == -1;
        }else{
            return this.localSelections.indexOfKey(model.getId()) > -1;
        }
    },

    isAllSelected : function(){
        return this.everythingSelected;
    },

    indexOf : function(model){
      if(model) {  
        if (this.everythingSelected){
          return this.exclusions.indexOfKey(model.getId()) == -1 ? 0 : -1;
        }else{
          return this.localSelections.indexOfKey(model.getId());
        }
      }
    },

    last : function(){
        return this.localSelections.last();
    },

    getRange : function(){
        return this.localSelections.getRange();
    },

    clear : function(){
        this.localSelections.clear();
        this.exclusions.clear();
        this.everythingSelected=false;
    },

    clearLocal : function(){
        this.localSelections.clear();
    }



});