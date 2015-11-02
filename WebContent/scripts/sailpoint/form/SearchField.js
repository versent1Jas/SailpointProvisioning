/* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('Ext.app.SearchField', {
    extend: 'Ext.form.field.Trigger',

    alias: 'widget.searchfield',

    /**
     * {String} ID of the store this field will interact with.
     */
    storeId : null,
    store : null,

    height : 35,

    trigger1Cls: Ext.baseCSSPrefix + 'form-clear-trigger',
    trigger2Cls: Ext.baseCSSPrefix + 'form-search-trigger',

    hasSearch : false,
    paramName : 'query',

    initComponent: function(){
        this.callParent(arguments);
        
        this.addEvents('trigger1click', 'trigger2click');
        
        this.on('specialkey', function(f, e) {
            if(e.getKey() === e.ENTER){
                e.stopEvent();
                this.onTrigger2Click();
            }
        }, this);
        
        this.on('focus', SailPoint.Utils.emptyTextFocusListener);
    },

    afterRender: function(){
        this.callParent();
        
        this.hideClearTrigger();
    },

    getStore : function(){
        if (this.storeId){
            // don't cache the store lookup results locally,
            // since the store could change
            return Ext.data.StoreManager.lookup(this.storeId);
        }
        return this.store;
    },

    onTrigger1Click : function(){
        this.clearValue();
        this.fireEvent('trigger1click', this);
        this.afterClick();
    },
    
    clearValue : function() {
      var me = this,
          store = this.getStore();

      me.setValue('');

      if (me.hasSearch) {
          if(store) {
            var proxy = store.getProxy();
            Ext.apply(proxy.extraParams, this.getExtraParams());
            store.loadPage(1);
          }
          
          this.hideClearTrigger();
      }
    },

    onTrigger2Click : function(){
        var me = this;
        var store = this.getStore();
        var value = this.getValue();

        if (value.length < 1) {
            me.onTrigger1Click();
            return;
        }
        
        if(store) {
            var proxy = store.getProxy();
            Ext.apply(proxy.extraParams, this.getExtraParams());
            store.loadPage(1);
        }
        
        this.showClearTrigger();
        this.fireEvent('trigger2click', this);
        this.afterClick();
    },

    getExtraParams : function(){
        var xtraParms = {};
        xtraParms[this.paramName] = this.getValue();
        return xtraParms;
    },

    /** Override this if you want to attach an action to the click event **/
    afterClick : function () {},

    /**
     * Sailpoint mod. This method can be used to display the
     * 'clear' trigger button in cases where the search is being fired from
     * another component.
     */
    showClearTrigger : function(){
        // in IE7 block is the default value of display for the a td element
        var display = Ext.isIE7 ? 'block' : 'table-cell';
        this.triggerEl.item(0).parent().setDisplayed(display);
        this.hasSearch = true;
    },
    
    hideClearTrigger: function() {
        this.triggerEl.item(0).parent().setDisplayed('none');
        this.hasSearch = false;
    }
});


