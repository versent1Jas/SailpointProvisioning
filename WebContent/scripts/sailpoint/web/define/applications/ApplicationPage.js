/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Application page stuff from /define/application.xhtml
 * Expects the following includes to be present:
 *  - CompositeDefintionPanelStore.js
 *  - CompositeDefinitionPanel.js
 */


// Constants
SailPoint.COMP_DEF_PANEL_CMP_ID = "CompositeDefinitionPanel";
SailPoint.COMP_DEF_PANEL_STORE_ID = "CompositeDefinitionPanelStore";


//------------------------------------------------------
// ** EVENTS **
//------------------------------------------------------

Page.addEvents(
    /**
     * @event beforeSave
     * Fires when the save button is clicked.
     * @param {boolean} isCompositeApp - true if we're dealing with a composite app.
     */
    'beforeSave',

    /**
     * @event accountRuleSelected
     * Fires when the user changes the value in the composite tier account rule combo.
     * @param {String} newValue - new rule value selected
     */
    'accountRuleSelected',

    /**
     * @event remediationRuleSelected
     * Fires when the user changes the value in the composite tier remediation rule combo.
     * @param {String} newValue - new rule value selected
     */
    'remediationRuleSelected',

    /**
     * @event correlationReloaded
     * Fired when the Correlation Config a4j panels are reloaded. This event lets the
     * correlation config wizard code know that the panel has been refreshed and
     * that the wizard dialog may be launched.
     */
    'correlationReloaded',

    /**
     * Fired when the attributes Panel is loaded.
     */
    'configSettingsLoaded'
);



Page.on('beforeSave', function() {

    // if this is a composite app, write any updates from
    // the composite panel to a hidden field.
    if (Page.isCompositeApp) {
        if(!SailPoint.CompositeDefinitionPanel.saveCompositeDefinition()) {
            return false;
        }
    }

    if(SailPoint.template.TemplateEditor.EditorPanel) {
        SailPoint.template.TemplateEditor.EditorPanel.save();
    }

    if($('appDescriptionHTML')) {
        $('editForm:appDescriptionsJSON').value = Ext.getCmp('appDescriptionHTMLCmp').getCleanValue();
    }

    //return false will kill cancel the save
    return true;
});

Page.on('accountRuleSelected', function(newValue){
    Ext.getCmp(SailPoint.COMP_DEF_PANEL_CMP_ID).fireEvent('accountRuleSelected', newValue);
});

Page.on('remediationRuleSelected', function(newValue){
    Ext.getCmp(SailPoint.COMP_DEF_PANEL_CMP_ID).fireEvent('remediationRuleSelected', newValue);
});


//------------------------------------------------------
// ** ApplicationPage Object UI/Store Methods **
//------------------------------------------------------
var ApplicationPage = {};
/**
 * Retrieve the page-level composite definition store object. Creates on if it does not exist.
 */
ApplicationPage.getCompositeStore = function(){

    var ds = Ext.StoreMgr.lookup(SailPoint.COMP_DEF_PANEL_STORE_ID);
    if (!ds){
        ds = ApplicationPage.initCompositeDataStore();
    }
    return ds;
};

/**
 * Create the page level datastore, which is really only relevant to composite apps.
 * The data from the datastore is collected from serialized json in the input field 'compositeDefinition'.
 */
ApplicationPage.initCompositeDataStore = function() {
    var compositeDefinition = Ext.decode($('editForm:compositeDefinition').value);
    var ds = new SailPoint.CompositeDefinitionPanelStore({
        storeId:SailPoint.COMP_DEF_PANEL_STORE_ID
    });
    ds.load(compositeDefinition);
    return ds;
};

/**
 * Serializes composite definition as json from the data store into a
 * hidden input field.
 */
ApplicationPage.persistCompositeDefinition = function(){
    var dataStore = ApplicationPage.getCompositeStore();
    var dto = dataStore.getPersistableDTO();

    var panel = Ext.getCmp(SailPoint.COMP_DEF_PANEL_CMP_ID);

    // if the panel doesn't exist, then there's no data.
    if (!panel){
        return;
    }
    dto.remediationRule = panel.remediationRule;
    dto.accountRule = panel.accountRule;

    var destFormField = $('editForm:compositeDefinition');
    destFormField.value = Ext.encode(dto);
};

/**
 *   Creates the dialog that pops up when the user clicks the
 *   'Add Tier Attribute' button on the schema tab.
 *
 *   @param The ID of the button element the user clicked. We need this
 *   to calculate the ID of the page submit button b/c JSF dynamically
 *   creates IDs for buttons on the schema tab.
 */
