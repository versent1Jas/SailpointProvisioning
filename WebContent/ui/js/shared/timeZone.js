/* (c) Copyright 2009 SailPoint Technologies, Inc., All Rights Reserved. */

//Define the TimeZone namespace if it doesn't exist.
SailPoint.TimeZone = SailPoint.TimeZone || {
    MILLISECONDS_PER_DAY: 86400000,

        
    /**
     * Populate the timeZone form with information about the timezone.
     * Javascript does not provide full timezone information, so we have to
     * calculate enough information to determine an appropriate timezone on
     * the server.
     */
    getTimeZone: function(formName) {

        // Not only do we need the GMT-offset but we also need to know
            // whether the timezone observes DST.  To do this, we check that 
            // there are one or more changes in offset during the year
        var now = new Date();
        var rawOffsetMins;
        var observesDST;
        var dstStarts = [];
        var dstEnds = [];
        var dstChange = SailPoint.TimeZone.getNextDSTChange(new Date(now.getFullYear(), 0, 1));
        while (dstChange !== null) {
            if (SailPoint.TimeZone.isStart(dstChange)) {
                dstStarts.push(dstChange.getTime());
            } else {
                dstEnds.push(dstChange.getTime());
            }
            dstChange = SailPoint.TimeZone.getNextDSTChange(SailPoint.TimeZone.getNextDay(dstChange));
        }

        observesDST = dstStarts.length > 0 || dstEnds.length > 0;

        // We also need the raw GMT offset (ie - the GMT offset when DST is not being observed).
        if (dstStarts.length === 0) {
            // DST is never observed so any offset will do 
            rawOffsetMins = now.getTimezoneOffset();
        } else {
            // If DST is observed pick an offset from the day after a DST end
            rawOffsetMins = SailPoint.TimeZone.getNextDay(new Date(dstEnds[0])).getTimezoneOffset();
        }

        // The server needs the raw offset in milliseconds and whether the
        // timezone observes DST.
        document.getElementById(formName + ':timeZoneRawOffset').value = -rawOffsetMins * 60 * 1000;
        document.getElementById(formName + ':timeZoneObservesDST').value = observesDST;
        document.getElementById(formName + ':timeZoneDSTStarts').value =
            (dstStarts.length > 0) ? dstStarts.join(',') : '-1';
        document.getElementById(formName + ':timeZoneDSTEnds').value = (dstEnds.length > 0) ? dstEnds.join(',') : '-1';
    },

    /**
     * Return the date on which DST transitions to either begin or end,
     * starting with the given month, or null if the TimeZone does not
     * observe DST.
     * @param  startDate The Date at which to start searching for DST changes
     */
    getNextDSTChange: function(startDate) {
        var startTime = startDate.getTime();
        var yearToCheck = startDate.getFullYear();
        var previousDate = new Date(startTime);
        var previousOffset = previousDate.getTimezoneOffset();
        var currentDate = SailPoint.TimeZone.getNextDay(startDate);
        var currentOffset = currentDate.getTimezoneOffset();
        var currentYear = currentDate.getFullYear();

        // March through until we see the offset change.  There are only 365
        // days per year, so this runs relatively quickly.
        while (currentYear === yearToCheck) {
            currentOffset = currentDate.getTimezoneOffset();
            if (previousOffset !== currentOffset) {
                return previousDate;
            }
            previousDate = currentDate;
            previousOffset = currentOffset;
            currentDate = SailPoint.TimeZone.getNextDay(previousDate);
            currentOffset = currentDate.getTimezoneOffset();
            currentYear = currentDate.getFullYear();
        }

        return null;
    },

    /**
     * Check whether the specified time change represents a DST start or DST end.
     * If it's a start then the offset after the change will be less than the 
     * previous day's offset.  Otherwise it's an end.  Note that this is the 
     * opposite of the way it works in Java because Javascript reverses the signs
     */
    isStart: function(currentDay) {
        var nextOffset;
        var currentOffset;
        var nextDay = SailPoint.TimeZone.getNextDay(currentDay);
        nextOffset = nextDay.getTimezoneOffset();
        currentOffset = currentDay.getTimezoneOffset();
        return (currentOffset > nextOffset);
    },

    getNextDay: function(date) {
        return new Date(date.getTime() + SailPoint.TimeZone.MILLISECONDS_PER_DAY);
    }
};
