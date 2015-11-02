/* (c) Copyright 2015 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.DiscoverDomains');
Ext.Loader.setConfig({enabled: true});
Ext.Loader.setPath('Ext.ux', '../ux');
Ext.onReady(function () {
        Ext.QuickTips.init();
        var isGCDataSaved = false;
        var gcVal = $('editForm:isGCSaved');
        if(gcVal.value) {
            isGCDataSaved = true;
            $('editForm:enable').checked=true;
        }
        SailPoint.DiscoverDomains.enableDiscover(isGCDataSaved);
});

Ext.require([
             'Ext.form.Panel',
             'Ext.ux.form.MultiSelect',
             'Ext.ux.form.ItemSelector'
         ]);

<!--// --><![CDATA[//><!--

// The index is the row number of the Domain table
// The domain parameter is sent to the connector which brings the corresponding
// servers
SailPoint.DiscoverDomains.showServers = function (index, domain) {
    var serverData = $('editForm:domainInfo:'+ index +':servers');
    var servers = serverData.value.split("\n");
    var data = [];
    var len = servers.length;
    var i;
    for (i=0; i < len; i++) {
        var temp = {"name": servers[i]};
        data.push(temp);
    }

     var ds = SailPoint.Store.createStore({
        url: CONTEXT_PATH + '/define/applications/discoverServers.json',
        fields: ['name','value'],
        autoLoad: true,
        baseParams: {domain : domain,
                     servers: servers},
    });
    
    var itemselectorField = new Ext.Panel({
        title: 'Select Servers for the Domain',
        width: 663,
        id:'selectServerId',
        bodyPadding: 4,
        height: 333,
        renderTo: 'itemselector',
        layout: 'fit',
        items:[{
            xtype: 'label',
            forId: 'availableServers',
            text: 'Available Servers',
            style: 'font-weight:bold;',
            margins: '0 0 0 0'
        }, {
            xtype: 'label',
            forId: 'selectedServers',
            text: 'Selected Servers',
            style: 'font-weight:bold;',
            margins: '0 0 0 248'
        }, {
            xtype: 'itemselector',
            name: 'itemselector',
            id: 'itemselectorField',
            shrinkWrap: 3, 
            anchor: '100%',
            imagePath: '../images/extjs-ux/',
            store:ds,
            displayField: 'name',
            valueField: 'name',
            allowBlank: true,
            msgTarget: 'side',
            fromTitle: 'Available',
            toTitle: 'Selected',
            listeners: {
                afterrender: function(field) {
                    var servers = [];
                    for(var key in data) {
                        servers.push(data[key].name);
                    }
                    field.setValue(servers);
                }
            }
        }]
    });

    var  serversWinID = Ext.create('Ext.window.Window', {
        id: 'serversWinID',
        height: 400,
        width: 675,
        modal: true,
        resizable: false,
        buttons: [{
                        text: 'Ok',
                        id: 'saveServers',
                        handler: function () {
                        this.setDisabled(false);
                        var serverStrings = '';
                        var itemField = Ext.getCmp('itemselectorField');
                        
                        if(itemField) {
                            var fieldList = itemField.toField;
                            var temp = fieldList.store.getRange();
                            var i=0;
                            var len = temp.length;
                            
                            for (i=0; i < len; i++) {
                                    if(i != 0)
                                        serverStrings += '\n';
                                    serverStrings += temp[i].data.name;
                            }
                        }
                        var obj = $('editForm:domainInfo:'+ index +':servers');
                        obj.value = serverStrings;
                        Ext.getCmp('serversWinID').close();
                }
        },
        {
                text: 'Cancel',
                id: 'cancelServer',
                handler: function () {
                        this.setDisabled(false);
                        Ext.getCmp('serversWinID').close();
                }
         }],
        bodyStyle: 'background-color: white; padding: 0px; overflow: auto',
        items:[itemselectorField]
    });

    Ext.getCmp('serversWinID').show();
}

SailPoint.DiscoverDomains.startDiscover = function (button) {
        $('domainResultsDiv').className = 'workingText';
        $('domainResultsDiv').innerHTML = '#{msgs.discover_domains}';
        button.disabled = true;
}

SailPoint.DiscoverDomains.endDiscover = function () {
        $('editForm:discoverButton').disabled = false;
}

SailPoint.DiscoverDomains.enableDiscover = function (isChecked) {
        if(isChecked === 'true' || isChecked === true){
            $('editForm:gcLabel').show();
            $('editForm:imgHlpGC').show();
            $('editForm:forestGC').show();
            $('editForm:gcAdminUserLabel').show();
            $('editForm:imgHlpGCAdminUser').show();
            $('editForm:forestAdmin').show();
            $('editForm:gcPwdLabel').show();
            $('editForm:imgHlpGCPwd').show();
            $('editForm:forestAdminPassword').show();
            $('editForm:discoverButton').show();
        }
        else {
            $('editForm:gcLabel').style.display = 'none';
            $('editForm:imgHlpGC').style.display = 'none';
            $('editForm:forestGC').style.display = 'none';
            $('editForm:gcAdminUserLabel').style.display = 'none';
            $('editForm:imgHlpGCAdminUser').style.display = 'none';
            $('editForm:forestAdmin').style.display = 'none';
            $('editForm:gcPwdLabel').style.display = 'none';
            $('editForm:imgHlpGCPwd').style.display = 'none';
            $('editForm:forestAdminPassword').style.display = 'none';
            $('editForm:discoverButton').style.display = 'none';
        }
}
// --><!]]>