ApplicationPage.showCreateCompositeAttrDialog = function showCreateCompositeAttrDialog(sourceButtonId){

    var compositeAttributeDialog;

    // calculate the ID of the button which we'll click to submit the form. B/c of the layout,
    // JSF creates it's own IDs when it generates the form, hence the shennanigans here...
    var submitButtonId = sourceButtonId.replace('newCompSchemaAttrButton','newSchemaAttrButton');

    var store = ApplicationPage.getCompositeStore();

    var tiers = [];
    store.each(function(record){
        tiers.push(record.get('application'));
    }, tiers);

    var appPicker = new Ext.form.ComboBox({
        typeAhead: true,
        triggerAction: 'all',
        store: tiers,
        lazyRender: true,
        editable: false,
        listClass: 'x-combo-list-small',
        fieldLabel: "#{msgs.app_schema_label_select_app}"
    });

    var attributePicker = new Ext.form.ComboBox({
        disabled: true,
        typeAhead: true,
        triggerAction: 'all',
        store: SailPoint.Store.createStore({
            model : 'SailPoint.model.NameDisplayName',
            url : SailPoint.getRelativeUrl('/define/applications/appSchemaAttrsDS.json'),
            root : 'objects',
            totalProperty : 'count'
        }),
        valueField: 'name',
        displayField: 'displayName',
        lazyRender: true,
        editable: false,
        listClass: 'x-combo-list-small',
        fieldLabel: "#{msgs.app_schema_label_select_attr}"
    });

    appPicker.on('select', function(combo, records, index){
        this.clearValue();
        this.store.getProxy().extraParams = {'name': records[0].get('field1'), 'objType': 'account'};
        this.store.load();
        this.enable();
    }, attributePicker);

    var saveButton = new Ext.Button({
        id       : 'compositeSaveBtn',
        text     : "#{msgs.app_schema_btn_create_tier_attr}",
        disabled : true
    });

    var cancelButton = new Ext.Button({
        text     : "#{msgs.app_schema_btn_cancel_create_tier_attr}",
        cls : 'secondaryBtn'
    });

    compositeAttributeDialog = new Ext.Window({
        id: 'compositeSrcAttrDialog',
        title: "#{msgs.app_schema_dialog_title_tier_attr}",
        submitButtonId: submitButtonId,
        layout      : 'fit',
        width       : 650,
        height      : 200,
        closeAction :'destroy',
        plain       : true,
        items       : [
            {
                xtype: 'form',
                fieldDefaults: {
                    labelWidth : 150
                },
                bodyStyle: 'padding:5px 5px 0',
                items: [appPicker, attributePicker]
            }
        ],
        buttons: [saveButton, cancelButton]
    });

    cancelButton.on('click', function(){
        this.destroy();
    }, compositeAttributeDialog);

    saveButton.on('click', function(){
        var form = this.items.get(0);
        var appName =  form.items.get(0).getValue();
        var srcAttr = form.items.get(1).getValue();
        Ext.get('editForm:sourceApplication').dom.value = appName;
        Ext.get('editForm:sourceAttribute').dom.value = srcAttr;

        $(this.submitButtonId).click();

        this.destroy();

    }, compositeAttributeDialog);

    attributePicker.on('select', function(combo, records, index){
        Ext.getCmp('compositeSaveBtn').enable();
    }, compositeAttributeDialog);


    compositeAttributeDialog.show();
};

ApplicationPage.initAppOwner = function(jsonArray, isDisabled) {
    if ($('appOwnerSuggest')) {
        Ext.create('SailPoint.IdentitySuggest', {
            id: 'applicationPageOwner',
            renderTo: 'appOwnerSuggest',
            binding: 'appOwner',
            initialData: jsonArray,
            disabled: isDisabled,
            baseParams: {context: 'Owner'},
            width: 300
        });
    }
};

ApplicationPage.initAppDescription = function(isLangSelectEnabled, locale) {
    if($('appDescriptionHTML') && $("editForm:appDescriptionsJSON")) {
        Ext.create('SailPoint.MultiLanguageHtmlEditor', {
            renderTo: 'appDescriptionHTML',
            width:500,
            height:200,
            languageJSON : $("editForm:appDescriptionsJSON").value,
            id:'appDescriptionHTMLCmp',
            langSelectEnabled: isLangSelectEnabled,
            defaultLocale : locale
        });

        // For IE: Add unselectable="on" to all button elements in the appDescriptionHTML div
        var btns = Ext.query("div#appDescriptionHTML button");
        btns.each(function(elt) { elt.setAttribute("unselectable", "on"); });
    }
};

ApplicationPage.initRevoker = function(jsonArray, isDisabled) {
    if ($('remediationSuggest')) {
        Ext.create('SailPoint.IdentitySuggest', {
            id: 'applicationPageRevoker',
            renderTo: 'remediationSuggest',
            binding: 'remediator',
            initialData: jsonArray,
            disabled: isDisabled,
            baseParams: {context: 'Owner'},
            width: 300
        });
    }
};

ApplicationPage.initScope = function(rawData, isShow, isDisabled) {
    if (isShow) {
        var scopeSuggest = Ext.create('SailPoint.ScopeSuggest', {
            renderTo: 'assignedScopeSuggest',
            binding: 'assignedScope',
            disabled: isDisabled,
            width: 300,
            listConfig : {width : 300}
        });

        var scopeValue = $('assignedScope').value;
        if ('' !== scopeValue) {
            scopeSuggest.setRawValue(rawData);
        }
    }
};

ApplicationPage.initProxyApp = function(json, isDisabled) {
    if ($('proxySuggest')) {
        SailPoint.SuggestFactory.createSuggest('application',
            'proxySuggest',
            null,
            null,
            {
                binding: 'proxy',
                renderTo: 'proxySuggest',
                initialData: json,
                disabled: isDisabled,
                width: 300,
                listConfig : {width : 300},
                baseParams: {proxyOnly: true}
            }
        );
    };
};

/**
 * Popup window allowing the addition of missing schemas
 * @param config
 */
ApplicationPage.showAddSchemaWindow = function(config) {

    var schemaWindow = Ext.create('Ext.window.Window', {
        id: 'addSchemaMsgBox',
        title: '#{msgs.app_button_add_object_type}',
        closeAction: 'destroy',
        modal: true,
        padding: 10,
        border: false,
        items: {
            xtype: 'combo',
            id: 'objType',
            fieldLabel: '#{msgs.app_button_select_object_type_prompt}',
            labelAlign: 'top',
            labelStyle: 'font-weight: normal',
            padding: 10,
            allowBlank: false,
            forceSelection: true,
            store: config

        },
        buttonAlign: 'center',
        buttons: [{
            text: '#{msgs.button_ok}',
            cls: 'primaryBtn marDown',
            handler: function() {
                var combo = Ext.getCmp('addSchemaMsgBox').getComponent('objType');
                if(combo && combo.validate()) {
                //Get the value from the combo, set g_schemaObjectType
                    g_schemaObjectType = combo.getValue();
                //Click Button
                $('editForm:addSchemaBtn').click();

                //Close Dialogue
                Ext.getCmp('addSchemaMsgBox').close();
            }
            }
        }, {
            text: '#{msgs.button_cancel}',
            cls: 'secondaryBtn marDown',
            handler: function() {
                g_schemaObjectType = null;
                Ext.getCmp('addSchemaMsgBox').close();
            }
        }

        ]
    });

    if(config && config.length === 1) {
        //If only one option, set the value by default
        schemaWindow.getComponent('objType').setValue(config[0]);
    }

    schemaWindow.show();


};


