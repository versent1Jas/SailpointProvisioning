/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Simple dialog which allows the user to cancel the workflow given
 * a task result id. The dialog allows the user to enter in comments
 * which will be stored with the cancel audit event
 */
Ext.define('SailPoint.lcm.CancelWorkflowDialog', {
	extend : 'Ext.Window',

    /**
     * @cfg {String} taskResultId ID of the taskResult whose workflow should be canceled
     */
    taskResultId : null,

    /**
     * @private reference to comments field.
     */
    commentsField : null,

    constructor : function(config) {

        this.commentsField = new Ext.form.TextArea({
            fieldLabel:'#{msgs.cancel_access_request_dialog_field_comments}',
            anchor: '90%',
            height:150
        });

        Ext.applyIf(config, {
            modal:true,
            title:'#{msgs.cancel_access_request_dialog_title}',
            width:500,
            height:300,
            layout:'form',
            labelAlign:'top',
            border:false,
            closable:false,
            bodyStyle:'background-color:#FFF;padding:10px',
            items:[
                {xtype: 'box', html:'#{msgs.cancel_access_request_dialog_instr}', style:'margin-bottom:10px',  border:false},
                this.commentsField
            ],
            buttons:[
                {text:'#{msgs.cancel_access_request_dialog_button_cancel}', handler:function(){
                    this.cancelWorkflow();
                }, scope:this},
                {text:'#{msgs.cancel_access_request_dialog_button_close}', cls : 'secondaryBtn', handler:function(){
                    this.destroy();
                }, scope:this}
            ]
        });

        this.callParent(arguments);
    },

    initComponent : function() {
        this.addEvents('workflowCanceled');
        this.callParent(arguments);
    },

    setMask: function(mask){

         if (mask){
             this.getDockedItems('toolbar')[0].disable();
            this.body.mask(Ext.LoadMask.prototype.msg, 'x-mask-loading');
         } else {
             this.getDockedItems('toolbar')[0].enable();
            this.body.unmask();
         }

	},

    cancelWorkflow : function(){
	  
      this.setMask(true);

      Ext.Ajax.request({
        scope:this,
        url: SailPoint.getRelativeUrl('/rest/identityRequests/cancelWorkflow'),
        success: function(response){
          var respObj = Ext.decode(response.responseText);
          if (respObj.success){
            this.fireEvent('workflowCanceled');
            this.destroy();                 
          } else {
            error = respObj.errors[0];
            SailPoint.FATAL_ERR_ALERT.call(this,error);
            this.destroy();              
          }
          
          return true;
			  },
			  /**
			   * Throws up a sys err msg. Note that this is not called when
			   * success==false in the response, but if the call returns a 404 or 500.
			   */
			  failure: function(response){
			    // alert(response);
			    this.setMask(false);
			    SailPoint.FATAL_ERR_ALERT.call(this);
			  },
			  params: {requestId:this.taskResultId,comments:this.commentsField.getValue()}
      });
    }
});
