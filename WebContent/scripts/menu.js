// **************************************************
// Tabbed submenu
// **************************************************
function displayAppropriatePane(contentBox, button) {
    updateContentDisplay('submenuContentBox', 'none');
    $(contentBox).style.display = '';
    // add some styling to the button, if one was passed
    if (button != null && $(button)) {
        $(button).className = 'sMButton sMButtonHover';
        var buttonSpans = $(button).getElementsByTagName('span');
        for ( var i = 0; i < buttonSpans.length; i++) {
            buttonSpans[i].className = 'sMText sMTextHover';
        }
    }
};

function subMouseOver(element) {
    if ($(element).className == 'sMButton')
        $(element).className = 'sMButtonHover';
    if ($(element).className == 'sMText')
        $(element).className = 'sMTextHover';
}

function subMouseOut(element) {
    if ($(element).className == 'sMButtonHover')
        $(element).className = 'sMButton';
    if ($(element).className == 'sMTextHover')
        $(element).className = 'sMText';
}

function refreshContentDisplay(contentBox) {
    var i, menuContentBoxes = Ext.DomQuery.select("[class*=submenuContentBox]");
    for (i = 0; i < menuContentBoxes.length; i++) {
        menuContentBoxes[i].style.display = 'none';
    }
    $(contentBox).style.display = '';
}

function updateContentDisplay(className, display) {
    var menuContentBoxes = Ext.DomQuery.select("[class*=" + className + "]");
    var buttons;
    var buttonsA;
    var i;

    for (i = 0; i < menuContentBoxes.length; i++) {
        menuContentBoxes[i].style.display = display;
    }

    // Turn off the other buttons
    if ($('submenu-tabs')) {
        buttons = Ext.DomQuery.select('li', $('submenu-tabs'));
        for (i = 0; i < buttons.length; i++) {
            buttons[i].className = 'sMButton';
        }

        buttonsA = $('submenu-tabs').getElementsByTagName('span');
        for (i = 0; i < buttonsA.length; i++) {
            buttonsA[i].className = 'sMText';
        }
    }
};