ApplicationPage.deriveDivId = function(field, field2) {
	var tokens = field.split("_"); 
    // we want the last token may be null
    var nameSpace = tokens[tokens.length - 1];
    return field2 + nameSpace;
};

/**
 * Function to hide a div
 * @param divId id of div to hide
 */

ApplicationPage.hideDiv = function(divId) {
	var operationRuleField = $(divId);
    if ( operationRuleField ) {
        operationRuleField.style.display = "none";
    }
};

/**
 * Function to display a div
 * @param divId id of div to display
 */
ApplicationPage.showDiv = function(divId) {
	var operationRuleField = $(divId);
    if ( operationRuleField ) {
        operationRuleField.style.display = "";
    }
};

/**
 * @param inputID id of the table where the radio inputs are
 * @param value value tested against for a checked radio
 */
ApplicationPage.setRadioInput = function(inputID, value) {
	var radioInputs = $(document.getElementsByName(inputID));
    var selectedInput;
    for (i = 0; i < radioInputs.length && !selectedInput; ++i) {
      var inputElement = radioInputs.item(i);
      if ( inputElement.value === value ) {
        inputElement.checked = true;
      } else {
        inputElement.checked = false;
      }
    }
    return selectedInput;
};

/**
 * Function to scroll to a specified div
 * @param panelDiv div to scroll to. Example: "sqlLoaderPanelDiv_"
 */
ApplicationPage.scrollToAnchor = function(panelDiv) {
	var newSchemaType = $('editForm:hiddenSchemaObjectType').value, link = $(panelDiv + newSchemaType);
    if (link) {
        link.scrollTo();
    }
};

/**
 * Changes the parsing type based on what is selected in the Rules section.
 * @param firstRule name of the first rule for the provision type. Ex: "globalRule"
 * @param secondRule name of the second rule for the provision type. Ex: "operationRule"
 */
ApplicationPage.changeParsingType = function(select, firstRule, secondRule) {
    if ( select ) {
        var name = select.name;
        if ( name ) {
            var parsingMethod = getSelectedRadioInput(name);
            ApplicationPage.toggleParsingSections(name, parsingMethod, firstRule, secondRule);
        }
    }
};

/**
 * Will show and hide the corresponding divs depending 
 * on the selection of the radio. 
 * Here we pass in the names and will add an underscore to each before using deriveDivId
 * to look for the divs
 * @param name name of div id to look under
 * @param parsingMethod parsing rule that will be toggled
 * @param firstRule name of the first rule for the provision type. Ex: "globalRule"
 * @param secondRule name of the second rule for the provision type. Ex: "operationRule"
 */
ApplicationPage.toggleParsingSections = function(name, parsingMethod, firstRule, secondRule) {
    var firstRuleDiv = ApplicationPage.deriveDivId(name, firstRule + "_");
    var secondRuleDiv = ApplicationPage.deriveDivId(name, secondRule + "_");
    if ( parsingMethod === firstRule) {
        ApplicationPage.hideDiv(secondRuleDiv);
        ApplicationPage.showDiv(firstRuleDiv);
    } else {
        ApplicationPage.showDiv(secondRuleDiv);
        ApplicationPage.hideDiv(firstRuleDiv);
    }
};


//
//  Todo - these were pulled out of the inline js on the page. They could be organized better
//

var saveClicked = false;
function saveClickAction(btn) {
    if(!saveClicked) {
        saveClicked = true;
        return Page.fireEvent('beforeSave', Page.isCompositeApp);
    }
    else {
        btn.disabled = 'disabled';
        return false;
    }
};

function isSaveOk( btn ) {
    return Page.fireEvent('beforeSave', Page.isCompositeApp) && saveClickAction( btn );
};

/** Below function will be invoked only during application Reconfiguration
 * task. It will confirm if the user want to proceed with required changes
 * done in the existing Application.
 */
function saveReconfAppConfirmation(btn) {

    function funcButton (button) {
        if (button === 'yes') {
            Page.fireEvent('beforeSave', Page.isCompositeApp) && saveClickAction( btn );
            $('editForm:hiddenSaveAppReconfBtn').click();
        }
    }
    Ext.MessageBox.show({
        title:'',
        msg: '#{msgs.app_reconf_final_confirm_msg}',
        buttons: Ext.Msg.YESNO,
        fn: funcButton
    });
}

/** the ajax hack below  causes the identity and date attributes to not be shown.
 * we need to initialize the attributes again after reloading from ajax.
 */
function doAttributesContentOnComplete(id) {
    initExtCmp(id);
    SailPoint.initAttributeEditor('applicationAttributeEditorTable', true);
}

/** This is a HACK! A4J does not like to reload ui:include upon reRender in Chrome and Safari **/
function initExtCmp(id) {
    if(Ext.isChrome || Ext.isSafari) {
        var f=0;
        var elem = document.getElementById("editForm:attributePanel");
        if(elem){
            var scripts = elem.getElementsByTagName('script');
            for(f=0; f<scripts.length; f++) {
                (new Function(scripts[f].innerHTML))(); //safer than using eval
            }
        }
    }
};

function showLoadingDiv() {
    var div = $('loadingSchemaDiv');
    if (div != null) {
        div.show();
    }
}

function hideLoadingDiv() {
    var div = $('loadingSchemaDiv');
    if (div != null) {
        div.hide();
    }
}

function changeType(sel) {
    var connSelect = $('editForm:connector');
    $('editForm:type').value = connSelect.options[connSelect.selectedIndex].value;

    /** Persist the description **/
    if($('appDescriptionHTML')) {
        $('editForm:appDescriptionsJSON').value = Ext.getCmp('appDescriptionHTMLCmp').getCleanValue();
    }

    $('editForm:changeTypeButton').click();
}

