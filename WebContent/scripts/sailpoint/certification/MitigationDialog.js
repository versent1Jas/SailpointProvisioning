
/**
 * This is the dialog we generate when a user chooses to
 * allow an exception.
 */
Ext.define('SailPoint.MitigationDialog', {
	extend : 'SailPoint.certification.BaseDecisionDialog',

    /**
     * @cfg {boolean} True if comments are required for mitigations in this certification.
     */
    commentsRequired : false,

    allowExpirationDateEdit : false,

    form:null,
    
    constructor : function() {
    	var me = this;
    	
    	Ext.apply(this, {
			buttons : [
				{
	                text:'#{msgs.cert_decision_mitigate}',
	                handler: function() {
	                    me.save();
	                }
	            },
	            {
	                text:'#{msgs.cert_delegation_review_button_accept}',
	                handler: function() {
	                    me.acceptDelegationReview();
	                }
	            },
	            {
	                text:"#{msgs.cert_delegation_review_button_reject}",
	                handler: function() {
	                    me.rejectDelegationReview();
	                }
	            },
	            {
	                text:"#{msgs.button_cancel}",
                    cls : 'secondaryBtn',
	                handler: function() {
	                    me.cancel();
	                }
	            }
			]
		});
    	
    	this.callParent(arguments);
    },

    initComponent:function() {

        this.setHeight(430);

        // Create the expiration type radio buttons. note that these
        // only show up in the Acknowledge decision is allowed
        var expireRadio = new Ext.form.Radio({name:'mitigateType', id:'mitigateTypeExpire', hideLabel:true});
        var expireOnCertRadio = new Ext.form.Radio({name:'mitigateType', id:'mitigateTypeCert',
            boxLabel:'#{msgs.violation_decision_acknowledge}',
            hideLabel:true, colspan:2
        });

        var expirationOptions = new Ext.form.FieldContainer({
            id: 'mitigationExpirationOptions',
            layout: {
            	type: 'table',
            	columns: 2
            },
            fieldLabel: '#{msgs.label_expiration}',
            items: [
                expireRadio,
                new Ext.form.DateField({
                    id:'mitigationExpirationDate',
                    name:'mitigationExpirationDate',
                    allowBlank:false ,
                    msgTarget:'under',
                    minValue:new Date()
                }),
                expireOnCertRadio
            ],

            setDisabled: function(isDisabled){
                var expireRadio = Ext.getCmp('mitigateTypeExpire');
                var expireNextCertRadio = Ext.getCmp('mitigateTypeCert');
                var expirationDate = Ext.getCmp('mitigationExpirationDate');

                expireRadio.setDisabled(isDisabled);
                expireNextCertRadio.setDisabled(isDisabled);
                expirationDate.setDisabled(isDisabled);
                
                Ext.form.FieldContainer.prototype.setDisabled.apply(this, arguments);
            },

            setExpiresNextCert: function(expiresNextCert){
                var expireRadio = Ext.getCmp('mitigateTypeExpire');
                var expireNextCertRadio = Ext.getCmp('mitigateTypeCert');
                var expirationDate = Ext.getCmp('mitigationExpirationDate');

                expireRadio.setValue(!expiresNextCert);
                expireNextCertRadio.setValue(expiresNextCert);

                if (expiresNextCert){
                    expirationDate.disable();
                } else {
                    expirationDate.enable();
                }
            },

            setValue: function(options){
                this.setExpiresNextCert(options.mitigationExpiresNextCert);
                var dateValue = options.mitigationExpirationDate;
                if (dateValue && typeof dateValue == 'number')
                    dateValue = SailPoint.Date.getDateFromMillis(dateValue);

                var expirationDate = Ext.getCmp('mitigationExpirationDate');
                expirationDate.setValue(dateValue);
            },

            getValue: function(){
                var expireNextCertRadio = Ext.getCmp('mitigateTypeCert');
                var expirationDate = Ext.getCmp('mitigationExpirationDate').getValue();
                return {
                    mitigationExpirationDate : expirationDate.getTime ? expirationDate.getTime() : null,
                    mitigationExpiresNextCert : expireNextCertRadio.getValue()
                };
            },

            handleAcknowledgement: function(allowAck){
                var expireRadio = Ext.getCmp('mitigateTypeExpire');
                var expireNextCertRadio = Ext.getCmp('mitigateTypeCert');

                if (allowAck){
                    expireRadio.show();
                    expireNextCertRadio.show();
                } else {
                    expireRadio.hide();
                    expireNextCertRadio.hide();
                }
            }
        });

        expireRadio.on('check', function(radio, isChecked){
            this.setExpiresNextCert(!isChecked);
        }, expirationOptions);

        expireOnCertRadio.on('check', function(radio, isChecked){
            this.setExpiresNextCert(isChecked);
        }, expirationOptions);

		this.items = [ {
			xtype : 'form',
			style : 'padding:15px;background-color:#fff',
			border : false,
			bodyBorder : false,
			items : [
					{
						xtype : 'panel',
						id : 'mitigationDelegationReviewDetails',
						hidden : true,
						border : false,
						bodyBorder : false,
						html : "<div id='mitigationDelegationReviewMsg' class='informationPanel' style='margin:20px'></div>"
					}, 
					expirationOptions, 
					{
						xtype : 'textarea',
						id : 'mitigationComments',
						fieldLabel : '#{msgs.label_comments}',
						name : 'mitigationComments',
						width : 450,
						allowBlank : !this.commentsRequired,
						msgTarget : 'under',
						height : 190
					} ]
		} ];

        this.callParent(arguments);
    },

    /**
	 * Resets the dialog with the current decision.
	 */
    reset : function(){

        this.isReadOnly = false;

        Ext.getCmp('mitigationComments').setValue('');
        var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;

        // reset button text in case we previously showed a delegation review
        buttons.getAt(0).setText("#{msgs.cert_decision_mitigate}");

		 // show the delegation review buttons if necessary
        if (this.decision.requiresDelegationReview){
            buttons.getAt(0).hide();
            buttons.getAt(1).show();
            buttons.getAt(2).show();
        } else {
            if (this.isReadOnly){
                buttons.getAt(0).hide();
            } else {
                buttons.getAt(0).show();
            }
            buttons.getAt(1).hide();
            buttons.getAt(2).hide();
        }
    },

    init : function(){

        this.baseInit();

        var title = "#{msgs.dialog_title_allow_exceptions}";
        if (this.certificationItem ){
            var isViolation = this.certificationItem.isPolicyViolation();
            var actionName = (isViolation) ? '#{msgs.cert_decision_allow_violation}' : '#{msgs.cert_decision_mitigate}';

            var titleTpl = new Ext.Template("#{msgs.bulk_action_win_title}");
            var description = this.certificationItem.getDescription();
            title = titleTpl.apply([actionName, description]);
        }

        this.setTitle(title);

        var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;
        buttons.getAt(0).text = actionName;

        var expDate = this.decision.mitigationExpirationDate;
        if (!expDate)
            expDate = this.certificationConfig.defaultMitigationExpiration;

        var expiration = Ext.getCmp('mitigationExpirationOptions');
        expiration.handleAcknowledgement(this.certificationItem && this.certificationItem.isAllowAcknowledgement());
        expiration.setValue({
            mitigationExpirationDate : expDate,
            mitigationExpiresNextCert : this.decision.mitigationExpiresNextCert
        });

        Ext.getCmp('mitigationComments').setValue(this.decision.comments);
        Ext.getCmp('mitigationComments').clearInvalid();

        // handle read-only dialogs
        if (this.isReadOnly || !this.allowExpirationDateEdit) {
          Ext.getCmp('mitigationExpirationOptions').setDisabled(true);
        }

        Ext.getCmp('mitigationComments').setDisabled(this.isReadOnly);

        // If the decision has been saved, we must go to the server
        // to get the details
        if (this.decision.isSaved()){

            var id = this.decision.selectionCriteria.selections[0];
            var certId = this.decision.certificationId;
            var url = Ext.String.format("/rest/certification/item/{0}/Mitigated", id);

            Ext.Ajax.request({
                scope:this,
                url: SailPoint.getRelativeUrl(url),
                success: function(response){

                    var respObj = Ext.decode(response.responseText).object;

                    var comments = respObj.comments;
                    Ext.getCmp('mitigationComments').setValue(comments ? comments : "");

                    var expiration = Ext.getCmp('mitigationExpirationOptions');
                    expiration.handleAcknowledgement(this.certificationItem.isAllowAcknowledgement());
                    expiration.setValue({
                        mitigationExpirationDate : respObj.mitigationExpiration,
                        mitigationExpiresNextCert : false
                    });

                    expiration.setDisabled(this.isReadOnly);

                    if (this.decision.requiresDelegationReview){
                        var delegationOwner = respObj.delegation.owner;
                        var msg = "#{msgs.cert_decision_accept_delegate_simple_decision}";
                        var formatted = Ext.String.format(msg, delegationOwner.displayName ? delegationOwner.displayName :
                                delegationOwner.name);
                        Ext.fly('mitigationDelegationReviewMsg').setHTML(formatted);

                        Ext.getCmp('mitigationDelegationReviewDetails').show();
                        buttons.getAt(0).setText("#{msgs.cert_delegation_review_button_accept}");
                    } else {
                        this.hideField(Ext.getCmp('mitigationDelegationReviewDetails'));
                    }

                    SailPoint.MitigationDialog.superclass.init.call(this);
                },
                /**
                * Throws up a sys err msg. Note that this is not called when
                * success==false in the response, but if the call returns a 404 or 500.
                */
                failure: function(response){
                	SailPoint.MitigationDialog.superclass.init.call(this);
                    SailPoint.FATAL_ERR_ALERT.call(this);
                }
            });
        }
        else {
        	this.callParent(arguments);
        }
    },

    /**
     * Validate the form. This is called before the dialog is submitted
     */
    validateForm : function(){

        var valid = true;

        var expirationOptions = Ext.getCmp('mitigationExpirationOptions').getValue();
        if (!expirationOptions.mitigationExpiresNextCert){
            var expirationDate = Ext.getCmp('mitigationExpirationDate');
            valid = expirationDate.validate();
        }

        if (!Ext.getCmp('mitigationComments').isValid())
            valid = false;

        return valid;
    },

    /**
     * This is called to get the updated decision record,
     * updated with any changes made by the user's input.
     */
    getDecision : function(){

        var expirationOptions = Ext.getCmp('mitigationExpirationOptions').getValue();
        var comments = Ext.getCmp('mitigationComments').getValue();

        this.decision.status = 'Mitigated';
        this.decision.comments = comments;
        this.decision.mitigationExpirationDate = expirationOptions.mitigationExpirationDate;
        this.decision.mitigationExpiresNextCert = expirationOptions.mitigationExpiresNextCert;
        this.decision.dialogState.push("MitigationDialog");
        this.decision.requiresDelegationReview = false;

        return this.decision;
    }
});


/**
  * Used by the Decider to either create a new instance or re-use an
  * existing one.
 */
SailPoint.MitigationDialog.getInstance = function(allowExpirationDateEdit, commentsRequired){
    var dialog = SailPoint.certification.BaseDecisionDialog.baseGetInstance(
            SailPoint.MitigationDialog,
            {id:'mitigationDialog', allowExpirationDateEdit:allowExpirationDateEdit, commentsRequired:commentsRequired}
    );
    dialog.commentsRequired = commentsRequired;
    return dialog;
};
