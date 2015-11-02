/**
 * This is the dialog we generate when a user chooses to
 * allow an exception.
 */
Ext.define('SailPoint.certification.AssignedRoleRemediationDialog', {
	extend : 'SailPoint.certification.BaseDecisionDialog',

    form:null,
    
    constructor : function(config) {
    	Ext.apply(this, {
    		buttons : [
				{
				    // note this is updated during init()
				    text:"#{msgs.cert_decision_button_perm_or_req_roles_revoke}",
				    parent:this,
				    handler: function() {
						this.parent.nextPage();
				    }
				},
				{
	                text:'#{msgs.cert_delegation_review_button_accept}',
	                parent:this,
	                handler: function() {
	                    this.parent.acceptDelegationReview();
	                }
	            },
	            {
	                text:"#{msgs.cert_delegation_review_button_reject}",
	                parent:this,
	                handler: function() {
	                    this.parent.rejectDelegationReview();
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
        this.setHeight(425);
        
        this.form = new Ext.form.Panel({
            style:'padding:5px;background-color:#fff' ,
            border:false,
            bodyBorder:false,
            autoScroll:true,
            items:[
                 new Ext.Panel({
                    id : 'assignedRoleDelegationReviewDetails',
                    border:false, 
                    bodyBorder:false,
                    anchor:'95%',
                    html:"<div class='informationPanel' style='margin:20px'>#{msgs.cert_decision_accept_delegate_comments_decision}</div>"
                }),
                {
                	xtype : 'assigneeselector',
                    quickAssignOptions : [['', '']],
                    anchor:'95%',
                    fieldLabel:'#{msgs.recipient}',
                    afterLabelTextTpl: "<span style='color:red'>*</span>",
                    id:'assignedRoleRemediationAssignee',
                    allowBlank:false,
                    msgTarget:'under',
                    baseParams: {context: 'Owner'}
                },
                new Ext.form.TextArea({
                    id:'assignedRoleRemediationComments',
                    fieldLabel:'#{msgs.label_comments}',
                    name: 'remediationComments',
                    anchor:'95%',
                    height:190
                }),
                new Ext.Panel({
                    id : 'assignedRoleProvisioningMessage',
                    hidden:true,
                    border:false, 
                    bodyBorder:false,
                    anchor:'95%',
                    html:"<div id='assignedRoleProvisioningMessageContent' class='informationPanel'></div>"
                })
            ]
        });

        this.revokeGrid = new SailPoint.PermitsAndReqsGrid({
            height:258,
            title:'#{msgs.cert_decision_select_permitted_roles}'
        });

        this.revokeGrid.getStore().on('load', function(store, records, options){
            this.rolesLoaded(records);
        }, this);

		this.wizard = new Ext.Panel({
	    	layout:'card',
	    	activeItem:0,
	        items:[
	            this.revokeGrid,
	            new Ext.Panel({
	                  layout:'fit',
                    border:false, 
                    bodyBorder:false,
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

    rolesLoaded : function(records){

        // Clear out any selections saved on the grid.
        this.revokeGrid.selModel.deselectAll();

        this.hasRecords = records && records.length > 0;
        if (this.hasRecords){
            this.revokeGrid.getStore().each(function(record){

                var selected = record.get('selected')===true;
                if (this.decision.revokedRoles){
                    selected = this.decision.revokedRoles.indexOf(record.getId()) > -1;
                }
                if (selected){
                    this.revokeGrid.getSelectionModel().select(record);
                }
            }, this);
        }

        // if there are no records and we're not viewing the
        // decision details (!readOnly),
        // we can close the dialog
        if (!this.decision.readOnly && !this.hasRecords){
            this.save();
        } else {
            this.fireEvent('readyForDisplay');
        }
    },

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

    /**
     * Resets the dialog with the current decision.
     */
    reset : function(){
        this.currentPage = 0;

        var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;

        buttons.getAt(0).show();
        buttons.getAt(1).hide();
        buttons.getAt(2).hide();
        if (Ext.getCmp('assignedRoleDelegationReviewDetails'))
            this.hideField(Ext.getCmp('assignedRoleDelegationReviewDetails'));

        if (this.wizard.getLayout().setActiveItem)
            this.wizard.getLayout().setActiveItem(this.currentPage);
    },

    init : function(){

        this.baseInit();
        
        var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;

        if (this.decision.requiresDelegationReview){
            buttons.getAt(0).setText("#{msgs.button_continue}");
        } else {
            buttons.getAt(0).setText("#{msgs.cert_decision_button_perm_or_req_roles_revoke}");
        }

        var titleTpl = new Ext.Template("#{msgs.cert_decision_title_revoke_perms_and_reqs}");
        this.setTitle(titleTpl.apply([this.certificationItem.getDescription()]));

        this.revokeGrid.setCheckboxHiddenState(this.isReadOnly);

        this.callParent(arguments);
    },

    /**
     * Validate the form. This is called before the dialog is submitted
     */
    validateForm : function(){

        var valid = true;

        if (this.hasRecords === false) {
            return true;
        }
        
        var assignmentCmp = Ext.getCmp('assignedRoleRemediationAssignee');
        if (!assignmentCmp.hidden){
            valid = assignmentCmp.validate();
        }

        return valid;
    },

    /**
     * This is called to get the updated decision record,
     * updated with any changes made by the user's input.
     */
    getDecision : function(){

        var commentsInput = Ext.getCmp('assignedRoleRemediationComments');
        this.decision.comments = commentsInput.getValue();

        var assignmentCmp = Ext.getCmp('assignedRoleRemediationAssignee');
        this.decision.recipient = assignmentCmp.assigneeSuggest.getValue();
        this.decision.recipientDisplayName = assignmentCmp.assigneeSuggest.getRawValue();

        this.decision.revokedRoles = this.revokeGrid.getSelectedIds();
        this.decision.bundleAssignmentId = this.getBundleAssignmentId();

        this.decision.dialogState.push("AssignedRoleRemediationDialog");

        return this.decision;
    },

    /**
     * This returns the first assigned id from the list of selected required/permitted roles
     * Essentially, only the roles associated with this assigned role that are assigned/detected
     * on the user will all have the same assigned id - otherwise the dialog and selection would not
     * have had to have been made.
     **/

    getBundleAssignmentId : function() {
		var items = this.revokeGrid.selModel.getSelection();
		var returnId = "";
		for (i = 0; i < items.length; i++) {
			var item = items[i];
			returnId = item.raw.assignmentId;
			break;
		}

		return returnId;
	},

    verifyDialogIsReady : function(){
        this.revokeGrid.getStore().applyPathParams([this.certificationItem.getId(), this.decision.workItemId]);
        this.revokeGrid.getStore().load();
    },

    /**
     * Based on the remediation, we may need to get
     * remediation details from the server.
     */
    reloadSummaryDetails : function(){
        var id = this.certificationItem.getId()
        var certId = this.decision.certificationId;
        var url = Ext.String.format("/rest/certification/item/{0}/summary?workItemId={1}", id, this.decision.workItemId);

        Ext.Ajax.request({
          scope:this,
          method:'POST',
          url: SailPoint.getRelativeUrl(url),
          success: function(response){

            var respObj = Ext.decode(response.responseText).object;

            // Populate the quick assignment combo box
            var assignmentCmp = Ext.getCmp('assignedRoleRemediationAssignee');
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
            var description = this.decision.description ? this.decision.description : respObj.description;
            var ownerName = this.decision.recipient;
            var ownerDisplayName = this.decision.recipientDisplayName;

            // We don't pass these items to the grid in the initial ajax load
            if (this.decision.isSaved()){
                comments = respObj.comments;
                description = respObj.description;
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

            var commentsInput = Ext.getCmp('assignedRoleRemediationComments');
            commentsInput.setValue(comments ? comments : "");
            commentsInput.setDisabled(this.isReadOnly);

            assignmentCmp.assigneeSuggest.setValue(ownerName ? ownerName : "");
            var rawValue = ownerDisplayName ? ownerDisplayName : ownerName;
            assignmentCmp.assigneeSuggest.setRawValue(rawValue ? rawValue : "");
            assignmentCmp.assigneeSuggest.setDisabled(this.isReadOnly);
            assignmentCmp.assigneeSuggest.clearInvalid();
            
            var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;
            // show the delegation review buttons if necessary
            if (this.decision.requiresDelegationReview){
                buttons.getAt(0).hide();
                buttons.getAt(1).show();
                buttons.getAt(2).show();
                this.showField(Ext.getCmp('assignedRoleDelegationReviewDetails'));
            } else {
                if (this.isReadOnly){
                    buttons.getAt(0).hide();
                } else {
                    buttons.getAt(0).show();
                }
                buttons.getAt(1).hide();
                buttons.getAt(2).hide();
                this.hideField(Ext.getCmp('assignedRoleDelegationReviewDetails'));
            }

            if (respObj.remediationAction == "SendProvisionRequest"){
                var provisioners = "";
                if (respObj.provisioners && respObj.provisioners.length > 1){
                    provisioners = respObj.provisioners.join(", ");
                } else if (respObj.provisioners && respObj.provisioners.length == 1){
                    provisioners = respObj.provisioners[0];
                } else {
                    provisioners = "#{msgs.identityiq}";
                }

                var provMsg = Ext.String.format("#{msgs.automatic_remediation_confirmation}", provisioners);
                Ext.fly('assignedRoleProvisioningMessageContent').dom.innerHTML = provMsg;

                this.showField(Ext.getCmp('assignedRoleProvisioningMessage'));
                this.hideField(Ext.getCmp('assignedRoleRemediationAssignee'));
                this.hideField(Ext.getCmp('assignedRoleRemediationComments'));
            } else {
                this.hideField(Ext.getCmp('assignedRoleProvisioningMessage'));
                if (this.revokeGrid.getSelectedIds().length > 0 && !respObj.defaultRemediator){
                    this.showField(Ext.getCmp('assignedRoleRemediationAssignee'));
                }else {
                    this.hideField(Ext.getCmp('assignedRoleRemediationAssignee'));
                }
                this.showField(Ext.getCmp('assignedRoleRemediationComments'));
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
          },
          params:{
              details : Ext.encode(this.revokeGrid.getSelectedIds())
          }
        });

    }

});

/**
  * Used by the Decider to either create a new instance or re-use an
  * existing one.
 */
SailPoint.certification.AssignedRoleRemediationDialog.getInstance = function(){
    var dialog = SailPoint.certification.BaseDecisionDialog.baseGetInstance(
            SailPoint.certification.AssignedRoleRemediationDialog,
                        {id:'assignedRoleRemediationDialog'});
    return dialog;
};

Ext.define('SailPoint.PermitsAndReqsGrid', {
	extend : 'SailPoint.grid.PagingCheckboxGrid',

    initComponent : function() {

        Ext.applyIf(this, {
            border:false,
            bodyBorder:false,
            selModel:new SailPoint.grid.CheckboxSelectionModel({}),
            viewConfig : {stripeRows: true},
            height:181,
            closable:false
        });

        this.columns = [
            {"name":"name","dataIndex":"displayableName","flex":1,"header":"#{msgs.cert_decision_revoke_reqs_tbl_hdr_role}", 'sortable':true},
            {"name":"relationshipType","dataIndex":"relationshipType","flex":1,"header":"#{msgs.cert_decision_revoke_reqs_tbl_hdr_type}", 'sortable':true}
        ];

        this.store = SailPoint.Store.createRestStore({
            storeId:'PermitsAndReqsGrid',
            url: SailPoint.getRelativeUrl('/rest/certification/item/{0}/revokableRoles?workItemId={1}'),
            remoteSort:false,
            defaultSort:'name',
            sorters : [{property : "displayableName", direction: "ASC" }],
            fields:['id','name', 'displayableName', 'selected','relationshipType']
        });

        this.viewConfig.emptyText = "#{msgs.cert_decision_no_perm_req_roles_selected}";

        this.callParent(arguments);
    }
});