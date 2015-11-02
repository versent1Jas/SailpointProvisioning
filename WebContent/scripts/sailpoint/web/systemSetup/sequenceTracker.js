/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

// This file helps mimic the serialization functionality that was provided by 
// Scriptaculous Sortables.  The identity mappings configuration page uses it
// to track the sources' order.
// Author: Bernie Margolis

var SequenceTracker = {
    // Set of sequences that are being tracked
    sequences: new Object(),
    
    reset: function() {
      this.sequences = new Object();  
    },
    
    addSequence: function(sequenceId, sequence) {
        sequences[sequenceId] = sequence;
    },
    
    getSequence: function(sequenceId) {
        return SequenceTracker.sequences[sequenceId];
    },
    
    // Shifts the given value for the given sequence by 
    // the amount specified in the offset.  A negative offset
    // denotes a swap with a value that comes earlier in the 
    // sequence, and a positive one denotes a swap with a value
    // that comes later in the sequence
    swapValue: function(sequenceId, valueId, offset) {
        var currentSequence = SequenceTracker.sequences[sequenceId];
        
        if (currentSequence && currentSequence != null) {
            // Find the right index
            var i = 0;
            while (currentSequence[i] != valueId && i < currentSequence.length) {
                ++i;
            }
            
            if (i != currentSequence.length) {
                var targetIndex = i + offset;
                // If the offset is valid swap the indecies;
                if ((targetIndex >= 0) && (targetIndex < currentSequence.length)) {
                    currentSequence[i] ^= currentSequence[targetIndex];
                    currentSequence[targetIndex] ^= currentSequence[i];
                    currentSequence[i] ^= currentSequence[targetIndex];
                }
            }
        }
    },
    
    appendValueToSequence: function(sequenceId, valueId) {
        var currentSequence = SequenceTracker.sequences[sequenceId];
        
        // alert('appending ' + valueId + ' value to the ' + sequenceId + ' sequence');
        if (!currentSequence || currentSequence == null) {
            currentSequence = [];
            SequenceTracker.sequences[sequenceId] = currentSequence;
        }
        
        currentSequence[currentSequence.length] = valueId;
    },
    
    // Returns an output similar to the Sortables.sequence output
    sequence: function(sequenceId) {
        var retval = '';
        var currentSequence = SequenceTracker.sequences[sequenceId];
        
        if (currentSequence && currentSequence != null && currentSequence.length > 0) {
            retval += currentSequence[0];
            for (var i = 1; i < currentSequence.length; ++i) {
                retval += ','
                retval += currentSequence[i];
            }
        }
        
        return retval;
    }
}

