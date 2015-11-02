Ext.ns('SailPoint', 
       'SailPoint.Monitor', 
       'SailPoint.Monitor.Grid',
       'SailPoint.Monitor.Grid.Certifications');

SailPoint.Monitor.Grid.Certifications.createPanel = function(activeTab, stateIds, fields, schedulesCols, eventsCols, groupsCols) {

  activeTab = activeTab != '0' ? activeTab : 'certificationGroupsGrid';
  
  var schedulesGrid = SailPoint.Monitor.Grid.Certifications.createSchedulesGrid(stateIds[0], fields[0], schedulesCols, activeTab);
  var eventsGrid = SailPoint.Monitor.Grid.Certifications.createEventsGrid(stateIds[1], fields[1], eventsCols, activeTab);
  var certificationGroupsGrid = SailPoint.Monitor.Grid.Certifications.createCertificationGroupsGrid(stateIds[2], fields[2], groupsCols, activeTab);
  
  return {
    xtype : 'sptabpanel',
    activeTab: activeTab,
    plain: true,
    deferredRender: true,
    firstActivated: true, // revert for ext 4 - DD
    layoutOnTabChange: true,
    defaults: {layout: 'fit', autoScroll: true},
    items: [certificationGroupsGrid, schedulesGrid, eventsGrid],
    listeners : {
        /** If the tab panel is loading for the first time, ignore the first tab change refresh
         * as we will already be loading that panel's grid with an auto-load.  Bug 5700. PH
         */
        tabchange : {
            fn : function(tabPanel, panel) {
                if(!tabPanel.firstActivated) {
                    tabPanel.firstActivated = true;
                } else {
                     if (panel.reload) {
                        panel.reload();
                     }
                }
            }
        }
    }
  };
};

SailPoint.Monitor.Grid.Certifications.createSchedulesGrid = function(stateId, fields, cols, activeTab) {

    var schedulesStore = SailPoint.Store.createStore({
        storeId : 'schedulesStore',
        url : SailPoint.getRelativeUrl('/monitor/scheduleCertifications/viewScheduledCertificationsDataSource.json'),
        fields : fields,
        root : 'objects',
        totalProperty : 'count',
        remoteSort : true,
        autoLoad : (activeTab == 'certificationSchedulesGrid'),
        sorters : [ {property : 'nextExecution', direction: 'ASC'} ],
        simpleSortMode : true
    });

    return {
        xtype : 'paginggrid',
        store : schedulesStore,
        id : 'certificationSchedulesGrid',
        cls : 'smallFontGrid selectableGrid',
        stateId : stateId,
        stateful : true,
        columns : cols,
        viewConfig : {
            stripeRows : true
        },
        layout : 'fit',
        title : '#{msgs.grid_title_scheduled_certifications}',
        tbar : [ {
            xtype : 'searchfield',
            store : schedulesStore,
            paramName : 'name',
            storeLimit : 20,
            emptyText : '#{msgs.label_filter_by_schedule_name}',
            width : 250
        } ],
        listeners : {
            itemclick : SailPoint.Monitor.Grid.CertificationSchedules.cellClickHandler,
            itemcontextmenu : SailPoint.Monitor.Grid.CertificationSchedules.contextMenuHandler
        }
    };

};

SailPoint.Monitor.Grid.Certifications.createEventsGrid = function(stateId, fields, cols, activeTab) {

    var eventsStore = SailPoint.Store.createStore({
        storeId : 'eventsStore',
        url : SailPoint.getRelativeUrl('/monitor/scheduleCertifications/viewEventsDataSource.json'),
        fields : fields,
        root : 'objects',
        totalProperty : 'count',
        remoteSort : true,
        autoLoad : (activeTab == 'certificationEventsGrid'),
        sorters : [ {property : 'name'} ],
        simpleSortMode : true
    });

    return {
        xtype : 'paginggrid',
        store : eventsStore,
        id : 'certificationEventsGrid',
        cls : 'smallFontGrid selectableGrid',
        stateId : stateId,
        stateful : true,
        columns : cols,
        viewConfig : {
            stripeRows : true
        },
        layout : 'fit',
        title : '#{msgs.grid_title_certification_events}',
        tbar : [{
            xtype : 'searchfield',
            store : eventsStore,
            paramName : 'triggerSearch',
            storeLimit : 20,
            emptyText : '#{msgs.label_filter_by_event_name}',
            width : 250
        }, ' ', {
            xtype : 'button',
            text : '#{msgs.cert_event_new_cert_event_btn}',
            scale : 'medium',
            cls : 'primaryBtn',
            handler : function() {
                Ext.getDom("editForm:newEventButton").click();
            }
        } ],
        listeners : {
            itemclick : SailPoint.Monitor.Grid.CertificationEvents.cellClickHandler,
            itemcontextmenu : SailPoint.Monitor.Grid.CertificationEvents.contextMenuHandler
        }
    };
};

SailPoint.Monitor.Grid.Certifications.createCertificationGroupsGrid = function(stateId, fields, cols, activeTab) {

    return {
        xtype : 'certificationsgrid',
        id: 'certificationGroupsGrid',
        title: '#{msgs.cert_sched_groups_tab}',
        stateId: stateId,
        stateful: true,
        viewConfig: {stripeRows:true},
        columns: cols,
        autoLoadStore: (activeTab==0 || activeTab=='certificationGroupsGrid'),
        fields: fields,
        columnConfig: 'certificationsTableColumns'
    };
    
};

renderStatus = function(value, p, r) {
    var statusId = r.get('statusId');
    if (statusId === '')
        return '';
    else if(statusId == 1)
        return '<span class=\'successBox font10\' >#{msgs.success}</span>';
    else if(statusId == 2)
        return Ext.String.format('<span class=\'warnBox font10\' >#{msgs.warning}</span>',value);
    else if(statusId == 0)
        return Ext.String.format('<span class=\'failBox font10\' >#{msgs.fail}</span>',value);
    else if(value == null)
        return '';
    else
        return Ext.String.format('{0}', value);
};
