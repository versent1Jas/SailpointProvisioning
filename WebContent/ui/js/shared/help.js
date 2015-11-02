/**
 * Launch the help window.
 *
 * @param  contextPath  The context path of the application.
 * @param  helpKey      The key of the requested help page.
 */
SailPoint.launchHelp = function(contextPath, helpKey) {
    var helpWindow =
        window.open(contextPath + '/help?helpKey=' + helpKey,
                    'IdentityIQHelp',
                    'location=0,menubar=no,titlebar=yes,toolbar=1,' +
                    'scrollbars=yes,width=1024,height=768');
    if (helpWindow) {
        helpWindow.focus();
    }
   
    return false;
};
