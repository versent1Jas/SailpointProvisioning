/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Record used in the 'Select Correlation Attributes' grid in the right hand panel.
 */
Ext.define('SailPoint.CompositeCorrelationMapRecord', {
    extend: 'Ext.data.Model',
    requires: ['Ext.data.UuidGenerator'],
    idgen: 'uuid',
    fields: [
        {name:"tier", type: 'string', mapping:0},
        {name:"composite", type: 'string', mapping:1},
        {name:"id"}
    ]
});


/**
 * This panel is composed of two main parts. A grid on the left side which lists the tier applications
 * which make up the composite, and a right side panel which defines how accounts on each tier app
 * are correlated to the primary tier. The user may manually define this correlation by picking
 * the tier attribute and primary attribute('Select Correlation Attributes' toggle button),
 * or they can choose a rule ('Use Correlation Rule' toggle button).
 *
 * The grids in the panel are backed by an instance of CompositeDefinitionPanelStore which contains
 * the list of tier apps. The data in this store may also be affected by changes outside of this panel
 * such as changes in the schema tab.
 *
 *
*/
Ext.define('SailPoint.CompositeDefinitionPanel', {
    extend : 'Ext.panel.Panel',

    initComponent : function() {

        this.currentTier = null;

        // If the user chooses to use a composite account rule, we
        // can disable the right panel since they won't be defining
        // how each tier correlates to the primary tier.
        this.on('accountRuleSelected', function(ruleValue){
            this.accountRule = ruleValue;
            if (!this.accountRule || this.accountRule === ""){
                this.currentTier = null;
                this.showRightPanelMsg("#{msgs.app_tiers_select_tier_app}");
                return;
            } else {
                var cmp = Ext.getCmp('primaryTierCorrelation');
                if ( cmp ) {
                    cmp.hide();
                }
            }
        });

        this.on('remediationRuleSelected', function(ruleValue){
            this.remediationRule = ruleValue;
        });

        this.addEvents(
            /**
             * Fired when a user clicks on one of the tiers in the left hand grid.
              */
            'tierSelectionChanged'
        );

        this.tierGrid = this.initTierGrid();

        this.tierGrid.on('tierSelectionChanged', function(newTierRecord) {
            this.fireEvent('tierSelectionChanged', newTierRecord);
        }, this);

        var accountMatchingButton = new Ext.Button({
            text:"#{msgs.app_tiers_button_expression}",
            enableToggle:true,
            id:'accountMatchingButton',
            pressed:true,
            toggleGroup:'foo'
        });

        var correlationButton = new Ext.Button({
            text:"#{msgs.app_tiers_button_primary_tier_correlation}",
            id:'primaryTierCorrelation',
            enableToggle:true,
            toggleGroup:'foo'
        });

        this.correlationPanel = new Ext.Panel({
            id:'correlationPanel',
            title:"#{msgs.app_tiers_panel_title_select_tier}",
            layout:'card',
            activeItem:0,
            region:'center',
            items:[
                {
                    html:"<center><div style='margin-top:30px;' id='correlationPanelMsg'>#{msgs.app_tiers_msg_select_tier}</div></center>"
                },
                {
                    html:'',
                    layout:'card',
                    items:[
                        {id:'placeHolder', html:''}
                    ],
                    tbar:new Ext.Toolbar({
                        items:[
                            accountMatchingButton, correlationButton
                        ]
                    })
                }
            ]
        });

        accountMatchingButton.on('click', function(){
            this.getLayout().setActiveItem(0);    
        },  this.correlationPanel.items.get(1));

        correlationButton.on('click', function(){
            this.getLayout().setActiveItem(1);
        }, this.correlationPanel.items.get(1));

        /**
         * Handles clicking on one of the tier apps. This activates the right
         * panel, which will be rendered in a number of ways depending on
         * the definition of the tier.
         */
        this.on('tierSelectionChanged', function(newTierRecord) {
            if (newTierRecord){
                this.currentTier = newTierRecord.getId();
                this.correlationPanel.setTitle(newTierRecord.get('application'));
            } else {
                this.currentTier = null;
                this.correlationPanel.setTitle("#{msgs.app_tiers_panel_title_select_tier}");        
                this.showRightPanelMsg("#{msgs.app_tiers_msg_select_tier}");
                return;
            }

            // Primary apps don't need correlation definition
            var isPrimaryApp = newTierRecord.get("primaryTier");
            var cmp = Ext.getCmp('primaryTierCorrelation');
            if ( cmp ) {
                if ( (isPrimaryApp) ||
                     (this.accountRule && this.accountRule != "") ) {
                    cmp.hide();
                } else {
                    cmp.show();
                }
            }

            var correlationCardPanel = this.correlationPanel.items.get(1);
            if (!this.correlationMappingGrid){
                this.initCorrelationGrid();

                // Mask the correlation grid so it's not editable if the user has chosen
                // a correlation rule
                this.correlationMappingGrid.on('show', function(){

                    if (!this.ruleSelectionPanel){
                        return;
                    }

                    // On show, mask or disable the correlation grid if one a correlation rule has been chosen
                    if (this.correlationMappingGrid && this.correlationMappingGrid.getEl()){
                        var store = ApplicationPage.getCompositeStore();
                        var app = this.currentTier;
                        var record = store.getById(app);
                        var val = record.get('correlationRule');
                        if (!val || val === ""){
                            this.correlationMappingGrid.getEl().unmask();
                        } else {
                            new Ext.util.DelayedTask().delay(100, function(){
                                 this.correlationMappingGrid.getEl().mask("#{msgs.app_tiers_mask_rule_selected}", '');
                            }, this);                           
                        }
                    }
                }, this);

                if ( !this.expressionPanel ) {
                    // hide it by default
                    var saveSelectorButton = new Ext.Button({
                        id:'saveSelectorButton', text:"#{msgs.app_tiers_button_save_attr_changes}", hidden:true
                    });

                    saveSelectorButton.on('click', function(button, event) {
                        // When save is pused persist both the selector for attribute matching 
                        // AND the rest of the composite definition json. This keeps
                        // the entire state
                        // post it back to the bean so we can persist it on the app
                        SailPoint.CompositeDefinitionPanel.saveCompositeDefinition();
                        $("editForm:saveSelector").click();
                        saveSelectorButton.hide(); 
                        // mark the config dirty so we can save it if necessary
                        $("editForm:logicalConfigDirty").value = 'true';
                    }, saveSelectorButton);

                    var saveBar = new Ext.Toolbar({
                        items:['', '->', saveSelectorButton]
                    });
                    saveBar.setHeight(25);

                    this.expressionPanel = new Ext.Panel({
                        id: 'expressionPanel',
                        region:'center',
                        autoScroll:true,
                        border:false,
                        items:[
                            {
                                contentEl: 'selectorPanel',
                                border: false
                            },
                            {html:'', border:false, columnWidth:.2}
                        ],
                        bbar:saveBar
                    });
                }

                this.initRuleSelectionPanel();
                correlationCardPanel.remove('placeHolder');
                correlationCardPanel.add(this.expressionPanel);

                var ruleCheckBox = new Ext.form.Checkbox({
                    id : 'tierCorrelationRuleCheckBox', 
                    boxLabel : 'Use a rule for Tier correlation' 
                });
                correlationCardPanel.add(this.correlationMappingGrid);
                correlationCardPanel.add(this.ruleSelectionPanel);
            }

            this.correlationMappingGrid.fireEvent('tierSelectionChanged', newTierRecord);            

            // a rule has been selected, default to the second 'Use Correlation Rule' panel. If
            // not show the correlation mapping grid, and make sure it is editable by unmasking it
            if (newTierRecord.get('correlationRule') && newTierRecord.get('correlationRule') !== ""){
                correlationCardPanel.getLayout().setActiveItem(1);
                correlationCardPanel.getTopToolbar().items.get(2).toggle(true);
            } else {
                correlationCardPanel.getLayout().setActiveItem(0);
                correlationCardPanel.getTopToolbar().items.get(0).toggle(true);
                correlationCardPanel.getTopToolbar().items.get(0).fireEvent('click', this);
                if (this.correlationMappingGrid.getEl()){
                    this.correlationMappingGrid.getEl().unmask();
                }    
            }

            var ruleCombo = this.ruleSelectionPanel.getRuleCombo();
            ruleCombo.setValue(newTierRecord.get('correlationRule'));

            var mapData = newTierRecord.get('correlationMap');
            this.correlationMappingGrid.getStore().loadData(mapData ? mapData : []);
            this.correlationPanel.getLayout().setActiveItem(1);
        }, this);

        Ext.apply(this, {
            id:"CompositeDefinitionPanel",
            layout:'border',
            height:350,
            items:[
                {
                    html:'',
                    region:'west',
                    layout:'fit',
                    width:420,
                    items:[
                        new Ext.Panel({
                            layout:'fit',
                            items:[this.tierGrid]
                        })
                    ]
                },
                this.correlationPanel
            ]
        });

        SailPoint.CompositeDefinitionPanel.superclass.initComponent.apply(this, arguments);
    },

    showRightPanelMsg : function(msg){
        var msgSpan = Ext.fly('correlationPanelMsg');
        if (msgSpan){
            msgSpan.update(msg);
        }
        this.correlationPanel.getLayout().setActiveItem(0);
    },


    /**
    *
    *
    */
    initTierGrid : function() {

        var appSuggest = SailPoint.SuggestFactory.createSuggest(
            'application',
            null,
            null,
            '#{msgs.appsuggest_enter_app}',
            {
                baseParams:{'showComposite': 'false'},
                storeId: 'compositeAppSuggestStore',
                
                listConfig: {
                    loadingText: "#{msgs.appsuggest_finding_apps}"
                }
            }
        );

        var addButton = new Ext.Button({
            text: "#{msgs.app_tiers_button_add_tier}",
            enableToggle: false
        });

        var removeButton = new Ext.Button({
            text: "#{msgs.app_tiers_button_remove_selected_tiers}",
            enableToggle: false
        });

        var ds = ApplicationPage.getCompositeStore();

        var appGrid = new SailPoint.grid.PagingCheckboxGrid({
            id:'tierGrid', width:400, iconCls:'icon-grid',
            store:ds,
            tbar: {
                xtype : 'toolbar',
                items:[appSuggest, '->', addButton]
            },
            bbar: {
                xtype : 'toolbar',
                items:[removeButton]
            },
            columns: [
                {"name":"application","dataIndex":"application","flex":3,"header":"#{msgs.app_tiers_grid_hdr_app}"},
                {
                    name: 'primaryTier',
                    xtype:'checkcolumn',
                    header:"#{msgs.app_tiers_grid_hdr_primary_tier}",
                    flex: 1,
                    dataIndex:'primaryTier',
                    renderer: Ext.ux.CheckColumn.prototype.renderer
                }
            ]
        });

        // These are subscribed to by the correlation panel which updates itself
        // when tiers are selected or removed
        appGrid.addEvents(
            'tierSelectionChanged'
        );

        // Handles primary tier checkbox
        appGrid.columns[1].on('checkchange',
            function(checkColumn, rowIndex, checked) {
                var cmp = Ext.getCmp('primaryTierCorrelation');
                var eventRecord = this.getStore().getAt(rowIndex);
                
                if (checked) {
                    var newPrimary = null;
                    this.getStore().each(function(record) {
                        if (eventRecord.get('application') !== record.get('application')) {
                            record.set('primaryTier', false);
                        } else {
                            newPrimary = record;
                        }
                    });
                    this.fireEvent('tierSelectionChanged', newPrimary);
                    if ( cmp ) {
                       cmp.hide();
                    }
                } else {
                    this.fireEvent('tierSelectionChanged', eventRecord);
                   if ( cmp ) {
                       cmp.show();
                   }
                }    
                // since somethingchanged show the save button
                SailPoint.CompositeDefinitionPanel.showSaveButton();
            }, appGrid
        );

        // When a users clicks a row we want to highlight the row so
        // they know what they're working on in the right panel.
        // We can't use the default ext selected row class b/c that
        // affects image used in the row selection checkboxes (by design).
        // This routine highlights the row without any side effects.
        appGrid.on('cellclick', function(gridView, td, cellIndex, r, tr, rowIndex, e, eOpts) {
            this.getStore().each(function(record) {
                var idx = this.getStore().indexOf(record);
                var elem = Ext.fly(gridView.getNode(idx));
                if (idx == rowIndex) {
                    //elem.addCls('hightlightedGridRow');
                    $('editForm:currentTierApp').value = record.get('application');
                } 
                else {
                   // elem.removeCls('hightlightedGridRow');
                }
            }, this);
        }, appGrid);


        addButton.on('click', function(button, event) {

            var appName = this.appSuggest.getRawValue();

            if (appName===""){
                return;
            }

            // dont allow duplicate selections
            var ids = this.grid.getStore().getById(appName);
            if (ids) {
                return;
            }

            var isPrimaryTier = false;
            var count = this.grid.getStore().getCount();
            if ( count == 0 ) {
                isPrimaryTier = true;             
            }

            var newRecord = this.grid.getStore().addTier({
                application:appName, primaryTier: isPrimaryTier}
            );

            // make sure the selection is on our newly created
            this.grid.getStore().each(function(record){
                var grid = this.grid;
                var idx = grid.getStore().indexOf(record);
                var elem = Ext.fly(grid.getView().getNode(idx));
                if ( record.get('application') === appName) {
                    elem.addCls('hightlightedGridRow');
                } else {
                    elem.removeCls('hightlightedGridRow');
                }
            }, this);

            this.grid.fireEvent('tierSelectionChanged', newRecord);
            // new records added show save button
            SailPoint.CompositeDefinitionPanel.showSaveButton();
        }, {grid:appGrid, appSuggest:appSuggest});

        removeButton.on('click', function(button, event) {
            var selectedIds = this.getSelectedIds();
            if (selectedIds) {
                for (var i = 0; i < selectedIds.length; i++) {
                    var appId = selectedIds[i];
                    var record = this.getStore().getById(appId);
                    if (record) {
                        this.getStore().remove(record);
                    }

                }
                // save off the composite defintion and persist it to the 
                // bean
                var length = this.getStore().getCount();
                if ( length > 0 ) {
                    var firstRecord = this.getStore().getAt(0);
                    appGrid.fireEvent('tierSelectionChanged', firstRecord);
                } else {
                    $('editForm:currentTierApp').value = null;
                    $('editForm:switchTiers').click();
                }
                SailPoint.CompositeDefinitionPanel.saveCompositeDefinition();
            }
            this.deselectAll();
        }, appGrid);

        appGrid.on('itemclick', function(gridView, record, item, index, e, eOpts) {
            appGrid.fireEvent('tierSelectionChanged', record);
        });

        return appGrid;
    },

    /**
     * Initializes the right-hand 'Select Correlation Attributes' grid
     */
    initCorrelationGrid : function() {
       
        var store = Ext.create('Ext.data.Store', {
            model: 'SailPoint.CompositeCorrelationMapRecord',
            proxy: {
                type: 'memory',
                reader: {
                    type: 'array'
                }
            }
        });

        store.on('exception', SailPoint.DEFAULT_STORE_ERR_HANDLER, store);

        var addAttrButton = new Ext.Button({
            text:"#{msgs.app_tiers_button_add_attr}"
        });
        var removeAttrButton = new Ext.Button({
            text: "#{msgs.app_tiers_button_remove_attrs}",
            enableToggle: false
        });

        var saveAttrsButton = new Ext.Button({
            text:"#{msgs.app_tiers_button_save_attr_changes}", hidden:true
        });

        var clearAttrsButton = new Ext.Button({
            text: "#{msgs.app_tiers_button_save_clear_changes}", hidden:true
        });

        // Currently ext does not support assigning css classes to columns. There's probably a
        // better way to do this with templates with templates or a renderer, but I dont' have
        // the stomach for that now. Instead I'm calculating the css string, making sure that
        // the context path is correct.
        // TODO: With ExtJs 4.x we can assign a css class to a column with 'cls': let's update this at some point.
        var comboCellCss = 'background:transparent url(' +
                           SailPoint.getRelativeUrl('/images/icons/combo-trigger.gif') +
                           ') no-repeat scroll center right;border:1px solid #7EADD9;';

        var tierComboEditor = Ext.create('Ext.form.field.ComboBox', {
            id : 'tierComboEditor',
            typeAhead: false,
            triggerAction: 'all',
            store: SailPoint.Store.createStore({
                model : 'SailPoint.model.NameDisplayName',
                url : SailPoint.getRelativeUrl('/define/applications/appSchemaAttrsDS.json')
            }),
            valueField:'name',
            displayField:'displayName',
            editable:false,
            listConfig: {
                maxHeight: 200,
                cls: 'x-combo-list-small'
            },
            listeners : {
                change : {
                    fn : function(combo, newVal, oldVal){
                        saveAttrsButton.show();
                        clearAttrsButton.show();
                    },
                    scope : this
                },
                collapse : {
                    fn : function(combo){
                        this.triggerBlur();
                    }
                },
                focus : {
                    fn : function(combo){
                        this.expand();
                    }
                }
            }
        });

        var primaryComboEditor = {
            xtype : 'combobox',
            id : 'primaryComboEditor',
            typeAhead: false,
            triggerAction: 'all',
            store : SailPoint.Store.createStore({
                model : 'SailPoint.model.NameDisplayName',
                url : SailPoint.getRelativeUrl('/define/applications/appSchemaAttrsDS.json')
            }),
            valueField:'name',
            displayField:'displayName',
            editable:false,
            listConfig: {
                maxHeight:200,
                cls: 'x-combo-list-small'
            },
            listeners : {
                change : {
                    fn : function(combo, newVal, oldVal){
                        saveAttrsButton.show();
                        clearAttrsButton.show();
                    },
                    scope : this
                },
                collapse : {
                    fn : function(combo){
                        this.triggerBlur();
                    }
                },
                focus : {
                    fn : function(combo){
                        this.expand();
                    }
                }
            }
        };

        var grid = new SailPoint.grid.PagingCheckboxGrid({
            id:'correlationGrid',
            store: store,
            frame:false,
            columns: [
                {
                    name: 'tier',
                    header: "#{msgs.app_tiers_attr_grid_hdr_tier_attribute}",
                    dataIndex: 'tier',
                    flex: 1,
                    emptyCellText : "#{msgs.emptytext_click_to_edit}",
                    css: comboCellCss,
                    editor:tierComboEditor
                },
                {
                    name:'primary',
                    header: "#{msgs.app_tiers_attr_grid_hdr_primary_attribute}",
                    dataIndex: 'composite',
                    emptyCellText : "#{msgs.emptytext_click_to_edit}",
                    width: 300,
                    css: comboCellCss,
                    editor: primaryComboEditor
                }
            ],
            width:675,
            height:300,
            plugins: [
                { ptype: 'cellediting', clicksToEdit: 1 }
            ],
            viewConfig: {
                //In Firefox, when combobox editor pops up, it causes some scrolling, which cancels the edit
                //So give it a little more cushion in FF.  IE is fine with no cushion. 
                scrollOffset: Ext.isIE ? 1 : 4
              },
            bbar : {
                xtype : 'toolbar',
                items:[addAttrButton, removeAttrButton, '->', saveAttrsButton, clearAttrsButton]
            }
        });

        grid.addEvents('correlationRuleChanged', 'tierSelectionChanged');

        grid.on('tierSelectionChanged', function(newTierRecord) {


            $('editForm:currentTierApp').value = newTierRecord.get('application');
            $('editForm:switchTiers').click();

            var button = Ext.getCmp('accountMatchingButton');
            if ( button ) button.toggle(true);

            var tier = Ext.getCmp('tierComboEditor');
            if(tier) {
                tier.getStore().getProxy().extraParams = {objType:'account', name: $('editForm:currentTierApp').value };
                tier.getStore().load();
            }
        });

        grid.on('itemClick', function(gridView, record, HTMLitem, index, e, eOpts){
            var currentPrimary = {record:null};
            this.mainPanel.dataStore.each(function(record){
                var primary = record.get('primaryTier');
                if (primary === true || primary === 'true'){
                    this.record = record;
                    return;
                }    
            }, currentPrimary);

            if (gridView.clickedColumn == 2 && currentPrimary.record) {
                var primary = Ext.getCmp('primaryComboEditor');
                if(primary) {
                    primary.getStore().getProxy().extraParams = {objType:'account', name:currentPrimary.record.get('application')};
                    primary.getStore().load();
                }
            } 
        }, { mainPanel:this });

        clearAttrsButton.on('click', function(){
            var currentTier = this.dataStore.getById(this.currentTier);
            this.correlationMappingGrid.getStore().loadData(currentTier.get('correlationMap'));
            saveAttrsButton.hide();
            clearAttrsButton.hide();
        }, this);

        saveAttrsButton.on('click', function(){

            var isValid = true;
            this.correlationMappingGrid.getStore().each(function(record){
                if (!record.get('tier') || record.get('tier') === "")
                    isValid = false;
                if (!record.get('composite') || record.get('composite') === "")
                    isValid = false;
            });

            if (!isValid){
                Ext.Msg.show({
                    title: '#{msgs.err_dialog_title}',
                    msg: "#{msgs.app_tiers_empty_correlation_attrs}",
                    buttons: Ext.Msg.OK,
                    icon: Ext.MessageBox.ERROR
                 });
            }

            var newMappingData = [];
            this.correlationMappingGrid.getStore().each(function(record){
                this.push([record.get('tier'), record.get('composite')]);
            }, newMappingData);

            var ds = this.dataStore;

            var currentTier = ds.getById(this.currentTier);
            currentTier.set('correlationMap', newMappingData);
            currentTier.set('correlationRule',"");
            ds.commitChanges();

            saveAttrsButton.hide();
            clearAttrsButton.hide();
        }, this);

        removeAttrButton.on('click', function() {
            var removed = 0;
            var selectedIds = grid.getSelectedIds();
            if (selectedIds) {
                for (var i = 0; i < selectedIds.length; i++) {
                    var r = grid.getStore().getById(selectedIds[i]);
                    if (r) {
                        grid.getStore().remove(r);
                        removed++;
                    }
                }
            }

            if (removed > 0){
                saveAttrsButton.show();
                clearAttrsButton.show();    
            }

        }, grid);

        addAttrButton.on('click', function() {
            grid.getStore().add([
                Ext.create('SailPoint.CompositeCorrelationMapRecord', {
                    composite:'',tier:''
                })
            ]);
            saveAttrsButton.show();
            clearAttrsButton.show();
        }, grid);

        this.correlationMappingGrid = grid;
    },


    initRuleSelectionPanel : function() {

        var selectRuleButton = new Ext.Button({
            id:'selectRule',
            text:"#{msgs.app_tiers_button_select_rule}"
        });

        var clearChangesButton = new Ext.Button({
            id:'clearRule',
            cls : 'secondaryBtn',
            text:"#{msgs.app_tiers_button_clear_rule}"
        });

        this.ruleSelectionPanel = new Ext.Panel({
            layout:'column',
            border:false,
            style:'padding-top:15px',
            items:[
                {
                    html:"<span class='sectionHeader'>#{msgs.app_tiers_label_rule_selectbox}</span>",
                    border:false,
                    columnWidth:.3,
                    height:21,
                    style:'vertical-align:middle;text-align:right;padding-right:10px'
                },
                {
                    xtype : 'combobox',
                    id:'ruleCombo',
                    typeAhead: true,
                    columnWidth:.5,
                    triggerAction: 'all',
                    store: SailPoint.Store.createStore({
                        fields: ['label', 'value'],
                        data: correlationRuleData
                    }),
                    displayField: 'label',
                    valueField: 'value',
                    editable:false,
                    listConfig: {
                        cls: 'x-combo-list-small'
                    }
                },
                {html:'', border:false, columnWidth:.2}
            ],

            buttons:[selectRuleButton,clearChangesButton],

            getRuleCombo : function(){
                return this.items.get(1);
            }
        });

        selectRuleButton.on('click', function(){
            var combo = this.ruleSelectionPanel.getRuleCombo();
            var record = this.dataStore.getById(this.currentTier);
            if (record) {
                record.set('correlationRule', combo.getValue());
            }
        }, this);

        // todo fixme there's some duplication here with the above handler
        clearChangesButton.on('click', function(){
            this.ruleSelectionPanel.getRuleCombo().setValue('');
            var record = this.dataStore.getById(this.currentTier);
            if (record) {
                record.set('correlationRule', '');
            }
        }, this);
    }
});

