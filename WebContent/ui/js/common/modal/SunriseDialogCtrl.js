/**
 * Controller for the approval sunrise/sunset dialog.
 */
angular.module('sailpoint.modal').
    controller('SunriseDialogCtrl', ['sunriseDate', 'sunsetDate', '$modalInstance',

function(sunriseDate, sunsetDate, $modalInstance) {

    var me = this;

    this.sunriseDate = sunriseDate;
    this.sunsetDate = sunsetDate;

    /**
     * Resolves and closes the modalInstance with the selected dates from the dialog.
     * These dates should be processed accordingly by the calling controller.
     */
    this.complete = function() {
        $modalInstance.close({
            sunrise: me.sunriseDate,
            sunset: me.sunsetDate
        });
    };

    /**
     * Dismisses the modalInstance when the cancel button is clicked.
     */
    this.cancel = function() {
        $modalInstance.dismiss();
    };

    /**
     * The minimum sunrise date is today
     * @returns {Date} Today zeroed to midnight
     */
    this.calcSunriseMin = function() {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    };

    /**
     * The minimum sunset date is the latest of today and the sunrise date
     * @returns {Date} The earliest value the sunset date can be
     */
    this.calcSunsetMin = function() {
        var today = me.sunriseMin,
            minDate = today;
        if (me.sunriseDate) {
            minDate = new Date(Math.max(today.getTime(), me.sunriseDate.getTime()));
        }
        if(minDate.getTime() !== me.sunsetMin.getTime()) {
            me.sunsetMin = minDate;
        }
        // Always return the same object to avoid infinite loops in the digest (unless it has changed of course).
        // see https://docs.angularjs.org/error/$rootScope/infdig
        return me.sunsetMin;
    };

    /* Initialize sunrise/sunset minimum values */
    this.sunriseMin = me.calcSunriseMin();
    this.sunsetMin = me.calcSunriseMin();

}]);
