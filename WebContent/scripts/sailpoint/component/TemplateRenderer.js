/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns("SailPoint");

SailPoint.TemplateRenderer = function(config){
    this.tpl = config.tpl;
    this.responseNode = config.node;
};
SailPoint.TemplateRenderer.prototype = {
    /**
     * This is called when the transaction is completed and it's time to update the element - The BasicRenderer
     * updates the elements innerHTML with the responseText - To perform a custom render (i.e. XML or JSON processing),
     * create an object with a "render(el, response)" method and pass it to setRenderer on the Updater.
     * @param {Ext.Element} el The element being rendered
     * @param {Object} response The XMLHttpRequest object
     * @param {Updater} updateManager The calling update manager
     * @param {Function} callback A callback that will need to be called if loadScripts is true on the Updater
     */
     render : function(el, response, updateManager, callback){

        var templateParameter = null;
        var txt = response.responseText;
        if (response && response.responseText){
            templateParameter = Ext.decode(response.responseText);

            if (this.responseNode)
                templateParameter = templateParameter[this.responseNode];

            txt = this.tpl.apply(templateParameter);
        }

        el.update(txt, updateManager.loadScripts, callback);
    }
};
