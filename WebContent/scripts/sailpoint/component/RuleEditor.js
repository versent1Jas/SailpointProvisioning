/* (c) Copyright 2010 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Constructor for the rule edit window.
 */
Ext.define('SailPoint.Rule.Editor.Window', {
    extend : 'Ext.window.Window',
    
    shadow: true,
    
    closeAction: 'hide',
    
    initComponent : function() {
        this.ruleName = new Ext.Panel({
            id : 'ruleNamePanel',
            layout: 'fit',
            bodyCls: 'ruleEditorPanel',
            //width: 200,
            tbar : [ '#{msgs.rule_editor_rule_name}' ],
            items : [ new Ext.form.Hidden({
                id : 'ruleId'
            }), new Ext.form.TextField({
                id : 'ruleName',
                disabledCls : 'ruleEditorDisabled',
                fieldCls: 'ruleEditorField x-form-field'
            }) ]
        });

        this.ruleType = new Ext.Panel({
            id : 'ruleType',
            layout : 'fit',
            height: 45,
            tbar : [ '#{msgs.rule_editor_rule_type}' ],
            bodyCls : 'ruleEditorTypePanel',
            html : ''
        });

        this.rtnType = new Ext.Panel({
            id : 'rtnType',
            layout : 'fit',
            height: 45,
            tbar : [ '#{msgs.rule_editor_return_type}' ],
            bodyCls : 'ruleEditorTypePanel',
            html : ''
        });

        this.args = new SailPoint.Rule.Editor.ArgumentsPanel({
            id : 'argsPanel',
            dataType : 'args',
            rowHeight : 0.5,
            bodyCls: 'ruleEditorPanel'
        });

        this.rtns = new SailPoint.Rule.Editor.ArgumentsPanel({
            id : 'rtnsPanel',
            dataType : 'rtns',
            rowHeight : 0.5,
            bodyCls: 'ruleEditorPanel'
        });

        this.sourceCodePanel = new Ext.Panel({
            id : 'sourceCodePanel',
            layout : 'fit',
            border: false,
            region : 'center',
            items : [ new Ext.form.TextArea({
                id : 'source',
                fieldCls: 'ruleEditorSourceCodeField x-form-field'
            }) ],
            dockedItems : [{
                id: 'sourceCodeToolbar',
                xtype: 'toolbar',
                dock : 'top',
                items: [
                    {xtype : 'tbfill'},
                    '#{msgs.rule_editor_copy_from_an_existing_rule}',
                    // TODO: make the combo box show a "no results" method if no
                    // existing
                    // rules are found. Using SailPoint.form.ComboBox freezes up after
                    // displaying the msg - you can't do anything with the combo box
                    // afterwards
                    new Ext.form.ComboBox({
                        id : 'existingRules',
                        forceSelection : true,
                        displayField : 'name',
                        valueField : 'name',
                        value : '',
                        typeAhead : true,
                        queryDelay : 250,
                        minChars : 1,
                        emptyText : '#{msgs.select_one}',
                        width : 200,
                        store : SailPoint.Store.createStore({
                            model : 'SailPoint.model.Name',
                            url : SailPoint.getRelativeUrl('/include/rules/ruleEditorDataSource.json'),
                            extraParams : {
                                'data' : 'existing'
                            },
                            root : 'rules'
                        })
                    })
                ]
            }]
        });

        this.description = new Ext.Panel({
            id: 'descriptionPanel',
            layout : 'fit',
            items : [ new Ext.form.TextArea({
                id : 'description',
                fieldCls: 'ruleEditorField x-form-field',
                maxWidth : 600
            }) ],
            tbar : [ '#{msgs.description}' ],
            region : 'south',
            height : 100,
            split : true,
            minHeight : 0,
            border: false
        });
        
        this.ruleMeta = new Ext.Panel({
            id : 'ruleMeta',
            //header : true,
            layout : {
                type: 'vbox',
                align: 'stretch'
            },
            bodyCls: 'ruleMeta',
            region : 'east',
            split : true,
            width : 200,
            collapsible : true,
            items : [ this.ruleName, this.ruleType, this.rtnType, this.args, this.rtns ]
        });

        this.ruleCode = new Ext.Panel({
            id: 'ruleCodePanel',
            layout : 'border',
            bodyCls: 'ruleCodePanel',
            title : '#{msgs.rule_editor_title}',
            region : 'center',
            width : 600,
            collapsible : false,
            items : [ this.sourceCodePanel, this.description ]
        });

        this.items = [ this.ruleMeta, this.ruleCode ];

        this.bbar = [ '->', {
            id : 'ruleErrorMsg',
            xtype: 'tbtext',
            text : 'placeholder text',
            hidden : true
        }, {
            id : 'ruleSave',
            text : '#{msgs.button_save}',
            cls : 'primaryBtn',
            handler : function() {
                SailPoint.Rule.Editor.ArgViewPanel.close();
                SailPoint.Rule.Editor.validateSaveRule();
            }
        }, {
            id : 'ruleSaveAs',
            text : '#{msgs.button_save_as}',
            handler : function() {
                Ext.getCmp('ruleErrorMsg').hide();
                SailPoint.Rule.Editor.SaveAsWindow.show();
            }
        }, {
            id : 'ruleCancel',
            text : '#{msgs.button_cancel}',
            handler : function() {
                SailPoint.Rule.Editor.ArgViewPanel.close();
                SailPoint.Rule.Editor.EditWindow.hide();
            }
        } ];
        
        this.callParent(arguments);
    }
});

