/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
* @class SailPoint.grid.PagingCheckboxGrid
* @extends Ext.grid.GridPanel
* This class wraps together a number of standard features needed for paging checkbox grids.
* <ul>
* <li>Initializes the toolbar with the grid's store.</li>
* <li>Creates a {@link SailPoint.grid.DefaultCheckboxSelectionModel DefaultCheckboxSelectionModel}.</li>
* </ul>
*/

Ext.define('SailPoint.grid.PagingCheckboxGrid', {
	extend : 'SailPoint.grid.PagingGrid',
	alias : 'widget.pagingcheckboxgrid',
  
    /** For when we want to use a pagingcheckboxgrid but need to hide the checkboxes for a uneditable state **/
    hideCheckboxes : false,

    /**
    * Initializes component. This method is called as a part of the EXT component model.
    * Sets basic stuff, such as setting stripeRows to true, and creates a
    * default SailPoint.grid.CheckboxSelectionModel() selmodel if one has not
    * been passed in the config.
    * @private
    */
    initComponent : function(){

        Ext.applyIf(this, {
            selModel : new SailPoint.grid.CheckboxSelectionModel()
        });

        Ext.apply(this, {
            viewConfig : {
              stripeRows: true
            },
            /** Default to forceFit:false to prevent the issue where the headerCheckbox gets the flex
             * applied as 24 instead of width.  PH 4/27/12
             */
            forceFit:false
        });
        
        /** At times, when the state is restored, it pushes the checkbox
        ** to the end of the grid.  checkboxFix checks for this and moves the checkbox
        ** back **/
        this.on('staterestore', this.checkerFix, this);
        
        this.callParent(arguments);
    },

    /**
    * {boolean} Returns true if the user has selected all records. If this is true you
    * will need to check getExcludedIds() to see if any records were excluded.
    */
    isAllSelected : function(){
        return this.selModel.isAllSelected();
    },

    /**
    * {Ext.Array} Returns an Array of the IDs of all selected records.
    */
    getSelectedIds : function() {
    	var items = this.selModel.getSelection();
    	return SailPoint.Utils.getSelectedIDs(items);
    },

    /**
    * {Ext.Array} Returns an Array of the IDs of all excluded records.
    */
    getExcludedIds : function(){
        return this.selModel.getExcludedIds();
    },

    /**
    * {Boolean} returns true if at least one item have been selected
    */
    hasSelection : function(){
        return this.selModel.isAllSelected() || this.selModel.getSelectedIds().length > 0;
    },

    getSelectionCriteria : function(){
        var selCriteria = new SailPoint.SelectionCriteria({
            selections:this.getSelectedIds(),
            exclusions:this.getExcludedIds(),
            selectAll:this.isAllSelected()
        });

        return selCriteria;
    },

    /**
    * Deselects all checked boxes.
    */
    deselectAll : function(){
        if (this.selModel.deselectAll)
            this.selModel.deselectAll();
    },

    /**
    * Selects all items.
    */
    selectAll : function(){
        if (this.selModel.selectAll)
            this.selModel.selectAll();
    },

    /**
     * Clear out checkbox selections. When a grid is re-used prev
     * selected record will linger in the checkbox state mgr.
     * Calling this will flush that state.
     *
     * This won't update the UI, call deSelectAll for that.
     */
    clearCheckboxState : function(){
        this.selModel.deselectAll();
    },

    /**
    * {Object} Returns an object containing all the info you need to include
    *  when posting the selections to a form.
    *  Includes:
    *  - selected - csv list selected IDs
    *  - selectAll - boolean indicating if select all was checked
    *  - excludedIds - csv list excluded IDs
    */
    getFormParams : function(){
        return {'selected' : this.selModel.getSelectedIds().join(),
                'selectAll' : this.selModel.isAllSelected(),
                'excludedIds' : this.selModel.getExcludedIds().join() };
    },
    
    /** Prevents the state from moving the checkbox elsewhere **/
    checkerFix : function(component, state) {
//		var colModel = component.getColumnModel();
//		var checkerIndex = colModel.getIndexById('checker');
//		if(checkerIndex && checkerIndex > 0) {
//			colModel.moveColumn(checkerIndex, 0);
//		}
    },

    /**
     * Sets the hidden state of the checkbox column. 
     */
    setCheckboxHiddenState : function(hiddenState) {
//      var colModel = this.getColumnModel();
//      var checkerIndex = colModel.getIndexById('checker');
//      if(checkerIndex > -1) {
//      	colModel.setHidden(checkerIndex, hiddenState === true);
//      }
    },
    
    /**
     * Return whether the given event was due to a checkbox click.
     * 
     * @param {Ext.EventObject} e  The event that was triggered.
     */
    isCheckboxClick: function(e) {
        // Only call this if the selection model handles checkboxes.
        return (this.selModel.isCheckboxClick && this.selModel.isCheckboxClick(e));
    }

});