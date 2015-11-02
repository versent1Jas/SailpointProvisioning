/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * @class SailPoint.Suggest
 * @extends Ext.form.field.ComboBox
 * 
 * Suggest component that cleans up a few problems with the ExtJS.form.ComboBox
 * and adds a few SailPoint-specific wrinkles.
 * 
 * NOTE: This is most often used with the "renderTo" property, which renders the
 * suggest component to a div, paired with a "binding" property that references
 * a hidden form field that maps the value to a backing bean.
 * 
 */
Ext.define('SailPoint.Suggest', {
    extend : 'Ext.form.field.ComboBox',
    alias : 'widget.suggest',
    
    ////////////////////////////////////////////////////////////////////////////
    //
    // Configs and Properties
    //
    ////////////////////////////////////////////////////////////////////////////
    
    /**
     * Allow the user to submit an empty value, which by extension also allows
     * users to delete values.
     * 
     * NOTE: Because we use ExtJS on top of JSF, we had to disable the internal
     * validation that is usually associated with allowBlank.
     */
    allowBlank : true,

    /**
     * The id of the node, a DOM node or an existing Element that is mapped to a
     * property on a backing bean, typically a hidden form field. The bean's
     * property will be set to the value of the component.
     * 
     * NOTE: If you pass in only the node id, you must either use a tomahawk tag
     * with forceId set to "true" in an &lt;f:attribute&gt; tag or include the
     * formBinding in the component attributes.
     */
    binding : undefined,

    /**
     * The name of the form containing the field to be bound.
     */
    formBinding : undefined,

    /**
     * Forces the user to select an option from the list.
     */
    forceSelection : true,

    /**
     * Minimum number of chars before type ahead activates.
     */
    minChars : 1,

    /**
     * Message to display when the search finds zero results.
     */
    noResultsText : '#{msgs.no_results_found}',

    /**
     * Number of results to display per page
     */
    pageSize : 5,
    
    /**
     * Delay in milliseconds between the end of typing and when the query is
     * sent to the server for filtering.
     */
    queryDelay : 250,

    /**
     * Selects the contents of the field when it gains focus.
     */
    selectOnFocus : true,

    typeAhead : true,

    /**
     * (REQUIRED) Data store used for filtering.
     */
    store : undefined,

    /**
     * Name of the data field to display in the text field.
     */
    displayField : 'displayName',

    /**
     * This field is used to properly hook the selected item with its
     * displayField. There needs to be a valid reason to use something other
     * than the id field, which is guaranteed to be unique.
     */
    valueField : 'id',

    /**
     * Width of the field. Careful with this - you need a min of 185 or so in
     * order to display all of the paging toolbar controls. If the width is set
     * to less than that, adjust the listConfig.width accordingly.
     */
    width : 300,

    /**
     * Optional flag that will configure if the multiselect will display an icon
     * to the left of the input select. This is typically disabled when the
     * select is a MultiSelect.
     */
    addIconToInput : true,

    listConfig : {
        /**
         * These fields are included but commented in order to make it easier to
         * use/extend this component. All belong inside listConfig.
         *  // The default text to display in an empty field. 
         * emptyText: '#{msgs.enter_username}',
         *  // The text to display in the dropdown list while data is loading.
         * loadingText: '#{msgs.finding_identities}',
         *  // CSS selector identifying the main element of the template.
         * //Required if any class is specified for the element. 
         * itemSelector: 'div.search-item',
         *  // Template to use when displaying search results. The variables to
         * //be substituted must match field names in the data store associated
         * //with this component. 
         * tpl: new Ext.XTemplate( '<tpl for=".">', '<div
         * class="search-item">', '<div class="sectionHeader">{name}</div>', '<div
         * class="indentedColumn">{displayableName}</div>', '<div
         * class="indentedColumn {emailclass}">{email}</div>', '</div>', '</tpl>', {
         * disableFormats : true })
         */
        
        /**
         * Width of the list of display results. Defaults to the width of the
         * component.
         */
        width : undefined
    },

    /**
     * if set to true, it's a free form field allowing the user to either pick a
     * value from the list or enter a new value
     */
    freeText : false,
    
    /**
     * Allow the list to be a different size from the input.  e.g. the input is set to 200px and the list to 300px.
     */
    matchFieldWidth : false,
    
    /**
     *  
     */
    enableKeyEvents : true, 
    
    /**
     * @property {Date} lastInteraction  The Date when this component was last
     *    interacted with (eg - clicking the trigger, paging, etc...).
     */
    lastInteraction: undefined,
    

    ////////////////////////////////////////////////////////////////////////////
    //
    // Methods
    //
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Runs at component construction.
     */
    initComponent : function() {
        if (this.freeText) {
            this.forceSelection = false;
            this.noResultsText = '#{msgs.no_results_found_tab_click}';
        }
        
        this.callParent(arguments);

        // add a listener that helps us out if there's a problem with the JSF binding
        this.addListener('bindError', this.onBindError);

        // and another that will handle registering for validation once
        // the component has been shown. This used to happen on the render
        // event, but this was too early in some circumstances because the
        // element did not yet have a form.
        this.addListener('show', this.register);

        // set the list width if necessary
        if (!this.listConfig.width)
            this.listConfig.width = this.width;

        // evaluate the binding to an element if necessary
        if (typeof this.binding == "string") {
            var eId = this.binding;
            if (this.formBinding)
                eId = this.formBinding + ":" + eId;

            this.binding = document.getElementById(eId);

            // if we can't find the dom element to bind to, show an error msg
            if (this.binding == null)
                this.fireEvent('bindError', {
                    'binding' : eId
                });
        }
        
        if (this.store && !this.store.pageSize) {
            // Number of search results to display per page. 
            this.store.pageSize = 5;
        }

        /**
         * Fixes a couple of rendering issues.
         */
        this.on('afterrender', function(ct, eOpts) {
            var picker, pageNumField;

            // Insert the "required" indicator after the label if this is
            // required.
            if (this.required) {
                ct.labelEl.insertHtml('beforeEnd', '<span class="requiredText">*</span>');
            }

            // This manages a rendering problem if the component is first
            // rendered to a DOM element that isn't currently displayed
            // (style="display: none").
             if (ct.triggerEl.getWidth() == 0) {
                 // get the trigger's width from the style sheet
                 // and parse of the number portion
                 var triggerWidth = ct.triggerEl.getStyle('width');
                 triggerWidth = triggerWidth.split("px")[0];
                
                 ct.bodyEl.setWidth(ct.adjustWidth('input', ct.width - triggerWidth));
             }

            /**
             * If the user has specified a raw value, we'll set that in the text
             * field so that the id value is not shown
             */
            if (this.rawValue && this.rawValue !== "") {
                this.setRawValue(this.rawValue);
            }

            // If this picker has a paging toolbar, listen for focus events on
            // the "set page number" text field to set the lastInteraction.
            picker = this.getPicker();
            if (picker.pagingToolbar) {
                pageNumField = picker.pagingToolbar.child('#inputItem');
                pageNumField.on('focus', function() {
                    this.interacted();
                }, this);
            }
        });

        this.on('select', function(combo, records, eOpts) {
            if (this.binding)
                this.binding.value = records[0].data[this.valueField || this.displayField];
        });

        this.on('enable', function() {
            if (this.binding)
                $(this.binding).disabled = false;
        });

        this.on('disable', function() {
            if (this.binding)
                $(this.binding).disabled = true;
        });
        
        // bug fix # 15401 - prevent Firefox from submitting the form when enter key is pressed
        this.on('keydown', function(target, event, options) { 
                               if (event && Ext.EventObject.ENTER === event.getKey()) {
                                   event.stopEvent();
                               } 
        });
        
        // Replace the call to getInnerTpl with getSuggestTpl so we don't override the global BoundList
        // when there are multiple types of suggests on a single page.
        if(!Ext.isDefined(this.tpl)) {
            this.tpl = Ext.create('Ext.XTemplate',
                '<ul><tpl for=".">',
                    '<li role="option" class="' + Ext.baseCSSPrefix + 'boundlist-item">' + this.getSuggestTpl(this.displayField) + '</li>',
                '</tpl></ul>'
            );
        }
    },

    getSuggestTpl : function(displayField) {
        return '<tpl for="."><div class="baseSearch"><div class="sectionHeader">{displayName:htmlEncode}</div></div></tpl>';
    },

    /**
     * IE6 needs a shim (a special backing iframe) so that the list displays
     * OVER any existing non-ExtJS select components.
     */
    expand : function() {

        /**
         * On blur with a free text field, we delay a collapse. If we are
         * clicking on the button to expand it, we need to cancel the delayed
         * task or else it will collapse the dropdown as soon as we open it.
         */
        if (this.collapseTask) {
            this.collapseTask.cancel();
        }

        this.callParent(arguments);
    },

    /**
     * Bypass internal validation to force an update on the component as well as
     * on the bound JSF input
     * 
     * @private
     */
    forcefullyClearValue : function() {
        this.setValue(this.emptyText);

        if (this.binding)
            this.binding.value = '';
    },

    getStoreId : function(suggestID) {
        if (this.store && this.store.storeId && this.store.storeId != "ext-empty-store") {
            return this.store.storeId;
        }
        else if (Ext.isDefined(this.renderTo)) {
            return (Ext.isElement(this.renderTo) ? this.renderTo.id : this.renderTo) + '_store';
        }
        else if (typeof suggestID != "undefined") {
            return suggestID + "_store";
        }
        else {
            // if all else fails, generate a unique ID
            this.store.storeId = randomUUID(5) + '_store'; // Use misc.js randomUUID()
            return this.store.storeId;
        }
    },

    /**
     * Adds a "no results" msg to the combo box's results list, which displays
     * when the query returns empty.
     */
    initList : function() {
        this.callParent(arguments);
        this.view.emptyText = this.noResultsText;
    },

    /**
     * A helper function that tells us something useful if binding to JSF fails
     */
    onBindError : function(args) {
        alert("Binding error: " + args.binding);
    },

    /**
     * If allowBlank is false: When the user clears out the original text field
     * value, but doesn't select a new one, revert the text field to its
     * original value. Otherwise, the true value of the field is obscured,
     * opening the door to user confusion. If allowBlank is enabled: Bypass the
     * validation and force the JSF input to match the raw value
     *
     * bug#14545 - clicking the scrollbar triggers this event. so while you are 
     * scrolling the combobox disappears when freetext is true
     *
     */
    onBlur : function() {
        if (this.allowBlank && this.getRawValue().length == 0) {
            this.forcefullyClearValue();
        }
        else if ((this.getRawValue().length == 0) && (this.getValue() && this.getValue().length > 0)) {
            this.setRawValue(this.getValue());
            this.bodyEl.removeCls(this.emptyClass);
        }
        else if (this.freeText) {

            /**
             * If this is a free text field, we allow them to enter any text or
             * select from the drop down so on blur, we want to set the actual
             * value to be whatever is in the text field and then collapse the
             * menu on a delay. The delay is there due to the fact that if we
             * collapse immediately and they are selecting an item from the
             * dropdown, the select event won't fire and the selected value
             * won't be chosen. PH 8/5/2011
             */
            this.setValue(this.getRawValue());
            if (this.binding) {
              // check binding value to see if anythings changed
              // this catches the scrollbar clicking blur event
              if (this.binding.value != this.getRawValue())
                this.binding.value = this.getRawValue();
              else 
                return;
            }

            this.collapseTask = new Ext.util.DelayedTask(function() {
                this.collapse();
            }, this);
            this.collapseTask.delay(400);
        }
    },

    /**
     * Notify this component that it has been interacted with.
     */
    interacted: function() {
        this.lastInteraction = new Date();
    },
    
    /**
     * Extend onTriggerClick() to remember the last interaction time.
     */
    onTriggerClick: function() {
        this.interacted();
        this.callParent(arguments);
    },

    /**
     * Extend onPageChange() to remember the lastInteraction time - when the
     * paging controls on the list are used.
     */
    onPageChange: function(toolbar, newPage) {
        var result = this.callParent(arguments);

        // Set the last interaction date.
        this.interacted();
        
        return result;
    },

    /**
     * Return whether this suggest was interacted with (ie - the list was
     * displayed or hidden, the list was paged, etc...) within the last
     * "threshold" milliseconds.
     * 
     * @param {Number} threshold  The number of milliseconds since now to check
     *    for an interaction.
     * 
     * @return {Boolean} True if this suggest was interacted with within the
     *    last "threshold" milliseconds.
     */
    recentInteraction: function(threshold) {
        var recent = false,
            diff;

        if (this.lastInteraction) {
            diff = new Date().getTime() - this.lastInteraction.getTime();
            recent = (diff < threshold);
        }

        return recent;
    },

    /**
     * Display a useful message if there's no match found. This override of the
     * ComboBox function simply prevents the list from being collapsed so that
     * the underlying data view's "emptyText" property can display.
     */
     onEmptyResults: function() {
         return true;
     },

    /**
     * Also disable any bound input fields
     */
     onDisable: function() {
         this.callParent(arguments);
        
         if (this.binding)
             $(this.binding).disabled = true;
     },

    /**
     * Also enable any bound input fields
     */
     onEnable: function() {
         this.callParent(arguments);
        
         if (this.binding)
             $(this.binding).disabled = false;
     },

    /**
     * We need the ability to set the value on a backing bean. Why here and not
     * in setValue()? The setValue() method gets called during component
     * construction and would set the binding field (and therefore the backing
     * bean value) to whatever was passed in as the "value" property. More often
     * than not, that's a different bean property than the one we want to bind
     * to (displayname vs. object id being the main example).
     * 
     * NOTE: Order is important here - you want the binding value set BEFORE the
     * call up through the inheritance chain for listeners to behave the way you
     * expect them to.
     */
     onSelect : function(record, index) {
         if (this.binding)
             this.binding.value = record.data[this.valueField || this.displayField];
        
         this.callParent(arguments);
     },

    /**
     * Register the component so that it can be validated, which right now
     * consists of clearing any emptyText on form submission
     */
    register : function() {
        if (this.emptyText) {
            var vName;
            if (this.binding) {
                vName = this.binding.id;
            }
            else {
                vName = Ext.isElement(this.renderTo) ? this.renderTo.id : this.renderTo;
            }

            // if vName is still null, then it's not bound to a bean property, so skip
            if (null != vName) {
                SailPoint.SuggestValidator.register(vName, this);

                // now find the form tag that contains this suggest component and
                // add the validation method to the onsubmit.  Kudos to kelly for
                // this nifty little idea...
                var form = this.getEl().parent('form', true);
                Ext.EventManager.on(form, 'submit', SailPoint.SuggestValidator.validateEmptyText);
            }
        }
    },

    /**
     * Add a baseParam to this suggest's Store with the given name and value.
     */
    addExtraParam : function(paramName, value) {
        this.saveoriginalExtraParams();

        var extraParams = this.store.getProxy().extraParams;
        if (!extraParams) {
            extraParams = {};
            this.store.getProxy().extraParams = extraParams;
        }

        var current = extraParams[paramName];
        if (!current) {
            extraParams[paramName] = value;
        }
        else {
            if (Ext.isArray(current)) {
                current.push(value);
            }
            else {
                current = [ current, value ];
                extraParams[paramName] = current;
            }
        }

        // This causes the next suggest to requery instead of using the cached
        // results.
        delete this.lastQuery;
    },

    /**
     * Remove a baseParam value from this suggest's Store with the given name
     * and value.
     */
    removeExtraParam : function(paramName, value) {
        this.saveoriginalExtraParams();

        var extraParams = this.store.getProxy().extraParams;
        if (extraParams) {
            var current = extraParams[paramName];
            if (current) {
                if (Ext.isArray(current)) {
                    Ext.Array.remove(current, value);
                    if (current.length === 0) {
                        extraParams[paramName] = null;
                    }
                }
                else if (current === value) {
                    extraParams[paramName] = null;
                }
            }
        }

        // This causes the next suggest to requery instead of using the cached
        // results.
        delete this.lastQuery;
    },

    /**
     * Save the original base params if they are not yet saved, so that they can
     * be restored later.
     */
    saveoriginalExtraParams : function() {
        if (!this.originalExtraParams) {
            this.originalExtraParams = Ext.clone(this.store.getProxy().extraParams);
        }
    },

    /**
     * Restore the original base params if any modifications have been made with
     * addExtraParam() or removeExtraParam().
     */
    restoreOriginalExtraParams : function() {
        if (this.originalExtraParams) {
            this.store.getProxy().extraParams = Ext.clone(this.originalExtraParams);

            // This causes the next suggest to requery instead of using the cached results.
            delete this.lastQuery;
        }
    }

    /**
     * Override this from ComboBox b/c it was miscalculating the height of the
     * list and generating odd, useless scrollbars on our paging list.
     */
    // restrictHeight: Ext.emptyFn,

    /**
     * In order to use allowBlank for our own purposes, we need to turn off the
     * validation usually associated with it. Since we're running ExtJS on top
     * of JSF, we can't hook into the ExtJS validation anyway.
     */
    /**
     * Commenthing this out. EmptyFn is definately not what we want here. If this breaks, we can 
     * replace and override. With EmptyFn here, all suggest validation is failing because emptyFn
     * does not return the boolean the code expects. It returns undefined instead. In JS, undefined 
     * will not map to a false as it would in java. -RP
     */
    //validateValue : Ext.emptyFn
});

