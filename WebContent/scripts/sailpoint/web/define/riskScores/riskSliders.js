/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This page contains the logic that controls the business role scoring configuration panel
 */
var factorSliderData = [];
var numFactorSliders = 0;

var indicatorSliderData = [];
var numIndicatorSliders = 0;

var imageFormat = '.png';

function initRiskSliders() {
    initRiskSlidersOnLoad();
}

/**
 * This function stores the data needed to create a slider.  Sliders cannot be created unless
 * these two conditions hold true:
 * 1. The page is loaded
 * 2. All the handles and tracks are visible
 * 
 * rootPanelId - id of the div that encompasses all these divs
 * handleId - id of the div that contains the draggable image
 * trackId - id of the div that contains the track on which the handle moves
 * initialValue - value to which the slider will be initialized
 * maxValue - the upper bound of the slider's range
 * increment - amount by which the slider can be incremented.  The minimum increment that 
 * this script currently supports is 0.1
 * inputElement - The element that contains the input which will be bound to the slider
 */
function addFactorSliderData(rootPanelId, handleId, trackId, sampleSpanId, indicatorId, initialValue, minValue, maxValue, increment, inputElement) {
//     alert('adding factor for ' + handleId + ', ' + trackId + ', ' + initialValue + ', ' + maxValue + ', ' + increment + ', ' + inputElement);
     var newSliderData = {
         rootPanelId: rootPanelId,
         handleId: handleId,
         trackId: trackId,
         sampleSpanId: sampleSpanId,
         indicatorId: indicatorId,
         initialValue: initialValue,
         minValue: minValue,
         maxValue: maxValue,
         increment: increment,
         inputElement: inputElement
     };
     
     factorSliderData[numFactorSliders] = newSliderData;
     numFactorSliders++;
}

/**
 * This function stores the data needed to create a slider.  Sliders cannot be created unless
 * these two conditions hold true:
 * 1. The page is loaded
 * 2. All the handles and tracks are visible
 * 
 * rootPanelId - id of the div that encompasses all these divs
 * handleId - id of the div that contains the draggable image
 * trackId - id of the div that contains the track on which the handle moves
 * initialValue - value to which the slider will be initialized
 * inputElement - The element that contains the input which will be bound to the slider
 * indicator - graphic that will indicate the band in which the current slider value falls
 * subPanelId - Optional subPanel that may needs to be shown and hidden on initialization.
 *              TODO: If we need additional levels of panels we may want to refactor the rootPanelId
 *              field into an array of panels.  For now we support one additional level
 */
function addIndicatorSliderData(rootPanelId, handleId, trackId, initialValue, inputElement, indicator, subPanelId) {
     // alert('adding indicator for ' + handleId + ', ' + trackId + ', ' + initialValue + ', ' + inputElement + ', ' + indicator + ', ' + subPanelId);
     var newSliderData = {};
     newSliderData.rootPanelId = rootPanelId;
     newSliderData.handleId = handleId;
     newSliderData.trackId = trackId;
     newSliderData.initialValue = initialValue;
     newSliderData.inputElement = inputElement;
     newSliderData.indicator = indicator;
     
     if (subPanelId) {
         newSliderData.subPanelId = subPanelId;
     }
     
     indicatorSliderData[numIndicatorSliders] = newSliderData;
     numIndicatorSliders++;
}


