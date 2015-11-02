/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Cell renderer which may be added to a grid to add action buttons similiar to
 * what we do on the certification worksheet view. You can define the actions
 * available by specifying an array of action object. Each object should specify:
 * - name: Action name which will be included in the event fired on the parent grid
 * - class: class or classes to apply to the action button
 * - helpText: Toolip help text to apply to the button
 *
 * To implement:
 *
 * 1. Create styles for your actions which specifies a background icon.
 * 2. Add an event handler to your grid for the event cellActionClick.
 * 3. Create an instance of this plugin, passing it the width and action names.
 * 4. Add plugin instance to your column config and the grid's plugins property.
 *
 * @cfg actions {String Array} Array of actions available on this grid.
 * @cfg width {Integer} Cell Width
 * @cfg header {String}[Optional] Header name
 * @cfg beforeRender {Function}[Optional] This function will be called before the action is rendered.
 * If the function returns false, the button will not be rendered. The function is passed the record
 * for the current row.
 */
Ext.define('SailPoint.grid.CellActionPlugin', {
	extend : 'Ext.util.Observable',
	
	constructor : function(config){
		Ext.apply(this, config);

		this.callParent(arguments);

	    // Define this here so the config stays in scope.
	    this.renderer = function(v, p, record){
	        var output = "";
	        config.actions.each(function(action){
	            var actionName = action.name;
	            var cls = 'x-grid-action gridaction-' + actionName;
	            if (action.cls)
	               cls += ' ' + action.cls;
	            if (!action.beforeRender || action.beforeRender.call(this, record))
	                output += '<div class="'+cls+'" title="'+action.helpText+'">&#160;</div>';
	        });
	        return output;
	    };
	},
    header: "",
    width: 30,
    sortable: false,
    fixed:true,
    menuDisabled:true,
    dataIndex: '',
    actions : [],
    grid:null,

    init : function(grid){
        this.grid = grid;

        grid.addEvents(
            /**
            * @event cellAction
            * Fires when a button created by CellActionPlugin
            * is clicked.
            * @param {Ext.EventObject} e, {String} actionName, {Integer} rowIndex
            */
            'cellActionClick'
        );


        var view = grid.getView();
        grid.on('render', function(){
            view.on('mousedown', this.onMouseDown, this);
        }, this);
    },

    onMouseDown : function(e, t){
        var target = Ext.get(t);
        if(target.hasCls('x-grid-action')){
            var classes = t.className.split(' ');
            var row = e.getTarget('.x-grid-row');
            for(var i=0;i<classes.length;i++){
                if (classes[i].substr(0,11) === 'gridaction-'){
                    var action = classes[i].substr(11,classes[i].length);
                    this.grid.fireEvent('cellActionClick', action, row.rowIndex);
                }
            }
            e.stopEvent();
        }
    }
});
