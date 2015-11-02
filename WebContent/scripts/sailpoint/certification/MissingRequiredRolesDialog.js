Ext.define('SailPoint.certification.MissingRequiredRolesDialog', {
	extend : 'SailPoint.certification.BaseDecisionDialog',

    delegationReviewMessage:null,
    commentsRequired:false,
	
	constructor : function(config) {
		var me = this;
		
		Ext.apply(this, {
			buttons : [
				{
	                text:"#{msgs.cert_decision_button_provision}",
	                handler: function() {
	                    me.provision();
	                }
	            },
	            {
	                text:"#{msgs.cert_decision_button_dont_provision}",
	                handler: function() {
	                    me.approveWithoutProvisioning();
	                }
	            },
	            {
	                text:"#{msgs.cert_decision_button_perm_or_req_roles_continue}",
	                hidden:true,
	                handler: function() {
	                    me.nextPage();
	                }
	            },
	            {
	                text:"#{msgs.cert_decision_button_perm_or_req_roles_cancel}",
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

        this.setHeight(375);

        this.form = new Ext.form.Panel({
            style:'padding:15px;background-color:#fff' ,
            border:false,
            bodyBorder:false,
            autoScroll:true,
            items:[
                {
                	xtype : 'assigneeselector',
                    quickAssignOptions : [['', '']],
                    fieldLabel:'#{msgs.recipient}',
                    afterLabelTextTpl: "<span style='color:red'>*</span>",
                    id:'missingRolesAssignee',
                    allowBlank:false,
                    msgTarget:'under',
                    baseParams: {context: 'Owner'}
                },
                new Ext.form.TextArea({
                    id:'missingRolesComments',
                    fieldLabel:'#{msgs.label_comments}',
                    name: 'missingRolesComments',
                    allowBlank:!this.commentsRequired,
                    msgTarget:'under',
                    width:473,
                    height:190
                }),
                new Ext.Panel({
                    id : 'missingRolesProvisioningMessage',
                    hidden:true,
                    border:false, bodyBorder:false,
                    html:"<div id='missingRolesProvisioningMessageContent' class='informationPanel'></div>"
                })
            ]
        });

		this.wizard = new Ext.Panel({
            layout:'card',
            activeItem:0,
	        items:[
	            new Ext.Panel({
                    items:[
                        this.form
                    ]
                })
	         ]
	    });

        this.items = [
        	this.wizard
        ];

        this.callParent(arguments);
    },

    // --------------------------------------------------------
    //
    //  Button Click Handlers
    //
    // --------------------------------------------------------

    provision : function(){
    	var buttons = this.getBottomToolbar().items;
        buttons.getAt(0).hide();
        buttons.getAt(1).hide();
        buttons.getAt(2).show();
        this.decision.provisionMissingRoles = true;
        this.nextPage();
    },


    approveWithoutProvisioning : function(){

        if (this.commentsRequired){
        	var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;
            buttons.getAt(0).hide();
            buttons.getAt(1).hide();
            buttons.getAt(2).show();
            this.decision.provisionMissingRoles = false;
            this.nextPage();
        } else {
            this.save();
        }
    },

    // --------------------------------------------------------
    //
    //  Pagination
    //
    // --------------------------------------------------------

    nextPage : function(){
       this.currentPage++;
       var pages = this.wizard.items.getCount();
       if (this.currentPage < pages){
           this.showMask();
           this.reloadSummaryDetails();
       } else {
           this.save();
       }
    },

     reloadSummaryDetails : function(){

        var id = this.certificationItem.getId();
        var certId = this.decision.certificationId;
        var url = Ext.String.format("/rest/certification/item/{0}/missingRolesAdvice?workItemId=" +
                this.decision.workItemId, id);

        Ext.Ajax.request({
          scope:this,
          url: SailPoint.getRelativeUrl(url),
          success: function(response){

            var respObj = Ext.decode(response.responseText).object;

            // Populate the quick assignment combo box
            var assignmentCmp = Ext.getCmp('missingRolesAssignee');
            var assignmentOpts = respObj.assignmentOptions;
            if (assignmentCmp && assignmentOpts && assignmentOpts.length > 0){
                var records = [];
                assignmentOpts.each(function(item){
                    var arr = [item.identity, item.description];
                    records.push(arr);
                });
                assignmentCmp.quickAssign.getStore().loadData(records, false);
            }

            var comments = this.decision.comments ? this.decision.comments : respObj.comments;
            var ownerName = this.decision.recipient;
            var ownerDisplayName = this.decision.recipientDisplayName;

            // We don't pass these items to the grid in the initial ajax load
            if (this.decision.isSaved()){
                comments = respObj.comments;
            }

            if (!this.decision.recipient && respObj.owner){
                ownerName = respObj.owner.name;
                ownerDisplayName = respObj.owner.displayName;
            }

            // If we don't have the display name for the owner, check to see
            // if we can pull it from the response
            if (!ownerDisplayName && respObj.owner && respObj.owner.name == this.decision.recipient){
                ownerDisplayName = respObj.owner.displayName;
            }

            var commentsInput = Ext.getCmp('missingRolesComments');
            commentsInput.setValue(comments ? comments : "");
            commentsInput.setDisabled(this.isReadOnly);
            commentsInput.clearInvalid();

            if (!respObj.defaultRemediator){
                assignmentCmp.assigneeSuggest.setValue(ownerName ? ownerName : "");
                var rawValue = ownerDisplayName ? ownerDisplayName : ownerName;
                assignmentCmp.assigneeSuggest.setRawValue(rawValue ? rawValue : "");
                assignmentCmp.assigneeSuggest.setDisabled(this.isReadOnly);
                assignmentCmp.assigneeSuggest.clearInvalid();
                this.showField(assignmentCmp);
            }else {
                this.hideField(assignmentCmp);
            }

            if (respObj.remediationAction == "SendProvisionRequest"){
                var provisioners = "";
                if (respObj.provisioners && respObj.provisioners.length > 1){
                    provisioners = respObj.provisioners.join(", ");
                } else {
                    provisioners = respObj.provisioners[0];
                }

                var provMsg = Ext.String.format("#{msgs.missing_roles_automatic_remediation_confirmation}", provisioners);
                Ext.fly('missingRolesProvisioningMessageContent').dom.innerHTML = provMsg;

                this.showField(Ext.getCmp('missingRolesProvisioningMessage'));
                this.hideField(Ext.getCmp('missingRolesAssignee'));
                this.hideField(Ext.getCmp('missingRolesComments'));
            } else {
                this.hideField(Ext.getCmp('missingRolesProvisioningMessage'));
                this.showField(Ext.getCmp('missingRolesAssignee'));
                this.showField(Ext.getCmp('missingRolesComments'));
            }

            this.hideMask();
            this.wizard.getLayout().setActiveItem(this.currentPage);
          },
          /**
          * Throws up a sys err msg. Note that this is not called when
          * success==false in the response, but if the call returns a 404 or 500.
          */
          failure: function(response){
              this.hideMask();
              SailPoint.Decider.getInstance().gridIds.each(function(gridId){
                    var grid = Ext.getCmp(gridId);
                    grid.unmask();
              });
              this.cancel();
              SailPoint.FATAL_ERR_ALERT.call(this);
          }
        });

    },


    // --------------------------------------------------------
    //
    //  Standard BaseDecisionDialog Methods
    //
    // --------------------------------------------------------

    validateForm : function(){
        var valid = true;

        var assignmentCmp = Ext.getCmp('missingRolesAssignee');
        if (this.decision.provisionMissingRoles && !assignmentCmp.hidden){
            valid = assignmentCmp.validate();
        }

        if (this.commentsRequired){
            var commentsInput = Ext.getCmp('missingRolesComments');
            valid = commentsInput.validate();
        }

        return valid;
    },

    /**
     * This is called right before the dialog is displayed. This
     * should reset the dialog state to it's default state.
     */
    reset : function(){
    	var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;
        buttons.getAt(0).show();
        buttons.getAt(1).show();
        buttons.getAt(2).hide();

        this.currentPage = 0;

        if (this.wizard.getLayout().setActiveItem)
            this.wizard.getLayout().setActiveItem(this.currentPage);
	},

    /**
     * This is called right before the dialog is displayed but after
     * it has been reset. This should pre-populate any form fields.
     * If you need to call out to the server for more info, do it here.
     *
     * NOTE: Remember to fire initComplete when you're done init'ing
     */
    init : function(){

        this.baseInit();

        var itemId = this.certificationItem.getId();
        var roleId = this.certificationItem.getRoleId();

        var titleTpl = new Ext.Template("#{msgs.cert_decision_title_provision}");
        this.setTitle(titleTpl.apply([this.certificationItem.getDescription()]));

        var message = "";
        message += '<span class="missingRoleIcon sectionHeader"  style="margin-left:5px;">&nbsp;&nbsp;&nbsp;&nbsp;Missing Required Roles</span>';
        message += '<div style="margin:5px 5px 5px 8px;">';
        message += ' <span>#{msgs.cert_decision_dialog_prov_desc}</span>';
        message += '</div>';

        var delegationReviewPanel = Ext.getCmp('assignedRoleGridDelegationReviewDetails');
        if (this.decision.requiresDelegationReview == true){
            var delegationOwner = this.certificationItem.getDelegationReviewOwner();
            var delegationOwnerName = delegationOwner && delegationOwner.displayName ? delegationOwner.displayName :
                     delegationOwner && delegationOwner.name ? delegationOwner.name : "";
            var msg = "#{msgs.cert_decision_accept_delegate_remediation}";
            this.delegationReviewMessage = Ext.String.format(msg, delegationOwnerName);
        }

        // if the this is the first time the dialog has been opened the permitedAndRequirementsPanel
        // will not yet have been added to the items list, so we should add it. Otherwise
        // we can replace the existing permitedAndRequirementsPanel with out new instance
        var doRemove = this.wizard.items.indexOfKey("permsAndReqs") > -1;
        if (doRemove){
            this.wizard.remove("permsAndReqs", true);
        }

        // todo need to refactor this panel so it has a reload() method or somesuch,
		// rather than having to create a new instance every time
        var permitedAndRequirementsPanel = Ext.create('SailPoint.role.DetailsPanel', {
                id:'permsAndReqs',
                initialDetailsText : message,
                identityId : this.certificationItem.getIdentityId(),
                certItemId : itemId,
                roleId : roleId,
                flagMissingRoles : true,
                rootVisible: true,
                roleHierarchyRoot: {
                	id: RoleNode.REQUIREMENTS,
                    roleId: RoleNode.REQUIREMENTS,
                    text: '#{msgs.role_detail_section_requirements}',
                    expanded: true
                },
                title :'#{msgs.role_detail_tab_permits_reqs}',
                height : 250,
                hideCloseButton:true,
                listeners : {
                    'closePanel':{
                        fn:function() {
                            this.hide();
                        }, scope:this
                    }
                }
            });

        this.wizard.insert(0, permitedAndRequirementsPanel);

        this.wizard.getLayout().setActiveItem(0);

        this.fireEvent('initComplete');
	},


    getDecision : function(){

        var comments = Ext.getCmp('missingRolesComments').getValue();
        this.decision.comments = comments;

        if (this.decision.provisionMissingRoles == true){
            var assignmentCmp = Ext.getCmp('missingRolesAssignee');
            this.decision.recipient = assignmentCmp.assigneeSuggest.getValue();
            this.decision.recipientDisplayName = assignmentCmp.assigneeSuggest.getRawValue();
        } else {
            this.decision.recipient = null;
            this.decision.recipientDisplayName = null;
        }

        this.decision.dialogState.push("MissingRolesDialog");
        return this.decision;
    }
});


/**
  * Used by the Decider to either create a new instance or re-use an
  * existing one.
 */

SailPoint.certification.MissingRequiredRolesDialog.getInstance = function(commentsRequired){
    var dialog = SailPoint.certification.BaseDecisionDialog.baseGetInstance(
            SailPoint.certification.MissingRequiredRolesDialog,
                        {id:'missingRequiredRolesDialog', commentsRequired:commentsRequired}
    );
    dialog.commentsRequired = commentsRequired;
    return dialog;
};

