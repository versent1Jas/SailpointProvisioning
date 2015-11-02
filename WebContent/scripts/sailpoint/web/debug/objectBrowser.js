SailPoint.phaseCertification = function(){

    var grid = Ext.getCmp('objectBrowser');

    if (!grid.hasSelection()){
         Ext.Msg.show({
            title: 'Error',
            msg: "No certifications selected",
            buttons: Ext.Msg.OK,
            icon: Ext.MessageBox.WARNING
         });
        return;
    }

    var phaseDialog = new Ext.Window({
        title:'Select Phase',
        width:300,
        items:[
            new Ext.form.ComboBox({
                width:285,
                editable:false,
                queryMode: 'local',
                store:[
                    ['Challenge', 'Challenge'],
                    ['Remediation', 'Remediation'],
                    ['End', 'End']
                ]
            })
        ],
        buttons : [
            {
                text : '#{msgs.button_submit}', 
                handler:function(){

                    var phaseDialog = this.up('window');

                    if ( phaseDialog.getPhase() === ''){
                        Ext.Msg.show({
                            title: 'Error',
                            msg: "Please select a phase",
                            buttons: Ext.Msg.OK,
                            icon: Ext.MessageBox.WARNING
                         });
                        return;
                    }

                    var grid = Ext.getCmp('objectBrowser');

                    var parms = grid.getFormParams();
                    parms.phase = phaseDialog.getPhase();

                    phaseDialog.destroy();
                    grid.deselectAll();

                    var mask = new Ext.LoadMask(Ext.getBody(), {msg:"Please wait..."});
                    mask.show();
                    Ext.Ajax.request({
                        url: SailPoint.getRelativeUrl('/rest/debug/phaseCertification/'),
                        method:'POST',
                        success: function(response){
                            mask.hide();
                            var respObj = Ext.decode(response.responseText);
                            if (!respObj.success && respObj.errorMsg === ''){
                                SailPoint.FATAL_ERR_ALERT();
                            }else {
                                var msg = "";
                                if(respObj.objects.length > 0){
                                    msg += "<ul>";
                                    for(var i=0;i<respObj.objects.length;i++){
                                        msg += "<li> - " + respObj.objects[i] + '</li>';
                                    }
                                    msg += "</ul>";
                                } else {
                                    msg = "Phasing completed with no messges..";
                                }
                                 Ext.Msg.show({
                                    title: 'Phase Complete',
                                    msg: msg,
                                    buttons: Ext.Msg.OK,
                                    icon: Ext.MessageBox.INFO
                                 });
                            }
                        },
                        failure: function(response){
                            mask.hide();
                            SailPoint.FATAL_ERR_ALERT.call(this);
                        },
                        params:parms
                    });
                }
            },
            {
                text : '#{msgs.button_close}',
                cls : 'secondaryBtn',
                handler:function(){
                    var owningWindow = this.up('window');
                    owningWindow.close();
                }
            }
        ],
        getPhase : function(){
            return this.items.get(0).getValue();
        }
    });

    phaseDialog.show();

};

