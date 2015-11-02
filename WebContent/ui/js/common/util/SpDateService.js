/**
 * Utility service for interacting with date objects and strings
 * Relies on moment.js which is required.
 */
/* global moment: false */
angular.module('sailpoint.util').
    factory('spDateService', function() {
        return {
            /**
             * Parse a date string into a Date object using the given format
             * @param {String} dateString String representation of date
             * @param {String} format Format to apply when parsing dateString
             * @returns {Date} Date object if string matches format, or null if invalid
             */
            parseDate: function(dateString, format) {
                var testMoment, date;
                
                if (!dateString) {
                    throw 'dateString is required';
                }
                if (!format) {
                    throw 'format is required';
                }
                
                testMoment = moment(dateString, angular.uppercase(format), true);
                if (testMoment) {
                    date = testMoment.isValid() ? testMoment.toDate() : null;
                }
                
                return date;
            },

            /**
             * Return a copy of the given date with the hours, minutes, seconds,
             * and milliseconds set to the given values (according to the local
             * time of the browser).
             *
             * @param {Date} date  The date to copy and set.
             * @param {Number} hours  The hours to set.
             * @param {Number} minutes  The minutes to set.
             * @param {Number} seconds  The seconds to set.
             * @param {Number} millis  The milliseconds to set.
             *
             * @return {Date} A copy of the given date with the hours, minutes,
             * seconds, and milliseconds set to the given values (according to
             * the local time of the browser).
             */
            setDateComponents: function(date, hours, minutes, seconds, millis) {
                var newDate = date;
                if (date) {
                    newDate = new Date(date.getTime());
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                    newDate.setSeconds(seconds);
                    newDate.setMilliseconds(millis);
                }
                return newDate;
            }
        };
    });
