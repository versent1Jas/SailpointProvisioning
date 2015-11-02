/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.SIComboNumberField', {
	extend : 'Ext.form.field.Number',
	alias: 'widget.sicombonumberfield',
	
    constructor: function(config) {
        Ext.apply(this, {
            id: config.id,
            sliderId: config.sliderId,
            hideLabel: true,
            allowDecimals: false,
            allowNegative: false,
            value: config.value,
            minValue: 0,
            maxValue: 1000,
            width: 50,
            maxLength: 4
        });
        
        this.callParent(arguments);
        
        // Handle 'enter' being pressed
        this.on('specialkey', function(field, eventObj) {
            if (eventObj.getKey() == Ext.EventObject.RETURN) {
                eventObj.stopEvent();
            }
        });
    }    
});


Ext.define('SailPoint.SIComboSlider', {
	extend : 'Ext.Slider',
	alias: 'widget.sicomboslider',
	
    constructor: function(config) {
        Ext.apply(this, {
            width: 215,
            value: config.value,
            increment: 1,
            minValue: 0,
            maxValue: 1000,
            animate: false,
            clickToChange: true
        });
        
        this.callParent(arguments);
    }
});

Ext.define('SailPoint.SliderInputCombo', {
	extend : 'Ext.panel.Panel',
	
	numberfield: null,
    slider: null,
    indicator: null,
	
    initComponent: function() {
        if (!this.id) {
            Ext.id(this);
        }
        
        this.numberfield = new SailPoint.SIComboNumberField({
            id: this.id + 'Input', 
            sliderId: this.id, 
            value: this.value,
            hideTrigger : true,
            width: 55});
        
        this.slider = new SailPoint.SIComboSlider({
            id: this.id + 'Slider', 
            comboId: this.id, 
            value: this.value, 
            width: 220});
        
        this.indicator = new Ext.panel.Panel({  
            id: this.id + 'Indicator',  
            border: false,
            style: {'padding-bottom': '5px'}});
        
        Ext.apply(this, {
            id: this.id,
            border: false,
            layout: {
                type: 'table',
                columns: 3,
                tdAttrs: {
                    style: { 'padding-right': '10px' }
                }
            },
            width: 350,
            height: 45,
            items: [ this.numberfield, this.slider, this.indicator ]
        });
        
        this.callParent(arguments);
        
        this.numberfield.on('change', this.synchInputs, this, {buffer: 500});
        this.slider.on('change', this.synchInputs, this, {buffer: 500});

        // Initialize the color store 
        this.colorStore = Ext.StoreMgr.lookup('colorStore');
        if (!this.colorStore) {
            this.colorStore = new SailPoint.Risk.ColorStore({id: 'colorStore'});
            // Initialize the indicator in a callback after the store has loaded
            this.colorStore.load({
                callback: function(record, options, success) {
                    if (success) {
                        options.updateIndicatorFn.call(this, options.value);
                    }
                }, 
                scope: this,
                value: this.value,
                updateIndicatorFn: function() {
                    this.on('render', function(comboPanel) {
                        comboPanel.updateIndicator(comboPanel.value);
                    }, this);
                    this.updateIndicator(this.value);
                }
            });
        } else {
            this.on('render', function(comboPanel) {
                comboPanel.updateIndicator(comboPanel.value);
            }, this);
        }
        
        // Set up the event that will keep the indicator synched with the slider and/or input
        this.addEvents({'valueChanged': true});
        this.on('valueChanged', this.updateIndicator, this);
    },
    
    // Change the the value of either the slider or numberfield once we've updated the other
    synchInputs: function(input, newValue) {
        if (newValue >= 0 && newValue <= 1000) {
            var partner = (input.getXType() == 'sicomboslider') ? this.numberfield : this.slider;
            if (partner.getValue() != newValue) {
                partner.setValue(newValue);
                this.fireEvent('valueChanged', newValue);
            }
        }
    },

    updateIndicator: function(score) {
        var colorStore = Ext.StoreMgr.lookup('colorStore');
        var imageUrl = colorStore.getImageUrlForScore(score);
        
        function performUpdate(indicator) {
            var imageEl = indicator.body.down('img[class=dynamicRiskIndicator]');
            if (imageEl === null) {
                imageEl = indicator.body.createChild({tag: 'img', cls: 'dynamicRiskIndicator'});
            }
            imageEl.set({src: imageUrl});
        }
        
        // Make sure that the indicator has rendered before doing the update to it
        if (this.indicator.rendered) {
            performUpdate(this.indicator);
        } else {
            this.indicator.on('render', performUpdate, this);
        }
    },
    
    getValue: function() {
        return this.numberfield.getValue();
    }
});
