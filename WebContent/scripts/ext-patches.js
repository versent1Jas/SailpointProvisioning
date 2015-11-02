Ext.dom.AbstractElement.override({
    hasCls: Ext.supports.ClassList ?
        function (className) {
            var dom = this.dom;
            //[SailPoint] add check for dom.classList
            return (dom && dom.classList && className) ? dom.classList.contains(className) : false;
        } :
        function(className) {
            var dom = this.dom;
            return dom ? className && (' '+dom.className+' ').indexOf(' '+className+' ') != -1 : false;
        }
});

Ext.define('SailPoint.extpatches.Element', {
    override : 'Ext.dom.Element',
    
    update : function(html, loadScripts, callback) {
        var me = this,
            id,
            dom,
            interval,
            //[SailPoint] Add some required vars for override
            scriptTagRe = /(?:<script([^>]*)?>)((\n|\r|.)*?)(?:<\/script>)/ig,
            replaceScriptTagRe = /(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)/ig,
            srcRe = /\ssrc=([\'\"])(.*?)\1/i,
            typeRe = /\stype=([\'\"])(.*?)\1/i;

        if (!me.dom) {
            return me;
        }
        html = html || '';
        dom = me.dom;

        if (loadScripts !== true) {
            dom.innerHTML = html;
            Ext.callback(callback, me);
            return me;
        }

        id  = Ext.id();
        html += '<span id="' + id + '"></span>';

        interval = setInterval(function() {
            var hd,
                match,
                attrs,
                srcMatch,
                typeMatch,
                el,
                s;
            if (!(el = document.getElementById(id))) { //[SailPoint] change DOC to document for override
                return false;
            }
            clearInterval(interval);
            Ext.removeNode(el);
            hd = Ext.getHead().dom;

            while ((match = scriptTagRe.exec(html))) {
                attrs = match[1];
                srcMatch = attrs ? attrs.match(srcRe) : false;
                if (srcMatch && srcMatch[2]) {
                   s = document.createElement("script"); //[SailPoint] change DOC to document for override
                   s.src = srcMatch[2];
                   typeMatch = attrs.match(typeRe);
                   if (typeMatch && typeMatch[2]) {
                       s.type = typeMatch[2];
                   }
                   hd.appendChild(s);
                } else if (match[2] && match[2].length > 0) {
                    if (window.execScript) {
                       //[SailPoint] original bug #4051
                       window.execScript(match[2].replace(/^\s*<!--/,'').replace(/-->\s*$/, ''));
                    } else {
                       window.eval(match[2]);
                    }
                }
            }
            Ext.callback(callback, me);
        }, 20);
        dom.innerHTML = html.replace(replaceScriptTagRe, '');
        return me;
    }
});

/**
 * Sencha bug: EXTJSIV-6043
 * see http://www.sencha.com/forum/showthread.php?198341-4.1-Loading-mask
 * SailPoint bug #17735 - updateIndexes overridden here. When rapidly loading workflows in the BPE received error similar to comment #6
 *                        here http://www.sencha.com/forum/showthread.php?133011-4.0.0-Bug-in-AbstractView.updateIndexes
 *                        really all this override does is make assignment to viewRecordId safer
 */
Ext.override(Ext.view.AbstractView, {
    onRender: function() {
        var me = this;
        me.callOverridden(arguments);
        if (me.loadMask) {
            if (Ext.isObject(me.store)){
                me.setMaskBind(me.store);
            }
        }
    },
    
    updateIndexes : function(startIndex, endIndex) {
        var ns = this.all.elements,
            records = this.store.getRange();
        startIndex = startIndex || 0;
        endIndex = endIndex || ((endIndex === 0) ? 0 : (ns.length - 1));
        for(var i = startIndex; i <= endIndex; i++){
            ns[i].viewIndex = i;
            // bug #17735 - 'records[i] is undefined' error when very rapid click occurs, noticed endIndex parameter=7
            //              while records.length=7. Hence need to check records[i] is valid before assigning.
            ns[i].viewRecordId = ((records.length > i) && records[i]) ? records[i].internalId : undefined;
            if (!ns[i].boundView) {
                ns[i].boundView = this.id;
            }
        }
    }
});


/**
 * The original code applies the params to the options object itself
 * instead of to the options' params object, which creates erroneous
 * behavior under certain use cases.
 */
Ext.override(Ext.data.Store, {
    loadPage: function(page, options) {
        var me = this;
        
        me.currentPage = page;
        
        if (!options)
            options = {};
        
        options.params = Ext.apply({
            page: page,
            start: (page - 1) * me.pageSize,
            limit: me.pageSize,
            addRecords: !me.clearOnPageLoad
        }, options.params);
        
        if (me.buffered) {
            return me.loadToPrefetch(options);
        }
        
        me.read(options);
    }
});

/**
 * Workaround for SailPoint bug #11981
 * The original ExtJS code blows up when the masked component's zIndex is set to 'auto' 
 */
Ext.override(Ext.LoadMask, {
    setZIndex: function(index) {
        var me = this;
        var zIndex;
            
        if (me.restack) {
            zIndex = me.activeOwner.el.getStyle('zIndex');
            if (!isNaN(zIndex)) {
                index = parseInt(zIndex, 10) + 1;
            }
        }

        me.getMaskEl().setStyle('zIndex', index - 1);
        return me.mixins.floating.setZIndex.apply(me, arguments);
    }
});

/**
 * The HtmlEditor spews out invalid request parameters because it's neglecting to 
 * give the textarea input a name
 */
Ext.override(Ext.form.field.HtmlEditor, {
    getInputId: function() {
        return this.id + '-textarea-input';
    },
    
    getSubTplData: function() {
        return {
            $comp       : this,
            cmpId       : this.id,
            id          : this.getInputId(),
            name        : this.getInputId(),
            textareaCls : Ext.baseCSSPrefix + 'hidden',
            value       : this.value,
            iframeName  : Ext.id(),
            iframeSrc   : Ext.SSL_SECURE_URL,
            size        : 'height:100px;width:100%'
        };
    },
    
    // Bug #13796, beforeDestroy back-ported from Extjs 4.1.1.  Remove when we upgrade!
    beforeDestroy : function(){
        var me = this,
            monitorTask = me.monitorTask,
            doc, prop;

        if (monitorTask) {
            Ext.TaskManager.stop(monitorTask);
        }
        if (me.rendered) {
            try {
                doc = me.getDoc();
                if (doc) {
                    // removeAll() doesn't currently know how to handle iframe document,
                    // so for now we have to wrap it in an Ext.Element using Ext.fly,
                    // or else IE6/7 will leak big time when the page is refreshed.
                    // TODO: this may not be needed once we find a more permanent fix.
                    // see EXTJSIV-5891.
                    Ext.EventManager.removeAll(Ext.fly(doc));
                    for (prop in doc) {
                        if (doc.hasOwnProperty && doc.hasOwnProperty(prop)) {
                            delete doc[prop];
                        }
                    }
                }
            } catch(e) {
                // ignore (why?)
            }
            Ext.destroyMembers(me, 'toolbar', 'iframeEl', 'textareaEl');
        }
        me.callParent();
    },

    syncValue: function() {
        var me = this,
            body, changed, html, bodyStyle, match, textElDom;

        if (me.initialized) {
            body = me.getEditorBody();
            if (body) { // Sailpoint bug 21341, protect against null body (thanks IE!)
                html = body.innerHTML;
            }
            textElDom = me.textareaEl.dom;

            if (Ext.isWebKit) {
                bodyStyle = body.getAttribute('style');
                if(bodyStyle) {
                    match = bodyStyle.match(/text-align:(.*?);/i);
                }
                if (match && match[1]) {
                    html = '<div style="' + match[0] + '">' + html + '</div>';
                }
            }

            html = me.cleanHtml(html);

            if (me.fireEvent('beforesync', me, html) !== false) {
                if (Ext.isGecko && textElDom.value === '' && html === '<br>') {
                    html = '';
                }

                if (textElDom.value !== html && html !== 'undefined') {
                    textElDom.value = html;
                    changed = true;
                }

                me.fireEvent('sync', me, html);

                if (changed) {
                    me.checkChange();
                }
            }
        }
    }
});

/**
 * See bug #11383.
 */
Ext.override(Ext.selection.CheckboxModel, {
    onRowMouseDown: function(view, record, item, index, e) {
        // don't call focus or the browser will sometimes
        // scroll down to the grid the first time a row is clicked 
        // instead of handling the row click correctly
        //view.el.focus();
        
        var me = this,
            checker = e.getTarget('.' + Ext.baseCSSPrefix + 'grid-row-checker'),
            mode;
            
        if (!me.allowRightMouseSelection(e)) {
            return;
        }

        if (me.checkOnly && !checker) {
            return;
        }

        if (checker) {
            mode = me.getSelectionMode();
            
            if (mode !== 'SINGLE') {
                me.setSelectionMode('SIMPLE');
            }
            me.selectWithEvent(record, e);
            me.setSelectionMode(mode);
        } else {
            me.selectWithEvent(record, e);
        }
    }
});

/**
 * Workaround for bug #12603
 * This function was throwing an exception when no target was available.
 * Now it just returns the unavailable target (either null or undefined)
 */
Ext.override(Ext.EventObjectImpl, {
    getTarget : function(selector, maxDepth, returnEl) {
        if (!this.target) {
            return this.target;
        }

        if (selector) {
            return Ext.fly(this.target).findParent(selector, maxDepth, returnEl);
        }
        
        return returnEl ? Ext.get(this.target) : this.target;
    }
});

/**
 * See bug #11846: Check for null before calling addCls.
 */
Ext.override(Ext.view.View, {
    highlightItem: function(item) {
        var me = this;
        me.clearHighlight();
        me.highlightedItem = item;
        if(item && Ext.fly(item)) {
            Ext.fly(item).addCls(me.overItemCls);
        }
        me.fireEvent('highlightitem', me, item);
    }
});

/**
 * See bug #11077: Multiple UIPreferences objects get created for same user
 * 
 * This method fires a state save event ('sortchange') when it sets the sort 
 * property on initial grid construction.  This override makes sure the sortchange
 * event only fires on subsequent calls, not the initial construction. 
 */
Ext.override(Ext.grid.column.Column, {
    setSortState: function(state, skipClear, initial) {
        var me = this,
            colSortClsPrefix = Ext.baseCSSPrefix + 'column-header-sort-',
            ascCls = colSortClsPrefix + 'ASC',
            descCls = colSortClsPrefix + 'DESC',
            nullCls = colSortClsPrefix + 'null',
            ownerHeaderCt = me.getOwnerHeaderCt(),
            oldSortState = me.sortState;
        
        if (oldSortState !== state && me.getSortParam()) {
            me.addCls(colSortClsPrefix + state);
            if (state && !initial) {
                me.doSort(state);
            }
            switch (state) {
                case 'DESC':
                    me.removeCls([ascCls, nullCls]);
                    break;
                case 'ASC':
                    me.removeCls([descCls, nullCls]);
                    break;
                case null:
                    me.removeCls([ascCls, descCls]);
                    break;
            }
            if (ownerHeaderCt && !me.triStateSort && !skipClear) {
                ownerHeaderCt.clearOtherSortStates(me);
            }
            
            me.sortState = state;
            if ((me.triStateSort || state != null) && !initial) {
                ownerHeaderCt.fireEvent('sortchange', ownerHeaderCt, me, state);
            }
        }
    }
});

/**
 * Bug #11852 - Fix firefox slow scrolling
 * Ported from ExtJS 4.1.1, should be removed when we upgrade.
 */
Ext.override(Ext.panel.Table, {
	syncHorizontalScroll: function(left, setBody) {
        var me = this,
            scrollTarget;
            
        setBody = setBody === true;
        // Only set the horizontal scroll if we've changed position,
        // so that we don't set this on vertical scrolls
        if (me.rendered && (setBody || left !== me.scrollLeftPos)) {
            // Only set the body position if we're reacting to a refresh, otherwise
            // we just need to set the header.
            if (setBody) {   
                scrollTarget = me.getScrollTarget();
                scrollTarget.el.dom.scrollLeft = left;
            }
            me.headerCt.el.dom.scrollLeft = left;
            me.scrollLeftPos = left;
        }
    },
    onRestoreHorzScroll: function() {
        var left = this.scrollLeftPos;
        if (left) {
            // We need to restore the body scroll position here
            this.syncHorizontalScroll(left, true);
        }
    }
});

/*
 * See Bug #11725, #14212
 * Bug #21327 - Can't scroll through tabs on IE10, IE11 on slicer/dicer, other pages.
 * Removed Ext.dom.Element.getWidth override, leaving comment for historical purposes.
 */

/* See Bug #14053
 * 
 * IE8 cannot handle textarea with width:100% if there are scrollbars present. 
 * It jumps around sporadically.  Ext.form.field.Base automatically adds width:100%
 * to style for some reason. So kludge is to override this and use fixed width along
 * with min-width and max-width in IE8 instead. Use 99% to allow for borders. 
 */
Ext.override(Ext.form.field.TextArea, {
   getFieldStyle : function() {
       if (Ext.isIE8) {
           return 'width:1px;min-width:97%;max-width:99%;' + (Ext.isObject(this.fieldStyle) ? Ext.DomHelper.generateStyles(this.fieldStyle) : this.fieldStyle ||'');
       } else {
           return this.callParent(arguments);
       } 
   } 
});

/*
 * See Bug #15114
 * 
 * Ext is actually handling the localization of propertyGrid (see Ext.grid.PropertyColumnModel
 * in any of the ext-lang-*.js files) correctly. However, when extending 
 * Ext.grid.property.Grid as we do in SailPoint.grid.PropertyGrid the proper internationalized
 * text does not display.
 */
Ext.override(Ext.grid.PropertyColumnModel, {
   nameText: '#{msgs.label_name}', 
   valueText: '#{msgs.label_value}'
});

// Bug #16499 Remove unused vars that are causing issues in IE7/8.
Ext.override(Ext.FocusManager, {
    shouldShowFocusFrame: function(cmp) {
        var me = this,
            opts = me.options || {};

        // Do not show a focus frame if
        // 1. We are configured not to.
        // 2. No Component was passed
        if (!me.focusFrame || !cmp) {
            return false;
        }

        // Global trumps
        if (opts.focusFrame) {
            return true;
        }

        if (me.focusData[cmp.id].focusFrame) {
            return true;
        }

        return false;
    }
});


/*
 * Ext override copied from spGrid.js, and moved from sailpoint.js
 */
Ext.override(Ext.form.DateField, {
    invalidText: "#{msgs.error_invalid_date_input}"
});

/*
 * Ext override copied from spGrid.js, and moved from sailpoint.js
 */
Ext.override(Ext.form.RadioGroup, {
    getGroupName: function(){
        return this.items.first().name;
    },
    getGroupValue: function(){
        var v, k;
        if (this.rendered) {
            this.items.each(function(item){
                if (!item.getValue())
                    return true;
                v = item.getGroupValue();
                return false;
            });
        }
        else {
            for (k in this.items) {
                if (this.items[k].checked) {
                    v = this.items[k].inputValue;
                    break;
                }
            }
        }
        return v;
    },
    setGroupValue: function(v){
        var k;
        if (this.rendered)
            this.items.each(function(item){
                item.setValue(item.inputValue == v);
            });
        else {
            for (k in this.items) {
                this.items[k].checked = this.items[k].inputValue == v;
            }
        }
    }
});


// add getTopToolbar and getBottomToolbar to Ext.panel.Panel
// for backwards compatibility and convenience
Ext.override(Ext.panel.Panel, {
    getTopToolbar : function() {
        return this.dockedItems.findBy(function(item) {
            if (item.alias.length === 0 || item.dock !== 'top') {
                return false;
            }

            for (var i = 0; i < item.alias.length; ++i) {
                if (item.alias[i] === 'widget.toolbar') {
                    return true;
                }
            }

            return false;
        });
    },

    getBottomToolbar : function() {
        return this.dockedItems.findBy(function(item) {
            if (item.alias.length === 0 || item.dock !== 'bottom') {
                return false;
            }

            for (var i = 0; i < item.alias.length; ++i) {
                if (item.alias[i] === 'widget.toolbar') {
                    return true;
                }
            }

            return false;
        });
    }
});

//Changed default box html for chrome only to fix bug 16062.  This appears to be fixed in ExtJS 4.2 so should be removed on upgrade.
Ext.override(Ext.layout.container.Box, {
    renderTpl: [
                '{%var oc,l=values.$comp.layout,oh=l.overflowHandler;',
                'if (oh.getPrefixConfig!==Ext.emptyFn) {',
                    'if(oc=oh.getPrefixConfig())dh.generateMarkup(oc, out)',
                '}%}',
                '<div id="{ownerId}-innerCt" class="{[l.innerCls]} {[oh.getOverflowCls()]}" role="presentation">',
                    '<div id="{ownerId}-targetEl" class="x-box-override-width" style="position:absolute;',
                            // This width for the "CSS container box" of the box child items gives
                            // them the room they need to avoid being "crushed" (aka, "wrapped").
                            // On Opera, elements cannot be wider than 32767px or else they break
                            // the scrollWidth (it becomes == offsetWidth) and you cannot scroll
                            // the content.
                    
                            // Removed this value for chrome because buttons render correctly with out it and it caused
                            // an issue where divs would scroll when highlighted.  
                            // Detects user agent then includes or excludes string accordingly
                            window.chrome?'':'width:20000px;',
                                    
                            // On IE quirks and IE6/7 strict, a text-align:center style trickles
                            // down to this el at times and will cause it to move off the left edge.
                            // The easy fix is to just always set left:0px here. The top:0px part
                            // is just being paranoid. The requirement for targetEl is that its
                            // origin align with innerCt... this ensures that it does!
                            'left:0px;top:0px;',
                            // If we don't give the element a height, it does not always participate
                            // in the scrollWidth.
                            'height:1px">',
                        '{%this.renderBody(out, values)%}',
                    '</div>',
                '</div>',
                '{%if (oh.getSuffixConfig!==Ext.emptyFn) {',
                    'if(oc=oh.getSuffixConfig())dh.generateMarkup(oc, out)',
                '}%}',
                {
                    disableFormats: true,
                    definitions: 'var dh=Ext.DomHelper;'
                }
            ]
});

Ext.define("SailPoint.MessageBox", {
    override: 'Ext.window.MessageBox',
    
    show: function(cfg) {
        /* Need to set localized text here because the locale ext-lang 
        file will override any config or defaults we set. */
        if (!cfg.myLabels){  
            this.buttonText = {
                yes: '#{msgs.button_yes}',
                no: '#{msgs.button_no}',
                ok: '#{msgs.button_ok}',
                cancel: '#{msgs.button_cancel}'
            };
        }
        
        return this.callParent(arguments);
    },
    
    makeButton: function(btnIdx) {
        var btnId = this.buttonIds[btnIdx];
        return new Ext.button.Button({
            handler: this.btnCallback,
            itemId: btnId,
            scope: this,
            cls : btnIdx > 1 ? 'secondaryBtn' : '',
            text: this.buttonText[btnId],
            minWidth: 75
        });
    }
}, function() {
    /*
     Override the Ext.MessageBox singleton with this version
     that applies a secondaryBtn class to the 'no' and 'cancel'
     button types.
     */
    Ext.MessageBox = Ext.Msg = new this();
});

Ext.override(Ext.form.field.ComboBox, {
    onLoad: function() {
        var me = this,
            value = me.value;
    
        if (me.ignoreSelection > 0) {
            --me.ignoreSelection;
        }
        
        if (me.rawQuery) {
            me.rawQuery = false;
            me.syncSelection();
            if (me.picker && !me.picker.getSelectionModel().hasSelection()) {
                me.doAutoSelect();
            }
        }
        
        else {
            
            if (me.value || me.value === 0) {
                if(me.pageSize === 0) // added for paging; do not execute on page change
                    me.setValue(me.value);
            } else {
                
                
                if (me.store.getCount()) {
                    me.doAutoSelect();
                } else {
                    
                    me.setValue(me.value);
                }
            }
        }
    },

    /*
     * Bug #20835
     * If the previous selection's value already matches the raw value in the combo box
     * then we shouldn't second guess it when forcing a selection.  This issue only manifests
     * when we have multiple items with the same display name and forceSelection is set to "true"
     * on the combo box.
     */
    assertValue: function() {
        var me = this,
            value = me.getRawValue(),
            rec;

        if (me.forceSelection) {
            if (me.multiSelect) {
                if (value !== me.getDisplayValue()) {
                    me.setValue(me.lastSelection);
                }
            } else {
                // If there is no current selection or the value doesn't match the current selection we need to force a selection
                if (!Ext.isDefined(me.lastSelection) || me.lastSelection.length !== 1 || me.lastSelection[0].get(me.displayField) !== me.getRawValue()) {
                    rec = me.findRecordByDisplay(value);
                    if (rec) {
                        me.select(rec);
                    } else {
                        me.setValue(me.lastSelection);
                    }
                } // Otherwise do nothing because the current selection is already valid
            }
        }

        me.collapse();
    }
});

/*
 * Bug #18630
 * There seems to be an Ext bug where in IE, frameSize can be set to 'false' instead of an object
 * In that case, we could never get a valid value for triggerSize, so the menu could not be shown.
 * Too dangerous to mess with core part setting frameSize, so just check for non-false value of me.frameSize
 */
Ext.override(Ext.button.Button, {
    getTriggerSize: function() {
        var me = this,
            size = me.triggerSize,
            side, sideFirstLetter, undef;

        if (size === undef) {
            side = me.arrowAlign;
            sideFirstLetter = side.charAt(0);
            //This is line that has changed. If me.frameSize is null or false, use 0. 
            size = me.triggerSize = me.el.getFrameWidth(sideFirstLetter) + me.btnWrap.getFrameWidth(sideFirstLetter) + ((me.frameSize) ? me.frameSize[side] : 0);
        }
        return size;
    }
});

// Bug #21405: Add browser detection for IE10 and IE11 in lieu of upgrading ExtJs to version 4.2.2 (which
// is the lowest version to support IE11).  If and/or when we do upgrade ExtJs we can revist this detection.
// See: http://stackoverflow.com/questions/21881671/ext-isie-return-false-in-ie-11
Ext.isIE11 = (((/trident\/7\./).test(Ext.userAgent) && document.documentMode != 7 &&
    document.documentMode != 8 && document.documentMode != 9));

Ext.isIE10 = Ext.isIE && !Ext.isIE11 && (((/msie 10/).test(Ext.userAgent) && document.documentMode != 7 &&
    document.documentMode != 8 && document.documentMode != 9) || document.documentMode == 10);

if(Ext.isIE11) {
    var m = /rv\:(\d+\.\d+)/.exec(Ext.userAgent);
    if(m) {
        Ext.ieVersion = parseFloat(m[1]);
    }
    else {
        Ext.ieVersion = 11;
    }
}

// Bug #21658 IE9 is reporting as IE8 due to compatibility mode,
// so test for the trident version to double check and set a new
// global property for the browser check.
if(Ext.isIE8) {
    Ext.isIE9_actual = (/trident\/5./).test(Ext.userAgent);
}
