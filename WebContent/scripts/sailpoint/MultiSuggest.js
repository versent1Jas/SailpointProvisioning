/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

////////////////////////////////////////////////////////////////////////////////
//
// MULTI SUGGEST STORE
//
////////////////////////////////////////////////////////////////////////////////

/**
 * This is simple extension of JsonStore to add a findExact method for exact value 
 * matching when adding records.
 *
 * @class   SailPoint.MultiSuggestStore
 * @extends Ext.data.Store
 */

Ext.define('SailPoint.MultiSuggestStore', {
    extend : 'Ext.data.Store',

    /**
     * Finds the index of the first matching record in this store by exact property/value.
     */
    findExact: function(property, value, start){
        return this.data.findIndexBy(function(rec){
            return rec.get(property) === value;
        }, this, start);
    }
});

////////////////////////////////////////////////////////////////////////////////
//
// BASE MULTI SUGGEST
//
////////////////////////////////////////////////////////////////////////////////

/**
 * A base class for multi suggest components.  This class handles rendering the
 * suggest component and modifying the underlying store when values are added or
 * selected.  Subclasses should extend this to render the "multi" part of the
 * suggest (ie - the current selections) and handle the logic to remove items
 * from the list, order the items (if supported), etc...
 *
 * @class   SailPoint.BaseMultiSuggest
 * @extends Ext.Panel
 * @author  Derry Cannon, Kelly Grizzle
 */
