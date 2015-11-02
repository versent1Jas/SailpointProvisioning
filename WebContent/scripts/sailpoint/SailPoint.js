/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint', {
    statics : {

        /**
         * The maximum size we can comfortably edit within the CodeMirror editor.
         * Text longer than this length will use a textarea instead of CodeMirror
         * as the editor.
         */
        MAX_EDITABLE_FILE_LENGTH : 400000,

        /**
         * Replaces problematic characters before rending in html.
         * 
         * @param text The text to be sanitized.
         */
        sanitizeHtml : function(text) {
            if (!text || text === '') {
                return text;
            }
            return text.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
        },
        
        getRelativeUrl : function(relativePath) {
            return (SailPoint.CONTEXT_PATH ? SailPoint.CONTEXT_PATH : CONTEXT_PATH) + relativePath;
        },
        
        getSessionTimeout : function() {
            return SailPoint.SESSION_TIMEOUT ? SailPoint.SESSION_TIMEOUT : 1800000; //default to 30 min
        },
        
        // find the browser's document area dimensions.
        getBrowserViewArea : function() {
            var w = 1000, h = 600;
            if( typeof( window.innerWidth ) === 'number' ) {
                //Non-IE
                w = window.innerWidth;
                h = window.innerHeight;
            } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
                //IE 6+ in 'standards compliant mode'
                w = document.documentElement.clientWidth;
                h = document.documentElement.clientHeight;
            } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
                //IE 4 compatible
                w = document.body.clientWidth;
                h = document.body.clientHeight;
            }
            return {width: w, height: h};
        },

        /* This value is used to trigger setting the maxHeight value of advanced search panels. See Bug #21023 */
        minSupportedHeight : 768
    }
});

/** A global locking mechanism that a page can set to prevent the popup window from 
occurring while an action is taking place **/
SailPoint.TIMEOUT_LOCK = false;

SailPoint.getTimeoutLock = function(){    
    return SailPoint.TIMEOUT_LOCK;
};

SailPoint.setTimeoutLock = function(lock){
    SailPoint.TIMEOUT_LOCK = lock;
};

// resets the session timeout monitoring process
SailPoint.resetTimeout = function() {  
    // first clear out any existing session timeout monitor  
    window.clearTimeout(SailPoint.TIMEOUT_ID);
    var miliWait = SailPoint.getSessionTimeout() + 30000;
    SailPoint.TIMEOUT_ID = window.setTimeout("showTimeoutMsg()", miliWait);
};

/**
 * Safe way to convert a string to a function w/out using eval.
 * @param functionName Name of the function.
 * @param context The context to evaluate namespaces with, usually you can start with window.
 */
SailPoint.evaluteFunctionByName = function(functionName, context) {
  var i, len,
  namespaces = functionName.split("."),
  func = namespaces.pop();
  
  for(i = 0, len = namespaces.length; i < len; i++) {
      context = context[namespaces[i]];
  }
  return context[func];
};

/**
 * Displays an alert with a fatal system err message.
 */
SailPoint.FATAL_ERR_ALERT = function(msg) {
    if (msg) {
        msg = Ext.String.format("#{msgs.err_fatal_system_with_msg}", msg);
    } else {
        msg = '#{msgs.err_fatal_system}';
    }
    Ext.Msg.show({
        title : '#{msgs.err_dialog_title}',
        msg : msg,
        icon : Ext.MessageBox.ERROR,
        buttons : Ext.Msg.OK
    });
};

/**
 * Displays javascript exception message with a little stack trace
 */
SailPoint.FATAL_ERR_JAVASCRIPT = function(exception, msg) {

    var exMsg = (exception && exception.message) ? exception.message : "[<em>#{msgs.js_error_no_message}</em>]";
    var fileName = (exception && exception.fileName) ? exception.fileName : "[<em>#{msgs.js_error_no_file}</em>]";
    var lineNum = (exception && exception.lineNumber) ? exception.lineNumber : "[<em>#{msgs.js_error_no_linenumber}</em>]";
        
    if(typeof exception === "string" && exception !== ""){
        exMsg = exception;
    }

    var msgText = msg ? msg : "#{msgs.js_error_unexpected}";
    msgText += "<br/><b>#{msgs.js_error_message}</b>: " + exMsg + "<br/>";
    if(exception.name){
        msgText += "<b>#{msgs.js_error_type}</b>: " + exception.name + "<br/>";
    }
    msgText += "<b>#{msgs.js_error_file_name}</b>: " + fileName + "<br/>";
    msgText += "<b>#{msgs.js_error_line_number}</b>: " + lineNum + "<br/>";
    
    //TODO extjs4: enable/disable this with a global debug flag??
    if(printStackTrace){
        var trace = printStackTrace();
        if(trace){
            trace = trace.splice(3, trace.length-3); //trim off the stacktrace script function calls
            msgText += '<b>#{msgs.js_error_stack_trace}</b>:<br/><textarea rows="8" cols="65">' + trace.join("\n") + "\n\n\n" +
                msgText.replace(/<br\/>/g, "\n").replace(/<(?:.|\n)*?>/g, "") + "</textarea>";
        }
    }

    SailPoint.EXCEPTION_ALERT(msgText);
};

