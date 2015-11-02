/**
 * An extension of Ext.tip.QuickTip that adds better tool tip support on touch
 * interfaces by supporting touch events and making touch targets larger than
 * they would be on the desktop.  To use this, initialize the QuickTipManager
 * to use this class rather than the default QuickTip.  For example,
 * 
 *    // Re-initialize and setup with tablet support.
 *    Ext.QuickTips.destroy();
 *    Ext.QuickTips.init(false, {
 *        className: 'SailPoint.QuickTip',
 *        showDelay: 500,
 *        targetGridCell: SailPoint.Platform.isMobile(),
 *        showOnTouch: SailPoint.Platform.isMobile()
 *    });
 */
Ext.define('SailPoint.QuickTip', {
    extend: 'Ext.tip.QuickTip',

    /**
     * @cfg {Boolean}  Set to true to allow touch events to show tips.  Defaults
     *   to false.
     */
    showOnTouch: false,

    /**
     * @cfg {Boolean}  Set to true to attempt to make the entire containing grid
     *   cell the tip target (ie - the area that you touch).  This can be used
     *   when the specific target is within a grid cell to give a larger area to
     *   touch on a touch interface.  Defaults to false.
     */
    targetGridCell: false,
    
    /**
     * @cfg {Boolean}  Set to true to add left/right padding to the target to
     *   make the target area larger.  Defaults to false.
     */
    addTargetPadding: false,


    /**
     * Extend setTarget() to add touch event listeners if requested.
     */
    setTarget: function(target) {
        var prevTarget = this.target,
            targetEl;
        
        // Now that we have saved the previous target, let super do its thing.
        this.callParent(arguments);

        if (this.showOnTouch) {
            // Un-monitor our special event listener from the previous target.
            if (prevTarget) {
                targetEl = Ext.get(prevTarget);
                this.mun(targetEl, 'click', this.onTargetTouch, this);
            }
    
            // Monitor our special event - for now we'll just use the click
            // event.  This seems more reliable on touch interfaces than
            // mouseover.  Eventually we may want to explore a library that
            // gives support for tap events.
            if (target) {
                this.mon(target, {
                    // KG - pulled this from QuickTip.js.
                    // TODO - investigate why IE6/7 seem to fire recursive resize in e.getXY
                    // breaking QuickTip#onTargetOver (EXTJSIV-1608)
                    freezeEvent: true,
        
                    click: this.onTargetTouch,
    
                    scope: this
                });
            }
        }
    },
    
    /**
     * An event handler that gets called when the target is touched and
     * showOnTouch is true.  This will toggle the display of the tip (hide/show)
     * since we can't listen for a mouseout event to hide the tip.
     * 
     * @param e {EventObject} The event that triggered this listener.
     */
    onTargetTouch: function(e) {
        // If the tip is not being displayed, just treat this like a mouseOver.
        if (this.isHidden()) {
            this.onTargetOver(e);
        }
        else {
            // The tip is being displayed, so hide it (clear a show timer if
            // there is one).  Note that this is similar to onTargetOut() except
            // that it allows events that happened within the tooltip to cause
            // hiding.
            this.clearTimer('show');
            this.delayHide();
        }
    },

    /**
     * Extend the showAt() function to make any area in the browser clickable
     * when you try to hide it on iOS Safari.
     */
    showAt: function(xy) {
        var el;
        
        this.callParent(arguments);
        
        // Safari on iOS does not recognize click events on some elements unless
        // they have other event handlers as well.  To get around this, we'll
        // add a bogus listeners to all top-level body elements so they can be
        // clicked to hide the tip.  See the following:
        // http://stackoverflow.com/questions/3239270/mobile-safari-event-issue.
        if (this.showOnTouch) {
            for (el=Ext.getBody().first(); null !== el; el=el.next()) {
                if (el.dom && el.dom.nodeName &&
                    ('script' !== el.dom.nodeName.toLowerCase())) {
                    // Unmonitor first to make sure we're not adding the same listener twice.
                    this.mun(el, 'click', Ext.emptyFn);
                    this.mon(el, 'click', Ext.emptyFn);
                }
            }
        }
    },

    /**
     * Overridden from QuickTip to optionally make the target larger depending
     * on the targetGridCell and addTargetPadding configs.
     */
    register: function(config){
        // Unfortunately, there is not a really good way to extend this to add
        // our "large target" behavior, so most of this was copied from QuickTip.
        // Considered extending and then post-processing "targets" add the
        // large target behavior, but this wasn't very clean.
        var configs = Ext.isArray(config) ? config : arguments,
            i = 0,
            len = configs.length,
            target, j, targetLen;

        for (; i < len; i++) {
            config = configs[i];
            target = config.target;
            if (target) {
                if (Ext.isArray(target)) {
                    for (j = 0, targetLen = target.length; j < targetLen; j++) {
                        this.targets[Ext.id(this.getLargeTarget(target[j], config))] = config;
                    }
                } else{
                    this.targets[Ext.id(this.getLargeTarget(target, config))] = config;
                }
            }
        }
    },

    /**
     * Return a larger target (if configured) for the requested target and set
     * it in config.target.  If large targets are not configured, this just
     * returns the original target.
     * 
     * @param {HTMLElement} target  The target for the tip.
     * @param {Object} config  The config object for the tip on this target.
     * 
     * @return {HTMLElement} The larger target (if configured) or the original
     *    target.
     */
    getLargeTarget: function(target, config) {
        var largeTarget = target;
        
        if (this.targetGridCell) {
            largeTarget = this.findGridCell(target, config);
        }
        else if (this.addTargetPadding) {
            largeTarget = this.addPaddingToTarget(target);
        }
        
        return largeTarget;
    },
    
    /**
     * Return the containing grid cell for the given target, or the original
     * target if not in a grid.
     */
    findGridCell: function(target, config) {
        var found = Ext.get(target).up('td.x-grid-cell'),
            largeTarget = target;
        
        if (found) {
            largeTarget = found;

            // Replace the target in the config.
            config.target = found;
        }
        
        return largeTarget;
    },
    
    /**
     * Return the given target with added left/right padding.
     */
    addPaddingToTarget: function(target) {
        var largeTarget = target;
        
        if (target) {
            largeTarget = Ext.get(target);
            largeTarget.applyStyles({
                paddingLeft: '20px',
                paddingRight: '20px'
            });
        }
        return largeTarget;
    }
});
