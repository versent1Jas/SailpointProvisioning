/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/*
 * Date config params:
 * renderTo: id of the div into which this Date is being rendered
 * inputEl: Input element that will contain the information that is 
 *          represented by this Date element.  The input is expected
 *          to contain a long value representing the number of milliseconds
 *          that have passed between the time and the Unix epoch
 *          (i.e. the results of a call to java.util.Date.getTime())
 * 
 * Potential (unimplemented) enhancements that may be needed later:
 *   showTime: a boolean option that can be used to show or hide the time of day
 *   showDate: a boolean option that can be use to show or hide the date
 *   timeFormat: an alternate format string for the time
 *   dateFormat: an alternate format string for the date
 */
SailPoint.DateTimeInputConstructor = function(config) {
    // TODO: Update to a more modern use of extjs
    // -- That's what I get for not reading past the early part of the tutorial
    //    to the part that explains that the link I followed was to an earlier version
    // -- Bernie
    var spDateInput = config.inputEl;
    var date = getDateFromInput(spDateInput);
    
    config.layout = 'hbox';
    config.height = 30;
    config.border = false;
    
    config.items = [{
        name: 'DatePanel',
        id: 'spDatePanel',
        xtype: 'panel',
        hideLabel: true,
        border: false,
        layout: 'fit',
        width: 100,
        items: [{
            name: spDateInput.id + 'Date',
            xtype: 'datefield',
            hideLabel: true,
            value: date === '' ? '' : Ext.Date.format(date, SailPoint.DateFormat),
            format: SailPoint.DateFormat,
            listeners: {
                'change' : {
                    fn: function(dateField, newValue, oldValue) {
                        var newValueSecs = newValue === '' ? 0 : Ext.Date.format(newValue, 'U');
                        setDateInput(this, newValueSecs, 'Date');
                    },
                    scope: spDateInput
                }
            }
        }]
    },
    {
        xtype: 'tbspacer'
    },
    {
        name: 'TimePanel',
        xtype: 'panel',
        hideLabel: true,
        border: false,
        items: [{
            name: spDateInput.id + 'Time',
            xtype: 'timefield',
            hideLabel: true,
            width: 100,
            value: date === '' ? '' : Ext.Date.format(date, 'g:i A'),
            listeners: {
                'change' : {
                    fn: function(timeField, newValue, oldValue) {
                        var dp = Ext.getCmp('spDatePanel');
                        if(dp && dp.items && dp.items.items) {
                            if(dp.items.items[0].getValue() === null) {
                                // If date is null, we don't want to call setDateInput.
                                return;
                            }
                        }
                        var newValueSecs = newValue === '' ? 0 : Ext.Date.format(newValue, 'U');
                        setDateInput(this, newValueSecs, 'Time');
                    },
                    scope: spDateInput
                }
            }
        }]
    }];
         
    this.callParent(arguments);
};

Ext.define('SailPoint.DateTimeInput', {
    extend : 'Ext.panel.Panel',
    constructor: SailPoint.DateTimeInputConstructor,
    isValid: function() {
        var dateField = this.items.get(0).items.get(0);
        var timeField = this.items.get(2).items.get(0);
        
        return (dateField.isValid() && timeField.isValid());
    }
});

function getDateFromInput(spDateInput) {
    var dateInMillis = spDateInput.value;
    var dateInSecs;
    var date;
    
    if (dateInMillis === null || dateInMillis === '') {
        date = '';
    } else {
        dateInSecs = Math.round(dateInMillis / 1000);
        date = Ext.Date.parseDate(dateInSecs, 'U');
    }
    
    return date;
}

function getCurrentDate(spDateInput) {
    var spDate;
    if (spDateInput.value !== '') {
        spDate = new Date(Number(spDateInput.value));
    } else {
        spDate = new Date();
        spDate.setHours(0);
        spDate.setMinutes(0);
        spDate.setSeconds(0);
        spDate.setMilliseconds(0);
    }

    return spDate;
}

/**
 * Update the input date with modified values from the date and time fields.
 * Note that the input's value is in milliseconds, but the components return
 * times that are in seconds.
 *
 * If both the time and date are blank, then the input will be made blank too.
 * The side effect of this behavior is that we can never set the time to the 
 * epoch.  Since the epoch is in the past anyways, it is unlikely that this 
 * will be an issue for IdentityIQ (unless the customer wants to retroactively
 * apply their policies 38 years in the past)
 */
function setDateInput(spDateInput, newValueInSecs, mode) {
    // Bug #18814: If the date field is empty, assume we are clearing the date and time.
    // If the time field is empty, assume we are just clearing the time.
    if(newValueInSecs === '' && mode === 'Date') {
        spDateInput.value = '';
        return;
    }

    var currentDate = getCurrentDate(spDateInput);
    var dateChange = new Date(newValueInSecs * 1000);
    
    if (mode === 'Date') {
        currentDate.setMonth(dateChange.getMonth());
        currentDate.setDate(dateChange.getDate());
        currentDate.setFullYear(dateChange.getFullYear());
    } else {
        if(newValueInSecs !== '') {
            currentDate.setHours(dateChange.getHours());
            currentDate.setMinutes(dateChange.getMinutes());
            currentDate.setSeconds(0);
            currentDate.setMilliseconds(0);
        }
        else {
            currentDate.setHours(0);
            currentDate.setMinutes(0);
            currentDate.setSeconds(0);
            currentDate.setMilliseconds(0);
        }
    }
    
    var newDate = Ext.Date.format(currentDate, 'U') * 1000;
    
    if (newDate === 0) {
        spDateInput.value = '';
    }
    else {
        spDateInput.value = newDate;
    }
}