/**
 * Simple alert message which returns a generic system
 * exception message with the errMsg param appended.
 */
SailPoint.EXCEPTION_ALERT = function(errMsg) {
    var tpl = new Ext.Template('#{msgs.err_exception}');
    var msgText = tpl.apply([errMsg]);
    Ext.Msg.show({
        title : '#{msgs.err_dialog_title}',
        msg : msgText,
        buttons : Ext.Msg.OK,
        icon : Ext.MessageBox.ERROR
    });
    if (Ext.isDefined(Ext.global.console)) {
        Ext.global.console.warn(errMsg);
    }
};

/**
 * Default function for handling JsonStore ajax requests
 * which return success:false. Pops up a message box with
 * the error message.
 */
SailPoint.DEFAULT_STORE_ERR_HANDLER = function(thisObj, options, response, err) {

    var tpl = new Ext.Template('#{msgs.err_exception}');
    var url = options.url;

    // Ext will return an error message on the err param that may or may not
    // be that helpful. Check the response to see if a more detailed
    // err msg was returned by the server before displaying err.message.
    var errMsg = err && err.message ? err.message : '';

    try {
        var respObj = Ext.decode(options.responseText);
        if (respObj && respObj.errorMsg && respObj.errorMsg != '') {
            errMsg = respObj.errorMsg;
        } 
        else if (respObj.errors && Ext.isArray(respObj.errors) && respObj.errors.length > 0) {
            if (respObj.errors.length > 1) {
                errMsg = "<ul>";
                for ( var i = 0; i < respObj.errors.length; i++) {
                    errMsg += "<li>-" + respObj.errors[i] + "</li>";
                }
                errMsg += "</ul>";
            } 
            else {
                errMsg += respObj.errors[0];
            }
        }
    } catch (jsonException) {
        // json returned by the datasource was unparseable
        errMsg = "#{msgs.js_error_not_evaluated}";
    }

    var msgText = tpl.apply([ errMsg ]);
    Ext.Msg.show({
        title : '#{msgs.err_dialog_title}',
        msg : msgText,
        buttons : Ext.Msg.OK,
        icon : Ext.MessageBox.ERROR
    });
};

/**
 * Creates an Ext window using the given parameters. This
 * function is really a substitute for calls to the
 * prototype Dialog.confirm method until we can drop Dialog
 * and replace it with Ext.
 * 
 * Check Dialog api for parameter defintions:
 * http://prototype-window.xilinus.com/documentation.html
 */