/**
 * Below function is called when user click on Reconfigure button. All the application types are passed as argument (json string) .
 * It display pop-up window which ask the user to select the new application type that user need to be migrate.
 * Once the valid new application type is selected, the application type field on the main application page is changed to
 * selected new application type and then it  sets the application reconfiguration flag as true and also calls the changeType
 *  function in the ApplicationObjectBean
 */
function enableApplicationReconfig( appTypes ){
    var appStore = JSON.parse(appTypes);
    var appTypeStore = new Ext.data.Store({
        fields: ['type'],
        data : appStore
    });

    var dialogBox, panel;
    var oldtype = $('editForm:type').value;
    panel = new Ext.form.Panel({

        baseCls: 'x-plain',
        bodyPadding: 10,
        width: 300,
        items: [
            {
                xtype: 'container',
                layout: 'hbox',
                items: [
                    {
                        xtype: 'label',
                        text: '#{msgs.app_reconf_old_app_type}',
                        name: 'oldLabType',
                        width:120,
                        align : 'left'
                    },{
                        xtype : 'image',
                        id : 'imgOldAppHlp',
                        src: SailPoint.CONTEXT_PATH+'/images/icons/dashboard_help_16.png',
                        margin : '0 0 0 45',
                        tip: '#{help.help_app_reconf_old_app_type}',
                        listeners : {
                            render: function(ls) {
                                Ext.create('Ext.tip.ToolTip', {
                                    target: ls.getEl(),
                                    html: ls.tip
                                });
                            }
                        }
                    },{
                        xtype :'textfield',
                        name: 'oldTxtAppType',
                        emptyText: oldtype,
                        readOnly: true,
                        margin : '0 0 0 10',
                        width : 150
                    }
                ]
            },{
                xtype: 'container',
                layout: 'column',
                items: [
                    {
                        xtype: 'label',
                        layout: 'hbox',
                        text: '#{msgs.app_reconf_new_app_type}',
                        name: 'newLabType',
                        width:120,
                        margin : '10 0 0 0',
                        align : 'left'
                    },{
                        xtype : 'image',
                        id : 'imgNewAppHlp',
                        src: SailPoint.CONTEXT_PATH+'/images/icons/dashboard_help_16.png',
                        margin : '10 0 0 45',
                        tip: '#{help.help_app_reconf_new_app_type}',
                        listeners : {
                            render: function(ls) {
                                Ext.create('Ext.tip.ToolTip', {
                                    target: ls.getEl(),
                                    html: ls.tip
                                });
                            }
                        }
                    },{
                        xtype: 'combobox',
                        name: 'appComboType',
                        id: 'appComboType',
                        store: appTypeStore,
                        displayField: 'type',
                        value: '#{msgs.app_reconf_select_one}',
                        valueField: 'type',
                        width : '40%',
                        editable: false,
                        queryMode: 'local',
                        typeAhead: true,
                        editable: true,
                        margin : '10 0 0 10'
                    }
                ]
            }
        ]

    });
    dialogBox = new Ext.Window({
        title: '<span class="subSectionHeader">#{msgs.app_reconf_winpanel_header}</span>',
        resizable: false,
        layout:'fit',
        height: 300,
        width: 625,
        modal: true,
        bodyStyle: 'background-color: white; padding: 10px; overflow: auto',
        closable:true,
        items:[panel],
        buttons:[
            {
                text:'#{msgs.app_reconf_save_btn_value}',
                cls:'primaryBtn',
                handler:function() {
                    var combo = Ext.getCmp('appComboType');
                    var selValue = combo.getValue();
                    if (selValue === '#{msgs.app_reconf_select_one}' || selValue === oldtype || selValue === null){
                        Ext.Msg.show({
                            msg: '#{msgs.app_reconf_invalid_apptype_msg}',
                            buttons: Ext.Msg.OK
                        });
                    }else{
                        function funcButton (btn) {
                            if (btn === 'yes') {
                                // We are trying to set the value of new application type in appType field in the main application page
                                // as the appType field (selectOneMenu) has only one value that is of old application type
                                // we are first adding value new application value in the appType (selectOneMenu) and then setting the value
                                var tempComboVal = document.createElement('option');
                                tempComboVal.text  = selValue;
                                tempComboVal.value = selValue;
                                $('editForm:appType').add(tempComboVal,null);
                                $('editForm:appType').value=selValue;
                                var connSelect = $('editForm:appType');
                                $('editForm:type').value = connSelect.options[connSelect.selectedIndex].value;
                                $('editForm:appReconfigMode').value = 'true';
                                $('editForm:changeTypeButton').click();
                                dialogBox.close();
                            }else{
                                dialogBox.close();
                            }
                        }
                        Ext.MessageBox.show({
                            title:'',
                            msg: '#{msgs.app_reconf_first_confirm_msg}',
                            buttons: Ext.Msg.YESNO,
                            fn: funcButton
                        });
                    }
                }
            },{
                text:'#{msgs.app_reconf_cancel_btn_value}',
                cls: 'secondaryBtn',
                handler:function() {
                    dialogBox.close();
                }
            }
        ]

    });
    dialogBox.show();
}

/**
 * This function is invoked when the user selects one of the option of provisioning policy (old or new)
 * and then pops up a confirm message box whether the user wants to proceed or not.
 * If user selects yes it sets one of old or new option in the templateChoice hidden variable and then calls the
 * updateProvPolicies function in the ApplicationObjectBean.
 *
 */
function modifyProvPolicies(){

    function funcButton (btn) {
        if (btn === 'yes') {
            var selection = getSelectedRadioInput("editForm:radioBtnProvPolicies");
            if ( selection && selection.length > 0){
                $('editForm:templateChoice').value = selection;
                $('editForm:updateProvisionPolicyBtn').click();
            }
        }
    }
    if ( getSelectedRadioInput("editForm:radioBtnProvPolicies") ) {
        Ext.MessageBox.show({
            title:'',
            msg: '#{msgs.app_reconf_confirm_prov_policies_msg}',
            buttons: Ext.Msg.YESNO,
            fn: funcButton
        });
    } else {
        Ext.Msg.alert('', '#{msgs.app_reconf_select_alert_prov_policies_msg}', Ext.emptyFn);
    }

}

