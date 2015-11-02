/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */


/**
 * Implementation of Ext.state.Provider for use with SailPoint.grid.PagingGrid.
 * In order to use this class:
 * 1. Get the grid state from the GridConfigBean:
 *    <div id="myGridState" style="display:none">#{gridConfigBean.gridStateConfig['myGridState'].state}</div>
 * 2. Create an instance of SailPoint.state.StateProver using the state ids and states of all the grids on the page:
 *    Ext.create('SailPoint.state.StateProvider', {
 *        stateIds: ['myGridState'],
 *        states: [$('myGridState').innerHTML]
 *    });
 *     
 * 3. Set the stateful property to true and the stateId to the property value in the grid config:
 *    var pagingGridConfig = {
 *        ...,
 *        stateful: true,
 *        stateId: 'myGridState',
 *        ...
 *    };   
 */
Ext.define('SailPoint.state.StateProvider', {
	extend : 'Ext.state.Provider',

	constructor : function(config) {
		this.callParent(arguments);
		this.stateIds = null;
		this.states = null;
		/**
		 * @cfg {String} stateProviderUrl If passed, the URL of the
		 *      datasource that will provide the current state. If not
		 *      passed, this will default to
		 *      SailPoint.getRelativeUrl('/state.json');
		 */
		this.stateProviderUrl = null;
		Ext.apply(this, config);
		this.state = this.loadStates();
	},

	set : function(name, value) {
		if(value == null || typeof value === "undefined") {
			this.clear(name);
			return;
		}
		
		// We only care about state changes we've already registered.
		if(name == null || !Ext.Array.contains(this.stateIds, name)) {
			return;
		}

		var stateProviderUrl = this.stateProviderUrl;
		if(stateProviderUrl == null || typeof stateProviderUrl === "undefined") {
			stateProviderUrl = SailPoint.getRelativeUrl('/state.json');
        }

		Ext.Ajax.request({
            url : stateProviderUrl,
			method : 'POST',
			params : {
                name : name,
                state : this.encodeValue(value)
            }
		});

		this.callParent(arguments);
	},

	loadStates : function() {
		var state = {}, i;
		if (this.stateIds != null) {
			for (i = 0; i < this.stateIds.length; i++) {
				var stateId = this.stateIds[i];
				state[stateId] = this.decodeValue(this.states[i]);
			}
		}
		return state;
	}
});