SailPoint.confirm = function(content, options) {
    var contentUrl = content.url;

    var width = options.windowParameters.width;
    var title = options.windowParameters.title;
    var height = options.windowParameters.height;

    var okFunc = options.ok;
    var cancelFunc = options.cancel || function() { return true; };
    var okLabel = options.okLabel || "#{msgs.button_ok}";
    var cancelLabel = options.cancelLabel || "#{msgs.button_cancel}";
    var buttonAlign = options.buttonAlign ? options.buttonAlign : 'end'; //This needs to be either 'start', 'center', or 'end'.

    // if a window instance has been created, reuse it
    // otherwise instantiate a new one
    var initialLoad = SailPoint.Dialog == null;
    if (initialLoad) {
        
        var dConfig = {
            modal : true,
            closeAction : 'hide',
            shim : true,
            closable : false,
            draggable : false,
            bodyStyle : 'padding:10px;background-color:#FFFFFF',
            loader : {
                url : contentUrl,
                scripts : true,
                // don't cache GET requests when performing updates on extjs panels.
                // This appends a parameter '_dc' to the request
                // Ext.Updater.defaults.disableCaching = true;
                ajaxOptions: {disableCaching : true},
                callback : function() {
                    if(options.callback) {
                        options.callback();
                    }
                    SailPoint.Dialog.updateLayout();
                    SailPoint.Dialog.center();
                },
                autoLoad: true
            },
            focusField : options.focusField,
            focusOnField : function() {
                var f = Ext.get(this.focusField);
                if (f)
                    f.focus();
            },
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'bottom',
                layout : {pack : buttonAlign},
                ui: 'footer',
                items: [
                    {
                        id : 'spConfirmPanelOkButton',
                        text : okLabel,
                        handler : function() {
                            return okFunc(SailPoint.Dialog);
                        }
                    },
                    {
                        id : 'spConfirmPanelCancelButton',
                        text : cancelLabel,
                        cls : 'secondaryBtn',
                        handler : function() {
                            var result = cancelFunc(SailPoint.Dialog);
                            SailPoint.Dialog.hide();
                            return result;
                        }
                    }
                ]
            }]
        };
        
        if(height) {
            dConfig.height = height;
        }
        if(width) {
            dConfig.width = width;
        }
        if(title) {
            dConfig.title = title;
        }
        
        SailPoint.Dialog = Ext.create('Ext.window.Window', dConfig);

        if (options.focusField) {
            SailPoint.Dialog.on("render", function(win) {
                if (this.loader) {
                    this.loader.on('load', this.focusOnField, this);
                }
            }, SailPoint.Dialog);
        }
    } 
    else {
        SailPoint.Dialog.setTitle(title);
        // Mask the current content until the new content is loaded.
        SailPoint.Dialog.getEl().mask(Ext.LoadMask.prototype.msg, 'x-mask-loading');
        // If width or height isn't configured, call these with null
        // to reset the size and let the window size itself
        SailPoint.Dialog.setWidth(width ? width : null);
        SailPoint.Dialog.setHeight(height ? height : null);
        SailPoint.Dialog.loader = {
            url : contentUrl,
            callback : function() {
                if(options.callback) {
                    options.callback();
                }
                SailPoint.Dialog.updateLayout();
                SailPoint.Dialog.center();
            }
        };

        var okButton = Ext.getCmp('spConfirmPanelOkButton');
        var cancelButton = Ext.getCmp('spConfirmPanelCancelButton');

        if(okButton) {
            okButton.setHandler(function() {
                return okFunc(SailPoint.Dialog);
            }, this);
            okButton.setText(okLabel);
        }
        if(cancelButton) {
            cancelButton.setHandler(function() {
                var result = cancelFunc(SailPoint.Dialog);
                this.hide();
                return result;
            }, SailPoint.Dialog);
            cancelButton.setText(cancelLabel);
        }
        
        var loader = SailPoint.Dialog.getLoader();
        if (loader) {
            loader.on("load", SailPoint.Dialog.focusOnField, SailPoint.Dialog);
            loader.on('exception', function(response) {
                SailPoint.EXCEPTION_ALERT("#{msgs.js_error_retrieving_url} " + contentUrl);
            });

            loader.load({
                url : contentUrl,
                scripts : true,
                callback : function() {
                    if(options.callback) {
                        options.callback();
                    }
                    okButton.setDisabled(false); // In the event the button was disabled, re-enable it here.
                    SailPoint.Dialog.getEl().unmask();
                    SailPoint.Dialog.updateLayout();
                    SailPoint.Dialog.center();
                },
                ajaxOptions : {
                    disableCaching: true
                }
            });
        } 
        else {
            SailPoint.EXCEPTION_ALERT("#{msgs.js_error_no_loader}");
        }
    }

    // extra parameters that need to be passed to the button handler functions.
    SailPoint.Dialog.buttonParms = options.buttonParms;

    SailPoint.Dialog.show();
    SailPoint.Dialog.updateLayout();
    SailPoint.Dialog.center();
};

/**
 * Sigh, if you set the value of a element with a string
 * that contains escaped unicode chars, the unicode is
 * displayed as html entities - &#1234; This function
 * replaces the entities with the actual unicode values.
 * 
 * todo - figure out how to remove this crap!
 */
