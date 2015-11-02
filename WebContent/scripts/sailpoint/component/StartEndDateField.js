/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
* @class SailPoint.CertificationStatusor
* @extends Ext.BoxComponent
*
* A div component that allows us to render status changes on the ui through.
*/

Ext.define('SailPoint.StartEndDateField', {
	extend : 'Ext.Container',
  startField : null,
  endField : null,
  binding : null,
  
  initComponent : function() {
  
    this.startField = new Ext.form.DateField({
        id: this.id+'StartDate',
        name: this.id+'StartDate'
    });
    
    this.endField = new Ext.form.DateField({
        id: this.id+'EndDate',
        name: this.id+'EndDate'
    });
    
    Ext.apply(this, {
        cls: 'start_end_datefield font10',
        autoEl: 'div'
    });

    this.items = [
      {
        xtype: 'container',
        autoEl: 'div',
        cls: 'start_date',
        items: [
          {xtype: 'label', text: '#{msgs.start_date}'},
          this.startField
        ]
      },{
        xtype: 'container',
        autoEl: 'div',
        cls: 'end_date',
        items: [
          {xtype: 'label', text: '#{msgs.end_date}'},
          this.endField
        ]
      }
    ];
    
    this.startField.on('change', this.setValueBinding, this);
    this.endField.on('change', this.setValueBinding, this);
    
    SailPoint.StartEndDateField.superclass.initComponent.apply(this);
  },
  
  setValueBinding: function () {
    var startValue = this.startField.getValue();
    var endValue = this.endField.getValue();
    
    if(startValue) {
      startValue = startValue.getTime();
    }
    if(endValue) {
      endValue = endValue.getTime();
    }
    var value = startValue + "=" + endValue;
    if(this.binding) {
      var bindingElement = $(this.binding);
      if(bindingElement) {
        bindingElement.value = value;
      }
    }
  }
  
});