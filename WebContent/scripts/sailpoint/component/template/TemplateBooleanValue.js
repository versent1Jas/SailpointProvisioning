/**
* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved.
*
* THIS FILE IS AUTO-GENERATED FROM JAVA FILE: $iiqFolder/tools/j2js/java-code/src/sailpoint/template/TemplateBooleanValue.java
* PLEASE DON'T MODIFY THIS FILE HERE.
*/

Ext.namespace ("sailpoint.template");


Ext.define('sailpoint.template.ValueType', {

    statics : {
        None: 0
        , Rule: 1
        , Script: 2
    }
});


Ext.define('sailpoint.template.TemplateBooleanValue', {
    extend : 'Ext.form.FieldContainer'
    , constructor : function (config) {
        this.callParent(arguments);
        this.id = config["id"];
        this.name = config["name"];
        this.fieldLabel = config["fieldLabel"];
        this.fieldDefaults =  {
            "labelWidth" : 100
            , "labelPad" : 10
        };
    }

    , id : null
    , name : null
    , fieldLabel : null
    , border : 0
    , defaultType : "textfield"
    , radios : null
    , booleanValueCombo : null
    , ruleCombo : null
    , scriptTextArea : null
    , selectedValueType : null
    , layout : "anchor"
    , anchor : "100%"
    , defaults :  {
        "layout" : "anchor"
        , "anchor" : "100%"
    }
    , fieldDefaults : null
    , createRadio : function (labelName, inputValue, checked) {
        return  {
            "boxLabel" : labelName
            , "name" : this.getRadioName ()
            , "inputValue" : inputValue
            , "checked" : checked
        };
    }
    , initComponent : function () {
        this.radios =  Ext.create('Ext.form.RadioGroup',  {
            "id" : this.id + "radios"
            , "parent" : this
            , "items" : [this.createRadio ("#{msgs.label_value}", SailPoint.template.TemplateEditorConstants.TYPE_NONE, true), this.createRadio ("#{msgs.label_rule}", SailPoint.template.TemplateEditorConstants.TYPE_RULE, false), this.createRadio ("#{msgs.selector_type_script}", SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT, false)]
            , "listeners" :  {
                "change" :  {
                    "fn" : this.selectionChanged.bind(this)
                    , "scope" : this
                }
            }
        });
        this.booleanValueCombo = this.createBooleanCombo ();
        var store = SailPoint.Store.createStore ( {
            "model" : "SailPoint.model.NameValue"
            , "autoLoad" : true
            , "url" : CONTEXT_PATH + "/include/rulesDataSource.json"
            , "extraParams" :  {
                "type" : "FieldValue"
                , "prompt" : true
            }
            , "root" : "objects"
        });
        this.ruleCombo =  Ext.create('SailPoint.Rule.Editor.RuleComboBox',  {
            "id" : this.id + "rule"
            , "store" : store
            , "displayField" : "name"
            , "valueField" : "value"
            , "triggerAction" : "all"
            , "width" : 200
            , "hidden" : true
            , "listConfig" :  {
                "width" : 350
            }
        });
        this.scriptTextArea =  Ext.create('Ext.form.TextArea',  {
            "id" : this.id + "script"
            , "name" : this.id + "script"
            , "hidden" : true
            , "grow" : true
            , "growMax" : 400
            , "growMin" : 250
            , "height" : 50
            , "listConfig" :  {
                "width" : 350
            }
        });
        this.items = [this.radios, this.booleanValueCombo, this.ruleCombo, this.scriptTextArea];
        sailpoint.template.TemplateBooleanValue.superclass.initComponent.call (this);
    }
    , getRadioName : function () {
        return this.id + "radio";
    }
    , selectionChanged : function () {
        this.selectedValueType = this.calculateSelectedValueType ();
        switch (this.selectedValueType) {
        case sailpoint.template.ValueType.None:
            this.booleanValueCombo.setVisible (true);
            this.scriptTextArea.setVisible (false);
            this.ruleCombo.setVisible (false);
            break;
        case sailpoint.template.ValueType.Rule:
            this.ruleCombo.setVisible (true);
            this.booleanValueCombo.setVisible (false);
            this.scriptTextArea.setVisible (false);
            break;
        case sailpoint.template.ValueType.Script:
            this.scriptTextArea.setVisible (true);
            this.booleanValueCombo.setVisible (false);
            this.ruleCombo.setVisible (false);
            break;
        default:
        }
    }
    , setValue : function (val) {
        var valueType = val["valueType"];
        if (valueType == SailPoint.template.TemplateEditorConstants.TYPE_NONE) {
            this.radios.items.get (0).setValue (true);
            this.booleanValueCombo.setValue (val["value"]);
        } else if (valueType == SailPoint.template.TemplateEditorConstants.TYPE_RULE) {
            this.radios.items.get (1).setValue (true);
            this.ruleCombo.setValue (val["ruleId"]);
        } else if (valueType == SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT) {
            this.radios.items.get (2).setValue (true);
            this.scriptTextArea.setValue (val["scriptSource"]);
        } else {
        }
        this.selectionChanged ();
    }
    , reset : function () {
        this.radios.items.get (0).setValue (true);
        this.booleanValueCombo.setValue ("false");
        this.ruleCombo.setValue (null);
        this.scriptTextArea.setValue (null);
        this.selectionChanged ();
    }
    , clearInvalid : function () {
    }
    , validate : function () {
        return true;
    }
    , getValue : function () {
        switch (this.selectedValueType) {
        case sailpoint.template.ValueType.None:
            return  {
                "valueType" : SailPoint.template.TemplateEditorConstants.TYPE_NONE
                , "value" : this.booleanValueCombo.getValue ()
            };
        case sailpoint.template.ValueType.Rule:
            return  {
                "valueType" : SailPoint.template.TemplateEditorConstants.TYPE_RULE
                , "ruleId" : this.ruleCombo.getValue ()
            };
        case sailpoint.template.ValueType.Script:
            return  {
                "valueType" : SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT
                , "scriptSource" : this.scriptTextArea.getValue ()
            };
        default:
            return null;
        }
    }
    , getSelectedValue : function () {
        return this.radios.getValue ()[this.getRadioName ()];
    }
    , calculateSelectedValueType : function () {
        var selectedValue = this.getSelectedValue ();
        if (selectedValue == SailPoint.template.TemplateEditorConstants.TYPE_NONE) {
            return sailpoint.template.ValueType.None;
        } else if (selectedValue == SailPoint.template.TemplateEditorConstants.TYPE_RULE) {
            return sailpoint.template.ValueType.Rule;
        } else if (selectedValue == SailPoint.template.TemplateEditorConstants.TYPE_SCRIPT) {
            return sailpoint.template.ValueType.Script;
        } else {
            return sailpoint.template.ValueType.None;
        }
    }
    , createBooleanCombo : function () {
        return  Ext.create('Ext.form.ComboBox',  {
            "queryMode" : "local"
            , "triggerAction" : "all"
            , "displayField" : "name"
            , "valueField" : "value"
            , "store" : SailPoint.Store.createStore ( {
                "model" : "SailPoint.model.NameValue"
                , "data" : [ {
                    "name" : "#{msgs.txt_true}"
                    , "value" : "true"
                },  {
                    "name" : "#{msgs.txt_false}"
                    , "value" : "false"
                }]
            })
        });
    }
});
