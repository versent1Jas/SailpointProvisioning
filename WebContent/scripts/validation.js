/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

var Validator = {
    // Queue of validation errors
    errorMessages: [],
    
    validateStartEndDates: function(startId, endId, errorMessage) {
      var start = getInputDateValue(startId);
      var end = getInputDateValue(endId);
      
      isValid = !(start>end);
      if(!isValid) {
        Validator.addError(errorMessage);
      }
    },
    
    // This function verifies that the specified string element is not blank or null.
    // If the validation fails, the specified errorMessage is added to the error message queue.
    validateNonBlankString: function(element, errorMessage) {
        var isValid;
        if (element == "" || element == null) {
            Validator.addError(errorMessage);
            isValid = false;
        } else {
            isValid = true;
        }
    
        return isValid;
    },
    
    //This function verifies that the specified string element is not longer than the length specified
    validateLength: function(element, maxLength, errorMessage) {
    	var isValid;
    	isValid = true;
    	
    	if(element != null && element.length > maxLength) {
    		Validator.addError(errorMessage);
    		isValid = false;
    	}
    	return isValid;
    },
    
    // This function verifies that the specified string element consists entirely of alphanumeric characters.
    // If the validation fails, the specified errorMessage is added to the error message queue.
    validateAlphanumeric: function(element, errorMessage) {
        var isValid;
              
        if (Validator._isAlphanumeric(element)) {
            isValid = true;
        } else {
            Validator.addError(errorMessage);
            isValid = false;
        }
    
        return isValid;
    }, 
    
    // This function verifies that the specified string element consists entirely of alphanumeric characters
    // or characters contained in the character array of exceptions
    // If the validation fails, the specified errorMessage is added to the error message queue.
    validateAlphanumericOrSpaceWithExceptions : function (stringValue, exceptions, errorMessage) {
        var isValValid = true;
            
        for(var i = 0; i < stringValue.length && isValValid; i++) {
            var charCode = stringValue.charCodeAt(i);
    
            isValValid =
                Validator._isNumeric(charCode) ||
                Validator._isUppercase(charCode) ||
                Validator._isLowercase(charCode) ||
                Validator._isSpace(charCode);
            
            if (!isValValid) {
                var isException = false;
                
                for (var j = 0; j < exceptions.length; ++j) {
                   isException |= (charCode == exceptions[j].charCodeAt(0));
                }
            
                isValValid = isException;
            }
        }
     
        if (!isValValid) {
            Validator.addError(errorMessage);
        }
        
        return isValValid;
    },

    validateAlphanumericOrSpace: function(element, errorMessage) {
        var isValid;
              
        if (Validator._isAlphanumericOrSpace(element)) {
            isValid = true;
        } else {
            Validator.addError(errorMessage);
            isValid = false;
        }
    
        return isValid;
    }, 
    
    validateAlphanumericNoSpacesOnEdges: function(element, errorMessage) {
        var isValid;
              
        if (Validator._isFreeOfSpacesOnTheEdges(element)) {
            isValid = true;
        } else {
            Validator.addError(errorMessage);
            isValid = false;
        }
    
        return isValid;
    },
    
    //This function verifies that the specified tomahawk inputDate element consists of a date
    //that is not in the past.
    validateInputDate: function(element, errorMessage, validatePast) {
		
		var isValid = true;
		
    	var second;
    	var minute;
    	var hour;
    	var day;
    	var month;
    	var year;
    	var ampm;    	
    	var Today = new Date();
    	var parentElement = $(element);
		var childInputs = Ext.DomQuery.select('input[id*='+element+']');
		var childSelects = Ext.DomQuery.select('select[id*='+element+']');
		
		
		var invalidDateMessage = '#{msgs.err_date_invalid}';
		for(i = 0; i < childInputs.length; i++)
		{
			if(childInputs[i].id.indexOf("day") > 0)
			{
				day = childInputs[i].value.replace(/^[0]+/,'');
				//Verify that char is numeric
				for(z=0; z<day.length; z++)
				{
					if(!Validator._isNumeric(day.charCodeAt(z)))
					{
						Validator.addError(invalidDateMessage);
						return false;
					}
				}
				if(childInputs[i].disabled == true)
					return true;
				continue;
			}
			if(childInputs[i].id.indexOf("year") > 0)
			{
				if(childInputs[i].value=='')
				{
					Validator.addError(invalidDateMessage);
					return false;
				}
        year = childInputs[i].value;
				if(year.length<4)
        {
          Validator.addError(invalidDateMessage);
          return false;
        }				
				for(z=0; z<year.length; z++)
				{
					if(!Validator._isNumeric(year.charCodeAt(z)))
					{
						Validator.addError(invalidDateMessage);
						return false;
					}
				}
				continue;
			}
			if(childInputs[i].id.indexOf("hours") > 0)
			{
				if(childInputs[i].value=='')
				{
					Validator.addError(invalidDateMessage);
					return false;
				}
				hour = childInputs[i].value.replace(/^[0]+/,'');
				for(z=0; z<hour.length; z++)
				{
					if(!Validator._isNumeric(hour.charCodeAt(z)))
					{
						Validator.addError(invalidDateMessage);
						return false;
					}
				}
				continue;
			}
			if(childInputs[i].id.indexOf("minutes") > 0)
			{
				if(childInputs[i].value=='')
				{
					Validator.addError(invalidDateMessage);
					return false;
				}
				minute = childInputs[i].value.replace(/^[0]+/,'');
				for(z=0; z<minute.length; z++)
				{
					if(!Validator._isNumeric(minute.charCodeAt(z)))
					{
						Validator.addError(invalidDateMessage);
						return false;
					}
				}
				continue;
			}
		}
		for(j = 0; j < childSelects.length; j++)
		{
			if(childSelects[j].id.indexOf("month") > 0)
			{
				month = childSelects[j].value.replace(/^[0]+/,'');
				for(z=0; z<month.length; z++)
				{
					if(!Validator._isNumeric(month.charCodeAt(z)))
					{	
						Validator.addError(invalidDateMessage);
						return false;
					}
				}
				continue;
			}
			if(childSelects[j].id.indexOf("ampm") > 0)
			{
				if(childSelects[j].value<0)
				{
					Validator.addError(invalidDateMessage);
					return false;
				}
				ampm = childSelects[j].value;
				continue;
			}
		}
		//Add 1 to the getMonth function...it returns months between 0 and 11.	
    	var currentMonth = Today.getMonth() + 1;
		
    	//Start the validation with the easiest stuff first
    	
    	//Validate that the fields aren't way outside normal values for day/month/hour/etc...
    	if((month > 12) || (month < 1) || (day < 1) || (day > 31) || (hour > 12) || (hour < 1) || (minute > 59) || (minute < 0))
    	{ 	
    		Validator.addError(invalidDateMessage);
    		return false;
    	}
    	
    	var daysInMonth = Validator.daysArray(12);
    	//Now do some validation on february/leap year stuff and days in this month
    	if((month==2 && day>Validator.daysInFebruary(year)) || (day > daysInMonth[month]))
    	{
    		Validator.addError(invalidDateMessage);
    		return false;
    	}
    	
    	//Add 12 to hour if it's pm
    	if(ampm > 0)
			hour = parseInt(hour) + 12;    	
    	//Now validate that the date isn't in the past.
        if(validatePast) {
    		if(year > Today.getFullYear()){ isValid = true;}
    		else if(year < Today.getFullYear()){ isValid = false;}
    		else if(month > currentMonth){ isValid = true;}
    		else if(month < currentMonth){ isValid = false;}
    		else if(day > Today.getDate()){ isValid=true;}
    		else if(day < Today.getDate()){ isValid=false;}
    		else if(hour > Today.getHours()){ isValid=true;}
    		else if(hour < Today.getHours()){ isValid=false;}
    		else if(minute > Today.getMinutes()){ isValid=true;}
    		else if(minute < Today.getMinutes()){ isValid=false;}
    		else{ isValid = true;}
        }
		if(!isValid)
		{
			Validator.addError(errorMessage);
		}
		return isValid;		
    },
    
    daysInFebruary: function(year)
    {
    	return (((year % 4 == 0) && ( (!(year % 100 == 0)) || (year % 400 == 0))) ? 29 : 28 );
	},
	
	daysArray: function(n) 
	{
		for (var i = 1; i <= n; i++) {
			this[i] = 31
			if (i==4 || i==6 || i==9 || i==11) {this[i] = 30}
			if (i==2) {this[i] = 29}
   		} 
   		return this
	},	
    
    // This function adds an error message to the queue
    addError: function(message) {
        Validator.errorMessages.push(message);
    },

    // Add all the error messages in the queue to the specified div and shows the div
    displayErrors: function(errorDiv) {
        if (Validator.errorMessages[0] != null) {
            var i,
                errorTable = '<table><tr><td>#{msgs.err_header}</td></tr>';

            if (Validator.errorMessages.length > 1) {
                errorTable = '<table><tr><td>#{msgs.err_header_plural}</td></tr>';
            }

            for (i = 0; i < Validator.errorMessages.length; ++i) {
                errorTable += '<tr align="left"><td>' + Validator.errorMessages[i] + '</td></tr>';
            }

            errorTable += '</table>';

            errorDiv.innerHTML = errorTable;
            errorDiv.style.visibility = 'visible';

            if (!errorDiv.visible()) {
                errorDiv.show();
            }

            errorDiv.scrollIntoView();

            Validator.errorMessages.length = 0;
        }
    },

    // Hide the error div.
    hideErrors: function(errorDiv) {
        $(errorDiv).hide();
    },

    _isAlphanumericOrSpace: function(stringValue) {
        var isValAlphanumeric = true;

        for(var j = 0; j < stringValue.length && isValAlphanumeric; j++) {
            var charCode = stringValue.charCodeAt(j);

            isValAlphanumeric =
                Validator._isNumeric(charCode) ||
                Validator._isUppercase(charCode) ||
                Validator._isLowercase(charCode) ||
                Validator._isSpace(charCode);
        }
 
        return isValAlphanumeric;
    },
    
    // This function returns true if the given string is composed entirely
    // of alphanumeric characters and false otherwise
    _isAlphanumeric: function(stringValue) {
        var isValAlphanumeric = true;

        for(var j = 0; j < stringValue.length && isValAlphanumeric; j++) {
            var charCode = stringValue.charCodeAt(j);
	
            isValAlphanumeric = 
                Validator._isNumeric(charCode) || 
                Validator._isUppercase(charCode) || 
                Validator._isLowercase(charCode);
        }
 
        return isValAlphanumeric;
    },

	// Returns true if every character in the given string is either alphanumeric
	// or a space.  As the function name implies, spaces are not allowed at the beginning
	// or at the end of the string
	_isFreeOfSpacesOnTheEdges: function(stringValue) {
	    var isValid;
	    
	    // Check for spaces at the beginning
	    isValid = !Validator._isSpace(stringValue.charCodeAt(0));
	    
	    // Check for spaces at the end
	    if (isValid) {
	        isValid = !Validator._isSpace(stringValue.charCodeAt(stringValue.length - 1));
	    }
	    
        // The criteria for the rest is similar to the one of _isAlphanumeric, with the exception
	    // that we permit spaces
        for(var j = 0; j < stringValue.length && isValid; j++) {
            var charCode = stringValue.charCodeAt(j);
	
            isValid = 
                Validator._isNumeric(charCode) || 
                Validator._isUppercase(charCode) || 
                Validator._isLowercase(charCode) ||
                Validator._isSpace(charCode);
        }
        
        return isValid;
    },

    // This method iterates over element and makes sure that at least
    // one non-space character exists

    validateNotAllSpaces: function(element, errorMessage) {

        var isValid;
        var isSpace = true;
        for(var k = 0; k < element.length && isSpace; k++) {
            var charCode = element.charCodeAt(k);
            isSpace = Validator._isSpace(charCode);
        }

        if ( !isSpace ) {
            isValid = true;
        } else {
            Validator.addError(errorMessage);
            isValid = false;
        }
        return isValid;
    },
	
	// Returns true if the given character is a decimal digit
	_isNumeric: function(charCode) {
	    return (charCode > 47 && charCode < 58);
	},
	
	// Returns true if the given character is an uppercase letter in the 
	// Basic Latin alphabet
	_isUppercase: function(charCode) {
	    return (charCode > 64 && charCode < 91);
	},
	
	// Returns true if the given character is a lowercase letter in the 
	// Basic Latin alphabet
	_isLowercase: function(charCode) {
	    return (charCode > 96 && charCode < 123);
	},
	
	// Returns true if the given character is a space
	_isSpace: function(charCode) {
	    return charCode == 32;
	},

    validateAtLeastOneChecked: function(checkBoxCollection, errorMessage){

        for(i=0;i<checkBoxCollection.length;i++){
            if (checkBoxCollection[i].checked)
                return true;
        }

        Validator.addError(errorMessage);
        return false;
    },
    
    validateGreaterThanOrEqual: function(inputFieldId, minValue, errorMessage) {
        var val = new Number($(inputFieldId).value);
        var minVal = new Number(minValue);
        var isValid;
        
        if (val === Number.NaN || minVal === Number.NaN) {
            isValid = false;
        } else {
            isValid = val >= minVal;
        }
        
        if (!isValid) {
            Validator.addError(errorMessage);
        }
        
        return isValid;
    },
	
	getErrors: function() {
        return Validator.errorMessages;
    },
    
    clearErrors: function() {
        Validator.errorMessages = [];
    }
}

