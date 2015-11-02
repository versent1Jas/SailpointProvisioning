/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.MoveLinkForm', {
	extend : 'Ext.form.Panel',
	alias : 'widget.idlinkwindowform',

	newIdentityInput: null,

	identitySuggest: null,

	errorMsgPanel: null,

	defaults: {
    	bodyStyle:'padding:5px;font-size:12px',
    	border:false
    },

    layout: {
        type: 'table', 
        columns: 3
    },

	reset: function(){
		this.identitySuggest.setValue('');
		this.newIdentityInput.setValue('');
   		this.clearError();
   		this.unmask();
	},

	mask:function(){
		this.getEl().mask(Ext.LoadMask.prototype.msg, 'x-mask-loading');
	},

	unmask:function(){
		this.getEl().unmask();
	},

    setError:function(error, errorMsg){
        this.errorMsgPanel.show();
        var el = this.errorMsgPanel.getEl();
        if(el) {
            var gchild = el.child('div').child('div');
            gchild.update('<span class="formError" style="width:100%">' + errorMsg + '</span>');
        }
        //this.newIdentityInput.markInvalid();
    },

    clearError:function(){
        var el = this.errorMsgPanel.getEl();
        if(el) { //getEl() will only return a valid element if the component is rendered.
            var gchild = el.child('div').child('div');
            gchild.update('');
        }
        this.newIdentityInput.clearInvalid();
        this.errorMsgPanel.hide();
    },


	initComponent : function(){

        this.addEvents(
	        /**
	         * @event inputEntered
	         * Fires when the user has modified the form input, which indicates the the
	         * form submit button should be enabled or disabled.
	         */
	        'inputChange',

            /**
	         * @event success
	         * Fires when a link has been successfully moved.
	         */
	        'success'

        );

		this.newIdentityInput =  new Ext.form.TextField({
			width:300,
			disabled:true,
			emptyText:"#{msgs.identity_move_link_new_name}",
            enableKeyEvents:true,
            listeners : {
				'focus':{
					fn: function(f){
							if (this.emptyText == f.getValue())
								f.setValue('');
						}
					, scope:this
				},
				'change':{
					fn: function(field, newVal, oldVal){
							if (newVal && newVal != "")
								this.fireEvent('inputChange', true);
							else
								this.fireEvent('inputChange', false);
						}
					, scope:this
				},
                'keyup':{
					fn: function(field, event){
                        if (field.getValue().length > 0)
                            this.fireEvent('inputChange', true);
                        else
                            this.fireEvent('inputChange', false);
                    },scope:this
                }
            }
		});

		this.identitySuggest = new SailPoint.IdentitySuggest({
			id: 'moveLinkSuggest',
			valueField: 'name',
			listeners:{
	            'select':{
	                fn: function(combo, record, index){
						this.fireEvent('inputChange', true);
	                }, scope:this
	            },
	            'triggerClick':{
	                fn: function(){
	                	this.fireEvent('inputChange', false);
	                }, scope:this
	            },'keyup':{
					fn: function(field, event){
                        if (field.getValue().length == 0)
                            this.fireEvent('inputChange', false);
                    },scope:this
                }
	        },
	        baseParams: {context: 'Global'}
		});

		this.errorMsgPanel = new Ext.Panel({
      		id:'errorMsg',
      		hidden:true,
            html:'',
      		colspan:3,
      		style:'padding-left:20px'
      	});

		this.items = [
			{
	      		colspan:3,
	      		style:'margin-top:4px;margin-left:4px',
	      		html:'#{msgs.identity_move_form_instr}'
	      	},
	      	this.errorMsgPanel,
	      	new Ext.form.Radio({
	      	    checked:true,
	      	    name:'type',
	      	    style:'margin-left:20px',
	      	    handler: function(obj, checked){
	      	        checked ? this.enable() 
	      	                : this.disable();
	      	    },
	      	    scope: this.identitySuggest
	      	}),
	    	{
	    		html:"#{msgs.identity_move_select_identity}"
	    	},

	    	this.identitySuggest,

	    	new Ext.form.Radio({
	    	    name:'type',
	    	    value:'new',
	    	    style:'margin-left:20px',
	    	    handler: function(obj, checked){
	    	        checked ? this.enable() 
	    	                : this.disable();
	    	    },
	    	    scope: this.newIdentityInput
	    	})
	    	,
	    	{
	    		html: "#{msgs.identity_move_create_new_identity}"
	    	},
	    	this.newIdentityInput,
			{html:'&nbsp;', colspan:3}

		];


		SailPoint.MoveLinkForm.superclass.initComponent.apply(this, arguments);
	}

});


