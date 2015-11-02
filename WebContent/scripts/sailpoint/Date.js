/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
* Date formatting utility functions and extjs renderers.
*/
SailPoint.Date = function(){

    /**
    * Creates a javascript date for the given datetime.
    * @param millis Date time expressed in milliseconds.
    * @return javascript date object, or null if datetime was empty
    * @private
    */
    function getDate(millis){
        if (!millis || millis=="")
            return null;

        return Ext.Date.parseDate(Math.round(millis/1000), 'U');
    };

    /**
    * Takes a datetime in milliseconds and formats it
    * in the given date pattern.
    * @param millis Date time expressed in milliseconds.
    * @param pattern Date format pattern
    * @return Formatted date string.
    * @private
    */
    function getDateString(millis, pattern){
        if (!millis || millis=="")
            return "";

        return Ext.util.Format.date(getDate(millis), pattern);
    };

    return{

        /**
        * Creates a javascript date for the given datetime.
        * @param millis Date time expressed in milliseconds.
        * @return javascript date object, or null if datetime was empty
        */
        getDateFromMillis : function(){
            return function(millis){
                return getDate(millis);
            }
        }(),

        /**
        * Takes a datetime in milliseconds and formats it
        * in the given date pattern.
        * @param millis Date time expressed in milliseconds.
        * @param pattern Date format pattern
        * @return Formatted date string.
        */
        getDateStringFromMillis : function (millis, pattern){
            return function (millis, pattern){
                return getDateString(millis, pattern);
            }
        }(),

        /**
        * Renderer which takes a datetime in milliseconds and formats it
        * in the default IdentityIQ date pattern.
        * @param millis Datetime expressed in milliseconds.
        * @return Formatted date string.
        */
        DateRenderer : function(){
            return function(millis){
                return getDateString(millis, SailPoint.DateFormat);
            }
        }(),

        /**
        * Renderer which takes a datetime in milliseconds and formats it
        * in the default IdentityIQ time pattern.
        * @param millis Datetime expressed in milliseconds.
        * @return Formatted time string.
        */
        TimeRenderer : function(){
            return function(millis){
                return getDateString(millis, SailPoint.TimeFormat);
            }
        }(),

        /**
        * Renderer which taks a datetime in milliseconds and formats it
        * in the default IdentityIQ datetime pattern.
        * @param millis Datetime expressed in milliseconds.
        * @return Formatted datetime string.
        */
        DateTimeRenderer : function(){
            return function(millis){
                return getDateString(millis, SailPoint.DateTimeFormat);
            }
        }()
    }
}();

