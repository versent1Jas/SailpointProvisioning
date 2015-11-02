/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

// This is an extension to sliders that enables a group of slider-input pairs
// to behave in conjunction so that the sum of all the slider values in the group
// does not exceed a specified maximum
if(!Control) {
    var Control = {};
}    

Control.SliderGroup = Class.create();

Control.SliderGroup.prototype = {
    // The constructor takes an array of Control.Sliders and
    // a number that represents the sum of the slider values
    initialize: function(aSliderArray, total) {
        
        this.externalTotal = total;
        this.sliderArray = aSliderArray;
        this.lock = new Array(aSliderArray.length);
        this.updateInProgress = false;
        
        this._initializeRatios();      
        this._initializeLocksAndIndecies();        
    },
    
    // Returns true if the value could be set.  Returns false otherwise
    adjustValuesForSlider: function(slider, delta) {    
        var actualDelta = 0;
        
        if (!this._isLocked(slider) && !this.updateInProgress) {
            this.lockSlider(slider);
            this.updateInProgress = true;           
            actualDelta = this._adjustValues(delta);
            this.unlockSlider(slider);
            this.updateInProgress = false;
        } 
        
        return actualDelta;
    },
    
    getSlider: function(sliderId) {
        for (i = 0; i < this.sliderArray.length; ++i) {
            if (this.sliderArray[i] == undefined)
                continue;
                
            if (this.sliderArray[i].id == sliderId) {
                return this.sliderArray[i];
            }
        }
    },
    
    lockSlider: function(slider) {
        this.lock[slider.index] = true;
    },
    
    unlockSlider: function(slider) {
        this.lock[slider.index] = false;
    },

    _initializeLocksAndIndecies: function() {
        var currentIndex = 0;
        for (i = 0; i < this.sliderArray.length; ++i) {
            // it's possible to have an index with an undefined value
            if (this.sliderArray[i] == undefined)
                continue;

            this.sliderArray[i].index = currentIndex;
            currentIndex++;
            this.lock[currentIndex] = false;
        }
    },
    
    // This function should be called on construction and/or
    // any time a new slider is added to this group
    _initializeRatios: function() {
        // Associate a ratio with each slider by summing the 
        // values of the sliders and dividing each individual
        // value by the total.
        internalTotal = 0;
        
        
        for (i = 0; i < this.sliderArray.length; ++i) {
            // it's possible to have an index with an undefined value
            if (this.sliderArray[i] == undefined)
                continue;
                
            internalTotal += this.sliderArray[i].value;
        }
        
        for (i = 0; i < this.sliderArray.length; ++i) {
            // it's possible to have an index with an undefined value
            if (this.sliderArray[i] == undefined)
                continue;

            var currentSlider = this.sliderArray[i];
            currentSlider.ratio = currentSlider.value / internalTotal;
            // Normalize the sliders to conform to the specified externalTotal
            currentSlider.value = currentSlider.ratio * this.externalTotal;
        }
    },
    
    // Evenly distribute the specified change among the unlocked sliders.
    // This function adjusts the delta to acceptable ranges and returns the 
    // actual delta that was used.
    _adjustValues: function(delta) {
        this.updateInProgress = true;
        var numUnlockedSliders = 0;
       
        // Count the number of unlocked sliders
        numUnlockedSliders = this._getNumUnlockedSliders();
        
        if (numUnlockedSliders == 0) {
            return 0;
        } else {        
            // Calculate how much the unlocked sliders will get
            var distribution = Math.floor(delta / numUnlockedSliders);
        
            if (delta > 0) {
                // Figure out how much we can draw from the unlocked sliders
                var totalForUnlocked = 0.0;
         
                for (i = 0; i < this.sliderArray.length; ++i ) {
                    if (!this._isLocked(this.sliderArray[i])) {
                        totalForUnlocked += (this.sliderArray[i].value * 1.0);
                    }
                }
                
                // Adjust the delta to an acceptable level
                if (totalForUnlocked < delta) {
                    delta = Math.round(totalForUnlocked);
                }
            } 
                                
            var remainingDelta = Math.round(delta);
                        
            // Distribute the delta among the unlocked sliders
            var tempLocks = new Array(this.sliderArray.length);
             
            for (i = 0; i < this.sliderArray.length; ++i) {
                tempLocks[i] = false;
            }
                        
            while (remainingDelta != 0) {
                var tempLockSize = 0;
                    
                for (i = 0; i < tempLocks.size; ++i) {
                    if (tempLocks[i]) {
                        tempLockSize++;
                    }                        
                }
                
                evenDistribution = Math.floor(remainingDelta / (numUnlockedSliders - tempLockSize));

                if (evenDistribution == 0) {
                    evenDistribution = 1;
                }
                
                for (i = 0; i < this.sliderArray.length && remainingDelta != 0; ++i) {
                    var currentSlider = this.sliderArray[i];
                   
                    if (!this._isLocked(currentSlider) && !tempLocks[i]) {
                        var currentValue = this.sliderArray[i].value;
                        var actualDistribution;
                    
                        if (currentValue - evenDistribution > this.externalTotal) {
                            actualDistribution = currentValue - this.externalTotal;
                            tempLocks[i] = true;
                        } else if (currentValue - evenDistribution < 0) {
                            actualDistribution = currentValue;
                            tempLocks[i] = true;
                        } else {
                            actualDistribution = evenDistribution;
                            tempLocks[i] = false;
                        }
                        
                        remainingDelta -= actualDistribution;
                         
                        currentSlider.setValue(currentValue - actualDistribution);
                    } 
                }
            }

            return delta;
        }
    },
    
    _isLocked: function(slider) {
        return this.lock[slider.index];
    },
    
    _getNumUnlockedSliders: function() {
        var numUnlockedSliders = 0;
        
        for (i = 0; i < this.lock.length - 1; ++i) {
            if (!this.lock[i]) {
                numUnlockedSliders++;
            }
        }
        
        return numUnlockedSliders;
    }
}
