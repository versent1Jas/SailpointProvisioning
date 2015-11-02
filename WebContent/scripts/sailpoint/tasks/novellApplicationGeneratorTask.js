Ext.ns('SailPoint', 
       'SailPoint.Tasks',
       'SailPoint.Tasks.Novell'); 

SailPoint.Tasks.Novell.ApplicationGenerator = function()
{
	var _sailpointAppSuggest;
	var _fetchAppsButton;
	var _initialized = false;
	var _novellAppMultiSuggest;
	
	var _btnClickHandler = function(button, event)
	{
		_novellAppMultiSuggest.selectedStore.removeAll();
		_fetchItems();
	};

	var _fetchItems = function()
	{
		Ext.Ajax.request({
			url :SailPoint.CONTEXT_PATH + '/monitor/tasks/novellApplicationListJson.json',
			success: _onDataObtained.bind(this),
			failure: _loadError,
			params: {'novellAppName': _getNovellIdmAppName()}
		});
	}
	
	var _onDataObtained = function(response)
	{
		var data = Ext.JSON.decode(response.responseText);
		
		var names = [];
		for (var i=0; i<data.objects.length;++i)
		{
			names.push(data.objects[i].name);
		}
		
		_addItems(names);
	}
	
	var _loadError = function(response) 
	{
		 Ext.MessageBox.alert("Load error", + response.responseText);
	}
	
	var _getNovellIdmAppName = function()
	{
		return $('applicationName').value;
	}
	
	var _addItems = function(names)
	{

		Ext.define('RecordType', {
		    extend: 'Ext.data.Model',
		    fields: [
                     {name: 'id', type: 'string'},
                     {name: 'name', type: 'string'},
                     {name: 'displayField', type:'string'}
                        ]
		});
		
		for (var i=0; i<names.length; ++i)
		{
            var record = Ext.create('RecordType', {'id': names[i],
                                    'name': names[i],
                                    'displayField': names[i]});
			_novellAppMultiSuggest.selectedStore.addSorted(record);
			_novellAppMultiSuggest.updateInputField();
		}
	}
	
	var _initializeAppList = function()
	{
		if (_initialized === true)
		{
			return;
		}
		var novellAppSuggest = new SailPoint.BaseSuggest( {
			emptyText :'Select...',
			noResultsText :'No Results were Found'
		});

		novellAppSuggest.store = SailPoint.Store.createStore( {
			storeId :'novellAppSuggestStore',
			url :SailPoint.CONTEXT_PATH + '/monitor/tasks/novellApplicationListJson.json',
			root :'objects',
			extraParams:{'novellAppName':_getNovellIdmAppName()},
			fields : [ {name: 'id', mapping : 'name'}, {name :'displayName', mapping :'name' } ],
			remoteSort :true,
			listeners : {
				exception :_loadError
			}
		});

		// tqm: need to save here otherwise gets overwritten
		var initialValues = $('novellAppSuggestVal').value;

		_novellAppMultiSuggest = new SailPoint.MultiSuggest( {
			renderTo:'novellAppSuggest',
			id :'novellAppMultiSuggest',
			suggest :novellAppSuggest,
			inputFieldName : 'novellAppSuggestVal',
			jsonData : {'totalCount' :0, 'objects' :[]},
			width :300,
			contextPath :SailPoint.CONTEXT_PATH
		});

		if (typeof initialValues != 'undefined' && initialValues != null && initialValues !== '')
		{
			_addItems($A(initialValues.split(',')));
		}
		
		_initialized = true;
	}
	
	return {
		init : function() 
		{
		    _sailpointAppSuggest = new SailPoint.BaseSuggest({
		        baseParams: {'suggestType': 'application'},
		        renderTo: 'appSuggest', 
		        binding: 'applicationName',
		        value:_getNovellIdmAppName(),
		        valueField:'displayName',
		        initialData: _getNovellIdmAppName(),
	            emptyText: '#{msgs.select_application}',
		        width: 300
		    });
		    
	        _sailpointAppSuggest.on('select', function(suggestField, record, index) {
                $('applicationName').value = record[0].get('displayName');
	        });
		    
		    
		    _fetchAppsButton = new Ext.Button({
		    	renderTo: 'fetchAppsButtonDiv',
		    	text: 'Fetch Novell Applications',
		    	handler: _btnClickHandler,
		    	scope:this
		    });
		    
		    _initializeAppList();
		},
		getNovellAppsMultiSuggest: function(){return _novellAppMultiSuggest;},
		getSailpointAppsSuggest: function(){return _sailpointAppSuggest;}
	};
}

Ext.onReady(function(){
	var app = new SailPoint.Tasks.Novell.ApplicationGenerator();
	app.init();
});
