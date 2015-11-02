/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint',
    'SailPoint.Dashboard');

//Global Variables
SailPoint.Dashboard.expanderLock = false;
SailPoint.Dashboard.removerLock = false;
SailPoint.Dashboard.undoLock = false;
SailPoint.Dashboard.sortableState = [];

SailPoint.Dashboard.initializeDashboard = function() {
    var sortablesMedium1 = Ext.DomQuery.select('div[class*=dMedium1]');
    var sortablesMedium2 = Ext.DomQuery.select('div[class*=dMedium2]');
    var sortablesXtraLarge1 = Ext.DomQuery.select('div[class*=dXtraLarge1]');
    var sortables = sortablesMedium1.concat(sortablesMedium2).concat(sortablesXtraLarge1);

    sortablesMedium1.each(function (sortable) {
        SailPoint.Dashboard.createDashSortable(sortable, 'dashboardForm:colMedium1', sortables, 'Medium1');
    });

    sortablesMedium2.each(function (sortable) {
        SailPoint.Dashboard.createDashSortable(sortable, 'dashboardForm:colMedium2', sortables, 'Medium2');
    });

    sortablesXtraLarge1.each(function (sortable) {
        SailPoint.Dashboard.createDashSortable(sortable, 'dashboardForm:colXtraLarge1', sortables, 'XtraLarge1');
    });

    var DragObserver = Class.create();

    DragObserver.prototype = {
        initialize: function(element) {
            this.element   = $(element);
        },

        onStart: function() {
            SailPoint.Dashboard.adjustSortableHeight('dashContentPanel', 'false');
        },

        onEnd: function() {
            SailPoint.Dashboard.clearHeights('dashContentPanel');
        }
    };

    Draggables.addObserver(new DragObserver($('dashboard')));

    var portlets = Ext.DomQuery.select('div[class*=dashContentPanel]');

    portlets.each(function (portlet) {
        var content = Ext.DomQuery.select('div[class*=dashContentBody]', portlet)[0];
        var expander = Ext.DomQuery.select('img[class=dashContentExpandBtn]', portlet)[0];
        var remover = Ext.DomQuery.select('img[class*=dashContentRemoveBtn]', portlet)[0];

        Event.observe(
            expander, 'click',
            function (e) {
                //Uses a lock so that a user can't press it several times.
                if(!SailPoint.Dashboard.expanderLock) {
                    SailPoint.Dashboard.expanderLock = true;
                    referenceId = (expander.id.split("_"))[1];

                    if($(referenceId + '_outerBody'))
                    {
                        expander.src = SailPoint.getRelativeUrl("/images/icons/plus.png");
                    }
                    else
                    {
                        expander.src = SailPoint.getRelativeUrl("/images/icons/minus.png");
                    }

                    $('dashboardForm:contentId').value = portlet.id;
                    $('dashboardForm:contentBodyBtn_' + referenceId).click();

                    if($('undoDiv').visible())
                        Effect.BlindUp('undoDiv');

                    SailPoint.Dashboard.expanderLock = false;
                } else {
                    SailPoint.Dashboard.expanderLock = false;
                }
            },
            false
        );

        if(remover && !Ext.get(remover).hasCls('required')) {
            Event.observe(
                remover, 'click',
                function (e) {
                    //Uses a lock so that a user can't press it several times.
                    if(!SailPoint.Dashboard.removerLock) {
                        SailPoint.Dashboard.removerLock = true;
                        $('dashboardForm:contentId').value = portlet.id;
                        $('dashboardForm:removeButton').click();

                        $('undoDiv').style.display='';
                        Effect.BlindUp(portlet);
                        setTimeout(function() {SailPoint.Dashboard.removerLock = false;}, 1000);
                    }
                },
                false
            );
        }
    });

    Event.observe(
        $('undo'), 'click',
        function (e) {
            if(!SailPoint.Dashboard.undoLock) {
                SailPoint.Dashboard.undoLock = true;
                SailPoint.Dashboard.clearHeights('dashContentPanel');
                Effect.BlindDown($('dashboardForm:contentId').value);
                Effect.BlindUp('undoDiv');

                $('dashboardForm:undoButton').click();
                setTimeout(function() {SailPoint.Dashboard.undoLock = false;}, 1000);
            }
        },
        false
    );

    Event.observe(
        $('removeUndo'), 'click',
        function (e) {Effect.BlindUp('undoDiv');},
        false
    );

    Ext.QuickTips.init();
    var quicklink_tips = Ext.DomQuery.select('a[class=quicklink_tip]');
    quicklink_tips.each(function(tip) {

        /** We store the action in the rel attribute of the element so we can quickly get to it **/
        var action = tip.getAttribute('rel');
        var currentIdentity = tip.getAttribute('title');
        tip.setAttribute('title','');

        Ext.create('SailPoint.ClickToolTip', {
            html: "<a href=\"javascript:SailPoint.Dashboard.MySubordinates.chooseQuickLink('"+action+"', '"+currentIdentity+"')\">#{msgs.for_me}</a><br/>"
                + "<a href=\"javascript:SailPoint.Dashboard.MySubordinates.chooseQuickLink('"+action+"')\">#{msgs.for_others}</a>",
            target: tip.id,
            bodyCls: 'quickLinkToolTipBody',
            anchor: 'left',
            hideDelay: 2000,
            listeners: {
                'show' : function(tip) {
                    tip.el.on('mouseover', function() {
                        this.clearTimer('hide');
                        this.clearTimer('dismiss');
                    }, tip);

                    tip.el.on('mouseout', function() {
                        this.clearTimer('show');
                        if (this.autoHide !== false) {
                            this.delayHide();
                        }
                    }, tip);

                }
            }

        })
    });
}


