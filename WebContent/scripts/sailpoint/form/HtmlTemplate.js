/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Represents a block of content that can be added to a form. You
 * may also include parameters which will be applied to the
 * text before it's rendered. In order to use the parameters
 * you'll need to use ext XTemplate notation.
 *
 */
Ext.define('SailPoint.form.HtmlTemplate', {
	extend : 'Ext.form.field.Display',
	alias : 'widget.htmltemplate',


    /**
     * @cfg html {String} html to markup to render in this component. This may use
     * ext XTemplate notation. We'll apply the templateParameters object to this
     * html before we display.
     */
    value:'',

    /**
     * @cfg templateParameters {Object} parameters to pass into the html template string.
     */
    templateParameters : null,

    isFormField : false,

    constructor : function(config) {

        if (config.fieldLabel)
            config.isFormField = true;
        
        config.html = config.value;
        if (config.templateParameters){
            var xtemp = new Ext.XTemplate(config.value);
            config.html = xtemp.apply(config.templateParameters);
        }
        
        this.callParent(arguments);
    }
    
});