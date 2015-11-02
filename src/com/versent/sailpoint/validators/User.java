package com.versent.sailpoint.validators;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import com.versent.sailpoint.constants.Constants;
import com.versent.sailpoint.constants.Messages;
import com.versent.sailpoint.constants.SCIM;



public class User {

	public LinkedHashMap<String, Object> validateRequest(
			Map<String, Object> reqObj) {
		LinkedHashMap<String, Object> insufficientInformation = new LinkedHashMap<String, Object>();
		insufficientInformation.put(Messages.CODE, 400);
		insufficientInformation.put(Messages.ERROR_DESCRIPTION,
				Messages.INSUFFICIENT_INFORMATION);
		// Check for all Mandatory attributes
		// Check if hashmap is not null
		LinkedHashMap<String, Object> invalidInformation = new LinkedHashMap<String, Object>();
		String reqValidationParam = "";
		invalidInformation.put(Messages.CODE, 400);
		invalidInformation.put(Messages.ERROR_DESCRIPTION, reqValidationParam
				+ Messages.INVALID_FORMAT);

		if (!(reqObj.isEmpty())) {
			if(((reqObj.get(SCIM.EXTERNAL_ID) == null)))
			{
				reqValidationParam=SCIM.EXTERNAL_ID;
				return insufficientInformation;
			}
			if (!((reqObj.get(SCIM.NAME) == null))) {
				HashMap<String, Object> validateAttributes = (HashMap<String, Object>) reqObj
						.get(SCIM.NAME);
				if (((validateAttributes.get(SCIM.FIRST_NAME).toString())
						.length() == 0)
						|| ((validateAttributes.get(SCIM.LAST_NAME)
								.toString()).length() == 0)) {
					return insufficientInformation;
				}
				return (insufficientInformation = new LinkedHashMap<String, Object>());
			}
			if (!((reqObj.get(SCIM.EMAILS) == null))) {
				HashMap<String, Object> validateAttributes = (HashMap<String, Object>) reqObj
						.get(SCIM.EMAILS);
				if (!((validateAttributes.get(SCIM.VALUE).toString())
						.length() == 0)) {
					 String EMAIL_REGEX = "^[\\w-_\\.+]*[\\w-_\\.]\\"+
						      "@([\\w]+\\.)+[\\w]+[\\w]$";
					 Boolean isEmailFormatValid = validateAttributes.get(SCIM.VALUE).toString().matches(EMAIL_REGEX);
					 if(!(isEmailFormatValid))
					 {
						 reqValidationParam = "email";
						 return invalidInformation;
					 }
				}
				return (insufficientInformation = new LinkedHashMap<String, Object>());
			}
			return insufficientInformation;

		}

		else {
			return insufficientInformation;
		}
	}

}