SailPoint.Dashboard.initializeEditDashboard = function() {
    var sortablesUnselected = Ext.DomQuery.select('div[class*=dMedium1]');
    var sortablesSelected = Ext.DomQuery.select('div[class*=dMedium2]');
    var sortables = sortablesUnselected.concat(sortablesSelected);

    sortablesUnselected.each(function (sortable) {
        Sortable.create(sortable, {
            containment: sortables,
            constraint: false,
            tag: 'div',
            dropOnEmpty: true,
            hoverclass: 'dashContentHover',
            handle: 'handle',
            onUpdate: function (container) {
                SailPoint.Dashboard.updateContentChoices(sortable, 'dUnselected dashContentItem');
            }
        })
    });

    sortablesSelected.each(function (sortable) {
        Sortable.create(sortable, {
            containment: sortables,
            constraint: false,
            tag: 'div',
            only: 'dashContentItem',
            dropOnEmpty: true,
            hoverclass: 'dashContentHover',
            handle: 'handle',
            onUpdate: function (container) {
                $('contentForm:contentSelected').value = Sortable.serialize(sortable);
                SailPoint.Dashboard.updateContentChoices(sortable, 'dSelected dashContentItem');
            }
        })
        $('contentForm:contentSelected').value = Sortable.serialize(sortable);
    });

    var DragObserver = Class.create();

    DragObserver.prototype = {
        initialize: function(element) {
            this.element   = $(element);
        },

        onStart: function() {
            SailPoint.Dashboard.adjustSortableHeight('dashContentItem', 'false');
        },

        onEnd: function() {
            SailPoint.Dashboard.clearHeights('dashContentItem');
        }
    };

    Draggables.addObserver(new DragObserver($('dashboard')));

}

SailPoint.Dashboard.addRequiredContent = function(element) {
    var required = Ext.DomQuery.select('div[class$=dashContentItemRequired]', 'contentForm:dashContentChosen');
    for ( var i = 0; i < required.length; i++) {
        var parts = required[i].id.split("_");
        if (element.value) {
            element.value = element.value += "&contentForm%3AdashContentChosen[]=" + parts[1];
        } else {
            element.value = "contentForm%3AdashContentChosen[]=" + parts[1];
        }
    }
}