/**
 * Constructor for an arguments panel, which displays either the arguments for
 * or return values of the given rule.
 */
Ext.define('SailPoint.Rule.Editor.ArgumentsPanel', {
    extend : 'Ext.panel.Panel',
    grid : undefined,
    dataType : undefined,
    layout : 'fit',

    initComponent : function() {
        var title = (this.dataType == 'args') ? '#{msgs.rule_editor_args}' : '#{msgs.rule_editor_rtns}';
        this.tbar = [ title ];

        this.grid = new SailPoint.Rule.Editor.ArgumentsGrid({
            id : this.dataType + "Grid",
            dataType : this.dataType,
            bodyCls: 'ruleEditorArgumentsGrid'
        });
        this.items = [ this.grid ];

        SailPoint.Rule.Editor.ArgumentsPanel.superclass.initComponent.apply(this, arguments);
    }
});

/**
 * Constructor for the grid that displays the arguments/returns for the given
 * rule.
 */
Ext.define('SailPoint.Rule.Editor.ArgumentsGrid', {
    extend : 'Ext.grid.Panel',
    dataType : undefined,
    height : 128,
    autoScroll : true,
    hideHeaders : true,
    viewConfig : {
        scrollOffset : 1
    },

    initComponent : function() {

        this.columns = [ {
            name : 'name',
            dataIndex : 'name',
            flex : 1,
            sortable : true
        } ];

        this.store = SailPoint.Store.createStore({
            fields : [ 'id', 'name', 'type', 'description' ],
            // the storeId prevents name collisions btwn the args and rtns
            // panels in the StoreMgr
            storeId : this.dataType + '_store',
            url : SailPoint.getRelativeUrl('/include/rules/ruleEditorDataSource.json'), 
            extraParams : { 'data' : this.dataType },
            root : 'args'
        });

        this.addListener('itemclick', SailPoint.Rule.Editor.clickRow);
        this.addListener('itemcontextmenu', this.doNothing, this);

        this.callParent(arguments);
    },

    doNothing : function(grid, rowIndex, event) {
        // swallow the event
        event.stopEvent();
    }
});

/**
 * Constructor for the panel that displays the details of a given
 * argument/return.
 */