/**
 * <p>
 * {Object} Given a div, this method will check for various class names which
 * indicate the type of suggest to be rendered. A suggest config object is
 * returned.
 * 
 * The scope within the function is the config object.
 */
SailPoint.Suggest.getSuggestConf = function(div) {

    var extElem = Ext.get(div);
    if (extElem && extElem.hasCls('compositeApp')) {
        // App suggest which only returns composites
        this['suggestType'] = 'application';
        this['extraParams'] = {
            'suggestType' : 'application',
            'excludeNonComposite' : true
        };
    }
    else if (extElem && extElem.hasCls('application')) {
        // Basic app suggest
        this['suggestType'] = 'application';
        this['extraParams'] = {
            'suggestType' : 'application'
        };
    }
    else if (extElem && extElem.hasCls('identity')) {
        // Basic app suggest
        this['suggestType'] = 'identity';
        this['extraParams'] = {
            'suggestType' : 'identity'
        };
    }
    else if (extElem && extElem.hasCls('role')) {
        // Basic app suggest
        this['suggestType'] = 'role';
        this['extraParams'] = {
            'suggestType' : 'role'
        };
    }
    else if (extElem && extElem.hasCls('iPop')) {
        // Basic app suggest
        this['suggestType'] = 'group';
        this['extraParams'] = {
            'suggestType' : 'group',
            'group' : 'populations'
        };
    }
};

