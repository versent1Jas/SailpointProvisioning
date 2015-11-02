/* from http://trentwalton.com/2013/01/16/windows-phone-8-viewport-fix/
 * It is a known issue that IE 10 Mobile reports the actual screen resolution
 * in media queries rather than the css width.  This little bit of code
 * makes IE 10 Mobile return the expected result.
 */
(function() {
    if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
        var msViewportStyle = document.createElement("style");
        msViewportStyle.
            appendChild(document.
                createTextNode("@-ms-viewport{width:auto!important}"));
        document.
            getElementsByTagName("head")[0].appendChild(msViewportStyle);
    }
})();
