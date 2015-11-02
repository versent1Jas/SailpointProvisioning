Ext.define('SailPoint.HtmlEditor', {
    extend : 'Ext.form.HtmlEditor',
  
  charLimit : 1024,
  
  initComponent:function() {
      
    Ext.apply(this,{
      enableFont:false,
      enableAlignments:false,
      enableFontSize:false,
      enableLinks:false,
      enableKeyEvents:true,
      enableColors:false,
      cls: 'htmlEditor'
    });
    
    if(!Ext.isDefined(this.sourceEdit) || !this.sourceEdit) {
        Ext.apply(this, {
            enableSourceEdit : false
        });
    }
    
    if(!Ext.isDefined(this.disableCounter) || !this.disableCounter) {
        Ext.apply(this, {
            plugins: [Ext.create('SailPoint.HtmlEditorCounterPlugin', {
                charLimit : this.charLimit,
                bodyElement : this.bodyEl
            })]
        });
    }
    
    this.callParent(arguments);
  },

  getCleanValue: function() {
    return this.trimValue(this.getValue());
  },
  
  /** Get rid of pasted stuff **/
  cleanHtml: function(text) {
    text = this.callParent(arguments);
    var removals = [/&nbsp;/ig, /[\r\n]/g, /<(xml|style|img)[^>]*>.*?<\/\1>/ig, /<\/?(meta|object|span)[^>]*>/ig,
        /<\/?[A-Z0-9]*:[A-Z]*[^>]*>/ig, /(lang|class|type|href|name|title|id|clear)=\"[^\"]*\"/ig, /style=(\'\'|\"\")/ig, /<![\[-].*?-*>/g, 
        /MsoNormal/g, /<\\?\?xml[^>]*>/g, /<\/?o:p[^>]*>/g, /<\/?v:[^>]*>/g, /<\/?o:[^>]*>/g, /<\/?st1:[^>]*>/g, /&nbsp;/g, 
        /<\/?SPAN[^>]*>/ig, /<\/?FONT[^>]*>/ig,  /<\/?H1[^>]*>/ig, /<\/?H2[^>]*>/ig, /<\/?H3[^>]*>/ig, /<\/?H4[^>]*>/ig,
        /<\/?H5[^>]*>/ig, /<\/?H6[^>]*>/ig, /<\/?P[^>]*><\/P>/ig, /<!--(.*)-->/g, /<!--(.*)>/g, /<!(.*)-->/g, /<\\?\?xml[^>]*>/g,
        /<\/?o:p[^>]*>/g, /<\/?v:[^>]*>/g, /<\/?o:[^>]*>/g, /<\/?st1:[^>]*>/g, /style=\"[^\"]*\"/ig, /style=\'[^\"]*\'/ig, /lang=\"[^\"]*\"/g,
        /lang=\'[^\"]*\'/g, /class=\"[^\"]*\"/ig, /class=\'[^\"]*\'/ig, /type=\"[^\"]*\"/g, /type=\'[^\"]*\'/g, /href=\'#[^\"]*\'/ig,
        /href=\"#[^\"]*\"/ig, /name=\"[^\"]*\"/ig, /name=\'[^\"]*\'/ig, / clear=\"all\"/ig, /id=\"[^\"]*\"/ig, /title=\"[^\"]*\"/ig,
        /<span[^>]*>/ig, /<\/?span[^>]*>/ig, /<title>(.*)<\/title>/ig, /class=/ig, /<meta[^>]*>/ig, /<link[^>]*>/ig, /<style>(.*)<\/style>/ig,
        /onclick=\"[^\"]*\"/ig, /onblur=\"[^\"]*\"/ig, /onchange=\"[^\"]*\"/ig, /onclick=\"[^\"]*\"/ig, /ondblclick=\"[^\"]*\"/ig, /onerror=\"[^\"]*\"/ig,
        /onfocus=\"[^\"]*\"/ig, /onkeydown=\"[^\"]*\"/ig, /onkeypress=\"[^\"]*\"/ig, /onkeyup=\"[^\"]*\"/ig, /onload=\"[^\"]*\"/ig, /onmousedown=\"[^\"]*\"/ig,
        /onmousemove=\"[^\"]*\"/ig, /onmouseout=\"[^\"]*\"/ig, /onmouseover=\"[^\"]*\"/ig, /onmouseup=\"[^\"]*\"/ig, /onresize=\"[^\"]*\"/ig, /onselect=\"[^\"]*\"/ig,
        /onunload=\"[^\"]*\"/ig,
        /<w:[^>]*>(.*)<\/w:[^>]*>/g, /<A[^>]*>/ig, /<\/?A[^>]*>/ig, /<img[^>]*>/ig];

    // Chrome collapses multiple html style tags into a css style attribute.
    // That doesn't play nice with the the above regex, so convert them
    // back to individual tags first.
    text = this.convertStyleToTags(text);

    Ext.each(removals, function(s){
      text = text.replace(s, "");
    });
    
    // keep the divs in paragraphs
    text = text.replace(/<div[^>]*>/g, "");
    text = text.replace(/<\/?div[^>]*>/g, "");
    text = text.replace(/<DIV[^>]*>/g, "");
    text = text.replace(/<\/?DIV[^>]*>/g, "");
    text = text.replace(/^\s+|\s+$/g,"");
    
    if(text === "<br>" || text === "<br/>") {
      text = "";
    }

    return text;
  },

    // Convert css style attributes into their respective html tags.
    // (based on http://stackoverflow.com/questions/10325624/convert-css-style-rules-to-html-elements-and-vice-versa)
    convertStyleToTags : function(str) {
        if(str.length === 1 || str.match(/style=(\'|\")/ig) === null) {
            return str;
        }

        var CSS2HTML = {
            "bold" : "b",
            "italic" : "i",
            "underline" : "u"
            },
            i, children, node, styleAttr, styleVal, len,
            root = Ext.DomHelper.createDom({html:"<html><body>" + str.replace(/&nbsp;/ig, " ") + "</body></html>"});

        if(!root) {
            return str;
        }

        children = root.childNodes;
        len = children.length;
        for (i = 0; i < len; i++) {
            node = children[i];
            if(node.nodeType === node.ELEMENT_NODE) {
                this.processStyleAttr(node, CSS2HTML);
            }
        }
        return root.innerHTML;
    },

    processStyleAttr : function(node, CSS2HTML) {
        if(node == null) {
            return;
        }
        if(!Ext.isDefined(node.item)) {
            node = [node]; // if it's not a NodeList
        }
        for(var key in node) {
            if(node.hasOwnProperty(key) && key !== "length") {
                var n = node[key];
                if(n.nodeType === n.ELEMENT_NODE) {
                    if(n.childNodes) {
                        this.processStyleAttr(n.childNodes, CSS2HTML); // recursion baby!
                    }
                    var styleAttr = n.getAttributeNode("style");
                    if(styleAttr !== null) {
                        var styleVal = styleAttr.value || "";
                        for (var style in CSS2HTML) {
                            if (CSS2HTML.hasOwnProperty(style)) {
                                var elName = CSS2HTML[style];
                                if (styleVal.indexOf(style) > -1) {
                                    var el = document.createElement(elName);
                                    for (var kids = n.childNodes, j = kids.length; j--;){
                                        el.insertBefore(kids[j], el.firstChild);
                                    }
                                    n.appendChild(el);
                                }
                            }
                        }
                        n.removeAttributeNode(styleAttr);
                    }
                }
            }
        }
    },
  
  trimValue : function(text) {
    var newValue = text;
    if(this.charLimit && this.charLimit !== 0 && newValue && (newValue.length > this.charLimit)) {
      //Trim a little extra space so we can add closing tags if needed
      newValue = newValue.substr(0, (this.charLimit - 20));
    }
    
    return newValue;
  },

  fixKeys : function(){
    if(Ext.isIE){
        return function(e){
            var k = e.getKey(),
                doc = this.getDoc(), 
                    r;
            if(k == e.TAB){
                e.stopEvent();
                r = doc.selection.createRange();
                if(r){
                    r.collapse(true);
                    r.pasteHTML('&nbsp;&nbsp;&nbsp;&nbsp;');
                    this.deferFocus();
                }
            }else if(k == e.ENTER){
                r = doc.selection.createRange();
                if(r){
                    var target = r.parentElement();
                    if(!target || target.tagName.toLowerCase() != 'li'){
                        e.stopEvent();
                        r.pasteHTML('<br />');
                        r.collapse(false);
                        r.select();
                    }
                }
            }   
        };      
    }else if(Ext.isOpera){
        return function(e){
            var k = e.getKey();
            if(k == e.TAB){
                e.stopEvent();
                this.win.focus();
                this.execCmd('InsertHTML','&nbsp;&nbsp;&nbsp;&nbsp;');
                this.deferFocus();
            }
        };
    }else if(Ext.isWebKit){
        return function(e){
            var k = e.getKey();
            if(k == e.TAB){
                e.stopEvent();
                this.execCmd('InsertText','\t');
                this.deferFocus();
            }else if(k == e.ENTER){
                e.stopEvent();
                var doc = this.getDoc();
                if (doc.queryCommandState('insertorderedlist') ||
                    doc.queryCommandState('insertunorderedlist')) {
                  this.execCmd('InsertHTML', '</li><br /><li>');
                } else {
                  this.execCmd('InsertHtml','<br /><br />');
                }
                this.deferFocus();
            }
         };
    }
  }
});
