/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

////////////////////////////////////////////////////////////////////////////////
//
// NOTE: THIS FILE SHOULD NOT HAVE ANY EXTERNAL DEPENDENCIES SO THAT WE CAN
// DROP PROFILING STATEMENTS ANYWHERE.  THIS OPTIONALLY USES THE SAILPOINT LOG
// IF IT IS AVAILABLE.
//
////////////////////////////////////////////////////////////////////////////////

// Define the SailPoint package if it doesn't exist (equivalent to Ext.ns).
if (typeof SailPoint == 'undefined') {
    SailPoint = {};
}

// Define the Profiler class if it doesn't exist.
if (typeof SailPoint['Profiler'] == 'undefined') {

    /**
     * The Profiler is used to instrument javascript code with profiling
     * statements.  By surrounding blocks of code with startTiming() and
     * finishTiming() statements, the profiler will keep track of the number
     * of executions of that code block, the average time per execution,
     * max time, minimum time, total time, etc...
     * 
     * This is considered a static class, so the functions should be referenced
     * statically.  Typically usage will look like:
     * 
     *   SailPoint.Profiler.enabled = true;
     *   SailPoint.Profiler.startTiming('my code block.');
     *   ... some code that you want to profile ...
     *   SailPoint.Profiler.finishTiming('my code block.');
     * 
     * TODO: The Profiler currently isn't re-entrant, so we don't collect stats
     * correctly for code blocks that are started recursively before they are
     * finished.
     * 
     * @author Kelly Grizzle
     */
    SailPoint.Profiler = {

        // Turn the Profiler on or off (public).
        enabled: false,

        // Whether or not to show warning messages (public).
        warningsEnabled: true,

        // A hash mapping code block name to a Timing objects (private).
        timings: {},

        
        /**
         * Start timing for the given code block.
         * 
         * @param  codeBlock  A logical name of the code block.
         */
        startTiming: function(codeBlock) {
            if (!this.enabled) {
                return;
            }

            this._getTiming(codeBlock).startTiming();
        },
        
        /**
         * Finish timing for the given code block.  The name of the code block
         * should match that used in startTiming().
         * 
         * @param  codeBlock  A logical name of the code block.
         */
        finishTiming: function(codeBlock) {
            if (!this.enabled) {
                return;
            }

            var timing = this._getTiming(codeBlock);
            timing.finishTiming();

            // Probably don't want to do this every time.
            //this.printStats();
        },
        
        /**
         * Print the timing statistics of the profiler.
         */
        printStats: function() {
            if (!this.enabled) {
                return;
            }

            var stats = '';
            for (timing in this.timings) {
                if ('function' != typeof this.timings[timing]) {
                    stats += this.timings[timing].getStats(timing) + '\n';
                }
            }

            this.println(stats);
        },
        
        /**
         * Print a message.  This uses the SailPoint.Log if available.  If not
         * we just see an awesome looking alert!
         * 
         * @param  msg  The message to print.
         */
        println: function(msg) {
            if ('undefined' != typeof SailPoint['Log']) {
                SailPoint.Log.enabled = true;
                SailPoint.Log.message(msg);
            }
            else {
                alert(msg);
            }
        },

        /**
         * Print the given warning (if warnings are enabled).
         * 
         * @param  msg  The warning message to print.
         */
        warn: function(msg) {
            if (this.warningsEnabled) {
                this.println(msg);
            }
        },

        /**
         * Private function to return the existing Timing for the given code
         * block or to create a new one.
         * 
         * @param  codeBlock  The name of the code block.
         * 
         * @return The Timing for the given code block.
         */
        _getTiming: function(codeBlock) {
            var timing = this.timings[codeBlock];
            if (null == timing) {
                timing = new SailPoint.Profiler.Timing();
                this.timings[codeBlock] = timing;
            }
            return timing;
        }
    },
    

    /**
     * Timing is a private inner class that holds statistics for a single code
     * block.
     */
    SailPoint.Profiler.Timing = function() {};
    SailPoint.Profiler.Timing.prototype = {

        total: 0,
        hits: 0,
        lastStart: null,
        lastDuration: null,
        
        /**
         * Start this timing.
         */
        startTiming: function() {
            // TODO: MAKE THIS RE-ENTRANT SO THAT WE CAN PROFILE CODE THAT IS
            // RECURSIVELY CALLED CORRECTLY.
            if (null != this.lastStart) {
                SailPoint.Profiler.warn('Non-null last start when starting ... look out!');
            }
        
            this.hits++;
            this.lastStart = new Date();
        },

        /**
         * Finish this timing and collect the stats.
         */
        finishTiming: function() {
            if (null == this.lastStart) {
                SailPoint.Profiler.warn('Null last start when finishing ... look out!');
                return;
            }

            var now = new Date();
            var diff = now - this.lastStart;
            this.lastDuration = diff;
            this.total += diff;
            this.lastStart = null;
            return diff;
        },
        
        /**
         * Return whether this Timing has been started but not yet finished.
         */
        started: function() {
            return (null != this.lastStart);
        },
        
        /**
         * Merge the stats from the given Timing into this timing.
         */
        merge: function(other) {
            this.total += other.total;
            this.hits += other.hits;
        },
        
        /**
         * Return a string representation of the statistics for this timing.
         * 
         * @param  codeBlock  The name of the code block.
         */
        getStats: function(codeBlock) {
            return codeBlock + ': ' +
                'Last = ' + this.lastDuration+ ' ms | ' +
                'Total = ' + this.total + ' ms | ' +
                'Average = ' + (this.total / this.hits) + ' ms | ' +
                'Hits = ' + this.hits;
        }
    }
}
