'use strict';

/**
 * This file contains functions that are required to make things work correctly
 * on the Android tablet.
 */
SailPoint.ready(function() {
    // Determine if this is an Android tablet running Chrome.
    var ua = navigator.userAgent,
        isAndroid = /Android/.test(ua),
        isAndroidTablet = isAndroid && /Chrome\/[.0-9]* (?!Mobile)/.test(ua),
        heightResetCount = 0,
        heightResetTimeout;

    /**
     * Set the body height to match the height of the window.  This prevents
     * the body height from shrinking when the keyboard is displayed, which
     * causes rendering issues.
     */
    function setBodyHeight() {
        var height = window.outerHeight;
        document.body.style.height = height + 'px';
    }

    /**
     * Return the body height as an integer.
     */
    function getBodyHeightInt() {
        var height = document.body.style.height;
        if (height.toLowerCase().indexOf('px') > -1) {
            height = height.substr(0, height.length-2);
        }
        return Number.parseInt(height, 10);
    }

    /**
     * Reset the height counter and timeout.
     */
    function resetTrackingVars() {
        // If there is a timeout waiting to fire, cancel it.
        if (heightResetTimeout) {
            clearTimeout(heightResetTimeout);
            heightResetTimeout = null;
        }
        heightResetCount = 0;
    }

    /**
     * Handler for ensuring that the window and body heights match.
     */
    function handleHeightReset() {
        // Reset any processing we're currently doing for orientation changes.
        resetTrackingVars();

        // Try to set the body height.
        resetHeight();
    }

    /**
     * Try to set the body height to match the window height if they differ.
     * If they are the same, the window height may not have been updated yet
     * after an orientation change, so keep polling for a while to make sure
     * the body height gets updated after the window height change is reflected.
     */
    function resetHeight() {
        var windowHeight = window.outerHeight,
            bodyHeight = getBodyHeightInt();

        // If the heights are the same ... wait for a short while and try again
        // unless we have met the max wait time.
        if (windowHeight === bodyHeight) {
            // Keep spinning.
            if (heightResetCount < 20) {
                heightResetCount++;
                heightResetTimeout = setTimeout(resetHeight, 100);
            }
            else {
                // We hit the max wait time.  Just reset and quit spinning.
                resetTrackingVars();
            }
        }
        else {
            // The heights differ, so set the body height and reset.
            setBodyHeight();
            resetTrackingVars();
        }
    }


    // This appears to only be a problem on Android Chrome.
    if (isAndroidTablet) {
        //reset height twice on page load to fix Bug 21113
        //which requires two resets after logging in with the keyboard up
        setBodyHeight();
        handleHeightReset();
        // Reset the body height after the orientation is changed since we
        // hardcoded it when the page was first loaded.
        window.addEventListener('orientationchange', handleHeightReset);
        //reset body height on blur which is hopefully every time the keyboard is closed or changed
        window.addEventListener('blur', handleHeightReset);
    }
});
