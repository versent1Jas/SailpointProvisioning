SailPoint.ns('SailPoint.Login');
/*
 * The Below function is not shared between the mobile ui and the
 * core ui so it was kicked out of the ui/common/login.js
 */
/**
 * A click handler that can be added to the submit button.
 * It replaces the login button with a waiting spinner and message.
 */
SailPoint.Login.loginClick = function(event){
    $('loginButtonDisplay').hide();
    $('loginLoadingDisplay').show();
    $('loginForm:loginButton').click();
};