//Function for creating the sortables on the dashboard
SailPoint.Dashboard.createDashSortable = function(sortable, id, sortables, regionName) {

    Sortable.create(sortable, {
        containment: sortables,
        constraint: false,
        tag: 'div',
        only: 'dashContentPanel',
        dropOnEmpty: true,
        hoverclass: 'dashContentHover',
        handle: 'handle',
        hideContent: true,
        onUpdate: function (container) {
            SailPoint.Dashboard.clearHeights('dashContentPanel');
            var newVal = Sortable.serialize(sortable);

            var updateMethodName = 'updateDashboard' + regionName;
            if (window[updateMethodName]) {
                window[updateMethodName](id, newVal);
            }

            SailPoint.Dashboard.refreshContent(id, newVal);

            SailPoint.Dashboard.sortableState[id] = newVal;
        }
    });

    SailPoint.Dashboard.sortableState[id] = Sortable.serialize(sortable);
}

SailPoint.Dashboard.refreshContent = function(key, newValue) {
    var oldValue = SailPoint.Dashboard.sortableState[key];
    var oldArr = [];

    if(oldValue) {
        var oldItems = oldValue.split("&");
        for(var i=0; i<oldItems.length; i++) {
            var oldPieces = oldItems[i].split("=");
            oldArr.push(oldPieces[1]);
        }
    }

    if(newValue) {
        var newItems = newValue.split("&");
        for(var i=0; i<newItems.length; i++) {
            var newPieces = newItems[i].split("=");
            var contentId = newPieces[1];
            if(oldArr.indexOf(contentId)<0) {
                var header = Ext.get(contentId+'_header');
                var panel = header.parent();
                var panelString = '';
                if(panel.panelString) {
                    panelString = panel.panelString;
                } else {
                    var panelParts = panel.id.split("_");
                    var panelString = panelParts[0].substring(0, panelParts[0].length-1);
                }

                var container = panel.parent();
                var containerString = container.id.substring(10, container.id.length-1);

                if(panelString!=containerString) {
                    $('dashboardForm:contentRefreshBtn_' + contentId).click();
                }

                panel.panelString = containerString;

            }
        }
    }
}

/** Function take as input the following values:
 itemId - the dashboard item id to be updated
 value - the value on its preference map to be set
 valueHolder - the inputHidden element that will hold the value
 when it is passed to the bean.
 */
SailPoint.Dashboard.updateDashItem = function(itemId, value, valueHolder) {
    valueHolder.value = value;
    $('dashboardForm:contentId').value = itemId;
    $('dashboardForm:dashItemUpdateButton').click();
}

SailPoint.Dashboard.toggleItem = function(element, condition){
    if(condition =='true') {
        Effect.toggle($(element));
    }
}

// Function used on dashboard/editDashboard.xhtml.  Purpose is to change the
SailPoint.Dashboard.updateContentChoices = function(parentElement, style) {
    var childrenDivs = Ext.DomQuery.select('div[class*=dashContentItem]', parentElement);
    for(var i=0; i<childrenDivs.length; i++) {
        if(childrenDivs[i].className != style && childrenDivs[i].className.indexOf('Required') == -1) {
            childrenDivs[i].className = style;
        }
    }
}

SailPoint.Dashboard.jsRiskScores = function(component, band, group)
{
    //alert("COMPONENT: " + component + " | BAND: " + band + " | GROUP: " + group);
    if(group!=null && group!="") {
        $('dashboardForm:scoreGroup').value = group;
        //Need to strip out the group value from the component string.
        //It is being returned as "group value | date" so we need to get the "group value"

        comp = component.substring(0, (component.indexOf("|")-1));
        //alert(comp);
        $('dashboardForm:scoreComponent').value = comp;
    }
    $('dashboardForm:scoreCategory').value = band;
    $('dashboardForm:riskScoresButton').click();
}

SailPoint.Dashboard.viewCertificationItem = function(id)
{
    $('dashboardForm:selectedIdCI').value = id;
    $('dashboardForm:viewCertificationButtonCI').click();
}

function viewWorkItemListItem(id, condition)
{
    $('dashboardForm:selectedIdWI').value = id;
    if(condition)
        $('dashboardForm:viewCertificationButtonWI').click();
    else
        $('dashboardForm:viewWorkItemButton').click();
}

SailPoint.Dashboard.clearHeights = function(panelClass)
{
    var dashSortables = Ext.DomQuery.select('div[class*=dashColumn]');
    var dashTable = Ext.DomQuery.select('table[id=dashTable]')[0];

    for(i=0; i<dashSortables.length; i++)
    {
        dashSortables[i].style.height = '';
    }
    dashTable.style.height = '';
}

