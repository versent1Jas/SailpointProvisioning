/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This page contains the logic that controls the sliders on the compositeScoringInclude.xhtml page
 */
var sliders;
var sliderData;
var range = 100;
var sliderGroup;
var cachedInputValues = [];
var configDivs = [];
var isExpanderLocked = false;
var imageFormat = '.png';

Ext.ns('SailPoint', 'SailPoint.Risk');

// This variable is used to hide and/or display sliders as they are being expanded and contracted.
// It's a workaround for some Effect.BlindUp/Effect.BlindDown issues with the sliders
var expandingSliderDivs = {};

SailPoint.Risk.isCompositePanelLoaded = false;

SailPoint.Risk.initCompositePanel = function() {
    if (!SailPoint.Risk.isCompositePanelLoaded) {
        var i;
        
        sliders = []
        for (i = 0; i < sliderData.length; ++i) {
            if (sliderData[i] && sliderData[i] != null) {
                sliders.push(createCompositeSlider(sliderData[i].id, sliderData[i].weight));
            }
        }
        sliderGroup = new Control.SliderGroup(sliders, range);
        // Freaking IE
        if (Ext.isIE) {
            var sliderWraps = Ext.DomQuery.select('div[className=sliderWrap]', $('compositeScorePanel'));
            for (i = 0; i < sliderWraps.length; ++i) {
                // Hack alert -- Reapply the class because IE didn't apply it properly 
                // the first time because the panel was hidden while it was rendering
                sliderWraps[i].className = '';
                sliderWraps[i].className = 'sliderWrap';
            }
        }
        
        SailPoint.Risk.isCompositePanelLoaded = true;
    }
}

// This function fetches the input for the specified category ID
function getInputFor(categoryId) {
    targetDiv = $('weightInput' + categoryId);

    if (targetDiv) {
        inputs = targetDiv.getElementsByTagName('input');
    } else {
        inputs = null;
    }

    if (inputs != null) {
        return inputs.item(0);               
    } else {
        return null;
    }
}
  
// This function caches all the input values so that we can always back
// a change out if it proves invalid
function cacheInputs() {
    var i = 0;
    
    currentInput = getInputFor(i);
    
    while (currentInput != null) {
        cachedInputValues[i] = currentInput.value;
        i++;
        currentInput = getInputFor(i);
    }
}

// This was a convenience function that creates a slider with the logic required
// to function as part of a sliderGroup -- leaving the comments in case we ever need
// another set of slider gropus
//    function createCompositeSlider(categoryId, categoryWeight) {
//        var newSlider = 
//            new Control.Slider('handle' + categoryId, 'slider' + categoryId,
//                {
//                    range: $R(0, range),
//                    sliderValue: categoryWeight,
//                    axis: 'horizontal',
//                    onSlide: function(v) {
//                      getInputFor(categoryId).value = Math.round(v);
//                    },
//            
//                    onChange: function(v) { 
//                        var currentSlider = sliders[categoryId];
//             
//                        delta = Math.round(v - (cachedInputValues[categoryId] * 1.0));
//                
//                        if (sliderGroup.updateInProgress || 
//                            currentSlider.value == cachedInputValues[categoryId]) {
//                            // No adjustments needed in this case.  Just set the value
//                            newValue = Math.round(v);
//                            getInputFor(categoryId).value = newValue;
//                            cachedInputValues[categoryId] = newValue;                      
//                        } else {
//                            var delta = Math.round(v - (cachedInputValues[categoryId] * 1.0));
//                            newDelta = sliderGroup.adjustValuesForSlider(currentSlider, delta);
//                            v += (newDelta - delta);
//                
//                            // Need to adjust and set the value
//                            newValue = Math.round(v);
//                            getInputFor(categoryId).value = newValue;
//                            cachedInputValues[categoryId] = newValue;
//                            currentSlider.setValue(newValue);
//                       
//                            updateCompositeScoring();
//                        }                                                                    
//                    }
//                }
//            );
//
//        newSlider.id = categoryId;
//        return newSlider;
//    }

