/* (c) Copyright 2013 SailPoint Technologies, Inc., All Rights Reserved. */

/**
* @class SailPoint.WorkflowFormContainer
* @extends Ext.Container
* Simple container for wrapping a form. This is used in process variables and in the
* step arguments tab of an edit step window while editing a process in the BPE. The functions
* getMap and copyMap are used like an interface when toggling between the 'basic form' and 'advanced'
* views of aforementioned UIs.
*/
Ext.define('SailPoint.WorkflowFormContainer', { 
           extend: 'Ext.Container',
           
           configFormPanel: null,
           
           initComponent : function(){
               this.callParent(arguments);
           },
           
           setConfigFormPanel: function(panel) {
               this.add(panel);
               this.configFormPanel = panel;
           }, 
           
           getMap : function() {
               var map = new Ext.util.HashMap();
               if (this.configFormPanel) {
                   var basicForm = this.configFormPanel.getForm();
                   var fields = basicForm.getFields();
                   fields.each(function(item, index, len) {
                       // use getSPFormValue in favor of getValue for tricky components like RadioGroup
                       var realValue = (item.getSPFormValue) ? item.getSPFormValue() : item.getValue();
                       map.add(item.getName(), realValue);
                   });
               }
               return map;
           },
           
           clear : function() {
               this.removeAll(true);
               this.configFormPanel = null;
           }
});