Ext.define('SailPoint.BaseMultiSuggest', {
    extend : 'Ext.panel.Panel',
    mixins : {
        // Since this component acts like a field, we need the validation functions
        // that go along with a 'proper' field.
        fieldSupport : 'Ext.form.field.Field'
    },
    /**
     * @cfg {String} Specify a suggest type to use a pre-built suggest component (typical usage).
     */
    suggestType: undefined,

    /**
     * @cfg {SailPoint.Suggest} Optionally provide a suggest component to use instead of a pre-built.
     */
    suggest: undefined,

    /**
     * @cfg {Object} JSON-formatted data to provide initial values.
     */
    jsonData: undefined,

    /**
    * @cfg {String} A csv list of ids to exclude from the results presented by the multi-suggest
    * If you pass in a string representation of a list of ids, the datasource will exclude
    * those ids out of the results
    */
    exclusionIds: '',

    /**
     * @cfg {String} Input field that will receive the values of the multisuggest selections.
     */
    inputFieldName: undefined,

    /**
     * @cfg {boolean} When set to true the input field value will be formatted
     * as a newline-delimited string rather than a comma-delimited string.
     */
    newlineDelimitedValue: false,
    
    /**
     * @cfg {Boolean} A border isn't usally needed since the components have borders of their own.
     */
    border: false,

    /**
     * @cfg {Number} Width of the suggest component's list of results, which
     * defaults to the width of the multisuggest unless specified
     */
    listWidth: undefined,

    /**
     * @cfg {Number} Height of the suggest component's list of results
     */
    listHeight: undefined,

    /**
     * @cfg {String} Default to eraseTdPadding so that rendering isn't messed up if we are
     * inside of an sptable.
     */
    cls: 'eraseTdPadding',
    
    /**
     * @cfg {String/Object/Function} Default the bodyStyle to "transparent"
     * rather than the typical panel style of a white background.  This allows
     * the component to blend with its background rather than looking disjointed.
     */
    bodyStyle: 'background: transparent',

    /**
     * @cfg {String} Text to display in the combo box.  e.g. "Add Item"
     */
    emptyText: undefined,
    
    /**
     * @cfg {Array} Array of fields to be maintained in the selected store.  
     * The specified fields are in addition to id and displayField
     */
    extraFields: undefined,
    
    /**
     * @cfg {Number} Width of the combo box.  If this is left unspecified the 
     * combobox will match the width of the grid below it.  This should only be
     * set when the selected grid's headers are displayed and more than one column
     * is available 
     */
    comboWidth: undefined,
    
    /**
     * @cfg {boolean} This determines when an item is added to the suggest whether we
     * sort it. We need to sometimes turn it off when we want to reorder the items that
     * are being displayed in the grid. 
     * 
     */
    sortOnAdd : true,

    initComponent: function() {
        this.callParent(arguments);

        this.addEvents(
            /**
             * @event addSelection
             * Fires when an item is added to this multi suggest
             * @param {MultiSuggest}      suggest  This MultiSuggest.
             * @param {Ext.data.Record[]} records  The records that were added.
             * @param {Number}            index    The index at which the value was added.
             */
            'addSelection',

            /**
             * @event removeSelection
             * Fires when an item is removed from this multi suggest
             * @param {MultiSuggest}    suggest  This MultiSuggest.
             * @param {Ext.data.Record} record   The record that was removes.
             * @param {Number}          index    The index at which the value was removed.
             */
            'removeSelection',

            /**
             * @event select
             * Fires when an item is selected from the suggest list.
             * @param {MultiSuggest}      suggest  This MultiSuggest.
             * @param {Ext.data.Record[]} record   The records that were selected.
             * @param {Object}            eOpts    The listener options.
             */
            'select'
        );

        // Provide a default of no data if none was supplied.
        this.jsonData = this.jsonData || { totalCount: 0, objects: [] };
        
        // determine the suggest type if given - if there's no suggest type,
        // the suggest component must be specified in the constructor
        if (this.suggestType) {

            // Pull the forceSelection config from the multisuggest onto the suggest.
            var suggestConfig = {};
            if (typeof this.forceSelection !== 'undefined' && !this.forceSelection) {
                suggestConfig.forceSelection = false;
            }
            
            if(this.valueField) {
              suggestConfig.valueField = this.valueField;
            }

            if (this.baseParams) {
                suggestConfig.baseParams = this.baseParams;
            }
            
            if (this.extraParams) {
                suggestConfig.extraParams = this.extraParams;
            }
            
            if (this.loadBindings) {
                suggestConfig.loadBindings = this.loadBindings;
            }
            
            if(this.listWidth) {
                suggestConfig.listConfig = {width : this.listWidth};
            }
            
            if (this.emptyText) {
                suggestConfig.emptyText = this.emptyText;
            }
            
            if (this.extraFields) {
                suggestConfig.fields = [ 'id', 'displayName' ].concat(this.extraFields);
            }

            // For this suggest we don't want the icon in the input field of the suggest
            suggestConfig.addIconToInput = false;
            this.suggest = SailPoint.SuggestFactory.createSuggest(this.suggestType, this.renderTo,
                                                       this.exclusionIds, this.emptyText,
                                                       suggestConfig);
        }

        // synch the size of the suggest with the size of the multisuggest
        Ext.apply(this.suggest, {
            width: this.comboWidth ? this.comboWidth : (this.width || 300),
            style:'margin-bottom: 0px;'
        });

        // use the displayField from the suggest component
        this.displayField = this.suggest.displayField;

        // update the select function for our uses here
        this.suggest.addListener('select', this.addItem, this);

        // Let the MultiSuggest fire a select event when an item is selected on
        // the underlying Suggest.  This allows the MultiSuggest to have a more
        // common interface with Suggest.
        this.relayEvents(this.suggest, ['select']);
        
        // Create a panel to hold the suggest and optionally the "add" button.
        this.suggestPanel = new Ext.Panel({
            border: false,
            layout: 'column',
            bodyStyle: 'background: transparent'
        });

        // For some reason the suggest doesn't render correctly when it starts
        // hidden unless it is in a panel, so put it in a panel.
        var suggestPanelConfig = {
            width: this.padSuggest ? this.suggest.width + 10 : this.suggest.width,
            border: false,
            items: [this.suggest]
        };
        
        if (this.padSuggest) {
            suggestPanelConfig.bodyPadding = 5;
            suggestPanelConfig.bodyStyle = 'background: transparent';
        }
        var suggestContainer = new Ext.Panel(suggestPanelConfig);
        this.suggestPanel.add(suggestContainer);

        // If we're not forcing ion, add a button that can add a value.
        if (typeof this.forceSelection !== 'undefined' && !this.forceSelection) {
            this.addBtn = new Ext.Button({
                text: '#{msgs.multi_suggest_add_new_value}'
            });
            this.addBtn.on('click', function() { this.addNewValue(); }, this);

            // Put the button in a panel so it will also layout correctly.
            var btnContainer = new Ext.Panel({
                columnWidth: 0.9,
                border: false,
                items: [this.addBtn]
            });
            this.suggestPanel.add(btnContainer);
        }

        // Now add the suggest panel to ourselves.
        this.add(this.suggestPanel);

        // Setup the basic JSON store.
        this.createBasicJsonStore(this.extraFields);

        // Fire our addSelection event when something is added to the store.
        var recordAddedHandler = function(store, records, index) {
            this.suggest.clearValue();
            this.fireEvent('addSelection', this, records, index);
        };
        this.selectedStore.on('add', recordAddedHandler, this);

        // Fire our removeSelection event when something is removed from the store.
        var recordRemovedHandler = function(store, record, index) {
            this.suggest.clearValue();
            this.fireEvent('removeSelection', this, record, index);
        };
        this.selectedStore.on('remove', recordRemovedHandler, this);

        // When the store changes, update the input field.
        this.selectedStore.on('add', this.updateInputField, this);
        this.selectedStore.on('clear', this.updateInputField, this);
        this.selectedStore.on('datachanged', this.updateInputField, this);
        this.selectedStore.on('update', this.updateInputField, this);
        this.selectedStore.on('remove', this.updateInputField, this);

        // the ids of the existing selections will have been
        // converted to names.  We need to convert them back.
        this.updateInputField();
    },
    
    afterRender: function(ct, position) {
        var element;
        
        this.callParent(arguments);

        if (this.required) {
            this.addCls('required-multi-suggest');
          
            element = this.getEl();

            element.first().addCls('float-wrap');
            element.first().insertSibling({
                tag: 'span',
                cls: 'requiredText',
                html: '*'
            }, 'after');

            element.setWidth(element.getWidth()+10);
        }
    },
    
    /**
     * Return the focus element for this component.
     */
    getFocusEl: function() {
        return this.suggest.getFocusEl();
    },

    /**
     * @private Create a basic JsonStore that is preloaded with data formatted
     * with sp:basicJSONData.  This also added case-insensitive sorting.
     * Consider splitting this out into its own class.  This sets the
     * selectedStore property.
     */
    createBasicJsonStore: function(extraFields) {
        var fields = [
            'id',
            'displayField',
            'name',
            'icon'
        ];
        if (extraFields) {
            fields = fields.concat(extraFields);
        }
        
        this.selectedStore = SailPoint.Store.createStore({
            // the storeId prevents name collisions in the StoreMgr
            storeId: this.renderTo + '_msStore',
            data: this.jsonData,
            root: 'objects',
            proxyType: 'memory',
            gridId: this.id,
            fields: fields//,

            // override the native sort to be case-insensitive by
            // switching the field value to upper case before comparison
            // TODO extjs: This is ExtJS 2.3 version, should update with multisort found in 3.4.0?
//            sortData: function() {
//                var f = this.sortInfo.field;
//                var direction = this.sortInfo.direction || 'ASC';
//                var st = this.fields.get(f).sortType;
//                var fn = function(r1, r2) {
//                    var v1 = st(r1.data[f]).toUpperCase(), v2 = st(r2.data[f]).toUpperCase();
//                    return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
//                };
//                this.data.sort(direction, fn);
//                if(this.snapshot && this.snapshot != this.data) {
//                    this.snapshot.sort(direction, fn);
//                }
//            }
        });
    },

    // disabling the entire component panel results in a gray
    // blob in IE, so just disable the individual components
    disable: function() {
        this.suggest.disable();
        
        var inputField = $(this.inputFieldName);
        if(inputField) {
          inputField.disabled = true;
        }
        // Disable the add button if there is one.
        if (this.addBtn) {
            this.addBtn.disable();
        }
    },

    enable: function() {
        this.suggest.enable();
        var inputField = $(this.inputFieldName);

        if(inputField) {
          inputField.disabled = false;
        }

        // Enable the add button if there is one.
        if (this.addBtn) {
            this.addBtn.enable();
        }
    },

    /**
     * Collapse the suggest component dropdown if being displayed.
     */
    collapse: function() {
        this.suggest.collapse();
    },
    
    /**
     * Return whether this suggest was interacted with (ie - the list was
     * displayed or hidden, the list was paged, etc...) within the last
     * "threshold" milliseconds.
     * 
     * @param {Number} threshold  The number of milliseconds since now to check
     *    for an interaction.
     * 
     * @return {Boolean} True if this suggest was interacted with within the
     *    last "threshold" milliseconds.
     */
    recentInteraction: function(threshold) {
        return this.suggest.recentInteraction(threshold);
    },
    
    /**
     * @private Add the item selected from the suggest component to the display grid.
     *
     * There's a neat bit of inherent flexibility here that we can take advantage of.
     * It turns out that Stores are pretty forgiving.  If the given record doesn't have
     * a 'displayField' defined, we can still set it.  If it does, we've simply overwritten
     * it with itself.  The nice part here is that it doesn't matter what kind of record
     * comes in - once we add/update the 'displayField' and add the record to the
     * store, the grid will show it.  Since we're adding the record directly, not reading
     * it from a data source, then it doesn't matter whether or not the record's fields
     * line up exactly with the fields defined for the Store's reader.  Pretty nifty...
     */
    addItem: function(suggest, record, index) {

        // Return if the record has already been added.
        var valueField = this.suggest.valueField;
        var idx = this.selectedStore.findExact(valueField, record[0].get(valueField));
        if (idx != -1) {
            this.suggest.clearValue();
            return;
        }

        // This is a new item so set the display field.
        var rField = record[0].data[this.displayField];

        // If a selectedRenderer was specified, use it.
        if (this.selectedRenderer) {
            rField = this.selectedRenderer(this, record[0]);
        }
        
        // Still no display field value, default to something reasonable.
        if (!rField) {
            rField = (record[0].data['displayableName']) ? record[0].data['displayableName'] : record[0].data['name'];
        }

        record[0].set('displayField', Ext.util.Format.htmlEncode(rField));
        this.selectedStore.add(record[0]);
        if (this.sortOnAdd) {
            this.selectedStore.sort({property: 'displayField', direction: 'ASC'});
        }
    },

    /**
     * @private Handler for the "add" button that will add a new record to the
     * store with the text currently entered into the suggest.
     */
    addNewValue: function(evt) {

        var val = this.suggest.getRawValue();

        // Only add if there is a value.
        if (!val || '' === val.trim()) {
            return;
        }
        
        // Create a datasource for the JsonStore.
        var data = {
            totalCount: 1,
            objects: [{ id: val, displayField: val }]
        };

        // Load the data - the "true" says to append the record rather than
        // overwrite everything in the store.
        this.selectedStore.loadRawData(data, true);
        
        this.suggest.clearValue();
        this.suggestPanel.hide();        
    },

    /**
     * @private Update the value of the hidden input field with the values of
     * the items currently in the store.
     */
    updateInputField: function() {
        var i, vals, stringVal, delim,
            valueField = this.suggest.valueField,
            inputField = this.getInputField();
        
        if(inputField) {

          /** In the json that initializes the multi-suggest, there is no 'displayName' value
           * set, it uses 'displayField' instead, so we have to map displayName to displayField
           * since the displayName record is stored in the suggest store under displayField.  Bug 8250: PH
           */
          if(valueField === 'displayName') {
              valueField = 'displayField';
          }
          
          stringVal = vals = this.selectedStore.collect(valueField);
          
          if ((null != vals) && this.newlineDelimitedValue) {
              stringVal = '';
              delim = '';
              for (i = 0; i < vals.length; i++) {
                  stringVal += delim + vals[i];
                  delim = '\n';
              }
          }

          inputField.value = stringVal;
        }
    },
    /**
     * @protected Returns the dom element that represents the inputFieldName. This may be overridden in cases where
     * you can not look up the inputFieldName by the dom element id.
     */
    getInputField: function() {
        return $(this.inputFieldName);
    },

    getValue: function () {
      return this.selectedStore.collect(this.suggest.valueField);
    },

    setValue: function (data) {
      this.selectedStore.loadData(data);
    },

    getData : function () {
        var i, obj, record,
            count = this.selectedStore.getCount(),
            data = {totalCount: count, objects:[]};

        for(i = 0; i < count; i++) {
            obj = {};
            record = this.selectedStore.getAt(i);
            obj.id = SailPoint.Utils.getRecordId(record);
            obj.displayField = record.get('displayField');
            data.objects.push(obj);
        }

        return data;
    },

    /**
     * Removes all selected items from the multi-suggest and clears the suggest itself
     */
    clear: function() {
        this.selectedStore.removeAll();
        this.suggest.clearValue();
    },
    
    /**
     * Reloads the suggest's store with new optional exclusion ids
     */
    reload: function(exclusionIds) {
      if(exclusionIds) {
        this.suggest.store.getProxy().extraParams['exclusionIds'] = exclusionIds;
      }
      this.suggest.store.load();
    },

    /**
     * Return the number of items in the multi suggest.
     */
    getSelectedCount: function() {
        return this.selectedStore.getCount();
    },
    
    /**
     * Add a base parameter value to this suggest.
     */
    addBaseParam: function(paramName, value) {
        this.suggest.addBaseParam(paramName, value);
    },

    /**
     *  a base parameter value from this suggest.
     */
    removeBaseParam: function(paramName, value) {
        this.suggest.removeBaseParam(paramName, value);
    },

    /**
     * Restore the original base params if any modifications have been made with
     * addBaseParam() or removeBaseParam().
     */
    restoreOriginalBaseParams: function() {
        this.suggest.restoreOriginalBaseParams();
    }
});


