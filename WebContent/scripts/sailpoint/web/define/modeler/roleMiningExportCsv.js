/* (c) Copyright 2010 SailPoint Technologies, Inc., All Rights Reserved. */
Ext.namespace('SailPoint', 'SailPoint.roles');

/**
 * Creates and shows the export results option dialog
 */
SailPoint.roles.viewExportCsvDialog = function () {
	
  var exportParameterDialog = Ext.getCmp('roleMiningExportCsvDialog');
  
  if ( !exportParameterDialog ) {
	  exportParameterDialog = new SailPoint.roles.RoleMiningExportCsvDialog( {
        id:'roleMiningExportCsvDialog'
      } );
  }
  exportParameterDialog.show();
  exportParameterDialog.loadContent();
};


SailPoint.roles.ExportCsv = function() {
	var resultName = Ext.getCmp( 'itRoleMiningResultsPanel' ).getStore().getProxy().extraParams[ 'ITRoleMiningTaskResultsName' ];
    var exportCsvDialog = Ext.getCmp( 'roleMiningExportCsvDialog' );
    if( exportCsvDialog )
    	exportCsvDialog.close();
    
    var progressMonitor = new ExportTaskProgressMonitor( { id: 'exportProgressMonitor' } );
                
    Ext.MessageBox.show({
      title: '#{msgs.executing}',
      msg: resultName,
      width:400,
      progress:true,
      buttons: Ext.MessageBox.CANCEL,
      fn: progressMonitor.cancel,
      closable:false
    });
    
    progressMonitor.start();
//    Ext.MessageBox.wait( resultName, '#{msgs.executing}', { id: 'exportProgressdialog', width: 400 } );
    	
};

/**
 * Export Role Mining results parameter dialog 
 */
Ext.define('SailPoint.roles.RoleMiningExportCsvDialog', {
	extend : 'Ext.Window',
	modal: true,
	width: 500,
	height: 400,
	resize: true,
	autoScroll: true,
	title: "#{msgs.it_role_mining_export_options}",
 
    initComponent: function() {
    	this.loader = {};
		var exportCsvDialog = this;
		/* Ok Button */
		exportCsvDialog.okButton = new Ext.Button( {
			text: "#{msgs.button_ok}",
			parent: exportCsvDialog,
			handler: function() {
				/* On OK populate export parameter fields */
				/* Identity Attributes */
				var selectedList = Ext.DomQuery.select( 'input:checked', 'itRoleMiningIdentityExportAttributes' );
		  	
				var selectedAttributes = '';
				for( var i = 0; i < selectedList.length; i++ ) {
					var selectedItem = selectedList[ i ];
					selectedAttributes += selectedItem.value;
					if( i < selectedList.length - 1 ) {
						selectedAttributes += ',';
					}
				}

				var exportIdentityAttributesField = $( 'exportForm:exportIdentityAttributesField' );
				exportIdentityAttributesField.value = selectedAttributes;
				/* Entitlements */
				// 	execute export
				/* Hide options dialog */
			    var exportCsvDialog = Ext.getCmp( 'roleMiningExportCsvDialog' );
			    if( exportCsvDialog )
			    	exportCsvDialog.close();
				/* Show progress dialog */
			    SailPoint.roles.ExportCsv();
			    var resultToExport = Ext.getCmp('itRoleMiningResultsPanel').getStore().getProxy().extraParams['ITRoleMiningTaskResults'];
			    /* Export results */
                $( 'exportForm:exportTaskId' ).value = resultToExport;
				var exportButton = $( 'exportForm:scheduleExportTaskBtn' );
				exportButton.click();
	  		}
		} );
		exportCsvDialog.buttons = [ exportCsvDialog.okButton ];
		  
		SailPoint.roles.RoleMiningExportCsvDialog.superclass.initComponent.apply( exportCsvDialog );
  	},
  
  	loadContent: function() {
  		var contentPanel = this;
  		contentPanel.getLoader().load( {
  			url: SailPoint.getRelativeUrl( '/define/roles/roleMining/roleMiningIdentityAttributes.jsf' ),
		    scope: contentPanel,
		    params: {forceReset: true},
		    text: '#{msgs.loading_data}',
		    scripts: false,
		    ajaxOptions : {
                disableCaching: false
            }
  		} );
  	}
});

SailPoint.roles.ProcessProgress = function() {
	var progressField = $( 'exportForm:exportProgressField' );
	var progressValue = progressField.value;
	if( progressValue == 'Completed' ) {
		var monitor = Ext.getCmp( 'exportProgressMonitor' );
		if( monitor ) {
			monitor.stopPeriodicExecution();
		}
        Ext.MessageBox.hide();
	} else {
		Ext.MessageBox.updateProgress( progressValue / 100, progressValue + '%' );
	}
};

/**
 * Class that polls for TaskResult progress
 * 
 * @param onCancel Currently not called because I don't know how to cancel a task ... 
 */
Ext.define('ExportTaskProgressMonitor', {
	extend : 'Ext.Component',
	constructor: function( config ) {
		// private members 
		var pe;
		
		ExportTaskProgressMonitor.superclass.constructor.apply( this, arguments );
	},
	
	// privileged methods
	/**
	 * Starts polling for TaskResult Status
	 */
	start: function() {
        pe = new PeriodicalExecuter( this.checkTaskProgress, 1 );
	},

	cancel: function() {
		pe.stop();
        Ext.MessageBox.hide();
	},
	
	// Private methods 
	checkTaskProgress: function() {
		var progressButton = $( 'exportForm:exportProgressBtn' );
		progressButton.click();
	},
	
	stopPeriodicExecution: function() {
		if( pe ) {
			pe.stop();
		}
	}
} );