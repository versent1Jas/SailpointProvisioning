Ext.ns('SailPoint');

/**
 * Performing connector debug in the UI requires a little
 * juggling between JSF and Rest resources. Here we must
 * get the current application state from the JSF UI,
 * and store it on the session where it can be retrieved
 * by the rest resource that generates the debug data.
 *
 * We perform the session store by clicking the
 * connectorDebugBtn a4j button. Once that request returns
 * it will fire our second method SailPoint.completeConnectorDebug
 * below that actually displays the data.
 *
 * @param applicationName Name of application to debug
 * @param objectType Schema type - eg account or group
 * @param title Title to be displayed in the popup window.
 */
SailPoint.connectorDebug = function(applicationName, objectType, title){

    // If the page hasn't been saved, check the input for a value.
    if (!applicationName || applicationName === ''){
        applicationName = $('editForm:appName').value;
    }

    if (!applicationName || applicationName === ''){
        Ext.Msg.show({
            title : '#{msgs.err_dialog_title}',
            msg : '#{msgs.app_res_test_connector_err_no_app}',
            buttons : Ext.Msg.OK,
            icon : Ext.MessageBox.ERROR
        });
        return;
    }

    SailPoint.connectorDebugData = {
        applicationName: applicationName,
        objectType: objectType,
        title: title
    };

    $('editForm:connectorDebugBtn').click();
}

/**
 * Generates a pop-up window containing a grid of connector
 * debug data for the given application and object type.
 *
 * @param applicationName (Required) Name of the application.
 * @param objectType (Required) Name of object type, primarily 'account' or 'group'
 */
SailPoint.completeConnectorDebug = function(){

    var applicationName = SailPoint.connectorDebugData.applicationName;
    var objectType = SailPoint.connectorDebugData.objectType;

    var windowId = 'connectorDebug-' + objectType;

    var windowCmp = Ext.getCmp(windowId);
    if (windowCmp) {
        windowCmp.destroy();
    }

    var store = SailPoint.Store.createStore({
        fields : ['id'],
        autoLoad : true,
        url : SailPoint.getRelativeUrl('/rest/applications/' + SailPoint.Utils.encodeRestUriComponent(applicationName) + '/testConnector/' + objectType),
        root : 'objects',
        pageSize : 10,
        remoteSort : false,
        method : 'GET',
        timeout : 480000 // Give this request plenty of time
    });

    store.getProxy().on('exception', function(proxyServer, response, op){

        // default error message
        var msg = '#{msgs.app_res_test_connector_err}';

        var responseObj = Ext.decode(response.responseText);
        if (responseObj && responseObj.errors && responseObj.errors.length > 0){
            msg = responseObj.errors[0];
        }
        else if(op && op.error) {
            msg += '<br/><br/>' + op.error;
        }

        Ext.Msg.show({
            title : '#{msgs.err_dialog_title}',
            msg : msg,
            buttons : Ext.Msg.OK,
            icon : Ext.MessageBox.ERROR
        });

        var cmp = Ext.getCmp(this.winId);
        if (cmp) {
            cmp.destroy();
        }

    }, {winId: windowId});

    Ext.create('Ext.window.Window', {
        id:windowId,
        title: SailPoint.connectorDebugData.title,
        minHeight: 300,
        minWidth: 800,
        modal: true,
        layout: 'fit',
        items: {
            xtype: 'paginggrid',
            hidebbar:true,
            dynamic: true,
            border: false,
            columns: [{header: ''}],
            store: store
        },
        listeners : {
            show: function(me, opt){
                me.updateLayout();
                me.center();
            }
        }
    }).show();

};