////////////////////////////////////////////////////////////////////////////////
//
// MULTI SUGGEST
//
////////////////////////////////////////////////////////////////////////////////

/**
 * This component allows the user to build a list of choices with the
 * assistance of a suggest component.  I stole LIBERALLY from Jonathan's
 * GroupedItemSelector.js for this.
 *
 * @class   SailPoint.MultiSuggest
 * @extends SailPoint.BaseMultiSuggest
 * @author  Derry Cannon, Kelly Grizzle
 */
Ext.define('SailPoint.MultiSuggest', {
    extend : 'SailPoint.BaseMultiSuggest',
    alias : 'widget.multiSuggest',
    
    /**
     * Default width of the multisuggest
     */
    width: 300,

    /**
     * Enable/disable manual sorting of the multisuggest selected items.
     */
    sortable: false,

    /**
     * CSS style specific to this multisuggest component.
     */
    cls: 'multisuggest',
    
    allSelected: false,
    
    /**
     * @cfg {Object} Set of properties that will override or append to the default
     * properties used to create the selected grid.  This enables the selected grid
     * headers to be displayed and/or to configure the selected grid's columns
     */
    gridOverrides: undefined,
    
    initComponent:function() {
        var gridConfig;
        this.callParent(arguments);

        // grid containing selected items
        // can't use paging b/c we don't have a way to page the
        // data to the store - it's all loaded at once from the bean
        gridConfig = {
            store: this.selectedStore,
            columns: [{
                name: 'displayField',
                dataIndex: 'displayField',
                width: this.width,
                sortable: true,
                renderer: SailPoint.MultiSuggest.renderRemove
            }],
            columnWidth:.9,
            height: this.listHeight || 128,
            autoScroll: true,
            hideHeaders: true,
            forceFit: true,
            viewConfig: {                
                scrollOffset: 1
            }
        };

        
        if (this.gridOverrides) {
            Ext.apply(gridConfig, this.gridOverrides);
        }
        
        this.selectedGrid = Ext.create('Ext.grid.Panel', gridConfig);

        this.selectedGrid.addListener('itemcontextmenu', this.doNothing, this);

        if(this.sortable) {
          this.addEvents('moveStart', 'moveEnd');

          this.selectedGrid.addListener('itemclick', this.activateButtons, this);
          thisHTML = '<br/><br/><a href="javascript:Ext.getCmp(\''+this.id+'\').moveSelectedRow(-1)">';
          thisHTML+= '<img id="'+this.id+'_up" style="margin:3px" src="'+SailPoint.getRelativeUrl('/images/icons/arrow_button_up_disabled_20.png')+'"></a><br/>';
          thisHTML+= '<a href="javascript:Ext.getCmp(\''+this.id+'\').moveSelectedRow(1)">';
          thisHTML+= '<img id="'+this.id+'_down" style="margin:3px" src="'+SailPoint.getRelativeUrl('/images/icons/arrow_button_down_disabled_20.png')+'"></a>';

          this.sidebar = new Ext.Panel({
            border:false,
            html:thisHTML,
            columnWidth:.10,
            height:128
          });

          // add a little padding to the sidebar
          Ext.apply(this.sidebar, {style: 'text-align: center; padding: 5px 0px 5px 0px'});

          this.gridWrapper = new Ext.Panel({
            border:false,
            layout:'column',
            items:[this.selectedGrid, this.sidebar]
          });

          this.add(this.gridWrapper);
        } 
        else {
          if (this.sortOnAdd) {
              this.selectedStore.sort('displayField','ASC');
          }
          this.add(this.selectedGrid);
        }
    },

    doNothing: function(grid, record, item, index, event, options) {
        // swallow the event
        event.stopEvent();
    },

    // disabling the entire component panel results in a gray
    // blob in IE, so just disable the individual components
    disable: function() {
        this.callParent(arguments);
        this.selectedGrid.disable();
    },

    enable: function() {
        this.callParent(arguments);
        this.selectedGrid.enable();
    },
    
    blur: function() {
        this.suggest.blur();
    },

    removeItem: function(grid, row, col, event) {
        grid.getStore().remove(grid.getStore().getAt(row));
    },

    removeSelectedItem: function() {
        var record = this.selectedGrid.getSelectionModel().getSelection()[0];
        this.selectedGrid.getStore().remove(record);
    },

    activateButtons: function() {
      var upImg = $(this.id+'_up');
      var downImg = $(this.id+'_down');
      upImg.src = SailPoint.getRelativeUrl('/images/icons/arrow_button_up_20.png');
      downImg.src = SailPoint.getRelativeUrl('/images/icons/arrow_button_down_20.png');
    },

    moveSelectedRow: function(direction) {
      var record = this.selectedGrid.getSelectionModel().getSelection()[0];
      if (!record) {
        return;
      }
      var index = this.selectedGrid.getStore().indexOf(record);
      if (direction < 0) {
        index--;
        if (index < 0) {
          return;
        }
      } else {
        index++;
        if (index >= this.selectedGrid.getStore().getCount()) {
          return;
        }
      }
      this.fireEvent('moveStart');
      this.selectedGrid.getStore().remove(record);
      this.selectedGrid.getStore().insert(index, record);
      this.selectedGrid.getSelectionModel().select(index);
      this.fireEvent('moveEnd');
    },

    statics: {
        renderRemove: function(value, p, rec, rowIndex, colIndex, store) {
            var removeButton =
                '<a href="#" ' +
                'onclick="Ext.getCmp(\''+store.gridId+'\').removeSelectedItem(); return false;" />' +
                '<img src="' + SailPoint.getRelativeUrl('/images/icons/remove_grey_12.png') + '" ' +
                'onMouseOver="this.src=\'' + SailPoint.getRelativeUrl('/images/icons/remove_12.png') + '\'" ' +
                'onMouseOut="this.src=\'' + SailPoint.getRelativeUrl('/images/icons/remove_grey_12.png') + '\'" ' +
                'height="12" width="12" />' +
                '</a>';

            var icon;
            if ( rec ) {
                if ( rec.data ) {
                    var iconStyle = rec.data['icon'];
                    if ( iconStyle ) {
                        var imageName = "/images/icons/user.png";
                        if ( iconStyle == "groupIcon" )
                            imageName = "/images/icons/group.png";
                        var src = SailPoint.getRelativeUrl(imageName);
                        icon = '<img src="' + src +'" />';
                    }
                }
            }
            if ( icon )
                return Ext.String.format('{0} {1} {2}',removeButton, icon, value);
            else
                return Ext.String.format('{0} {1}',removeButton, value);
        }
    },
    
    /**
     * Return whether "select all" is checked.
     */
    isAllSelected: function() {
        return this.allSelected;
    },
    
    /**
     * A "select all" checkbox was selected for this MultiSuggest.  When checked
     * this will disable input and add the allSelectedMsg to the suggest box.
     * When unchecked, the previously selected items are restored and the
     * suggest is enabled again.
     * 
     * @param  isChecked       Whether the "select all" box is checked or not.
     * @param  allSelectedMsg  The message to display when "select all" is checked.
     * @param  allowUnselect   Whether we should allow unselecting "select all".
     */
    toggleSelectAll: function(isChecked, allSelectedMsg, allowUnselect) {
        if (isChecked) {
            this.allSelected = true;
            this.suggest.setRawValue(allSelectedMsg);
            this.disable();

            // Cache any currently selected options
            if (this.selectedStore.getCount() > 0) {
                this.cachedSelectedValues = this.selectedStore.getRange();
                this.selectedStore.removeAll();
            }
        }
        else if (allowUnselect) {
            this.allSelected = false;
            this.suggest.setRawValue('');
            this.enable();

            // restore any cached selections and null out the cache
            if (null != this.cachedSelectedValues) {
                this.selectedStore.insert(0, this.cachedSelectedValues);
                if (this.sortOnAdd) {
                    this.selectedStore.sort('displayName', 'ASC');
                }
                this.cachedSelectedValues = null;
            }
        }
    },
    
    hasValue: function() {
        return (this.getValue().length > 0) || this.isAllSelected();
    },
    
    getCsvValue: function() {
        return this.getValue().join();
    }
});


