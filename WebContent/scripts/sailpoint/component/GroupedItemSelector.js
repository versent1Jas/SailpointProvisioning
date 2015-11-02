/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.GroupedItemSelector', {
    extend : 'Ext.panel.Panel',

    groupComboData : null,
    groupGridStore : null,
    inputFieldName : null,
    savedDefinitions : null,

    updateInputField : function(){

        try{
            var input = Ext.getDom(this.inputFieldName);
            input.value='';

            var store = Ext.data.StoreManager.lookup('selectedGridStore');
            var count = store.getCount();
            for(var i =0; i< count; i++){
                var record = store.getAt(i);
                input.value += record.getId();
                if (i < count - 1)
                    input.value += ', ';
            }
        }
        catch(err){
            SailPoint.FATAL_ERR_JAVASCRIPT(err, 'Unable to update input field.');
        }

        return count;
    },

    height: 178,
    style: 'margin:5px;',
    border: false,
    layout: {
        type: 'table',
        columns: 2
    },

    initComponent : function(){

        this.groupGridStore = SailPoint.Store.createStore({
            url : SailPoint.getRelativeUrl('/analyze/reports/groupDefinitions.json'),
            root : 'objects',
            totalProperty : 'count',
            fields : ['id', 'name']
        });

        var groupSelect = {
            xtype : 'combobox',
            width: 190,
            typeAhead: true,
            triggerAction: 'all',
            emptyText: '#{msgs.rept_certification_select_grp_factory}',
            forceSelection:true,
            store: this.groupComboData,
            listeners:{
                select : {
                    fn:function(combo, record, index){
                        if (Ext.get('selectedGridEmptyTxt'))
                            Ext.get('selectedGridEmptyTxt').show();
                        this.items.get(2).getStore().getProxy().extraParams = {'groupFactoryName':record[0].data.field1};
                        this.items.get(2).getStore().load();
                    }, scope:this
                }
            }
        };

        var groupGrid = {
            xtype: 'paginggrid',
            store: this.groupGridStore,
            bbar:{
                xtype: 'sppagingtoolbar',
                store: this.groupGridStore,
                width: 190
            },
            autoScroll:true,
            columns: [{name:'name', sortable: true, dataIndex:'name'}],
            width: 190,
            height: 145,
            hideHeaders:true,
            listeners:{
                itemclick : {
                    fn:function(gridView, record, HTMLitem, index, e, eOpts){
                        var store = Ext.data.StoreManager.lookup('selectedGridStore');
                        if (!store.getById(record.getId())){
                            store.add(record);
                            this.updateInputField();
                            Ext.get('removeMsg').setStyle('display');
                            Ext.get('removeMsg').show();
                        }
                    }, scope:this
                 }
            }
        };

        var selectedGrid = {
            xtype : 'gridpanel',
            store: SailPoint.Store.createStore({
                storeId:'selectedGridStore',
                fields:[
                    {name: 'id'},
                    {name: 'name'}
                ],
                sorters : [{property: 'name', direction: 'ASC'}],
                data : []
            }),
            columns: [{sortable: true, name:'name', dataIndex: 'name', flex : 1}],
            viewConfig: {
                emptyText:'<center id="selectedGridEmptyTxt">#{msgs.rept_certification_grp_def_click_to_remove}</center>'
            },
            deferEmptyText : false,
            width: 190,
            height: 145,
            hideHeaders:true, 
            listeners:{
                itemClick : {
                    fn : function(gridView, record, HTMLitem, index, e, eOpts){
                        gridView.panel.getStore().remove(record);
                        this.updateInputField();
                        if (gridView.panel.getStore().getCount() == 0) {
                            Ext.get('removeMsg').hide();
                        }
                    }, scope:this
                 }
            }
        };

        if (this.savedDefinitions != null) {
            var reader = new Ext.data.reader.Json({
                root:'objects',
                totalProperty:'count'
            });
            
            var json = {'rowCount' : this.savedDefinitions.length, rows:this.savedDefinitions};
            json.metaData = {"id":"id","root":"objects","totalProperty":"count","fields":[{"name":"id","dataIndex":"id"},{"name":"name","dataIndex":"name"}]};
            json.success = true;
            var res = reader.readRecords(json);
            selectedGrid.store.add(res.records);
        }

        this.items = [
            groupSelect,
            {xtype:'container', html:'<span id="removeMsg" style="display:none" >#{msgs.rept_certification_grp_def_click_to_remove}</span>', border:false, style:'text-align:center'},
            groupGrid,
            selectedGrid
        ];

        this.callParent(arguments);
    }

});
