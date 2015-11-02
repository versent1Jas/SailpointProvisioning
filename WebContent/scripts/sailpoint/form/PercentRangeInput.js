/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */
Ext.define('SailPoint.form.PercentRangeInput', {
	extend : 'Ext.form.FieldContainer',
	alias : 'widget.percentrange',

	startValue : null,
	
    endValue : null,
    
    constructor: function(config) {
    	// fix config so that the start value options get passed through to the 
    	// widget and not the container to maintain backward compatibility with
    	// existing code
    	var startConfig = {};
    	
    	Ext.apply(startConfig, config);
    	
    	startConfig.id = null;
    	startConfig.name = null;
    	startConfig.fieldLabel = null;
    	startConfig.xtype = null;
    	startConfig.width = 40;
    	
    	this.startValue = new Ext.form.TextField(startConfig);
        this.endValue = new Ext.form.TextField({ width: 40, validator: Ext.form.VTypes.integer });

		config.layout = 'hbox';
		config.items = [
		    this.startValue,
		    {
		    	xtype: 'panel',
		    	html: '<span>%&nbsp;-&nbsp;</span>',
		    	preventHeader: true,
		    	border: false,
		    	bodyBorder: false,
		    	style: 'background: #eee;',
		    	bodyStyle: 'background: #eee'
		    },
		    this.endValue,
		    {
		    	xtype: 'panel',
		    	html: '<span>%</span>',
		    	preventHeader: true,
		    	border: false,
		    	bodyBorder: false,
		    	style: 'background: #eee;',
		    	bodyStyle: 'background: #eee'
		    }
		];

        this.callParent(arguments);
    },
    
    reset : function(){
    	this.startValue.reset();
        this.endValue.reset();
    },

    validate : function(){
    	this.startValue.validate();
        this.endValue.validate();
    },

    getStartValue : function(){
        return this.startValue.getValue();
    },

    getEndValue : function(){
        return this.endValue.getValue();
    }

});