/**
 * @author Adrian Teodorescu (ateodorescu@gmail.com; http://www.mzsolutions.eu)
 * @docauthor Adrian Teodorescu (ateodorescu@gmail.com; http://www.mzsolutions.eu)
 * @license [MIT][1]
 *
 * @version 1.5
 *
 * Provides a [CodeMirror][2] component wrapper for Sencha.
 * The component was tested with Extjs 4.0.7, 4.1.x and 4.2.x and it works with CodeMirror 3.20.
 *
 * [1]: http://www.mzsolutions.eu/extjs/license.txt
 * [2]: http://codemirror.net/
 *
 *
 * The editor's toolbar buttons have tooltips defined in the {@link #buttonTips} property, but they are not
 * enabled by default unless the global {@link Ext.tip.QuickTipManager} singleton is
 * {@link Ext.tip.QuickTipManager#init initialized}.
 *
 * If you include the modes script files by yourself then ignore the {@link #modes} property. *
 *
 #Example usage:#

 {@img Ext.ux.form.field.CodeMirror.png Ext.ux.form.field.CodeMirror component}

 var editorConfig = SailPoint.Utils.getCodeEditorConfig({
        xtype: 'codemirror',
        id: 'cmEditor',
        mode: 'application/xml',
        tabSize: 4,
        indentUnit: 4,
        matchTags: {bothTags: true},
        autoCloseTags: true,
        showModes: true, //defaults to false
        showThemeSelect: false, //defaults to true
        theme: 'Ambiance',
        extraKeys: {
            'Ctrl-J': 'toMatchingTag',
            "'<'": CodeMirrorHintHelper.completeAfter,
            "'/'": CodeMirrorHintHelper.completeIfAfterLt,
            "' '": CodeMirrorHintHelper.completeIfInTag,
            "'='": CodeMirrorHintHelper.completeIfInTag,
            'Ctrl-Space': 'autocomplete'
        },
        hintOptions: {schemaInfo: CodeMirrorSailpointObjects, container: win}
    });

 */