/**
 * <p>
 * Utility method used to convert specially constructed blocks of html into
 * suggest components. The method will render BaseSuggest components, as well as
 * any MultiSuggest components if the SailPoint.MultiSuggest namespace exists.
 * </p>
 * <p>
 * In order for this *magical* conversion to occur, the target html block must
 * be defined in a specific way.
 * <ul>
 * <li>Enclosing div class must be 'suggestInput'. Add the class 'multi' for a
 * multiple suggest.</li>
 * <li>Specific configuration options may also be added to the class. See
 * SailPoint.Suggest.getSuggestConf()</li>
 * <li>A text input where class='suggestRawInput' populated with the raw text
 * you want the suggest to be pre-populated with.</li>
 * <li>A hidden input to hold the actual value of the suggest.</li>
 * </ul>
 * </p>
 * <br/> Here's some sample code -
 * 
 * <pre><code>
 *   &lt;div class=&quot;suggestInput multi application&quot;&gt;
 *       &lt;t:inputHidden value='#{argVal.objectValue}'&gt;
 *           &lt;f:attribute name=&quot;forceId&quot; value=&quot;true&quot;/&gt;
 *       &lt;/t:inputHidden&gt;
 *       &lt;input type=&quot;text&quot; class=&quot;suggestRawInput&quot; value='John Doe'/&gt;
 *   &lt;/div&gt;
 * </code></pre>
 */