/**
 * Show the save button used to push the changes
 * back to the backing bean.
 */
SailPoint.CompositeDefinitionPanel.showSaveButton = function() {
    var cmp = Ext.getCmp('saveSelectorButton');
    if ( cmp ) 
        cmp.show();
}

/**
 * Serialize the json representation o fthe composite definiton
 * to the backing bean.
 */
SailPoint.CompositeDefinitionPanel.saveCompositeDefinition = function() {
    var panel = Ext.getCmp(SailPoint.COMP_DEF_PANEL_CMP_ID);

    if(panel && (!panel.accountRule || panel.accountRule === "")) {
     
        var store = ApplicationPage.getCompositeStore();
        if ( store != null ) {
          var errors = store.validate();
          if (errors && errors.length > 0) {
            var errMsg = "<b>#{msgs.err_validation_header}</b>";
            for (var i = 0; i < errors.length; i++) {
              errMsg += "<div style='margin-left:8px'> - " + errors[i] + "</div>";
            }
            Ext.Msg.show({
                        title: "#{msgs.err_validation}",
                        msg: errMsg,
                        buttons: Ext.Msg.OK,
                        icon: Ext.MessageBox.ERROR
            });
            return false;
          }
        }
  }
  ApplicationPage.persistCompositeDefinition();
  return true;
}

