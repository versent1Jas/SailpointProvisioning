/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */
/**
 * @class SailPoint.form.ExtendedAttributeFilter
 * @extends Ext.form.ComboBox
 */
Ext.define('SailPoint.form.ExtendedAttributeFilter', {
    extend : 'SailPoint.form.MultiText',
    alias : 'widget.extattrfilter',

    andOr : null,

    constructor: function(config) {

        // THe value is persisted as a list
        var value = config.value && config.value.length ? config.value[0] : config.value;
        var querySelection = 'and';
        if (value){
            var selections = value['selections'];
            if (selections && selections.length > 0){
                for(var i=0;i<selections.length;i++){
                    selections[i] = {id:selections[i], displayName:selections[i]};
                }
            }
            
            if (value['operator']) {
                querySelection = value['operator'];
            }

            config.value = selections;
        }

        this.callParent(arguments);

        this.andOr = new Ext.form.RadioGroup({
            id: 'radio-' + config.id,
            fieldLabel: "#{msgs.ext_attr_filter_label}",
            margin:'5 0 0 0',
            items: [
                { boxLabel: "#{msgs.ext_attr_filter_and}", name: 'op-radio-' + config.id, inputValue: 'and', checked: querySelection=='and'},
                { boxLabel: "#{msgs.ext_attr_filter_or}", name: 'op-radio-'+ config.id, inputValue: 'or', checked: querySelection!=='and'}
            ],
            getSelectedValue : function(){
                var val = this.getValue();
                return val['op-' + this.id];
            }
        });

        this.items.add(this.andOr);
    },

    getValue : function (){

        var selections = this.callParent();
        if (selections && selections.length > 0){
            var result = {};
            result['selections']=selections;
            result['operator'] = this.andOr.getSelectedValue();
        }
        return result;
    }

});