SailPoint.editObject = function(id, className, name) {

    var titleName = name || id;

    var editorConfig = SailPoint.Utils.getCodeEditorConfig({
        xtype: 'codemirror',
        id: 'cmEditor',
        mode: 'application/xml',
        matchTags: {bothTags: true},
        autoCloseTags: true,
        extraKeys: {
            'Ctrl-J': 'toMatchingTag',
            "'<'": CodeMirrorHintHelper.completeAfter,
            "'/'": CodeMirrorHintHelper.completeIfAfterLt,
            "' '": CodeMirrorHintHelper.completeIfInTag,
            "'='": CodeMirrorHintHelper.completeIfInTag,
            'Ctrl-Space': 'autocomplete'
        },
        hintOptions: {schemaInfo: CodeMirrorSailpointObjects, container: win}
    });

    // Since Rule configs have Beanshell code, multiplex the editor so
    // we get appropriate highlighting inside the <Source> tags.
    if (className === 'Rule' && editorConfig.xtype === 'codemirror') {
        editorConfig.mode = 'Rule';
    }

    var saveBtnConfig = {
        xtype: 'button',
        text: '#{msgs.button_save}',
        scope: this,
        handler: function(button, event) {
            var w = button.findParentBy(function(cn, me) {
                if (cn.id === 'debug-editor') {
                    return true;
                }
            });
            button.getEl().mask(Ext.LoadMask.prototype.msg, 'x-mask-loading');
            Ext.Ajax.request({
                scope: this,
                method: 'POST',
                // encode '/' in id path component with special SailPoint replacement
                url: SailPoint.getRelativeUrl('/rest/debug/' + className + '/' + SailPoint.Utils.encodeRestUriComponent(id)),
                success: function(response) {
                    var respObj = Ext.decode(response.responseText);
                    button.getEl().unmask();
                    if (respObj && respObj.failure) {
                        Ext.Msg.show({
                            msg: 'The following object either contains an electronic signature<br/>' +
                                'or has already been signed off on and cannot be saved:<br/><br/><strong>' +
                                respObj.errors.join('<br/>') + '</strong><br/>',
                            buttons: Ext.Msg.OK,
                            icon: Ext.Msg.ERROR
                        });
                    }
                    else {
                        if (w) {
                            w.close();
                        }
                    }
                },
                failure: function(response) {
                    button.getEl().unmask();
                    SailPoint.FATAL_ERR_ALERT.call(this);
                },
                params: {xml: w.getXml()}
            });
        }
    };

    var closeBtnConfig = {
        xtype: 'button',
        text: '#{msgs.button_close}',
        cls: 'secondaryBtn',
        handler: function(button, event) {
            var w = button.findParentBy(function(cn, me) {
                if (cn.id === 'debug-editor') {
                    return true;
                }
            });
            if (w) {
                w.close();
            }
        }
    };

    var toolbarConfig = {
        xtype: 'toolbar',
        dock: 'bottom',
        layout: {pack: 'end'},
        ui: 'footer',
        items: [closeBtnConfig]
    };

    if (id !== 'configCache') {
        toolbarConfig.items.unshift(saveBtnConfig);
    }

    var editorIndex = 0;

    var bva = SailPoint.getBrowserViewArea();

    var win = Ext.create('Ext.Window', {
        id: 'debug-editor',
        title: '#{msgs.object_editor_title} - ' + className + ' : ' + titleName,
        width: (bva.width - 200),
        height: (bva.height - 30),
        layout: 'fit',
        modal: true,
        items: [editorConfig],
        useTextEditor: function() {
            this.items.clear();
            this.items.add(0, Ext.create('Ext.form.Label',{html:'<div align="center" class="cm-large-file-warning">#{msgs.cm_warning_large_file}</div>'}));
            this.items.add(1, Ext.create('Ext.form.field.TextArea',{}));
            this.updateLayout();
            editorIndex = 1;
        },
        setXml: function(xml) {
            this.items.get(editorIndex).setValue(xml);
        },
        getXml: function() {
            return this.items.get(editorIndex).getValue();
        },
        dockedItems: [toolbarConfig]
    });

    if (id !== '') {

        // encode '/' in id path component with special SailPoint replacement
        var url = '/rest/debug/' + className + '/' + SailPoint.Utils.encodeRestUriComponent(id);
        if (id === 'configCache') {
            url = '/rest/debug/Cache';
        }

        Ext.Ajax.request({
            scope: win,
            url: SailPoint.getRelativeUrl(url),
            success: function(response) {
                this.getEl().unmask();
                var respObj = Ext.decode(response.responseText);
                if (!respObj.success && respObj.errorMsg === '') {
                    SailPoint.FATAL_ERR_ALERT();
                }
                else {
                    var obj = '';

                    if (respObj.objects && respObj.objects.length > 0) {
                        obj = respObj.objects[0].xml;
                        // If the object has been electronically signed, disable editing.
                        if (respObj.objects[0].readOnly === true) {
                            this.items.get(editorIndex).getEl().addCls('x-item-disabled');
                            this.getDockedItems('toolbar[dock="bottom"]')[0].items.items[0].setDisabled(true);
                        }
                    }
                    else if (respObj.object) {
                        obj = respObj.object;
                    }

                    // CodeMirror gets slow with large documents, so fall back
                    // to the plain textarea if we're over an arbitrary limit.
                    if(obj && obj.length > SailPoint.MAX_EDITABLE_FILE_LENGTH) {
                        this.useTextEditor();
                    }

                    this.setXml(obj);
                }
            },
            failure: function(response) {
                this.getEl().unmask();
                SailPoint.FATAL_ERR_ALERT.call(this);
            }
        });
    }

    win.show();

    if (id !== '') {
        win.getEl().mask(Ext.LoadMask.prototype.msg, 'x-mask-loading');
    }

    // Need to set this AFTER the component is created since the hints
    // need to be drawn inside the Ext container, not the body document.
    CodeMirrorHintHelper.setContainer(Ext.get('cmEditor'));
};


