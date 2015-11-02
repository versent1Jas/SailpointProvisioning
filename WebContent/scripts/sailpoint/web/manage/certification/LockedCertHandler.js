
Ext.define('sailpoint.web.manage.certification.LockedCertHandler', {
	statics : {
		instance : null,
		getInstance : function() {
			if (this.instance == null) {
				this.instance = Ext.create('sailpoint.web.manage.certification.LockedCertHandler');
			}
			return this.instance;
		}	
	},
	
	alias: 'sailpoint.LockedCertHandler',
	
	dialog : null,
	decisions : null,
	isCustom : false,
	
	retryClicked : function() {
		this.dialog.hide();
		var decider = SailPoint.Decider.getInstance();
		decider.persist(this.decisions, this.isCustom);
	},
	
	cancelClicked : function() {
		this.dialog.hide();
	},
	
	createRetryDialog : function() {
		
		var retryButton = {
			xtype : 'button',
			text : '#{msgs.button_retry}'
		};
		retryButton.handler = this.retryClicked.bind(this);
		
		var cancelButton = {
			xtype : 'button',
            cls : 'secondaryBtn',
			text : '#{msgs.button_cancel}'
		};
		cancelButton.handler = this.cancelClicked.bind(this);
		
		var config = {
			width: 400,
			height: 150,
			title: '#{msgs.cert_locked_save_failure_title}',
		    modal : true,
		    closeAction : 'hide',
		    shim : true,
		    closable : false,
		    draggable : false,
		    bodyStyle : 'padding:10px;background-color:#FFFFFF',
		    items : {
		    	xtype : 'label',
		    	text : '#{msgs.cert_locked_retry}'     
		    },
		    dockedItems: [{
		        xtype: 'toolbar',
		        dock: 'bottom',
		        layout : {pack : 'center'},
		        ui: 'footer',
		        items: [
		            retryButton,
		            cancelButton
		        ]
		    }]
		};
		
		return Ext.create('Ext.window.Window', config);
	},
	
	showRetryDialog : function(decisions, isCustom) {
		
		this.decisions = decisions;
		this.isCustom = isCustom;
		
		if (this.dialog == null) {
			this.dialog = this.createRetryDialog();
		}
		this.dialog.show();
	}
});


