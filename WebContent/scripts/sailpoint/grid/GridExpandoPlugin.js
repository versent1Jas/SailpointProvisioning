/**
 *
 */
Ext.define('SailPoint.grid.GridExpandoPlugin', {
    extend : 'Ext.util.Observable',
    alias : 'plugin.gridexpandoplugin',
    
    statics : {
        toggle : function(panelId) {
            /** IF we are passing a panelId, then we are dealing with multiple expandos in the same grid
             * and need to determine which one to toggle   */
            if(panelId) {
                if(this.id == panelId) {
                  this.toggleCollapse();
                }
            } else {
                this.toggleCollapse();
            }
        }
    },

    init:function(gridRef) {
        
        gridRef.on('beforerender', function(grid){
           // Add events to grid
           grid.addEvents('toggleExpando');
           
           var panel = this.initExpandoPanel(grid);
           
           if (panel) {
               // insert the panel docked to the top under the top toolbar
               grid.insertDocked(grid.dockedItems.length, panel);
               grid.mon(grid, 'toggleExpando', SailPoint.grid.GridExpandoPlugin.toggle, panel);
               grid.mon(grid, 'closeExpando', SailPoint.grid.GridExpandoPlugin.toggle, panel);
           }
           
       }, this);
    },

    // This will get overridden by the constructor config
    initExpandoPanel : function(grid) {
        return null;
    }
});