Ext.define('SailPoint.MoveLinkWindow', {
	extend : 'Ext.Window',
	alias : 'widget.idlinkwindow',

    linkId: null,

    form: null,

    successMsgPanel : null,

	initComponent:function(){

        Ext.apply(this, {
            modal:true
        });

        this.form = new SailPoint.MoveLinkForm();

		this.form.on('inputChange', function(enable){
		    var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;
		    var saveButton = buttons.getAt(0);
		    if (saveButton) {
		        (enable) ? saveButton.enable() : saveButton.disable();
		    }
		}, this);

		this.buttons = [
			new Ext.Button({
	        	text: "#{msgs.button_save}",
	        	disabled:true,
	        	listeners : {
	    			'click' :{
	    				fn:function(){
	    					this.save();
	    				}, scope:this
	    			}
	    		}
		    }),
			{
	    		text: "#{msgs.button_cancel}",
                cls : 'secondaryBtn',
	    		listeners : {
	    			'click' :{
	    				fn:function(){
	    					this.cleanupAndClose();
	    				}, scope:this
	    			}
	    		}
			}

		];

		this.successMsgPanel = new Ext.Panel({
	      		hidden:true,
	      		height:140,
	      		style:'text-align:center;',
	      		html:'<div style="font-size:12;padding-top:35px;font-size:16px;"><strong>'+ "#{msgs.identity_move_success}"+'</strong></div>'
	    });


		this.items = [
			this.form,
			this.successMsgPanel
		];

		SailPoint.MoveLinkWindow.superclass.initComponent.apply(this, arguments);
	},

	save:function(){

        var newIdentity = (!this.form.newIdentityInput.disabled) ? this.form.newIdentityInput.getValue() : "";
        var existingIdentity = (!this.form.identitySuggest.disabled) ? this.form.identitySuggest.getValue() : "";

        if (newIdentity == "" && existingIdentity == ""){
            this.form.setError('', "#{msgs.err_req_identity_name}")
            return false;
        }

        this.maskForm();        

        Ext.Ajax.request({
			scope:this,
			url: SailPoint.getRelativeUrl('/define/identity/moveLink.json'),
			success: function(response){
				this.unmaskForm();
				var respObj = Ext.decode(response.responseText);
				if (!respObj.success && respObj.errorMsg == ''){
                    SailPoint.FATAL_ERR_ALERT();
                } else if (!respObj.success && respObj.errorMsg != 'system'){
                    this.form.setError(respObj.error, respObj.errorMsg)
				} else if (respObj.success && respObj.identityDeleted && respObj.identityDeleted === true){
					$('editForm').innerHTML = '#{msgs.no_identity}';
					var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;
					buttons.getAt(0).hide();
			   		buttons.getAt(1).setText("#{msgs.button_close}");
			   		this.form.hide();
			   		this.successMsgPanel.show();
				}else {
					this.success();
				}
			},
            /**
            * Throws up a sys err msg. Note that this is not called when
            * success==false in the response, but if the call returns a 404 or 500.
            */
            failure: function(response){
                this.unmaskForm();
                SailPoint.FATAL_ERR_ALERT.call(this);
            },
			params: {id:$('editForm:id').value, linkId:this.linkId, newIdentity:newIdentity, existingIdentity:existingIdentity}
        });

	},

    /**
    * @cfg {Function} (optional) Function to call after a link has been successfully moved.
    * Most likely this will be to refresh the 
    */
    onSuccess: null,

    success : function(){
    	var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;
		buttons.getAt(0).hide();
   		buttons.getAt(1).setText("#{msgs.button_close}");
   		this.form.hide();
   		this.successMsgPanel.show();
        this.fireEvent('success');
        this.cleanupAndClose();
    },

	maskForm:function(){
		var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;
		buttons.getAt(0).hide();
		buttons.getAt(1).setText("#{msgs.button_exec_in_background}");
		this.form.mask();
	},

	unmaskForm:function(){
   		this.form.unmask();
   		var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;
   		buttons.getAt(0).show();
   		buttons.getAt(1).setText("#{msgs.button_cancel}");
	},

	cleanupAndClose:function(){
   		this.hide();
   		this.form.reset();
		this.form.show();
        this.linkId = null;
        var buttons = this.getDockedItems('toolbar[dock="bottom"]')[0].items;
        buttons.getAt(0).show();
        buttons.getAt(0).disable();
        this.successMsgPanel.hide();
	}
});
