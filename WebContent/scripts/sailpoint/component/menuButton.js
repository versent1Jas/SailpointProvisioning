Ext.ns('SailPoint',
    'SailPoint.Component',
    'SailPoint.Component.MenuButton');

/**
 * Renders a button to the 'highlight' div
 *
 * @param msg The text displayed on the button
 * @param itemStore a list of objects with text and value properties
 * @param clickFunc function executed when an item is selected takes an item from the itemStore as a parameter
 * @param id id for the button
 * @returns {*} A reference to the button
 */
SailPoint.Component.MenuButton.renderMenuButton = function(msg, itemStore, clickFunc, id) {
    var itemLength = itemStore.length,
        items = [],
        item,
        i,
        buttonId = id ? id : 'menuButton',
        taskButton;

    for(i = 0; i < itemLength; i++) {
        item = {};
        item.text = itemStore[i].text;
        item.cls = 'x-menu-list-item';
        item.overCls = 'x-menu-item-active';
        item.id = buttonId + '-' + itemStore[i].value;
        item.listeners = {
            click: {
                fn: function() {
                    clickFunc(this);
                },
                scope: {
                    value: itemStore[i].value,
                    text: itemStore[i].text
                }
            }
        };
        items[i] = item;
    }

    taskButton = Ext.create('Ext.button.Button', {
        text: msg,
        id: buttonId,
        renderTo: 'subtitle',
        cls: 'menuBtnClass',
        arrowCls: 'whtArrowClass',
        menuAlign: 'tr-br',
        menu: {
            cls: 'main-submenu',
            items: items,
            maxHeight: 400
        }
    });
    return taskButton;
}