function initRiskSlidersOnLoad(divToDisplay) {
    if (document.readyState && document.readyState != 'complete') {        
        setTimeout('initRiskSlidersOnLoad("' + divToDisplay + '")', 50);
    } else {
        var currentRootPanel = null;
    
        for (var i = 0; i < numFactorSliders; ++i) {
            // Only show and/or hide the root if it changes from the previous iteration
            if (currentRootPanel != factorSliderData[i].rootPanelId) {
                if (currentRootPanel != null) {
                    $(currentRootPanel).style['display'] = 'none';
                }
                
                currentRootPanel = factorSliderData[i].rootPanelId;
                
                $(currentRootPanel).style['display'] = '';
            }
            
            var newSlider = 
                createSlider(factorSliderData[i].handleId, factorSliderData[i].trackId,
                             $(factorSliderData[i].sampleSpanId), $(factorSliderData[i].indicatorId), 
                             factorSliderData[i].initialValue, factorSliderData[i].minValue, factorSliderData[i].maxValue, 
                             factorSliderData[i].increment, factorSliderData[i].inputElement);
        }
        
        if (currentRootPanel != null) {
            $(currentRootPanel).style['display'] = 'none';
        }

        var currentSubPanel = null;

        for (var i = 0; i < numIndicatorSliders; ++i) {
            // Only show and/or hide the root if it changes from the previous iteration
            if (currentRootPanel != indicatorSliderData[i].rootPanelId) {
                if (currentRootPanel != null) {
                    $(currentRootPanel).style['display'] = 'none';
                }
                
                currentRootPanel = indicatorSliderData[i].rootPanelId;
                $(currentRootPanel).style['display'] = '';
            }
            
            // Only show and/or hide the sub panel if it changes from the previous iteration
            if (indicatorSliderData[i].subPanelId) {
                if (currentSubPanel != indicatorSliderData[i].subPanelId) {
                    if (currentSubPanel != null) {
                        $(currentSubPanel).style['display'] = 'none';
                    }
    
                    currentSubPanel = indicatorSliderData[i].subPanelId;
                    $(currentSubPanel).style['display'] = '';
                } 
            } else {
                if (currentSubPanel != null) {
                    $(currentSubPanel).style['display'] = 'none';
                }

                currentSubPanel = null;
            }

            var newSlider = 
                createSliderWithIndicator(indicatorSliderData[i].handleId, indicatorSliderData[i].trackId, 
                                          indicatorSliderData[i].initialValue, indicatorSliderData[i].inputElement,
                                          indicatorSliderData[i].indicator);
        }
        
        if (currentRootPanel != null) {
            $(currentRootPanel).style['display'] = 'none';
        }
        
        if (currentSubPanel != null) {
            $(currentSubPanel).style['display'] = 'none';
        }
        
        if (divToDisplay && divToDisplay != 'undefined') {
            $(divToDisplay).show();
            
            var instructionDiv = $(divToDisplay + 'Instructions');
            if (instructionDiv != null) {
                instructionDiv.show();
            }
        }
    }
    
}

// This is a convenience function that creates a slider -- This function is used for compensating controls
function createSlider(handleId, trackId, sampleSpan, indicator, initialValue, minValue, factorRange, increment, inputElement) {
    // Note: we assume that the color store has been initialized.  We have to do this because loading the color store is
    // an asynchronous operation and this could cannot successfully be executed until it has fully loaded.  For this reason,
    // we leave it up to the page to load the color store and kick off the page loading in a callback.  
    // See the bottom of compensantingControlsInclude.xhtml or riskScores.xhtml for an example -- Bernie
    var colorStore = Ext.StoreMgr.lookup('neutralColorStore');
        
    var newSlider = 
        new Control.Slider(handleId, trackId,
            {
                range: $R(0, factorRange),
                sliderValue: initialValue,
                axis: 'horizontal',
                onSlide: function(v) {
                  var newValue = Math.round(1 * v) / 1;
                  inputElement.value = newValue;
                  var updatedSampleValue;
                  
                  if (inputElement.isReducer == true) {
                      // The reducer scale works differently on the back end, so we have to normalize
                      // it to obtain a meaningful color
                      updatedSampleValue = Math.round(1000.0 - (10.0 * inputElement.value));
                  } else {
                      updatedSampleValue = Math.round(inputElement.value);
                      if (updatedSampleValue > 1000) {
                          updatedSampleValue = 1000;
                      }
                  }
                  
                  indicator.src =  colorStore.getImageUrlForScore(updatedSampleValue);
                },
          
                onChange: function(v) {
                  var newValue = Math.round(1 * v) / 1;
                  inputElement.value = newValue;
                  var updatedSampleValue;
                  
                  if (inputElement.isReducer == true) {
                      // The reducer scale works differently on the back end, so we have to normalize
                      // it to obtain a meaningful color
                      updatedSampleValue = Math.round(1000.0 - (10.0 * inputElement.value));
                      indicator.src =  colorStore.getImageUrlForScore(updatedSampleValue);
                  } else {
                      updatedSampleValue = Math.round(inputElement.value);
                      if (updatedSampleValue > 1000) {
                          updatedSampleValue = 1000;
                      }
                      
                      indicator.src =  colorStore.getImageUrlForScore(updatedSampleValue);
                  }
                  
                  isPageDirty = true;
                }
            }
        );
        
      inputElement.onchange = function() {
          updateSliderWithInput(newSlider, inputElement);
          isPageDirty = true;
      }
      
      // Force IE to react to enter being pressed
      inputElement.onkeyup = function(event) {
          if (!event) {
              var event = window.event;
          }
          
          updateSliderWithInput(newSlider, inputElement, event);
      }
      
      return newSlider;
}

