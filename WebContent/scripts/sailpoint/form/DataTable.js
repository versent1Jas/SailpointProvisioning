/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Represents a table of name value pairs which can be added
 * to a form to provide additional context. You
 * may also include parameters which will be applied to the
 * text before it's rendered. In order to use the parameters
 * you'll need to use ext XTemplate notation.
 *
 */
Ext.define('SailPoint.form.DataTable', {
	extend : 'Ext.Component',
	alias : 'widget.datatable',

    tableWidth : '95%',

    labelWidth:'20%',

    /**
     * @cfg {Object}
     */
    value : null,

    constructor : function(config) {
    	this.callParent(arguments);
    },

    render : function(element){
        SailPoint.form.DataTable.superclass.render.apply(this, arguments);


        var htmlContent = this.html;
        var xtemp = new Ext.XTemplate(
            '<table width="{width}">',
            '<tpl for="items">',
            '<tr>',
            '<td width="{labelWidth}"><b>{key}</b></td>',
            '<td>{value}</td>',
            '</tr>',
            '</tpl>',
            '</table>'
        );

        var itemsList  = [];
        if (this.value){
            for (property in this.value) {
                itemsList.push({'key':property, 'value':this.value[property], 'labelWidth':this.labelWidth});
            }
        }

        htmlContent = xtemp.apply({'width' : this.tableWidth, 'items':itemsList});

        if (htmlContent){
            var elem = Ext.get(element);
            elem.insertHtml('beforeEnd', htmlContent);
        }

    }
});