function reapplyStyles() {}

function startTest(button) {
    $('testResultsDiv').className = 'workingText';
    $('testResultsDiv').innerHTML = '#{msgs.conn_test_connecting_to_app}';
    button.disabled = true;
}

function endTest() {
    $('editForm:testButton').disabled = false;
}

function showExtTab(tab) {
    var tabId = tab.getItemId();
    $('editForm:currentTab').value = tabId;
    refreshContentDisplay(tabId);

    // displayAppropriatePane(tabId, 'tab_' + tabId);
    // extra initialization by tab id
    if (tabId == 'compositeTiers') {

        var cmp = Ext.get(SailPoint.COMP_DEF_PANEL_CMP_ID);
        if (!cmp) {
            var panel = new SailPoint.CompositeDefinitionPanel({
                id:SailPoint.COMP_DEF_PANEL_CMP_ID,
                dataStore:ApplicationPage.getCompositeStore(),
                accountRule:Page.initialAccountRule,
                remediationRule:Page.initialRemediationRule,
                renderTo : 'compositeTiersDiv'
            });
        }
    } else if (tabId == 'schemaContent') {
        initSchemaTab();
    } else if (tabId == 'dataSourcesContent') {
        SailPoint.activityDS.initDSContent();
    } else if(tabId == 'templateContent') {
        initApplicationDependency();
    } else if (tabId == 'unstructuredContent') {
        SailPoint.targetDS.initDSContent();
    } else if (tabId == 'correlationContent') {
        // maybe do something here later?
    } else if (tabId == 'passwordContent') {
        $('editForm:updatePasswordPanelBtn').click();
    } else if (tabId == 'accountsGridContent') {
        SailPoint.Define.Applications.AccountsGrid.adjustWidth();
        $('accountsGridContent').hide();
    } else if (tabId == 'attributesContent') {
        $('editForm:attributePanelBtn').click();
        Page.fireEvent('configSettingsLoaded');
        //Update attributesContent layout after Configurations is first hit
        tab.updateLayout();
    } else if (tabId == 'applicationConfigTabs') {
        if(!tab.getActiveTab()) {
            tab.setActiveTab('attributesContent');
            showExtTab(tab.getComponent('attributesContent'));
        } else {
            showExtTab(tab.getActiveTab());
        }
    }
}

function showTab(tabId) {
    $('editForm:currentTab').value = tabId;
    displayAppropriatePane(tabId, 'tab_' + tabId);

    // extra initialization by tab id
    if (tabId == 'compositeTiers') {

        var cmp = Ext.get(SailPoint.COMP_DEF_PANEL_CMP_ID);
        if (!cmp) {
            var panel = new SailPoint.CompositeDefinitionPanel({
                id:SailPoint.COMP_DEF_PANEL_CMP_ID,
                dataStore:ApplicationPage.getCompositeStore(),
                accountRule:Page.initialAccountRule,
                remediationRule:Page.initialRemediationRule,
                renderTo : 'compositeTiersDiv'
            });
        }
    } else if (tabId == 'schemaContent') {
        initSchemaTab();
    } else if (tabId == 'dataSourcesContent') {
        SailPoint.activityDS.initDSContent();
    } else if(tabId == 'templateContent') {
        $('editForm:templatePanelLoadBtn').click();

    } else if (tabId == 'unstructuredContent') {
        SailPoint.targetDS.initDSContent();
//        $('editForm:refreshSourceConfigPanel').click();
    }
}

function initSchemaTab() {
    var loaded = $('editForm:schemaLoaded').value;

    if (( loaded == null ) || ( loaded.length == 0 ) || ( loaded == "false" )) {
        showLoadingDiv();
        $('editForm:schemaLoaded').value = 'true';
        $('editForm:tabUpdateBtn').click();
    }
}

function createCollapsiblePanelForDiv(itemId, title, contentEl, isCollapsed) {
  return Ext.create('Ext.panel.Panel', {
      itemId: itemId,
      title: title,
      contentEl: contentEl,
      collapsible: true,
      collapseMode: 'header',
      collapsed: (isCollapsed) ? isCollapsed : false,
      autoScroll: true,
      titleCollapse: true,
      margin: '20',
      cls: 'blueHeader'
  });
}

function createComponentForDiv(itemId, contentEl) {
  return {
      xtype: 'component',
      itemId: itemId,
      margin: '20',
      cls: 'blueHeader',
      contentEl: contentEl
   };
}

function initApplicationDependency(jsonData, exclusionIds) {
    if ($('applicationDependency')) {
      var dependencySuggest = Ext.getCmp('applicationDependencyCmp');
      if (dependencySuggest) {
      	dependencySuggest.destroy();
      }
      dependencySuggest = new SailPoint.MultiSuggest({
      	id : 'applicationDependencyCmp',
      	renderTo : 'applicationDependency',
      	suggestType : 'application',
      	jsonData : Ext.decode($('applicationDependencyData').innerHTML),
      	inputFieldName : 'editForm:applicationDependencyHidden',
      	exclusionIds : $('applicationDependencyExclusionIds').innerHTML,
      	extraParams : {
      		'showSync' : true
      	}
      });
    }
}

function initTabs() {
    var content;
    var button;
    var currentTab = $('editForm:currentTab').value;

    var isRendered = $('submenu-tabs') === null;

    if (!isRendered) {

        // check if current tab is rendered
        var curTabElem = currentTab ? $(currentTab) : null;
        if (curTabElem) {
            showTab(curTabElem.id);
        } else {
            // if the tab isn't selected, set it to the first
            // tab item in the submenu-links list
            var firstTab = Ext.fly('submenu-links').child('li').id;
            var tabContenEl = firstTab.substring(4);
            // remove tab_ prefix
            showTab(tabContenEl);
            $('editForm:currentTab').value = tabContenEl;
        }
    }
}