SailPoint.initObjectBrowser = function(classList){

    // ---------------------------------------------------------
    //  Build the grids
    // ---------------------------------------------------------

    var debugStore = SailPoint.Store.createRestStore({
        storeId:'debugStore',
        url: SailPoint.getRelativeUrl('/rest/debug'),
        remoteSort:true,
        defaultSort:'name',
        fields:['id', 'name', 'created', 'modified','className'],
        sorters:[{property: "name", direction: "ASC"}],
        simpleSortMode : true
    });

    var quickSearch = new Ext.app.SearchField ({
        id:'searchField',
        store:debugStore,
        emptyText:'Filter by Name or ID'
    });

    var actionsList = [['new', 'New'], ['delete', 'Delete']];

    var actionsCombo =  new Ext.form.ComboBox({
        store:actionsList,
        editable:false,
        queryMode: 'local',
        triggerAction: 'all',
        emptyText:'Select an action',
        width:190,
        defaultActions : actionsList
    });

    actionsCombo.on('select', function(combo, recordsArray, index){

        var action = recordsArray[0].get('field1');

        var grid = Ext.getCmp("objectBrowser");
        
        if (action !== "new" && !grid.hasSelection()){
            alert('No items were selected.');
            return;
        }

        if (action === 'new'){
            var className = grid.getSelectedClass();
            SailPoint.editObject("", className);
        }
        else if (action === 'certPhase'){
            SailPoint.phaseCertification();
        }
        else if (action === 'clearPrefs'){
            Ext.Msg.confirm('Confirm Clear Preferences', 'Are you sure you want to clear the preferences on the selected identity(s)?', function(btn, text){
                if (btn === 'yes'){

                    var parms = grid.getFormParams();

                    Ext.Ajax.request({
                        scope:this,
                        method:'POST',
                        url: SailPoint.getRelativeUrl('/rest/debug/' + grid.getSelectedClass() + "/clearPreferences"),
                        success: function(response){
                            var grid = Ext.getCmp("objectBrowser");
                            grid.clearCheckboxState();
                            grid.reload();
                        },
                        failure: function(response){
                            SailPoint.FATAL_ERR_ALERT.call(this);
                        },
                        params:parms
                    });

                }
            });
        }
        else if (action === 'delete'){
            Ext.Msg.confirm('Confirm Delete', 'Are you sure you want to delete the selected object(s)?', function(btn, text){
                if (btn === 'yes'){

                    var parms = grid.getFormParams();
                    
                    //Get the query string from last store load 
                    var store = Ext.StoreMgr.get('debugStore');
                    var extraParms = store.getProxy().extraParams;
                    if (extraParms) {
                       var searchVal = extraParms.query;
                       parms.query = searchVal;
                    }

                    Ext.Ajax.request({
                        scope:this,
                        method:'POST',
                        url: SailPoint.getRelativeUrl('/rest/debug/bulkDelete/' + grid.getSelectedClass()),
                        success: function(response){
                            var respObj = Ext.decode(response.responseText);
                            if(respObj && respObj.warnings && respObj.warnings.length > 0) {
                                Ext.Msg.show({
                                    msg: "The following object(s) are read only and were not deleted:<br/><br/><strong>" + respObj.warnings.join("<br/>") + "</strong><br/>",
                                    buttons: Ext.Msg.OK,
                                    icon: Ext.Msg.WARNING
                               });
                            }
                            var grid = Ext.getCmp("objectBrowser");
                            grid.clearCheckboxState();
                            grid.reload();
                        },
                        failure: function(response){
                            SailPoint.FATAL_ERR_ALERT.call(this);
                        },
                        params:parms
                    });
                }
            });
        }
        combo.reset();
    });

    var classPicker =  new Ext.form.ComboBox({
        store : classList,
        typeAhead: true,
        queryMode: 'local',
        triggerAction: 'all',
        emptyText:'Select an object',
        width:190,
        lastSelected : null
    });

    classPicker.on('select', function(combo, records, eOpts){
        
        if(typeof records[0].raw[0] === 'undefined'){
            return;
        }
        if (records[0].raw[0] === 'Certification'){
            var data = actionsCombo.defaultActions.concat([['certPhase','Phase Certification']]);
            actionsCombo.getStore().loadData(data);
        } else if (records[0].raw[0] === 'Identity'){
            var data = actionsCombo.defaultActions.concat([['clearPrefs','Clear Preferences']]);
            actionsCombo.getStore().loadData(data);
        } else {
            actionsCombo.getStore().loadData(actionsCombo.defaultActions);
        }

        //Reset sorters in case of different columns between types
        this.sorters.clear();
        this.sorters.add(new Ext.util.Sorter({
            property : 'name',
            direction: 'ASC'
        }));
        
        this.clearPathParams();
        this.appendPathParam(records[0].raw[0]);
        //Set lastSelected so we don't throw NPE if combo value is cleared
        classPicker.lastSelected = records[0].raw[0];
        this.loadPage(1);
        
    }, debugStore);


    var ruleList = {
        id:'ruleList',
        xtype:'spcombo',
        editable:true,
        typeAhead:true,
        forceSelection:true,
        suggest:true,
        width:300,
        datasourceUrl:"/rest/suggest/object/Rule"
    };

    var ruleButton = new Ext.Button({
        text:'Run Rule',
        handler:function(){
            var browser = Ext.getCmp('objectBrowser');
            browser.getEl().mask();

            var ruleId = Ext.getCmp('ruleList').getValue();

            Ext.Ajax.request({
                scope:this,
                method:'GET',
                url: SailPoint.getRelativeUrl('/rest/debug/Rule/'+ruleId+'/run'),
                success: function(response){
                    var browser = Ext.getCmp('objectBrowser');
                    browser.getEl().unmask();
                    var respObj = Ext.decode(response.responseText);
                    var result = respObj.object;
                    var win = new Ext.Window({
                        id:'ruleWin',
                        title:'Rule Results',
                        width:1000,
                        height:400,
                        layout:'fit',
                        items:[
                            new Ext.form.TextArea({
                                value:result
                            })
                        ],
                        buttons : [
                            {
                                text:'Close',
                                handler:function(){
                                    var win = Ext.getCmp('ruleWin');
                                    win.destroy();
                                }
                            }
                        ]
                    });
                    win.show();
                },
                failure: function(response){
                    var browser = Ext.getCmp('objectBrowser');
                    browser.getEl().unmask();
                    SailPoint.FATAL_ERR_ALERT.call(this);
                }
            });
        }
    });

    var quickActionPicker = {
        text: 'Configuration Objects',
        menu: {
            xtype: 'menu',
            plain: true,
            items: [
                {
                    text: 'System Configuration',
                    handler : function(){
                        SailPoint.editObject('SystemConfiguration', 'Configuration');
                    }
                },
                {
                    text: 'UI Configuration',
                    handler : function(){
                        SailPoint.editObject('UIConfig', 'UIConfig');
                    }
                },
                {
                    text: 'Identity Configuration',
                    handler : function(){
                        SailPoint.editObject('Identity', 'ObjectConfig');
                    }
                },
                {
                    text: 'Link Configuration',
                    handler : function(){
                        SailPoint.editObject('Link', 'ObjectConfig');
                    }
                },
                
                {
                    text: 'Electronic Signature Configuration',
                    handler : function(){
                        SailPoint.editObject('ElectronicSignature', 'Configuration');
                    }
                },
                
                {
                    text: 'SAML Configuration',
                    handler: function() {
                        SailPoint.editObject('SAML', 'Configuration');
                    }
                },

                /*

                todo jfb
                I ported this methods over but I'm not it actually
                ever worked. So commenting them out for now.
                ,
                     {
                text: 'View Configuration Cache',
                    handler : function(){
                        SailPoint.editObject("configCache", "");
                    }
                },
                */
                {
                    text: 'Reset Configuration Cache',
                    handler : function(){
                        var browser = Ext.getCmp('objectBrowser');
                        browser.getEl().mask();
                        Ext.Ajax.request({
                            scope:this,
                            method:'GET',
                            url: SailPoint.getRelativeUrl('/rest/debug/Cache/reset'),
                            success: function(response){
                                var browser = Ext.getCmp('objectBrowser');
                                browser.getEl().unmask();

                            },
                            failure: function(response){
                                var browser = Ext.getCmp('objectBrowser');
                                browser.getEl().unmask();
                                SailPoint.FATAL_ERR_ALERT.call(this);
                            }
                        });
                    }
                }
            ]
        }
    };

    var grid = new SailPoint.grid.PagingCheckboxGrid({

        id:'objectBrowser',
        title:'Object Browser',
        loadMask:true,
        dynamic:true,
        columns: [
            {
                name: 'id',
                dataIndex: 'id',
                header:'ID',
                sortable: true,
                width:275
            },
            {
                name: 'name',
                dataIndex: 'name',
                header:'Name',
                sortable: true,
                width:200
            },
            {
                name: 'created',
                dataIndex: 'created',
                header:'Created',
                sortable: true,
                width:140
            },
            {
                name: 'modified',
                dataIndex: 'modified',
                header:'Last Modified',
                sortable: true,
                width:140
            }
        ],
        viewConfig:{
            autoFill:true,
            stripeRows:true
        },
        store : debugStore,
        tbar:[classPicker, ' ' , quickSearch, ' ' ,quickActionPicker, ' ' , '-' , ' ', ruleList, ruleButton, '->', actionsCombo],
        usePageSizePlugin:true,
        getSelectedClass : function(){
            if(classPicker.getValue()) {
                return classPicker.getValue();
            }
            else {
                return classPicker.lastSelected;
            }
        }
    });

    grid.on("itemclick", function(gridView, record, HTMLitem, index, e, eOpts){

        if (this.isCheckboxClick(e)) {
            return;
        }

        SailPoint.editObject(record.getId(), this.getSelectedClass(), SailPoint.getNameForTitle(record));

    }, grid);

    return grid;
};

SailPoint.getNameForTitle = function(record) {
    var i,
        title = null,
        attr = ['name', 'identityName', 'identity-name', 'owner-name', 'quickKey', 'question', 'value'];

    for(i = 0; i < attr.length; i++) {
        title = record.get(attr[i]);
        if(title) {
            break;
        }
    }

    return title;
};
