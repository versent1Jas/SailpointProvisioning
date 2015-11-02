/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
* @class SailPoint.CertificationStatusor
* @extends Ext.Component
*
* A div component that allows us to render status changes on the ui through.
*/

Ext.define('SailPoint.CertificationStatusor', {
	extend : 'Ext.Container',
  
  icon : null,
  status : null,
  count : null,
  
  ICON_WARN : SailPoint.getRelativeUrl('/images/icons/dialogue_error_16.png'),
  ICON_SAVING : SailPoint.getRelativeUrl('/scripts/ext-4.1.0/resources/themes/images/default/grid/grid-loading.gif'),
  ICON_SAVED : SailPoint.getRelativeUrl('/images/icons/accept.png'),
  
  ITEMS_MSG : '#{msgs.statusor_unsaved}',
  SAVE_MSG : '#{msgs.statusor_saving}',
  SAVED_MSG : '#{msgs.statusor_success}',
  
  initComponent : function() {
    this.count = 0;
    
    this.icon = new Ext.Component({autoEl: {tag:'img', src: this.ICON_WARN}, cls: 'status_icon'});
    this.status = new Ext.Component({autoEl: {tag: 'div', html: Ext.String.format(this.ITEMS_MSG, this.count)}, cls: 'status_txt'});
    
    Ext.apply(this, {
        cls: 'statusor',
        autoEl: 'div',
        hidden:true
    });
  
    this.items = [this.icon, this.status];
    SailPoint.CertificationStatusor.superclass.initComponent.apply(this);
  },
  
  save : function() {
    this.addCls('saving');
    this.icon.el.dom.src = this.ICON_SAVING;
    this.status.el.dom.innerHTML = this.SAVE_MSG;
  },
  
  saveFinish : function () {
    this.el.dom.style.display = 'none';
    this.removeCls('saving');
    this.addCls('saved');
    this.icon.el.dom.src = this.ICON_SAVED;
    this.status.el.dom.innerHTML = this.SAVED_MSG;
    Effect.Appear(this.id, {duration:0.5});
    this.count=0;
  },

  setCount : function(cnt) {
    if (cnt > 0)
        this.show();
    else
        this.hide();
    this.removeCls('saving');
    this.removeCls('saved');
    this.icon.el.dom.src = this.ICON_WARN;
    this.count = cnt;
    this.status.el.dom.innerHTML = Ext.String.format(this.ITEMS_MSG, this.count);
  }
  /*
  addItem : function() {
    this.removeCls('saving');
    this.removeCls('saved');
    this.icon.el.dom.src = this.ICON_WARN;
    this.count++;
    this.status.el.dom.innerHTML = Ext.String.format(this.ITEMS_MSG, this.count);
    this.show();
  },
  
  removeItem : function() {
    this.removeCls('saving');
    this.removeCls('saved');
    this.icon.el.dom.src = this.ICON_WARN;
    this.count--;
    this.status.el.dom.innerHTML = Ext.String.format(this.ITEMS_MSG, this.count);
    if (this.count == 0)
        this.hide();
  } */
});