function updateSliderWithInput(slider, inputElement, keyupEvent) {
    // Force IE to react to enter being pressed
    if (keyupEvent && keyupEvent.keyCode != 13) {
        return false;
    }

    var updatedValue = Math.round(inputElement.value * 1) / 1;
      
    if (updatedValue < slider.minimum) {
        updatedValue = slider.minimum;
        inputElement.value = updatedValue;
        slider.setValue(updatedValue);
    } else if (updatedValue > slider.maximum) {
        updatedValue = slider.maximum;
        inputElement.value = updatedValue;
        slider.setValue(updatedValue);
    } else {
        if (slider.value != updatedValue) {
            slider.setValue(updatedValue);
        }
    } 
}

// This is a convenience function that creates a slider
function createSliderWithIndicator(handleId, trackId, initialValue, inputElement, indicator, maxValue, extraOnSlide, extraOnChange) {
    if (indicator) {
         var color = getColorForScore(initialValue);
         indicator.src =  SailPoint.Risk.convertColorToImage(color);
    }
    
    if (!maxValue) {
        var maxValue = 1000;
    }
    
    var newSlider = 
        new Control.Slider(handleId, trackId, {
            range: $R(0, maxValue),
            sliderValue: initialValue,
            axis: 'horizontal',
            onSlide: function(v) {
                var newValue = Math.round(1 * v) / 1;
                inputElement.value = newValue;
                if (indicator) {
                    var color = getColorForScore(newValue);
                    indicator.src =  SailPoint.Risk.convertColorToImage(color);
                }
                
                if (extraOnSlide) {
                    extraOnSlide(v);
                }
            },
      
            onChange: function(v) {
                var newValue = Math.round(1 * v) / 1;
                inputElement.value = newValue;
                if (indicator) {
                    var color = getColorForScore(newValue);
                    indicator.src =  SailPoint.Risk.convertColorToImage(color);
                }
                if (extraOnChange) {
                    extraOnChange(v);
                }
            }
        });
        
    inputElement.onchange = function() {
        updateSliderWithInput(newSlider, inputElement);
        isPageDirty = true;
    }
      
    // Force IE to react to enter being pressed
    inputElement.onkeyup = function(event) {
        if (!event) {
            var event = window.event;
        }
         
        updateSliderWithInput(newSlider, inputElement, event);
    }


    return newSlider;
}
Ext.ns('SailPoint.Risk');

SailPoint.Risk.convertColorToImage = function(color) {
    var imageBase = SailPoint.getRelativeUrl('/images/icons/risk_indicator_');
    var indexOfPound = color.indexOf('#');
    return imageBase + color.substr(indexOfPound + 1) + imageFormat;
}


