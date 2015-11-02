/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.RoleAssignmentForm', {
	extend : 'Ext.panel.Panel',
  
  roleSuggest: null,
  
  sunriseDate : null,
  
  sunsetDate : null,
  
  sunriseHour : null,
  
  sunriseMin : null,
  
  sunsetHour : null,
  
  sunsetMin : null,
  
  /** Indicates whether we want to render the role assignment suggest -- sometimes if we are
   * using the assignment form just as a deletion window, we don't need the role suggest
   */
  noSuggest : false,
  
  now : null,
  
  initComponent : function() {
    
    if(!this.noSuggest) {
      this.roleSuggest = new SailPoint.MultiSuggest({
        suggestType: 'manuallyAssignableRole',
        jsonData: Ext.decode($('assignedRolesJSON').innerHTML),
        exclusionIds: $('assignedRoleIds').innerHTML,
        inputFieldName: 'assignedRoles',
        style:'margin:3px 0 10px 0'
      });
    }
    
    if(this.showAssignDates) {
      
      this.now = new Date();
      /** Zero out the hour,min,sec, fields **/
      this.now.setHours(0);
      this.now.setMinutes(0);
      this.now.setSeconds(0);
      this.now.setMilliseconds(0);
      
      this.sunriseDate = new Ext.form.DateField({
        name:'sunrise', 
        id:'sunriseExt',
        labelStyle:'text-align:right;width:140px',
        vtype: 'daterange',
        labelSeparator: ' ',
        minValue: this.now,
        endDateField: 'sunsetExt'
      });
      
      this.sunsetDate = new Ext.form.DateField({
        name:'sunset', 
        id:'sunsetExt', 
        labelStyle:'text-align:right;width:140px',
        vtype: 'daterange',
        labelSeparator: ' ',
        minValue: this.now,
        startDateField: 'sunriseExt'
      });
      
      if(!this.noSuggest) {
        this.items = [
          {xtype:'label', text:'#{msgs.label_roles}: ', id: 'rolesLabel'},
          this.roleSuggest,
          {xtype:'label', text:'#{msgs.activate}: ', id: 'activateLabel'},
          this.sunriseDate, 
          {xtype:'label', text:'#{msgs.deactivate}: ', id: 'deactivateLabel'},
          this.sunsetDate
        ];
      } else {
        this.items = [
          {xtype:'label', text:'#{msgs.activate}: ', id: 'activateLabel'},
          this.sunriseDate, 
          {xtype:'label', text:'#{msgs.deactivate}: ', id: 'deactivateLabel'},
          this.sunsetDate
        ];
      }
    } else {
      
      if(!this.noSuggest) {
        this.items = [
          {xtype:'label', text:'#{msgs.label_roles}: ', id: 'rolesLabel'},
          this.roleSuggest
        ];
      }
    }
    SailPoint.RoleAssignmentForm.superclass.initComponent.apply(this, arguments);
  },
  
  validate : function() {
    if(this.sunriseDate) 
      return (this.sunriseDate.isValid() && this.sunsetDate.isValid());
    
    return true;
  }
});

Ext.define('SailPoint.RoleAssignmentWindow', {
	extend : 'Ext.Window',
  form: null,
  
  /**
   * You can pass in a save method to execute when the window's save button is clicked
   */
  saveAction : undefined,
  
  roleId: undefined, 
  
  type: undefined,
  
  showAssignDates: false,

  initComponent : function() {
    this.form = new SailPoint.RoleAssignmentForm({
      baseCls: 'x-plain',
      style:'padding:10px;background-color:#FFFFFF',
      labelWidth: 140,
      showAssignDates : this.showAssignDates,
      noSuggest : this.noSuggest
    });
    this.modal = true;
    
    this.on('show', this.formatWindow, this);
    this.items = [this.form];
    
    this.buttons = [
      {
        window : this,
        text: "#{msgs.button_save}",
        handler: function() {
          this.window.save();
        }
      },{
        window : this,
        text: "#{msgs.button_cancel}",
        cls : 'secondaryBtn',
        handler: function(){this.window.close(); }
      }
    ];
    
    SailPoint.RoleAssignmentWindow.superclass.initComponent.apply(this, arguments);
  },
  
  save : function() {
    if(this.form.validate()) {
      
      if(this.saveAction)
        this.saveAction(this.roleId);
      
      this.close();
    } else {
      
      Ext.MessageBox.show({
        title: '#{msgs.error_saving_role}',
        msg: '#{msgs.error_saving_role_descr}',
        buttons: Ext.MessageBox.OK,
        icon: Ext.MessageBox.ERROR
      });
      
    }
    
  },  
  
  setType : function(type) {
    this.type = type;
    
    if(this.type=='add') {
      
      if(this.form.roleSuggest) {
        this.form.roleSuggest.show();
      }
      
      if(this.showAssignDates) {
        Ext.getCmp('activateLabel').show();
        this.form.sunriseDate.show();
      }
      
    } else if(this.type=='edit') {
      if(this.form.roleSuggest) {
        this.form.roleSuggest.hide();
      }
      if(this.showAssignDates) {
        Ext.getCmp('activateLabel').show();
        this.form.sunriseDate.show(); 
      }
    } else {
      if(this.form.roleSuggest) {
        this.form.roleSuggest.hide();
      }
      
      if(this.showAssignDates) {
        Ext.getCmp('activateLabel').hide();
        this.form.sunriseDate.hide(); 
      }      
    }
  },
  
  formatWindow : function () {
    
    if(this.type=='add') {
      if(Ext.getCmp('rolesLabel'))
        Ext.getCmp('rolesLabel').show();
      
      this.setTitle('#{msgs.title_add_role}');
      
      if(this.showAssignDates) {
        
        this.form.sunsetDate.reset();
        
        this.form.sunriseDate.reset();
        this.form.sunriseDate.setValue(this.form.now);
        this.form.sunriseDate.maxValue = null;
        
        if(this.form.sunriseDate.menu) {
          this.form.sunriseDate.menu.picker.maxDate = null;
        }
      }
    } else if(this.type=='edit') { 
      if(Ext.getCmp('rolesLabel'))
        Ext.getCmp('rolesLabel').hide();
      
      this.setTitle('#{msgs.title_edit_role_assignments}');
    } else {
      this.setTitle('#{msgs.title_delete_role}');    
      if(Ext.getCmp('rolesLabel'))
        Ext.getCmp('rolesLabel').hide();
      
      if(this.showAssignDates) {

        this.form.sunsetDate.reset();
        this.form.sunsetDate.setValue(this.form.now);
        this.form.sunsetDate.minValue = this.form.now;
        
        this.form.sunriseDate.reset();
        this.form.sunriseDate.minValue = this.form.now;
        
      }
    }
  }
});