Ext.define('SailPoint.Rule.Editor.ArgumentViewPanel', {
    extend : 'Ext.Window',
    
    closable : false,
    frame : false,
    floating : true,
    layout : 'vbox',
    
    constructor : function(config) {
        Ext.apply(this, {
            items : [
                {
                    xtype : 'form',
                    border : false,
                    maxWidth : 600,
                    fieldDefaults : {
                        margin : 5
                    },
                    items : [
                        {
                            xtype : 'displayfield',
                            fieldLabel :'#{msgs.name}'
                        },
                        {
                            xtype : 'displayfield',
                            fieldLabel : '#{msgs.type}'
                        },
                        {
                            xtype : 'displayfield',
                            fieldLabel : '#{msgs.description}'
                        }
                    ]
                }
            ],
            bbar : {
                xtype : 'toolbar',
                style : 'border: 1px solid #cccccc',
                items : [ '->', {
                    xtype : 'button',
                    text : '#{msgs.button_close}',
                    handler : function() {
                        var win = this.findParentByType('window');
                        if(win) {
                            win.close();
                        }
                    }
                } ]
            }
        });
        
        this.callParent(arguments);
    },

    initComponent : function() {
        this.callParent(arguments);

        this.nameField = this.items.get(0).items.get(0);
        this.typeField = this.items.get(0).items.get(1);
        this.descField = this.items.get(0).items.get(2);
    },

    open : function() {
        
        this.show(); // This has to come first.
        
        this.nameField.bodyEl.setStyle('vertical-align', 'text-top');
        this.typeField.bodyEl.setStyle('vertical-align', 'text-top');
        this.descField.bodyEl.setStyle('vertical-align', 'text-top');

        var desc = this.descField.getHeight();
        var name = this.nameField.getHeight();
        var type = this.typeField.getHeight();
        
        this.descField.setHeight(desc); // hack to get the field to display properly
        
        this.setWidth(this.items.get(0).getWidth() + 15);
        this.setHeight( name + type + desc + 80 );

        this.center();
    },
    
    resetFields : function() {
        this.nameField.setHeight(40);
        this.typeField.setHeight(40);
        this.descField.setHeight(40);
    },

    close : function() {
        if (this.isVisible()) {
            this.resetFields();
            this.hide();
        }
    },

    init : function(nameVal, typeVal, descVal) {
        this.resetFields();
        this.nameField.setValue( SailPoint.Rule.Editor.notEmpty(nameVal) );
        this.typeField.setValue( SailPoint.Rule.Editor.notEmpty(typeVal) );
        this.descField.setValue( SailPoint.Rule.Editor.notEmpty(descVal) );
    }
});

SailPoint.Rule.Editor.ArgViewPanel = new SailPoint.Rule.Editor.ArgumentViewPanel({});

/**
 * The popup window used to save the given rule by a different name.
 */
SailPoint.Rule.Editor.SaveAsWindow = new Ext.Window({
    title : '#{msgs.button_save_as}',
    resizable : false,
    modal : true,
    width : '370',
    layout : 'table',
    layoutConfig : {
        columns : 2
    },
    closeAction : 'hide',
    onEsc : function() {
        this.hide();
    },
    items : [ new Ext.form.TextField({
        id : 'newName',
        width : '300',
        style : 'margin-bottom:0px'
    }), new Ext.Button({
        text : '#{msgs.button_done}',
        // why won't it take just a pointer to the function here?
        handler : function() {
            SailPoint.Rule.Editor.validateSaveRuleAs();
        }
    }) ]
});

/**
 * Entry point for the rule editor. The rule name and type are set as global
 * variables. An a4j call loads the requested rule from the db and sets it in
 * the session for later access. (If the rule name is empty, the user is
 * creating a new one.) Once the a4j call completes, it calls initWindow() to
 * create/show the edit window.
 * 
 * @param rName
 *            The name of the rule being edited; empty if creating a new rule
 * @param rType
 *            The Rule.Type of the rule being edited
 * @param rBtn
 *            The a4j button that refreshes the a4j panel containing the rule
 *            dropdown associated with the edit call.
 */
SailPoint.Rule.Editor.edit = function(rName, rType, rBtn) {
    Ext.MessageBox.wait('#{msgs.loading_data}');

    SailPoint.Rule.Editor.ruleName = rName;
    SailPoint.Rule.Editor.refreshBtn = rBtn;

    // loadRule() calls SailPoint.Rule.Editor.initWindow() on completion
    SailPoint.Rule.Editor.loadRule(rName, rType);
};

// SailPoint.Rule.Editor.sourceCombo;
/**
 * Used by the RuleComboBox - where are overloads when ya need 'em?
 */
SailPoint.Rule.Editor.editRule = function(ruleCombo) {
    Ext.MessageBox.wait('#{msgs.loading_data}');

    SailPoint.Rule.Editor.sourceCombo = ruleCombo;
    SailPoint.Rule.Editor.ruleName = ruleCombo.getValue();
    SailPoint.Rule.Editor.refreshStore = ruleCombo.getStore();

    // loadRule() calls SailPoint.Rule.Editor.initWindow() on completion
    SailPoint.Rule.Editor.loadRule(ruleCombo.getValue(), ruleCombo.getRuleType());
};

/**
 * Makes an Ajax call to load the given rule into a bean, which then gets stored
 * on the session. The subsequent action initializes the edit window with the
 * rule data.
 * 
 * @param rName
 *            Name or id of the requested rule
 * @param rType
 *            Type of the requested rule
 */
