/**
 * Platform is used for device specific (eg - mobile) detection.
 */
Ext.define('SailPoint.Platform', {
    singleton : true,

   _ismobile : (/iPhone/i.test(navigator.userAgent) ||
                /iPad/i.test(navigator.userAgent) ||
                /iPod/i.test(navigator.userAgent) ||
                /Android/i.test(navigator.userAgent)),

    /**
     * Return whether or not browsing is from mobile device
     */
    isMobile : function() {
        return this._ismobile;
    }
});
