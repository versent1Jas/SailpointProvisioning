/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/** This script performs any important appPage.xhtml related functions at the end of the page **/

//The following script builds tooltips for pages that include the "?" help image
//on their page.  Script looks for images with "imgHlp" in their id and
//takes their alt text to build a tooltip.
Ext.onReady(function() {
  if(typeof(buildTooltips) != "undefined") 
    buildTooltips();
});