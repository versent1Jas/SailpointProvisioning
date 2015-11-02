/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */
Ext.ns('SailPoint');

SailPoint.showDataExportDDLDialog = function(){
    var win;
    win = new Ext.Window({
        title:'#{msgs.task_data_export_gen_dll_title}',
        layout:'fit',
        width:600,
        height:400,
        closeAction:'destroy',
        plain: true,
        items: new Ext.form.TextArea({
            id:'schemaText',
            width:500,
            height:300
        }),
        buttons: [{
            text: '#{msgs.button_close}',
            cls : 'secondaryBtn',
            handler: function(){
                win.destroy();
            }
        }]
    });

    win.on("show", function(){
        Ext.Ajax.request({
            scope:this,
            url: SailPoint.getRelativeUrl('/monitor/tasks/dataExportSchema.json'),
            success: function(response){
                var respObj = Ext.decode(response.responseText);
                if (!respObj.success && respObj.errorMsg == ''){
                    SailPoint.FATAL_ERR_ALERT();
                } else if (!respObj.success){
                    this.destroy();
                    SailPoint.EXCEPTION_ALERT(respObj.errorMsg);
                }else{
                    this.items.get(0).setValue(respObj.schema);
                }
            },
            failure: function(response){
                SailPoint.FATAL_ERR_ALERT.call(this);
            },
            params: {database:$('editForm:database').value}
        });
    }, win);

    win.show();
}