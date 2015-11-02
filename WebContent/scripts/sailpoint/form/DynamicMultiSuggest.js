/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.form.DynamicMultiSuggest', {
	extend : 'SailPoint.MultiSuggest',
	alias : 'widget.spdynamicmultisuggest',
    
  constructor: function(config) {
    this.config = config;
      
    this.callParent(arguments);
  },
  
  initComponent: function() {
    this.jsonData = {'totalCount' :0, 'objects' :[]};
    
    var suggestConfig = this.config;
    suggestConfig.id = this.config.id+"combo";
    
    this.suggest = new SailPoint.form.DynamicComboBox(suggestConfig);
    this.callParent(arguments);
    
    this.on('afterlayout', function() {
      var label = document.createElement("label");
      label.innerHTML = this.fieldLabel;
      
      if (this.required && this.required === true){
        label.innerHTML += '<span class="requiredText">*</span>';
      }
      
      label.style.width = '160px';
      this.addCls('x-form-item');
      this.getEl().dom.insertBefore(label, this.getEl().dom.firstChild);
      this.getEl().dom.style.width = '480px';
    }, this);
  }

});