/* global CodeMirror */
Ext.define('Ext.ux.form.field.CodeMirror', {
    extend: 'Ext.form.field.Base',

    requires: [
        'Ext.tip.QuickTipManager',
        'Ext.toolbar.Item',
        'Ext.toolbar.Toolbar',
        'Ext.util.Format',
        'Ext.ux.layout.component.field.CodeMirror'
    ],

    alias: 'widget.codemirror',
    alternateClassName: 'Ext.form.CodeMirror',
    componentLayout: 'codemirror',

    childEls: [
        'toolbarEl', 'editorEl'
    ],

    fieldSubTpl: [
        '<div id="{cmpId}-toolbarEl"></div>',
        '<div id="{cmpId}-editorEl" class="{editorCls}" name="{editorName}" style="{size}"></div>',
        {
            disableFormats: true
        }
    ],

    editorWrapCls: Ext.baseCSSPrefix + 'html-editor-wrap ' + Ext.baseCSSPrefix + 'html-editor-input',

    maskOnDisable: true,

    /**
     * @cfg {String} mode The default mode to use when the editor is initialized. When not given, this will default
     * to the first mode that was loaded.
     * It may be a string, which either simply names the mode or is a MIME type associated with the mode. Alternatively,
     * it may be an object containing configuration options for the mode, with a name property that names the mode
     * (for example {name: "javascript", json: true}). The demo pages for each mode contain information about what
     * configuration parameters the mode supports.
     */
    mode: 'text/plain',

    /**
     * @cfg {Boolean} showModes Enable mode selection in the toolbar
     */
    showModes: false,

    /**
     * @cfg {Boolean} showLineNumbers Enable line numbers button in the toolbar.
     */
    showLineNumbers: true,

    /**
     * @cfg {Boolean} showLineWrapButton Enable line wrap button in the toolbar.
     */
    showLineWrapButton: true,

    /**
     * @cfg {Boolean} showThemeSelect Enable theme selection in the toolbar.
     */
    showThemeSelect: true,

    /**
     * @cfg {Boolean} enableMatchBrackets Force matching-bracket-highlighting to happen
     */
    enableMatchBrackets: true,

    /**
     * @cfg {Boolean} enableElectricChars Configures whether the editor should re-indent the current line
     * when a character is typed that might change its proper indentation (only works if the mode supports indentation).
     */
    enableElectricChars: true,

    /**
     * @cfg {Boolean} enableIndentWithTabs Whether, when indenting, the first N*tabSize
     * spaces should be replaced by N tabs.
     */
    enableIndentWithTabs: true,

    /**
     * @cfg {Boolean} enableSmartIndent Whether to use the context-sensitive indentation
     * that the mode provides (or just indent the same as the line before).
     */
    enableSmartIndent: true,

    /**
     * @cfg {Boolean} enableLineWrapping Whether CodeMirror should scroll or wrap for long lines.
     */
    enableLineWrapping: false,

    /**
     * @cfg {Boolean} enableLineNumbers Whether to show line numbers to the left of the editor.
     */
    enableLineNumbers: true,

    /**
     * @cfg {Boolean} enableGutter Can be used to force a 'gutter' (empty space on the left of the editor)
     * to be shown even when no line numbers are active. This is useful for setting markers.
     */
    enableGutter: false,

    /**
     * @cfg {Boolean} enableFixedGutter When enabled (off by default), this will make the gutter stay visible when the
     * document is scrolled horizontally.
     */
    enableFixedGutter: false,

    /**
     * @cfg {Boolean} <tt>true</tt> to highlight the current line cursor is on.
     */
    styleActiveLine: true,

    /**
     * @cfg {Number} firstLineNumber At which number to start counting lines.
     */
    firstLineNumber: 1,

    /**
     * @cfg {Boolean} readOnly <tt>true</tt> to mark the field as readOnly.
     */
    readOnly: false,

    /**
     * @cfg {Number} pollInterval How quickly (miliseconds) CodeMirror should poll its input textarea for changes.
     * Most input is captured by events, but some things, like IME input on some browsers, doesn't generate events
     * that allow CodeMirror to properly detect it. Thus, it polls.
     */
    pollInterval: 100,

    /**
     * @cfg {Number} indentUnit How many spaces a block (whatever that means in the edited language) should be indented.
     */
    indentUnit: 2,

    /**
     * @cfg {Number} tabSize The width of a tab character.
     */
    tabSize: 2,

    /**
     * @cfg {String} theme The theme to style the editor. You must make sure the CSS file defining the corresponding
     * .cm-s-[name] styles is loaded (see the theme directory in the distribution). The default is "default", for which
     * colors are included in codemirror.css. It is possible to use multiple theming classes at once—for example
     * "foo bar" will assign both the cm-s-foo and the cm-s-bar classes to the editor.
     */
    theme: 'sailpoint',

    /**
     * @property {String} cmPath The path to the codemirror root directory.  Used to generate paths to the mode, theme,
     * and addon dirs.
     */
    cmPath: '../scripts/codemirror-4.3',

    /**
     * @property {integer} viewportMargin Specifies the amount of lines that are rendered above and below the part of
     * the document that's currently scrolled into view.
     * Can be set to Infinity to make sure the whole document is always rendered, and thus the browser's text
     * search works on it. This will have bad effects on performance of big documents.
     */
    viewportMargin: Infinity,

    /**
     * @property {Boolean}
     */
    autoCloseTags: false,

    /**
     * @cfg {Array} listModes Define here what modes do you want to show in the selection list of the toolbar
     */
    listModes: [
        {
            text: 'XML',
            mime: 'application/xml'
        },
        {
            text: 'JSON',
            mime: 'application/json'
        },
        {
            text: 'JavaScript',
            mime: 'text/javascript'
        },
        {
            text: 'HTML mixed',
            mime: 'text/html'
        },
        {
            text: 'CSS',
            mime: 'text/css'
        },
        {
            text: '#{msgs.cm_mode_plain_text}',
            mime: 'text/plain'
        },
        {
            text: 'Java',
            mime: 'text/x-java'
        },
        {
            text: 'Rule',
            mime: 'text/rule'
        }
    ],

    /**
     * @cfg {Array} gutters Define here which gutter objects that you want included.
     */
    gutters: [ 'CodeMirror-linenumbers' ],

    /**
     * @cfg {Boolean} foldGutter Define here if you want to display fold gutters.
     * If you do make sure you add "CodeMirror-foldgutter" to the gutters config
     * array.
     */
    foldGutter: false,

    /**
     * @property {Array} modes Define here mode script dependencies; When choosing a specific mode the script
     * files are automatically loaded
     */
    modes: [
        {
            mime: ['text/plain', 'text/rule'],
            dependencies: []
        },
        {
            mime: ['text/javascript', 'application/json'],
            dependencies: ['javascript/javascript.js']
        },
        {
            mime: ['application/xml'],
            dependencies: ['xml/xml.js']
        },
        {
            mime: ['text/html'],
            dependencies: ['xml/xml.js', 'javascript/javascript.js', 'css/css.js', 'htmlmixed/htmlmixed.js']
        },
        {
            mime: ['text/css'],
            dependencies: ['css/css.js']
        },
        {
            mime: ['text/x-java'],
            dependencies: ['clike/clike.js']
        }
    ],

    /**
     * @cfg {Array} listThemes Define here what themes you want available in the selection list of the toolbar
     */
    listThemes: [
        {text: '#{msgs.cm_theme_none}', name: ''},
        {text: 'SailPoint', name: 'sailpoint'},
        {text: '3024 Day', name: '3024-day'},
        {text: '3024 Night', name: '3024-night'},
        {text: 'Ambiance', name: 'ambiance'},
        {text: 'Blackboard', name: 'blackboard'},
        {text: 'Cobalt', name: 'cobalt'},
        {text: 'Eclipse', name: 'eclipse'},
        {text: 'Erlang Dark', name: 'erlang-dark'},
        {text: 'Elegant', name: 'elegant'},
        {text: 'Lesser Dark', name: 'lesser-dark'},
        {text: 'MBO', name: 'mbo'},
        {text: 'MDN Like', name: 'mdn-like'},
        {text: 'Midnight', name: 'midnight'},
        {text: 'Monokai', name: 'monokai'},
        {text: 'Neat', name: 'neat'},
        {text: 'Neo', name: 'neo'},
        {text: 'Night', name: 'night'},
        {text: 'Paraiso Light', name: 'paraiso-light'},
        {text: 'Paraiso Dark', name: 'paraiso-dark'},
        {text: 'Pastel on Dark', name: 'pastel-on-dark'},
        {text: 'Ruby Blue', name: 'rubyblue'},
        {text: 'Solarized', name: 'solarized'},
        {text: 'The Matrix', name: 'the-matrix'},
        {text: 'Tomorrow Night 80\'s', name: 'tomorrow-night-eighties'},
        {text: 'Twilight', name: 'twilight'},
        {text: 'Vibrant Ink', name: 'vibrant-ink'},
        {text: 'XQ Light', name: 'xq-light'},
        {text: 'XQ Dark', name: 'xq-dark'}
    ],

    themesLoaded: ['sailpoint'],

    scriptsLoaded: [],

    lastMode: '',

    initComponent: function() {
        var me = this;

        me.addEvents(
            /**
             * @event initialize
             * Fires when the editor is fully initialized (including the iframe)
             * @param {Ext.ux.form.field.CodeMirror} this
             */
            'initialize',
            /**
             * @event activate
             * Fires when the editor is first receives the focus. Any insertion must wait
             * until after this event.
             * @param {Ext.ux.form.field.CodeMirror} this
             */
            'activate',
            /**
             * @event deactivate
             * Fires when the editor looses the focus.
             * @param {Ext.ux.form.field.CodeMirror} this
             */
            'deactivate',
            /**
             * @event change
             * Fires when the content of the editor is changed.
             * @param {Ext.ux.form.field.CodeMirror} this
             * @param {String} newValue New value
             * @param {String} oldValue Old value
             * @param {Array} options
             */
            'change',
            /**
             * @event modechanged
             * Fires when the editor mode changes.
             * @param {Ext.ux.form.field.CodeMirror} this
             * @param {String} newMode New mode
             * @param {String} oldMode Old mode
             */
            'modechanged',
            /**
             * @event cursoractivity
             * Fires when the cursor or selection moves, or any change is made to the editor content.
             * @param {Ext.ux.form.field.CodeMirror} this
             */
            'cursoractivity',
            /**
             * @event gutterclick
             * Fires whenever the editor gutter (the line-number area) is clicked.
             * @param {Ext.ux.form.field.CodeMirror} this
             * @param {Number} lineNumber Zero-based number of the line that was clicked
             * @param {Object} event The raw mousedown event
             */
            'gutterclick',
            /**
             * @event scroll
             * Fires whenever the editor is scrolled.
             * @param {Ext.ux.form.field.CodeMirror} this
             */
            'scroll',
            /**
             * @event update
             * Fires whenever CodeMirror updates its DOM display.
             * @param {Ext.ux.form.field.CodeMirror} this
             */
            'update',
            /**
             * @event keypress
             * Fired when CodeMirror is handling a DOM event of this type. You can preventDefault the event,
             * or give it a truthy codemirrorIgnore property, to signal that CodeMirror should do no further handling.
             * @param {Ext.ux.form.field.CodeMirror} this
             * @param {Object} event The key event
             */
            'keypress',
            /**
             * @event keydown
             * Fired when CodeMirror is handling a DOM event of this type. You can preventDefault the event,
             * or give it a truthy codemirrorIgnore property, to signal that CodeMirror should do no further handling.
             * @param {Ext.ux.form.field.CodeMirror} this
             * @param {Object} event The key event
             */
            'keydown',
            /**
             * @event keyup
             * Fired when CodeMirror is handling a DOM event of this type. You can preventDefault the event,
             * or give it a truthy codemirrorIgnore property, to signal that CodeMirror should do no further handling.
             * @param {Ext.ux.form.field.CodeMirror} this
             * @param {Object} event The key event
             */
            'keyup'
        );

        me.callParent(arguments);

        me.initLabelable();
        me.initField();

        /*
         Fix resize issues as suggested by user koblass on the Extjs forums
         http://www.sencha.com/forum/showthread.php?167047-Ext.ux.form.field.CodeMirror-for-Ext-4.x&p=860535&viewfull=1#post860535
         */
        me.on('resize', me.onFieldResize, me);

        // Configure multiplexing mode for editing Rule configs.
        if(CodeMirror.multiplexingMode) {
            CodeMirror.defineMode('Rule', function(config, parserConfig) {
                return CodeMirror.multiplexingMode(
                    CodeMirror.getMode(config, 'application/xml'),
                    {
                        open: '<Source>',
                        close: '</Source>',
                        mode: CodeMirror.getMode(config, 'text/x-java'),
                        delimStyle: 'delimit'
                    }
                );
            });
            CodeMirror.defineMIME('text/rule', 'rule');
        }
    },

    getMaskTarget: function() {
        return this.bodyEl;
    },

    /**
     * @private override
     */
    getSubTplData: function() {
        var me = this,
            cssPrefix = Ext.baseCSSPrefix;

        return {
            $comp: me,
            cmpId: me.id,
            id: me.getInputId(),
            toolbarWrapCls: cssPrefix + 'html-editor-tb',
            textareaCls: cssPrefix + 'hidden',
            editorCls: cssPrefix + 'codemirror ' + me.editorWrapCls,
            editorName: Ext.id(),
            size: 'height:100px;width:100%'
        };
    },

    /**
     * @private override
     */
    afterRender: function() {
        var me = this;

        me.callParent(arguments);

        me.inputEl = me.editorEl;
        me.initEditor();
        // Test if the folding library is loaded before inserting the gutter
        if(typeof me.editor.getOption('foldOptions') !== 'undefined') {
            me.gutters.unshift('CodeMirror-foldgutter');
        }
        // If the custom theme is loaded, insert it just after 'None' in the combo and set the current theme.
        var cust = Ext.util.CSS.getRule('.cm-s-custom span.cm-meta');
        if(cust) {
            // Check if we've already added this from a previous instance.
            if(me.listThemes[1].name !== 'custom') {
                me.listThemes.splice(1, 0, {
                    text: '#{msgs.cm_theme_custom}',
                    name: 'custom'
                });
            }
        }
        me.createToolbar();
        if(cust) {
            if(me.theme === 'sailpoint') {
                var tc = Ext.getCmp('themeCombo');
                if(tc) {
                    tc.setValue('custom');
                }
            }
        }
    },

    onFieldResize: function() {
        var me = this;

        if (me.editor) {
            me.editor.refresh();
        }
    },

    /**
     * @private override
     */
    initEditor: function() {
        var me = this,
            mode = me.mode || 'text/plain';

        // if no mode is loaded we could get an error like "Object #<Object> has no method 'startState'"
        // search mime to find script dependencies
        var item = me.getMime(me.mode);
        if (item) {
            mode = me.getMimeMode(me.mode);
            if (!mode) {
                mode = 'text/plain';
            }
        }

        me.editor = CodeMirror(me.editorEl.dom, {
            matchBrackets: me.enableMatchBrackets,
            electricChars: me.enableElectricChars,
            autoClearEmptyLines: true,
            value: me.rawValue || '',
            indentUnit: me.indentUnit,
            smartIndent: me.enableSmartIndent,
            indentWithTabs: me.indentWithTabs,
            pollInterval: me.pollInterval,
            lineNumbers: me.enableLineNumbers,
            lineWrapping: me.enableLineWrapping,
            firstLineNumber: me.firstLineNumber,
            tabSize: me.tabSize,
            gutter: me.enableGutter,
            fixedGutter: me.enableFixedGutter,
            theme: me.theme,
            gutters: me.gutters,
            foldGutter: me.foldGutter,
            matchTags: me.matchTags,
            extraKeys: me.extraKeys,
            viewportMargin: me.viewportMargin,
            mode: mode,
            autoCloseTags: me.autoCloseTags,
            hintOptions: me.hintOptions,
            styleActiveLine: me.styleActiveLine
        });

        // CodeMirror doesn't allow "scope" to be given to the event handler so we workaround it
        me.editor.parentField = me;
        me.editor.on('change', me.onEditorChange);
        me.editor.on('cursorActivity', me.onEditorCursorActivity);
        me.editor.on('gutterClick', me.onEditorGutterClick);
        me.editor.on('focus', me.onEditorFocus);
        me.editor.on('blur', me.onEditorBlur);
        me.editor.on('scroll', me.onEditorScroll);
        me.editor.on('update', me.onEditorUpdate);
        me.editor.on('keypress', me.onEditorKeypress);
        me.editor.on('keydown', me.onEditorKeydown);
        me.editor.on('keyup', me.onEditorKeyup);

        me.setMode(me.mode);
        me.setReadOnly(me.readOnly);
        me.fireEvent('initialize', me);

        // change the codemirror css
        var css = Ext.util.CSS.getRule('.CodeMirror');
        if (css) {
            css.style.height = '100%';
            css.style.position = 'relative';
            css.style.overflow = 'hidden';
        }
        css = Ext.util.CSS.getRule('.CodeMirror-Scroll');
        if (css) {
            css.style.height = '100%';
        }

    },

    /**
     * @private
     */
    onEditorChange: function(editor, changeObj) {
        var me = editor.parentField;
        me.checkChange();
    },

    /**
     * @private
     */
    onEditorCursorActivity: function(editor) {
        var me = editor.parentField;
        me.fireEvent('cursoractivity', me);
    },

    /**
     * @private
     */
    onEditorGutterClick: function(editor, line, gutter, event) {
        var me = editor.parentField;
        me.fireEvent('gutterclick', me, line, gutter, event);
    },

    /**
     * @private
     */
    onEditorFocus: function(editor) {
        var me = editor.parentField;
        me.fireEvent('activate', me);
    },

    /**
     * @private
     */
    onEditorBlur: function(editor) {
        var me = editor.parentField;
        me.fireEvent('deactivate', me);
    },

    /**
     * @private
     */
    onEditorScroll: function(editor) {
        var me = editor.parentField;
        me.fireEvent('scroll', me);
    },

    /**
     * @private
     */
    onEditorUpdate: function(editor) {
        var me = editor.parentField;
        me.fireEvent('update', me);
    },

    /**
     * @private
     */
    onEditorKeypress: function(editor, event) {
        var me = editor.parentField;

        event.cancelBubble = true; // fix suggested by koblass user on Sencha forums (http://www.sencha.com/forum/showthread.php?167047-Ext.ux.form.field.CodeMirror-for-Ext-4.x&p=862029&viewfull=1#post862029)
        me.fireEvent('keypress', me, event);
    },

    /**
     * @private
     */
    onEditorKeydown: function(editor, event) {
        var me = editor.parentField;

        event.cancelBubble = true; // fix suggested by koblass user on Sencha forums (http://www.sencha.com/forum/showthread.php?167047-Ext.ux.form.field.CodeMirror-for-Ext-4.x&p=862029&viewfull=1#post862029)
        me.fireEvent('keydown', me, event);
    },

    /**
     * @private
     */
    onEditorKeyup: function(editor, event) {
        var me = editor.parentField;

        event.cancelBubble = true; // fix suggested by koblass user on Sencha forums (http://www.sencha.com/forum/showthread.php?167047-Ext.ux.form.field.CodeMirror-for-Ext-4.x&p=862029&viewfull=1#post862029)
        me.fireEvent('keyup', me, event);
    },


    /**
     * @private
     */
    createToolbar: function() {
        var me = this,
            items = [],
            tipsEnabled = Ext.tip.QuickTipManager && Ext.tip.QuickTipManager.isEnabled(),
            baseCSSPrefix = Ext.baseCSSPrefix;

        function btn(id, toggle, handler) {
            return {
                itemId: id,
                cls: baseCSSPrefix + 'btn-icon',
                iconCls: baseCSSPrefix + 'edit-' + id,
                enableToggle: toggle !== false,
                scope: me,
                handler: handler || me.relayBtnCmd,
                clickEvent: 'mousedown',
                tooltip: tipsEnabled ? me.buttonTips[id] || undefined : undefined,
                overflowText: me.buttonTips[id].title || undefined,
                tabIndex: -1
            };
        }

        // line numbers button
        if (me.showLineNumbers) {
            items.push(btn('insertorderedlist', false));
        }

        // line wrap button
        if (me.showLineWrapButton) {
            items.push(btn('insertlinewrapping', true));
        }

        // Test if the folding library is loaded before inserting the button
        if(typeof this.editor.getOption('foldOptions') !== 'undefined') {
            items.push(btn('insertcodefolding', false));
        }

        items.push(btn('insertcodeindenting', false));

        if (me.showModes || me.showThemeSelect) {
            items.push('->');
        }

        if (me.showModes) {
            var modeCombo = {
                xtype: 'combo',
                fieldLabel: '#{msgs.cm_label_mode}',
                store: SailPoint.Store.createStore({
                    fields: [ 'mime', 'text' ],
                    data: me.listModes
                }),
                queryMode: 'local',
                displayField: 'text',
                valueField: 'mime',
                labelAlign: 'right',
                labelWidth: null,
                value: me.mode,
                listeners: {
                    change: function(el, newVal) {
                        me.setMode(newVal);
                    },
                    afterRender: function() {
                        me.modesSelect = this.value;
                    }
                }
            };

            items.push(modeCombo);
        }

        if (me.showThemeSelect) {
            var combo = {
                xtype: 'combo',
                id: 'themeCombo',
                fieldLabel: '#{msgs.cm_label_theme}',
                store: SailPoint.Store.createStore({
                    fields: [ 'name', 'text' ],
                    data: me.listThemes
                }),
                queryMode: 'local',
                displayField: 'text',
                valueField: 'name',
                labelAlign: 'right',
                labelWidth: null,
                value: me.theme,
                listeners: {
                    change: function(el, newVal) {
                        me.setTheme(newVal);
                    }
                }
            };

            if(me.showModes) {
                items.push(' ');
            }
            items.push(combo);
        }

        me.toolbar = Ext.create('Ext.toolbar.Toolbar', {
            id: me.id + '-toolbar',
            cls: Ext.baseCSSPrefix + 'html-editor-tb',
            renderTo: me.toolbarEl,
            enableOverflow: true,
            items: items,
            listeners: {
                click: function(e) {
                    e.preventDefault();
                },
                element: 'el'
            }
        });

        if (items.length === 0) {
            me.toolbar.hide();
        }

        me.updateToolbarButtons();
    },

    getToolbar: function() {
        return this.toolbar;
    },

    updateToolbarButtons: function() {
        var btns,
            me = this,
            toolbar = me.getToolbar();

        try {
            if(toolbar) {
                btns = toolbar.items.map;
                if (me.showLineNumbers) {
                    btns['insertorderedlist'].toggle(me.enableLineNumbers);
                }
                if (me.showLineWrapButton) {
                    btns['insertlinewrapping'].toggle(me.enableLineWrapping);
                }
                if (me.foldGutter) {
                    btns['insertcodefolding'].toggle(me.foldGutter);
                }
            }
        } catch (err) {
            //TODO remove this console.log
            console.log('error in updateToolbarButtons: ', err);
        }
    },

    /**
     * @private
     */
    relayBtnCmd: function(btn) {
        this.relayCmd(btn.getItemId());
    },

    /**
     * @private
     */
    relayCmd: function(cmd) {
        Ext.defer(function() {
            var me = this;
            me.editor.focus();
            switch (cmd) {
                // line numbers
                case 'insertorderedlist':
                    me.doChangeLineNumbers();
                    break;

                case 'insertlinewrapping':
                    me.doChangeLineWrap();
                    break;

                case 'insertcodefolding':
                    me.doChangeCodeFolding();
                    break;

                case 'insertcodeindenting':
                    me.doFullAutoIndent();
                    break;
            }
        }, 10, this);
    },

    doChangeLineNumbers: function() {
        var me = this;
        me.enableLineNumbers = !me.enableLineNumbers;
        me.editor.setOption('lineNumbers', me.enableLineNumbers);
    },

    doChangeLineWrap: function() {
        var me = this;
        me.enableLineWrapping = !me.enableLineWrapping;
        me.editor.setOption('lineWrapping', me.enableLineWrapping);
    },

    doChangeCodeFolding: function() {
        var me = this;
        me.foldGutter = !me.foldGutter;
        me.editor.setOption('foldGutter', me.foldGutter);
    },

    doFullAutoIndent: function() {
        var me = this,
            curPos = me.editor.getCursor(null);
        me.editor.execCommand('selectAll');
        me.editor.execCommand('indentAuto');
        me.editor.setSelection(curPos);
        me.editor.setCursor(curPos);
    },

    /**
     * @private
     */
    getMime: function(mime) {
        var i, item,
            me = this,
            found = false;

        for (i = 0; i < me.modes.length; i++) {
            item = me.modes[i];
            if (Ext.isArray(item.mime)) {
                if (Ext.Array.contains(item.mime, mime)) {
                    found = true;
                    break;
                }
            }
            else {
                if (item === mime) {
                    found = true;
                    break;
                }
            }
        }

        return found ? item : null;
    },

    /**
     * @private
     */
    loadDependencies: function(item, path, handler, scope) {
        var i, me = this;

        me.scripts = [];
        me.scriptIndex = -1;

        var onLoadFunction = function(options) {
            var j, ok = true;
            for (j = 0; j < me.scripts.length; j++) {
                if (me.scripts[j].called) {// this event could be raised before one script if fetched
                    ok = ok && me.scripts[j].success;
                    if (me.scripts[j].success && !Ext.Array.contains(me.scriptsLoaded, me.scripts[j].url)) {
                        me.scriptsLoaded.push(me.scripts[j].url);
                    }
                }
                else {
                    ok = false;
                }
            }
            if (ok) {
                handler.call(scope || me.editor);
            }
        };

        // load the dependencies
        for (i = 0; i < item.dependencies.length; i++) {
            if (!Ext.Array.contains(me.scriptsLoaded, path + '/' + item.dependencies[i])) {
                var options = {
                    url: path + '/' + item.dependencies[i],
                    index: ++me.scriptIndex,
                    onLoad: onLoadFunction
                };

                me.scripts[me.scriptIndex] = {
                    url: options.url,
                    success: true,
                    called: false,
                    options: options,
                    onLoad: options.onLoad || Ext.emptyFn,
                    onError: options.onError || Ext.emptyFn
                };
            }
        }
        for (i = 0; i < me.scripts.length; i++) {
            me.loadScript(me.scripts[i].options);
        }
    },

    /**
     * @private
     */
    loadScript: function(options) {
        var me = this;
        Ext.Ajax.request({
            url: options.url,
            scriptIndex: options.index,
            success: function(response, options) {
                var script = 'Ext.getCmp("' + this.id + '").scripts[' + options.scriptIndex + ']';
                window.setTimeout('try { ' + response.responseText + ' } catch(e) { ' + script + '.success = false; ' +
                    script + '.onError(' + script + '.options, e); };  ' + script + '.called = true; if (' +
                    script + '.success) ' + script + '.onLoad(' + script + '.options);', 0);
            },
            failure: function(response, options) {
                var script = this.scripts[options.scriptIndex];
                script.success = false;
                script.called = true;
                script.onError(script.options, response.status);
            },
            scope: me
        });
    },

    /**
     * @private
     * Return mode depending on the mime; If the mime is not loaded then return null
     *
     * @param mime
     */
    getMimeMode: function(mime) {
        return CodeMirror.mimeModes[mime];
    },

    /**
     * Change the CodeMirror mode to the specified mime.
     *
     * @param {String} mime The MIME value according to the CodeMirror documentation
     */
    setMode: function(mime) {
        var me = this;

        // search mime to find script dependencies
        var item = me.getMime(mime);

        if (!item) {
            // mime not found
            return;
        }

        var mode = me.getMimeMode(mime);

        if (!mode) {
            me.loadDependencies(item, me.cmPath + '/mode', function() {
                var mode = me.getMimeMode(mime);
                if (typeof mode === 'string') {
                    me.editor.setOption('mode', mime);
                }
                else {
                    me.editor.setOption('mode', mode);
                }
            });
        }
        else {
            if (typeof mode === 'string') {
                me.editor.setOption('mode', mime);
            }
            else {
                me.editor.setOption('mode', mode);
            }
        }

        try {
            me.fireEvent('modechanged', me, mime, me.lastMode);
        }
        catch (err) {}

        me.lastMode = mime;
    },

    /**
     * Dynamically load the theme CSS
     *
     * @param theme
     */
    setTheme: function(theme){
        var me = this,
            loadTheme = !Ext.Array.contains(me.themesLoaded, theme);

        if(loadTheme && theme) {
            Ext.ux.Loader.load([me.cmPath + '/theme/' + theme + '.css'], function(){
                me.themesLoaded.push(theme);
                me.editor.setOption('theme', theme);
            });
        }
        else {
            me.editor.setOption('theme', theme);
        }
    },

    /**
     * Set the editor as read only
     *
     * @param {Boolean} readOnly
     */
    setReadOnly: function(readOnly) {
        var me = this;

        if (me.editor) {
            me.editor.setOption('readOnly', readOnly);
            me.disableItems(readOnly);
        }
    },

    onDisable: function() {
        this.bodyEl.mask();
        this.callParent(arguments);
    },

    onEnable: function() {
        this.bodyEl.unmask();
        this.callParent(arguments);
    },

    disableItems: function(disabled) {
        var toolbar = this.getToolbar();
        if(toolbar) {
            toolbar.items.each(function(item) {
                item.setDisabled(disabled);
            });
        }
    },

    /**
     * Sets a data value into the field and runs the change detection.
     *
     * @param {Mixed} value The value to set
     * @return {Ext.ux.form.field.CodeMirror} this
     */
    setValue: function(value) {
        var me = this;
        me.mixins.field.setValue.call(me, value);
        me.rawValue = value;
        if (me.editor) {
            me.editor.setValue(value);
        }
        return me;
    },

    /**
     * Return submit value to the owner form.
     * @return {Mixed} The field value
     */
    getSubmitValue: function() {
        return this.getValue();
    },

    /**
     * Return raw value to the owner form.
     * @return {Mixed} The field value
     */
    getRawValue: function() {
        return this.getValue();
    },

    /**
     * Return the value of the CodeMirror editor
     * @return {Mixed} The field value
     */
    getValue: function() {
        var me = this;
        return me.editor ? me.editor.getValue() : null;
    },

    /**
     * @private
     */
    onDestroy: function() {
        var me = this,
            prop;

        me.un('resize', me.onFieldResize, me);

        if (me.rendered) {
            try {
                delete(me.editor.parentField);
                me.editor.un('change', me.onEditorChange);
                me.editor.un('cursorActivity', me.onEditorCursorActivity);
                me.editor.un('gutterClick', me.onEditorGutterClick);
                me.editor.un('focus', me.onEditorFocus);
                me.editor.un('blur', me.onEditorBlur);
                me.editor.un('scroll', me.onEditorScroll);
                me.editor.un('update', me.onEditorUpdate);
                me.editor.un('keypress', me.onEditorKeypress);
                me.editor.un('keydown', me.onEditorKeydown);
                me.editor.un('keyup', me.onEditorKeyup);

                for (prop in me.editor) {
                    if (me.editor.hasOwnProperty(prop)) {
                        delete me.editor[prop];
                    }
                }
            } catch (e) {
            }
            Ext.destroyMembers('toolbar', 'editorEl');
        }
        me.callParent();
    },

    /**
     * Object collection of toolbar tooltips for the buttons in the editor. The key
     * is the command id associated with that button and the value is a valid QuickTips object.
     * These are taken from the HtmlEditor to avoid including additional css.
     * @type Object
     */
    buttonTips: {
        insertorderedlist: {
            title: "#{msgs.cm_tip_line_number_title}",
            text: "#{msgs.cm_tip_line_number_text}",
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
        },
        insertlinewrapping: {
            title: "#{msgs.cm_tip_line_wrap_title}",
            text: "#{msgs.cm_tip_line_wrap_text}",
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
        },
        insertcodefolding: {
            title: "#{msgs.cm_tip_folding_title}",
            text: "#{msgs.cm_tip_folding_text}",
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
        },
        insertcodeindenting: {
            title: "#{msgs.cm_tip_indent_title}",
            text: "#{msgs.cm_tip_indent_text}",
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
        }
    }

});
