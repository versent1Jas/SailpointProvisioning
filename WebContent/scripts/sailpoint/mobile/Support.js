/* (c) Copyright 2013 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This class has utility methods that can help in adding mobile support to the
 * UI.
 * 
 * @class SailPoint.mobile.Support
 */
Ext.define('SailPoint.mobile.Support', {

    ////////////////////////////////////////////////////////////////////////////
    //
    // Statics
    //
    ////////////////////////////////////////////////////////////////////////////

    statics: {

        /**
         * @property {Boolean} viewportResizeEnabled  Set to true if the
         *    components you are adding mobile support for live in a viewport
         *    that resizes its contents when the window resizes.
         */
        viewportResizeEnabled: false,


        /**
         * Make the given component mobile-friendly if this is on a mobile
         * platform.
         * 
         * @param {Ext.Component} component  The component to mobile-ize.
         * @param {String/Ext.Component} container  The container to re-layout
         *    when required.
         */
        addMobileSupport: function(component, container) {
            
            // Do nothing if we're not on a mobile platform.
            if (!SailPoint.Platform.isMobile()) {
                return;
            }

            // Configure suggests to hide the keyboard when a selection is made.
            SailPoint.mobile.Support.hideKeyboardOnSelect(component);

            // Configure all components to relayout when the keyboard is hidden.
            SailPoint.mobile.Support.configureHideKeyboardListener(component, container);
        },

        /**
         * Configure the given component (if it is a suggest) to hide the
         * on-screen keyboard when a selection is made.
         * 
         * @param {Ext.Component} suggest  The component to hide the keyboard on
         *    selection.
         */
        hideKeyboardOnSelect: function(suggest) {
            // Do nothing if the given component isn't a suggest.
            if (!SailPoint.mobile.Support.isSuggest(suggest)) {
                return;
            }

            suggest.on('select', function() {
                // The input field gets focused right after this event is fired.
                // Wait just a bit to blur it so it doesn't just get refocused.
                Ext.defer(function() {
                    // Blurring a dom element causes the on-screen keyboard to
                    // be hidden.  Note that we put an onblur handler on the dom
                    // element to update the container's layout.
                    this.blur();
                }, 50, this);
            }, suggest);
        },

        /**
         * Configure a listener on the given component to handle events when the
         * on-screen keyboard is hidden using the "hide keyboard" button.  This
         * will force a suggest to collapse (if a list is being displayed and
         * the given component is a suggest) and cause the given container to
         * update its layout since showing the keyboard shrinks the screen and
         * often causes the layout to get squished.
         * 
         * @param {Ext.Component} component  The component on which to configure
         *    the hide keyboard listener.
         * @param {String/Ext.Component} container  The ID of the container
         *    component or the actual container component for which to update
         *    the layout after the keyboard is hidden.
         */
        configureHideKeyboardListener: function(component, container) {

            // After the component is rendered (we have to wait until after 
            // rendering so the focusEl will have been created) add a blur
            // listener to the underlying dom text input element.  This gets
            // blurred in two cases:
            //
            //   1) If the component is a suggest and a selection is made.  See
            //      the select listener in hideKeyboardOnSelect().
            //   2) The keyboard is hidden by clicking the "hide keyboard" button.
            //      Note that this blurs the actual dom element and this event does
            //      not get relayed to a blur event on the component.
            //
            // In both cases we need to call updateLayout() on the container since
            // showing the keyboard can cause the container to get squished and
            // hiding the keyboard does not automatically trigger a re-layout.
            component.on('afterrender', function(component, eOpts) {

                Ext.get(component.getFocusEl()).on('blur', function() {

                    // Wait a bit before we handle the event.  The blur event
                    // will get triggered when an item in a suggest list is
                    // clicked.  Collapsing the list prematurely causes the item
                    // to not get added to the suggest.
                    Ext.defer(function() {

                        // Return immediately if this isn't really a keyboard hide event.
                        if (!SailPoint.mobile.Support.handleSuggestKeyboardHide(component)) {
                            return;
                        }

                        // Only update the layout and reposition if the viewport
                        // is allowed to resize.
                        if (SailPoint.mobile.Support.viewportResizeEnabled) {
                            // Now re-layout the containing panel in case it got
                            // squished when the keyboard appeared.
                            Ext.getCmp(container).updateLayout();
    
                            // Showing the keyboard can cause the bottom or the page
                            // to grow larger and scroll the page down.  Scroll back
                            // up to the top.
                            Ext.getBody().scrollTo('top', 0, true);
                            Ext.getBody().scrollTo('left', 0, true);
                        }
                    }, 200, this);
                });
            }, component);
        },

        
        /**
         * Return whether the given component is a Suggest or MultiSuggest.
         */
        isSuggest: function(component) {
            return (component &&
                    (component.isXType('suggest') || component.isXType('multiSuggest')));
        },

        /**
         * Handle a keyboard hide event for the given component if it is a suggest.
         * 
         * @param {Ext.Component} component  The component to handle.
         * 
         * @return {Boolean} True if this was handled or ignored because the
         *    component was not a suggest.  False if the component is a suggest but
         *    we determine that the event was not due to a keyboard hide.
         */
        handleSuggestKeyboardHide: function(component) {
            // If this isn't a suggest, return true so processing will continue.
            if (!SailPoint.mobile.Support.isSuggest(component)) {
                return true;
            }

            // If the blur happened because the suggest was recently interacted
            // with.  We do not want to collapse.
            if (component.recentInteraction(800)) {
                return false;
            }

            // Collapse the suggest if it is not yet collapsed. This
            // is required when using the "hide keyboard" button but
            // not when the element is blurred because a selection
            // was made.
            component.collapse();

            return true;
        }
    }
});
