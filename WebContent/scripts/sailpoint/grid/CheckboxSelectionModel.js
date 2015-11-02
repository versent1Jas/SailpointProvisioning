/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * @class SailPoint.grid.CheckboxSelectionModel
 * @extends Ext.selection.CheckboxModel
 * <p>Extension of the CellSelectionModel which adds a selection checkbox to the
 * column. A 'select all' button is also added to the grid header to allow
 * the user to either select/deselect all items on the current grid page, or select/deselect all pages
 * in the entire dataset.</p>
 * <p> When the user clicks the select all checkbox in the grid header, this class
 * will display a menu offering the option of selecting/deselecting the current page or
 * selecting/deselecting all pages.</p>
 * <p>When the user unchecks a given row after they've chosen 'select all',
 * the given record will be added to an 'excluded' list. When the form is submitted
 * we will indicate that all records were selected with the exception of the IDs in
 * the excluded list.</p>
 */
Ext.define('SailPoint.grid.CheckboxSelectionModel' , {
	extend : 'Ext.selection.CheckboxModel',
	alias : 'selection.checkmultiselmodel',

    /**
    * @cfg (Element) selectMessageBox - An element that you can provide to display a info status
    * of how many boxes are currently selected.
    */
    selectMessageBox: null,
    
    /**
     * A function that you can provide that will be invoked when selectMessageBox text is updated
     */
    selectMessageBoxChanged: null,

    /**
     * @private selected The SelectionCollection containing the currently selected dataset.
     */
    selected : null,
    
    /** 
    * Allows us to turn off the paging options when the checkbox model is attached to a grid 
    * without a paging toolbar  
    */ 
    noPaging : false, 

    /**
     * We persist selections across paging requests, so set
     * pruneRemoved to false. This ensures that a selected
     * item is not removed when paging.
     */
    pruneRemoved : false,
    
    /**
     * Override the default Ext.selection.CheckboxModel behavior of selecting 
     * the box if ANY part of the row is selected.  Setting this to true
     * selects the row only when the checkbox is selected.
     */
    checkOnly: true,
    
    isHeaderChecked: false,

    constructor: function(cfg) {
        var me = this;

        /** Fired when one of the options in the header is clicked **/
        this.addEvents('headerselectionchange');

        this.callParent(arguments);

        me.selected = new SailPoint.grid.SelectionCollection();

        me.on('selectionchange', function(model, selected){
            this.updateSelectMessageBox(selected.getCount());
        });
    },

    selectWithEvent: function(record, e, keepExisting) {
        var me = this;
        if(me.selectionMode != 'SINGLE') {
            me.selectionMode = 'SIMPLE';
        }
        this.callParent(arguments);
    },

    isAllSelected : function (){
        return this.selected.everythingSelected;
    },
    
    getExcludedIds : function() {
    	var ids = [];
    	if(this.selected.exclusions){
    		this.selected.exclusions.each(function(model){
    			// if the 'id' field is not defined, grab the internalId directly
    			ids.push( model.getId() ? model.getId() : model.internalId );
    		});
    	}
    	return ids;
    },
    
    getSelectedIds : function() {
    	var ids = [];
    	if(this.selected.localSelections){
    		this.selected.localSelections.each(function(model){
    			// if the 'id' field is not defined, grab the internalId directly
    			ids.push( model.getId() ? model.getId() : model.internalId );
    		});
    	}
    	return ids;
    },

    selectPage: function(suppressEvent) {
        var me = this,
            start = me.getSelection().length;

        me.bulkChange = true;
        
        var c = this.store.getCount();
        this.store.each(function(record) {
            this.doSelect(record, true, suppressEvent);
        }, this);
        delete me.bulkChange;
        
        me.maybeFireSelectionChange(me.getSelection().length !== start);
    },
    
    deselectPage: function(suppressEvent)  {
        var me = this,
        start = me.getSelection().length;
        
        me.bulkChange = true;
        
        this.store.each(function(record) {
            this.doDeselect(record, suppressEvent);
        },this);
        delete me.bulkChange;
        
        me.maybeFireSelectionChange(me.getSelection().length !== start);
    },
    
    refresh: function() {
        var me = this,
            toBeSelected = [],
            oldSelections = me.getSelection(),
            selection,
            change,
            i = 0,
            lastFocused = this.getLastFocused();

        if (me.selected.isAllSelected()){
            var selectionCollection = me.selected;
            me.store.each(function(record){
                if (!me.selected.isExcluded(record)){
                    oldSelections.push(record);
                }
            });
        }

        var len = oldSelections.length;


        // check to make sure that there are no records
        // missing after the refresh was triggered, prune
        // them from what is to be selected if so
        for (; i < len; i++) {
            selection = oldSelections[i];
            if (!this.pruneRemoved || me.store.indexOf(selection) !== -1) {
                toBeSelected.push(selection);
            }
        }

        // there was a change from the old selected and
        // the new selection
        if (me.selected.getCount() != toBeSelected.length) {
            change = true;
        }

        if (me.selected.exclusions.getCount() > 0) {
        var excluded = me.selected.exclusions.clone();
        }
    
        me.selected.clearLocal();

        if (me.store.indexOf(lastFocused) !== -1) {
            // restore the last focus but supress restoring focus
            this.setLastFocused(lastFocused, true);
        }

        if (toBeSelected.length) {
            // perform the selection again
            me.doSelect(toBeSelected, false, true);
        }

        var excludedSelections = [];
        
        if (excluded) {
            excluded.each(function(item, index, length) {
                this.selected.exclusions.add(item);
                excludedSelections.push(item);
                this.onSelectChange(item, false, true, function(){})
            }, this);
        }
        
        me.maybeFireSelectionChange(change);
    },

      /**
    * If the grid contains a select message box for displaying how many items are selected, we
    * update that box with the current selection count.
    */
    updateSelectMessageBox: function (count) {
      if(this.selectMessageBox && Ext.get(this.selectMessageBox)) {
    	  
    	var sMBox = Ext.get(this.selectMessageBox);

        if(count > 0) {       	        	
        	sMBox.setStyle('display','');
        	sMBox.setHTML(Ext.String.format("#{msgs.items_selected}", count));
        } else {
        	sMBox.setStyle('display','none');
        }
        
        if (this.selectMessageBoxChanged) {
        	this.selectMessageBoxChanged();
        }
      }
    },

    /**
     * Toggle between selecting all and deselecting all when clicking on
     * a checkbox header.
     *
     * @override
     */
    onHeaderClick: function(headerCt, header, e) {
        if (header.isCheckerHd) {
            e.stopEvent();
            
            if(this.noPaging) {
              this.callParent(arguments);
              this.toggleUiHeader(this.isAllSelected());
            } else {
              this.showSelectMenu(e);
            }
        }
    },

    /**
     * Menu displayed when the user clicks the select all checkbox.
     * <p>
     * Note: the 'selectionType' attribute of the items is not an EXT attr, it's
     * an attr added to determine the selection type when the click event is handled.
     * </p>
     * @private
     */
    selectAllMenu : new Ext.menu.Menu({
        id:'grid-ctx',
        items :  [
            {
                id:'menu-select-page',
                selectionType:'selectPage',
                text: "#{msgs.defselectionmodel_select_current}",
                iconCls: 'gridSelectPage',
                scope:this
            },{
                id:'menu-select-all',
                selectionType:'selectAll',
                text: "#{msgs.defselectionmodel_select_everything}",
                iconCls: 'gridSelectAll',
                scope:this
            },{
                id:'menu-deselect-page',
                selectionType:'deselectPage',
                text: "#{msgs.defselectionmodel_deselect_current}",
                iconCls: 'gridDeselectPage',
                scope:this
            },{
                id:'menu-deselect-all',
                selectionType:'deselectAll',
                text: "#{msgs.defselectionmodel_deselect_everything}",
                iconCls: 'gridDeselectAll',
                scope:this
            }
        ]
    }),

    /**
     *  Displays select-all menu.
     *  @param {Ext.EventObject} e Event obj, used to get the position where the menu is located.
     * @private
     */
    showSelectMenu: function(e) {

        this.selectAllMenu.on('click',
            this.selectAllMenuClick, this
        );

        var pos = e.getXY();
        pos[0] = pos[0] - 5;
        pos[1] = pos[1] - 9;
        this.selectAllMenu.showAt(pos);

    },

    /**
     * This method is passed to the showSelectMenu and is executed
     * when the user makes a selection on that menu, either to
     * 'select all' or 'select everything'.
     *
     *  @param {Ext.menu.Item} menuItem The menu item which was clicked.
     *  @param {Ext.EventObject} e Event obj generated by the menu click
     *  @private
     */
    selectAllMenuClick: function(menu, menuItem, event, eOpts) {
        if(this.store.count() < 1) {
            this.deselectAll(true);
        }
        else {
            var selectionType = menuItem['selectionType'];
            if (selectionType == 'selectAll') {
                this.selectAll(true);
                this.toggleUiHeader(true);
            }
            else if (selectionType == 'deselectAll') {
                this.deselectAll(true);
                this.toggleUiHeader(false);
            }
            else if (selectionType == 'deselectPage') {
                this.deselectPage(true);
                this.toggleUiHeader(false);
            }
            else {
                this.selectPage(true);
                this.toggleUiHeader(true);
            }
        } 

        this.fireEvent('selectionchange', this, this.selected);

        this.fireEvent('headerselectionchange', this, this.selected, selectionType);

        menu.hide();
	},

    /**
     * @override Add a default getEditor method so the column header
     * doesn't blow up editor grids.
     */
    getHeaderConfig: function() {
        var conf = this.callParent(arguments);

        conf.getEditor = function(){
            return false;
        };

        return conf;
    },

    // binds the store to the selModel.
    bindComponent: function(view) {
        this.callParent(arguments);

        this.selected.setStore(view.getStore());
    },

    maybeFireSelectionChange: function(fireEvent) {
        var me = this;
        if (fireEvent && !me.bulkChange) {
            me.fireEvent('selectionchange', me, me.selected);
        }
    },


    /**
     * Overriding this method so we can slightly modify the way
     * the record is searched for within the grid's store. We need
     * to allow searching by ID, since we like to store decisions
     * across paging requests.
     * @override
     */
    onSelectChange: function(record, isSelected, suppressEvent, commitFn) {
        var me      = this,
            views   = me.views,
            viewsLn = views.length,
            store   = me.store,
            eventName = isSelected ? 'select' : 'deselect',
            i = 0;

        // Look for the record in the store. 1st we'll just check the array
        // for the instance. If it's not there, we'll do a lookup by ID.
        // The lookup by ID is required in cases where we've paged and
        // reloaded the record.
        var rowIdx  = store.indexOf(record);
        if (rowIdx == -1){
            rowIdx = store.indexOfId(record.getId());
        }

        if ((suppressEvent || me.fireEvent('before' + eventName, me, record, rowIdx)) !== false && 
                commitFn() !== false) {

            for (; i < viewsLn; i++) {
                if (isSelected) {
                    views[i].onRowSelect(rowIdx, suppressEvent);
                } else {
                    views[i].onRowDeselect(rowIdx, suppressEvent);
                }
            }

            if (!suppressEvent) {
                me.fireEvent(eventName, me, record, rowIdx);
            }
        }
    }, 
    
    /**
     * Override to deselectAll in SelectionCollection
     */
    deselectAll : function(suppressEvent) {
        this.callParent(arguments);
        this.selected.deselectAll();
        this.maybeFireSelectionChange(!suppressEvent);
    },
    
    /**
     * Override to select all in SelectionCollection
     */
    selectAll : function(suppressEvent) {
        this.callParent(arguments);
        this.selected.selectAll();
        this.maybeFireSelectionChange(!suppressEvent);
    },
    
    
    /**
     * Override onRowMouseDown() to allow the entire grid cell to be clicked to
     * check the box.  This helps on mobile interfaces where the click area is
     * small.
     * 
     * NOTE: There was not a good way to plug this behavior into CheckboxModel,
     * so this code was copied from the parent class and modified to use
     * getCheckboxClickTarget().
     */
    onRowMouseDown: function(view, record, item, index, e) {
        // don't call focus or the browser will sometimes
        // scroll down to the grid the first time a row is clicked 
        // instead of handling the row click correctly.
        // See ext-patches.js.
        //view.el.focus();

        var me = this,
            checker = this.getCheckboxClickTarget(e),
            mode;
        
        if (!me.allowRightMouseSelection(e)) {
            return;
        }

        // checkOnly set, but we didn't click on a checker.
        if (me.checkOnly && !checker) {
            return;
        }

        if (checker) {
            mode = me.getSelectionMode();
            // dont change the mode if its single otherwise
            // we would get multiple selection
            if (mode !== 'SINGLE') {
                me.setSelectionMode('SIMPLE');
            }
            me.selectWithEvent(record, e);
            me.setSelectionMode(mode);
        } else {
            me.selectWithEvent(record, e);
        }
    },
    
    /**
     * Return the click target element from the given click event if the event
     * came from clicking on the checkbox cell.  Note that this allows clicking
     * on the entire grid cell rather than just the checkbox.
     * 
     * @param {Ext.EventObject} e  The click event.
     * 
     * @return {Ext.Element} The checkbox element that was click, or null if
     *    the event did not happen on a checkbox cell.
     */
    getCheckboxClickTarget: function(e) {
        var checker = e.getTarget('.' + Ext.baseCSSPrefix + 'grid-row-checker');
        if (!checker) {
            checker = e.getTarget('.' + Ext.baseCSSPrefix + 'grid-cell');

            if (checker) {
                checker = Ext.fly(checker).down('.' + Ext.baseCSSPrefix + 'grid-row-checker');
            }
        }
        return checker;
    },

    /**
     * Return whether the given event occurred from clicking a checkbox cell.
     * 
     * @param {Ext.EventObject} e  The click event.
     */
    isCheckboxClick: function(e) {
        return !Ext.isEmpty(this.getCheckboxClickTarget(e));
    }
});