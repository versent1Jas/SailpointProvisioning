/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.Role.Viewer.RoleViewerStateController', {
	extend : 'Ext.Component',
    stateId: 'roleViewerState',
    stateful: true,
    stateEvents: ['statechange'],
    state: {},
    
    initComponent: function() {
        this.addEvents('statechange');
                
        SailPoint.Role.Viewer.RoleViewerStateController.superclass.initComponent.apply(this, arguments);
    },
    
    getState: function() {
        return this.state;
    },
    
    applyState: function(state, config) {
        this.state = state;
        if (!this.state) {
            this.state = { currentView: SailPoint.Role.Viewer.ViewerModes.TOP_DOWN };
        }
    }
});

