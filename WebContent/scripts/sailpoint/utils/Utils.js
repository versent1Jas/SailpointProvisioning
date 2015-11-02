/**
 * Collection of generic utilities
 */
Ext.define('SailPoint.Utils', {
    statics : {
        
        logger : null,
        
        emptyTextFocusListener : function(f, e, eOpt) {
            if (f.emptyText === f.getValue()) {
                f.setValue('');
                f.getEl().removeCls(f.emptyCls);
            }
            else if(f.getValue() === "" && Ext.supports.Placeholder) {
                f.inputEl.dom.placeholder = ""; // Clear out placeholder so behavior matches with IE.
            }
        },
        
        // Helper function to get column config.
        getColumnsConfig : function(config) {
            if(config) {
                var cols = config.columns;
                if(!cols){
                    cols = config.columnConfig;
                }
                if(!cols) {
                    if(config.gridMetaData && config.gridMetaData.columns) {
                        cols = config.gridMetaData.columns; 
                    }
                }
                if(Ext.typeOf(cols) === "object" && cols.items) {
                    cols = cols.items;
                }
                return cols;
            }
            return null;
        },
        
        // With ExtJs 4.1 columns no longer autofit, so we need to set a default flex
        // if a width or flex is not specified in the config.
        setColumnFlex : function(config) {
          if(config) {
              var cols = SailPoint.Utils.getColumnsConfig(config);
              if(Ext.typeOf(cols) === "array") {
                  Ext.Array.each(cols, function(c) {
                      if(Ext.typeOf(c.width) !== "undefined" && (Ext.typeOf(c.width) === "null" || c.width <= 0)) {
                          delete c.width;
                      }
                      if(!c.width && (Ext.typeOf(c.flex) === "undefined" || Ext.typeOf(c.flex) === "null")) {
                          c.flex = 0.5; // Set a default flex
                      }
                  });
              }
          }
        },
        
        // explicitly set the cell class on the decision column to decorate the background.
        setDecisionColClass : function(config) {
            if(config) {
                var cols = SailPoint.Utils.getColumnsConfig(config);
                if(Ext.typeOf(cols) === "array") {
                    Ext.Array.each(cols, function(c) {
                        if(c.dataIndex && c.dataIndex === 'IIQ_decisionChoices') {
                            c.tdCls = 'IIQ_decisionChoices'; // see style.css
                        }
                    });
                }
            }
        },
        
        // Pull out the ids of a call to getSelectionModel().getSelection()
        getSelectedIDs : function(selectionArray) {
            var ids = [], i;
            if(selectionArray) {
                for(i = 0; i < selectionArray.length; i++){
                    ids.push( selectionArray[i].getId() );
                }
            }
            return ids;
        },
        
        findToolbarButton : function(tbar, buttonText) {
            if(tbar) {
                if(Ext.isArray(tbar)){
                    tbar = tbar[0];
                }
                var i, len, ti = tbar.items;
                if(ti){
                    for(i = 0, len = ti.length; i < len; i++){
                        if(ti.get(i).text === buttonText){
                            return ti.get(i);
                        }
                    }
                }
            }
            return null;
        },

        // Returns true/false if the current browser is
        // an officially supported browser.
        isSupportedBrowserJS: function() {
            // Bug #21658 IE9 is reporting as IE8 due to compatibility mode,
            // so check the override property.
            if ((Ext.isIE8 && Ext.isIE9_actual) || Ext.isIE9 || Ext.isIE10 || Ext.isIE11) {
                return true;
            }
            else if (Ext.isGecko) {
                /*
                 * Firefox ESR supported versions are 10, 17, 24, etc...
                 * see: https://www.mozilla.org/en-US/firefox/organizations/faq/
                 */
                if ((Ext.firefoxVersion >= 17 && Ext.firefoxVersion < 18) ||
                    (Ext.firefoxVersion >= 24 && Ext.firefoxVersion < 25) ||
                    (Ext.firefoxVersion >= 31 && Ext.firefoxVersion < 32)) {
                    return true;
                }
            }
            else if (Ext.isChrome) {
                if (Ext.chromeVersion >= 30) {
                    return true;
                }
            }
            else if (Ext.isSafari) {
                if (SailPoint.Platform.isMobile()) {
                    if (Ext.safariVersion === 7) {
                        return true;
                    }
                }
                else {
                    if (Ext.safariVersion > 5 && Ext.safariVersion < 8) {
                        return true;
                    }
                }
            }
            return false;
        },

        // returns a string representing the browser name and version.
        getBrowserNameAndVersion : function() {

            var name = "Unknown";
            var ver = "";

            if (Ext.isIE){
                name = "Internet Explorer";
                ver = Ext.ieVersion;
            }
            else if (Ext.isGecko){
                // IE11 reports itself as isGecko without compatibility mode, so we need to test for
                // that here to get the proper identification.
                name = Ext.isIE11 ? 'Internet Explorer' : 'Firefox';
                ver = Ext.isIE11 ? Ext.ieVersion : Ext.firefoxVersion;
            }
            else if (Ext.isChrome) {
                name = "Chrome";
                ver = Ext.chromeVersion;
            }
            else if (Ext.isSafari) {
                name = "Safari";
                ver = Ext.safariVersion;
                /* Chrome for iOS gives Safari as its user agent but
                 * does not have a version number */
                if(!ver) {
                    name = "Chrome";
                    ver = "for iOS";
                }
            }
            else if (Ext.isWebKit) {
                name = "WebKit";
                ver = Ext.webKitVersion;
            }
            else if (Ext.isOpera) {
                name = "Opera";
                ver = Ext.operaVersion;
            }

            return name + " " + ver;
        },
        
        setupUnsupportedBrowserTooltips : function() {
            Ext.create('Ext.tip.ToolTip', {
                target: "unsupportedBrowserNotice",
                html: SailPoint.Platform.isMobile() ? "#{msgs.unsupported_browser_tip_ios}" : "#{msgs.unsupported_browser_tip}",
                showDelay : 1000,
                anchor: 'top',
                dismissDelay : 0
            });
        },

        checkUnsupportedBrowser : function() {
            if(!SailPoint.Utils.isSupportedBrowserJS()) {
                Ext.fly('unsupportedBrowserNotice').update("#{msgs.unsupported_browser} " + SailPoint.Utils.getBrowserNameAndVersion());
                SailPoint.Utils.setupUnsupportedBrowserTooltips();
            }
        },
        
        setupESigTooltip : function(targetEl, name, account, date, app, meaning) {
            Ext.defer(function(){
                Ext.create('Ext.tip.ToolTip', {
                    target: targetEl,
                    showDelay : 200,
                    dismissDelay : 0,
                    anchor: 'top',
                    title : '#{msgs.esig_tip_title}',
                    header : {
                        xtype : 'header',
                        cls : 'eSigToolTipTitle'
                    },
                    style: {
                        background: '#FFFFFF'
                    },
                    bodyStyle: {
                        background: '#FFFFFF',
                        padding: '8px'
                    },
                    data : {
                        name : name,
                        account : account,
                        date : date,
                        app : app,
                        meaning : meaning
                    },
                    tpl : new Ext.XTemplate(
                        '<table class="eSigToolTip"><tr><td>#{msgs.esig_tip_name}:</td><td>{name}</td></tr>',
                        '<tr><td>#{msgs.esig_tip_account}:</td><td>{account}</td></tr>',
                        '<tr><td>#{msgs.esig_tip_app}:</td><td>{app}</td></tr>',
                        '<tr><td>#{msgs.esig_tip_date}:</td><td>{date}</td></tr>',
                        '<tr><td>#{msgs.esig_tip_meaning}:</td></tr></table>',
                        '<table><tr><td>{meaning}</td></tr></table>'
                    )
                });
            }, 100); // IE 7/8 needs some time to get its stuff together... :-/
        },
        
        getValueFromSelect : function (select, def) {
            var selectedIndex = select.selectedIndex;
            if (selectedIndex === -1) {
                return def;
            }
             else {
                return select.options[selectedIndex].value;
            }
        },
        
        setValueInSelect : function (select, value) {
            if (value != null) {
                for (var i = 0; i < select.options.length; ++i) {
                    if (select.options[i].value === value) {
                        select.selectedIndex = i;
                        return ;
                    }
                }
            }
        },
        
        getValueFromElement : function (element, def) {
            if (element.value == null) {
                return def;
            }
            var value = element.value;
            if (value.trim () === "") {
                return def;
            }
            return value;
        },
        
        getIntValue : function (value, def) {
            if (value == null) {
                return def;
            }
            try {
                var val = parseInt(value, 10);
                if (isNaN(val)) {
                  return def;
                } else {
                  return val;
                }
            }
             catch (ex) {
                return def;
            }
    
        },
        
        getIntValueFromElement : function (element, def) {
            return this.getIntValue (this.getValueFromElement (element, null), def);
        }, 
        
        validateNumberGreaterThanZero : function (textElement, errorLabel) {
            var valid = true;
            if (SailPoint.Utils.getValueFromElement (textElement, null) == null) {
                errorLabel.show();
                errorLabel.innerHTML = "#{msgs.util_validate_enter_value}";
                valid = false;
            }
             else {
                var val = SailPoint.Utils.getIntValueFromElement (textElement, -1);
                if (val === -1) {
                    errorLabel.show();
                    errorLabel.innerHTML = "#{msgs.util_validate_unable_to_parse}";
                    valid = false;
                }
                 else {
                    if (val <= 0) {
                        errorLabel.show();
                        errorLabel.innerHTML = "#{msgs.util_validate_greater_than_zero}";
                        valid = false;
                    }
                }
            }
            return valid;
        },
        
        /**
         * IE8 and older don't recognize the "&apos;" entity name for apostrophes,
         * so we have to sub out for the entity number instead when we do the
         * html encoding.
         * @param str The string to be html encoded
         */
        htmlEncode: function(str) {
            if (str == null) {
                return;
            }
            
            if(typeof str === "number" || typeof str === "boolean") {
                return str;
            }
            
            str = Ext.String.htmlEncode(str);
            return str.replace(/&apos;/g, "&#39;");
        },
        
        startProfilingTimer : function(msg) {
            SailPoint.profileStartTime = new Date();
            SailPoint.profileCheckTime = SailPoint.profileStartTime;
            var m = "Starting profile timer at " + SailPoint.profileStartTime;
            if (msg) { m += " - " + msg; }
            if (Ext.isDefined(Ext.global.console)) {
                Ext.global.console.info(m);
            }
            else if(Ext.isIE7 && Ext.isDefined(log4javascript)) { // must include log4javascript.js for this to work!!
                SailPoint.Utils.logger = log4javascript.getDefaultLogger();
                SailPoint.Utils.logger.info(m);
            }
        },
        
        profilerElapsedTime : function(msg) {
            var date = new Date();
            var m = "Elapsed/Total Time: " + ((date - SailPoint.profileCheckTime) / 1000 ) + "/" + ((date - SailPoint.profileStartTime) / 1000);
            SailPoint.profileCheckTime = date;
            if (msg) { m += " - " + msg; }
            if (Ext.isDefined(Ext.global.console)) {
                Ext.global.console.info(m);
            }
            else if(Ext.isIE7 && Ext.isDefined(SailPoint.Utils.logger)) {
                SailPoint.Utils.logger.info(m);
            }
        },
        
        /**
         * Sets up a global listener that runs a callback function after 
         * N number of events are fired from specified object.
         * 
         * @param string - the name of the event to listen for
         * @param number - the number of times event fires before calling callbackFn
         * @param function - the function to invoke when (eventCount < 1).
         * @param object - Ext.Observable object to listen for events from
         */
        setupAjaxCallbackListener : function(eventName, eventCount, callbackFn, agent) {
            SailPoint.ajaxCallbackCounter = eventCount;
            if(Ext.isDefined(agent)) {
                // clone agent so we don't accidentally alter it.
                // TODO: is this necessary?
                SailPoint.observableAgent = Ext.apply({}, agent);
            }
            else {
                SailPoint.observableAgent = Ext.create('SailPoint.Util.ObservableAgent', {eventName:eventName});
            }
            SailPoint.observableAgent.on(eventName, function() {
                if((--SailPoint.ajaxCallbackCounter) < 1) {
                    callbackFn();
                    // shouldn't need these anymore.
                    delete SailPoint.ajaxCallbackCounter;
                    delete SailPoint.observableAgent;
                }
            });
        },
        
        /**
         * For REST urls, if we send an object name or some other 
         * data that might contain special characters, we need to encode 
         * twice to ensure a safe and complete URL.  For example, slashes 
         * may not be allowed in URL and pluses will be turned into spaces.
         * See: http://www.jampmark.com/web-scripting/5-solutions-to-url-encoded-slashes-problem-in-apache.html
         * for evaluation of options.
         */
        encodeRestUriComponent : function(string) {
            return encodeURIComponent(encodeURIComponent(string));
        },
        
        isNullOrEmpty : function(val) {
            if (typeof val === 'undefined') {
                return true;
            }
            if (val == null || val.trim().length === 0) {
                return true;
            } else {
                return false;
            }
        },

        /**
         * Toggles a disclosure link.
         *
         * @param link
         * @param isVisible
         */
        toggleDisclosureLink : function(link, isVisible) {
            link = Ext.get(link);
            if(link) {
                //Sometimes 'link' is a TD/div/span, so walk down the tree to find the anchor.
                if(!link.is('a')) {
                    link = Ext.get(Ext.DomQuery.selectNode('a.disclosure', link.dom));
                }
                if(link && link.is('a') && link.hasCls('disclosure')) {
                    if(isVisible) {
                        link.addCls('disclosureUp')
                    }
                    else {
                        link.removeCls('disclosureUp');
                    }
                }
            }
        },

        /**
         * Used in RowExpander to toggle disclosure decorations. Can track multiple links per row.
         *
         * @param link
         * @param row
         */
        toggleDisclosureRow : function(link, row) {
            link = Ext.get(link);
            if(row && link) {
                //Sometimes 'link' is a TD/div/span, so walk down the tree to find the anchor.
                if(!link.is('a')) {
                    link = Ext.get(Ext.DomQuery.selectNode('a.disclosure', link.dom));
                }
                if(link && link.is('a') && link.hasCls('disclosure')) {
                    var targetClass = link.id + "_dTarget"; // track specific links in case there is more than one.
                    row = Ext.get(row);
                    if(row.hasCls('x-grid-row-collapsed') || (row.hasCls(targetClass) && !row.hasCls('x-grid-row-collapsed'))) {
                        link.removeCls('disclosureUp');
                        row.removeCls(targetClass);
                    }
                    else {
                        link.addCls('disclosureUp');
                        row.addCls(targetClass);
                    }
                }
            }
        },

        /**
         * Toggle disclosure decoration based on visibility of the args.div element.
         *
         * @param args Object of the form: {link:<clicked anchor>, div:<element that has been expanded/contracted>}
         */
        toggleDisclosureDiv : function(args) {
            if(args) {
                var isVisible = false;
                if(Ext.isArray(args.div)) {
                    Ext.each(args.div, function(d) {
                        if(Ext.fly(d) && Ext.fly(d).isVisible()){
                            isVisible = true;
                            return false; // break
                        }
                    })
                }
                else {
                    if(Ext.fly(args.div) && Ext.fly(args.div).isVisible()){
                        isVisible = true;
                    }
                }

                SailPoint.Utils.toggleDisclosureLink(args.link, isVisible);
            }
        },

        goToURL : function(url) {
            if(url && window.location.assign) {
                window.location.assign(url);
            }
        },

        getRecordId : function(record) {
            if(record) {
                return record.getId() || record.id;
            }
        },

        /* Apply Ext-like styles to selects on the page, including tomahawk inputDate 
         * Currently styles are only defined for search pages, but putting the function here
         * for future use.        
         */
        styleSelects : function() {
            if(!Ext.isIE) {
                SailPoint.Utils.initStyledSelects();
            } else {
                Ext.select('select.tomahawkInputDate').each(function(sel){
                    Ext.fly(sel).addCls('styledSmallSelect');
                });
            }
        },

        initStyledSelects : function() {
            var selects = Ext.DomQuery.select('select:not([class*=styled]):not([multiple=multiple])');
            Ext.each(selects, function(sel){
                sel = Ext.get(sel);
                var parent = sel.parent();
                if(parent) {
                    if(!parent.hasCls('styledSelect')) {
                        if(parent.is('div')) {
                            parent.addCls('styledSelect');
                        }
                        else {
                            sel.wrap({tag:'div',cls:'styledSelect'});
                        }
                        parent = sel.parent();
                        if (sel.hasCls('tomahawkInputDate')) {
                            parent.addCls('smallSelect');
                        }
                        sel.insertSibling({tag:'span',cls:'styledTrigger'}, 'before');
                        sel.addCls('styled');
                    }
                }
            });
            
            SailPoint.Utils.tableTomahawkInputs();
        },
        
        /* Put the inputs generated from t:inputDate into a table so style divs wont break layout */
        tableTomahawkInputs : function() {
            //Select the first tomahawk input date of every set (for each t:inputDate)
            Ext.select('input.tomahawkInputDate:first-child').each(function(firstInput) {
                //This is the span containing all the tomahawk inputs as its children
                var parentSpan = firstInput.parent();
                if (parentSpan && parentSpan.is('span')) {
                    //Create a table
                    var newTable = Ext.DomHelper.createDom({
                        tag: 'table',
                        cls: 'nopad'});

                    //Insert a new row (-1 puts it at the end)
                    var newRow = newTable.insertRow(-1);

                    //Query for all direct children of the span
                    Ext.each(parentSpan.query("> *"), function(child){
                        //Add a cell (-1 puts it at the end) for each child input
                        Ext.fly(newRow.insertCell(-1)).appendChild(child);
                    });

                    //All the children are moved into the table now, so put it under the span
                    parentSpan.appendChild(newTable);
                }
            });
        },

        /**
         * Don't let versions of IE < 11 use the CodeMirror editor.
         *
         * @param config The CodeMirror config object
         * @returns {*}
         */
        getCodeEditorConfig : function(config) {
            if (!Ext.isIE || Ext.isIE11) {
                return config;
            }
            return {xtype: 'textarea'};
        }
    }// end statics
});

Ext.define('SailPoint.Util.ObservableAgent', {
    extend : 'Ext.util.Observable',
    constructor : function(config) {
        this.callParent(arguments);
        if(config.eventName) {
            this.addEvents(config.eventName);
        }
    }
});