SailPoint.Rule.Editor.loadRule = function(rName, rType) {
    Ext.Ajax.request({
        url : SailPoint.getRelativeUrl('/include/rules/ruleEditorDataSource.json'),
        params : {
            'ruleName' : rName,
            'ruleType' : rType,
            'loadup' : true
        },
        success : function(response) {
            SailPoint.Rule.Editor.initWindow();
        },
        failure : function() {
            alert('Loading rule failed: ' + rName);
        },
        scope : this
    });
};

/**
 * Creates the edit window if it doesn't exist yet and makes an Ajax call to get
 * the rule data. The successful Ajax call in turn calls loadWindow().
 */
SailPoint.Rule.Editor.initWindow = function() {
    if (!SailPoint.Rule.Editor.EditWindow) {
        SailPoint.Rule.Editor.EditWindow = new SailPoint.Rule.Editor.Window({
            layout : 'border',
            width : 768,
            height : 600,
            modal : true,
            shim : true
        });
    }

    // stoopid ExtJS bug won't properly pick up the listeners config option...
    // TODO extjs4: is this still true?
    Ext.getCmp('existingRules').addListener('select', SailPoint.Rule.Editor.copyExistingRule);

    // this will call loadWindow() after the Ext.Ajax request completes
    SailPoint.Rule.Editor.getRule(SailPoint.Rule.Editor.ruleName, 'init');
};

/**
 * Makes an Ajax call to retrieve the data for the given rule. The subsequent
 * action is determined based on whether the call is part of the edit window
 * initialization process or a request to copy data from an existing rule to use
 * as a template for a new one.
 * 
 * @param rName
 *            Name or id of the requested rule
 * @param isInit
 *            True if this is part of the edit window initialization; false if
 *            this is a request to copy an existing rule
 */
SailPoint.Rule.Editor.getRule = function(rName, task) {
    Ext.Ajax.request({
        url : SailPoint.getRelativeUrl('/include/rules/ruleEditorDataSource.json'),
        params : {
            'ruleName' : rName,
            'init' : ((task == 'init') ? true : false)
        },
        success : function(response) {
            results = Ext.JSON.decode(response.responseText);
            switch (task) {
            case ('init'):
                SailPoint.Rule.Editor.loadWindow(results);
                break;
            case ('copy'):
                SailPoint.Rule.Editor.copyFromRule(results);
                break;
            case ('saveas'):
                SailPoint.Rule.Editor.updateRuleId(results);
                break;
            }
        },
        failure : function() {
            alert('Getting rule data failed: ' + rName);
        },
        scope : this
    });
};

/**
 * Loads the edit window with the rule data and configures it appropriately
 * based on whether or not the rule is being created or edited.
 * 
 * @param rule
 *            A JSON object containing the rule data
 */
SailPoint.Rule.Editor.loadWindow = function(rule) {
    // make sure we have valid rule data, otherwise bail. If there's no rule
    // type, we know something went terribly wrong
    if (rule.type == '') {
        SailPoint.Rule.Editor.abort('#{msgs.rule_editor_error_no_type}');
        return;
    }

    // reset the editor's rule name in case getRule was called with an id
    SailPoint.Rule.Editor.ruleName = rule.name;

    // preload the argument grids and create combobox
    Ext.getCmp('argsGrid').store.load({
        params : {
            'ruleName' : SailPoint.Rule.Editor.ruleName
        }
    });
    Ext.getCmp('rtnsGrid').store.load({
        params : {
            'ruleName' : SailPoint.Rule.Editor.ruleName
        }
    });

    // preload the combo box for existing rules
    if (Ext.getCmp('existingRules').rendered){
        Ext.getCmp('existingRules').clearValue();
    }
    Ext.getCmp('existingRules').store.getProxy().extraParams['type'] = rule.type;
    Ext.getCmp('existingRules').store.load();

    // load the form field values
    Ext.getCmp('ruleName').setValue(SailPoint.Rule.Editor.ruleName);
    Ext.getCmp('ruleId').setValue(rule.id);
    Ext.getCmp('source').setValue(rule.source);
    Ext.getCmp('description').setValue(rule.description);

    // hide any previous error msgs
    Ext.getCmp('ruleErrorMsg').hide();

    // hide the message box BEFORE showing the edit window, otherwise the
    // message box will remove shim info that lets pulldowns bleed through on
    // IE6
    Ext.MessageBox.hide();

    // now the window looks good enough to show
    SailPoint.Rule.Editor.EditWindow.show();

    // deal with an idiot IE8 bug where using layout:fit on the panel makes
    // the panel height shrink by 4px every time the editor window opens
    Ext.getCmp('ruleNamePanel').doLayout();
    Ext.getCmp('ruleName').setWidth(Ext.getCmp('ruleNamePanel').getWidth());

    // set the window values - these can't be changed until the window is
    // rendered, otherwise there's no body element yet to update
    Ext.getCmp('ruleType').body.update(SailPoint.Rule.Editor.notEmpty(rule.type));
    Ext.getCmp('rtnType').body.update(SailPoint.Rule.Editor.notEmpty(rule.returnType));
    Ext.getCmp('ruleMeta').doLayout();

    // toggle some features based on whether this is a create or edit
    var isCreate = ((SailPoint.Rule.Editor.ruleName == '') || (SailPoint.Rule.Editor.ruleName == undefined));
    SailPoint.Rule.Editor.toggleCreateOptions(isCreate);
};