function initExtTabs() {

    var exttabdiv = Ext.get('applicationExtTabs');
    if (exttabdiv == null)
        return;

    var applicationPageExtTabs = Ext.create('Ext.tab.Panel', {
        renderTo:'applicationExtTabs',
        //minTabWidth: 135,
        //tabWidth:175,
        enableTabScroll:true,
        id: 'appTab',
        border:false,
        plain: true,
        // width: '95%', // removing here, contentEl and ext components don't play well with a percentage width set here.
        // height:1,
        defaults: {autoScroll:true},
        tabBar: {
            cls: 'appPageExtTabs'
        }
    });
}

function configureExtTabs(connectorType) {

    var applicationPageExtTabs = Ext.getCmp('appTab');

    var detailsPanel = Ext.create('Ext.panel.Panel', {
        xtype: 'panel',
        itemId: 'detailsContent',
        contentEl: 'detailsContent',
        title: ($('editForm:appReconfigMode').value === 'true' ) ? '#{msgs.details}' +'<span style="color:red">' +'*'+'</span>' : '#{msgs.details}',
        listeners: {activate: showExtTab},
        html: ''
    });

    applicationPageExtTabs.add(detailsPanel);

    if(! Ext.isEmpty(connectorType)) {

        var compositePanel = Ext.create('Ext.panel.Panel', {
            itemId: 'compositeTiers',
            contentEl: 'compositeTiers',
            title: '#{msgs.app_tab_tiers}',
            listeners: {activate: showExtTab},
            html: ''});


        var attributesPanel = Ext.create('Ext.panel.Panel', {
            itemId: 'attributesContent',
            contentEl: 'attributesContent',
            title: ($('editForm:appReconfigMode').value === 'true' ) ? '#{msgs.app_tab_conf_settings}' + '<span style="color:red">' + '*' + '</span>' : '#{msgs.app_tab_conf_settings}',
            listeners: {activate: showExtTab},
            width: 768,
            html: ''});

        var schemaPanel = Ext.create('Ext.panel.Panel', {
            itemId: 'schemaContent',
            contentEl: 'schemaContent',
            title: ($('editForm:appReconfigMode').value === 'true') ? getSchemaTitle() + '<span style="color:red">' + '*' + '</span>' : '#{msgs.schema}',
            listeners: {activate: showExtTab},
            width: 768,
            // remove some scroll bar ghosting when expand/collapsing
            autoScroll: false,
            html: ''});

        var provisioningPolicyPanel = Ext.create('Ext.panel.Panel', {
          itemId: 'templateContent',
          contentEl: 'templateContent',
          title: ($('editForm:appReconfigMode').value === 'true') ? '#{msgs.templates}' + '<span style="color:red">' + '*' + '</span>' : '#{msgs.templates}',
          listeners: {activate: showExtTab},
          // remove some scroll bar ghosting when expand/collapsing
          autoScroll: false,
          html: ''});

        var appObjectTabPanel = Ext.create('Ext.tab.Panel', {
            itemId: 'applicationConfigTabs',
            contentEl: 'applicationConfigTabs',
            title: '#{app_tab_conf}',
            border: false,
            plain: true,
            tabBar: {
                cls: 'appConfig'
            },
            enableTabScroll: true,
            defaults: {autoScroll: true},
            listeners: {activate: showExtTab},
            items: [attributesPanel, schemaPanel]
        });

        if (!Page.isCompositeApp) {
        	appObjectTabPanel.add(provisioningPolicyPanel);
        }

        var correlationPanel = Ext.create('Ext.panel.Panel', {
            itemId: 'correlationContent',
            contentEl: 'correlationContent',
            title: '#{msgs.correlation}',
            listeners: {activate: showExtTab},
            html: ''});

        var riskPanel = Ext.create('Ext.panel.Panel', {
            itemId: 'riskContent',
            contentEl: 'riskContent',
            title: '#{msgs.risk}',
            listeners: {activate: showExtTab},
            html: ''});

        var adSourcesPanel = Ext.create('Ext.panel.Panel', {
            itemId: 'dataSourcesContent',
            contentEl: 'dataSourcesContent',
            title: '#{msgs.activity_data_sources}',
            listeners: {activate: showExtTab},
            html: ''});

        var unstructuredPanel = Ext.create('Ext.panel.Panel', {
            itemId: 'unstructuredContent',
            contentEl: 'unstructuredContent',
            title: '#{msgs.unstructured_targets}',
            listeners: {activate: showExtTab},
            html: ''});

        var rulesPanel = Ext.create('Ext.panel.Panel', {
            itemId: 'rulesContent',
            contentEl: 'rulesContent',
            title: '#{msgs.rules}',
            listeners: {activate: showExtTab},
            html: ''});

        var passwordPolicyPanel = Ext.create('Ext.panel.Panel', {
            itemId: 'passwordContent',
            contentEl: 'passwordContent',
            title: '#{msgs.password_policy}',
            listeners: {activate: showExtTab},
            html: ''});

        var editedAppId = $('editForm:id').value;
        var accountsGridPanel;


        applicationPageExtTabs.add(appObjectTabPanel);

        if (Page.isCompositeApp) {
            applicationPageExtTabs.add(compositePanel);
            applicationPageExtTabs.on('tabchange', SailPoint.CompositeDefinitionPanel.saveCompositeDefinition);
        }

        if (!Page.isCompositeApp) {
            applicationPageExtTabs.add(correlationPanel);
        }
        if (editedAppId && editedAppId.length > 0) {
            accountsGridPanel = SailPoint.Define.Applications.AccountsGrid.getAccountsGridConfig();
            applicationPageExtTabs.add(accountsGridPanel);
        }
        applicationPageExtTabs.add(riskPanel);
        if (!Page.isCompositeApp) {
            applicationPageExtTabs.add(adSourcesPanel);
        }
        if (Page.supportsUnstructuredTargets) {
            applicationPageExtTabs.add(unstructuredPanel);
        }
        if (!Page.isCompositeApp) {
            applicationPageExtTabs.add(rulesPanel);
            applicationPageExtTabs.add(passwordPolicyPanel);
        }
    }

    var currentTab = $('editForm:currentTab').value;
    // massage current tab based on sub tabs
    if (currentTab === 'attributesContent' || currentTab === 'schemaContent') {
        currentTab = 'applicationConfigTabs';
    }
    var curTabElem = currentTab ? applicationPageExtTabs.getComponent(currentTab) : null;
    if (curTabElem) {
        applicationPageExtTabs.setActiveTab(curTabElem);
        showExtTab(curTabElem);
    }
    else {
        if (Page.isCompositeApp) {
            applicationPageExtTabs.setActiveTab(compositePanel);
            showExtTab(compositePanel);
        }
        else {
            applicationPageExtTabs.setActiveTab(detailsPanel);
            showExtTab(detailsPanel);
        }
    }
}

