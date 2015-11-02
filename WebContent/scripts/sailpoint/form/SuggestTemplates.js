/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */


/**
 * @class SailPoint.form.SuggestTemplates
 *
 * Given a class name returns the combo box template and the
 * model fields required to render a suggest.
 */
Ext.define('SailPoint.form.SuggestTemplates', {
    statics : {
        getConfiguration : function(suggestClass){

            var conf = null;

            if (suggestClass === 'sailpoint.object.Identity' || suggestClass === 'Identity'){
                conf = {
                   comboTemplate :  '<tpl for="."><div class="identitySearch {icon}">'
                       + '<div class="sectionHeader iconComboItem">{displayableName:htmlEncode}</div>'
                       + '<div class="extraIndentedColumn">{name:htmlEncode}</div>'
                       + '<div class="extraIndentedColumn {emailclass}">{email:htmlEncode}</div></div></tpl>',
                   extraFields : [
                       "email",
                       "name",
                       "emailclass",
                       "lastname",
                       "displayableName",
                       "firstname",
                       "managerStatus"
                   ]
               }
            }

            return conf;
        }
    }

});
