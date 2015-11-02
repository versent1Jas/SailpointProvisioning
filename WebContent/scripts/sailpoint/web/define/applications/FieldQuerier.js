/**
 * This is a common mixin used to return a dom input field in hairy situations like using
 * ui:repeat in jsf pages.  When a repeat is used in a jsf page, the child jsf components
 * are assigned a unique id which can no longer be used to look up the field value based
 * on formName:inputId. When a repeat is used the id of the input element becomes something
 * like formName:uniqueJSFComponentIterationId:inputId, hence things like $('formName:inputId')
 * no longer return a dom element.
 */
Ext.define('SailPoint.define.applications.FieldQuerier', {

    /**
     * @see #getFields
     */
    getField: function(field, sectionDiv, cssSelector) {
        return this.getFields(field, sectionDiv, cssSelector)[0];
    },

    /**
     * This method performs dom queries and returns an array of elements, or empty array if no elements
     * match the selected input. The first query matches the sectionDiv and should be more
     * expensive as it queries the entire page. The second query uses the first query as its root
     * element to return a subset of the elements using the cssSelector parameter. If some
     * portion of the id matches the field parameter that element will be returned.
     *
     * @param field the suffix of the field you are looking for
     * @param sectionDiv the id of the parent element you are looking for, i.e. '#tabSettings_'
     * @param cssSelector the selector used to further filter the field you are looking for, i.e. 'input[type="text"]'
     * @return the array of dom elements that matches the input parameters passed
     */
    getFields: function(field, sectionDiv, cssSelector) {
        var rootDiv = Ext.query(sectionDiv), listChecks = Ext.query(cssSelector, rootDiv),
            fieldReturn = [];

        Ext.each(listChecks, function(item, index, allItems) {
            // not adding spNamespace, jsf seems to be stripping the namespace during the render phase.
            // we should be safe finding one checkboxSuffix as we are querying from a root div element.
            if (item.id.indexOf(field) !== -1) {
                fieldReturn.push(item);
            }
        });

        return fieldReturn;
    },

    /**
     * Returns the value from the getField method or null if the field was not found.
     * @see #getFields
     */
    getFieldValue: function(field, sectionDiv, cssSelector) {
        var vSectionDiv = (sectionDiv) ? sectionDiv : '#tabSettings_';
        vCssSelector = (cssSelector) ? cssSelector: 'input[type="text"]',
            vField = this.getField(field, vSectionDiv, vCssSelector),
            val = null;

        if ( vField ) {
            val = vField.value;
        }
        return val;
    }

});