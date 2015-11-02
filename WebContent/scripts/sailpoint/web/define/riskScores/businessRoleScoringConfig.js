/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This page contains the logic that controls the business role scoring configuration panel
 */
var ccSliderData = [];
var numCCSliders = 0;
var loadTime = 0;

function getColorForScore(score) {
    var i = 0;
    
    while ($('editForm:bandConfigTabl' + i + ':bandupper').innerHTML * 1.0 < score) {
        ++i;
    }
    
    return $('editForm:bandConfigTabl' + i + ':bandColor').value;
}

function getInputForCCStandAlone(sliderId) {
    return $('editForm:riskScoreCCConfigTabl' + sliderId + ':ccFactor');
}
