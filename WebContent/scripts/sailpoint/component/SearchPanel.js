/**
 * Use this component to construct a search panel for use in 
 */
Ext.define('SailPoint.panel.Search', {
    extend : 'Ext.panel.Panel',
    alias : 'widget.spsearchpanel',
    
    searchBtnText : '#{msgs.button_search}',
    resetBtnText : '#{msgs.button_reset}',
    columns : null,
    fields : null,
    labelAlign : 'left',
    numFieldColumns : 3,

    /**
     * config should contain the following:
     * 
     * fields | columns : (one or the other is required)
     *      fields - Array of field objects to populate into form, in order listed.
     *              Using fields will force the form into a 'table' layout, which means you can add attributes
     *              to your configs to specify colspan, rowspan, cellId, and cellCls.
     *          example: [{field 1, colspan:2}, {field 2, rowspan:2}, {field 3, cellId:'importantCell'}, {field 4, cellCls:'someCSSClass'}]
     *          
     *      columns - Arrays of fields, per column. Use this to specify which fields go in which columns.
     *              Using columns will force the form into a 'column' layout, and each column will be evenly
     *              divided across the whole width.
     *          example: [[{field 1},{field 2},{field 3}], [{field 1},{field 2}], [{field 1}], [{field 1},{field 2}]]
     *          
     * numFieldColumns - (optional) number of columns to use if the fields config is specified. Defaults to 3.
     * doSearch : (required) function to call when search button is clicked.
     * doReset : (required) function to call when reset button is clicked.
     * labelAlign : (optional) Controls the position and alignment of the fieldLabel. Valid values are: 'left', 'top', 'right'. Defaults to 'left'.
     * searchBtnText : (optional) text to use on search button. Defaults to {msgs.button_search}
     * resetBtnText : (optional) text to use on reset button. Defaults to {msgs.button_reset}
     * 
     * The styles for this component are defined in sp-components.css as '.searchPanel', '.searchPanelToolbar', and '.searchPanelField'
     * 
     */
    constructor : function(config) {
        
        if(!config.doSearch || !config.doReset || !(config.columns || config.fields)) {
           // Throw an error because we can't build a panel without doSearch, doReset, or (columns || fields)
            Ext.Error.raise({
                msg : "Unable to create SailPoint.panel.Search. Required data not found in config.",
                config : config
            });
            return null;
        }
        
        this.callParent(arguments);
    },

    initComponent : function() {
        
        //console.log(this.renderTpl);
        
        var me = this;

        var cfg = {
            id : me.id || 'searchForm',
            layout : 'column',
            collapsed : true,
            preventHeader : true, // doesn't work in 4.1
            animCollapse : false, // looks funny when set to true. :-/
            dockedItems : [ {
                xtype : 'toolbar',
                dock : 'bottom',
                layout : {
                    pack : 'end'
                },
                ui : 'footer',
                cls : 'searchPanelToolbar', // defined in sp-components.css
                items : [ {
                    text : me.searchBtnText,
                    cls : 'advSearchBtn',
                    handler: function() { 
                        var p = this.findParentByType('spsearchpanel');
                        if(p) {p.doSearch();}
                    }
                }, {
                    text : me.resetBtnText,
                    handler: function() {
                        var p = this.findParentByType('spsearchpanel');
                        if(p) {p.doReset();}
                    },
                    cls : 'secondaryBtn toolbarRightBtn' // adjusts padding
                } ]
            } ],
            defaults : { // defaults are applied to items[], not this container.
                bodyBorder : false,
                border : false,
                cls : 'searchPanelField' // defined in sp-components.css
            },
            border : false,
            items : [],
            listeners : {
                // Because preventHeader isn't working, do this.
                afterrender : {
                    fn : function() {
                        var head = this.child('header');
                        if (head) {
                            head.setSize(0, 0);
                        }
                    }
                },
                // collapsed padding causes issues on some grids, so remove searchPanel when it's not needed.
                // defined in sp-components.css
                collapse : {
                    fn : function(p) {
                        p.removeCls('searchPanel');
                    }
                },
                beforeexpand : {
                    fn : function(p) {
                        p.addCls('searchPanel'); 
                    }
                }
            }
        };

        if(me.columns) {
            if(Ext.isArray(me.columns) && Ext.isArray(me.columns[0])) {
                var colWidth = 1 / me.columns.length; //columnWidth
                var LA = me.labelAlign;
                
                Ext.each(me.columns, function(col) {
                    var frm = {
                        xtype : 'form',
                        columnWidth : colWidth,
                        fieldDefaults : {labelAlign : LA},
                        items : col
                    };
                    if(me.usePanelFormCSS) {
                        frm.cls = 'searchPanelForm';
                    }
                    cfg.items.push(frm);
                });
            }
            else {
                cfg.items.push({
                    xtype : 'form',
                    fieldDefaults : {labelAlign : me.labelAlign},
                    items : me.columns
                });
            }
            delete me.columns;
        }
        else if(me.fields) {
            cfg.items.push({
                xtype : 'form',
                columnWidth : 1,
                layout : {
                    type : 'table',
                    columns : me.numFieldColumns,
                    tableAttrs: {
                        style : 'width: 100%'
                    },
                    tdAttrs : {
                        style : 'padding: 2px 10px 2px 10px;'
                    }
                },
                style : 'width: 100%',
                fieldDefaults : {labelAlign : me.labelAlign},
                items : me.fields
            });
        }

        /* Bug #21023: limit height of search panel when viewable area is below supported resolution. */
        if(SailPoint.getBrowserViewArea().height <= SailPoint.minSupportedHeight) {
            cfg.maxHeight = 150;
            cfg.bodyStyle = 'overflow-y:scroll;';
        }

        // Merge with any listeners set in the initial config
        Ext.apply(cfg.listeners, me.listeners || {});
        
        Ext.apply(me, cfg);

        this.callParent(arguments);
        
    },
    
    /* useDataValues (optional) : If true, the getModelData method is used to retrieve 
     * values from fields, otherwise the getSubmitData method is used. (defaults to true)
     * 
     * if useDataValues is true (the default) date objects will get translated into 
     * a timestamp.  Otherwise they will be returned as a string.  e.g. "09/27/12"
     */
    getValues : function(useDataValues) {
        if(!Ext.isDefined(useDataValues)) {
            useDataValues = true;
        }
        var vals = {};
        
        // this.items is a mixed collection
        Ext.each(this.items.items, function(form){
            Ext.apply(vals, form.getValues(false, false, false, useDataValues));
        });
        
        // Remove empty attributes and convert dates to timestamps
        Ext.iterate(vals, function(v) {
            if(this[v] == "" || this[v] == null) {
                delete this[v];
            }
            else if(Ext.isDate(this[v])) {
                this[v] = this[v].getTime();
            }
        });
        
        return vals;
    },
    
    // Use this for simple forms
    resetValues : function() {
        Ext.each(this.items.items, function(form){
            Ext.each(form.items.items, function(field) {
                if(field.reset) {
                    field.reset();
                }
                else if(field.clear) {
                    field.clear();
                }
            });
        });
    },
    
    // Use this if you have forms with complex components (e.g. a container holding two date fields)
    resetRecursive : function(comp) {
        if(comp && comp.items && comp.items.items) {
            Ext.each(comp.items.items, function(form) {
                if(form.items && form.items.items) {
                    Ext.each(form.items.items, function(field) {
                        if(field.items && field.items.items) {
                            if(field.reset) {
                                field.reset();
                            }
                            else if(field.clear) {
                                field.clear();
                            }
                            else if(comp.resetRecursive) {
                                comp.resetRecursive(field);
                            }
                        }
                        else if(field.reset) {
                            field.reset();
                        }
                        else if(field.clear) {
                            field.clear();
                        }
                    });
                }
                else if(form.reset) {
                    form.reset();
                }
                else if(form.clear) {
                    form.clear();
                }
            });
        }
    }

});