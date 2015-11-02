/**
 * This is the dialog we generate when a user chooses to
 * save customer entity classification data.
 */
Ext.define('SailPoint.certification.EntityClassificationDialog', {
	extend : 'SailPoint.certification.BaseDecisionDialog',

    certificationId : null,
	
	constructor : function(config) {
		Ext.apply(this, {
			buttons : [
				{
				    text:"#{msgs.cert_decision_bulk_save_entity_custom_fields_btn}",
				    parent:this,
				    handler: function() {
				        this.parent.save();
				    }
				},
				{
	                text:"#{msgs.button_cancel}",
                    cls : 'secondaryBtn',
	                parent:this,
	                handler: function() {
	                    this.parent.cancel();
	                }
	            }
			]
		});
		this.callParent(arguments);
	},

    initComponent:function() {

        this.setTitle("#{msgs.dialog_title_bulk_save_entity_custom_fields}");

        Ext.applyIf(this, {
            width:600
        });

        this.items = [new Ext.Panel({
            id:'entityClassificationForm',
            border:false,bodyBorder:false,
            style:'padding:10px;background-color:#FFF',
            loader: {}
        })];

        this.callParent(arguments);
    },

    /**
     * Resets the dialog to it's default state
     */
    reset : function(){

    },

     /**
     * Resets the dialog to it's default state
     */
    init : function(){

        var panel = Ext.getCmp('entityClassificationForm');
        var contentUrl = SailPoint.getRelativeUrl("/manage/certification/bulkEntityClassificationForm.jsf?certificationId="
                         + this.certificationId);
        panel.getLoader().load({url:contentUrl, scripts: true});


        SailPoint.certification.EntityClassificationDialog.superclass.init.apply(this);
    },

    /**
     * Validate the form. This is called before the dialog is submitted
     */
    validateForm : function(){
        return true;
    },

    /**
     */
    getDecision : function(){

        this.decision.entityDecision = true;

        this.decision.dialogState.push("EntityClassificationDialog");

        if (SailPoint.getBulkCustomEntityValues){
            var data = SailPoint.getBulkCustomEntityValues();
            if (data){
                this.decision.custom1 = data.custom1;
                this.decision.custom2 = data.custom2;
                this.decision.overwriteCustomFields = data.overwriteCustomFields;
                if (data.customMap){
                    this.decision.custom = data.customMap;
                }
            }
        }
        /*
        var form = Ext.get('entityCustomForm').dom;
        var inputElements = Ext.query('input,select,textarea', form);
        for(var i=0;i<inputElements.length;i++){
            var element = inputElements[i];
            if (element.id == 'entityCustomForm:overwriteCustomFields'){
                this.decision.overwriteCustomFields = element.checked;
            } else if (element.id == 'entityCustomForm:custom1'){
                this.decision.custom1 = element.value;
            } else if (element.id == 'entityCustomForm:custom2'){
                this.decision.custom2 = element.value;
            } else if (element.id !== '' && element.id !== 'com.sun.faces.VIEW'){
                var property = element.id.substring(17, element.id.length);
                this.decision.addCustom(property, this.getElementValue(element));
            }
        }*/

        return this.decision;
    },

    getElementValue : function(element){

        if (element.type == 'checkbox'){
            return element.checked;
        }

        if (element.options){
            return element.options[element.selectedIndex].value;
        }

        return element.value;
    }


});

/**
  * Used by the Decider to either create a new instance or re-use an
  * existing one.
 */
SailPoint.certification.EntityClassificationDialog.getInstance = function(certId){
    var dialog = SailPoint.certification.BaseDecisionDialog.baseGetInstance(
            SailPoint.certification.EntityClassificationDialog,
                        {id:'entityClassificationDialog', certificationId:certId});
    return dialog;
};