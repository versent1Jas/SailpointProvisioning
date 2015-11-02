Ext.define ('SailPoint.HtmlEditorCounterPlugin', {
    extend: 'Ext.util.Observable',
    alias : 'plugin.htmleditorcounter',
    
    /* HtmlEditor */
    htmlEditor : null,
    
    /* Character limit */
    charLimit : 0,

    /* String format to use for counter div */
    counterLengthStringFormat: '#{msgs.html_editor_counter_text_format}',

    /* Div class for count less than limit */
    normalCls: 'htmlEditorCounter',
    
    /* Div class for count greater than limit */
    overLimitCls: 'htmlEditorCounterOverLimit',

    lastHtml: null,
    counterElement: null,
    
    onRender: function (o) {
        this.counterElement = Ext.DomHelper.append(this.htmlEditor.bodyEl,{
          tag : 'div',
          id : this.htmlEditor.getId() + '-counterDiv',
          cls: this.normalCls
        }, true);

        var cntr = 0,
            val = this.htmlEditor.value;
        if(val && (val !== " " && val !== "")){
            cntr = this.htmlEditor.cleanHtml(val).length;
        }
        this.setCount(cntr);
    },
    
    init: function (editor) {
        this.htmlEditor = editor;
        this.htmlEditor.on ('render', this.onRender, this);
        this.htmlEditor.on ('sync', this.checkCount, this);
        this.htmlEditor.on ('push', this.checkCount, this);
    },
    
    checkCount: function (o, html) {
        if (this.lastHtml !== html) {
            this.lastHtml = html;
            var cntr = 0;
            if(html && html !== " " && html !== "") {
                cntr = html.length;
            }
            this.setCount(cntr);
        }
    },
    
    setCount: function (count) {
        this.counterElement.setHTML(Ext.String.format(this.counterLengthStringFormat, count, this.charLimit));
        if (count > this.charLimit) {
            this.counterElement.addCls(this.overLimitCls);
        } else {
            this.counterElement.removeCls(this.overLimitCls);
        }
    }
});