/**
* <p>Utility method used to convert specially constructed
* blocks of html into suggest components. See docs for
* SailPoint.Suggest.renderSuggests for a full description.
* </p>
*
* @param {}
*/
SailPoint.MultiSuggest.renderSuggests = function(suggestDivs, confLookup) {

   if (!suggestDivs) {
       suggestDivs = Ext.DomQuery.select('div[class*=suggestInput]');
   }
   if (!confLookup) {
       confLookup = SailPoint.Suggest.getSuggestConf;
   }

    var i, inputDiv, extElem, rawInput, JSFInput, conf, data;

   for (i = 0; i < suggestDivs.length; ++i) {

       inputDiv = suggestDivs[i];

       // ie7 doesn't seem to support hasClassName..
       extElem = Ext.get(inputDiv);

       if (extElem.hasCls('multi')){

           rawInput = Ext.DomQuery.selectNode('*[class=suggestRawInput]', inputDiv);
           JSFInput = Ext.DomQuery.selectNode('input[type=hidden]', inputDiv);

           conf = {'binding' :  JSFInput};
           if (confLookup) {
              confLookup.call(conf, inputDiv);
           }

           data = "";
           if (rawInput.value) {
              data = Ext.decode(rawInput.value);
           }
           else if (rawInput.innerHTML) {
              data = Ext.decode(rawInput.innerHTML);
           }

           conf.inputFieldName = JSFInput;
           conf.jsonData = data;
           conf.renderTo = inputDiv;

           Ext.create('SailPoint.MultiSuggest', conf);
       }
   }
};