SailPoint.Dashboard.selectLayout = function(element, button)
{
    var layoutTable = Ext.DomQuery.select('table[id=layoutTable]')[0];
    var layoutColumns = layoutTable.getElementsByTagName("TD");
    for(var i = 0; i < layoutColumns.length; i++) {
        if(layoutColumns[i].className === 'selectedYellow') {
            layoutColumns[i].className = '';
        }
    }
    element.className = 'selectedYellow';
    var btn = document.getElementById(button);
    btn.value = element.id;
}

SailPoint.Dashboard.adjustSortableHeight = function(panelClass, condition)
{
    var dashSortables = Ext.DomQuery.select('div[class*=dashColumn]');
    var dashTable = Ext.DomQuery.select('table[id=dashTable]')[0];
    var sortablePadding = 40;
    var tablePadding = 10;
    var margin = 2;

    var maxHeight = 0;
    //loop through and get the maximum height
    for(i=0; i<dashSortables.length; i++)
    {
        /** We don't need to worry about the height of the xtra large column since it
         * doesn't site side-by-side with anything
         */
        if(dashSortables[i].id == 'dashColumnXtraLarge1') {
            continue;
        }
        var sortableHeight = 0;
        var panels = dashSortables[i].getElementsByTagName('DIV');
        for(j=0; j<panels.length; j++)
        {
            if(panels[j].className.lastIndexOf(panelClass) > 0)
            {
                sortableHeight += (panels[j].offsetHeight + margin);
            }
        }
        //Need to compensate for padding on top and bottom
        sortableHeight += sortablePadding;

        if(sortableHeight > maxHeight)
            maxHeight = sortableHeight;
    }

    //now find all sortables that are shorter, and adjust them.
    for(k=0; k<dashSortables.length; k++)
    {
        /** We don't need to worry about the height of the xtra large column since it
         * doesn't site side-by-side with anything
         */
        if(dashSortables[k].id == 'dashColumnXtraLarge1') {
            continue;
        }
        var sortableHeight = dashSortables[k].offsetHeight;
        if(sortableHeight < maxHeight)
        {
            dashSortables[k].style.height = (maxHeight - sortablePadding) + "px";
        }
    }

    dashTableHeight = maxHeight + tablePadding;
    if(dashTable.clientHeight != dashTableHeight && (condition == 'true'))
    {
        dashTable.style.height = dashTableHeight + "px";
    }
}

SailPoint.Dashboard.resetDashHeight = function(element, condition) {
    SailPoint.Dashboard.clearHeights();

    if(element==null)
        var element = 'dashContentPanel';
    if(condition==null)
        var condition = 'false';
    SailPoint.Dashboard.adjustSortableHeight(element, condition);
}

//Used by the certification completion status dashboard panels to show/hide the list of certifications
//for this user
SailPoint.Dashboard.toggleCertPercentDisplay = function(id, condition, btnHolder, idHolder) {
    details = $(id);
    if(btnHolder.className != 'empty') {
        if(details && !(details.visible())) {
            if(idHolder) {
                idHolder.value = id;
            }
            children = btnHolder.getElementsByTagName('input');
            if(children) {
                btn = children[0];
                btn.click();
            }
        }
        SailPoint.Dashboard.toggleItem(id, condition);
    }
}

SailPoint.Dashboard.loadCerts = function(btnHolder) {
    children = btnHolder.getElementsByTagName('input');
    if(children)
        btn = children[0];
    btn.click();
}


var loadingMessage = document.createElement('div');
loadingMessage.className = 'loadingSpinnerMessageDiv';
loadingMessage.innerHTML = '#{msgs.dash_loading}';

SailPoint.Dashboard.displayLoadingMessage = function(idName) {
    var messageContents = loadingMessage;

    var displayDiv = $('spBackground'+idName);

    displayDiv.appendChild(messageContents);

    var msgWidth = messageContents.offsetWidth;
    var msgHeight = messageContents.offsetHeight;
    var displayDivHeight = displayDiv.offsetHeight;
    var displayDivWidth = displayDiv.offsetWidth;

    messageContents.style.top = Math.round((displayDivHeight - msgHeight) / 2) + 'px';
    messageContents.style.left = Math.round((displayDivWidth - msgWidth) / 2) + 'px';
}