//
//Change the name Schema to Schema Mapping in case of application reconfiguration mode
//
function getSchemaTitle() {
    if ( ( $('editForm:appReconfigMode').value === true) && $('editForm:isSchemaMappingSaved').value === true ) {
        return '#{msgs.schema}';
    } else {
        return '#{msgs.app_reconf_schema_mapping}';
    }
}

function refreshTabPanel() {
    if (Ext.getCmp('appTab')) {
        Ext.getCmp('appTab').doComponentLayout();
    }
}

//
// Correlation Wizard
//

var LAST_WIZARD_PAGE = 6;

function startWizard(editMode) {
    var activePage = 0;
    if ( editMode ) {
        activePage = 3;
        $('editMode').value = "true";
        launchWizard(activePage);
    } else {
        $('editMode').value = "false";
        var configItem =  $('editForm:currentConfigSelection');
        if ( configItem ) {
            configItem.value = "";
            $('editForm:switchConfig').click();
            // We can't launch the wizard till the a4j request completes, updating
            // the components of the page that will be used to build the wizard ui.
            // Launch the wizard once the correlation conf ui is reloaded. 'single:true'
            // is used here since we only want to respond to the event the first time is fires
            Page.on('correlationReloaded', launchWizard, this, {single:true})
        } else {
            launchWizard(activePage);
        }
    }

} // startWizard

function launchWizard(activePage){

    if (!activePage)
        activePage =0;

    if (activePage == 0){
        var identityName =  $('editForm:selectedIdentity');
        if ( identityName ) {
            identityName.value = "";
        }
        var identitySuggest = Ext.getCmp('accountCorrelationIdentity');
        if (identitySuggest && identitySuggest.forcefullyClearValue)
            identitySuggest.forcefullyClearValue();
        var configName =  $('editForm:configurationName');
        if ( configName ) {
            configName.value = "";
        }

        $('editForm:newFilterValue').value = '';
        $('editForm:directApplicationAttributeSelection').selectedIndex = 0;
    }

    var wizard = Ext.getCmp('correlationWizard');
    if (wizard) {
        Ext.getCmp('wizardPanels').getLayout().setActiveItem(activePage);
    } else {
        var wizardPanels = Ext.create('Ext.panel.Panel', {
            id: 'wizardPanels',
            border: true,
            layout:'card',
            activeItem: activePage,
            bbar: ['->', {
                disabled : 'true',
                id: 'wizard-prev',
                handler: Ext.bind(wizardNav, this, [-1]),
                text: '#{msgs.corwiz_button_prev}'
            },{
                id: 'wizard-next',
                handler: Ext.bind(wizardNav, this, [1]),
                text: '#{msgs.corwiz_button_next}'
            },{
                xtype: 'tbseparator'
            },{
                id: 'wizard-save',
                handler: function(){
                    $('editForm:saveConfigButton').click();
                    wizard.hide();
                },
                cls: 'primaryBtn',
                text: '#{msgs.corwiz_button_save}'
            },{
                id: 'wizard-close',
                handler: function(){
                    $('editForm:switchConfig').click();
                    wizard.hide();
                },
                text: '#{msgs.corwiz_button_cancel}'
            }],
            items: [{
                id: 'page-0',
                autoScroll : 'true',
                contentEl: 'WelcomePage'
            },{
                id: 'page-1',
                autoScroll : 'true',
                title: '#{msgs.corwiz_page1_title}',
                contentEl: 'CollectName'
            },{
                id: 'page-2',
                autoScroll : 'true',
                title: '#{msgs.corwiz_page2_title}',
                contentEl: 'IntroAttributeBasedCorrelation'
            },{
                id: 'page-3',
                autoScroll : 'true',
                title: '#{msgs.corwiz_page3_title}',
                contentEl: 'CurrentAttributeBasedCorrelation'
            },{
                id: 'page-4',
                autoScroll : 'true',
                title: '#{msgs.corwiz_page4_title}',
                contentEl: 'AskConditionBasedCorrelation'
            },{
                id: 'page-5',
                autoScroll : 'true',
                title: '#{msgs.corwiz_page5_title}',
                contentEl: 'AddConditionBasedCorrelation'
            },{
                id: 'page-6',
                autoScroll : 'true',
                title: '#{msgs.corwiz_page6_title}',
                contentEl: 'CurrentConditionBasedCorrelation'
            }]
        });

        var wizard = Ext.create('Ext.window.Window', {
            id       : 'correlationWizard',
            title    : '#{msgs.corwiz_dialog_title}',
            closable : true,
            closeAction : 'hide',
            width    : 700,
            height   : 500,
            plain    : true,
            renderTo : 'wizardRenderToDiv',
            layout   : "fit",
            items    : [wizardPanels]
        });
    }

    setupButtons(activePage);
    wizard.show();
    wizard.alignTo('applicationExtTabs', 't-c?');

    Ext.getCmp('wizard-next').focus();
}

var wizardNav = function(incr){
    navigate(incr);
}

function navigate(incr) {
    var panels = Ext.getCmp('wizardPanels');
    var layout = panels.getLayout();
    var current = layout.activeItem.id.split('page-')[1];
    var next = getNextPanel(current,incr);
    layout.setActiveItem(next);
    setupButtons(next);
}