/**
 * Determines whether the user is editing an existing rule or creating a new
 * one. If creating, display the "Copy from existing" toolbar, enable the rule
 * name field and hide the "Save as" button. If editing, hide the toolbar,
 * disable the rule name field and show the "Save as" button.
 */
SailPoint.Rule.Editor.toggleCreateOptions = function(isCreate) {
    var sourceCodePanel = Ext.getCmp('sourceCodePanel');
    var height = sourceCodePanel.getSize().height;
    
    Ext.getCmp('sourceCodeToolbar').setVisible(isCreate);
    
    // TODO: extjs4 - this calculation isn't correct anymore
    //var newHeight = height - (sourceCodePanel.frameSize.top + sourceCodePanel.frameSize.bottom);
    //sourceCodePanel.body.setHeight(newHeight);
    sourceCodePanel.doLayout();

    if (isCreate) {
        Ext.getCmp('ruleName').enable();
        Ext.getCmp('ruleSaveAs').hide();
    }
    else {
        Ext.getCmp('ruleName').disable();
        Ext.getCmp('ruleSaveAs').show();
    }
};

/**
 * Populates the source and description fields of the edit window with the data
 * from the given rule.
 * 
 * @param rule
 *            The rule being used as a template for a new rule
 */
SailPoint.Rule.Editor.copyFromRule = function(rule) {
    Ext.getCmp('source').setValue(rule.source);
    Ext.getCmp('description').setValue(rule.description);
};

/**
 * Called when a rule is selected from a combobox on the edit window. The user
 * has requested to copy an existing rule for the purpose of using it as a
 * template for a new rule. This calls getRule(), which makes an Ajax call to
 * load up the rule data.
 * 
 * @param comboBox
 *            The ComboBox that was acted upon
 * @param record
 *            The data record for the item selected from the combobox
 * @param index
 *            The index of the item selected
 */
SailPoint.Rule.Editor.copyExistingRule = function(comboBox, record, index) {
    SailPoint.Rule.Editor.getRule(record[0].data['name'], 'copy');
};

/**
 * Called when the user performs a "Save As" on an existing rule. The id of the
 * newly-created rule needs to be passed to the ruleId component. Otherwise, we
 * run into problems later trying to save a rule with a name that the db thinks
 * already exists.
 */
SailPoint.Rule.Editor.updateRuleId = function(rule) {
    Ext.getCmp('ruleId').setValue(rule.id);
};

/**
 * Called when the user clicks on an argument/return for the rule. The data for
 * the arg/rtn selected is passed to the display panel.
 * 
 * @param grid
 *            The grid containing the selected item
 * @param rowIndex
 *            The index of the row containing the selected item
 * @param columnIndex
 *            The index of the column containing the selected item
 * @param e
 *            The event that fired in response to the selection
 */
SailPoint.Rule.Editor.clickRow = function(gridView, record, HTMLitem, index, e, eOpts){//(grid, rowIndex, columnIndex, e) {
    SailPoint.Rule.Editor.ArgViewPanel.close();
    SailPoint.Rule.Editor.ArgViewPanel.init(record.data['name'], record.data['type'], record.data['description']);
    SailPoint.Rule.Editor.ArgViewPanel.open();
};

/**
 * Utility function that ensures the proper display of empty data elements.
 */