SailPoint.Dashboard.hideLoadingMessage = function(idName) {
    try {
        $('spBackground'+idName).removeChild(loadingMessage);
    } catch (Exception) {}
};


function renderChartGroupSuggest(chartName, index) {
    if(!Ext.getCmp(chartName+'_groupSuggest_'+index+"_cmp")) {
        var group = $(chartName+'_groupOptions_'+index).value;

        var groupsMultiSuggest = new SailPoint.MultiSuggest({
            cls:'chartSuggest',
            id: chartName+'_groupSuggest_'+index+'_cmp',
            suggestType: 'group',
            jsonData: JSON.parse($(chartName+'_groupSuggest_'+index+'_multiData').value),
            inputFieldName: 'groupsSuggest',
            baseParams: {'type': 'group'},
            width:250
        });

        groupsMultiSuggest.render(chartName+'_groupSuggest_'+index);

        groupsMultiSuggest.suggest.store.on('beforeload', function(store) {
            var group = $(chartName+'_groupOptions_'+index).value;
            if(group && group!=' ') {
                store.getProxy().extraParams['group'] = group;
            } else {
                store.getProxy().extraParams['group'] = '';
            }
        },this);

    }
}

function updateChartGroupSuggest(chartName, index, value) {
    var multi = Ext.getCmp(chartName+'_groupSuggest_'+index+"_cmp");
    if(multi) {
        multi.clear();
        multi.suggest.store.load();
    }
}


/** Chart functions **/

function reRenderChart(index, btn, chartName, formName) {
    //These four fields with their values getting set are located on the dashboard.xhtml
    if($(formName+':'+chartName+'_selectedChartType') && $(chartName+'_typeOptions_' + index))
        $(formName+':'+chartName+'_selectedChartType').value=$(chartName+'_typeOptions_' + index).options[$(chartName+'_typeOptions_' + index).selectedIndex].value;

    if($(formName+':'+chartName+'_selectedDateRange') && $(chartName+'_rangeOptions_' + index))
        $(formName+':'+chartName+'_selectedDateRange').value=$(chartName+'_rangeOptions_' + index).options[$(chartName+'_rangeOptions_' + index).selectedIndex].value;

    if($(formName+':'+chartName+'_selectedGroup') && $(chartName+'_groupOptions_' + index))
        $(formName+':'+chartName+'_selectedGroup').value=$(chartName+'_groupOptions_' + index).options[$(chartName+'_groupOptions_' + index).selectedIndex].value;

    if($(formName+':'+chartName+'_referenceIndex') && $(formName+':'+chartName+'_realReferenceIndex_' + index))
        $(formName+':'+chartName+'_referenceIndex').value=$(formName+':'+chartName+'_realReferenceIndex_' + index).value;

    var multi = Ext.getCmp(chartName+'_groupSuggest_'+index+"_cmp");
    if(multi) {
        $(formName+':'+chartName+'_selectedValues').value = multi.getValue();
    }
    btn.click();
}

function viewLargeChart(index, chartName, formName) {
    $(formName+':'+chartName+'_selectedChartType').value=$(chartName+'_typeOptions_' + index).options[$(chartName+'_typeOptions_' + index).selectedIndex].value;
    $(formName+':'+chartName+'_selectedDateRange').value=$(chartName+'_rangeOptions_' + index).options[$(chartName+'_rangeOptions_' + index).selectedIndex].value;
    $(formName+':'+chartName+'_selectedGroup').value=$(chartName+'_groupOptions_' + index).options[$(chartName+'_groupOptions_' + index).selectedIndex].value;
    $(formName+':'+chartName+'_referenceIndex').value=$(formName+':'+chartName+'_realReferenceIndex_' + index).value;
    $(formName+':referenceIndex').value=$(formName+':'+chartName+'_realReferenceIndex_' + index).value;

    if($(formName+':'+chartName+'_viewLargeChartButton'))
        $(formName+':'+chartName+'_viewLargeChartButton').click();
}

SailPoint.Dashboard.toggleDisclosure = function(content) {
    content = Ext.get(content);
    if(content) {
        var target = content.next();
        SailPoint.Utils.toggleDisclosureLink(target, content.isVisible());
    }
};