// This is a convenience function that creates a composite slider 
function createCompositeSlider(categoryId, categoryWeight) {
    var newSlider = 
        new Control.Slider('handle' + categoryId, 'slider' + categoryId,
            {
                range: $R(0, 100),
                sliderValue: categoryWeight,
                axis: 'horizontal',
                onSlide: function(v) {
                  var inputElement = getInputFor(categoryId);
                  inputElement.value = Math.round(v);
                  var colorStore = Ext.StoreMgr.lookup('neutralColorStore');
                  var indicator = $('weightIndicatorFor' + categoryId);
                  indicator.src =  colorStore.getImageUrlForScore(inputElement.value * 10);
                },
        
                onChange: function(v) { 
                    var currentSlider = sliders[categoryId];
            
                    // No adjustments needed in this case.  Just set the value
                    newValue = Math.round(v);
                    var inputElement = getInputFor(categoryId);
                    inputElement.value = newValue;
                    cachedInputValues[categoryId] = newValue;                      

                    var colorStore = Ext.StoreMgr.lookup('neutralColorStore');
                    var indicator = $('weightIndicatorFor' + categoryId);
                    indicator.src =  colorStore.getImageUrlForScore(inputElement.value * 10);
                    isPageDirty = true;
                }
            }
        );

    newSlider.id = categoryId;
    
    var inputElement = getInputFor(categoryId);
    var colorStore = Ext.StoreMgr.lookup('neutralColorStore');
    var indicator = $('weightIndicatorFor' + categoryId);
    indicator.src =  colorStore.getImageUrlForScore(inputElement.value * 10);
    
    return newSlider;
}

// This function updates the slider when a numerical input is manually entered
function updateSlider(sliderId, value, keyupEvent) {    
    // Force IE to react to enter being pressed
    if (keyupEvent && keyupEvent.keyCode != 13) {
        return false;
    }

    if (sliderGroup) { 
        sliderGroup.getSlider(sliderId).setValue(value * 1.0);
    }
}

// This function modifies the lock on the specified slider, as specified by
// the given boolean value
function setLock(sliderId, value) {
    if (value) {
        sliderGroup.lockSlider(sliderGroup.getSlider(sliderId));
        $('lockFor' + sliderId).innerHTML =
            '<img src="' + CONTEXT_PATH + '/images/icons/riskscore_locked_16.png" class="sliderHandle" onclick="setLock(' + sliderId + ', false);" alt="" />'
    } else {
        sliderGroup.unlockSlider(sliderGroup.getSlider(sliderId));
        $('lockFor' + sliderId).innerHTML = 
            '<img src="' + CONTEXT_PATH + '/images/icons/riskscore_unlocked_16.png" class="sliderHandle" onclick="setLock(' + sliderId + ', true);" alt="" />'
    }
}

function showConfigDiv(configDiv) {    
    // Hide the save and cancel buttons
    $('editForm:visibleSaveButton').hide();
    $('editForm:visibleCancelButton').hide();
    
    for (var i = 0; i < configDivs.length; ++i) {
        if (configDivs[i].id == configDiv) {
            // Show the given div
            $('mainPanel').style['display'] = 'none';
            Effect.Appear(configDivs[i]);
        } else {
            // Hide the config divs
            var divId = configDivs[i].id;
            if (divId != '' && divId.lastIndexOf('Config') == (divId.length - 'Config'.length)) {
                configDivs[i].style['display'] = 'none';
            }
        }
    }
}

function highlightParentRow(element) {
    var allRows = $('editForm:riskScoreConfigTable').rows;
    
    for (var i = 0; i < allRows.length; ++i) {
        allRows[i].className = 'ricoLG_evenRow';
    }
    
    var elementRow = element;
    
    while (!elementRow.rowIndex) {
        elementRow = elementRow.parentNode;
    }
    
    elementRow.className = 'ricoLG_oddRow';
}
    
