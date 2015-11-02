/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * @class SailPoint.SliderGrid
 * @extends Ext.grid.GridPanel
 * Grid Panel class to create a mulit-column grid with slider inputs<br>
 * <p>
 * Example code:
 * <pre><code>
 ...
 * </code></pre>
 * @cfg {Array} colModel Non-slider columns that need to be rendered in this table.  The slider column
 *                       will be tacked on to this array, so it doesn't have to be explicitly specified
 * @cfg {string} editUrl URL to the page that will perform the edit update.  The action on that page will
 *                       be called with the following parameters: 
 *                       <ul>
 *                         <li> id - the ID of the record that was edited </li>
 *                         <li> value - the updated risk score for that record </li> 
 *                       </ul>
 * @cfg {SailPoint.Risk.ColorStore} colorStore SailPoint.Risk.ColorStore object that will be used to maintain
 *                                              colors on the indicators
 * @cfg {Function} paramBuilder Function that returns any additional parmeters that need to be applied to the 
 *                              store when paging controls are utilized
 * Note that this component relies on the SailPoint.ExtendedPagingToolbar component
 */
Ext.define('SailPoint.SliderGrid', {
	extend : 'Ext.grid.GridPanel',
    colorStore: null,
    editUrl: null,
    
    initComponent: function() {
        var MAX_ITEMS = 15;
        var i;
        var columnConfig = [];
        var recordInfo = [];
        if (this.columns) {
            for (i = 0; i < this.columns.length; ++i) {
                columnConfig.push(this.columns[i]);
                recordInfo.push({index: this.columns[i].dataIndex, displayName: this.columns[i].header});
            }

            columnConfig.push({
                header: '#{msgs.risk_level}',
                hideable: false,
                sortable: true,
                dataIndex: 'riskScore',
                renderer: SailPoint.IndicatedValueRenderer
            });
        }
        
        var selectionModel = new SailPoint.SliderGridSelectionModel({
            recordInfo: recordInfo,
            store: this.store
        });
        
        var paramBuilder = this.paramBuilder;
        
        this.store.pageSize = MAX_ITEMS;

        Ext.apply(this, {
            columns: columnConfig,
            stripeRows: true,
            height: 453,
            recordInfo: recordInfo,
            selModel: selectionModel,
            editUrl: this.editUrl,
            bbar: new SailPoint.ExtendedPagingToolbar({
                store: this.store,
                displayInfo: false,
                paramBuilder: paramBuilder
            })
        });

        this.callParent(arguments);
        
        this.on('itemclick', function(gridView, record, HTMLitem, index, e, eOpts) {
            var i;
            var dataItems = [];
            var recordInfo = gridView.initialConfig.grid.recordInfo;
            var sliderEditor = Ext.getCmp('sliderEditor');
            var currentDesc;
            var currentData;
            
            for (i = 0; i < recordInfo.length; ++i) {
                currentDesc =  { id: 'record' + recordInfo[i].index + 'Desc', cellCls: 'sectionHeader top', html: recordInfo[i].displayName, height: 'auto'};
                currentData = { id: 'record' + recordInfo[i].index + 'Data', html: record.data[recordInfo[i].index], height: 'auto' };

                dataItems.push(currentDesc);
                dataItems.push(currentData);
            }
        
            sliderEditor = new SailPoint.SliderEditingPanel({
                id: 'sliderEditor', 
                gridStore: this.store,
                editUrl: this.editUrl,
                dataItems: dataItems, 
                record: record,
                value: record.data.riskScore
            });
            
            sliderEditor.show();
            
            return false;
        });
    }
});

/**
 * @class SailPoint.SliderGridSelectionModel
 * @extends Ext.selection.RowModel
 * This class is used to make the RowSelectionModel pop up a slider-based editor for risk score 
 * configuration
 * <p>
 * Example code:
 * <pre><code>
 ...
 * </code></pre>
 * @cfg {Array} recordInfo This is an array of objects that provide metadata so that the selection model can determine
 *                         how the record should be displayed for editing.  Each object has the following fields:
 *                         <ul>
 *                           <li> index - The 'name' attribute for the record property that is being described </li>
 *                           <li> displayName - The label that should be used for the record property that is being described </li>
 *                         </ul>
 *                         The recordInfo can exclude the slider column because that will implicitly refer to a weight
 */
Ext.define('SailPoint.SliderGridSelectionModel', {
	extend : 'Ext.selection.RowModel',
    recordInfo: null,

    store: null,
    
    initComponent: function() {
        Ext.apply(this, {
            recordInfo: this.recordInfo
        });
        
        SailPoint.SliderGridSelectionModel.superclass.initComponent.apply(this, arguments);
    },
    
    initEvents : function() {
    	this.callParent(arguments);
        this.on('beforerowselect', function() {
            return false;
        });
    }

});

SailPoint.IndicatedValueRenderer = function(value, metadata, record) {
    var colorStore = Ext.StoreMgr.lookup('colorStore');
    var riskScore = record.data.riskScore ? record.data.riskScore : 0;
    var renderedHTML;
    
    if (colorStore) {
        renderedHTML = Ext.String.format(
            '<div style="text-align: right; padding-right: 20px"><span style="text-align:right">{0}</span><span style="text-align: left"><img class="dynamicRiskIndicator" src="{1}"/></span></div>',
            riskScore, colorStore.getImageUrlForScore(riskScore));
    } else {
        renderedHTML = '<div>' + riskScore + '</div>';
    }
    
    return renderedHTML;
};

Ext.define('SailPoint.SliderEditingPanel', {
	extend : 'Ext.Window',

	bodyStyle: {background:'#FFFFFF'},
	
	dataPanel: null,
    
    initComponent: function() {
        if (!this.dataItems) {
            this.dataItems = [];
        }
        
        this.dataPanel = { 
            layout: { 
                type: 'table',
                columns: 2
            },
            defaults: { 
                border: false,
                padding: '5px'
            },
            width: 340,
            items: this.dataItems
        };
        
        var sliderInputCombo = new SailPoint.SliderInputCombo({id: 'sliderInputCombo', value: this.value});
        
        Ext.apply(this, {
            id: this.id,
            editUrl: this.editUrl,
            record: this.record,
            gridStore: this.gridStore,
            border: false,
            defaults: {bodyStyle: {background:'#FFFFFF', padding:'5px'}, border: false},
            width: 350,
            modal: true,
            items: [this.dataPanel, sliderInputCombo],
            buttons: [{
                id: 'applyChangeBtn',
                text: '#{msgs.button_save}',
                handler: this.handleSaveButton
            }, {
                id: 'cancelChangeBtn',
                text: '#{msgs.button_cancel}',
                cls : 'secondaryBtn',
                handler: function() {
                    Ext.getCmp('sliderEditor').close();
                }
            }]
        });

        this.callParent(arguments);
    },
    
    handleSaveButton: function() {
        var sliderEditor = Ext.getCmp('sliderEditor');
        Ext.Ajax.request({
            url: sliderEditor.editUrl,
            success: function(){
                sliderEditor.gridStore.load();
                sliderEditor.close();
            },
            failure: function(){ alert("The server could not be reached."); },
            params: { id: sliderEditor.record.get('roleId'), value: Ext.getCmp('sliderInputCombo').getValue()}
        });
    }
});