SailPoint.getUnicode = function(val) {
    if (null == val) {
        return val;
    }

    var matches = val.match(/&#[0-9]*;/g);
    var i, j, out = val;
    if (matches) {
        for (i = 0; i < matches.length; i++) {
            var match = matches[i];
            var decimalStr = match.substring(2,    matches[i].length - 1);
            var decimal = decimalStr * 1;
            var hex = decimal.toString(16);

            if (hex.length < 4) {
                for (j = hex.length; j < 4; j++) {
                    hex = '0' + hex;
                }
            }

            var unicode = eval("'\\u" + hex + "'");
            out = out.replace(match, unicode);
        }
    }
    return out;
};

/**
 * Inserts word break tags into the given string at places
 * where the string may be broken for wrapping within the
 * browser.
 * 
 * Currently we only add the word wrap tags at commas since
 * this helps DNs display.
 * 
 * @param str
 */
SailPoint.insertWordBreak = function(str) {
    if (!str) {
        return str;
    }
    return str.replace(/,/g, ",&#8203;");
};

SailPoint.clone = function(o) {
    if (!o || 'object' !== typeof o) {
        return o;
    }
    if ('function' === typeof o.clone) {
        return o.clone();
    }
    var c = '[object Array]' === Object.prototype.toString.call(o) ? [] : {};
    var p, v;
    for (p in o) {
        if (o.hasOwnProperty(p)) {
            v = o[p];
            if (v && 'object' === typeof v) {
                c[p] = SailPoint.clone(v);
            } else {
                c[p] = v;
            }
        }
    }
    return c;
};

/**
 * This function wraps Ext.MessageBox.show to show the Add Comment dialog
 * @param callback The callback called when the dialog is dismissed
 * @param [initialText] The initial value populating the text field
 * @returns {*|Ext.Component|Ext.Component|Ext.Component|Ext.Component|Ext.Component} The instance of MessagBox
 */
SailPoint.showAddCommentDlg = function(callback, initialText) {
    var dialog = Ext.MessageBox.show({
        title: '#{msgs.dialog_add_comment}',
        width: 450,
        fn: callback,
        buttonText: {
            ok: '#{msgs.button_title_add_comment}',
            cancel: '#{msgs.button_cancel}'
        },
        multiline:175,
        value: initialText,
        closable: false,
        buttons: Ext.MessageBox.OKCANCEL,
        defaultTextHeight: 200
    });
    dialog.down('textarea').focus();
    return dialog;
}

/**
 * Register an error handler with prototype so we don't silently swallow errors
 * while handling ajax requests.
 */
Ajax.Responders.register({onException : function(request, exception) {
        // be careful not to cause another exception here. It's very unlikely
        // we'd be missing anything here, but just to be on the safe side...
        var url = (request && request.url) ? request.url : "[<em>#{msgs.js_error_no_url}</em>]";
        var msg = (exception && exception.message) ? exception.message : "[<em>#{msgs.js_error_no_message}</em>]";
        var file = (exception && exception.fileName) ? exception.fileName : "[<em>#{msgs.js_error_no_file}</em>]";
        var line = (exception && exception.lineNumber) ? exception.lineNumber : "[<em>#{msgs.js_error_no_linenumber}</em>]";

        if (typeof exception === "string" && exception !== "") {
            msg = exception;
        }

        var errMsg = "#{msgs.js_error_ajax_request}<br/>";
        errMsg += "<br/><b>#{msgs.js_error_request_url}</b>: " + url + "<br/>";
        errMsg += "<b>#{msgs.js_error_message}</b>: " + msg + "<br/>";
        errMsg += "<b>#{msgs.js_error_file_name}</b>: " + file + "<br/>";
        errMsg += "<b>#{msgs.js_error_line_number}</b>: " + line + "<br/>";

        SailPoint.EXCEPTION_ALERT(errMsg);
    }
});

/**
*  In some cases IE6 doesn't fire the onready event correctly. It
*  seems to occur in pages which have a lot of includes.
*  The result is that your javascript will execute before the dom
*  is complete, causing NPEs or general weirdness.
*  In those cases, SailPoint.Page.onReady can be substituted for Ext.onReady.
*  The ready event is fired by some javascript included at the bottom of the
*  page ensuring that we don't begin javascripting until the dom is completed.
*/

Ext.define('SailPoint.Page', {
    extend : 'Ext.util.Observable',
    
    constructor : function(cfg) {
        Ext.apply(this, cfg || {});
        this.addEvents({'pageready' : true});
        this.callParent(arguments);
    },
    
    isReady : false,
    
    initApp : function() {
        this.fireEvent('pageready', this);
        this.isReady = true;
    },
    
    onReady : function(fn, scope) {
        if (!this.isReady) {
            this.on('pageready', fn, scope);
        }
        else {
            fn.call(scope, this);
        }
    }
});

// don't reload Page on an a4j request
var Page = Ext.create('SailPoint.Page', {});