// This function toggles expansion for the icon that was pressed.
// If no contentDiv is specified, this function will make the following assumptions to
// guess at a proper contentDiv:
// 1. The icon's id ends with 'expander'
// 2. The content div's id is identical to the icon's id, with the exception that the word
//    'expander' is replaced with 'content'
function toggleExpansion(icon, contentDiv) {
    var iconId = icon.id;
    
    if (!isExpanderLocked) {   
        // Prevent clicking on the icon in the middle of an effect or chaos ensues
        lockExpander();
        
        if (!contentDiv) {
            var prefixEnd = iconId.lastIndexOf('expander');
            var prefix = iconId.substring(0, prefixEnd);
            contentDiv = $(prefix + 'content');
        }
        
        if (icon.isMaximized) {
            icon.isMaximized = false;
            icon.src = CONTEXT_PATH + '/images/icons/plus.png';
            hideSliderDivs(contentDiv);
            Effect.BlindUp(contentDiv);
        } else {
            if (icon.isMaximized == false) {
                icon.isMaximized = true;
                icon.src = CONTEXT_PATH + '/images/icons/minus.png';
                Effect.BlindDown(contentDiv);
                // Put in a delay to avoid weirdness during expansion
                setTimeout('displaySliderDivs("' + contentDiv.id + '")', 1250);
            } else {
                // Not initialized yet
                icon.isMaximized = false;
                icon.src = CONTEXT_PATH + '/images/icons/plus.png';
                hideSliderDivs(contentDiv);
                Effect.BlindUp(contentDiv);
            }
        }        
    }
}

function lockExpander() {
    isExpanderLocked = true;
    setTimeout('unlockExpander()', 1500);
}
function unlockExpander() {
    isExpanderLocked = false;
}

// This function collapses all sub tables within the specified table.
// It makes the following assumptions to determine the icon that needs 
// to be changed and to distinguish between sliders and content panels:
// 1. The icon's id ends with 'expander'
// 2. The content div's id is identical to the icon's id, with the exception that the word
//    'expander' is replaced with 'content'
function contractContents(contentTable) {
    if (!isExpanderLocked) {
        lockExpander();
        
        var contents = contentTable.getElementsByTagName('div');
        
        for (var i = 0; i < contents.length; ++i) {
            var contentId = contents[i].id;
            var prefixEnd = contentId.lastIndexOf('content');
            
            if (prefixEnd != -1) {
                var prefix = contentId.substring(0, prefixEnd);
                var icon = $(prefix + 'expander');

                if (icon.isMaximized != false) {
                    hideChildren(contents[i]);
                    Effect.BlindUp(contents[i]);
                    icon.isMaximized = false;
                    icon.src = CONTEXT_PATH + '/images/icons/plus.png';
                }
            }
        }
    }
}

function hideChildren(parentDiv) {
    var children = parentDiv.getElementsByTagName('div');

    for (var i = 0; i < children.length; ++i) {
        children[i].style['visibility'] = 'hidden';
    }
}

// This function expands all sub tables within the specified table.
// It makes the following assumptions to determine the icon that needs 
// to be changed and to distinguish between sliders and content panels:
// 1. The icon's id ends with 'expander'
// 2. The content div's id is identical to the icon's id, with the exception that the word
//    'expander' is replaced with 'content'
function expandContents(contentTable) {
    if (!isExpanderLocked) {
        lockExpander();
        
        var contents = contentTable.getElementsByTagName('div');
        var sliderDivs = [];
        
        for (var i = 0; i < contents.length; ++i) {
            var contentId = contents[i].id;
            var prefixEnd = contentId.lastIndexOf('content');
            
            if (prefixEnd != -1) {
                var prefix = contentId.substring(0, prefixEnd);
                var icon = $(prefix + 'expander');

                if (icon.isMaximized == false) {
                    Effect.BlindDown(contents[i]);
                    icon.isMaximized = true;
                    icon.src = CONTEXT_PATH + '/images/icons/minus.png';
                }
            } else {
                sliderDivs[sliderDivs.length] = contents[i];
            }            
        }
        
        expandingSliderDivs[contentTable.id] = sliderDivs;
    }
    
    // Put in a delay to avoid weirdness during expansion
    setTimeout('displayAllSliderDivs("' + contentTable.id + '")', 1250);
}

function hideSliderDivs(parentDiv) {
    var sliderDivs = parentDiv.getElementsByTagName('div');
    
    for (var i = 0; i < sliderDivs.length; ++i) {
        sliderDivs[i].style['visibility'] = 'hidden';
    }
}

function displaySliderDivs(parentDivId) {
    var sliderDivs = $(parentDivId).getElementsByTagName('div');

    for (var i = 0; i < sliderDivs.length; ++i) {
        sliderDivs[i].style['visibility'] = 'visible';
    }
}

function displayAllSliderDivs(parentTableId) {
    var sliderDivs = expandingSliderDivs[parentTableId];
    expandingSliderDivs[parentTableId] = null;

    for (var i = 0; i < sliderDivs.length; ++i) {
        sliderDivs[i].style['visibility'] = 'visible';
    }
}

