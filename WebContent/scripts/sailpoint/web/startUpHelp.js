/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */
 
 /**
   * Pass the specific config options.
   * startupHelpContent can be in html format.
   * An example of config options is :                
   * startupHelpContent: "#{msgs.startup_help_certification_grid_view_content}",
   * startupHelpTitle: "#{msgs.startup_help_certification_grid_view_title}",
   * trackStartUpHelpAJAXURL: "/manage/certification/startupHelpCertGridPersistStateJSON.json" 
   * All options are required for full functionality to persist. If removed, this doc should be updated.
   * Ext.apply(this, config); is implicit at the initComponent
   */
Ext.define('SailPoint.StartUpHelp', {
	extend : 'Ext.Window',
	alias : 'widget.startUpHelp',
	
     initComponent: function() { 
       var contentText = {
                          html:this.startupHelpContent,
                          id: 'displayTextTrackStartUpHelp',
                          xtype:'label',
                          layout: 'fit',
                          width: 330
                         };
       
       var chkTracker = {
                           boxLabel:'#{msgs.startup_help_not_show_again}',
                           id: 'showStartUpHelp',
                           xtype:'checkbox',
                           width: 330
                         };
                         
      var okCloseBtn = {
                           text:'#{msgs.button_ok}',     
                           id:'okCloseBtnStartUpHelp' ,
                           xtype:'button'
                         };    
                     
      Ext.apply(this, {
          autoCreate : true,
          title:this.startupHelpTitle,
          items: [
              contentText, 
              chkTracker
          ],               
          width:350,
          minHeight:80,
          plain:true,
          border:false,
          bodyBorder:false,
          hideBorders:true,
          bodyStyle:'padding-top:10px; padding-bottom:10px;padding-left:5px;',
          fbar:{layout:{pack:'center'}, items:[okCloseBtn]},
          layout: {
              type: 'vbox',
              align: 'center'
          },
          modal:true,
          defaultButton: 'okCloseBtnStartUpHelp'
      });
      
      this.callParent(arguments);     
     },
     
     afterRender: function() {
     	
     	Ext.Window.superclass.afterRender.apply(this);
     	
        // okCloseBtn  is implicitly created using xtype in items: at this point                                        
        Ext.getCmp('okCloseBtnStartUpHelp').addListener('click', this.closingFromBtn, this);        
     },
     
          
     closingFromBtn: function() {
         if (Ext.getCmp('showStartUpHelp').isDirty()) {
             $("editForm:" + this.stateField).value = !(Ext.getCmp('showStartUpHelp').getValue());
             $("editForm:" + this.actionButton).click();
         }
     
         this.close(this);
     },
     
     toString: function(){
       return "[SailPoint.StartUpHelp"+(this.startupHelpTitle?" "+this.startupHelpTitle:"")+"]";    
     }
 });