////////////////////////////////////////////////////////////////////////////////
//
// COMPACT MULTI SUGGEST
//
////////////////////////////////////////////////////////////////////////////////

/**
 * A compact multi suggest is similar to the multi suggest component except that
 * all selected values are rendered on a single line as text and have add/remove
 * buttons that allow changing the values.  This is useful to save real estate
 * when you expect only a few values to be selected.
 *
 * @class   SailPoint.CompactMultiSuggest
 * @extends SailPoint.BaseMultiSuggest
 * @author  Kelly Grizzle
 */
Ext.define('SailPoint.CompactMultiSuggest', {
    extend : 'SailPoint.BaseMultiSuggest',
    alias : 'widget.compactMultiSuggest',
    
    /**
     * @cfg {String} noneSelectedText  The string to display when no items have
     * been added to the multi suggest.  Defaults to "None" (i18n'd).
     */
    noneSelectedText: '#{msgs.multi_suggest_none_selected_text}',

    /**
     * Initialize the component.
     */
    initComponent: function() {

        // The superclass will create the suggest component and add button.
        this.callParent(arguments);

        this.ignoreClicks = this.disabled || false;

        // Create a template for the list panel that will render all items
        // in the selectedStore with +/- icons to add and remove values.
        this.listPanelTpl = new Ext.XTemplate(
            '<tpl if="0 == totalCount">',
            '  {noneSelectedText} ',
            '</tpl>',
            '<tpl for="data">',
            '  {[xindex != 1 ? ", " : ""]}',
            '  {displayField}',
            '  <img onclick="Ext.getCmp(\'' + this.id + '\').removeClicked(\'{[ values.id.replace("\\\'", "\\\\\'") ]}\');"',
            '       src="' + SailPoint.getRelativeUrl('/images/icons/minus.png') + '"',
            '       height="12" width="12"',
            '       class="compactMultiSelectControl" />',
            '</tpl>',
            '<img onclick="Ext.getCmp(\'' + this.id + '\').addClicked();"',
            // Notice the <tpl if...> here .. for some reason the tertiary (? :) operator wasn't working.
            '     src="' + SailPoint.getRelativeUrl('/images/icons/plus.png') + '"',
            '     height="12" width="12"',
            '     class="compactMultiSelectControl"  />'
        );

        // Create the list panel with the elements and the plus/minus icons.
        // Put this above the suggest field that the parent has already added.
        this.insert(0, this.createListPanel());

        // Hide the suggest box until an add is requested.
        this.suggestPanel.hide();

        // When a value is added to the multi-suggest, hide the suggest field.
        this.on('addSelection', function() { 
                           this.suggestPanel.hide();
                           // On IE7 the caret is still blinking if you select
                           // with an arrow key then hit enter.  Blur after
                           // selection to avoid this.
                           this.suggest.getEl().blur();
                       },
                this);
    },

    /**
     * @private Callback to refresh the list panel's template when the data
     * changes.
     */
    refreshTpl: function() {
        var data = [];
        var records = this.selectedStore.getRange();
        for (var i=0; i<records.length; i++) {
            data.push(records[i].data);
        }
        
        var values = {
            data: data,
            totalCount: data.length,
            noneSelectedText: this.noneSelectedText,
            disabled: this.ignoreClicks
        };
        
        this.listPanel.update(values);
    },

    /**
     * @private Create the list panel and hook it up to refresh when the store
     * changes.
     *
     * @return The Ext.Panel with the list of items.
     */
    createListPanel: function() {

        // The inner element of the panel will get explicitly overwritten by
        // the template, so we don't need to add anything to it.
        this.listPanel = new Ext.Panel({
            border: false,
            layout: 'fit',
            tpl: this.listPanelTpl,
            data: {
                totalCount: 0,
                data: [],
                noneSelectedText: this.noneSelectedText,
                disabled: this.ignoreClicks
            }
        });

        // When the panel is rendered initially, refresh the template.
        this.listPanel.on('render', this.refreshTpl, this);

        // When the store changes, refresh the template.
        this.selectedStore.on('add', this.refreshTpl, this);
        this.selectedStore.on('clear', this.refreshTpl, this);
        this.selectedStore.on('datachanged', this.refreshTpl, this);
        this.selectedStore.on('remove', this.refreshTpl, this);
        this.selectedStore.on('update', this.refreshTpl, this);

        return this.listPanel;
    },

    disable: function() {
        this.callParent(arguments);
        this.ignoreClicks = true;
        this.refreshTpl();
    },

    enable: function() {
        this.callParent(arguments);
        this.ignoreClicks = false;
        this.refreshTpl();
    },

    /**
     * @private Handler called when the add button is clicked.
     */
    addClicked: function(id) {
        // If not enabled, just return.
        if (this.ignoreClicks) {
            return;
        }

        // Toggle visibility.
        this.suggestPanel.setVisible(!this.suggestPanel.isVisible());

        // If we're enabling, focus on the suggest.
        if (this.suggest.isVisible()) {
            this.suggest.focus();
        }
    },

    /**
     * @private Handler called when a remove button is clicked next to an item.
     *
     * @param  id  {String} The ID of the record that was clicked.
     */
    removeClicked: function(id) {
        if (this.ignoreClicks) {
            return;
        }

        var record = this.selectedStore.getById(id);
        if (null == record) {
            alert('Record is null: ' + id);
            return;
        }

        this.selectedStore.remove(record);

        // Hide the suggest if it's showing.
        this.suggestPanel.hide();
    }
});