SailPoint.Rule.Editor.notEmpty = function(str) {
    return (str == '') ? '&nbsp;' : str;
};

/**
 * Validate the rule name before saving the rule, using an Ajax call to check
 * for duplicate rule names.
 */
SailPoint.Rule.Editor.validateRuleName = function(rName, whichSave) {
    Ext.MessageBox.wait('#{msgs.processing_spinner}');

    Ext.Ajax.request({
        url : SailPoint.getRelativeUrl('/include/rules/ruleEditorDataSource.json'),
        params : {
            'validate' : true,
            'ruleName' : rName,
            'isSaveAs' : (whichSave == "saveAs")
        },
        success : function(response) {
            try {
                results = Ext.decode(response.responseText);
            }
            catch (e) {
                // got non-JSON data back - usually means the exception page
                alert('Server error while validating rule name: ' + rName);
                SailPoint.Rule.Editor.EditWindow.hide();
            }

            if (results.valid) {
                switch (whichSave) {
                case "save":
                    SailPoint.Rule.Editor.postValidateSaveRule(rName);
                    break;
                case "saveAs":
                    SailPoint.Rule.Editor.postValidateSaveRuleAs(rName);
                    break;
                default:
                    break;
                }
            }
            else {
                Ext.MessageBox.hide();

                // in case this is a save-as attempt
                Ext.getCmp('newName').setValue('');
                if (SailPoint.Rule.Editor.SaveAsWindow.isVisible()){
                    SailPoint.Rule.Editor.SaveAsWindow.hide();
                }

                Ext.getCmp('ruleErrorMsg').setText('#{msgs.rule_editor_error_duplicate_name}');
                Ext.getCmp('ruleErrorMsg').show();
                return;
            }
        },
        failure : function() {
            alert('Rule name validation failed: ' + rName);
        },
        scope : this
    });
};

/**
 * Saves the changes made to the rule after doing a couple of validations.
 * Called after validation for both "save" and "save as" functions. Hides the
 * given window (either the main edit window or the "save as" popup) and clicks
 * the given save button.
 */
SailPoint.Rule.Editor.saveRule = function(wndw, btn) {
    $('ruleEditorForm:ruleName').value = Ext.getCmp('ruleName').getValue();
    $('ruleEditorForm:ruleId').value = Ext.getCmp('ruleId').getValue();
    $('ruleEditorForm:ruleSource').value = Ext.getCmp('source').getValue();
    $('ruleEditorForm:ruleDescription').value = Ext.getCmp('description').getValue();

    wndw.hide();
    btn.click();
};

/**
 * Validates current rule before saving.
 */
SailPoint.Rule.Editor.validateSaveRule = function() {
    // close any argument details that may be open

    if (Ext.getCmp('ruleName').getValue() == '') {
        Ext.getCmp('ruleErrorMsg').setText('#{msgs.rule_editor_error_name_required}');
        Ext.getCmp('ruleErrorMsg').show();
        return;
    }

    if (Ext.getCmp('source').getValue() == '') {
        Ext.getCmp('ruleErrorMsg').setText('#{msgs.rule_editor_error_source_required}');
        Ext.getCmp('ruleErrorMsg').show();
        return;
    }

    // the actual save method will be called on successful validation
    SailPoint.Rule.Editor.validateRuleName(Ext.getCmp('ruleName').getValue(), "save");
};

/**
 * Saves the current rule after any post-validation tweaking.
 */
SailPoint.Rule.Editor.postValidateSaveRule = function(rName) {
    SailPoint.Rule.Editor.saveRule(SailPoint.Rule.Editor.EditWindow, $('ruleEditorForm:saveRule'));
};

/**
 * Saves the current rule with the name given by the user. This behaves like
 * "Save As..." on a Word doc, with the expectation that the user is not yet
 * finished editing. As such, the edit window is NOT closed.
 */
SailPoint.Rule.Editor.validateSaveRuleAs = function() {
    // if no new name is given, ignore
    if (Ext.getCmp('newName').getValue() == ''){
        return;
    }

    // the actual save method will be called on successful validation
    SailPoint.Rule.Editor.validateRuleName(Ext.getCmp('newName').getValue(), "saveAs");
};

/**
 * Saves the current rule after any post-validation tweaking.
 */