function gotoPage(page) {
    var panels = Ext.getCmp('wizardPanels');
    var layout = panels.getLayout();
    layout.setActiveItem(page);
    setupButtons(page);
}

function setupButtons(next) {
    // Disable the next/prev depending on the index.
    Ext.getCmp('wizard-prev').setDisabled(next==0);
    Ext.getCmp('wizard-next').setDisabled(next==LAST_WIZARD_PAGE);
    if ( next > 2 ) {
        Ext.getCmp('wizard-save').setDisabled(false);
    } else {
        Ext.getCmp('wizard-save').setDisabled(true);
    }
    enterKeyCheck();
}

function getNextPanel(currentPanel, incr) {
    // by default go to the next panel
    var current = parseInt(currentPanel);
    var next = current  + incr;

    var editMode = false;
    var editMode = $('editMode');
    if ( editMode) {
        if ( editMode.value == "true" ) {
            editMode = true;
        } else {
            editMode = false;
        }
    }
    if ( incr == 1 ) {
        // if we are incrementing ( hitting next )
        switch(current) {
            case 1:
                // validate the name before we move to the next page
                var configName =  $('editForm:configurationName');
                if ( configName ) {
                    if ( configName.value == "" ) {
                        var errorDiv = $('errorDiv');
                        if ( errorDiv ) {
                            errorDiv.innerHTML = '#{msgs.corwiz_err_must_enter_name}';
                            errorDiv.show();
                            next = 1;
                        }
                    } else {

                        for(var i=0;i<existingCorrelationConfigs.length;i++){
                            var conf = existingCorrelationConfigs[i];
                            if (conf.name == configName.value){
                                var errorDiv = $('errorDiv');
                                errorDiv.innerHTML = '#{msgs.corwiz_duplicate_name}';
                                errorDiv.show();
                                next = 1;
                                break;
                            }
                        }
                    }
                }
                break;
            case 3:
                if ( editMode ) {
                    next = 6;
                }
                break;
            case 4:
                // either jump past or collect conditional mappings
                var val = getSelectedRadioInput('editForm:AskDirectYesNo');
                if ( ( val ) && ( val == "yes" ) ) {
                    next = 5;
                } else {
                    next = LAST_WIZARD_PAGE;
                }
                break;
            case 5:
                // add the direct and refresh components
                $('editForm:addDirectButton').click();
                // force into edit mode
                $('editMode').value = "true";
                break;
        }
    } else {
        if ( incr == -1 ) {
            // if we are decrementing ( hitting back )
            switch(current) {
                case 3:
                    // shouldn't hit here..
                    if ( editMode ) {
                        next = 3;
                    }
                    break;
                case 6:
                    next = 3;
                    break;
            }
        }
    }
    // safe guard against negatives
    if ( next < 0 ) next = 1;
    return next;
}

function scrollToElement(cssSelector) {
    var eleArray = Ext.query(cssSelector), ele;
    if (eleArray && eleArray[0]) {
        ele = eleArray[0];
        if (ele.scrollIntoView) {
            ele.scrollIntoView();
        }
    }
}

//
// enterKeyCheck now passes in a function to handle the keypress events.
// The initial code was borrowed from the SailPoint.SubmitOnEntier._handleKeyPress.
// This callback checks to see if the wizardPanels or CompositeDefinitionPane
// is visible and if it is visible will stops the enter event and navigates to 
// the next panel. Otherwise, the behavior stays the same and we click the 
// editForm:saveAppBtn.
//
function enterKeyCheck(node) {
    var submitOnEnter = new SailPoint.SubmitOnEnter(null, function(event) {
        // IE workaround
        if (!event) {
            var event = window.event;
        }
        if (Event.KEY_RETURN == event.keyCode) {
            var cmp = Ext.getCmp('wizardPanels');
            if ( !cmp )
                cmp = Ext.getCmp('CompositeDefinitionPanel');
            if ( cmp ) {
                if ( cmp.isVisible() ) {
                    // Stop the event from propagating
                    Event.stop(event);
                    return false;
                }
            } else if (event.target && event.target.id && event.target.id.startsWith('searchfield')) {
                // Don't save if we're just doing a search
                return false;
            }
            var button = $('editForm:saveAppBtn');
            button.click();
            //added for ie6 to avoid twin enter key issue
            return false;
        } else {
            return true;
        }
    });
    submitOnEnter.inputTextFieldsCheck(node);
}

//
// Javascript to support the Native Change Detection options
//

/**
 * Called when the page is rendered, and displays the native change
 * options if the application is enabled. It additionally
 * figures out if the hidden nativeChangesUSerDefinedAttributes
 * should be hidden or displayed.
 *
 */
function initializeNativeChangeFields(enabled) {
    if ( enabled ) {
        if ( enabled == "true" ) {
            var div = $("nativeChangeOptions");
            if ( div ) {
                div.show();
            }
        }
    }
    changeNativeChangeAttributeSelection();
}

/**
 * Function called when the checkbox that enabled native change
 * detection is selected.
 *
 * This method toggles the display of the native change options
 * div.
 */
function changeNativeDetectionEnablement() {
    var checkbox = $("editForm:nativeChangeEnableCheckbox");
    if ( checkbox ) {
        var div = $("nativeChangeOptions");
        if ( div ) {
            if ( div.style.display == "none" ) {
                div.show();
            } else {
                div.hide();
            }
        }
    }
}

/**
 * When the attribute selection for native changes is selected
 * hide/show the div that shows additional textbox for manually
 * entered attributes.
 */
function changeNativeChangeAttributeSelection() {
    var div = $("nativeChangesUserDefinedAttributes");
    if ( div ) {
        var selection = getSelectedRadioInput("editForm:nativeChangeAttributeSelection");
        if ( selection && selection == "userDefined" ) {
            div.show();
        } else {
            div.hide();
            var textArea = $('editForm:nativeChangesUserDefinedAttributesTextArea');
            if ( textArea ) {
                textArea.value = "";
            }
        }
    }
}
