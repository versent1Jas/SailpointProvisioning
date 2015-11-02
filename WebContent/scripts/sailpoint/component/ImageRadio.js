////////////////////////////////////////////////////////////////////////////////
//
// ImageRadio is a static class that allows using images instead of radio
// buttons.  This was inspired by the following tutorial:
// http://ryanfait.com/articles/2007/01/05/custom-checkboxes-and-radio-buttons/
//
// This works by wrapping the radio button in a div.  The div is styled with
// a background image that gets shifted up and down to show the appropriate
// state of the button when it is clicked, selected, etc...  The actual input
// radio button is hidden, but has its value toggled appropriately when the div
// is clicked so the data is submitted in the post.
//
// To use this, create an image radio button in the HTML that looks something
// like this:
//
//  <div class="imageRadio approveRadio"><input type="radio" name="foo" /></div>
//
// Then use one of the initializeAll() or attachEventsXXX() methods to make the
// image radio button behave as expected.
//
////////////////////////////////////////////////////////////////////////////////

// The 'undefined' jiggery-pokery here prevents us from overwriting the
// ImageRadio definition by including this file twice.  This is important b/c
// this static class holds some variables we don't want to null out.
var ImageRadio = ('undefined' != typeof ImageRadio) ? ImageRadio : {

    /**
     * An event handler that gets called before the new value is selected when
     * the radio button is clicked.
     */
    beforeSelect: null,

    /**
     * A property that gets set to true if the beforeSelect handler returns
     * false when called.  This is used to avoid the onclick handler, and
     * should be set back to false when the onclick is skipped.
     */
    radioClickCanceled: false,

    /**
     * Configuration property which disables the explicit extra
     * click we add for IE on mouseup. In some cases this can
     * cause an extra click, so we need to disable it.
     */
    disableClickOnMouseup : false,

    /**
     * Initialize all image radios within the current page.
     */
    initializeAll: function() {
        if(document.getElementsByTagName("form")) {
            var divs = Ext.DomQuery.select("div[class*=imageRadio]");
            for(var i = 0; i < divs.length; i++) {
                ImageRadio.attachEventsToDiv(divs[i]);
            }
        }
    },

    /**
     * Attach image radio handling events to the given radio button.
     */
    attachEventsToRadio: function(radio) {
        var div = radio.parentNode;
        ImageRadio.attachEventsToDiv(div);
    },

    /**
     * Attach image radio handling events to the given div around an image
     * radio button.
     */
    attachEventsToDiv: function(div) {
        if(div.className.match("imageRadio") && !ImageRadio._isDisabled(div)) {

            // First, stop observing in case we've already attached listeners.
            // We don't want double listeners ... that would call the _onmouse
            // methods twice for every click.
            Element.stopObserving(div, "mousedown", ImageRadio._onmousedown);
            Element.stopObserving(div, "mouseup", ImageRadio._onmouseup);
            Element.stopObserving(div, "mouseover", ImageRadio._onmouseover);
            Element.stopObserving(div, "mouseout", ImageRadio._onmouseout);

            Element.observe(div, "mousedown", ImageRadio._onmousedown, false);
            Element.observe(div, "mouseup", ImageRadio._onmouseup, false);
            Element.observe(div, "mouseover", ImageRadio._onmouseover, false);
            Element.observe(div, "mouseout", ImageRadio._onmouseout, false);
        }
    },

    /**
     * Enable the given radio.  This changes the style and reattaches the event
     * handlers.
     * 
     * @param  div  The div of the image radio to enable.
     * 
     * @return True if the radio was enabled (false if it was already enabled).
     */
    enable: function(div) {
        var enabled = false;

        if (div && ImageRadio._isDisabled(div)) {
            div = Ext.get(div);

            // Tweak the classes first so that attaching events will actually
            // attach the events.
            if (div.hasCls("disabledSelected")) {
                div.removeCls("disabledSelected");
                div.addCls("selected");
                div.dom.style.backgroundPosition = "0 -50px";
            }
            else if (div.hasCls("disabled")) {
                div.removeCls("disabled");
                div.dom.style.backgroundPosition = "0 0px";
            }

            // Attach the mouse event handlers.
            ImageRadio.attachEventsToDiv(div);

            // Replace the onclick if we got rid of it.
            if ('undefined' != typeof div.oldOnClick) {
                div.onclick = div.oldOnClick;
                div.oldOnClick = null;
            }

            enabled = true;
        }

        return enabled;
    },

    enableAll: function(div) {
        var radio = ImageRadio.getRadio(div);
        var radios = ImageRadio._getRadios(radio);
        radios.each(function(r){
            ImageRadio.enable(r.parentNode);
            ImageRadio.attachEventsToDiv(r.parentNode);
        });
    },


    /**
     * Disable the given radio.  This changes the style and detaches the event
     * handlers.
     * 
     * @param  div  The div of the image radio to disable.
     * 
     * @return True if the radio was disable(false if it was already disabled).
     */
    disable: function(div) {
        var disabled = false;

        if (div && !ImageRadio._isDisabled(div)) {
            // Remove the mouse handlers.
            Element.stopObserving(div, "mousedown", ImageRadio._onmousedown);
            Element.stopObserving(div, "mouseup", ImageRadio._onmouseup);
            Element.stopObserving(div, "mouseover", ImageRadio._onmouseover);
            Element.stopObserving(div, "mouseout", ImageRadio._onmouseout);
    
            // Change the class name to disabled
            var className = "disabled";
            if (ImageRadio._isSelected(div.className)) {
                className = "disabledSelected";
                div.style.backgroundPosition = "0 -125px";
            } else {
                div.style.backgroundPosition = "0 -100px";
            }


            Ext.get(div).addCls(className);

            // Sock away the onclick.
            div.oldOnClick = div.onclick;
            div.onclick = null;
            
            disabled = true;
        }


        return disabled;
    },

    disableAll: function(div) {
        var radio = ImageRadio.getRadio(div);
        var radios = ImageRadio._getRadios(radio);
        radios.each(function(r){
            ImageRadio.disable(r.parentNode);
        });
    },
    
    /**
     * Select the given radio button.  This unselects all other radios in the
     * same radio button group.
     */
    selectRadio: function(radio) {
        var i, inputs, div = Ext.get(radio.parentNode);
        radio.checked = true;

        var baseClassName = ImageRadio._getBaseClassName(div.dom.className);
        
        if( div.hasCls( "disabled" ) || div.hasCls( "disabledSelected" ) ) {
            div.dom.className = baseClassName;
            div.addCls( "disabledSelected" );
            div.dom.style.backgroundPosition = "0 -125px";
        } else {
            div.dom.className = baseClassName + " selected";
            div.dom.style.backgroundPosition = "0 -50px";
            div.dom.parentNode.style.display = '';
        }
        inputs = document.getElementsByTagName("input");
        for(i = 0; i < inputs.length; i++) {
            if(inputs[i].getAttribute("name") === radio.getAttribute("name")) {
                if(inputs[i] !== radio) {
                    ImageRadio.unselectRadio(inputs[i]);
                }
            }
        }
    },

    /**
     * Unselect the given radio button.  This clears "checked" property and
     * shows the unselected image.
     */
    unselectRadio: function(radio) {
        var div = radio.parentNode;
        div = Ext.get(div);
        var baseName = ImageRadio._getBaseClassName(radio.parentNode.className );
        radio.checked = false;
        if( div.hasCls( "disabled" ) || div.hasCls( "disabledSelected" ) ) {
            div.dom.className = baseName;
            div.addCls( "disabled" );
            div.dom.style.backgroundPosition = "0 -100px";
        } else {
            div.dom.className = baseName;
            div.dom.style.backgroundPosition = "0 0";
        }

        if( div.hasCls( "defaultHidden" )){
            div.dom.parentNode.style.display = "none";
        }
    },
    
    isRadioEnabled: function( radio ) {
        var div = radio.parentNode;
        div = Ext.get(div);
        return !( div.hasCls( "disabled" ) || div.hasCls( "disabledSelected" ) )
    },

    /**
     * Select the radio with the given value that lives in the same radio group
     * that the given radio is a part of.
     *
     * @param  radio  A radio in the group we're interested in.
     * @param  value  The value of the radio to select.
     */
    setRadioValue: function(radio, value) {

        var radios = ImageRadio._getRadios(ImageRadio.getRadio(radio));
        radios.each(function(elt) {
            if (value === elt.value) {
                ImageRadio.selectRadio(elt);
            }
            else {
                ImageRadio.unselectRadio(elt);
            }
        }.bind(this));
    },

    /**
     * Return the value of the selected radio that lives in the same radio group
     * that the given radio is a part of.
     *
     * @param  radio  A radio in the group we're interested in.
     *
     * @return The value of the selected radio that lives in the same radio
     *         group that the given radio is a part of.
     */
    getRadioValue: function(radio) {

        var radios = ImageRadio._getRadios(ImageRadio.getRadio(radio));
        var _radio = radios.find(function(elt) {
            return elt.checked;
        }.bind(this));
        return _radio ? _radio.value : null;
    },

    /**
     * Get the radio input element given a div or radio for an ImageRadio.
     */
    getRadio: function(divOrRadio) {
        if ('input' == divOrRadio.tagName.toLowerCase()) {
            return divOrRadio;
        }

        if ('div' == divOrRadio.tagName.toLowerCase()) {
            return divOrRadio.getElementsByTagName("input")[0];
        }
    },

    /**
     * Return all radios that live in the same radio group as the given radio.
     */
    _getRadios: function(radio) {
        var allRadios = Ext.DomQuery.select('input[type=radio]');
        return allRadios.findAll(function(elt) {
            return (radio.name === elt.name);
        }.bind(this));
    },

    /**
     * Highlight when hovering.
     */
    _onmouseover: function(event) {
        var div = Event.element(event);
        if(!ImageRadio._isSelected(div.className)) {
            div.style.backgroundPosition = "0 -150px";
        } else {
            div.style.backgroundPosition = "0 -175px";
        }
    }.bindAsEventListener(this),

    /**
     * Remove highlight when done hovering.
     */
    _onmouseout: function(event) {
        var div = Event.element(event);
        if(!ImageRadio._isSelected(div.className)) {
            div.style.backgroundPosition = "0 0px";
        } else {
            div.style.backgroundPosition = "0 -50px";
        }
    }.bindAsEventListener(this),

    
    /**
     * Make the button look like it is being pressed.  Note that this method is
     * bound as an event listener to this class.
     */
    _onmousedown: function(event) {
        var div = Event.element(event);
        if(!ImageRadio._isSelected(div.className)) {
            div.style.backgroundPosition = "0 -25px";
        } else {
            div.style.backgroundPosition = "0 -75px";
        }
    }.bindAsEventListener(this),

    /**
     * Select the radio when the mouse click is released.  Note that this method
     * is bound as an event listener to this class.
     */
    _onmouseup: function(event) {
        var div = Event.element(event);
        var radio = ImageRadio.getRadio(div);

        var doSelect = true;
        if (null != ImageRadio.beforeSelect) {
            doSelect = ImageRadio.beforeSelect(div, radio, event);
        }

        if (doSelect) {
            ImageRadio.selectRadio(radio);

            // Explicitly click the div again.  Firefox will cause the click to
            // happen after the mouseup event is processed, but not IE.  Calling
            // click on the div causes the onclick handler to fire.
            if ('undefined' != typeof div.click && ImageRadio.disableClickOnMouseup !== true) {
                div.click();
            }
        }
        else {
            // Set the radioClickCancled property so we can ignore the onclick
            // event later.
            ImageRadio.radioClickCanceled = true;
            Event.stop(event);

            // Reset to non-mousedown state.
            if(!ImageRadio._isSelected(div.className)) {
                div.style.backgroundPosition = "0 0px";
            } else {
                div.style.backgroundPosition = "0 -50px";
            }
        }
    }.bindAsEventListener(this),

    _getBaseClassName: function(className) {
        var baseClassName = '';
        var parts = className.split(' ');

        var sep = '';
        for (var i=0; i<parts.length; i++) {
            if ('selected' != parts[i]) {
                baseClassName += sep + parts[i];
                sep = ' ';
            }
        }

        return baseClassName;
    },

    _isSelected: function(className) {
        var parts = className.split(' ');
        for (var i=0; i<parts.length; i++) {
            if ('selected' === parts[i]) {
                return true;
            }
        }

        return false;
    },

    _isDisabled: function(div) {
        return div.className.match("disabled");
    },
    
    
    /**
     * This function will render the HTML for the given set of ImageRadios.
     * 
     * @param  radioValues   An array of radios to be rendered.  Each element
     *                       should be an object with a label and value property.
     * @param  idNamePrefix  The prefix to use for naming the radio inputs.
     * @param  callbacks     An object with callback functions used to determine
     *                       state an how to render parts of the radio.  The
     *                       following are supported:
     *                       
     *                       onclick: Renders the onclick javascript.
     *                         params: label, value, record
     *                         return: A string with the onclick javascript.
     *
     *
     *                       disabled: Determines whether the radio is disabled.
     *                         
     *                         params: label, value, record
     *                         return: True if the radio should be disabled.
     *
     *
     *                       selected: Determines if a radio value is selected.
     *                         
     *                         params: label, value, record
     *                         return: True if the radio is selected.
     *
     *
     *                       extraStuff: Renders extra HTML to be placed after
     *                         the buttons.
     *                         
     *                         params: record
     *                         return: A string with HTML to render.
     *
     * @param  record        An Ext.data.Record containing details about the
     *                       item for which the radio is being rendered.  At the
     *                       least this needs an id property.  Additional data
     *                       can be used by the callbacks.
     */
    render: function(radioValues, idNamePrefix, callbacks, record) {

        var defaultCallbacks = {
            selected:   function() { return false; },
            disabled:   function() { return false; },
            onclick:    function() { return ''; },
            extraStuff: function() { return ''; }
        };
        callbacks = Ext.applyIf(callbacks || {}, defaultCallbacks);

        var tblPre = '<table id="imageRadios_' + record.getId() + '"><tbody><tr>';
        var tblInner = '';

        for (var i=0; i<radioValues.length; i++) {
            var label = radioValues[i].label;
            var thisClass = radioValues[i].value;
            var isHidden =   radioValues[i].hidden;

            var selected = callbacks.selected(label, thisClass, record);
            var disabled = callbacks.disabled(label, thisClass, record);
            var onclick = '';

            // Only add the onclick for buttons that aren't disabled.
            if (!disabled) {
                onclick = callbacks.onclick(label, thisClass, record);
                if ((null !== onclick) && (onclick.length > 0)) {
                    onclick = 'onclick="' + onclick + '"';
                }
            }

            var extraClass = (selected) ? ' selected ' : '';
            if (disabled) {
                extraClass = (selected) ? ' disabledSelected ' : ' disabled ';
            }

            var style = "";
            var tdStyle = "";
            if (isHidden){
                if (!selected){
                    tdStyle="display:none";
                }
                extraClass += " defaultHidden";
            }

            var tdStart = '<td width="23px" style="'+tdStyle+'">';


            var div = Ext.String.format('<div {0} style="{4}" class="imageRadio {1}{2}" id="{1}_{3}">',
                                    onclick, thisClass, extraClass, record.getId(), style);

            var checked = (selected) ? ' checked="checked"' : '';
            var inputRadio =
                Ext.String.format('<input type="radio" {0} value="{1}" id="{2}{3}" name="{2}{3}" data-trackingId="{3}" />',
                              checked, label, idNamePrefix, record.getId());

            var divTdEnd = '</div></td>';

            tblInner += tdStart + div + inputRadio + divTdEnd;
        }

        tblInner += callbacks.extraStuff(record);

        tblPost = '</tr></tbody></table>';

        return tblPre + tblInner + tblPost;
    }
};