SailPoint.Rule.Editor.postValidateSaveRuleAs = function(rName) {
    // clear the new name value for the next use
    Ext.getCmp('newName').setValue('');

    // update the edit window with the new name
    Ext.getCmp('ruleName').setValue(rName);

    // set the "save-as" flag to trigger the proper refresh actions
    SailPoint.Rule.Editor.isSaveAs = true;

    SailPoint.Rule.Editor.saveRule(SailPoint.Rule.Editor.SaveAsWindow, $('ruleEditorForm:saveRuleAs'));
};

/**
 * Clicks the a4j button provided to the edit() function so that the new/renamed
 * rule will be visible in the appropriate rule dropdown.
 */
SailPoint.Rule.Editor.refresh = function() {
    if (SailPoint.Rule.Editor.refreshBtn){
        SailPoint.Rule.Editor.refreshBtn.click();
    }

    if (SailPoint.Rule.Editor.refreshStore){
        SailPoint.Rule.Editor.refreshStore.load();
    }

    if (SailPoint.Rule.Editor.isSaveAs) {
        SailPoint.Rule.Editor.isSaveAs = false;
        SailPoint.Rule.Editor.getRule(Ext.getCmp('ruleName').getValue(), 'saveas');
    }

    // Set the value on the rule combo box when saving the rule from the rule
    // editor
    var ruleNameField = $('ruleEditorForm:ruleName');
    var ruleIdField = $('ruleEditorForm:ruleId');
    if (SailPoint.Rule.Editor.sourceCombo && ruleNameField && ruleIdField) {
        var ruleName = ruleNameField.value;
        var ruleId = ruleIdField.value;
        SailPoint.Rule.Editor.sourceCombo.setValue(ruleId);
        SailPoint.Rule.Editor.sourceCombo.setRawValue(ruleName);
    }

    Ext.MessageBox.hide();
};

/**
 * An extension of the Ext.ComboBox that includes the button for launching the
 * rule editor.
 */
//Ext.define('SailPoint.Rule.Editor.RuleComboBox', {
//    extend : 'Ext.form.field.ComboBox',
//    ruleType : undefined,
//    formName : undefined,
//    ruleEditorButton : undefined,
//
//    initComponent : function() {
//        this.callParent(arguments);
//
//        // if no rule type is given, try to mine it from the store
//        if ((!this.ruleType) && (this.store)) {
//            this.ruleType = this.store.getProxy().extraParams['type'];
//        }
//
//        // handle a display problem
//        this.on('show', this.ensureShow);
//    },
//
//    /**
//     * Jump through a lot of CSS hoops to display the rule editor launch button
//     * next to the pulldown
//     */
//    render : function(ct, position) {
//        this.callParent(arguments);
//
//        this.button = this.wrap.createChild({
//            tag : "img",
//            src : Ext.BLANK_IMAGE_URL,
//            cls : "rule-editor-button"
//        });
//        this.button.on("click", this.click, this);
//        this.button.addClassOnOver('rule-editor-button-over');
//        this.button.addClassOnClick('rule-editor-button-click');
//    },
//
//    /**
//     * There's a weird display issue in FF that ends up hiding the rule editor
//     * launch button if the wrap isn't recalculated after the initial render.
//     */
//    ensureShow : function() {
//        if (this.wrap) {
//            this.wrap.setWidth(this.el.getWidth() + this.trigger.getWidth() + this.button.getWidth() + 10);
//        }
//    },
//
//    onDestroy : function() {
//        if (this.button) {
//            this.button.removeAllListeners();
//            this.button.remove();
//        }
//
//        this.callParent(arguments);
//        if (this.ruleEditorButton) {
//            this.ruleEditorButton.el.setStyle('top', '0px');
//        }
//    },
//
//    getRuleType : function() {
//        return this.ruleType;
//    },
//
//    click : function() {
//        SailPoint.Rule.Editor.editRule(this);
//    }
//});

SailPoint.Rule.Editor.abort = function(errMsg) {
    // close/hide anything that might currently be open
    if (Ext.MessageBox.isVisible()){
        Ext.MessageBox.hide();
    }

    if (SailPoint.Rule.Editor.EditWindow.isVisible()){
        SailPoint.Rule.Editor.EditWindow.hide();
    }

    var tpl = new Ext.Template('#{msgs.err_exception}');
    var msgText = tpl.apply([ errMsg ]);
    Ext.MessageBox.show({
        title : '#{msgs.err_dialog_title}',
        msg : msgText,
        buttons : Ext.Msg.OK,
        icon : Ext.MessageBox.ERROR
    });
};