SailPoint.Suggest.renderSuggests = function() {

    var suggestDivs = Ext.DomQuery.select('div[class*=suggestInput]');

    SailPoint.BaseSuggest.renderSuggests(suggestDivs, SailPoint.Suggest.getSuggestConf);

    // If MultiSuggest has been included try to render them as well
    if (SailPoint.MultiSuggest)
        SailPoint.MultiSuggest.renderSuggests(suggestDivs, SailPoint.Suggest.getSuggestConf);

};

/**
 * @class
 * @static IconSupport allows adding support for showing icons in suggests or
 *         Ext.form.ComboBox components. To add icon support to a suggest or
 *         combo, just call the static function addIconSupport().
 * 
 * This assumes that the store for the suggest/combo has an "icon" field in
 * every record that specifies the CSS class of the icon to use. This also
 * assumes that the XTemplate used to render the items in the suggest/combo has
 * the appropriate CSS classes.
 */
SailPoint.Suggest.IconSupport = {

    /**
     * Add icon support to the given suggest or combo. This assumes that the
     * template used for the suggest has the required icon classes (icon and
     * iconComboItem).
     * 
     * @param suggest
     *            The suggest or combo to which to add icon support.
     * @param allowLookup
     *            (optional) Whether to allow loading new items into the store
     *            if they are not found when looking up an icon class. Defaults
     *            to false.
     */
    addIconSupport : function(suggest, allowLookup) {
        // Make setValue() set the icon class after doing it's normal stuff.
        suggest.setValue = Ext.Function.createSequence(suggest.setValue, function() {
            SailPoint.Suggest.IconSupport.setIconCls(this, allowLookup);
        });

        // Make clearValue() get rid of the icon after doing it's normal stuff.
        suggest.clearValue = Ext.Function.createSequence(suggest.clearValue, function() {
            SailPoint.Suggest.IconSupport.setIconDiv(this, null);
        });
    },

    /**
     * @private Add or remove the icon div and classes to the given suggest.
     */
    setIconDiv : function(suggest, icon) {
    		if(suggest.bodyEl) {
	        var wrap = suggest.bodyEl.up('div.x-form-item');
	        if (wrap) {
	            if (icon) {
	                wrap.addCls('iconCombo');
	            }
	            else {
	                wrap.removeCls('iconCombo');
	            }
	        }
    		
	        if (Ext.isIE && suggest.width) {
	            suggest.bodyEl.setWidth(suggest.width - 16);
	        }
    		}
        if (suggest.currentIcon && suggest.inputEl) {
            suggest.inputEl.removeCls(suggest.currentIcon);
            delete suggest.currentIcon;
        }
        if (icon && suggest.inputEl) {
            suggest.inputEl.addCls(icon);
            suggest.currentIcon = icon;
        }
    },

    /**
     * @private Add or remove the icon to the left of the input.
     * 
     * @param suggest
     *            The suggest or combo for which to set the icon.
     * @param allowLookup
     *            (optional) Whether to allow loading new items into the store
     *            if they are not found when looking up an icon class. Defaults
     *            to false.
     */
    setIconCls : function(suggest, allowLookup) {
        var currentValue = suggest.getValue();
        if (currentValue) {
            var rec = suggest.store.queryBy(function(record, id){
                if(record.data[suggest.valueField] == currentValue){
                    return true;
                }
                return false;
            });
            if (rec.items.length == 0 && allowLookup) {
                SailPoint.Suggest.IconSupport.setIconClsWithLookup(suggest);
                return;
            }

            if (rec.items.length > 0) {
                var icon = rec.items[0].get('icon');
                SailPoint.Suggest.IconSupport.setIconDiv(suggest, icon);
            }
        }
    },

    /**
     * @private Add or remove the icon to the left of the input, by loading the
     *          selected value into the store.
     */
    setIconClsWithLookup : function(suggest) {
        if (suggest.binding && $(suggest.binding)) {
            var id = $(suggest.binding).value;
            if (id) {
                // load the current value from the datasource so we can get icon
                // value
                suggest.store.load({
                    params : {"currentValue" : id},
                    scope : suggest,
                    callback : function() {
                        if ($(suggest.binding)) {
                            var id = $(suggest.binding).value;
                            if (id) {
                                var rec = suggest.store.queryBy(function(record, id) {
                                    if(record.data[suggest.valueField] == id) {
                                        return true;
                                    }
                                });
                                if (rec) {
                                    var icon = rec.getAt(0);
                                    if(icon) {
                                        SailPoint.Suggest.IconSupport.setIconDiv(suggest, icon.get('icon'));
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
    }
};

/**
 * @class SailPoint.IdentitySuggest
 * @extends SailPoint.Suggest
 * 
 * Suggest component that is specifically tied to searching for identities.
 */
Ext.define('SailPoint.IdentitySuggest', {
    extend : 'SailPoint.Suggest',
    alias : 'widget.identitySuggest',

    /**
     * Field where we store the icon if its being display. We need to store it
     * off so we can switch remove it when updating the DOM.
     */
    currentIcon : undefined,

    displayField : 'displayableName',

    store : undefined,
    
    getSuggestTpl : function(displayField) {
        return '<tpl for="."><div class="identitySearch {icon}">' 
            + '<div class="sectionHeader iconComboItem">{displayableName:htmlEncode}</div>'
            + '<div class="extraIndentedColumn">{name:htmlEncode}</div>'
            + '<div class="extraIndentedColumn {emailclass}">{email:htmlEncode}</div></div></tpl>';
    },

    /**
     * Runs at component construction.
     */
    initComponent : function() {
        var params = this.baseParams || {};
        Ext.applyIf(params, this.extraParams);
        
        var loadBindings = this.loadBindings;

        this.callParent(arguments);

        // DO NOT define the store in the config above!!! You need
        // to dynamically set the storeId in order to display more
        // than one IdentitySuggest (or its subclasses) on the same
        // page (e.g. - an identity suggest and an email suggest),
        // and you can't do that from within the config definition.

        // If context isn't specified in the baseParams, check for a context
        // property. If that is null, fallback to Global.
        if (!params.context) {
            params.context = (this.context) ? this.context : 'Global';
        }

        if (!params.suggestId) {
            params.suggestId = this.id;
        }
        
        var storeConfig = {
            model : 'SailPoint.model.IdentitySuggest',
            storeId : this.getStoreId(params.suggestId),
            url : SailPoint.getRelativeUrl('/include/identityQuery.json'),
            root : 'identities',
            extraParams : params,
            remoteSort : true,
            method : 'POST'
        };
        
        if(this.initialData && this.initialData.size() > 0){
            storeConfig.data = this.initialData;
        }

        this.store = SailPoint.Store.createRestStore(storeConfig);
        
        Ext.apply(this.listConfig, {
            itemSelector : 'div.identitySearch',
            emptyText : this.noResultsText
        });

        if (this.initialConfig.allowedValues && this.initialConfig.allowedValues.length) {
            var record = this.initialConfig.allowedValues[0];
            var data = {};
            data.identities = [ record ];
            data.totalCount = 1;
            this.store.loadData(data);
        }

        if (loadBindings) {
            this.store.on('beforeload', function(store, options) {
                var loadParam;
                var requestParam;
                var value;

                for (loadParam in loadBindings) {
                    requestParam = loadParam;
                    value = $(loadBindings[loadParam]).value;
                    options.params[requestParam] = value;
                }
            });
        }

        // Add icons to this suggest, and allow looking up things that aren't
        // yet in the store.
        if (this.addIconToInput) {
            SailPoint.Suggest.IconSupport.addIconSupport(this, true);
        }

        if(this.initialData && this.initialData.size() > 0){
            //Set initialData just once.
            this.on('afterrender', function(){
                this.setValue(this.initialData[0].id);
            }, this, {single:true});
        }

        if(this.nameLookup && this.nameLookup !== "" && this.loadValueByName) {
            this.loadValueByName(this.nameLookup);
        }
    },

    forcefullyClearValue : function() {
        if (this.currentIcon) {
            this.removeCls(this.currentIcon);
            this.currentIcon = '';
        }
        this.callParent(arguments);
    }, 
    
    loadValueByName : function(nameOfIdentity) {
        this.loadValueByNameAndContext({
            nameOfIdentity: nameOfIdentity,
            context: 'Owner'
        });
    },
    
    loadValueByQuickAssign : function(nameOfIdentity) {
        this.loadValueByNameAndContext({
            nameOfIdentity: nameOfIdentity,
            context: 'QuickAssign'
        });
    },
    
    loadValueByNameAndContext : function(options) {
        this.getStore().getProxy().extraParams = {
            query: options.nameOfIdentity,
            context: options.context
        };

        // since combo.setValue only works if the record is loaded in the store,
        // query for the user first then set the value in the callback.
        this.getStore().load({
            addRecords: false, 
            combo: this, 
            name: options.nameOfIdentity, 
            callback:function(r, o, s) {
                if(r && r[0] && r[0].get('name') == o.name) {
                    o.combo.setValue(r[0].getId());
                }
            }
        });
    }
});

/**
 * The role suggest queries roles by name or displayable name and displays 
 * the roles by displayable name, name and type.
 * 
 * @author dustin.dobervich
 */
Ext.define('SailPoint.RoleSuggest', {
	extend: 'SailPoint.Suggest',
	alias: 'widget.roleSuggest',
	
	initComponent: function() {
		var params = this.baseParams || {};
        Ext.applyIf(params, this.extraParams);
        
		this.callParent(arguments);
		
		this.store = SailPoint.Store.createStore({
            fields : [
				{ name: 'id', type: 'string' },
				{ name: 'name', type: 'string' },
				{ name: 'roleType', type: 'string'},
				{ name: 'displayableName', type: 'string' }
            ],
            storeId: this.storeId ? this.storeId : this.getStoreId(),
            url: SailPoint.getRelativeUrl('/define/roles/modeler/roleQueryJSON.json'),
            extraParams: params,
            root: 'roles',
            totalProperty: 'numRoleResults',
            remoteSort: true
        });
	},
	
	getSuggestTpl : function(displayField) {
        return '<tpl for=".">' +
                   '<div class="search-item">' +
                       '<div class="sectionHeader">{displayableName}</div>' +
                       '<div class="font10">#{msgs.name}: {name}</div>' +
                       '<div class="font10 sp-grey">#{msgs.type}: {roleType}</div>' +
                   '</div>' +
               '</tpl>';
    }
});

/**
 * @class SailPoint.BaseSuggest
 * @extends SailPoint.Suggest
 * 
 * Suggest component that searches for different objects based on the queryParam
 * given at construction. Works with the BaseObjectSuggestBean.
 */
Ext.define('SailPoint.BaseSuggest', {
    extend : 'SailPoint.Suggest',
    alias : 'widget.baseSuggest',

    pageSize: 10,
    getSuggestTpl : function(displayField) {
        return '<tpl for="."><div class="baseSearch"><div class="sectionHeader">{displayName:htmlEncode}</div></div></tpl>';
    },
    
    /**
     * Runs at component construction.
     */
    initComponent : function() {

        var params = this.baseParams || {};
        Ext.applyIf(params, this.extraParams);
        
        var fields = this.fields;
        if (!fields) {
            fields = [ 'id', 'displayName' ];
        }

        this.callParent(arguments);

        // DO NOT define the store in the config above!!! You need
        // to dynamically set the storeId in order to display more
        // than one base suggest on the same page (e.g. - a role
        // suggest and an application suggest), and you can't do that
        // from within the config definition.
        this.store = SailPoint.Store.createStore({
            fields : fields,
            storeId : this.getStoreId(),
            url : SailPoint.getRelativeUrl('/include/baseSuggest.json'),
            extraParams : params,
            root : 'objects',
            remoteSort : true,
            method : 'POST'
        });

        Ext.apply(this.listConfig, {
            itemSelector : 'div.baseSearch',
            emptyText : this.noResultsText
        });

        if (params['suggestType'] === 'application' && typeof (this.initialData) !== 'undefined' && typeof (this.initialData) === 'object') {
            // is application record type
            var data = {};
            data.objects = [ this.initialData ];
            data.totalCount = 1;
            this.store.loadRawData(data);
            this.setValue(this.initialData.id);
        } else if (this.initialData) {
            this.store.load({suggest:this, dn:this.initialData, callback:function(rec, o, s) {
                Ext.each(rec, function(r){
                    if(r.get('displayName') === o.dn || r.get('id') === o.dn) {
                        o.suggest.setValue(r.get(o.suggest.valueField));
                        return false;
                    }
                });
            }});
        }
    }
});

/**
 * @class SailPoint.GroupSuggest
 * @extends SailPoint.Suggest
 * 
 * Suggest component that is specifically tied to searching for group
 * definitions and using its own template.
 */
Ext.define('SailPoint.GroupSuggest', {
    extend : 'SailPoint.Suggest',
    alias : 'widget.groupSuggest',

    displayField : 'name',
    
    getSuggestTpl : function(displayField) {
        return '<tpl for="."><div class="groupSearch"><div class="sectionHeader">{name:htmlEncode}</div>'
            + '<div class="indentedColumn">{factory:htmlEncode}</div></div></tpl>';
    },

    initComponent : function() {
        var params = this.baseParams || {};
        Ext.applyIf(params, this.extraParams);
        
        var loadBindings = this.loadBindings;

        this.callParent(arguments);

        this.extraParams['suggestType'] = 'group';
            
        this.store = SailPoint.Store.createStore({
            url : SailPoint.getRelativeUrl('/include/groupQuery.json'),
            fields : [ 'id', 'name', 'factory' ],
            root : 'objects',
            extraParams : this.extraParams,
            storeId : this.getStoreId(),
            remoteSort : true,
            method : 'POST'
        });

        Ext.apply(this.listConfig, {
            itemSelector : 'div.groupSearch',            
            emptyText : this.noResultsText
        });
    }
});

/**
 * @class SailPoint.JDBCSchemaAttributeSuggest
 * @extends SailPoint.BaseSuggest
 * 
 * Suggest component that searches for different objects based on the queryParam
 * given at construction.
 */
Ext.define('SailPoint.JDBCSchemaAttributeSuggest', {
    extend : 'SailPoint.BaseSuggest',
    alias : 'widget.jdbcSchemaAttributeSuggest',

    initComponent : function() {
        var params = this.baseParams || {};
        Ext.applyIf(params, this.extraParams);

        this.callParent(arguments);

        this.store = SailPoint.Store.createStore({
            fields : [ 'id', 'displayName' ],
            url: SailPoint.getRelativeUrl('/define/applications/JDBCSchemaAttributeSuggest.json'),
            extraParams : params,
            root : 'objects',
            totalProperty : 'count',
            storeId : this.getStoreId(),
            autoLoad : false,
            method : 'POST'
        });
    }
});

/**
 * @class SailPoint.ScopeSuggest
 * @extends SailPoint.Suggest
 * 
 * Suggest component that is specifically tied to searching for scopes and using
 * its own template.
 */
Ext.define('SailPoint.ScopeSuggest', {
    extend : 'SailPoint.Suggest',
    alias : 'widget.scopeSuggest',
    
    getSuggestTpl : function(displayField) {
        return '<tpl for="."><div class="scopeSearch"><div class="sectionHeader">{displayName:htmlEncode}</div>'
            + '<div class="indentedColumn">{IIQ_path:htmlEncode}</div></div></tpl>';
    },

    /**
     * Runs at component construction.
     */
    initComponent : function() {
        this.callParent(arguments);

        this.store = SailPoint.Store.createStore({
            fields : [ 'id', 'displayName', 'IIQ_path' ],
            storeId : this.getStoreId(),
            remoteSort : true,
            url : SailPoint.getRelativeUrl('/systemSetup/scopes/scopesSuggest.json'),
            root : 'objects',
            extraParams : {
                suggestType : 'scope'
            },
            method : 'POST'
        });
        
        Ext.apply(this.listConfig, {
            itemSelector : 'div.scopeSearch',            
            emptyText : this.noResultsText
        });
    }
});

Ext.define('SailPoint.IdentityAttributeSuggest', {
    extend : 'SailPoint.Suggest',
    alias : 'widget.identityAttributeSuggest',

    valueField : 'name',
    
    filterSystem : false,
    
    getSuggestTpl : function(displayField) {
        return '<tpl for="."><div class="identityAttributeSearch"><div class="sectionHeader">{displayName:htmlEncode}</div>'
            + '<div class="indentedColumn">{name:htmlEncode}</div></div></tpl>';
    },

    /**
     * Runs at component construction.
     */
    initComponent : function() {
        this.callParent(arguments);

        this.store = SailPoint.Store.createStore({
            fields : [ 'id', 'name', 'displayName' ],
            storeId : this.getStoreId(),
            remoteSort : true,
            url : SailPoint.getRelativeUrl('/include/identityAttributeSuggest.json'),
            root : 'attributes',
            extraParams : {
                'suggestType' : 'identityAttribute',
                'filterSystem': this.filterSystem
            },
            method : 'POST'
        });

        Ext.apply(this.listConfig, {
            itemSelector : 'div.identityAttributeSearch',            
            emptyText : this.noResultsText
        });
    }, 
    
    loadValueByName : function(nameOfAttribute) {
        // since combo.setValue only works if the record is loaded in the store,
        // query for the user first then set the value in the callback. 
        this.getStore().getProxy().extraParams = {query:nameOfAttribute, context:"Owner", filterSystem: this.filterSystem};
        this.getStore().load({addRecords:false, combo:this, name:nameOfAttribute, callback:function(r, o, s){
            if(r[0] && r[0].get('name') === o.name) {
                var value = r[0].getId();
                if(o.combo.valueField === "name") {
                    value = r[0].get('name');
                }
                o.combo.setValue(value);
            }
        }});
    }

});

/**
 * @class SailPoint.ManagedAttributeSuggest
 * @extends SailPoint.Suggest
 * 
 * Suggest component for managed attributes.
 */
Ext.define('SailPoint.ManagedAttributeSuggest', {
    extend : 'SailPoint.Suggest',
    alias : 'widget.managedAttributeSuggest',

    valueField : 'value',
    displayField : 'displayValue',
    queryParam : 'value',

    requesteeId : null,
    lcm : false,
    
    getSuggestTpl : function(displayField) {
        return '<tpl for="."><div class="x-combo-list-item"><div class="sectionHeader">{displayValue}</div>'
            + '<div class="indentedColumn">{[(values.description) ? values.description : ""]}</div></div></tpl>';
    },

    /**
     * Runs at component construction.
     */
    initComponent : function() {
        this.callParent(arguments);

        this.store = SailPoint.Store.createRestStore({
            fields : [ 'id', 'value', 'displayValue', 'description' ],
            url : SailPoint.getRelativeUrl('/rest/managedAttributes'),
            extraParams : {
                requestable : true,
                requesteeId : this.requesteeId,
                lcm : this.lcm,
                filter : this.filter,
                excludedTypes: 'Permission'
            }
        });
    }
});

/**
 * @class SailPoint.ManagedAttributeNameSuggest
 * @extends SailPoint.Suggest
 * 
 * Suggest component for managed attribute names.
 */
Ext.define('SailPoint.ManagedAttributeNameSuggest', {
    extend : 'SailPoint.Suggest',
    alias : 'widget.managedAttributeNameSuggest',

    valueField : 'attribute',
    displayField : 'attribute',
    queryParam : 'attribute',

    requesteeId : null,
    lcm : false,
    
    getSuggestTpl : function(displayField) {
        return '<tpl for="."><div class="x-combo-list-item"><div class="sectionHeader">{attribute}</div>'
            + '<div class="indentedColumn">{application-name}</div></div></tpl>';
    },

    /**
     * Runs at component construction.
     */
    initComponent : function() {
        this.callParent(arguments);

        this.store = SailPoint.Store.createRestStore({
            fields : ['id', 'attribute', 'application-name', 'purview', 'type' ],
            url : SailPoint.getRelativeUrl('/rest/managedAttributes/names'),
            extraParams : {
                requestable : true,
                includeAppNames : true,
                requesteeId : this.requesteeId,
                lcm : this.lcm,
                excludeNullAttributes: true,
                excludedTypes: 'Permission'
            }
        });
    }
});

/**
 * @class SailPoint.AccountAttributeSuggest
 * @extends SailPoint.Suggest
 * 
 * Suggest component for account attributes.
 */
Ext.define('SailPoint.AccountAttributeSuggest', {
    extend: 'SailPoint.Suggest', 
    alias: 'widget.accountAttributeSuggest',
    
    valueField: 'name',
    displayField: 'name',
    getSuggestTpl: function(displayField) {
        return '<tpl for=".">' +
          '<div class="accountAttributeSearch">' +
            '<div class="sectionHeader">{name:htmlEncode}</div>' +
            '<div class="indentedColumn">{description:htmlEncode}</div>' +
          '</div>' +
        '</tpl>';
    },

    /**
     * Runs at component construction.
     */
    initComponent: function() {
        var params = this.baseParams || {};
        Ext.applyIf(params, this.extraParams);
        
        var fields = this.fields;
        if (!fields) {
            fields = [ 'id', 'displayName' ];
        }

        this.callParent(arguments);

        this.store = SailPoint.Store.createStore({
            storeId: this.getStoreId(),
            fields: ['name', 'description'],
            dataIndex: 'name',
            url: SailPoint.getRelativeUrl('/include/accountAttributeSuggest.json'),
            extraParams : {'suggestType': 'accountAttribute', 'application': this.initialConfig.application},
            root: 'attributes',
            // TODO: When we migrate everything to use GridResponse we need to change the totalProperty to 'rowCount'
            // because the GridReponse object always serializes the property to that
            totalProperty: 'totalCount', 
            remoteSort: true,
            method : 'POST'
        });
        
        Ext.apply(this.listConfig, {
            itemSelector: 'div.accountAttributeSearch',
            emptyText : this.noResultsText
        });
    }
});

/**
 * @class SailPoint.RestSuggest
 * @extends SailPoint.Suggest
 * 
 * Suggest component that is used to query the rest datasource for a list of
 * values declared in a key in the UIConfig
 */
Ext.define('SailPoint.UIRestSuggest', {
    extend : 'SailPoint.BaseSuggest',
    alias : 'widget.uiRestSuggest',

    initComponent : function() {
        var params = this.baseParams || {};
        Ext.applyIf(params, this.extraParams);

        this.callParent(arguments);

        this.store = SailPoint.Store.createStore({
            fields : [ 'id', 'displayName' ],
            url : SailPoint.getRelativeUrl('/rest/suggest/uiconfig/'),
            extraParams : params,
            root : 'objects',
            totalProperty : 'count',
            storeId : this.getStoreId(),
            autoLoad : false,
            method : 'POST'
        });
    }
});

/**
 * @class SailPoint.RestSuggest
 * @extends SailPoint.Suggest
 * 
 * Suggest component that is used to query the rest datasource for a list of
 * distinct values of a column
 */
Ext.define('SailPoint.DistinctRestSuggest', {
    extend : 'SailPoint.BaseSuggest',
    alias : 'widget.distinctRestSuggest',

    initComponent : function() {

        var params = this.baseParams || {};
        Ext.applyIf(params, this.extraParams);

        if (this.isLCM) {
            params['isLCM'] = true;
        }

        this.callParent(arguments);

        this.store = SailPoint.Store.createStore({
            fields : [ 'id', 'displayName' ],
            url : SailPoint.getRelativeUrl('/rest/suggest/column/' + this.className + "/" + this.column),
            extraParams : params,
            root : 'objects',
            totalProperty : 'count',
            storeId : this.getStoreId(),
            autoLoad : false,
            method : 'POST'
        });
    }
});

/**
 * <p>
 * Utility method used to convert specially constructed blocks of html into
 * suggest components. See docs for SailPoint.Suggest.renderSuggests for a full
 * description.
 * </p>
 * 
 * @param {}
 */
SailPoint.BaseSuggest.renderSuggests = function(suggestDivs, confLookup) {

    if (!suggestDivs)
        suggestDivs = Ext.DomQuery.select('div[class*=suggestInput]');

    for ( var i = 0; i < suggestDivs.length; ++i) {
        var inputDiv = suggestDivs[i];

        // ie7 doesn't seem to support hasClassName..
        var extElem = Ext.get(inputDiv);

        if (!extElem.hasCls('multi')) {

            var rawInput = Ext.DomQuery.select('*[class=suggestRawInput]', inputDiv)[0];
            var JSFInput = Ext.DomQuery.select('input[type=hidden]', inputDiv)[0];

            var conf = {
                'binding' : JSFInput
            };
            if (confLookup)
                confLookup.call(conf, inputDiv);

            conf['width'] = 300;
            conf['renderTo'] = rawInput;
            var preVal = Ext.fly(rawInput).getAttribute('value');
            if (preVal) {
                conf['initialData'] = preVal;
            } else if (rawInput.innerHTML) {
                conf['renderTo'] = inputDiv;
                conf['initialData'] = Ext.decode(rawInput.innerHTML);
            }
            var extraParms = conf['baseParams'];
            if (!extraParms)
                extraParms = conf['extraParams'];
            if (!extraParms)
                extraParms = {};
            
            extraParms['suggestType'] = conf['suggestType'];
            conf['extraParams'] = extraParms;

            var suggest = SailPoint.SuggestFactory.createSuggest(conf['suggestType'], inputDiv, null, '', conf);
        }
    }
};

/**
 * A SuggestValidator is used to register suggest myComponents and clear out any
 * emptyText values before the form is submitted.
 */
SailPoint.SuggestValidator = function() {
    var tester = "mytest";
    var compList = [];

    return {
        // register a suggest component for later validation
        register : function(name, suggest) {
            if (!compList[name]) {
                compList.push(suggest);
                return true;
            }
        },

        // make sure that any emptyText value gets cleared out
        validateEmptyText : function() {
            for ( var i = 0; i < compList.length; i++) {
                var suggest = compList[i];
                var defaultVal = suggest.emptyText;

                // go all the way to the dom for the submitted value
                var submittedVal = suggest.getEl().getValue();

                if (defaultVal == submittedVal) {
                    if (suggest.binding) {
                        suggest.binding.value = '';
                    }

                    suggest.bodyEl.dom.value = '';
                }
            }
        }
    }
}();

/**
 * The SuggestFactory will create suggest components based on a requested
 * suggest type. This is a static class and cannot be constructed.
 * 
 * @class SailPoint.SuggestFactory
 * @author Kelly Grizzle
 */
SailPoint.SuggestFactory = {

    /**
     * Create a suggest component of the requested type.
     * 
     * @param {String}
     *            suggestType The type of suggest to create, such as 'manager',
     *            email', etc...
     * @param {String}
     *            renderTo The name of the element to which the suggest will be
     *            rendered
     * @param {String}
     *            exclusionIds Optional comma-separated string of IDs of objects
     *            to exclude from suggestion results.
     * @param {String}
     *            emptyText Optional text to display when the suggest is empty.
     * @param {Object}
     *            config Optional object containing config properties for the
     *            suggest component. This serves as a catch-all for any other
     *            property that we don't have an explicit parameter for.
     * 
     * @return {SailPoint.Suggest} The suggest component.
     */
    createSuggest : function(suggestType, renderTo, exclusionIds, emptyText, config) {
        var suggest;
        var context; // Used for Identity Suggests

        config = (config) ? config : {};
        config.extraParams = (config.extraParams) ? config.extraParams : {};
        config.extraParams['exclusionIds'] = exclusionIds;

        // Create the default config from the options.
        var suggestConfig = {
            extraParams : config.extraParams,
            storeId : (Ext.isElement(renderTo) ? renderTo.id : renderTo) + '_store',
            type : suggestType
        };

        if (emptyText) {
            suggestConfig.emptyText = emptyText;
        }

        // Copy the config parameters if specified.
        if (config) {
            suggestConfig = Ext.applyIf(suggestConfig, config);
        }

        switch (suggestType) {
        case 'identity':
            if (suggestConfig.extraParams) {
                context = suggestConfig.extraParams.context;
                suggestConfig.loadBindings = config.loadBindings;
            }

            if (!context) {
                // Make the global context default
                suggestConfig.extraParams.context = 'Global';
            }

            suggest = new SailPoint.IdentitySuggest(suggestConfig);
            break;
        case 'manager':
            suggestConfig.extraParams['type'] = 'manager';
            if (suggestConfig.extraParams) {
                context = suggestConfig.extraParams.context;
                suggestConfig.loadBindings = config.loadBindings;
            }
            if (!context) {
                // Make the global context default
                suggestConfig.extraParams.context = 'Manager';
            }
            suggest = new SailPoint.IdentitySuggest(suggestConfig);
            break;
        case 'scope':
            suggest = new SailPoint.ScopeSuggest(suggestConfig);
            break;
        case 'group':
            suggest = new SailPoint.GroupSuggest(suggestConfig);
            break;
        case 'identityAttribute':
            suggestConfig['emptyText'] = '#{msgs.select_identity_attr}';
            suggest = new SailPoint.IdentityAttributeSuggest(suggestConfig);
            break;
		// AUTO COMPLETE PURPOSE
	    case 'jdbcSchemaAttribute':
            suggest = new SailPoint.JDBCSchemaAttributeSuggest(suggestConfig);
            break;
        case 'userIdentityAttribute':
            // Only get standard and searchable attributes for this
            suggestConfig['emptyText'] = '#{msgs.select_identity_attr}';
            suggest = new SailPoint.IdentityAttributeSuggest(suggestConfig);
            suggest.on('render', function(suggestCmp) {
                Ext.StoreMgr.lookup(suggestCmp.getStoreId()).getProxy().extraParams.userOnly = 'true';
            });
            break;
        // all of the BaseSuggest objects build the same way
        case 'application':
        case 'lcmApplication':
        case 'task':
        case 'describableObject':
        case 'tag':
        case 'accountGroup':
        case 'inheritedAccountGroup':
        case 'role':
        case 'assignablePermittedRole':
        case 'containerRole':
        case 'lcmRole':
        case 'manuallyAssignableRole':
        case 'inheritableRole':
        case 'excludedEntitlement':
        case 'rule':
        case 'process':
        case 'language':
        case 'applicationSchema':
            suggestConfig.extraParams['suggestType'] = suggestType;
            suggestConfig['emptyText'] = emptyText;
            suggest = new SailPoint.BaseSuggest(suggestConfig);
            break;
        case 'detectableRole':
        	suggestConfig.extraParams['suggestType'] = 'detectableRole';
        	suggestConfig['emptyText'] = emptyText;
        	suggest = new SailPoint.RoleSuggest(suggestConfig);
        	break;
        case 'assignableRole':
        	suggestConfig.extraParams['suggestType'] = 'assignableRole';
        	suggestConfig['emptyText'] = emptyText;
        	suggest = new SailPoint.RoleSuggest(suggestConfig);
        	break;
        default:
            alert('Unrecognized suggest type: ' + suggestType);
        }

        return suggest;
    }
};
