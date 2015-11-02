/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * An extended EXT form that is bound to a backing FormBean instance. When
 * rendered, the FormPanel instance expects a number of hidden fields and
 * divs to be present (See formRenderer.xhtml for the layout)
 *
 * This object expects the following DOM objects to exist.
 * div[id=form-ct-#{form.id}] : The container div which wraps the form fields and form div
 * div[id=form-div-#{form.id}] : Th div the form is rendered to.
 * input[class=form-data] : Hidden input where the form data json is serialized to on submit
 * input[class=form-errors] : Hidden input where form error msgs are stored
 * input[class=form-validation] : Hidden input where form validation msgs are stored
 * input[class=form-action] : Hidden input where the button action is written to
 * input[class=form-actionParameter] : Hidden input where the button actionParameter is written to
 *
 * Note that we're extending Ext.Panel rather tha Ext.form.FormPanel because
 * Ext.form.FormPanel will generate an html form. This causes problems if
 * we are attempting to render inside of an existing jsf form.
 */
Ext.define('SailPoint.form.FormPanel', {
    extend : 'Ext.form.Panel',
    alias : 'spformpanel',

    fields : null,

    currentField : null,
    
    submitBtn: null,
    
    /**
     * Default this to editForm. Some pages are already using editForm for a seperate form so provide
     * the ability to override the default form
     */
    containerFormName: 'editForm',
    
    /**
     *  Either 'body' or 'window' to mask on the body element or active window rather than the containerFormName element
     */
    maskerEnum: null,
    
    /**
     * Boolean that indicates whether this form has already been submitted.
     * This is used to prevent double-submissions.
     */
    submitted: false,
    
    /**
     * use the number of forms per page to initialize the number of persisted forms (used in refresh).
     */
    formsPerPage: null,

    // Keep track of which direction the user is tabbing.
    tabBack: null,

    /**
     * @cfg showPreviousValue {boolean} True if the previousValue for a given field should be displayed
     * on the FormPanel.
     */
    showPreviousValue : false,
    
    constructor: function(config) {

        this.id = config.id;
        var i, button;
        
        //If containerForm is specified in config, use that. Otherwise, default to editForm
        if(config.containerFormName) {
            this.containerFormName = config.containerFormName;
        }
        
        this.formsPerPage = (config.formsPerPage) ? config.formsPerPage : 1;

        // Check for buttons and generate handlers
        if (config.buttons && config.buttons.length) {
            for(i = 0; i < config.buttons.length; i++) {
                button = config.buttons[i];
                button.scope = this;
                button.handler = this.buttonClicked;

                if(button.action) {
                    if (button.action === "next") {
                        this.submitBtn = button;
                    }
                    else if(button.action === "cancel") {
                        button.cls = "secondaryBtn";
                    }
                }
            }

            if (!config.buttonAlign) {
                config.buttonAlign = "center";
            }
        }

        if (config.wizard === true) {

            config.layout = 'card';

            var navigate = function(panel, direction){
                var layout = panel.getLayout();
                layout[direction]();
                Ext.getCmp('move-prev').setDisabled(!layout.getPrev());
                Ext.getCmp('move-next').setDisabled(!layout.getNext());
            };

            var buttons = [];
            buttons.push({
                id: 'move-prev',
                cls : 'secondaryBtn',
                text: "#{msgs.form_panel_wizard_button_prev}",
                handler: function(btn) {
                    navigate(btn.up("panel"), "prev");
                },
                disabled: true
            });
            buttons.push({
                id: 'move-next',
                cls : 'secondaryBtn',
                text: "#{msgs.form_panel_wizard_button_next}",
                handler: function(btn) {
                    navigate(btn.up("panel"), "next");
                }
            });

            buttons.push({xtype:'tbseparator'});

            if (config.buttons){
                config.buttons.each(function(button){
                    if(button.action && button.action === "cancel") {
                        button.cls = "secondaryBtn";
                    }
                    buttons.push(button);
                });
            }

            config.buttons = buttons;
            config.buttonAlign = "right";
        }

        if (config.items && config.items.length){
            for(i = 0; i < config.items.length; i++) {
                this.prepareItemConfig(config.items[i]);
            }
        }

        if (config.subtitle && config.subtitle !== ''){
            config.items.unshift({
                xtype:'container', border:false, html:config.subtitle, cls:'form-subtitle'
            });
        }

        // Add a legend explaining the required field icon. Don't add this
        // if we're in wizard mode since it will end up being the last panel.
        if (!config.wizard && !config.hideRequiredItemsLegend) {
            config.items.push({xtype:'container', border:false, html:'&nbsp;&nbsp;<span class="requiredText">*</span>#{msgs.form_panel_legend_required_field}'});
        }

        this.callParent(arguments);
    },

    initComponent : function(){

        var f, field;
        this.callParent(arguments);

        this.addEvents("renderComplete");

        this.on('renderComplete', function(){
           this.renderValidationMessages();
        }, this);

        this.fields = [];

        this.initFormItems(this.items);

        if (this.wizard === true){

            var valMsgs = this.getValidationMessages();
            var count = 0;
            if (valMsgs){
                for(f in valMsgs){
                    if (valMsgs.hasOwnProperty(f)) {
                        count++;
                    }
                }
            }
            if (count > 0){
                var html = "<h2>#{msgs.form_panel_validation_header}</h2><ul>";
                for(field in valMsgs){
                    if (valMsgs.hasOwnProperty(field)) {
                        var msg = valMsgs[field];
                        html += "<li class='formError'>"+msg+"</li>";
                    }
                }
                html+="</ul>";
                this.items.get(0).items.insert(0, new Ext.Panel({
                            bodyCssClass:'spFormErrorPanel', border:false,
                            html:html
                        }
                ));
            }
        }

        this.items.each(this.processEventListeners, this);
    },

    afterRender : function(){
        this.callParent(arguments);

        var field, idx;

        if(this.currentField) {
            field = this.form.findField(this.currentField);
        }

        if (field){
            //If this is a wizard we need to set the active item and set the nav buttons
            if (this.wizard){
                idx = this.findCardIndex(field);
                if (idx > 0){
                    this.getLayout().setActiveItem(idx);
                }
                this.setNavigationButtons(idx);
            }
            var tdDir = Ext.DomQuery.select('input[class=form-tabDir]');
            if(tdDir && tdDir[0] && tdDir[0].value !== "") {
                //defect 20800: we need to clean out the tab direct or it is left dirty
                if(tdDir[0].value === "BACK"){
                    tdDir[0].value = "";
                    tdDir = true;
                } else {
                    tdDir[0].value = "";
                    tdDir = false;  
                }

                var t, inputs, fieldset = field.up('fieldset');
                inputs = Ext.DomQuery.select('input', Ext.get(fieldset));
                inputs = Ext.Array.filter(inputs, function(el, idx) { return Ext.fly(el).isVisible(); });
                for(t = 0; t < inputs.length; t++) {
                    if(inputs[t].tabIndex === field.tabIndex) {
                        var nextField = inputs[t + (tdDir ? -1 : 1)];
                        // 'nextField' is a dom object, 'field' is an Ext component.
                        var toFocus = nextField || field;
                        this.waitAndFocus(toFocus, 10);
                        break;
                    }
                }
            }
            else {
                // Focus and select the text.  Put a short delay in or else
                // IE10 does not show the field label.
                this.waitAndFocus(field, 10);
            }
        }

        this.fireEvent('renderComplete');
    },
    
    /**
     * Wait for the given amount of time, then focus and select the given field.
     * 'field' can either be a dom object or an ExtJs Component.
     */
    waitAndFocus: function(field, millis) {
        Ext.defer(function() {
            if(field.focus) {
                field.focus();
            }
            if (field.selectText) {
                field.selectText();
            }
            else if(field.select) {
                field.select();
            }
        }, millis);
    },
    
    findCardIndex : function(component){

        var idx = -1;

        if (!component) {
            return idx;
        }

        var fieldset = component.up('fieldset');
        if (fieldset){
            idx = this.items.indexOf(fieldset);

            // if we still haven't found the top-level
            // fieldset, try going up once more in case
            // the form contains multiple levels of fieldsets
            if (idx === -1){
                fieldset = fieldset.up('fieldset');
                idx = this.items.indexOf(fieldset);
            }
        }

        return idx;
    },

    //---------------------------------------------------------------
    //
    // Form Initalization
    //
    //---------------------------------------------------------------

    /**
     * Some properties may cause problems for ext if they are left null,
     * width and height for example. This method removes these properties
     * from cofiguration object items.
     * @param item
     */
    prepareItemConfig : function(item){

        var i;

        // Can't have quotes in itemId names, so swap out with an underscore.
        if(item.itemId && item.itemId.indexOf("\"") > -1) {
            item.itemId = item.itemId.replace(/\"/g, "_");
        }

        if (item.height === null){
            delete item.height;
        }

        if (item.width === null){
            delete item.width;
        }
        
        item.parentFormId = this.id;

        if (item.xtype === 'itemselector'){

            var modelId = item.itemId + '-store-model';
            Ext.define(modelId, {
                extend : 'Ext.data.Model',
                fields : ['value','text']
            });

            var vals = [];
            if (item.allowedValues) {
                item.allowedValues.each(function(item){
                    vals.push({value: item[0], text:item[1]});
                });
            }

            var ds = SailPoint.Store.createStore({
                storeId: item.itemId + '-store',
                autoLoad: true,
                idIndex: 0,
                model: modelId,
                data : vals
            });

            item.imagePath = SailPoint.getRelativeUrl("/images/extjs-ux/");
            item.displayField = 'text';
            item.valueField = 'value';
            item.store = ds;
        } 
        else if (item.xtype === 'multiselect'){
            item.selectionsGridHeight = 105;
            item.editable = true;
            if (item.emptyStore === 'true') {
                item.emptyStore=true;
            }
        } else if (item.xtype === 'checkboxgroup' && item.allowedValues.length){

            // Construct the list of checkboxes to included based on the
            // allowed values. Internally, the checkboxgroup also uses
            // a value model that looks like a MAp where the key is the
            // checkbox name, so we'll convert the value here as well.
            var itemsArr = [];
            var valueMap = {};
            for(i = 0; i < item.allowedValues.length; i++){
                var allowedValue = item.allowedValues[i];
                var isChecked = item.value && Ext.Array.contains(item.value, allowedValue[0]);
                var boxName = item.itemId + "-cb-" + i;
                itemsArr.push({name:boxName,boxLabel:allowedValue[1], inputValue:allowedValue[0], checked:isChecked});
                // if the value is selected add an entry to the new
                // value object we will use to overwrite the values array coming from the server.
                if (isChecked) {
                    valueMap[boxName] =allowedValue[0];
                }
            }
            item.items = itemsArr;
            item.value = valueMap;
            // modify the layout so it doesnt flex the options
            item.height=45;
            item.layout = {type:'checkboxgroup',autoFlex : false};
        }

        if (item.suggestClass){
            var conf = SailPoint.form.SuggestTemplates.getConfiguration(item.suggestClass);
            if (conf){
               item.comboTemplate = conf.comboTemplate;
               item.extraFields = conf.extraFields;
            }
        }

        if (item.items && item.items.length){
            for(i = 0; i < item.items.length; i++){
                var childItem = item.items[i];
                this.prepareItemConfig(childItem);
            }
        }
    },

    processEventListeners : function(currentItem){

        this.handleEventListeners(currentItem);

        if (currentItem && currentItem.items){
            currentItem.items.each(this.processEventListeners, this);
        }
    },

    handleEventListeners : function(item){
        if (item){
            
            if (item.valueChangeEvent === 'true' ){
                item.on('dirtychange', function(field, newVal, oldVal, eOpts){
                    Page.fireEvent('fieldChange', field, newVal, oldVal);
                });
            }

            if (item.postBack === true){

                var hasSelectEvent = item.events && item.events.select;

                // note we include dates here. Dates actually have to handle both
                // date selection from the calendar, and typing in of
                // the data value which uses onBlur.
                var isText = item.xtype === 'textfield' || item.xtype === 'numberfield' ||
                        item.xtype === 'textarea' || item.xtype === 'date' || item.xtype === 'spdate' || item.xtype === 'secret';

                // Components which have a 'select' event are easiest to handle -
                // On select we can fire the refresh event. Note that date
                // components have both a select event and text change event.
                if (hasSelectEvent){
                    item.on('select', function(field, newVal, oldVal, eOpts) {
                        Page.fireEvent('refresh', field);
                    });
                }

                // Text fields are more complicated. To detect a value
                // change we have to store the value when the user starts
                // typing (focus event), then when the finish typing
                // (onBlur) we have to compare the old and new value
                // and fire if the value changed
                if (isText === true){

                    item.on('focus', function(field, focusEvent, eOpts){
                         field.valueBeforeFocus = field.getValue();
                    });

                    // use blur so we detect when the user is finished typing
                    item.on('blur', function(field, blurEvent, eOpts){
                        if (field.getValue() !== field.valueBeforeFocus){
                            Page.fireEvent('refresh', field);
                        }
                    });
                }

                // All other widgets, checkboxes, radios, etc can be handled
                // by the change event
                if (isText === false && !hasSelectEvent){
                    item.on('change', function(field, newVal, oldVal, eOpts){
                        Page.fireEvent('refresh', field);
                    });
                }
                
                
                //Fire a refresh event if an item is removed from a SailPoint multiselect
                if(item.xtype === 'multiselect') {
                    item.on('remove', function(field) {
                        Page.fireEvent('refresh', field);
                    });
                }
            }
            
            // Monitor 'enter' on textfields and password fields
            // checkboxes and radio elements don't have a keypress event so
            // we can't detect if they were tabbed from.
            if (item.xtype === 'textfield' || item.xtype === 'secret') {
                item.enableKeyEvents = true;
                item.on('keypress', this.keyPressHandler, this);
                item.on('keydown', this.tabKeyListener, this);
            }
            else if(item.xtype === 'spdynamiccombo' || item.xtype === 'spcombo') {
                item.enableKeyEvents = true;
                item.on('keydown', this.tabKeyListener, this);
                if(item.extraRecords) {
                    //If the combo has an extraRecords attribute, we will add these to the store
                    var s = item.getStore();
                        s.on('load', function() {
                           this.insert(0,item.extraRecords); 
                        });
                }
            }
        }
    },
    
    keyPressHandler : function(element, e, options) {
        if (Ext.EventObject.RETURN === e.getKey()) {
            // Stop the event from bubbling lest the browser get a little
            // frisky and try to submit AGAIN!
            e.stopEvent();

            var submitButton = this.submitBtn;
            if (!submitButton) {
                submitButton = this.getSubmitButton();
            }

            this.buttonClicked(submitButton);
            
            //added for ie6 to avoid twin enter key issue
            return false;
        }
    },

    tabKeyListener : function(element, e, eOpt) {
        if(e.getKey() === e.TAB) {
            this.tabBack = e.shiftKey; // remember which direction
        }
        else if(e.getKey() === e.RETURN) {
            // Stop the event from bubbling 'cause we don't want to submit
            // enter key presses from combo boxes.
            e.stopEvent();
        }
    },

    /**
     * @private Handle any sailpoint custom field attributes included in the config.
     */
    initFormItems : function(items){
        var i;
        if (items && items.length){

            for(i=0;i<items.length;i++){

                var item = items.get(i);

                if (this.isField(item)){

                    // jfb - spdynamicmultisuggest doesnt do normal
                    // form field initialization, not sure why.
                    if ('spdynamicmultisuggest' !== item.xtype){
                        this.initFormField(item);
                    } else {
                        this.fields.push(item.itemId);
                    }

                } else if (this.isContainer(item)){
                    item.style="background-color:#FFFFFF";
                    item.autoScroll=true;
                    if (!item.columns) {
                        item.columns = 1;
                    }
                    item.items = this.initContainerItems(item, item.columns);
                    if(i === 0) { // special case for the first item, usually the summary.
                        item.style = "background-color:#FFFFFF; margin-bottom:10px;";
                    }
                }
            }
        }
    },

    initContainerItems : function(item, columns){
        var itemCollection = new Ext.util.MixedCollection();
        if (item.items && item.items.getCount() > 0){

            var rowContainer = null;
            var labelWidth = 100;
            var maxLabelWidth = 220;

            item.items.each(function(child){
                var f;

                if (this.isContainerFull(rowContainer, columns)){
                    
                    rowContainer = new Ext.Panel({
                        border : false,
                        defaults : {
                            border: false,
                            layout: 'anchor'
                        },
                        margin : '10px',
                        layout : 'hbox',
                        items : []
                    });
                    itemCollection.add(rowContainer);
                }

                if (rowContainer) {
                    f = this.initFormField(child);
                    f.anchor = "100%";
                    
                    if (f.columnSpan) {
                        f.flex = f.columnSpan;
                        delete f.maxWidth;
                    } else {
                        f.flex = 1;
                    }
                                   
                    if (this.labelAlign) {
                        f.labelAlign = this.labelAlign;
                    }
                    f.margin = "0 10px 0 0";
                    rowContainer.items.add(f);
                    this.hideHiddenFieldsPanel(rowContainer);

                } else {
                    itemCollection.add(child);
                }
                
                if(f.fieldLabel) {
                    var l = f.fieldLabel.length * 8 + 15;
                    if(l > labelWidth) {
                        labelWidth = l;
                    }
                }

            }, this);
            
            if(labelWidth > maxLabelWidth) {
                labelWidth = maxLabelWidth;
            }
            
            item.items.each(function(child){
                if(child.fieldLabel) {
                    child.labelWidth = labelWidth;
                }
            }, this);
            
            if (rowContainer){
                var containerCols = 0;
                
                rowContainer.items.each(function(item){
                    if (item.flex) {
                        containerCols += item.flex;
                    }
                });
                
                if (containerCols < columns){
                    var f = new Ext.container.Container({flex:(columns-containerCols)});
                    rowContainer.items.add(f);
                }
            }
            
        }

        if (item.subtitle){

          var subtitleContainer = new Ext.Panel({
                border:false,
                margin:'10px 0 0 0',
                html: "<span class='form-section-subtitle'>" + item.subtitle + "</span>"
            });
           itemCollection.insert(0, subtitleContainer);

        }

        return itemCollection;
    },

    initFormField : function(item){

        this.fields.push(item.itemId);

        // We can't render tooltips until the form item
        // is rendered, so schedule the tooltip creation for later
        item.on('afterRender', this.initTooltip);

        item.msgTarget = 'under';
        item.labelSeparator = '';

        if (item.required && item.required === true){
            item.afterLabelTextTpl = '<span class="requiredText">*</span>';
        }

        // initialize identity suggest
        if ('identitySuggest' === item.type) {
            item.on('afterRender', function(){
                this.setValue(this.value);
            }, item);
        }

        if (this.showPreviousValue && item.previousValue){
            item.on('afterRender', function(){
                var blankImgUrl = SailPoint.getRelativeUrl('/images/blank.gif');
                var html = '<tr><td>&nbsp;</td><td><span class="prevValueLabel">#{msgs.form_panel_label_prev_value}</span>&nbsp;<span class="prevValue">'+this.previousValue+'</span></td></tr>';
                if (this.wrap) {
                    this.wrap.insertHtml('beforeEnd', html);
                }
                else {
                    this.getEl().first().insertHtml('beforeEnd', html);
                }
            }, item);
        }

        if (this.readOnly === true && item.xtype && item.xtype !== 'htmltemplate'){
            item.disabled = true;
        }
        
        if(item.xtype && item.xtype === 'htmltemplate') {
            item.noWrap = false; // allow text to wrap
        }
        
        return item;
    },

    /**
     * Initialize the tooltips on the form labels. The tooltip is built using the
     * 'helpText' which is part of the SailPoint model rather than an Ext property.
     * @param field
     */
    initTooltip : function(field){
        SailPoint.form.Util.renderHelpText(field);
    },
    
    isContainerFull : function(container, columns){
        if (!container){
            return true;
        }

        var columnsOccupied = 0;
        container.items.each(function(item){
            columnsOccupied += item.flex ? item.flex : 1; // Assume item occupies at least 1 column
        });

        return columnsOccupied === columns;
    },
    
    /**
     * If all items in the container are hidden, hide the container as well.  This gets around a
     * weird Ext behavior where the panel height is set to 20 pixels, though the items in it are not 
     * displayed.
     * @param container
     */
    hideHiddenFieldsPanel : function(container) {
        var onlyHiddenFields = true;
        
        if (container && container.items) {
            container.items.each(function(item) {
                onlyHiddenFields = onlyHiddenFields && item.isHidden();
            });
            
            if (onlyHiddenFields === true) {
                container.hide();
            }
            else {
                container.show();
            }
        }
        
    },

    isContainer : function (item){
        return ('panel' === item.xtype || 'fieldset' === item.xtype) && item.items && item.items.getCount() > 0;
    },

    isField : function (item){
        return item && (item.isFormField || 'spdynamicmultisuggest' === item.xtype);
    },


    //---------------------------------------------------------------
    //
    // Public Methods
    //
    //---------------------------------------------------------------


    /**
     * Get the EXT component for the given field.
     * @param name
     */
    getField : function(name){

        var fullFieldId = 'field-' + this.id + '-' +  name;
        
        if (this.fields.indexOf(fullFieldId) > -1) {
            return this.getFieldByItemId(fullFieldId);
        } else {
            // Check for identity form fields
            fullFieldId = this.id + '-form-' + name + '-field';
            if (this.fields.indexOf(fullFieldId) > -1) {
                return this.getFieldByItemId(fullFieldId);
            } else {
                fullFieldId = this.initialConfig.name + '-form-' + name + '-field';
                if (this.fields.indexOf(fullFieldId) > -1) {
                    return this.getFieldByItemId(fullFieldId);
                }
            }
        }

        return null;
    },
    
    /**
     * Get the EXT component for the given field. Note we must use Ext.container.query() in this
     * method because using Ext.container.down(#itemId) will interpret a space as a new token in the
     * query and will not work.
     * @param name
     */
    getFieldByItemId : function(itemId){

        var field = null,
            queryResult = this.query('[itemId=' + itemId + ']');
        
        if (!Ext.isEmpty(queryResult)) {
            field = queryResult[0];
        }
        
        // nulling queryResult just in case a memory manager wants to hang on to it
        queryResult = null;
        
        return field;
    },

    /**
     * Write form inputs to a hidden field as json. This data will then
     * be passed to the backing FormBean.
     */
    persist : function(){
        var i, fieldValues = {};

        for(i=0;i<this.fields.length;i++){
            var field = this.getFieldByItemId(this.fields[i]);
            
            // the field comp id is namespaced with the form id and some other text
            // unless it's an Identity suggest
            
            var fieldName;
            
            if (field.baseParams && field.baseParams.suggestId) {
                fieldName = field.baseParams.suggestId;
            } else {
                // why add lucky 7? "field-id-name" is the format. adding the length of "field" + two hyphens = 7
                fieldName = field.itemId.substring(this.id.length + 7);
            }

            if (field.getSPFormValue) {
                fieldValues[fieldName] = field.getSPFormValue();
            } else if (field.xtype === 'checkboxgroup') {
                var checkboxes = field.getChecked();
                var values = [];
                if (checkboxes && checkboxes.length > 0){
                    var c;
                    for(c=0;c<checkboxes.length;c++){
                        values.push(checkboxes[c].getSubmitValue());
                    }
                }
                fieldValues[fieldName] = values;
            }else if (field.getValue) { // some form display-only fields will not return a value
                fieldValues[fieldName] = field.getValue();
            }
            
           
        }
        var hiddenField = this.getHiddenField("data", this.getContainer());
        hiddenField.value = Ext.encode(fieldValues);
        return fieldValues;
    },

    /**
     * Load any validation error messages from the hidden field and mark the
     * given fields as invalid.
     */
    renderValidationMessages : function(){
        var valMsgs = this.getValidationMessages();
        if (valMsgs){
            var field;
            for(field in valMsgs){
                if (field){
                    this.markFieldInvalid(field, valMsgs[field] );
                }
            }
        }
    },

    getValidationMessages : function(){
        var vfield = this.getHiddenField("validation", this.getContainer());
        if (vfield.value !== ''){
            return Ext.decode(vfield.value);
        }

        return null;
    },
    
    hasValidationMessages : function() {
        var validationMessages = this.getValidationMessages();
        if (validationMessages){
            var field;
            for(field in validationMessages){
                if (field){
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * Retrieve any error messages from the hidden error field.
     */
    getErrorMessages : function(){
        var msgs = [];
        var vfield = this.getHiddenField("errors", this.getContainer());
        if (vfield.value !== ''){
            msgs = Ext.decode(vfield.value);
        }
        return msgs;
    },
    
    hasErrorMessages : function(){
      var errorMsgs = this.getErrorMessages();
      if(errorMsgs && errorMsgs.length > 0)
          return true;
      else
          return false;
    },

    /**
     * Set a given field on the form invalid and displays an error message.
     * @param field Field name to set invalid
     * @param msg  Error text
     */
    markFieldInvalid:function(field, msg){

        // check for global validation messages
        if (field.slice(0, 8) === "__global"){
            return;
        }

        var fieldObj = this.getField(field);

        if (!fieldObj) {
            SailPoint.EXCEPTION_ALERT("Could not locate form field '"+field+"'.");
        }
        else {
            fieldObj.markInvalid(msg);
            //hack to make error message show up on checkbox fields because they have an absolute height set
            if(typeof fieldObj.layout !== 'undefined' && fieldObj.layout.type === 'checkboxgroup'){
                fieldObj.height += 20;
            }
        }
    },

    navigate : function(index){
        this.setNavigationButtons(index);

        if (Page)
            Page.fireEvent('formNavigate');
    },
    
    setNavigationButtons : function(index){
        if(Ext.isDefined(index)){
            this.getLayout().setActiveItem(index);
            var layout = this.getLayout();
            Ext.getCmp('move-prev').setDisabled(!layout.getPrev());
            Ext.getCmp('move-next').setDisabled(!layout.getNext());
        }
    },
    
    //---------------------------------------------------------------
    //
    // Private Methods
    //
    //---------------------------------------------------------------

    /**
     * Get the div this component is rendered into.
     */
    getContainer : function(){
        var c = Ext.get(this.containerFormName+':form-ct-' + this.id);

        if (!c) {
            SailPoint.EXCEPTION_ALERT("Could not locate form container.");
        }

        return c;
    },
    
    /**
     * Returns one of the hidden jsf-backed form fields used to pass data
     * back to the server.
     *
     * @param field The name of the field
     * @param container The container div Element this form is rendered to.
     */
    getHiddenField : function(field, container){
        var inputs = Ext.query("input[class=form-"+field+"]", container.dom);
        if (!inputs || inputs.length === 0) {
            SailPoint.EXCEPTION_ALERT("Could not locate form inputs.");
        }
        else {
            return inputs[0];
        }

        return false;
    },

    getSubmitButton : function(){
        var container = this.getContainer();
        var submitInputSearch = Ext.query("button[class=form-submit]", container.dom);

        if (submitInputSearch.length === 0) {
            SailPoint.EXCEPTION_ALERT("Could not locate form submit button.");
            return null;
        }
        else {
            return submitInputSearch[0];
        }
    },

    /**
     * Handle button click. This will persist form data back to the
     * hidden inputs that are backed by our FormBean.
     * @param button
     * @param eventObj
     */
    buttonClicked : function(button, eventObj) {

        this.submit(button.action, button.actionParameter, button.actionParameterValue, button.skipValidation);
    },
    
    
    maskOnRefresh : function(action) {
        var masker = null;
        
        if(action === "refresh") {
            
            var masker = SailPoint.form.Util.getMasker({containerFormName: this.containerFormName, maskerEnum: this.maskerEnum});
            if (masker) {
                masker.mask(Ext.LoadMask.prototype.msg,'x-mask-loading');
            }
        }
        
    },
    
    /**
     * Submit the form using the given "action" and "actionParameter". This will
     * persist form data back to the hidden inputs that are backed by our
     * FormBean.
     * 
     * @param  action           The "action" for this submission (eg - "refresh").
     * @param  actionParameter  Additional information about the action.
     */
    submit: function(action, actionParameter, actionParameterValue, skipValidation) {

        // Prevent-double submission.
        if (this.submitted) {
            alert('#{msgs.form_panel_already_submitted}');
            return;
        }

        if(!Ext.isDefined(skipValidation) || (Ext.isBoolean(skipValidation) && !skipValidation)) {
            // Make sure client-side validation is successful before we submit.
            // Ignore cancel and refresh actions.  Everything else gets validated.
            var doValidation = (action !== 'refresh') && (action !== 'cancel');
            if (doValidation && !this.getForm().isValid()) {
                return;
            }
        }

        this.submitted = true;

        var container = this.getContainer();
        var formPanel = this;

        this.getHiddenField('action', container).value = action;
        this.getHiddenField('actionParameter', container).value = actionParameter;
        this.getHiddenField('actionParameterValue', container).value = actionParameterValue;
        this.getHiddenField('currentField', container).value = '';

        if(action !== 'cancel') {
            this.persist();
        }
        
        if(action === "next" && this.sigMeaning) {
            SailPoint.ESigPopup.show(this.nAuthId, this.oAuthId, this.sigMeaning, this.eSigCallback, function(){ formPanel.submitted = false; }, this, this.eSigObjType, this.eSigObjId);
        }
        else {
            this.maskOnRefresh(action);
            this.getSubmitButton().click();
        }
        
    },

    refresh: function(changedField){

        var container = this.getContainer();

        this.getHiddenField('action', container).value = 'refresh';

        if(this.tabBack != null) {
            this.getHiddenField('tabDir', container).value = this.tabBack ? "BACK" : "FORWARD";
        }

        var changedFieldName = "";
        if (changedField) {
            changedFieldName = changedField.getName();
        }

        this.getHiddenField('currentField', container).value = changedFieldName;

        this.persist();

        if (!SailPoint.persistedForms) {
            SailPoint.persistedForms = 1;
        }
        else {
            SailPoint.persistedForms++;
        }

        // compare the number of persisted forms with the total active
        // forms on the page. If it's less, skip submitting the form.
        // We need to wait until the last form serializes itself before
        // submitting the page
        if (SailPoint.persistedForms < SailPoint.activeForms.length) {
            return;
        }

        this.maskOnRefresh('refresh');
        this.getSubmitButton().click();
        SailPoint.persistedForms = 0;
        
    },
    
    eSigCallback : function(name, pass) {
        if(name !== this.nAuthId && name !== this.oAuthId) {
            Ext.fly(this.containerFormName+':signatureAuthId').dom.value = name;
        }
        Ext.fly(this.containerFormName+':signaturePass').dom.value = pass;
        this.getSubmitButton().click();
    }

});


