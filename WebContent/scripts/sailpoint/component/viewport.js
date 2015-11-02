/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * An extension of the ExtJS Viewport than functions a little better on a
 * tablet.
 * 
 * @class SailPoint.component.Viewport
 * @extends Ext.container.Viewport
 */
Ext.define('SailPoint.component.Viewport', {

    extend: 'Ext.container.Viewport',
    alias: 'widget.spviewport',

    /**
     * @cfg {Boolean} preventResize  Prevent the viewport from resizing when the
     *    window changes size.  Useful on tablets where resizing can cause
     *    problems.
     */
    preventResize: false,

    /**
     * @cfg {Boolean} handleOrientationChange  Cause the viewport to update its
     * layout when an orientation change event is detected.
     */
    handleOrientationChange: false,
    
    
    initComponent: function() {
        this.callParent(arguments);

        // If we are handling orientation change events, add a listener that
        // will remember when the orientation change occurred and update the
        // layout.  Note that we have to remember the time because fireResize
        // happens *after* the orientation change and we need to know if the
        // orientation just changed.
        if (this.handleOrientationChange) {
            Ext.getDoc().on('orientationchange', function() {
                this.lastOrientationChange = new Date();
                this.updateLayout();
            }, this);
        }
    },

    /**
     * Overridden to prevent resizing in certain instances.
     */
    fireResize: function(width, height) {
        // Only resize if resizing is not disabled OR we're resizing for an
        // orientation change.
        if (!this.preventResize ||
            (this.handleOrientationChange && this.orientationChanged())) {

            // Call the parent to resize the container.
            this.callParent(arguments);
            
            // Scroll back to the top-left.  Changing orientation can make the
            // body be off-centered.
            Ext.getBody().scrollTo('top', 0);
            Ext.getBody().scrollTo('left', 0);
        }
    },
    
    /**
     * Return whether the orientation just changed.
     */
    orientationChanged: function() {
        var changed = false,
            diff;

        if (this.lastOrientationChange) {
            diff = new Date().getTime() - this.lastOrientationChange.getTime();
            changed = (diff < 500);
        }

        return changed;
    }
});

    
/**
 * Create a viewport that will render the entire page with the given body
 * component as the body of the page.  Optionally, a wrappingForm can be
 * specified to wrap the body within a form that resides elsewhere on the
 * page.  This can be useful if the body was constructed using contentEls
 * that have form elements that need to be posted with the form.  If the
 * form does not wrap these components, they will not be posted on submission.
 * 
 * @cfg {Ext.Component} bodyContent  The body to render in the viewport.
 * @cfg {String/HTMLElement} wrappingForm  An optional form to wrap around the body.
 * @cfg {String} title Page title
 * @cfg {String} subtitle Page subtitle
 * @cfg {Number} minWidth width to which the viewport will shrink before forcing
 *    a horizontal scrollbar
 * @cfg {Boolean} preventResize  Prevent the viewport from resizing when the
 *    window changes size.  Useful on tablets where resizing can cause problems.
 * @cfg {Boolean} handleOrientationChange  Cause the viewport to update its
 *    layout when an orientation change event is detected.
 */
SailPoint.getViewport = function(config) {

    var bodyPanel = config.bodyContent; // usually a grid panel
    var wrappingForm = config.wrappingForm;
//    var title = config.title;
//    var subtitleId = config.subtitleId;
//    var subtitle = config.subTitle;
//    var instructions = config.instructions;
    var minWidth = config.minWidth || 50;

    var wrappingFunction = function(container, layout, epOpts) {

        if (container.hasBeenUpdated){
            return;
        }

        // set a flag so we don't do this more than once
        container.hasBeenUpdated = true;
        
        var bodyDom = container.getEl().dom;
        var children = Ext.get(bodyDom).query("> *");
        var i;

        // Remove the children from the body's element.
        for ( i = 0; i < children.length; i++) {
            bodyDom.removeChild(children[i]);
        }

        var frm = Ext.getDom(wrappingForm);

        // First, put the form under the body's element. 
        // See cross-page leaks: http://msdn.microsoft.com/en-us/library/Bb250448.aspx
        bodyDom.appendChild(frm);

        // Then append the body's children to the form.
        for ( i = 0; i < children.length; i++) {
            frm.appendChild(children[i]);
        }
    };
    
    // If a form was specified, setup a render listener that will remove the
    // children from the body's element, append them to the form, and add the
    // form to the body.
    if (wrappingForm) {
        if(!Ext.getCmp(bodyPanel.id)) {
            bodyPanel = Ext.widget(bodyPanel);
        }
        if(bodyPanel.isComponent){
            bodyPanel.on('afterlayout', wrappingFunction);
        }
        else {
            Ext.apply(bodyPanel, {
                listeners : {
                    afterlayout : {
                        fn : wrappingFunction
                    }
                }
            });
        }
    }

    // Respect the passed in layout, otherwise set to fit.
    if(!bodyPanel.layout) {
        bodyPanel.layout = 'fit';
    }

    bodyPanel.flex = 1;
    Ext.apply(bodyPanel, {
        style : {'margin' : '0px 10px 0px 10px'}
    });

    var spBodyPanel = {
        id : 'spBodyPanel',
        flex : 1,
        border : false,
        layout : {
            type : 'hbox',
            align : 'stretch'
        },
        items : [ {
            xtype : 'container',
            id : 'spLeftBodyBorder',
            border : false,
            html : '&nbsp;',
            width : 25,
            baseCls : 'borderCell'
        }, 
        bodyPanel, // content!
        {
            xtype : 'container',
            id : 'spRightBodyBorder',
            border : false,
            html : '&nbsp;',
            width : 25,
            baseCls : 'borderCell'
        } ]
    };

    // for some terrible reason Ext calculates the height of the header panel 
    // on some pages incorrectly. I think it uses ceil instead of letting normal 
    // rounding occur. This causes a one pixel gap between the header and the 
    // body or positions the body and footer too high in the page resulting in
    // clipping. Prototype correctly calculates the height so set the top
    // offsets manually.
    var viewportListeners = {
        afterlayout: {
            fn: function() {
                var headerHeight = $('spHeaderPanel').getHeight(),
                    bodyHeight;
    
                $('spBodyPanel').setStyle({
                    top: headerHeight + 'px'
                });
    
                bodyHeight = $('spBodyPanel').getHeight();
                $('spFooterPanel').setStyle({
                    top: (headerHeight + bodyHeight) + 'px'
                });
            }
        }
    };

    var spViewport = Ext.create('SailPoint.component.Viewport', {
        id : 'spViewport',
        listeners: viewportListeners,
        preventResize: config.preventResize,
        handleOrientationChange: config.handleOrientationChange,
        layout : {
            type : 'vbox',
            align : 'stretch'
        },
        defaults : {
            minWidth : minWidth
        },
        items : [ {
            id : 'spHeaderPanel',
            xtype : 'container',
            layout : 'fit',
            contentEl : 'spHeaderPanelDiv',
            bodyStyle : {
                'background' : 'transparent',
                'width' : '100%',
                'z-index' : 999,
                'overflow' : 'visible'
            },
            style : {
                'width' : '100%',
                'z-index' : 999,
                'overflow' : 'visible'
            },
            border : false,
            baseCls : 'borderCell'
        }, 
        spBodyPanel, // content!
        {
            id : 'spFooterPanel',
            xtype : 'container',
            layout : 'fit',
            contentEl : 'spFooterPanelDiv',
            border : false,
            bodyStyle : {
                'background' : 'transparent'
            },
            baseCls : 'borderCell'
        } ]
    });
    
    return spViewport;
}