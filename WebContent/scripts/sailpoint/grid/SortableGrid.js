/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * @class SailPoint.grid.SortableGrid
 * @extends Ext.grid.GridPanel
 * This extends a standard grid panel by adding sort buttons to the left side which allow users to
 * sort the grid contents.
 */
Ext.define('SailPoint.grid.SortableGrid', {
	extend : 'Ext.grid.Panel',
	alias : 'widget.sortablegrid',

    /**
     * @cfg {boolean} True if the grid sort buttons should be displayed. Defaults to true.
     */
    showSortButtons : true,

    /**
     * @cfg {boolean} True if a remove button should be added to each row. Defaults to true.
     */
    showRemoveButton : true,

    /**
     * @cfg {boolean} True if values are allowed to be clicked. Defaults to false.
     */
    allowValueClick: false,

    statics: {
        valueClicked: function(cmpId, idx) {
            var grid = Ext.getCmp(cmpId),
                record;

            if (grid) {
                record = grid.getStore().getAt(idx);
                if (record) {
                    grid.fireEvent('recordClicked', record);
                }
            }
        }
    },

    constructor: function(config) {

       if (!config.height)
           config.height = 150;

       if (config.showSortButtons && config.width)
           config.width = config.width - 28;

       this.callParent(arguments);
    },

    initComponent : function() {
        this.callParent(arguments);

        this.addEvents(
	        /**
	         * @event recordRemoved
	         * Fires when a record is removed from the underlying store.
	         */
	        'recordRemoved',

            /**
             * @event recordClicked
             * Fires when a record has been clicked.
             */
            'recordClicked'
        );

        if (this.showRemoveButton || this.allowValueClick){
            this.headerCt.getHeaderAtIndex(0).renderer = this.renderRemove;
        }

        // This method will be used to remove records when the user
        // clicks on the X icon in the selection grid.
        this.getStore().removeById = function(id){
            var rec = this.data.getByKey(id);
            if (rec){
                this.remove(rec);
            }
        };

        this.getStore().on('remove', function(store, record, index){
            this.fireEvent('recordRemoved', record, index);       
        }, this);


        this.addEvents(
            /**
             * @event moveup
             * Fires when a record is sorted upwards
             * @param {Ext.data.Record} record  The record that was moved.
             */
            'moveup',
             /**
             * @event movedown
             * Fires when a record is sorted down
             * @param {Ext.data.Record} record  The record that was moved.
             */
            'movedown'
        );

        if (this.showSortButtons){
            this.addListener('itemclick', this.enableSortButtons, this.selectionsGrid);
        }
    },

    onRender: function(element) {

        var elem = Ext.get(element);
        var newElem = elem.createChild({id:this.id  + '-selGrid', style:'display:inline;float:left;background-color:#FFF'});
        
        SailPoint.grid.SortableGrid.superclass.onRender.apply(this, [newElem]);

        var topOffset = (this.initialConfig.height/2) - 25;

        var thisHTML = '<div style="display:inline;float:left;height:'+this.initialConfig.height+'px">';
        thisHTML+='<div style="position:relative;top:'+topOffset+'px"><a href="javascript:Ext.getCmp(\''+this.id+'\').moveSelectedRow(-1)">';
        thisHTML+= '<img id="'+this.id+'_up" style="margin:3px" src="'+SailPoint.getRelativeUrl('/images/icons/arrow_button_up_disabled_20.png')+'"></a><br/>';
        thisHTML+= '<a href="javascript:Ext.getCmp(\''+this.id+'\').moveSelectedRow(1)">';
        thisHTML+= '<img id="'+this.id+'_down" style="margin:3px" src="'+SailPoint.getRelativeUrl('/images/icons/arrow_button_down_disabled_20.png')+'"></a></div></div>';

        if (this.showSortButtons)
            elem.insertHtml('beforeEnd', thisHTML);

    },

    moveSelectedRow: function(direction) {
        var record = this.getSelectionModel().getSelection();
        if (!record) {
            return;
        }
        if(record[0]) {
            record = record[0];
        }
        var index = this.getStore().indexOf(record);
        if (direction < 0) {
            index--;
            if (index < 0) {
                return;
            }
        } else {
            index++;
            if (index >= this.getStore().getCount()) {
                return;
            }
        }

        this.fireEvent(direction > 0 ? 'movedown' : 'moveup', record);

        this.getStore().remove(record);
        this.getStore().insert(index, record);
        this.getSelectionModel().selectRow(index, true);
    },

    /**
     * Enables the sorting buttons. Normally this will be called whenever the 'itemclick'
     * grid event is fired.
     */
    enableSortButtons: function(){
        var upImg = $(this.id+'_up');
        var downImg = $(this.id+'_down');
        upImg.src = SailPoint.getRelativeUrl('/images/icons/arrow_button_up_20.png');
        downImg.src = SailPoint.getRelativeUrl('/images/icons/arrow_button_down_20.png');
    },

     /**
     * @private Renderer used to render the remove button in the selections grid.
     */
    renderRemove: function(value, meta, rec, rowIndex, colIndex, store, view) {
        var html = '',
            recId = '',
            valueHtml,
            removeFunc,
            removeButton,
            icon,
            iconStyle,
            imageName,
            src;

        if (this.showRemoveButton) {
            if (rec.id) {
                recId = (rec.id).substring((rec.id).indexOf('ext-record') , (rec.id).length);
            }

            // The removeById method was added to the store in initComponent
            removeFunc = "Ext.StoreMgr.get('"+store.storeId+"').removeById('"+recId+"');return false;";

            removeButton = '<a href="#" ' +
                'onclick="'+removeFunc+'" />' +
                '<img src="' + SailPoint.getRelativeUrl('/images/icons/remove_grey_12.png') + '" ' +
                'onMouseOver="this.src=\'' + SailPoint.getRelativeUrl('/images/icons/remove_12.png') + '\'" ' +
                'onMouseOut="this.src=\'' + SailPoint.getRelativeUrl('/images/icons/remove_grey_12.png') + '\'" ' +
                'height="12" width="12" />' +
                '</a>';

            if ( rec ) {
                if ( rec.data ) {
                    iconStyle = rec.data['icon']; //TODO extjs4: doesn't look like the 'icon' property is ever set anywhere. Remove this section?
                    if ( iconStyle ) {
                        imageName = "/images/icons/user.png";

                        if ( iconStyle == "groupIcon" ) {
                            imageName = "/images/icons/group.png";
                        }

                        src = SailPoint.getRelativeUrl(imageName);
                        icon = '<img src="' + src +'" />';
                    }
                }
            }

            if (icon)
                html += Ext.String.format('{0} {1}', removeButton, icon);
            else
                html += removeButton;
        }

        valueHtml = value;
        if (this.allowValueClick) {
            valueHtml = '<a href="#" onclick="SailPoint.grid.SortableGrid.valueClicked(\'' +
                        this.id + '\', ' + rowIndex + '); return false;">' + value + '</a>';
        }

        return Ext.String.format('{0} {1}', html, valueHtml);
    },
    
    reset : function() {
        this.removeAll();
    }

});
