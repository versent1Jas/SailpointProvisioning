Ext.apply(Ext.form.VTypes, {

  /** Takes a start date and end date.  Prevents the start date from having a value that is after
   * the end date and prevents the end date from having a date that's before the start date
   * see identity.js addNewRole() for example usage.  PH 07.22.2009
   */
  daterange: function(val, field) {
    var date = field.parseDate(val);

    if (!date) {
      return false;
    }
    if (field.startDateField && (!this.dateRangeMax || (date.getTime() != this.dateRangeMax.getTime()))) {
      var start = Ext.getCmp(field.startDateField);
      start.setMaxValue(date);
      //start.validate();
      this.dateRangeMax = date;
    }
    else if (field.endDateField && (!this.dateRangeMin || (date.getTime() != this.dateRangeMin.getTime()))) {
      var end = Ext.getCmp(field.endDateField);
      end.setMinValue(date);
      //end.validate();
      this.dateRangeMin = date;
    }
    /*
     * Always return true since we're only using this vtype to set the
     * min/max allowed values (these are tested for after the vtype test)
     */
    return true;
  },

  integer : function (value){
    var objRegExp  = /(^-?\d\d*$)/;
    return objRegExp.test(value);  
  }
});
