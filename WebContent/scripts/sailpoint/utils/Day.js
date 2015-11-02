/**
* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved.
*
* THIS FILE IS AUTO-GENERATED FROM JAVA FILE: $iiqFolder/tools/j2js/java-code/src/sailpoint/util/Day.java
* PLEASE DON'T MODIFY THIS FILE HERE.
*/

Ext.namespace ("sailpoint.util");


Ext.define('sailpoint.util.TestDateCalculator', {

    daysToAdvance : 0
    , today : function () {
        return  Ext.create('sailpoint.util.Day',  new Date ().getTime ()).newDayByAddingDays (this.daysToAdvance);
    }
    , advance : function (days) {
        this.daysToAdvance += days;
    }
    , reset : function () {
        this.daysToAdvance = 0;
    }
});


Ext.define('sailpoint.util.DefaultDateCalculator', {

    today : function () {
        return  Ext.create('sailpoint.util.Day',  new Date ().getTime ());
    }
    , advance : function (days) {
    }
    , reset : function () {
    }
});


Ext.define('sailpoint.util.Day', {
    constructor : function (millis) {
        var theDate =  new Date (millis);
        this.date =  new Date (theDate.getFullYear (), theDate.getMonth (), theDate.getDate ());
    }

    , statics : {
        millisInDay : 1000 * 60 * 60 * 24
        , dateCalculator :  Ext.create('sailpoint.util.DefaultDateCalculator')
        , today : function () {
            return sailpoint.util.Day.dateCalculator.today ();
        }

        , calculateDaysInBetween : function (firstDay, secondDay) {
            return ((secondDay.getTime () - firstDay.getTime ()) / sailpoint.util.Day.millisInDay);
        }

        , setTestDateCalculator : function () {
            sailpoint.util.Day.dateCalculator =  Ext.create('sailpoint.util.TestDateCalculator');
        }

        , advance : function (days) {
            sailpoint.util.Day.dateCalculator.advance (days);
        }

        , reset : function () {
            sailpoint.util.Day.dateCalculator.reset ();
        }

    }
    , date : null
    , newDayByAddingDays : function (days) {
        return  Ext.create('sailpoint.util.Day', this.date.getTime () + days * sailpoint.util.Day.millisInDay);
    }
    , newDayBySubtractingDays : function (days) {
        return  Ext.create('sailpoint.util.Day', this.date.getTime () - days * sailpoint.util.Day.millisInDay);
    }
    , isAfter : function (day) {
        return day.date.getTime () < this.date.getTime ();
    }
    , isBefore : function (day) {
        return day.date.getTime () > this.date.getTime ();
    }
    , isEqualTo : function (day) {
        return day.date.getTime () == this.date.getTime ();
    }
    , isInBetweenIncluding : function (start, end) {
        if ((this.isAfter (start) || this.isEqualTo (start)) && (this.isBefore (end) || this.isEqualTo (end))) {
            return true;
        }
        return false;
    }
    , getTime : function () {
        return this.date.getTime ();
    }
    , getDisplay : function () {
        return this.getDisplayMonth () + " " + this.date.getDate ();
    }
    , getDisplayMonth : function () {
        switch (this.date.getMonth ()) {
        case 0:
            return "Jan";
        case 1:
            return "Feb";
        case 2:
            return "Mar";
        case 3:
            return "Apr";
        case 4:
            return "May";
        case 5:
            return "Jun";
        case 6:
            return "Jul";
        case 7:
            return "Aug";
        case 8:
            return "Sep";
        case 9:
            return "Oct";
        case 10:
            return "Nov";
        case 11:
            return "Dec";
        default:
            return "";
        }
    }
    , setDefaultDateCalculator : function () {
        sailpoint.util.Day.dateCalculator =  Ext.create('sailpoint.util.DefaultDateCalculator');
    }
});
